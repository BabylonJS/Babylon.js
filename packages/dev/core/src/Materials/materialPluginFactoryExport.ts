import type { Nullable } from "../types";
import { DetailMapConfiguration } from "./material.detailMapConfiguration";
import type { MaterialPluginBase } from "./materialPluginBase";
import { PBRAnisotropicConfiguration } from "./PBR/pbrAnisotropicConfiguration";
import { PBRBaseMaterial } from "./PBR/pbrBaseMaterial";
import { PBRBRDFConfiguration } from "./PBR/pbrBRDFConfiguration";
import { PBRClearCoatConfiguration } from "./PBR/pbrClearCoatConfiguration";
import { PBRIridescenceConfiguration } from "./PBR/pbrIridescenceConfiguration";
import { PBRSheenConfiguration } from "./PBR/pbrSheenConfiguration";
import { PBRSubSurfaceConfiguration } from "./PBR/pbrSubSurfaceConfiguration";
import { StandardMaterial } from "./standardMaterial";

declare type Material = import("./material").Material;

/**
 * Creates an instance of the anisotropic plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRAnisotropicPlugin(material: Material): Nullable<MaterialPluginBase> {
    if (material instanceof PBRBaseMaterial) {
        return new PBRAnisotropicConfiguration(material);
    }
    return null;
}

/**
 * Creates an instance of the brdf plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRBRDFPlugin(material: Material): Nullable<MaterialPluginBase> {
    if (material instanceof PBRBaseMaterial) {
        return new PBRBRDFConfiguration(material);
    }
    return null;
}

/**
 * Creates an instance of the clear coat plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRClearCoatPlugin(material: Material): Nullable<MaterialPluginBase> {
    if (material instanceof PBRBaseMaterial) {
        return new PBRClearCoatConfiguration(material);
    }
    return null;
}

/**
 * Creates an instance of the iridescence plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRIridescencePlugin(material: Material): Nullable<MaterialPluginBase> {
    if (material instanceof PBRBaseMaterial) {
        return new PBRIridescenceConfiguration(material);
    }
    return null;
}

/**
 * Creates an instance of the sheen plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRSheenPlugin(material: Material): Nullable<MaterialPluginBase> {
    if (material instanceof PBRBaseMaterial) {
        return new PBRSheenConfiguration(material);
    }
    return null;
}

/**
 * Creates an instance of the sub surface plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createPBRSubSurfacePlugin(material: Material): Nullable<MaterialPluginBase> {
    if (material instanceof PBRBaseMaterial) {
        return new PBRSubSurfaceConfiguration(material);
    }
    return null;
}

/**
 * Creates an instance of the detail map plugin
 * @param material parent material the plugin will be created for
 * @returns the plugin instance or null if the plugin is incompatible with material
 */
export function createDetailMapPlugin(material: Material): Nullable<MaterialPluginBase> {
    if (material instanceof PBRBaseMaterial || material instanceof StandardMaterial) {
        return new DetailMapConfiguration(material);
    }
    return null;
}
