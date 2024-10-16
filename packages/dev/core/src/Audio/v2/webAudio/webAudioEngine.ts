import type { Nullable } from "../../../types";
import type { AbstractAudioDevice } from "../abstractAudioDevice";
import { AbstractAudioEngine } from "../abstractAudioEngine";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractAudioPositioner, IAudioPositionerOptions } from "../abstractAudioPositioner";
import type { AbstractAudioSender } from "../abstractAudioSender";
import type { AbstractMainAudioBus } from "../abstractMainAudioBus";
import type { AbstractStaticSound, IStaticSoundOptions } from "../abstractStaticSound";
import type { AbstractStreamingSound, IStreamingSoundOptions } from "../abstractStreamingSound";
import { WebAudioDevice } from "./webAudioDevice";
import { WebAudioMainBus } from "./webAudioBus";
import { WebAudioPositioner } from "./webAudioPositioner";
import { WebAudioSender } from "./webAudioSender";
import { WebAudioStaticSoundInstance, WebAudioStaticSound } from "./webAudioStaticSound";
import { WebAudioStreamingSound, WebAudioStreamingSoundInstance } from "./webAudioStreamingSound";

export interface IWebAudioDeviceOptions {
    audioContext?: AudioContext;
}

export interface IWebAudioEngineOptions {
    audioContext?: AudioContext;
    noDefaultDevice?: boolean;
    noDefaultMainBus?: boolean;
}

export interface IWebAudioPositionerOptions extends IAudioPositionerOptions {
    //
}

export interface IWebAudioStaticSoundOptions extends IStaticSoundOptions {
    sourceUrl?: string;
}

export interface IWebAudioStreamingSoundOptions extends IStreamingSoundOptions {
    //
}

export async function CreateAudioEngine(options: Nullable<IWebAudioEngineOptions> = null): Promise<AbstractWebAudioEngine> {
    const engine = new WebAudioEngine();
    await engine.init(options);
    return engine;
}

export class AbstractWebAudioEngine extends AbstractAudioEngine {
    public async createDevice(name: string, options: Nullable<IWebAudioDeviceOptions> = null): Promise<AbstractAudioDevice> {
        const device = new WebAudioDevice(name, this, options);
        this._addDevice(device);
        return device;
    }

    public override async createMainBus(name: string): Promise<AbstractMainAudioBus> {
        const bus = new WebAudioMainBus(name, this);
        await bus.init();
        this._addMainBus(bus);
        return bus;
    }

    public async createPositioner(parent: AbstractAudioNode, options: Nullable<IWebAudioPositionerOptions> = null): Promise<AbstractAudioPositioner> {
        return new WebAudioPositioner(parent, options);
    }

    public async createSender(parent: AbstractAudioNode): Promise<AbstractAudioSender> {
        return new WebAudioSender(parent);
    }

    public async createSound(name: string, options: Nullable<IWebAudioStaticSoundOptions> = null): Promise<AbstractStaticSound> {
        const sound = new WebAudioStaticSound(name, this, options);
        await sound.init(options);
        this._addSound(sound);
        return sound;
    }

    public async createSoundInstance(source: WebAudioStaticSound): Promise<WebAudioStaticSoundInstance> {
        const soundInstance = new WebAudioStaticSoundInstance(source);
        await soundInstance.init();
        this._addSoundInstance(soundInstance);
        return soundInstance;
    }

    public async createStreamingSound(name: string, options: Nullable<IStreamingSoundOptions> = null): Promise<AbstractStreamingSound> {
        const sound = new WebAudioStreamingSound(name, this, options);
        await sound.init(options);
        this._addSound(sound);
        return sound;
    }

    public async createStreamingSoundInstance(source: WebAudioStreamingSound): Promise<WebAudioStreamingSoundInstance> {
        const soundInstance = new WebAudioStreamingSoundInstance(source);
        await soundInstance.init();
        this._addSoundInstance(soundInstance);
        return soundInstance;
    }
}

/** @internal */
export class WebAudioEngine extends AbstractWebAudioEngine {
    public override get defaultDevice(): WebAudioDevice {
        return super.defaultDevice as WebAudioDevice;
    }

    public async init(options: Nullable<IWebAudioEngineOptions> = null): Promise<void> {
        if (!options?.noDefaultDevice) {
            await this.createDevice("default", { audioContext: options?.audioContext });

            if (!options?.noDefaultMainBus) {
                await this.createMainBus("default");
                this.defaultMainBus.device = this.defaultDevice;
            }
        }
    }
}
