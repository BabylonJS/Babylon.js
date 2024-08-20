import { BaseSlider } from "./baseSlider";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";
import type { ICanvasRenderingContext } from "core/Engines/ICanvas";
import type { Nullable } from "core/types";
import type { BaseGradient } from "../gradient/BaseGradient";
import type { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import { Tools } from "core/Misc/tools";

/**
 * Class used to create slider controls
 */
export class Slider extends BaseSlider {
    private _background = "black";
    private _borderColor = "white";
    private _thumbColor = "";
    private _isThumbCircle = false;
    protected _displayValueBar = true;
    private _backgroundGradient: Nullable<BaseGradient> = null;

    /** Gets or sets a boolean indicating if the value bar must be rendered */
    @serialize()
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
    @serialize()
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
    @serialize()
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

    /** Gets or sets background gradient */
    public get backgroundGradient(): Nullable<BaseGradient> {
        return this._backgroundGradient;
    }

    public set backgroundGradient(value: Nullable<BaseGradient>) {
        if (this._backgroundGradient === value) {
            return;
        }

        this._backgroundGradient = value;
        this._markAsDirty();
    }

    /** Gets or sets thumb's color */
    @serialize()
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
    @serialize()
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
    constructor(public override name?: string) {
        super(name);
    }

    protected override _getTypeName(): string {
        return "Slider";
    }

    protected _getBackgroundColor(context: ICanvasRenderingContext) {
        return this._backgroundGradient ? this._backgroundGradient.getCanvasGradient(context) : this._background;
    }

    public override _draw(context: ICanvasRenderingContext): void {
        context.save();

        this._applyStates(context);
        this._prepareRenderingData(this.isThumbCircle ? "circle" : "rectangle");
        let left = this._renderLeft;
        let top = this._renderTop;
        const width = this._renderWidth;
        const height = this._renderHeight;

        let radius = 0;

        if (this.isThumbClamped && this.isThumbCircle) {
            if (this.isVertical) {
                top += this._effectiveThumbThickness / 2;
            } else {
                left += this._effectiveThumbThickness / 2;
            }

            radius = this._backgroundBoxThickness / 2;
        } else {
            radius = (this._effectiveThumbThickness - this._effectiveBarOffset) / 2;
        }
        radius = Math.max(0, radius);

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        const thumbPosition = this._getThumbPosition();
        context.fillStyle = this._getBackgroundColor(context);

        if (this.isVertical) {
            if (this.isThumbClamped) {
                if (this.isThumbCircle) {
                    context.beginPath();
                    context.arc(left + this._backgroundBoxThickness / 2, top, radius, Math.PI, 2 * Math.PI);
                    context.fill();
                    context.fillRect(left, top, width, height);
                } else {
                    context.fillRect(left, top, width, height + this._effectiveThumbThickness);
                }
            } else {
                context.fillRect(left, top, width, height);
            }
        } else {
            if (this.isThumbClamped) {
                if (this.isThumbCircle) {
                    context.beginPath();
                    context.arc(left + this._backgroundBoxLength, top + this._backgroundBoxThickness / 2, radius, 0, 2 * Math.PI);
                    context.fill();
                    context.fillRect(left, top, width, height);
                } else {
                    context.fillRect(left, top, width + this._effectiveThumbThickness, height);
                }
            } else {
                context.fillRect(left, top, width, height);
            }
        }

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }

        // Value bar
        context.fillStyle = this._getColor(context);
        if (this._displayValueBar) {
            if (this.isVertical) {
                if (this.isThumbClamped) {
                    if (this.isThumbCircle) {
                        context.beginPath();
                        context.arc(left + this._backgroundBoxThickness / 2, top + this._backgroundBoxLength, radius, 0, 2 * Math.PI);
                        context.fill();
                        context.fillRect(left, top + thumbPosition, width, height - thumbPosition);
                    } else {
                        context.fillRect(left, top + thumbPosition, width, height - thumbPosition + this._effectiveThumbThickness);
                    }
                } else {
                    context.fillRect(left, top + thumbPosition, width, height - thumbPosition);
                }
            } else {
                if (this.isThumbClamped) {
                    if (this.isThumbCircle) {
                        context.beginPath();
                        context.arc(left, top + this._backgroundBoxThickness / 2, radius, 0, 2 * Math.PI);
                        context.fill();
                        context.fillRect(left, top, thumbPosition, height);
                    } else {
                        context.fillRect(left, top, thumbPosition, height);
                    }
                } else {
                    context.fillRect(left, top, thumbPosition, height);
                }
            }
        }

        // Thumb
        context.fillStyle = this._thumbColor || this._getColor(context);
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
                } else {
                    context.arc(left + thumbPosition, top + this._backgroundBoxThickness / 2, radius, 0, 2 * Math.PI);
                }
                context.fill();
                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }
                context.strokeStyle = this._borderColor;
                context.stroke();
            } else {
                if (this.isVertical) {
                    context.fillRect(left - this._effectiveBarOffset, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, this._effectiveThumbThickness);
                } else {
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
                } else {
                    context.strokeRect(this._currentMeasure.left + thumbPosition, this._currentMeasure.top, this._effectiveThumbThickness, this._currentMeasure.height);
                }
            }
        }
        context.restore();
    }

    public override serialize(serializationObject: any) {
        super.serialize(serializationObject);

        if (this.backgroundGradient) {
            serializationObject.backgroundGradient = {};
            this.backgroundGradient.serialize(serializationObject.backgroundGradient);
        }
    }

    /** @internal */
    public override _parseFromContent(serializedObject: any, host: AdvancedDynamicTexture) {
        super._parseFromContent(serializedObject, host);

        if (serializedObject.backgroundGradient) {
            const className = Tools.Instantiate("BABYLON.GUI." + serializedObject.backgroundGradient.className);
            this.backgroundGradient = new className();
            this.backgroundGradient!.parse(serializedObject.backgroundGradient);
        }
    }
}
RegisterClass("BABYLON.GUI.Slider", Slider);
