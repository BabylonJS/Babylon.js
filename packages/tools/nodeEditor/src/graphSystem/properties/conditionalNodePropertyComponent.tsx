import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { ConditionalBlock } from "core/Materials/Node/Blocks/conditionalBlock";
import { ConditionalBlockConditions } from "core/Materials/Node/Blocks/conditionalBlock";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";

export class ConditionalPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        const conditionBlock = this.props.nodeData.data as ConditionalBlock;

        const conditionOptions: { label: string; value: ConditionalBlockConditions }[] = [
            { label: "Equal", value: ConditionalBlockConditions.Equal },
            { label: "NotEqual", value: ConditionalBlockConditions.NotEqual },
            { label: "LessThan", value: ConditionalBlockConditions.LessThan },
            { label: "GreaterThan", value: ConditionalBlockConditions.GreaterThan },
            { label: "LessOrEqual", value: ConditionalBlockConditions.LessOrEqual },
            { label: "GreaterOrEqual", value: ConditionalBlockConditions.GreaterOrEqual },
            { label: "Xor", value: ConditionalBlockConditions.Xor },
            { label: "Or", value: ConditionalBlockConditions.Or },
            { label: "And", value: ConditionalBlockConditions.And },
        ];

        conditionOptions.sort((a, b) => {
            return a.label.localeCompare(b.label);
        });

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <OptionsLine
                        label="Condition"
                        options={conditionOptions}
                        target={conditionBlock}
                        propertyName="condition"
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(conditionBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
