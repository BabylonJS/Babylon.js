import { type Nullable } from "../types";
import { type Mesh } from "../Meshes/mesh";
import { type BaseTexture } from "../Materials/Textures/baseTexture";
import { type IEnvironmentHelperOptions, type EnvironmentHelper } from "./environmentHelper";
import { type VRExperienceHelperOptions, type VRExperienceHelper } from "../Cameras/VR/vrExperienceHelper";
import { type WebXRDefaultExperienceOptions, type WebXRDefaultExperience } from "../XR/webXRDefaultExperience";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * Creates a default light for the scene.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/fastBuildWorld#create-default-light
         * @param replace has the default false, when true replaces the existing lights in the scene with a hemispheric light
         */
        createDefaultLight(replace?: boolean): void;

        /**
         * Creates a default camera for the scene.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/fastBuildWorld#create-default-camera
         * @param createArcRotateCamera has the default false which creates a free camera, when true creates an arc rotate camera
         * @param replace has default false, when true replaces the active camera in the scene
         * @param attachCameraControls has default false, when true attaches camera controls to the canvas.
         */
        createDefaultCamera(createArcRotateCamera?: boolean, replace?: boolean, attachCameraControls?: boolean): void;

        /**
         * Creates a default camera and a default light.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/fastBuildWorld#create-default-camera-or-light
         * @param createArcRotateCamera has the default false which creates a free camera, when true creates an arc rotate camera
         * @param replace has the default false, when true replaces the active camera/light in the scene
         * @param attachCameraControls has the default false, when true attaches camera controls to the canvas.
         */
        createDefaultCameraOrLight(createArcRotateCamera?: boolean, replace?: boolean, attachCameraControls?: boolean): void;

        /**
         * Creates a new sky box
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/fastBuildWorld#create-default-skybox
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
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/fastBuildWorld#create-default-environment
         * @param options defines the options you can use to configure the environment
         * @returns the new EnvironmentHelper
         */
        createDefaultEnvironment(options?: Partial<IEnvironmentHelperOptions>): Nullable<EnvironmentHelper>;

        /**
         * Creates a new VREXperienceHelper
         * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/webVRHelper
         * @param webVROptions defines the options used to create the new VREXperienceHelper
         * @deprecated Please use createDefaultXRExperienceAsync instead
         * @returns a new VREXperienceHelper
         */
        createDefaultVRExperience(webVROptions?: VRExperienceHelperOptions): VRExperienceHelper;

        /**
         * Creates a new WebXRDefaultExperience
         * @see https://doc.babylonjs.com/features/featuresDeepDive/webXR/introToWebXR
         * @param options experience options
         * @returns a promise for a new WebXRDefaultExperience
         */
        createDefaultXRExperienceAsync(options?: WebXRDefaultExperienceOptions): Promise<WebXRDefaultExperience>;
    }
}
