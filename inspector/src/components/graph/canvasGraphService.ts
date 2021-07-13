import { ICanvasGraphServiceSettings, IPerfMinMax, IGraphDrawableArea, IPerfMousePanningPosition, IPerfIndexBounds } from "./graphSupportingTypes";
import { IPerfDataset, IPerfPoint } from "babylonjs/Misc/interfaces/iPerfViewer";
import { Scalar } from "babylonjs/Maths/math.scalar";

const defaultColor = "#000";
const futureBoxColor = "#dfe9ed";
const dividerColor = "#0a3066";
const playheadColor = "#b9dbef";

const playheadSize = 8;
const dividerSize = 2;

// Currently the scale factor is a constant but when we add panning this may become formula based.
const scaleFactor = 0.8;

// This controls the scale factor at which we stop drawing the playhead. Below this value there tends to be flickering of the playhead as data comes in.
const stopDrawingPlayheadThreshold = 0.95;

// Threshold for the ratio at which we go from panning mode to live mode.
const returnToLiveThreshold = 0.998;

// Font to use on the tooltip!
const tooltipFont = "12px Arial";

// A string containing the alphabet, used in line height calculation for the font.
const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";


/**
 * This class acts as the main API for graphing given a Here is where you will find methods to let the service know new data needs to be drawn,
 * let it know something has been resized, etc! 
 */
export class CanvasGraphService {
    private _ctx: CanvasRenderingContext2D | null;
    private _width: number;
    private _height: number;
    private _sizeOfWindow: number = 300;
    private _ticks: number[];
    private _panPosition: IPerfMousePanningPosition | null;
    private _positions: Map<string, number>;
    private _datasetBounds: Map<string, IPerfIndexBounds>;
    private _globalTimeMinMax: IPerfMinMax;
    private _hoverPosition: number | null;
    private _drawableArea: IGraphDrawableArea;
    
    private readonly _tooltipLineHeight;
    private readonly _defaultLineHeight;

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
        this._ticks = [];
        this._panPosition = null;
        this._hoverPosition = null;
        this._positions = new Map<string, number>();
        this._datasetBounds = new Map<string, IPerfIndexBounds>();
        this._globalTimeMinMax = {min: Infinity, max: 0};
        this._drawableArea = {top: 0, left: 0, right: 0, bottom: 0};

        if (this._ctx) {
            const defaultMetrics = this._ctx.measureText(alphabet);
            this._defaultLineHeight = defaultMetrics.actualBoundingBoxAscent + defaultMetrics.actualBoundingBoxDescent;

            this._ctx.save();
            this._ctx.font = tooltipFont;
            const fontMetrics = this._ctx.measureText(alphabet);
            this._tooltipLineHeight = fontMetrics.actualBoundingBoxAscent + fontMetrics.actualBoundingBoxDescent;
            this._ctx.restore();
        } else {
            this._tooltipLineHeight = 1;
            this._defaultLineHeight = 1;
        }

        this.datasets = settings.datasets;

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
        this._globalTimeMinMax.min = Infinity;
        this._globalTimeMinMax.max = 0;

        // First we must get the end positions of each dataset.
        this.datasets.forEach((dataset: IPerfDataset) => {
            // skip hidden and empty datasets!
            if (dataset.data.length === 0 || !!dataset.hidden) {
                return;
            }
            
            const pos = this._positions.get(dataset.id) ?? dataset.data.length - 1;
            let start = pos - Math.ceil(this._sizeOfWindow * scaleFactor);
            let startOverflow = 0;
            
            // account for overflow from start.
            if (start < 0) {
                startOverflow = 0 - start;
                start = 0; 
            }

            let end = Math.ceil(pos + this._sizeOfWindow * (1-scaleFactor) + startOverflow);
            
            // account for overflow from end.
            if (end > dataset.data.length) {
                const endOverflow = end - dataset.data.length;
                end = dataset.data.length;

                start = Math.max(start - endOverflow, 0);
            }

            const bounds = this._datasetBounds.get(dataset.id);

            // update or set the bounds
            if (bounds) {
                bounds.start = start;
                bounds.end = end;
            } else {
                this._datasetBounds.set(dataset.id, {start, end});
            }
        });

        // next we must find the min and max timestamp in bounds. (Timestamps are sorted)
        this.datasets.forEach((dataset: IPerfDataset) => {
            const bounds = this._datasetBounds.get(dataset.id);
            
            // handles cases we skip!
            if (!bounds || dataset.data.length === 0 || !!dataset.hidden) {
                return;
            }
            
            this._globalTimeMinMax.min = Math.min(dataset.data[bounds.start].timestamp, this._globalTimeMinMax.min);
            this._globalTimeMinMax.max = Math.max(dataset.data[bounds.end - 1].timestamp, this._globalTimeMinMax.max);
        });

