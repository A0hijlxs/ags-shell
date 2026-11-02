
import { transitionTo } from "./SystemMenu"
import { OverviewSlider } from "./Overview"
import {
    brightness,
    screenBrightness,
    brightnessIconName,
    kbdBrightnessIconName,
    kbdBrightness,
} from "../../store/brightness"
import { hyprsunset, sunsetActive } from "../../store/hyprsunset"
import { createState } from "ags"


export function BrightnessSliders() {
    return (
        <box>
            <OverviewSlider
                icon={brightnessIconName}
                position={screenBrightness}
                status={sunsetActive}
                onChanged={(value) => {brightness.screenBrightness = value}}
                onToggled={() => hyprsunset.toggle()}
                onExpand={() => {}}
                />

            <OverviewSlider
                icon={kbdBrightnessIconName}
                position={kbdBrightness}
                status={createState(false)[0]}
                onChanged={(value) => {brightness.kbdBrightness = value}}
                onToggled={() => {}}
                // onToggled={() => brightness.toggleKbdOff()}
                onExpand={() => {}}
                />
        </box>
    )
}

