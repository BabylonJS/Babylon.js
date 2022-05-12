import type { IDisplayManager } from "./displayManager";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";

export class OutputDisplayManager implements IDisplayManager {
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
        return "rgb(106, 44, 131)";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        contentArea.classList.add("output-block");
    }
}
