import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as localStyles from "./textureDisplayManager.module.scss";
import type { GeometryTextureBlock } from "core/Meshes/Node/Blocks/Textures/geometryTextureBlock";
import type { NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";

export class TextureDisplayManager implements IDisplayManager {
    private _previewCanvas: HTMLCanvasElement;
    private _previewImage: HTMLImageElement;

    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        return (nodeData.data as NodeGeometryBlock).name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        return "#323232";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        const block = nodeData.data as GeometryTextureBlock;

        if (!this._previewCanvas) {
            contentArea.classList.add(localStyles["texture-block"]);

            this._previewCanvas = contentArea.ownerDocument.createElement("canvas");
            this._previewImage = contentArea.ownerDocument.createElement("img");
            contentArea.appendChild(this._previewImage);
            this._previewImage.classList.add(localStyles.empty);
        }

        if (block.textureData) {
            this._previewCanvas.width = block.textureWidth;
            this._previewCanvas.height = block.textureHeight;
            const ctx = this._previewCanvas.getContext("2d");
            const imgData = ctx!.createImageData(block.textureWidth, block.textureHeight);

            // Convert Float32Array data
            for (let i = 0; i < block.textureData.length; i += 4) {
                imgData.data[i] = block.textureData[i] * 255; // R
                imgData.data[i + 1] = block.textureData[i + 1] * 255; // G
                imgData.data[i + 2] = block.textureData[i + 2] * 255; // B
                imgData.data[i + 3] = block.textureData[i + 3] * 255; // A
            }

            // Draw the image data on the canvas
            ctx!.putImageData(imgData, 0, 0);
            this._previewImage.src = this._previewCanvas.toDataURL("image/png");
            this._previewImage.classList.remove(localStyles.empty);
        } else {
            this._previewImage.classList.add(localStyles.empty);
        }
    }
}
