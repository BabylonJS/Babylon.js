import { IPerfDatasets } from "babylonjs/Misc/interfaces/iPerfViewer"

/**
 * Defines a structure to hold max and min.
 */
export interface IPerfMinMax {
    min: number;
    max: number;
}

/**
 * Defines structure of the object which contains information related to panning.
 */
export interface IPerfMousePanningPosition {
    xPos: number;
    delta: number;
}

/**
 * Defines structure of the object which contains information regarding the bounds of each dataset we want to consider.
 */
export interface IPerfIndexBounds {
    start: number;
    end: number;
}

export interface IPerfLayoutSize {
    width: number;
    height: number;
}

/**
 * Defines the structure of the meta object for the tooltip that appears when hovering over a performance graph!
 */
export interface IPerfTooltip {
    text: string;
    color: string
}

/**
 * Defines the structure of a cache object used to store the result of measureText().
 */
export interface IPerfTextMeasureCache {
    text: string;
    width: number;
}

/**
 * Defines a structure defining the available space in a drawable area.
 */
export interface IGraphDrawableArea {
    top: number;
    left: number;
    bottom: number;
    right: number;
}

/**
 * Defines the structure representing necessary ticker information. 
 */
export interface IPerfTicker extends IPerfMinMax {
    id: string;
    text: string;
}

/**
 * Defines what settings our canvas graphing service accepts
 */
export interface ICanvasGraphServiceSettings {
    datasets: IPerfDatasets;
}

/**
 * Defines the structure representing the preprocessable tooltip information.
 */
export interface ITooltipPreprocessedInformation {
    xForActualTimestamp: number;
    numberOfTooltipItems: number;
    longestText: string;
    focusedId: string;
}

export interface IPerfTooltipHoverPosition {
    xPos: number;
    yPos: number;
}

/**
 * Defines the supported timestamp units.
 */
export enum TimestampUnit {
    Milliseconds = 0,
    Seconds = 1,
    Minutes = 2,
    Hours = 3,
}