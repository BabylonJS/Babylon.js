import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { LockObject } from "../tabs/propertyGrids/lockObject";
import { ColorLineComponent } from "./colorLineComponent";

export interface IColor3LineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    isLinear?: boolean;
    icon?: string;
    lockObject?: LockObject;
    iconLabel?: string;
    onValueChange?: (value: string) => void;
}

export class Color3LineComponent extends React.Component<IColor3LineComponentProps> {
    render() {
        const props = this.props;
        return <ColorLineComponent disableAlpha={true} {...props} />
    }
}