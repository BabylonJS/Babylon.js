import type { FrameGraph } from "core/index";

import type { FunctionComponent } from "react";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

export const FrameGraphTaskProperties: FunctionComponent<{ frameGraph: FrameGraph }> = (props) => {
    const { frameGraph } = props;
    const tasks = frameGraph.tasks;

    return (
        <>
            {tasks.length > 0 &&
                tasks.map((task, i) => {
                    return <TextPropertyLine label={i + 1 + ". " + task.name} value="" key={"task" + i} />;
                })}
        </>
    );
};

export const FrameGraphGeneralProperties: FunctionComponent<{ frameGraph: FrameGraph }> = (props) => {
    const { frameGraph } = props;
    const isSceneFrameGraph = useProperty(frameGraph.scene, "frameGraph");

    return (
        <>
            <BoundProperty
                component={SwitchPropertyLine}
                label="Optimize Texture Allocation"
                description="Whether to optimize texture allocation."
                target={frameGraph}
                propertyKey="optimizeTextureAllocation"
            ></BoundProperty>
            {isSceneFrameGraph !== frameGraph && <ButtonLine onClick={() => (frameGraph.scene.frameGraph = frameGraph)} label="Set as scene's frame graph" />}
            <ButtonLine
                label="Edit Graph"
                onClick={() => {
                    void frameGraph.getLinkedNodeRenderGraph()!.edit({ nodeRenderGraphEditorConfig: { hostScene: frameGraph.scene } });
                }}
            ></ButtonLine>
        </>
    );
};
