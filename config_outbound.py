import os
import json
from dotenv import load_dotenv

load_dotenv()

# =========================================================================================
#  Dashboard Config Bridge — loads overrides from data/agent_config.json
# =========================================================================================
_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "data", "agent_config.json")

def load_dashboard_config():
    """Reload config from the dashboard JSON file. Overrides module globals."""
    global SYSTEM_PROMPT, INITIAL_GREETING, FALLBACK_GREETING
    global STT_PROVIDER, STT_MODEL, STT_LANGUAGE
    global DEFAULT_TTS_PROVIDER, DEFAULT_TTS_VOICE, SARVAM_LANGUAGE
    global DEFAULT_LLM_PROVIDER, GROQ_MODEL, GROQ_TEMPERATURE
    global DEFAULT_TRANSFER_NUMBER

    try:
        if not os.path.exists(_CONFIG_FILE):
            return
        with open(_CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        cfg = data.get("outbound")
        if not cfg:
            return

        if cfg.get("system_prompt"):
            prompt = cfg["system_prompt"]
            # Append resource content to the prompt
            resources = cfg.get("resources", [])
            if resources:
                prompt += "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nADDITIONAL KNOWLEDGE BASE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                for res in resources:
                    if res.get("type") == "url":
                        prompt += f"\nReference URL — {res.get('name', '')}: {res.get('value', '')}"
                    else:
                        prompt += f"\n## {res.get('name', 'Resource')}\n{res.get('value', '')}\n"
            SYSTEM_PROMPT = prompt
        if cfg.get("initial_greeting"):
            INITIAL_GREETING = cfg["initial_greeting"]
        if cfg.get("fallback_greeting"):
            FALLBACK_GREETING = cfg["fallback_greeting"]
        if cfg.get("stt_provider"):
            STT_PROVIDER = cfg["stt_provider"]
        if cfg.get("stt_model"):
            STT_MODEL = cfg["stt_model"]
        if cfg.get("stt_language"):
            STT_LANGUAGE = cfg["stt_language"]
        if cfg.get("tts_provider"):
            DEFAULT_TTS_PROVIDER = cfg["tts_provider"]
        if cfg.get("tts_voice"):
            DEFAULT_TTS_VOICE = cfg["tts_voice"]
        if cfg.get("tts_language"):
            SARVAM_LANGUAGE = cfg["tts_language"]
        if cfg.get("llm_provider"):
            DEFAULT_LLM_PROVIDER = cfg["llm_provider"]
        if cfg.get("llm_model"):
            GROQ_MODEL = cfg["llm_model"]
        if cfg.get("llm_temperature") is not None:
            GROQ_TEMPERATURE = cfg["llm_temperature"]
        if cfg.get("transfer_number"):
            DEFAULT_TRANSFER_NUMBER = cfg["transfer_number"]

    except Exception as e:
        print(f"[CONFIG] Failed to load dashboard config for outbound: {e}")

# =========================================================================================
#  📞 OUTBOUND CALL CONFIGURATION — School Receptionist
#  Used when the agent dials out to a phone number.
# =========================================================================================

# --- 1. AGENT PERSONA & PROMPTS ---
SYSTEM_PROMPT = """
You are a helpful and polite GOVERNMENT SCHOOL Receptionist at "KENDRIYA VIDYALAYA NO 1 GURUGRAM".

**Your Goal:** Answer questions from parents about admissions, fees, and timings.

**Key Behaviors:**
1. **Multilingual:** You can speak fluent English and Hindi. If the user speaks Hindi, switch to Hindi immediately.
2. **Polite & Warm:** Always be welcoming and respectful.
3. **Be Concise:** Keep answers short (1-2 sentences).
4. **Admissions:** If asked about admissions, say they are open for Grade 1 to 10 and ask if they want to schedule a visit.
5. **Fees:** If asked about fees, say "Please visit the school office for exact details, but it starts at roughly 50k per year."

**CRITICAL:**
- Only use `transfer_call` if they explicitly ask to talk to the Principal or Admin.
- If they say "Bye", say "Namaste" or "Goodbye" and end the call.
"""

# The explicit first message the agent speaks when the user picks up.
INITIAL_GREETING = "The user has picked up the call. Introduce yourself as the School Receptionist immediately."

# Fallback greeting for already-connected participants
FALLBACK_GREETING = "Greet the user immediately as the School Receptionist."


# --- 2. SPEECH-TO-TEXT (STT) SETTINGS ---
STT_PROVIDER = "deepgram"
STT_MODEL = "nova-2"   # "nova-2" (balanced) or "nova-3" (newest)
STT_LANGUAGE = "en"    # "en" supports multi-language code switching in Nova 2


# --- 3. TEXT-TO-SPEECH (TTS) SETTINGS ---
DEFAULT_TTS_PROVIDER = "sarvam"
DEFAULT_TTS_VOICE = "anushka"   # OpenAI: alloy, echo, shimmer | Sarvam: anushka, aravind

# Sarvam AI Specifics (for Indian Context)
SARVAM_MODEL = "bulbul:v2"
SARVAM_LANGUAGE = "hi-IN"  # or en-IN

# Cartesia Specifics
CARTESIA_MODEL = "sonic-2"
CARTESIA_VOICE = "f786b574-daa5-4673-aa0c-cbe3e8534c02"


# --- 4. LARGE LANGUAGE MODEL (LLM) SETTINGS ---
DEFAULT_LLM_PROVIDER = "groq"
DEFAULT_LLM_MODEL = "gpt-4o-mini"

# Groq Specifics (Faster inference)
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_TEMPERATURE = 0.7


# --- 5. TELEPHONY & TRANSFERS ---
DEFAULT_TRANSFER_NUMBER = os.getenv("DEFAULT_TRANSFER_NUMBER")

# Vobiz Trunk Details
SIP_TRUNK_ID = os.getenv("VOBIZ_SIP_TRUNK_ID")
SIP_DOMAIN = os.getenv("VOBIZ_SIP_DOMAIN")

# Call mode identifier
CALL_MODE = "outbound"

# Load any dashboard overrides on import
load_dashboard_config()
