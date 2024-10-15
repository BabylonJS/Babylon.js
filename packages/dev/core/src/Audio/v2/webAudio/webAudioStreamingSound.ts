import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractStreamingSound } from "../abstractStreamingSound";
import { AbstractStreamingSoundInstance } from "../abstractStreamingSoundInstance";
import type { WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioStreamingSoundOptions } from "./webAudioEngine";

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

    constructor(source: WebAudioStreamingSound, inputNode: AbstractAudioNode) {
        super(source, inputNode);
    }

    public play(): void {
        //
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
