import type { Nullable } from "../../types";
import type { AbstractAudioSubNode } from "./abstractAudioSubNode";
import { AudioSubNode } from "./subNodes/audioSubNode";
import type { ISpatialAudioOptions } from "./subNodes/spatialAudioSubNode";
import { hasSpatialAudioOptions } from "./subNodes/spatialAudioSubNode";
import type { IStereoAudioOptions, StereoAudioSubNode } from "./subNodes/stereoAudioSubNode";
import { hasStereoAudioOptions } from "./subNodes/stereoAudioSubNode";
import type { VolumeAudioSubNode } from "./subNodes/volumeAudioSubNode";
import { type IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";

/** @internal */
export interface IAudioSubGraphOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {}

/** @internal */
export abstract class _AbstractAudioSubGraph {
    private _subNodePromises = new Map<string, Promise<AbstractAudioSubNode>>();

    protected async _init(options: Nullable<IAudioSubGraphOptions>): Promise<void> {
        await this._createSubNode(AudioSubNode.Volume, options);

        if (options) {
            if (hasSpatialAudioOptions(options)) {
                await this._createSubNode(AudioSubNode.Spatial, options);
            }
            if (hasStereoAudioOptions(options)) {
                await this._createSubNode(AudioSubNode.Stereo, options);
            }
        }

        this._updateSubNodes();
    }

    /** @internal */
    public get stereoPan(): number {
        return this._getSubNode<StereoAudioSubNode>(AudioSubNode.Stereo)?.pan ?? 0;
    }

    /** @internal */
    public set stereoPan(value: number) {
        this._callOnSubNode<StereoAudioSubNode>(AudioSubNode.Stereo, (node) => {
            node.pan = value;
        });
    }

    /** @internal */
    public get volume(): number {
        return this._getSubNode<VolumeAudioSubNode>(AudioSubNode.Volume)?.volume ?? 1;
    }

    /** @internal */
    public set volume(value: number) {
        this._callOnSubNode<VolumeAudioSubNode>(AudioSubNode.Volume, (node) => {
            node.volume = value;
        });
    }

    protected abstract _createSubNode(name: string, options?: Nullable<IAudioSubGraphOptions>): Nullable<Promise<AbstractAudioSubNode>>;
    protected abstract _disconnectSubNodes(): void;
    protected abstract _getSubNode<T extends AbstractAudioSubNode>(name: string): Nullable<T>;
    protected abstract _hasSubNode(name: string): boolean;

    /**
     * Executes the given callback with the named sub node, creating the sub node if needed.
     *
     * Note that `callback` is executed synchronously if the sub node exists, otherwise it is executed asynchronously.
     *
     * @param name The name of the sub node
     * @param callback The function to call with the named sub node
     */
    protected _callOnSubNode<T extends AbstractAudioSubNode>(name: string, callback: (node: T) => void): void {
        const node = this._getSubNode(name);
        if (node) {
            callback(node as T);
            return;
        }

        let promise = this._subNodePromises.get(name) ?? null;

        if (!promise) {
            promise = this._createSubNode(name);

            if (promise) {
                this._subNodePromises.set(name, promise);
            }
        }

        promise?.then((node) => {
            callback(node as T);
        });
    }

    protected _updateSubNodes(): void {
        this._disconnectSubNodes();

        const stereoSubNode = this._getSubNode(AudioSubNode.Stereo);
        const volumeSubNode = this._getSubNode(AudioSubNode.Volume);

        if (stereoSubNode && volumeSubNode) {
            stereoSubNode.connect(volumeSubNode);
        }
    }
}
