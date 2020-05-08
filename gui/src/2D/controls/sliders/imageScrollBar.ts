import { Vector2 } from "babylonjs/Maths/math.vector";
import { BaseSlider } from "./baseSlider";
import { Control } from "../control";
import { Image } from "../image";
import { Measure } from "../../measure";

/**
 * Class used to create slider controls
 */
export class ImageScrollBar extends BaseSlider {
    private _backgroundBaseImage: Image;
    private _backgroundImage: Image;
    private _thumbImage: Image;
    private _thumbBaseImage: Image;
    private _thumbLength: number = 0.5;
    private _thumbHeight: number = 1;
    private _barImageHeight: number = 1;
    private _tempMeasure = new Measure(0, 0, 0, 0);

    /** Number of 90° rotation to apply on the images when in vertical mode */
    public num90RotationInVerticalMode = 1;

    /**
     * Gets or sets the image used to render the background for horizontal bar
     */
    public get backgroundImage(): Image {
        return this._backgroundBaseImage;
    }

    public set backgroundImage(value: Image) {
        if (this._backgroundBaseImage === value) {
            return;
        }

        this._backgroundBaseImage = value;

        if (this.isVertical && this.num90RotationInVerticalMode !== 0) {
            if (!value.isLoaded) {
                value.onImageLoadedObservable.addOnce(() => {
                    const rotatedValue = value._rotate90(this.num90RotationInVerticalMode, true);
                    this._backgroundImage = rotatedValue;
                    if (!rotatedValue.isLoaded) {
                        rotatedValue.onImageLoadedObservable.addOnce(() => {
                            this._markAsDirty();
                        });
                    }
                    this._markAsDirty();
                });
            } else {
                this._backgroundImage = value._rotate90(this.num90RotationInVerticalMode, true);
                this._markAsDirty();
            }
        }
        else {
            this._backgroundImage = value;
            if (value && !value.isLoaded) {
                value.onImageLoadedObservable.addOnce(() => {
                    this._markAsDirty();
                });
            }

            this._markAsDirty();
        }
    }

    /**
     * Gets or sets the image used to render the thumb
     */
    public get thumbImage(): Image {
        return this._thumbBaseImage;
    }

    public set thumbImage(value: Image) {
        if (this._thumbBaseImage === value) {
            return;
        }

        this._thumbBaseImage = value;

        if (this.isVertical && this.num90RotationInVerticalMode !== 0) {
            if (!value.isLoaded) {
                value.onImageLoadedObservable.addOnce(() => {
                    var rotatedValue = value._rotate90(-this.num90RotationInVerticalMode, true);
                    this._thumbImage = rotatedValue;
                    if (!rotatedValue.isLoaded) {
                        rotatedValue.onImageLoadedObservable.addOnce(() => {
                            this._markAsDirty();
                        });
                    }
                    this._markAsDirty();
                });
            } else {
                this._thumbImage = value._rotate90(-this.num90RotationInVerticalMode, true);
                this._markAsDirty();
            }
        }
        else {
            this._thumbImage = value;
            if (value && !value.isLoaded) {
                value.onImageLoadedObservable.addOnce(() => {
                    this._markAsDirty();
                });
            }

            this._markAsDirty();
        }
    }

    /**
     * Gets or sets the length of the thumb
     */
    public get thumbLength(): number {
        return this._thumbLength;
    }

    public set thumbLength(value: number) {
        if (this._thumbLength === value) {
            return;
        }

        this._thumbLength = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets the height of the thumb
     */
    public get thumbHeight(): number {
        return this._thumbHeight;
    }

    public set thumbHeight(value: number) {
        if (this._thumbLength === value) {
            return;
        }

        this._thumbHeight = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets the height of the bar image
     */
    public get barImageHeight(): number {
        return this._barImageHeight;
    }

    public set barImageHeight(value: number) {
        if (this._barImageHeight === value) {
            return;
        }

        this._barImageHeight = value;

        this._markAsDirty();
    }

    /**
     * Creates a new ImageScrollBar
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "ImageScrollBar";
    }

    protected _getThumbThickness(): number {
        var thumbThickness = 0;
        if (this._thumbWidth.isPixel) {
            thumbThickness = this._thumbWidth.getValue(this._host);
        }
        else {
            thumbThickness = this._backgroundBoxThickness * this._thumbWidth.getValue(this._host);
        }
        return thumbThickness;
    }

    public _draw(context: CanvasRenderingContext2D): void {
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
            if (this.isVertical) {
                this._tempMeasure.copyFromFloats(left + width * (1 - this._barImageHeight) * 0.5, this._currentMeasure.top, width * this._barImageHeight, height);
                this._tempMeasure.height += this._effectiveThumbThickness;
                this._backgroundImage._currentMeasure.copyFrom(this._tempMeasure);
            }
            else {
                this._tempMeasure.copyFromFloats(this._currentMeasure.left, top + height * (1 - this._barImageHeight) * 0.5, width, height * this._barImageHeight);
                this._tempMeasure.width += this._effectiveThumbThickness;
                this._backgroundImage._currentMeasure.copyFrom(this._tempMeasure);
            }
            this._backgroundImage._draw(context);
        }

        // Thumb
        if (this.isVertical) {
            this._tempMeasure.copyFromFloats(left - this._effectiveBarOffset + this._currentMeasure.width * (1 - this._thumbHeight) * 0.5, this._currentMeasure.top + thumbPosition, this._currentMeasure.width * this._thumbHeight, this._effectiveThumbThickness);
        }
        else {
            this._tempMeasure.copyFromFloats(this._currentMeasure.left + thumbPosition, this._currentMeasure.top + this._currentMeasure.height * (1 - this._thumbHeight) * 0.5, this._effectiveThumbThickness, this._currentMeasure.height * this._thumbHeight);
        }

        if (this._thumbImage) {
            this._thumbImage._currentMeasure.copyFrom(this._tempMeasure);
            this._thumbImage._draw(context);
        }

        context.restore();
    }

    private _first: boolean;
    private _originX: number;
    private _originY: number;

    /** @hidden */
    protected _updateValueFromPointer(x: number, y: number): void {
        if (this.rotation != 0) {
            this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
            x = this._transformedPosition.x;
            y = this._transformedPosition.y;
        }

        if (this._first) {
            this._first = false;
            this._originX = x;
            this._originY = y;

            // Check if move is required
            if (x < this._tempMeasure.left || x > this._tempMeasure.left + this._tempMeasure.width || y < this._tempMeasure.top || y > this._tempMeasure.top + this._tempMeasure.height) {
                if (this.isVertical) {
                    this.value = this.minimum + (1 - ((y - this._currentMeasure.top) / this._currentMeasure.height)) * (this.maximum - this.minimum);
                }
                else {
                    this.value = this.minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this.maximum - this.minimum);
                }
            }
        }

        // Delta mode
        let delta = 0;
        if (this.isVertical) {
            delta = -((y - this._originY) / (this._currentMeasure.height - this._effectiveThumbThickness));
        }
        else {
            delta = (x - this._originX) / (this._currentMeasure.width - this._effectiveThumbThickness);
        }

        this.value += delta * (this.maximum - this.minimum);

        this._originX = x;
        this._originY = y;
    }

    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        this._first = true;

        return super._onPointerDown(target, coordinates, pointerId, buttonIndex);
    }
}
