import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { GradientBlock } from "core/Materials/Node/Blocks/gradientBlock";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import styles from "./gradientDisplayManager.modules.scss";

export class GradientDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(nodeData: INodeData): string {
        return (nodeData.data as NodeMaterialBlock).name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        const gradientBlock = nodeData.data as GradientBlock;

        const gradients = gradientBlock.colorSteps.map((c) => `rgb(${c.color.r * 255}, ${c.color.g * 255}, ${c.color.b * 255}) ${c.step * 100}%`);

        return gradients.length ? `linear-gradient(90deg, ${gradients.join(", ")})` : "black";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        contentArea.classList.add(styles.gradientBlock);
    }
}
