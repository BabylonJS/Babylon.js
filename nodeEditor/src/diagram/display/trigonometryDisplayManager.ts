import { IDisplayManager } from './displayManager';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { TrigonometryBlock, TrigonometryBlockOperations } from 'babylonjs/Materials/Node/Blocks/trigonometryBlock';

export class TrigonometryDisplayManager implements IDisplayManager {
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
        return "#405C86";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {       
        const trigonometryBlock = block as TrigonometryBlock;

        contentArea.classList.add("trigonometry-block");
        contentArea.innerHTML = TrigonometryBlockOperations[trigonometryBlock.operation];
    }
}