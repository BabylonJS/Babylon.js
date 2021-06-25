import { IPerfDataset } from "babylonjs/Misc/interfaces/iPerfViewer"

/**
 * Defines a structure to hold max and min.
 */
 export interface IMinMax {
    min: number;
    max: number;
}

/**
 * Defines what settings our canvas graphing service accepts
 */
export interface ICanvasGraphServiceSettings {
    datasets: IPerfDataset[];
}