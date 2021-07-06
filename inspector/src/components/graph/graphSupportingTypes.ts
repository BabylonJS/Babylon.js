import { IPerfDataset } from "babylonjs/Misc/interfaces/iPerfViewer"

/**
 * Defines a structure to hold max and min.
 */
 export interface IPerfMinMax {
    min: number;
    max: number;
}

export interface IPerfMousePosition {
    xPos: number;
    delta: number;
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