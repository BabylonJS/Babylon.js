import { Sound } from "./sound";
import { SoundTrack } from "./soundTrack";
import { Engine } from "../Engines/engine";
import { Camera } from "../Cameras/camera";
import { Nullable } from "../types";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { SceneComponentConstants, ISceneSerializableComponent } from "../sceneComponent";
import { Scene } from "../scene";
import { AbstractScene } from "../abstractScene";
import { AssetContainer } from "../assetContainer";

import "./audioEngine";
import { PrecisionDate } from '../Misc/precisionDate';

// Adds the parser to the scene parsers.
AbstractScene.AddParser(SceneComponentConstants.NAME_AUDIO, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {
    // TODO: add sound
    var loadedSounds: Sound[] = [];
    var loadedSound: Sound;
    container.sounds = container.sounds || [];
    if (parsedData.sounds !== undefined && parsedData.sounds !== null) {
        for (let index = 0, cache = parsedData.sounds.length; index < cache; index++) {
            var parsedSound = parsedData.sounds[index];
            if (Engine.audioEngine.canUseWebAudio) {
                if (!parsedSound.url) { parsedSound.url = parsedSound.name; }
                if (!loadedSounds[parsedSound.url]) {
                    loadedSound = Sound.Parse(parsedSound, scene, rootUrl);
                    loadedSounds[parsedSound.url] = loadedSound;
                    container.sounds.push(loadedSound);
                }
                else {
                    container.sounds.push(Sound.Parse(parsedSound, scene, rootUrl, loadedSounds[parsedSound.url]));
                }
            } else {
                container.sounds.push(new Sound(parsedSound.name, null, scene));
            }
        }
    }

    loadedSounds = [];
});

declare module "../abstractScene" {
    export interface AbstractScene {
        /**
         * The list of sounds used in the scene.
         */
        sounds: Nullable<Array<Sound>>;
    }
}

declare module "../scene" {
    export interface Scene {
        /**
         * @hidden
         * Backing field
         */
        _mainSoundTrack: SoundTrack;
        /**
         * The main sound track played by the scene.
         * It cotains your primary collection of sounds.
         */
        mainSoundTrack: SoundTrack;
        /**
         * The list of sound tracks added to the scene
         * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music
         */
        soundTracks: Nullable<Array<SoundTrack>>;

        /**
         * Gets a sound using a given name
         * @param name defines the name to search for
         * @return the found sound or null if not found at all.
         */
        getSoundByName(name: string): Nullable<Sound>;

        /**
         * Gets or sets if audio support is enabled
         * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music
         */
        audioEnabled: boolean;

        /**
         * Gets or sets if audio will be output to headphones
         * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music
         */
        headphone: boolean;

        /**
         * Gets or sets custom audio listener position provider
         * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music
         */
        audioListenerPositionProvider: Nullable<() => Vector3>;

        /**
         * Gets or sets a refresh rate when using 3D audio positioning
         */
        audioPositioningRefreshRate: number;
    }
}

Object.defineProperty(Scene.prototype, "mainSoundTrack", {
    get: function(this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        if (!this._mainSoundTrack) {
            this._mainSoundTrack = new SoundTrack(this, { mainTrack: true });
        }

        return this._mainSoundTrack;
    },
    enumerable: true,
    configurable: true
});

Scene.prototype.getSoundByName = function(name: string): Nullable<Sound> {
    var index: number;
    for (index = 0; index < this.mainSoundTrack.soundCollection.length; index++) {
        if (this.mainSoundTrack.soundCollection[index].name === name) {
            return this.mainSoundTrack.soundCollection[index];
        }
    }

    if (this.soundTracks) {
        for (var sdIndex = 0; sdIndex < this.soundTracks.length; sdIndex++) {
            for (index = 0; index < this.soundTracks[sdIndex].soundCollection.length; index++) {
                if (this.soundTracks[sdIndex].soundCollection[index].name === name) {
                    return this.soundTracks[sdIndex].soundCollection[index];
                }
            }
        }
    }

    return null;
};

Object.defineProperty(Scene.prototype, "audioEnabled", {
    get: function(this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        return compo.audioEnabled;
    },
    set: function(this: Scene, value: boolean) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        if (value) {
            compo.enableAudio();
        }
        else {
            compo.disableAudio();
        }
    },
    enumerable: true,
    configurable: true
});

Object.defineProperty(Scene.prototype, "headphone", {
    get: function(this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        return compo.headphone;
    },
    set: function(this: Scene, value: boolean) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        if (value) {
            compo.switchAudioModeForHeadphones();
        }
        else {
            compo.switchAudioModeForNormalSpeakers();
        }
    },
    enumerable: true,
    configurable: true
});

Object.defineProperty(Scene.prototype, "audioListenerPositionProvider", {
    get: function(this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        return compo.audioListenerPositionProvider;
    },
    set: function(this: Scene, value: () => Vector3) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        if (typeof value !== 'function') {
            throw new Error('The value passed to [Scene.audioListenerPositionProvider] must be a function that returns a Vector3');
        } else {
            compo.audioListenerPositionProvider = value;
        }
    },
    enumerable: true,
    configurable: true
});

