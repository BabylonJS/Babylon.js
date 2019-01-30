import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { DefaultRenderingPipeline } from "babylonjs/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "../lockObject";
import { CommonRenderingPipelinePropertyGridComponent } from './commonRenderingPipelinePropertyGridComponent';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';
import { LineContainerComponent } from '../../../lineContainerComponent';
import { CheckBoxLineComponent } from '../../../lines/checkBoxLineComponent';
import { Vector2LineComponent } from '../../../lines/vector2LineComponent';

interface IDefaultRenderingPipelinePropertyGridComponentProps {
    renderPipeline: DefaultRenderingPipeline,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class DefaultRenderingPipelinePropertyGridComponent extends React.Component<IDefaultRenderingPipelinePropertyGridComponentProps> {
    constructor(props: IDefaultRenderingPipelinePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const renderPipeline = this.props.renderPipeline;

        const camera = renderPipeline.scene.activeCamera!;

        return (
            <div className="pane">
                <CommonRenderingPipelinePropertyGridComponent lockObject={this.props.lockObject} renderPipeline={renderPipeline} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="BLOOM">
                    <CheckBoxLineComponent label="Enabled" target={renderPipeline} propertyName="bloomEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Threshold" minimum={0} maximum={1} step={0.05} target={renderPipeline} propertyName="bloomThreshold" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Weight" minimum={0} maximum={1} step={0.05} target={renderPipeline} propertyName="bloomWeight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Kernel" minimum={0} maximum={1} step={0.05} target={renderPipeline} propertyName="bloomKernel" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Scale" minimum={0} maximum={1} step={0.25} target={renderPipeline} propertyName="bloomScale" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent title="CHROMATIC ABERRATION">
                    <CheckBoxLineComponent label="Enabled" target={renderPipeline} propertyName="chromaticAberrationEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="aberrationAmount" minimum={0} maximum={128} step={0.1} target={renderPipeline.chromaticAberration} propertyName="aberrationAmount" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Radial intensity" minimum={0} maximum={10} step={0.1} target={renderPipeline.chromaticAberration} propertyName="radialIntensity" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector2LineComponent label="Center" target={renderPipeline.chromaticAberration} propertyName="centerPosition" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Vector2LineComponent label="Direction" target={renderPipeline.chromaticAberration} propertyName="direction" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent title="DEPTH OF FIELD">
                    <CheckBoxLineComponent label="Enabled" target={renderPipeline} propertyName="depthOfFieldEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Focal length" minimum={0} maximum={camera.maxZ} step={0.1} target={renderPipeline.depthOfField} propertyName="focalLength" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="fStop" minimum={0} maximum={32} step={0.1} target={renderPipeline.depthOfField} propertyName="fStop" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Focus distance" minimum={0} maximum={camera.maxZ} step={0.1} target={renderPipeline.depthOfField} propertyName="focusDistance" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent title="FXAA">
                    <CheckBoxLineComponent label="Enabled" target={renderPipeline} propertyName="fxaaEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent title="GLOW LAYER">
                    <CheckBoxLineComponent label="Enabled" target={renderPipeline} propertyName="glowLayerEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent title="GRAIN">
                    <CheckBoxLineComponent label="Enabled" target={renderPipeline} propertyName="grainEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Animated" target={renderPipeline.grain} propertyName="animated" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Intensity" minimum={0} maximum={50} step={0.1} target={renderPipeline.grain} propertyName="intensity" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent title="IMAGE PROCESSING">
                </LineContainerComponent>
                <LineContainerComponent title="SHARPEN">
                    <CheckBoxLineComponent label="Enabled" target={renderPipeline} propertyName="sharpenEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Color amount" minimum={0} maximum={1} step={0.05} target={renderPipeline.sharpen} propertyName="colorAmount" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Edge amount" minimum={0} maximum={1} step={0.05} target={renderPipeline.sharpen} propertyName="edgeAmount" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}