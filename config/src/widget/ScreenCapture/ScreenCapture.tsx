
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import app from "ags/gtk4/app"
import { Astal } from "ags/gtk4"
import { createComputed, Accessor } from "ags"

import { registerRequest } from "../../../request"
import {
    captureMode, setCaptureMode, saveToFiles, setSaveToFiles,
    copyToClipboard, setCopyToClipboard,
    capturedImagePath, response, capture, ask, CaptureMode,
    askEnabled, setAskEnabled, selectedModel, setSelectedModel, Model,
    useWrittenPrompt, setUseWrittenPrompt,
} from "../../store/screencapture"
import { markdownToPango } from "./markdown"
import { miscIconNames } from "../../store/iconNames"

const { NORMAL } = Astal.Exclusivity
const { ON_DEMAND } = Astal.Keymode
const { CENTER, START, END } = Gtk.Align
const { TOP } = Astal.WindowAnchor
const { VERTICAL } = Gtk.Orientation

const screenCaptureName = "screencapture"

let win: Gtk.Window | null = null
const toggle = () => win?.get_visible() ? win.hide() : win?.show()

function onKeyPress(keyval: number): boolean {
    if (keyval === Gdk.KEY_Escape) { toggle(); return true }
    return false
}

const questionBuffer = new Gtk.EntryBuffer()

const modes: { label: CaptureMode, icon: string }[] = [
    { label: "Display", icon: miscIconNames.display },
    { label: "Area", icon: miscIconNames.area },
    { label: "Window", icon: miscIconNames.window },
]

function ModeButton({ label, icon }: typeof modes[number]) {
    return (
        <button
            css-classes={captureMode(m => ["capture-mode", m === label ? "selected" : ""])}
            onClicked={() => setCaptureMode(label)}
        >
            <box orientation={VERTICAL} spacing={2}>
                <image iconName={icon} class={"icon"} />
                <label label={label} class={"text"} />
            </box>
        </button>
    )
}

async function onCapture() {
    const ok = await capture()
    if (ok && askEnabled.get()) ask(questionBuffer.get_text())
}

function ToggleRow({ label, active, onToggle, sensitive }: {
    label: string, active: Accessor<boolean>, onToggle: (value: boolean) => void,
    sensitive?: Accessor<boolean> | boolean,
}) {
    return (
        <button class={"toggle-row"} sensitive={sensitive ?? true} onClicked={() => onToggle(!active.get())}>
            <box spacing={14} widthRequest={170}>
                <label label={label} hexpand halign={START} />
                <switch valign={CENTER} halign={END} active={active} />
            </box>
        </button>
    )
}

const models: Model[] = ["Haiku", "Sonnet", "Opus"]

function ModelButton({ model }: { model: Model }) {
    return (
        <button
            css-classes={selectedModel(m => ["capture-mode", "model-button", m === model ? "selected" : ""])}
            onClicked={() => setSelectedModel(model)}
            label={model}
        />
    )
}

function ModelPicker() {
    return (
        <box orientation={VERTICAL} spacing={4} homogeneous sensitive={askEnabled}>
            {models.map(m => <ModelButton model={m} />)}
        </box>
    )
}

function CaptureControls() {
    return (
        <box spacing={10} halign={CENTER}>
            <box spacing={10} homogeneous>
                {modes.map(m => <ModeButton {...m} />)}
            </box>
            <box spacing={10} homogeneous valign={CENTER}>
                <box orientation={VERTICAL} spacing={4}>
                    <ToggleRow label="Copy to clipboard" active={copyToClipboard} onToggle={setCopyToClipboard} />
                    <ToggleRow label="Save to files" active={saveToFiles} onToggle={setSaveToFiles} />
                </box>
                <box orientation={VERTICAL} spacing={4}>
                    <ToggleRow label="Ask AI" active={askEnabled} onToggle={setAskEnabled} />
                    <ToggleRow label="Custom Prompt" active={useWrittenPrompt} onToggle={setUseWrittenPrompt} sensitive={askEnabled} />
                </box>
            </box>
            <ModelPicker />
            <button class={"capture-button"} onClicked={() => onCapture()}>
                <box orientation={VERTICAL} spacing={2} valign={CENTER}>
                    <image iconName={"f7-camera-symbolic"} class={"icon"} />
                    <label label="Capture" class={"text"} />
                </box>
            </button>
        </box>
    )
}

const canAsk = createComputed([askEnabled, capturedImagePath], (enabled, path) => enabled && !!path)

function QuestionEntry() {
    return (
        <entry
            hexpand
            buffer={questionBuffer}
            placeholderText="Ask about the capture..."
            visible={useWrittenPrompt}
            sensitive={canAsk}
        />
    )
}

function ResponseView() {
    return (
        <scrolledwindow maxContentHeight={400} visible={response(r => r.length > 0)}>
            <label
                label={response(markdownToPango)}
                useMarkup
                wrap
                halign={START}
            />
        </scrolledwindow>
    )
}

export function ScreenCapture() {
    return (
        <window
            name={screenCaptureName}
            namespace="ags-screencapture"
            class={"screencapture-window"}
            application={app}
            layer={Astal.Layer.OVERLAY}
            keymode={ON_DEMAND}
            exclusivity={NORMAL}
            anchor={TOP}
            $={self => {
                win = self
                registerRequest(screenCaptureName, toggle)
            }}
        >
            <Gtk.EventControllerKey onKeyPressed={(_, keyval) => onKeyPress(keyval)} />
            <box
                widthRequest={480}
                orientation={VERTICAL}
                spacing={12}
                class={"screencapture-content"}
            >
                <CaptureControls />
                <QuestionEntry />
                <ResponseView />
            </box>
        </window>
    )
}
