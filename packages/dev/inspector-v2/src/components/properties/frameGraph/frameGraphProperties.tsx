import type { FrameGraph } from "core/index";

import type { FunctionComponent } from "react";

import { EditRegular, PlayRegular } from "@fluentui/react-icons";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

export const FrameGraphTaskProperties: FunctionComponent<{ frameGraph: FrameGraph }> = (props) => {
    const { frameGraph } = props;
    const tasks = frameGraph.tasks;

    return (
        <>
            {tasks.length > 0 &&
                tasks.map((task, i) => {
                    return (
                        <BoundProperty
                            component={SwitchPropertyLine}
                            key={"task" + i}
                            label={i + 1 + ". " + task.name}
                            target={frameGraph.tasks[i]}
                            propertyKey="disabled"
                            convertTo={(v) => !v}
                            convertFrom={(v) => !v}
                        ></BoundProperty>
                    );
                })}
        </>
    );
};

export const FrameGraphGeneralProperties: FunctionComponent<{ frameGraph: FrameGraph }> = (props) => {
    const { frameGraph } = props;
    const isSceneFrameGraph = useProperty(frameGraph.scene, "frameGraph");
    const renderGraph = frameGraph.getLinkedNodeRenderGraph();

    return (
        <>
            <BoundProperty
                component={SwitchPropertyLine}
                label="Optimize Texture Allocation"
                description="Whether to optimize texture allocation."
                target={frameGraph}
                propertyKey="optimizeTextureAllocation"
            ></BoundProperty>
            {isSceneFrameGraph !== frameGraph && <ButtonLine onClick={() => (frameGraph.scene.frameGraph = frameGraph)} label="Make Active" icon={PlayRegular} />}
            {renderGraph && (
                <ButtonLine
                    label="Edit Graph"
                    icon={EditRegular}
                    onClick={async () => {
                        // TODO: Figure out how to get all the various build steps to work with this.
                        //       See the initial attempt here: https://github.com/BabylonJS/Babylon.js/pull/17646
                        // const { NodeRenderGraphEditor } = await import("node-render-graph-editor/nodeRenderGraphEditor");
                        // NodeRenderGraphEditor.Show({ nodeRenderGraph: renderGraph, hostScene: frameGraph.scene });
                        await renderGraph.edit({ nodeRenderGraphEditorConfig: { hostScene: frameGraph.scene } });
                    }}
                ></ButtonLine>
            )}
        </>
    );
};
