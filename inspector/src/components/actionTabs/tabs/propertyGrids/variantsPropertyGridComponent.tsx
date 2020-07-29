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
import { OptionsLineComponent } from '../../lines/optionsLineComponent';

declare type KHR_materials_variants = import("babylonjs-loaders/glTF/2.0/Extensions/KHR_materials_variants").KHR_materials_variants;

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

        let options = variants.sort().map((v: string, i: number) =>  {
            return {label: v, value: i + 1}
        });

        options.splice(0, 0, {label: "Original", value: 0})

        return (
            <div>
                <LineContainerComponent globalState={this.props.globalState} title="VARIANTS">             
                <OptionsLineComponent
                    label="Active variant" options={options} noDirectUpdate={true}
                    target={this.props.host}
                    propertyName=""
                    onSelect={(value: number) => {
                        if (value === 0) {
                            extension.reset(this.props.host);
                        } else {
                            extension.selectVariant(this.props.host, variants[value - 1]);
                        }
                        this.forceUpdate();
                    }}
                    extractValue={() => {
                        let lastPickedVariant = extension.getLastSelectedVariant(this.props.host) || 0;
                        let index = 0;
                        if (lastPickedVariant && Object.prototype.toString.call(lastPickedVariant) === '[object String]') {
                            index = variants.indexOf(lastPickedVariant as string);
                            if (index > -1) {
                                index = index + 1;
                            }
                        }

                        return index;
                    }}
                />
                    <ButtonLineComponent label="Reset" onClick={() => {
                        extension.reset(this.props.host);
                        this.forceUpdate();
                    }} />
                </LineContainerComponent>
            </div>
        );
    }
}