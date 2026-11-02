// Talks to Hyprland through its Lua API (Hyprland's `configType = "lua"`): legacy dispatch strings
// ("workspace 3") are rejected there, so every action is an hl.dsp.* expression sent over the socket.
// Also registers the shell's keybinds and layer rules at runtime, so the shell needs nothing in the
// user's Hyprland config, and replays them after a config reload (which wipes runtime binds).
import Hyprland from "gi://AstalHyprland"
import GLib from "gi://GLib"

const hyprland = Hyprland.get_default()

type LuaValue = string | number | boolean | { [key: string]: LuaValue }

function toLua(value: LuaValue): string {
    if (typeof value === "string") return JSON.stringify(value)
    if (typeof value !== "object") return String(value)
    return `{ ${Object.entries(value).map(([k, v]) => `${k} = ${toLua(v)}`).join(", ")} }`
}

function send(request: string): void {
    const reply = hyprland.message(request)
    if (reply.trim() !== "ok") printerr(`hyprland: ${request}: ${reply.trim()}`)
}

const dispatch = (expression: string) => send(`dispatch ${expression}`)
const evaluate = (code: string) => send(`eval ${code}`)

// Hyprland's `address:` selector needs the 0x prefix.
const windowSelector = (client: Hyprland.Client) =>
    `address:${client.address.startsWith("0x") ? client.address : `0x${client.address}`}`

export const focusWorkspace = (id: number) =>
    dispatch(`hl.dsp.focus(${toLua({ workspace: id })})`)

export const moveClientSilently = (client: Hyprland.Client, workspace: number) =>
    dispatch(`hl.dsp.window.move(${toLua({ workspace, follow: false, window: windowSelector(client) })})`)

export const closeClient = (client: Hyprland.Client) =>
    dispatch(`hl.dsp.window.close(${toLua({ window: windowSelector(client) })})`)

export const exec = (command: string) =>
    dispatch(`hl.dsp.exec_cmd(${toLua(command)})`)

export const exit = () => dispatch("hl.dsp.exit()")

type Bind = { keys: string, command: string[], repeat?: boolean }

const binds: Bind[] = [
    { keys: "SUPER + space", command: ["ags", "request", "launcher"] },
    { keys: "SUPER + K", command: ["ags", "request", "system-menu"] },
    { keys: "SUPER + Z", command: ["ags", "request", "controller"] },
    { keys: "SUPER + P", command: ["ags", "request", "logout"] },
    { keys: "SUPER + B", command: ["ags", "request", "bar"] },
    { keys: "SUPER + SHIFT + P", command: ["ags", "request", "privacy-mode"] },
    { keys: "XF86Display", command: ["ags", "request", "sunset"] },
    { keys: "XF86SelectiveScreenshot", command: ["ags", "request", "screencapture"] },
    { keys: "SUPER + L", command: ["hyprlock"] },
    { keys: "SUPER + A", command: ["reload-ags"] },
    { keys: "Print", command: ["grimburst", "display", "save"] },
    { keys: "XF86AudioRaiseVolume", command: ["change-volume", "increase"], repeat: true },
    { keys: "XF86AudioLowerVolume", command: ["change-volume", "decrease"], repeat: true },
    { keys: "XF86AudioMute", command: ["change-volume", "mute-audio"], repeat: true },
    { keys: "XF86AudioMicMute", command: ["change-volume", "mute-mic"], repeat: true },
    { keys: "XF86MonBrightnessUp", command: ["change-brightness", "increase"], repeat: true },
    { keys: "XF86MonBrightnessDown", command: ["change-brightness", "decrease"], repeat: true },
]

const layerRules: LuaValue[] = [
    { name: "ags-blur", match: { namespace: "^(ags-window|ags-screencapture)$" }, blur: true, ignore_alpha: 0 },
    { name: "slurp-noanim", match: { namespace: "selection" }, no_anim: true, no_screen_share: true },
    { name: "ags-screencapture-no-share", match: { namespace: "^(ags-screencapture)$" }, no_screen_share: true },
]

// Hyprland runs binds with its own environment, so the shell hands over the settings its helper
// scripts read, and resolves each program to an absolute path from its own PATH.
const forwardedEnv = ["AGS_MAX_VOLUME", "AGS_SCREENSHOT_DIR"]

function registerBinds(): void {
    const env = forwardedEnv
        .filter(name => GLib.getenv(name) !== null)
        .map(name => `${name}=${GLib.shell_quote(GLib.getenv(name)!)}`)
    for (const { keys, command, repeat } of binds) {
        const program = GLib.find_program_in_path(command[0])
        if (!program) continue
        const action = `hl.dsp.exec_cmd(${toLua([...env, program, ...command.slice(1)].join(" "))})`
        const options = repeat ? `, ${toLua({ locked: true, repeating: true })}` : ""
        evaluate(`hl.unbind(${toLua(keys)})`)
        evaluate(`hl.bind(${toLua(keys)}, ${action}${options})`)
    }
}

// Guarded by a global so a shell restart without a config reload doesn't add the rules twice.
function registerLayerRules(): void {
    const rules = layerRules.map(rule => `hl.layer_rule(${toLua(rule)})`).join(" ")
    evaluate(`if not _G.ags_shell_layer_rules then _G.ags_shell_layer_rules = true ${rules} end`)
}

export function registerHyprland(): void {
    registerBinds()
    registerLayerRules()
    hyprland.connect("config-reloaded", () => {
        evaluate("_G.ags_shell_layer_rules = nil")
        registerBinds()
        registerLayerRules()
    })
}
