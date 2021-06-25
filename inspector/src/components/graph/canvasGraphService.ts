import { ICanvasGraphServiceSettings, IPerfDataset } from "./graphSupportingTypes";

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

        // TODO: Draw each dataset
        this.datasets.forEach((dataset: IPerfDataset) => {
            // do drawing
        });

        // TODO: Remove this code after dataset drawing is implemented.
        ctx.beginPath();
        ctx.moveTo(100, 100);
        ctx.lineTo(200, 0);
        ctx.stroke();
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