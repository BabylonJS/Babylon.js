import type { IDisplayManager } from "../../sharedComponents/nodeGraphSystem/displayManager";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { GradientBlock } from "core/Materials/Node/Blocks/gradientBlock";

export class GradientDisplayManager implements IDisplayManager {
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
        const gradientBlock = block as GradientBlock;

        const gradients = gradientBlock.colorSteps.map((c) => `rgb(${c.color.r * 255}, ${c.color.g * 255}, ${c.color.b * 255}) ${c.step * 100}%`);

        return gradients.length ? `linear-gradient(90deg, ${gradients.join(", ")})` : "black";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        contentArea.classList.add("gradient-block");
    }
}
