import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { Color3LineComponent } from "../../../../sharedUiComponents/lines/color3LineComponent";
import { GlobalState } from '../../../globalState';
import { IInspectable, InspectableType } from 'babylonjs/Misc/iInspectable';
import { CheckBoxLineComponent } from '../../../../sharedUiComponents/lines/checkBoxLineComponent';
import { SliderLineComponent } from '../../../../sharedUiComponents/lines/sliderLineComponent';
import { Vector3LineComponent } from '../../../../sharedUiComponents/lines/vector3LineComponent';
import { QuaternionLineComponent } from '../../lines/quaternionLineComponent';
import { LineContainerComponent } from '../../../../sharedUiComponents/lines/lineContainerComponent';
import { TextInputLineComponent } from '../../../../sharedUiComponents/lines/textInputLineComponent';
import { LockObject } from '../../../../sharedUiComponents/tabs/propertyGrids/lockObject';

interface ICustomPropertyGridComponentProps {
    globalState: GlobalState;
    target: any,
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CustomPropertyGridComponent extends React.Component<ICustomPropertyGridComponentProps, { mode: number }> {

    constructor(props: ICustomPropertyGridComponentProps) {
        super(props);
        this.state = { mode: 0 };
    }

    renderInspectable(inspectable: IInspectable) {
        switch (inspectable.type) {
            case InspectableType.Checkbox:
                return (
                    <CheckBoxLineComponent key={inspectable.label} label={inspectable.label} target={this.props.target} propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                )
            case InspectableType.Slider:
                return (
                    <SliderLineComponent key={inspectable.label} label={inspectable.label} target={this.props.target} propertyName={inspectable.propertyName}
                        step={inspectable.step !== undefined ? inspectable.step : 0.1}
                        minimum={inspectable.min !== undefined ? inspectable.min : 0} maximum={inspectable.max !== undefined ? inspectable.max : 1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                )
            case InspectableType.Vector3:
                return (
                    <Vector3LineComponent key={inspectable.label} label={inspectable.label} target={this.props.target} propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                )
            case InspectableType.Quaternion:
                return (
                    <QuaternionLineComponent useEuler={this.props.globalState.onlyUseEulers} key={inspectable.label} label={inspectable.label} target={this.props.target} propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                )
            case InspectableType.Color3:
                return (
                    <Color3LineComponent key={inspectable.label} label={inspectable.label} target={this.props.target} propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                )
            case InspectableType.String:
                return (
                    <TextInputLineComponent key={inspectable.label} label={inspectable.label} lockObject={this.props.lockObject} target={this.props.target} propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                )
        }

        return null;
    }

    render() {
        let inspectables: IInspectable[] = this.props.target.inspectableCustomProperties;

        if (!inspectables || inspectables.length === 0) {
            return null;
        }

        return (
            <LineContainerComponent title="CUSTOM" selection={this.props.globalState}>
                {
                    inspectables.map(inspectable => {
                        return this.renderInspectable(inspectable);
                    })
                }
            </LineContainerComponent>
        );
    }
}