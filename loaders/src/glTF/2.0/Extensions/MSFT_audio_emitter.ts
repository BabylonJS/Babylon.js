/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {

    const NAME = "MSFT_audio_emitter";

    interface _IClipReference {
        clip: number;
        weight?: number;
    }

    interface _IEmittersReference {
        emitters: number[];
    }

    const enum _DistanceModel {
        linear = "linear",
        inverse = "inverse",
        exponential = "exponential",
    }

    interface _IEmitter {
        name?: string;
        distanceModel?: _DistanceModel;
        refDistance?: number;
        maxDistance?: number;
        rolloffFactor?: number;
        innerAngle?: number;
        outerAngle?: number;
        loop?: boolean;
        volume?: number;
        clips: _IClipReference[];
    }

    const enum _AudioMimeType {
        WAV = "audio/wav",
    }

    interface _IClip {
        uri?: string;
        bufferView?: number;
        mimeType?: _AudioMimeType;
    }

    interface _ILoaderClip extends _IClip, _IArrayItem {
        _objectURL?: Promise<string>;
    }

    interface _ILoaderEmitter extends _IEmitter, _IArrayItem {
        _babylonData?: { 
            sound?: WeightedSound;
            loaded: Promise<void>;
        };
        _babylonSounds: Sound[];
    }

    interface _IMSFTAudioEmitter {
        clips: _ILoaderClip[];
        emitters: _ILoaderEmitter[];
    }

    const enum _AnimationEventAction {
        play = "play",
        pause = "pause",
        stop = "stop",
    }

    interface _IAnimationEvent {
        action: _AnimationEventAction,
        emitter: number;
        time: number;
        startOffset?: number;
    }

    interface _ILoaderAnimationEvent extends _IAnimationEvent, _IArrayItem {
    }

    interface _ILoaderAnimationEvents {
        events: _ILoaderAnimationEvent[];
    }

    /**
     * [Specification](https://github.com/najadojo/glTF/tree/MSFT_audio_emitter/extensions/2.0/Vendor/MSFT_audio_emitter)
     */
    export class MSFT_audio_emitter extends GLTFLoaderExtension {
        public readonly name = NAME;

        private _loadClipAsync(context: string, clip: _ILoaderClip): Promise<string> {
            if (clip._objectURL) {
                return clip._objectURL;
            }

            let promise: Promise<ArrayBufferView>;
            if (clip.uri) {
                promise = this._loader._loadUriAsync(context, clip.uri);
            }
            else {
                const bufferView = GLTFLoader._GetProperty(`${context}/bufferView`, this._loader._gltf.bufferViews, clip.bufferView);
                promise = this._loader._loadBufferViewAsync(`#/bufferViews/${bufferView._index}`, bufferView);
            }

            clip._objectURL = promise.then(data => {
                return URL.createObjectURL(new Blob([data], { type: clip.mimeType }));
            });

            return clip._objectURL;
        }

        private _loadEmitterAsync(context: string, emitter: _ILoaderEmitter): Promise<void> {
            emitter._babylonSounds = emitter._babylonSounds || [];
            if (!emitter._babylonData) {
                const clipPromises = new Array<Promise<void>>();
                const name = emitter.name || `emitter${emitter._index}`;
                const options = {
                    loop: false,
                    autoplay: false,
                    volume: emitter.volume == undefined ? 1 : emitter.volume,
                };

                _ArrayItem.Assign(this._clips);
                for (let i = 0; i < emitter.clips.length; i++) {
                    const clipContext = `#/extensions/${NAME}/clips`;
                    const clip = GLTFLoader._GetProperty(clipContext, this._clips, emitter.clips[i].clip);
                    clipPromises.push(this._loadClipAsync(`${clipContext}/${emitter.clips[i].clip}`, clip).then((objectURL: string) => {
                        const sound = emitter._babylonSounds[i] = new Sound(name, objectURL, this._loader._babylonScene, null, options);
                        sound.refDistance = emitter.refDistance || 1;
                        sound.maxDistance = emitter.maxDistance || 256;
                        sound.rolloffFactor = emitter.rolloffFactor || 1;
                        sound.distanceModel = emitter.distanceModel || 'exponential';
                        sound._positionInEmitterSpace = true;
                    }));
                }

                const promise = Promise.all(clipPromises).then(() => {
                    const weights = emitter.clips.map(clip => { return clip.weight || 1; });
                    const weightedSound = new WeightedSound(emitter.loop || false, emitter._babylonSounds, weights);
                    if (emitter.innerAngle) weightedSound.directionalConeInnerAngle = 2 * Tools.ToDegrees(emitter.innerAngle);
                    if (emitter.outerAngle) weightedSound.directionalConeOuterAngle = 2 * Tools.ToDegrees(emitter.outerAngle);
                    if (emitter.volume) weightedSound.volume = emitter.volume;
                    emitter._babylonData!.sound = weightedSound;
                });

                emitter._babylonData = {
                    loaded: promise
                };
            }

            return emitter._babylonData.loaded;
        }

        protected _loadSceneAsync(context: string, scene: _ILoaderScene): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<_IEmittersReference>(context, scene, (extensionContext, extension) => {
                return this._loader._loadSceneAsync(context, scene).then(() => {

                    const promises = new Array<Promise<void>>();
                    _ArrayItem.Assign(this._emitters);
                    for (const emitterIndex of extension.emitters) {
                        const emitter = GLTFLoader._GetProperty(`${extensionContext}/emitters`, this._emitters, emitterIndex);
                        if (emitter.refDistance != undefined || emitter.maxDistance != undefined || emitter.rolloffFactor != undefined ||
                            emitter.distanceModel != undefined || emitter.innerAngle != undefined || emitter.outerAngle != undefined) {
                            throw new Error(`${extensionContext}: Direction or Distance properties are not allowed on emitters attached to a scene`);
                        }

                        promises.push(this._loadEmitterAsync(`${extensionContext}/emitters/${emitter._index}`, emitter));
                    }

                    return Promise.all(promises).then(() => {});
                });
            });
        }

        protected _loadNodeAsync(context: string, node: _ILoaderNode): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<_IEmittersReference>(context, node, (extensionContext, extension) => {
                return this._loader._loadNodeAsync(extensionContext, node).then(() => {

                    const promises = new Array<Promise<void>>();
                    _ArrayItem.Assign(this._emitters);
                    for (const emitterIndex of extension.emitters) {
                        const emitter = GLTFLoader._GetProperty(`${extensionContext}/emitters`, this._emitters, emitterIndex);
                        promises.push(this._loadEmitterAsync(`${extensionContext}/emitters/${emitter._index}`, emitter).then(() => {
                            if (node._babylonMesh) {
                                for (const sound of emitter._babylonSounds) {
                                    sound.attachToMesh(node._babylonMesh);
                                    if (emitter.innerAngle != undefined || emitter.outerAngle != undefined) {
                                        sound.setLocalDirectionToMesh(new Vector3(0, 0, 1));
                                        sound.setDirectionalCone(2 * Tools.ToDegrees(emitter.innerAngle == undefined ? Math.PI : emitter.innerAngle),
                                                                 2 * Tools.ToDegrees(emitter.outerAngle == undefined ? Math.PI : emitter.outerAngle), 0);
                                    }
                                }
                            }
                        }));
                    }

                    return Promise.all(promises).then(() => {});
                });
            });
        }

        protected _loadAnimationAsync(context: string, animation: _ILoaderAnimation): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<_ILoaderAnimationEvents>(context, animation, (extensionContext, extension) => {
                return this._loader._loadAnimationAsync(extensionContext, animation).then(() => {
                    const promises = new Array<Promise<void>>();
                    const babylonAnimationGroup = animation._babylonAnimationGroup!;

                    _ArrayItem.Assign(extension.events);
                    for (const event of extension.events) {
                        promises.push(this._loadAnimationEventAsync(`${extensionContext}/events/${event._index}`, context, animation, event, babylonAnimationGroup));
                    }

                    return Promise.all(promises).then(() => {
                        // Make sure all audio stops when the animation is terminated.
                        const getCallback = (pause: Boolean) => {
                            const emitterList = this._emitters;
                            if (pause) {
                                return () => { 
                                    for (const emitter of emitterList) {
                                        emitter._babylonData!.sound!.pause();
                                    }
                                };
                            } else {
                                return () => { 
                                    for (const emitter of emitterList) {
                                        emitter._babylonData!.sound!.stop();
                                    }
                                }
                            };
                        }
                        babylonAnimationGroup.onAnimationGroupEndObservable.add(getCallback(false));
                        babylonAnimationGroup.onAnimationGroupPauseObservable.add(getCallback(true));
                    });
                });
            });
        }

        private _getEventAction(context:string, sound: WeightedSound, action: _AnimationEventAction, time: number, startOffset?: number): (currentFrame: number) => void {
            if (action == _AnimationEventAction.play) {
                return (currentFrame: number) => {            
                    const frameOffset = (startOffset || 0) + (currentFrame - time);
                    sound.play(frameOffset);
                };
            } else if (action == _AnimationEventAction.stop) {
                return (currentFrame: number) => {
                    sound.stop();
                };
            } else if (action == _AnimationEventAction.pause) {
                return (currentFrame: number) => {   
                    sound.pause();
                };
            } else {
                throw new Error(`${context}: Unsupported action ${action}`);
            }
        }

        private _loadAnimationEventAsync(context: string, animationContext: string, animation: _ILoaderAnimation, event: _ILoaderAnimationEvent, babylonAnimationGroup: AnimationGroup): Promise<void> {
            if (babylonAnimationGroup.targetedAnimations.length == 0) {
                return Promise.resolve();
            }
            const babylonAnimation = babylonAnimationGroup.targetedAnimations[0];
            const emitterIndex = event.emitter;
            const emitter = GLTFLoader._GetProperty(`#/extensions/${NAME}/emitters`, this._emitters, emitterIndex);
            return this._loadEmitterAsync(context, emitter).then(()=> {
                const sound = emitter._babylonData!.sound;
                if (sound) {
                    var babylonAnimationEvent = new AnimationEvent(event.time, this._getEventAction(context, sound, event.action, event.time, event.startOffset));
                    babylonAnimation.animation.addEvent(babylonAnimationEvent);
                }
            });
        }

        private get _extension(): _IMSFTAudioEmitter {
            const extensions = this._loader._gltf.extensions;
            if (!extensions || !extensions[this.name]) {
                throw new Error(`#/extensions: '${this.name}' not found`);
            }

            return extensions[this.name] as _IMSFTAudioEmitter;
        }

        private get _clips(): Array<_ILoaderClip> {
            return this._extension.clips;
        }

        private get _emitters(): Array<_ILoaderEmitter> {
            return this._extension.emitters;
        }
    }

    GLTFLoader._Register(NAME, loader => new MSFT_audio_emitter(loader));
}