import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { OptionsLineComponent } from "../../sharedComponents/optionsLineComponent";
import type { ConditionalBlock } from "core/Materials/Node/Blocks/conditionalBlock";
import { ConditionalBlockConditions } from "core/Materials/Node/Blocks/conditionalBlock";
import type { IPropertyComponentProps } from "../../sharedComponents/nodeGraphSystem/propertyComponentProps";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";

export class ConditionalPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    render() {
        const conditionBlock = this.props.data as ConditionalBlock;

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
                <GeneralPropertyTabComponent globalState={this.props.globalState} data={this.props.data} />
                <LineContainerComponent title="PROPERTIES">
                    <OptionsLineComponent
                        label="Condition"
                        options={conditionOptions}
                        target={conditionBlock}
                        propertyName="condition"
                        onSelect={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(conditionBlock);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            this.forceUpdate();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
