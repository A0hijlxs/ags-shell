import Notifd from "gi://AstalNotifd"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import GLib from "gi://GLib?version=2.0"

const { VERTICAL } = Gtk.Orientation

function truncate(text: string, maxLength: number = 30) : string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3).trimEnd() + "..."
}

const { END } = Gtk.Align

const time = (time: number, format = "%H:%M") => GLib.DateTime
    .new_from_unix_local(time)
    .format(format)!

const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!)
const isIcon = (name: string | null) => name && iconTheme.has_icon(name)
const fileExists = (path: string | null) => path && GLib.file_test(path, GLib.FileTest.EXISTS)

export function NotificationBox({ n } : { n: Notifd.Notification}) {
    const icon = n.appIcon?.replace("file://", "")

    return (
        <box 
            class={"notification"} 
            spacing={6}
            orientation={VERTICAL} 
        >
            <box class={"header"} spacing={6} >
                {fileExists(icon) && <image file={icon} />}
                
                <label 
                    label = {n.appName || "Unkown"} />
                <label 
                    hexpand
                    halign={END} 
                    label = {time(n.time)} />
                <button 
                    iconName="window-close-symbolic" 
                    onClicked={() => n.dismiss()} />
            </box>

            <Gtk.Separator visible />

            <box class={"content"} spacing={6} >
                {fileExists(n.image) && <image class={"image"} file={n.image} />}
                {isIcon(n.appIcon) && <image class={"image"} iconName={n.appIcon} />}
                <box orientation={VERTICAL}>       
                    {n.summary && <label 
                        xalign={0} 
                        class={"summary"} 
                        label={truncate(n.summary, 35)} 
                        maxWidthChars={0}
                        hexpand
                        wrap
                    />}
                    {n.body && <label 
                        xalign={0} 
                        class={"body"} 
                        label={truncate(n.body, 50)} 
                        maxWidthChars={0}
                        hexpand
                        wrap
                    />}
                </box>
            </box>
        </box>
    )
}
