import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractStaticSound } from "../abstractStaticSound";
import { AbstractStaticSoundInstance } from "../abstractStaticSoundInstance";
import type { WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioStaticSoundOptions } from "./webAudioEngine";

/** @internal */
export class WebAudioStaticSound extends AbstractStaticSound {
    public get currentTime(): number {
        return 0;
    }

    constructor(name: string, engine: WebAudioEngine, options?: IWebAudioStaticSoundOptions) {
        super(name, engine, options);
    }
}

/** @internal */
export class WeAudioStaticSoundInstance extends AbstractStaticSoundInstance {
    public get currentTime(): number {
        return 0;
    }

    constructor(source: WebAudioStaticSound, inputNode: AbstractAudioNode) {
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
