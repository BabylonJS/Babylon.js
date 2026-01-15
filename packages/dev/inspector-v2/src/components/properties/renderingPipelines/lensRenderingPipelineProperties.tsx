import type { FunctionComponent } from "react";

import type { LensRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/lensRenderingPipeline";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../boundProperty";

export const LensRenderingPipelineOptionsProperties: FunctionComponent<{ pipeline: LensRenderingPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Edge Blur" target={pipeline} propertyKey="edgeBlur" min={0} step={0.1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Edge Distortion" target={pipeline} propertyKey="edgeDistortion" min={0} step={0.1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Grain Amount" target={pipeline} propertyKey="grainAmount" min={0} step={0.1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Chromatic Aberration" target={pipeline} propertyKey="chromaticAberration" min={0} step={0.1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Darken Out of Focus" target={pipeline} propertyKey="darkenOutOfFocus" min={0} step={0.1} />
            <BoundProperty component={SwitchPropertyLine} label="Blur Noise" target={pipeline} propertyKey="blurNoise" />
        </>
    );
};

export const LensRenderingPipelineDepthOfFieldProperties: FunctionComponent<{ pipeline: LensRenderingPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="DOF Aperture" target={pipeline} propertyKey="dofAperture" min={0} step={0.1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="DOF Distortion" target={pipeline} propertyKey="dofDistortion" min={0} step={0.1} />
            <BoundProperty component={SwitchPropertyLine} label="Pentagon Bokeh" target={pipeline} propertyKey="pentagonBokeh" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Highlights Gain" target={pipeline} propertyKey="highlightsGain" min={0} step={0.1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Highlights Threshold" target={pipeline} propertyKey="highlightsThreshold" min={0} step={0.1} />
        </>
    );
};
