declare module BABYLON {
    class SoundTrack {
        private _audioEngine;
        private _trackGain;
        private _trackConvolver;
        private _scene;
        public id: number;
        public soundCollection: Sound[];
        private _isMainTrack;
        constructor(scene: Scene, options?: any);
        public AddSound(sound: Sound): void;
        public RemoveSound(sound: Sound): void;
        public setVolume(newVolume: number): void;
    }
}
