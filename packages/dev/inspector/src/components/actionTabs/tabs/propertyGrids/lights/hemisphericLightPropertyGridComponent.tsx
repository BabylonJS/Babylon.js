import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { HemisphericLight } from "core/Lights/hemisphericLight";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonLightPropertyGridComponent } from "./commonLightPropertyGridComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";

interface IHemisphericLightPropertyGridComponentProps {
    globalState: GlobalState;
    light: HemisphericLight;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class HemisphericLightPropertyGridComponent extends React.Component<IHemisphericLightPropertyGridComponentProps> {
    constructor(props: IHemisphericLightPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const light = this.props.light;

        return (
            <div className="pane">
                <CommonLightPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    light={light}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="SETUP" selection={this.props.globalState}>
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Diffuse"
                        target={light}
                        propertyName="diffuse"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Ground"
                        target={light}
                        propertyName="groundColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Direction"
                        target={light}
                        propertyName="direction"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
