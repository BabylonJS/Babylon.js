import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { IDisplayManager, VisualContentDescription } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as styles from "./debugDisplayManager.module.scss";
import * as commonStyles from "./common.module.scss";
import type { GlobalState } from "node-editor/globalState";
import type { Nullable } from "core/types";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import type { NodeMaterialDebugBlock } from "core/Materials";
import type { Observer } from "core/Misc/observable";

export class DebugDisplayManager implements IDisplayManager {
    private _previewCanvas: HTMLCanvasElement;
    private _previewImage: HTMLImageElement;
    private _onPreviewSceneAfterRenderObserver: Nullable<Observer<void>>;

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
        return "#543a5c";
    }

    public onSelectionChanged?(data: INodeData, selectedData: Nullable<INodeData>, manager: StateManager) {
        const block = data.data as NodeMaterialDebugBlock;

        const globalState = manager.data as GlobalState;

        if (globalState.forcedDebugBlock !== null) {
            return;
        }

        if (selectedData === data && !this._onPreviewSceneAfterRenderObserver) {
            block._forcedActive = true;
            globalState.onPreviewUpdatedObservable.addOnce(() => {
                this._onPreviewSceneAfterRenderObserver = globalState.onPreviewSceneAfterRenderObservable.add(async () => {
                    if (globalState.previewTexture && block.debug.isConnected) {
                        const size = globalState.previewTexture.getSize();
                        const data = (await globalState.previewTexture.readPixels()!) as Uint8Array;
                        this._previewCanvas.width = size.width;
                        this._previewCanvas.height = size.height;
                        const ctx = this._previewCanvas.getContext("2d");
                        const imgData = ctx!.getImageData(0, 0, size.width, size.height);

                        imgData.data.set(data);

                        // Draw the image data on the canvas
                        ctx!.putImageData(imgData, 0, 0);
                        this._previewImage.src = this._previewCanvas.toDataURL("image/png");
                        this._previewImage.classList.remove(commonStyles.empty);
                    } else {
                        this._previewImage.classList.add(commonStyles.empty);
                    }

                    // Let's do a round robin to refresh the debug blocks
                    if (globalState.debugBlocksToRefresh.length > 0) {
                        const nextBlock = globalState.debugBlocksToRefresh.pop();
                        const nodeData = globalState.onGetNodeFromBlock(nextBlock!);
                        if (nodeData) {
                            globalState.stateManager.onSelectionChangedObservable.notifyObservers({ selection: nodeData });
                        }
                    }
                });
            });
        } else {
            block._forcedActive = false;
            globalState.onPreviewSceneAfterRenderObservable.remove(this._onPreviewSceneAfterRenderObserver);
            this._onPreviewSceneAfterRenderObserver = null;
        }
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        if (!this._previewCanvas) {
            this._previewCanvas = contentArea.ownerDocument.createElement("canvas");
            this._previewImage = contentArea.ownerDocument.createElement("img");
            this._previewImage.style.width = "100%";
            this._previewImage.style.height = "100%";
            this._previewImage.style.transform = "scaleY(-1)";
            contentArea.appendChild(this._previewImage);
            this._previewImage.classList.add(commonStyles.empty);
        }
    }

    public updateFullVisualContent(data: INodeData, visualContent: VisualContentDescription): void {
        visualContent.visual.classList.add(styles["debugBlock"]);
        visualContent.headerContainer.classList.add(styles.hidden);
        visualContent.headerContainer.classList.add(styles.hidden);
        visualContent.connections.classList.add(styles.translatedConnections);
        visualContent.content.classList.add(styles["texture-area"]);
    }
}
