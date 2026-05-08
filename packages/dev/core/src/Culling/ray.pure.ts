/** This file must only contain pure code and pure imports */

import { Nullable } from "../types";
import { Matrix } from "../Maths/math.vector.pure";
import { PickingInfo } from "../Collisions/pickingInfo";
import { Scene } from "../scene.pure";
import { Camera } from "../Cameras/camera.pure";
import {
    MeshPredicate,
    TrianglePickingPredicate,
    Ray,
    AddRayExtensions,
    CreatePickingRayInCameraSpace,
    CreatePickingRayInCameraSpaceToRef,
    CreatePickingRayToRef,
    MultiPick,
    MultiPickWithRay,
    Pick,
    PickWithBoundingInfo,
    PickWithRay,
} from "./ray.core";

export * from "./ray.core";

export {};

let _Registered = false;
/**
 * Register side effects for ray.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterRay(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    // Picking
    AddRayExtensions(Scene, Camera);

    Scene.prototype.createPickingRayToRef = function (
        x: number,
        y: number,
        world: Nullable<Matrix>,
        result: Ray,
        camera: Nullable<Camera>,
        cameraViewSpace = false,
        enableDistantPicking = false
    ): Scene {
        return CreatePickingRayToRef(this, x, y, world, result, camera, cameraViewSpace, enableDistantPicking);
    };

    Scene.prototype.createPickingRayInCameraSpace = function (x: number, y: number, camera?: Camera): Ray {
        return CreatePickingRayInCameraSpace(this, x, y, camera);
    };

    Scene.prototype.createPickingRayInCameraSpaceToRef = function (x: number, y: number, result: Ray, camera?: Camera): Scene {
        return CreatePickingRayInCameraSpaceToRef(this, x, y, result, camera);
    };

    Scene.prototype.pickWithBoundingInfo = function (x: number, y: number, predicate?: MeshPredicate, fastCheck?: boolean, camera?: Nullable<Camera>): Nullable<PickingInfo> {
        return PickWithBoundingInfo(this, x, y, predicate, fastCheck, camera);
    };

    Scene.prototype.pick = function (
        x: number,
        y: number,
        predicate?: MeshPredicate,
        fastCheck?: boolean,
        camera?: Nullable<Camera>,
        trianglePredicate?: TrianglePickingPredicate,
        _enableDistantPicking = false
    ): PickingInfo {
        return Pick(this, x, y, predicate, fastCheck, camera, trianglePredicate, _enableDistantPicking);
    };

    Scene.prototype.pickWithRay = function (ray: Ray, predicate?: MeshPredicate, fastCheck?: boolean, trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo> {
        return PickWithRay(this, ray, predicate, fastCheck, trianglePredicate);
    };

    Scene.prototype.multiPick = function (x: number, y: number, predicate?: MeshPredicate, camera?: Camera, trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo[]> {
        return MultiPick(this, x, y, predicate, camera, trianglePredicate);
    };

    Scene.prototype.multiPickWithRay = function (ray: Ray, predicate?: MeshPredicate, trianglePredicate?: TrianglePickingPredicate): Nullable<PickingInfo[]> {
        return MultiPickWithRay(this, ray, predicate, trianglePredicate);
    };
}
