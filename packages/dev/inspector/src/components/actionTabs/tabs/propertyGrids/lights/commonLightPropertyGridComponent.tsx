import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { Light } from "core/Lights/light";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { CustomPropertyGridComponent } from "../customPropertyGridComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { AnimationGridComponent } from "../animations/animationPropertyGridComponent";
import { ParentPropertyGridComponent } from "../parentPropertyGridComponent";

interface ICommonLightPropertyGridComponentProps {
    globalState: GlobalState;
    light: Light;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonLightPropertyGridComponent extends React.Component<ICommonLightPropertyGridComponentProps> {
    constructor(props: ICommonLightPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const light = this.props.light;

        return (
            <div>
                <CustomPropertyGridComponent
                    globalState={this.props.globalState}
                    target={light}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="ID" value={light.id} />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={light}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Unique ID" value={light.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={light.getClassName()} />
                    <ParentPropertyGridComponent
                        globalState={this.props.globalState}
                        node={light}
                        lockObject={this.props.lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Intensity"
                        target={light}
                        propertyName="intensity"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <ButtonLineComponent
                        label="Dispose"
                        onClick={() => {
                            light.dispose();
                            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                        }}
                    />
                </LineContainerComponent>
                <AnimationGridComponent globalState={this.props.globalState} animatable={light} scene={light.getScene()} lockObject={this.props.lockObject} />
            </div>
        );
    }
}
