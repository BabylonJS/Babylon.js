import { Camera } from "core/Cameras/camera.pure";
import { FreeCamera } from "core/Cameras/freeCamera.pure";
import { Color3 } from "core/Maths/math.color.pure";
import { Vector3 } from "core/Maths/math.vector.pure";
import { DirectionalLight } from "core/Lights/directionalLight.pure";
import { HemisphericLight } from "core/Lights/hemisphericLight.pure";
import { type Light } from "core/Lights/light";
import { PointLight } from "core/Lights/pointLight.pure";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { type IResolvedCamera, type IResolvedLight } from "../resolution/resolvedStage";

const UsdCameraApertureUnitToSceneUnit = 1 / 10;

/**
 * Creates a Babylon light from a resolved UsdLux light payload.
 *
 * The returned light is intentionally created in neutral local space because the USD prim walk
 * applies the prim transform to the parent node that owns this light: directional and dome lights
 * use a local direction, and positional/area approximations sit at the local origin. USD physical
 * intensity units do not map 1:1 to Babylon's default light scale, so this POC applies the resolved
 * USD exposure formula directly as `intensity * 2^exposure` and leaves physical calibration for a
 * later pass. Rect, disk, and cylinder lights are approximated as point lights because this adapter
 * is limited to Babylon core light types. Dome textures are not applied to `scene.environmentTexture`
 * here because that would mutate scene-global lighting outside the imported prim.
 *
 * @param light the resolved UsdLux light payload
 * @param name the name to assign to the Babylon light
 * @param scene the scene to create the light in
 * @returns the closest Babylon light representation, or null if a future light kind cannot be represented
 */
export function CreateLightFromResolved(light: IResolvedLight, name: string, scene: Scene): Nullable<Light> {
    let babylonLight: Light;

    switch (light.kind) {
        case "distant": {
            const directionalLight = new DirectionalLight(name, new Vector3(0, 0, -1), scene);
            directionalLight.position.setAll(0);
            babylonLight = directionalLight;
            break;
        }
        case "dome": {
            babylonLight = new HemisphericLight(name, new Vector3(0, 1, 0), scene);
            break;
        }
        case "sphere": {
            const pointLight = new PointLight(name, Vector3.Zero(), scene);
            ApplyResolvedRadius(pointLight, light.radius);
            babylonLight = pointLight;
            break;
        }
        case "disk":
        case "cylinder": {
            const pointLight = new PointLight(name, Vector3.Zero(), scene);
            ApplyResolvedRadius(pointLight, light.radius);
            babylonLight = pointLight;
            break;
        }
        case "rect": {
            const pointLight = new PointLight(name, Vector3.Zero(), scene);
            ApplyResolvedRadius(pointLight, GetRectRadiusApproximation(light.width, light.height));
            babylonLight = pointLight;
            break;
        }
        default:
            return null;
    }

    const color = new Color3(light.color[0], light.color[1], light.color[2]);
    babylonLight.diffuse = color;
    babylonLight.specular = color.clone();
    babylonLight.intensity = light.intensity * 2 ** light.exposure;

    return babylonLight;
}

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

function ApplyResolvedRadius(light: Light, radius: number | undefined): void {
    if (radius !== undefined) {
        light.radius = radius;
    }
}

function GetRectRadiusApproximation(width: number | undefined, height: number | undefined): number | undefined {
    if (width === undefined || height === undefined) {
        return undefined;
    }

    return Math.sqrt(width * width + height * height) / 2;
}
