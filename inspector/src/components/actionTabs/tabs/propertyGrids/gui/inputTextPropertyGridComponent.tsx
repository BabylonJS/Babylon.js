import * as React from "react";
import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { InputText } from "babylonjs-gui";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";

interface IInputTextPropertyGridComponentProps {
    inputText: InputText,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
    constructor(props: IInputTextPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const inputText = this.props.inputText;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent control={inputText} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="INPUTTEXT">
                    <TextInputLineComponent label="Text" target={inputText} propertyName="text" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent label="Prompt" target={inputText} propertyName="promptMessage" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent label="Max width" target={inputText} propertyName="maxWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent label="Highlight color" target={inputText} propertyName="textHighlightColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Highligher opacity" minimum={0} maximum={1} step={0.01} target={inputText} propertyName="highligherOpacity" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="On focus select all" target={inputText} propertyName="onFocusSelectAll" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent label="Focused background" target={inputText} propertyName="focusedBackground" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent label="Max width" target={inputText} propertyName="maxWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent label="Margin" target={inputText} propertyName="margin" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Auto stretch width" target={inputText} propertyName="autoStretchWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="Thickness" target={inputText} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent label="Placeholder text" target={inputText} propertyName="placeholderText" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent label="Placeholder color" target={inputText} propertyName="placeholderColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}