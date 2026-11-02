
import Gtk from "gi://Gtk?version=4.0"
import { getAccessPointIconName, miscIconNames } from "../../store/iconNames"
import { Networks, networkState } from "../../store/network"
import { RevealerManager } from "../../store/revealer"
import { createState } from "ags"

const { currentAP } = networkState
const { VERTICAL } = Gtk.Orientation

const manager = new RevealerManager()

type NetworkType = "saved" | "ap"

export function NetworkItem({ ssid, type, strength, flags } : { 
    ssid: string, 
    type: NetworkType
    strength?: number,
    flags?: number,
}) {
    const [stage, setStage] = createState< "actions" | "content" >("actions")

    const isActive = ssid === currentAP?.get()?.ssid
    const isKnown = isActive || Networks.inactive.includes(ssid)

    const iconName = type === "saved" 
        ? miscIconNames.network 
        : getAccessPointIconName(strength ?? 0, flags ?? 0)

    const actions = type === "saved"
        ? <box homogeneous hexpand spacing={5}>
                <button label={"Password"} onClicked={() => setStage("content")}/>
                <button label={"Forget"} onClicked={() => Networks.remove(ssid)}/>
            </box>
        
        : <box homogeneous hexpand>
                <button label={isActive ? "Disconnect" : "Connect"} 
                    onClicked={() => {isActive ? Networks.deactivate(ssid) : isKnown 
                        ? Networks.connectKnown(ssid) 
                        : setStage("content")
                    }}/>
                </box>

    const content = type === "saved"
        ? <button
            hexpand
            label={`${Networks.showPassword(ssid) ?? "None"}`} 
            onClicked={() => setStage("actions")} />
        : <entry
            hexpand
            placeholderText="Password..."
            visibility={false}
            onActivate={self => {Networks.connectNew(ssid, self.text)}} />

    return (
        <box orientation={VERTICAL}>
            <Gtk.EventControllerMotion 
                onEnter={() => manager.onHoverEnter(ssid)} 
                onLeave={() => manager.onHoverLeave(ssid)}
            />
            
            <button 
                class={"item-button"}
                onClicked={() => {manager.show(ssid); setStage("actions")}}
            >
                <box spacing={8}>
                    <image iconName={iconName} pixelSize={20} />
                    <label label={ssid} />
                </box>
            </button>

            <revealer revealChild={manager.bind(ssid)}>
                <stack 
                    $={self => stage.subscribe(() => self.visibleChildName = stage.get())}
                    transitionType={Gtk.StackTransitionType.SLIDE_UP_DOWN} 
                    class={"actions-box"}
                >
                    <box $type="named" name={"actions"}>
                        {actions}
                    </box>
                    <box $type="named" name={"content"}>
                        {content}
                    </box>
                </stack>
            </revealer>
        </box>
    )
}
