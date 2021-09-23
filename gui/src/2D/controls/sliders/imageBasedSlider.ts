import { BaseSlider } from "./baseSlider";
import { Measure } from "../../measure";
import { Image } from "../image";
import { _TypeStore } from 'babylonjs/Misc/typeStore';
import { Nullable } from 'babylonjs/types';
import { serialize } from "babylonjs/Misc/decorators";
import { ICanvasRenderingContext } from "babylonjs/Engines/ICanvas";
import { AdvancedDynamicTexture } from "../../advancedDynamicTexture";

/**
 * Class used to create slider controls based on images
 */
export class ImageBasedSlider extends BaseSlider {
    private _backgroundImage: Image;
    private _thumbImage: Image;
    private _valueBarImage: Image;

    private _tempMeasure = new Measure(0, 0, 0, 0);

    @serialize()
    public get displayThumb(): boolean {
        return this._displayThumb && this.thumbImage != null;
    }

    public set displayThumb(value: boolean) {
        if (this._displayThumb === value) {
            return;
        }

        this._displayThumb = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets the image used to render the background
     */
    public get backgroundImage(): Image {
        return this._backgroundImage;
    }

    public set backgroundImage(value: Image) {
        if (this._backgroundImage === value) {
            return;
        }

        this._backgroundImage = value;

        if (value && !value.isLoaded) {
            value.onImageLoadedObservable.addOnce(() => this._markAsDirty());
        }

        this._markAsDirty();
    }

    /**
     * Gets or sets the image used to render the value bar
     */
    public get valueBarImage(): Image {
        return this._valueBarImage;
    }

    public set valueBarImage(value: Image) {
        if (this._valueBarImage === value) {
            return;
        }

        this._valueBarImage = value;

        if (value && !value.isLoaded) {
            value.onImageLoadedObservable.addOnce(() => this._markAsDirty());
        }

        this._markAsDirty();
    }

    /**
     * Gets or sets the image used to render the thumb
     */
    public get thumbImage(): Image {
        return this._thumbImage;
    }

    public set thumbImage(value: Image) {
        if (this._thumbImage === value) {
            return;
        }

        this._thumbImage = value;

        if (value && !value.isLoaded) {
            value.onImageLoadedObservable.addOnce(() => this._markAsDirty());
        }

        this._markAsDirty();
    }

    /**
     * Creates a new ImageBasedSlider
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "ImageBasedSlider";
    }

    public _draw(context: ICanvasRenderingContext, invalidatedRectangle?: Nullable<Measure>): void {
        context.save();

        this._applyStates(context);

        this._prepareRenderingData("rectangle");
        const thumbPosition = this._getThumbPosition();
        var left = this._renderLeft;
        var top = this._renderTop;
        var width = this._renderWidth;
        var height = this._renderHeight;

        // Background
        if (this._backgroundImage) {
            this._tempMeasure.copyFromFloats(left, top, width, height);
            if (this.isThumbClamped && this.displayThumb) {
                if (this.isVertical) {
                    this._tempMeasure.height += this._effectiveThumbThickness;
                } else {
                    this._tempMeasure.width += this._effectiveThumbThickness;
                }
            }
            this._backgroundImage._currentMeasure.copyFrom(this._tempMeasure);
            this._backgroundImage._draw(context);
        }

        // Bar
        if (this._valueBarImage) {
            if (this.isVertical) {
                if (this.isThumbClamped && this.displayThumb) {
                    this._tempMeasure.copyFromFloats(left, top + thumbPosition, width, height - thumbPosition + this._effectiveThumbThickness);
                } else {
                    this._tempMeasure.copyFromFloats(left, top + thumbPosition, width, height - thumbPosition);
                }
            } else {
                if (this.isThumbClamped && this.displayThumb) {
                    this._tempMeasure.copyFromFloats(left, top, thumbPosition + this._effectiveThumbThickness / 2, height);
                }
                else {
                    this._tempMeasure.copyFromFloats(left, top, thumbPosition, height);
                }
            }
            this._valueBarImage._currentMeasure.copyFrom(this._tempMeasure);
            this._valueBarImage._draw(context);
        }

        // Thumb
        if (this.displayThumb) {
            if (this.isVertical) {
                this._tempMeasure.copyFromFloats(left - this._effectiveBarOffset, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, this._effectiveThumbThickness);
            } else {
                this._tempMeasure.copyFromFloats(this._currentMeasure.left + thumbPosition, this._currentMeasure.top, this._effectiveThumbThickness, this._currentMeasure.height);
            }

            this._thumbImage._currentMeasure.copyFrom(this._tempMeasure);
            this._thumbImage._draw(context);
        }

        context.restore();
    }

    /**
    * Serializes the current control
    * @param serializationObject defined the JSON serialized object
    */
    public serialize(serializationObject: any) {
        super.serialize(serializationObject);
        let backgroundImage = {};
        let thumbImage = {};
        let valueBarImage = {};
        this.backgroundImage.serialize(backgroundImage);
        this.thumbImage.serialize(thumbImage);
        this.valueBarImage.serialize(valueBarImage);
        serializationObject.backgroundImage = backgroundImage;
        serializationObject.thumbImage = thumbImage;
        serializationObject.valueBarImage = valueBarImage;
    }

    /** @hidden */
    public _parseFromContent(serializedObject: any, host: AdvancedDynamicTexture) {
        super._parseFromContent(serializedObject, host);
        this.backgroundImage = Image.Parse(serializedObject.backgroundImage, host) as Image;
        this.thumbImage = Image.Parse(serializedObject.thumbImage, host) as Image;
        this.valueBarImage = Image.Parse(serializedObject.valueBarImage, host) as Image;
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.ImageBasedSlider"] = ImageBasedSlider;