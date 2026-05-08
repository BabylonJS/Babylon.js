/** This file must only contain pure code and pure imports */

import { AddAnimationExtensions } from "./animatable.core";
import { Bone } from "../Bones/bone.pure";
import { Scene } from "core/scene.pure";

export * from "./animatable.core";

let _Registered = false;
/**
 * Register side effects for animatable.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAnimatable(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    // Connect everything!
    AddAnimationExtensions(Scene, Bone);
}
