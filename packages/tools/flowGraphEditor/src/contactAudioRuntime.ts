import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { Vector3 } from "core/Maths/math.vector";
import { Observable, type Observer } from "core/Misc/observable";
import { type Scene } from "core/scene";
import { CreateAudioEngineAsync } from "core/AudioV2/webAudio/webAudioEngine";
import { type AudioEngineV2 } from "core/AudioV2/abstractAudio/audioEngineV2";
import { type StaticSound } from "core/AudioV2/abstractAudio/staticSound";
import { GetGlbNodeIndex, type IGlbDocument } from "./khrGlbBehaviorAuthoring";
import {
    ContactPairs,
    ContactTracker,
    ReadContactAudio,
    MaxContactAudioSeconds,
    ValidateContactAudioFile,
    type ContactShape,
    type IContactAudioAsset,
    type IContactAudioDocument,
    type IContactShape,
} from "./contactAudio";

/**
 * Attach editor-owned contact sound bindings after loading their glTF scene.
 * @param scene loaded scene
 * @param document retained source glTF document
 * @param isRunning whether the application's interaction preview is running
 * @param onError playback error callback
 * @returns scene-owned runtime; call enableAsync from a user gesture before playback
 */
export function AttachContactAudio(scene: Scene, document: IGlbDocument, isRunning: () => boolean, onError: (message: string) => void): ContactAudioRuntime {
    const data = ReadContactAudio(document);
    const objects = GetContactObjects(scene.meshes, document.nodes?.length ?? 0);
    const meshes = new Map(objects.map((entry) => [entry.shape.node, entry.mesh]));
    const unavailable = data.shapes.filter((shape) => !meshes.has(shape.node));
    if (unavailable.length) {
        throw new Error(
            `Contact audio objects are unavailable: glTF nodes ${unavailable.map((shape) => shape.node).join(", ")}. Keep their rigid source meshes when reopening this scene.`
        );
    }
    return new ContactAudioRuntime(scene, data, meshes, isRunning, onError);
}

/** A source node available for contact authoring. */
export interface IContactObject {
    /** Loaded mesh with an unambiguous source identity. */
    mesh: AbstractMesh;
    /** Rigid proxy stored in mesh-local coordinates. */
    shape: IContactShape;
    /** Display name including source identity and contact shape. */
    label: string;
}

/**
 * Map unique source node indices to rigid contact proxies, independently of display names.
 * @param meshes imported meshes
 * @param nodeCount original source node count
 * @returns eligible rigid objects in source order
 */
export function GetContactObjects(meshes: AbstractMesh[], nodeCount: number): IContactObject[] {
    const grouped = new Map<number, AbstractMesh[]>();
    for (const mesh of meshes) {
        const node = GetGlbNodeIndex(mesh, nodeCount);
        if (node === undefined || mesh.isDisposed() || !mesh.getTotalVertices()) {
            continue;
        }
        const group = grouped.get(node) ?? [];
        group.push(mesh);
        grouped.set(node, group);
    }
    const objects: IContactObject[] = [];
    for (const [node, group] of grouped) {
        const mesh = group[0];
        if (group.length !== 1 || mesh.skeleton || mesh.morphTargetManager || mesh.isAnInstance || mesh.hasInstances || mesh.hasThinInstances) {
            continue;
        }
        const bounds = mesh.getBoundingInfo().boundingBox;
        const halfSize = bounds.extendSize.asArray();
        if (halfSize.some((size) => !Number.isFinite(size) || size <= 0)) {
            continue;
        }
        const center = bounds.center.asArray();
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
        const radius = Math.max(...halfSize);
        const sphere =
            positions &&
            halfSize.every((size) => Math.abs(size - radius) <= radius * 0.02) &&
            positions.length > 24 &&
            (() => {
                for (let i = 0; i < positions.length; i += 3) {
                    const distance = Math.hypot(positions[i] - center[0], positions[i + 1] - center[1], positions[i + 2] - center[2]);
                    if (Math.abs(distance - radius) > radius * 0.02) {
                        return false;
                    }
                }
                return true;
            })();
        const shape: IContactShape = { node, type: sphere ? "sphere" : "box", center, halfSize };
        if (WorldContactShape(mesh, shape, true)) {
            objects.push({ mesh, shape, label: `${mesh.name || "Object"} (glTF node ${node}, ${shape.type === "sphere" ? "sphere" : "box bounds"})` });
        }
    }
    return objects.sort((a, b) => a.shape.node - b.shape.node);
}

