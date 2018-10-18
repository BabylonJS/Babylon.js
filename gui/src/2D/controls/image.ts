import { Control } from "./control";
import { Nullable, Tools, Observable } from "babylonjs";
import { Measure } from "../measure";

/**
 * Class used to create 2D images
 */
export class Image extends Control {
    private _domImage: HTMLImageElement;
    private _imageWidth: number;
    private _imageHeight: number;
    private _loaded = false;
    private _stretch = Image.STRETCH_FILL;
    private _source: Nullable<string>;
    private _autoScale = false;

    private _sourceLeft = 0;
    private _sourceTop = 0;
    private _sourceWidth = 0;
    private _sourceHeight = 0;

    private _cellWidth: number = 0;
    private _cellHeight: number = 0;
    private _cellId: number = -1;

    /**
     * Observable notified when the content is loaded
     */
    public onImageLoadedObservable = new Observable<Image>();

    /**
     * Gets a boolean indicating that the content is loaded
     */
    public get isLoaded(): boolean {
        return this._loaded;
    }

    /**
     * Gets or sets the left coordinate in the source image
     */
    public get sourceLeft(): number {
        return this._sourceLeft;
    }

    public set sourceLeft(value: number) {
        if (this._sourceLeft === value) {
            return;
        }

        this._sourceLeft = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets the top coordinate in the source image
     */
    public get sourceTop(): number {
        return this._sourceTop;
    }

    public set sourceTop(value: number) {
        if (this._sourceTop === value) {
            return;
        }

        this._sourceTop = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets the width to capture in the source image
     */
    public get sourceWidth(): number {
        return this._sourceWidth;
    }

    public set sourceWidth(value: number) {
        if (this._sourceWidth === value) {
            return;
        }

        this._sourceWidth = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets the height to capture in the source image
     */
    public get sourceHeight(): number {
        return this._sourceHeight;
    }

    public set sourceHeight(value: number) {
        if (this._sourceHeight === value) {
            return;
        }

        this._sourceHeight = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets a boolean indicating if the image can force its container to adapt its size
     * @see http://doc.babylonjs.com/how_to/gui#image
     */
    public get autoScale(): boolean {
        return this._autoScale;
    }

    public set autoScale(value: boolean) {
        if (this._autoScale === value) {
            return;
        }

        this._autoScale = value;

        if (value && this._loaded) {
            this.synchronizeSizeWithContent();
        }
    }

    /** Gets or sets the streching mode used by the image */
    public get stretch(): number {
        return this._stretch;
    }

    public set stretch(value: number) {
        if (this._stretch === value) {
            return;
        }

        this._stretch = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets the internal DOM image used to render the control
     */
    public set domImage(value: HTMLImageElement) {
        this._domImage = value;
        this._loaded = false;

        if (this._domImage.width) {
            this._onImageLoaded();
        } else {
            this._domImage.onload = () => {
                this._onImageLoaded();
            };
        }
    }

    public get domImage(): HTMLImageElement {
        return this._domImage;
    }

    private _onImageLoaded(): void {
        this._imageWidth = this._domImage.width;
        this._imageHeight = this._domImage.height;
        this._loaded = true;

        if (this._autoScale) {
            this.synchronizeSizeWithContent();
        }

        this.onImageLoadedObservable.notifyObservers(this);

        this._markAsDirty();
    }

    /**
     * Gets or sets image source url
     */
    public set source(value: Nullable<string>) {
        if (this._source === value) {
            return;
        }

        this._loaded = false;
        this._source = value;

        this._domImage = document.createElement("img");

        this._domImage.onload = () => {
            this._onImageLoaded();
        };
        if (value) {
            Tools.SetCorsBehavior(value, this._domImage);
            this._domImage.src = value;
        }
    }

    /**
     * Gets or sets the cell width to use when animation sheet is enabled
     * @see http://doc.babylonjs.com/how_to/gui#image
     */
    get cellWidth(): number {
        return this._cellWidth;
    }
    set cellWidth(value: number) {
        if (this._cellWidth === value) {
            return;
        }

        this._cellWidth = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets the cell height to use when animation sheet is enabled
     * @see http://doc.babylonjs.com/how_to/gui#image
     */
    get cellHeight(): number {
        return this._cellHeight;
    }
    set cellHeight(value: number) {
        if (this._cellHeight === value) {
            return;
        }

        this._cellHeight = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets the cell id to use (this will turn on the animation sheet mode)
     * @see http://doc.babylonjs.com/how_to/gui#image
     */
    get cellId(): number {
        return this._cellId;
    }
    set cellId(value: number) {
        if (this._cellId === value) {
            return;
        }

        this._cellId = value;
        this._markAsDirty();
    }

    /**
     * Creates a new Image
     * @param name defines the control name
     * @param url defines the image url
     */
    constructor(public name?: string, url: Nullable<string> = null) {
        super(name);

        this.source = url;
    }

    protected _getTypeName(): string {
        return "Image";
    }

    /** Force the control to synchronize with its content */
    public synchronizeSizeWithContent() {
        if (!this._loaded) {
            return;
        }

        this.width = this._domImage.width + "px";
        this.height = this._domImage.height + "px";
    }

    public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        context.save();

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        let x, y, width, height;
        if (this.cellId == -1) {
            x = this._sourceLeft;
            y = this._sourceTop;

            width = this._sourceWidth ? this._sourceWidth : this._imageWidth;
            height = this._sourceHeight ? this._sourceHeight : this._imageHeight;
        }
        else {
            let rowCount = this._domImage.naturalWidth / this.cellWidth;
            let column = (this.cellId / rowCount) >> 0;
            let row = this.cellId % rowCount;

            x = this.cellWidth * row;
            y = this.cellHeight * column;
            width = this.cellWidth;
            height = this.cellHeight;
        }

        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
            if (this._loaded) {
                switch (this._stretch) {
                    case Image.STRETCH_NONE:
                        context.drawImage(this._domImage, x, y, width, height,
                            this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                        break;
                    case Image.STRETCH_FILL:
                        context.drawImage(this._domImage, x, y, width, height,
                            this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                        break;
                    case Image.STRETCH_UNIFORM:
                        var hRatio = this._currentMeasure.width / width;
                        var vRatio = this._currentMeasure.height / height;
                        var ratio = Math.min(hRatio, vRatio);
                        var centerX = (this._currentMeasure.width - width * ratio) / 2;
                        var centerY = (this._currentMeasure.height - height * ratio) / 2;

                        context.drawImage(this._domImage, x, y, width, height,
                            this._currentMeasure.left + centerX, this._currentMeasure.top + centerY, width * ratio, height * ratio);
                        break;
                    case Image.STRETCH_EXTEND:
                        context.drawImage(this._domImage, x, y, width, height,
                            this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                        if (this._autoScale) {
                            this.synchronizeSizeWithContent();
                        }
                        if (this._root && this._root.parent) { // Will update root size if root is not the top root
                            this._root.width = this.width;
                            this._root.height = this.height;
                        }
                        break;
                }
            }
        }
        context.restore();
    }

    public dispose() {
        super.dispose();
        this.onImageLoadedObservable.clear();
    }

    // Static
    /** STRETCH_NONE */
    public static readonly STRETCH_NONE = 0;
    /** STRETCH_FILL */
    public static readonly STRETCH_FILL = 1;
    /** STRETCH_UNIFORM */
    public static readonly STRETCH_UNIFORM = 2;
    /** STRETCH_EXTEND */
    public static readonly STRETCH_EXTEND = 3;
}