import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import type { GlobalState } from "../../../globalState";
import type { IInspectable } from "core/Misc/iInspectable";
import { InspectableType } from "core/Misc/iInspectable";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { QuaternionLineComponent } from "../../lines/quaternionLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";

interface ICustomPropertyGridComponentProps {
    globalState: GlobalState;
    target: any;
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
                    <CheckBoxLineComponent
                        key={inspectable.label}
                        label={inspectable.label}
                        target={this.props.target}
                        propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case InspectableType.Slider:
                return (
                    <SliderLineComponent
                        key={inspectable.label}
                        label={inspectable.label}
                        target={this.props.target}
                        propertyName={inspectable.propertyName}
                        step={inspectable.step !== undefined ? inspectable.step : 0.1}
                        minimum={inspectable.min !== undefined ? inspectable.min : 0}
                        maximum={inspectable.max !== undefined ? inspectable.max : 1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case InspectableType.Vector3:
                return (
                    <Vector3LineComponent
                        key={inspectable.label}
                        label={inspectable.label}
                        target={this.props.target}
                        propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case InspectableType.Quaternion:
                return (
                    <QuaternionLineComponent
                        useEuler={this.props.globalState.onlyUseEulers}
                        key={inspectable.label}
                        label={inspectable.label}
                        target={this.props.target}
                        propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case InspectableType.Color3:
                return (
                    <Color3LineComponent
                        key={inspectable.label}
                        label={inspectable.label}
                        target={this.props.target}
                        propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case InspectableType.String:
                return (
                    <TextInputLineComponent
                        key={inspectable.label}
                        label={inspectable.label}
                        lockObject={this.props.lockObject}
                        target={this.props.target}
                        propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case InspectableType.Button:
                return (
                    <ButtonLineComponent
                        key={inspectable.label}
                        label={inspectable.label}
                        onClick={
                            inspectable.callback ||
                            function () {
                                console.warn("no call back function added");
                            }
                        }
                    />
                );
            case InspectableType.Options:
                return (
                    <OptionsLineComponent
                        key={inspectable.label}
                        label={inspectable.label}
                        target={this.props.target}
                        propertyName={inspectable.propertyName}
                        options={inspectable.options || []}
                        onSelect={
                            inspectable.callback ||
                            function (value) {
                                console.log(`Option ${value} is selected`);
                            }
                        }
                    />
                );
            case InspectableType.Tab:
                return <TextLineComponent key={inspectable.label} label={inspectable.label} value={" "} />;
        }

        return null;
    }

    render() {
        const inspectables: IInspectable[] = this.props.target.inspectableCustomProperties;

        if (!inspectables || inspectables.length === 0) {
            return null;
        }

        return (
            <LineContainerComponent title="CUSTOM" selection={this.props.globalState}>
                {inspectables.map((inspectable) => {
                    return this.renderInspectable(inspectable);
                })}
            </LineContainerComponent>
        );
    }
}
