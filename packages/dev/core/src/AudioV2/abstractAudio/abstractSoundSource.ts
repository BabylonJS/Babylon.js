import { type Nullable } from "../../types";
import { AudioNodeType } from "./abstractAudioNode";
import { type IAbstractAudioOutNodeOptions, AbstractAudioOutNode } from "./abstractAudioOutNode";
import { type PrimaryAudioBus } from "./audioBus";
import { type AudioEngineV2 } from "./audioEngineV2";
import { type AbstractSpatialAudio, type ISpatialAudioOptions } from "./subProperties/abstractSpatialAudio";
import { type AbstractStereoAudio, type IStereoAudioOptions } from "./subProperties/abstractStereoAudio";

/**
 * Options for creating a sound source.
 */
export interface ISoundSourceOptions extends IAbstractAudioOutNodeOptions, ISpatialAudioOptions, IStereoAudioOptions {
    /**
     * The output bus for the sound source. Defaults to `null`.
     * - If not set or `null`, and `outBusAutoDefault` is `true`, then the sound source is automatically connected to the audio engine's default main bus.
     * @see {@link AudioEngineV2.defaultMainBus}
     */
    outBus: Nullable<PrimaryAudioBus>;

    /**
     * Whether the sound's `outBus` should default to the audio engine's main bus. Defaults to `true` for all sound sources except microphones.
     */
    outBusAutoDefault: boolean;

    /**
     * Whether a `MediaStream`-backed sound source (for example, a `MediaStreamAudioSourceNode` created from a remote
     * WebRTC stream) is automatically kept audible by attaching its `MediaStream` to a hidden, muted `HTMLAudioElement`.
     * Defaults to `true`.
     *
     * Some browsers (notably Chromium) only deliver audio samples from a `MediaStreamAudioSourceNode` while the
     * underlying `MediaStream` is also being pulled by an `HTMLMediaElement`. Without this, a remote WebRTC stream routed
     * through the Web Audio graph is silent and therefore cannot be heard or spatialized. The attached element is muted
     * so it does not add a second, non-spatial playback of the stream.
     *
     * Set this to `false` if you are already routing the same `MediaStream` through your own `HTMLMediaElement`, to avoid
     * creating a redundant one. Has no effect for sources that are not backed by a `MediaStreamAudioSourceNode`.
     */
    mediaStreamSinkEnabled: boolean;

    /**
     * Whether disposing the sound source stops the tracks of its backing `MediaStream` (via `MediaStreamTrack.stop()`).
     * Defaults to `false`.
     *
     * When the `MediaStream` is owned by the caller (for example, a remote WebRTC stream), stopping its tracks on dispose
     * would permanently end them and could not be resumed without renegotiation, so the sound source leaves the stream
     * lifecycle to the caller by default. The microphone source enables this so it releases the capture device it owns.
     *
     * Set this to `true` if the sound source should own and stop the stream's tracks when disposed. Has no effect for
     * sources that are not backed by a `MediaStreamAudioSourceNode`.
     */
    stopMediaStreamTracksOnDispose: boolean;
}

/**
 * Abstract class representing a sound in the audio engine.
 */
export abstract class AbstractSoundSource extends AbstractAudioOutNode {
    private readonly _spatialAutoUpdate: boolean = true;
    private readonly _spatialMinUpdateTime: number = 0;
    private _outBus: Nullable<PrimaryAudioBus> = null;
    private _spatial: Nullable<AbstractSpatialAudio> = null;

    protected constructor(name: string, engine: AudioEngineV2, options: Partial<ISoundSourceOptions>, nodeType: AudioNodeType = AudioNodeType.HAS_OUTPUTS) {
        super(name, engine, nodeType);

        if (typeof options.spatialAutoUpdate === "boolean") {
            this._spatialAutoUpdate = options.spatialAutoUpdate;
        }

        if (typeof options.spatialMinUpdateTime === "number") {
            this._spatialMinUpdateTime = options.spatialMinUpdateTime;
        }
    }

    /**
     * The output bus for the sound.
     * @see {@link AudioEngineV2.defaultMainBus}
     */
    public get outBus(): Nullable<PrimaryAudioBus> {
        return this._outBus;
    }

    public set outBus(outBus: Nullable<PrimaryAudioBus>) {
        if (this._outBus === outBus) {
            return;
        }

        if (this._outBus) {
            if (this._onOutBusDisposed) {
                this._outBus.onDisposeObservable.removeCallback(this._onOutBusDisposed);
                this._onOutBusDisposed = null;
            }
            if (!this._disconnect(this._outBus)) {
                throw new Error("Disconnect failed");
            }
        }

        this._outBus = outBus;

        if (this._outBus) {
            this._onOutBusDisposed = () => {
                this._outBus = null;
            };
            this._outBus.onDisposeObservable.add(this._onOutBusDisposed);
            if (!this._connect(this._outBus)) {
                throw new Error("Connect failed");
            }
        }
    }

    /**
     * The spatial audio features.
     */
    public get spatial(): AbstractSpatialAudio {
        if (this._spatial) {
            return this._spatial;
        }
        return this._initSpatialProperty();
    }

    /**
     * The stereo features of the sound.
     */
    public abstract stereo: AbstractStereoAudio;

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this._spatial?.dispose();
        this._spatial = null;

        if (this._outBus && this._onOutBusDisposed) {
            this._outBus.onDisposeObservable.removeCallback(this._onOutBusDisposed);
            this._onOutBusDisposed = null;
        }
        this._outBus = null;
    }

    protected abstract _createSpatialProperty(autoUpdate: boolean, minUpdateTime: number): AbstractSpatialAudio;

    protected _initSpatialProperty(): AbstractSpatialAudio {
        return (this._spatial = this._createSpatialProperty(this._spatialAutoUpdate, this._spatialMinUpdateTime));
    }

    private _onOutBusDisposed: Nullable<() => void> = null;

    /** @internal */
    public get _isSpatial(): boolean {
        return this._spatial !== null;
    }

    public set _isSpatial(value: boolean) {
        if (value && !this._spatial) {
            this._initSpatialProperty();
        } else if (!value && this._spatial) {
            this._spatial.dispose();
            this._spatial = null;
        }
    }
}
