import { Control } from "./control";
import { Nullable, Tools, Observable, Engine } from "babylonjs";
import { Measure } from "2D";

/**
 * Class used to create 2D images
 */
export class Image extends Control {
    private static _WorkingCanvas: Nullable<HTMLCanvasElement> = null;

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

    private _useNinePatch = false;
    private _populateNinePatchSlicesFromImage = false;
    private _sliceLeft: number;
    private _sliceRight: number;
    private _sliceTop: number;
    private _sliceBottom: number;

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
     * Gets or sets a boolean indicating if nine patch should be used
     */
    public get useNinePatch(): boolean {
        return this._useNinePatch;
    }

    public set useNinePatch(value: boolean) {
        if (this._useNinePatch === value) {
            return;
        }

        this._useNinePatch = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets a boolean indicating if nine patch slices (left, top, right, bottom) should be read from image data
     */
    public get populateNinePatchSlicesFromImage(): boolean {
        return this._populateNinePatchSlicesFromImage;
    }

    public set populateNinePatchSlicesFromImage(value: boolean) {
        if (this._populateNinePatchSlicesFromImage === value) {
            return;
        }

        this._populateNinePatchSlicesFromImage = value;


        if (this._populateNinePatchSlicesFromImage && this._loaded) {
            this._extractNinePatchSliceDataFromImage();
        }
    }

    /**
     * Gets or sets the left value for slicing (9-patch)
     */
    public get sliceLeft(): number {
        return this._sliceLeft;
    }

    public set sliceLeft(value: number) {
        if (this._sliceLeft === value) {
            return;
        }

        this._sliceLeft = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets the right value for slicing (9-patch)
     */
    public get sliceRight(): number {
        return this._sliceRight;
    }

    public set sliceRight(value: number) {
        if (this._sliceRight === value) {
            return;
        }

        this._sliceRight = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets the top value for slicing (9-patch)
     */
    public get sliceTop(): number {
        return this._sliceTop;
    }

    public set sliceTop(value: number) {
        if (this._sliceTop === value) {
            return;
        }

        this._sliceTop = value;

        this._markAsDirty();
    }

    /**
     * Gets or sets the bottom value for slicing (9-patch)
     */
    public get sliceBottom(): number {
        return this._sliceBottom;
    }

    public set sliceBottom(value: number) {
        if (this._sliceBottom === value) {
            return;
        }

        this._sliceBottom = value;

        this._markAsDirty();
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

        if (this._populateNinePatchSlicesFromImage) {
            this._extractNinePatchSliceDataFromImage();
        }

        if (this._autoScale) {
            this.synchronizeSizeWithContent();
        }

        this.onImageLoadedObservable.notifyObservers(this);

        this._markAsDirty();
    }

    private _extractNinePatchSliceDataFromImage() {
        if (!Image._WorkingCanvas) {
            Image._WorkingCanvas = document.createElement('canvas');
        }
        const canvas = Image._WorkingCanvas;
        const context = canvas.getContext('2d')!;
        canvas.width = this._domImage.width;
        canvas.height = this._domImage.height;

        context.drawImage(this._domImage, 0, 0, this._domImage.width, this._domImage.height);
        const data = context.getImageData(0, 0, this._domImage.width, this._domImage.height);
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

    protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        if (this._loaded) {
            switch (this._stretch) {
                case Image.STRETCH_NONE:
                    break;
                case Image.STRETCH_FILL:
                    break;
                case Image.STRETCH_UNIFORM:
                    break;
                case Image.STRETCH_EXTEND:
                    if (this._autoScale) {
                        this.synchronizeSizeWithContent();
                    }
                    if (this.parent && this.parent.parent) { // Will update root size if root is not the top root
                        this.parent.adaptWidthToChildren = true;
                        this.parent.adaptHeightToChildren = true;
                    }
                    break;
            }
        }

        super._processMeasures(parentMeasure, context);
    }

    public _draw(context: CanvasRenderingContext2D): void {
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
                    break;
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