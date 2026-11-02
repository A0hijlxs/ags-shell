
import GObject, { register, property } from "ags/gobject"
import { monitorFile, readFileAsync } from "ags/file"
import { exec, execAsync } from "ags/process"

import { getBrightnessIconName, getKbdBrightnessIconName } from "./iconNames";
import { createBinding, createComputed  } from "ags";

const get = (args: string) => Number(exec(`brightnessctl ${args}`))
const screenID = exec(`bash -c "ls -w1 /sys/class/backlight | head -1"`)
const kbdID = exec(`bash -c "ls -w1 /sys/class/leds | grep -i kbd || echo $(ls -w1 /sys/class/leds | head -1)"`)

@register({ GTypeName: "Brightness" })
export default class Brightness extends GObject.Object {
    static instance: Brightness
    static get_default() {
        if (!this.instance)
            this.instance = new Brightness()

        return this.instance
    }

    #screenMax = get("max")
    #kbdMax = get(`--device ${kbdID} max`)

    @property(Number)
    kbd = get(`--device ${kbdID} get`) / (this.#kbdMax || 1)

    @property(Number)
    screen = get("get") / (this.#screenMax || 1)

    set kbdBrightness(percent: number) {
        if (percent < 0) percent = 0
            else if (percent > 1) percent = 1
                else percent = Math.round(percent * this.#kbdMax) / this.#kbdMax

                    execAsync(`brightnessctl -d ${kbdID} s ${Math.floor(percent * 100)}% -q`).then(() => {
                        this.kbd = percent
                        this.notify("kbd")
                    }).catch(print)
    }

    set screenBrightness(percent: number) {
        if (percent < 0)
            percent = 0

        if (percent > 1)
            percent = 1

        execAsync(`brightnessctl set ${Math.floor(percent * 100)}% -q`).then(() => {
            this.screen = percent
            this.notify("screen")
        }).catch(print)
    }


    constructor() {
        super()

        const screenPath = `/sys/class/backlight/${screenID}/brightness`
        const kbdPath = `/sys/class/leds/${kbdID}/brightness`

        monitorFile(screenPath, async f => {
            const v = await readFileAsync(f).catch(print)
            this.screen = Number(v) / this.#screenMax
            this.notify("screen")
        })

        monitorFile(kbdPath, async f => {
            const v = await readFileAsync(f).catch(print)
            this.kbd = Number(v) / this.#kbdMax
            this.notify("kbd")
        })
    }
}


export const brightness = Brightness.get_default()
export const screenBrightness = createBinding(brightness, "screen")

export const brightnessIconName = createComputed(
    [screenBrightness], (value) => getBrightnessIconName(value)
)

export const kbdBrightness = createBinding(brightness, "kbd")

export const kbdBrightnessIconName = createComputed(
    [kbdBrightness], (value) => getKbdBrightnessIconName(value)
)

