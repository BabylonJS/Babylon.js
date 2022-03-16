import * as React from "react";

import { Observable } from "core/Misc/observable";
import { Material } from "core/Materials/material";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { GlobalState } from "../../../../globalState";

interface IMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: Material;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class MaterialPropertyGridComponent extends React.Component<IMaterialPropertyGridComponentProps> {
    constructor(props: IMaterialPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const material = this.props.material;

        return (
            <div className="pane">
                <CommonMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    material={material}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
