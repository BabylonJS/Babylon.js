import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { ClampBlock } from "core/Materials/Node/Blocks/clampBlock";
import { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";

export class ClampDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(nodeData: INodeData): string {
        return (nodeData.data as NodeMaterialBlock).name;
    }

    public getBackgroundColor(): string {
        return "#4086BB";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        const clampBlock = nodeData.data as ClampBlock;

        contentArea.classList.add("clamp-block");
        contentArea.innerHTML = `[${clampBlock.minimum}, ${clampBlock.maximum}]`;
    }
}
