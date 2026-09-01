import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { type Camera } from "core/Cameras/camera";
import { type Scene } from "core/scene";

import "core/Culling/ray";

interface ICameraWithMovementKeys extends Camera {
    speed: number;
    keysUp: number[];
    keysDown: number[];
    keysLeft: number[];
    keysRight: number[];
}

const CameraControlDistances = new WeakMap<Camera, number>();

function HasMovementKeys(camera: Camera): camera is ICameraWithMovementKeys {
    const cameraWithMovementKeys = camera as Partial<ICameraWithMovementKeys>;
    return (
        typeof cameraWithMovementKeys.speed === "number" &&
        Array.isArray(cameraWithMovementKeys.keysUp) &&
        Array.isArray(cameraWithMovementKeys.keysDown) &&
        Array.isArray(cameraWithMovementKeys.keysLeft) &&
        Array.isArray(cameraWithMovementKeys.keysRight)
    );
}

function AddKey(keys: number[], key: number): void {
    if (!keys.includes(key)) {
        keys.push(key);
    }
}

function GetSceneControlDistance(scene: Scene): number | undefined {
    const worldExtends = scene.getWorldExtends((mesh) => mesh.isVisible && mesh.isEnabled() && !mesh.infiniteDistance);
    const distance = worldExtends.max.subtract(worldExtends.min).length() * 1.5;
    return Number.isFinite(distance) && distance > 0 ? distance : undefined;
}

function GetCameraControlDistance(scene: Scene, camera: Camera): number | undefined {
    const sceneDistance = GetSceneControlDistance(scene);
    if (sceneDistance === undefined) {
        return undefined;
    }

    const rayLength = Number.isFinite(camera.maxZ) && camera.maxZ > 0 ? Math.max(sceneDistance, camera.maxZ) : sceneDistance;
    const pick = scene.pickWithRay(
        camera.getForwardRay(rayLength, camera.getWorldMatrix(), camera.globalPosition),
        (mesh) => mesh.isPickable && mesh.isVisible && mesh.isEnabled() && !mesh.infiniteDistance
    );
    const pickedDistance = pick?.hit && Number.isFinite(pick.distance) && pick.distance > 0 ? Math.max(pick.distance, camera.minZ) : sceneDistance;
    return Math.min(sceneDistance, pickedDistance);
}

/**
 * Configures the Sandbox navigation controls for a camera when it becomes active.
 * @param scene The scene containing the camera.
 * @param camera The camera to configure.
 */
export function ConfigureCameraControls(scene: Scene, camera: Camera): void {
    const controlDistance = GetCameraControlDistance(scene, camera);
    if (controlDistance !== undefined) {
        CameraControlDistances.set(camera, controlDistance);
    }

    if (HasMovementKeys(camera)) {
        if (controlDistance !== undefined) {
            camera.speed = controlDistance * 0.2;
        }
        AddKey(camera.keysUp, 90); // Z
        AddKey(camera.keysUp, 87); // W
        AddKey(camera.keysDown, 83); // S
        AddKey(camera.keysLeft, 65); // A
        AddKey(camera.keysLeft, 81); // Q
        AddKey(camera.keysRight, 69); // E
        AddKey(camera.keysRight, 68); // D
    }
}

/**
 * Updates controls whose sensitivity follows an ArcRotateCamera as it zooms.
 * @param camera The active camera.
 */
export function UpdateCameraControls(camera: Camera): void {
    if (!(camera instanceof ArcRotateCamera)) {
        return;
    }

    const controlDistance = Math.max(camera.minZ, Math.min(camera.radius, CameraControlDistances.get(camera) ?? camera.radius));
    camera.panningSensibility = 5000 / controlDistance;
    camera.speed = controlDistance * 0.2;
}

/**
 * Activates a camera for Sandbox navigation.
 * @param scene The scene containing the camera.
 * @param camera The camera to activate.
 */
export function ActivateCamera(scene: Scene, camera: Camera): void {
    scene.activeCamera?.detachControl();
    scene.activeCamera = camera;
    camera.attachControl();
}
