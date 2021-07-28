import { Scene } from "../../scene";
import { IPerfDatasets, IPerfMetadata } from "../interfaces/iPerfViewer";
import { EventState, Observable } from "../observable";
import { PrecisionDate } from "../precisionDate";
import { DynamicFloat32Array } from "./dynamicFloat32Array";
import { IPerfViewerCollectionStrategy, PerfStrategyInitialization } from "./performanceViewerCollectionStrategies";

// the initial size of our array, should be a multiple of two!
const initialArraySize = 1800;

// three octets in a hexcode. #[AA][BB][CC], i.e. 24 bits of data.
const numberOfBitsInHexcode = 24;

// Allows single numeral hex numbers to be appended by a 0.
const hexPadding = "0";

/**
 * The collector class handles the collection and storage of data into the appropriate array.
 * The collector also handles notifying any observers of any updates.
 */
export class PerformanceViewerCollector {
    private _datasetMeta: Map<string, IPerfMetadata>;
    private _strategies: Map<string, IPerfViewerCollectionStrategy>;
    private _startingTimestamp: number;

    /**
     * Datastructure containing the collected datasets. Warning: you should not modify the values in here, data will be of the form [timestamp, numberOfPoints, value1, value2..., timestamp, etc...]
     */
    public readonly datasets: IPerfDatasets;
    /**
     * An observable you can attach to get deltas in the dataset. Subscribing to this will increase memory consumption slightly, and may hurt performance due to increased garbage collection needed.
     */
    public readonly datasetObservable: Observable<number[]>;
    /**
     * An observable you can attach to get the most updated map of metadatas.
     */
    public readonly metadataObservable: Observable<Map<string, IPerfMetadata>>;

    /**
     * The offset for when actual data values start appearing inside a slice.
     */
    public static get SliceDataOffset() {
        return 2;
    }

    /**
     * The offset for the value of the number of points inside a slice.
     */
    public static get NumberOfPointsOffset() {
        return 1;
    }

    /**
     * Handles the creation of a performance viewer collector.
     * @param _scene the scene to collect on.
     * @param _enabledStrategyCallbacks the list of data to collect with callbacks for initialization purposes.
     */
    constructor(private _scene: Scene, _enabledStrategyCallbacks?: PerfStrategyInitialization[]) {
        this.datasets = {
            ids: [],
            data: new DynamicFloat32Array(initialArraySize),
            startingIndices: new DynamicFloat32Array(initialArraySize)
        };
        this._strategies = new Map<string, IPerfViewerCollectionStrategy>();
        this._datasetMeta = new Map<string, IPerfMetadata>();
        this.datasetObservable = new Observable();
        this.metadataObservable = new Observable((observer) => observer.callback(this._datasetMeta, new EventState(0)));
        if (_enabledStrategyCallbacks) {
            this.addCollectionStrategies(..._enabledStrategyCallbacks);
        }
    }

    /**
     * This method adds additional collection strategies for data collection purposes.
     * @param strategyCallbacks the list of data to collect with callbacks.
     */
    public addCollectionStrategies(...strategyCallbacks: PerfStrategyInitialization[]) {
        for (const strategyCallback of strategyCallbacks) {
            const strategy = strategyCallback(this._scene);

            if (this._strategies.has(strategy.id)) {
                continue;
            }

            this.datasets.ids.push(strategy.id);

            this._datasetMeta.set(strategy.id, {
                color: this._getHexFromId(strategy.id),
            });

            this._strategies.set(strategy.id, strategy);
        }

        this.metadataObservable.notifyObservers(this._datasetMeta);
    }

    /**
     * Gets a 6 character hexcode from a passed in string.
     * @param id the string to get a hex code for.
     * @returns a hexcode hashed from the id.
     */
    private _getHexFromId(id: string) {
        // this first bit is just a known way of hashing a string.
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            // (hash << 5) - hash is the same as hash * 31
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }

        // then we build the string octet by octet.
        let hex = "#";
        for (let i = 0; i < numberOfBitsInHexcode; i += 8) {
            const octet = (hash >> i) & 0xFF;
            hex += (hexPadding + octet.toString(16)).substr(-2);
        }

        return hex;
    }

    /**
     * Collects data for every dataset by using the appropriate strategy. This is called every frame.
     * This method will then notify all observers with the latest slice.
     */
    private _collectDataAtFrame = () => {
        const timestamp = PrecisionDate.Now - this._startingTimestamp;
        const numPoints = this.datasets.ids.length;

        // add the starting index for the slice
        const numberOfIndices = this.datasets.startingIndices.itemLength;
        let startingIndex = 0;

        if (numberOfIndices > 0) {
            const previousStartingIndex = this.datasets.startingIndices.at(numberOfIndices - 1);
            startingIndex = previousStartingIndex + this.datasets.data.at(previousStartingIndex + PerformanceViewerCollector.NumberOfPointsOffset) + PerformanceViewerCollector.SliceDataOffset;
        }

        this.datasets.startingIndices.push(startingIndex);

        // add the first 2 items in our slice.
        this.datasets.data.push(timestamp);
        this.datasets.data.push(numPoints);

        // add the values inside the slice.
        this.datasets.ids.forEach((id: string) => {
            const strategy = this._strategies.get(id);

            if (!strategy) {
                return;
            }

            this.datasets.data.push(strategy.getData());
        });

        if (this.datasetObservable.hasObservers()) {
            const slice: number[] = [timestamp, numPoints];

            for (let i = 0; i < numPoints; i++) {
                slice.push(this.datasets.data.at(startingIndex + PerformanceViewerCollector.SliceDataOffset + i));
            }

            this.datasetObservable.notifyObservers(slice);
        }
    }

    /**
     * Collects and then sends the latest slice to any observers by using the appropriate strategy when the user wants.
     * This method does not add onto the collected data accessible via the datasets variable.
     */
    public getCurrentSlice() {
        const timestamp = PrecisionDate.Now - this._startingTimestamp;
        const numPoints = this.datasets.ids.length;
        const slice: number[] = [timestamp, numPoints];

        // add the values inside the slice.
        this.datasets.ids.forEach((id: string) => {
            const strategy = this._strategies.get(id);

            if (!strategy) {
                return;
            }

            if (this.datasetObservable.hasObservers()) {
                slice.push(strategy.getData());
            }
        });

        if (this.datasetObservable.hasObservers()) {
            this.datasetObservable.notifyObservers(slice);
        }

    }

    /**
     * Updates a property for a dataset's metadata with the value provided.
     * @param id the id of the dataset which needs its metadata updated.
     * @param prop the property to update.
     * @param value the value to update the property with.
     */
    public updateMetadata<T extends keyof IPerfMetadata>(id: string, prop: T, value: IPerfMetadata[T]) {
        const meta = this._datasetMeta.get(id);

        if (!meta) {
            return;
        }

        meta[prop] = value;

        this.metadataObservable.notifyObservers(this._datasetMeta);
    }

    /**
     * Starts the realtime collection of data.
     */
    public start() {
        this._startingTimestamp = PrecisionDate.Now;
        this._scene.onBeforeRenderObservable.add(this._collectDataAtFrame);
    }

    /**
     * Stops the collection of data.
     */
    public stop() {
        this._scene.onBeforeRenderObservable.removeCallback(this._collectDataAtFrame);
    }
}