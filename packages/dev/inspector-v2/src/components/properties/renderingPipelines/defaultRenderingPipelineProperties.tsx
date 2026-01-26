import type { FunctionComponent } from "react";

import type { DefaultRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { DepthOfFieldEffectBlurLevel } from "core/PostProcesses/depthOfFieldEffect";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector2PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";

const DepthOfFieldBlurLevelOptions = [
    { label: "Low", value: DepthOfFieldEffectBlurLevel.Low },
    { label: "Medium", value: DepthOfFieldEffectBlurLevel.Medium },
    { label: "High", value: DepthOfFieldEffectBlurLevel.High },
];

const ToneMappingTypeOptions = [
    { label: "Standard", value: ImageProcessingConfiguration.TONEMAPPING_STANDARD },
    { label: "ACES", value: ImageProcessingConfiguration.TONEMAPPING_ACES },
    { label: "Khronos PBR Neutral", value: ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL },
];

const VignetteBlendModeOptions = [
    { label: "Multiply", value: ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY },
    { label: "Opaque", value: ImageProcessingConfiguration.VIGNETTEMODE_OPAQUE },
];

export const DefaultRenderingPipelineBloomProperties: FunctionComponent<{ pipeline: DefaultRenderingPipeline }> = (props) => {
    const { pipeline } = props;
    const bloomEnabled = useProperty(pipeline, "bloomEnabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Bloom Enabled" target={pipeline} propertyKey="bloomEnabled" />
            <Collapse visible={!!bloomEnabled}>
                <BoundProperty component={SyncedSliderPropertyLine} label="Threshold" target={pipeline} propertyKey="bloomThreshold" min={0} step={0.01} />
                <BoundProperty component={SyncedSliderPropertyLine} label="Weight" target={pipeline} propertyKey="bloomWeight" min={0} step={0.05} />
                <BoundProperty component={SyncedSliderPropertyLine} label="Kernel" target={pipeline} propertyKey="bloomKernel" min={0} step={1} />
                <BoundProperty component={SyncedSliderPropertyLine} label="Scale" target={pipeline} propertyKey="bloomScale" min={0} step={0.25} />
            </Collapse>
        </>
    );
};

export const DefaultRenderingPipelineChromaticAberrationProperties: FunctionComponent<{ pipeline: DefaultRenderingPipeline }> = (props) => {
    const { pipeline } = props;
    const chromaticAberrationEnabled = useProperty(pipeline, "chromaticAberrationEnabled");
    const chromaticAberration = pipeline.chromaticAberration;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Chromatic Aberration Enabled" target={pipeline} propertyKey="chromaticAberrationEnabled" />
            <Collapse visible={!!chromaticAberrationEnabled && !!chromaticAberration}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Aberration Amount"
                    target={chromaticAberration}
                    propertyKey="aberrationAmount"
                    propertyPath="chromaticAberration.aberrationAmount"
                    min={0}
                    step={0.1}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Radial Intensity"
                    target={chromaticAberration}
                    propertyKey="radialIntensity"
                    propertyPath="chromaticAberration.radialIntensity"
                    min={0}
                    step={0.01}
                />
                <BoundProperty
                    component={Vector2PropertyLine}
                    label="Center Position"
                    target={chromaticAberration}
                    propertyKey="centerPosition"
                    propertyPath="chromaticAberration.centerPosition"
                />
                <BoundProperty
                    component={Vector2PropertyLine}
                    label="Direction"
                    target={chromaticAberration}
                    propertyKey="direction"
                    propertyPath="chromaticAberration.direction"
                />
            </Collapse>
        </>
    );
};

