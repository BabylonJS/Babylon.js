import { type IGlbDocument } from "./khrGlbBehaviorAuthoring";
import { Vector3 } from "core/Maths/math.vector";
import { RandomGUID } from "core/Misc/guid";

/** Editor-owned audio metadata, pending standardized playback controls. */
export const ContactAudioExtrasKey = "babylonContactAudio";
/** Encoded bytes allowed per imported clip. */
export const MaxContactAudioBytes = 10 * 1024 * 1024;
/** Decoded duration allowed per imported clip. */
export const MaxContactAudioSeconds = 30;

/** One encoded audio asset. */
export interface IContactAudioAsset {
    /** Display name of the encoded clip. */
    name: string;
    /** Embedded encoded bytes, retained without transcoding. */
    uri: string;
    /** Media type for browser decoding. */
    mimeType: string;
}
/** Persisted sphere or box contact proxy in local mesh coordinates. */
export interface IContactShape {
    /** Original glTF node index. */
    node: number;
    /** Supported contact or emitter shape. */
    type: "sphere" | "box";
    /** Center of the rigid contact proxy. */
    center: number[];
    /** Positive half extents along the three local axes. */
    halfSize: number[];
}
/** A named cue binding for a set of unordered contact pairs. */
export interface IContactAudioRule {
    /** Stable document-local playback cue identifier. */
    cue: string;
    /** Sphere node indices that produce contacts. */
    objects: number[];
    /** Sphere or box node indices to contact. */
    partners: number[];
    /** Index of the positional emitter for this cue. */
    emitter: number;
}
/** Audio/source/emitter separation follows the audio emitter proposal. */
export interface IContactAudioDocument {
    /** Version of the editor metadata schema. */
    version: 1;
    /** Encoded audio assets, shared by playback sources. */
    audio: IContactAudioAsset[];
    /** Playback sources referencing audio assets. */
    sources: { audio: number; gain: number; loop: false; autoplay: false }[];
    /** Positional emitters referencing playback sources. */
    emitters: { type: "positional"; sources: number[] }[];
    /** Rigid contact proxies keyed by source node index. */
    shapes: IContactShape[];
    /** Contact pair bindings and their playback cues. */
    rules: IContactAudioRule[];
}
/** A sphere in world coordinates. */
export interface IContactSphere {
    /** Supported contact or emitter shape. */
    type: "sphere";
    /** Center of the rigid contact proxy. */
    center: Vector3;
    /** Sphere radius in world units. */
    radius: number;
}
/** An orthogonal box in world coordinates. */
export interface IContactBox {
    /** Supported contact or emitter shape. */
    type: "box";
    /** Center of the rigid contact proxy. */
    center: Vector3;
    /** Three normalized orthogonal world-space axes. */
    axes: Vector3[];
    /** Positive half extents along the three local axes. */
    halfSize: number[];
}
/** Supported world-space contact shapes. */
export type ContactShape = IContactSphere | IContactBox;

/**
 * Validate the encoded input before invoking a browser decoder.
 * @param name file name
 * @param size encoded byte count
 * @param bytes container header
 * @returns the detected audio media type
 */
export function ValidateContactAudioFile(name: string, size: number, bytes: Uint8Array): string {
    if (size > MaxContactAudioBytes) {
        throw new Error("Choose an audio file of 10 MB or less.");
    }
    if (size === 0) {
        throw new Error("The audio file is empty. Choose another file.");
    }
    const header = new TextDecoder("latin1").decode(bytes.subarray(0, 256));
    if (/\.(ogg|opus)$/i.test(name) && header.startsWith("OggS")) {
        if (!header.includes("OpusHead")) {
            throw new Error("Choose an Ogg Opus file; other Ogg codecs are not supported by this chooser.");
        }
        return "audio/ogg";
    }
    if (/\.mp3$/i.test(name) && (header.startsWith("ID3") || (bytes[0] === 255 && (bytes[1] & 0xe6) === 0xe2))) {
        return "audio/mpeg";
    }
    if (/\.aac$/i.test(name) && bytes[0] === 255 && (bytes[1] & 0xf6) === 0xf0) {
        return "audio/aac";
    }
    if (/\.(m4a|mp4)$/i.test(name) && header.substring(4, 8) === "ftyp") {
        return "audio/mp4";
    }
    throw new Error("The file contents do not match MP3, AAC, or Ogg Opus. Choose another audio file.");
}
/**
 * Read and validate editor-owned contact sound metadata.
 * @param document source glTF document
 * @returns validated metadata, or an empty document when absent
 */
