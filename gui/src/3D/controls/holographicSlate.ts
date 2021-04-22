import { AbstractMesh, Scene, TransformNode } from "babylonjs/index";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { Color3 } from "babylonjs/Maths/math.color";
import { BoxBuilder } from "babylonjs/Meshes/Builders/boxBuilder";
import { Mesh } from "babylonjs/Meshes/index";
import { FluentMaterial } from "../materials";
import { HolographicButton } from "./holographicButton";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { Control3D } from "./control3D";
import { ContentDisplay3D } from "./contentDisplay3D";
import { AdvancedDynamicTexture, Image } from "../../2D";

/**
 * Class used to create a holographic slate
 */
export class HolographicSlate extends ContentDisplay3D {
    private _backPlateMaterial: FluentMaterial;
    private _contentMaterial: FluentMaterial;
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;
    private _imageUrl: string;

    protected _backPlate: Mesh;
    protected _contentPlate: Mesh;
    protected _followButton: HolographicButton;
    protected _closeButton: HolographicButton;
    protected _contentScaleRatio = 1;

    /**
     * Rendering ground id of all the mesh in the button
     */
    public set renderingGroupId(id: number) {
        this._backPlate.renderingGroupId = id;
        this._contentPlate.renderingGroupId = id;
    }
    public get renderingGroupId(): number {
        return this._backPlate.renderingGroupId;
    }

    /**
     * Gets or sets the image url for the button
     */
    public get imageUrl(): string {
        return this._imageUrl;
    }

    public set imageUrl(value: string) {
        if (this._imageUrl === value) {
            return;
        }

        this._imageUrl = value;
        this._rebuildContent();
    }

    /** Gets or sets the control scaling  in world space */
    public get scaling(): Vector3 {
        if (!this.node) {
            return new Vector3(1, 1, 1);
        }

        return this.node.scaling;
    }

    public set scaling(value: Vector3) {
        if (!this.node) {
            return;
        }

        this.node.scaling = value;

        // Scale buttons and titlebar accordingly here
    }

    /**
     * Creates a new slate
     * @param name defines the control name
     */
    constructor(name?: string) {
        super(name);

        this._followButton = new HolographicButton("followButton" + this.name);
        this._closeButton = new HolographicButton("closeButton" + this.name);
    }

    /**
     * Apply the facade texture (created from the content property).
     * This function can be overloaded by child classes
     * @param facadeTexture defines the AdvancedDynamicTexture to use
     */
    protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
        this._contentMaterial.albedoTexture = facadeTexture;
    }

    private _rebuildContent(): void {
        this._disposeFacadeTexture();
        if (this._imageUrl) {
            let image = new Image();
            image.source = this._imageUrl;

            if (this._contentPlate) {
                this.content = image;
            }
        }
    }

    private _addControl(control: Control3D): void {
        control._host = this._host;
        if (this._host.utilityLayer) {
            control._prepareNode(this._host.utilityLayer.utilityLayerScene);
        }
    }

    protected _getTypeName(): string {
        return "HolographicSlate";
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        this._backPlate = BoxBuilder.CreateBox("backPlate" + this.name, { width: 5.7, height: 0.4, depth: 0.04 });
        this._contentPlate = BoxBuilder.CreateBox("backPlate" + this.name, { width: 5.7, height: 2.4, depth: 0.04 });

        this._contentPlate.parent = this._backPlate;
        this._contentPlate.position.y = -1.45;

        this._addControl(this._followButton);
        this._addControl(this._closeButton);

        const followButtonMesh = this._followButton.mesh!;
        const closeButtonMesh = this._closeButton.mesh!;
        followButtonMesh.parent = this._backPlate;
        closeButtonMesh.parent = this._backPlate;

        followButtonMesh.scaling.scaleInPlace(0.37);
        closeButtonMesh.scaling.scaleInPlace(0.37);
        followButtonMesh.position.copyFromFloats(2.25, 0, -0.05);
        closeButtonMesh.position.copyFromFloats(2.65, 0, -0.05);

        this._followButton.imageUrl = "./textures/IconFollowMe.png";
        this._closeButton.imageUrl = "./textures/IconClose.png";

        // this._followButton.showBackPlate = false;
        // this._closeButton.showBackPlate = false;

        this._followButton.backMaterial.alpha = 0;
        this._closeButton.backMaterial.alpha = 0;

        return this._backPlate;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
        // TODO share materials
        this._backPlateMaterial = new FluentMaterial(this.name + "plateMaterial", mesh.getScene());
        this._backPlateMaterial.albedoColor = new Color3(0.08, 0.15, 0.55);
        this._backPlateMaterial.renderBorders = true;
        this._backPlateMaterial.renderHoverLight = true;

        this._pickedPointObserver = this._host.onPickedPointChangedObservable.add((pickedPoint) => {
            if (pickedPoint) {
                this._backPlateMaterial.hoverPosition = pickedPoint;
                this._backPlateMaterial.hoverColor.a = 1.0;
            } else {
                this._backPlateMaterial.hoverColor.a = 0;
            }
        });

        this._contentMaterial = new FluentMaterial(this.name + "contentMaterial", mesh.getScene());
        this._contentMaterial.renderBorders = true;

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
        this._contentMaterial.dispose();

        this._backPlate.dispose();
        this._contentPlate.dispose();

        this._followButton.dispose();
        this._closeButton.dispose();

        if (this._pickedPointObserver) {
            this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
            this._pickedPointObserver = null;
        }
    }
}
