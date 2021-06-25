/**
 * Defines what data is needed to graph a point on the graph.
 */
interface IPoint {
    x: number; // This will probably need to become a date when we have real data.
    y: number;
}

/**
 * Defines the shape of a dataset that our graphing service uses for drawing purposes.
 */
export interface IPerfDataset {
    color?: string;
    data: IPoint[];
    hidden?: boolean; // falsey by default!
}

/**
 * Defines what settings our canvas graphing service accepts
 */
export interface ICanvasGraphServiceSettings {
    datasets: IPerfDataset[];
}