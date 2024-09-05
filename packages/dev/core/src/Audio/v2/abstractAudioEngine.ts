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
    // Owned
    private _listeners: Nullable<Set<SpatialAudioListener>> = null;

    // Not owned, but all items should in parent's `children` container, too, which is owned.
    public readonly soundInstances = new Set<AbstractStaticSoundInstance>();

    // Owned
    public readonly soundSources = new Set<AbstractSoundSource>();

    public override dispose(): void {
        this.soundInstances.clear();

        if (this._listeners) {
            for (const listener of this._listeners) {
                listener.dispose();
            }
            this._listeners.clear();
        }

        for (const source of this.soundSources) {
            source.dispose();
        }
        this.soundSources.clear();

        super.dispose();
    }

    public get listeners(): Set<SpatialAudioListener> {
        if (!this._listeners) {
            this._listeners = new Set();
        }

        return this._listeners;
    }

    public abstract createDevice(name: string): AbstractAudioDevice;
    public abstract createMainBus(name: string): AbstractMainAudioBus;
    public abstract createPositioner(parent: AbstractAudioNode): AbstractAudioPositioner;
    public abstract createSender(parent: AbstractAudioNode): AbstractAudioSender;
    public abstract createStaticSoundInstance(source: AbstractStaticSoundSource, inputNode: AbstractAudioNode): AbstractStaticSoundInstance;
    public abstract createStreamingSoundInstance(source: AbstractStreamingSoundSource, inputNode: AbstractAudioNode): AbstractStreamingSoundInstance;
}
