import type { Nullable } from "../../../types";
import { AbstractStreamingSound } from "../abstractStreamingSound";
import { AbstractStreamingSoundInstance } from "../abstractStreamingSoundInstance";
import type { AbstractWebAudioEngine, IWebAudioStreamingSoundOptions } from "./webAudioEngine";

/** @internal */
export class WebAudioStreamingSound extends AbstractStreamingSound {
    public get currentTime(): number {
        return 0;
    }

    public constructor(name: string, engine: AbstractWebAudioEngine, options: Nullable<IWebAudioStreamingSoundOptions> = null) {
        super(name, engine, options);
    }

    public async init(options: Nullable<IWebAudioStreamingSoundOptions> = null): Promise<void> {
        //
    }
}

/** @internal */
export class WebAudioStreamingSoundInstance extends AbstractStreamingSoundInstance {
    public get currentTime(): number {
        return 0;
    }

    public constructor(source: WebAudioStreamingSound) {
        super(source);
    }

    public async init(): Promise<void> {
        //
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
        //
    }
}
