import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { ImageSourceBlock } from "core/Materials/Node/Blocks/Dual/imageSourceBlock";
import { TextureLineComponent } from "../../sharedComponents/textureLineComponent";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import localStyles from "./imageSourceDisplayManager.modules.scss";
import commonStyles from "./common.modules.scss";

export class ImageSourceDisplayManager implements IDisplayManager {
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
        return "#323232";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        const imageSourceBlock = nodeData.data as ImageSourceBlock;

        if (!this._previewCanvas) {
            contentArea.classList.add(commonStyles["texture-block"]);
            contentArea.classList.add(localStyles["image-source-block"]);

            this._previewCanvas = contentArea.ownerDocument!.createElement("canvas");
            this._previewImage = contentArea.ownerDocument!.createElement("img");
            contentArea.appendChild(this._previewImage);
            this._previewImage.classList.add(commonStyles.empty);
        }

        if (imageSourceBlock.texture) {
            TextureLineComponent.UpdatePreview(
                this._previewCanvas,
                imageSourceBlock.texture,
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
    }
}
