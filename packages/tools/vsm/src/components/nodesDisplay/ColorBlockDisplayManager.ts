import type { IDisplayManager, VisualContentDescription } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import styles from "./ColorBlockDisplayManager.modules.scss";

export class ColorBlockDisplayManager implements IDisplayManager {
    getHeaderClass(data: INodeData): string {
        return styles.header;
    }
    shouldDisplayPortLabels(data: IPortData): boolean {
        return false;
    }
    updatePreviewContent(data: INodeData, contentArea: HTMLDivElement): void {}
    getBackgroundColor(data: INodeData): string {
        return data.data.color;
    }
    getHeaderText(data: INodeData): string {
        return data.name;
    }
    updateFullVisualContent(data: INodeData, visualContent: VisualContentDescription): void {
        const headerContainer = visualContent.headerContainer;
        headerContainer.style.backgroundColor = data.data.color;
        headerContainer.style.filter = "saturate(0.3)";
    }
}
