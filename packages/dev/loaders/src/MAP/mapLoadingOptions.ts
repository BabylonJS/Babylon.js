import { MaterialMap } from "./mapLoader";

/**
 * Options for loading MAP files
 */
export type MapLoadingOptions = {
    /**
     * Whether to load the clip entities.
     */
    loadClips?: boolean;

    /**
     * Whether to load the trigger entities.
     */
    loadTriggers?: boolean;

    /**
     * Whether to load the lights.
     */
    loadLights?: boolean;

    /**
     * Map of texture names to materials.
     */
    materials?: MaterialMap;
};
