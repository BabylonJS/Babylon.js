import { VRExperienceHelperOptions } from "babylonjs";

export interface IVRConfiguration {
    enabled?: boolean;
    objectScaleFactor?: number;
    disableInteractions?: boolean;
    disableTeleportation?: boolean;
    overrideFloorMeshName?: string;
    vrOptions?: VRExperienceHelperOptions;
}