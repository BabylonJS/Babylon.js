import type { NodeRenderGraphTeleportInBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportInBlock";
import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { Nullable } from "core/types";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export class TeleportInDisplayManager implements IDisplayManager {
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
        const block = nodeData.data as NodeRenderGraphTeleportInBlock;
        return `linear-gradient(to right, ${BlockTools.GetColorFromConnectionNodeType(block.input.type)}, white)`;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {}

    public onSelectionChanged(nodeData: INodeData, selectedData: Nullable<INodeData>, manager: StateManager): void {
        const block = nodeData.data as NodeRenderGraphTeleportInBlock;
        if (selectedData !== nodeData) {
            if (this._hasHighlights) {
                for (const endpoint of block.endpoints) {
                    manager.onHighlightNodeObservable.notifyObservers({ data: endpoint, active: false });
                }
                this._hasHighlights = false;
            }
            return;
        }
        for (const endpoint of block.endpoints) {
            manager.onHighlightNodeObservable.notifyObservers({ data: endpoint, active: true });
        }
        this._hasHighlights = true;
    }

    public onDispose(nodeData: INodeData, manager: StateManager) {
        const block = nodeData.data as NodeRenderGraphTeleportInBlock;
        for (const endpoint of block.endpoints) {
            manager.onHighlightNodeObservable.notifyObservers({ data: endpoint, active: false });
        }
    }
}
