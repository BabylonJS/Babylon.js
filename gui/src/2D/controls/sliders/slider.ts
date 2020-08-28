import { BaseSlider } from "./baseSlider";
import { _TypeStore } from 'babylonjs/Misc/typeStore';
import { Nullable } from 'babylonjs/types';
import { Measure } from '../../measure';

/**
 * Class used to create slider controls
 */
export class Slider extends BaseSlider {
    private _background = "black";
    private _borderColor = "white";
    private _thumbColor = "";
    private _isThumbCircle = false;
    protected _displayValueBar = true;

    /** Gets or sets a boolean indicating if the value bar must be rendered */
    public get displayValueBar(): boolean {
        return this._displayValueBar;
    }

    public set displayValueBar(value: boolean) {
        if (this._displayValueBar === value) {
            return;
        }

        this._displayValueBar = value;
        this._markAsDirty();
    }

    /** Gets or sets border color */
    public get borderColor(): string {
        return this._borderColor;
    }

    public set borderColor(value: string) {
        if (this._borderColor === value) {
            return;
        }

        this._borderColor = value;
        this._markAsDirty();
    }

    /** Gets or sets background color */
    public get background(): string {
        return this._background;
    }

    public set background(value: string) {
        if (this._background === value) {
            return;
        }

        this._background = value;
        this._markAsDirty();
    }
    
    /** Gets or sets thumb's color */
    public get thumbColor(): string {
        return this._thumbColor;
    }
    
    public set thumbColor(value: string) {
        if (this._thumbColor === value) {
            return;
        }
    
        this._thumbColor = value;
        this._markAsDirty();
    }

    /** Gets or sets a boolean indicating if the thumb should be round or square */
    public get isThumbCircle(): boolean {
        return this._isThumbCircle;
    }

    public set isThumbCircle(value: boolean) {
        if (this._isThumbCircle === value) {
            return;
        }

        this._isThumbCircle = value;
        this._markAsDirty();
    }

    /**
     * Creates a new Slider
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "Slider";
    }

    public _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: Nullable<Measure>): void {
        context.save();

        this._applyStates(context);
        this._prepareRenderingData(this.isThumbCircle ? "circle" : "rectangle");
        var left = this._renderLeft;
        var top = this._renderTop;
        var width = this._renderWidth;
        var height = this._renderHeight;

        var radius = 0;

        if (this.isThumbClamped && this.isThumbCircle) {
            if (this.isVertical) {
                top += (this._effectiveThumbThickness / 2);
            }
            else {
                left += (this._effectiveThumbThickness / 2);
            }

            radius = this._backgroundBoxThickness / 2;
        }
        else {
            radius = (this._effectiveThumbThickness - this._effectiveBarOffset) / 2;
        }

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        const thumbPosition = this._getThumbPosition();
        context.fillStyle = this._background;

        if (this.isVertical) {
            if (this.isThumbClamped) {
                if (this.isThumbCircle) {
                    context.beginPath();
                    context.arc(left + this._backgroundBoxThickness / 2, top, radius, Math.PI, 2 * Math.PI);
                    context.fill();
                    context.fillRect(left, top, width, height);
                }
                else {
                    context.fillRect(left, top, width, height + this._effectiveThumbThickness);
                }
            }
            else {
                context.fillRect(left, top, width, height);
            }
        }
        else {
            if (this.isThumbClamped) {
                if (this.isThumbCircle) {
                    context.beginPath();
                    context.arc(left + this._backgroundBoxLength, top + (this._backgroundBoxThickness / 2), radius, 0, 2 * Math.PI);
                    context.fill();
                    context.fillRect(left, top, width, height);
                }
                else {
                    context.fillRect(left, top, width + this._effectiveThumbThickness, height);
                }
            }
            else {
                context.fillRect(left, top, width, height);
            }
        }

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }

        // Value bar
        context.fillStyle = this.color;
        if (this._displayValueBar) {
            if (this.isVertical) {
                if (this.isThumbClamped) {
                    if (this.isThumbCircle) {
                        context.beginPath();
                        context.arc(left + this._backgroundBoxThickness / 2, top + this._backgroundBoxLength, radius, 0, 2 * Math.PI);
                        context.fill();
                        context.fillRect(left, top + thumbPosition, width, height - thumbPosition);
                    }
                    else {
                        context.fillRect(left, top + thumbPosition, width, height - thumbPosition + this._effectiveThumbThickness);
                    }
                }
                else {
                    context.fillRect(left, top + thumbPosition, width, height - thumbPosition);
                }
            }
            else {
                if (this.isThumbClamped) {
                    if (this.isThumbCircle) {
                        context.beginPath();
                        context.arc(left, top + this._backgroundBoxThickness / 2, radius, 0, 2 * Math.PI);
                        context.fill();
                        context.fillRect(left, top, thumbPosition, height);
                    }
                    else {
                        context.fillRect(left, top, thumbPosition, height);
                    }
                }
                else {
                    context.fillRect(left, top, thumbPosition, height);
                }
            }
        }

        // Thumb
        context.fillStyle = this._thumbColor || this.color;
        if (this.displayThumb) {
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }
            if (this._isThumbCircle) {
                context.beginPath();
                if (this.isVertical) {
                    context.arc(left + this._backgroundBoxThickness / 2, top + thumbPosition, radius, 0, 2 * Math.PI);
                }
                else {
                    context.arc(left + thumbPosition, top + (this._backgroundBoxThickness / 2), radius, 0, 2 * Math.PI);
                }
                context.fill();
                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }
                context.strokeStyle = this._borderColor;
                context.stroke();
            }
            else {
                if (this.isVertical) {
                    context.fillRect(left - this._effectiveBarOffset, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, this._effectiveThumbThickness);
                }
                else {
                    context.fillRect(this._currentMeasure.left + thumbPosition, this._currentMeasure.top, this._effectiveThumbThickness, this._currentMeasure.height);
                }
                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }
                context.strokeStyle = this._borderColor;
                if (this.isVertical) {
                    context.strokeRect(left - this._effectiveBarOffset, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, this._effectiveThumbThickness);
                }
                else {
                    context.strokeRect(this._currentMeasure.left + thumbPosition, this._currentMeasure.top, this._effectiveThumbThickness, this._currentMeasure.height);
                }
            }
        }
        context.restore();
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.Slider"] = Slider;