import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import type { GlobalState } from "../../../globalState";
import type { IInspectable } from "core/Misc/iInspectable";
import { InspectableType } from "core/Misc/iInspectable";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { QuaternionLineComponent } from "../../lines/quaternionLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FileButtonLineComponent } from "shared-ui-components/lines/fileButtonLineComponent";
import { Logger } from "core/Misc/logger";

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
                        lockObject={this.props.lockObject}
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
            case InspectableType.Vector2:
                return (
                    <Vector2LineComponent
                        lockObject={this.props.lockObject}
                        key={inspectable.label}
                        label={inspectable.label}
                        target={this.props.target}
                        propertyName={inspectable.propertyName}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case InspectableType.Vector3:
                return (
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
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
                        lockObject={this.props.lockObject}
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
                        lockObject={this.props.lockObject}
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
                                Logger.Warn("no call back function added");
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
                                Logger.Warn(`Option ${value} is selected`);
                            }
                        }
                    />
                );
            case InspectableType.Tab:
                return <TextLineComponent key={inspectable.label} label={inspectable.label} value={" "} />;
            case InspectableType.FileButton:
                return (
                    <FileButtonLineComponent
                        key={inspectable.label}
                        label={inspectable.label}
                        onClick={
                            inspectable.fileCallback ||
                            function () {
                                Logger.Warn("no file call back function added");
                            }
                        }
                        accept={inspectable.accept || "*"}
                    />
                );
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
