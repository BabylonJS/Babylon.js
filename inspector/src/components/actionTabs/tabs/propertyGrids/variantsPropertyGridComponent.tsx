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
<<<<<<< HEAD
=======
    private _lastOne = 0;

>>>>>>> eed1cab37fd382f46ffdd6ed91c732acd8c85b76
    constructor(props: IVariantsPropertyGridComponentProps) {
        super(props);
    }

    render() {
<<<<<<< HEAD
        let variants = BABYLON.GLTF2.Loader.Extensions.KHR_materials_variants.GetAvailableVariants(this.props.host);
=======
        let root = (BABYLON as any).GLTF2.Loader.Extensions;
        let variants = root.KHR_materials_variants.GetAvailableVariants(this.props.host);
>>>>>>> eed1cab37fd382f46ffdd6ed91c732acd8c85b76

        if (!variants || variants.length === 0) {
            return null;
        }

<<<<<<< HEAD
        let options = variants.map((v, i) =>  {
            var displayName = v;

            if (displayName === BABYLON.GLTF2.Loader.Extensions.KHR_materials_variants.DEFAULT) {
                displayName = "Default";
            }
            return {label: displayName, value: i}
        });

=======
        let options = variants.map((v: string, i: number) =>  {
            return {label: v, value: i + 1}
        });

        options.splice(0, 0, {label: "Original", value: 0})

>>>>>>> eed1cab37fd382f46ffdd6ed91c732acd8c85b76
        return (
            <div>
                <LineContainerComponent globalState={this.props.globalState} title="VARIANTS">
                    <OptionsLineComponent 
                        label="Active variant" options={options} noDirectUpdate={true} 
                        target={this.props.host}
                        propertyName=""
                        onSelect={(value: number) => {
<<<<<<< HEAD
                            BABYLON.GLTF2.Loader.Extensions.KHR_materials_variants.SelectVariant(this.props.host, variants[value]);
=======
                            if (value === 0) {                                
                                root.KHR_materials_variants.Reset(this.props.host);
                            } else {
                                root.KHR_materials_variants.SelectVariant(this.props.host, variants[value - 1]);
                            }
                            this._lastOne = value;
>>>>>>> eed1cab37fd382f46ffdd6ed91c732acd8c85b76

                            this.forceUpdate();
                        }}
                        extractValue={() => {
<<<<<<< HEAD
                            let lastOne = BABYLON.GLTF2.Loader.Extensions.KHR_materials_variants.GetLastSelectedVariant(this.props.host) || 0;
                            let index = variants.indexOf(lastOne) ;

                            return index < -1 ? 0 : index;
                        }}
                    />
=======
                            let lastPickedVariant = root.KHR_materials_variants.GetLastSelectedVariant(this.props.host) || 0;

                            if (lastPickedVariant && Object.prototype.toString.call(lastPickedVariant) === '[object String]') {
                                let index = variants.indexOf(lastPickedVariant as string);
                                if (index > -1) {
                                    this._lastOne = index + 1;
                                }
                            }

                            return this._lastOne;
                        }}
                    />
                    <ButtonLineComponent label="Reset" onClick={() => {
                        root.KHR_materials_variants.Reset(this.props.host);
                        this._lastOne = 0;
                        this.forceUpdate();
                    }} />
>>>>>>> eed1cab37fd382f46ffdd6ed91c732acd8c85b76
                </LineContainerComponent>
            </div>
        );
    }
}