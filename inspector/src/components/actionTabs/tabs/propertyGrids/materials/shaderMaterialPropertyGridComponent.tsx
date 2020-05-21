import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { ShaderMaterial } from "babylonjs/Materials/shaderMaterial";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { ShaderSourceEditor } from '../../../../sourceEditor/shaderSourceEditor';

interface IShaderMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: ShaderMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ShaderMaterialPropertyGridComponent extends React.Component<IShaderMaterialPropertyGridComponentProps> {
    constructor(props: IShaderMaterialPropertyGridComponentProps) {
        super(props);
    }

    edit() {
        ShaderSourceEditor.Show({ shaderMaterial: this.props.material });
    }

    render() {
        const material = this.props.material;

        return (
            <div className="pane">
                <CommonMaterialPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} material={material} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="CONFIGURATION">
                <ButtonLineComponent label="Edit Source" onClick={() => this.edit()} />
                </LineContainerComponent>
            </div>
        );
    }
}