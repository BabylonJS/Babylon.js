import type { FrameGraph } from "core/index";

import type { FunctionComponent } from "react";

import { CheckboxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";

export const FrameGraphGeneralProperties: FunctionComponent<{ frameGraph: FrameGraph }> = (props) => {
    const { frameGraph } = props;

    return (
        <>
            <CheckboxPropertyLine
                label="Optimize texture allocation"
                description="Whether to optimize texture allocation."
                value={frameGraph.optimizeTextureAllocation}
                onChange={(checked) => (frameGraph.optimizeTextureAllocation = checked)}
            />
            {frameGraph.scene.frameGraph !== frameGraph && <ButtonLine onClick={() => (frameGraph.scene.frameGraph = frameGraph)} label="Set as scene's frame graph" />}
        </>
    );
};
