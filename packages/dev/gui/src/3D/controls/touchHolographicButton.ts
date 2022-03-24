import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Vector3 } from "core/Maths/math.vector";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { TransformNode } from "core/Meshes/transformNode";
import { Mesh } from "core/Meshes/mesh";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { FadeInOutBehavior } from "core/Behaviors/Meshes/fadeInOutBehavior";
import type { Scene } from "core/scene";
import { FluentMaterial } from "../materials/fluent/fluentMaterial";
import { FluentButtonMaterial } from "../materials/fluentButton/fluentButtonMaterial";
import { StackPanel } from "../../2D/controls/stackPanel";
import { Image } from "../../2D/controls/image";
import { TextBlock } from "../../2D/controls/textBlock";
import { AdvancedDynamicTexture } from "../../2D/advancedDynamicTexture";
import type { Control3D } from "./control3D";
import { Color3 } from "core/Maths/math.color";
import { TouchButton3D } from "./touchButton3D";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { SceneLoader } from "core/Loading/sceneLoader";
import { DomManagement } from "core/Misc/domManagement";
import { Scalar } from "core/Maths/math.scalar";

/**
 * Class used to create a holographic button in 3D
 * @since 5.0.0
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
    private _isBackplateVisible = true;
    private _frontMaterial: FluentButtonMaterial;
    private _backMaterial: FluentMaterial;
    private _plateMaterial: StandardMaterial;
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;
    private _pointerHoverObserver: Nullable<Observer<Vector3>>;
    private _frontPlateDepth = 0.5;
    private _backPlateDepth = 0.04;
    private _backplateColor = new Color3(0.08, 0.15, 0.55);
    private _backplateToggledColor = new Color3(0.25, 0.4, 0.95);

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
     * Gets the mesh used to render this control
     */
    public get mesh(): Nullable<AbstractMesh> {
        return this._backPlate as AbstractMesh;
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
            const rightHandedScene = this._backPlate._scene.useRightHandedSystem;
            // Create tooltip with mesh and text
            this._tooltipMesh = CreatePlane("", { size: 1 }, this._backPlate._scene);
            const tooltipBackground = CreatePlane("", { size: 1, sideOrientation: Mesh.DOUBLESIDE }, this._backPlate._scene);
            const mat = new StandardMaterial("", this._backPlate._scene);
            mat.diffuseColor = Color3.FromHexString("#212121");
            tooltipBackground.material = mat;
            tooltipBackground.isPickable = false;
            this._tooltipMesh.addChild(tooltipBackground);
            tooltipBackground.position = Vector3.Forward(rightHandedScene).scale(0.05);
            this._tooltipMesh.scaling.y = 1 / 3;
            this._tooltipMesh.position = Vector3.Up().scale(0.7).add(Vector3.Forward(rightHandedScene).scale(-0.15));
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
    public get backMaterial(): FluentMaterial {
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
     * Sets whether the backplate is visible or hidden. Hiding the backplate is not recommended without some sort of replacement
     */
    public set isBackplateVisible(isVisible: boolean) {
        if (this.mesh && !!this._backMaterial) {
            if (isVisible && !this._isBackplateVisible) {
                this._backPlate.visibility = 1;
            } else if (!isVisible && this._isBackplateVisible) {
                this._backPlate.visibility = 0;
            }
        }

        this._isBackplateVisible = isVisible;
    }

    /**
     * Creates a new button
     * @param name defines the control name
     * @param shareMaterials
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

        this.pointerDownAnimation = () => {
            if (this._frontPlate && !this.isActiveNearInteraction) {
                this._frontPlate.scaling.z = this._frontPlateDepth * 0.2;
                this._frontPlate.position = Vector3.Forward(this._frontPlate._scene.useRightHandedSystem).scale((this._frontPlateDepth - 0.2 * this._frontPlateDepth) / 2);
                this._textPlate.position = Vector3.Forward(this._textPlate._scene.useRightHandedSystem).scale(-(this._backPlateDepth + 0.2 * this._frontPlateDepth) / 2);
            }
        };
        this.pointerUpAnimation = () => {
            if (this._frontPlate) {
                this._frontPlate.scaling.z = this._frontPlateDepth;
                this._frontPlate.position = Vector3.Forward(this._frontPlate._scene.useRightHandedSystem).scale((this._frontPlateDepth - this._frontPlateDepth) / 2);
                this._textPlate.position = Vector3.Forward(this._textPlate._scene.useRightHandedSystem).scale(-(this._backPlateDepth + this._frontPlateDepth) / 2);
            }
        };

        this.onPointerMoveObservable.add((position) => {
            if (this._frontPlate && this.isActiveNearInteraction) {
                const scale = Vector3.Zero();
                if (this._backPlate.getWorldMatrix().decompose(scale, undefined, undefined)) {
                    let interactionHeight = this._getInteractionHeight(position, this._backPlate.getAbsolutePosition()) / scale.z;
                    interactionHeight = Scalar.Clamp(interactionHeight - this._backPlateDepth / 2, 0.2 * this._frontPlateDepth, this._frontPlateDepth);

                    this._frontPlate.scaling.z = interactionHeight;
                    this._frontPlate.position = Vector3.Forward(this._frontPlate._scene.useRightHandedSystem).scale((this._frontPlateDepth - interactionHeight) / 2);
                    this._textPlate.position = Vector3.Forward(this._textPlate._scene.useRightHandedSystem).scale(-(this._backPlateDepth + interactionHeight) / 2);
                }
            }
        });

        this._pointerHoverObserver = this.onPointerMoveObservable.add((hoverPosition: Vector3) => {
            this._frontMaterial.globalLeftIndexTipPosition = hoverPosition;
        });
    }

    protected _getTypeName(): string {
        return "TouchHolographicButton";
    }

    private _rebuildContent(): void {
        this._disposeFacadeTexture();

        const panel = new StackPanel();
        panel.isVertical = true;

        if (DomManagement.IsDocumentAvailable() && !!document.createElement) {
            if (this._imageUrl) {
                const image = new Image();
                image.source = this._imageUrl;
                image.paddingTop = "40px";
                image.height = "180px";
                image.width = "100px";
                image.paddingBottom = "40px";
                panel.addControl(image);
            }
        }

        if (this._text) {
            const text = new TextBlock();
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
        this.name = this.name ?? "TouchHolographicButton";
        const collisionMesh = CreateBox(
            `${this.name}_collisionMesh`,
            {
                width: 1.0,
                height: 1.0,
                depth: this._frontPlateDepth,
            },
            scene
        );
        collisionMesh.isPickable = true;
        collisionMesh.isNearPickable = true;
        collisionMesh.visibility = 0;
        collisionMesh.position = Vector3.Forward(scene.useRightHandedSystem).scale(-this._frontPlateDepth / 2);

        SceneLoader.ImportMeshAsync(undefined, TouchHolographicButton.MODEL_BASE_URL, TouchHolographicButton.MODEL_FILENAME, scene).then((result) => {
            const alphaMesh = CreateBox(
                "${this.name}_alphaMesh",
                {
                    width: 1.0,
                    height: 1.0,
                    depth: 1.0,
                },
                scene
            );
            alphaMesh.isPickable = false;
            alphaMesh.material = new StandardMaterial("${this.name}_alphaMesh_material", scene);
            alphaMesh.material.alpha = 0.15;

            const importedFrontPlate = result.meshes[1];
            importedFrontPlate.name = `${this.name}_frontPlate`;
            importedFrontPlate.isPickable = false;
            importedFrontPlate.scaling.z = this._frontPlateDepth;
            alphaMesh.parent = importedFrontPlate;
            importedFrontPlate.parent = collisionMesh;
            if (this._frontMaterial) {
                importedFrontPlate.material = this._frontMaterial;
            }
            this._frontPlate = importedFrontPlate;
        });

        this._backPlate = CreateBox(
            `${this.name}_backPlate`,
            {
                width: 1.0,
                height: 1.0,
                depth: this._backPlateDepth,
            },
            scene
        );

        this._backPlate.position = Vector3.Forward(scene.useRightHandedSystem).scale(this._backPlateDepth / 2);
        this._backPlate.isPickable = false;

        this._textPlate = <Mesh>super._createNode(scene);
        this._textPlate.name = `${this.name}_textPlate`;
        this._textPlate.isPickable = false;
        this._textPlate.position = Vector3.Forward(scene.useRightHandedSystem).scale(-this._frontPlateDepth / 2);

        this._backPlate.addChild(collisionMesh);
        this._backPlate.addChild(this._textPlate);

        const tn = new TransformNode(`{this.name}_root`, scene);
        this._backPlate.setParent(tn);

        this.collisionMesh = collisionMesh;
        this.collidableFrontDirection = this._backPlate.forward.negate(); // Mesh is facing the wrong way

        return tn;
    }

    protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
        this._plateMaterial.emissiveTexture = facadeTexture;
        this._plateMaterial.opacityTexture = facadeTexture;
        this._plateMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4);
    }

    private _createBackMaterial(mesh: Mesh) {
        this._backMaterial = new FluentMaterial(this.name + "backPlateMaterial", mesh.getScene());
        this._backMaterial.albedoColor = this._backplateColor;
        this._backMaterial.renderBorders = true;
        this._backMaterial.renderHoverLight = false;
    }

    private _createFrontMaterial(mesh: Mesh) {
        this._frontMaterial = new FluentButtonMaterial(this.name + "Front Material", mesh.getScene());
    }

    private _createPlateMaterial(mesh: Mesh) {
        this._plateMaterial = new StandardMaterial(this.name + "Plate Material", mesh.getScene());
        this._plateMaterial.specularColor = Color3.Black();
    }

    protected _onToggle(newState: boolean) {
        if (this._backMaterial) {
            if (newState) {
                this._backMaterial.albedoColor = this._backplateToggledColor;
            } else {
                this._backMaterial.albedoColor = this._backplateColor;
            }
        }

        super._onToggle(newState);
    }

    protected _affectMaterial(mesh: Mesh) {
        if (this._shareMaterials) {
            // Back
            if (!this._host._touchSharedMaterials["backFluentMaterial"]) {
                this._createBackMaterial(mesh);
                this._host._touchSharedMaterials["backFluentMaterial"] = this._backMaterial;
            } else {
                this._backMaterial = this._host._touchSharedMaterials["backFluentMaterial"] as FluentMaterial;
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

        if (!this._isBackplateVisible) {
            this._backPlate.visibility = 0;
        }
        if (this._frontPlate) {
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
