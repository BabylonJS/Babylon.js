import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as localStyles from "./textureDisplayManager.module.scss";
import type { NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";
import type { ParticleTextureSourceBlock } from "core/Particles/Node/Blocks/particleSourceTextureBlock";

export class TextureDisplayManager implements IDisplayManager {
    private _previewImage: HTMLImageElement;
    private _previewCanvas: HTMLCanvasElement;

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
        const block = nodeData.data as ParticleTextureSourceBlock;

        if (!this._previewImage) {
            contentArea.classList.add(localStyles["texture-block"]);

            this._previewImage = contentArea.ownerDocument.createElement("img");
            contentArea.appendChild(this._previewImage);
            this._previewImage.classList.add(localStyles.empty);

            // Create an off-screen canvas for converting texture data to data URL
            this._previewCanvas = contentArea.ownerDocument.createElement("canvas");
        }

        const url = block.textureDataUrl || block.url;
        if (url) {
            this._previewImage.src = url;
            this._previewImage.classList.remove(localStyles.empty);
        } else if (block.sourceTexture) {
            // For procedural textures (like noise), extract content and convert to data URL
            void this._extractAndDisplayTextureAsync(block);
        } else {
            this._previewImage.classList.add(localStyles.empty);
        }
    }

    private async _extractAndDisplayTextureAsync(block: ParticleTextureSourceBlock): Promise<void> {
        try {
            const textureData = await block.extractTextureContentAsync();
            if (textureData) {
                const dataUrl = this._textureDataToDataUrl(textureData.data, textureData.width, textureData.height);
                if (dataUrl) {
                    this._previewImage.src = dataUrl;
                    this._previewImage.classList.remove(localStyles.empty);
                } else {
                    this._previewImage.classList.add(localStyles.empty);
                }
            }
        } catch {
            // If extraction fails, just show empty state
            this._previewImage.classList.add(localStyles.empty);
        }
    }

    private _textureDataToDataUrl(data: Uint8ClampedArray, width: number, height: number): string {
        this._previewCanvas.width = width;
        this._previewCanvas.height = height;
        const ctx = this._previewCanvas.getContext("2d");

        if (ctx) {
            const imageData = new ImageData(data as Uint8ClampedArray<ArrayBuffer>, width, height);
            ctx.putImageData(imageData, 0, 0);
            return this._previewCanvas.toDataURL("image/png");
        }

        return "";
    }
}
