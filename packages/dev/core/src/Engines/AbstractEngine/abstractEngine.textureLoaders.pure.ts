/** This file must only contain pure code and pure imports */

import { _GetCompatibleTextureLoader } from "../../Materials/Textures/Loaders/textureLoaderManager";
import { AbstractEngine } from "../abstractEngine.pure";

let _Registered = false;

/**
 * Registers the texture loader implementation on AbstractEngine.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAbstractEngineTextureLoaders(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    AbstractEngine.GetCompatibleTextureLoader = _GetCompatibleTextureLoader;
}
