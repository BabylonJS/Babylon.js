import type { VRExperienceHelperOptions } from "core/Cameras/VR/vrExperienceHelper";

export interface IVRConfiguration {
    disabled?: boolean;
    objectScaleFactor?: number;
    disableInteractions?: boolean;
    disableTeleportation?: boolean;
    overrideFloorMeshName?: string;
    vrOptions?: VRExperienceHelperOptions;
    modelHeightCorrection?: number | boolean;
    rotateUsingControllers?: boolean; // experimental feature
    cameraPosition?: { x: number; y: number; z: number };
}
