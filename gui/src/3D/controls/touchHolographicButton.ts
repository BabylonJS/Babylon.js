import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Mesh } from "babylonjs/Meshes/mesh";
import { PlaneBuilder } from "babylonjs/Meshes/Builders/planeBuilder";
import { BoxBuilder } from "babylonjs/Meshes/Builders/boxBuilder";
import { FadeInOutBehavior } from "babylonjs/Behaviors/Meshes/fadeInOutBehavior";
import { Scene } from "babylonjs/scene";
import { FluentButtonMaterial } from "../materials/fluentButton/fluentButtonMaterial";
import { StackPanel } from "../../2D/controls/stackPanel";
import { Image } from "../../2D/controls/image";
import { TextBlock } from "../../2D/controls/textBlock";
import { AdvancedDynamicTexture } from "../../2D/advancedDynamicTexture";
import { Control3D } from "./control3D";
import { Color3 } from "babylonjs/Maths/math.color";
import { TouchButton3D } from "./touchButton3D";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { SceneLoader } from "babylonjs/Loading/sceneLoader";
import { DomManagement } from "babylonjs/Misc/domManagement";

/**
 * Class used to create a holographic button in 3D
 */
export class TouchHolographicButton extends TouchButton3D {
    /**
     * Base Url for the button model.
     */
    public static MODEL_BASE_URL: string = "https://assets.babylonjs.com/meshes/MRTK/";
    /**
     * File name for the button model.
     */
    public static MODEL_FILENAME: string = "mrtk-fluent-button.glb";

    private _backPlate: Mesh;
    private _textPlate: Mesh;
    private _frontPlate: AbstractMesh;
    private _text: string;
    private _imageUrl: string;
    private _shareMaterials = true;
    private _frontMaterial: FluentButtonMaterial;
    private _backMaterial: StandardMaterial;
    private _plateMaterial: StandardMaterial;
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;
    private _pointerHoverObserver: Nullable<Observer<Vector3>>;

    // Tooltip
    private _tooltipFade: Nullable<FadeInOutBehavior>;
    private _tooltipTextBlock: Nullable<TextBlock>;
    private _tooltipTexture: Nullable<AdvancedDynamicTexture>;
    private _tooltipMesh: Nullable<Mesh>;
    private _tooltipHoverObserver: Nullable<Observer<Control3D>>;
    private _tooltipOutObserver: Nullable<Observer<Control3D>>;

    private _disposeTooltip() {
        this._tooltipFade = null;
        if (this._tooltipTextBlock) {
            this._tooltipTextBlock.dispose();
        }
        if (this._tooltipTexture) {
            this._tooltipTexture.dispose();
        }
        if (this._tooltipMesh) {
            this._tooltipMesh.dispose();
        }
        this.onPointerEnterObservable.remove(this._tooltipHoverObserver);
        this.onPointerOutObservable.remove(this._tooltipOutObserver);
    }

    /**
     * Rendering ground id of all the mesh in the button
     */
    public set renderingGroupId(id: number) {
        this._backPlate.renderingGroupId = id;
        this._textPlate.renderingGroupId = id;
        this._frontPlate.renderingGroupId = id;

        if (this._tooltipMesh) {
            this._tooltipMesh.renderingGroupId = id;
        }
    }
    public get renderingGroupId(): number {
        return this._backPlate.renderingGroupId;
    }

