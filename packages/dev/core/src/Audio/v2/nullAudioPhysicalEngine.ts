import type { IAudioPhysicalEngine } from "./audioEngine";

/** @internal */
export class NullAudioPhysicalEngine implements IAudioPhysicalEngine {
    private _startTime: number = 0;

    /** @internal */
    public constructor() {
        this._startTime = performance.now();
    }

    /** {@inheritdoc IAudioPhysicalEngine.currentTime} */
    public get currentTime(): number {
        return (performance.now() - this._startTime) / 1000;
    }

    /**
     * {@inheritdoc IAudioPhysicalEngine.update}
     */
    public update(): void {}
}
