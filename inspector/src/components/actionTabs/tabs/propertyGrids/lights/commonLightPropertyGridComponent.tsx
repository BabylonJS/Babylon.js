import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { Light } from "babylonjs/Lights/light";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';

interface ICommonLightPropertyGridComponentProps {
    globalState: GlobalState,
    light: Light,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class CommonLightPropertyGridComponent extends React.Component<ICommonLightPropertyGridComponentProps> {
    constructor(props: ICommonLightPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const light = this.props.light;

        return (
            <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                <TextLineComponent label="ID" value={light.id} />
                <TextLineComponent label="Unique ID" value={light.uniqueId.toString()} />
                <TextLineComponent label="Class" value={light.getClassName()} />
                <FloatLineComponent lockObject={this.props.lockObject} label="Intensity" target={light} propertyName="intensity" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </LineContainerComponent>
        );
    }
}