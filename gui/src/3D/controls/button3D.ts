import { int, Nullable } from "babylonjs/types";
import { Vector4 } from "babylonjs/Maths/math.vector";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { BoxBuilder } from "babylonjs/Meshes/Builders/boxBuilder";
import { Material } from "babylonjs/Materials/material";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { Scene } from "babylonjs/scene";

import { AbstractButton3D } from "./abstractButton3D";
import { AdvancedDynamicTexture } from "../../2D/advancedDynamicTexture";
import { Control } from "../../2D/controls/control";
import { Color3 } from 'babylonjs/Maths/math.color';

/**
 * Class used to create a button in 3D
 */
export class Button3D extends AbstractButton3D {
    /** @hidden */
    protected _currentMaterial: Material;
    private _facadeTexture: Nullable<AdvancedDynamicTexture>;
    private _content: Control;
    private _contentResolution = 512;
    private _contentScaleRatio = 2;

    /**
     * Gets or sets the texture resolution used to render content (512 by default)
     */
    public get contentResolution(): int {
        return this._contentResolution;
    }

    public set contentResolution(value: int) {
        if (this._contentResolution === value) {
            return;
        }

        this._contentResolution = value;
        this._resetContent();
    }

    /**
     * Gets or sets the texture scale ratio used to render content (2 by default)
     */
    public get contentScaleRatio(): number {
        return this._contentScaleRatio;
    }

    public set contentScaleRatio(value: number) {
        if (this._contentScaleRatio === value) {
            return;
        }

        this._contentScaleRatio = value;
        this._resetContent();
    }

    protected _disposeFacadeTexture() {
        if (this._facadeTexture) {
            this._facadeTexture.dispose();
            this._facadeTexture = null;
        }
    }

    protected _resetContent() {
        this._disposeFacadeTexture();
        this.content = this._content;
    }

    /**
     * Creates a new button
     * @param name defines the control name
     */
    constructor(name?: string) {
        super(name);

        // Default animations

        this.pointerEnterAnimation = () => {
            if (!this.mesh) {
                return;
            }
            (<StandardMaterial>this._currentMaterial).emissiveColor = Color3.Red();
        };

        this.pointerOutAnimation = () => {
            (<StandardMaterial>this._currentMaterial).emissiveColor = Color3.Black();
        };

        this.pointerDownAnimation = () => {
            if (!this.mesh) {
                return;
            }

            this.mesh.scaling.scaleInPlace(0.95);
        };

        this.pointerUpAnimation = () => {
            if (!this.mesh) {
                return;
            }

            this.mesh.scaling.scaleInPlace(1.0 / 0.95);
        };
    }

    /**
     * Gets or sets the GUI 2D content used to display the button's facade
     */
    public get content(): Control {
        return this._content;
    }

    public set content(value: Control) {
        this._content = value;

        if (!this._host || !this._host.utilityLayer) {
            return;
        }

        if (!this._facadeTexture) {
            this._facadeTexture = new AdvancedDynamicTexture("Facade", this._contentResolution, this._contentResolution, this._host.utilityLayer.utilityLayerScene, true, Texture.TRILINEAR_SAMPLINGMODE);
            this._facadeTexture.rootContainer.scaleX = this._contentScaleRatio;
            this._facadeTexture.rootContainer.scaleY = this._contentScaleRatio;
            this._facadeTexture.premulAlpha = true;
        }
        else {
            this._facadeTexture.rootContainer.clearControls();
        }

        this._facadeTexture.addControl(value);

        this._applyFacade(this._facadeTexture);
    }

    /**
     * Apply the facade texture (created from the content property).
     * This function can be overloaded by child classes
     * @param facadeTexture defines the AdvancedDynamicTexture to use
     */
    protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
        (<any>this._currentMaterial).emissiveTexture = facadeTexture;
    }

    protected _getTypeName(): string {
        return "Button3D";
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        var faceUV = new Array(6);

        for (var i = 0; i < 6; i++) {
            faceUV[i] = new Vector4(0, 0, 0, 0);
        }
        faceUV[1] = new Vector4(0, 0, 1, 1);

        let mesh = BoxBuilder.CreateBox(this.name + "_rootMesh", {
            width: 1.0,
            height: 1.0,
            depth: 0.08,
            faceUV: faceUV
        }, scene);

        return mesh;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
        let material = new StandardMaterial(this.name + "Material", mesh.getScene());
        material.specularColor = Color3.Black();

        mesh.material = material;
        this._currentMaterial = material;

        this._resetContent();
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose();

        this._disposeFacadeTexture();

        if (this._currentMaterial) {
            this._currentMaterial.dispose();
        }
    }
}