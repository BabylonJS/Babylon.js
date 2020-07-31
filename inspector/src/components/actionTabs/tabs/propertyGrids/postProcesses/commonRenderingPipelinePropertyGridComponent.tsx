import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { LockObject } from "../lockObject";
import { PostProcessRenderPipeline } from 'babylonjs/PostProcesses/RenderPipeline/postProcessRenderPipeline';
import { GlobalState } from '../../../../globalState';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';

interface ICommonRenderingPipelinePropertyGridComponentProps {
    globalState: GlobalState;
    renderPipeline: PostProcessRenderPipeline;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonRenderingPipelinePropertyGridComponent extends React.Component<ICommonRenderingPipelinePropertyGridComponentProps> {
    constructor(props: ICommonRenderingPipelinePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const renderPipeline = this.props.renderPipeline;
        const renderPipelineAsAny = renderPipeline as any;

        return (
            <div>
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="Name" value={renderPipeline.name} />
                    <TextLineComponent label="Class" value={renderPipeline.getClassName()} />
                    {
                        renderPipelineAsAny.samples !== undefined &&
                        <SliderLineComponent label="Samples" minimum={1} maximum={8} step={1} decimalCount={0} target={renderPipeline} propertyName="samples" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                </LineContainerComponent>
            </div>
        );
    }
}