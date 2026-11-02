
import { createState } from "ags"
import { execAsync } from "ags/process"
import GLib from "gi://GLib"

const CACHE_DIR = GLib.getenv("AGS_CACHE_DIR") ?? `${GLib.get_home_dir()}/.cache/ags`
const CAPTURE_PATH = `${CACHE_DIR}/screencapture.png`
const SCREENSHOT_DIR = GLib.getenv("AGS_SCREENSHOT_DIR") ?? `${GLib.get_home_dir()}/Pictures/Screenshots`

export type CaptureMode = "Display" | "Area" | "Window"
export type Model = "Haiku" | "Sonnet" | "Opus"

const MODEL_ALIAS: Record<Model, string> = { Haiku: "haiku", Sonnet: "sonnet", Opus: "opus" }

const [captureMode, setCaptureMode] = createState<CaptureMode>("Area")
const [saveToFiles, setSaveToFiles] = createState(false)
const [copyToClipboard, setCopyToClipboard] = createState(true)
const [capturedImagePath, setCapturedImagePath] = createState<string | null>(null)
const [response, setResponse] = createState("")
const [loading, setLoading] = createState(false)

const [askEnabled, setAskEnabledRaw] = createState(false)
const [selectedModel, setSelectedModel] = createState<Model>("Sonnet")
const [useWrittenPrompt, setUseWrittenPrompt] = createState(false)

function setAskEnabled(value: boolean) {
    setAskEnabledRaw(value)
    if (!value) setUseWrittenPrompt(false)
}

export {
    captureMode, setCaptureMode, saveToFiles, setSaveToFiles, copyToClipboard, setCopyToClipboard,
    capturedImagePath, response, loading,
    askEnabled, setAskEnabled, selectedModel, setSelectedModel, useWrittenPrompt, setUseWrittenPrompt,
}

export async function capture(): Promise<boolean> {
    try {
        const mode = captureMode.get()
        const result = (await execAsync(["grimburst", mode.toLowerCase(), "none", "--output", CAPTURE_PATH])).trim()
        if (!result) return false // selection cancelled

        const notifyParts: string[] = []

        if (copyToClipboard.get()) {
            await execAsync(["bash", "-c", `wl-copy < '${CAPTURE_PATH}'`])
            notifyParts.push("Copied to clipboard")
        }

        if (saveToFiles.get()) {
            GLib.mkdir_with_parents(SCREENSHOT_DIR, 0o755)
            const timestamp = GLib.DateTime.new_now_local().format("%Y-%m-%d_%H%M%S")!
            const dest = `${SCREENSHOT_DIR}/screenshot_${timestamp}_${mode.toLowerCase()}.png`
            await execAsync(["cp", CAPTURE_PATH, dest])
            notifyParts.push(`Saved to: ${dest}`)
        }

        await execAsync([
            "notify-send", "-a", "ScreenCapture", "-h", `STRING:image-path:${CAPTURE_PATH}`,
            "Capture", notifyParts.length ? notifyParts.join(" & ") : "Captured",
        ])

        setCapturedImagePath(CAPTURE_PATH)
        setResponse("")
        return true
    } catch (e) {
        execAsync(["notify-send", "-a", "ScreenCapture", "-u", "critical", "Capture Failed", String(e)]).catch(() => {})
        print(e)
        return false
    }
}

export async function ask(question: string) {
    const image = capturedImagePath.get()
    if (!image || !askEnabled.get()) return

    const written = useWrittenPrompt.get()
    if (written && !question.trim()) return

    setLoading(true)
    setResponse("")

    try {
        const prompt = written
            ? `Read the screenshot at ${image} and answer: ${question.trim()}`
            : `Read the screenshot at ${image}.`
        const result = await execAsync([
            "claude", "-p", prompt,
            "--model", MODEL_ALIAS[selectedModel.get()],
            "--output-format", "json",
            "--allowedTools", "Read",
            "--no-session-persistence",
        ])
        setResponse(JSON.parse(result).result)
    } catch (e) {
        setResponse(`_Error: ${e}_`)
    } finally {
        setLoading(false)
    }
}
