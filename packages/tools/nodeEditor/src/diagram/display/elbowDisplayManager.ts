import { IDisplayManager } from "./displayManager";
import { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import { ElbowBlock } from "core/Materials/Node/Blocks/elbowBlock";
import { BlockTools } from "../../blockTools";

export class ElbowDisplayManager implements IDisplayManager {
    public getHeaderClass(_block: NodeMaterialBlock) {
        return "";
    }

    public shouldDisplayPortLabels(_block: NodeMaterialBlock): boolean {
        return false;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(block: NodeMaterialBlock): string {
        const elbowBlock = block as ElbowBlock;

        return BlockTools.GetColorFromConnectionNodeType(elbowBlock.input.type);
    }

    public updatePreviewContent(_block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        contentArea.parentElement!.classList.add("elbow-block");
    }
}
