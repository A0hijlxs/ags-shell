
import { createState } from "ags"
import { readFile, writeFile } from "ags/file"
import GLib from "gi://GLib"
import { registerRequest } from "../../request"

const CACHE_DIR = GLib.getenv("AGS_CACHE_DIR") ?? `${GLib.get_home_dir()}/.cache/ags`
const STATE_FILE = `${CACHE_DIR}/privacy.json`

function loadState(): boolean {
    try { return JSON.parse(readFile(STATE_FILE)).enabled }
    catch { return false }
}

function saveState(enabled: boolean) {
    GLib.mkdir_with_parents(CACHE_DIR, 0o755)
    writeFile(STATE_FILE, JSON.stringify({ enabled }))
}

const [privacyModeActive, setPrivacyModeActive] = createState(loadState())

export { privacyModeActive }

export function togglePrivacyMode() {
    const next = !privacyModeActive.get()
    setPrivacyModeActive(next)
    saveState(next)
}

registerRequest("privacy-mode", togglePrivacyMode)