        // set the buffer region maximum by rescaling the max timestamp in bounds.
        const bufferMaximum = Math.ceil((this._globalTimeMinMax.max - this._globalTimeMinMax.min)/scaleFactor + this._globalTimeMinMax.min);
        
        // we then need to update the end position based on the maximum for the buffer region
        this.datasets.forEach((dataset: IPerfDataset) => {
            const bounds = this._datasetBounds.get(dataset.id);
            
            // handles cases we skip!
            if (!bounds || dataset.data.length === 0 || !!dataset.hidden) {
                return;
            }

            // binary search to get closest point to the buffer maximum.
            bounds.end = this._getClosestPointToTimestamp(dataset, bufferMaximum) + 1;

            // keep track of largest timestamp value in view!
            this._globalTimeMinMax.max = Math.max(dataset.data[bounds.end - 1].timestamp, this._globalTimeMinMax.max);
        });

        let updatedScaleFactor = Scalar.Clamp((this._globalTimeMinMax.max - this._globalTimeMinMax.min)/(bufferMaximum - this._globalTimeMinMax.min), 0.8, 1); 

        // we will now set the global maximum to the maximum of the buffer.
        this._globalTimeMinMax.max = bufferMaximum;


        // TODO: Perhaps see if i can reduce the number of allocations.
        // Keep only visible and non empty datasets and get a certain window of items.
        const datasets = this.datasets.map((dataset: IPerfDataset) => {
            const bounds = this._datasetBounds.get(dataset.id);

            // handles cases we skip!
            if (!bounds || dataset.data.length === 0 || !!dataset.hidden) {
                return dataset;
            }

            return {
                ...dataset,
                data: dataset.data.slice(bounds.start, bounds.end)
            }
        }).filter((dataset: IPerfDataset) => !dataset.hidden && dataset.data.length > 0);

        this._drawableArea.top = 0;
        this._drawableArea.left = 0;
        this._drawableArea.bottom = this._height;
        this._drawableArea.right = this._width;

        this._drawTimeAxis(this._globalTimeMinMax, this._drawableArea);
        this._drawPlayheadRegion(this._drawableArea, updatedScaleFactor);

        // process, and then draw our points
        datasets.forEach((dataset: IPerfDataset) => {
            const valueMinMax = this._getMinMax(dataset.data.map((point: IPerfPoint) => point.value));
            const drawablePoints = dataset.data.map((point: IPerfPoint) => this._getPixelPointFromDataPoint(point, this._globalTimeMinMax, valueMinMax, this._drawableArea));

            let prevPoint: IPerfPoint = drawablePoints[0];
            ctx.beginPath();
            ctx.strokeStyle = dataset.color ?? defaultColor;
            drawablePoints.forEach((point: IPerfPoint) => {
                ctx.moveTo(prevPoint.timestamp, prevPoint.value);
                ctx.lineTo(point.timestamp, point.value);
                prevPoint = point;
            });
            ctx.stroke();
        });

