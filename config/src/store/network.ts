
import { execAsync, exec } from "ags/process"
import { createBinding, createComputed, createState } from "ags"
import GObject, { register, property } from "ags/gobject"
import Network from "gi://AstalNetwork"
import { getNetworkIconName, getVpnIconName } from "./iconNames"


@register({ GTypeName: "NetworkStore" })
export default class NetworkStore extends GObject.Object {
    @property(Array)  active:        string[] = []
    @property(Array)  inactive:      string[] = []
    @property(Array)  inRange:       Network.AccessPoint[] = []
    @property(Array)  activeVpn:     string[] = []
    @property(Array)  inactiveVpn:   string[] = []
    @property(String) vpnImportMessage = "Add VPN Config"

    constructor() {
        super()
        this.#update()
        network.wifi?.connect("notify::enabled", self => {
            if (!self.enabled) {this.inRange = []}
        })
    }

    async #update() {
        await this.#fetchActive()
        await this.#fetchInactive()
        await this.#fetchInRange()
    }

    async #fetchActive() {
        return execAsync(["bash", "-c", "nmcli -t -f NAME,TYPE connection show --active"])
        .then((value) => {
            if (typeof value !== "string") return

                this.active = value
                .split("\n")
                .filter((line) => line.includes("802-11-wireless"))
                .map((line) => line.split(":")[0].trim())

                this.activeVpn = value
                .split("\n")
                .filter((line) => line.includes("vpn") || line.includes("wireguard"))
                .map((line) => line.split(":")[0].trim())
        })
        .catch((error) => print("fetchActive() : " + error))
    }

    async #fetchInactive() {
        return execAsync(["bash", "-c", "nmcli -t -f NAME,TYPE connection show"])
        .then((value) => {
            if (typeof value !== "string") return

                this.inactive = value
                .split("\n")
                .filter((line) => line.includes("802-11-wireless"))
                .map((line) => line.split(":")[0].trim())
                .filter((line) => !this.active.includes(line))

                this.inactiveVpn = value
                .split("\n")
                .filter((line) => line.includes("vpn") || line.includes("wireguard"))
                .map((line) => line.split(":")[0].trim())
                .filter((line) => !this.activeVpn.includes(line))
        })
        .catch((error) => print("fetchInactive() : " + error))
    }

    async #fetchInRange() {
        const seen = new Set<string>()

        this.inRange = (network.wifi?.accessPoints ?? [])
        .filter(ap => {
            if (seen.has(ap.ssid)) return false
                seen.add(ap.ssid)
            return true
        })
        .filter(ap => ap.ssid && !this.active.includes(ap.ssid))
        .sort((a, b) => b.strength - a.strength)
    }

    connectKnown(ssid: string) {
        execAsync(["bash", "-c", `nmcli connection up "${ssid}"`])
        .catch((error) => print("connectKnown() : " + error))
        .finally(() => this.#update())
    }

    connectNew(ssid: string, password: string) {
        execAsync(["nmcli", "device", "wifi", "connect", ssid, "password", password])
        .catch((error) => print("connectNew() : " + error))
        .finally(() => this.#update())
    } 

    deactivate(ssid: string) {
        execAsync(["bash", "-c", `nmcli connection down "${ssid}"`])
        .catch((error) => print("deactivate() : " + error))
        .finally(() => this.#update())
    }

    remove(ssid: string) {
        execAsync(["bash", "-c", `nmcli connection delete "${ssid}"`])
        .catch((error) => print("remove() : " + error))
        .finally(() => this.#update())
    }

    showPassword(ssid :string) {
        try {
            const value = exec(["bash", "-c", `nmcli -s -g 802-11-wireless-security.psk connection show "${ssid}"`])
            return value || null
        } catch { return null }
    }

    disconnectVpns() {
        this.activeVpn.forEach(vpn => {this.deactivate(vpn)})
    }

    connectVpn(name: string) {
        this.disconnectVpns()
        this.connectKnown(name)
    }

    addVpn(path: string, type: "openvpn" | "wireguard") {
        const filename = path?.split("/").pop()
        const name = filename?.replace(/\.(conf|ovpn)$/, "")

        if (!name) {
            this.vpnImportMessage = "Invalid file path"
        } else {
            execAsync(["bash", "-c", `nmcli connection import type ${type} file "${path}"`])
            .then(() => execAsync(["bash", "-c", `nmcli connection modify ${name} connection.autoconnect no`]))
            .then(() => {this.vpnImportMessage = "Import Successful"})
            .catch(() => {this.vpnImportMessage = "Import Failed"})
            .finally(() => {this.#update()})
        }
        setTimeout(() => this.vpnImportMessage = "Add VPN Config", 3000)
    }

    async scan() {
        return new Promise<void>(resolve => {
            const id = network.wifi.connect("notify::scanning", () => {
                if (network.wifi.scanning) return
                    network.wifi.disconnect(id)
                resolve()
            })

            network.wifi.scan()
        }).then(() => this.#update())
    }
}

export const network = Network.get_default();

export const Networks = new NetworkStore()

export function toggleWifi() {
    const wifi = network.wifi
    if (wifi) wifi.set_enabled(!wifi.enabled)
}

export const networkState = {
    currentAP: network.wifi ? createBinding(network.wifi, "activeAccessPoint") : createState(null)[0],
    enabled: network.wifi ? createBinding(network.wifi, "enabled") : createState(false)[0],
    activeVpn: createBinding(Networks, "activeVpn"),
    inactiveVpn: createBinding(Networks, "inactiveVpn"),
    active: createBinding(Networks, "active"),
    inactive: createBinding(Networks, "inactive"),
    inRange: createBinding(Networks, "inRange"),
}

export const networkIconName = createComputed([
    createBinding(network, "primary"),
    createBinding(network, "connectivity"),
    ...(network.wifi ? [
        createBinding(network.wifi, "internet"),
        createBinding(network.wifi, "enabled"),
        createBinding(network.wifi, "activeAccessPoint"),
    ] : []),
    ...(network.wired ? [
        createBinding(network.wired, "internet"),
    ] : []),
], () => getNetworkIconName(network))


export const vpnIconName = createBinding(Networks, "activeVpn")(aV => getVpnIconName(!aV.length))

// execAsync(["bash", "-c", "nmcli -t -f SSID,SIGNAL device wifi list"])
