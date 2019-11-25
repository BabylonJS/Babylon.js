import { IDisplayManager } from './displayManager';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { RemapBlock } from 'babylonjs/Materials/Node/Blocks/remapBlock';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';

export class RemapDisplayManager implements IDisplayManager {
    public getHeaderClass(block: NodeMaterialBlock) {
        return "";
    }

    public shouldDisplayPortLabels(block: NodeMaterialBlock): boolean {
        return true;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(block: NodeMaterialBlock): string {
        return "#4086BB";
    }

    private _extractInputValue(connectionPoint: NodeMaterialConnectionPoint) {
        let connectedBlock = connectionPoint.connectedPoint!.ownerBlock;

        if (connectedBlock.isInput) {
            let inputBlock = connectedBlock as InputBlock;

            if (inputBlock.isUniform && !inputBlock.isSystemValue) {
                return inputBlock.value;
            }
        }

        return "?";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {       
        const remapBlock = block as RemapBlock;

        let sourceRangeX = remapBlock.sourceMin.isConnected ? this._extractInputValue(remapBlock.sourceMin) : remapBlock.sourceRange.x;
        let sourceRangeY = remapBlock.sourceMax.isConnected ? this._extractInputValue(remapBlock.sourceMax) : remapBlock.sourceRange.y;
        let targetRangeX = remapBlock.targetMin.isConnected ? this._extractInputValue(remapBlock.targetMin) : remapBlock.targetRange.x;
        let targetRangeY = remapBlock.targetMax.isConnected ? this._extractInputValue(remapBlock.targetMax) : remapBlock.targetRange.y;        

        contentArea.classList.add("remap-block");
        contentArea.innerHTML = `[${sourceRangeX}, ${sourceRangeY}] -> [${targetRangeX}, ${targetRangeY}]`;
    }
}