import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { GetBlockType, BlockTypeHeaderColor, BlockTypeBodyColor } from "../blockTypeColors";

/**
 * Default display manager for all flow graph blocks.
 * Colors the node header and body based on block type (event / execution / data).
 */
export class FlowGraphDefaultDisplayManager implements IDisplayManager {
    public getHeaderClass(_data: INodeData): string {
        return "";
    }

    public shouldDisplayPortLabels(_data: IPortData): boolean {
        return true;
    }

    public getHeaderText(data: INodeData): string {
        return data.name;
    }

    public getBackgroundColor(data: INodeData): string {
        const blockType = GetBlockType(data.getClassName(), data.data);
        return BlockTypeBodyColor[blockType];
    }

    public updatePreviewContent(_data: INodeData, _contentArea: HTMLDivElement): void {
        // nothing
    }

    public updateFullVisualContent(data: INodeData, visualContent: { [key: string]: HTMLElement }): void {
        const blockType = GetBlockType(data.getClassName(), data.data);
        const headerContainer = visualContent.headerContainer as HTMLDivElement;
        if (headerContainer) {
            headerContainer.style.background = BlockTypeHeaderColor[blockType];
        }
    }
}
