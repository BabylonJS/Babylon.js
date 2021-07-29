import { ICanvasGraphServiceSettings, IPerfMinMax, IGraphDrawableArea, IPerfMousePanningPosition, IPerfIndexBounds, IPerfTooltip, IPerfTextMeasureCache, IPerfLayoutSize, IPerfTicker } from "./graphSupportingTypes";
import { IPerfDatasets, IPerfMetadata } from "babylonjs/Misc/interfaces/iPerfViewer";
import { Scalar } from "babylonjs/Maths/math.scalar";
import { PerformanceViewerCollector } from "babylonjs/Misc/PerformanceViewer/performanceViewerCollector";

const defaultColor = "#000";
const futureBoxColor = "#dfe9ed";
const dividerColor = "#0a3066";
const playheadColor = "#b9dbef";

const tooltipBackgroundColor = "#121212";
const tooltipForegroundColor = "#fff";

const defaultAlpha = 1;
const tooltipBackgroundAlpha = 0.8;

const tooltipHorizontalPadding = 10;
const spaceBetweenTextAndBox = 5;

const tickerHorizontalPadding = 10;

const playheadSize = 8;
const dividerSize = 2;

const axisLineLength = 10;
const axisPadding = 10;

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

// Arbitrary maximum used to make some GC optimizations.
const maximumDatasetsAllowed = 64;

// time in ms to wait between tooltip draws inside the mouse move.
const tooltipDebounceTime = 32;

// time in ms to wait between draws
const drawDebounceTime = 15;

/**
 * This function will debounce calls to functions.
 * 
 * @param callback callback to call.
 * @param time time to wait between calls in ms.
 */
