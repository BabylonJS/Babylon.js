import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";

export class PBRDisplayManager implements IDisplayManager {
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
        return "#6174FA";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        contentArea.classList.add("pbr-block");
    }
}
