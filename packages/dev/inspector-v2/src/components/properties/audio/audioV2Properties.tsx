import { type FunctionComponent, useCallback } from "react";

import { type AudioEngineV2 } from "core/AudioV2/abstractAudio/audioEngineV2";
import { type AbstractAudioBus } from "core/AudioV2/abstractAudio/abstractAudioBus";
import { type AudioBus } from "core/AudioV2/abstractAudio/audioBus";
import { type AbstractSound } from "core/AudioV2/abstractAudio/abstractSound";
import { type AbstractSoundSource } from "core/AudioV2/abstractAudio/abstractSoundSource";
import { type StaticSound } from "core/AudioV2/abstractAudio/staticSound";
import { type StreamingSound } from "core/AudioV2/abstractAudio/streamingSound";
import { SoundState } from "core/AudioV2/soundState";

import { PauseRegular, PlayRegular, StopRegular } from "@fluentui/react-icons";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { type ISelectionService } from "../../../services/selectionService";
import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { usePollingObservable } from "../../../hooks/pollingHooks";
import { BoundProperty, Property } from "../boundProperty";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";

// -----------------------------------------------------------------------------
// Engine
// -----------------------------------------------------------------------------

function useEngineState(engine: AudioEngineV2) {
    const stateChangedObservables = [
        useInterceptObservable("function", engine, "pauseAsync"),
        useInterceptObservable("function", engine, "resumeAsync"),
        useInterceptObservable("function", engine, "unlockAsync"),
    ] as const;

    return useObservableState(
        useCallback(() => engine.state, [engine]),
        ...stateChangedObservables
    );
}

/**
 * Setup / playback properties for an {@link AudioEngineV2}.
 * @returns The rendered component.
 */
export const AudioV2EngineGeneralProperties: FunctionComponent<{ engine: AudioEngineV2 }> = ({ engine }) => {
    const state = useEngineState(engine);

    const volume = useObservableState(
        useCallback(() => engine.volume, [engine]),
        useInterceptObservable("function", engine, "setVolume")
    );

    return (
        <>
            <TextPropertyLine label="State" value={state} />
            <Property
                component={SyncedSliderPropertyLine}
                label="Volume"
                functionPath="setVolume"
                value={volume}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => engine.setVolume(value)}
            />
            <BoundProperty component={NumberInputPropertyLine} label="Parameter Ramp Duration" target={engine} propertyKey="parameterRampDuration" min={0} step={0.01} unit="s" />
        </>
    );
};

/**
 * Resume / pause / unlock controls for an {@link AudioEngineV2}.
 * @returns The rendered component.
 */
export const AudioV2EngineCommandsProperties: FunctionComponent<{ engine: AudioEngineV2 }> = ({ engine }) => {
    const state = useEngineState(engine);

    return (
        <>
            {state === "running" ? (
                <ButtonLine uniqueId="audiov2-engine-pause" label="Pause" icon={PauseRegular} onClick={() => void engine.pauseAsync()} />
            ) : (
                <ButtonLine uniqueId="audiov2-engine-resume" label="Resume" icon={PlayRegular} onClick={() => void engine.resumeAsync()} />
            )}
        </>
    );
};

// -----------------------------------------------------------------------------
// Buses (Main + Audio)
// -----------------------------------------------------------------------------

/**
 * General properties shared by main buses and regular audio buses.
 * @returns The rendered component.
 */
export const AudioV2BusGeneralProperties: FunctionComponent<{ bus: AbstractAudioBus; selectionService: ISelectionService }> = ({ bus, selectionService }) => {
    // Only AudioBus has an outBus; MainAudioBus does not. We use `"outBus" in bus` as a structural check
    // so we can call hooks unconditionally below.
    const audioBus = "outBus" in bus ? (bus as AudioBus) : null;

    const volume = useObservableState(
        useCallback(() => bus.volume, [bus]),
        useInterceptObservable("function", bus, "setVolume")
    );

    const outBusChangedObservable = useInterceptObservable("property", audioBus, "outBus");
    const outBus = useObservableState(
        useCallback(() => audioBus?.outBus ?? null, [audioBus]),
        outBusChangedObservable
    );

    return (
        <>
            <Property
                component={SyncedSliderPropertyLine}
                label="Volume"
                functionPath="setVolume"
                value={volume}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => bus.setVolume(value)}
            />
            {audioBus && (
                <LinkToEntityPropertyLine
                    label="Output Bus"
                    description="The bus this bus routes its output to."
                    entity={outBus ? { name: outBus.name } : null}
                    selectionService={selectionService}
                />
            )}
        </>
    );
};

// -----------------------------------------------------------------------------
// Sounds (StaticSound + StreamingSound)
// -----------------------------------------------------------------------------

function GetSoundStateLabel(state: SoundState): string {
    switch (state) {
        case SoundState.Started:
            return "Playing";
        case SoundState.Paused:
            return "Paused";
        case SoundState.Starting:
            return "Starting";
        case SoundState.Stopping:
            return "Stopping";
        case SoundState.FailedToStart:
            return "Failed to start";
        case SoundState.Stopped:
        default:
            return "Stopped";
    }
}

function useSoundState(sound: AbstractSound): SoundState {
    const stateChangedObservables = [
        useInterceptObservable("function", sound, "play"),
        useInterceptObservable("function", sound, "pause"),
        useInterceptObservable("function", sound, "resume"),
        useInterceptObservable("function", sound, "stop"),
    ] as const;

    return useObservableState(
        useCallback(() => sound.state, [sound]),
        ...stateChangedObservables
    );
}

/**
 * General properties for any v2 sound.
 * @returns The rendered component.
 */
