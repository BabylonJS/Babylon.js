import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "../lockObject";
import { CommonRenderingPipelinePropertyGridComponent } from './commonRenderingPipelinePropertyGridComponent';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';
import { LineContainerComponent } from '../../../lineContainerComponent';
import { SSAO2RenderingPipeline } from 'babylonjs/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline';

interface ISSAO2RenderingPipelinePropertyGridComponentProps {
    renderPipeline: SSAO2RenderingPipeline,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class SSAO2RenderingPipelinePropertyGridComponent extends React.Component<ISSAO2RenderingPipelinePropertyGridComponentProps> {
    constructor(props: ISSAO2RenderingPipelinePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const renderPipeline = this.props.renderPipeline;

        const camera = renderPipeline.scene.activeCamera!;

        return (
            <div className="pane">
                <CommonRenderingPipelinePropertyGridComponent lockObject={this.props.lockObject} renderPipeline={renderPipeline} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="SSAO">
                    <SliderLineComponent label="Strength" minimum={0} maximum={2} step={0.05} target={renderPipeline} propertyName="totalStrength" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Base" minimum={0} maximum={1} step={0.05} target={renderPipeline} propertyName="base" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Max Z" minimum={0} maximum={camera.maxZ} step={1} target={renderPipeline} propertyName="maxZ" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Min Z aspect" minimum={0} maximum={0.5} step={0.01} target={renderPipeline} propertyName="minZAspect" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Radius" minimum={0} maximum={10} step={0.05} target={renderPipeline} propertyName="radius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}