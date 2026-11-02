import Network from "gi://AstalNetwork"
import Bluetooth from "gi://AstalBluetooth"
import Wp from "gi://AstalWp"
import { MAX_VOLUME } from "./wireplumber"

export const miscIconNames = {
    nixos: "nixos-blue",
    arch: "mdi-arch-symbolic",
    nightmode: "night-mode-symbolic",
    network: "lucide-network-symbolic",
    bluetooth: "bluetooth-device-symbolic",
    selected: "tick-symbolic",
    openvpn: "fi-openvpn-symbolic",
    wireguard: "si-wireguard-symbolic",
    vpn: "mdi-vpn-symbolic",
    shutdown: "fa6-shutdown-symbolic",
    reboot: "fa6-reboot-symbolic",
    logout: "fa6-logout-symbolic",
    hibernate: "fluent-pause-symbolic",
    lock: "uis-lock-symbolic",
    suspend: "carbon-sleep-symbolic",
    dot: "octicon-dot-fill-symbolic",
    route: "solar-route-symbolic",
    display: "ms-display-symbolic",
    window: "ms-screen-symbolic",
    area: "fluent-crop-symbolic",
} as const

function wifiStrengthBand(strength: number): 1 | 2 | 3 | 4 {
    if (strength <= 25) return 1
    if (strength <= 50) return 2
    if (strength <= 75) return 3
    return 4
}

export function getAccessPointIconName(strength: number, flags: number) {
    const band = wifiStrengthBand(strength)
    return flags ? `mdi-wifi-${band}-lock-symbolic` : `mdi-wifi-${band}-symbolic`
}

const { CONNECTED, CONNECTING, DISCONNECTED } = Network.Internet
const { WIRED } = Network.Primary
const { PORTAL, LIMITED } = Network.Connectivity

export function getNetworkIconName(network: Network.Network) {
    const { primary, connectivity, wifi, wired } = network

    if (primary === WIRED && wired?.internet === CONNECTED)
        return "mdi-ethernet-symbolic"

    if (wifi) {
        if (!wifi.enabled) return "mdi-wifi-off-symbolic"

        const ap = wifi.activeAccessPoint
        if (!ap) return "mdi-wifi-0-symbolic"

        const band = wifiStrengthBand(ap.strength)

        if (wifi.internet === CONNECTED) {
            if (connectivity === PORTAL || connectivity === LIMITED)
                return `mdi-wifi-${band}-alert-symbolic`
            return `mdi-wifi-${band}-symbolic`
        }
        if (wifi.internet === CONNECTING) return `mdi-wifi-${band}-lock-symbolic`
    }

    return "mdi-wifi-off-symbolic"
}

export function getTailscaleIconName(isConnected: boolean) {
    return isConnected ? "tailscale-on-symbolic" : "tailscale-off-symbolic"
}

export function getVpnIconName(isConnected: boolean) {
    return isConnected ? "msl-vpn-symbolic" : "carbon-vpn-symbolic"
}

export function getBrightnessIconName(value: number) {
    if (value <= 0.25) return "mdi-brightness-0-symbolic"
    else if (value <= 0.5) return "mdi-brightness-1-symbolic"
    else if (value <= 0.75) return "mdi-brightness-2-symbolic"
    else return "mdi-brightness-3-symbolic"
}

export function getKbdBrightnessIconName(value: number) {
    if (value === 0) return "ms-backlight-0-symbolic"
    else if (value <= 0.5) return "ms-backlight-1-symbolic"
    else return "ms-backlight-2-symbolic"
}

function batteryLevel(percent: number): number {
    if (percent <= 0.05) return 0
    if (percent <= 0.1)  return 1
    if (percent <= 0.2)  return 2
    if (percent <= 0.3)  return 3
    if (percent <= 0.4)  return 4
    if (percent <= 0.5)  return 5
    if (percent <= 0.6)  return 6
    if (percent <= 0.7)  return 7
    if (percent <= 0.8)  return 8
    if (percent <= 0.9)  return 9
    return 10
}

export function getBatteryIconName(percent: number, isCharging: boolean) {
    const level = batteryLevel(percent)
    const prefix = isCharging ? "mdi-battery-charging" : "mdi-battery"
    return `${prefix}-${level}-symbolic`
}

export function getBluetoothBatteryIconName(percent: number) {
    if (percent <= 0) return "mdi-battery-alert-bluetooth-symbolic"
    return `mdi-battery-${batteryLevel(percent)}-bluetooth-symbolic`
}

export function getVolumeIconName(speaker?: Wp.Endpoint) {
    const volume = speaker?.volume
    const muted = speaker?.mute
    const speakerIcon = speaker?.icon

    if (volume == null || speakerIcon == null) return ""

    if (speakerIcon.includes("bluetooth") || speakerIcon.includes("headset")) {
        if (volume === 0 || muted) return "myna-headphones-off-symbolic"
        else return "myna-headphones-symbolic"

    } else {
        if (volume === 0 || muted) return "fa-volume-0-symbolic"
        else if (volume < MAX_VOLUME * 0.33) return "fa-volume-1-symbolic"
        else if (volume < MAX_VOLUME * 0.66) return "fa-volume-2-symbolic"
        else return "fa-volume-3-symbolic"
    }
}

export function getMicrophoneIconName(mic?: Wp.Endpoint): string {
    const volume = mic?.volume
    const muted = mic?.mute
    const micIcon = mic?.icon

    if (volume == null || micIcon == null) return ""

    if (micIcon.includes("bluetooth") || micIcon.includes("headset")) {
        if (volume === 0 || muted) return "myna-headphones-off-symbolic"
        else return "myna-headphones-symbolic"

    } else {
        if (volume === 0 || muted) return "eva-mic-off-symbolic"
        else return "eva-mic-symbolic"
    }
}

export function getBluetoothIconName(bt: Bluetooth.Bluetooth) {
    if (!bt.isPowered) return "charm-bluetooth-off-symbolic"
    if (bt.adapter?.discovering) return "charm-bluetooth-searching-symbolic"
    if (bt.isConnected) return "charm-bluetooth-connected-symbolic"
    return "charm-bluetooth-symbolic"
}
