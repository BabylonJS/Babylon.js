/**
 * Defines what data is needed to graph a point on the graph.
 */
export interface IPerfPoint {
    x: number; // This will probably need to become a date when we have real data.
    y: number;
}

/**
 * Defines the shape of a dataset that our graphing service uses for drawing purposes.
 */
export interface IPerfDataset {
    color?: string;
    data: IPerfPoint[];
    hidden?: boolean; // falsey by default!
}
