import type { AbstractAudioDevice } from "../abstractAudioDevice";
import { AbstractAudioEngine } from "../abstractAudioEngine";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractAudioPositioner, IAudioPositionerOptions } from "../abstractAudioPositioner";
import type { AbstractAudioSender } from "../abstractAudioSender";
import type { AbstractMainAudioBus } from "../abstractMainAudioBus";
import type { AbstractStaticSound, IStaticSoundOptions } from "../abstractStaticSound";
import type { AbstractStreamingSound, IStreamingSoundOptions } from "../abstractStreamingSound";
import { WebAudioDevice } from "./webAudioDevice";
import { WebAudioMainBus } from "./webAudioMainBus";
import { WebAudioPositioner } from "./webAudioPositioner";
import { WebAudioSender } from "./webAudioSender";
import { WeAudioStaticSoundInstance, WebAudioStaticSound } from "./webAudioStaticSound";
import { WebAudioStreamingSound, WebAudioStreamingSoundInstance } from "./webAudioStreamingSound";

export interface IWebAudioPositionerOptions extends IAudioPositionerOptions {
    //
}

export interface IWebAudioStaticSoundOptions extends IStaticSoundOptions {
    //
}

export interface IWebAudioStreamingSoundOptions extends IStreamingSoundOptions {
    //
}

export async function CreateAudioEngine(): Promise<AbstractAudioEngine> {
    return new WebAudioEngine();
}

export class WebAudioEngine extends AbstractAudioEngine {
    public async createDevice(name: string): Promise<AbstractAudioDevice> {
        const device = new WebAudioDevice(name, this);
        this._addDevice(device);
        return device;
    }

    public override async createMainBus(name: string): Promise<AbstractMainAudioBus> {
        return new WebAudioMainBus(name, this);
    }

    public async createPositioner(parent: AbstractAudioNode, options?: IWebAudioPositionerOptions): Promise<AbstractAudioPositioner> {
        return new WebAudioPositioner(parent, options);
    }

    public async createSender(parent: AbstractAudioNode): Promise<AbstractAudioSender> {
        return new WebAudioSender(parent);
    }

    public async createSound(name: string, options?: IWebAudioStaticSoundOptions): Promise<AbstractStaticSound> {
        const sound = new WebAudioStaticSound(name, this, options);
        this._addSound(sound);
        return sound;
    }

    public async createSoundInstance(source: AbstractStaticSound, inputNode: AbstractAudioNode): Promise<WeAudioStaticSoundInstance> {
        const soundInstance = new WeAudioStaticSoundInstance(source, inputNode);
        this._addSoundInstance(soundInstance);
        return soundInstance;
    }

    public async createStreamingSound(name: string, options?: IStreamingSoundOptions): Promise<AbstractStreamingSound> {
        const sound = new WebAudioStreamingSound(name, this, options);
        this._addSound(sound);
        return sound;
    }

    public async createStreamingSoundInstance(source: AbstractStreamingSound, inputNode: AbstractAudioNode): Promise<WeAudioStaticSoundInstance> {
        const soundInstance = new WebAudioStreamingSoundInstance(source, inputNode);
        this._addSoundInstance(soundInstance);
        return soundInstance;
    }
}
