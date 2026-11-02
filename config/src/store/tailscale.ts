
import { createBinding } from "ags";
import GObject, { register, property } from "ags/gobject"
import { execAsync } from "ags/process"
import GLib from "gi://GLib"

import { getTailscaleIconName } from "./iconNames";

type Peer = {
    host: string
    online: boolean
    os: string
    exitNode: boolean
    exitNodeOption: boolean
    ips: string[]
}

@register({ GTypeName: "Tailscale" })
export default class Tailscale extends GObject.Object {
    static #instance: Tailscale
    static get_default() {
        return (this.#instance ??= new Tailscale())
    }

    @property(Boolean) connected = false
    @property(String) hostname =  ""
    @property(String) hostOS = ""
    @property(Array) peers: Peer[] = []

    constructor() {
        super()
        this.#init()
        this.refresh()
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 60_000, () => {
            this.refresh()
            return GLib.SOURCE_CONTINUE
        })
    }

    #init() {
        execAsync(["tailscale", "set", `--operator=${GLib.get_user_name()}`])
        .catch(print)
    }

    #up() {
        execAsync(["tailscale", "up", `--operator=${GLib.get_user_name()}`, "--accept-routes", "--reset"])
        .catch(print)
        .finally(() => this.refresh())
    }

    #down() {
        execAsync(["bash", "-c", "tailscale down"])
        .catch(print)
        .finally(() => this.refresh())
    }

    toggle() { this.connected ? this.#down() : this.#up() }

    toggleExitNode(ip: string, active: boolean) {
        const exitNode = active ? "" : ip
        execAsync(["tailscale", "up", `--operator=${GLib.get_user_name()}`, "--accept-routes", `--exit-node=${exitNode}`])
        .catch(print)
        .finally(() => this.refresh())
    }

    refresh() {
        execAsync(["tailscale", "status", "--json"])
        .then(value => {
            const data = JSON.parse(value)

            this.connected = data.BackendState === "Running"
            this.hostname = data.Self?.HostName
            this.hostOS = data.Self?.OS

            this.peers = Object.values(data.Peer ?? {})
            .map((p: any) => ({
                host: p.HostName,
                online: p.Online,
                os: p.OS,
                exitNode: p.ExitNode,
                exitNodeOption: p.ExitNodeOption,
                ips: p.TailscaleIPs,
            }))

        }).catch(print)
    }
}

export const tailscale = Tailscale.get_default()

export const tailscaleVar = {
    connected: createBinding(tailscale, "connected"),
    hostname: createBinding(tailscale, "hostname"),
    hostOS: createBinding(tailscale, "hostOS"),
    peers: createBinding(tailscale, "peers"),
}

export const tailscaleIconName = tailscaleVar.connected(isConnected => getTailscaleIconName(isConnected))