function debounce(callback: (...args: any[]) => void, time: number) {
    let timerId: any;
    return function (...args: any[]) {
        clearTimeout(timerId);
        timerId = setTimeout(() => callback(...args), time);
    }
}

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
    private _position: number | null;
    private _datasetBounds: IPerfIndexBounds;
    private _globalTimeMinMax: IPerfMinMax;
    private _hoverPosition: number | null;
    private _drawableArea: IGraphDrawableArea;
    private _axisHeight: number;
    private _tooltipItems: IPerfTooltip[];
    private _tooltipTextCache: IPerfTextMeasureCache;
    private _tickerTextCache: IPerfTextMeasureCache;
    private _tickerItems: IPerfTicker[];

    private readonly _tooltipLineHeight: number;
    private readonly _defaultLineHeight: number;

    public readonly datasets: IPerfDatasets;
    public metadata: Map<string, IPerfMetadata>;

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
        this._position = null;
        this._datasetBounds = { start: 0, end: 0 };
        this._globalTimeMinMax = {min: Infinity, max: 0};
        this._drawableArea = {top: 0, left: 0, right: 0, bottom: 0};
        this._tooltipTextCache = {text: "", width: 0};
        this._tickerTextCache = {text: "", width: 0};
        this._tooltipItems = [];
        this._tickerItems = [];

        for (let i = 0; i < maximumDatasetsAllowed; i++) {
            this._tooltipItems.push({text: "", color: ""});
            this._tickerItems.push({text: "", id: "", max: 0, min: 0});
        }

        if (!this._ctx) {
            throw Error("No canvas context accessible");
        }

        const defaultMetrics = this._ctx.measureText(alphabet);
        this._defaultLineHeight = defaultMetrics.actualBoundingBoxAscent + defaultMetrics.actualBoundingBoxDescent;
        this._axisHeight = axisLineLength + axisPadding + this._defaultLineHeight + axisPadding;

        this._ctx.save();
        this._ctx.font = tooltipFont;
        const fontMetrics = this._ctx.measureText(alphabet);
        this._tooltipLineHeight = fontMetrics.actualBoundingBoxAscent + fontMetrics.actualBoundingBoxDescent;
        this._ctx.restore();

        this.datasets = settings.datasets;
        this.metadata = new Map<string, IPerfMetadata>();

        this._attachEventListeners(canvas);
    }

    /**
     * This method lets the service know it should get ready to update what it is displaying.
     */
    public update = debounce(
        () => this._draw(),
        drawDebounceTime
    );

    public resize(size: IPerfLayoutSize) {
        const { _ctx: ctx } = this;
        const { width, height } = size;

        if (!ctx || !ctx.canvas) {
            return;
        }

        this._width = width;
        this._height = height;

        ctx.canvas.width = width;
        ctx.canvas.height = height;

        this.update();
    }

    /**
     * This method draws the data and sets up the appropriate scales.
     */
    private _draw() {
        const { _ctx: ctx } = this;
        if (!ctx) {
            return;
        }

        const numSlices = this._getNumberOfSlices();

        if (numSlices === 0) {
            return;
        }

        // First we clear the canvas so we can draw our data!
        this.clear();

        // Get global min max of time axis (across all datasets).
        this._globalTimeMinMax.min = Infinity;
        this._globalTimeMinMax.max = 0;
            
        // First we must get the end positions of our view port.
        const pos = this._position ?? (numSlices - 1);
        let start = pos - Math.ceil(this._sizeOfWindow * scaleFactor);
        let startOverflow = 0;

        // account for overflow from start.
        if (start < 0) {
            startOverflow = 0 - start;
            start = 0;
        }

        let end = Math.ceil(pos + this._sizeOfWindow * (1 - scaleFactor) + startOverflow);

        // account for overflow from end.
        if (end > numSlices) {
            const endOverflow = end - numSlices;
            end = numSlices;

            start = Math.max(start - endOverflow, 0);
        }

        // update the bounds
        this._datasetBounds.start = start;
        this._datasetBounds.end = end;
        

        // next we must find the min and max timestamp in bounds. (Timestamps are sorted)
        this._globalTimeMinMax.min = this.datasets.data.at(this.datasets.startingIndices.at(this._datasetBounds.start));
        this._globalTimeMinMax.max = this.datasets.data.at(this.datasets.startingIndices.at(this._datasetBounds.end - 1));

        // set the buffer region maximum by rescaling the max timestamp in bounds.
        const bufferMaximum = Math.ceil((this._globalTimeMinMax.max - this._globalTimeMinMax.min) / scaleFactor + this._globalTimeMinMax.min);

        // we then need to update the end position based on the maximum for the buffer region
        // binary search to get closest point to the buffer maximum.
        this._datasetBounds.end = this._getClosestPointToTimestamp(bufferMaximum) + 1;

        // keep track of largest timestamp value in view!
        this._globalTimeMinMax.max = Math.max(this.datasets.data.at(this.datasets.startingIndices.at(this._datasetBounds.end - 1)), this._globalTimeMinMax.max);


        const updatedScaleFactor = Scalar.Clamp((this._globalTimeMinMax.max - this._globalTimeMinMax.min) / (bufferMaximum - this._globalTimeMinMax.min), scaleFactor, 1);

        // we will now set the global maximum to the maximum of the buffer.
        this._globalTimeMinMax.max = bufferMaximum;

        this._drawableArea.top = 0;
        this._drawableArea.left = 0;
        this._drawableArea.bottom = this._height;
        this._drawableArea.right = this._width;

        const numberOfTickers = this._drawTickers(this._drawableArea, this._datasetBounds);
        this._drawTimeAxis(this._globalTimeMinMax, this._drawableArea);
        this._drawPlayheadRegion(this._drawableArea, updatedScaleFactor);

        const {left, right, bottom, top} = this._drawableArea;
        // process, and then draw our points
        this.datasets.ids.forEach((id, idOffset) => {
            let valueMinMax: IPerfMinMax | undefined;

            // we have already calculated  the min and max while getting the tickers, so use those.
            for (let i = 0; i < numberOfTickers; i++) {
                if (this._tickerItems[i].id === id) {
                    valueMinMax = this._tickerItems[i];
                }
            }

            // if we could not find the min max object it must be hidden so we skip.
            if (!valueMinMax) {
                return;
            }

            ctx.beginPath();
            ctx.strokeStyle = this.metadata.get(id)?.color ?? defaultColor;
            let prevPoint: [number, number] | undefined;
            for (let pointIndex = this._datasetBounds.start; pointIndex < this._datasetBounds.end; pointIndex++) {
                const numPoints = this.datasets.data.at(this.datasets.startingIndices.at(pointIndex) + PerformanceViewerCollector.NumberOfPointsOffset);

                if (idOffset >= numPoints) {
                    continue;
                }
    
                const valueIndex = this.datasets.startingIndices.at(pointIndex) + PerformanceViewerCollector.SliceDataOffset + idOffset;
                const timestamp = this.datasets.data.at(this.datasets.startingIndices.at(pointIndex));
                const value = this.datasets.data.at(valueIndex);

                const drawableTime = this._getPixelForNumber(timestamp, this._globalTimeMinMax, left, right - left, false);
                const drawableValue = this._getPixelForNumber(value, valueMinMax, top, bottom - top, true);

                if (prevPoint === undefined) {
                    prevPoint = [drawableTime, drawableValue];
                }

                ctx.moveTo(prevPoint[0], prevPoint[1]);
                ctx.lineTo(drawableTime, drawableValue);
                prevPoint[0] = drawableTime;
                prevPoint[1] = drawableValue;
            }
            ctx.stroke();
        });

        // then draw the tooltip.
        this._drawTooltip(this._hoverPosition, this._drawableArea);
    }

    private _drawTickers(drawableArea: IGraphDrawableArea, bounds: IPerfIndexBounds): number {
        const {_ctx: ctx} = this;

        if (!ctx) {
            return 0;
        }

        // create the ticker objects for each of the non hidden items.
        let longestText: string = "";
        let numberOfTickers: number = 0;
        this.datasets.ids.forEach((id, idOffset) => {
            if (!!this.metadata.get(id)?.hidden) {
                return;
            }

            const valueMinMax = this._getMinMax(bounds, idOffset);
            const latestValue = this.datasets.data.at(this.datasets.startingIndices.at(bounds.end - 1) + PerformanceViewerCollector.SliceDataOffset + idOffset);
            const text = `${id}: ${latestValue.toFixed(2)} (max: ${valueMinMax.max.toFixed(2)}, min: ${valueMinMax.min.toFixed(2)})`
            if (text.length > longestText.length) {
                longestText = text;
            }
            this._tickerItems[numberOfTickers].id = id;
            this._tickerItems[numberOfTickers].max = valueMinMax.max;
            this._tickerItems[numberOfTickers].min = valueMinMax.min;
            this._tickerItems[numberOfTickers].text = text;
            numberOfTickers++;
        });

        ctx.save();        
        ctx.font = tooltipFont;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

        let width: number;
        // if the lengths are the same the estimate should be good enough given the padding.
        if (this._tickerTextCache.text.length === longestText.length) {
            width = this._tickerTextCache.width;
        } else {
            width = ctx.measureText(longestText).width + 2 * tickerHorizontalPadding;
            this._tickerTextCache.text = longestText;
            this._tickerTextCache.width = width;
        }
        
        drawableArea.right -= width;

        const textHeight = this._tooltipLineHeight + Math.floor(tooltipHorizontalPadding/2);

        const x = drawableArea.right + tickerHorizontalPadding;
        let y = drawableArea.top + textHeight;
        for (let i = 0; i < numberOfTickers; i++) {
            const tickerItem = this._tickerItems[i];
            ctx.fillText(tickerItem.text, x, y);
            y += textHeight;
        }
        ctx.restore();

        return numberOfTickers;
    }

    /**
     * Returns the index of the closest time for the datasets.
     * Uses a modified binary search to get value.
     * 
     * @param targetTime the time we want to get close to.
     * @returns index of the item with the closest time to the targetTime
     */
    private _getClosestPointToTimestamp(targetTime: number): number {
        let low = 0;
        let high = this._getNumberOfSlices() - 1;
        let closestIndex = 0;

        while (low <= high) {

            const middle = Math.trunc((low + high) / 2);
            const middleTimestamp = this.datasets.data.at(this.datasets.startingIndices.at(middle));

            if (Math.abs(middleTimestamp - targetTime) < Math.abs(this.datasets.data.at(this.datasets.startingIndices.at(closestIndex)) - targetTime)) {
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
     * This is a convenience method to get the number of collected slices.
     * @returns the total number of collected slices.
     */
    private _getNumberOfSlices() {
        return this.datasets.startingIndices.itemLength;
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

        // remove the height of the axis from the available drawable area.
        drawableArea.bottom -= this._axisHeight;

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
        const spacing = this._niceNumber(range / (maxTickCount - 1), true);
        const niceMin = Math.floor(min / spacing) * spacing;
        const niceMax = Math.floor(max / spacing) * spacing;

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
    private _getMinMax(bounds: IPerfIndexBounds, offset: number): IPerfMinMax {
        let min = Infinity, max = 0;

        for (let i = bounds.start; i < bounds.end; i++) {
            const numPoints = this.datasets.data.at(this.datasets.startingIndices.at(i) + PerformanceViewerCollector.NumberOfPointsOffset);
            
            if (offset >= numPoints) {
                continue;
            }

            const itemIndex = this.datasets.startingIndices.at(i) + PerformanceViewerCollector.SliceDataOffset + offset;
            const item = this.datasets.data.at(itemIndex);

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
        const { min, max } = minMax;
        // Perform a min-max normalization to rescale the value onto a [0, 1] scale given the min and max of the dataset.
        let normalizedValue = (num - min) / (max - min);

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

    /**
     * Handles what to do when we are hovering over the canvas and not panning.
     * 
     * @param event A reference to the event to be handled. 
     */
    private _handleDataHover = (event: MouseEvent) => {
        if (this._panPosition) {
            // we don't want to do anything if we are in the middle of panning
            return;
        }

        this._hoverPosition = event.clientX;

        // then draw the tooltip.
        this._debouncedTooltip(this._hoverPosition, this._drawableArea);
    }

    /**
     * Debounced version of _drawTooltip.
     */
    private _debouncedTooltip = debounce(
        (pixel: number | null, drawableArea: IGraphDrawableArea) => {
            this._drawTooltip(pixel, drawableArea)
        },
        tooltipDebounceTime
    )

    /**
     * Handles what to do when we stop hovering over the canvas.
     */
    private _handleStopHover = () => {
        this._hoverPosition = null;
    }

    /**
     * Draws the tooltip given the area it is allowed to draw in and the current pixel position.
     * 
     * @param pixel the position of the mouse cursor in pixels. 
     * @param drawableArea  the available area we can draw in.
     */
    private _drawTooltip(pixel: number | null, drawableArea: IGraphDrawableArea) {
        const { _ctx: ctx } = this;

        if (pixel === null || !ctx || !ctx.canvas || this._getNumberOfSlices() === 0) {
            return;
        }

        // first convert the mouse position in pixels to a timestamp.
        const { left: start, right: end } = ctx.canvas.getBoundingClientRect();
        const inferredTimestamp = this._getNumberFromPixel(pixel, this._globalTimeMinMax, start, end);

        let longestText: string = "";
        let numberOfTooltipItems = 0;

        // get the closest timestamps to the target timestamp, and store the appropriate meta object.
        const closestIndex = this._getClosestPointToTimestamp(inferredTimestamp);

        this.datasets.ids.forEach((id, idOffset) => {
            if (!!this.metadata.get(id)?.hidden) {
                return;
            }

            const numPoints = this.datasets.data.at(this.datasets.startingIndices.at(closestIndex) + PerformanceViewerCollector.NumberOfPointsOffset);
            
            if (idOffset >= numPoints) {
                return;
            }

            const valueIndex = this.datasets.startingIndices.at(closestIndex) + PerformanceViewerCollector.SliceDataOffset + idOffset;

            const text = `${id}: ${this.datasets.data.at(valueIndex).toFixed(2)}`;
            
            if (text.length > longestText.length) {
                longestText = text;
            }

            this._tooltipItems[numberOfTooltipItems].text = text;
            this._tooltipItems[numberOfTooltipItems].color = this.metadata.get(id)?.color ?? defaultColor;
            numberOfTooltipItems++;
        });

        let x = pixel - start;
        let y = Math.floor((drawableArea.bottom - drawableArea.top) / 2);

        ctx.save();

        ctx.font = tooltipFont;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

        const boxLength = this._tooltipLineHeight;
        const textHeight = this._tooltipLineHeight + Math.floor(tooltipHorizontalPadding / 2);

        // initialize width with cached value or measure width of longest text and update cache.
        let width: number;
        if (longestText === this._tooltipTextCache.text) {
            width = this._tooltipTextCache.width;
        } else {
            width = ctx.measureText(longestText).width + boxLength + 2 * tooltipHorizontalPadding + spaceBetweenTextAndBox;
            this._tooltipTextCache.text = longestText;
            this._tooltipTextCache.width = width;
        }

        // We want the tool tip to always be inside the canvas so we adjust which way it is drawn.
        if (x + width > this._width) {
            x -= width;
        }

        ctx.globalAlpha = tooltipBackgroundAlpha;
        ctx.fillStyle = tooltipBackgroundColor;

        ctx.fillRect(x, y, width, textHeight * (numberOfTooltipItems + 1));

        ctx.globalAlpha = defaultAlpha;

        x += tooltipHorizontalPadding;
        y += textHeight;

        for (let i = 0; i < numberOfTooltipItems; i++) {
            const tooltipItem = this._tooltipItems[i];

            ctx.fillStyle = tooltipItem.color;
            ctx.fillRect(x, y - Math.floor(boxLength / 2), boxLength, boxLength);
            ctx.fillStyle = tooltipForegroundColor;
            ctx.fillText(tooltipItem.text, x + boxLength + spaceBetweenTextAndBox, y);
            y += textHeight;
        }

        ctx.restore();
    }

    /**
     * Gets the number from a pixel position given the minimum and maximum value in range, and the starting pixel and the ending pixel.
     * 
     * @param pixel current pixel position we want to get the number for.
     * @param minMax the minimum and maximum number in the range.
     * @param startingPixel position of the starting pixel in range.
     * @param endingPixel position of ending pixel in range.
     * @returns number corresponding to pixel position
     */
    private _getNumberFromPixel(pixel: number, minMax: IPerfMinMax, startingPixel: number, endingPixel: number): number {
        // normalize pixel to range [0, 1].
        const normalizedPixelPosition = (pixel - startingPixel) / (endingPixel - startingPixel);

        return minMax.min + normalizedPixelPosition * (minMax.max - minMax.min);
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

        // The max zoom is the number of slices.      
        const maxZoom = this._getNumberOfSlices();

        if (this._shouldBecomeRealtime()) {
            this._position = null;
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
        const { _ctx: ctx } = this;
        if (!ctx || !ctx.canvas) {
            return;
        }
        const canvas = ctx.canvas;

        this._panPosition = {
            xPos: event.clientX,
            delta: 0,
        };
        this._hoverPosition = null;
        canvas.addEventListener("mousemove", this._handlePan)
    }

    /**
     * While panning this event will keep track of the delta and update the "positions".
     * 
     * @param event The mouse event that contains positional information.
     */
    private _handlePan = (event: MouseEvent) => {
        if (!this._panPosition || this._getNumberOfSlices() === 0) {
            return;
        }

        const pixelDelta = this._panPosition.delta + event.clientX - this._panPosition.xPos;
        const pixelsPerItem = (this._drawableArea.right - this._drawableArea.left) / this._sizeOfWindow;
        const itemsDelta = pixelDelta / pixelsPerItem | 0;
        const pos = this._position ?? (this._getNumberOfSlices() - 1)
        
        // update our position without allowing the user to pan more than they need to (approximation) 
        this._position = Scalar.Clamp(
                                        pos - itemsDelta, 
                                        Math.floor(this._sizeOfWindow * scaleFactor), 
                                        this._getNumberOfSlices() - Math.floor(this._sizeOfWindow * (1-scaleFactor))
                                    );


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
        const { _ctx: ctx } = this;
        if (!ctx || !ctx.canvas) {
            return;
        }

        // check if we should return to realtime.
        if (this._shouldBecomeRealtime()) {
            this._position = null;
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
        if (this._getNumberOfSlices() === 0) {
            return false;
        }

        // we need to compare our current slice to the latest slice to see if we should return to realtime mode.
        const pos = this._position;
        const latestSlicePos = this._getNumberOfSlices() - 1;

        if (pos === null) {
            return false;
        }

        // account for overflow on the left side only as it will be the one determining if we have sufficiently caught up to the realtime data.
        const overflow = Math.max(0 - (pos - Math.ceil(this._sizeOfWindow * scaleFactor)), 0);
        const rightmostPos = Math.min(overflow + pos + Math.ceil(this._sizeOfWindow * (1 - scaleFactor)), latestSlicePos);

        return this.datasets.data.at(this.datasets.startingIndices.at(rightmostPos))/this.datasets.data.at(this.datasets.startingIndices.at(latestSlicePos)) > returnToLiveThreshold;
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