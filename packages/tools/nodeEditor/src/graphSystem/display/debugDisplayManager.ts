import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { IDisplayManager, VisualContentDescription } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as styles from "./debugDisplayManager.module.scss";
import * as commonStyles from "./common.module.scss";
import { TextureLineComponent } from "../../sharedComponents/textureLineComponent";
import type { GlobalState } from "node-editor/globalState";
import type { Nullable } from "core/types";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { NodeMaterialDebugBlock } from "core/Materials";

export class DebugDisplayManager implements IDisplayManager {
    private _previewCanvas: HTMLCanvasElement;
    private _previewImage: HTMLImageElement;

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
        if (selectedData === data && block.debug.isConnected) {
            const globalState = manager.data as GlobalState;

            globalState.onPreviewUpdatedObservable.addOnce((nodeMaterial) => {
                setTimeout(() => {
                    globalState.onPreviewSceneAfterRenderObservable.addOnce(() => {
                        if (globalState.previewTexture) {
                            TextureLineComponent.UpdatePreview(
                                this._previewCanvas,
                                globalState.previewTexture,
                                140,
                                {
                                    face: 0,
                                    displayRed: true,
                                    displayAlpha: true,
                                    displayBlue: true,
                                    displayGreen: true,
                                },
                                () => {
                                    this._previewImage.src = this._previewCanvas.toDataURL("image/png");
                                    this._previewImage.classList.remove(commonStyles.empty);
                                }
                            );
                        } else {
                            this._previewImage.classList.add(commonStyles.empty);
                        }
                    });
                }, 250);
            });
        }
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        if (!this._previewCanvas) {
            this._previewCanvas = contentArea.ownerDocument!.createElement("canvas");
            this._previewImage = contentArea.ownerDocument!.createElement("img");
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
