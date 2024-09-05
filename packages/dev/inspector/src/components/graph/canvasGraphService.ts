import type {
    ICanvasGraphServiceSettings,
    IPerfMinMax,
    IGraphDrawableArea,
    IPerfMousePanningPosition,
    IPerfIndexBounds,
    IPerfTooltip,
    IPerfTextMeasureCache,
    IPerfLayoutSize,
    IPerfTicker,
    ITooltipPreprocessedInformation,
    IPerfTooltipHoverPosition,
    IVisibleRangeChangedObservableProps,
} from "./graphSupportingTypes";
import { TimestampUnit } from "./graphSupportingTypes";
import type { IPerfDatasets, IPerfMetadata } from "core/Misc/interfaces/iPerfViewer";
import { Scalar } from "core/Maths/math.scalar";
import { PerformanceViewerCollector } from "core/Misc/PerformanceViewer/performanceViewerCollector";
import type { Observable } from "core/Misc/observable";

const defaultColor = "#000";
const axisColor = "#c0c4c8";
const futureBoxColor = "#dfe9ed";
const dividerColor = "#0a3066";
const playheadColor = "#b9dbef";

const positionIndicatorColor = "#4d5960";
const tooltipBackgroundColor = "#566268";
const tooltipForegroundColor = "#fbfbfb";

const topOfGraphY = 0;

const defaultAlpha = 1;
const tooltipBackgroundAlpha = 0.8;
const backgroundLineAlpha = 0.2;

const maxDistanceForHover = 10;

const tooltipHorizontalPadding = 10;
const spaceBetweenTextAndBox = 5;
const tooltipPaddingFromBottom = 20;

// height of indicator triangle
const triangleHeight = 10;
// width of indicator triangle
const triangleWidth = 20;
// padding to indicate how far below the axis line the triangle should be.
const trianglePaddingFromAxisLine = 3;

const tickerHorizontalPadding = 10;

// pixels to pad the top and bottom of data so that it doesn't get cut off by the margins.
const dataPadding = 2;

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

// Font to use on the addons such as tooltips and tickers!
const graphAddonFont = "12px Arial";

// A string containing the alphabet, used in line height calculation for the font.
const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Arbitrary maximum used to make some GC optimizations.
const maximumDatasetsAllowed = 64;

const msInSecond = 1000;
const msInMinute = msInSecond * 60;
const msInHour = msInMinute * 60;

// time in ms to wait between tooltip draws inside the mouse move.
const tooltipDebounceTime = 32;

// time in ms to wait between draws
const drawThrottleTime = 15;

// What distance percentage in the x axis between two points makes us break the line and draw a "no data" box instead
const maxXDistancePercBetweenLinePoints = 0.1;

// Color used to draw the rectangle that indicates no collection of data
const noDataRectangleColor = "#aaaaaa";

const smoothingFactor = 0.2; // factor to smooth the graph with
const rangeMargin = 0.1; // extra margin to expand the min/max range on the graph

/**
 * This function will debounce calls to functions.
 *
 * @param callback callback to call.
 * @param time time to wait between calls in ms.
 * @returns a function that will call the callback after the time has passed.
 */
function debounce(callback: (...args: any[]) => void, time: number) {
    let timerId: any;
    return function (...args: any[]) {
        clearTimeout(timerId);
        timerId = setTimeout(() => callback(...args), time);
    };
}

/**
 * This function will throttle calls to functions.
 *
 * @param callback callback to call.
 * @param time time to wait between calls in ms.
 * @returns a function that will call the callback after the time has passed.
 */
function throttle(callback: (...args: any[]) => void, time: number) {
    let lastCalledTime: number = 0;
    return function (...args: any[]) {
        const now = Date.now();
        if (now - lastCalledTime < time) {
            return;
        }
        lastCalledTime = now;
        callback(...args);
    };
}

