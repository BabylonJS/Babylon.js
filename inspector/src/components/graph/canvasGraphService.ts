import { ICanvasGraphServiceSettings, IPerfMinMax, IGraphDrawableArea } from "./graphSupportingTypes";
import { IPerfDataset, IPerfPoint } from "babylonjs/Misc/interfaces/iPerfViewer";

/**
 * This class acts as the main API for graphing given a Here is where you will find methods to let the service know new data needs to be drawn,
 * let it know something has been resized, etc! 
 */
export class CanvasGraphService {

    private _ctx: CanvasRenderingContext2D | null;
    private _width: number;
    private _height: number;
    public readonly datasets: IPerfDataset[];
    private _sizeOfWindow: number = 300;
    private _ticks: number[];

    /**
     * Creates an instance of CanvasGraphService.
     * 
     * @param canvas a pointer to the canvas dom element we would like to write to.
     * @param settings settings for our service.
     */
    constructor(canvas: HTMLCanvasElement, settings: ICanvasGraphServiceSettings) {
        this._ctx = canvas.getContext && canvas.getContext("2d");
        this._width = canvas.width;
        this._height = canvas.height;
        this.datasets = settings.datasets;
        this._ticks = [];
        this._attachEventListeners(canvas);
    }

    /**
     * This method draws the data and sets up the appropriate scales.
     */
    public draw() {
        const { _ctx: ctx } = this;

        if (!ctx) {
            return;
        }

        // First we clear the canvas so we can draw our data!
        this.clear();

        // Get global min max of time axis (across all datasets).
        let globalTimeMinMax = {min: Infinity, max: 0};

        // TODO: Make better sliding window code (accounting for zoom and pan).
        // Keep only visible and non empty datasets and get a certain window of items.
        const datasets = this.datasets.filter((dataset: IPerfDataset) => !dataset.hidden && dataset.data.length > 0).map((dataset: IPerfDataset) => ({
            ...dataset,
            data: dataset.data.slice(Math.max(dataset.data.length - this._sizeOfWindow, 0))
        }));

        datasets.forEach((dataset: IPerfDataset) => {
            const timeMinMax = this._getMinMax(dataset.data.map((point: IPerfPoint) => point.timestamp));            
            globalTimeMinMax.min = Math.min(timeMinMax.min, globalTimeMinMax.min);
            globalTimeMinMax.max = Math.max(timeMinMax.max, globalTimeMinMax.max);
        });

        const drawableArea: IGraphDrawableArea = {
            top: 0,
            left: 0,
            bottom: this._height,
            right: this._width,
        };

        this._drawTimeAxis(globalTimeMinMax, drawableArea);

        datasets.forEach((dataset: IPerfDataset) => {
            const valueMinMax = this._getMinMax(dataset.data.map((point: IPerfPoint) => point.value));
            const drawablePoints = dataset.data.map((point: IPerfPoint) => this._getPixelPointFromDataPoint(point, globalTimeMinMax, valueMinMax, drawableArea));

            let prevPoint: IPerfPoint = drawablePoints[0];
            ctx.beginPath();
            
            drawablePoints.forEach((point: IPerfPoint) => {
                ctx.moveTo(prevPoint.timestamp, prevPoint.value);
                ctx.lineTo(point.timestamp, point.value);
                prevPoint = point;
            });
            ctx.stroke();
        });
    }

