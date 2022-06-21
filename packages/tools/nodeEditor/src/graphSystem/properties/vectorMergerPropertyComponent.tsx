import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { OptionsLineComponent } from "../../sharedComponents/optionsLineComponent";
import type { IPropertyComponentProps } from "../../../../../dev/sharedUiComponents/src/nodeGraphSystem/interfaces/propertyComponentProps";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { VectorMergerBlock } from "core/Materials/Node/Blocks/vectorMergerBlock";

export class VectorMergerPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    render() {
        const vectorMergerBlock = this.props.data as VectorMergerBlock;

        const targetOptions: { label: string; value: string }[] = [
            { label: "X", value: "x" },
            { label: "Y", value: "y" },
            { label: "Z", value: "z" },
            { label: "W", value: "w" },
        ];

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.globalState} globalState={this.props.globalState} data={this.props.data} />
                <LineContainerComponent title="SWIZZLES">
                    <OptionsLineComponent
                        label="X"
                        options={targetOptions}
                        target={vectorMergerBlock}
                        propertyName="xSwizzle"
                        valuesAreStrings={true}
                        onSelect={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
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
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
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
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
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
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(vectorMergerBlock);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
