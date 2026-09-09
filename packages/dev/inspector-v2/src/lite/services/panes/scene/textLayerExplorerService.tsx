import { getRenderingContextKind, type TextRenderer } from "@babylonjs/lite";
import { TextTRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { type ExplorerNodeDescription, GetEntityId } from "../../../../components/explorer/explorerModel";
import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

const TextLayerIcon: FunctionComponent = () => <TextTRegular />;

export const TextLayerExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService]> = {
    friendlyName: "Babylon Lite Text Layer Explorer",
    consumes: [EngineExplorerServiceIdentity],
    factory: (engineExplorerService) =>
        engineExplorerService.addRenderingContextNodeProvider({
            predicate: (context): context is TextRenderer => getRenderingContextKind(context) === "text-renderer",
            getNodes: (renderer): readonly ExplorerNodeDescription[] =>
                renderer.layers.map((layer, index) => ({
                    id: `text-layer-${GetEntityId(layer)}`,
                    kind: "item",
                    entity: layer,
                    icon: TextLayerIcon,
                    getDisplayInfo: () => ({ name: `Layer ${index + 1}` }),
                })),
            getSnapshot: (renderer) => renderer.layers,
        }),
};
