/**
 * A wrapper for the experimental compute pressure api which allows a callback to be called whenever certain thresholds are met.
 */
export class ComputePressureObserverWrapper {
    private _observer: any;
    /**
     * A compute pressure observer will call this callback, whenever these thresholds are met.
     * @param callback The callback that is called whenever thresholds are met.
     * @param thresholds An object containing the thresholds used to decide what value to to return for each update property (average of start and end of a threshold boundary).
     */
    constructor(callback: (update: IComputePressureData) => void, thresholds: IComputePressureThresholds) {
        if (ComputePressureObserverWrapper.IsAvailable) {
            this._observer = new (<any>window).ComputePressureObserver(callback, thresholds);
        }
    }

    /**
     * Returns true if ComputePressureObserver is available for use, false otherwise.
     */
    public static get IsAvailable() {
        return 'ComputePressureObserver' in window;
    }

    /**
     * Method that must be called to begin observing changes, and triggering callbacks.
     */
    observe(): void {
        this._observer?.observe && this._observer?.observe();
    }

    /**
     * Method that must be called to stop observing changes and triggering callbacks (cleanup function).
     */
    unobserve(): void {
        this._observer?.unobserve && this._observer?.unobserve();
    }
}

/**
 * An interface defining the shape of the thresholds parameter in the experimental compute pressure api
 */
export interface IComputePressureThresholds {
    /**
     * Thresholds to make buckets out of for the cpu utilization, the average between the start and end points of a threshold will be returned to the callback.
     */
    cpuUtilizationThresholds: number[];
    /**
     * Thresholds to make buckets out of for the cpu speed, the average between the start and end points of a threshold will be returned to the callback.
     * 0.5 represents base speed.
     */
    cpuSpeedThresholds: number[];
}

/**
 * An interface defining the shape of the data sent to the callback in the compute pressure observer.
 */
export interface IComputePressureData {
    /**
     * The cpu utilization which will be a number between 0.0 and 1.0.
     */
    cpuUtilization: number;
    /**
     * The cpu speed which will be a number between 0.0 and 1.0.
     */
    cpuSpeed: number;
}