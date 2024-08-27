/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioDevice } from "./abstractAudioDevice";
import type { AbstractAudioListener } from "./abstractAudioListener";
import type { AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractAudioPositioner } from "./abstractAudioPositioner";
import type { AbstractAudioSender } from "./abstractAudioSender";
import type { AbstractMainAudioBus } from "./abstractMainAudioBus";
import type { AbstractStaticSoundInstance } from "./abstractStaticSoundInstance";
import type { AbstractStaticSoundSource } from "./abstractStaticSoundSource";
import type { AbstractStreamingSoundInstance } from "./abstractStreamingSoundInstance";
import type { AbstractStreamingSoundSource } from "./abstractStreamingSoundSource";
import type { IAudioNodeParent } from "./IAudioNodeParent";

export abstract class AbstractAudioEngine implements IAudioNodeParent {
    public dispose(): void {
        for (const node of this._childNodes) {
            node.dispose();
        }
        this._childNodes.length = 0;
    }

    private _childNodes = new Array<AbstractAudioNode>();

    public _addChildNode(node: AbstractAudioNode): void {
        if (this._childNodes.includes(node)) {
            return;
        }

        this._childNodes.push(node);
    }

    public _removeChildNode(node: AbstractAudioNode): void {
        const index = this._childNodes.indexOf(node);
        if (index < 0) {
            return;
        }

        this._childNodes.splice(index, 1);
    }

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

    public abstract createDevice(name: string): AbstractAudioDevice;
    public abstract createListener(parent: AbstractAudioDevice): AbstractAudioListener;
    public abstract createMainBus(name: string): AbstractMainAudioBus;
    public abstract createPositioner(parent: AbstractAudioNode): AbstractAudioPositioner;
    public abstract createSender(parent: AbstractAudioNode): AbstractAudioSender;
    public abstract createStaticSoundInstance(source: AbstractStaticSoundSource): AbstractStaticSoundInstance;
    public abstract createStreamingSoundInstance(source: AbstractStreamingSoundSource): AbstractStreamingSoundInstance;
}
