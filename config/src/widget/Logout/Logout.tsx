
import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import { execAsync } from "ags/process"
import { exit } from "../../store/hypr"
import { registerRequest } from "../../../request"
import { miscIconNames } from "../../store/iconNames"

const { IGNORE } = Astal.Exclusivity
const { EXCLUSIVE } = Astal.Keymode
const { TOP, LEFT, BOTTOM, RIGHT } = Astal.WindowAnchor
const { CENTER } = Gtk.Align
const { VERTICAL } = Gtk.Orientation

const logoutName = "logout"

let win: Gtk.Window | null = null
let contentBox: Gtk.Widget | null = null

const toggle = () => win?.get_visible() ? win.hide() : win?.show()

export function LogoutMenu() {
    const commands = [
        { label: "Lock", command: "hyprlock", icon: miscIconNames.lock },
        { label: "Logout", command: exit, icon: miscIconNames.logout },
        { label: "Suspend", command: "systemctl suspend", icon: miscIconNames.suspend },
        { label: "Hibernate", command: "systemctl hibernate", icon: miscIconNames.hibernate },
        { label: "Shutdown", command: "shutdown now", icon: miscIconNames.shutdown },
        { label: "Reboot", command: "reboot", icon: miscIconNames.reboot }
    ]

    function onKeyPress(keyval: number) {
        if (keyval === Gdk.KEY_Escape) toggle()
    }

    function ActionButton({ label, icon, command }: typeof commands[number]) {
        return (
            <button onClicked={() => {
                typeof command === "string" ? execAsync(command) : command()
                toggle()
                }}>

                <box orientation={VERTICAL} valign={CENTER}>
                    <image iconName={icon} class={"icon"} />
                    <label label={label} class={"text"} />
                </box>
            </button>
        )
    }

    const rows = [commands.slice(0, 3), commands.slice(3, 6)]

    return (
        <window
            name={logoutName}
            namespace="ags-window"
            class={`${logoutName}-window`}
            application={app}
            layer={Astal.Layer.OVERLAY}
            keymode={EXCLUSIVE}
            exclusivity={IGNORE}
            anchor={TOP | LEFT | BOTTOM | RIGHT}
            $={self => {
                win = self
                registerRequest(logoutName, toggle)
                const click = new Gtk.GestureClick()
                click.connect("pressed", (g, n, x, y) => {
                    const picked = win?.pick(x, y, Gtk.PickFlags.DEFAULT)
                    const inside = picked && contentBox && (picked === contentBox || picked.is_ancestor(contentBox))
                    if (!inside) toggle()
                })
                self.add_controller(click)
            }}
        >
            <Gtk.EventControllerKey onKeyPressed={(_, keyval) => onKeyPress(keyval)} />

            <box
                class={logoutName}
                halign={CENTER}
                valign={CENTER}
                orientation={VERTICAL}
                $={self => { contentBox = self }}
            >
                {rows.map((row) => (
                    <box>
                        {row.map(cmd => <ActionButton {...cmd} />)}
                    </box>
                ))}
            </box>
        </window>
    )
}
