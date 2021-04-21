import { AbstractMesh, Scene, TransformNode } from "babylonjs/index";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { Color3 } from "babylonjs/Maths/math.color";
import { BoxBuilder } from "babylonjs/Meshes/Builders/boxBuilder";
import { Mesh } from "babylonjs/Meshes/index";
import { FluentMaterial } from "../materials";
import { Container3D } from "./container3D";

/**
 * Class used to create a holographic slate
 */
export class HolographicSlate extends Container3D {
    private _backPlateMaterial: FluentMaterial;
    private _contentMaterial: StandardMaterial;

    protected _backPlate: Mesh;
    protected _contentPlate: Mesh;

    /**
     * Creates a new slate
     * @param name defines the control name
     */
    constructor(name?: string) {
        super(name);
    }

    private _rebuildContent(): void {
        // this._disposeFacadeTexture();
        // let panel = new StackPanel();
        // panel.isVertical = true;
        // if (this._imageUrl) {
        //     let image = new Image();
        //     image.source = this._imageUrl;
        //     image.paddingTop = "40px";
        //     image.height = "180px";
        //     image.width = "100px";
        //     image.paddingBottom = "40px";
        //     panel.addControl(image);
        // }
        // if (this._text) {
        //     let text = new TextBlock();
        //     text.text = this._text;
        //     text.color = "white";
        //     text.height = "30px";
        //     text.fontSize = 24;
        //     panel.addControl(text);
        // }
        // if (this._frontPlate) {
        //     this.content = panel;
        // }
    }

    protected _getTypeName(): string {
        return "HolographicSlate";
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        this._backPlate = BoxBuilder.CreateBox("backPlate" + this.name, { width: 4.0, height: 0.4, depth: 0.04 });
        this._contentPlate = BoxBuilder.CreateBox("backPlate" + this.name, { width: 4.0, height: 2.4, depth: 0.04 });

        this._contentPlate.parent = this._backPlate;
        this._contentPlate.position.y = -1.45;

        return this._backPlate;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
        // TODO share materials
        this._backPlateMaterial = new FluentMaterial(this.name + "plateMaterial", mesh.getScene());
        this._backPlateMaterial.albedoColor = new Color3(0.08, 0.15, 0.55);
        this._backPlateMaterial.renderBorders = true;

        this._contentMaterial = new StandardMaterial(this.name + "contentMaterial", mesh.getScene());
        this._contentMaterial.emissiveColor = new Color3(0.1, 0.1, 0.1);
        this._contentMaterial.specularColor = new Color3(0, 0, 0);

        this._backPlate.material = this._backPlateMaterial;
        this._contentPlate.material = this._contentMaterial;

        this._rebuildContent();
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose();
        this._backPlateMaterial.dispose();
    }
}