        // then draw the tooltip.
        this._drawTooltip(this._hoverPosition, this._drawableArea);
    }

    /**
     * Returns the index of the closest time for a dataset.
     * Uses a modified binary search to get value.
     * 
     * @param dataset the dataset we want to search in.
     * @param targetTime the time we want to get close to.
     * @returns index of the item with the closest time to the targetTime
     */
    private _getClosestPointToTimestamp(dataset: IPerfDataset, targetTime: number): number {
        let low = 0;
        let high = dataset.data.length - 1;
        let closestIndex = 0;

        while (low <= high) {
            
            const middle = Math.trunc((low + high) / 2);
            const middleTimestamp = dataset.data[middle].timestamp;

            if (Math.abs(middleTimestamp - targetTime) < Math.abs(dataset.data[closestIndex].timestamp - targetTime)) {
                closestIndex = middle;
            } 

            if (middleTimestamp < targetTime) {
                low = middle + 1;
            } else if (middleTimestamp > targetTime) {
                high = middle - 1;
            } else {
                break;
            }
        }

        return closestIndex;
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

        const axisHeight = this._defaultLineHeight + 30;

        // remove the height of the axis from the available drawable area.
        drawableArea.bottom -= axisHeight;

        // draw time axis line
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = defaultColor;
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

    /**
     * Add in any necessary event listeners.
     * 
     * @param canvas The canvas we want to attach listeners to.
     */
    private _attachEventListeners(canvas: HTMLCanvasElement) {
        canvas.addEventListener("wheel", this._handleZoom);
        canvas.addEventListener("mousemove", this._handleDataHover);
        canvas.addEventListener("mousedown", this._handlePanStart);
        canvas.addEventListener("mouseleave", this._handleStopHover);
        // The user may stop panning outside of the canvas size so we should add the event listener to the document.
        canvas.ownerDocument.addEventListener("mouseup", this._handlePanStop);
    }

    /**
     * We remove all event listeners we added.
     * 
     * @param canvas The canvas we want to remove listeners from.
     */
    private _removeEventListeners(canvas: HTMLCanvasElement) {
        canvas.removeEventListener("wheel", this._handleZoom);
        canvas.removeEventListener("mousemove", this._handleDataHover);
        canvas.removeEventListener("mousedown", this._handlePanStart);
        canvas.removeEventListener("mouseleave", this._handleStopHover);
        canvas.ownerDocument.removeEventListener("mouseup", this._handlePanStop);
    }
    
    private _handleDataHover = (event: MouseEvent) => {
        if (this._panPosition) {
            // we don't want to do anything if we are in the middle of panning
            return;
        }

        this._hoverPosition = event.clientX;

        // then draw the tooltip.
        this._drawTooltip(this._hoverPosition, this._drawableArea);
    }

    private _handleStopHover = () => {
        this._hoverPosition = null;
    }

    private _drawTooltip(pixel: number | null, drawableArea: IGraphDrawableArea) {
        const {_ctx : ctx} = this;

        if (pixel === null || !ctx || !ctx.canvas) {            
            return;
        }

        // first convert the mouse position in pixels to a timestamp.
        const {min, max} = this._globalTimeMinMax;
        const {left: start, right: end} = ctx.canvas.getBoundingClientRect();
        const inferredTimestamp = min + this._getValueFromPixel(pixel, start, end) * (max - min);
        
        const results: {text: string, color: string}[] = [];

        // get the closest timestamps to the target timestamp, and store the appropriate meta object.
        this.datasets.forEach((dataset: IPerfDataset) => {
            if (!!dataset.hidden || dataset.data.length === 0) {
                return;
            }

            const closestIndex = this._getClosestPointToTimestamp(dataset, inferredTimestamp);
            
            results.push({
                            text: `${dataset.id}: ${dataset.data[closestIndex].value.toFixed(2)}`,
                            color: dataset.color ?? defaultColor,
                        });
        });

        const longestText = results.reduce((longestSoFar: string, result) => {
            if (longestSoFar.length < result.text.length) {
                return result.text;
            } else {
                return longestSoFar;
            }
        }, "");

        let x = pixel - start;
        let y = Math.floor((drawableArea.bottom - drawableArea.top)/2);

        ctx.save();
        ctx.font = "12px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        const textHeight = this._tooltipLineHeight + 5;
        const width = ctx.measureText(longestText).width + 15;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#121212";
        ctx.fillRect(x, y, width, textHeight * (results.length + 1));
        ctx.globalAlpha = 1;
        x += 5;
        y += textHeight;
        results.forEach((result) => {
            ctx.fillStyle = result.color;
            ctx.fillRect(x, y, 5, 5);
            ctx.fillStyle = "#fff";
            ctx.fillText(result.text, x + 7, y);
            y += textHeight;
        });
        ctx.restore();
    }

    private _getValueFromPixel(pixel: number, start: number, end: number): number {
        return (pixel - start)/(end - start);
    }

    /**
     * The handler for when we want to zoom in and out of the graph.
     * 
     * @param event a mouse wheel event.
     */
    private _handleZoom = (event: WheelEvent) => {
        event.preventDefault();
        
        if (!event.deltaY) {
            return;
        }

        const amount = (event.deltaY * -0.01 | 0) * 100;
        const minZoom = 60;

        // The max zoom is the largest dataset's length.      
        const maxZoom = this.datasets.map((dataset: IPerfDataset) => dataset.data.length)
                        .reduce((maxLengthSoFar: number, currLength: number) => {
                            return Math.max(currLength, maxLengthSoFar)
                        }, 0);

        if (this._shouldBecomeRealtime()) {
            this._positions.clear();
        }
        // Bind the zoom between [minZoom, maxZoom]
        this._sizeOfWindow = Scalar.Clamp(this._sizeOfWindow - amount, minZoom, maxZoom);
    }

    /**
     * Initializes the panning object and attaches appropriate listener.
     * 
     * @param event the mouse event containing positional information.
     */
    private _handlePanStart = (event: MouseEvent) => {
        const {_ctx: ctx} = this;
        if (!ctx || !ctx.canvas) {
            return;
        }
        const canvas = ctx.canvas;

        this._panPosition = {
            xPos: event.clientX,
            delta: 0,
        };
        canvas.addEventListener("mousemove", this._handlePan)
    }

    /**
     * While panning this event will keep track of the delta and update the "positions".
     * 
     * @param event The mouse event that contains positional information.
     */
    private _handlePan = (event: MouseEvent) => {
        if (!this._panPosition) {
            return;
        }

        const pixelDelta = this._panPosition.delta + event.clientX - this._panPosition.xPos;
        const pixelsPerItem = this._width / this._sizeOfWindow;
        const itemsDelta = pixelDelta / pixelsPerItem | 0;

        this.datasets.forEach((dataset: IPerfDataset) => {
            if (dataset.data.length === 0 || !!dataset.hidden) {
                return;
            }

            const { id } = dataset;
            const pos = this._positions.get(id) ?? (dataset.data.length - 1)
            
            // update our position without allowing the user to pan more than they need to (approximation) 
            this._positions.set(
                                id, 
                                Scalar.Clamp(
                                                pos - itemsDelta, 
                                                Math.floor(this._sizeOfWindow * scaleFactor), 
                                                dataset.data.length - Math.floor(this._sizeOfWindow * (1-scaleFactor))
                                            )
                                );
        });

        if (itemsDelta === 0) {
            this._panPosition.delta += pixelDelta;
        } else {
            this._panPosition.delta = 0;
        }

        this._panPosition.xPos = event.clientX;

    }

    /**
     * Clears the panning object and removes the appropriate listener.
     * 
     * @param event the mouse event containing positional information.
     */
    private _handlePanStop = () => {
        const {_ctx: ctx} = this;
        if (!ctx || !ctx.canvas) {
            return;
        }

        // check if we should return to realtime.
        if (this._shouldBecomeRealtime()) {
            this._positions.clear();
        }

        const canvas = ctx.canvas;
        canvas.removeEventListener("mousemove", this._handlePan);
        this._panPosition = null;
    }

    /**
     * Method which returns true if the data should become realtime, false otherwise.
     * 
     * @returns if the data should become realtime or not.
     */
    private _shouldBecomeRealtime(): boolean {
        if (this.datasets.length === 0) {
            return false;
        }

        // We first get the latest dataset, because this is where the real time data is!
        let latestDataset: IPerfDataset = this.datasets[0];
        
        this.datasets.forEach((dataset: IPerfDataset) => {
            // skip over empty and hidden data!
            if (dataset.data.length === 0 || !!dataset.hidden) {
                return;
            }
            if (latestDataset.data[latestDataset.data.length - 1].timestamp < dataset.data[dataset.data.length - 1].timestamp) {
                latestDataset = dataset;
            }
        });

        const pos = this._positions.get(latestDataset.id);
        const latestElementPos = latestDataset.data.length - 1;

        if (pos ===  undefined) {
            return false;
        }

        // account for overflow on the left side only as it will be the one determining if we have sufficiently caught up to the realtime data.
        const overflow = Math.max(0 - (pos - Math.ceil(this._sizeOfWindow * scaleFactor)), 0);
        const rightmostPos = Math.min(overflow + pos + Math.ceil(this._sizeOfWindow * (1 - scaleFactor)), latestElementPos);

        return latestDataset.data[rightmostPos].timestamp/latestDataset.data[latestElementPos].timestamp > returnToLiveThreshold;
    }

    /**
     * Will generate a playhead with a futurebox that takes up (1-scalefactor)*100% of the canvas.
     * 
     * @param drawableArea The remaining drawable area.
     * @param scaleFactor The Percentage between 0.0 and 1.0 of the canvas the data gets drawn on.  
     */
    private _drawPlayheadRegion(drawableArea: IGraphDrawableArea, scaleFactor: number) {
        const { _ctx: ctx } = this;
       
        if (!ctx || scaleFactor >= stopDrawingPlayheadThreshold) {
            return;
        }

        const dividerXPos = Math.ceil(drawableArea.right * scaleFactor);
        const playheadPos = dividerXPos - playheadSize; 
        const futureBoxPos = dividerXPos + dividerSize;

        const rectangleHeight = drawableArea.bottom - drawableArea.top - 1;

        ctx.save();
        
        ctx.fillStyle = futureBoxColor;
        ctx.fillRect(futureBoxPos, drawableArea.top, drawableArea.right - futureBoxPos, rectangleHeight);
        
        ctx.fillStyle = dividerColor;
        ctx.fillRect(dividerXPos, drawableArea.top, dividerSize, rectangleHeight);
        
        ctx.fillStyle = playheadColor;
        ctx.fillRect(playheadPos, drawableArea.top, playheadSize, rectangleHeight);
        
        ctx.restore();
    }

    /**
     *  Method to do cleanup when the object is done being used.
     *
     */
    public destroy() {
        if (!this._ctx || !this._ctx.canvas) {
            return;
        }

        this._removeEventListeners(this._ctx.canvas);
        this._ctx = null;
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