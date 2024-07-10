/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioBuffer, IAudioStream, ISoundOptions, IStaticSoundOptions, IStreamingSoundOptions } from "./audioEngine";

enum VirtualVoiceType {
    Static,
    Streaming,
}

export interface IVirtualVoice {
    priority: number;
    type: VirtualVoiceType;
    spatial: boolean;

    play(): void;
    pause(): void;
    stop(): void;
}

class AbstractVirtualVoice {
    public readonly priority: number;
    public readonly spatial: boolean;

    public constructor(options: ISoundOptions) {
        this.priority = options?.priority ?? 0;
        this.spatial = options?.spatial ?? false;
    }

    public play(): void {
        // ...
    }

    public pause(): void {
        // ...
    }

    public stop(): void {
        // ...
    }
}

export class StaticVirtualVoice extends AbstractVirtualVoice implements IVirtualVoice {
    public readonly type: VirtualVoiceType = VirtualVoiceType.Static;

    public constructor(options: IStaticSoundOptions, _buffer: IAudioBuffer) {
        super(options);
    }
}

export class StreamingVirtualVoice extends AbstractVirtualVoice implements IVirtualVoice {
    public readonly type: VirtualVoiceType = VirtualVoiceType.Streaming;

    public constructor(options: IStreamingSoundOptions, _stream: IAudioStream) {
        super(options);
    }
}
