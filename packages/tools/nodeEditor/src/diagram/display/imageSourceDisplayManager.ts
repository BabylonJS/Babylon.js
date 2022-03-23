import { IDisplayManager } from "./displayManager";
import { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import { ImageSourceBlock } from "core/Materials/Node/Blocks/Dual/imageSourceBlock";
import { TextureLineComponent } from "../../sharedComponents/textureLineComponent";

export class ImageSourceDisplayManager implements IDisplayManager {
    private _previewCanvas: HTMLCanvasElement;
    private _previewImage: HTMLImageElement;

    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(): string {
        return "#323232";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        const imageSourceBlock = block as ImageSourceBlock;

        if (!this._previewCanvas) {
            contentArea.classList.add("texture-block");
            contentArea.classList.add("image-source-block");

            this._previewCanvas = contentArea.ownerDocument!.createElement("canvas");
            this._previewImage = contentArea.ownerDocument!.createElement("img");
            contentArea.appendChild(this._previewImage);
            this._previewImage.classList.add("empty");
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
                    this._previewImage.classList.remove("empty");
                }
            );
        } else {
            this._previewImage.classList.add("empty");
        }
    }
}
