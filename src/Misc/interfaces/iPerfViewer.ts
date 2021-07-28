import { DynamicFloat32Array } from "../PerformanceViewer/dynamicFloat32Array";

// TODO: remove once everything is connected!
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

// TODO: REMOVE ONCE Everything is connected!
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

/**
 * Defines the shape of a collection of datasets that our graphing service uses for drawing purposes.
 */
 export interface IPerfDatasets {
    /**
     * The ids of our dataset.
     */
    ids: string[];

    /**
     * The data to be processed by the performance graph. Each slice will be of the form of [timestamp, numberOfPoints, value1, value2...]
     */
    data: DynamicFloat32Array;

    /**
     * A list of starting indices for each slice of data collected. Used for fast access of an arbitrary slice inside the data array.
     */
    startingIndices: DynamicFloat32Array;
}

/**
 * Defines the shape of a the metadata the graphing service uses for drawing purposes.
 */
 export interface IPerfMetadata {
    /**
     * The color of the line to be drawn.
     */
     color?: string;

     /**
      * Specifies if data should be hidden, falsey by default.
      */
     hidden?: boolean;
}

/**
 * Defines the shape of a snapshot sent to observers.
 */
export interface IPerfDataSliceSnapshot {
    /**
     * An array containing information about the latest slice.
     */
    slice: number[];
}