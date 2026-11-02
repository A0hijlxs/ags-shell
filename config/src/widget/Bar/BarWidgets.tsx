import Gtk from "gi://Gtk?version=4.0"
import GLib from "gi://GLib?version=2.0"
import { createPoll } from "ags/time"
import { createComputed, For } from "ags"

import { focusedWorkspace, sortedWorkspaces } from "../../store/hyprland"
import { focusWorkspace } from "../../store/hypr"
import { batteryVar, batteryIconName, batteryStatus } from "../../store/battery"
import { networkIconName } from "../../store/network"
import { bluetoothIconName } from "../../store/bluetooth"
import { handleRequest } from "../../../request"
import { sunsetActive } from "../../store/hyprsunset"
import { tailscaleIconName } from "../../store/tailscale"
import { miscIconNames } from "../../store/iconNames"
import { privacyModeActive } from "../../store/privacy"

const { CENTER } = Gtk.Align

export function Workspaces() {
    const visibleWorkspaces = createComputed(
        [sortedWorkspaces, focusedWorkspace, privacyModeActive],
        (all, focused, privacy) => privacy ? all.filter(ws => ws.id === focused?.id) : all
    )

    return (
        <box class={"workspaces"} valign={CENTER} spacing={15} >
            <For each={visibleWorkspaces}>
                {(ws) => (
                    <button
                        css-classes={focusedWorkspace(fw => ["workspace", ws === fw ? "focused" : ""])}
                        onClicked={() => focusWorkspace(ws.id)}>
                    </button>
                )}
            </For>
        </box>
    )
}

export function BatteryWidget() {    
    return (
        <box visible={batteryVar.isPresent} tooltip-text={batteryStatus}>
            <image iconName={batteryIconName} />
        </box>
    )
}

export function TimeWidget({format = "%l:%M %p"}) {
    const time = createPoll("", 20_000, () => GLib.DateTime.new_now_local().format(format)!)
    return (
        <label label={time} />
    )
}

export function WifiWidget() {
    return (
        <box>
            <image iconName={networkIconName}/>
        </box>
    )
}

export function BluetoothWidget() {
    return (
        <box>
            <image iconName={bluetoothIconName}/>
        </box>
    )
}

export function PowerWidget() {
    return (
        <button onClicked={() => handleRequest("logout")} class={"power-button"} >
            <image iconName={miscIconNames.shutdown} />
        </button>
    )
}

export function OsWidget() {
    return (
        <button onClicked={() => handleRequest("controller")} class={"os-logo"}>
            <image iconName={miscIconNames.nixos} />
        </button>
    )
}

export function SunsetWidget() {
    const visible = createComputed([sunsetActive, privacyModeActive], (active, privacy) => active && !privacy)
    return (
        <box visible={visible}>
            <image iconName={miscIconNames.nightmode} />
        </box>
    )
}

export function TailscaleWidget() {
    return (
        <box visible={privacyModeActive(privacy => !privacy)}>
            <image iconName={tailscaleIconName} />
        </box>
    )
}
