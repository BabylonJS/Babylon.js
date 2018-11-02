import * as React from "react";
import { Light, Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";

interface ICommonLightPropertyGridComponentProps {
    light: Light,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class CommonLightPropertyGridComponent extends React.Component<ICommonLightPropertyGridComponentProps> {
    constructor(props: ICommonLightPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const light = this.props.light;

        return (
            <LineContainerComponent title="GENERAL">
                <TextLineComponent label="ID" value={light.id} />
                <TextLineComponent label="Unique ID" value={light.uniqueId.toString()} />
                <TextLineComponent label="Class" value={light.getClassName()} />
                <FloatLineComponent label="Intensity" target={light} propertyName="intensity" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </LineContainerComponent>
        );
    }
}