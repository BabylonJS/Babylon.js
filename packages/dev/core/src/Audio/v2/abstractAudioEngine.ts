/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioDevice } from "./abstractAudioDevice";
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
import type { SpatialAudioListener } from "./spatialAudioListener";
import type { Nullable } from "../../types";

/**
 * Owns top-level AbstractAudioNode objects.
 * Owns all AbstractSoundSource objects.
 */
export abstract class AbstractAudioEngine extends AbstractAudioNodeParent {
    public override dispose(): void {
        this._soundInstances.length = 0;

        if (this._listeners) {
            for (const listener of this._listeners) {
                listener.dispose();
            }
            this._listeners.clear();
        }

        for (const source of this._soundSources) {
            source.dispose();
        }
        this._soundSources.clear();

        super.dispose();
    }

    // Not owned, but all items should be in child nodes array, too, which is owned.
    //
    // TODO: Figure out if a Set would be better here. It would be more efficient for lookups, but we need to be able
    // to sort sound instances by priority as fast as possible when the advanced audio engine is implemented. Is an
    // array faster in that case?
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

    // Owned
    private _soundSources = new Set<AbstractSoundSource>();

    public _addSoundSource(soundSource: AbstractSoundSource): void {
        this._soundSources.add(soundSource);
    }

    public _removeSoundSource(soundSource: AbstractSoundSource): void {
        this._soundSources.delete(soundSource);
    }

    // Owned
    private _listeners: Nullable<Set<SpatialAudioListener>> = null;

    public _addListener(listener: SpatialAudioListener): void {
        if (!this._listeners) {
            this._listeners = new Set();
        }

        this._listeners.add(listener);
    }

    public _removeListener(listener: SpatialAudioListener): void {
        this._listeners?.delete(listener);
    }

    public abstract createDevice(name: string): AbstractAudioDevice;
    public abstract createMainBus(name: string): AbstractMainAudioBus;
    public abstract createPositioner(parent: AbstractAudioNode): AbstractAudioPositioner;
    public abstract createSender(parent: AbstractAudioNode): AbstractAudioSender;
    public abstract createStaticSoundInstance(source: AbstractStaticSoundSource, inputNode: AbstractAudioNode): AbstractStaticSoundInstance;
    public abstract createStreamingSoundInstance(source: AbstractStreamingSoundSource, inputNode: AbstractAudioNode): AbstractStreamingSoundInstance;
}
