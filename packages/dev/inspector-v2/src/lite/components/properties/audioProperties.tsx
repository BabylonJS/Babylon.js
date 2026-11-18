import {
    type AudioBus,
    type AudioEngine,
    type AudioGraphHost,
    type AudioInputSource,
    type MainBus,
    type PrimaryAudioBus,
    type SpatialTarget,
    type StaticSound,
    type StreamingSound,
    SoundState,
    getMasterVolume,
    pauseSound,
    pauseStreamingSound,
    playSound,
    playStreamingSound,
    setBusVolume,
    setMasterVolume,
    setSoundSourceVolume,
    setSoundVolume,
    setStreamingSoundVolume,
    stopSound,
    stopStreamingSound,
    unlockAudioEngineAsync,
} from "@babylonjs/lite";
import { PauseRegular, PlayRegular, StopRegular } from "@fluentui/react-icons";
import { type FunctionComponent, useCallback } from "react";

import { Logger } from "core/Misc/logger";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { Link } from "shared-ui-components/fluent/primitives/link";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { GetEntityId } from "../../../components/explorer/explorerModel";
import { ComputedProperty, DerivedProperty } from "../../../components/properties/boundProperty";
import { useWatchedValue, useWatcher } from "../../../contexts/watcherContext";
import { type ISelectionService } from "../../../services/selectionService";
import { type IAudioEngineContext } from "../../audioEngineContext";
import { GetLiteAudioAttachments, GetLiteAudioEntry, GetLiteAudioGraph, GetLiteAudioNodeVolume, GetLiteAudioSpatialInfo } from "../../audioEngineGraph";

type AudioSound = StaticSound | StreamingSound;
type AudioNode = AudioGraphHost | MainBus;

const GetEngineState = (engine: AudioEngine) => engine.state;
const GetNodeName = (node: AudioNode) => node.name || "Unnamed";
const GetOutputName = (bus: PrimaryAudioBus) => bus.name || "Unnamed Bus";
const GetInstanceCount = (sound: AudioSound) => sound.instanceCount;
const GetBufferDuration = (sound: StaticSound) => sound.buffer.duration;
const GetPreloadedCount = (sound: StreamingSound) => sound.preloadCompletedCount;
const GetSoundState = (sound: AudioSound) => sound.state;

function GetSoundStateLabel(sound: AudioSound): string {
    switch (sound.state) {
        case SoundState.Starting:
            return "Starting";
        case SoundState.Started:
            return "Playing";
        case SoundState.Paused:
            return "Paused";
        case SoundState.Stopping:
            return "Stopping";
        case SoundState.FailedToStart:
            return "Failed to start";
        case SoundState.Stopped:
            return "Stopped";
        default:
            return `Unknown (${sound.state})`;
    }
}

function GetSpatialStatus(target: AudioEngine | AudioGraphHost): string {
    const info = GetLiteAudioSpatialInfo(target);
    return info.status === "enabled" ? "Enabled" : info.status === "disabled" ? "Disabled" : "Unavailable in this Lite version";
}

function GetSpatialTarget(target: AudioEngine | AudioGraphHost): SpatialTarget | null {
    const info = GetLiteAudioSpatialInfo(target);
    return info.status === "enabled" ? info.attachedTo : null;
}

function GetSpatialPosition(target: AudioEngine | AudioGraphHost): string {
    const info = GetLiteAudioSpatialInfo(target);
    return info.status === "enabled" ? `${info.position.x.toFixed(2)}, ${info.position.y.toFixed(2)}, ${info.position.z.toFixed(2)}` : "";
}

function GetSpatialTargetName(target: SpatialTarget): string {
    return "name" in target && typeof target.name === "string" && target.name ? target.name : "Unnamed target";
}

const SpatialTargetLink: FunctionComponent<{ target: SpatialTarget; selectionService: ISelectionService }> = (props) => {
    const { target, selectionService } = props;
    const name = useWatchedValue(target, GetSpatialTargetName);
    return (
        <PropertyLine label="Attached Node">
            <Link value={name} onLink={() => (selectionService.selectedEntity = target)} />
        </PropertyLine>
    );
};

