import type { TeleportInBlock } from "core/Meshes/Node/Blocks/Teleport/teleportInBlock";
import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";

export class TeleportInDisplayManager implements IDisplayManager {
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
        const block = nodeData.data as TeleportInBlock;
        return `linear-gradient(to right, ${BlockTools.GetColorFromConnectionNodeType(block.input.type)}, white)`;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {}
}
