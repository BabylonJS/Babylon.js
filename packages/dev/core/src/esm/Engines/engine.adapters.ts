/**
 * Generate adapters from existing engine state object.
 * Adapters can be used to simulate a real engine object.
 */

import type { ThinEngine } from "core/Engines/thinEngine";
import type * as baseTypes from "./engine.base";
import type * as webGLTypes from "./WebGL/engine.webgl";
import type * as webGPUTypes from "./WebGPU/engine.webgpu";
import type * as toolsTypes from "./engine.tools";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import type { Engine } from "core/Engines/engine";

type PickMatching<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type ExtractMethods<T> = PickMatching<T, Function>;

type EngineMethods<T = EngineType> = ExtractMethods<T>;
type BaseThinEngineUnionMethods<T = EngineType> = PickMatching<EngineMethods<T>, EngineMethodsType<T>>;

type EngineToolsMethods = ExtractMethods<typeof toolsTypes>;
export type BaseEngineMethods = ExtractMethods<typeof baseTypes> & EngineToolsMethods;
export type WebGLEngineMethods = ExtractMethods<typeof webGLTypes> & BaseEngineMethods;
export type WebGPUEngineMethods = ExtractMethods<typeof webGPUTypes> & BaseEngineMethods;

export type EngineType = ThinEngine | Engine | WebGPUEngine;
type EngineMethodsType<T = EngineType> = T extends WebGPUEngine ? WebGPUEngineMethods : T extends Engine ? WebGLEngineMethods : BaseEngineMethods;
export type EngineBaseType<T = EngineType> = T extends WebGPUEngine
    ? webGPUTypes.IWebGPUEnginePublic
    : T extends Engine
      ? webGLTypes.IWebGLEnginePublic
      : webGLTypes.IWebGLEnginePublic; // was IBase, but since ThinEngine is WebGL-based, i leave it as is for now
/**
 * Augment an engineState object with methods to simulate a real engine object
 *
 * @param engineState the engineState object to augment
 * @param injectedMethods The methods that will be injected to the engineState
 * @param force Should we force re-injecting the methods
 * @returns The engineState cased to the requested engine type
 */
export function augmentEngineState<T = ThinEngine | Engine | WebGPUEngine>(engineState: EngineBaseType<T>, injectedMethods?: Partial<EngineMethodsType<T>>, force?: boolean): T {
    if (injectedMethods) {
        Object.keys(injectedMethods).forEach((key) => {
            const injectedMethod = injectedMethods[key as keyof typeof injectedMethods];
            if (typeof injectedMethod === "function") {
                const functionName: keyof BaseThinEngineUnionMethods<T> = key as keyof BaseThinEngineUnionMethods<T>;
                if (force || !(engineState as unknown as T)[functionName as keyof BaseThinEngineUnionMethods<T>]) {
                    (engineState as unknown as T)[functionName] = ((...args: any) => injectedMethod(engineState, ...args)) as T[keyof PickMatching<
                        PickMatching<T, Function>,
                        EngineMethodsType<T>
                    >];
                }
            }
        });
    }
    return engineState as unknown as T;
}
