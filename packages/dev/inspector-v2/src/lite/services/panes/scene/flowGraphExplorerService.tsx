import { flowGraphRuntimes } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { FlowchartRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { EngineExplorerServiceIdentity, type IEngineExplorerService } from "../../../engineExplorerService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";

const FlowGraphIcon: FunctionComponent = () => <FlowchartRegular color={tokens.colorPaletteGreenForeground2} />;

/**
 * Contributes the scene's flow graph runtimes to the Babylon Lite Explorer.
 */
export const FlowGraphExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService]> = {
    friendlyName: "Babylon Lite Flow Graph Explorer",
    consumes: [EngineExplorerServiceIdentity],
    factory: (engineExplorerService) => {
        const providerRegistration = engineExplorerService.addRenderingContextNodeProvider({
            order: 410,
            predicate: IsSceneContext,
            getNodes: (scene) => [
                CreateSceneExplorerSectionNode("flow-graphs", "Flow Graphs", [...flowGraphRuntimes(scene)], () => ({ name: "Unnamed Flow Graph" }), FlowGraphIcon),
            ],
            getSnapshot: (scene) => flowGraphRuntimes(scene),
        });

        return {
            dispose: () => providerRegistration.dispose(),
        };
    },
};
