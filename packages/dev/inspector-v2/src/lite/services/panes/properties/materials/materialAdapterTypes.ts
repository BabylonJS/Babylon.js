import { type Material } from "@babylonjs/lite";

import { type ISelectionService } from "../../../../../services/selectionService";
import { type ISceneResourceIndexService } from "../../scene/sceneResourceIndexService";

export type MaterialSection =
    | "general"
    | "transparency"
    | "lighting-colors"
    | "textures"
    | "texture-settings"
    | "transform"
    | "occlusion"
    | "lightmap"
    | "metallic-reflectance"
    | "clear-coat"
    | "sheen"
    | "iridescence"
    | "anisotropy"
    | "subsurface-translucency"
    | "subsurface-thickness"
    | "subsurface-tint"
    | "transmission"
    | "special-modes"
    | "inputs"
    | "configuration"
    | "stencil";

/** Props shared by each lazily loaded Lite material family adapter. */
export type MaterialAdapterProps = Readonly<{
    material: Material;
    section: MaterialSection;
    resourceIndexService: ISceneResourceIndexService;
    selectionService: ISelectionService;
}>;
