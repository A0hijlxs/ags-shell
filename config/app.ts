import style from "./src/scss/main.scss"

import app from "ags/gtk4/app"
import { setupWallpaper } from "./wallpaper"
import { BrightnessAlert, VolumeAlert, MicAlert, BatteryAlert, KbdBrightnessAlert, PrivacyModeAlert, SunsetAlert } from "./src/widget/Alerts/Alerts"
import { Bar } from "./src/widget/Bar/Bar"
import { LogoutMenu } from "./src/widget/Logout/Logout"
import { Launcher } from "./src/widget/Launcher/Launcher"
import { NotificationDaemon } from "./src/widget/Notifications/NotifDaemon"
import { Controller } from "./src/widget/Controller/Controller"
import { SystemMenu, SystemMenuBackdrop } from "./src/widget/Menu/SystemMenu"
import { ScreenCapture } from "./src/widget/ScreenCapture/ScreenCapture"

import { handleRequest } from "./request";
import { registerHyprland } from "./src/store/hypr"

app.start({
    icons: "./src/icons",
    css: style,
    main() {
        setupWallpaper()
        registerHyprland()
        print("init")
        Bar()
        Launcher()
        LogoutMenu()
        VolumeAlert()
        BrightnessAlert()
        KbdBrightnessAlert()
        MicAlert()
        BatteryAlert()
        PrivacyModeAlert()
        SunsetAlert()
        NotificationDaemon()
        Controller()
        SystemMenuBackdrop()
        SystemMenu()
        ScreenCapture()
    },

    requestHandler(request, res) {
        res(handleRequest(request))
    }
})
