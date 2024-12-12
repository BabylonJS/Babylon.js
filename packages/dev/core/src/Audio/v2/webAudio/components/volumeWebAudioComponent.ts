import type { Nullable } from "../../../../types";
import type { IVolumeAudioOptions } from "../../components/volumeAudioComponent";
import { VolumeAudioComponent } from "../../components/volumeAudioComponent";
import type { IWebAudioComponentOwner } from "../webAudioComponentOwner";

/** @internal */
export async function _CreateVolumeAudioComponentAsync(owner: IWebAudioComponentOwner, options: Nullable<IVolumeAudioOptions> = null): Promise<_VolumeWebAudioComponent> {
    return new _VolumeWebAudioComponent(owner, options);
}

/** @internal */
export class _VolumeWebAudioComponent extends VolumeAudioComponent {
    /** @internal */
    public readonly node: GainNode;

    /** @internal */
    public constructor(owner: IWebAudioComponentOwner, options: Nullable<IVolumeAudioOptions> = null) {
        super(owner);

        this.node = new GainNode(owner.audioContext);
        this.node.gain.value = options?.volume ?? 1;
    }

    /** @internal */
    public get volume(): number {
        return this.node.gain.value;
    }

    /** @internal */
    public set volume(value: number) {
        this.node.gain.value = value;
    }

    /** @internal */
    public getClassName(): string {
        return "VolumeWebAudioComponent";
    }
}
