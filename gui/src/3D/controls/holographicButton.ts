import { Button3D } from "./button3D";

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

import { FluentMaterial } from "../materials/fluentMaterial";
import { StackPanel } from "../../2D/controls/stackPanel";
import { Image } from "../../2D/controls/image";
import { TextBlock } from "../../2D/controls/textBlock";
import { AdvancedDynamicTexture } from "../../2D/advancedDynamicTexture";
import { Control3D } from "./control3D";
import { Color3 } from 'babylonjs/Maths/math.color';

/**
 * Class used to create a holographic button in 3D
 */
export class HolographicButton extends Button3D {
    private _backPlate: Mesh;
    private _textPlate: Mesh;
    private _frontPlate: Mesh;
    private _text: string;
    private _imageUrl: string;
    private _shareMaterials = true;
    private _frontMaterial: FluentMaterial;
    private _backMaterial: FluentMaterial;
    private _plateMaterial: StandardMaterial;
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;

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
    public get backMaterial(): FluentMaterial {
        return this._backMaterial;
    }

    /**
     * Gets the front material used by this button
     */
    public get frontMaterial(): FluentMaterial {
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

        // Default animations
        this.pointerEnterAnimation = () => {
            if (!this.mesh) {
                return;
            }
            this._frontPlate.setEnabled(true);
        };

        this.pointerOutAnimation = () => {
            if (!this.mesh) {
                return;
            }
            this._frontPlate.setEnabled(false);
        };
    }

    protected _getTypeName(): string {
        return "HolographicButton";
    }

    private _rebuildContent(): void {
        this._disposeFacadeTexture();

        let panel = new StackPanel();
        panel.isVertical = true;

        if (this._imageUrl) {
            let image = new Image();
            image.source = this._imageUrl;
            image.paddingTop = "40px";
            image.height = "180px";
            image.width = "100px";
            image.paddingBottom = "40px";
            panel.addControl(image);
        }

        if (this._text) {
            let text = new TextBlock();
            text.text = this._text;
            text.color = "white";
            text.height = "30px";
            text.fontSize = 24;
            panel.addControl(text);
        }

        if (this._frontPlate) {
            this.content = panel;
        }
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        this._backPlate = BoxBuilder.CreateBox(this.name + "BackMesh", {
            width: 1.0,
            height: 1.0,
            depth: 0.08
        }, scene);

        this._frontPlate = BoxBuilder.CreateBox(this.name + "FrontMesh", {
            width: 1.0,
            height: 1.0,
            depth: 0.08
        }, scene);

        this._frontPlate.parent = this._backPlate;
        this._frontPlate.position.z = -0.08;
        this._frontPlate.isPickable = false;
        this._frontPlate.setEnabled(false);

        this._textPlate = <Mesh>super._createNode(scene);
        this._textPlate.parent = this._backPlate;
        this._textPlate.position.z = -0.08;
        this._textPlate.isPickable = false;

        return this._backPlate;
    }

    protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
        this._plateMaterial.emissiveTexture = facadeTexture;
        this._plateMaterial.opacityTexture = facadeTexture;
    }

    private _createBackMaterial(mesh: Mesh) {
        this._backMaterial = new FluentMaterial(this.name + "Back Material", mesh.getScene());
        this._backMaterial.renderHoverLight = true;
        this._pickedPointObserver = this._host.onPickedPointChangedObservable.add((pickedPoint) => {
            if (pickedPoint) {
                this._backMaterial.hoverPosition = pickedPoint;
                this._backMaterial.hoverColor.a = 1.0;
            } else {
                this._backMaterial.hoverColor.a = 0;
            }
        });
    }

    private _createFrontMaterial(mesh: Mesh) {
        this._frontMaterial = new FluentMaterial(this.name + "Front Material", mesh.getScene());
        this._frontMaterial.innerGlowColorIntensity = 0; // No inner glow
        this._frontMaterial.alpha = 0.5; // Additive
        this._frontMaterial.renderBorders = true;
    }

    private _createPlateMaterial(mesh: Mesh) {
        this._plateMaterial = new StandardMaterial(this.name + "Plate Material", mesh.getScene());
        this._plateMaterial.specularColor = Color3.Black();
    }

    protected _affectMaterial(mesh: Mesh) {
        // Back
        if (this._shareMaterials) {
            if (!this._host._sharedMaterials["backFluentMaterial"]) {
                this._createBackMaterial(mesh);
                this._host._sharedMaterials["backFluentMaterial"] = this._backMaterial;
            } else {
                this._backMaterial = this._host._sharedMaterials["backFluentMaterial"] as FluentMaterial;
            }

            // Front
            if (!this._host._sharedMaterials["frontFluentMaterial"]) {
                this._createFrontMaterial(mesh);
                this._host._sharedMaterials["frontFluentMaterial"] = this._frontMaterial;
            } else {
                this._frontMaterial = this._host._sharedMaterials["frontFluentMaterial"] as FluentMaterial;
            }
        } else {
            this._createBackMaterial(mesh);
            this._createFrontMaterial(mesh);
        }

        this._createPlateMaterial(mesh);
        this._backPlate.material = this._backMaterial;
        this._frontPlate.material = this._frontMaterial;
        this._textPlate.material = this._plateMaterial;

        this._rebuildContent();
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose(); // will dispose main mesh ie. back plate

        this._disposeTooltip();

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