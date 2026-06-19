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
try:
    from livekit.plugins import google as google_plugin
    _HAS_GOOGLE = True
except ImportError:
    _HAS_GOOGLE = False
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

# Import the dynamic workspace config loader
from workspace_config_loader import load_workspace_config, WorkspaceAgentConfig

logger.info("[INBOUND] Agent initialized")

# Pre-load VAD model at startup (avoids cold-load delay on first call)
_VAD = silero.VAD.load()


# =============================================================================
# HELPERS
# =============================================================================

def _build_tts(ws_config: WorkspaceAgentConfig, provider_override: str = None, voice_override: str = None, language_override: str = None):
    provider = (provider_override or os.getenv("TTS_PROVIDER", ws_config.tts_provider)).lower()

    # Route to Sarvam if the voice override is a known Sarvam speaker (bulbul:v3 compatible list)
    _SARVAM_VOICES = {
        "shubh", "ritu", "rahul", "pooja", "simran", "kavya", "amit",
        "ratan", "rohan", "dev", "ishita", "shreya", "manan", "sumit",
        "priya", "aditya", "kabir", "neha", "varun", "roopa", "aayan",
        "ashutosh", "advait", "amelia", "sophia",
    }
    if voice_override in _SARVAM_VOICES:
        provider = "sarvam"

    if provider == "cartesia":
        return cartesia.TTS(
            model=os.getenv("CARTESIA_TTS_MODEL", "sonic-english"),
            voice=os.getenv("CARTESIA_TTS_VOICE", "248be419-c632-4f23-adf1-5324ed7dbf1d"),
        )
    if provider == "sarvam":
        model    = os.getenv("SARVAM_TTS_MODEL", "bulbul:v1")
        voice    = voice_override or os.getenv("SARVAM_VOICE", ws_config.tts_voice)
        language = language_override or os.getenv("SARVAM_LANGUAGE", ws_config.tts_language)
        logger.info(f"[TTS] Sarvam — model={model}, speaker={voice}, lang={language}")
        return sarvam.TTS(model=model, speaker=voice, target_language_code=language)
    if provider == "deepgram":
        return deepgram.TTS(model=os.getenv("DEEPGRAM_TTS_MODEL", "aura-asteria-en"))
    if os.getenv("OPENAI_API_KEY"):
        return openai.TTS(
            model=os.getenv("OPENAI_TTS_MODEL", "tts-1"),
            voice=voice_override or os.getenv("OPENAI_TTS_VOICE", ws_config.tts_voice),
        )
    return deepgram.TTS(model=os.getenv("DEEPGRAM_TTS_MODEL", "aura-asteria-en"))


def _build_llm(ws_config: WorkspaceAgentConfig, provider_override: str = None):
    provider = (provider_override or os.getenv("LLM_PROVIDER", ws_config.llm_provider)).lower()

    if provider == "groq":
        logger.info("[LLM] Groq")
        return openai.LLM(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY"),
            model=os.getenv("GROQ_MODEL", ws_config.llm_model),
            temperature=float(os.getenv("GROQ_TEMPERATURE", str(ws_config.llm_temperature))),
        )

    if provider in ("google", "gemini"):
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key and _HAS_GOOGLE:
            logger.info("[LLM] Google Gemini")
            return google_plugin.LLM(
                model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
                api_key=gemini_key,
            )
        logger.warning("[LLM] Google requested but plugin/key not available — falling back to Groq")

    if provider == "openai":
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            logger.info("[LLM] OpenAI")
            return openai.LLM(
                api_key=openai_key,
                model=os.getenv("OPENAI_MODEL", ws_config.llm_model),
            )
        logger.warning("[LLM] OpenAI requested but OPENAI_API_KEY not set — falling back to Groq")

    # Safe default: Groq (always configured)
    logger.info("[LLM] Groq (default fallback)")
    return openai.LLM(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY"),
        model=os.getenv("GROQ_MODEL", ws_config.llm_model),
        temperature=float(os.getenv("GROQ_TEMPERATURE", str(ws_config.llm_temperature))),
    )


