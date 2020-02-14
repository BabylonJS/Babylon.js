import { Nullable } from "babylonjs/types";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { Tools } from "babylonjs/Misc/tools";
import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { AnimationEvent } from "babylonjs/Animations/animationEvent";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Sound } from "babylonjs/Audio/sound";
import { WeightedSound } from "babylonjs/Audio/weightedsound";

import { IArrayItem, IScene, INode, IAnimation } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { IProperty } from 'babylonjs-gltf2interface';

const NAME = "MSFT_audio_emitter";

interface IClipReference {
    clip: number;
    weight?: number;
}

interface IEmittersReference {
    emitters: number[];
}

const enum DistanceModel {
    linear = "linear",
    inverse = "inverse",
    exponential = "exponential",
}

interface IEmitter {
    name?: string;
    distanceModel?: DistanceModel;
    refDistance?: number;
    maxDistance?: number;
    rolloffFactor?: number;
    innerAngle?: number;
    outerAngle?: number;
    loop?: boolean;
    volume?: number;
    clips: IClipReference[];
}

const enum AudioMimeType {
    WAV = "audio/wav",
}

interface IClip extends IProperty {
    uri?: string;
    bufferView?: number;
    mimeType?: AudioMimeType;
}

interface ILoaderClip extends IClip, IArrayItem {
    _objectURL?: Promise<string>;
}

interface ILoaderEmitter extends IEmitter, IArrayItem {
    _babylonData?: {
        sound?: WeightedSound;
        loaded: Promise<void>;
    };
    _babylonSounds: Sound[];
}

interface IMSFTAudioEmitter {
    clips: ILoaderClip[];
    emitters: ILoaderEmitter[];
}

const enum AnimationEventAction {
    play = "play",
    pause = "pause",
    stop = "stop",
}

interface IAnimationEvent {
    action: AnimationEventAction;
    emitter: number;
    time: number;
    startOffset?: number;
}

interface ILoaderAnimationEvent extends IAnimationEvent, IArrayItem {
}

interface ILoaderAnimationEvents {
    events: ILoaderAnimationEvent[];
}

/**
 * [Specification](https://github.com/najadojo/glTF/tree/MSFT_audio_emitter/extensions/2.0/Vendor/MSFT_audio_emitter)
 */
