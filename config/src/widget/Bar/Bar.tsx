
import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4" 
import Gtk from "gi://Gtk?version=4.0"
import { registerRequest, handleRequest } from "../../../request"

import { 
    BatteryWidget, 
    TimeWidget, 
    WifiWidget, 
    Workspaces, 
    OsWidget, 
    BluetoothWidget, 
    PowerWidget, 
    SunsetWidget,
    TailscaleWidget,
} from "./BarWidgets"

const { EXCLUSIVE } = Astal.Exclusivity
const { TOP , LEFT, RIGHT } = Astal.WindowAnchor
const { CENTER } = Gtk.Align

const barName = "bar"

export function Bar() {

    let win: Gtk.Window | null = null
    const toggle = () => win?.get_visible() ? win.hide() : win?.show()

    return (
        <window
            name={barName}
            namespace="ags-window"
            class={barName}
            exclusivity={EXCLUSIVE}
            anchor={TOP | LEFT | RIGHT}
            margin_top={5}
            application={app}
            $={self => {
                win = self
                self.show()
                registerRequest(barName, toggle)
            }}
        >
            <centerbox class={"bar-box"}>
                <box spacing={5} $type={"start"}>
                    <OsWidget />
                    <Workspaces />
                </box>

                <box $type={"center"}>
                    <TimeWidget />
                </box>

                <box $type={"end"}>
                    <button
                        onClicked={() => handleRequest("system-menu")}
                        class={"system-widgets"}>
                        <box spacing={12} homogeneous>
                            <SunsetWidget />
                            <TailscaleWidget />
                            <BluetoothWidget />
                            <WifiWidget />
                            <BatteryWidget />
                        </box>
                    </button>
                    <PowerWidget />
                </box>
            </centerbox>
        </window>
    )
}
