/**
 * Generate adapters from existing engine state object.
 * Adapters can be used to simulate a real engine object.
 */

import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine.js";
import type * as baseTypes from "./engine.base.js";
import type * as webGLTypes from "./WebGL/engine.webgl.js";
import type * as webGPUTypes from "./WebGPU/engine.webgpu.js";

type PickMatching<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type ExtractMethods<T> = PickMatching<T, Function>;

type EngineMethods<T extends ThinEngine> = ExtractMethods<T>;
type BaseThinEngineUnionMethods<T extends ThinEngine, E> = PickMatching<EngineMethods<T>, E>;

export type BaseEngineMethods = ExtractMethods<typeof baseTypes>;
export type WebGLEngineMethods = ExtractMethods<typeof webGLTypes>;
export type WebGPUEngineMethods = ExtractMethods<typeof webGPUTypes>;

/**
 * Augment an engineState object with methods to simulate a real engine object
 *
 * @param engineState the engineState object to augment
 * @param injectedMethods The methods that will be injected to the engineState
 * @param force Should we force re-injecting the methods
 * @returns The engineState cased to the requested engine type
 */
export function augmentEngineState<T extends ThinEngine, E = BaseEngineMethods | WebGLEngineMethods | WebGPUEngineMethods>(
    engineState: baseTypes.IBaseEnginePublic,
    injectedMethods?: Partial<E>,
    force?: boolean
): T {
    if (injectedMethods) {
        Object.keys(injectedMethods).forEach((key) => {
            const injectedMethod = injectedMethods[key as keyof typeof injectedMethods];
            if (typeof injectedMethod === "function") {
                const functionName: keyof BaseThinEngineUnionMethods<T, E> = key as keyof BaseThinEngineUnionMethods<T, E>;
                if (force || !(engineState as unknown as T)[functionName as keyof BaseThinEngineUnionMethods<T, E>]) {
                    (engineState as unknown as T)[functionName] = ((...args: any) => injectedMethod(engineState, ...args)) as T[keyof PickMatching<PickMatching<T, Function>, E>];
                }
            }
        });
    }
    return engineState as unknown as T;
}
