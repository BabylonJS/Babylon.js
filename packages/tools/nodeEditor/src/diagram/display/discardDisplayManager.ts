import { IDisplayManager } from "./displayManager";
import { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";

export class DiscardDisplayManager implements IDisplayManager {
    public getHeaderClass(_block: NodeMaterialBlock) {
        return "";
    }

    public shouldDisplayPortLabels(_block: NodeMaterialBlock): boolean {
        return true;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(_block: NodeMaterialBlock): string {
        return "#540b0b";
    }

    public updatePreviewContent(_block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        contentArea.classList.add("discard-block");
    }
}
