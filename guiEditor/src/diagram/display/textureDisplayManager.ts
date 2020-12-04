import { IDisplayManager } from './displayManager';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/textureBlock';
import { CurrentScreenBlock } from 'babylonjs/Materials/Node/Blocks/Dual/currentScreenBlock';
import { ParticleTextureBlock } from 'babylonjs/Materials/Node/Blocks/Particle/particleTextureBlock';

export class TextureDisplayManager implements IDisplayManager {
    private _previewCanvas: HTMLCanvasElement;
    private _previewImage: HTMLImageElement;

    public getHeaderClass(block: NodeMaterialBlock) {
        return "";
    }

    public shouldDisplayPortLabels(block: NodeMaterialBlock): boolean {
        return true;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(block: NodeMaterialBlock): string {
        return "#323232";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
       
        if (!this._previewCanvas) {
            contentArea.classList.add("texture-block");
            if (block instanceof TextureBlock || block instanceof CurrentScreenBlock || block instanceof ParticleTextureBlock) {
                contentArea.classList.add("regular-texture-block");
            }

            this._previewCanvas = contentArea.ownerDocument!.createElement("canvas");
            this._previewImage = contentArea.ownerDocument!.createElement("img");
            contentArea.appendChild(this._previewImage);
            this._previewImage.classList.add("empty");
        }

    }
}