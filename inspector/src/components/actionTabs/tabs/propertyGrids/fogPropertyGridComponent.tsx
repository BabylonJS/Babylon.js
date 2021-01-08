import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { Scene } from "babylonjs/scene";

import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { Color3LineComponent } from "../../../../sharedUiComponents/lines/color3LineComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { OptionsLineComponent } from "../../../../sharedUiComponents/lines/optionsLineComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { GlobalState } from '../../../globalState';

interface IFogPropertyGridComponentProps {
    globalState: GlobalState;
    scene: Scene;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class FogPropertyGridComponent extends React.Component<IFogPropertyGridComponentProps, { mode: number }> {

    constructor(props: IFogPropertyGridComponentProps) {
        super(props);
        this.state = { mode: this.props.scene.fogMode };
    }

    render() {
        const scene = this.props.scene;

        var fogModeOptions = [
            { label: "None", value: Scene.FOGMODE_NONE },
            { label: "Linear", value: Scene.FOGMODE_LINEAR },
            { label: "Exp", value: Scene.FOGMODE_EXP },
            { label: "Exp2", value: Scene.FOGMODE_EXP2 },
        ];

        return (
            <div>
                <OptionsLineComponent label="Fog mode" options={fogModeOptions} target={scene} propertyName="fogMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={(value) => this.setState({ mode: value })} />
                {
                    this.state.mode !== Scene.FOGMODE_NONE &&
                    <Color3LineComponent label="Fog color" target={scene} propertyName="fogColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                }
                {
                    (this.state.mode === Scene.FOGMODE_EXP || this.state.mode === Scene.FOGMODE_EXP2) &&
                    <FloatLineComponent lockObject={this.props.lockObject} label="Fog density" target={scene} propertyName="fogDensity" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                }
                {
                    this.state.mode === Scene.FOGMODE_LINEAR &&
                    <FloatLineComponent lockObject={this.props.lockObject} label="Fog start" target={scene} propertyName="fogStart" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                }
                {
                    this.state.mode === Scene.FOGMODE_LINEAR &&
                    <FloatLineComponent lockObject={this.props.lockObject} label="Fog end" target={scene} propertyName="fogEnd" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                }
            </div>
        );
    }
}