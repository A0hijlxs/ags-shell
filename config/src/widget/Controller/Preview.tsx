
import { apps } from "../../store/apps"
import Gtk from "gi://Gtk?version=4.0"
import Hyprland from "gi://AstalHyprland"
import AstalApps from "gi://AstalApps"
import { isWorkspaceFocused, workspaceClients, getWorkspaceMonitor } from "../../store/hyprland"
import { createDragSource, createDropTarget } from "../../store/dragndrop"

const { START, CENTER } = Gtk.Align

// apps.fuzzy_query() expects a short typed query matched against longer app
// fields, and rejects any query longer than the field it's checked against
// (AstalApps' fuzzy matcher: `str.length < pattern.length` -> no match). A
// window class like "md.obsidian.Obsidian" is longer than the app name
// "Obsidian", so it never matches. Resolving class -> app needs the opposite
// direction: does the class *contain* the app's name or StartupWMClass.
function findAppForClass(wmClass: string): AstalApps.Application | undefined {
    const cls = wmClass.toLowerCase()
    return apps.list.find(a => a.wmClass && cls.includes(a.wmClass.toLowerCase()))
        ?? apps.list.find(a => cls.includes(a.name.toLowerCase()))
        ?? apps.fuzzy_query(wmClass)[0]
}

function getAppIcon(wmClass: string) {
    return findAppForClass(wmClass)?.iconName || "window-close-symbolic"
}

function createDragIcon(self: Gtk.Widget, w:number, h: number) {
    const widgetPaintable = new Gtk.WidgetPaintable()
    widgetPaintable.set_widget(self)
    const staticImage = widgetPaintable.get_current_image()

    const snapshot = new Gtk.Snapshot()
    staticImage.snapshot(snapshot, w, h)

    return snapshot.to_paintable(null)
}

function getPreviewSize(ws_id: number) {
    const monitor = getWorkspaceMonitor(ws_id)
    const scale = monitor.scale ?? 1
    const ratio = 12
    return {
        sizeX: monitor.width / ratio,
        sizeY: monitor.height / ratio,
        scaleX: (monitor.width / ratio) / (monitor.width / scale),
        scaleY: (monitor.height / ratio) / (monitor.height / scale),
    }
}

export function PreviewBox({ ws_id }: { ws_id: number }) {

    const isFocused = isWorkspaceFocused(ws_id)
    const clientsInWs = workspaceClients.inWorkspace(ws_id)

    const { sizeX, sizeY, scaleX, scaleY } = getPreviewSize(ws_id)

    return (
        <overlay
            css-classes={isFocused(f => ["preview-box", f ? "focused" : ""])}
            $={self => {
                self.set_child(<box widthRequest={sizeX} heightRequest={sizeY} class={"wallpaper"} />)

                let clientOverlays: Gtk.Widget[] = []

                function renderClients(clients: Hyprland.Client[]) {
                    for (const w of clientOverlays) self.remove_overlay(w)

                    clientOverlays = clients.map(client => {
                        const { x, y, width, height } = client
                        const scaledX = Math.round(x * scaleX) + 2
                        const scaledY = Math.round(y * scaleY) + 2
                        const scaledW = Math.round(width * scaleX) - 4
                        const scaledH = Math.round(height * scaleY) - 4
                        const iconSize = Math.min(scaledH, scaledW) * 0.5

                        const w = <box
                            class={"client-preview"}
                            halign={START}
                            valign={START}
                            widthRequest={scaledW}
                            heightRequest={scaledH}
                            margin-start={scaledX}
                            margin-top={scaledY}
                        >
                            <box halign={CENTER} valign={CENTER} hexpand vexpand>
                                <image iconName={getAppIcon(client.class)} pixelSize={iconSize}/>
                            </box>
                        </box> as Gtk.Widget

                        self.add_overlay(w)
                        return w
                    })
                }

                renderClients(clientsInWs.peek())
                clientsInWs.subscribe(() => renderClients(clientsInWs.peek()))

                const dragSource = createDragSource(ws_id)
                const dropTarget = createDropTarget(ws_id, (sourceId) => {
                    workspaceClients.swapClients(sourceId, ws_id)
                })

                dropTarget.connect("enter", () => { self.add_css_class("hovered") })
                dropTarget.connect("leave", () => { self.remove_css_class("hovered") })
                dropTarget.connect("drop", () => { self.remove_css_class("hovered") })

                dragSource.connect("drag-begin", () => {
                    self.add_css_class("snapshot-glow")
                    const dragIcon = createDragIcon(self, sizeX / 2, sizeY / 2)
                    dragSource.set_icon(dragIcon, sizeX / 4, sizeY / 4)
                    self.remove_css_class("snapshot-glow")
                })

                self.add_controller(dropTarget)
                self.add_controller(dragSource)
            }}
        />
    )
}