export const DefaultRenderingPipelineDepthOfFieldProperties: FunctionComponent<{ pipeline: DefaultRenderingPipeline }> = (props) => {
    const { pipeline } = props;
    const depthOfFieldEnabled = useProperty(pipeline, "depthOfFieldEnabled");
    const depthOfField = pipeline.depthOfField;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Depth of Field Enabled" target={pipeline} propertyKey="depthOfFieldEnabled" />
            <Collapse visible={!!depthOfFieldEnabled && !!depthOfField}>
                <BoundProperty
                    component={NumberDropdownPropertyLine}
                    label="Blur Level"
                    target={pipeline}
                    propertyKey="depthOfFieldBlurLevel"
                    options={DepthOfFieldBlurLevelOptions}
                />
                <BoundProperty
                    component={NumberInputPropertyLine}
                    label="Focal Length"
                    target={depthOfField}
                    propertyKey="focalLength"
                    propertyPath="depthOfField.focalLength"
                    min={0}
                    step={0.1}
                />
                <BoundProperty component={SyncedSliderPropertyLine} label="F-Stop" target={depthOfField} propertyKey="fStop" propertyPath="depthOfField.fStop" min={0} step={0.1} />
                <BoundProperty
                    component={NumberInputPropertyLine}
                    label="Focus Distance"
                    target={depthOfField}
                    propertyKey="focusDistance"
                    propertyPath="depthOfField.focusDistance"
                    min={0}
                    step={0.1}
                />
                <BoundProperty
                    component={NumberInputPropertyLine}
                    label="Lens Size"
                    target={depthOfField}
                    propertyKey="lensSize"
                    propertyPath="depthOfField.lensSize"
                    min={0}
                    step={1}
                />
            </Collapse>
        </>
    );
};

export const DefaultRenderingPipelineFxaaGlowProperties: FunctionComponent<{ pipeline: DefaultRenderingPipeline }> = (props) => {
    const { pipeline } = props;
    const glowLayerEnabled = useProperty(pipeline, "glowLayerEnabled");
    const glowLayer = pipeline.glowLayer;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="FXAA Enabled" target={pipeline} propertyKey="fxaaEnabled" />
            <BoundProperty component={SwitchPropertyLine} label="Glow Layer Enabled" target={pipeline} propertyKey="glowLayerEnabled" />
            <Collapse visible={!!glowLayerEnabled && !!glowLayer}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Blur Kernel Size"
                    target={glowLayer}
                    propertyKey="blurKernelSize"
                    propertyPath="glowLayer.blurKernelSize"
                    min={1}
                    step={1}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={glowLayer}
                    propertyKey="intensity"
                    propertyPath="glowLayer.intensity"
                    min={0}
                    step={0.1}
                />
            </Collapse>
        </>
    );
};

export const DefaultRenderingPipelineGrainProperties: FunctionComponent<{ pipeline: DefaultRenderingPipeline }> = (props) => {
    const { pipeline } = props;
    const grainEnabled = useProperty(pipeline, "grainEnabled");
    const grain = pipeline.grain;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Grain Enabled" target={pipeline} propertyKey="grainEnabled" />
            <Collapse visible={!!grainEnabled && !!grain}>
                <BoundProperty component={SwitchPropertyLine} label="Animated" target={grain} propertyKey="animated" propertyPath="grain.animated" />
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={grain} propertyKey="intensity" propertyPath="grain.intensity" min={0} step={0.1} />
            </Collapse>
        </>
    );
};

