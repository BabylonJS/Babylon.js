import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { GetBlockType, BlockTypeBodyColor } from "../blockTypeColors";

/**
 * Default display manager for all flow graph blocks.
 * Colors the node body based on block type (event / execution / data).
 * The header uses the default black from the shared graphNode CSS, matching the
 * design of the Node Material Editor, Node Geometry Editor, and Node Particle Editor.
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
}