Object.defineProperty(Scene.prototype, "audioPositioningRefreshRate", {
    get: function(this: Scene) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        return compo.audioPositioningRefreshRate;
    },
    set: function(this: Scene, value: number) {
        let compo = this._getComponent(SceneComponentConstants.NAME_AUDIO) as AudioSceneComponent;
        if (!compo) {
            compo = new AudioSceneComponent(this);
            this._addComponent(compo);
        }

        compo.audioPositioningRefreshRate = value;
    },
    enumerable: true,
    configurable: true
});

/**
 * Defines the sound scene component responsible to manage any sounds
 * in a given scene.
 */
export class AudioSceneComponent implements ISceneSerializableComponent {
    /**
     * The component name helpfull to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_AUDIO;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    private _audioEnabled = true;
    /**
     * Gets whether audio is enabled or not.
     * Please use related enable/disable method to switch state.
     */
    public get audioEnabled(): boolean {
        return this._audioEnabled;
    }

    private _headphone = false;
    /**
     * Gets whether audio is outputing to headphone or not.
     * Please use the according Switch methods to change output.
     */
    public get headphone(): boolean {
        return this._headphone;
    }

    /**
     * Gets or sets a refresh rate when using 3D audio positioning
     */
    public audioPositioningRefreshRate = 500;

    private _audioListenerPositionProvider: Nullable<() => Vector3> = null;
    /**
     * Gets the current audio listener position provider
     */
    public get audioListenerPositionProvider(): Nullable<() => Vector3> {
        return this._audioListenerPositionProvider;
    }
    /**
     * Sets a custom listener position for all sounds in the scene
     * By default, this is the position of the first active camera
     */
    public set audioListenerPositionProvider(value: Nullable<() => Vector3>) {
        this._audioListenerPositionProvider = value;
    }

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;

