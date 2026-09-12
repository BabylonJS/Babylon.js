import { removeTextRendererLayer, type TextLayer, type TextRenderer } from "@babylonjs/lite";
import { TextTRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { CreateRenderingLayerExplorerServiceDefinition } from "./renderingLayerExplorerService";

const TextLayerIcon: FunctionComponent<{ entity: object }> = () => <TextTRegular />;

export const TextLayerExplorerServiceDefinition = CreateRenderingLayerExplorerServiceDefinition<TextRenderer, TextLayer>({
    friendlyName: "Babylon Lite Text Layer Explorer",
    contextKind: "text-renderer",
    layerTypeName: "Text Layer",
    icon: TextLayerIcon,
    removeLayer: removeTextRendererLayer,
});
