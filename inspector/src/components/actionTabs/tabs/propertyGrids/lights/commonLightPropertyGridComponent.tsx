import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { Light } from "babylonjs/Lights/light";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../../../sharedUiComponents/lines/lineContainerComponent";
import { FloatLineComponent } from "../../../../../sharedUiComponents/lines/floatLineComponent";
import { TextLineComponent } from "../../../../../sharedUiComponents/lines/textLineComponent";
import { LockObject } from "../../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { GlobalState } from '../../../../globalState';
import { CustomPropertyGridComponent } from '../customPropertyGridComponent';
import { ButtonLineComponent } from '../../../../../sharedUiComponents/lines/buttonLineComponent';
import { TextInputLineComponent } from '../../../../../sharedUiComponents/lines/textInputLineComponent';
import { AnimationGridComponent } from '../animations/animationPropertyGridComponent';

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
            <div>
                <CustomPropertyGridComponent globalState={this.props.globalState} target={light}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="ID" value={light.id} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={light} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <TextLineComponent label="Unique ID" value={light.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={light.getClassName()} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Intensity" target={light} propertyName="intensity" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <ButtonLineComponent label="Dispose" onClick={() => {
                        light.dispose();
                        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                    }} />                       
                </LineContainerComponent>
                <AnimationGridComponent globalState={this.props.globalState} animatable={light} scene={light.getScene()} lockObject={this.props.lockObject} />
            </div>
        );
    }
}