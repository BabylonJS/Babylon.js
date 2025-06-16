import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as styles from "./updateDisplayManager.module.scss";

export class UpdateDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return styles["update-display"];
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        return nodeData.data.name;
    }

    public getBackgroundColor(): string {
        return "";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {}
}
