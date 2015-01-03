declare module BABYLON {
    class Sound {
        public maxDistance: number;
        public autoplay: boolean;
        public loop: boolean;
        public useBabylonJSAttenuation: boolean;
        public soundTrackId: number;
        private _position;
        private _localDirection;
        private _volume;
        private _isLoaded;
        private _isReadyToPlay;
        private _isPlaying;
        private _isDirectional;
        private _audioEngine;
        private _readyToPlayCallback;
        private _audioBuffer;
        private _soundSource;
        private _soundPanner;
        private _soundGain;
        private _coneInnerAngle;
        private _coneOuterAngle;
        private _coneOuterGain;
        private _scene;
        private _name;
        private _connectedMesh;
        /**
        * Create a sound and attach it to a scene
        * @param name Name of your sound
        * @param url Url to the sound to load async
        * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
        * @param options Objects to provide with the current available options: autoplay, loop, distanceMax
        */
        constructor(name: string, url: string, scene: Scene, readyToPlayCallback?: () => void, options?: any);
        public connectToSoundTrackAudioNode(soundTrackAudioNode: AudioNode): void;
        /**
        * Transform this sound into a directional source
        * @param coneInnerAngle Size of the inner cone in degree
        * @param coneOuterAngle Size of the outer cone in degree
        * @param coneOuterGain Volume of the sound outside the outer cone (between 0.0 and 1.0)
        */
        public setDirectionalCone(coneInnerAngle: number, coneOuterAngle: number, coneOuterGain: number): void;
        public setPosition(newPosition: Vector3): void;
        public setLocalDirectionToMesh(newLocalDirection: Vector3): void;
        private _updateDirection();
        public updateDistanceFromListener(): void;
        /**
        * Play the sound
        * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
        */
        public play(time?: number): void;
        /**
        * Stop the sound
        * @param time (optional) Stop the sound after X seconds. Stop immediately (0) by default.
        */
        public stop(time?: number): void;
        public pause(): void;
        public setVolume(newVolume: number): void;
        public getVolume(): number;
        public attachToMesh(meshToConnectTo: AbstractMesh): void;
        private _onRegisterAfterWorldMatrixUpdate(connectedMesh);
        private _soundLoaded(audioData);
    }
}