export class MSFT_audio_emitter implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLTFLoader;
    private _clips: Array<ILoaderClip>;
    private _emitters: Array<ILoaderEmitter>;

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        delete this._loader;
        delete this._clips;
        delete this._emitters;
    }

    /** @hidden */
    public onLoading(): void {
        const extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            const extension = extensions[this.name] as IMSFTAudioEmitter;

            this._clips = extension.clips;
            this._emitters = extension.emitters;

            ArrayItem.Assign(this._clips);
            ArrayItem.Assign(this._emitters);
        }
    }

    /** @hidden */
    public loadSceneAsync(context: string, scene: IScene): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IEmittersReference>(context, scene, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();

            promises.push(this._loader.loadSceneAsync(context, scene));

            for (const emitterIndex of extension.emitters) {
                const emitter = ArrayItem.Get(`${extensionContext}/emitters`, this._emitters, emitterIndex);
                if (emitter.refDistance != undefined || emitter.maxDistance != undefined || emitter.rolloffFactor != undefined ||
                    emitter.distanceModel != undefined || emitter.innerAngle != undefined || emitter.outerAngle != undefined) {
                    throw new Error(`${extensionContext}: Direction or Distance properties are not allowed on emitters attached to a scene`);
                }

                promises.push(this._loadEmitterAsync(`${extensionContext}/emitters/${emitter.index}`, emitter));
            }

            return Promise.all(promises).then(() => { });
        });
    }

    /** @hidden */
    public loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return GLTFLoader.LoadExtensionAsync<IEmittersReference, TransformNode>(context, node, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();

            return this._loader.loadNodeAsync(extensionContext, node, (babylonMesh) => {
                for (const emitterIndex of extension.emitters) {
                    const emitter = ArrayItem.Get(`${extensionContext}/emitters`, this._emitters, emitterIndex);
                    promises.push(this._loadEmitterAsync(`${extensionContext}/emitters/${emitter.index}`, emitter).then(() => {
                        for (const sound of emitter._babylonSounds) {
                            sound.attachToMesh(babylonMesh);
                            if (emitter.innerAngle != undefined || emitter.outerAngle != undefined) {
                                sound.setLocalDirectionToMesh(Vector3.Forward());
                                sound.setDirectionalCone(
                                    2 * Tools.ToDegrees(emitter.innerAngle == undefined ? Math.PI : emitter.innerAngle),
                                    2 * Tools.ToDegrees(emitter.outerAngle == undefined ? Math.PI : emitter.outerAngle),
                                    0);
                            }
                        }
                    }));
                }

                assign(babylonMesh);
            }).then((babylonMesh) => {
                return Promise.all(promises).then(() => {
                    return babylonMesh;
                });
            });
        });
    }

    /** @hidden */
    public loadAnimationAsync(context: string, animation: IAnimation): Nullable<Promise<AnimationGroup>> {
        return GLTFLoader.LoadExtensionAsync<ILoaderAnimationEvents, AnimationGroup>(context, animation, this.name, (extensionContext, extension) => {
            return this._loader.loadAnimationAsync(context, animation).then((babylonAnimationGroup) => {
                const promises = new Array<Promise<any>>();

                ArrayItem.Assign(extension.events);
                for (const event of extension.events) {
                    promises.push(this._loadAnimationEventAsync(`${extensionContext}/events/${event.index}`, context, animation, event, babylonAnimationGroup));
                }

                return Promise.all(promises).then(() => {
                    return babylonAnimationGroup;
                });
            });
        });
    }

    private _loadClipAsync(context: string, clip: ILoaderClip): Promise<string> {
        if (clip._objectURL) {
            return clip._objectURL;
        }

        let promise: Promise<ArrayBufferView>;
        if (clip.uri) {
            promise = this._loader.loadUriAsync(context, clip, clip.uri);
        }
        else {
            const bufferView = ArrayItem.Get(`${context}/bufferView`, this._loader.gltf.bufferViews, clip.bufferView);
            promise = this._loader.loadBufferViewAsync(`#/bufferViews/${bufferView.index}`, bufferView);
        }

        clip._objectURL = promise.then((data) => {
            return URL.createObjectURL(new Blob([data], { type: clip.mimeType }));
        });

        return clip._objectURL;
    }

    private _loadEmitterAsync(context: string, emitter: ILoaderEmitter): Promise<void> {
        emitter._babylonSounds = emitter._babylonSounds || [];
        if (!emitter._babylonData) {
            const clipPromises = new Array<Promise<any>>();
            const name = emitter.name || `emitter${emitter.index}`;
            const options = {
                loop: false,
                autoplay: false,
                volume: emitter.volume == undefined ? 1 : emitter.volume,
            };

            for (let i = 0; i < emitter.clips.length; i++) {
                const clipContext = `#/extensions/${this.name}/clips`;
                const clip = ArrayItem.Get(clipContext, this._clips, emitter.clips[i].clip);
                clipPromises.push(this._loadClipAsync(`${clipContext}/${emitter.clips[i].clip}`, clip).then((objectURL: string) => {
                    const sound = emitter._babylonSounds[i] = new Sound(name, objectURL, this._loader.babylonScene, null, options);
                    sound.refDistance = emitter.refDistance || 1;
                    sound.maxDistance = emitter.maxDistance || 256;
                    sound.rolloffFactor = emitter.rolloffFactor || 1;
                    sound.distanceModel = emitter.distanceModel || 'exponential';
                    sound._positionInEmitterSpace = true;
                }));
            }

            const promise = Promise.all(clipPromises).then(() => {
                const weights = emitter.clips.map((clip) => { return clip.weight || 1; });
                const weightedSound = new WeightedSound(emitter.loop || false, emitter._babylonSounds, weights);
                if (emitter.innerAngle) { weightedSound.directionalConeInnerAngle = 2 * Tools.ToDegrees(emitter.innerAngle); }
                if (emitter.outerAngle) { weightedSound.directionalConeOuterAngle = 2 * Tools.ToDegrees(emitter.outerAngle); }
                if (emitter.volume) { weightedSound.volume = emitter.volume; }
                emitter._babylonData!.sound = weightedSound;
            });

            emitter._babylonData = {
                loaded: promise
            };
        }

        return emitter._babylonData.loaded;
    }

    private _getEventAction(context: string, sound: WeightedSound, action: AnimationEventAction, time: number, startOffset?: number): (currentFrame: number) => void {
        switch (action) {
            case AnimationEventAction.play: {
                return (currentFrame: number) => {
                    const frameOffset = (startOffset || 0) + (currentFrame - time);
                    sound.play(frameOffset);
                };
            }
            case AnimationEventAction.stop: {
                return (currentFrame: number) => {
                    sound.stop();
                };
            }
            case AnimationEventAction.pause: {
                return (currentFrame: number) => {
                    sound.pause();
                };
            }
            default: {
                throw new Error(`${context}: Unsupported action ${action}`);
            }
        }
    }

    private _loadAnimationEventAsync(context: string, animationContext: string, animation: IAnimation, event: ILoaderAnimationEvent, babylonAnimationGroup: AnimationGroup): Promise<void> {
        if (babylonAnimationGroup.targetedAnimations.length == 0) {
            return Promise.resolve();
        }
        const babylonAnimation = babylonAnimationGroup.targetedAnimations[0];
        const emitterIndex = event.emitter;
        const emitter = ArrayItem.Get(`#/extensions/${this.name}/emitters`, this._emitters, emitterIndex);
        return this._loadEmitterAsync(context, emitter).then(() => {
            const sound = emitter._babylonData!.sound;
            if (sound) {
                var babylonAnimationEvent = new AnimationEvent(event.time, this._getEventAction(context, sound, event.action, event.time, event.startOffset));
                babylonAnimation.animation.addEvent(babylonAnimationEvent);
                // Make sure all started audio stops when this animation is terminated.
                babylonAnimationGroup.onAnimationGroupEndObservable.add(() => {
                    sound.stop();
                });
                babylonAnimationGroup.onAnimationGroupPauseObservable.add(() => {
                    sound.pause();
                });
            }
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new MSFT_audio_emitter(loader));