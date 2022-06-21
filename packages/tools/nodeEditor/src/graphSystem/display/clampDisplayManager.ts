import type { IDisplayManager } from "../../../../../dev/sharedUiComponents/src/nodeGraphSystem/interfaces/displayManager";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { ClampBlock } from "core/Materials/Node/Blocks/clampBlock";

export class ClampDisplayManager implements IDisplayManager {
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
        return "#4086BB";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        const clampBlock = block as ClampBlock;

        contentArea.classList.add("clamp-block");
        contentArea.innerHTML = `[${clampBlock.minimum}, ${clampBlock.maximum}]`;
    }
}
