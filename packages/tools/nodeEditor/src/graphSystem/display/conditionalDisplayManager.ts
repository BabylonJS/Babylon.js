import type { ConditionalBlock } from "core/Materials/Node/Blocks/conditionalBlock";
import { ConditionalBlockConditions } from "core/Materials/Node/Blocks/conditionalBlock";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";

export class ConditionalDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        const conditionBlock = nodeData.data as ConditionalBlock;
        let desc = "";

        switch (conditionBlock.condition) {
            case ConditionalBlockConditions.Equal:
                desc = "=";
                break;
            case ConditionalBlockConditions.NotEqual:
                desc = "!=";
                break;
            case ConditionalBlockConditions.LessThan:
                desc = "<";
                break;
            case ConditionalBlockConditions.LessOrEqual:
                desc = "<=";
                break;
            case ConditionalBlockConditions.GreaterThan:
                desc = ">";
                break;
            case ConditionalBlockConditions.GreaterOrEqual:
                desc = ">=";
                break;
            case ConditionalBlockConditions.Xor:
                desc = "xor";
                break;
            case ConditionalBlockConditions.Or:
                desc = "|";
                break;
            case ConditionalBlockConditions.And:
                desc = "&";
                break;
        }

        return conditionBlock.name + " (" + desc + ")";
    }

    public getBackgroundColor(): string {
        return "#00A080";
    }

    public updatePreviewContent(): void {}
}
