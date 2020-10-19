import { IDisplayManager } from './displayManager';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';

export class ClampDisplayManager implements IDisplayManager {
    public getHeaderClass(block: NodeMaterialBlock) {
        return "";
    }

    public shouldDisplayPortLabels(block: NodeMaterialBlock): boolean {
        return false;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(block: NodeMaterialBlock): string {
        return "#4086BB";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {       
        const clampBlock = block as ClampBlock;

        contentArea.classList.add("clamp-block");
        contentArea.innerHTML = `[${clampBlock.minimum}, ${clampBlock.maximum}]`;
    }
}