import { ICanvasGraphServiceSettings, IMinMax } from "./graphSupportingTypes";
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

        // Get global min max (across all datasets).
        let globalMinMaxX = {min: Infinity, max: 0};
        let globalMinMaxY = {min: Infinity, max: 0};

        this.datasets.forEach((dataset: IPerfDataset) => {
            const minMaxX = this._getMinMax(dataset.data.map((point: IPoint) => point.x));
            const minMaxY = this._getMinMax(dataset.data.map((point: IPoint) => point.y));
            
            globalMinMaxX = {min: Math.min(minMaxX.min, globalMinMaxX.min), max: Math.max(minMaxX.max, globalMinMaxX.max)};
            globalMinMaxY = {min: Math.min(minMaxY.min, globalMinMaxY.min), max: Math.max(minMaxY.max, globalMinMaxY.max)};
        });

        // TODO: Draw axis, and get area we can draw in.
        this._drawAxis(globalMinMaxX, globalMinMaxY);

        // TODO: Draw each dataset
        this.datasets.forEach((dataset: IPerfDataset) => {
            // ignore hidden data!
            if (!!dataset.hidden) {
                return;
            }

            const drawablePoints = dataset.data.map((point: IPoint) => this._getPixelPointFromDataPoint(point, globalMinMaxX, globalMinMaxY));
            let prevPoint: IPoint = {x: 0, y: 0};
            ctx.beginPath();
            
            drawablePoints.forEach((point: IPoint) => {
                ctx.moveTo(prevPoint.x, prevPoint.y);
                ctx.lineTo(point.x, point.y);
                prevPoint = point;
            });
            ctx.stroke();
        });
    }

    
    private _drawAxis(minMaxX: IMinMax, minMaxY: IMinMax) {

    }

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
    
    private _getPixelPointFromDataPoint(point: IPoint, minMaxX: IMinMax, minMaxY: IMinMax): IPoint {
        const {x, y} = point;
        const {min: minX, max: maxX} = minMaxX;
        const {min: minY, max: maxY} = minMaxY;
        // When we begin drawing the y-axis left may become non 0 and bottom will need to be modified to not include the x axis area, or perhaps the height will need to be modified.
        const top = 0;
        const left = 0;
        const bottom = top + this._height;
        const right = left + this._width;
        
        // Perform a min-max normalization to rescale the x and y values onto a [0, 1] scale.
        const normalizedX = (x-minX)/(maxX - minX);
        const normalizedY = (y-minY)/(maxY - minY);
        

        // multiply the normalized value with the length of available space
        return {
            x: left + normalizedX * (right - left),
            y: top + (1 - normalizedY) * (bottom - top)
        };
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