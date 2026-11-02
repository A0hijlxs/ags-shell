
import app from "ags/gtk4/app"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import { Astal } from "ags/gtk4"
import { createState } from "ags"
import { registerRequest } from "../../../request"

import { BluetoothButton, BluetoothMenu } from "./Bluetooth"
import { NetworkButton, NetworkMenu, SavedNetworksMenu } from "./Network"
import { EndpointSliders, EndpointMenu } from "./Audio"
import { VpnButton, VpnMenu } from "./Vpn"
import { TailscaleButton, TailscaleMenu } from "./Tailscale"
import { AppearanceButton } from "./Appearance"
import { PowerButton } from "./Power"
import { BrightnessSliders } from "./Brightness"

const { TOP, LEFT, BOTTOM, RIGHT } = Astal.WindowAnchor
const { ON_DEMAND } = Astal.Keymode
const { NORMAL, IGNORE } = Astal.Exclusivity
const { VERTICAL } = Gtk.Orientation

const systemMenuName = "system-menu"

export const MenuNames = {
    OVERVIEW: "overview-menu",
    BLUETOOTH: "bluetooth-menu",
    NETWORK: "network-menu",
    SAVED_NETWORKS: "saved-networks-menu",
    APPEARANCE: "appearance-menu",
    VPN: "vpn-menu",
    TAILSCALE: "tailscale-menu",
    ENDPOINT: "endpoint-menu",
} as const

type MenuName = (typeof MenuNames)[keyof typeof MenuNames]

export const [currentView, setCurrentView] = createState<MenuName>(MenuNames.OVERVIEW)

export function transitionTo(menu: MenuName = MenuNames.OVERVIEW) {
    setCurrentView(menu)
}

let menuWin: Gtk.Window | null = null
let backdropWin: Gtk.Window | null = null

const toggle = () => {
    if (menuWin?.get_visible()) {
        menuWin.hide()
        backdropWin?.hide()
    } else {
        menuWin?.show()
        backdropWin?.show()
    }
}

function OverviewMenu() {
    return (
        <box orientation={VERTICAL} spacing={5} $type="named" name={MenuNames.OVERVIEW} class={"overview-menu"}>
            <box homogeneous>
                <box orientation={VERTICAL} spacing={5}>
                    <NetworkButton />
                    <VpnButton />
                    <AppearanceButton />
                </box>
                <box orientation={VERTICAL} spacing={5}>
                    <BluetoothButton />
                    <TailscaleButton />
                    <PowerButton />
                </box>
            </box>
            <Gtk.Separator />
            <EndpointSliders />
            <Gtk.Separator />
            <BrightnessSliders />
        </box>
    )
}

export function SystemMenuBackdrop() {
    return (
        <window
            name={`${systemMenuName}-backdrop`}
            class={`${systemMenuName}-backdrop`}
            application={app}
            layer={Astal.Layer.TOP}
            anchor={TOP | LEFT | BOTTOM | RIGHT}
            keymode={Astal.Keymode.NONE}
            exclusivity={IGNORE}
            $={(self: Astal.Window) => { backdropWin = self }}
        >
            <box
                class={`${systemMenuName}-backdrop`}
                hexpand
                vexpand
                $={self => {
                    const click = new Gtk.GestureClick()
                    click.connect("pressed", () => toggle())
                    self.add_controller(click)
                }}
            />
        </window>
    )
}

export function SystemMenu() {
    const onKeyPressed = (keyval: number) => {
        if (keyval === Gdk.KEY_Escape) toggle()
    }

    return (
        <window
            name={systemMenuName}
            namespace="ags-window"
            class={`${systemMenuName}-window`}
            application={app}
            layer={Astal.Layer.OVERLAY}
            anchor={TOP | RIGHT}
            keymode={ON_DEMAND}
            exclusivity={NORMAL}
            $={(self: Astal.Window) => {
                menuWin = self
                registerRequest(systemMenuName, toggle)
                self.connect("show", () => transitionTo())
                self.set_default_size(-1, -1)
            }}
        >
            <Gtk.EventControllerKey propagationPhase={Gtk.PropagationPhase.CAPTURE} onKeyPressed={(_, keyval) => onKeyPressed(keyval)} />
            <box class={systemMenuName}>
                <stack
                    $={self => {
                        currentView.subscribe(() => self.visibleChildName = currentView.get())
                    }}
                    hhomogeneous={false}
                    vhomogeneous={false}
                    interpolateSize
                >
                    <OverviewMenu />
                    <NetworkMenu />
                    <SavedNetworksMenu />
                    <BluetoothMenu />
                    <VpnMenu />
                    <TailscaleMenu />
                    <EndpointMenu />
                </stack>
            </box>
        </window>
    )
}
