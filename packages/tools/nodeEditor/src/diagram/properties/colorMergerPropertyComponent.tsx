import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { OptionsLineComponent } from "../../sharedComponents/optionsLineComponent";
import type { IPropertyComponentProps } from "./propertyComponentProps";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { ColorMergerBlock } from "core/Materials/Node/Blocks/colorMergerBlock";

export class ColorMergerPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    render() {
        const colorMergerBlock = this.props.block as ColorMergerBlock;

        const targetOptions: { label: string; value: string }[] = [
            { label: "R", value: "r" },
            { label: "G", value: "g" },
            { label: "B", value: "b" },
            { label: "A", value: "a" },
        ];

        return (
            <div>
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block} />
                <LineContainerComponent title="SWIZZLES">
                    <OptionsLineComponent
                        label="R"
                        options={targetOptions}
                        target={colorMergerBlock}
                        propertyName="rSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLineComponent
                        label="G"
                        options={targetOptions}
                        target={colorMergerBlock}
                        propertyName="gSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLineComponent
                        label="B"
                        options={targetOptions}
                        target={colorMergerBlock}
                        propertyName="bSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                    <OptionsLineComponent
                        label="A"
                        options={targetOptions}
                        target={colorMergerBlock}
                        propertyName="aSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
