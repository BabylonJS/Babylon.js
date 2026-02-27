import type { FunctionComponent } from "react";

import type { SSAO2RenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { BoundProperty } from "../boundProperty";

export const SSAO2RenderingPipelineSSAOProperties: FunctionComponent<{ pipeline: SSAO2RenderingPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Total Strength" target={pipeline} propertyKey="totalStrength" min={0} step={0.05} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Base" target={pipeline} propertyKey="base" min={0} step={0.05} />
            <BoundProperty component={NumberInputPropertyLine} label="Max Z" target={pipeline} propertyKey="maxZ" min={0} step={1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Min Z Aspect" target={pipeline} propertyKey="minZAspect" min={0} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Radius" target={pipeline} propertyKey="radius" min={0} step={0.05} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Epsilon" target={pipeline} propertyKey="epsilon" min={0} step={0.001} />
            <BoundProperty component={NumberInputPropertyLine} label="Samples" target={pipeline} propertyKey="samples" min={1} step={1} />
        </>
    );
};

export const SSAO2RenderingPipelineDenoiserProperties: FunctionComponent<{ pipeline: SSAO2RenderingPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Bypass Blur" target={pipeline} propertyKey="bypassBlur" />
            <BoundProperty component={SwitchPropertyLine} label="Expensive Blur" target={pipeline} propertyKey="expensiveBlur" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Bilateral Samples" target={pipeline} propertyKey="bilateralSamples" min={2} step={1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Bilateral Soften" target={pipeline} propertyKey="bilateralSoften" min={0} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Bilateral Tolerance" target={pipeline} propertyKey="bilateralTolerance" min={0} step={0.01} />
        </>
    );
};
