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
                <BoundProperty component={SyncedSliderPropertyLine} label="Threshold" target={pipeline} propertyKey="bloomThreshold" min={0} max={2} step={0.01} />
                <BoundProperty component={SyncedSliderPropertyLine} label="Weight" target={pipeline} propertyKey="bloomWeight" min={0} max={1} step={0.05} />
                <BoundProperty component={SyncedSliderPropertyLine} label="Kernel" target={pipeline} propertyKey="bloomKernel" min={0} max={128} step={1} />
                <BoundProperty component={SyncedSliderPropertyLine} label="Scale" target={pipeline} propertyKey="bloomScale" min={0} max={1} step={0.25} />
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
                    max={128}
                    step={0.1}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Radial Intensity"
                    target={chromaticAberration}
                    propertyKey="radialIntensity"
                    propertyPath="chromaticAberration.radialIntensity"
                    min={0}
                    max={1}
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
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="F-Stop"
                    target={depthOfField}
                    propertyKey="fStop"
                    propertyPath="depthOfField.fStop"
                    min={0}
                    max={32}
                    step={0.1}
                />
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
                    max={1000}
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
                    max={128}
                    step={1}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={glowLayer}
                    propertyKey="intensity"
                    propertyPath="glowLayer.intensity"
                    min={0}
                    max={10}
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
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={grain}
                    propertyKey="intensity"
                    propertyPath="grain.intensity"
                    min={0}
                    max={50}
                    step={0.1}
                />
            </Collapse>
        </>
    );
};

export const DefaultRenderingPipelineImageProcessingProperties: FunctionComponent<{ pipeline: DefaultRenderingPipeline }> = (props) => {
    const { pipeline } = props;
    const imageProcessingEnabled = useProperty(pipeline, "imageProcessingEnabled");
    const imageProcessing = pipeline.imageProcessing;
    const imageProcessingConfig = imageProcessing?.imageProcessingConfiguration;

    const vignetteEnabled = useProperty(imageProcessingConfig, "vignetteEnabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Image Processing Enabled" target={pipeline} propertyKey="imageProcessingEnabled" />
            <Collapse visible={!!imageProcessingEnabled && !!imageProcessingConfig}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Contrast"
                    target={imageProcessingConfig}
                    propertyKey="contrast"
                    propertyPath="imageProcessing.imageProcessingConfiguration.contrast"
                    min={0}
                    max={4}
                    step={0.1}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Exposure"
                    target={imageProcessingConfig}
                    propertyKey="exposure"
                    propertyPath="imageProcessing.imageProcessingConfiguration.exposure"
                    min={0}
                    max={4}
                    step={0.1}
                />
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Tone Mapping Enabled"
                    target={imageProcessingConfig}
                    propertyKey="toneMappingEnabled"
                    propertyPath="imageProcessing.imageProcessingConfiguration.toneMappingEnabled"
                />
                <BoundProperty
                    component={NumberDropdownPropertyLine}
                    label="Tone Mapping Type"
                    target={imageProcessingConfig}
                    propertyKey="toneMappingType"
                    propertyPath="imageProcessing.imageProcessingConfiguration.toneMappingType"
                    options={ToneMappingTypeOptions}
                />
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Vignette Enabled"
                    target={imageProcessingConfig}
                    propertyKey="vignetteEnabled"
                    propertyPath="imageProcessing.imageProcessingConfiguration.vignetteEnabled"
                />
                <Collapse visible={!!vignetteEnabled}>
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Vignette Weight"
                        target={imageProcessingConfig}
                        propertyKey="vignetteWeight"
                        propertyPath="imageProcessing.imageProcessingConfiguration.vignetteWeight"
                        min={0}
                        max={4}
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Vignette Stretch"
                        target={imageProcessingConfig}
                        propertyKey="vignetteStretch"
                        propertyPath="imageProcessing.imageProcessingConfiguration.vignetteStretch"
                        min={0}
                        max={1}
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Vignette Camera FOV"
                        target={imageProcessingConfig}
                        propertyKey="vignetteCameraFov"
                        propertyPath="imageProcessing.imageProcessingConfiguration.vignetteCameraFov"
                        min={0}
                        max={Math.PI}
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Vignette Center X"
                        target={imageProcessingConfig}
                        propertyKey="vignetteCenterX"
                        propertyPath="imageProcessing.imageProcessingConfiguration.vignetteCenterX"
                        min={0}
                        max={1}
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Vignette Center Y"
                        target={imageProcessingConfig}
                        propertyKey="vignetteCenterY"
                        propertyPath="imageProcessing.imageProcessingConfiguration.vignetteCenterY"
                        min={0}
                        max={1}
                        step={0.1}
                    />
                    <BoundProperty
                        component={Color4PropertyLine}
                        label="Vignette Color"
                        target={imageProcessingConfig}
                        propertyKey="vignetteColor"
                        propertyPath="imageProcessing.imageProcessingConfiguration.vignetteColor"
                    />
                    <BoundProperty
                        component={NumberDropdownPropertyLine}
                        label="Vignette Blend Mode"
                        target={imageProcessingConfig}
                        propertyKey="vignetteBlendMode"
                        propertyPath="imageProcessing.imageProcessingConfiguration.vignetteBlendMode"
                        options={VignetteBlendModeOptions}
                    />
                </Collapse>
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Dithering Enabled"
                    target={imageProcessingConfig}
                    propertyKey="ditheringEnabled"
                    propertyPath="imageProcessing.imageProcessingConfiguration.ditheringEnabled"
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Dithering Intensity"
                    target={imageProcessingConfig}
                    propertyKey="ditheringIntensity"
                    propertyPath="imageProcessing.imageProcessingConfiguration.ditheringIntensity"
                    min={0}
                    max={1}
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
                    max={1}
                    step={0.05}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Edge Amount"
                    target={sharpen}
                    propertyKey="edgeAmount"
                    propertyPath="sharpen.edgeAmount"
                    min={0}
                    max={5}
                    step={0.05}
                />
            </Collapse>
        </>
    );
};
