import { VRExperienceHelperOptions } from "babylonjs";

export interface IVRConfiguration {
    disabled?: boolean;
    objectScaleFactor?: number;
    disableInteractions?: boolean;
    disableTeleportation?: boolean;
    overrideFloorMeshName?: string;
    vrOptions?: VRExperienceHelperOptions;
}