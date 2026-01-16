import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SettingsPopover } from "./settingsPopover";
import { QuickCreateSection, QuickCreateRow } from "./quickCreateLayout";
import { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";

type FrameGraphsContentProps = {
    scene: Scene;
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
export const FrameGraphsContent: FunctionComponent<FrameGraphsContentProps> = ({ scene }) => {
    // Node Render Graph state
    const [frameGraphName, setFrameGraphName] = useState("Frame Graph");

    const handleCreateFrameGraph = () => {
        const uniqueName = GetUniqueName(frameGraphName, scene);
        const newNodeRenderGraph = new NodeRenderGraph(uniqueName, scene);
        newNodeRenderGraph.setToDefault();
        void newNodeRenderGraph.buildAsync();
    };

    return (
        <QuickCreateSection>
            {/* Node Render Graph / Frame Graph */}
            <QuickCreateRow>
                <Button onClick={handleCreateFrameGraph} label="Frame Graph" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={frameGraphName} onChange={(value) => setFrameGraphName(value)} />
                    <Button appearance="primary" onClick={handleCreateFrameGraph} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>
        </QuickCreateSection>
    );
};