export function ReadContactAudio(document: IGlbDocument): IContactAudioDocument {
    const extras = document.extras as Record<string, unknown> | undefined;
    const data = extras?.[ContactAudioExtrasKey] as IContactAudioDocument | undefined;
    if (data === undefined) {
        return { version: 1, audio: [], sources: [], emitters: [], shapes: [], rules: [] };
    }
    if (data?.version !== 1) {
        throw new Error("Unsupported contact audio version. The source metadata has been retained.");
    }
    const malformed = () => {
        throw new Error("Malformed contact audio metadata. The source metadata has been retained.");
    };
    const nodeCount = Array.isArray(document.nodes) ? document.nodes.length : 0;
    const validNode = (index: number) => Number.isInteger(index) && index >= 0 && index < nodeCount;
    const validIndex = (index: number, length: number) => Number.isInteger(index) && index >= 0 && index < length;
    const vector = (value: number[]) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
    if (
        ![data.audio, data.sources, data.emitters, data.shapes, data.rules].every(Array.isArray) ||
        data.rules.length > 64 ||
        data.sources.length > 64 ||
        data.emitters.length > 64 ||
        data.shapes.length > 256
    ) {
        malformed();
    }
    if (data.audio.length > 16) {
        throw new Error("Choose at most 16 sound assets. Remove a reaction or reuse a saved sound.");
    }
    let totalBytes = 0;
    for (const asset of data.audio) {
        const match = typeof asset?.uri === "string" && /^data:(audio\/mpeg|audio\/aac|audio\/mp4|audio\/ogg|audio\/wav);base64,([A-Za-z0-9+/]*={0,2})$/.exec(asset.uri);
        if (!match || typeof asset.name !== "string" || !asset.name || asset.name.length > 200 || match[1] !== asset.mimeType || match[2].length % 4 !== 0) {
            malformed();
        }
        const encoded = (match as RegExpExecArray)[2];
        const bytes = (encoded.length / 4) * 3 - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
        if (bytes > MaxContactAudioBytes || bytes === 0) {
            malformed();
        }
        totalBytes += bytes;
    }
    if (totalBytes > 20 * 1024 * 1024) {
        throw new Error("Contact audio exceeds the 20 MB asset budget. Remove an unused sound first.");
    }
    if (
        data.sources.some(
            (source) =>
                !source ||
                !validIndex(source.audio, data.audio.length) ||
                !Number.isFinite(source.gain) ||
                source.gain < 0 ||
                source.gain > 1 ||
                source.loop !== false ||
                source.autoplay !== false
        )
    ) {
        malformed();
    }
    if (
        data.emitters.some(
            (emitter) =>
                !emitter || emitter.type !== "positional" || !Array.isArray(emitter.sources) || emitter.sources.length !== 1 || !validIndex(emitter.sources[0], data.sources.length)
        )
    ) {
        malformed();
    }
    const shapes = new Map<number, IContactShape>();
    for (const shape of data.shapes) {
        if (
            !shape ||
            !validNode(shape.node) ||
            shapes.has(shape.node) ||
            !["sphere", "box"].includes(shape.type) ||
            !vector(shape.center) ||
            !vector(shape.halfSize) ||
            shape.halfSize.some((size) => size <= 0)
        ) {
            malformed();
        }
        shapes.set(shape.node, shape);
    }
    const cues = new Set<string>();
    const allPairs = new Set<string>();
    for (const rule of data.rules) {
        if (
            !rule ||
            typeof rule.cue !== "string" ||
            !rule.cue ||
            rule.cue.length > 128 ||
            cues.has(rule.cue) ||
            !validIndex(rule.emitter, data.emitters.length) ||
            !Array.isArray(rule.objects) ||
            !Array.isArray(rule.partners) ||
            !rule.objects.length ||
            !rule.partners.length ||
            new Set(rule.objects).size !== rule.objects.length ||
            new Set(rule.partners).size !== rule.partners.length ||
            rule.objects.some((index) => shapes.get(index)?.type !== "sphere") ||
            rule.partners.some((index) => !shapes.has(index))
        ) {
            malformed();
        }
        const pairs = ContactPairs(rule);
        if (!pairs.length || pairs.length > 256 || pairs.some(([a, b]) => allPairs.has(`${a}:${b}`))) {
            throw new Error("Choose distinct contact pairs, with at most 256 pairs and one sound reaction per pair.");
        }
        pairs.forEach(([a, b]) => allPairs.add(`${a}:${b}`));
        if (allPairs.size > 256) {
            throw new Error("Choose at most 256 contact pairs in the scene.");
        }
        cues.add(rule.cue);
    }
    return data;
}

