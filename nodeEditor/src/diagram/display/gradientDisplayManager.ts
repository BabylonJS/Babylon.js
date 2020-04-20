import { IDisplayManager } from './displayManager';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';

export class GradientDisplayManager implements IDisplayManager {
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
        let gradientBlock = block as GradientBlock;

        let gradients = gradientBlock.colorSteps.map(c => `rgb(${c.color.r * 255}, ${c.color.g * 255}, ${c.color.b * 255}) ${c.step * 100}%`);

        return gradients.length ? `linear-gradient(90deg, ${gradients.join(", ")})` : 'black';
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {       
        contentArea.classList.add("gradient-block");
    }
}