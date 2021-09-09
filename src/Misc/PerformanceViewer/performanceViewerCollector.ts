import { Scene } from "../../scene";
import { IPerfCustomEvent, IPerfDatasets, IPerfMetadata } from "../interfaces/iPerfViewer";
import { EventState, Observable } from "../observable";
import { PrecisionDate } from "../precisionDate";
import { Tools } from "../tools";
import { DynamicFloat32Array } from "./dynamicFloat32Array";
import { IPerfViewerCollectionStrategy, PerfStrategyInitialization } from "./performanceViewerCollectionStrategies";

// the initial size of our array, should be a multiple of two!
const initialArraySize = 1800;

// three octets in a hexcode. #[AA][BB][CC], i.e. 24 bits of data.
const numberOfBitsInHexcode = 24;

// Allows single numeral hex numbers to be appended by a 0.
const hexPadding = "0";

// header for the timestamp column
const timestampColHeader = "timestamp";

// header for the numPoints column
const numPointsColHeader = "numPoints";

// regex to capture all carriage returns in the string.
const carriageReturnRegex = /\r/g;

/**
 * The collector class handles the collection and storage of data into the appropriate array.
 * The collector also handles notifying any observers of any updates.
 */
export class PerformanceViewerCollector {
    private _datasetMeta: Map<string, IPerfMetadata>;
    private _strategies: Map<string, IPerfViewerCollectionStrategy>;
    private _startingTimestamp: number;
    private _hasLoadedData: boolean;
    private readonly _customEventObservable: Observable<IPerfCustomEvent>;
    private readonly _eventRestoreSet: Set<string>;

    /**
     * Datastructure containing the collected datasets. Warning: you should not modify the values in here, data will be of the form [timestamp, numberOfPoints, value1, value2..., timestamp, etc...]
     */
    public readonly datasets: IPerfDatasets;
    /**
     * An observable you can attach to get deltas in the dataset. Subscribing to this will increase memory consumption slightly, and may hurt performance due to increased garbage collection needed.
     * Updates of slices will be of the form [timestamp, numberOfPoints, value1, value2...].
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
        this._eventRestoreSet = new Set();
        this._customEventObservable = new Observable();
        this.datasetObservable = new Observable();
        this.metadataObservable = new Observable((observer) => observer.callback(this._datasetMeta, new EventState(0)));
        if (_enabledStrategyCallbacks) {
            this.addCollectionStrategies(..._enabledStrategyCallbacks);
        }
    }

    /**
     * Registers a custom string event which will be callable via sendEvent. This method returns an event object which will contain the id of the event.
     * The user can set a value optionally, which will be used in the sendEvent method. If the value is set, we will record this value at the end of each frame,
     * if not we will increment our counter and record the value of the counter at the end of each frame. The value recorded is 0 if no sendEvent method is called, within a frame.
     * @param name The name of the event to register
     * @param forceUpdate if the code should force add an event, and replace the last one.
     * @returns The event registered, used in sendEvent
     */
    public registerEvent(name: string, forceUpdate?: boolean): IPerfCustomEvent | undefined {
        if (this._strategies.has(name) && !forceUpdate) {
            return;
        }

        if (this._strategies.has(name) && forceUpdate) {
            this._strategies.get(name)?.dispose();
            this._strategies.delete(name);
        }

        const strategy: PerfStrategyInitialization = (scene) => {
            let counter: number = 0;
            let value: number = 0;

            const afterRenderObserver = scene.onAfterRenderObservable.add(() => {
                value = counter;
                counter = 0;
            });

            const stringObserver = this._customEventObservable.add((eventVal) => {
                if (name !== eventVal.name) {
                    return;
                }

                if (eventVal.value !== undefined) {
                    counter = eventVal.value;
                } else {
                    counter++;
                }
            });

            return {
                id: name,
                getData: () => value,
                dispose: () => {
                    scene.onAfterRenderObservable.remove(afterRenderObserver);
                    this._customEventObservable.remove(stringObserver);
                }
            };
        };
        const event: IPerfCustomEvent = {
            name
        };

        this._eventRestoreSet.add(name);
        this.addCollectionStrategies(strategy);

        return event;
    }

