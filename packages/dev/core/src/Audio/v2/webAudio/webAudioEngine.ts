import type { Nullable } from "../../../types";
import type { AudioBusOptions } from "../abstractAudioBus";
import type { AbstractAudioDevice } from "../abstractAudioDevice";
import { AbstractAudioEngine } from "../abstractAudioEngine";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractAudioPositioner, AudioPositionerOptions } from "../abstractAudioPositioner";
import type { AbstractAudioSender } from "../abstractAudioSender";
import type { AbstractMainAudioBus } from "../abstractMainAudioBus";
import type { AbstractStaticSound, StaticSoundOptions } from "../abstractStaticSound";
import type { AbstractStreamingSound, StreamingSoundOptions } from "../abstractStreamingSound";
import { WebAudioDevice } from "./webAudioDevice";
import { WebAudioMainBus } from "./webAudioMainBus";
import { WebAudioPositioner } from "./webAudioPositioner";
import { WebAudioSender } from "./webAudioSender";
import { WebAudioStaticSound, WebAudioStaticSoundInstance } from "./webAudioStaticSound";
import { WebAudioStreamingSound, WebAudioStreamingSoundInstance } from "./webAudioStreamingSound";

/**
 * Options for creating a new WebAudioBus.
 */
export interface WebAudioBusOptions extends AudioBusOptions {}

/**
 * Options for creating a new WebAudioDevice.
 */
export interface WebAudioDeviceOptions {
    /**
     * The audio context to be used by the device.
     */
    audioContext?: AudioContext;
}

/**
 * Options for creating a new WebAudioEngine.
 */
export interface WebAudioEngineOptions {
    /**
     * The audio context to be used by the engine.
     */
    audioContext?: AudioContext;
    /**
     * Whether to disable the default device.
     */
    noDefaultDevice?: boolean;
    /**
     * Whether to disable the default main bus.
     */
    noDefaultMainBus?: boolean;
}

/**
 * Options for creating a new WebAudioPositioner.
 */
export interface WebAudioPositionerOptions extends AudioPositionerOptions {}

/**
 * Options for creating a new WebAudioStaticSound.
 */
export interface WebAudioStaticSoundOptions extends StaticSoundOptions {
    /**
     * The URL of the sound source.
     */
    sourceUrl?: string;
}

/**
 * Options for creating a new WebAudioStreamingSound.
 */
export interface WebAudioStreamingSoundOptions extends StreamingSoundOptions {
    /**
     * The URL of the sound source.
     */
    sourceUrl?: string;
}

/**
 * Creates a new WebAudioEngine.
 * @param options - The options for creating the audio engine.
 * @returns A promise that resolves with the created audio engine.
 */
export async function CreateAudioEngine(options: Nullable<WebAudioEngineOptions> = null): Promise<AbstractWebAudioEngine> {
    const engine = new WebAudioEngine();
    await engine.init(options);
    return engine;
}

/**
 * Abstract class for WebAudioEngine.
 */
export class AbstractWebAudioEngine extends AbstractAudioEngine {
    /**
     * Creates a new audio device.
     * @param name - The name of the device.
     * @param options - The options for creating the device.
     * @returns A promise that resolves with the created device.
     */
    public async createDevice(name: string, options: Nullable<WebAudioDeviceOptions> = null): Promise<AbstractAudioDevice> {
        const device = new WebAudioDevice(name, this, options);
        this._addDevice(device);
        return device;
    }

    /**
     * Creates a new main audio bus.
     * @param name - The name of the main bus.
     * @returns A promise that resolves with the created main audio bus.
     */
    public override async createMainBus(name: string): Promise<AbstractMainAudioBus> {
        const bus = new WebAudioMainBus(name, this);
        await bus.init();
        this._addMainBus(bus);
        return bus;
    }

    /**
     * Creates a new audio positioner.
     * @param parent - The parent node.
     * @param options - The options for creating the positioner.
     * @returns A promise that resolves with the created positioner.
     */
    public async createPositioner(parent: AbstractAudioNode, options: Nullable<WebAudioPositionerOptions> = null): Promise<AbstractAudioPositioner> {
        return new WebAudioPositioner(parent, options);
    }

    /**
     * Creates a new WebAudioSender.
     * @param parent - The parent audio node.
     * @returns A promise that resolves to the created WebAudioSender.
     */
    public async createSender(parent: AbstractAudioNode): Promise<AbstractAudioSender> {
        return new WebAudioSender(parent);
    }

    /**
     * Creates a new static sound.
     * @param name - The name of the sound.
     * @param options - The options for the static sound.
     * @returns A promise that resolves to the created static sound.
     */
    public async createSound(name: string, options: Nullable<WebAudioStaticSoundOptions> = null): Promise<AbstractStaticSound> {
        const sound = new WebAudioStaticSound(name, this, options);
        await sound.init(options);
        this._addSound(sound);
        return sound;
    }

    /**
     * Creates a new instance of a static sound.
     * @param source - The source static sound.
     * @returns A promise that resolves to the created static sound instance.
     */
    public async createSoundInstance(source: WebAudioStaticSound): Promise<WebAudioStaticSoundInstance> {
        const soundInstance = new WebAudioStaticSoundInstance(source);
        await soundInstance.init();
        this._addSoundInstance(soundInstance);
        return soundInstance;
    }

    /**
     * Creates a new streaming sound.
     * @param name - The name of the sound.
     * @param options - The options for the streaming sound.
     * @returns A promise that resolves to the created streaming sound.
     */
    public async createStreamingSound(name: string, options: Nullable<StreamingSoundOptions> = null): Promise<AbstractStreamingSound> {
        const sound = new WebAudioStreamingSound(name, this, options);
        await sound.init(options);
        this._addSound(sound);
        return sound;
    }

    /**
     * Creates a new instance of a streaming sound.
     * @param source - The source streaming sound.
     * @returns A promise that resolves to the created streaming sound instance.
     */
    public async createStreamingSoundInstance(source: WebAudioStreamingSound): Promise<WebAudioStreamingSoundInstance> {
        const soundInstance = new WebAudioStreamingSoundInstance(source);
        await soundInstance.init();
        this._addSoundInstance(soundInstance);
        return soundInstance;
    }
}

/** @internal */
export class WebAudioEngine extends AbstractWebAudioEngine {
    /** @internal */
    public override get defaultDevice(): WebAudioDevice {
        return super.defaultDevice as WebAudioDevice;
    }

    /** @internal */
    public async init(options: Nullable<WebAudioEngineOptions> = null): Promise<void> {
        if (!options?.noDefaultDevice) {
            await this.createDevice("default", { audioContext: options?.audioContext });

            if (!options?.noDefaultMainBus) {
                await this.createMainBus("default");
                this.defaultMainBus.device = this.defaultDevice;
            }
        }
    }
}
