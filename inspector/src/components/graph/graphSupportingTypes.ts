import { IPerfDataset } from "babylonjs/Misc/interfaces/iPerfViewer"

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
 * Defines what settings our canvas graphing service accepts
 */
export interface ICanvasGraphServiceSettings {
    datasets: IPerfDataset[];
}