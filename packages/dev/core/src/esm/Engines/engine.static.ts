/* eslint-disable @typescript-eslint/naming-convention */
import { Effect } from "core/Materials/effect";
import type { IInternalTextureLoader } from "core/Materials/Textures/internalTextureLoader";

export const ExceptionList = [
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
];

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

// TODO is this needed? this will allow `import Statics from "package/Engines"`.
export default { NpmPackage, Version, CollisionEpsilon, ShadersRepository, _TextureLoaders, SetShadersRepository, ExceptionList };
