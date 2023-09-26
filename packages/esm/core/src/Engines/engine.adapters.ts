import type { IBaseEnginePublic } from "./engine.base";
import type { ThinEngine } from "core/Engines/thinEngine";
import type * as BaseTypes from "./engine.base";
import type * as WebGLTypes from "./engine.webgl";

type PickMatching<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type ExtractMethods<T> = PickMatching<T, Function>;

type EngineMethods<T extends ThinEngine> = ExtractMethods<T>;
type BaseThinEngineUnionMethods<T extends ThinEngine, E> = PickMatching<EngineMethods<T>, E>;

export type BaseEngineMethods = ExtractMethods<typeof BaseTypes>;
export type WebGLEngineMethods = ExtractMethods<typeof WebGLTypes>;

export function augmentEngineState<T extends ThinEngine, E = BaseEngineMethods | WebGLEngineMethods>(
    engineState: IBaseEnginePublic,
    injectedMethods?: Partial<E>,
    force?: boolean
): T {
    if (injectedMethods) {
        Object.keys(injectedMethods).forEach((key) => {
            const injectedMethod = injectedMethods[key as keyof typeof injectedMethods];
            if (typeof injectedMethod === "function") {
                const functionName: keyof BaseThinEngineUnionMethods<T, E> = key as keyof BaseThinEngineUnionMethods<T, E>;
                if (force || !(engineState as unknown as T)[functionName as keyof BaseThinEngineUnionMethods<T, E>]) {
                    (engineState as unknown as T)[functionName] = injectedMethod.bind(null, engineState);
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
