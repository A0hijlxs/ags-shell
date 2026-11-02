
import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4"
import Gtk from "gi://Gtk?version=4.0"
import { NotificationBox } from "./Notification"
import { Notifications, NotifCount } from "../../store/notifd"
import { privacyModeActive } from "../../store/privacy"
import { createComputed, For } from "ags"

const { TOP, RIGHT } = Astal.WindowAnchor
const { VERTICAL } = Gtk.Orientation

const notificationWindowName = "notification-window"

export function NotificationDaemon() {

    return (
        <window
            application={app}
            anchor={TOP | RIGHT}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            name={notificationWindowName}
            namespace="ags-window"
            class={notificationWindowName}
            visible={createComputed([NotifCount, privacyModeActive], (n, privacy) => n > 0 && !privacy)}
            widthRequest={300}
        >   
            <box spacing={5} orientation={VERTICAL} >
                <For each={Notifications}>
                    {(n) => <NotificationBox n={n} />}
                </For>
            </box>
        </window>
    )
}