/**
 * Transform a rigid proxy, rejecting singular, sheared, or nonuniform spherical transforms.
 * @param mesh loaded mesh
 * @param shape persisted local proxy
 * @param includeHidden include hidden objects while building the authoring catalog
 * @returns world-space shape, or null when unavailable
 */
export function WorldContactShape(mesh: AbstractMesh, shape: IContactShape, includeHidden = false): ContactShape | null {
    if (
        mesh.isDisposed() ||
        (!includeHidden && (!mesh.isEnabled() || !mesh.isVisible)) ||
        mesh.skeleton ||
        mesh.morphTargetManager ||
        mesh.isAnInstance ||
        mesh.hasInstances ||
        mesh.hasThinInstances
    ) {
        return null;
    }
    const world = mesh.computeWorldMatrix(true);
    const center = Vector3.TransformCoordinates(Vector3.FromArray(shape.center), world);
    const axes = [Vector3.Right(), Vector3.Up(), Vector3.Forward()].map((axis) => Vector3.TransformNormal(axis, world));
    const scales = axes.map((axis) => axis.length());
    if (scales.some((scale) => !Number.isFinite(scale) || scale <= 1e-8) || !center.asArray().every(Number.isFinite)) {
        return null;
    }
    axes.forEach((axis, index) => axis.scaleInPlace(1 / scales[index]));
    if (Math.abs(Vector3.Dot(axes[0], axes[1])) > 1e-5 || Math.abs(Vector3.Dot(axes[0], axes[2])) > 1e-5 || Math.abs(Vector3.Dot(axes[1], axes[2])) > 1e-5) {
        return null;
    }
    const halfSize = shape.halfSize.map((size, index) => size * scales[index]);
    if (shape.type === "sphere") {
        const radius = Math.max(...halfSize);
        const scale = Math.max(...scales);
        if (scales.some((value) => Math.abs(value - scale) > scale * 1e-5)) {
            return null;
        }
        return { type: "sphere", center, radius };
    }
    return { type: "box", center, axes, halfSize };
}

/**
 * Encode original file bytes for durable source-preserving downloads.
 * @param bytes encoded file bytes
 * @param mimeType detected media type
 * @returns embedded data URI
 */
export function ContactAudioDataUri(bytes: Uint8Array, mimeType: string): string {
    const nativeEncode = (bytes as Uint8Array & { toBase64?: () => string }).toBase64;
    if (typeof nativeEncode === "function") {
        return `data:${mimeType};base64,${nativeEncode.call(bytes)}`;
    }
    // Retain the bounded-chunk fallback for older browsers. Array joining and the
    // shared encoder's JS fallback allocated more memory in local browser measurements.
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 8192) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    }
    return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Small synthesized assets with no external sample dependencies.
 * @returns two encoded PCM audition clips
 */
