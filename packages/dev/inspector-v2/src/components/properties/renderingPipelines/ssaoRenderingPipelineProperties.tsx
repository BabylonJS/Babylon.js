import type { FunctionComponent } from "react";

import type { SSAORenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../boundProperty";

export const SSAORenderingPipelineProperties: FunctionComponent<{ pipeline: SSAORenderingPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Total Strength" target={pipeline} propertyKey="totalStrength" min={0} step={0.05} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Base" target={pipeline} propertyKey="base" min={0} step={0.05} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Radius" target={pipeline} propertyKey="radius" min={0.0001} step={0.0001} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Area" target={pipeline} propertyKey="area" min={0.0001} step={0.0001} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Fall Off" target={pipeline} propertyKey="fallOff" min={0} step={0.000001} />
        </>
    );
};
