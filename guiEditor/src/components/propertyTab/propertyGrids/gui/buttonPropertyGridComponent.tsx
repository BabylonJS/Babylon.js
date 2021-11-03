import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { CommandButtonComponent } from "../../../commandButtonComponent";

const conerRadiusIcon: string = require("../../../../sharedUiComponents/imgs/conerRadiusIcon.svg");
const clipContentsIcon: string = require("../../../../sharedUiComponents/imgs/clipContentsIcon.svg");
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");
const addImageButtonIcon: string = require("../../../../sharedUiComponents/imgs/addImageButtonIcon.svg");
const addTextButtonIcon: string = require("../../../../sharedUiComponents/imgs/addTextButtonIcon.svg");

interface IButtonPropertyGridComponentProps {
    rectangle: Rectangle,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
    onAddComponent: (newComponent: string) => void;
}

export class ButtonPropertyGridComponent extends React.Component<IButtonPropertyGridComponentProps> {
    constructor(props: IButtonPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const rectangle = this.props.rectangle;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={rectangle} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="RECTANGLE" value=" " color="grey"></TextLineComponent>
                <CheckBoxLineComponent iconLabel="Clip Content" icon={clipContentsIcon} label="" target={rectangle} propertyName="clipChildren" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <div className="ge-divider">
                    <FloatLineComponent iconLabel="Stroke Weight" icon={strokeWeightIcon} lockObject={this.props.lockObject} label="" target={rectangle} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent iconLabel="Corner Radius" icon={conerRadiusIcon} lockObject={this.props.lockObject} label="" target={rectangle} propertyName="cornerRadius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <hr />
                <TextLineComponent label="BUTTON" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <CommandButtonComponent tooltip="Add TextBlock" icon={addTextButtonIcon} shortcut="" isActive={false}
                        onClick={() => {
                            this.props.onAddComponent("Text");
                        }} />
                    <CommandButtonComponent tooltip="Add Image" icon={addImageButtonIcon} shortcut="" isActive={false}
                        onClick={() => {
                            this.props.onAddComponent("ButtonImage");
                        }} />
                </div>
            </div>
        );
    }
}