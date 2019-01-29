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

interface ICommonPostProcessPropertyGridComponentProps {
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
                <LineContainerComponent title="GENERAL">
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
                    <SliderLineComponent label="Samples" target={postProcess} propertyName="samples" minimum={1} maximum={8} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {/* <CheckBoxLineComponent label="Backface culling" target={material} propertyName="backFaceCulling" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <OptionsLineComponent label="Orientation" options={orientationOptions} target={material} propertyName="sideOrientation" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => this.setState({ mode: value })} />
x                    <CheckBoxLineComponent label="Disable depth write" target={material} propertyName="disableDepthWrite" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Need depth pre-pass" target={material} propertyName="needDepthPrePass" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Wireframe" target={material} propertyName="wireframe" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Point cloud" target={material} propertyName="pointsCloud" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Point size" target={material} propertyName="pointSize" minimum={0} maximum={100} step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Z-offset" target={material} propertyName="zOffset" minimum={-10} maximum={10} step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} /> */}
                </LineContainerComponent>
            </div>
        );
    }
}