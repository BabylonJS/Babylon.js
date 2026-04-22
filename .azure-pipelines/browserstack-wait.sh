#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# browserstack-wait.sh — Wait for BrowserStack sessions, then run a command.
#
# Polls the BrowserStack Automate REST API to check how many parallel sessions
# are available. Tries to grab BSTACK_SESSIONS_REQUIRED (default 2) first;
# if only fewer are available (but at least 1), starts with what's available.
# Exports CIWORKERS so the Playwright config adjusts its worker count to
# match available sessions.
#
# If the command fails because another build grabbed the sessions in the gap
# (race condition), waits and retries.
#
# Environment variables:
#   BSTACK_SESSIONS_REQUIRED  — Preferred session count (default: 2)
#   BSTACK_SESSIONS_MIN       — Minimum acceptable sessions (default: 1)
#   BROWSERSTACK_USERNAME     — BrowserStack username (required)
#   BROWSERSTACK_ACCESS_KEY   — BrowserStack access key (required)
#   BSTACK_WAIT_TIMEOUT       — Max seconds to wait per attempt (default: 900)
#   BSTACK_POLL_INTERVAL      — Seconds between polls (default: 30)
#   BSTACK_MAX_RETRIES        — Retries on QUEUE_SIZE_EXCEEDED (default: 3)
#
# Usage:
#   BSTACK_SESSIONS_REQUIRED=2 .azure-pipelines/browserstack-wait.sh \
#       npx playwright test --config ...
# ---------------------------------------------------------------------------
set -uo pipefail

PREFERRED="${BSTACK_SESSIONS_REQUIRED:-2}"
MINIMUM="${BSTACK_SESSIONS_MIN:-1}"
WAIT_TIMEOUT="${BSTACK_WAIT_TIMEOUT:-900}"
INTERVAL="${BSTACK_POLL_INTERVAL:-30}"
MAX_RETRIES="${BSTACK_MAX_RETRIES:-3}"

API_URL="https://api.browserstack.com/automate/plan.json"

# Stores how many sessions we actually got (set by wait_for_sessions)
GRANTED=0

# --- Helpers ----------------------------------------------------------------

wait_for_sessions() {
    local elapsed=0
    echo "[browserstack-wait] Looking for ${PREFERRED} session(s) (minimum: ${MINIMUM}) — timeout: ${WAIT_TIMEOUT}s"

    while [ "$elapsed" -lt "$WAIT_TIMEOUT" ]; do
        local response
        response=$(curl -sf -u "${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}" "$API_URL" 2>/dev/null) || {
            echo "[browserstack-wait]   API request failed — retrying in ${INTERVAL}s"
            sleep "$INTERVAL"
            elapsed=$((elapsed + INTERVAL))
            continue
        }

        # Parse with Node.js (guaranteed to be installed by the UseNode CI task)
        local available
        available=$(node -e "
            const d = JSON.parse(process.argv[1]);
            console.log(d.parallel_sessions_max_allowed - d.parallel_sessions_running);
        " "$response" 2>/dev/null) || {
            echo "[browserstack-wait]   Failed to parse API response — retrying in ${INTERVAL}s"
            sleep "$INTERVAL"
            elapsed=$((elapsed + INTERVAL))
            continue
        }

        # Try preferred count first, fall back to minimum
        if [ "$available" -ge "$PREFERRED" ]; then
            GRANTED="$PREFERRED"
            echo "[browserstack-wait] ${available} session(s) available — using ${GRANTED}."
            return 0
        elif [ "$available" -ge "$MINIMUM" ]; then
            GRANTED="$available"
            # Cap at preferred (don't grab more than we asked for)
            if [ "$GRANTED" -gt "$PREFERRED" ]; then
                GRANTED="$PREFERRED"
            fi
            echo "[browserstack-wait] ${available} session(s) available (wanted ${PREFERRED}) — using ${GRANTED}."
            return 0
        fi

        local running max_allowed
        running=$(node -e "console.log(JSON.parse(process.argv[1]).parallel_sessions_running)" "$response" 2>/dev/null || echo "?")
        max_allowed=$(node -e "console.log(JSON.parse(process.argv[1]).parallel_sessions_max_allowed)" "$response" 2>/dev/null || echo "?")
        echo "[browserstack-wait]   ${running}/${max_allowed} sessions in use, need at least ${MINIMUM}. Waiting ${INTERVAL}s... (${elapsed}s/${WAIT_TIMEOUT}s)"
        sleep "$INTERVAL"
        elapsed=$((elapsed + INTERVAL))
    done

    echo "[browserstack-wait] Timed out after ${WAIT_TIMEOUT}s waiting for sessions."
    return 1
}

# --- Main -------------------------------------------------------------------

retry=0
while [ "$retry" -le "$MAX_RETRIES" ]; do
    if [ "$retry" -gt 0 ]; then
        echo ""
        echo "[browserstack-wait] === Retry ${retry}/${MAX_RETRIES} (queue was full) ==="
    fi

    wait_for_sessions || exit 1

    # Export so Playwright config picks up the granted count
    export CIWORKERS="$GRANTED"
    echo "[browserstack-wait] Set CIWORKERS=${GRANTED}"

    # Run the actual command; capture exit code without exiting on failure
    set +e
    OUTPUT_LOG=$(mktemp)
    "$@" 2>&1 | tee "$OUTPUT_LOG"
    exit_code=${PIPESTATUS[0]}
    set -e

    # If it failed due to queue exhaustion (race condition), retry
    if [ "$exit_code" -ne 0 ] && grep -qi "QUEUE_SIZE_EXCEEDED\|BROWSERSTACK_QUEUE_SIZE_EXCEEDED\|queue.*exceeded\|parallel.*limit.*exceeded" "$OUTPUT_LOG" 2>/dev/null; then
        rm -f "$OUTPUT_LOG"
        retry=$((retry + 1))
        if [ "$retry" -le "$MAX_RETRIES" ]; then
            echo ""
            echo "[browserstack-wait] Sessions were taken between check and launch (race condition). Retrying..."
            continue
        fi
        echo "[browserstack-wait] Exhausted all ${MAX_RETRIES} retries."
        exit 1
    fi

    rm -f "$OUTPUT_LOG"
    exit "$exit_code"
done

echo "[browserstack-wait] Exhausted all ${MAX_RETRIES} retries."
exit 1
