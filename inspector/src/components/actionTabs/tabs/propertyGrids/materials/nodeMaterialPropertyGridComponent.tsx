import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';

interface INodeMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: NodeMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class NodeMaterialPropertyGridComponent extends React.Component<INodeMaterialPropertyGridComponentProps> {
    constructor(props: INodeMaterialPropertyGridComponentProps) {
        super(props);
    }

    edit() {
        this.props.material.edit();
    }

    render() {
        const material = this.props.material;

        return (
            <div className="pane">
                <CommonMaterialPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} material={material} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="EDITOR">
                    <ButtonLineComponent label="Edit" onClick={() => this.edit()} />
                </LineContainerComponent>
            </div>
        );
    }
}