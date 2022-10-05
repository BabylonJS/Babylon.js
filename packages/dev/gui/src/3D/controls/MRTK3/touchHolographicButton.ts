import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Control3D } from "../control3D";
import type { Mesh } from "core/Meshes/mesh";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { Scene } from "core/scene";
import type { Vector3WithInfo } from "../../vector3WithInfo";

import { AdvancedDynamicTexture } from "../../../2D/advancedDynamicTexture";
import { Animation } from "core/Animations/animation";
import { AnimationGroup } from "core/Animations/animationGroup";
import { Color3, Color4 } from "core/Maths/math.color";
import { Control } from "../../../2D/controls/control";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { DomManagement } from "core/Misc/domManagement";
import { FadeInOutBehavior } from "core/Behaviors/Meshes/fadeInOutBehavior";
import { Grid } from "../../../2D/controls/grid";
import { Image } from "../../../2D/controls/image";
import { MRDLBackglowMaterial } from "../../materials/mrdl/mrdlBackglowMaterial";
import { MRDLBackplateMaterial } from "../../materials/mrdl/mrdlBackplateMaterial";
import { MRDLFrontplateMaterial } from "../../materials/mrdl/mrdlFrontplateMaterial";
import { MRDLInnerquadMaterial } from "../../materials/mrdl/mrdlInnerquadMaterial";
import { Rectangle } from "../../../2D/controls/rectangle";
import { SceneLoader } from "core/Loading/sceneLoader";
import { StackPanel } from "../../../2D/controls/stackPanel";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { TextBlock } from "../../../2D/controls/textBlock";
import { TouchButton3D } from "../touchButton3D";
import { TransformNode } from "core/Meshes/transformNode";
import { Vector3 } from "core/Maths/math.vector";

/**
 * Class used to create the mrtkv3 button
 */
export class TouchHolographicButton extends TouchButton3D {
    /**
     * Base Url for the frontplate model.
     */
    public static MRTK_ASSET_BASE_URL = "https://assets.babylonjs.com/meshes/MRTK/";

    /**
     * File name for the frontplate model.
     */
    public static FRONTPLATE_MODEL_FILENAME = "mrtk-fluent-frontplate.glb";

    /**
     * File name for the backplate model.
     */
    public static BACKPLATE_MODEL_FILENAME = "mrtk-fluent-backplate.glb";

    /**
     * File name for the backglow model.
     */
    public static BACKGLOW_MODEL_FILENAME = "mrtk-fluent-button.glb";

    /**
     * File name for the innerquad model.
     */
    public static INNERQUAD_MODEL_FILENAME = "SlateProximity.glb";

    /**
     * Gets or sets the horizontal scaling for the button.
     */
    public width = 1;

    /**
     * Gets or sets the vertical scaling for the button.
     */
    public height = 1;

    /**
     * Gets or sets the bevel radius for the button.
     */
    public radius = 0.14;

    /**
     * Gets or sets the font size of the button text in pixels.
     * This is only adjustable for a button with width to height ratio greater than 1.
     */
    public textSizeInPixels = 18;

    /**
     * Gets or sets the size of the button image in pixels.
     * This is only adjustable for a button with width to height ratio greater than 1.
     */
    public imageSizeInPixels = 40;

    /**
     * Gets or sets the color of the button plate.
     */
    public plateMaterialColor = new Color3(0.4, 0.4, 0.4);

    // Shared variables for meshes
    /**
     * Gets or sets the depth of the button's front plate.
     * This variable determines the z scaling and z position for some of the button's meshes.
     */
    public frontPlateDepth = 0.2;

    /**
     * Gets or sets the depth of the button's back plate.
     * This variable determines the z scaling and z position for some of the button's meshes.
     */
    public backPlateDepth = 0.04;

    /**
     * Gets or sets the offset value for button's back glow.
     * This variable determines the x, y scaling of the button's meshes.
     */
    public backGlowOffset = 0.1;

    /**
     * Gets or sets the value that determines the z scaling and z position for the innerQuad and BackGlow meshes.
     */
    public flatPlaneDepth = 0.001;

    /**
     * Gets or sets the radius for FrontMaterial and innerQuadMaterial.
     */
    public innerQuadRadius = this.radius - 0.04;

