import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine.js";
import type * as baseTypes from "./engine.base.js";
import type * as webGLTypes from "./engine.webgl.js";
import type * as webGPUTypes from "./engine.webgpu.js";

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

// export function generateInternalTextureThinEngineAdapter(
//     engineState: IBaseEnginePublic,
//     optionalFunctions: {
//         updateTextureDimensions?: (engineState: IBaseEnginePublic, texture: InternalTexture, width: number, height: number, depth?: number) => void;
//         createTexture?: (
//             engineState: IBaseEnginePublic,
//             url: string,
//             noMipmap: boolean,
//             invertY: boolean,
//             scene: Nullable<Scene>,
//             samplingMode: number,
//             onLoad: Nullable<() => void>,
//             onError: Nullable<(message?: string, exception?: any) => void>,
//             buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap>,
//             fallBack?: InternalTexture,
//             format?: number,
//             forcedExtension?: any,
//             mimeType?: string
//         ) => InternalTexture;
//         createRawTexture?: (
//             engineState: IBaseEnginePublic,
//             data: ArrayBufferView,
//             width: number,
//             height: number,
//             format: number,
//             generateMipMaps: boolean,
//             invertY: boolean,
//             samplingMode: number,
//             type: number,
//             compression?: Nullable<string>,
//             textureType?: number
//         ) => InternalTexture;
//         createRawTexture3D?: (
//             engineState: IBaseEnginePublic,
//             data: ArrayBufferView,
//             width: number,
//             height: number,
//             depth: number,
//             format: number,
//             generateMipMaps: boolean,
//             invertY: boolean,
//             samplingMode: number,
//             type: number,
//             compression?: Nullable<string>
//         ) => InternalTexture;
//         createRawTexture2DArray?: (
//             engineState: IBaseEnginePublic,
//             data: ArrayBufferView,
//             width: number,
//             height: number,
//             depth: number,
//             format: number,
//             generateMipMaps: boolean,
//             invertY: boolean,
//             samplingMode: number,
//             type: number,
//             compression?: Nullable<string>
//         ) => InternalTexture;
//         createDynamicTexture?: (
//             engineState: IBaseEnginePublic,
//             width: number,
//             height: number,
//             generateMipMaps: boolean,
//             samplingMode: number,
//             type: number,
//             format?: number
//         ) => InternalTexture;
//         updateDynamicTexture?: (
//             engineState: IBaseEnginePublic,
//             texture: Nullable<InternalTexture>,
//             canvas: HTMLCanvasElement,
//             invertY: boolean,
//             premulAlpha: boolean,
//             format?: number,
//             forceBindTexture?: boolean,
//             invertRed?: boolean
//         ) => void;
//         createCubeTexture?: (
//             engineState: IBaseEnginePublic,
//             rootUrl: string,
//             scene: Nullable<Scene>,
//             files: Nullable<string[]>,
//             noMipmap?: boolean,
//             onLoad?: Nullable<() => void>,
//             onError?: Nullable<(message?: string, exception?: any) => void>,
//             format?: number,
//             forcedExtension?: any,
//             createPolynomials?: boolean,
//             lodScale?: number,
//             lodOffset?: number,
//             fallback?: Nullable<InternalTexture>,
//             loaderOptions?: any
//         ) => InternalTexture;
//         createRawCubeTexture?: (
//             engineState: IBaseEnginePublic,
//             url: string,
//             scene: Nullable<Scene>,
//             size: number,
//             format: number,
//             type: number,
//             noMipmap: boolean,
//             callback: (ArrayBuffer: ArrayBuffer) => ArrayBufferView[],
//             mipmmapGenerator: Nullable<(faces: ArrayBufferView[]) => ArrayBufferView[][]>,
//             onLoad: Nullable<() => void>,
//             onError: Nullable<(message?: string, exception?: any) => void>,
//             samplingMode?: number
//         ) => InternalTexture;
//         // createPrefilteredCubeTexture?: (
//         //     rootUrl: string,
//         //     scene: Nullable<Scene>,
//         //     lodScale: number,
//         //     lodOffset: number,
//         //     onLoad: Nullable<() => void>,
//         //     onError: Nullable<(message?: string, exception?: any) => void>,
//         //     format?: number,
//         //     forcedExtension?: any,
//         //     createPolynomials?: boolean,
//         //     lodGenerationOffset?: number,
//         //     fallback?: Nullable<InternalTexture>,
//         //     loaderOptions?: any
//         // ) => InternalTexture;
//         getRenderingCanvas?: (engineState: IBaseEnginePublic) => Nullable<HTMLCanvasElement>;
//         getLoadedTexturesCache?: (engineState: IBaseEnginePublic) => { [key: string]: InternalTexture };
//         _releaseTexture?: (engineState: IBaseEnginePublic, texture: InternalTexture) => void;
//     },
//     force?: boolean
// ): ThinEngine {
//     const engineAdapter = engineAdaptersMap.get(engineState) || (Object.defineProperties({}, Object.getOwnPropertyDescriptors(engineState)) as ThinEngine);

//     Object.keys(optionalFunctions).forEach((key) => {
//         const optionalFunction = optionalFunctions[key as keyof typeof optionalFunctions];
//         if (optionalFunction && (force || !engineAdapter[key as keyof typeof optionalFunctions])) {
//             engineAdapter[key as keyof typeof optionalFunctions] = optionalFunction.bind(null, engineState);
//         }
//     });

//     engineAdaptersMap.set(engineState, engineAdapter);
//     return engineAdapter;
// }
