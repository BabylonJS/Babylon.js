import type { FrameGraph } from "core/index";

import type { FunctionComponent } from "react";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";

export const FrameGraphTaskProperties: FunctionComponent<{ frameGraph: FrameGraph }> = (props) => {
    const { frameGraph } = props;
    const tasks = frameGraph.tasks;

    return (
        <>
            {tasks.length > 0 &&
                tasks.map((task, i) => {
                    return <TextPropertyLine label={i + 1 + ". " + task.name} value="" key={"task" + i} />;
                })}
            <ButtonLine
                label="Edit graph"
                onClick={() => {
                    void frameGraph.getLinkedNodeRenderGraph()!.edit({ nodeRenderGraphEditorConfig: { hostScene: frameGraph.scene } });
                }}
            ></ButtonLine>
        </>
    );
};
