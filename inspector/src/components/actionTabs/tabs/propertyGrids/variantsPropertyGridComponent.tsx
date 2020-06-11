import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "../../lineContainerComponent";
import { LockObject } from "./lockObject";
import { GlobalState } from "../../../globalState";
// import { OptionsLineComponent } from '../../lines/optionsLineComponent';
import { ButtonLineComponent } from '../../lines/buttonLineComponent';
import { CheckBoxLineComponent } from '../../lines/checkBoxLineComponent';
import { GLTF2 } from 'babylonjs-loaders/glTF/index'

interface IVariantsPropertyGridComponentProps {
    globalState: GlobalState;
    host: any;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class VariantsPropertyGridComponent extends React.Component<IVariantsPropertyGridComponentProps> {
    // private _lastOne = 0;
    private _selectedTags: string[] = [];

    constructor(props: IVariantsPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const KHR_materials_variants = GLTF2.KHR_materials_variants;
        let variants: string[] = KHR_materials_variants.GetAvailableVariants(this.props.host);

        if (!variants || variants.length === 0) {
            return null;
        }

        let lastPickedVariants = KHR_materials_variants.GetLastSelectedVariant(this.props.host);

        variants.sort((a, b) => {
            let aIsActive = lastPickedVariants && lastPickedVariants.indexOf ? lastPickedVariants.indexOf(a) > -1 : lastPickedVariants === a;
            let bIsActive = lastPickedVariants && lastPickedVariants.indexOf ? lastPickedVariants.indexOf(b) > -1 : lastPickedVariants === b;

            if (!aIsActive && this._selectedTags.indexOf(a) > -1) {
                aIsActive = true;
            }

            if (!bIsActive && this._selectedTags.indexOf(b) > -1) {
                bIsActive = true;
            }

            if (aIsActive && bIsActive || !aIsActive && !bIsActive) {
                return a.localeCompare(b);
            }

            if (aIsActive) {
                return -1;
            }

            return 1
        });

        // let options = variants.map((v: string, i: number) =>  {
        //     return {label: v, value: i + 1}
        // });

        // options.splice(0, 0, {label: "Original", value: 0})

        return (
            <div>
                <LineContainerComponent globalState={this.props.globalState} title="VARIANTS">
                    {
                        variants.map((v: string, i: number) => {
                            return (
                                <CheckBoxLineComponent key={i} label={v} 
                                        isSelected={() => {
                                            if (lastPickedVariants) {
                                                if (Object.prototype.toString.call(lastPickedVariants) === '[object String]') {
                                                    if (lastPickedVariants === v) {
                                                        if (this._selectedTags.indexOf(v) === -1) {                                                            
                                                            this._selectedTags.push(v);
                                                        }
                                                        return true;
                                                    }
                                                } else {
                                                    let index = lastPickedVariants.indexOf(v);
                                                    if (index > -1) {
                                                        return true
                                                    }
                                                }
                                            }

                                            return this._selectedTags.indexOf(v) > -1;
                                        }}
                                        onSelect={(value) => {
                                            if (value) {
                                                this._selectedTags.push(v);
                                                KHR_materials_variants.SelectVariant(this.props.host, v);
                                            } else {
                                                // Do something on extension?
                                                let index = this._selectedTags.indexOf(v);

                                                if (index > -1) {
                                                    this._selectedTags.splice(index, 1);
                                                }
                                            }
                                        }}
                                    />
                            )
                        })
                    }
                    {/* <OptionsLineComponent 
                        label="Active variant" options={options} noDirectUpdate={true} 
                        target={this.props.host}
                        propertyName=""
                        onSelect={(value: number) => {
                            if (value === 0) {
                                KHR_materials_variants.Reset(this.props.host);
                            } else {
                                KHR_materials_variants.SelectVariant(this.props.host, variants[value - 1]);
                            }
                            this._lastOne = value;

                            this.forceUpdate();
                        }}
                        extractValue={() => {
                            let lastPickedVariant = KHR_materials_variants.GetLastSelectedVariant(this.props.host) || 0;

                            if (lastPickedVariant && Object.prototype.toString.call(lastPickedVariant) === '[object String]') {
                                let index = variants.indexOf(lastPickedVariant as string);
                                if (index > -1) {
                                    this._lastOne = index + 1;
                                }
                            }

                            return this._lastOne;
                        }}
                    /> */}
                    <ButtonLineComponent label="Reset" onClick={() => {
                        KHR_materials_variants.Reset(this.props.host);
                        this._selectedTags = [];
                        this.forceUpdate();
                    }} />
                </LineContainerComponent>
            </div>
        );
    }
}