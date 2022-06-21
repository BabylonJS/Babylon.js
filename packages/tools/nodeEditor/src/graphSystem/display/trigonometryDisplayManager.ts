import type { IDisplayManager } from "../../sharedComponents/nodeGraphSystem/interfaces/displayManager";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { TrigonometryBlock } from "core/Materials/Node/Blocks/trigonometryBlock";
import { TrigonometryBlockOperations } from "core/Materials/Node/Blocks/trigonometryBlock";

export class TrigonometryDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(): string {
        return "#405C86";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        const trigonometryBlock = block as TrigonometryBlock;

        contentArea.classList.add("trigonometry-block");
        contentArea.innerHTML = TrigonometryBlockOperations[trigonometryBlock.operation];
    }
}
