
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4"
import { For } from "ags"

import { Oracle } from "./Sources"
import { registerRequest } from "../../../request"

const { IGNORE } = Astal.Exclusivity
const { EXCLUSIVE } = Astal.Keymode
const { CENTER } = Gtk.Align
const { TOP, LEFT, BOTTOM, RIGHT } = Astal.WindowAnchor
const { VERTICAL } = Gtk.Orientation

const launcherName = "launcher"

let win: Gtk.Window | null = null
let contentBox: Gtk.Widget | null = null
const toggle = () => win?.get_visible() ? win.hide() : win?.show()

const onShow = () => {
    Oracle.setSelectedSource(0)
    Oracle.clear()
    Oracle.reloadAll()
    searchEntry?.grab_focus()
}

function onKeyPress(keyval: number): boolean {
    if (keyval === Gdk.KEY_Escape) { toggle(); return true }
    if (keyval === Gdk.KEY_Up) { Oracle.switchItem(-1); return true }
    if (keyval === Gdk.KEY_Down) { Oracle.switchItem(1); return true }
    if (keyval === Gdk.KEY_Tab) { Oracle.switchSource(1); searchEntry?.grab_focus(); return true }
    return false
}

function Source() {
    return (
        <button class={"source"} label={Oracle.selectedSource(s => Oracle.sources[s].name)} />
    )
}

let searchEntry: Gtk.Entry | null = null
function Entry() {
    return (
        <entry
            hexpand
            buffer={Oracle.searchBuffer}
            placeholderText="Search..."
            onActivate={() => Oracle.launchSelected()}
            $={self => searchEntry = self}
        />
    )
}

function Results() {
    return (
        <box orientation={VERTICAL} spacing={6}>
            <For each={Oracle.pageItems}>
                {({item, isSelected}) => Oracle.sources[Oracle.selectedSource.get()].render(item, isSelected)}
            </For>
        </box>
    )
}

function NotFound() {
    return (
        <box
            orientation={VERTICAL}
            visible={Oracle.allItems(r => r.length === 0)}
        >
            <image iconName="system-search-symbolic" />
            <label label="No Match Found" />
        </box>
    )
}


export function Launcher() {
    return (
        <window
            name={launcherName}
            namespace="ags-window"
            class={launcherName}
            application={app}
            layer={Astal.Layer.OVERLAY}
            keymode={EXCLUSIVE}
            exclusivity={IGNORE}
            anchor={TOP | LEFT | BOTTOM | RIGHT}
            $={self => {
                win = self
                self.connect("show", onShow)
                registerRequest(launcherName, toggle)
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
                widthRequest={420}
                orientation={VERTICAL}
                class={"launcher-content"}
                halign={CENTER}
                valign={CENTER}
                $={self => { contentBox = self }}
            >
                <box orientation={VERTICAL} spacing={12}>
                    <box spacing={10}>
                        <Entry />
                        <Source />
                    </box>
                    <Results />
                    <NotFound />
                </box>
            </box>
        </window>
    )
}
