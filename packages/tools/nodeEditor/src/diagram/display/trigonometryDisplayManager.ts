import { IDisplayManager } from "./displayManager";
import { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import { TrigonometryBlock, TrigonometryBlockOperations } from "core/Materials/Node/Blocks/trigonometryBlock";

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
