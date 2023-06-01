import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import type { CurveBlock } from "core/Materials/Node/Blocks/curveBlock";
import { CurveBlockTypes } from "core/Materials/Node/Blocks/curveBlock";

export class CurvePropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    render() {
        const curveBlock = this.props.nodeData.data as CurveBlock;

        const typeOptions: { label: string; value: CurveBlockTypes }[] = [];

        const keys = Object.keys(CurveBlockTypes);
        for (const key of keys) {
            if (!isNaN(parseInt(key))) {
                continue;
            }
            typeOptions.push({
                label: key,
                value: (CurveBlockTypes as any)[key],
            });
        }

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <OptionsLineComponent
                        label="Type"
                        options={typeOptions}
                        target={curveBlock}
                        propertyName="type"
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(curveBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