export function CreateContactAudioDefaults(): IContactAudioAsset[] {
    return [
        ["Soft tap", 220],
        ["Bright click", 880],
    ].map(([name, frequency]) => {
        const rate = 22050;
        const samples = 2205;
        const bytes = new Uint8Array(44 + samples * 2);
        const view = new DataView(bytes.buffer);
        const text = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
        text(0, "RIFF");
        view.setUint32(4, bytes.length - 8, true);
        text(8, "WAVE");
        text(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, rate, true);
        view.setUint32(28, rate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        text(36, "data");
        view.setUint32(40, samples * 2, true);
        for (let i = 0; i < samples; i++) {
            const envelope = Math.min(1, i / 40) * Math.exp(-i / 350);
            view.setInt16(44 + i * 2, Math.sin((2 * Math.PI * Number(frequency) * i) / rate) * envelope * 12000, true);
        }
        return { name: String(name), mimeType: "audio/wav", uri: ContactAudioDataUri(bytes, "audio/wav") };
    });
}

async function _DurationAsync(bytes: Uint8Array, mimeType: string): Promise<void> {
    const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mimeType }));
    const element = new Audio();
    try {
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => finish(new Error("This browser could not read the audio. Try MP3 or AAC.")), 10000);
            const finish = (error?: Error) => {
                clearTimeout(timeout);
                element.onloadedmetadata = null;
                element.onerror = null;
                error ? reject(error) : resolve();
            };
            element.onloadedmetadata = () =>
                finish(
                    !Number.isFinite(element.duration) || element.duration <= 0 || element.duration > MaxContactAudioSeconds
                        ? new Error("Choose a sound of 30 seconds or less.")
                        : undefined
                );
            element.onerror = () => finish(new Error("This browser cannot decode this audio file. Try MP3 or AAC."));
            element.preload = "metadata";
            element.src = url;
        });
    } finally {
        element.removeAttribute("src");
        element.load();
        URL.revokeObjectURL(url);
    }
}

/** Named cue runtime for editor-owned contact bindings. This does not modify the physics simulation. */
export class ContactAudioRuntime {
    /** Contact diagnostics and a seam for future standardized graph event adapters. */
    public readonly onCueObservable = new Observable<{ cue: string; nodes: number[]; point: Vector3 }>();
    private readonly _tracker = new ContactTracker();
    private readonly _pairs: [number, number][] = [];
    private readonly _pairCues = new Map<string, string>();
    private readonly _observer: Observer<Scene>;
    private readonly _disposeObserver: Observer<Scene>;
    private readonly _buffers = new Map<string, AudioBuffer>();
    private readonly _voices = new Map<string, StaticSound[]>();
    private _audition: StaticSound | null = null;
    private _auditionGeneration = 0;
    private _context: AudioContext | null = null;
    private _engine: AudioEngineV2 | null = null;
    private _enginePromise: Promise<AudioEngineV2> | null = null;
    private _disposed = false;
    private _wasRunning = false;
    private _ready = false;
    private _enablePromise: Promise<void> | null = null;

    /** Whether the current browser audio context is ready for preview playback. */
    public get ready(): boolean {
        return this._ready && this._context?.state === "running";
    }

    /**
     * Bind the runtime to a scene and its source-indexed meshes.
     * @param _scene preview scene
     * @param _data validated contact bindings; install a new runtime when bindings change
     * @param _meshes source node bindings
     * @param _isRunning whether contact events should dispatch
     * @param _onError playback error callback
     */
    public constructor(
        private readonly _scene: Scene,
        private readonly _data: IContactAudioDocument,
        private readonly _meshes: ReadonlyMap<number, AbstractMesh>,
        private readonly _isRunning: () => boolean,
        private readonly _onError: (message: string) => void
    ) {
        // Bind topology once per installed document; eligibility and transforms remain live.
        for (const rule of _data.rules) {
            for (const pair of ContactPairs(rule)) {
                const key = pair.join(":");
                if (!this._pairCues.has(key)) {
                    this._pairs.push(pair);
                }
                this._pairCues.set(key, rule.cue);
            }
        }
        this._observer = _scene.onAfterRenderObservable.add(() => this._update());
        this._disposeObserver = _scene.onDisposeObservable.add(() => this.dispose());
    }

    private async _getEngineAsync(): Promise<AudioEngineV2> {
        if (this._disposed) {
            throw new Error("The preview scene has changed. Open the sound chooser again.");
        }
        if (!this._enginePromise) {
            this._context = new AudioContext();
            const context = this._context;
            this._enginePromise = (async () => {
                try {
                    const engine = await CreateAudioEngineAsync({ audioContext: context, disableDefaultUI: true, resumeOnInteraction: false, resumeOnPause: false });
                    if (this._disposed) {
                        engine.dispose();
                        throw new Error("The preview scene has changed.");
                    }
                    this._engine = engine;
                    return engine;
                } catch (error) {
                    this._enginePromise = null;
                    await this._closeContextAsync(context);
                    throw error;
                }
            })();
        }
        // Call resume within the button/file-picker gesture, before any decoding awaits.
        void (async () => {
            try {
                await this._context!.resume();
            } catch {
                /* The chooser reports unavailable playback. */
            }
        })();
        return await this._enginePromise;
    }