    /**
     * Gets or sets the color for innerQuadMaterial.
     */
    public innerQuadColor = new Color4(0, 0, 0, 0);

    /**
     * Gets or sets the color for innerQuadMaterial for when it is toggled.
     */
    public innerQuadToggledColor = new Color4(0.5197843, 0.6485234, 0.9607843, 0.6);

    /**
     * Gets or sets the color for innerQuadMaterial for when it is hovered.
     */
    public innerQuadHoverColor = new Color4(1, 1, 1, 0.05);

    /**
     * Gets or sets the color for innerQuadMaterial for when it is toggled and hovered.
     */
    public innerQuadToggledHoverColor = new Color4(0.5197843, 0.6485234, 0.9607843, 1);

    // Meshes
    private _backPlate: AbstractMesh;
    private _textPlate: Mesh;
    private _frontPlate: AbstractMesh;
    private _backGlow: AbstractMesh;
    private _innerQuad: AbstractMesh;
    private _collisionPlate: AbstractMesh;
    private _frontPlateCollisionMesh: AbstractMesh;
    private _isBackplateVisible = true;

    // Content
    private _text: string;
    private _subtext: string;
    private _imageUrl: string;

    // Materials
    private _shareMaterials = true;
    private _frontMaterial: MRDLFrontplateMaterial;
    private _backMaterial: MRDLBackplateMaterial;
    private _backGlowMaterial: MRDLBackglowMaterial;
    private _innerQuadMaterial: MRDLInnerquadMaterial;
    private _plateMaterial: StandardMaterial;

    // Events
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;
    private _pointerClickObserver: Nullable<Observer<Vector3WithInfo>>;
    private _pointerEnterObserver: Nullable<Observer<Control3D>>;
    private _pointerOutObserver: Nullable<Observer<Control3D>>;
    private _toggleObserver: Nullable<Observer<boolean>>;

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
        this._backGlow.renderingGroupId = id;
        this._innerQuad.renderingGroupId = id;

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
     * Set this property after adding the button to the GUI3DManager
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
            this._tooltipMesh.position = Vector3.Down().scale(0.7).add(Vector3.Forward(rightHandedScene).scale(-0.15));
            this._tooltipMesh.isPickable = false;
            this._tooltipMesh.parent = this._frontPlateCollisionMesh;

            // Create text texture for the tooltip
            this._tooltipTexture = AdvancedDynamicTexture.CreateForMesh(this._tooltipMesh);
            const tooltipBackground = new Rectangle();
            tooltipBackground.height = 0.25;
            tooltipBackground.width = 0.8;
            tooltipBackground.cornerRadius = 25;
            tooltipBackground.color = "#ffffff";
            tooltipBackground.thickness = 20;
            tooltipBackground.background = "#060668";
            this._tooltipTexture.addControl(tooltipBackground);

            this._tooltipTextBlock = new TextBlock();
            this._tooltipTextBlock.color = "white";
            this._tooltipTextBlock.fontSize = 100;
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
        return this._tooltipTextBlock?.text || null;
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
     * Gets or sets subtext for a button with larger width
     */
    public get subtext(): string {
        return this._subtext;
    }

