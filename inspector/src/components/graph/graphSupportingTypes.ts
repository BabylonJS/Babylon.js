import { IPerfDataset } from "babylonjs/Misc/interfaces/iPerfViewer"
/**
 * Defines what settings our canvas graphing service accepts
 */
export interface ICanvasGraphServiceSettings {
    datasets: IPerfDataset[];
}