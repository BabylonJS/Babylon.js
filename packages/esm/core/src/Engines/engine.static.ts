/* eslint-disable @typescript-eslint/naming-convention */
import { Effect } from "core/Materials/effect";
import type { IInternalTextureLoader } from "core/Materials/Textures/internalTextureLoader";
import { IsWindowObjectExist } from "./runtimeEnvironment";

// used to be WebGL only, a single array
export const ExceptionList = {
    webgl: [
        { key: "Chrome/63.0", capture: "63\\.0\\.3239\\.(\\d+)", captureConstraint: 108, targets: ["uniformBuffer"] },
        { key: "Firefox/58", capture: null, captureConstraint: null, targets: ["uniformBuffer"] },
        { key: "Firefox/59", capture: null, captureConstraint: null, targets: ["uniformBuffer"] },
        { key: "Chrome/72.+?Mobile", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Chrome/73.+?Mobile", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Chrome/74.+?Mobile", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Mac OS.+Chrome/71", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Mac OS.+Chrome/72", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Mac OS.+Chrome", capture: null, captureConstraint: null, targets: ["uniformBuffer"] },
        // desktop osx safari 15.4
        { key: ".*AppleWebKit.*(15.4).*Safari", capture: null, captureConstraint: null, targets: ["antialias", "maxMSAASamples"] },
        // mobile browsers using safari 15.4 on ios
        { key: ".*(15.4).*AppleWebKit.*Safari", capture: null, captureConstraint: null, targets: ["antialias", "maxMSAASamples"] },
    ],
};

// elements added to this array will persist between imports
export const _TextureLoaders: IInternalTextureLoader[] = [];

export const NpmPackage = "@babylonjs/esm@6.12.4";
export const Version = "6.12.4";

export const CollisionEpsilon = 0.001;

// A string cannot be modified when imported from an es6 module. It needs a mutating function
export let ShadersRepository = Effect.ShadersRepository;

/**
 * Sets the shader repository path to use
 * @param path the path to load shaders from
 */
export function SetShadersRepository(path: string): void {
    Effect.ShadersRepository = path;
    ShadersRepository = Effect.ShadersRepository;
}

/**
 * Queue a new function into the requested animation frame pool (ie. this function will be executed by the browser (or the javascript engine) for the next frame)
 * @param func - the function to be called
 * @param requester - the object that will request the next frame. Falls back to window.
 * @returns frame number
 */
export function QueueNewFrame(func: FrameRequestCallback, requester?: any): number {
    // Note that there is kind of a typing issue here, as `setTimeout` might return something else than a number (NodeJs returns a NodeJS.Timeout object).
    // Also if the global `requestAnimationFrame`'s returnType is number, `requester.requestPostAnimationFrame` and `requester.requestAnimationFrame` types
    // are `any`.

    if (!IsWindowObjectExist()) {
        if (typeof requestAnimationFrame === "function") {
            return requestAnimationFrame(func);
        }
    } else {
        const { requestAnimationFrame } = requester || window;
        if (typeof requestAnimationFrame === "function") {
            return requestAnimationFrame(func);
        }
    }

    // fallback to the global `setTimeout`.
    // In most cases (aka in the browser), `window` is the global object, so instead of calling `window.setTimeout` we could call the global `setTimeout`.
    return setTimeout(func, 16) as unknown as number;
}

// TODO is this needed? this will allow `import Statics from "package/Engines"`.
export default { NpmPackage, Version, CollisionEpsilon, ShadersRepository, _TextureLoaders, SetShadersRepository, ExceptionList };
