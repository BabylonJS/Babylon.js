import type { DynamicFloat32Array } from "../PerformanceViewer/dynamicFloat32Array";

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

    /**
     * Specifies the category of the data
     */
    category?: string;
}

/**
 * Defines the shape of a custom user registered event.
 */
export interface IPerfCustomEvent {
    /**
     * The name of the event.
     */
    name: string;
    /**
     * The value for the event, if set we will use it as the value, otherwise we will count the number of occurrences.
     */
    value?: number;
}