        scene.soundTracks = new Array<SoundTrack>();
        scene.sounds = new Array<Sound>();
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this.scene._afterRenderStage.registerStep(SceneComponentConstants.STEP_AFTERRENDER_AUDIO, this, this._afterRender);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do here. (Not rendering related)
    }

    /**
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    public serialize(serializationObject: any): void {
        serializationObject.sounds = [];

        if (this.scene.soundTracks) {
            for (var index = 0; index < this.scene.soundTracks.length; index++) {
                var soundtrack = this.scene.soundTracks[index];

                for (var soundId = 0; soundId < soundtrack.soundCollection.length; soundId++) {
                    serializationObject.sounds.push(soundtrack.soundCollection[soundId].serialize());
                }
            }
        }
    }

    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    public addFromContainer(container: AbstractScene): void {
        if (!container.sounds) {
            return;
        }
        container.sounds.forEach((sound) => {
            sound.play();
            sound.autoplay = true;
            this.scene.mainSoundTrack.AddSound(sound);
        });
    }

    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    public removeFromContainer(container: AbstractScene, dispose = false): void {
        if (!container.sounds) {
            return;
        }
        container.sounds.forEach((sound) => {
            sound.stop();
            sound.autoplay = false;
            this.scene.mainSoundTrack.RemoveSound(sound);
            if (dispose) {
                sound.dispose();
            }
        });
    }

    /**
     * Disposes the component and the associated ressources.
     */
    public dispose(): void {
        const scene = this.scene;
        if (scene._mainSoundTrack) {
            scene.mainSoundTrack.dispose();
        }

        if (scene.soundTracks) {
            for (var scIndex = 0; scIndex < scene.soundTracks.length; scIndex++) {
                scene.soundTracks[scIndex].dispose();
            }
        }
    }

    /**
     * Disables audio in the associated scene.
     */
    public disableAudio() {
        const scene = this.scene;
        this._audioEnabled = false;

        if (Engine.audioEngine && Engine.audioEngine.audioContext) {
            Engine.audioEngine.audioContext.suspend();
        }

        let i: number;
        for (i = 0; i < scene.mainSoundTrack.soundCollection.length; i++) {
            scene.mainSoundTrack.soundCollection[i].pause();
        }
        if (scene.soundTracks) {
            for (i = 0; i < scene.soundTracks.length; i++) {
                for (var j = 0; j < scene.soundTracks[i].soundCollection.length; j++) {
                    scene.soundTracks[i].soundCollection[j].pause();
                }
            }
        }
    }

    /**
     * Enables audio in the associated scene.
     */
    public enableAudio() {
        const scene = this.scene;
        this._audioEnabled = true;

        if (Engine.audioEngine && Engine.audioEngine.audioContext) {
            Engine.audioEngine.audioContext.resume();
        }

        let i: number;
        for (i = 0; i < scene.mainSoundTrack.soundCollection.length; i++) {
            if (scene.mainSoundTrack.soundCollection[i].isPaused) {
                scene.mainSoundTrack.soundCollection[i].play();
            }
        }
        if (scene.soundTracks) {
            for (i = 0; i < scene.soundTracks.length; i++) {
                for (var j = 0; j < scene.soundTracks[i].soundCollection.length; j++) {
                    if (scene.soundTracks[i].soundCollection[j].isPaused) {
                        scene.soundTracks[i].soundCollection[j].play();
                    }
                }
            }
        }
    }

    /**
     * Switch audio to headphone output.
     */
    public switchAudioModeForHeadphones() {
        const scene = this.scene;
        this._headphone = true;

        scene.mainSoundTrack.switchPanningModelToHRTF();
        if (scene.soundTracks) {
            for (var i = 0; i < scene.soundTracks.length; i++) {
                scene.soundTracks[i].switchPanningModelToHRTF();
            }
        }
    }

    /**
     * Switch audio to normal speakers.
     */
    public switchAudioModeForNormalSpeakers() {
        const scene = this.scene;
        this._headphone = false;

        scene.mainSoundTrack.switchPanningModelToEqualPower();

        if (scene.soundTracks) {
            for (var i = 0; i < scene.soundTracks.length; i++) {
                scene.soundTracks[i].switchPanningModelToEqualPower();
            }
        }
    }

    private _cachedCameraDirection = new Vector3();
    private _cachedCameraPosition = new Vector3();
    private _lastCheck = 0;

    private _afterRender() {
        var now = PrecisionDate.Now;
        if (this._lastCheck && now - this._lastCheck < this.audioPositioningRefreshRate) {
            return;
        }

        this._lastCheck = now;

        const scene = this.scene;
        if (!this._audioEnabled || !scene._mainSoundTrack || !scene.soundTracks || (scene._mainSoundTrack.soundCollection.length === 0 && scene.soundTracks.length === 1)) {
            return;
        }

        var audioEngine = Engine.audioEngine;

        if (audioEngine.audioContext) {
            // A custom listener position provider was set
            // Use the users provided position instead of camera's
            if (this._audioListenerPositionProvider) {
                var position: Vector3 = this._audioListenerPositionProvider();
                // Make sure all coordinates were provided
                position.x = position.x || 0;
                position.y = position.y || 0;
                position.z = position.z || 0;
                // Set the listener position
                audioEngine.audioContext.listener.setPosition(position.x, position.y, position.z);
            } else {
                var listeningCamera: Nullable<Camera>;

                if (scene.activeCameras.length > 0) {
                    listeningCamera = scene.activeCameras[0];
                } else {
                    listeningCamera = scene.activeCamera;
                }

                // Check if there is a listening camera
                if (listeningCamera) {
                    // Set the listener position to the listening camera global position
                    if (!this._cachedCameraPosition.equals(listeningCamera.globalPosition)) {
                        this._cachedCameraPosition.copyFrom(listeningCamera.globalPosition);
                        audioEngine.audioContext.listener.setPosition(listeningCamera.globalPosition.x, listeningCamera.globalPosition.y, listeningCamera.globalPosition.z);
                    }

                    // for VR cameras
                    if (listeningCamera.rigCameras && listeningCamera.rigCameras.length > 0) {
                        listeningCamera = listeningCamera.rigCameras[0];
                    }
                    var mat = Matrix.Invert(listeningCamera.getViewMatrix());
                    var cameraDirection = Vector3.TransformNormal(new Vector3(0, 0, -1), mat);
                    cameraDirection.normalize();
                    // To avoid some errors on GearVR
                    if (!isNaN(cameraDirection.x) && !isNaN(cameraDirection.y) && !isNaN(cameraDirection.z)) {
                        if (!this._cachedCameraDirection.equals(cameraDirection)) {
                            this._cachedCameraDirection.copyFrom(cameraDirection);
                            audioEngine.audioContext.listener.setOrientation(cameraDirection.x, cameraDirection.y, cameraDirection.z, 0, 1, 0);
                        }
                    }
                }
                // Otherwise set the listener position to 0, 0 ,0
                else {
                    // Set the listener position
                    audioEngine.audioContext.listener.setPosition(0, 0, 0);
                }
            }

            var i: number;
            for (i = 0; i < scene.mainSoundTrack.soundCollection.length; i++) {
                var sound = scene.mainSoundTrack.soundCollection[i];
                if (sound.useCustomAttenuation) {
                    sound.updateDistanceFromListener();
                }
            }
            if (scene.soundTracks) {
                for (i = 0; i < scene.soundTracks.length; i++) {
                    for (var j = 0; j < scene.soundTracks[i].soundCollection.length; j++) {
                        sound = scene.soundTracks[i].soundCollection[j];
                        if (sound.useCustomAttenuation) {
                            sound.updateDistanceFromListener();
                        }
                    }
                }
            }
        }
    }
}

Sound._SceneComponentInitialization = (scene: Scene) => {
    let compo = scene._getComponent(SceneComponentConstants.NAME_AUDIO);
    if (!compo) {
        compo = new AudioSceneComponent(scene);
        scene._addComponent(compo);
    }
};