export const AudioV2SoundGeneralProperties: FunctionComponent<{ sound: AbstractSound; selectionService: ISelectionService }> = ({ sound, selectionService }) => {
    const state = useSoundState(sound);

    const volume = useObservableState(
        useCallback(() => sound.volume, [sound]),
        useInterceptObservable("function", sound, "setVolume")
    );

    const outBus = useObservableState(
        useCallback(() => sound.outBus, [sound]),
        useInterceptObservable("property", sound, "outBus")
    );

    return (
        <>
            <TextPropertyLine label="State" value={GetSoundStateLabel(state)} />
            <Property
                component={SyncedSliderPropertyLine}
                label="Volume"
                functionPath="setVolume"
                value={volume}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => sound.setVolume(value)}
            />
            <LinkToEntityPropertyLine
                label="Output Bus"
                description="The bus this sound routes its output to."
                entity={outBus ? { name: outBus.name } : null}
                selectionService={selectionService}
            />
        </>
    );
};

/**
 * Playback properties shared by all v2 sounds (loop, start offset, current time).
 * @returns The rendered component.
 */
export const AudioV2SoundPlaybackProperties: FunctionComponent<{ sound: AbstractSound }> = ({ sound }) => {
    // currentTime advances implicitly as the sound plays — poll to keep the display in sync.
    // Note: this is total elapsed playback time, not position-within-buffer — it keeps growing
    // past buffer.duration when looping. That's why it's rendered as a number input rather
    // than a scrub-style slider.
    const tickObservable = usePollingObservable(100);
    const currentTime = useObservableState(
        useCallback(() => sound.currentTime, [sound]),
        tickObservable,
        useInterceptObservable("property", sound, "currentTime")
    );

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Loop" target={sound} propertyKey="loop" />
            <BoundProperty component={NumberInputPropertyLine} label="Start Offset" target={sound} propertyKey="startOffset" min={0} step={0.1} unit="s" />
            <Property
                component={NumberInputPropertyLine}
                label="Current Time"
                propertyPath="currentTime"
                value={currentTime}
                min={0}
                step={0.1}
                unit="s"
                onChange={(value: number) => (sound.currentTime = value)}
            />
        </>
    );
};

/**
 * Additional playback properties specific to {@link StaticSound} (duration, loop range, pitch, playback rate).
 * @returns The rendered component.
 */
export const AudioV2StaticSoundPlaybackProperties: FunctionComponent<{ sound: StaticSound }> = ({ sound }) => {
    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Duration" target={sound} propertyKey="duration" min={0} step={0.1} unit="s" />
            <BoundProperty component={NumberInputPropertyLine} label="Loop Start" target={sound} propertyKey="loopStart" min={0} step={0.1} unit="s" />
            <BoundProperty component={NumberInputPropertyLine} label="Loop End" target={sound} propertyKey="loopEnd" min={0} step={0.1} unit="s" />
            <BoundProperty component={NumberInputPropertyLine} label="Pitch" target={sound} propertyKey="pitch" step={1} unit="¢" />
            <BoundProperty component={NumberInputPropertyLine} label="Playback Rate" target={sound} propertyKey="playbackRate" min={0} step={0.1} />
        </>
    );
};

/**
 * Preload status display for {@link StreamingSound}.
 * @returns The rendered component.
 */
export const AudioV2StreamingSoundPreloadProperties: FunctionComponent<{ sound: StreamingSound }> = ({ sound }) => {
    return (
        <>
            <TextPropertyLine label="Preload Count" value={String(sound.preloadCount)} />
            <TextPropertyLine label="Preload Completed" value={String(sound.preloadCompletedCount)} />
        </>
    );
};

/**
 * Play / pause / stop controls for any v2 sound.
 * @returns The rendered component.
 */
export const AudioV2SoundCommandsProperties: FunctionComponent<{ sound: AbstractSound }> = ({ sound }) => {
    const state = useSoundState(sound);
    const isPlaying = state === SoundState.Started || state === SoundState.Starting;
    const isPaused = state === SoundState.Paused;

    return (
        <>
            <ButtonLine
                uniqueId="audiov2-sound-play-pause"
                label={isPlaying ? "Pause" : "Play"}
                icon={isPlaying ? PauseRegular : PlayRegular}
                onClick={() => {
                    if (isPlaying) {
                        sound.pause();
                    } else if (isPaused) {
                        sound.resume();
                    } else {
                        sound.play();
                    }
                }}
            />
            <ButtonLine uniqueId="audiov2-sound-stop" label="Stop" icon={StopRegular} onClick={() => sound.stop()} />
        </>
    );
};

// -----------------------------------------------------------------------------
// Standalone sound sources (e.g. microphone)
// -----------------------------------------------------------------------------

/**
 * General properties for a v2 sound source that is not a sound (e.g. microphone).
 * @returns The rendered component.
 */
export const AudioV2SoundSourceGeneralProperties: FunctionComponent<{ source: AbstractSoundSource; selectionService: ISelectionService }> = ({ source, selectionService }) => {
    const volume = useObservableState(
        useCallback(() => source.volume, [source]),
        useInterceptObservable("function", source, "setVolume")
    );

    const outBus = useObservableState(
        useCallback(() => source.outBus, [source]),
        useInterceptObservable("property", source, "outBus")
    );

    return (
        <>
            <Property
                component={SyncedSliderPropertyLine}
                label="Volume"
                functionPath="setVolume"
                value={volume}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => source.setVolume(value)}
            />
            <LinkToEntityPropertyLine
                label="Output Bus"
                description="The bus this source routes its output to."
                entity={outBus ? { name: outBus.name } : null}
                selectionService={selectionService}
            />
        </>
    );
};
