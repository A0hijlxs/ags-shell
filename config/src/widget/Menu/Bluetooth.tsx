
import GLib from "gi://GLib?version=2.0"
import Gtk from "gi://Gtk?version=4.0"
import { Accessor, createBinding, For, With } from "ags"
import Bluetooth from "gi://AstalBluetooth"

import { bt, bluetoothIconName, btState } from "../../store/bluetooth"
import { transitionTo, MenuNames } from "./SystemMenu"
import { OverviewButton } from "./Overview"
import { getBluetoothBatteryIconName, miscIconNames } from "../../store/iconNames"
import { RevealerManager } from "../../store/revealer"
import { SeparatorLabel } from "../Common/SeparatorLabel"

const { powered, pairable, discoverable, discovering } = btState
const { VERTICAL } = Gtk.Orientation

export function BluetoothButton() {
    return (
        <OverviewButton
            icon={bluetoothIconName}
            name={"Bluetooth"}
            label={btState.connected(ds => ds.length ? ds[0].alias : "None")}
            onToggled={() => bt.adapter.set_powered(!bt.adapter.get_powered())}
            onExpand={() => {transitionTo(MenuNames.BLUETOOTH)}}
        />
    )
}

const manager = new RevealerManager()

function BluetoothItem({ device }: { device: Bluetooth.Device }) {
    const connecting = createBinding(device, "connecting")
    const connected = device.connected
    const paired = device.paired
    const name = device.alias ?? device.address
    const percent = createBinding(device, "batteryPercentage")
    const trusted = createBinding(device, "trusted")

    return (
        <box 
            orientation={VERTICAL} 
            spacing={3}
        >
            <Gtk.EventControllerMotion 
                onEnter={() => manager.onHoverEnter(device.address)} 
                onLeave={() => manager.onHoverLeave(device.address)}
            />
            <button 
                class={"item-button"}
                onClicked={() => manager.show(device.address)}
            >
                <box spacing={8}> 
                    <image iconName={connected ? miscIconNames.selected : miscIconNames.bluetooth} pixelSize={15}/>
                    <label label={name} />
                    <label hexpand />
                    {connected && <box spacing={4}>
                        <label label={percent.as(p => `${Math.floor(p * 100)}%`)} />
                        <image iconName={percent.as(p => getBluetoothBatteryIconName(p))} pixelSize={20} marginTop={-1}/>
                    </box>}
                </box>
            </button>

            <revealer revealChild={manager.bind(device.address)}>
                <box spacing={5} homogeneous class={"actions-box"}>
                    <With value={connecting}>
                        {connecting => (
                            <button
                                label={connected ? "Disconnect" : connecting ? "Connecting" : "Connect"}
                                onClicked={() => {
                                    if (connected) device.disconnect_device(null)
                                        else if (!connecting) device.connect_device(null)}
                                }/>
                        )}
                    </With>

                    {paired && <With value={trusted}>
                        {t => (
                            <button label={t ? "Untrust" : "Trust"}
                                onClicked={() => device.set_trusted(!t)} />
                        )}
                    </With>}

                    <button 
                        visible={pairable.as(p => p || paired)}
                        label={paired ? "Unpair" : "Pair"}
                        onClicked={() => {paired ? bt.adapter.remove_device(device) : device.pair()}} />
                </box>
            </revealer>
        </box>
    )
}


export function BluetoothMenu() {

    function scan() {
        bt.adapter.start_discovery() 
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 7000, () => {
            bt.adapter.stop_discovery()
            return GLib.SOURCE_REMOVE
        })
    }

    function AdapterButton({
            title, 
            state, 
            property,
        }: {
            title: string, 
            state: Accessor<boolean>, 
            property: "powered" | "pairable" | "discoverable"
        }) {
        return (
            <button onClicked={() => bt.adapter[`set_${property}`](!bt.adapter[`get_${property}`]())}
                class={"adapter-button"}>
                <box spacing={10}>
                    <label label={title}/>
                    <label hexpand />
                    <switch active={state}/>
                </box>
            </button>
        )
    }

    return (
        <box orientation={VERTICAL} spacing={5} $type="named" name={MenuNames.BLUETOOTH} class={"sub-menu"}>

            <button label={"Bluetooth"} onClicked={() => transitionTo()} />

            <box orientation={VERTICAL}>
                <SeparatorLabel title={"Adapter"} />
                <AdapterButton title="Power" state={powered} property="powered" />
                <AdapterButton title="Pairable" state={pairable} property="pairable" />
                <AdapterButton title="Discoverable" state={discoverable} property="discoverable" />
            </box>

            <box orientation={VERTICAL} visible={powered}>
                <box visible={btState.paired(p => p.length > 0)}>
                    <SeparatorLabel title="Paired Devices" />
                </box>

                <box spacing={3} orientation={VERTICAL}>
                    <For each={btState.connected}>
                        {device => <BluetoothItem device={device}/>}
                    </For>

                    <For each={btState.paired}>
                        {device => <BluetoothItem device={device}/>}
                    </For>
                </box>
            </box>

            <box orientation={VERTICAL} visible={powered}>
                <With value={discovering}>
                    {active => (
                        <button label={active ? "Scanning..." : "Start Scan"} 
                            onClicked={() => !active && scan()}
                            sensitive={!active}/>
                    )}
                </With>
            </box>

            <box orientation={VERTICAL}>
                <For each={btState.unpaired}>
                    {device => <BluetoothItem device={device}/>}
                </For>
            </box>
        </box>
    )
}
