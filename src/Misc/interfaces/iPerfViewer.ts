/**
 * Defines what data is needed to graph a point on the graph.
 */
export interface IPerfPoint {
    /**
     * The x coordinate of the point.
     */
    x: number;

    /**
     * The y coordinate of the point.
     */
    y: number;
}

/**
 * Defines the shape of a dataset that our graphing service uses for drawing purposes.
 */
export interface IPerfDataset {
    /**
     * The color of the line to be drawn.
     */
    color?: string;

    /**
     * The data to be processed by the performance graph.
     */
    data: IPerfPoint[];

    /**
     * Specifies if data should be hidden, falsey by default.
     */
    hidden?: boolean;
}
