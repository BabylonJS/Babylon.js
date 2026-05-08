/** This file must only contain pure code and pure imports */

import { Logger } from "../Misc/logger";
import { type Nullable } from "../types";
import { Vector3 } from "../Maths/math.vector.pure";
import { type Mesh } from "../Meshes/mesh.pure";
import { type BaseTexture } from "../Materials/Textures/baseTexture.pure";
import { Texture } from "../Materials/Textures/texture.pure";
import { StandardMaterial } from "../Materials/standardMaterial.pure";
import { PBRMaterial } from "../Materials/PBR/pbrMaterial.pure";
import { HemisphericLight } from "../Lights/hemisphericLight.pure";
import { FreeCamera } from "../Cameras/freeCamera.pure";
import { ArcRotateCamera } from "../Cameras/arcRotateCamera.pure";
import { type TargetCamera } from "../Cameras/targetCamera.pure";
import { CreateBox } from "../Meshes/Builders/boxBuilder.pure";
import { Scene } from "../scene.pure";
import { type IEnvironmentHelperOptions, EnvironmentHelper } from "./environmentHelper";
import { type VRExperienceHelperOptions, VRExperienceHelper } from "../Cameras/VR/vrExperienceHelper.pure";
import { type WebXRDefaultExperienceOptions, WebXRDefaultExperience } from "../XR/webXRDefaultExperience";

/** @internal */
// eslint-disable-next-line no-var, @typescript-eslint/naming-convention
export var _forceSceneHelpersToBundle = true;

let _Registered = false;
/**
 * Register side effects for sceneHelpers.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterSceneHelpers(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Scene.prototype.createDefaultLight = function (replace = false): void {
        // Dispose existing light in replace mode.
        if (replace) {
            if (this.lights) {
                for (let i = 0; i < this.lights.length; i++) {
                    this.lights[i].dispose();
                }
            }
        }

        // Light
        if (this.lights.length === 0) {
            new HemisphericLight("default light", Vector3.Up(), this);
        }
    };

    Scene.prototype.createDefaultCamera = function (createArcRotateCamera = false, replace = false, attachCameraControls = false): void {
        // Dispose existing camera in replace mode.
        if (replace) {
            if (this.activeCamera) {
                this.activeCamera.dispose();
                this.activeCamera = null;
            }
        }

        // Camera
        if (!this.activeCamera) {
            const worldExtends = this.getWorldExtends((mesh) => mesh.isVisible && mesh.isEnabled());
            const worldSize = worldExtends.max.subtract(worldExtends.min);
            const worldCenter = worldExtends.min.add(worldSize.scale(0.5));

            let camera: TargetCamera;
            let radius = worldSize.length() * 1.5;
            // empty scene scenario!
            if (!isFinite(radius) || radius === 0) {
                radius = 1;
                worldCenter.copyFromFloats(0, 0, 0);
            }
            if (createArcRotateCamera) {
                const arcRotateCamera = new ArcRotateCamera("default camera", -(Math.PI / 2), Math.PI / 2, radius, worldCenter, this);
                arcRotateCamera.lowerRadiusLimit = radius * 0.01;
                arcRotateCamera.wheelPrecision = 100 / radius;
                camera = arcRotateCamera;
            } else {
                const freeCamera = new FreeCamera("default camera", new Vector3(worldCenter.x, worldCenter.y, -radius), this);
                freeCamera.setTarget(worldCenter);
                camera = freeCamera;
            }
            camera.minZ = radius * 0.01;
            camera.maxZ = radius * 1000;
            camera.speed = radius * 0.2;
            this.activeCamera = camera;

            if (attachCameraControls) {
                camera.attachControl();
            }
        }
    };

    Scene.prototype.createDefaultCameraOrLight = function (createArcRotateCamera = false, replace = false, attachCameraControls = false): void {
        this.createDefaultLight(replace);
        this.createDefaultCamera(createArcRotateCamera, replace, attachCameraControls);
    };

    Scene.prototype.createDefaultSkybox = function (environmentTexture?: BaseTexture, pbr = false, scale = 1000, blur = 0, setGlobalEnvTexture = true): Nullable<Mesh> {
        if (!environmentTexture) {
            Logger.Warn("Can not create default skybox without environment texture.");
            return null;
        }

        if (setGlobalEnvTexture) {
            if (environmentTexture) {
                this.environmentTexture = environmentTexture;
            }
        }

        // Skybox
        const hdrSkybox = CreateBox("hdrSkyBox", { size: scale }, this);
        if (pbr) {
            const hdrSkyboxMaterial = new PBRMaterial("skyBox", this);
            hdrSkyboxMaterial.backFaceCulling = false;
            hdrSkyboxMaterial.reflectionTexture = environmentTexture.clone();
            if (hdrSkyboxMaterial.reflectionTexture) {
                hdrSkyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
            }
            hdrSkyboxMaterial.microSurface = 1.0 - blur;
            hdrSkyboxMaterial.disableLighting = true;
            hdrSkyboxMaterial.twoSidedLighting = true;
            hdrSkybox.material = hdrSkyboxMaterial;
        } else {
            const skyboxMaterial = new StandardMaterial("skyBox", this);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.reflectionTexture = environmentTexture.clone();
            if (skyboxMaterial.reflectionTexture) {
                skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
            }
            skyboxMaterial.disableLighting = true;
            hdrSkybox.material = skyboxMaterial;
        }
        hdrSkybox.isPickable = false;
        hdrSkybox.infiniteDistance = true;
        hdrSkybox.ignoreCameraMaxZ = true;
        return hdrSkybox;
    };

    Scene.prototype.createDefaultEnvironment = function (options: Partial<IEnvironmentHelperOptions>): Nullable<EnvironmentHelper> {
        if (EnvironmentHelper) {
            return new EnvironmentHelper(options, this);
        }
        return null;
    };

    Scene.prototype.createDefaultVRExperience = function (webVROptions: VRExperienceHelperOptions = {}): VRExperienceHelper {
        return new VRExperienceHelper(this, webVROptions);
    };

    Scene.prototype.createDefaultXRExperienceAsync = async function (options: WebXRDefaultExperienceOptions = {}): Promise<WebXRDefaultExperience> {
        return await WebXRDefaultExperience.CreateAsync(this, options);
    };
}
