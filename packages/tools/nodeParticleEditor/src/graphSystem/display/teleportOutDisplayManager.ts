import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { Nullable } from "core/types";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import type { ParticleTeleportOutBlock } from "core/Particles/Node/Blocks/Teleport/particleTeleportOutBlock";

export class TeleportOutDisplayManager implements IDisplayManager {
    private _hasHighlights = false;

    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        return nodeData.data.name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        const block = nodeData.data as ParticleTeleportOutBlock;
        return `linear-gradient(to right, white, ${BlockTools.GetColorFromConnectionNodeType(block.output.type)})`;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {}

    public onSelectionChanged(nodeData: INodeData, selectedData: Nullable<INodeData>, manager: StateManager): void {
        const block = nodeData.data as ParticleTeleportOutBlock;
        if (selectedData !== nodeData) {
            if (this._hasHighlights) {
                let removeHighlight: boolean;

                if (selectedData && selectedData.data.getClassName() === "ParticleTeleportOutBlock") {
                    const otherTeleport = selectedData.data as ParticleTeleportOutBlock;

                    removeHighlight = otherTeleport.entryPoint !== block.entryPoint;
                } else {
                    removeHighlight = true;
                }

                if (removeHighlight) {
                    manager.onHighlightNodeObservable.notifyObservers({ data: block.entryPoint, active: false });
                }
                this._hasHighlights = false;
            }
            return;
        }
        if (block.entryPoint) {
            manager.onHighlightNodeObservable.notifyObservers({ data: block.entryPoint, active: true });
            this._hasHighlights = true;
        }
    }

    public onDispose(nodeData: INodeData, manager: StateManager) {
        const block = nodeData.data as ParticleTeleportOutBlock;
        if (block.entryPoint) {
            manager.onHighlightNodeObservable.notifyObservers({ data: block.entryPoint, active: false });
        }
    }
}
