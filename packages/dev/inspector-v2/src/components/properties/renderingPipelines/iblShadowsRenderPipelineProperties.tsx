import type { FunctionComponent } from "react";

import type { IblShadowsRenderPipeline } from "core/Rendering/IBLShadows/iblShadowsRenderPipeline";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";

export const IblShadowsRenderPipelineVoxelProperties: FunctionComponent<{ pipeline: IblShadowsRenderPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <ButtonLine label="Update Scene Bounds" onClick={() => pipeline.updateSceneBounds()} />
            <ButtonLine label="Revoxelize" onClick={() => pipeline.updateVoxelization()} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Shadow Opacity" target={pipeline} propertyKey="shadowOpacity" min={0} step={0.05} />
            <BoundProperty component={NumberInputPropertyLine} label="Sample Directions" target={pipeline} propertyKey="sampleDirections" min={0} step={1} />
            <BoundProperty component={NumberInputPropertyLine} label="Resolution Exp" target={pipeline} propertyKey="resolutionExp" min={4} step={1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Shadow Remanence" target={pipeline} propertyKey="shadowRemanence" min={0} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Voxel Shadow Opacity" target={pipeline} propertyKey="voxelShadowOpacity" min={0} step={0.05} />
        </>
    );
};

export const IblShadowsRenderPipelineScreenspaceProperties: FunctionComponent<{ pipeline: IblShadowsRenderPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="SS Shadow Opacity" target={pipeline} propertyKey="ssShadowOpacity" min={0} step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="SS Shadow Sample Count" target={pipeline} propertyKey="ssShadowSampleCount" min={0} step={1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="SS Shadow Stride" target={pipeline} propertyKey="ssShadowStride" min={0} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="SS Shadow Distance Scale" target={pipeline} propertyKey="ssShadowDistanceScale" min={0.01} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="SS Shadow Thickness Scale" target={pipeline} propertyKey="ssShadowThicknessScale" min={0.005} step={0.001} />
        </>
    );
};

export const IblShadowsRenderPipelineDebugProperties: FunctionComponent<{ pipeline: IblShadowsRenderPipeline }> = (props) => {
    const { pipeline } = props;
    const allowDebugPasses = useProperty(pipeline, "allowDebugPasses");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Allow Debug Passes" target={pipeline} propertyKey="allowDebugPasses" />
            {allowDebugPasses && (
                <>
                    <BoundProperty component={SwitchPropertyLine} label="Voxel Debug Enabled" target={pipeline} propertyKey="voxelDebugEnabled" />
                    <BoundProperty component={SwitchPropertyLine} label="CDF Debug Enabled" target={pipeline} propertyKey="cdfDebugEnabled" />
                    <BoundProperty component={SwitchPropertyLine} label="Voxel Tracing Debug Enabled" target={pipeline} propertyKey="voxelTracingDebugEnabled" />
                    <BoundProperty component={SwitchPropertyLine} label="Spatial Blur Debug Enabled" target={pipeline} propertyKey="spatialBlurPassDebugEnabled" />
                    <BoundProperty component={SwitchPropertyLine} label="Accumulation Pass Debug Enabled" target={pipeline} propertyKey="accumulationPassDebugEnabled" />
                </>
            )}
        </>
    );
};
