import type { IDisplayManager } from "../../sharedComponents/nodeGraphSystem/displayManager";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { ElbowBlock } from "core/Materials/Node/Blocks/elbowBlock";
import { BlockTools } from "../../blockTools";

export class ElbowDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(block: NodeMaterialBlock): string {
        const elbowBlock = block as ElbowBlock;

        return BlockTools.GetColorFromConnectionNodeType(elbowBlock.input.type);
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        contentArea.parentElement!.classList.add("elbow-block");
    }
}
