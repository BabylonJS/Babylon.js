/**
 * Defines what data is needed to graph a point on the performance graph.
 */
export interface IPerfPoint {
    /**
     * The timestamp of the point.
     */
    timestamp: number;

    /**
     * The value of the point.
     */
    value: number;
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
     * The id of the dataset.
     */
    id: string;

    /**
     * The data to be processed by the performance graph.
     */
    data: IPerfPoint[];

    /**
     * Specifies if data should be hidden, falsey by default.
     */
    hidden?: boolean;
}
