import { ICanvasGraphServiceSettings, IMinMax, IDrawableArea } from "./graphSupportingTypes";
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

        // Get global min max of x axis (across all datasets).
        let globalMinMaxX = {min: Infinity, max: 0};

        // TODO: Make better sliding window code (accounting for zoom and pan).
        // Keep only visible and non empty datasets and get a certain window of items.
        const datasets = this.datasets.filter((dataset: IPerfDataset) => !dataset.hidden && dataset.data.length > 0).map((dataset: IPerfDataset) => ({
            ...dataset,
            data: dataset.data.slice(Math.max(dataset.data.length - 300, 0))
        }));

        datasets.forEach((dataset: IPerfDataset) => {
            const minMaxX = this._getMinMax(dataset.data.map((point: IPerfPoint) => point.x));            
            globalMinMaxX = {min: Math.min(minMaxX.min, globalMinMaxX.min), max: Math.max(minMaxX.max, globalMinMaxX.max)};
        });

        const drawableArea: IDrawableArea = {
            top: 0,
            left: 0,
            bottom: this._height,
            right: this._width,
        };

        this._drawXAxis(globalMinMaxX, drawableArea);

        datasets.forEach((dataset: IPerfDataset) => {
            const minMaxY = this._getMinMax(dataset.data.map((point: IPerfPoint) => point.y));
            const drawablePoints = dataset.data.map((point: IPerfPoint) => this._getPixelPointFromDataPoint(point, globalMinMaxX, minMaxY, drawableArea));

            let prevPoint: IPerfPoint = drawablePoints[0];
            ctx.beginPath();
            
            drawablePoints.forEach((point: IPerfPoint) => {
                ctx.moveTo(prevPoint.x, prevPoint.y);
                ctx.lineTo(point.x, point.y);
                prevPoint = point;
            });
            ctx.stroke();
        });
    }

    /**
     * Draws the x axis, adjusts the drawable area for the graph.
     * 
     * @param minMaxX the minimum and maximum for the x axis. 
     * @param drawableArea the current allocated drawable area. 
     */
    private _drawXAxis(minMaxX: IMinMax, drawableArea: IDrawableArea) {
        const { _ctx: ctx } = this;

        if (!ctx) {
            return;
        }
        const spaceAvailable = drawableArea.right - drawableArea.left;

        const ticks = this._getTicks(minMaxX, spaceAvailable);

        const axisHeight = 100;

        // remove the height of the axis from the available drawable area.
        drawableArea.bottom -= axisHeight;

        // draw x axis line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(drawableArea.left, drawableArea.bottom);
        ctx.lineTo(drawableArea.right, drawableArea.bottom);
        
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ticks.forEach((tick: number) => {
            let position = this._getPixelForNumber(tick, minMaxX, drawableArea.left, spaceAvailable, false);
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
     * Gets a list of ticks given the min and max of the axis, and the space available in the axis.
     * 
     * @param minMax the minimum and maximum values of the axis
     * @param spaceAvailable the total amount of space we have allocated to our axis
     * @returns a list of "nice" tickS.
     */
    private _getTicks(minMax: IMinMax, spaceAvailable: number): number[] {
        const { min, max } = minMax;
        const minTickSpacing = 40; 

        let ticks: number[] = [];

        const maxTickCount = Math.ceil(spaceAvailable / minTickSpacing);
        const range = this._niceNumber(max - min, false);
        const spacing = this._niceNumber(range/(maxTickCount - 1), true);
        const niceMin = Math.floor(min/spacing) * spacing;
        const niceMax = Math.floor(max/spacing) * spacing;
        
        for (let i = niceMin; i <= niceMax + 0.5 * spacing; i += spacing) {
            ticks.push(i);
        }

        return ticks;
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
     * @param values the array of numbers to get the min and max for.
     * @returns the min and max of the array.
     */
    private _getMinMax(values: number[]): IMinMax {
        let min = Infinity, max = 0;

        for (const val of values) {
            if (val < min) {
                min = val;
            }

            if (val > max) {
                max = val;
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
     * @param minMaxX The minimum and maximum in the x axis.
     * @param minMaxY The minimum and maximum in the y axis for the dataset.
     * @param drawableArea The allowed drawable area.
     * @returns 
     */
    private _getPixelPointFromDataPoint(point: IPerfPoint, minMaxX: IMinMax, minMaxY: IMinMax, drawableArea: IDrawableArea): IPerfPoint {
        const {x, y} = point;

        const {top, left, bottom, right} = drawableArea;
        

        return {
            x: this._getPixelForNumber(x, minMaxX, left, right - left, false),
            y: this._getPixelForNumber(y, minMaxY, top, bottom - top, true)
        };
    }
    
    /**
     * Converts a single number to a pixel coordinate in a single axis by normalizing the data to a [0, 1] scale using the minimum and maximum values.
     * 
     * @param value the number we want to get the pixel coordinate for
     * @param minMax the min and max of the dataset in the axis we want the pixel coordinate for.
     * @param startingPixel the starting pixel coordinate (this means it takes account for any offset).
     * @param spaceAvailable the total space available in this axis.
     * @param shouldFlipValue if we should use a [1, 0] scale instead of a [0, 1] scale.
     * @returns the pixel coordinate of the value in a single axis.
     */
    private _getPixelForNumber(value: number, minMax: IMinMax, startingPixel: number, spaceAvailable: number, shouldFlipValue: boolean) {
        const {min, max} = minMax;
        // Perform a min-max normalization to rescale the value onto a [0, 1] scale given the min and max of the dataset.
        let normalizedValue = (value - min)/(max - min);

        // if we should make this a [1, 0] range instead (higher numbers = smaller pixel value)
        if (shouldFlipValue) {
            normalizedValue = 1 - normalizedValue;
        }

        return startingPixel + normalizedValue * spaceAvailable;
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