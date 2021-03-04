import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../../../sharedUiComponents/lines/lineContainerComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { LockObject } from "../../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { GlobalState } from '../../../../globalState';
import { TextLineComponent } from '../../../../../sharedUiComponents/lines/textLineComponent';
import { Material } from 'babylonjs/Materials/material';
import { MultiMaterial } from 'babylonjs/Materials/multiMaterial';

interface IMultiMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: MultiMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class MultiMaterialPropertyGridComponent extends React.Component<IMultiMaterialPropertyGridComponentProps> {
    constructor(props: IMultiMaterialPropertyGridComponentProps) {
        super(props);
    }

    onMaterialLink(mat: Material) {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        this.props.onSelectionChangedObservable.notifyObservers(mat);
    }

    renderChildMaterial() {
        const material = this.props.material;

        return (
            <LineContainerComponent title="CHILDREN" selection={this.props.globalState}>
                {
                    material.subMaterials.map((mat, i) => {
                        if (mat) {
                            return (
                                <TextLineComponent key={"Material #" + i} label={"Material #" + i} value={mat.name} onLink={() => this.onMaterialLink(mat)} />
                            )
                        }
                        return null;                        
                    })
                }
            </LineContainerComponent>
        );
    }

    render() {
        const material = this.props.material;

        return (
            <div className="pane">
                <CommonMaterialPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} material={material} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                {this.renderChildMaterial()}
            </div>
        );
    }
}