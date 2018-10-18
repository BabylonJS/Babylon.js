import { Rectangle } from "./rectangle";
import { Control } from "./control";
import { TextBlock } from "./textBlock";
import { Image } from "./image";
import { Vector2, Nullable } from "babylonjs";

/**
 * Class used to create 2D buttons
 */
export class Button extends Rectangle {
    /**
     * Function called to generate a pointer enter animation
     */
    public pointerEnterAnimation: () => void;
    /**
     * Function called to generate a pointer out animation
     */
    public pointerOutAnimation: () => void;
    /**
     * Function called to generate a pointer down animation
     */
    public pointerDownAnimation: () => void;
    /**
     * Function called to generate a pointer up animation
     */
    public pointerUpAnimation: () => void;

    private _image: Nullable<Image>;
    /**
     * Returns the image part of the button (if any)
     */
    public get image(): Nullable<Image> {
        return this._image;
    }

    private _textBlock: Nullable<TextBlock>;
    /**
     * Returns the image part of the button (if any)
     */
    public get textBlock(): Nullable<TextBlock> {
        return this._textBlock;
    }

    /**
     * Creates a new Button
     * @param name defines the name of the button
     */
    constructor(public name?: string) {
        super(name);

        this.thickness = 1;
        this.isPointerBlocker = true;

        this.pointerEnterAnimation = () => {
            this.alpha -= 0.1;
        };

        this.pointerOutAnimation = () => {
            this.alpha += 0.1;
        };

        this.pointerDownAnimation = () => {
            this.scaleX -= 0.05;
            this.scaleY -= 0.05;
        };

        this.pointerUpAnimation = () => {
            this.scaleX += 0.05;
            this.scaleY += 0.05;
        };
    }

    protected _getTypeName(): string {
        return "Button";
    }

    // While being a container, the button behaves like a control.
    /** @hidden */
    public _processPicking(x: number, y: number, type: number, pointerId: number, buttonIndex: number): boolean {
        if (!this.isHitTestVisible || !this.isVisible || this.notRenderable) {
            return false;
        }

        if (!super.contains(x, y)) {
            return false;
        }

        this._processObservables(type, x, y, pointerId, buttonIndex);

        return true;
    }

    /** @hidden */
    public _onPointerEnter(target: Control): boolean {
        if (!super._onPointerEnter(target)) {
            return false;
        }

        if (this.pointerEnterAnimation) {
            this.pointerEnterAnimation();
        }

        return true;
    }

    /** @hidden */
    public _onPointerOut(target: Control): void {
        if (this.pointerOutAnimation) {
            this.pointerOutAnimation();
        }

        super._onPointerOut(target);
    }

    /** @hidden */
    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
            return false;
        }

        if (this.pointerDownAnimation) {
            this.pointerDownAnimation();
        }

        return true;
    }

    /** @hidden */
    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void {
        if (this.pointerUpAnimation) {
            this.pointerUpAnimation();
        }

        super._onPointerUp(target, coordinates, pointerId, buttonIndex, notifyClick);
    }

    // Statics
    /**
     * Creates a new button made with an image and a text
     * @param name defines the name of the button
     * @param text defines the text of the button
     * @param imageUrl defines the url of the image
     * @returns a new Button
     */
    public static CreateImageButton(name: string, text: string, imageUrl: string): Button {
        var result = new Button(name);

        // Adding text
        var textBlock = new TextBlock(name + "_button", text);
        textBlock.textWrapping = true;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.paddingLeft = "20%";
        result.addControl(textBlock);

        // Adding image
        var iconImage = new Image(name + "_icon", imageUrl);
        iconImage.width = "20%";
        iconImage.stretch = Image.STRETCH_UNIFORM;
        iconImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        result.addControl(iconImage);

        // Store
        result._image = iconImage;
        result._textBlock = textBlock;

        return result;
    }

    /**
     * Creates a new button made with an image
     * @param name defines the name of the button
     * @param imageUrl defines the url of the image
     * @returns a new Button
     */
    public static CreateImageOnlyButton(name: string, imageUrl: string): Button {
        var result = new Button(name);

        // Adding image
        var iconImage = new Image(name + "_icon", imageUrl);
        iconImage.stretch = Image.STRETCH_FILL;
        iconImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        result.addControl(iconImage);

        // Store
        result._image = iconImage;

        return result;
    }

    /**
     * Creates a new button made with a text
     * @param name defines the name of the button
     * @param text defines the text of the button
     * @returns a new Button
     */
    public static CreateSimpleButton(name: string, text: string): Button {
        var result = new Button(name);

        // Adding text
        var textBlock = new TextBlock(name + "_button", text);
        textBlock.textWrapping = true;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        result.addControl(textBlock);

        // Store
        result._textBlock = textBlock;

        return result;
    }

    /**
     * Creates a new button made with an image and a centered text
     * @param name defines the name of the button
     * @param text defines the text of the button
     * @param imageUrl defines the url of the image
     * @returns a new Button
     */
    public static CreateImageWithCenterTextButton(name: string, text: string, imageUrl: string): Button {
        var result = new Button(name);

        // Adding image
        var iconImage = new Image(name + "_icon", imageUrl);
        iconImage.stretch = Image.STRETCH_FILL;
        result.addControl(iconImage);

        // Adding text
        var textBlock = new TextBlock(name + "_button", text);
        textBlock.textWrapping = true;
        textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        result.addControl(textBlock);

        // Store
        result._image = iconImage;
        result._textBlock = textBlock;

        return result;
    }
}