/** @internal */
export const LiteAttachedAudioProperties: FunctionComponent<{
    target: SpatialTarget;
    audioEngineContext: IAudioEngineContext;
    selectionService: ISelectionService;
}> = (props) => {
    const { target, audioEngineContext, selectionService } = props;
    const engine = useObservableState(
        useCallback(() => audioEngineContext.audioEngine, [audioEngineContext]),
        audioEngineContext.onAudioEngineChanged
    );
    const getAttachments = useCallback(() => {
        if (!engine) {
            return [];
        }
        const graph = GetLiteAudioGraph(engine);
        return graph ? GetLiteAudioAttachments(graph, target) : null;
    }, [engine, target]);
    const getSnapshot = useCallback(() => {
        const attachments = getAttachments();
        return attachments ? JSON.stringify(attachments.map((attachment) => [GetEntityId(attachment.entity), attachment.kind, attachment.name])) : "unsupported";
    }, [getAttachments]);
    useWatchedValue(target, getSnapshot);
    const attachments = getAttachments();

    return (
        <>
            {attachments?.length ? (
                attachments.map((attachment) => (
                    <PropertyLine
                        key={GetEntityId(attachment.entity)}
                        uniqueId={`LiteAttachedAudio-${GetEntityId(attachment.entity)}`}
                        label={attachment.kind === "listener" ? "Listener" : attachment.kind === "bus" ? "Bus" : attachment.kind === "source" ? "Source" : "Sound"}
                    >
                        <Link value={attachment.name} onLink={() => (selectionService.selectedEntity = attachment.entity)} />
                    </PropertyLine>
                ))
            ) : (
                <TextPropertyLine label="Attached Audio" value={attachments ? "None" : "Unavailable in this Lite version"} />
            )}
        </>
    );
};

/** @internal */
export const LiteAudioSpatialProperties: FunctionComponent<{ target: AudioEngine | AudioGraphHost; selectionService: ISelectionService }> = (props) => {
    const { target, selectionService } = props;
    const status = useWatchedValue(target, GetSpatialStatus);
    const attachedTo = useWatchedValue(target, GetSpatialTarget);
    const position = useWatchedValue(target, GetSpatialPosition);
    return (
        <>
            <TextPropertyLine label="Spatial" value={status} />
            <Collapse visible={status === "Enabled"}>
                <>
                    <TextPropertyLine label="Position" value={position} />
                    {attachedTo ? <SpatialTargetLink target={attachedTo} selectionService={selectionService} /> : <TextPropertyLine label="Attached Node" value="None" />}
                </>
            </Collapse>
        </>
    );
};

/** @internal */
export const LiteAudioEngineProperties: FunctionComponent<{ engine: AudioEngine }> = (props) => {
    const { engine } = props;
    const watcher = useWatcher();
    const setVolume = useCallback(
        (target: AudioEngine, value: number) => {
            setMasterVolume(target, value);
            watcher.refresh();
        },
        [watcher]
    );
    return (
        <>
            <ComputedProperty component={TextPropertyLine} label="State" target={engine} getValue={GetEngineState} />
            <DerivedProperty component={NumberInputPropertyLine} label="Volume" target={engine} getValue={getMasterVolume} setValue={setVolume} min={0} step={0.01} />
        </>
    );
};

const AudioOutputValue: FunctionComponent<{ engine: AudioEngine; output: PrimaryAudioBus; selectionService: ISelectionService }> = (props) => {
    const { engine, output, selectionService } = props;
    const watcher = useWatcher();
    const name = useWatchedValue(output, GetOutputName);
    const getIsInspectable = useCallback(
        (target: PrimaryAudioBus) => {
            const graph = GetLiteAudioGraph(engine);
            const entry = graph && GetLiteAudioEntry(graph, target);
            return entry?.kind === "main-bus" || entry?.kind === "bus";
        },
        [engine]
    );
    const isInspectable = useWatchedValue(output, getIsInspectable);
    return isInspectable ? (
        <PropertyLine label="Output Bus">
            <Link
                value={name}
                onLink={() => {
                    if (getIsInspectable(output)) {
                        selectionService.selectedEntity = output;
                    } else {
                        watcher.refresh();
                    }
                }}
            />
        </PropertyLine>
    ) : (
        <TextPropertyLine label="Output Bus" value={name} />
    );
};

const AudioOutputProperty: FunctionComponent<{ engine: AudioEngine; node: AudioNode; selectionService: ISelectionService }> = (props) => {
    const { engine, node, selectionService } = props;
    const getOutput = useCallback(
        (target: AudioNode): PrimaryAudioBus | null | undefined => {
            const graph = GetLiteAudioGraph(engine);
            return graph ? GetLiteAudioEntry(graph, target)?.output : undefined;
        },
        [engine]
    );
    const output = useWatchedValue(node, getOutput);
    return output ? (
        <AudioOutputValue engine={engine} output={output} selectionService={selectionService} />
    ) : (
        <TextPropertyLine label="Output Bus" value={output === null ? "None" : "Unavailable"} />
    );
};

/** @internal */
export const LiteAudioBusProperties: FunctionComponent<{ engine: AudioEngine; bus: AudioBus | MainBus; selectionService: ISelectionService }> = (props) => {
    const { engine, bus, selectionService } = props;
    const watcher = useWatcher();
    const setVolume = useCallback(
        (target: AudioBus | MainBus, value: number) => {
            setBusVolume(target, value);
            watcher.refresh();
        },
        [watcher]
    );
    return (
        <>
            <ComputedProperty component={TextPropertyLine} label="Name" target={bus} getValue={GetNodeName} />
            <DerivedProperty component={NumberInputPropertyLine} label="Volume" target={bus} getValue={GetLiteAudioNodeVolume} setValue={setVolume} min={0} step={0.01} />
            <AudioOutputProperty engine={engine} node={bus} selectionService={selectionService} />
        </>
    );
};

