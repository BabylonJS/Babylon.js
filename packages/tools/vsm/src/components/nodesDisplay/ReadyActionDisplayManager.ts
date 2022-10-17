import type { IDisplayManager, VisualContentDescription } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import styles from "./CommonStyles.modules.scss";

const ReadyActionBackgroundColor = "red";

export class ReadyActionBlockDisplayManager implements IDisplayManager {
    getHeaderClass(data: INodeData): string {
        return styles.noBorder;
    }
    shouldDisplayPortLabels(data: IPortData): boolean {
        return false;
    }
    updatePreviewContent(data: INodeData, contentArea: HTMLDivElement): void {
        contentArea.classList.add(styles.textContent);
        contentArea.innerHTML = "READY";
    }
    getBackgroundColor(data: INodeData): string {
        return ReadyActionBackgroundColor;
    }
    getHeaderText(data: INodeData): string {
        return "STATE";
    }
    updateFullVisualContent(data: INodeData, visualContent: VisualContentDescription): void {
        const headerContainer = visualContent.headerContainer;
        headerContainer.style.backgroundColor = ReadyActionBackgroundColor;
        headerContainer.style.filter = "saturate(0.3)";
    }
}
