import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { NodeRenderGraphTeleportOutBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportOutBlock";
import type { Nullable } from "core/types";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

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
        const block = nodeData.data as NodeRenderGraphTeleportOutBlock;
        return `linear-gradient(to right, white, ${BlockTools.GetColorFromConnectionNodeType(block.output.type)})`;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {}

    public onSelectionChanged(nodeData: INodeData, selectedData: Nullable<INodeData>, manager: StateManager): void {
        const block = nodeData.data as NodeRenderGraphTeleportOutBlock;
        if (selectedData !== nodeData) {
            if (this._hasHighlights) {
                let removeHighlight: boolean;

                if (selectedData && selectedData.data.getClassName() === "NodeRenderGraphTeleportOutBlock") {
                    const otherTeleport = selectedData.data as NodeRenderGraphTeleportOutBlock;

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
        const block = nodeData.data as NodeRenderGraphTeleportOutBlock;
        if (block.entryPoint) {
            manager.onHighlightNodeObservable.notifyObservers({ data: block.entryPoint, active: false });
        }
    }
}
