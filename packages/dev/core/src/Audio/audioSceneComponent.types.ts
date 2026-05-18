import { type Sound } from "./sound";
import { type SoundTrack } from "./soundTrack";
import { type Vector3 } from "../Maths/math.vector";
import { type Nullable } from "../types";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * @internal
         * Backing field
         */
        _mainSoundTrack: SoundTrack;
        /**
         * The main sound track played by the scene.
         * It contains your primary collection of sounds.
         * @deprecated please use AudioEngineV2 instead
         */
        mainSoundTrack: SoundTrack;
        /**
         * The list of sound tracks added to the scene
         * @deprecated please use AudioEngineV2 instead
         */
        soundTracks: Nullable<Array<SoundTrack>>;

        /**
         * Gets a sound using a given name
         * @param name defines the name to search for
         * @returns the found sound or null if not found at all.
         * @deprecated please use AudioEngineV2 instead
         */
        getSoundByName(name: string): Nullable<Sound>;

        /**
         * Gets or sets if audio support is enabled
         * @deprecated please use AudioEngineV2 instead
         */
        audioEnabled: boolean;

        /**
         * Gets or sets if audio will be output to headphones
         * @deprecated please use AudioEngineV2 instead
         */
        headphone: boolean;

        /**
         * Gets or sets custom audio listener position provider
         * @deprecated please use AudioEngineV2 instead
         */
        audioListenerPositionProvider: Nullable<() => Vector3>;

        /**
         * Gets or sets custom audio listener rotation provider
         * @deprecated please use AudioEngineV2 instead
         */
        audioListenerRotationProvider: Nullable<() => Vector3>;

        /**
         * Gets or sets a refresh rate when using 3D audio positioning
         * @deprecated please use AudioEngineV2 instead
         */
        audioPositioningRefreshRate: number;
    }
}