    private async _closeContextAsync(context: AudioContext): Promise<void> {
        if (context.state === "closed") {
            return;
        }
        try {
            await context.close();
        } catch {
            // Preserve the initialization error if the browser also rejects cleanup.
        }
    }

    private _checkAuditionGeneration(generation?: number): void {
        if (generation !== undefined && generation !== this._auditionGeneration) {
            throw new Error("The sound chooser has closed or the audition has stopped.");
        }
    }

    private async _decodeAsync(asset: IContactAudioAsset, generation?: number): Promise<AudioBuffer> {
        await this._getEngineAsync();
        this._checkAuditionGeneration(generation);
        const cached = this._buffers.get(asset.uri);
        if (cached) {
            return cached;
        }
        const bytes = Uint8Array.from(atob(asset.uri.substring(asset.uri.indexOf(",") + 1)), (char) => char.charCodeAt(0));
        await _DurationAsync(bytes, asset.mimeType);
        this._checkAuditionGeneration(generation);
        const buffer = await this._context!.decodeAudioData(bytes.buffer);
        if (this._disposed) {
            throw new Error("The preview scene has changed.");
        }
        this._checkAuditionGeneration(generation);
        if (buffer.duration > MaxContactAudioSeconds || buffer.numberOfChannels > 2 || buffer.sampleRate > 192000) {
            throw new Error("Choose a mono or stereo sound of 30 seconds or less, at up to 192 kHz.");
        }
        const decodedBytes = buffer.length * buffer.numberOfChannels * 4;
        const total = [...this._buffers.values()].reduce((sum, entry) => sum + entry.length * entry.numberOfChannels * 4, decodedBytes);
        if (total > 64 * 1024 * 1024) {
            throw new Error("The sounds exceed the 64 MB preview budget. Choose shorter clips.");
        }
        this._buffers.set(asset.uri, buffer);
        return buffer;
    }

    /**
     * Validate and audition-decode a local file before accepting it into the document.
     * @param file local audio file
     * @returns the validated encoded resource
     */
    public async importAudioAsync(file: File): Promise<IContactAudioAsset> {
        const generation = this._auditionGeneration;
        const header = new Uint8Array(await file.slice(0, 256).arrayBuffer());
        const mimeType = ValidateContactAudioFile(file.name, file.size, header);
        const asset = { name: file.name.substring(0, 200), mimeType, uri: ContactAudioDataUri(new Uint8Array(await file.arrayBuffer()), mimeType) };
        await this._decodeAsync(asset, generation);
        return asset;
    }

    /**
     * Preview a selected clip independently of the contact sensor.
     * @param asset encoded clip to audition
     */
    public async auditionAsync(asset: IContactAudioAsset): Promise<void> {
        this.stopAudition();
        const generation = this._auditionGeneration;
        const buffer = await this._decodeAsync(asset, generation);
        const engine = await this._getEngineAsync();
        this._checkAuditionGeneration(generation);
        const voice = await engine.createSoundAsync("Contact audition", buffer, { autoplay: false, loop: false, maxInstances: 1 });
        if (this._disposed || generation !== this._auditionGeneration) {
            voice.dispose();
            return;
        }
        this._audition = voice;
        voice.play();
    }

    /**
     * End the chooser's audition without interrupting the scene's named cues.
     * @param releaseUnsavedBuffers release decoded clips that were not saved into the scene
     */
    public stopAudition(releaseUnsavedBuffers = false): void {
        this._auditionGeneration++;
        this._audition?.dispose();
        this._audition = null;
        if (releaseUnsavedBuffers) {
            const saved = new Set(this._data.audio.map((asset) => asset.uri));
            for (const uri of this._buffers.keys()) {
                if (!saved.has(uri)) {
                    this._buffers.delete(uri);
                }
            }
        }
    }

