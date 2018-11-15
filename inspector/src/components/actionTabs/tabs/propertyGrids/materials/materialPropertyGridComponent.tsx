import * as React from "react";
import { Material, Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";

interface IMaterialPropertyGridComponentProps {
    material: Material,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class MaterialPropertyGridComponent extends React.Component<IMaterialPropertyGridComponentProps> {
    constructor(props: IMaterialPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const material = this.props.material;

        return (
            <div className="pane">
                <CommonMaterialPropertyGridComponent material={material} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}