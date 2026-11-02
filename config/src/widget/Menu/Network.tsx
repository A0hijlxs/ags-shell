
import Gtk from "gi://Gtk?version=4.0"
import { NetworkItem } from "./NetworkItem"
import { Networks, network, networkState, networkIconName, toggleWifi } from "../../store/network"
import { MenuNames, transitionTo } from "./SystemMenu"
import { OverviewButton } from "./Overview"
import { createBinding, createState, For, With } from "ags"

const { currentAP, enabled } = networkState
const { VERTICAL } = Gtk.Orientation

export function NetworkButton() {
    return (
        <OverviewButton
            icon={networkIconName}
            name={"Wi-Fi"}
            label={currentAP.as(ap => ap ? ap.ssid : "Not Connected")}
            onToggled={() => toggleWifi()}
            onExpand={() => transitionTo(MenuNames.NETWORK)}
            />
    )
}

export function NetworkMenu() {
    const scanning = network.wifi ? createBinding(network.wifi, "scanning") : createState(false)[0]

    return (
        <box orientation={VERTICAL} $type="named" name={MenuNames.NETWORK} class={"sub-menu"} spacing={5}>

            <button label={"Wi-Fi"} onClicked={() => transitionTo()} />
            
            <box orientation={VERTICAL}>
                <button onClicked={() => toggleWifi()}
                    class={"adapter-button"}>
                    <box spacing={10}>
                        <label label={"Enabled"} />
                        <label hexpand />
                        <switch active={enabled} />
                    </box>
                </button>

                <With value={currentAP}>
                    {ap => (ap 
                        ? <NetworkItem ssid={ap.ssid} type="ap" strength={ap.strength} flags={ap.flags} /> 
                        : <button label={"Not Connected"} sensitive={false}/>
                    )}
                </With>
            </box>

            <button 
                sensitive={scanning(s => !s)}
                visible={enabled}
                label={scanning(s => s ? "Scanning..." : "Start Scan")} 
                onClicked={() => Networks.scan()}
            />

            <box orientation={VERTICAL}>
                <For each={networkState.inRange}>
                    {ap => <NetworkItem ssid={ap.ssid} type="ap" strength={ap.strength} flags={ap.flags} />}
                </For>
            </box>
            
            <button 
                label={"Saved Networks"}
                onClicked={() => transitionTo(MenuNames.SAVED_NETWORKS)} />
        </box>
    )
}

export function SavedNetworksMenu() {
    return (
        <box 
            orientation={VERTICAL} 
            spacing={10}
            name={MenuNames.SAVED_NETWORKS} 
            $type="named"
            class={"sub-menu"} 
        >
            <button label={"Saved Networks"} onClicked={() => transitionTo(MenuNames.NETWORK)}/>
            <box orientation={VERTICAL} spacing={2}>
                <For each={networkState.active}>
                    {network => <NetworkItem ssid={network} type="saved"/>}
                </For>
                <For each={networkState.inactive}>
                    {network => <NetworkItem ssid={network} type="saved"/>}
                </For>
            </box>
        </box>
    )
}
