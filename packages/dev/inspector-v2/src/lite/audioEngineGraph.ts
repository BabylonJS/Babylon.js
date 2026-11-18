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
    type Vec3,
} from "@babylonjs/lite";

type AudioGraphEntry =
    | { readonly kind: "main-bus"; readonly entity: MainBus; readonly output: null }
    | { readonly kind: "bus"; readonly entity: AudioBus; readonly output: PrimaryAudioBus | null }
    | { readonly kind: "static-sound"; readonly entity: StaticSound; readonly output: PrimaryAudioBus | null }
    | { readonly kind: "streaming-sound"; readonly entity: StreamingSound; readonly output: PrimaryAudioBus | null }
    | { readonly kind: "source"; readonly entity: AudioInputSource; readonly output: PrimaryAudioBus | null };

export type LiteAudioGraph = Readonly<{
    engine: AudioEngine;
    entries: readonly AudioGraphEntry[];
}>;

export type LiteAudioGraphEntry = AudioGraphEntry;

export type LiteSpatialInfo = { readonly status: "disabled" | "unsupported" } | { readonly status: "enabled"; readonly attachedTo: SpatialTarget | null; readonly position: Vec3 };

export type LiteAudioAttachment = Readonly<{
    entity: AudioEngine | AudioGraphHost;
    kind: "listener" | Exclude<AudioGraphEntry["kind"], "main-bus">;
    name: string;
}>;

function IsRecord(value: unknown): value is Record<PropertyKey, unknown> {
    return typeof value === "object" && value !== null;
}

function IsIterable(value: unknown): value is Iterable<unknown> {
    return IsRecord(value) && typeof value[Symbol.iterator] === "function";
}

function IsBus(value: unknown): value is PrimaryAudioBus {
    return IsRecord(value) && typeof value.name === "string";
}

function HasVolumeRamp(value: unknown): boolean {
    return IsRecord(value) && IsRecord(value._volumeRamp) && typeof value._volumeRamp._targetValue === "number";
}

function IsGraphHost(value: unknown): boolean {
    return IsRecord(value) && IsRecord(value._graph) && HasVolumeRamp(value._graph) && "_spatial" in value._graph && "_outBus" in value;
}

function IsAudioBus(value: unknown): value is AudioBus {
    return IsBus(value) && IsGraphHost(value);
}

function IsSound(value: unknown): boolean {
    return (
        IsRecord(value) &&
        IsGraphHost(value) &&
        typeof value.state === "number" &&
        typeof value.instanceCount === "number" &&
        IsRecord(value.onEnded) &&
        typeof value.onEnded.add === "function" &&
        typeof value.onEnded.addOnce === "function"
    );
}

function IsStaticSound(value: unknown): value is StaticSound {
    return (
        IsSound(value) &&
        IsRecord(value) &&
        IsRecord(value.buffer) &&
        typeof value.buffer.duration === "number" &&
        typeof value.buffer.sampleRate === "number" &&
        typeof value.buffer.channelCount === "number" &&
        typeof value.buffer.length === "number"
    );
}

function IsStreamingSound(value: unknown): value is StreamingSound {
    return IsSound(value) && IsRecord(value) && typeof value.preloadCompletedCount === "number";
}

function IsAudioInputSource(value: unknown): value is AudioInputSource {
    return IsRecord(value) && IsGraphHost(value) && typeof value.name === "string" && "_node" in value;
}

function GetOutput(value: object): PrimaryAudioBus | null | undefined {
    if (!IsRecord(value)) {
        return undefined;
    }
    const output = value._outBus;
    return output === null ? null : IsBus(output) ? output : undefined;
}

/**
 * Reads the current Lite audio graph. The public Lite API does not yet expose graph discovery,
 * so all version-specific, read-only access is isolated and checked here.
 * @param engine The audio engine to inspect.
 * @returns The graph, or null if its internal layout is unsupported.
 * @internal
 */
export function GetLiteAudioGraph(engine: AudioEngine): LiteAudioGraph | null {
    if (!IsRecord(engine) || !IsBus(engine._mainBus) || !HasVolumeRamp(engine._mainBus) || !IsIterable(engine._buses) || !IsIterable(engine._sounds)) {
        return null;
    }

    const entries: AudioGraphEntry[] = [{ kind: "main-bus", entity: engine._mainBus, output: null }];
    for (const bus of engine._buses) {
        if (!IsAudioBus(bus)) {
            return null;
        }
        const output = GetOutput(bus);
        if (output === undefined) {
            return null;
        }
        entries.push({ kind: "bus", entity: bus, output });
    }
    for (const sound of engine._sounds) {
        if (!IsRecord(sound)) {
            return null;
        }
        const output = GetOutput(sound);
        if (output === undefined) {
            return null;
        }
        if (IsStaticSound(sound)) {
            entries.push({ kind: "static-sound", entity: sound, output });
        } else if (IsStreamingSound(sound)) {
            entries.push({ kind: "streaming-sound", entity: sound, output });
        } else if (IsAudioInputSource(sound)) {
            entries.push({ kind: "source", entity: sound, output });
        } else {
            return null;
        }
    }
    return { engine, entries };
}

