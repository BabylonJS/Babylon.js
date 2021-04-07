import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { LensRenderingPipeline } from "babylonjs/PostProcesses/RenderPipeline/Pipelines/lensRenderingPipeline";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "../../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { CommonRenderingPipelinePropertyGridComponent } from './commonRenderingPipelinePropertyGridComponent';
import { SliderLineComponent } from '../../../../../sharedUiComponents/lines/sliderLineComponent';
import { LineContainerComponent } from '../../../../../sharedUiComponents/lines/lineContainerComponent';
import { CheckBoxLineComponent } from '../../../../../sharedUiComponents/lines/checkBoxLineComponent';
import { GlobalState } from '../../../../globalState';

interface ILenstRenderingPipelinePropertyGridComponentProps {
    globalState: GlobalState;
    renderPipeline: LensRenderingPipeline,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class LensRenderingPipelinePropertyGridComponent extends React.Component<ILenstRenderingPipelinePropertyGridComponentProps> {
    constructor(props: ILenstRenderingPipelinePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const renderPipeline = this.props.renderPipeline;

        return (
            <div className="pane">
                <CommonRenderingPipelinePropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} renderPipeline={renderPipeline} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="OPTIONS" selection={this.props.globalState}>
                    <SliderLineComponent label="Edge blur" minimum={0} maximum={5} step={0.1} target={renderPipeline} propertyName="edgeBlur" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Edge distortion" minimum={0} maximum={5} step={0.1} target={renderPipeline} propertyName="edgeDistortion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Grain amount" minimum={0} maximum={1} step={0.1} target={renderPipeline} propertyName="grainAmount" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Chromatic aberration" minimum={0} maximum={5} step={0.1} target={renderPipeline} propertyName="chromaticAberration" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Darken out of focus" minimum={0} maximum={5} step={0.1} target={renderPipeline} propertyName="darkenOutOfFocus" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Blur noise" target={renderPipeline} propertyName="blurNoise" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent title="DEPTH OF FIELD" selection={this.props.globalState}>
                    <SliderLineComponent label="Aperture" minimum={0} maximum={10} step={0.1} target={renderPipeline} propertyName="dofAperture" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Distortion" minimum={0} maximum={1000} step={0.1} target={renderPipeline} propertyName="dofDistortion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Pentagon bokeh" target={renderPipeline} propertyName="pentagonBokeh" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Highlight gain" minimum={0} maximum={5} step={0.1} target={renderPipeline} propertyName="highlightsGain" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Highlight threshold" minimum={0} maximum={5} step={0.1} target={renderPipeline} propertyName="highlightsThreshold" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}
