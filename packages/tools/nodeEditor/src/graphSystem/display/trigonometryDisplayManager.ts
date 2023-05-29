import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { TrigonometryBlock } from "core/Materials/Node/Blocks/trigonometryBlock";
import { TrigonometryBlockOperations } from "core/Materials/Node/Blocks/trigonometryBlock";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import styles from "./trigonometryDisplayManager.modules.scss";

export class TrigonometryDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(nodeData: INodeData): string {
        return (nodeData.data as NodeMaterialBlock).name;
    }

    public getBackgroundColor(): string {
        return "#405C86";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        const trigonometryBlock = nodeData.data as TrigonometryBlock;

        contentArea.classList.add(styles["trigonometry-block"]);
        contentArea.innerHTML = TrigonometryBlockOperations[trigonometryBlock.operation];
    }
}
