
import Wp from "gi://AstalWp"
import GLib from "gi://GLib"
import { getMicrophoneIconName, getVolumeIconName } from "./iconNames"
import { createBinding, createComputed } from "ags"

export const MAX_VOLUME = Number(GLib.getenv("AGS_MAX_VOLUME") ?? "1")

const { audio } = Wp.get_default()!

// Speaker variables
export const defaultSpeaker = audio.default_speaker

export const speakerVar = {
    volume: createBinding(defaultSpeaker, "volume"),
    mute: createBinding(defaultSpeaker, "mute"),
    speakers: createBinding(audio, "speakers"),
    description: createBinding(defaultSpeaker, "description"),
}

export const speakerIconName = createComputed([
    speakerVar.volume,
    speakerVar.mute,
    speakerVar.description,
], () => getVolumeIconName(defaultSpeaker))

// Microphone variables
export const defaultMic = audio.default_microphone

export const micVar = {
    volume: createBinding(defaultMic, "volume"),
    mute: createBinding(defaultMic, "mute"),
    mics: createBinding(audio, "microphones"),
    description: createBinding(defaultMic, "description"),
}

export const micIconName = createComputed([
    micVar.volume,
    micVar.mute,
    micVar.description,
], () => getMicrophoneIconName(defaultMic))

// Additional methods
export function toggleMuteEndpoint(endpoint?: Wp.Endpoint) {
    endpoint?.set_mute(!endpoint?.mute)
}
