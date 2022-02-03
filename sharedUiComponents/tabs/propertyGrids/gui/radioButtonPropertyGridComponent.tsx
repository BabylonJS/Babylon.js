import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../../../tabs/propertyGrids/gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../tabs/propertyGrids/lockObject";
import { RadioButton } from "babylonjs-gui/2D/controls/radioButton";
import { LineContainerComponent } from "../../../lines/lineContainerComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { makeTargetsProxy } from "../../../lines/targetsProxy";

interface IRadioButtonPropertyGridComponentProps {
    radioButtons: RadioButton[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class RadioButtonPropertyGridComponent extends React.Component<IRadioButtonPropertyGridComponentProps> {
    constructor(props: IRadioButtonPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const radioButtons = this.props.radioButtons;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={radioButtons} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="RADIO BUTTON">
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Thickness"
                        target={makeTargetsProxy(radioButtons, 1, this.props.onPropertyChangedObservable)}
                        propertyName="thickness"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Check size ratio"
                        target={makeTargetsProxy(radioButtons, 0.8, this.props.onPropertyChangedObservable)}
                        propertyName="checkSizeRatio"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Group"
                        target={makeTargetsProxy(radioButtons, "", this.props.onPropertyChangedObservable)}
                        propertyName="group"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent label="Checked" target={makeTargetsProxy(radioButtons, false, this.props.onPropertyChangedObservable)} propertyName="isChecked" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}
