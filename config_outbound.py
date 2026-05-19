import os
from dotenv import load_dotenv

load_dotenv()

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
