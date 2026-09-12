import { removeSpriteRendererLayer, type Sprite2DLayer, type SpriteRenderer } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { LayerDiagonalPersonRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { CreateRenderingLayerExplorerServiceDefinition } from "./renderingLayerExplorerService";

const SpriteLayerIcon: FunctionComponent<{ entity: object }> = () => <LayerDiagonalPersonRegular color={tokens.colorPalettePeachForeground2} />;

export const SpriteLayerExplorerServiceDefinition = CreateRenderingLayerExplorerServiceDefinition<SpriteRenderer, Sprite2DLayer>({
    friendlyName: "Babylon Lite Sprite Layer Explorer",
    contextKind: "sprite-renderer",
    layerTypeName: "Sprite Layer",
    icon: SpriteLayerIcon,
    removeLayer: removeSpriteRendererLayer,
});
