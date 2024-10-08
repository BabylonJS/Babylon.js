import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { ColorMergerBlock } from "core/Materials/Node/Blocks/colorMergerBlock";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";

export class ColorMergerPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        const colorMergerBlock = this.props.nodeData.data as ColorMergerBlock;

        const targetOptions: { label: string; value: string }[] = [
            { label: "R", value: "r" },
            { label: "G", value: "g" },
            { label: "B", value: "b" },
            { label: "A", value: "a" },
        ];

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="SWIZZLES">
                    <OptionsLine
                        label="R"
                        options={targetOptions}
                        target={colorMergerBlock}
                        propertyName="rSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(colorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLine
                        label="G"
                        options={targetOptions}
                        target={colorMergerBlock}
                        propertyName="gSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(colorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLine
                        label="B"
                        options={targetOptions}
                        target={colorMergerBlock}
                        propertyName="bSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(colorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLine
                        label="A"
                        options={targetOptions}
                        target={colorMergerBlock}
                        propertyName="aSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(colorMergerBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