    /** Prepare four independently positioned voices per cue, sharing decoded asset buffers. */
    public async enableAsync(): Promise<void> {
        const engine = await this._getEngineAsync();
        if (this._ready) {
            await engine.resumeAsync();
            if (!this.ready) {
                throw new Error("Sound is paused by the browser. Choose Enable sound again.");
            }
            return;
        }
        if (this._enablePromise) {
            await this._enablePromise;
            return;
        }
        this._enablePromise = this._prepareVoicesAsync(engine);
        try {
            await this._enablePromise;
        } finally {
            this._enablePromise = null;
        }
    }

    private async _prepareVoicesAsync(engine: AudioEngineV2): Promise<void> {
        try {
            for (const rule of this._data.rules) {
                const source = this._data.sources[this._data.emitters[rule.emitter].sources[0]];
                // Decode sequentially so the aggregate memory budget is checked before allocating the next clip.
                // eslint-disable-next-line no-await-in-loop
                const buffer = await this._decodeAsync(this._data.audio[source.audio]);
                const voices: StaticSound[] = [];
                this._voices.set(rule.cue, voices);
                for (let i = 0; i < 4; i++) {
                    // eslint-disable-next-line no-await-in-loop
                    const voice = await engine.createSoundAsync(rule.cue, buffer, {
                        spatialEnabled: true,
                        spatialPanningModel: "HRTF",
                        spatialMinDistance: 1,
                        volume: source.gain,
                        loop: false,
                        autoplay: false,
                        maxInstances: 1,
                    });
                    if (this._disposed) {
                        voice.dispose();
                        throw new Error("The preview scene has changed.");
                    }
                    voices.push(voice);
                }
            }
            this._ready = true;
        } catch (error) {
            for (const [cue, voices] of this._voices) {
                voices.forEach((voice) => voice.dispose());
                this._voices.delete(cue);
            }
            throw error;
        }
        if (!this.ready) {
            throw new Error("Sound is paused by the browser. Choose Enable sound again.");
        }
    }

    /**
     * Play a document-local named cue at a world-space contact point.
     * @param cue playback cue identifier
     * @param point world-space contact position
     */
    public playCue(cue: string, point: Vector3): void {
        if (!this.ready) {
            return;
        }
        const voice = this._voices.get(cue)?.find((entry) => entry.activeInstancesCount === 0);
        if (voice) {
            voice.spatial.position = point;
            voice.play();
        }
    }

    /** Stop all voices and forget contact history on Stop, Reset, or preview replacement. */
    public reset(): void {
        this._tracker.reset();
        this._voices.forEach((voices) => voices.forEach((voice) => voice.stop()));
        this.stopAudition();
        this._wasRunning = false;
    }

    private _update(): void {
        if (!this._isRunning()) {
            if (this._wasRunning) {
                this.reset();
            }
            return;
        }
        this._wasRunning = true;
        if (this._engine && this._scene.activeCamera && this._engine.listener.attachedNode !== this._scene.activeCamera) {
            this._engine.listener.attach(this._scene.activeCamera);
        }
        const shapes = new Map<number, ContactShape>();
        for (const shape of this._data.shapes) {
            const mesh = this._meshes.get(shape.node);
            const world = mesh ? WorldContactShape(mesh, shape) : null;
            if (world) {
                shapes.set(shape.node, world);
            }
        }
        for (const contact of this._tracker.update(this._pairs, shapes)) {
            const cue = this._pairCues.get(contact.nodes.join(":"));
            if (cue) {
                this.onCueObservable.notifyObservers({ cue, ...contact });
                try {
                    this.playCue(cue, contact.point);
                } catch (error) {
                    this._onError(`Contact sound could not play: ${String(error)}`);
                }
            }
        }
    }

    /** Release observers, decoders, voices, and the editor-owned audio engine. */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.reset();
        this._observer.remove();
        this._disposeObserver.remove();
        this._voices.forEach((voices) => voices.forEach((voice) => voice.dispose()));
        this._voices.clear();
        this.stopAudition();
        this._buffers.clear();
        this.onCueObservable.clear();
        this._engine?.dispose();
        if (!this._engine && this._context) {
            void this._closeContextAsync(this._context);
        }
    }
}
