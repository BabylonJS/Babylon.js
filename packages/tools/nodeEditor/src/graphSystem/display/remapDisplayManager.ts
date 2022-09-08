import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import type { RemapBlock } from "core/Materials/Node/Blocks/remapBlock";
import type { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import styles from "./remapDisplayManager.modules.scss";

export class RemapDisplayManager implements IDisplayManager {
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
        return "#4086BB";
    }

    private _extractInputValue(connectionPoint: NodeMaterialConnectionPoint) {
        const connectedBlock = connectionPoint.connectedPoint!.ownerBlock;

        if (connectedBlock.isInput) {
            const inputBlock = connectedBlock as InputBlock;

            if (inputBlock.isUniform && !inputBlock.isSystemValue) {
                return inputBlock.value;
            }
        }

        return "?";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        const remapBlock = nodeData.data as RemapBlock;

        const sourceRangeX = remapBlock.sourceMin.isConnected ? this._extractInputValue(remapBlock.sourceMin) : remapBlock.sourceRange.x;
        const sourceRangeY = remapBlock.sourceMax.isConnected ? this._extractInputValue(remapBlock.sourceMax) : remapBlock.sourceRange.y;
        const targetRangeX = remapBlock.targetMin.isConnected ? this._extractInputValue(remapBlock.targetMin) : remapBlock.targetRange.x;
        const targetRangeY = remapBlock.targetMax.isConnected ? this._extractInputValue(remapBlock.targetMax) : remapBlock.targetRange.y;

        contentArea.classList.add(styles["remap-block"]);
        contentArea.innerHTML = `[${sourceRangeX}, ${sourceRangeY}] -> [${targetRangeX}, ${targetRangeY}]`;
    }
}
