
import Gtk from "gi://Gtk?version=4.0"

export function SeparatorLabel({ title } : { title: string}) {
    return (
        <box class={"separator-label"}>
            <Gtk.Separator hexpand valign={Gtk.Align.CENTER}/>
            <label label={title} />
            <Gtk.Separator hexpand valign={Gtk.Align.CENTER}/>
        </box>
    )
}