/*
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
    private _hoverPosition: IPerfTooltipHoverPosition | null;
    private _drawableArea: IGraphDrawableArea;
    private _axisHeight: number;
    private _tooltipItems: IPerfTooltip[];
    private _tooltipTextCache: IPerfTextMeasureCache;
    private _tickerTextCache: IPerfTextMeasureCache;
    private _tickerItems: IPerfTicker[];
    private _preprocessedTooltipInfo: ITooltipPreprocessedInformation;
    private _numberOfTickers: number;
    private _onVisibleRangeChangedObservable?: Observable<IVisibleRangeChangedObservableProps>;

    private readonly _addonFontLineHeight: number;
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
        this._globalTimeMinMax = { min: Infinity, max: 0 };
        this._drawableArea = { top: 0, left: 0, right: 0, bottom: 0 };
        this._tooltipTextCache = { text: "", width: 0 };
        this._tickerTextCache = { text: "", width: 0 };
        this._tooltipItems = [];
        this._tickerItems = [];
        this._preprocessedTooltipInfo = { focusedId: "", longestText: "", numberOfTooltipItems: 0, xForActualTimestamp: 0 };
        this._numberOfTickers = 0;
        this._onVisibleRangeChangedObservable = settings.onVisibleRangeChangedObservable;

        for (let i = 0; i < maximumDatasetsAllowed; i++) {
            this._tooltipItems.push({ text: "", color: "" });
            this._tickerItems.push({ text: "", id: "", max: 0, min: 0 });
        }

        if (!this._ctx) {
            throw Error("No canvas context accessible");
        }

        const defaultMetrics = this._ctx.measureText(alphabet);
        this._defaultLineHeight = defaultMetrics.actualBoundingBoxAscent + defaultMetrics.actualBoundingBoxDescent;
        this._axisHeight = axisLineLength + axisPadding + this._defaultLineHeight + axisPadding;

        this._ctx.save();
        this._ctx.font = graphAddonFont;
        const fontMetrics = this._ctx.measureText(alphabet);
        this._addonFontLineHeight = fontMetrics.actualBoundingBoxAscent + fontMetrics.actualBoundingBoxDescent;
        this._ctx.restore();

        this.datasets = settings.datasets;
        this.metadata = new Map<string, IPerfMetadata>();

        this._attachEventListeners(canvas);
    }

    /**
     * This method lets the service know it should get ready to update what it is displaying.
     */
    public update = throttle(() => this._draw(), drawThrottleTime);

    /**
     * Update the canvas graph service with the new height and width of the canvas.
     * @param size The new size of the canvas.
     */
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
     * Force resets the position in the data, effectively returning to the most current data.
     */
    public resetDataPosition() {
        this._position = null;
    }

    private _prevPointById: Map<string, [number, number]> = new Map<string, [number, number]>();
    private _prevValueById: Map<string, number> = new Map<string, number>();

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
        const pos = this._position ?? numSlices - 1;
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

        this._drawTickers(this._drawableArea, this._datasetBounds);
        this._drawTimeAxis(this._globalTimeMinMax, this._drawableArea);
        this._drawPlayheadRegion(this._drawableArea, updatedScaleFactor);
        this._drawableArea.top += dataPadding;
        this._drawableArea.bottom -= dataPadding;

        // pre-process tooltip info so we can use it in determining opacity of lines.
        this._preprocessTooltip(this._hoverPosition, this._drawableArea);

        const { left, right, bottom, top } = this._drawableArea;
        // process, and then draw our points
        this.datasets.ids.forEach((id, idOffset) => {
            let valueMinMax: IPerfMinMax | undefined;
            let prevPoint = this._prevPointById.get(id);
            let prevValue = this._prevValueById.get(id);
            let ticker = false;

            for (let i = 0; i < this._numberOfTickers; i++) {
                if (this._tickerItems[i].id === id) {
                    ticker = true;
                }
            }
            if (!ticker) {
                return;
            }

            ctx.beginPath();
            ctx.strokeStyle = this.metadata.get(id)?.color ?? defaultColor;
            // if we are focused on a line and not in live mode handle the opacities appropriately.
            if (this._preprocessedTooltipInfo.focusedId === id) {
                ctx.globalAlpha = defaultAlpha;
            } else if (this._preprocessedTooltipInfo.focusedId !== "") {
                ctx.globalAlpha = backgroundLineAlpha;
            }

            const values = new Array(this._datasetBounds.end - this._datasetBounds.start);

            for (let pointIndex = this._datasetBounds.start; pointIndex < this._datasetBounds.end; pointIndex++) {
                const numPoints = this.datasets.data.at(this.datasets.startingIndices.at(pointIndex) + PerformanceViewerCollector.NumberOfPointsOffset);

                if (idOffset >= numPoints) {
                    continue;
                }

                const valueIndex = this.datasets.startingIndices.at(pointIndex) + PerformanceViewerCollector.SliceDataOffset + idOffset;
                const value = this.datasets.data.at(valueIndex);

                if (prevValue === undefined) {
                    prevValue = value;
                    this._prevValueById.set(id, prevValue);
                }

                // perform smoothing
                const smoothedValue = smoothingFactor * value + (1 - smoothingFactor) * prevValue;
                values[pointIndex - this._datasetBounds.start] = smoothedValue;

                if (!valueMinMax) {
                    valueMinMax = {
                        min: smoothedValue,
                        max: smoothedValue,
                    };
                }

                this._prevValueById.set(id, smoothedValue);
                valueMinMax.min = Math.min(valueMinMax.min, smoothedValue);
                valueMinMax.max = Math.max(valueMinMax.max, smoothedValue);
            }

            const delta = valueMinMax!.max - valueMinMax!.min;
            valueMinMax!.min -= rangeMargin * delta;
            valueMinMax!.max += rangeMargin * delta;

            for (let pointIndex = this._datasetBounds.start; pointIndex < this._datasetBounds.end; pointIndex++) {
                const timestamp = this.datasets.data.at(this.datasets.startingIndices.at(pointIndex));
                const smoothedValue = values[pointIndex - this._datasetBounds.start];

                const drawableTime = this._getPixelForNumber(timestamp, this._globalTimeMinMax, left, right - left, false);
                const drawableValue = this._getPixelForNumber(smoothedValue, valueMinMax!, top, bottom - top, true);

                if (prevPoint === undefined) {
                    prevPoint = [drawableTime, drawableValue];
                    this._prevPointById.set(id, prevPoint);
                }

                const xDifference = drawableTime - prevPoint[0];
                const skipLine = xDifference > maxXDistancePercBetweenLinePoints * (right - left);
                if (skipLine) {
                    ctx.fillStyle = noDataRectangleColor;
                    ctx.fillRect(prevPoint[0], top, xDifference, bottom - top);
                } else {
                    if (prevPoint[0] < drawableTime) {
                        ctx.moveTo(prevPoint[0], prevPoint[1]);
                        ctx.lineTo(drawableTime, drawableValue);
                    }
                }
                prevPoint[0] = drawableTime;
                prevPoint[1] = drawableValue;
            }

            ctx.stroke();
        });

        ctx.globalAlpha = defaultAlpha;

        // then draw the tooltip.
        this._drawTooltip(this._hoverPosition, this._drawableArea);
    }

    private _drawTickers(drawableArea: IGraphDrawableArea, bounds: IPerfIndexBounds) {
        const { _ctx: ctx } = this;

        if (!ctx) {
            return;
        }

        // create the ticker objects for each of the non hidden items.
        let longestText: string = "";
        this._numberOfTickers = 0;
        const valueMap = new Map<string, IPerfMinMax>();
        this.datasets.ids.forEach((id, idOffset) => {
            if (this.metadata.get(id)?.hidden) {
                return;
            }

            const valueMinMax = this._getMinMax(bounds, idOffset);
            const latestValue = this.datasets.data.at(this.datasets.startingIndices.at(bounds.end - 1) + PerformanceViewerCollector.SliceDataOffset + idOffset);
            const text = `${id}: ${latestValue.toFixed(2)} (max: ${valueMinMax.max.toFixed(2)}, min: ${valueMinMax.min.toFixed(2)})`;
            valueMap.set(id, {
                min: valueMinMax.min,
                max: valueMinMax.max,
                current: latestValue,
            });
            if (text.length > longestText.length) {
                longestText = text;
            }
            this._tickerItems[this._numberOfTickers].id = id;
            this._tickerItems[this._numberOfTickers].max = valueMinMax.max;
            this._tickerItems[this._numberOfTickers].min = valueMinMax.min;
            this._tickerItems[this._numberOfTickers].text = text;
            this._numberOfTickers++;
        });
        this._onVisibleRangeChangedObservable?.notifyObservers({ valueMap });

        ctx.save();
        ctx.font = graphAddonFont;
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

        ctx.restore();
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

        // draw axis box.
        ctx.save();
        ctx.fillStyle = axisColor;
        ctx.fillRect(drawableArea.left, drawableArea.bottom, spaceAvailable, this._axisHeight);
        // draw time axis line
        ctx.beginPath();
        ctx.strokeStyle = defaultColor;
        ctx.moveTo(drawableArea.left, drawableArea.bottom);
        ctx.lineTo(drawableArea.right, drawableArea.bottom);

        // draw ticks and text.
        ctx.fillStyle = defaultColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const timestampUnit: TimestampUnit = this._getTimestampUnit(this._ticks[this._ticks.length - 1]);

        this._ticks.forEach((tick: number) => {
            let position = this._getPixelForNumber(tick, timeMinMax, drawableArea.left, spaceAvailable, false);
            if (position > spaceAvailable) {
                position = spaceAvailable;
            }
            ctx.moveTo(position, drawableArea.bottom);
            ctx.lineTo(position, drawableArea.bottom + 10);
            ctx.fillText(this._parseTimestamp(tick, timestampUnit), position, drawableArea.bottom + 20);
        });
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Given a timestamp (should be the maximum timestamp in view), this function returns the maximum unit the timestamp contains.
     * This information can be used for formatting purposes.
     * @param timestamp the maximum timestamp to find the maximum timestamp unit for.
     * @returns The maximum unit the timestamp has.
     */
    private _getTimestampUnit(timestamp: number): TimestampUnit {
        if (timestamp / msInHour > 1) {
            return TimestampUnit.Hours;
        } else if (timestamp / msInMinute > 1) {
            return TimestampUnit.Minutes;
        } else if (timestamp / msInSecond > 1) {
            return TimestampUnit.Seconds;
        } else {
            return TimestampUnit.Milliseconds;
        }
    }

    /**
     * Given a timestamp and the interval unit, this function will parse the timestamp to the appropriate format.
     * @param timestamp The timestamp to parse
     * @param intervalUnit The maximum unit of the maximum timestamp in an interval.
     * @returns a string representing the parsed timestamp.
     */
    private _parseTimestamp(timestamp: number, intervalUnit: TimestampUnit): string {
        let parsedTimestamp = "";

        if (intervalUnit >= TimestampUnit.Hours) {
            const numHours = Math.floor(timestamp / msInHour);
            timestamp -= numHours * msInHour;
            parsedTimestamp += `${numHours.toString().padStart(intervalUnit > TimestampUnit.Hours ? 2 : 1, "0")}:`;
        }

        if (intervalUnit >= TimestampUnit.Minutes) {
            const numMinutes = Math.floor(timestamp / msInMinute);
            timestamp -= numMinutes * msInMinute;
            parsedTimestamp += `${numMinutes.toString().padStart(intervalUnit > TimestampUnit.Minutes ? 2 : 1, "0")}:`;
        }

        const numSeconds = Math.floor(timestamp / msInSecond);
        timestamp -= numSeconds * msInSecond;
        parsedTimestamp += numSeconds.toString().padStart(intervalUnit > TimestampUnit.Seconds ? 2 : 1, "0");

        if (timestamp > 0) {
            if (parsedTimestamp.length > 0) {
                parsedTimestamp += ".";
            }
            parsedTimestamp += Math.round(timestamp).toString().padStart(3, "0");
        }

        return parsedTimestamp;
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
     * @param bounds
     * @param offset
     * @returns the min and max of the array.
     */
    private _getMinMax(bounds: IPerfIndexBounds, offset: number): IPerfMinMax {
        let min = Infinity,
            max = 0;

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
            max,
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
        const { min, max } = minMax;
        // Perform a min-max normalization to rescale the value onto a [0, 1] scale given the min and max of the dataset.
        let normalizedValue = Math.abs(max - min) > 0.001 ? (num - min) / (max - min) : 0.5;

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

        this._hoverPosition = { xPos: event.clientX, yPos: event.clientY };

        // process and draw the tooltip.
        this._debouncedTooltip(this._hoverPosition, this._drawableArea);
    };

    /**
     * Debounced processing and drawing of tooltip.
     */
    private _debouncedTooltip = debounce((pos: IPerfTooltipHoverPosition | null, drawableArea: IGraphDrawableArea) => {
        this._preprocessTooltip(pos, drawableArea);
        this._drawTooltip(pos, drawableArea);
    }, tooltipDebounceTime);

    /**
     * Handles what to do when we stop hovering over the canvas.
     */
    private _handleStopHover = () => {
        this._hoverPosition = null;
    };

    /**
     * Given a line defined by P1: (x1, y1) and P2: (x2, y2) get the distance of P0 (x0, y0) from the line.
     * https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
     * @param x1 x position of point P1
     * @param y1 y position of point P1
     * @param x2 x position of point P2
     * @param y2 y position of point P2
     * @param x0 x position of point P0
     * @param y0 y position of point P0
     * @returns distance of P0 from the line defined by P1 and P2
     */
    private _getDistanceFromLine(x1: number, y1: number, x2: number, y2: number, x0: number, y0: number): number {
        // if P1 and P2 are the same we just get the distance between P1 and P0
        if (x1 === x2 && y1 === y2) {
            return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        }

        // next we want to handle the case where our point is beyond the y position of our line
        let topX = 0;
        let topY = 0;
        let bottomX = 0;
        let bottomY = 0;
        if (y1 >= y2) {
            topX = x1;
            topY = y1;
            bottomX = x2;
            bottomY = y2;
        } else {
            topX = x2;
            topY = y2;
            bottomX = x1;
            bottomY = y1;
        }

        if (y0 < bottomY) {
            return Math.sqrt(Math.pow(bottomX - x0, 2) + Math.pow(bottomY - y0, 2));
        }

        if (y0 > topY) {
            return Math.sqrt(Math.pow(topX - x0, 2) + Math.pow(topY - y0, 2));
        }

        // the general case!
        const numerator = Math.abs((x2 - x1) * (y1 - y0) - (x1 - x0) * (y2 - y1));
        const denominator = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return numerator / denominator;
    }

    /**
     * This method does preprocessing calculations for the tooltip.
     * @param pos the position of our mouse.
     * @param drawableArea the remaining drawable area.
     */
    private _preprocessTooltip(pos: IPerfTooltipHoverPosition | null, drawableArea: IGraphDrawableArea) {
        const { _ctx: ctx } = this;

        if (pos === null || !ctx || !ctx.canvas || this._getNumberOfSlices() === 0) {
            return;
        }

        const { left, top } = ctx.canvas.getBoundingClientRect();
        const adjustedYPos = pos.yPos - top;
        let adjustedXPos = pos.xPos - left;
        if (adjustedXPos > drawableArea.right) {
            adjustedXPos = drawableArea.right;
        }

        // convert the mouse x position in pixels to a timestamp.
        const inferredTimestamp = this._getNumberFromPixel(adjustedXPos, this._globalTimeMinMax, drawableArea.left, drawableArea.right, false);

        let longestText: string = "";
        let numberOfTooltipItems = 0;

        // get the closest timestamps to the target timestamp, and store the appropriate meta object.
        const closestIndex = this._getClosestPointToTimestamp(inferredTimestamp);
        let actualTimestamp: number = 0;
        let closestLineId: string = "";
        let closestLineValueMinMax: IPerfMinMax = { min: 0, max: 0 };
        let closestLineDistance: number = Number.POSITIVE_INFINITY;

        this.datasets.ids.forEach((id, idOffset) => {
            if (this.metadata.get(id)?.hidden) {
                return;
            }

            const numPoints = this.datasets.data.at(this.datasets.startingIndices.at(closestIndex) + PerformanceViewerCollector.NumberOfPointsOffset);

            if (idOffset >= numPoints) {
                return;
            }

            const valueAtClosestPointIndex = this.datasets.startingIndices.at(closestIndex) + PerformanceViewerCollector.SliceDataOffset + idOffset;
            const valueAtClosestPoint = this.datasets.data.at(valueAtClosestPointIndex);

            let valueMinMax: IPerfMinMax | undefined;

            // we would have already calculated  the min and max while getting the tickers, so use those, and get first one.
            for (let i = 0; i < this._numberOfTickers; i++) {
                if (this._tickerItems[i].id === id) {
                    valueMinMax = this._tickerItems[i];
                }
            }

            if (!valueMinMax) {
                return;
            }

            actualTimestamp = this.datasets.data.at(this.datasets.startingIndices.at(closestIndex));
            const valueAtClosestPointYPos = this._getPixelForNumber(valueAtClosestPoint, valueMinMax, drawableArea.top, drawableArea.bottom - drawableArea.top, true);
            const xForActualTimestamp = this._getPixelForNumber(actualTimestamp, this._globalTimeMinMax, drawableArea.left, drawableArea.right - drawableArea.left, false);

            const text = `${id}: ${valueAtClosestPoint.toFixed(2)}`;

            if (text.length > longestText.length) {
                longestText = text;
            }

            this._tooltipItems[numberOfTooltipItems].text = text;
            this._tooltipItems[numberOfTooltipItems].color = this.metadata.get(id)?.color ?? defaultColor;
            numberOfTooltipItems++;
            // don't process rest if we aren't panned.
            if (!this._position) {
                return;
            }

            // initially distance between closest data point and mouse point.
            let distance: number = this._getDistanceFromLine(
                xForActualTimestamp,
                valueAtClosestPointYPos,
                xForActualTimestamp,
                valueAtClosestPointYPos,
                pos.xPos - left,
                adjustedYPos
            );

            // get the shortest distance between the point and the line segment infront, and line segment behind, store the shorter distance (if shorter than distance between closest data point and mouse).
            if (
                closestIndex + 1 < this.datasets.data.itemLength &&
                this.datasets.data.at(this.datasets.startingIndices.at(closestIndex + 1) + PerformanceViewerCollector.NumberOfPointsOffset) > idOffset
            ) {
                const secondPointTimestamp = this.datasets.data.at(this.datasets.startingIndices.at(closestIndex + 1));
                const secondPointX = this._getPixelForNumber(secondPointTimestamp, this._globalTimeMinMax, drawableArea.left, drawableArea.right - drawableArea.left, false);
                const secondPointValue = this.datasets.data.at(this.datasets.startingIndices.at(closestIndex + 1) + PerformanceViewerCollector.SliceDataOffset + idOffset);
                const secondPointY = this._getPixelForNumber(secondPointValue, valueMinMax, drawableArea.top, drawableArea.bottom - drawableArea.top, true);
                distance = Math.min(this._getDistanceFromLine(xForActualTimestamp, valueAtClosestPointYPos, secondPointX, secondPointY, pos.xPos - left, adjustedYPos), distance);
            }

            if (closestIndex - 1 >= 0 && this.datasets.data.at(this.datasets.startingIndices.at(closestIndex + 1) + PerformanceViewerCollector.NumberOfPointsOffset) > idOffset) {
                const secondPointTimestamp = this.datasets.data.at(this.datasets.startingIndices.at(closestIndex - 1));
                const secondPointX = this._getPixelForNumber(secondPointTimestamp, this._globalTimeMinMax, drawableArea.left, drawableArea.right - drawableArea.left, false);
                const secondPointValue = this.datasets.data.at(this.datasets.startingIndices.at(closestIndex - 1) + PerformanceViewerCollector.SliceDataOffset + idOffset);
                const secondPointY = this._getPixelForNumber(secondPointValue, valueMinMax, drawableArea.top, drawableArea.bottom - drawableArea.top, true);
                distance = Math.min(this._getDistanceFromLine(xForActualTimestamp, valueAtClosestPointYPos, secondPointX, secondPointY, pos.xPos - left, adjustedYPos), distance);
            }

            if (distance < closestLineDistance) {
                closestLineId = id;
                closestLineDistance = distance;
                closestLineValueMinMax = valueMinMax;
            }
        });

        const xForActualTimestamp = this._getPixelForNumber(actualTimestamp, this._globalTimeMinMax, drawableArea.left, drawableArea.right - drawableArea.left, false);

        this._preprocessedTooltipInfo.xForActualTimestamp = xForActualTimestamp;
        // check if hover is within a certain distance, if so it is our only item in our tooltip.
        if (closestLineDistance <= maxDistanceForHover && this._position) {
            this._preprocessedTooltipInfo.focusedId = closestLineId;
            const inferredValue = this._getNumberFromPixel(adjustedYPos, closestLineValueMinMax, drawableArea.top, drawableArea.bottom, true);
            const closestLineText = `${closestLineId}: ${inferredValue.toFixed(2)}`;
            this._preprocessedTooltipInfo.longestText = closestLineText;
            this._preprocessedTooltipInfo.numberOfTooltipItems = 1;
            this._tooltipItems[0].text = closestLineText;
            this._tooltipItems[0].color = this.metadata.get(closestLineId)?.color ?? defaultColor;
        } else {
            this._preprocessedTooltipInfo.focusedId = "";
            this._preprocessedTooltipInfo.longestText = longestText;
            this._preprocessedTooltipInfo.numberOfTooltipItems = numberOfTooltipItems;
        }
    }
    /**
     * Draws the tooltip given the area it is allowed to draw in and the current pixel position.
     *
     * @param pos the position of the mouse cursor in pixels (x, y).
     * @param drawableArea  the available area we can draw in.
     */
    private _drawTooltip(pos: IPerfTooltipHoverPosition | null, drawableArea: IGraphDrawableArea) {
        const { _ctx: ctx } = this;

        if (pos === null || !ctx || !ctx.canvas || this._getNumberOfSlices() === 0) {
            return;
        }

        const { left, top } = ctx.canvas.getBoundingClientRect();
        const { numberOfTooltipItems, xForActualTimestamp, longestText } = this._preprocessedTooltipInfo;

        ctx.save();

        // draw pointer triangle
        ctx.fillStyle = positionIndicatorColor;
        const yTriangle = drawableArea.bottom + trianglePaddingFromAxisLine;
        ctx.beginPath();
        ctx.moveTo(xForActualTimestamp, yTriangle);
        ctx.lineTo(xForActualTimestamp + triangleWidth / 2, yTriangle + triangleHeight);
        ctx.lineTo(xForActualTimestamp - triangleWidth / 2, yTriangle + triangleHeight);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = positionIndicatorColor;
        ctx.beginPath();
        // draw vertical or horizontal line depending on if focused on a point on the line.
        if (this._preprocessedTooltipInfo.focusedId === "") {
            ctx.moveTo(xForActualTimestamp, drawableArea.bottom);
            ctx.lineTo(xForActualTimestamp, topOfGraphY);
        } else {
            const lineY = pos.yPos - top;
            ctx.moveTo(drawableArea.left, lineY);
            ctx.lineTo(drawableArea.right, lineY);
        }
        ctx.stroke();

        // draw the actual tooltip
        ctx.font = graphAddonFont;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

        const boxLength = this._addonFontLineHeight;
        const textHeight = this._addonFontLineHeight + Math.floor(tooltipHorizontalPadding / 2);

        // initialize width with cached value or measure width of longest text and update cache.
        let width: number;
        if (longestText === this._tooltipTextCache.text) {
            width = this._tooltipTextCache.width;
        } else {
            width = ctx.measureText(longestText).width + boxLength + 2 * tooltipHorizontalPadding + spaceBetweenTextAndBox;
            this._tooltipTextCache.text = longestText;
            this._tooltipTextCache.width = width;
        }

        const tooltipHeight = textHeight * (numberOfTooltipItems + 1);
        let x = pos.xPos - left;
        let y = drawableArea.bottom - tooltipPaddingFromBottom - tooltipHeight;

        // We want the tool tip to always be inside the canvas so we adjust which way it is drawn.
        if (x + width > this._width) {
            x -= width;
        }

        ctx.globalAlpha = tooltipBackgroundAlpha;
        ctx.fillStyle = tooltipBackgroundColor;

        ctx.fillRect(x, y, width, tooltipHeight);

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
     * @param shouldFlip if we should use a [1, 0] scale instead of a [0, 1] scale.
     * @returns number corresponding to pixel position
     */
    private _getNumberFromPixel(pixel: number, minMax: IPerfMinMax, startingPixel: number, endingPixel: number, shouldFlip: boolean): number {
        // normalize pixel to range [0, 1].
        let normalizedPixelPosition = (pixel - startingPixel) / (endingPixel - startingPixel);

        // we should use a [1, 0] scale instead.
        if (shouldFlip) {
            normalizedPixelPosition = 1 - normalizedPixelPosition;
        }

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

        const amount = ((event.deltaY * -0.01) | 0) * 100;
        const minZoom = 60;

        // The max zoom is the number of slices.
        const maxZoom = this._getNumberOfSlices();

        if (this._shouldBecomeRealtime()) {
            this._position = null;
        }
        // Bind the zoom between [minZoom, maxZoom]
        this._sizeOfWindow = Scalar.Clamp(this._sizeOfWindow - amount, minZoom, maxZoom);
    };

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
        canvas.addEventListener("mousemove", this._handlePan);
    };

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
        const itemsDelta = (pixelDelta / pixelsPerItem) | 0;
        const pos = this._position ?? this._getNumberOfSlices() - 1;

        // update our position without allowing the user to pan more than they need to (approximation)
        this._position = Scalar.Clamp(
            pos - itemsDelta,
            Math.floor(this._sizeOfWindow * scaleFactor),
            this._getNumberOfSlices() - Math.floor(this._sizeOfWindow * (1 - scaleFactor))
        );

        if (itemsDelta === 0) {
            this._panPosition.delta += pixelDelta;
        } else {
            this._panPosition.delta = 0;
        }

        this._panPosition.xPos = event.clientX;
        this._prevPointById.clear();
        this._prevValueById.clear();
    };

    /**
     * Clears the panning object and removes the appropriate listener.
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
    };

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

        return (
            this.datasets.data.at(this.datasets.startingIndices.at(rightmostPos)) / this.datasets.data.at(this.datasets.startingIndices.at(latestSlicePos)) > returnToLiveThreshold
        );
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
