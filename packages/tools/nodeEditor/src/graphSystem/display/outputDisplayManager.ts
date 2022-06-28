import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";

export class OutputDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        return nodeData.data.name;
    }

    public getBackgroundColor(): string {
        return "rgb(106, 44, 131)";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        contentArea.classList.add("output-block");
    }
}