export const DefaultRenderingPipelineImageProcessingProperties: FunctionComponent<{ pipeline: DefaultRenderingPipeline }> = (props) => {
    const { pipeline } = props;
    const imageProcessingEnabled = useProperty(pipeline, "imageProcessingEnabled");
    const imageProcessing = pipeline.imageProcessing;

    const vignetteEnabled = useProperty(imageProcessing, "vignetteEnabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Image Processing Enabled" target={pipeline} propertyKey="imageProcessingEnabled" />
            <Collapse visible={!!imageProcessingEnabled && !!imageProcessing}>
                <ButtonLine
                    label="Convert Clear Color to Linear"
                    onClick={() => {
                        pipeline.scene.clearColor = pipeline.scene.clearColor.toLinearSpace(pipeline.scene.getEngine().useExactSrgbConversions);
                    }}
                />
                <ButtonLine
                    label="Convert Clear Color to Gamma"
                    onClick={() => {
                        pipeline.scene.clearColor = pipeline.scene.clearColor.toGammaSpace(pipeline.scene.getEngine().useExactSrgbConversions);
                    }}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Contrast"
                    target={imageProcessing}
                    propertyKey="contrast"
                    propertyPath="imageProcessing.contrast"
                    min={0}
                    step={0.1}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Exposure"
                    target={imageProcessing}
                    propertyKey="exposure"
                    propertyPath="imageProcessing.exposure"
                    min={0}
                    step={0.1}
                />
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Tone Mapping Enabled"
                    target={imageProcessing}
                    propertyKey="toneMappingEnabled"
                    propertyPath="imageProcessing.toneMappingEnabled"
                />
                <BoundProperty
                    component={NumberDropdownPropertyLine}
                    label="Tone Mapping Type"
                    target={imageProcessing}
                    propertyKey="toneMappingType"
                    propertyPath="imageProcessing.toneMappingType"
                    options={ToneMappingTypeOptions}
                />
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Vignette Enabled"
                    target={imageProcessing}
                    propertyKey="vignetteEnabled"
                    propertyPath="imageProcessing.vignetteEnabled"
                />
                <Collapse visible={!!vignetteEnabled}>
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Vignette Weight"
                        target={imageProcessing}
                        propertyKey="vignetteWeight"
                        propertyPath="imageProcessing.vignetteWeight"
                        min={0}
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Vignette Stretch"
                        target={imageProcessing}
                        propertyKey="vignetteStretch"
                        propertyPath="imageProcessing.vignetteStretch"
                        min={0}
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Vignette Camera FOV"
                        target={imageProcessing}
                        propertyKey="vignetteCameraFov"
                        propertyPath="imageProcessing.vignetteCameraFov"
                        min={0}
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Vignette Center X"
                        target={imageProcessing}
                        propertyKey="vignetteCenterX"
                        propertyPath="imageProcessing.vignetteCenterX"
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Vignette Center Y"
                        target={imageProcessing}
                        propertyKey="vignetteCenterY"
                        propertyPath="imageProcessing.vignetteCenterY"
                        step={0.1}
                    />
                    <BoundProperty
                        component={Color4PropertyLine}
                        label="Vignette Color"
                        target={imageProcessing}
                        propertyKey="vignetteColor"
                        propertyPath="imageProcessing.vignetteColor"
                    />
                    <BoundProperty
                        component={NumberDropdownPropertyLine}
                        label="Vignette Blend Mode"
                        target={imageProcessing}
                        propertyKey="vignetteBlendMode"
                        propertyPath="imageProcessing.vignetteBlendMode"
                        options={VignetteBlendModeOptions}
                    />
                </Collapse>
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Dithering Enabled"
                    target={imageProcessing}
                    propertyKey="ditheringEnabled"
                    propertyPath="imageProcessing.ditheringEnabled"
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Dithering Intensity"
                    target={imageProcessing}
                    propertyKey="ditheringIntensity"
                    propertyPath="imageProcessing.ditheringIntensity"
                    min={0}
                    step={0.5 / 255}
                />
            </Collapse>
        </>
    );
};

export const DefaultRenderingPipelineSharpenProperties: FunctionComponent<{ pipeline: DefaultRenderingPipeline }> = (props) => {
    const { pipeline } = props;
    const sharpenEnabled = useProperty(pipeline, "sharpenEnabled");
    const sharpen = pipeline.sharpen;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Sharpen Enabled" target={pipeline} propertyKey="sharpenEnabled" />
            <Collapse visible={!!sharpenEnabled && !!sharpen}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Color Amount"
                    target={sharpen}
                    propertyKey="colorAmount"
                    propertyPath="sharpen.colorAmount"
                    min={0}
                    step={0.05}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Edge Amount"
                    target={sharpen}
                    propertyKey="edgeAmount"
                    propertyPath="sharpen.edgeAmount"
                    min={0}
                    step={0.05}
                />
            </Collapse>
        </>
    );
};
