import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { QuickCreateSection, QuickCreateItem } from "./quickCreateLayout";
import type { ISelectionService } from "../../services/selectionService";
import { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";

type FrameGraphsContentProps = {
    scene: Scene;
    selectionService: ISelectionService;
};

/**
 * Helper to generate a unique frame graph name
 * @param baseName - The base name to use
 * @param scene - The scene to check for existing frame graphs
 * @returns A unique name
 */
function GetUniqueName(baseName: string, scene: Scene): string {
    let name = baseName;
    let idSubscript = 1;
    while (scene.getFrameGraphByName(name)) {
        name = baseName + " " + idSubscript++;
    }
    return name;
}

/**
 * Frame Graphs content component
 * @param props - Component props
 * @returns React component
 */
export const FrameGraphsContent: FunctionComponent<FrameGraphsContentProps> = ({ scene, selectionService }) => {
    // Node Render Graph state
    const [frameGraphName, setFrameGraphName] = useState("Frame Graph");

    const createFrameGraph = () => {
        const uniqueName = GetUniqueName(frameGraphName, scene);
        const newNodeRenderGraph = new NodeRenderGraph(uniqueName, scene);
        newNodeRenderGraph.setToDefault();
        void newNodeRenderGraph.buildAsync();
        // Return the underlying FrameGraph, which is what gets registered with the scene
        // and matched by the properties/explorer services via `instanceof FrameGraph`.
        return newNodeRenderGraph.frameGraph;
    };

    return (
        <QuickCreateSection>
            {/* Node Render Graph / Frame Graph */}
            <QuickCreateItem selectionService={selectionService} label="Frame Graph" onCreate={() => createFrameGraph()}>
                <TextInputPropertyLine label="Name" value={frameGraphName} onChange={(value) => setFrameGraphName(value)} />
            </QuickCreateItem>
        </QuickCreateSection>
    );
};