    /**
     * Text to be displayed on the tooltip shown when hovering on the button. When set to null tooltip is disabled. (Default: null)
     */
    public set tooltipText(text: Nullable<string>) {
        if (!text) {
            this._disposeTooltip();
            return;
        }
        if (!this._tooltipFade) {
            // Create tooltip with mesh and text
            this._tooltipMesh = PlaneBuilder.CreatePlane("", { size: 1 }, this._backPlate._scene);
            var tooltipBackground = PlaneBuilder.CreatePlane("", { size: 1, sideOrientation: Mesh.DOUBLESIDE }, this._backPlate._scene);
            var mat = new StandardMaterial("", this._backPlate._scene);
            mat.diffuseColor = Color3.FromHexString("#212121");
            tooltipBackground.material = mat;
            tooltipBackground.isPickable = false;
            this._tooltipMesh.addChild(tooltipBackground);
            tooltipBackground.position.z = 0.05;
            this._tooltipMesh.scaling.y = 1 / 3;
            this._tooltipMesh.position.y = 0.7;
            this._tooltipMesh.position.z = -0.15;
            this._tooltipMesh.isPickable = false;
            this._tooltipMesh.parent = this._backPlate;

            // Create text texture for the tooltip
            this._tooltipTexture = AdvancedDynamicTexture.CreateForMesh(this._tooltipMesh);
            this._tooltipTextBlock = new TextBlock();
            this._tooltipTextBlock.scaleY = 3;
            this._tooltipTextBlock.color = "white";
            this._tooltipTextBlock.fontSize = 130;
            this._tooltipTexture.addControl(this._tooltipTextBlock);

            // Add hover action to tooltip
            this._tooltipFade = new FadeInOutBehavior();
            this._tooltipFade.delay = 500;
            this._tooltipMesh.addBehavior(this._tooltipFade);
            this._tooltipHoverObserver = this.onPointerEnterObservable.add(() => {
                if (this._tooltipFade) {
                    this._tooltipFade.fadeIn(true);
                }
            });
            this._tooltipOutObserver = this.onPointerOutObservable.add(() => {
                if (this._tooltipFade) {
                    this._tooltipFade.fadeIn(false);
                }
            });
        }
        if (this._tooltipTextBlock) {
            this._tooltipTextBlock.text = text;
        }
    }

    public get tooltipText() {
        if (this._tooltipTextBlock) {
            return this._tooltipTextBlock.text;
        }
        return null;
    }

    /**
     * Gets or sets text for the button
     */
    public get text(): string {
        return this._text;
    }