/** @internal */
export function GetLiteAudioEntry(graph: LiteAudioGraph, entity: unknown): LiteAudioGraphEntry | undefined {
    return graph.entries.find((entry) => entry.entity === entity);
}

/** @internal */
export function GetLiteAudioEntryName(graph: LiteAudioGraph, entry: LiteAudioGraphEntry): string {
    if (entry.kind === "main-bus") {
        return entry.entity.name ? `Main Bus (${entry.entity.name})` : "Main Bus";
    }
    if (entry.entity.name) {
        return entry.entity.name;
    }
    const index = graph.entries.filter((candidate) => candidate.kind === entry.kind).findIndex((candidate) => candidate.entity === entry.entity) + 1;
    switch (entry.kind) {
        case "bus":
            return `Audio Bus ${index}`;
        case "static-sound":
            return `Static Sound ${index}`;
        case "streaming-sound":
            return `Streaming Sound ${index}`;
        case "source":
            return `Sound Source ${index}`;
    }
}

/** @internal */
export function GetLiteAudioNodeVolume(node: object): number {
    const graph = IsRecord(node) && IsRecord(node._graph) ? node._graph : node;
    if (IsRecord(graph) && IsRecord(graph._volumeRamp) && typeof graph._volumeRamp._targetValue === "number") {
        return graph._volumeRamp._targetValue;
    }
    throw new Error("The audio node volume is unavailable in this Babylon Lite version.");
}

function IsVec3(value: unknown): value is Vec3 {
    return IsRecord(value) && typeof value.x === "number" && typeof value.y === "number" && typeof value.z === "number";
}

function IsSpatialTarget(value: unknown): value is SpatialTarget {
    return IsRecord(value) && IsRecord(value.worldMatrix) && value.worldMatrix.length === 16 && typeof value.worldMatrix[12] === "number";
}

/** @internal */
export function GetLiteAudioSpatialInfo(target: AudioEngine | AudioGraphHost): LiteSpatialInfo {
    if (!IsRecord(target)) {
        return { status: "unsupported" };
    }
    let spatial: unknown;
    if ("_listener" in target) {
        spatial = target._listener;
    } else if (IsRecord(target._graph) && "_spatial" in target._graph) {
        spatial = target._graph._spatial;
    } else {
        return { status: "unsupported" };
    }
    if (spatial === null) {
        return { status: "disabled" };
    }
    if (!IsRecord(spatial) || !("_attached" in spatial) || !IsVec3(spatial._position) || (spatial._attached !== null && !IsSpatialTarget(spatial._attached))) {
        return { status: "unsupported" };
    }
    return { status: "enabled", attachedTo: spatial._attached, position: spatial._position };
}

/**
 * Finds audio nodes and the listener directly attached to a spatial target.
 * @param graph The inspected audio graph.
 * @param target The scene entity whose audio attachments are requested.
 * @returns The attachments, or null when spatial inspection is unsupported.
 * @internal
 */
export function GetLiteAudioAttachments(graph: LiteAudioGraph, target: SpatialTarget): readonly LiteAudioAttachment[] | null {
    const attachments: LiteAudioAttachment[] = [];
    const listener = GetLiteAudioSpatialInfo(graph.engine);
    if (listener.status === "unsupported") {
        return null;
    }
    if (listener.status === "enabled" && listener.attachedTo === target) {
        attachments.push({ entity: graph.engine, kind: "listener", name: "Audio Engine" });
    }
    for (const entry of graph.entries) {
        if (entry.kind === "main-bus") {
            continue;
        }
        const spatial = GetLiteAudioSpatialInfo(entry.entity);
        if (spatial.status === "unsupported") {
            return null;
        }
        if (spatial.status === "enabled" && spatial.attachedTo === target) {
            attachments.push({ entity: entry.entity, kind: entry.kind, name: GetLiteAudioEntryName(graph, entry) });
        }
    }
    return attachments;
}
