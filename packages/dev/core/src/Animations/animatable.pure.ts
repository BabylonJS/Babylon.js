/** This file must only contain pure code and pure imports */

import { AddAnimationExtensions } from "./animatable.core";
import { Bone } from "../Bones/bone.pure";
import { Scene } from "core/scene.pure";

export * from "./animatable.core";

let _registered = false;
export function registerAnimatable(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    // Connect everything!
    AddAnimationExtensions(Scene, Bone);
}
