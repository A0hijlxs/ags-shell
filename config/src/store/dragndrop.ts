
import GObject from "ags/gobject"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"

export function createDragSource(id: number): Gtk.DragSource {
    const dragSource = Gtk.DragSource.new()
    dragSource.set_actions(Gdk.DragAction.MOVE)

    dragSource.connect("prepare", () => {
        const value = new GObject.Value()
        value.init(GObject.TYPE_INT)
        value.set_int(id)
        return Gdk.ContentProvider.new_for_value(value)
    })

    return dragSource
}

export function createDropTarget(currentId: number, onDrop: (sourceId: number) => void): Gtk.DropTarget {
    const dropTarget = Gtk.DropTarget.new(GObject.TYPE_INT, Gdk.DragAction.MOVE)

    dropTarget.connect("drop", (_target, value) => {

        const sourceId = value as unknown as number
        if (sourceId !== currentId) {
            onDrop(sourceId)
        }
        return true
    })

    return dropTarget
}
