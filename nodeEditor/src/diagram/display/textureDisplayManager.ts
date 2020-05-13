import { IDisplayManager } from './displayManager';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/textureBlock';
import { RefractionBlock } from 'babylonjs/Materials/Node/Blocks/PBR/refractionBlock';
import { ReflectionTextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/reflectionTextureBlock';
import { TextureLineComponent } from '../../sharedComponents/textureLineComponent';
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
        const textureBlock = block as TextureBlock | ReflectionTextureBlock | RefractionBlock | CurrentScreenBlock;

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

        if (textureBlock.texture) {
            TextureLineComponent.UpdatePreview(this._previewCanvas, textureBlock.texture, 140, {
                face: 0,
                displayRed: true,
                displayAlpha: true,
                displayBlue: true,
                displayGreen: true
            }, () => {
                this._previewImage.src = this._previewCanvas.toDataURL("image/png");
                this._previewImage.classList.remove("empty");
            });
        } else {
            this._previewImage.classList.add("empty");
        }
    }
}