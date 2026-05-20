"""
run.py — Launch both outbound and inbound agents as separate processes.

Usage:
    python run.py dev      ← development mode (with LiveKit dev server)
    python run.py start    ← production mode

Press Ctrl+C to stop both agents cleanly.
"""

import subprocess
import sys
import os
import time
import signal
from pathlib import Path

# ── Colours for terminal output ──────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RED    = "\033[91m"
RESET  = "\033[0m"
BOLD   = "\033[1m"


def log(color: str, tag: str, msg: str):
    print(f"{color}{BOLD}[{tag}]{RESET} {msg}", flush=True)


def main():
    # Accept 'dev' or 'start' as the mode (default: dev)
    mode = sys.argv[1] if len(sys.argv) > 1 else "dev"

    cwd = Path(__file__).parent

    log(BOLD, "RUN", f"Starting both agents in '{mode}' mode...")
    log(BOLD, "RUN", f"Working directory: {cwd}")
    print()

    processes = {}

    try:
        # ── Start OUTBOUND agent (School Receptionist) ────────────────────
        log(GREEN, "OUTBOUND", "Spawning agent_outbound.py ...")
        p_out = subprocess.Popen(
            [sys.executable, "agent_outbound.py", mode],
            cwd=cwd,
            # Each process gets its own output — visible in terminal
            stdout=None,
            stderr=None,
        )
        processes["outbound"] = p_out
        log(GREEN, "OUTBOUND", f"Started -> PID {p_out.pid} | agent_name=outbound-caller")

        # Small delay so logs don't interleave on startup
        time.sleep(0.5)

        # ── Start INBOUND agent (Škoda Octavia Advisor) ───────────────────
        log(CYAN, "INBOUND ", "Spawning agent_inbound.py ...")
        p_in = subprocess.Popen(
            [sys.executable, "agent_inbound.py", mode],
            cwd=cwd,
            stdout=None,
            stderr=None,
        )
        processes["inbound"] = p_in
        log(CYAN, "INBOUND ", f"Started -> PID {p_in.pid}  | agent_name=inbound-caller")

        print()
        log(BOLD, "RUN", f"Both agents running. Press {BOLD}Ctrl+C{RESET} to stop.")
        print()

        # ── Monitor — restart if a process dies unexpectedly ──────────────
        while True:
            time.sleep(2)

            for name, proc in list(processes.items()):
                ret = proc.poll()
                if ret is not None:
                    # Process exited — report it
                    color = GREEN if name == "outbound" else CYAN
                    log(RED, name.upper(), f"Process exited with code {ret}. Restarting...")

                    # Re-spawn the dead process
                    script = f"agent_{name}.py"
                    new_proc = subprocess.Popen(
                        [sys.executable, script, mode],
                        cwd=cwd,
                    )
                    processes[name] = new_proc
                    log(color, name.upper(), f"Restarted -> PID {new_proc.pid}")

    except KeyboardInterrupt:
        print()
        log(YELLOW, "RUN", "Ctrl+C received — shutting down all agents...")
        _shutdown(processes)

    except Exception as e:
        log(RED, "RUN", f"Unexpected error: {e}")
        _shutdown(processes)
        sys.exit(1)


def _shutdown(processes: dict):
    """Gracefully terminate all child processes."""
    for name, proc in processes.items():
        if proc.poll() is None:   # Still running
            log(YELLOW, "RUN", f"Terminating {name} agent (PID {proc.pid})...")
            proc.terminate()

    # Wait up to 5 seconds for clean exit
    deadline = time.time() + 5
    for name, proc in processes.items():
        remaining = max(0, deadline - time.time())
        try:
            proc.wait(timeout=remaining)
            log(YELLOW, "RUN", f"{name} agent stopped.")
        except subprocess.TimeoutExpired:
            log(RED, "RUN", f"{name} agent did not stop — force killing...")
            proc.kill()

    print()
    log(BOLD, "RUN", "All agents stopped. Goodbye!")


if __name__ == "__main__":
    main()