    /**
     * Lets the perf collector handle an event, occurences or event value depending on if the event.value params is set.
     * @param event the event to handle an occurence for
     */
    public sendEvent(event: IPerfCustomEvent) {
        this._customEventObservable.notifyObservers(event);
    }

    /**
     * This event restores all custom string events if necessary.
     */
    private _restoreStringEvents() {
        if (this._eventRestoreSet.size !== this._customEventObservable.observers.length) {
            this._eventRestoreSet.forEach((event) => {
                this.registerEvent(event, true);
            });
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
                strategy.dispose();
                continue;
            }

            this.datasets.ids.push(strategy.id);

            this._datasetMeta.set(strategy.id, {
                color: this._getHexColorFromId(strategy.id),
            });

            this._strategies.set(strategy.id, strategy);
        }

        this.metadataObservable.notifyObservers(this._datasetMeta);
    }

    /**
     * Gets a 6 character hexcode representing the colour from a passed in string.
     * @param id the string to get a hex code for.
     * @returns a hexcode hashed from the id.
     */
    private _getHexColorFromId(id: string) {
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
     * The slice will be of the form [timestamp, numberOfPoints, value1, value2...]
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
     * Completely clear, data, ids, and strategies saved to this performance collector.
     * @param preserveStringEventsRestore if it should preserve the string events, by default will clear string events registered when called.
     */
    public clear(preserveStringEventsRestore?: boolean) {
        this.datasets.data = new DynamicFloat32Array(initialArraySize);
        this.datasets.ids.length = 0;
        this.datasets.startingIndices = new DynamicFloat32Array(initialArraySize);
        this._datasetMeta.clear();
        this._strategies.forEach((strategy) => strategy.dispose());
        this._strategies.clear();

        if (!preserveStringEventsRestore) {
            this._eventRestoreSet.clear();
        }
        this._hasLoadedData = false;
    }

    /**
     * Accessor which lets the caller know if the performance collector has data loaded from a file or not!
     * Call clear() to reset this value.
     * @returns true if the data is loaded from a file, false otherwise.
     */
    public get hasLoadedData(): boolean {
        return this._hasLoadedData;
    }

    /**
     * Given a string containing file data, this function parses the file data into the datasets object.
     * It returns a boolean to indicate if this object was successfully loaded with the data.
     * @param data string content representing the file data.
     * @returns true if the data was successfully loaded, false otherwise.
     */
    public loadFromFileData(data: string): boolean {
        const lines =
            data.replace(carriageReturnRegex, '').split('\n')
                .map((line) => (
                    line.split(',')
                        .filter((s) =>  s.length > 0)
                ))
                .filter((line) => line.length > 0);
        const timestampIndex = 0;
        const numPointsIndex = PerformanceViewerCollector.NumberOfPointsOffset;
        if (lines.length < 2) {
            return false;
        }

        const parsedDatasets: IPerfDatasets = {
            ids: [],
            data: new DynamicFloat32Array(initialArraySize),
            startingIndices: new DynamicFloat32Array(initialArraySize)
        };

        // parse first line seperately to populate ids!
        const [firstLine, ...dataLines] = lines;
        // make sure we have the correct beginning headers
        if (firstLine.length < 2 || firstLine[timestampIndex] !== timestampColHeader || firstLine[numPointsIndex] !== numPointsColHeader) {
            return false;
        }

        // populate the ids.
        for (let i = PerformanceViewerCollector.SliceDataOffset; i < firstLine.length; i++) {
            parsedDatasets.ids.push(firstLine[i]);
        }

        let startingIndex = 0;
        for (const line of dataLines) {
            if (line.length < 2) {
                return false;
            }

            const timestamp = parseFloat(line[timestampIndex]);
            const numPoints = parseInt(line[numPointsIndex]);

            if (isNaN(numPoints) || isNaN(timestamp)) {
                return false;
            }

            parsedDatasets.data.push(timestamp);
            parsedDatasets.data.push(numPoints);

            if (numPoints + PerformanceViewerCollector.SliceDataOffset !== line.length) {
                return false;
            }

            for (let i = PerformanceViewerCollector.SliceDataOffset; i < line.length; i++) {
                const val = parseFloat(line[i]);
                if (isNaN(val)) {
                    return false;
                }
                parsedDatasets.data.push(val);
            }

            parsedDatasets.startingIndices.push(startingIndex);
            startingIndex += line.length;
        }

        this.datasets.ids = parsedDatasets.ids;
        this.datasets.data = parsedDatasets.data;
        this.datasets.startingIndices = parsedDatasets.startingIndices;
        this._datasetMeta.clear();
        this._strategies.forEach((strategy) => strategy.dispose());
        this._strategies.clear();

        // populate metadata.
        for (const id of this.datasets.ids) {
            this._datasetMeta.set(id, {color: this._getHexColorFromId(id)});
        }
        this.metadataObservable.notifyObservers(this._datasetMeta);
        this._hasLoadedData = true;
        return true;
    }

    /**
     * Exports the datasets inside of the collector to a csv.
     */
    public exportDataToCsv() {
        let csvContent = "";
        // create the header line.
        csvContent += `${timestampColHeader},${numPointsColHeader}`;
        for (let i = 0; i < this.datasets.ids.length; i++) {
            csvContent += `,${this.datasets.ids[i]}`;
        }
        csvContent += "\n";
        // create the data lines
        for (let i = 0; i < this.datasets.startingIndices.itemLength; i++) {
            const startingIndex = this.datasets.startingIndices.at(i);
            const timestamp = this.datasets.data.at(startingIndex);
            const numPoints = this.datasets.data.at(startingIndex + PerformanceViewerCollector.NumberOfPointsOffset);

            csvContent += `${timestamp},${numPoints}`;

            for (let offset = 0; offset < numPoints; offset++) {
                csvContent += `,${this.datasets.data.at(startingIndex + PerformanceViewerCollector.SliceDataOffset + offset)}`;
            }

            // add extra commas.
            for (let diff = 0; diff < this.datasets.ids.length - numPoints; diff++) {
                csvContent += ",";
            }

            csvContent += "\n";
        }

        const fileName = `${new Date().toISOString()}-perfdata.csv`;
        Tools.Download(new Blob([csvContent], {type: "text/csv"}), fileName);
    }
    /**
     * Starts the realtime collection of data.
     * @param shouldPreserve optional boolean param, if set will preserve the dataset between calls of start.
     */
    public start(shouldPreserve?: boolean) {
        if (!shouldPreserve) {
            this.datasets.data = new DynamicFloat32Array(initialArraySize);
            this.datasets.startingIndices = new DynamicFloat32Array(initialArraySize);
        }
        this._startingTimestamp = PrecisionDate.Now;
        this._scene.onBeforeRenderObservable.add(this._collectDataAtFrame);
        this._restoreStringEvents();
    }

    /**
     * Stops the collection of data.
     */
    public stop() {
        this._scene.onBeforeRenderObservable.removeCallback(this._collectDataAtFrame);
    }

    /**
     * Disposes of the object
     */
    public dispose() {
        this._scene.onBeforeRenderObservable.removeCallback(this._collectDataAtFrame);
        this._datasetMeta.clear();
        this._strategies.forEach((strategy) => {
            strategy.dispose();
        });
        this.datasetObservable.clear();
        this.metadataObservable.clear();
        (<any>this.datasets) = null;
    }
}