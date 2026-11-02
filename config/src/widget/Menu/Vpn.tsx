
import Gtk from "gi://Gtk?version=4.0"
import { Networks, networkState } from "../../store/network"
import { MenuNames, transitionTo } from "./SystemMenu"
import { OverviewButton } from "./Overview"
import { vpnIconName } from "../../store/network"
import { RevealerManager } from "../../store/revealer"
import { miscIconNames } from "../../store/iconNames"
import { createState, createBinding, For } from "ags"

const { VERTICAL } = Gtk.Orientation

export function VpnButton() {
    return (
        <OverviewButton 
            icon={vpnIconName}
            name={"Vpn"}
            label={createBinding(Networks, "activeVpn")(v => v.length ? v[0] : "None")}
            onToggled={() => Networks.disconnectVpns()}
            onExpand={() => transitionTo(MenuNames.VPN)}
        />
    )
}

const manager = new RevealerManager()

function VpnItem({ name } : { name: string }) {

    const isActive = networkState.activeVpn(vpns => vpns.includes(name))
    const iconName = isActive(active => active ? miscIconNames.selected : miscIconNames.vpn)

    return (
        <box orientation={VERTICAL}>
            <Gtk.EventControllerMotion
                onEnter={() => manager.onHoverEnter(name)}
                onLeave={() => manager.onHoverLeave(name)}
            />

            <button
                class={"item-button"}
                onClicked={() => manager.show(name)}
            >
                <box spacing={5}>
                    <image iconName={iconName} pixelSize={18} />
                    <label label={name} />
                </box>
            </button>

            <revealer revealChild={manager.bind(name)}>
                <box homogeneous class={"actions-box"}>
                    <button
                        label={isActive(a => a ? "Disconnect" : "Connect")}
                        onClicked={() => {isActive.get()
                            ? Networks.deactivate(name)
                            : Networks.connectVpn(name)
                        }}/>
                    <button label={"Remove"} onClicked={() => {Networks.remove(name)}}/>
                </box>
            </revealer>
        </box>
    )
}

function NewVpnConfig() {
    const [vpnStage, setVpnStage] = createState<"select" | "entry">("select")
    const [vpnType, setVpnType] = createState<"openvpn" | "wireguard">("wireguard")    
    const name = "newVpnMenu"

    return (
        <box orientation={VERTICAL}>
            <Gtk.EventControllerMotion 
                onEnter={() => manager.onHoverEnter(name)} 
                onLeave={() => manager.onHoverLeave(name)}
            />
            <button 
                label={Networks.vpnImportMessage} 
                onClicked={() => {manager.show(name); setVpnStage("select")}}
            />

            <revealer revealChild={manager.bind(name)}>
                <stack 
                    $={self => vpnStage.subscribe(() => self.visibleChildName = vpnStage.get())}
                    transitionType={Gtk.StackTransitionType.SLIDE_UP_DOWN}
                >
                    <box $type="named" name={"select"} homogeneous>
                        <button label="OpenVPN" onClicked={() => {setVpnType("openvpn"); setVpnStage("entry")}} />
                        <button label="Wireguard" onClicked={() => {setVpnType("wireguard"); setVpnStage("entry")}} />    
                    </box>
                    <entry
                        name={"entry"}
                        $type="named"
                        placeholderText="Enter Path..."
                        onActivate={self => {
                            Networks.addVpn(self.text, vpnType.get())
                            self.set_text("")
                            setVpnStage("select")
                        }}
                    />
                </stack>
            </revealer>
        </box>
    )
}

export function VpnMenu() {
    return (
        <box spacing={10} orientation={VERTICAL} $type="named" name={MenuNames.VPN} class={"sub-menu"}>
            <button label="VPN" onClicked={() => transitionTo()} />

            <box orientation={VERTICAL}>
                <For each={networkState.activeVpn}>
                    {vpn => <VpnItem name={vpn}/>}
                </For>

                <For each={networkState.inactiveVpn}>
                    {vpn => <VpnItem name={vpn}/>}
                </For>
            </box>

            <NewVpnConfig />
        </box>
    )
}

