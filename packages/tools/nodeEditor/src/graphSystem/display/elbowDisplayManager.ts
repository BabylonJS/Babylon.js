import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { ElbowBlock } from "core/Materials/Node/Blocks/elbowBlock";
import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import styles from "./elbowDisplayManager.modules.scss";

export class ElbowDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(nodeData: INodeData): string {
        return (nodeData.data as NodeMaterialBlock).name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        const elbowBlock = nodeData.data as ElbowBlock;

        return BlockTools.GetColorFromConnectionNodeType(elbowBlock.input.type);
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        contentArea.parentElement!.classList.add(styles["elbow-block"]);
    }
}
