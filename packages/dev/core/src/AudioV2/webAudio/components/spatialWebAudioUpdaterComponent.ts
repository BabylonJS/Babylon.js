import { PrecisionDate } from "../../../Misc/precisionDate";

/** @internal */
export class _SpatialWebAudioUpdaterComponent {
    private _autoUpdate = true;
    private _lastUpdateTime: number = 0;

    /**
     * The minimum time in seconds between spatial audio updates. Defaults to `0`.
     * @internal
     */
    public minUpdateTime = 0;

    /** @internal */
    public constructor(parent: { update: () => void }, autoUpdate: boolean, minUpdateTime: number) {
        if (!autoUpdate) {
            return;
        }

        this.minUpdateTime = minUpdateTime;

        const update = () => {
            if (!this._autoUpdate) {
                return;
            }

            let skipUpdate = false;

            if (0 < this.minUpdateTime) {
                const now = PrecisionDate.Now;
                if (this._lastUpdateTime && now - this._lastUpdateTime < this.minUpdateTime * 1000) {
                    skipUpdate = true;
                }
                this._lastUpdateTime = now;
            }

            if (!skipUpdate) {
                parent.update();
            }

            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }

    /** @internal */
    public dispose(): void {
        this._autoUpdate = false;
    }
}
