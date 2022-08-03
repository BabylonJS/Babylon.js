import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PointLight } from "core/Lights/pointLight";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonLightPropertyGridComponent } from "./commonLightPropertyGridComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { CommonShadowLightPropertyGridComponent } from "./commonShadowLightPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";

interface IPointLightPropertyGridComponentProps {
    globalState: GlobalState;
    light: PointLight;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class PointLightPropertyGridComponent extends React.Component<IPointLightPropertyGridComponentProps> {
    constructor(props: IPointLightPropertyGridComponentProps) {
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
                        label="Specular"
                        target={light}
                        propertyName="specular"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Position"
                        target={light}
                        propertyName="position"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <CommonShadowLightPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    light={light}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
