import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { CurveBlock } from "core/Materials/Node/Blocks/curveBlock";
import { CurveBlockTypes } from "core/Materials/Node/Blocks/curveBlock";
import styles from "./curveDisplayManager.modules.scss";

export class CurveDisplayManager implements IDisplayManager {
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
        const curveBlock = nodeData.data as CurveBlock;

        contentArea.classList.add(styles["curve-block"]);
        contentArea.innerHTML = CurveBlockTypes[curveBlock.type];
    }
}
