import { Logger } from "../Misc/logger";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { Mesh } from "../Meshes/mesh";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { Texture } from "../Materials/Textures/texture";
import { StandardMaterial } from "../Materials/standardMaterial";
import { PBRMaterial } from "../Materials/PBR/pbrMaterial";
import { HemisphericLight } from "../Lights/hemisphericLight";
import { IEnvironmentHelperOptions, EnvironmentHelper } from "./environmentHelper";
import { FreeCamera } from "../Cameras/freeCamera";
import { ArcRotateCamera } from "../Cameras/arcRotateCamera";
import { TargetCamera } from "../Cameras/targetCamera";
import { VRExperienceHelperOptions, VRExperienceHelper } from "../Cameras/VR/vrExperienceHelper";

import "../Materials/Textures/Loaders/ddsTextureLoader";
import "../Materials/Textures/Loaders/envTextureLoader";
import "../Materials/Textures/Loaders/ktxTextureLoader";
import "../Meshes/Builders/boxBuilder";
import { WebXRDefaultExperience, WebXRDefaultExperienceOptions } from '../XR/webXRDefaultExperience';

/** @hidden */
export var _forceSceneHelpersToBundle = true;

declare module "../scene" {
    export interface Scene {
        /**
         * Creates a default light for the scene.
         * @see https://doc.babylonjs.com/How_To/Fast_Build#create-default-light
         * @param replace has the default false, when true replaces the existing lights in the scene with a hemispheric light
         */
        createDefaultLight(replace?: boolean): void;

        /**
         * Creates a default camera for the scene.
         * @see https://doc.babylonjs.com/How_To/Fast_Build#create-default-camera
         * @param createArcRotateCamera has the default false which creates a free camera, when true creates an arc rotate camera
         * @param replace has default false, when true replaces the active camera in the scene
         * @param attachCameraControls has default false, when true attaches camera controls to the canvas.
         */
        createDefaultCamera(createArcRotateCamera?: boolean, replace?: boolean, attachCameraControls?: boolean): void;

        /**
         * Creates a default camera and a default light.
         * @see https://doc.babylonjs.com/how_to/Fast_Build#create-default-camera-or-light
         * @param createArcRotateCamera has the default false which creates a free camera, when true creates an arc rotate camera
         * @param replace has the default false, when true replaces the active camera/light in the scene
         * @param attachCameraControls has the default false, when true attaches camera controls to the canvas.
         */
        createDefaultCameraOrLight(createArcRotateCamera?: boolean, replace?: boolean, attachCameraControls?: boolean): void;

        /**
         * Creates a new sky box
         * @see https://doc.babylonjs.com/how_to/Fast_Build#create-default-skybox
         * @param environmentTexture defines the texture to use as environment texture
         * @param pbr has default false which requires the StandardMaterial to be used, when true PBRMaterial must be used
         * @param scale defines the overall scale of the skybox
         * @param blur is only available when pbr is true, default is 0, no blur, maximum value is 1
         * @param setGlobalEnvTexture has default true indicating that scene.environmentTexture must match the current skybox texture
         * @returns a new mesh holding the sky box
         */
        createDefaultSkybox(environmentTexture?: BaseTexture, pbr?: boolean, scale?: number, blur?: number, setGlobalEnvTexture?: boolean): Nullable<Mesh>;

        /**
         * Creates a new environment
         * @see https://doc.babylonjs.com/How_To/Fast_Build#create-default-environment
         * @param options defines the options you can use to configure the environment
         * @returns the new EnvironmentHelper
         */
        createDefaultEnvironment(options?: Partial<IEnvironmentHelperOptions>): Nullable<EnvironmentHelper>;

        /**
         * Creates a new VREXperienceHelper
         * @see https://doc.babylonjs.com/how_to/webvr_helper
         * @param webVROptions defines the options used to create the new VREXperienceHelper
         * @returns a new VREXperienceHelper
         */
        createDefaultVRExperience(webVROptions?: VRExperienceHelperOptions): VRExperienceHelper;

        /**
         * Creates a new WebXRDefaultExperience
         * @see https://doc.babylonjs.com/how_to/introduction_to_webxr
         * @param options experience options
         * @returns a promise for a new WebXRDefaultExperience
         */
        createDefaultXRExperienceAsync(options: WebXRDefaultExperienceOptions): Promise<WebXRDefaultExperience>;
    }
}

