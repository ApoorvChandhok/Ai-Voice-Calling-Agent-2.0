import os
import certifi
os.environ['SSL_CERT_FILE'] = certifi.where()

import logging
import json
import asyncio
from dotenv import load_dotenv

from livekit import agents, api
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import openai, cartesia, deepgram, noise_cancellation, silero, sarvam
from livekit.agents import llm
from typing import Optional

load_dotenv(".env")

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S"
)
logging.getLogger("aiohttp").setLevel(logging.WARNING)
logging.getLogger("livekit").setLevel(logging.INFO)
logger = logging.getLogger("inbound-agent")

# Import the INBOUND config directly — no routing needed
import config_inbound as config

logger.info("[INBOUND] Agent loaded → Škoda Octavia Advisor")


# =============================================================================
# HELPERS
# =============================================================================

def _build_tts(provider_override: str = None, voice_override: str = None):
    provider = (provider_override or os.getenv("TTS_PROVIDER", config.DEFAULT_TTS_PROVIDER)).lower()

    if voice_override in ["anushka", "aravind", "amartya", "dhruv", "ishita"]:
        provider = "sarvam"

    if provider == "cartesia":
        return cartesia.TTS(
            model=os.getenv("CARTESIA_TTS_MODEL", config.CARTESIA_MODEL),
            voice=os.getenv("CARTESIA_TTS_VOICE", config.CARTESIA_VOICE),
        )
    if provider == "sarvam":
        model    = os.getenv("SARVAM_TTS_MODEL", config.SARVAM_MODEL)
        voice    = voice_override or os.getenv("SARVAM_VOICE", config.DEFAULT_TTS_VOICE)
        language = os.getenv("SARVAM_LANGUAGE", config.SARVAM_LANGUAGE)
        logger.info(f"[TTS] Sarvam — model={model}, speaker={voice}, lang={language}")
        return sarvam.TTS(model=model, speaker=voice, target_language_code=language)
    if provider == "deepgram":
        return deepgram.TTS(model=os.getenv("DEEPGRAM_TTS_MODEL", "aura-asteria-en"))
    if os.getenv("OPENAI_API_KEY"):
        return openai.TTS(
            model=os.getenv("OPENAI_TTS_MODEL", "tts-1"),
            voice=voice_override or os.getenv("OPENAI_TTS_VOICE", config.DEFAULT_TTS_VOICE),
        )
    return deepgram.TTS(model=os.getenv("DEEPGRAM_TTS_MODEL", "aura-asteria-en"))


def _build_llm(provider_override: str = None):
    provider = (provider_override or os.getenv("LLM_PROVIDER", config.DEFAULT_LLM_PROVIDER)).lower()
    if provider == "groq":
        logger.info("[LLM] Groq")
        return openai.LLM(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY"),
            model=os.getenv("GROQ_MODEL", config.GROQ_MODEL),
            temperature=float(os.getenv("GROQ_TEMPERATURE", str(config.GROQ_TEMPERATURE))),
        )
    logger.info("[LLM] OpenAI")
    return openai.LLM(model=config.DEFAULT_LLM_MODEL)


# =============================================================================
# TOOLS
# =============================================================================

