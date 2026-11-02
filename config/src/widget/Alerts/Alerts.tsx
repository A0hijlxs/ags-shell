
import app from "ags/gtk4/app";
import { Astal } from "ags/gtk4"
import Gtk from "gi://Gtk?version=4.0"
import GLib from "gi://GLib"
import { Accessor, createComputed } from "ags";
import { execAsync } from "ags/process";

import { screenBrightness, brightnessIconName } from "../../store/brightness";
import { kbdBrightness, kbdBrightnessIconName } from "../../store/brightness";
import { speakerVar, speakerIconName, micVar, micIconName, MAX_VOLUME } from "../../store/wireplumber";
import { battery, batteryVar, batteryIconName } from "../../store/battery";
import { privacyModeActive } from "../../store/privacy";
import { sunsetActive } from "../../store/hyprsunset";

const { VERTICAL } = Gtk.Orientation
const { BOTTOM } = Astal.WindowAnchor
const { OVERLAY } = Astal.Layer
const { START, CENTER } = Gtk.Align

const VolumeAlertName = "volumeAlert"
const MicrophoneAlertName = "microphoneAlert"
const BrightnessAlertName = "brightnessAlert"
const KbdBrightnessAlertName = "kbdBrightnessAlert"
const PrivacyModeAlertName = "privacyModeAlert"
const SunsetAlertName = "sunsetAlert"

const TIMEOUT_DELAY = 5000

type AlertProps = {
    iconName: Accessor<string>,
    label: string | Accessor<string>,
    sliderValue?: Accessor<number>,
    windowName: string
}

function AlertWindow(props: AlertProps) {
    const { iconName, label, sliderValue, windowName } = props
    
    let windowVisibilityTimeout: GLib.Source | null = null

    function showAlert(self: Gtk.Window) {

        if (windowVisibilityTimeout) {
            windowVisibilityTimeout.destroy();
        }

        self.visible = true;

        windowVisibilityTimeout = setTimeout(() => {
            self.visible = false;
            windowVisibilityTimeout?.destroy();
            windowVisibilityTimeout = null;
        }, 1_500);
    }

    return <window
        monitor={0}
        name={windowName}
        namespace="ags-window"
        application={app}
        anchor={BOTTOM}
        layer={OVERLAY}
        class={"alert-window"}
        margin_bottom={100}
        $={self => {
            setTimeout(() => {
                sliderValue?.subscribe(() => showAlert(self))
                iconName.subscribe(() => showAlert(self))
            }, TIMEOUT_DELAY)
        }}>

        <box spacing={10}>
            <image iconName={iconName} class={"alertIcon"} />
            <box spacing={5} valign={CENTER} orientation={VERTICAL} class={"alertContent"} >
                <label label={label} halign={START} />
                {sliderValue && <slider class={"alertProgress"} value={sliderValue} hexpand />}
            </box>
        </box>
    </window>
}

export function VolumeAlert() {
    const normalizedVolume = createComputed([speakerVar.volume], v => v / MAX_VOLUME)
    return (
        <AlertWindow
            iconName={speakerIconName}
            label="Volume"
            sliderValue={normalizedVolume}
            windowName={VolumeAlertName}/>
    )
}

export function MicAlert() {
    return (
        <AlertWindow
            iconName={micIconName}
            label="Microphone"
            sliderValue={micVar.volume}
            windowName={MicrophoneAlertName}/>
    )
}

export function BrightnessAlert() {    
    return (
        <AlertWindow
            iconName={brightnessIconName}
            label="Brightness"
            sliderValue={screenBrightness}
            windowName={BrightnessAlertName}/>
    )
}

export function KbdBrightnessAlert() {
    return (
        <AlertWindow
            iconName={kbdBrightnessIconName}
            label="Keyboard"
            sliderValue={kbdBrightness}
            windowName={KbdBrightnessAlertName}/>
    )
}

export function PrivacyModeAlert() {
    const iconName = privacyModeActive(active => active ? "plump-incognito-symbolic" : "plump-incognito-off-symbolic")
    const label = privacyModeActive(active => active ? "Incognito On" : "Incognito Off")

    return (
        <AlertWindow
            iconName={iconName}
            label={label}
            windowName={PrivacyModeAlertName}/>
    )
}

export function SunsetAlert() {
    const iconName = sunsetActive(active => active ? "night-mode-symbolic" : "night-mode-off-symbolic")
    const label = sunsetActive(active => active ? "Night Light On" : "Night Light Off")

    return (
        <AlertWindow
            iconName={iconName}
            label={label}
            windowName={SunsetAlertName}/>
    )
}

export function BatteryAlert() {

    function sendNotification(summary: string, urgency: string) {
        const percent = Math.floor(battery.percentage * 100)
        const icon = batteryIconName.get()
        execAsync(["notify-send", "-u", urgency, "-a", "System", "-n", icon, summary, `${percent}% Remaining`])
    }

    const levels = [
        { level: 20, low: true,  title: "Battery Low",            urgency: "critical", armed: true },
        { level: 10, low: true,  title: "Battery Critically Low", urgency: "critical", armed: true },
        { level: 5,  low: true,  title: "Battery Critically Low", urgency: "critical", armed: true },
        { level: 90, low: false, title: "Battery Nearly Full",    urgency: "normal",   armed: true },
    ]

    let previous = Math.floor(battery.percentage * 100)

    batteryVar.percent.subscribe(() => {
        const p = Math.floor(battery.percentage * 100)

        for (const l of levels) {
            const crossed = l.low ? previous > p && p <= l.level : previous < p && p >= l.level

            if (crossed && l.armed) {
                sendNotification(l.title, l.urgency)
                l.armed = false
            }

            const movedAway = l.low ? p >= l.level + 3 : p <= l.level - 3

            if (movedAway && !l.armed) l.armed = true
        }

        previous = p
    })

    batteryVar.isCharging.subscribe(() => {
        if (battery.charging) {setTimeout(() => {sendNotification("Charging", "low")}, 100)}
    })
}