Scene.prototype.createDefaultLight = function(replace = false): void {
    // Dispose existing light in replace mode.
    if (replace) {
        if (this.lights) {
            for (var i = 0; i < this.lights.length; i++) {
                this.lights[i].dispose();
            }
        }
    }

    // Light
    if (this.lights.length === 0) {
        new HemisphericLight("default light", Vector3.Up(), this);
    }
};

Scene.prototype.createDefaultCamera = function(createArcRotateCamera = false, replace = false, attachCameraControls = false): void {
    // Dispose existing camera in replace mode.
    if (replace) {
        if (this.activeCamera) {
            this.activeCamera.dispose();
            this.activeCamera = null;
        }
    }

    // Camera
    if (!this.activeCamera) {
        var worldExtends = this.getWorldExtends((mesh) => mesh.isVisible && mesh.isEnabled());
        var worldSize = worldExtends.max.subtract(worldExtends.min);
        var worldCenter = worldExtends.min.add(worldSize.scale(0.5));

        var camera: TargetCamera;
        var radius = worldSize.length() * 1.5;
        // empty scene scenario!
        if (!isFinite(radius)) {
            radius = 1;
            worldCenter.copyFromFloats(0, 0, 0);
        }
        if (createArcRotateCamera) {
            var arcRotateCamera = new ArcRotateCamera("default camera", -(Math.PI / 2), Math.PI / 2, radius, worldCenter, this);
            arcRotateCamera.lowerRadiusLimit = radius * 0.01;
            arcRotateCamera.wheelPrecision = 100 / radius;
            camera = arcRotateCamera;
        }
        else {
            var freeCamera = new FreeCamera("default camera", new Vector3(worldCenter.x, worldCenter.y, -radius), this);
            freeCamera.setTarget(worldCenter);
            camera = freeCamera;
        }
        camera.minZ = radius * 0.01;
        camera.maxZ = radius * 1000;
        camera.speed = radius * 0.2;
        this.activeCamera = camera;

        let canvas = this.getEngine().getInputElement();
        if (attachCameraControls && canvas) {
            camera.attachControl(canvas);
        }
    }
};

Scene.prototype.createDefaultCameraOrLight = function(createArcRotateCamera = false, replace = false, attachCameraControls = false): void {
    this.createDefaultLight(replace);
    this.createDefaultCamera(createArcRotateCamera, replace, attachCameraControls);
};

Scene.prototype.createDefaultSkybox = function(environmentTexture?: BaseTexture, pbr = false, scale = 1000, blur = 0, setGlobalEnvTexture = true): Nullable<Mesh> {

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
    var hdrSkybox = Mesh.CreateBox("hdrSkyBox", scale, this);
    if (pbr) {
        let hdrSkyboxMaterial = new PBRMaterial("skyBox", this);
        hdrSkyboxMaterial.backFaceCulling = false;
        hdrSkyboxMaterial.reflectionTexture = environmentTexture.clone();
        if (hdrSkyboxMaterial.reflectionTexture) {
            hdrSkyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        }
        hdrSkyboxMaterial.microSurface = 1.0 - blur;
        hdrSkyboxMaterial.disableLighting = true;
        hdrSkyboxMaterial.twoSidedLighting = true;
        hdrSkybox.infiniteDistance = true;
        hdrSkybox.material = hdrSkyboxMaterial;
    }
    else {
        let skyboxMaterial = new StandardMaterial("skyBox", this);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = environmentTexture.clone();
        if (skyboxMaterial.reflectionTexture) {
            skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        }
        skyboxMaterial.disableLighting = true;
        hdrSkybox.infiniteDistance = true;
        hdrSkybox.material = skyboxMaterial;
    }
    hdrSkybox.isPickable = false;
    return hdrSkybox;
};

Scene.prototype.createDefaultEnvironment = function(options: Partial<IEnvironmentHelperOptions>): Nullable<EnvironmentHelper> {
    if (EnvironmentHelper) {
        return new EnvironmentHelper(options, this);
    }
    return null;
};

Scene.prototype.createDefaultVRExperience = function(webVROptions: VRExperienceHelperOptions = {}): VRExperienceHelper {
    return new VRExperienceHelper(this, webVROptions);
};

Scene.prototype.createDefaultXRExperienceAsync = function(options: WebXRDefaultExperienceOptions = {}): Promise<WebXRDefaultExperience> {
    return WebXRDefaultExperience.CreateAsync(this, options).then((helper) => {
        return helper;
    });
};
