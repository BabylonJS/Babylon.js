import { type Nullable, type AbstractEngine, type EffectWrapperCreationOptions, type Vector2 } from "core/index";
import { ThinBlurPostProcess } from "./thinBlurPostProcess";

/**
 * @internal
 */
export class ThinDepthOfFieldBlurPostProcess extends ThinBlurPostProcess {
    constructor(name: string, engine: Nullable<AbstractEngine> = null, direction: Vector2, kernel: number, options?: EffectWrapperCreationOptions) {
        super(name, engine, direction, kernel, {
            ...options,
            defines: `#define DOF 1\n`,
        });
    }
}
