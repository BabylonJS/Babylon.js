import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { VectorMergerBlock } from "core/Materials/Node/Blocks/vectorMergerBlock";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";

export class VectorMergerPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    render() {
        const vectorMergerBlock = this.props.nodeData.data as VectorMergerBlock;

        const targetOptions: { label: string; value: string }[] = [
            { label: "X", value: "x" },
            { label: "Y", value: "y" },
            { label: "Z", value: "z" },
            { label: "W", value: "w" },
        ];

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="SWIZZLES">
                    <OptionsLineComponent
                        label="X"
                        options={targetOptions}
                        target={vectorMergerBlock}
                        propertyName="xSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLineComponent
                        label="Y"
                        options={targetOptions}
                        target={vectorMergerBlock}
                        propertyName="ySwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLineComponent
                        label="Z"
                        options={targetOptions}
                        target={vectorMergerBlock}
                        propertyName="zSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLineComponent
                        label="W"
                        options={targetOptions}
                        target={vectorMergerBlock}
                        propertyName="wSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
