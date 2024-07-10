import type { IPhysicalAudioEngine } from "./audioEngine";

/** @internal */
export class NullPhysicalAudioEngine implements IPhysicalAudioEngine {
    private _startTime: number = 0;

    /** @internal */
    public constructor() {
        this._startTime = performance.now();
    }

    /** {@inheritdoc IPhysicalAudioEngine.currentTime} */
    public get currentTime(): number {
        return (performance.now() - this._startTime) / 1000;
    }

    /**
     * {@inheritdoc IPhysicalAudioEngine.update}
     */
    public update(): void {}
}
