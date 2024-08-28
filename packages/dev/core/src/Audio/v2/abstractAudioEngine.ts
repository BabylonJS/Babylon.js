/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioDevice } from "./abstractAudioDevice";
import type { AbstractAudioListener } from "./abstractAudioListener";
import type { AbstractAudioNode } from "./abstractAudioNode";
import { AbstractAudioNodeParent } from "./abstractAudioNodeParent";
import type { AbstractAudioPositioner } from "./abstractAudioPositioner";
import type { AbstractAudioSender } from "./abstractAudioSender";
import type { AbstractMainAudioBus } from "./abstractMainAudioBus";
import type { AbstractSoundSource } from "./abstractSoundSource";
import type { AbstractStaticSoundInstance } from "./abstractStaticSoundInstance";
import type { AbstractStaticSoundSource } from "./abstractStaticSoundSource";
import type { AbstractStreamingSoundInstance } from "./abstractStreamingSoundInstance";
import type { AbstractStreamingSoundSource } from "./abstractStreamingSoundSource";

/**
 * Owns top-level AbstractAudioNode objects.
 * Owns all AbstractSoundSource objects.
 */
export abstract class AbstractAudioEngine extends AbstractAudioNodeParent {
    public override dispose(): void {
        this._soundInstances.length = 0;

        for (const source of this._soundSources) {
            source.dispose();
        }
        this._soundSources.length = 0;

        super.dispose();
    }

    // NB: Does not indicate ownership, but all its items should be in the child nodes array, too, which does indicate
    // ownership.
    private _soundInstances = new Array<AbstractStaticSoundInstance>();

    public _addSoundInstance(instance: AbstractStaticSoundInstance): void {
        if (this._soundInstances.includes(instance)) {
            return;
        }

        this._soundInstances.push(instance);
    }

    public _removeSoundInstance(instance: AbstractStaticSoundInstance): void {
        const index = this._soundInstances.indexOf(instance);
        if (index < 0) {
            return;
        }

        this._soundInstances.splice(index, 1);
    }

    private _soundSources = new Array<AbstractSoundSource>();

    public _addSoundSource(soundSource: AbstractSoundSource): void {
        if (this._soundSources.includes(soundSource)) {
            return;
        }

        this._soundSources.push(soundSource);
    }

    public _removeSoundSource(soundSource: AbstractSoundSource): void {
        const index = this._soundSources.indexOf(soundSource);
        if (index < 0) {
            return;
        }

        this._soundSources.splice(index, 1);
    }

    public abstract createDevice(name: string): AbstractAudioDevice;
    public abstract createListener(parent: AbstractAudioDevice): AbstractAudioListener;
    public abstract createMainBus(name: string): AbstractMainAudioBus;
    public abstract createPositioner(parent: AbstractAudioNode): AbstractAudioPositioner;
    public abstract createSender(parent: AbstractAudioNode): AbstractAudioSender;
    public abstract createStaticSoundInstance(source: AbstractStaticSoundSource, inputNode: AbstractAudioNode): AbstractStaticSoundInstance;
    public abstract createStreamingSoundInstance(source: AbstractStreamingSoundSource, inputNode: AbstractAudioNode): AbstractStreamingSoundInstance;
}
