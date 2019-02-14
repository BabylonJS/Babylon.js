import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { LockObject } from "../lockObject";
import { PostProcess } from 'babylonjs/PostProcesses/postProcess';
import { Color3LineComponent } from '../../../lines/color3LineComponent';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';
import { GlobalState } from '../../../../globalState';

interface ICommonPostProcessPropertyGridComponentProps {
    globalState: GlobalState;
    postProcess: PostProcess;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonPostProcessPropertyGridComponent extends React.Component<ICommonPostProcessPropertyGridComponentProps> {
    constructor(props: ICommonPostProcessPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const postProcess = this.props.postProcess;

        return (
            <div>
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="Class" value={postProcess.getClassName()} />
                    <TextLineComponent label="Width" value={postProcess.width.toString()} />
                    <TextLineComponent label="Height" value={postProcess.height.toString()} />
                    <CheckBoxLineComponent label="Auto clear" target={postProcess} propertyName="autoClear" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        postProcess.clearColor &&
                        <Color3LineComponent label="Clear color" target={postProcess} propertyName="clearColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <CheckBoxLineComponent label="Pixel perfect" target={postProcess} propertyName="enablePixelPerfectMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Fullscreen viewport" target={postProcess} propertyName="forceFullscreenViewport" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Samples" target={postProcess} propertyName="samples" minimum={1} maximum={8} step={1} decimalCount={0} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}