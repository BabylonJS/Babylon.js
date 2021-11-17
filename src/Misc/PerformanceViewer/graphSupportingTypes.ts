import { IPerfDatasets } from "../interfaces/iPerfViewer";

/**
 * Defines a structure to hold max and min.
 */
export interface IPerfMinMax {
    /**
     * min
     */
    min: number;
    /**
     * max
     */
    max: number;
}

/**
 * Defines structure of the object which contains information related to panning.
 */
export interface IPerfMousePanningPosition {
    /**
     * Starting x position of pan
     */
    xPos: number;
    /**
     * Pan delta on the x axis
     */
    delta: number;
}

/**
 * Defines structure of the object which contains information regarding the bounds of each dataset we want to consider.
 */
export interface IPerfIndexBounds {
    /**
     * starting bound of the dataset
     */
    start: number;
    /**
     * max bound of the dataset
     */
    end: number;
}

export interface IPerfLayoutSize {
    /**
     * layout width
     */
    width: number;
    /**
     * layout height
     */
    height: number;
}

/**
 * Defines the structure of the meta object for the tooltip that appears when hovering over a performance graph!
 */
export interface IPerfTooltip {
    /**
     * tooltip text
     */
    text: string;
    /**
     * tooltip color
     */
    color: string;
}

/**
 * Defines the structure of a cache object used to store the result of measureText().
 */
export interface IPerfTextMeasureCache {
    /**
     * longest text we've seen so far
     */
    text: string;
    /**
     * width of that longest text
     */
    width: number;
}

/**
 * Defines a structure defining the available space in a drawable area.
 */
export interface IGraphDrawableArea {
    /**
     * top
     */
    top: number;
    /**
     * left
     */
    left: number;
    /**
     * bottom
     */
    bottom: number;
    /**
     * right
     */
    right: number;
}

/**
 * Defines the structure representing necessary ticker information.
 */
export interface IPerfTicker extends IPerfMinMax {
    /**
     * ticker id
     */
    id: string;
    /**
     * ticker text
     */
    text: string;
}

/**
 * Defines what settings our canvas graphing service accepts
 */
export interface ICanvasGraphServiceSettings {
    /**
     * from where we extract data
     */
    datasets: IPerfDatasets;
}

/**
 * Defines the structure representing the preprocessable tooltip information.
 */
export interface ITooltipPreprocessedInformation {
    /**
     * pixel coordinates of a number on the x axis
     */
    xForActualTimestamp: number;
    /**
     * number of tooltip items
     */
    numberOfTooltipItems: number;
    /**
     * longest text we've seen so far
     */
    longestText: string;
    /**
     * focused id
     */
    focusedId: string;
}

export interface IPerfTooltipHoverPosition {
    /**
     * x hover position
     */
    xPos: number;
    /**
     * y hover position
     */
    yPos: number;
}

/**
 * Defines the supported timestamp units.
 */
export enum TimestampUnit {
    /**
     * Milliseconds
     */
    Milliseconds = 0,
    /**
     * Seconds
     */
    Seconds = 1,
    /**
     * Minutes
     */
    Minutes = 2,
    /**
     * Hours
     */
    Hours = 3,
}
