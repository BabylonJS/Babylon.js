import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { CommonRenderingPipelinePropertyGridComponent } from "./commonRenderingPipelinePropertyGridComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { SSAORenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline";
import type { GlobalState } from "../../../../globalState";

interface ISSAORenderingPipelinePropertyGridComponentProps {
    globalState: GlobalState;
    renderPipeline: SSAORenderingPipeline;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class SSAORenderingPipelinePropertyGridComponent extends React.Component<ISSAORenderingPipelinePropertyGridComponentProps> {
    constructor(props: ISSAORenderingPipelinePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const renderPipeline = this.props.renderPipeline;

        return (
            <div className="pane">
                <CommonRenderingPipelinePropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    renderPipeline={renderPipeline}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="SSAO" selection={this.props.globalState}>
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Strength"
                        minimum={0}
                        maximum={2}
                        step={0.05}
                        target={renderPipeline}
                        propertyName="totalStrength"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Base"
                        minimum={0}
                        maximum={1}
                        step={0.05}
                        target={renderPipeline}
                        propertyName="base"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Radius"
                        minimum={0.0001}
                        maximum={0.001}
                        step={0.0001}
                        target={renderPipeline}
                        propertyName="radius"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        decimalCount={4}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Area"
                        minimum={0.0001}
                        maximum={0.01}
                        step={0.0001}
                        target={renderPipeline}
                        propertyName="area"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        decimalCount={4}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Falloff"
                        minimum={0}
                        maximum={0.00001}
                        step={0.000001}
                        target={renderPipeline}
                        propertyName="fallOff"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        decimalCount={6}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
