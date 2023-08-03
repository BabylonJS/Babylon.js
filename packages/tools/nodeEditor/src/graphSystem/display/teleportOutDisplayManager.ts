import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { NodeMaterialTeleportOutBlock } from "core/Materials/Node/Blocks/Teleport/teleportOutBlock";
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
        const block = nodeData.data as NodeMaterialTeleportOutBlock;
        return `linear-gradient(to right, white, ${BlockTools.GetColorFromConnectionNodeType(block.output.type)})`;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {}

    public onSelectionChanged(nodeData: INodeData, selected: boolean, manager: StateManager): void {
        const block = nodeData.data as NodeMaterialTeleportOutBlock;
        if (!selected) {
            if (this._hasHighlights) {
                manager.onHighlightNodeObservable.notifyObservers({ data: block.entryPoint, active: false });
                this._hasHighlights = false;
            }
            return;
        }
        if (block.entryPoint) {
            manager.onHighlightNodeObservable.notifyObservers({ data: block.entryPoint, active: true });
            this._hasHighlights = true;
        }
    }
<<<<<<< HEAD

    public onDispose(nodeData: INodeData, manager: StateManager) {
        const block = nodeData.data as NodeMaterialTeleportOutBlock;
        if (block.entryPoint) {
            manager.onHighlightNodeObservable.notifyObservers({ data: block.entryPoint, active: false });
        }
    }
=======
>>>>>>> remotes/origin/master
}