# =============================================================================
# TOOLS
# =============================================================================

class InboundTools(llm.ToolContext):
    def __init__(self, ctx: agents.JobContext, ws_config: WorkspaceAgentConfig):
        super().__init__(tools=[])
        self.ctx       = ctx
        self.ws_config = ws_config
        self.lead_info = {}
        self.agent_session: Optional[AgentSession] = None

    @llm.function_tool(
        description=(
            "Change the spoken language of the AI agent dynamically if the user requests it "
            "or starts speaking a different language consistently. For Sarvam TTS, use BCP-47 codes "
            "like 'hi-IN' (Hindi), 'en-IN' (English), 'ta-IN' (Tamil), 'te-IN' (Telugu), 'mr-IN' (Marathi), "
            "'gu-IN' (Gujarati), 'bn-IN' (Bengali)."
        )
    )
    async def change_spoken_language(self, language_code: str):
        """Args: language_code: The BCP-47 language code to switch to (e.g., 'hi-IN')."""
        logger.info(f"[TOOL] change_spoken_language to: {language_code}")
        if self.agent_session and hasattr(self.agent_session.tts, "update_options"):
            try:
                # This works specifically for LiveKit plugins like Sarvam that support update_options
                self.agent_session.tts.update_options(target_language_code=language_code)
                return f"Language successfully changed to {language_code}. Please reply in this new language."
            except Exception as e:
                logger.error(f"[TOOL] Failed to change language: {e}")
                return f"Failed to change language to {language_code}. {e}"
        return f"Language switch to {language_code} recorded, but TTS provider may not natively support hot-swapping."

    @llm.function_tool(
        description=(
            "Save the caller's contact information after you have collected their "
            "name, phone number, and city. Call this once ALL THREE are confirmed. "
            "This is just contact capture — it does NOT mean the lead is qualified."
        )
    )
    def save_lead_info(self, name: str, phone: str, city: str, email: str = ""):
        """
        Store caller lead details and confirm collection.

        Args:
            name:  Caller's full name
            phone: Caller's phone number
            city:  Caller's city or location
            email: Caller's email address (optional — capture if they offer it)
        """
        self.lead_info = {"name": name, "phone": phone, "city": city, "email": email}
        logger.info(f"[LEAD] 📋 Contact captured → name={name!r}, phone={phone!r}, city={city!r}, email={email!r}")

        # Write to CSV (contact info only, not yet qualified)
        import analytics
        analytics.save_lead_csv(name, phone, city, email=email, status="contact_captured")

        return (
            f"Thank you, {name}! I've noted your details from {city}. "
            f"Now, let me check the available time slots for our doctors — "
            f"what would you like to know first?"
        )

    @llm.function_tool(
        description=(
            "Mark this lead as QUALIFIED and successful. Call this ONLY when the caller "
            "expresses a clear, specific buying intent — such as: requesting a test drive, "
            "asking for a home/doorstep demo, wanting to visit the showroom, asking to book "
            "an appointment, requesting a personalised quote with intent to purchase, or "
            "saying they want to buy. DO NOT call this just because they gave their contact info "
            "or asked general questions about the car."
        )
    )
    def mark_lead_qualified(self, intent: str):
        """
        Mark the lead as qualified based on expressed buying intent.

        Args:
            intent: What specific action the caller requested (e.g. 'test drive booking',
                    'home demo request', 'showroom visit', 'price quote for purchase')
        """
        name  = self.lead_info.get("name", "Caller")
        phone = self.lead_info.get("phone", "")
        city  = self.lead_info.get("city", "")
        email = self.lead_info.get("email", "")

        logger.info(f"[LEAD] ✅ QUALIFIED → intent={intent!r}, name={name!r}, phone={phone!r}")

        import analytics
        analytics.save_lead_csv(name, phone, city, email=email, status="qualified", intent=intent)

        return (
            f"Excellent! I've noted your request for a {intent}. "
            f"Our team will be in touch with you shortly to confirm all the details. "
            f"Is there anything else I can help you with in the meantime?"
        )

    @llm.function_tool(description="Transfer the caller to a live human sales representative.")
    async def transfer_to_sales(self, destination: Optional[str] = None):
        """Transfer inbound caller to a live sales rep. Args: destination: optional override number."""
        target = destination or self.ws_config.transfer_number
        if not target:
            return "Our sales team is unavailable right now. I'll arrange a callback for you shortly."

        if "@" not in target:
            if self.ws_config.sip_domain:
                clean = target.replace("tel:", "").replace("sip:", "")
                target = f"sip:{clean}@{self.ws_config.sip_domain}"
            elif not target.startswith("tel:"):
                target = f"tel:{target}"
        elif not target.startswith("sip:"):
            target = f"sip:{target}"

        participant_identity = None
        for p in self.ctx.room.remote_participants.values():
            if "sip_" in p.identity:
                participant_identity = p.identity
                break
        
        if not participant_identity:
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
    def __init__(self, ws_config: WorkspaceAgentConfig, tools: list, user_prompt: str = None, tts_language: str = None):
        if user_prompt and user_prompt.strip():
            instructions = (
                f"{ws_config.system_prompt}\n\n"
                f"## Additional Context for This Call:\n{user_prompt.strip()}"
            )
        else:
            instructions = ws_config.system_prompt
            
        instructions += (
            "\n\nCRITICAL LANGUAGE INSTRUCTION: If the user explicitly asks you to speak a different language, "
            "or consistently starts speaking in a different language (e.g., Hindi instead of English), "
            "you MUST call the `change_spoken_language` tool to switch your TTS engine to their language code "
            "(like 'hi-IN'). After calling the tool, reply to them entirely in that new language."
        )
        if tts_language and "en" not in tts_language.lower():
            instructions += f"\n\nCRITICAL: Your current target language is '{tts_language}'. You MUST speak entirely in this language code. Do NOT speak English."

        super().__init__(instructions=instructions, tools=tools)
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
    config_dict = {}
    workspace_id = None
    try:
        if ctx.job.metadata:
            data = json.loads(ctx.job.metadata)
            config_dict.update(data)
            logger.info(f"[INBOUND] Job metadata: {data!r}")
        if ctx.room.metadata:
            data = json.loads(ctx.room.metadata)
            config_dict.update(data)
            logger.info(f"[INBOUND] Room metadata: {data!r}")
    except Exception as e:
        logger.error(f"[INBOUND] Metadata parse error: {e}")

    # The trunk identity typically contains the SIP trunk info
    workspace_id = config_dict.get("business_id") or config_dict.get("workspace_id")
    ws_config = await load_workspace_config(workspace_id, mode="inbound")

    # --- Build plugins ---
    fnc_ctx   = InboundTools(ctx, ws_config)
    built_tts = _build_tts(
        ws_config,
        config_dict.get("tts_provider"),
        config_dict.get("voice_id"),
        config_dict.get("tts_language")
    )
    built_llm = _build_llm(ws_config, config_dict.get("model_provider"))

    # Support dynamic language detection or code-switching if set to 'auto'
    is_auto = (ws_config.stt_language == "auto")
    session = AgentSession(
        vad=_VAD,  # reuse pre-loaded model — no disk I/O on call start
        stt=deepgram.STT(
            model=ws_config.stt_model,
            language=ws_config.stt_language if not is_auto else "en-US",
            detect_language=is_auto,
        ),
        llm=built_llm,
        tts=built_tts,
    )
    
    # Link session to tools for dynamic language switching
    fnc_ctx.agent_session = session

    user_prompt = config_dict.get("user_prompt", "")
    agent_instance = InboundAssistant(
        ws_config=ws_config,
        tools=list(fnc_ctx.function_tools.values()),
        user_prompt=user_prompt,
        tts_language=config_dict.get("tts_language")
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

    # Greet the caller immediately using say() which goes straight to TTS.
    # No LLM round-trip needed for the greeting — saves 1-2 seconds.
    try:
        await session.say(ws_config.initial_greeting, allow_interruptions=True)
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
