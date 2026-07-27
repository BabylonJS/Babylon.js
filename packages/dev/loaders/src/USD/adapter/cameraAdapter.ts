import { Camera } from "core/Cameras/camera.pure";
import { FreeCamera } from "core/Cameras/freeCamera.pure";
import { Vector3 } from "core/Maths/math.vector.pure";
import { type Scene } from "core/scene";
import { type IResolvedCamera } from "../resolution/resolvedStage";

const UsdCameraApertureUnitToSceneUnit = 1 / 10;

/**
 * Creates a Babylon camera from a resolved UsdGeomCamera payload.
 *
 * The returned camera is placed at the local origin with its default local orientation because the
 * USD prim walk applies world placement through the parent node. Perspective cameras use Babylon's
 * vertical fixed FOV mode and compute vertical FOV as `2 * atan(verticalAperture / (2 * focalLength))`.
 * Orthographic cameras convert USD camera aperture units to scene units and center their bounds on
 * the local camera axis. USD depth-of-field inputs (`fStop` and `focusDistance`) are not mapped here
 * because Babylon core cameras do not expose a direct DoF property; a post-process is outside this
 * adapter's scope.
 *
 * @param camera the resolved UsdGeomCamera payload
 * @param name the name to assign to the Babylon camera
 * @param scene the scene to create the camera in
 * @returns the created Babylon camera
 */
export function CreateCameraFromResolved(camera: IResolvedCamera, name: string, scene: Scene): Camera {
    const babylonCamera = new FreeCamera(name, Vector3.Zero(), scene);

    babylonCamera.minZ = camera.clippingRange[0];
    babylonCamera.maxZ = camera.clippingRange[1];

    if (camera.projection === "orthographic") {
        const halfWidth = (camera.horizontalAperture * UsdCameraApertureUnitToSceneUnit) / 2;
        const halfHeight = (camera.verticalAperture * UsdCameraApertureUnitToSceneUnit) / 2;
        babylonCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        babylonCamera.orthoLeft = -halfWidth;
        babylonCamera.orthoRight = halfWidth;
        babylonCamera.orthoBottom = -halfHeight;
        babylonCamera.orthoTop = halfHeight;
    } else {
        babylonCamera.mode = Camera.PERSPECTIVE_CAMERA;
        babylonCamera.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
        babylonCamera.fov = 2 * Math.atan(camera.verticalAperture / (2 * camera.focalLength));
    }

    return babylonCamera;
}
