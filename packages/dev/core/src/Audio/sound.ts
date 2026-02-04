import type { IStaticSoundOptions, IStaticSoundPlayOptions, IStaticSoundStopOptions } from "../AudioV2/abstractAudio/staticSound";
import type { IStreamingSoundOptions } from "../AudioV2/abstractAudio/streamingSound";
import { _HasSpatialAudioOptions, _SpatialAudioDefaults } from "../AudioV2/abstractAudio/subProperties/abstractSpatialAudio";
import type { IAudioParameterRampOptions } from "../AudioV2/audioParameter";
import { AudioParameterRampShape } from "../AudioV2/audioParameter";
import { SoundState } from "../AudioV2/soundState";
import { _WebAudioSoundSource } from "../AudioV2/webAudio/webAudioSoundSource";
import { _WebAudioStaticSound } from "../AudioV2/webAudio/webAudioStaticSound";
import { _WebAudioStreamingSound } from "../AudioV2/webAudio/webAudioStreamingSound";
import { AbstractEngine } from "../Engines/abstractEngine";
import { EngineStore } from "../Engines/engineStore";
import { Vector3 } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { TransformNode } from "../Meshes/transformNode";
import { _WarnImport } from "../Misc/devTools";
import { Logger } from "../Misc/logger";
import { Observable } from "../Misc/observable";
import { _RetryWithInterval } from "../Misc/timingTools";
import { RegisterClass } from "../Misc/typeStore";
import type { Scene } from "../scene";
import type { Nullable } from "../types";
import type { AudioEngine } from "./audioEngine";
import type { ISoundOptions } from "./Interfaces/ISoundOptions";

const TmpRampOptions: IAudioParameterRampOptions = {
    duration: 0,
    shape: AudioParameterRampShape.Linear,
};

const TmpPlayOptions: Partial<IStaticSoundPlayOptions> = {
    duration: 0,
    startOffset: 0,
    waitTime: 0,
};

const TmpStopOptions: IStaticSoundStopOptions = {
    waitTime: 0,
};

