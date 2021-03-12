import { IDisplayManager } from './displayManager';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { ConditionalBlockConditions, ConditionalBlock } from 'babylonjs/Materials/Node/Blocks/conditionalBlock';

export class ConditionalDisplayManager implements IDisplayManager {
    public getHeaderClass(block: NodeMaterialBlock) {
        return "";
    }

    public shouldDisplayPortLabels(block: NodeMaterialBlock): boolean {
        return true;
    }

    public getHeaderText(block: NodeMaterialBlock): string {        
        let conditionBlock = block as ConditionalBlock;
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

        return block.name + " (" + desc + ")"
    }

    public getBackgroundColor(block: NodeMaterialBlock): string {
        return "#00A080";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {       
    }
}