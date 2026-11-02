
import Wp from "gi://AstalWp"

import { defaultSpeaker, defaultMic, speakerVar, micVar, speakerIconName, micIconName } from "../../store/wireplumber"

import { transitionTo, MenuNames } from "./SystemMenu"
import { OverviewSlider } from "./Overview"
import { SeparatorLabel } from "../Common/SeparatorLabel"
import { miscIconNames } from "../../store/iconNames"
import Gtk from "gi://Gtk?version=4.0"
import { Accessor, createBinding } from "ags"
import { For } from "ags"

const { VERTICAL } = Gtk.Orientation

function EndpointsList({ endpointsBind } : { endpointsBind: Accessor<Wp.Endpoint[]> }) {
    return (
        <box orientation={VERTICAL}>
            <For each={endpointsBind}>
                {ep => (
                    <button class={"item-button"} onClicked={() => {ep.set_is_default(true)}}>
                        <box spacing={10}>
                            <image iconName={createBinding(ep, "isDefault").as(d => d ? miscIconNames.selected : "")} />
                            <label label={ep.description} />
                        </box>
                    </button>
                )}
            </For>
        </box>
    )
}

export function EndpointMenu() {
    return (
        <box orientation={VERTICAL} $type="named" name={MenuNames.ENDPOINT} spacing={6} class={"sub-menu"}>
            <button label="Audio Controls" onClicked={() => transitionTo()} />
            <SeparatorLabel title="Select Default Speaker" />
            <EndpointsList endpointsBind={speakerVar.speakers}/>
            <SeparatorLabel title="Select Default Microphone" />
            <EndpointsList endpointsBind={micVar.mics}/>
        </box>
    )
}

export function EndpointSliders() {
    return (
        <box orientation={VERTICAL}>
            <OverviewSlider
                icon={speakerIconName} 
                position={speakerVar.volume}
                status={speakerVar.mute}
                onToggled={() => defaultSpeaker?.set_mute(!defaultSpeaker?.mute)}
                onChanged={(value) => defaultSpeaker.set_volume(value)}
                onExpand={() => transitionTo(MenuNames.ENDPOINT)}
                />

            <OverviewSlider
                icon={micIconName}
                position={micVar.volume}
                status={micVar.mute}
                onToggled={() => defaultMic?.set_mute(!defaultMic?.mute)}
                onChanged={(value) => defaultMic.set_volume(value)}
                onExpand={() => transitionTo(MenuNames.ENDPOINT)}
                />
        </box>
    )
}
