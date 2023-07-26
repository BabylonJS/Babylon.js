import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import styles from "./sourceDisplayManager.modules.scss";

export class SourceDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return styles["source-block"];
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        return nodeData.data.name;
    }

    public getBackgroundColor(): string {
        return "gray";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
    }
}
