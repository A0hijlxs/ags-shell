
import app from "ags/gtk4/app";
import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import { Astal } from "ags/gtk4";
import { createComputed } from "ags";

import { workspaceClients, sortedWorkspaces, switchWorkspace, focusedWorkspace  } from "../../store/hyprland";
import { PreviewBox } from "./Preview";
import { focusWorkspace } from "../../store/hypr";
import { AutoGrid } from "../Common/Grid";
import { registerRequest } from "../../../request";
import { privacyModeActive } from "../../store/privacy";
import AstalHyprland from "gi://AstalHyprland?version=0.1";

const { EXCLUSIVE } = Astal.Keymode
const { IGNORE } = Astal.Exclusivity
const { CENTER } = Gtk.Align
const { OVERLAY } = Astal.Layer
const { VERTICAL } = Gtk.Orientation
const { TOP, LEFT, BOTTOM, RIGHT } = Astal.WindowAnchor

const controllerName = "controller"

function WorkspaceBox( {ws} : {ws : AstalHyprland.Workspace} ) {
    return (
        <box
            orientation={VERTICAL}
            class={"workspace-item"}
            $={self => {
                const rightClick = new Gtk.GestureClick()
                rightClick.set_button(3)
                rightClick.connect("pressed", () => {
                    workspaceClients.clearWorkspace(ws.id)
                })
                self.add_controller(rightClick)
            }}
        >
            <PreviewBox ws_id={ws.id} />
            <label
                label={privacyModeActive(privacy => privacy ? "1" : `${ws.id}`)}
                class={"workspace-label"}
                halign={CENTER}
                $={self => {
                    const click = new Gtk.GestureClick()
                    click.connect("pressed", () => {
                        ws.id !== focusedWorkspace.get().id && focusWorkspace(ws.id)
                    })
                    self.add_controller(click)
                }}
            />
        </box>
    )
}

export function Controller() {

    let win: Gtk.Window | null = null
    const toggle = () => win?.get_visible() ? win.hide() : win?.show()

    const visibleWorkspaces = createComputed(
        [sortedWorkspaces, focusedWorkspace, privacyModeActive],
        (all, focused, privacy) => privacy ? all.filter(ws => ws.id === focused?.id) : all
    )

    const onKeyPressed = (keyval: number) => {
        if (keyval === Gdk.KEY_Escape) toggle()
        else if (keyval === Gdk.KEY_Left) switchWorkspace(-1)
        else if (keyval === Gdk.KEY_Right) switchWorkspace(1)
        else if (keyval === Gdk.KEY_BackSpace) workspaceClients.clearWorkspace(focusedWorkspace.get().id)
    }

    return (
        <window
            name={controllerName}
            namespace="ags-window"
            class="controller-window"
            application={app}
            layer={OVERLAY}
            keymode={EXCLUSIVE}
            exclusivity={IGNORE}
            anchor={TOP | LEFT | BOTTOM | RIGHT}
            $={self => {
                win = self
                self.connect("show", () => self.queue_resize())
                self.set_default_size(-1, -1)
                registerRequest(controllerName, toggle)
            }}
        >
            <Gtk.EventControllerKey onKeyPressed={(_, keyval) => onKeyPressed(keyval)} />

            <overlay>
                {/*
                  Click-to-close backdrop. Lives as a sibling of the content
                  box (via $type="overlay" -> Gtk.Overlay.add_overlay), not an
                  ancestor of it - a press on the content hit-tests to the
                  content and never reaches this gesture, so unlike a claim on
                  an ancestor controller, it doesn't need to (and must not)
                  swallow the sequence to keep out of the way. Claiming there
                  denied the sequence to every controller further down the
                  tree, including PreviewBox's drag source/drop target and the
                  workspace right-click/label-click gestures.
                */}
                <box
                    hexpand
                    vexpand
                    $={self => {
                        const click = new Gtk.GestureClick()
                        click.connect("pressed", toggle)
                        self.add_controller(click)
                    }}
                />
                <box
                    $type="overlay"
                    halign={CENTER}
                    valign={CENTER}
                    class={controllerName}
                >
                    <AutoGrid
                        each={visibleWorkspaces}
                        perRow={4}
                        render={(ws) => <WorkspaceBox ws={ws} />}
                    />
                </box>
            </overlay>
        </window>
    )
}