class InboundTools(llm.ToolContext):
    def __init__(self, ctx: agents.JobContext):
        super().__init__(tools=[])
        self.ctx       = ctx
        self.lead_info = {}

    @llm.function_tool(
        description=(
            "Save the caller's contact information after you have collected their "
            "name, phone number, and city. Call this once ALL THREE are confirmed."
        )
    )
    def save_lead_info(self, name: str, phone: str, city: str):
        """
        Store caller lead details and confirm collection.

        Args:
            name:  Caller's full name
            phone: Caller's phone number
            city:  Caller's city or location
        """
        self.lead_info = {"name": name, "phone": phone, "city": city}
        logger.info(f"[LEAD] ✅ Captured → name={name!r}, phone={phone!r}, city={city!r}")

        # Write to CSV
        import analytics
        analytics.save_lead_csv(name, phone, city)

        return (
            f"Thank you, {name}! I've noted your details from {city}. "
            f"Now, let me tell you all about the stunning new Škoda Octavia — "
            f"what would you like to know first?"
        )

    @llm.function_tool(description="Transfer the caller to a live human sales representative.")
    async def transfer_to_sales(self, destination: Optional[str] = None):
        """Transfer inbound caller to a live sales rep. Args: destination: optional override number."""
        target = destination or config.DEFAULT_TRANSFER_NUMBER
        if not target:
            return "Our sales team is unavailable right now. I'll arrange a callback for you shortly."

        if "@" not in target:
            if config.SIP_DOMAIN:
                clean = target.replace("tel:", "").replace("sip:", "")
                target = f"sip:{clean}@{config.SIP_DOMAIN}"
            elif not target.startswith("tel:"):
                target = f"tel:{target}"
        elif not target.startswith("sip:"):
            target = f"sip:{target}"

        participant_identity = None
        for p in self.ctx.room.remote_participants.values():
            participant_identity = p.identity
            break

        if not participant_identity:
            return "Failed to transfer: could not identify the caller."

        try:
            await self.ctx.api.sip.transfer_sip_participant(
                api.TransferSIPParticipantRequest(
                    room_name=self.ctx.room.name,
                    participant_identity=participant_identity,
                    transfer_to=target,
                    play_dialtone=False,
                )
            )
            logger.info(f"[TOOL] Transferred inbound caller to {target}")
            return "Connecting you to a sales representative now — please hold!"
        except Exception as e:
            logger.error(f"[TOOL] Transfer failed: {e}")
            return f"I'm sorry, I couldn't complete the transfer. {e}"


# =============================================================================
# AGENT
# =============================================================================

class InboundAssistant(Agent):
    """Škoda Octavia advisor — leads with info capture, then answers car questions."""
    def __init__(self, tools: list):
        super().__init__(instructions=config.SYSTEM_PROMPT, tools=tools)
        logger.info("[INBOUND] InboundAssistant initialised.")


# =============================================================================
# ENTRYPOINT
# =============================================================================

async def entrypoint(ctx: agents.JobContext):
    logger.info("=" * 60)
    logger.info("[INBOUND] *** NEW INBOUND CALL ***")
    logger.info(f"[INBOUND] Room: {ctx.room.name} | Job: {ctx.job.id}")
    logger.info("=" * 60)

    await ctx.connect()
    logger.info(f"[INBOUND] Connected. Remote participants: {len(ctx.room.remote_participants)}")

    # Log metadata (informational only — inbound doesn't need phone from metadata)
    try:
        if ctx.job.metadata:
            logger.info(f"[INBOUND] Job metadata: {ctx.job.metadata!r}")
    except Exception:
        pass

    # --- Build plugins ---
    fnc_ctx   = InboundTools(ctx)
    built_tts = _build_tts()
    built_llm = _build_llm()

    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(model=config.STT_MODEL, language=config.STT_LANGUAGE),
        llm=built_llm,
        tts=built_tts,
    )

    agent_instance = InboundAssistant(
        tools=list(fnc_ctx.function_tools.values()),
    )

    @ctx.room.on("disconnected")
    def on_disconnected(*args, **kwargs):
        logger.info("[INBOUND] Call disconnected. Running analytics...")
        import analytics
        msgs = agent_instance.chat_ctx.messages() if callable(getattr(agent_instance.chat_ctx, "messages", None)) else getattr(agent_instance.chat_ctx, "messages", [])
        asyncio.create_task(
            analytics.analyze_and_save_call(
                phone_number="inbound_caller",
                direction="inbound",
                chat_messages=msgs
            )
        )

    await session.start(
        room=ctx.room,
        agent=agent_instance,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVCTelephony(),
            close_on_disconnect=True,
        ),
    )
    logger.info("[INBOUND] Session started.")

    # Give audio a moment to stabilise, then greet the caller
    try:
        await asyncio.sleep(1)
        await session.generate_reply(instructions=config.INITIAL_GREETING)
        logger.info("[INBOUND] Welcome greeting dispatched.")
    except Exception as e:
        logger.error(f"[INBOUND] Greeting failed: {e}")
        import traceback; logger.error(traceback.format_exc())


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="inbound-caller",   # Must match LiveKit inbound dispatch rule
        )
    )
