import { IDisplayManager } from './displayManager';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';

export class OutputDisplayManager implements IDisplayManager {
    public getHeaderClass(block: NodeMaterialBlock) {
        return "";
    }

    public shouldDisplayPortLabels(block: NodeMaterialBlock): boolean {
        return true;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        let inputBlock = block as InputBlock;
        return inputBlock.name;
    }

    public getBackgroundColor(block: NodeMaterialBlock): string {
        return "rgb(106, 44, 131)";
    }

    public setPreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {       
        contentArea.classList.add("output-block");
    }
}