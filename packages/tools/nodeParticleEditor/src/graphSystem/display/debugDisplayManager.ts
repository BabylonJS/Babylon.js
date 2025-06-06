import { BlockTools } from "../../blockTools";
import type { IDisplayManager, VisualContentDescription } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as styles from "./debugDisplayManager.module.scss";
import type { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import type { ParticleDebugBlock } from "core/Particles/Node/Blocks/particleDebugBlock";

export class DebugDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(nodeData: INodeData): string {
        return (nodeData.data as NodeParticleBlock).name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        const debugBlock = nodeData.data as ParticleDebugBlock;

        return BlockTools.GetColorFromConnectionNodeType(debugBlock.input.type);
    }

    public updatePreviewContent(_nodeData: INodeData, _contentArea: HTMLDivElement): void {}

    public updateFullVisualContent(data: INodeData, visualContent: VisualContentDescription): void {
        const visual = visualContent.visual;
        const headerContainer = visualContent.headerContainer;
        const content = visualContent.content;
        const connections = visualContent.connections;
        const selectionBorder = visualContent.selectionBorder;

        visual.classList.add(styles.debugBlock);
        headerContainer.classList.add(styles.hidden);
        content.classList.add(styles.debugContent);
        content.innerHTML = "?";
        connections.classList.add(styles.translatedConnections);
        selectionBorder.classList.add(styles.roundSelectionBorder);
    }
}
