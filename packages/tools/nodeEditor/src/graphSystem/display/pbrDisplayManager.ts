import type { IDisplayManager } from "../../../../../dev/sharedUiComponents/src/nodeGraphSystem/interfaces/displayManager";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";

export class PBRDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(): string {
        return "#6174FA";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        contentArea.classList.add("pbr-block");
    }
}
