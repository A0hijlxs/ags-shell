import Bluetooth from "gi://AstalBluetooth"
import { createBinding, createComputed  } from "ags"
import { getBluetoothIconName } from "./iconNames"
import GObject, { register, property } from "ags/gobject"

@register()
class DeviceStore extends GObject.Object {
    @property(Array) paired: Bluetooth.Device[] = []
    @property(Array) unpaired: Bluetooth.Device[] = []
    @property(Array) connected: Bluetooth.Device[] = []

    #devices = new Map<string, Bluetooth.Device>()

    constructor() {
        super()

        for (const device of bt.devices)
            this.#add(device)

        this.#update()

        bt.connect("device-added", (_, device: Bluetooth.Device) => {
            this.#add(device)
            this.#update()
        })

        bt.connect("device-removed", (_, device: Bluetooth.Device) => {
            this.#devices.delete(device.address)
            this.#update()
        })
    }

    #add(device: Bluetooth.Device) {
        this.#devices.set(device.address, device)

        device.connect("notify::paired", () => this.#update())
        device.connect("notify::connected", () => this.#update())
    }

    #update() {
        const paired: Bluetooth.Device[] = []
        const unpaired: Bluetooth.Device[] = []
        const connected: Bluetooth.Device[] = []

        for (const d of this.#devices.values()) {
            if (d.connected) connected.push(d)  
            else if (d.paired) paired.push(d)
            else if (d.name) unpaired.push(d)
        }

        this.paired = paired
        this.unpaired = unpaired
        this.connected = connected
    }
}

export const bt = Bluetooth.get_default()
export const Devices = new DeviceStore()

export const btState = {
    powered: createBinding(bt.adapter, "powered"),
    pairable: createBinding(bt.adapter, "pairable"),
    discoverable: createBinding(bt.adapter, "discoverable"),
    discovering: createBinding(bt.adapter, "discovering"),
    isConnected: createBinding(bt, "isConnected"),
    connected: createBinding(Devices, "connected"),
    paired: createBinding(Devices, "paired"),
    unpaired: createBinding(Devices, "unpaired"),
}

export const bluetoothIconName = createComputed([
    btState.powered,
    btState.isConnected,
    btState.discovering,
], () => getBluetoothIconName(bt))

