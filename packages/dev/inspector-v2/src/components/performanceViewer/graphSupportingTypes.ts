import type { IPerfDatasets } from "core/Misc/interfaces/iPerfViewer";
import type { Observable } from "core/Misc/observable";

/**
 * Defines a structure to hold max, min and a optional current.
 */
export type PerfMinMax = {
    min: number;
    max: number;
    current?: number;
};

/**
 * Defines structure of the object which contains information related to panning.
 */
export type PerfMousePanningPosition = {
    xPos: number;
    delta: number;
};

/**
 * Defines structure of the object which contains information regarding the bounds of each dataset we want to consider.
 */
export type PerfIndexBounds = {
    start: number;
    end: number;
};

export type PerfLayoutSize = {
    width: number;
    height: number;
};

/**
 * Defines the structure of the meta object for the tooltip that appears when hovering over a performance graph!
 */
export type PerfTooltip = {
    text: string;
    color: string;
};

/**
 * Defines the structure of a cache object used to store the result of measureText().
 */
export type PerfTextMeasureCache = {
    text: string;
    width: number;
};

/**
 * Defines a structure defining the available space in a drawable area.
 */
export type GraphDrawableArea = {
    top: number;
    left: number;
    bottom: number;
    right: number;
};

/**
 * Defines the structure representing necessary ticker information.
 */
export type PerfTicker = PerfMinMax & {
    id: string;
    text: string;
};

export type VisibleRangeChangedObservableProps = {
    valueMap: Map<string, PerfMinMax>;
};

/**
 * Defines what settings our canvas graphing service accepts
 */
export type CanvasGraphServiceSettings = {
    datasets: IPerfDatasets;
    onVisibleRangeChangedObservable?: Observable<VisibleRangeChangedObservableProps>;
};

/**
 * Defines the structure representing the preprocessable tooltip information.
 */
export type TooltipPreprocessedInformation = {
    xForActualTimestamp: number;
    numberOfTooltipItems: number;
    longestText: string;
    focusedId: string;
};

export type PerfTooltipHoverPosition = {
    xPos: number;
    yPos: number;
};

/**
 * Defines the supported timestamp units.
 */
export enum TimestampUnit {
    Milliseconds = 0,
    Seconds = 1,
    Minutes = 2,
    Hours = 3,
}
