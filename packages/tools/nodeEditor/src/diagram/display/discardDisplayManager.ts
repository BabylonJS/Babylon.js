import type { IDisplayManager } from "./displayManager";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";

export class DiscardDisplayManager implements IDisplayManager {
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
        return "#540b0b";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        contentArea.classList.add("discard-block");
    }
}
