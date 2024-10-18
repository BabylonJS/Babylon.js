// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, ThinPostProcessOptions, Vector2 } from "core/index";
import { ThinBlurPostProcess } from "./thinBlurPostProcess";

/**
 * @internal
 */
export class ThinDepthOfFieldBlurPostProcess extends ThinBlurPostProcess {
    constructor(name: string, engine: Nullable<AbstractEngine> = null, direction: Vector2, kernel: number, options?: ThinPostProcessOptions) {
        super(name, engine, direction, kernel, {
            ...options,
            defines: `#define DOF 1\n`,
        });
    }
}