/** @internal */
export const LiteAudioSoundProperties: FunctionComponent<{ engine: AudioEngine; sound: AudioSound; selectionService: ISelectionService }> = (props) => {
    const { engine, sound, selectionService } = props;
    const watcher = useWatcher();
    const setVolume = useCallback(
        (target: AudioSound, value: number) => {
            if ("buffer" in target) {
                setSoundVolume(target, value);
            } else {
                setStreamingSoundVolume(target, value);
            }
            watcher.refresh();
        },
        [watcher]
    );
    return (
        <>
            <ComputedProperty component={TextPropertyLine} label="Name" target={sound} getValue={GetNodeName} />
            <ComputedProperty component={TextPropertyLine} label="State" target={sound} getValue={GetSoundStateLabel} />
            <ComputedProperty component={StringifiedPropertyLine} label="Instances" target={sound} getValue={GetInstanceCount} />
            <DerivedProperty component={NumberInputPropertyLine} label="Volume" target={sound} getValue={GetLiteAudioNodeVolume} setValue={setVolume} min={0} step={0.01} />
            <AudioOutputProperty engine={engine} node={sound} selectionService={selectionService} />
            {"buffer" in sound ? (
                <ComputedProperty component={StringifiedPropertyLine} label="Duration" target={sound} getValue={GetBufferDuration} precision={2} units="s" />
            ) : (
                <ComputedProperty component={StringifiedPropertyLine} label="Preloaded Instances" target={sound} getValue={GetPreloadedCount} />
            )}
        </>
    );
};

/** @internal */
export const LiteAudioSoundCommands: FunctionComponent<{ engine: AudioEngine; sound: AudioSound; audioEngineContext: IAudioEngineContext }> = (props) => {
    const { engine, sound, audioEngineContext } = props;
    const watcher = useWatcher();
    const state = useWatchedValue(sound, GetSoundState);
    const playing = state === SoundState.Starting || state === SoundState.Started;
    const isSoundInGraph = () => {
        const graph = GetLiteAudioGraph(engine);
        if (!graph) {
            Logger.Warn("Babylon Lite sound playback is unavailable: the audio engine layout is unsupported.");
            return false;
        }
        return !!GetLiteAudioEntry(graph, sound);
    };
    return (
        <>
            <ButtonLine
                uniqueId="LiteAudioPlay"
                label="Play"
                icon={PlayRegular}
                disabled={playing}
                onClick={async () => {
                    if (audioEngineContext.audioEngine !== engine || !isSoundInGraph()) {
                        return;
                    }
                    let engineChanged = false;
                    const observer = audioEngineContext.onAudioEngineChanged.addOnce(() => {
                        engineChanged = true;
                    });
                    try {
                        await unlockAudioEngineAsync(engine);
                    } catch (error) {
                        Logger.Error(`Babylon Lite audio unlock failed: ${error}`);
                        return;
                    } finally {
                        observer.remove(true);
                    }
                    if (engineChanged || audioEngineContext.audioEngine !== engine || !isSoundInGraph()) {
                        return;
                    }
                    if ("buffer" in sound) {
                        playSound(sound);
                    } else {
                        playStreamingSound(sound);
                    }
                    watcher.refresh();
                }}
            />
            <ButtonLine
                uniqueId="LiteAudioPause"
                label="Pause"
                icon={PauseRegular}
                disabled={!playing}
                onClick={() => {
                    if ("buffer" in sound) {
                        pauseSound(sound);
                    } else {
                        pauseStreamingSound(sound);
                    }
                    watcher.refresh();
                }}
            />
            <ButtonLine
                uniqueId="LiteAudioStop"
                label="Stop"
                icon={StopRegular}
                disabled={state === SoundState.Stopped}
                onClick={() => {
                    if ("buffer" in sound) {
                        stopSound(sound);
                    } else {
                        stopStreamingSound(sound);
                    }
                    watcher.refresh();
                }}
            />
        </>
    );
};

/** @internal */
export const LiteAudioSourceProperties: FunctionComponent<{ engine: AudioEngine; source: AudioInputSource; selectionService: ISelectionService }> = (props) => {
    const { engine, source, selectionService } = props;
    const watcher = useWatcher();
    const setVolume = useCallback(
        (target: AudioInputSource, value: number) => {
            setSoundSourceVolume(target, value);
            watcher.refresh();
        },
        [watcher]
    );
    return (
        <>
            <ComputedProperty component={TextPropertyLine} label="Name" target={source} getValue={GetNodeName} />
            <DerivedProperty component={NumberInputPropertyLine} label="Volume" target={source} getValue={GetLiteAudioNodeVolume} setValue={setVolume} min={0} step={0.01} />
            <AudioOutputProperty engine={engine} node={source} selectionService={selectionService} />
        </>
    );
};
