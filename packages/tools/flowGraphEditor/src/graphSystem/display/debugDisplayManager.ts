import { type IDisplayManager, type VisualContentDescription } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import { type INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as styles from "./debugDisplayManager.module.scss";
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

        visual.classList.add(styles.debugBlock);
        headerContainer.classList.add(styles.hidden);
        content.classList.add(styles.debugContent);
        content.textContent = "?";
        connections.classList.add(styles.translatedConnections);
        selectionBorder.classList.add(styles.roundSelectionBorder);
    }
}
