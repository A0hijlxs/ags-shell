
import Gtk from "gi://Gtk?version=4.0";
import { transitionTo, MenuNames } from "./SystemMenu";
import { OverviewButton } from "./Overview";
import { tailscale, tailscaleIconName, tailscaleVar } from "../../store/tailscale";
import { SeparatorLabel } from "../Common/SeparatorLabel";
import { For } from "ags";
import { miscIconNames } from "../../store/iconNames";

const { VERTICAL } = Gtk.Orientation

export function TailscaleButton() {
    return (
        <OverviewButton 
            icon={tailscaleIconName}
            name="Tailscale"
            label={tailscaleVar.connected(c => c ? "Connected" : "Not Connected")}
            onToggled={() => tailscale.toggle()}
            onExpand={() => transitionTo(MenuNames.TAILSCALE)}
        />
    )
}

export function TailscaleMenu() {
    return (
        <box orientation={VERTICAL} $type="named" name={MenuNames.TAILSCALE} class={"sub-menu"} spacing={5}>
            <button label={"Tailscale"} onClicked={() => transitionTo()} />

            <SeparatorLabel title="Host"/>

            <box orientation={VERTICAL}>
                <button class={"item-button"} onClicked={() => tailscale.toggle()} >
                    <box>
                        <label label={tailscaleVar.connected(c => c ? "Connected" : "Not Connected")} />
                        <label hexpand />
                        <switch active={tailscaleVar.connected} />
                    </box>
                </button>
                <button class={"item-button"}>
                    <box>
                        <label label={"Hostname: "} />
                        <label hexpand />
                        <label label={tailscaleVar.hostname}/>
                    </box>
                </button>
                <button class={"item-button"}>
                    <box>
                        <label label={"Host OS: "} />
                        <label hexpand />
                        <label label={tailscaleVar.hostOS}/>
                    </box>
                </button>
            </box>

            <SeparatorLabel title="Nodes"/>

            <box orientation={VERTICAL} >
                <For each={tailscaleVar.peers}>
                    {p => (
                        <button 
                            css-classes={["item-button", "node"]} 
                            onClicked={() => {
                                if (p.exitNodeOption && tailscaleVar.connected.get())
                                    tailscale.toggleExitNode(p.ips?.[0] ?? "", p.exitNode)
                            }}
                            sensitive={p.online}
                        >
                            <box spacing={15}>
                                <image iconName={miscIconNames.dot} class={p.online ? "online" : "offline"}/>
                                <label label={p.host} />
                                <label hexpand />
                                <label label={p.os} />
                                <image iconName={miscIconNames.route} class={(!p.exitNode && p.online) ? "inactive" : ""}/>
                            </box>
                        </button>
                    )}
                </For>
            </box>
        </box>
    )
}
