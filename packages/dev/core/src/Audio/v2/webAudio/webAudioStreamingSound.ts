import { AbstractStreamingSound } from "../abstractStreamingSound";
import { AbstractStreamingSoundInstance } from "../abstractStreamingSoundInstance";
import type { IWebAudioStreamingSoundOptions, WebAudioEngine } from "./webAudioEngine";

/** @internal */
export class WebAudioStreamingSound extends AbstractStreamingSound {
    public get currentTime(): number {
        return 0;
    }

    constructor(name: string, engine: WebAudioEngine, options?: IWebAudioStreamingSoundOptions) {
        super(name, engine, options);
    }
}

/** @internal */
export class WebAudioStreamingSoundInstance extends AbstractStreamingSoundInstance {
    public get currentTime(): number {
        return 0;
    }

    constructor(source: WebAudioStreamingSound) {
        super(source);
    }

    public play(): Promise<void> {
        return Promise.resolve();
    }

    public pause(): void {
        //
    }

    public resume(): void {
        //
    }

    public override stop(): void {
        super.stop();
    }
}