    public set subtext(value: string) {
        if (this._subtext === value) {
            return;
        }

        this._subtext = value;
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
    public get backMaterial(): MRDLBackplateMaterial {
        return this._backMaterial;
    }

    /**
     * Gets the front material used by this button
     */
    public get frontMaterial(): MRDLFrontplateMaterial {
        return this._frontMaterial;
    }

    /**
     * Gets the back glow material used by this button
     */
    public get backGlowMaterial(): MRDLBackglowMaterial {
        return this._backGlowMaterial;
    }

    /**
     * Gets the inner quad material used by this button
     */
    public get innerQuadMaterial(): MRDLInnerquadMaterial {
        return this._innerQuadMaterial;
    }

    /**
     * Gets the plate material used by this button
     */
    public get plateMaterial(): StandardMaterial {
        return this._plateMaterial;
    }

    /**
     * Gets a boolean indicating if this button shares its material with other V3 Buttons
     */
    public get shareMaterials(): boolean {
        return this._shareMaterials;
    }

    /**
     * Sets whether the backplate is visible or hidden. Hiding the backplate is not recommended without some sort of replacement
     */
    public set isBackplateVisible(isVisible: boolean) {
        if (this.mesh && this._backMaterial) {
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
            if (this._frontPlate && this._textPlate && !this.isToggleButton) {
                this._performEnterExitAnimation(1);
            }

            if (this.isToggleButton && this._innerQuadMaterial) {
                if (this.isToggled) {
                    this._innerQuadMaterial.color = this.innerQuadToggledHoverColor;
                } else {
                    this._innerQuadMaterial.color = this.innerQuadHoverColor;
                }
            }
        };

        this.pointerOutAnimation = () => {
            if (this._frontPlate && this._textPlate && !this.isToggleButton) {
                this._performEnterExitAnimation(-0.8);
            }

            if (this.isToggleButton && this._innerQuadMaterial) {
                this._onToggle(this.isToggled);
            }
        };

        this.pointerDownAnimation = () => {
            // Do nothing
        };

        this.pointerUpAnimation = () => {
            // Do nothing
        };

        this._pointerClickObserver = this.onPointerClickObservable.add(() => {
            if (this._frontPlate && this._backGlow && !this.isActiveNearInteraction) {
                this._performClickAnimation();
            }

            if (this.isToggleButton && this._innerQuadMaterial) {
                this._onToggle(this.isToggled);
            }
        });

        this._pointerEnterObserver = this.onPointerEnterObservable.add(() => {
            this.pointerEnterAnimation();
        });

        this._pointerOutObserver = this.onPointerOutObservable.add(() => {
            this.pointerOutAnimation();
        });

        this._toggleObserver = this.onToggleObservable.add((isToggled) => {
            if (isToggled) {
                this._innerQuadMaterial.color = this.innerQuadToggledColor;
            } else {
                this._innerQuadMaterial.color = this.innerQuadColor;
            }
        });
    }

    protected _getTypeName(): string {
        return "TouchHolographicButton";
    }

    private _rebuildContent(): void {
        let content: Control;

        if (this._getAspectRatio() <= 1) {
            // align text and image vertically
            content = this._alignContentVertically();
        } else {
            // align text and image horizontally
            content = this._alignContentHorizontally();
        }

        this.content = content;
    }

    private _getAspectRatio() {
        return this.width / this.height;
    }

    private _alignContentVertically() {
        const panel = new StackPanel();
        panel.isVertical = true;

        if (DomManagement.IsDocumentAvailable() && !!document.createElement) {
            if (this._imageUrl) {
                const image = new Image();
                image.source = this._imageUrl;
                image.heightInPixels = 180;
                image.widthInPixels = 100;
                image.paddingTopInPixels = 40;
                image.paddingBottomInPixels = 40;
                panel.addControl(image);
            }
        }

        if (this._text) {
            const text = new TextBlock();
            text.text = this._text;
            text.color = "white";
            text.heightInPixels = 30;
            text.fontSize = 24;
            panel.addControl(text);
        }

        return panel;
    }

    private _alignContentHorizontally() {
        let totalPanelWidthInPixels = 240;
        const padding = 15;

        const contentContainer = new Rectangle();
        contentContainer.widthInPixels = totalPanelWidthInPixels;
        contentContainer.heightInPixels = totalPanelWidthInPixels;
        contentContainer.color = "transparent";
        contentContainer.setPaddingInPixels(padding, padding, padding, padding);
        totalPanelWidthInPixels -= padding * 2;

        const panel = new StackPanel();
        panel.isVertical = false;
        panel.scaleY = this._getAspectRatio();

        if (DomManagement.IsDocumentAvailable() && !!document.createElement) {
            if (this._imageUrl) {
                const imageContainer = new Rectangle(`${this.name}_image`);
                imageContainer.widthInPixels = this.imageSizeInPixels;
                imageContainer.heightInPixels = this.imageSizeInPixels;
                imageContainer.color = "transparent";
                totalPanelWidthInPixels -= this.imageSizeInPixels;

                const image = new Image();
                image.source = this._imageUrl;

                imageContainer.addControl(image);
                panel.addControl(imageContainer);
            }
        }

        if (this._text) {
            const text = new TextBlock(`${this.name}_text`);
            text.text = this._text;
            text.color = "white";
            text.fontSize = this.textSizeInPixels;
            text.widthInPixels = totalPanelWidthInPixels;

            if (this._imageUrl) {
                text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                text.paddingLeftInPixels = padding;
            }

            if (this._subtext) {
                const textContainer = new Grid();
                textContainer.addColumnDefinition(1);
                textContainer.addRowDefinition(0.5);
                textContainer.addRowDefinition(0.5);
                textContainer.widthInPixels = totalPanelWidthInPixels;
                textContainer.heightInPixels = 45;

                const subtext = new TextBlock(`${this.name}_subtext`);
                subtext.text = this._subtext;
                subtext.color = "#EEEEEEAB";
                subtext.fontSize = this.textSizeInPixels * 0.75;
                subtext.fontWeight = "600";

                if (this._imageUrl) {
                    subtext.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                    subtext.paddingLeftInPixels = padding;
                }

                textContainer.addControl(text, 0);
                textContainer.addControl(subtext, 1);
                panel.addControl(textContainer);
            } else {
                panel.addControl(text);
            }
        }

        contentContainer.addControl(panel);
        return contentContainer;
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        this.name = this.name ?? "TouchHolographicButton";

        const backPlateMesh = this._createBackPlate(scene);
        const collisionMesh = this._createFrontPlate(scene);
        const innerQuadMesh = this._createInnerQuad(scene);
        const backGlowMesh = this._createBackGlow(scene);

        this._frontPlateCollisionMesh = collisionMesh;
        this._textPlate = <Mesh>super._createNode(scene);
        this._textPlate.name = `${this.name}_textPlate`;
        this._textPlate.isPickable = false;
        this._textPlate.scaling.x = this.width;
        this._textPlate.parent = collisionMesh;

        this._backPlate = backPlateMesh;
        this._backPlate.position = Vector3.Forward(scene.useRightHandedSystem).scale(this.backPlateDepth / 2);
        this._backPlate.isPickable = false;

        this._backPlate.addChild(collisionMesh);
        this._backPlate.addChild(innerQuadMesh);

        if (backGlowMesh) {
            this._backPlate.addChild(backGlowMesh);
        }

        const tn = new TransformNode(`${this.name}_root`, scene);
        this._backPlate.setParent(tn);

        this.collisionMesh = collisionMesh;
        this.collidableFrontDirection = this._backPlate.forward.negate(); // Mesh is facing the wrong way

        return tn;
    }

    private _createBackPlate(scene: Scene) {
        const backPlateMesh = CreateBox(`${this.name}_backPlate`, {}, scene);
        backPlateMesh.isPickable = false;
        backPlateMesh.visibility = 0;
        backPlateMesh.scaling.z = 0.2;

        SceneLoader.ImportMeshAsync(undefined, TouchHolographicButton.MRTK_ASSET_BASE_URL, TouchHolographicButton.BACKPLATE_MODEL_FILENAME, scene).then((result) => {
            const backPlateModel = result.meshes[1];
            backPlateModel.visibility = 0;

            if (this._isBackplateVisible) {
                backPlateModel.visibility = 1;
                backPlateModel.name = `${this.name}_backPlate`;
                backPlateModel.isPickable = false;
                backPlateModel.scaling.x = this.width;
                backPlateModel.scaling.y = this.height;
                backPlateModel.parent = backPlateMesh;
            }

            if (this._backMaterial) {
                backPlateModel.material = this._backMaterial;
            }

            this._backPlate = backPlateModel;
        });

        return backPlateMesh;
    }

    private _createFrontPlate(scene: Scene) {
        const collisionMesh = CreateBox(
            `${this.name}_frontPlate`,
            {
                width: this.width,
                height: this.height,
                depth: this.frontPlateDepth,
            },
            scene
        );
        collisionMesh.isPickable = true;
        collisionMesh.isNearPickable = true;
        collisionMesh.visibility = 0;
        collisionMesh.position = Vector3.Forward(scene.useRightHandedSystem).scale((this.backPlateDepth - this.frontPlateDepth) / 2);

        SceneLoader.ImportMeshAsync(undefined, TouchHolographicButton.MRTK_ASSET_BASE_URL, TouchHolographicButton.FRONTPLATE_MODEL_FILENAME, scene).then((result) => {
            const collisionPlate = CreateBox(
                `${this.name}_collisionPlate`,
                {
                    width: this.width,
                    height: this.height,
                },
                scene
            );
            collisionPlate.isPickable = false;
            collisionPlate.scaling.z = this.frontPlateDepth;
            collisionPlate.visibility = 0;
            collisionPlate.parent = collisionMesh;
            this._collisionPlate = collisionPlate;

            const frontPlateModel = result.meshes[1];
            frontPlateModel.name = `${this.name}_frontPlate`;
            frontPlateModel.isPickable = false;
            frontPlateModel.scaling.x = this.width - this.backGlowOffset;
            frontPlateModel.scaling.y = this.height - this.backGlowOffset;
            frontPlateModel.position = Vector3.Forward(scene.useRightHandedSystem).scale(-0.5);
            frontPlateModel.parent = collisionPlate;

            if (this.isToggleButton) {
                frontPlateModel.visibility = 0;
            }

            if (this._frontMaterial) {
                frontPlateModel.material = this._frontMaterial;
            }

            this._textPlate.scaling.x = 1;
            this._textPlate.parent = frontPlateModel;
            this._frontPlate = frontPlateModel;
        });

        return collisionMesh;
    }

    private _createInnerQuad(scene: Scene) {
        const innerQuadMesh = CreateBox(`${this.name}_innerQuad`, {}, scene);
        innerQuadMesh.isPickable = false;
        innerQuadMesh.visibility = 0;
        innerQuadMesh.scaling.z = this.flatPlaneDepth;
        innerQuadMesh.position.z += this.backPlateDepth / 2 - this.flatPlaneDepth;

        SceneLoader.ImportMeshAsync(undefined, TouchHolographicButton.MRTK_ASSET_BASE_URL, TouchHolographicButton.INNERQUAD_MODEL_FILENAME, scene).then((result) => {
            const innerQuadModel = result.meshes[1];
            innerQuadModel.name = `${this.name}_innerQuad`;
            innerQuadModel.isPickable = false;
            innerQuadModel.scaling.x = this.width - this.backGlowOffset;
            innerQuadModel.scaling.y = this.height - this.backGlowOffset;
            innerQuadModel.parent = innerQuadMesh;

            if (this._innerQuadMaterial) {
                innerQuadModel.material = this._innerQuadMaterial;
            }

            this._innerQuad = innerQuadModel;
        });

        return innerQuadMesh;
    }

    private _createBackGlow(scene: Scene) {
        if (this.isToggleButton) {
            return;
        }

        const backGlowMesh = CreateBox(`${this.name}_backGlow`, {}, scene);
        backGlowMesh.isPickable = false;
        backGlowMesh.visibility = 0;
        backGlowMesh.scaling.z = this.flatPlaneDepth;
        backGlowMesh.position.z += this.backPlateDepth / 2 - this.flatPlaneDepth * 2;

        SceneLoader.ImportMeshAsync(undefined, TouchHolographicButton.MRTK_ASSET_BASE_URL, TouchHolographicButton.BACKGLOW_MODEL_FILENAME, scene).then((result) => {
            const backGlowModel = result.meshes[1];
            backGlowModel.name = `${this.name}_backGlow`;
            backGlowModel.isPickable = false;
            backGlowModel.scaling.x = this.width - this.backGlowOffset;
            backGlowModel.scaling.y = this.height - this.backGlowOffset;
            backGlowModel.parent = backGlowMesh;

            if (this._backGlowMaterial) {
                backGlowModel.material = this._backGlowMaterial;
            }

            this._backGlow = backGlowModel;
        });

        return backGlowMesh;
    }

    protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
        this._plateMaterial.emissiveTexture = facadeTexture;
        this._plateMaterial.opacityTexture = facadeTexture;
        this._plateMaterial.diffuseColor = this.plateMaterialColor;
    }

