import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../../../tabs/propertyGrids/gui/commonControlPropertyGridComponent";
import { InputText } from "babylonjs-gui/2D/controls/inputText";
import { LineContainerComponent } from "../../../lines/lineContainerComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { LockObject } from "../../../tabs/propertyGrids/lockObject";

interface IInputTextPropertyGridComponentProps {
    inputText: InputText;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
    constructor(props: IInputTextPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const inputText = this.props.inputText;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent  lockObject={this.props.lockObject} control={inputText} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="INPUTTEXT">
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Text" target={inputText} propertyName="text" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Prompt" target={inputText} propertyName="promptMessage" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Max width" target={inputText} propertyName="maxWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Highlight color" target={inputText} propertyName="textHighlightColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Highligher opacity" minimum={0} maximum={1} step={0.01} target={inputText} propertyName="highligherOpacity" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="On focus select all" target={inputText} propertyName="onFocusSelectAll" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Focused background" target={inputText} propertyName="focusedBackground" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Max width" target={inputText} propertyName="maxWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Margin" target={inputText} propertyName="margin" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Auto stretch width" target={inputText} propertyName="autoStretchWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Thickness" target={inputText} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Placeholder text" target={inputText} propertyName="placeholderText" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Placeholder color" target={inputText} propertyName="placeholderColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}