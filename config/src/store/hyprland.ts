
import { Accessor, createBinding, createComputed, createState, Setter } from "ags"
import GObject, { register, property, getter } from "ags/gobject"
import Hyprland from "gi://AstalHyprland"
import { closeClient, focusWorkspace, moveClientSilently } from "./hypr"

// Access the singleton Hyprland instance
export const hyprland = Hyprland.get_default()

// Reactive bindings to core Hyprland state
export const workspaces = createBinding(hyprland, "workspaces")
export const sortedWorkspaces = workspaces(wss =>
    wss.filter(ws => !(ws.id >= -99 && ws.id <= -2)).sort((a, b) => a.id - b.id)
)
export const focusedWorkspace = createBinding(hyprland, "focusedWorkspace")


// Workspace ID → array of clients in that workspace
@register({ GTypeName: "WorkspaceClients" })
class WorkspaceClients extends GObject.Object {
    #map = new Map<number, [Accessor<Hyprland.Client[]>, Setter<Hyprland.Client[]>]>()

    constructor() {
        super()
        this.#update()
        hyprland.connect("client-added", () => this.#update())
        hyprland.connect("client-moved", () => this.#update())
        hyprland.connect("client-removed", () => {hyprland.sync_clients(() => this.#update())})
    }

    #update() {
        const map = new Map<number, Hyprland.Client[]>()

        for (const client of hyprland.clients) {
            const id = client.workspace.id
            if (!map.has(id)) map.set(id, [])
            map.get(id)!.push(client)
        }

        for (const [id, [, set]] of this.#map) {
            set(map.get(id) ?? [])
        }

        for (const [id, clients] of map) {
            if (!this.#map.has(id)) {
                this.#map.set(id, createState(clients))
            }
        }
    }

    inWorkspace(ws_id: number): Accessor<Hyprland.Client[]> {
        if (!this.#map.has(ws_id)) {
            this.#map.set(ws_id, createState<Hyprland.Client[]>([]))
        }
        return this.#map.get(ws_id)![0]
    }

    // Swap all the clients between two workspaces
    swapClients(from: number, to: number) {
        if (from === to) return
        const fromClients = this.#map.get(from)?.[0].peek() ?? []
        const toClients = this.#map.get(to)?.[0].peek() ?? []

        fromClients.forEach(client => moveClientSilently(client, to))
        toClients.forEach(client => moveClientSilently(client, from))
    }

    clearWorkspace(ws_id: number) : void {
        const clients = this.#map.get(ws_id)?.[0].peek() ?? []
        clients.forEach(client => closeClient(client))
    }
}

export const workspaceClients = new WorkspaceClients()

export function isWorkspaceFocused(ws_id: number): Accessor<boolean> {
    return createComputed([focusedWorkspace], (focused) => focused?.id === ws_id)
}

export function getWorkspaceMonitor(ws_id: number): Hyprland.Monitor {
    return hyprland.get_workspace(ws_id).monitor
}

export function switchWorkspace(direction: 1 | -1) {
    const sorted = sortedWorkspaces.get()
    const focused = focusedWorkspace.get()
    const length = sorted.length

    const index = sorted.findIndex(ws => ws.id === focused.id)
    if (index === -1) return

    focusWorkspace(sorted[(index + direction + length) % length].id)
}
