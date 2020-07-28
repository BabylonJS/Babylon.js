import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { Nullable } from 'babylonjs/types';

import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "../../lineContainerComponent";
import { LockObject } from "./lockObject";
import { GlobalState } from "../../../globalState";
// import { OptionsLineComponent } from '../../lines/optionsLineComponent';
import { ButtonLineComponent } from '../../lines/buttonLineComponent';
import { CheckBoxLineComponent } from '../../lines/checkBoxLineComponent';

declare type KHR_materials_variants = import("babylonjs-loaders/glTF/2.0/Extensions/KHR_materials_variants").KHR_materials_variants;

interface IVariantsPropertyGridComponentProps {
    globalState: GlobalState;
    host: any;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class VariantsPropertyGridComponent extends React.Component<IVariantsPropertyGridComponentProps> {
    // private _lastOne = 0;
    private _selectedVariants: string[] = [];

    constructor(props: IVariantsPropertyGridComponentProps) {
        super(props);
    }

    private _getVariantsExtension(): Nullable<KHR_materials_variants> {
        return this.props.globalState?.glTFLoaderExtenstions["KHR_materials_variants"] as KHR_materials_variants;
    }

    render() {
        const extension = this._getVariantsExtension();
        if (!extension) {
            return null;
        }
        let variants: string[] = extension.getAvailableVariants(this.props.host);

        if (!variants || variants.length === 0) {
            return null;
        }

        let lastPickedVariants = extension.getLastSelectedVariant(this.props.host);

        variants.sort((a, b) => {
            let aIsActive = lastPickedVariants && lastPickedVariants.indexOf ? lastPickedVariants.indexOf(a) > -1 : lastPickedVariants === a;
            let bIsActive = lastPickedVariants && lastPickedVariants.indexOf ? lastPickedVariants.indexOf(b) > -1 : lastPickedVariants === b;

            if (!aIsActive && this._selectedVariants.indexOf(a) > -1) {
                aIsActive = true;
            }

            if (!bIsActive && this._selectedVariants.indexOf(b) > -1) {
                bIsActive = true;
            }

            if (aIsActive && bIsActive || !aIsActive && !bIsActive) {
                return a.localeCompare(b);
            }

            if (aIsActive) {
                return -1;
            }

            return 1;
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
                                                        if (this._selectedVariants.indexOf(v) === -1) {
                                                            this._selectedVariants.push(v);
                                                        }
                                                        return true;
                                                    }
                                                } else {
                                                    let index = lastPickedVariants.indexOf(v);
                                                    if (index > -1) {
                                                        return true;
                                                    }
                                                }
                                            }

                                            return this._selectedVariants.indexOf(v) > -1;
                                        }}
                                        onSelect={(value) => {
                                            if (value) {
                                                this._selectedVariants.push(v);
                                                extension.selectVariant(this.props.host, v);
                                            } else {
                                                // Do something on extension?
                                                let index = this._selectedVariants.indexOf(v);

                                                if (index > -1) {
                                                    this._selectedVariants.splice(index, 1);
                                                }
                                            }
                                        }}
                                    />
                            );
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
                        extension.reset(this.props.host);
                        this._selectedVariants = [];
                        this.forceUpdate();
                    }} />
                </LineContainerComponent>
            </div>
        );
    }
}