/** This file must only contain pure code and pure imports */

import { type Material } from "core/Materials/material.pure";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial.pure";
import { StandardMaterial } from "core/Materials/standardMaterial.pure";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial.pure";

/**
 * Determines whether a material can receive IBL shadows by hosting an `IBLShadowsPluginMaterial`.
 *
 * Shared by both the legacy `IblShadowsRenderPipeline` and the Frame Graph
 * `FrameGraphIblShadowsRendererTask` so the two code paths cannot drift out of sync.
 * @param material The material to test.
 * @returns True if the material supports the IBL shadows plugin.
 * @internal
 */
export function IsIBLShadowsReceiverCompatible(material: Material): boolean {
    return (
        material instanceof PBRBaseMaterial ||
        material instanceof StandardMaterial ||
        material instanceof OpenPBRMaterial ||
        // ShadowOnlyMaterial lives in the separate `materials` package (which `core` cannot import),
        // so it is identified by class name rather than `instanceof`.
        material.getClassName() === "ShadowOnlyMaterial"
    );
}
