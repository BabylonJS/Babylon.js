import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { TeleportOutBlock } from "core/Meshes/Node/Blocks/Teleport/teleportOutBlock";

export class TeleportOutDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        return nodeData.data.name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        const block = nodeData.data as TeleportOutBlock;
        return `linear-gradient(to right, white, ${BlockTools.GetColorFromConnectionNodeType(block.output.type)})`;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {}
}
