import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { TrigonometryBlock } from "core/Materials/Node/Blocks/trigonometryBlock";
import { TrigonometryBlockOperations } from "core/Materials/Node/Blocks/trigonometryBlock";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";

export class TrigonometryPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        const trigonometryBlock = this.props.nodeData.data as TrigonometryBlock;

        const operationOptions: { label: string; value: TrigonometryBlockOperations }[] = [
            { label: "Cos", value: TrigonometryBlockOperations.Cos },
            { label: "Sin", value: TrigonometryBlockOperations.Sin },
            { label: "Abs", value: TrigonometryBlockOperations.Abs },
            { label: "Exp", value: TrigonometryBlockOperations.Exp },
            { label: "Exp2", value: TrigonometryBlockOperations.Exp2 },
            { label: "Round", value: TrigonometryBlockOperations.Round },
            { label: "Ceiling", value: TrigonometryBlockOperations.Ceiling },
            { label: "Floor", value: TrigonometryBlockOperations.Floor },
            { label: "Sqrt", value: TrigonometryBlockOperations.Sqrt },
            { label: "ArcCos", value: TrigonometryBlockOperations.ArcCos },
            { label: "ArcSin", value: TrigonometryBlockOperations.ArcSin },
            { label: "ArcTan", value: TrigonometryBlockOperations.ArcTan },
            { label: "Tan", value: TrigonometryBlockOperations.Tan },
            { label: "Log", value: TrigonometryBlockOperations.Log },
            { label: "Fract", value: TrigonometryBlockOperations.Fract },
            { label: "Sign", value: TrigonometryBlockOperations.Sign },
            { label: "Radians to degrees", value: TrigonometryBlockOperations.Degrees },
            { label: "Degrees to radians", value: TrigonometryBlockOperations.Radians },
            { label: "Set", value: TrigonometryBlockOperations.Set },
        ];

        operationOptions.sort((a, b) => {
            return a.label.localeCompare(b.label);
        });

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <OptionsLine
                        label="Operation"
                        options={operationOptions}
                        target={trigonometryBlock}
                        propertyName="operation"
                        onSelect={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(trigonometryBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
