import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { SSRRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssrRenderingPipeline";
import type { GlobalState } from "../../../../globalState";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";

interface ISSRRenderingPipelinePropertyGridComponentProps {
    globalState: GlobalState;
    renderPipeline: SSRRenderingPipeline;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class SSRRenderingPipelinePropertyGridComponent extends React.Component<ISSRRenderingPipelinePropertyGridComponentProps> {
    constructor(props: ISSRRenderingPipelinePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const renderPipeline = this.props.renderPipeline;

        return (
            <>
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="Name" value={renderPipeline.name} />
                    <TextLineComponent label="Class" value={renderPipeline.getClassName()} />
                </LineContainerComponent>
                <LineContainerComponent title="SSR" selection={this.props.globalState}>
                    <CheckBoxLineComponent label="Enabled" target={renderPipeline} propertyName="isEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Debug" target={renderPipeline} propertyName="debug" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Strength"
                        minimum={0}
                        maximum={5}
                        step={0.05}
                        target={renderPipeline}
                        propertyName="strength"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Reflection exponent"
                        minimum={0}
                        maximum={5}
                        step={0.05}
                        target={renderPipeline}
                        propertyName="reflectionSpecularFalloffExponent"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Reflectivity threshold"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        target={renderPipeline}
                        propertyName="reflectivityThreshold"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Thickness"
                        minimum={0}
                        maximum={10}
                        step={0.01}
                        target={renderPipeline}
                        propertyName="thickness"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Step"
                        minimum={1}
                        maximum={50}
                        step={1}
                        target={renderPipeline}
                        propertyName="step"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Smooth reflections"
                        target={renderPipeline}
                        propertyName="enableSmoothReflections"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Max steps"
                        minimum={1}
                        maximum={3000}
                        step={10}
                        target={renderPipeline}
                        propertyName="maxSteps"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Max distance"
                        minimum={1}
                        maximum={3000}
                        step={10}
                        target={renderPipeline}
                        propertyName="maxDistance"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Roughness factor"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        target={renderPipeline}
                        propertyName="roughnessFactor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Self collision skips"
                        minimum={1}
                        maximum={10}
                        step={1}
                        target={renderPipeline}
                        propertyName="selfCollisionNumSkip"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="SSR downsample"
                        minimum={0}
                        maximum={5}
                        step={1}
                        target={renderPipeline}
                        propertyName="ssrDownsample"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Clip to frustum"
                        target={renderPipeline}
                        propertyName="clipToFrustum"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <LineContainerComponent title="Automatic thickness computation" selection={this.props.globalState}>
                        <CheckBoxLineComponent
                            label="Enabled"
                            target={renderPipeline}
                            propertyName="enableAutomaticThicknessComputation"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Force write transparent"
                            target={renderPipeline}
                            propertyName="backfaceForceDepthWriteTransparentMeshes"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Downsample"
                            minimum={0}
                            maximum={5}
                            step={1}
                            target={renderPipeline}
                            propertyName="backfaceDepthTextureDownsample"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </LineContainerComponent>
                    <LineContainerComponent title="Blur" selection={this.props.globalState}>
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Strength"
                            minimum={0}
                            maximum={0.15}
                            step={0.001}
                            target={renderPipeline}
                            propertyName="blurDispersionStrength"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Downsample"
                            minimum={0}
                            maximum={5}
                            step={1}
                            target={renderPipeline}
                            propertyName="blurDownsample"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </LineContainerComponent>
                    <LineContainerComponent title="Attenuations" selection={this.props.globalState}>
                        <CheckBoxLineComponent
                            label="Screen borders"
                            target={renderPipeline}
                            propertyName="attenuateScreenBorders"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Distance"
                            target={renderPipeline}
                            propertyName="attenuateIntersectionDistance"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Step iterations"
                            target={renderPipeline}
                            propertyName="attenuateIntersectionIterations"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Facing camera"
                            target={renderPipeline}
                            propertyName="attenuateFacingCamera"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Backface reflections"
                            target={renderPipeline}
                            propertyName="attenuateBackfaceReflection"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </LineContainerComponent>
                    <LineContainerComponent title="Environment" selection={this.props.globalState}>
                        <TextureLinkLineComponent
                            label="Cube"
                            texture={renderPipeline.environmentTexture}
                            propertyName="environmentTexture"
                            texturedObject={renderPipeline}
                            fileFormats=".dds"
                            cubeOnly={true}
                        />
                        <CheckBoxLineComponent
                            label="Is probe"
                            target={renderPipeline}
                            propertyName="environmentTextureIsProbe"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </LineContainerComponent>
                    <LineContainerComponent title="Color space" selection={this.props.globalState}>
                        <CheckBoxLineComponent
                            label="Input is in gamma space"
                            target={renderPipeline}
                            propertyName="inputTextureColorIsInGammaSpace"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Output to gamma space"
                            target={renderPipeline}
                            propertyName="generateOutputInGammaSpace"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </LineContainerComponent>
                </LineContainerComponent>
            </>
        );
    }
}
