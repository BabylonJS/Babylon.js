import type { _AbstractAudioSubGraph } from "../../abstractAudio/subNodes/abstractAudioSubGraph";
import { _SpatialAudio } from "../../abstractAudio/subProperties/spatialAudio";

/** @internal */
export class _SpatialWebAudio extends _SpatialAudio {
    private _autoUpdate = false;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph, autoUpdate: boolean) {
        super(subGraph);

        if (!autoUpdate) {
            return;
        }

        this._autoUpdate = true;

        const update = () => {
            if (!this._autoUpdate) {
                return;
            }

            this.update();
            requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
    }

    /** @internal */
    public dispose(): void {
        this._autoUpdate = false;
    }
}