/**
 * Enumerate unordered pairs without self-contact or duplicate ball-pair notifications.
 * @param rule source and partner selections
 * @returns distinct source-indexed pairs
 */
export function ContactPairs(rule: Pick<IContactAudioRule, "objects" | "partners">): [number, number][] {
    const pairs = new Map<string, [number, number]>();
    for (const a of rule.objects) {
        for (const b of rule.partners) {
            if (a !== b) {
                const pair: [number, number] = a < b ? [a, b] : [b, a];
                pairs.set(pair.join(":"), pair);
                if (pairs.size > 256) {
                    throw new Error("Choose at most 256 contact pairs.");
                }
            }
        }
    }
    return [...pairs.values()];
}

/**
 * Add or replace a reaction without changing the imported scene or its existing graphs.
 * @param document source glTF document
 * @param objects sphere node indices
 * @param partners contact partner node indices
 * @param shapes proxies for the selected nodes
 * @param asset encoded audio resource
 * @param cue existing cue to replace, or undefined to add
 * @returns validated contact metadata
 */
export function SetContactAudioReaction(
    document: IGlbDocument,
    objects: number[],
    partners: number[],
    shapes: IContactShape[],
    asset: IContactAudioAsset,
    cue?: string
): IContactAudioDocument {
    const existing = ReadContactAudio(document);
    const bindings = existing.rules
        .filter((rule) => rule.cue !== cue)
        .map((rule) => {
            const source = existing.sources[existing.emitters[rule.emitter].sources[0]];
            return { rule, asset: existing.audio[source.audio], gain: source.gain };
        });
    const newCue = cue ?? `contact.${RandomGUID()}`;
    const edited = existing.rules.find((rule) => rule.cue === cue);
    const gain = edited ? existing.sources[existing.emitters[edited.emitter].sources[0]].gain : 1;
    bindings.push({ rule: { cue: newCue, objects, partners, emitter: 0 }, asset, gain });
    return _RebuildContactAudio(
        document,
        existing,
        bindings,
        shapes.filter((shape) => objects.includes(shape.node) || partners.includes(shape.node))
    );
}

/**
 * Remove a reaction and release encoded resources no longer used by any cue.
 * @param document source glTF document
 * @param cue cue to remove
 * @returns validated metadata with unused resources removed
 */
export function RemoveContactAudioReaction(document: IGlbDocument, cue: string): IContactAudioDocument {
    const existing = ReadContactAudio(document);
    const bindings = existing.rules
        .filter((rule) => rule.cue !== cue)
        .map((rule) => {
            const source = existing.sources[existing.emitters[rule.emitter].sources[0]];
            return { rule, asset: existing.audio[source.audio], gain: source.gain };
        });
    return _RebuildContactAudio(document, existing, bindings, []);
}

