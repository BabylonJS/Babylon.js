import { type IDisplayManager, type VisualContentDescription } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import { type INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import { type FlowGraphDebugBlock } from "core/FlowGraph/Blocks/Data/flowGraphDebugBlock";

export class DebugDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(nodeData: INodeData): string {
        return nodeData.data.name;
    }

    public getBackgroundColor(_nodeData: INodeData): string {
        return "#7B5EA7"; // purple tint to distinguish debug blocks
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        const debugBlock = nodeData.data as FlowGraphDebugBlock;
        const lastEntry = debugBlock.log.length > 0 ? debugBlock.log[debugBlock.log.length - 1] : null;
        if (lastEntry) {
            contentArea.textContent = lastEntry[0];
            contentArea.title = lastEntry[1];
        }
    }

    public updateFullVisualContent(data: INodeData, visualContent: VisualContentDescription): void {
        const visual = visualContent.visual;
        const headerContainer = visualContent.headerContainer;
        const content = visualContent.content;
        const connections = visualContent.connections;
        const selectionBorder = visualContent.selectionBorder;

        visual.style.width = "40px";
        visual.style.gridTemplateRows = "0px 40px 0px";
        visual.style.borderRadius = "5px";
        visual.style.transform = "translateY(-7px)";

        headerContainer.style.display = "none";

        content.style.width = "20px";
        content.style.transform = "translate(16px, 10px)";
        content.style.fontSize = "16px";
        content.style.fontWeight = "bold";
        content.style.color = "white";
        content.style.pointerEvents = "none";
        content.style.userSelect = "none";
        content.textContent = "?";

        connections.style.transform = "translateY(7px)";

        selectionBorder.style.borderRadius = "0px";
    }
}
