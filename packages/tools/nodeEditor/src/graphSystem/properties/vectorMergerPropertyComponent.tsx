import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { VectorMergerBlock } from "core/Materials/Node/Blocks/vectorMergerBlock";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";

export class VectorMergerPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
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
                    <OptionsLine
                        label="X"
                        options={targetOptions}
                        target={vectorMergerBlock}
                        propertyName="xSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLine
                        label="Y"
                        options={targetOptions}
                        target={vectorMergerBlock}
                        propertyName="ySwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLine
                        label="Z"
                        options={targetOptions}
                        target={vectorMergerBlock}
                        propertyName="zSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLine
                        label="W"
                        options={targetOptions}
                        target={vectorMergerBlock}
                        propertyName="wSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