function _RebuildContactAudio(
    document: IGlbDocument,
    existing: IContactAudioDocument,
    bindings: { rule: IContactAudioRule; asset: IContactAudioAsset; gain: number }[],
    shapes: IContactShape[]
): IContactAudioDocument {
    const data: IContactAudioDocument = { ...existing, audio: [], sources: [], emitters: [], shapes: [], rules: [] };
    for (const binding of bindings) {
        let index = data.audio.findIndex((entry) => entry.uri === binding.asset.uri);
        if (index < 0) {
            index = data.audio.push(binding.asset) - 1;
        }
        const source = data.sources.push({ audio: index, gain: binding.gain, loop: false, autoplay: false }) - 1;
        const emitter = data.emitters.push({ type: "positional", sources: [source] }) - 1;
        data.rules.push({ ...binding.rule, emitter });
    }
    const usedNodes = new Set(data.rules.flatMap((rule) => [...rule.objects, ...rule.partners]));
    const byNode = new Map([...existing.shapes, ...shapes].map((shape) => [shape.node, shape]));
    data.shapes = [...byNode.values()].filter((shape) => usedNodes.has(shape.node));
    ReadContactAudio({ ...document, extras: { [ContactAudioExtrasKey]: data } });
    return data;
}
/**
 * Surface distance and a world-space point for supported shape pairs.
 * @param a first shape
 * @param b second shape
 * @returns contact distance and point, or null for an unsupported pair
 */
export function ContactGap(a: ContactShape, b: ContactShape): { gap: number; point: Vector3 } | null {
    if (a.type === "sphere" && b.type === "sphere") {
        const direction = b.center.subtract(a.center);
        const distance = direction.length();
        const point = distance > 0 ? a.center.add(direction.scale(a.radius / distance)) : a.center.clone();
        return { gap: distance - a.radius - b.radius, point };
    }
    if (a.type === "box" && b.type === "sphere") {
        return ContactGap(b, a);
    }
    if (a.type !== "sphere" || b.type !== "box") {
        return null;
    }
    const delta = a.center.subtract(b.center);
    const local = b.axes.map((axis) => Vector3.Dot(delta, axis));
    const closest = local.map((value, index) => Math.max(-b.halfSize[index], Math.min(b.halfSize[index], value)));
    const inside = local.every((value, index) => Math.abs(value) <= b.halfSize[index]);
    if (inside) {
        const distances = local.map((value, index) => b.halfSize[index] - Math.abs(value));
        const axis = distances.indexOf(Math.min(...distances));
        closest[axis] = local[axis] < 0 ? -b.halfSize[axis] : b.halfSize[axis];
    }
    const point = b.center.clone();
    for (let i = 0; i < 3; i++) {
        point.addInPlace(b.axes[i].scale(closest[i]));
    }
    return { gap: (inside ? -1 : 1) * Vector3.Distance(a.center, point) - a.radius, point };
}
/** Track contact onset, with hysteresis and no initial-overlap or resting-contact cues. */
export class ContactTracker {
    private readonly _touching = new Map<string, boolean>();
    /** Clear contact state when stopping or resetting a preview. */
    public reset(): void {
        this._touching.clear();
    }
    /**
     * Return newly touching pairs, de-duplicated regardless of selection order.
     * @param pairs pairs to sample
     * @param shapes currently available world-space shapes
     * @returns new contact cues
     */
    public update(pairs: readonly (readonly [number, number])[], shapes: ReadonlyMap<number, ContactShape>): { nodes: number[]; point: Vector3 }[] {
        const result: { nodes: number[]; point: Vector3 }[] = [];
        const present = new Set<string>();
        for (const [first, second] of pairs) {
            if (first === second) {
                continue;
            }
            const nodes = first < second ? [first, second] : [second, first];
            const key = nodes.join(":");
            if (present.has(key)) {
                continue;
            }
            present.add(key);
            const a = shapes.get(nodes[0]);
            const b = shapes.get(nodes[1]);
            const contact = a && b ? ContactGap(a, b) : null;
            if (!contact || !Number.isFinite(contact.gap)) {
                this._touching.delete(key);
                continue;
            }
            const radius = a!.type === "sphere" ? a!.radius : b!.type === "sphere" ? b!.radius : 0;
            const tolerance = Math.max(1e-6, radius * 0.01);
            const previous = this._touching.get(key);
            const touching = contact.gap <= tolerance * (previous ? 2 : 1);
            this._touching.set(key, touching);
            if (touching && previous === false) {
                result.push({ nodes, point: contact.point });
            }
        }
        for (const key of this._touching.keys()) {
            if (!present.has(key)) {
                this._touching.delete(key);
            }
        }
        return result;
    }
}