function D2r(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function R2d(radians: number): number {
    return (radians * 180) / Math.PI;
}

/**
 * Defines a sound that can be played in the application.
 * The sound can either be an ambient track or a simple sound played in reaction to a user action.
 * @see https://doc.babylonjs.com/legacy/audio
 */
export class Sound {
    /**
     * The name of the sound in the scene.
     */
    public get name(): string {
        return this._soundV2.name;
    }

    public set name(value: string) {
        this._soundV2.name = value;
    }

    /**
     * Does the sound autoplay once loaded.
     */
    public get autoplay(): boolean {
        return this._soundV2 instanceof _WebAudioSoundSource ? true : this._optionsV2.autoplay!;
    }

    public set autoplay(value: boolean) {
        this._optionsV2.autoplay = value;
    }

    /**
     * Does the sound loop after it finishes playing once.
     */
    public get loop(): boolean {
        return this._soundV2 instanceof _WebAudioSoundSource ? true : this._soundV2.loop;
    }

    public set loop(value: boolean) {
        if (this._soundV2 instanceof _WebAudioSoundSource) {
            return;
        }

        if (this._soundV2) {
            this._soundV2.loop = value;
        }
    }

    /**
     * Does the sound use a custom attenuation curve to simulate the falloff
     * happening when the source gets further away from the camera.
     * @see https://doc.babylonjs.com/legacy/audio#creating-your-own-custom-attenuation-function
     */
    public useCustomAttenuation: boolean = false;
    /**
     * The sound track id this sound belongs to.
     */
    public soundTrackId: number = -1;
    /**
     * Is this sound currently played.
     */
    public get isPlaying(): boolean {
        return this._soundV2 instanceof _WebAudioSoundSource ? true : this._soundV2?.state === SoundState.Started || (!this.isReady() && this._optionsV2.autoplay!);
    }

    /**
     * Is this sound currently paused.
     */
    public get isPaused(): boolean {
        return this._soundV2 instanceof _WebAudioSoundSource ? false : this._soundV2.state === SoundState.Paused;
    }

    /**
     * Define the reference distance the sound should be heard perfectly.
     * @see https://doc.babylonjs.com/legacy/audio#creating-a-spatial-3d-sound
     */
    public refDistance: number = 1;
    /**
     * Define the roll off factor of spatial sounds.
     * @see https://doc.babylonjs.com/legacy/audio#creating-a-spatial-3d-sound
     */
    public rolloffFactor: number = 1;
    /**
     * Define the max distance the sound should be heard (intensity just became 0 at this point).
     * @see https://doc.babylonjs.com/legacy/audio#creating-a-spatial-3d-sound
     */
    public get maxDistance(): number {
        return this._optionsV2.spatialMaxDistance || 100;
    }
    public set maxDistance(value: number) {
        this._optionsV2.spatialMaxDistance = value;

        if (this.useCustomAttenuation) {
            return;
        }

        if (this._soundV2) {
            this._initSpatial();
            this._soundV2.spatial.maxDistance = value;
        }
    }
    /**
     * Define the distance attenuation model the sound will follow.
     * @see https://doc.babylonjs.com/legacy/audio#creating-a-spatial-3d-sound
     */
    public get distanceModel(): "linear" | "inverse" | "exponential" {
        return this._optionsV2.spatialDistanceModel || "linear";
    }
    public set distanceModel(value: "linear" | "inverse" | "exponential") {
        this._optionsV2.spatialDistanceModel = value;

        if (this._soundV2) {
            this._initSpatial();
            this._soundV2.spatial.distanceModel = value;
        }
    }
    /**
     * @internal
     * Back Compat
     **/
    public onended: () => any;
    /**
     * Gets or sets an object used to store user defined information for the sound.
     */
    public metadata: any = null;

    /**
     * Observable event when the current playing sound finishes.
     */
    public onEndedObservable = new Observable<Sound>();

    /**
     * Gets the current time for the sound.
     */
    public get currentTime(): number {
        return this._soundV2 instanceof _WebAudioSoundSource ? this._soundV2.engine.currentTime : this._soundV2.currentTime;
    }

    /**
     * Does this sound enables spatial sound.
     * @see https://doc.babylonjs.com/legacy/audio#creating-a-spatial-3d-sound
     */
    public get spatialSound(): boolean {
        return this._soundV2?._isSpatial ?? false;
    }

    /**
     * Does this sound enables spatial sound.
     * @see https://doc.babylonjs.com/legacy/audio#creating-a-spatial-3d-sound
     */
    public set spatialSound(newValue: boolean) {
        if (this._soundV2) {
            if (newValue) {
                this._initSpatial();
            } else {
                this._soundV2._isSpatial = false;
            }
        }
    }

    private _localDirection: Vector3 = new Vector3(1, 0, 0);
    private _volume: number = 1;
    private _isReadyToPlay: boolean = false;
    private _isDirectional: boolean = false;
    private _readyToPlayCallback: () => any;
    private _scene: Scene;
    private _connectedTransformNode: Nullable<TransformNode>;
    private _customAttenuationFunction: (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => number;
    private _registerFunc: Nullable<(connectedMesh: TransformNode) => void>;
    private _isOutputConnected = false;
    private _url: Nullable<string> = null;

    private readonly _optionsV2: Partial<IStaticSoundOptions>;
    private readonly _soundV2: _WebAudioSoundSource | _WebAudioStaticSound | _WebAudioStreamingSound;
    private _onReadyObservable: Nullable<Observable<void>> = null;

    private get _onReady(): Observable<void> {
        if (!this._onReadyObservable) {
            this._onReadyObservable = new Observable<void>();
        }
        return this._onReadyObservable;
    }

    /**
     * @internal
     */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _WarnImport("AudioSceneComponent");
    };

    /**
     * Create a sound and attach it to a scene
     * @param name Name of your sound
     * @param urlOrArrayBuffer Url to the sound to load async or ArrayBuffer, it also works with MediaStreams and AudioBuffers
     * @param scene defines the scene the sound belongs to
     * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
     * @param options Objects to provide with the current available options: autoplay, loop, volume, spatialSound, maxDistance, rolloffFactor, refDistance, distanceModel, panningModel, streaming
     */
    constructor(name: string, urlOrArrayBuffer: any, scene?: Nullable<Scene>, readyToPlayCallback: Nullable<() => void> = null, options?: ISoundOptions) {
        scene = scene || EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }
        this._scene = scene;
        Sound._SceneComponentInitialization(scene);
        this._readyToPlayCallback = readyToPlayCallback || (() => {});

        // Default custom attenuation function is a linear attenuation
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this._customAttenuationFunction = (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => {
            if (currentDistance < maxDistance) {
                return currentVolume * (1 - currentDistance / maxDistance);
            } else {
                return 0;
            }
        };

        options = options || {};

        const optionsV2: Partial<IStaticSoundOptions> = {
            analyzerEnabled: false,
            autoplay: false, // `false` for now, but will be set to given option later
            duration: options.length || 0,
            loop: options.loop || false,
            loopEnd: 0,
            loopStart: 0,
            outBus: null,
            outBusAutoDefault: false,
            playbackRate: options.playbackRate || 1,
            pitch: 0,
            skipCodecCheck: options.skipCodecCheck || false,
            spatialDistanceModel: options.distanceModel,
            spatialEnabled: options.spatialSound,
            spatialMaxDistance: options.maxDistance,
            spatialMinDistance: options.refDistance,
            spatialRolloffFactor: options.rolloffFactor,
            stereoEnabled: false,
            startOffset: options.offset || 0,
            volume: options.volume ?? 1,
        };
        this._volume = options.volume ?? 1;

        if (_HasSpatialAudioOptions(optionsV2)) {
            optionsV2.spatialAutoUpdate = false;
            optionsV2.spatialConeInnerAngle = _SpatialAudioDefaults.coneInnerAngle;
            optionsV2.spatialConeOuterAngle = _SpatialAudioDefaults.coneOuterAngle;
            optionsV2.spatialConeOuterVolume = _SpatialAudioDefaults.coneOuterVolume;
            optionsV2.spatialMinUpdateTime = 0;
            optionsV2.spatialOrientation = _SpatialAudioDefaults.orientation.clone();
            optionsV2.spatialPanningModel = (this._scene.headphone ? "HRTF" : "equalpower") as "equalpower" | "HRTF";
            optionsV2.spatialPosition = _SpatialAudioDefaults.position.clone();
            optionsV2.spatialRotation = _SpatialAudioDefaults.rotation.clone();
            optionsV2.spatialRotationQuaternion = _SpatialAudioDefaults.rotationQuaternion.clone();

            if (optionsV2.spatialMaxDistance === undefined) {
                optionsV2.spatialMaxDistance = 100;
            }
        }

        this._optionsV2 = { ...optionsV2 };
        this._optionsV2.autoplay = options.autoplay || false;

        this.useCustomAttenuation = options.useCustomAttenuation ?? false;
        if (this.useCustomAttenuation) {
            optionsV2.spatialMaxDistance = Number.MAX_VALUE;
            optionsV2.volume = 0;
        }

        let streaming = options?.streaming || false;

        const audioEngine = AbstractEngine.audioEngine;
        if (!audioEngine) {
            return;
        }

        const audioEngineV2 = (AbstractEngine.audioEngine as AudioEngine)._v2;

        const createSoundV2 = () => {
            if (streaming) {
                const streamingOptionsV2: Partial<IStreamingSoundOptions> = {
                    preloadCount: 0,
                    ...optionsV2,
                };

                const sound = new _WebAudioStreamingSound(name, audioEngineV2, streamingOptionsV2);

                // eslint-disable-next-line github/no-then
                void sound._initAsync(urlOrArrayBuffer, optionsV2).then(() => {
                    // eslint-disable-next-line github/no-then
                    void sound.preloadInstancesAsync(1).then(this._onReadyToPlay);
                });

                return sound;
            } else {
                const sound = new _WebAudioStaticSound(name, audioEngineV2, optionsV2);

                // eslint-disable-next-line github/no-then
                void sound._initAsync(urlOrArrayBuffer, optionsV2).then(this._onReadyToPlay);

                return sound;
            }
        };

        // If no parameter is passed then the setAudioBuffer should be called to prepare the sound.
        if (!urlOrArrayBuffer) {
            // Create the sound but don't call _initAsync on it, yet. Call it later when `setAudioBuffer` is called.
            this._soundV2 = new _WebAudioStaticSound(name, audioEngineV2, optionsV2);
        } else if (typeof urlOrArrayBuffer === "string") {
            this._url = urlOrArrayBuffer;
            this._soundV2 = createSoundV2();
        } else if (urlOrArrayBuffer instanceof ArrayBuffer) {
            streaming = false;
            this._soundV2 = createSoundV2();
        } else if (urlOrArrayBuffer instanceof HTMLMediaElement) {
            streaming = true;
            this._soundV2 = createSoundV2();
        } else if (urlOrArrayBuffer instanceof MediaStream) {
            const node = new MediaStreamAudioSourceNode(audioEngineV2._audioContext, { mediaStream: urlOrArrayBuffer });
            this._soundV2 = new _WebAudioSoundSource(name, node, audioEngineV2, optionsV2);
            // eslint-disable-next-line github/no-then
            void this._soundV2._initAsync(optionsV2).then(this._onReadyToPlay);
        } else if (urlOrArrayBuffer instanceof AudioBuffer) {
            streaming = false;
            this._soundV2 = createSoundV2();
        } else if (Array.isArray(urlOrArrayBuffer)) {
            this._soundV2 = createSoundV2();
        }

        if (!this._soundV2) {
            Logger.Error("Parameter must be a URL to the sound, an Array of URLs (.mp3 & .ogg) or an ArrayBuffer of the sound.");
            return;
        }

        if (!(this._soundV2 instanceof _WebAudioSoundSource)) {
            this._soundV2.onEndedObservable.add(this._onended);
        }
    }

    private _onReadyToPlay = () => {
        this._scene.mainSoundTrack.addSound(this);
        this._isReadyToPlay = true;
        this._readyToPlayCallback();

        if (this._onReadyObservable) {
            this._onReadyObservable.notifyObservers();
        }

        if (this._optionsV2.autoplay) {
            this.play();
        }
    };

    /**
     * Release the sound and its associated resources
     */
    public dispose() {
        if (this.isPlaying) {
            this.stop();
        }
        this._isReadyToPlay = false;
        if (this.soundTrackId === -1) {
            this._scene.mainSoundTrack.removeSound(this);
        } else if (this._scene.soundTracks) {
            this._scene.soundTracks[this.soundTrackId].removeSound(this);
        }

        if (this._connectedTransformNode && this._registerFunc) {
            this._connectedTransformNode.unregisterAfterWorldMatrixUpdate(this._registerFunc);
            this._connectedTransformNode = null;
        }

        this._soundV2.dispose();
    }

    /**
     * Gets if the sounds is ready to be played or not.
     * @returns true if ready, otherwise false
     */
    public isReady(): boolean {
        return this._isReadyToPlay;
    }

    /**
     * Get the current class name.
     * @returns current class name
     */
    public getClassName(): string {
        return "Sound";
    }

    /**
     * Sets the data of the sound from an audiobuffer
     * @param audioBuffer The audioBuffer containing the data
     */
    public setAudioBuffer(audioBuffer: AudioBuffer): void {
        if (this._isReadyToPlay) {
            return;
        }

        if (this._soundV2 instanceof _WebAudioStaticSound) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
            this._soundV2._initAsync(audioBuffer, this._optionsV2).then(this._onReadyToPlay);
        }
    }

    /**
     * Updates the current sounds options such as maxdistance, loop...
     * @param options A JSON object containing values named as the object properties
     */
    public updateOptions(options: ISoundOptions): void {
        if (options) {
            this.loop = options.loop ?? this.loop;
            this.maxDistance = options.maxDistance ?? this.maxDistance;
            this.useCustomAttenuation = options.useCustomAttenuation ?? this.useCustomAttenuation;
            this.rolloffFactor = options.rolloffFactor ?? this.rolloffFactor;
            this.refDistance = options.refDistance ?? this.refDistance;
            this.distanceModel = options.distanceModel ?? this.distanceModel;
            if (options.playbackRate !== undefined) {
                this.setPlaybackRate(options.playbackRate);
            }
            if (options.spatialSound !== undefined) {
                this.spatialSound = options.spatialSound;
            }
            if (options.volume !== undefined) {
                this.setVolume(options.volume);
            }
            if (this._soundV2 instanceof _WebAudioStaticSound) {
                let updated = false;
                if (options.offset !== undefined) {
                    this._optionsV2.startOffset = options.offset;
                    updated = true;
                }
                if (options.length !== undefined) {
                    this._soundV2.duration = options.length;
                    updated = true;
                }
                if (updated && this.isPaused) {
                    this.stop();
                }
            }

            this._updateSpatialParameters();
        }
    }

    private _updateSpatialParameters() {
        if (!this.spatialSound) {
            return;
        }

        const spatial = this._soundV2.spatial;

        if (this.useCustomAttenuation) {
            // Disable WebAudio attenuation.
            spatial.distanceModel = "linear";
            spatial.minDistance = 1;
            spatial.maxDistance = Number.MAX_VALUE;
            spatial.rolloffFactor = 1;
            spatial.panningModel = "equalpower";
        } else {
            spatial.distanceModel = this.distanceModel;
            spatial.minDistance = this.refDistance;
            spatial.maxDistance = this.maxDistance;
            spatial.rolloffFactor = this.rolloffFactor;
            spatial.panningModel = this._optionsV2.spatialPanningModel || "equalpower";
        }
    }

    /**
     * Switch the panning model to HRTF:
     * Renders a stereo output of higher quality than equalpower — it uses a convolution with measured impulse responses from human subjects.
     * @see https://doc.babylonjs.com/legacy/audio#creating-a-spatial-3d-sound
     */
    public switchPanningModelToHRTF() {
        if (this.spatialSound) {
            this._initSpatial();
            this._soundV2.spatial.panningModel = "HRTF";
        }
    }

    /**
     * Switch the panning model to Equal Power:
     * Represents the equal-power panning algorithm, generally regarded as simple and efficient. equalpower is the default value.
     * @see https://doc.babylonjs.com/legacy/audio#creating-a-spatial-3d-sound
     */
    public switchPanningModelToEqualPower() {
        if (this.spatialSound) {
            this._initSpatial();
            this._soundV2.spatial.panningModel = "equalpower";
        }
    }

    /**
     * Connect this sound to a sound track audio node like gain...
     * @param soundTrackAudioNode the sound track audio node to connect to
     */
    public connectToSoundTrackAudioNode(soundTrackAudioNode: AudioNode): void {
        const outputNode = this._soundV2._outNode;
        if (outputNode) {
            if (this._isOutputConnected) {
                outputNode.disconnect();
            }
            outputNode.connect(soundTrackAudioNode);
            this._isOutputConnected = true;
        }
    }

    /**
     * Transform this sound into a directional source
     * @param coneInnerAngle Size of the inner cone in degree
     * @param coneOuterAngle Size of the outer cone in degree
     * @param coneOuterGain Volume of the sound outside the outer cone (between 0.0 and 1.0)
     */
    public setDirectionalCone(coneInnerAngle: number, coneOuterAngle: number, coneOuterGain: number): void {
        if (coneOuterAngle < coneInnerAngle) {
            Logger.Error("setDirectionalCone(): outer angle of the cone must be superior or equal to the inner angle.");
            return;
        }

        this._optionsV2.spatialConeInnerAngle = D2r(coneInnerAngle);
        this._optionsV2.spatialConeOuterAngle = D2r(coneOuterAngle);
        this._optionsV2.spatialConeOuterVolume = coneOuterGain;

        this._initSpatial();
        this._soundV2.spatial.coneInnerAngle = this._optionsV2.spatialConeInnerAngle;
        this._soundV2.spatial.coneOuterAngle = this._optionsV2.spatialConeOuterAngle;
        this._soundV2.spatial.coneOuterVolume = coneOuterGain;

        this._isDirectional = true;

        if (this.isPlaying && this.loop) {
            this.stop();
            this.play(0, this._optionsV2.startOffset, this._optionsV2.duration);
        }
    }

    /**
     * Gets or sets the inner angle for the directional cone.
     */
    public get directionalConeInnerAngle(): number {
        return R2d(typeof this._optionsV2.spatialConeInnerAngle === "number" ? this._optionsV2.spatialConeInnerAngle : _SpatialAudioDefaults.coneInnerAngle);
    }

    /**
     * Gets or sets the inner angle for the directional cone.
     */
    public set directionalConeInnerAngle(value: number) {
        value = D2r(value);

        if (value != this._optionsV2.spatialConeInnerAngle) {
            if (this.directionalConeOuterAngle < value) {
                Logger.Error("directionalConeInnerAngle: outer angle of the cone must be superior or equal to the inner angle.");
                return;
            }
            this._optionsV2.spatialConeInnerAngle = value;
            if (this.spatialSound) {
                this._initSpatial();
                this._soundV2.spatial.coneInnerAngle = value;
            }
        }
    }

    /**
     * Gets or sets the outer angle for the directional cone.
     */
    public get directionalConeOuterAngle(): number {
        return R2d(typeof this._optionsV2.spatialConeOuterAngle === "number" ? this._optionsV2.spatialConeOuterAngle : _SpatialAudioDefaults.coneOuterAngle);
    }

    /**
     * Gets or sets the outer angle for the directional cone.
     */
    public set directionalConeOuterAngle(value: number) {
        value = D2r(value);

        if (value != this._optionsV2.spatialConeOuterAngle) {
            if (value < this.directionalConeInnerAngle) {
                Logger.Error("directionalConeOuterAngle: outer angle of the cone must be superior or equal to the inner angle.");
                return;
            }
            this._optionsV2.spatialConeOuterAngle = value;
            if (this.spatialSound) {
                this._initSpatial();
                this._soundV2.spatial.coneOuterAngle = value;
            }
        }
    }

    /**
     * Sets the position of the emitter if spatial sound is enabled
     * @param newPosition Defines the new position
     */
    public setPosition(newPosition: Vector3): void {
        if (this._optionsV2.spatialPosition && newPosition.equals(this._optionsV2.spatialPosition)) {
            return;
        }
        if (!this._optionsV2.spatialPosition) {
            this._optionsV2.spatialPosition = Vector3.Zero();
        }
        this._optionsV2.spatialPosition.copyFrom(newPosition);
        if (this.spatialSound && !isNaN(newPosition.x) && !isNaN(newPosition.y) && !isNaN(newPosition.z)) {
            this._initSpatial();
            this._soundV2.spatial.position = newPosition;
        }
    }

    /**
     * Sets the local direction of the emitter if spatial sound is enabled
     * @param newLocalDirection Defines the new local direction
     */
    public setLocalDirectionToMesh(newLocalDirection: Vector3): void {
        this._localDirection = newLocalDirection;

        if (this._connectedTransformNode && this.isPlaying) {
            this._updateDirection();
        }
    }

    private _updateDirection() {
        if (!this._connectedTransformNode || !this.spatialSound) {
            return;
        }

        const mat = this._connectedTransformNode.getWorldMatrix();
        const direction = Vector3.TransformNormal(this._localDirection, mat);
        direction.normalize();

        this._initSpatial();
        this._soundV2.spatial.orientation = direction;
    }

    private _initSpatial() {
        this._soundV2._isSpatial = true;

        if (this._optionsV2.spatialDistanceModel === undefined) {
            this._optionsV2.spatialDistanceModel = "linear";
            this._soundV2.spatial.distanceModel = "linear";
        }

        if (this._optionsV2.spatialMaxDistance === undefined) {
            this._optionsV2.spatialMaxDistance = 100;
            this._soundV2.spatial.maxDistance = 100;
        }
    }

    /** @internal */
    public updateDistanceFromListener() {
        if (this._soundV2._outNode && this._connectedTransformNode && this.useCustomAttenuation && this._scene.activeCamera) {
            const distance = this._scene.audioListenerPositionProvider
                ? this._connectedTransformNode.position.subtract(this._scene.audioListenerPositionProvider()).length()
                : this._connectedTransformNode.getDistanceToCamera(this._scene.activeCamera);
            this._soundV2.volume = this._customAttenuationFunction(this._volume, distance, this.maxDistance, this.refDistance, this.rolloffFactor);
        }
    }

    /**
     * Sets a new custom attenuation function for the sound.
     * @param callback Defines the function used for the attenuation
     * @see https://doc.babylonjs.com/legacy/audio#creating-your-own-custom-attenuation-function
     */
    public setAttenuationFunction(callback: (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => number): void {
        this._customAttenuationFunction = callback;
    }

    /**
     * Play the sound
     * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
     * @param offset (optional) Start the sound at a specific time in seconds
     * @param length (optional) Sound duration (in seconds)
     */
    public play(time?: number, offset?: number, length?: number): void {
        const audioEngine = AbstractEngine.audioEngine;
        audioEngine?.unlock();

        // WebAudio sound sources have no `play` function because they are always playing.
        if (this._soundV2 instanceof _WebAudioSoundSource) {
            return;
        }

        if (this._isReadyToPlay && this._scene.audioEnabled) {
            // The sound can only resume from pause when the `time`, `offset` and `length` args are not set.
            if (this._soundV2.state === SoundState.Paused && (time !== undefined || offset !== undefined || length !== undefined)) {
                this._soundV2.stop();
            }

            try {
                TmpPlayOptions.duration = length || 0;
                TmpPlayOptions.startOffset = offset !== undefined ? offset || this._optionsV2.startOffset! : this._optionsV2.startOffset!;
                TmpPlayOptions.waitTime = time || 0;
                TmpPlayOptions.loop = undefined;
                TmpPlayOptions.loopStart = undefined;
                TmpPlayOptions.loopEnd = undefined;
                TmpPlayOptions.volume = undefined;

                if (audioEngine?.unlocked) {
                    this._soundV2.play(TmpPlayOptions);
                } else {
                    // Wait a bit for FF as context seems late to be ready.
                    setTimeout(() => {
                        (this._soundV2 as _WebAudioStaticSound | _WebAudioStreamingSound).play(TmpPlayOptions);
                    }, 500);
                }
            } catch (ex) {
                Logger.Error("Error while trying to play audio: " + this.name + ", " + ex.message);
            }
        }
    }

    private _onended = () => {
        if (this.onended) {
            this.onended();
        }
        this.onEndedObservable.notifyObservers(this);
    };

    /**
     * Stop the sound
     * @param time (optional) Stop the sound after X seconds. Stop immediately (0) by default.
     */
    public stop(time?: number): void {
        if (!this._soundV2) {
            return;
        }

        // WebAudio sound sources have no `stop` function because they are always playing.
        if (this._soundV2 instanceof _WebAudioSoundSource) {
            return;
        }

        TmpStopOptions.waitTime = time || 0;
        this._soundV2.stop(TmpStopOptions);
    }

    /**
     * Put the sound in pause
     */
    public pause(): void {
        if (!this._soundV2) {
            return;
        }

        // WebAudio sound sources have no `pause` function because they are always playing.
        if (this._soundV2 instanceof _WebAudioSoundSource) {
            return;
        }

        this._soundV2.pause();
    }

    /**
     * Sets a dedicated volume for this sounds
     * @param newVolume Define the new volume of the sound
     * @param time Define time for gradual change to new volume
     */
    public setVolume(newVolume: number, time?: number): void {
        if (!this.isReady()) {
            this._onReady.addOnce(() => {
                this.setVolume(newVolume, time);
            });
            return;
        }

        TmpRampOptions.duration = time || 0;
        this._soundV2.setVolume(newVolume, TmpRampOptions);
        this._volume = newVolume;
    }

    /**
     * Set the sound play back rate
     * @param newPlaybackRate Define the playback rate the sound should be played at
     */
    public setPlaybackRate(newPlaybackRate: number): void {
        if (this._soundV2 instanceof _WebAudioStaticSound) {
            this._soundV2.playbackRate = newPlaybackRate;
        }
    }

    /**
     * Gets the sound play back rate.
     * @returns the  play back rate of the sound
     */
    public getPlaybackRate(): number {
        if (this._soundV2 instanceof _WebAudioStaticSound) {
            return this._soundV2.playbackRate;
        }

        return 1;
    }

    /**
     * Gets the volume of the sound.
     * @returns the volume of the sound
     */
    public getVolume(): number {
        return this._volume;
    }

    /**
     * Attach the sound to a dedicated mesh
     * @param transformNode The transform node to connect the sound with
     * @see https://doc.babylonjs.com/legacy/audio#attaching-a-sound-to-a-mesh
     */
    public attachToMesh(transformNode: TransformNode): void {
        if (this._connectedTransformNode && this._registerFunc) {
            this._connectedTransformNode.unregisterAfterWorldMatrixUpdate(this._registerFunc);
            this._registerFunc = null;
        }
        this._connectedTransformNode = transformNode;
        if (!this.spatialSound) {
            this.spatialSound = true;
            if (this.isPlaying && this.loop) {
                this.stop();
                this.play(0, this._optionsV2.startOffset, this._optionsV2.duration);
            }
        }
        this._onRegisterAfterWorldMatrixUpdate(this._connectedTransformNode);
        this._registerFunc = (transformNode: TransformNode) => this._onRegisterAfterWorldMatrixUpdate(transformNode);
        this._connectedTransformNode.registerAfterWorldMatrixUpdate(this._registerFunc);
    }

    /**
     * Detach the sound from the previously attached mesh
     * @see https://doc.babylonjs.com/legacy/audio#attaching-a-sound-to-a-mesh
     */
    public detachFromMesh() {
        if (this._connectedTransformNode && this._registerFunc) {
            this._connectedTransformNode.unregisterAfterWorldMatrixUpdate(this._registerFunc);
            this._registerFunc = null;
            this._connectedTransformNode = null;
        }
    }

    private _onRegisterAfterWorldMatrixUpdate(node: TransformNode): void {
        if (!(<any>node).getBoundingInfo) {
            this.setPosition(node.absolutePosition);
        } else {
            const mesh = node as AbstractMesh;
            const boundingInfo = mesh.getBoundingInfo();
            this.setPosition(boundingInfo.boundingSphere.centerWorld);
        }
        if (this._isDirectional && this.isPlaying) {
            this._updateDirection();
        }
    }

    /**
     * Clone the current sound in the scene.
     * @returns the new sound clone
     */
    public clone(): Nullable<Sound> {
        if (!(this._soundV2 instanceof _WebAudioStaticSound)) {
            return null;
        }

        const currentOptions: ISoundOptions = {
            autoplay: this.autoplay,
            loop: this.loop,
            volume: this._volume,
            spatialSound: this.spatialSound,
            maxDistance: this.maxDistance,
            useCustomAttenuation: this.useCustomAttenuation,
            rolloffFactor: this.rolloffFactor,
            refDistance: this.refDistance,
            distanceModel: this.distanceModel,
        };
        const clonedSound = new Sound(this.name + "_cloned", this._soundV2.buffer, this._scene, null, currentOptions);
        (clonedSound._optionsV2 as any) = this._optionsV2;
        if (this.useCustomAttenuation) {
            clonedSound.setAttenuationFunction(this._customAttenuationFunction);
        }
        return clonedSound;
    }

    /**
     * Gets the current underlying audio buffer containing the data
     * @returns the audio buffer
     */
    public getAudioBuffer(): Nullable<AudioBuffer> {
        if (this._soundV2 instanceof _WebAudioStaticSound) {
            return this._soundV2.buffer._audioBuffer;
        }
        return null;
    }

    /**
     * Gets the WebAudio AudioBufferSourceNode, lets you keep track of and stop instances of this Sound.
     * @returns the source node
     */
    public getSoundSource(): Nullable<AudioBufferSourceNode> {
        // return this._soundSource;
        return null;
    }

    /**
     * Gets the WebAudio GainNode, gives you precise control over the gain of instances of this Sound.
     * @returns the gain node
     */
    public getSoundGain(): Nullable<GainNode> {
        return this._soundV2._outNode as GainNode;
    }

    /**
     * Serializes the Sound in a JSON representation
     * @returns the JSON representation of the sound
     */
    public serialize(): any {
        const serializationObject: any = {
            name: this.name,
            url: this._url,
            autoplay: this.autoplay,
            loop: this.loop,
            volume: this._volume,
            spatialSound: this.spatialSound,
            maxDistance: this.maxDistance,
            rolloffFactor: this.rolloffFactor,
            refDistance: this.refDistance,
            distanceModel: this.distanceModel,
            playbackRate: this.getPlaybackRate(),
            panningModel: this._soundV2.spatial.panningModel,
            soundTrackId: this.soundTrackId,
            metadata: this.metadata,
        };

        if (this.spatialSound) {
            if (this._connectedTransformNode) {
                serializationObject.connectedMeshId = this._connectedTransformNode.id;
            }

            serializationObject.position = this._soundV2.spatial.position.asArray();
            serializationObject.refDistance = this.refDistance;
            serializationObject.distanceModel = this.distanceModel;

            serializationObject.isDirectional = this._isDirectional;
            serializationObject.localDirectionToMesh = this._localDirection.asArray();
            serializationObject.coneInnerAngle = this.directionalConeInnerAngle;
            serializationObject.coneOuterAngle = this.directionalConeOuterAngle;
            serializationObject.coneOuterGain = this._soundV2.spatial.coneOuterVolume;
        }

        return serializationObject;
    }

    /**
     * Parse a JSON representation of a sound to instantiate in a given scene
     * @param parsedSound Define the JSON representation of the sound (usually coming from the serialize method)
     * @param scene Define the scene the new parsed sound should be created in
     * @param rootUrl Define the rooturl of the load in case we need to fetch relative dependencies
     * @param sourceSound Define a sound place holder if do not need to instantiate a new one
     * @returns the newly parsed sound
     */
    public static Parse(parsedSound: any, scene: Scene, rootUrl: string, sourceSound?: Sound): Sound {
        const soundName = parsedSound.name;
        let soundUrl;
        if (parsedSound.url) {
            soundUrl = rootUrl + parsedSound.url;
        } else {
            soundUrl = rootUrl + soundName;
        }
        const options = {
            autoplay: parsedSound.autoplay,
            loop: parsedSound.loop,
            volume: parsedSound.volume,
            spatialSound: parsedSound.spatialSound,
            maxDistance: parsedSound.maxDistance,
            rolloffFactor: parsedSound.rolloffFactor,
            refDistance: parsedSound.refDistance,
            distanceModel: parsedSound.distanceModel,
            playbackRate: parsedSound.playbackRate,
        };
        let newSound: Sound;
        if (!sourceSound) {
            newSound = new Sound(
                soundName,
                soundUrl,
                scene,
                () => {
                    scene.removePendingData(newSound);
                },
                options
            );
            scene.addPendingData(newSound);
        } else {
            const setBufferAndRun = () => {
                _RetryWithInterval(
                    () => sourceSound._isReadyToPlay,
                    () => {
                        const audioBuffer = sourceSound.getAudioBuffer();
                        if (audioBuffer) {
                            newSound.setAudioBuffer(audioBuffer);
                        }
                        newSound._isReadyToPlay = true;
                        if (newSound.autoplay) {
                            newSound.play(0, sourceSound._optionsV2.startOffset, sourceSound._optionsV2.duration);
                        }
                    },
                    undefined,
                    300
                );
            };
            newSound = new Sound(soundName, new ArrayBuffer(0), scene, null, options);
            setBufferAndRun();
        }
        if (parsedSound.position) {
            const soundPosition = Vector3.FromArray(parsedSound.position);
            newSound.setPosition(soundPosition);
        }
        if (parsedSound.isDirectional) {
            newSound.setDirectionalCone(parsedSound.coneInnerAngle || 360, parsedSound.coneOuterAngle || 360, parsedSound.coneOuterGain || 0);
            if (parsedSound.localDirectionToMesh) {
                const localDirectionToMesh = Vector3.FromArray(parsedSound.localDirectionToMesh);
                newSound.setLocalDirectionToMesh(localDirectionToMesh);
            }
        }
        if (parsedSound.connectedMeshId) {
            const connectedMesh = scene.getMeshById(parsedSound.connectedMeshId);
            if (connectedMesh) {
                newSound.attachToMesh(connectedMesh);
            }
        }
        if (parsedSound.metadata) {
            newSound.metadata = parsedSound.metadata;
        }
        return newSound;
    }
}

// Register Class Name
RegisterClass("BABYLON.Sound", Sound);
