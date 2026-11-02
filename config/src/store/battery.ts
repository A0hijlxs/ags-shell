
import { createBinding, createComputed } from "ags"
import Battery from "gi://AstalBattery"
import { getBatteryIconName } from "./iconNames"

export const battery = Battery.get_default()

export const batteryVar = {
    percent: createBinding(battery, "percentage"),
    isCharging: createBinding(battery, "charging"),
    isPresent: createBinding(battery, "isPresent"),
}

export const batteryStatus = createComputed([
    batteryVar.percent,
    batteryVar.isCharging, 
], (percent, charging) => {
    const percentage = Math.floor(percent * 100)
    const seconds = charging ? battery.timeToFull : battery.timeToEmpty
    const statusText = charging ? "until full" : "remaining"

    if (!seconds || seconds <= 0)
        return `${percentage}% — Calculating...`

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    return `${percentage}% — ${hours}h:${minutes}m (${statusText})`
})

export const batteryIconName = createComputed([
    batteryVar.percent, 
    batteryVar.isCharging,
], (percent, charging) => getBatteryIconName(percent, charging))
