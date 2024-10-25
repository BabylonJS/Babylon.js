import type { Nullable } from "../../../types";
import { AbstractStreamingSound } from "../abstractStreamingSound";
import { AbstractStreamingSoundInstance } from "../abstractStreamingSoundInstance";
import type { AbstractWebAudioEngine, WebAudioStreamingSoundOptions } from "./webAudioEngine";

/** @internal */
export class WebAudioStreamingSound extends AbstractStreamingSound {
    /** @internal */
    public get currentTime(): number {
        return 0;
    }

    /** @internal */
    constructor(name: string, engine: AbstractWebAudioEngine, options: Nullable<WebAudioStreamingSoundOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(options: Nullable<WebAudioStreamingSoundOptions> = null): Promise<void> {}
}

/** @internal */
export class WebAudioStreamingSoundInstance extends AbstractStreamingSoundInstance {
    public get currentTime(): number {
        return 0;
    }

    constructor(source: WebAudioStreamingSound) {
        super(source);
    }

    public async init(): Promise<void> {}

    /** @internal */
    public play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null, duration: Nullable<number> = null): void {}

    /** @internal */
    public pause(): void {}

    /** @internal */
    public resume(): void {}

    /** @internal */
    public override stop(waitTime: Nullable<number> = null): void {}
}
