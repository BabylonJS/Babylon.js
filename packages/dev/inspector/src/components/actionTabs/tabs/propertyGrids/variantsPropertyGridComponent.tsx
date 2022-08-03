import * as React from "react";

import type { Observable } from "core/Misc/observable";
import type { Nullable } from "core/types";

import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../globalState";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare type KHR_materials_variants = import("loaders/glTF/2.0/Extensions/KHR_materials_variants").KHR_materials_variants;

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
        return this.props.globalState?.glTFLoaderExtensions["KHR_materials_variants"] as KHR_materials_variants;
    }

    render() {
        const extension = this._getVariantsExtension();
        if (!extension) {
            return null;
        }
        const variants: string[] = extension.getAvailableVariants(this.props.host);

        if (!variants || variants.length === 0) {
            return null;
        }

        const options = variants.sort().map((v: string, i: number) => {
            return { label: v, value: i + 1 };
        });

        options.splice(0, 0, { label: "Original", value: 0 });

        return (
            <div>
                <LineContainerComponent title="VARIANTS" selection={this.props.globalState}>
                    <OptionsLineComponent
                        label="Active variant"
                        options={options}
                        noDirectUpdate={true}
                        target={this.props.host}
                        propertyName=""
                        onSelect={(value) => {
                            const valueAsNumber = value as number;
                            if (valueAsNumber === 0) {
                                extension.reset(this.props.host);
                            } else {
                                extension.selectVariant(this.props.host, variants[valueAsNumber - 1]);
                            }
                            this.forceUpdate();
                        }}
                        extractValue={() => {
                            const lastPickedVariant = extension.getLastSelectedVariant(this.props.host) || 0;
                            let index = 0;
                            if (lastPickedVariant && Object.prototype.toString.call(lastPickedVariant) === "[object String]") {
                                index = variants.indexOf(lastPickedVariant as string);
                                if (index > -1) {
                                    index = index + 1;
                                }
                            }

                            return index;
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