    private _performClickAnimation() {
        const frameRate = 60;
        const animationGroup = new AnimationGroup("Click Animation Group");

        const animations = [
            {
                name: "backGlowMotion",
                mesh: this._backGlow,
                property: "material.motion",
                keys: [
                    {
                        frame: 0,
                        values: [0, 0, 0],
                    },
                    {
                        frame: 20,
                        values: [1, 0.0144, 0.0144],
                    },
                    {
                        frame: 40,
                        values: [0.0027713229489760476, 0, 0],
                    },
                    {
                        frame: 45,
                        values: [0.0027713229489760476],
                    },
                ],
            },
            {
                name: "_collisionPlateZSlide",
                mesh: this._collisionPlate,
                property: "position.z",
                keys: [
                    {
                        frame: 0,
                        values: [0.0, 0.0, 0.0],
                    },
                    {
                        frame: 20,
                        values: [Vector3.Forward(this._collisionPlate._scene.useRightHandedSystem).scale(this.frontPlateDepth / 2).z, 0.0, 0.0],
                    },
                    {
                        frame: 40,
                        values: [0.0, 0.005403332496794331],
                    },
                    {
                        frame: 45,
                        values: [0.0],
                    },
                ],
            },
            {
                name: "_collisionPlateZScale",
                mesh: this._collisionPlate,
                property: "scaling.z",
                keys: [
                    {
                        frame: 0,
                        values: [this.frontPlateDepth, 0.0, 0.0],
                    },
                    {
                        frame: 20,
                        values: [this.backPlateDepth, 0.0, 0.0],
                    },
                    {
                        frame: 40,
                        values: [this.frontPlateDepth, 0.0054],
                    },
                    {
                        frame: 45,
                        values: [this.frontPlateDepth],
                    },
                ],
            },
        ];

        for (const animation of animations) {
            const anim = new Animation(animation.name, animation.property, frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
            const animkeyFrames = [];

            for (const key of animation.keys) {
                animkeyFrames.push({
                    frame: key.frame,
                    value: key.values[0],
                    inTangent: key.values[1],
                    outTangent: key.values[2],
                    interpolation: key.values[3],
                });
            }

            anim.setKeys(animkeyFrames);

            if (!animation.mesh) {
                continue;
            }

            animationGroup.addTargetedAnimation(anim, animation.mesh);
        }

        animationGroup.normalize(0, 45);
        animationGroup.speedRatio = 1;

        animationGroup.play();
    }

    private _performEnterExitAnimation(speedRatio: number) {
        const frameRate = 60;
        const animationGroup = new AnimationGroup("Enter Exit Animation Group");

        const animations = [
            {
                name: "frontPlateFadeOut",
                mesh: this._frontPlate,
                property: "material.fadeOut",
                keys: [
                    {
                        frame: 0,
                        values: [0, 0, 0.025045314830017686, 0],
                    },
                    {
                        frame: 40,
                        values: [1.00205599570012, 0.025045314830017686, 0, 0],
                    },
                ],
            },
            {
                name: "textPlateZSlide",
                mesh: this._textPlate,
                property: "position.z",
                keys: [
                    {
                        frame: 0,
                        values: [0, 0.0, 0.0],
                    },
                    {
                        frame: 40,
                        values: [Vector3.Forward(this._textPlate._scene.useRightHandedSystem).scale(-0.15).z, 0.0, 0.0],
                    },
                ],
            },
        ];

        for (const animation of animations) {
            const anim = new Animation(animation.name, animation.property, frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
            const animkeyFrames = [];

            for (const key of animation.keys) {
                animkeyFrames.push({
                    frame: key.frame,
                    value: key.values[0],
                    inTangent: key.values[1],
                    outTangent: key.values[2],
                    interpolation: key.values[3],
                });
            }

            anim.setKeys(animkeyFrames);

            if (!animation.mesh) {
                continue;
            }

            animationGroup.addTargetedAnimation(anim, animation.mesh);
        }

        animationGroup.normalize(0, 45);
        animationGroup.speedRatio = speedRatio;

        animationGroup.play();
    }

    private _createBackMaterial(mesh: Mesh) {
        this._backMaterial = this._backMaterial ?? new MRDLBackplateMaterial(this.name + "backPlateMaterial", mesh.getScene());
        this._backMaterial.absoluteSizes = true;
        this._backMaterial.radius = this.radius;
        this._backMaterial.lineWidth = 0.02;
    }

    private _createFrontMaterial(mesh: Mesh) {
        this._frontMaterial = this._frontMaterial ?? new MRDLFrontplateMaterial(this.name + "Front Material", mesh.getScene());
        this.frontMaterial.radius = this.innerQuadRadius;
        this.frontMaterial.fadeOut = 0.0;
    }

    private _createBackGlowMaterial(mesh: Mesh) {
        const glowRadius = this.radius + 0.04;
        this._backGlowMaterial = this._backGlowMaterial ?? new MRDLBackglowMaterial(this.name + "Back Glow Material", mesh.getScene());
        this._backGlowMaterial.bevelRadius = glowRadius;
        this._backGlowMaterial.lineWidth = glowRadius;
        this._backGlowMaterial.motion = 0.0;
    }

    private _createInnerQuadMaterial(mesh: Mesh) {
        this._innerQuadMaterial = this._innerQuadMaterial ?? new MRDLInnerquadMaterial("inner_quad", mesh.getScene());
        this._innerQuadMaterial.radius = this.innerQuadRadius;

        if (this.isToggleButton) {
            this._innerQuadMaterial.color = this.innerQuadColor;
        }
    }

    private _createPlateMaterial(mesh: Mesh) {
        this._plateMaterial = this._plateMaterial ?? new StandardMaterial(this.name + "Plate Material", mesh.getScene());
        this._plateMaterial.specularColor = Color3.Black();
    }

    protected _onToggle(newState: boolean) {
        super._onToggle(newState);
    }

    protected _affectMaterial(mesh: Mesh) {
        if (this._shareMaterials) {
            // Back
            if (!this._host._touchSharedMaterials["mrdlBackplateMaterial"]) {
                this._createBackMaterial(mesh);
                this._host._touchSharedMaterials["mrdlBackplateMaterial"] = this._backMaterial;
            } else {
                this._backMaterial = this._host._touchSharedMaterials["mrdlBackplateMaterial"] as MRDLBackplateMaterial;
            }

            // Front
            if (!this._host._touchSharedMaterials["mrdlFrontplateMaterial"]) {
                this._createFrontMaterial(mesh);
                this._host._touchSharedMaterials["mrdlFrontplateMaterial"] = this._frontMaterial;
            } else {
                this._frontMaterial = this._host._touchSharedMaterials["mrdlFrontplateMaterial"] as MRDLFrontplateMaterial;
            }

            // Back glow
            if (!this._host._touchSharedMaterials["mrdlBackglowMaterial"]) {
                this._createBackGlowMaterial(mesh);
                this._host._touchSharedMaterials["mrdlBackglowMaterial"] = this._backGlowMaterial;
            } else {
                this._backGlowMaterial = this._host._touchSharedMaterials["mrdlBackglowMaterial"] as MRDLBackglowMaterial;
            }

            // Inner quad
            if (!this._host._touchSharedMaterials["mrdlInnerQuadMaterial"]) {
                this._createInnerQuadMaterial(mesh);
                this._host._touchSharedMaterials["mrdlInnerQuadMaterial"] = this._innerQuadMaterial;
            } else {
                this._innerQuadMaterial = this._host._touchSharedMaterials["mrdlInnerQuadMaterial"] as MRDLInnerquadMaterial;
            }
        } else {
            this._createBackMaterial(mesh);
            this._createFrontMaterial(mesh);
            this._createBackGlowMaterial(mesh);
            this._createInnerQuadMaterial(mesh);
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

        if (this._backGlow) {
            this._backGlow.material = this._backGlowMaterial;
        }

        if (this._innerQuad) {
            this._innerQuad.material = this._innerQuadMaterial;
        }

        this._rebuildContent();
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose(); // will dispose main mesh ie. back plate

        this._disposeTooltip();
        this.onPointerClickObservable.remove(this._pointerClickObserver);
        this.onPointerEnterObservable.remove(this._pointerEnterObserver);
        this.onPointerOutObservable.remove(this._pointerOutObserver);
        this.onToggleObservable.remove(this._toggleObserver);

        if (!this.shareMaterials) {
            this._backMaterial.dispose();
            this._frontMaterial.dispose();
            this._plateMaterial.dispose();
            this._backGlowMaterial.dispose();
            this._innerQuadMaterial.dispose();

            if (this._pickedPointObserver) {
                this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
                this._pickedPointObserver = null;
            }
        }
    }
}
