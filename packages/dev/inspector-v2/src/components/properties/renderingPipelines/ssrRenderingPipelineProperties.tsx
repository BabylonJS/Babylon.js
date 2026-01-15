import type { FunctionComponent } from "react";

import type { SSRRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssrRenderingPipeline";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";

export const SSRRenderingPipelineSSRProperties: FunctionComponent<{ pipeline: SSRRenderingPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={pipeline} propertyKey="isEnabled" />
            <BoundProperty component={SwitchPropertyLine} label="Debug" target={pipeline} propertyKey="debug" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Strength" target={pipeline} propertyKey="strength" min={0} step={0.05} />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Reflection Specular Falloff"
                target={pipeline}
                propertyKey="reflectionSpecularFalloffExponent"
                min={0}
                step={0.05}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Reflectivity Threshold" target={pipeline} propertyKey="reflectivityThreshold" min={0} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Thickness" target={pipeline} propertyKey="thickness" min={0} step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="Step" target={pipeline} propertyKey="step" min={1} step={1} forceInt />
            <BoundProperty component={SwitchPropertyLine} label="Enable Smooth Reflections" target={pipeline} propertyKey="enableSmoothReflections" />
            <BoundProperty component={NumberInputPropertyLine} label="Max Steps" target={pipeline} propertyKey="maxSteps" min={1} step={10} forceInt />
            <BoundProperty component={NumberInputPropertyLine} label="Max Distance" target={pipeline} propertyKey="maxDistance" min={1} step={10} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Roughness Factor" target={pipeline} propertyKey="roughnessFactor" min={0} step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="Self Collision Skip" target={pipeline} propertyKey="selfCollisionNumSkip" min={1} step={1} />
            <BoundProperty component={NumberInputPropertyLine} label="SSR Downsample" target={pipeline} propertyKey="ssrDownsample" min={0} step={1} />
            <BoundProperty component={SwitchPropertyLine} label="Clip to Frustum" target={pipeline} propertyKey="clipToFrustum" />
        </>
    );
};

export const SSRRenderingPipelineThicknessProperties: FunctionComponent<{ pipeline: SSRRenderingPipeline }> = (props) => {
    const { pipeline } = props;
    const enableAutomaticThicknessComputation = useProperty(pipeline, "enableAutomaticThicknessComputation");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enable Automatic Thickness Computation" target={pipeline} propertyKey="enableAutomaticThicknessComputation" />
            <Collapse visible={!!enableAutomaticThicknessComputation}>
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Backface Force Depth Write Transparent Meshes"
                    target={pipeline}
                    propertyKey="backfaceForceDepthWriteTransparentMeshes"
                />
                <BoundProperty
                    component={NumberInputPropertyLine}
                    label="Backface Depth Texture Downsample"
                    target={pipeline}
                    propertyKey="backfaceDepthTextureDownsample"
                    min={0}
                    step={1}
                />
            </Collapse>
        </>
    );
};

export const SSRRenderingPipelineBlurProperties: FunctionComponent<{ pipeline: SSRRenderingPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Blur Dispersion Strength" target={pipeline} propertyKey="blurDispersionStrength" min={0} step={0.001} />
            <BoundProperty component={NumberInputPropertyLine} label="Blur Downsample" target={pipeline} propertyKey="blurDownsample" min={0} step={1} />
        </>
    );
};

export const SSRRenderingPipelineAttenuationProperties: FunctionComponent<{ pipeline: SSRRenderingPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Attenuate Screen Borders" target={pipeline} propertyKey="attenuateScreenBorders" />
            <BoundProperty component={SwitchPropertyLine} label="Attenuate Intersection Distance" target={pipeline} propertyKey="attenuateIntersectionDistance" />
            <BoundProperty component={SwitchPropertyLine} label="Attenuate Intersection Iterations" target={pipeline} propertyKey="attenuateIntersectionIterations" />
            <BoundProperty component={SwitchPropertyLine} label="Attenuate Facing Camera" target={pipeline} propertyKey="attenuateFacingCamera" />
            <BoundProperty component={SwitchPropertyLine} label="Attenuate Backface Reflection" target={pipeline} propertyKey="attenuateBackfaceReflection" />
        </>
    );
};

export const SSRRenderingPipelineColorSpaceProperties: FunctionComponent<{ pipeline: SSRRenderingPipeline }> = (props) => {
    const { pipeline } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Input Texture Color Is In Gamma Space" target={pipeline} propertyKey="inputTextureColorIsInGammaSpace" />
            <BoundProperty component={SwitchPropertyLine} label="Generate Output In Gamma Space" target={pipeline} propertyKey="generateOutputInGammaSpace" />
        </>
    );
};
