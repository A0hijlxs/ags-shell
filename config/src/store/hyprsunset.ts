
import GObject, { register, property } from "ags/gobject"
import { execAsync } from "ags/process"
import { readFile, writeFile } from "ags/file"
import { createBinding } from "ags"
import GLib from "gi://GLib"
import { registerRequest } from "../../request"

const CACHE_DIR = GLib.getenv("AGS_CACHE_DIR") ?? `${GLib.get_home_dir()}/.cache/ags`
const STATE_FILE = `${CACHE_DIR}/hyprsunset.json`

function loadState() {
    try { return JSON.parse(readFile(STATE_FILE)) }
    catch { return { enabled: false, temperature: 4500, gamma: 100 } }
}

@register({ GTypeName: "HyprSunset" })
export default class HyprSunset extends GObject.Object {
    static instance: HyprSunset
    static get_default() {
        return this.instance ??= new HyprSunset()
    }

    @property(Boolean)
    enabled = false

    @property(Number)
    temperature = 4500

    @property(Number)
    gamma = 100

    constructor() {
        super()
        const state = loadState()
        this.enabled     = state.enabled
        this.temperature = state.temperature
        this.gamma       = state.gamma
        if (this.enabled) this.apply()
    }

    #send(...args: string[]) {
        execAsync(["hyprctl", "hyprsunset", ...args]).catch(() => print(this.enabled, ...args))
    }

    async apply() {
        if (!this.enabled) {
            this.#send("identity")
            return
        }
        this.#send("temperature", this.temperature.toString())
    }

    #save() {
        GLib.mkdir_with_parents(CACHE_DIR, 0o755)
        writeFile(STATE_FILE, JSON.stringify({
            enabled:     this.enabled,
            temperature: this.temperature,
            gamma:       this.gamma,
        }))
    }

    toggle = () => {
        this.setEnabled(!this.enabled)
    }

    setEnabled(value: boolean) {
        if (value === this.enabled) return
        this.enabled = value
        this.apply()
        this.#save()
    }

    setTemperature(value: number) {
        if (value === this.temperature) return
        this.temperature = value
        this.apply()
        this.#save()
    }

    setGamma(value: number) {
        if (value === this.gamma) return
        this.gamma = value
        this.apply()
        this.#save()
    }
}

export const hyprsunset = HyprSunset.get_default()
export const sunsetActive = createBinding(hyprsunset, "enabled")
export const sunsetTemperature = createBinding(hyprsunset, "temperature")

registerRequest("sunset", hyprsunset.toggle)
