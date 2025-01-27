import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { IDisplayManager, VisualContentDescription } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as styles from "./debugDisplayManager.module.scss";

export class DebugDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        return (nodeData.data as NodeMaterialBlock).name;
    }

    public getBackgroundColor(): string {
        return "#05400d";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {}

    public updateFullVisualContent(data: INodeData, visualContent: VisualContentDescription): void {
        visualContent.visual.classList.add(styles["debugBlock"]);
        visualContent.headerContainer.classList.add(styles.hidden);
        visualContent.headerContainer.classList.add(styles.hidden);
        visualContent.connections.classList.add(styles.translatedConnections);
    }
}