    /**
     * Draws the time axis, adjusts the drawable area for the graph.
     * 
     * @param timeMinMax the minimum and maximum for the time axis. 
     * @param drawableArea the current allocated drawable area. 
     */
    private _drawTimeAxis(timeMinMax: IPerfMinMax, drawableArea: IGraphDrawableArea) {
        const { _ctx: ctx } = this;

        if (!ctx) {
            return;
        }
        const spaceAvailable = drawableArea.right - drawableArea.left;

        this._generateTicks(timeMinMax, spaceAvailable);

        const axisHeight = 100;

        // remove the height of the axis from the available drawable area.
        drawableArea.bottom -= axisHeight;

        // draw time axis line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(drawableArea.left, drawableArea.bottom);
        ctx.lineTo(drawableArea.right, drawableArea.bottom);
        
        // draw ticks and text.
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        this._ticks.forEach((tick: number) => {
            let position = this._getPixelForNumber(tick, timeMinMax, drawableArea.left, spaceAvailable, false);
            if (position > spaceAvailable) {
                position = spaceAvailable;
            }
            ctx.moveTo(position, drawableArea.bottom);
            ctx.lineTo(position, drawableArea.bottom + 10);
            ctx.fillText(tick.toString(), position, drawableArea.bottom + 20);
        });
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Generates a list of ticks given the min and max of the axis, and the space available in the axis.
     * 
     * @param minMax the minimum and maximum values of the axis
     * @param spaceAvailable the total amount of space we have allocated to our axis
     */
    private _generateTicks(minMax: IPerfMinMax, spaceAvailable: number) {
        const { min, max } = minMax;
        const minTickSpacing = 40; 

        this._ticks.length = 0;

        const maxTickCount = Math.ceil(spaceAvailable / minTickSpacing);
        const range = this._niceNumber(max - min, false);
        const spacing = this._niceNumber(range/(maxTickCount - 1), true);
        const niceMin = Math.floor(min/spacing) * spacing;
        const niceMax = Math.floor(max/spacing) * spacing;
        
        for (let i = niceMin; i <= niceMax + 0.5 * spacing; i += spacing) {
            this._ticks.push(i);
        }
    }

    /**
     * Nice number algorithm based on psueudo code defined in "Graphics Gems" by Andrew S. Glassner.
     * This will find a "nice" number approximately equal to num.
     * 
     * @param num The number we want to get close to.
     * @param shouldRound if true we will round the number, otherwise we will get the ceiling.
     * @returns a "nice" number approximately equal to num.
     */
    private _niceNumber(num: number, shouldRound: boolean) {
        const exp = Math.floor(Math.log10(num));
        const fraction = num / Math.pow(10, exp);
        let niceFraction: number;
        if (shouldRound) {
            if (fraction < 1.5) {
                niceFraction = 1;
            } else if (fraction < 3) {
                niceFraction = 2;
            } else if (fraction < 7) {
                niceFraction = 5;
            } else {
                niceFraction = 10;
            }
        } else {
            if (fraction <= 1) {
                niceFraction = 1;
            } else if (fraction <= 2) {
                niceFraction = 2;
            } else if (fraction <= 5) {
                niceFraction = 5;
            } else {
                niceFraction = 10;
            }
        }
    
        return niceFraction * Math.pow(10, exp);
    }

    /**
     * Gets the min and max as a single object from an array of numbers. 
     * 
     * @param items the array of numbers to get the min and max for.
     * @returns the min and max of the array.
     */
    private _getMinMax(items: number[]): IPerfMinMax {
        let min = Infinity, max = 0;

        for (const item of items) {
            if (item < min) {
                min = item;
            }

            if (item > max) {
                max = item;
            }
        }

        return {
            min,
            max
        }
    }
    
    /**
     * Converts a data point to a point on the canvas (a pixel coordinate).
     * 
     * @param point The datapoint
     * @param timeMinMax The minimum and maximum in the time axis.
     * @param valueMinMax The minimum and maximum in the value axis for the dataset.
     * @param drawableArea The allowed drawable area.
     * @returns 
     */
    private _getPixelPointFromDataPoint(point: IPerfPoint, timeMinMax: IPerfMinMax, valueMinMax: IPerfMinMax, drawableArea: IGraphDrawableArea): IPerfPoint {
        const {timestamp, value} = point;

        const {top, left, bottom, right} = drawableArea;
        

        return {
            timestamp: this._getPixelForNumber(timestamp, timeMinMax, left, right - left, false),
            value: this._getPixelForNumber(value, valueMinMax, top, bottom - top, true)
        };
    }
    
    /**
     * Converts a single number to a pixel coordinate in a single axis by normalizing the data to a [0, 1] scale using the minimum and maximum values.
     * 
     * @param num the number we want to get the pixel coordinate for
     * @param minMax the min and max of the dataset in the axis we want the pixel coordinate for.
     * @param startingPixel the starting pixel coordinate (this means it takes account for any offset).
     * @param spaceAvailable the total space available in this axis.
     * @param shouldFlipValue if we should use a [1, 0] scale instead of a [0, 1] scale.
     * @returns the pixel coordinate of the value in a single axis.
     */
    private _getPixelForNumber(num: number, minMax: IPerfMinMax, startingPixel: number, spaceAvailable: number, shouldFlipValue: boolean) {
        const {min, max} = minMax;
        // Perform a min-max normalization to rescale the value onto a [0, 1] scale given the min and max of the dataset.
        let normalizedValue = (num - min)/(max - min);

        // if we should make this a [1, 0] range instead (higher numbers = smaller pixel value)
        if (shouldFlipValue) {
            normalizedValue = 1 - normalizedValue;
        }

        return startingPixel + normalizedValue * spaceAvailable;
    }

    private _attachEventListeners(canvas: HTMLCanvasElement) {
        canvas.addEventListener("wheel", this._handleZoom.bind(this));
    }


    private _handleZoom(event: WheelEvent) {
        event.preventDefault();
        
        if (!event.deltaY) {
            return;
        }

        const amount = (event.deltaY * -0.01 | 0) * 100;
        this._sizeOfWindow = Math.max(this._sizeOfWindow - amount, 60);
        console.log(this._sizeOfWindow);
        return;
    }
    
    /**
     * This method clears the canvas
     */
    public clear() {
        const { _ctx: ctx, _width, _height } = this;

        // If we do not have a context we can't really do much here!
        if (!ctx) {
            return;
        }

        // save the transformation matrix, clear the canvas then restore.
        ctx.save();
        ctx.resetTransform();
        ctx.clearRect(0, 0, _width, _height);
        ctx.restore();
    }
}