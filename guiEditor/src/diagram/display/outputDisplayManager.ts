import { IDisplayManager } from './displayManager';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';

export class OutputDisplayManager implements IDisplayManager {
    public getHeaderClass(block: NodeMaterialBlock) {
        return "";
    }

    public shouldDisplayPortLabels(block: NodeMaterialBlock): boolean {
        return true;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(block: NodeMaterialBlock): string {
        return "rgb(106, 44, 131)";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {       
        contentArea.classList.add("output-block");
    }
}