import { getFrameGraph, getRenderingContextKind, type FrameGraphContext } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { FrameRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { EngineExplorerServiceIdentity, type IEngineExplorerService } from "../../../engineExplorerService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";

const FrameGraphIcon: FunctionComponent = () => <FrameRegular color={tokens.colorPaletteGreenForeground2} />;

export const FrameGraphExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService]> = {
    friendlyName: "Babylon Lite Frame Graph Explorer",
    consumes: [EngineExplorerServiceIdentity],
    factory: (engineExplorerService) => {
        const sceneRegistration = engineExplorerService.addRenderingContextNodeProvider({
            order: 400,
            predicate: IsSceneContext,
            getNodes: (scene) => [CreateSceneExplorerSectionNode("frame-graphs", "Frame Graphs", [getFrameGraph(scene)], () => ({ name: "Frame Graph" }), FrameGraphIcon)],
            getSnapshot: (scene) => [getFrameGraph(scene)],
        });
        const frameGraphRegistration = engineExplorerService.addRenderingContextNodeProvider({
            order: 400,
            predicate: (context): context is FrameGraphContext => getRenderingContextKind(context) === "frame-graph-context",
            getNodes: (context) => [CreateSceneExplorerSectionNode("frame-graphs", "Frame Graphs", [context.frameGraph], () => ({ name: "Frame Graph" }), FrameGraphIcon)],
            getSnapshot: (context) => [context.frameGraph],
        });

        return {
            dispose: () => {
                sceneRegistration.dispose();
                frameGraphRegistration.dispose();
            },
        };
    },
};
