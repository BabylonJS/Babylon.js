import type { _AbstractAudioSubGraph } from "../../abstractAudio/subNodes/abstractAudioSubGraph";
import { _SpatialAudio } from "../../abstractAudio/subProperties/spatialAudio";
import { _SpatialWebAudioUpdaterComponent } from "../components/spatialWebAudioUpdaterComponent";

/** @internal */
export class _SpatialWebAudio extends _SpatialAudio {
    private _updaterComponent: _SpatialWebAudioUpdaterComponent;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph, autoUpdate: boolean, minUpdateTime: number) {
        super(subGraph);

        this._updaterComponent = new _SpatialWebAudioUpdaterComponent(this, autoUpdate, minUpdateTime);
    }

    /** @internal */
    public get minUpdateTime(): number {
        return this._updaterComponent.minUpdateTime;
    }

    /** @internal */
    public set minUpdateTime(value: number) {
        this._updaterComponent.minUpdateTime = value;
    }

    /** @internal */
    public dispose(): void {
        this._updaterComponent.dispose();
        this._updaterComponent = null!;
    }
}
