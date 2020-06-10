import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "../../lineContainerComponent";
import { LockObject } from "./lockObject";
import { GlobalState } from "../../../globalState";
import { OptionsLineComponent } from '../../lines/optionsLineComponent';
import { ButtonLineComponent } from '../../lines/buttonLineComponent';

interface IVariantsPropertyGridComponentProps {
    globalState: GlobalState;
    host: any;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class VariantsPropertyGridComponent extends React.Component<IVariantsPropertyGridComponentProps> {
    constructor(props: IVariantsPropertyGridComponentProps) {
        super(props);
    }

    render() {
        let variants = BABYLON.GLTF2.Loader.Extensions.KHR_materials_variants.GetAvailableVariants(this.props.host);

        if (!variants || variants.length === 0) {
            return null;
        }

        let options = variants.map((v, i) =>  {
            var displayName = v;

            if (displayName === BABYLON.GLTF2.Loader.Extensions.KHR_materials_variants.DEFAULT) {
                displayName = "Default";
            }
            return {label: displayName, value: i}
        });

        return (
            <div>
                <LineContainerComponent globalState={this.props.globalState} title="VARIANTS">
                    <OptionsLineComponent 
                        label="Active variant" options={options} noDirectUpdate={true} 
                        target={this.props.host}
                        propertyName=""
                        onSelect={(value: number) => {
                            BABYLON.GLTF2.Loader.Extensions.KHR_materials_variants.SelectVariant(this.props.host, variants[value]);

                            this.forceUpdate();
                        }}
                        extractValue={() => {
                            let lastOne = BABYLON.GLTF2.Loader.Extensions.KHR_materials_variants.GetLastSelectedVariant(this.props.host) || 0;
                            let index = variants.indexOf(lastOne) ;

                            return index < -1 ? 0 : index;
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}