declare module BABYLON {
    class AudioEngine {
        public audioContext: AudioContext;
        public canUseWebAudio: boolean;
        public masterGain: GainNode;
        constructor();
        public getGlobalVolume(): number;
        public setGlobalVolume(newVolume: number): void;
    }
}
