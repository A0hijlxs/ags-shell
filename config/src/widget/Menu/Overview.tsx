
import Gtk from "gi://Gtk?version=4.0"
import { Accessor } from "ags"

const { START } = Gtk.Align
const { VERTICAL } = Gtk.Orientation

export function OverviewButton({
    icon,
    name,
    label,
    onToggled,
    onExpand,
} : {
    icon: Accessor<string>,
    name: string,
    label: Accessor<string>
    onToggled?: () => void,
    onExpand?: () => void,
}) {
    return (
        <box class={"overview-box"}>
            <button onClicked={onToggled} class={"overview-button"}>
                <box hexpand spacing={13}>
                    <image iconName={icon} class={"overview-icon"}/>
                    <box orientation={VERTICAL}>
                        <label label={name} halign={START} class={"overview-name"}/>
                        <label label={label} halign={START} class={"overview-label"}/>
                    </box>
                </box>
            </button>
            <button onClicked={onExpand} label={""} class={"overview-button"}/>
        </box>
    )
}

export function OverviewSlider({
    icon,
    position,
    status,
    onToggled,
    onExpand,
    onChanged,
} : {
    icon: Accessor<string>,
    position: Accessor<number>,
    status: Accessor<boolean>,
    onToggled?: () => void,
    onExpand?: () => void,
    onChanged?: (value: number) => void
}) {
    return (
        <box class={"overview-box"}>
            <button onClicked={onToggled} class={"overview-button"} >
                <image iconName={icon} class={"overview-icon"} />
            </button>
            <slider
                css-classes={status(s => ["overview-slider", s ? "inactive" : ""])}
                onChangeValue={({value}) => {onChanged?.(value)}}
                value={position}
                hexpand
            />
            {onExpand && <button onClicked={onExpand} label={""} class={"overview-button"}/>}
        </box>
    )
}
