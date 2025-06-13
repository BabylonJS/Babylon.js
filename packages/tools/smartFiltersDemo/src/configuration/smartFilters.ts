import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { SmartFilterManifest } from "../smartFilterLoader";
import { HardCodedSmartFilterNames } from "./smartFilters/hardCoded/hardCodedSmartFilterNames";

/**
 * The manifests describing all of the Smart Filters than can be loaded in the app's UI.
 * Note: these are dynamically loaded so that the blocks aren't loaded unless they're needed.
 */
export const smartFilterManifests: SmartFilterManifest[] = [
    {
        type: "HardCoded",
        name: HardCodedSmartFilterNames.simpleLogo,
        createSmartFilter: async (engine: ThinEngine) => {
            const module = await import(/* webpackChunkName: "simpleLogo" */ "./smartFilters/hardCoded/simpleLogo");
            return module.createSimpleLogoSmartFilter(engine);
        },
    },
    {
        type: "HardCoded",
        name: HardCodedSmartFilterNames.simpleWebcam,
        createSmartFilter: async () => {
            const module = await import(/* webpackChunkName: "simpleWebcam" */ "./smartFilters/hardCoded/simpleWebcam");
            return module.createSimpleWebcamSmartFilter();
        },
    },
    {
        type: "HardCoded",
        name: HardCodedSmartFilterNames.simplePhotoEdit,
        createSmartFilter: async (engine: ThinEngine) => {
            const module = await import(
                /* webpackChunkName: "simplePhotoEdit" */ "./smartFilters/hardCoded/simplePhotoEdit"
            );
            return module.createSimplePhotoEditSmartFilter(engine);
        },
    },
    {
        type: "Serialized",
        name: "Serialized Simple Logo",
        getSmartFilterJson: async () => {
            return await import(
                /* webpackChunkName: "serializedSimpleLogo" */ "./smartFilters/serialized/serializedSimpleLogo.json"
            );
        },
    },
];
