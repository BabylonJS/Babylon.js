import { BlockTools } from "../../blockTools";
import type { IDisplayManager, VisualContentDescription } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import styles from "./elbowDisplayManager.module.scss";
import type { NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";
import type { GeometryElbowBlock } from "core/Meshes/Node/Blocks/geometryElbowBlock";

export class ElbowDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(nodeData: INodeData): string {
        return (nodeData.data as NodeGeometryBlock).name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        const elbowBlock = nodeData.data as GeometryElbowBlock;

        return BlockTools.GetColorFromConnectionNodeType(elbowBlock.input.type);
    }

    public updatePreviewContent(_nodeData: INodeData, _contentArea: HTMLDivElement): void {}

    public updateFullVisualContent(data: INodeData, visualContent: VisualContentDescription): void {
        const visual = visualContent.visual;
        const headerContainer = visualContent.headerContainer;
        const content = visualContent.content;
        const connections = visualContent.connections;
        const selectionBorder = visualContent.selectionBorder;

        visual.classList.add(styles.elbowBlock);
        headerContainer.classList.add(styles.hidden);
        content.classList.add(styles.hidden);
        connections.classList.add(styles.translatedConnections);
        selectionBorder.classList.add(styles.roundSelectionBorder);
    }
}
