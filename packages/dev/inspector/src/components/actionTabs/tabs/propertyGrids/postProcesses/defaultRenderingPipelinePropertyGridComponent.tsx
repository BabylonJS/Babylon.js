import * as React from "react";

import type { Observable } from "core/Misc/observable";
import type { DefaultRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { CommonRenderingPipelinePropertyGridComponent } from "./commonRenderingPipelinePropertyGridComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import type { GlobalState } from "../../../../globalState";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";

interface IDefaultRenderingPipelinePropertyGridComponentProps {
    globalState: GlobalState;
    renderPipeline: DefaultRenderingPipeline;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class DefaultRenderingPipelinePropertyGridComponent extends React.Component<IDefaultRenderingPipelinePropertyGridComponentProps> {
    constructor(props: IDefaultRenderingPipelinePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const renderPipeline = this.props.renderPipeline;

        const camera = renderPipeline.scene.activeCamera!;

        const toneMappingOptions = [
            { label: "Standard", value: ImageProcessingConfiguration.TONEMAPPING_STANDARD },
            { label: "ACES", value: ImageProcessingConfiguration.TONEMAPPING_ACES },
        ];

        const vignetteModeOptions = [
            { label: "Multiply", value: ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY },
            { label: "Opaque", value: ImageProcessingConfiguration.VIGNETTEMODE_OPAQUE },
        ];

        return (
            <div className="pane">
                <CommonRenderingPipelinePropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    renderPipeline={renderPipeline}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="BLOOM" selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Enabled"
                        target={renderPipeline}
                        onValueChanged={() => this.forceUpdate()}
                        propertyName="bloomEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {renderPipeline.bloomEnabled && (
                        <div>
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Threshold"
                                minimum={0}
                                maximum={2.0}
                                step={0.01}
                                target={renderPipeline}
                                propertyName="bloomThreshold"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Weight"
                                minimum={0}
                                maximum={1}
                                step={0.05}
                                target={renderPipeline}
                                propertyName="bloomWeight"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Kernel"
                                minimum={0}
                                maximum={128}
                                step={1}
                                target={renderPipeline}
                                propertyName="bloomKernel"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                decimalCount={0}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Scale"
                                minimum={0}
                                maximum={1}
                                step={0.25}
                                target={renderPipeline}
                                propertyName="bloomScale"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </div>
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="CHROMATIC ABERRATION" selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Enabled"
                        target={renderPipeline}
                        onValueChanged={() => this.forceUpdate()}
                        propertyName="chromaticAberrationEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {renderPipeline.chromaticAberrationEnabled && (
                        <div>
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="aberrationAmount"
                                minimum={0}
                                maximum={128}
                                step={0.1}
                                target={renderPipeline.chromaticAberration}
                                propertyName="aberrationAmount"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Radial intensity"
                                minimum={0}
                                maximum={1}
                                step={0.01}
                                target={renderPipeline.chromaticAberration}
                                propertyName="radialIntensity"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <Vector2LineComponent
                                lockObject={this.props.lockObject}
                                label="Center"
                                target={renderPipeline.chromaticAberration}
                                propertyName="centerPosition"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <Vector2LineComponent
                                lockObject={this.props.lockObject}
                                label="Direction"
                                target={renderPipeline.chromaticAberration}
                                propertyName="direction"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </div>
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="DEPTH OF FIELD" selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Enabled"
                        target={renderPipeline}
                        onValueChanged={() => this.forceUpdate()}
                        propertyName="depthOfFieldEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {renderPipeline.depthOfFieldEnabled && (
                        <div>
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Focal length"
                                minimum={0}
                                maximum={camera.maxZ}
                                step={0.1}
                                target={renderPipeline.depthOfField}
                                propertyName="focalLength"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="fStop"
                                minimum={0}
                                maximum={32}
                                step={0.1}
                                target={renderPipeline.depthOfField}
                                propertyName="fStop"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Distance"
                                minimum={0}
                                maximum={camera.maxZ}
                                step={0.1}
                                target={renderPipeline.depthOfField}
                                propertyName="focusDistance"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Lens size"
                                minimum={0}
                                maximum={1000}
                                step={1}
                                target={renderPipeline.depthOfField}
                                propertyName="lensSize"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                decimalCount={0}
                            />
                        </div>
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="FXAA" selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Enabled"
                        target={renderPipeline}
                        propertyName="fxaaEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="GLOW LAYER" selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Enabled"
                        target={renderPipeline}
                        propertyName="glowLayerEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {renderPipeline.glowLayerEnabled && (
                        <div>
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Blur kernel size"
                                minimum={1}
                                maximum={128}
                                step={1}
                                decimalCount={0}
                                target={renderPipeline.glowLayer}
                                propertyName="blurKernelSize"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Intensity"
                                minimum={0}
                                maximum={10}
                                step={0.1}
                                target={renderPipeline.glowLayer}
                                propertyName="intensity"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </div>
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="GRAIN" selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Enabled"
                        target={renderPipeline}
                        onValueChanged={() => this.forceUpdate()}
                        propertyName="grainEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {renderPipeline.grainEnabled && (
                        <div>
                            <CheckBoxLineComponent
                                label="Animated"
                                target={renderPipeline.grain}
                                propertyName="animated"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Intensity"
                                minimum={0}
                                maximum={50}
                                step={0.1}
                                target={renderPipeline.grain}
                                propertyName="intensity"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </div>
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="IMAGE PROCESSING" selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Enabled"
                        target={renderPipeline}
                        onValueChanged={() => this.forceUpdate()}
                        propertyName="imageProcessingEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {renderPipeline.imageProcessing && (
                        <div>
                            <ButtonLineComponent
                                label="Convert clear color to linear"
                                onClick={() => (renderPipeline.scene.clearColor = renderPipeline.scene.clearColor.toLinearSpace())}
                            />
                            <ButtonLineComponent
                                label="Convert clear color to gamma"
                                onClick={() => (renderPipeline.scene.clearColor = renderPipeline.scene.clearColor.toGammaSpace())}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                minimum={0}
                                maximum={4}
                                step={0.1}
                                label="Contrast"
                                target={renderPipeline.imageProcessing}
                                propertyName="contrast"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                minimum={0}
                                maximum={4}
                                step={0.1}
                                label="Exposure"
                                target={renderPipeline.imageProcessing}
                                propertyName="exposure"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <CheckBoxLineComponent
                                label="Tone mapping"
                                target={renderPipeline.imageProcessing}
                                propertyName="toneMappingEnabled"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <OptionsLineComponent
                                label="Tone mapping type"
                                options={toneMappingOptions}
                                target={renderPipeline.imageProcessing}
                                propertyName="toneMappingType"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onSelect={(value) => this.setState({ mode: value })}
                            />
                            <CheckBoxLineComponent
                                label="Vignette"
                                target={renderPipeline.imageProcessing}
                                propertyName="vignetteEnabled"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                minimum={0}
                                maximum={4}
                                step={0.1}
                                label="Vignette weight"
                                target={renderPipeline.imageProcessing}
                                propertyName="vignetteWeight"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                minimum={0}
                                maximum={1}
                                step={0.1}
                                label="Vignette stretch"
                                target={renderPipeline.imageProcessing}
                                propertyName="vignetteStretch"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                minimum={0}
                                maximum={Math.PI}
                                step={0.1}
                                label="Vignette FOV"
                                target={renderPipeline.imageProcessing}
                                propertyName="vignetteCameraFov"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                minimum={0}
                                maximum={1}
                                step={0.1}
                                label="Vignette center X"
                                target={renderPipeline.imageProcessing}
                                propertyName="vignetteCentreX"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                minimum={0}
                                maximum={1}
                                step={0.1}
                                label="Vignette center Y"
                                target={renderPipeline.imageProcessing}
                                propertyName="vignetteCentreY"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <Color3LineComponent
                                lockObject={this.props.lockObject}
                                label="Vignette color"
                                target={renderPipeline.imageProcessing}
                                propertyName="vignetteColor"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <OptionsLineComponent
                                label="Vignette blend mode"
                                options={vignetteModeOptions}
                                target={renderPipeline.imageProcessing}
                                propertyName="vignetteBlendMode"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onSelect={(value) => this.setState({ mode: value })}
                            />
                            <CheckBoxLineComponent
                                label="Dithering"
                                target={renderPipeline.imageProcessing}
                                propertyName="ditheringEnabled"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                minimum={0}
                                maximum={1}
                                step={0.5 / 255.0}
                                label="Dithering intensity"
                                target={renderPipeline.imageProcessing}
                                propertyName="ditheringIntensity"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </div>
                    )}
                </LineContainerComponent>
                <LineContainerComponent title="SHARPEN" selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Enabled"
                        target={renderPipeline}
                        onValueChanged={() => this.forceUpdate()}
                        propertyName="sharpenEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {renderPipeline.sharpenEnabled && (
                        <div>
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Color amount"
                                minimum={0}
                                maximum={1}
                                step={0.05}
                                target={renderPipeline.sharpen}
                                propertyName="colorAmount"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Edge amount"
                                minimum={0}
                                maximum={5}
                                step={0.05}
                                target={renderPipeline.sharpen}
                                propertyName="edgeAmount"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </div>
                    )}
                </LineContainerComponent>
            </div>
        );
    }
}