    public set text(value: string) {
        if (this._text === value) {
            return;
        }

        this._text = value;
        this._rebuildContent();
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

    /**
     * Gets the back material used by this button
     */
    public get backMaterial(): StandardMaterial {
        return this._backMaterial;
    }

    /**
     * Gets the front material used by this button
     */
    public get frontMaterial(): FluentButtonMaterial {
        return this._frontMaterial;
    }

    /**
     * Gets the plate material used by this button
     */
    public get plateMaterial(): StandardMaterial {
        return this._plateMaterial;
    }

    /**
     * Gets a boolean indicating if this button shares its material with other HolographicButtons
     */
    public get shareMaterials(): boolean {
        return this._shareMaterials;
    }

    /**
     * Creates a new button
     * @param name defines the control name
     */
    constructor(name?: string, shareMaterials = true) {
        super(name);

        this._shareMaterials = shareMaterials;

        this.pointerEnterAnimation = () => {
            this._frontMaterial.leftBlobEnable = true;
            this._frontMaterial.rightBlobEnable = true;
        };

        this.pointerOutAnimation = () => {
            this._frontMaterial.leftBlobEnable = false;
            this._frontMaterial.rightBlobEnable = false;
        };

        this._pointerHoverObserver = this.onPointerMoveObservable.add((hoverPosition: Vector3) => {
            this._frontMaterial.globalLeftIndexTipPosition = hoverPosition;
        });
    }

    protected _getTypeName(): string {
        return "TouchHolographicButton";
    }

    private _rebuildContent(): void {
        this._disposeFacadeTexture();

        let panel = new StackPanel();
        panel.isVertical = true;

        if (DomManagement.IsDocumentAvailable() && !!document.createElement) {
            if (this._imageUrl) {
                let image = new Image();
                image.source = this._imageUrl;
                image.paddingTop = "40px";
                image.height = "180px";
                image.width = "100px";
                image.paddingBottom = "40px";
                panel.addControl(image);
            }
        }

        if (this._text) {
            let text = new TextBlock();
            text.text = this._text;
            text.color = "white";
            text.height = "30px";
            text.fontSize = 24;
            panel.addControl(text);
        }

        this.content = panel;
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        const collisionMesh = BoxBuilder.CreateBox((this.name ?? "TouchHolographicButton") + "_CollisionMesh", {
            width: 1.0,
            height: 1.0,
            depth: 1.0,
        }, scene);
        collisionMesh.isPickable = true;
        collisionMesh.isNearPickable = true;
        collisionMesh.visibility = 0;
        collisionMesh.scaling = new Vector3(0.032, 0.032, 0.016);

        SceneLoader.ImportMeshAsync(
            undefined,
            TouchHolographicButton.MODEL_BASE_URL,
            TouchHolographicButton.MODEL_FILENAME,
            scene)
            .then((result) => {
                var importedFrontPlate = result.meshes[1];
                importedFrontPlate.name = `${this.name}_frontPlate`;
                importedFrontPlate.isPickable = false;
                importedFrontPlate.parent = collisionMesh;
                if (!!this._frontMaterial) {
                    importedFrontPlate.material = this._frontMaterial;
                }
                this._frontPlate = importedFrontPlate;
            });

        const backPlateDepth = 0.04;
        this._backPlate = BoxBuilder.CreateBox(
            this.name + "BackMesh",
            {
                width: 1.0,
                height: 1.0,
                depth: backPlateDepth,
            },
            scene
        );

        this._backPlate.parent = collisionMesh;
        this._backPlate.position.z = 0.5 - backPlateDepth / 2;
        this._backPlate.isPickable = false;

        this._textPlate = <Mesh>super._createNode(scene);
        this._textPlate.parent = collisionMesh;
        this._textPlate.position.z = 0;
        this._textPlate.isPickable = false;

        this.collisionMesh = collisionMesh;
        this.collidableFrontDirection = this._backPlate.forward.negate(); // Mesh is facing the wrong way

        return collisionMesh;
    }

    protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
        this._plateMaterial.emissiveTexture = facadeTexture;
        this._plateMaterial.opacityTexture = facadeTexture;
        this._plateMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4);
    }

    private _createBackMaterial(mesh: Mesh) {
        this._backMaterial = new StandardMaterial(this.name + "Back Material", mesh.getScene());
        this._backMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
    }

    private _createFrontMaterial(mesh: Mesh) {
        this._frontMaterial = new FluentButtonMaterial(this.name + "Front Material", mesh.getScene());
    }

    private _createPlateMaterial(mesh: Mesh) {
        this._plateMaterial = new StandardMaterial(this.name + "Plate Material", mesh.getScene());
        this._plateMaterial.specularColor = Color3.Black();
    }

    protected _affectMaterial(mesh: Mesh) {
        // Back
        if (this._shareMaterials) {
            if (!this._host._touchSharedMaterials["backFluentMaterial"]) {
                this._createBackMaterial(mesh);
                this._host._touchSharedMaterials["backFluentMaterial"] = this._backMaterial;
            } else {
                this._backMaterial = this._host._touchSharedMaterials["backFluentMaterial"] as StandardMaterial;
            }

            // Front
            if (!this._host._touchSharedMaterials["frontFluentMaterial"]) {
                this._createFrontMaterial(mesh);
                this._host._touchSharedMaterials["frontFluentMaterial"] = this._frontMaterial;
            } else {
                this._frontMaterial = this._host._touchSharedMaterials["frontFluentMaterial"] as FluentButtonMaterial;
            }
        } else {
            this._createBackMaterial(mesh);
            this._createFrontMaterial(mesh);
        }

        this._createPlateMaterial(mesh);
        this._backPlate.material = this._backMaterial;
        this._textPlate.material = this._plateMaterial;
        if (!!this._frontPlate) {
            this._frontPlate.material = this._frontMaterial;
        }

        this._rebuildContent();
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose(); // will dispose main mesh ie. back plate

        this._disposeTooltip();
        this.onPointerMoveObservable.remove(this._pointerHoverObserver);

        if (!this.shareMaterials) {
            this._backMaterial.dispose();
            this._frontMaterial.dispose();
            this._plateMaterial.dispose();

            if (this._pickedPointObserver) {
                this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
                this._pickedPointObserver = null;
            }
        }
    }
}
