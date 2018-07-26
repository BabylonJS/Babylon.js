import { Nullable, TransformNode, Scene } from "babylonjs";
import { DataSeries } from ".";

/** base class for all chart controls*/
export abstract class Chart {
    protected _dataSource: Nullable<DataSeries>;
    protected _rootNode: TransformNode;
    protected _dataFilters: {[key: string]: string};

    /** Gets or sets the data source used by the graph */
    public get dataSource(): Nullable<DataSeries> {
        return this._dataSource;
    }

    public set dataSource(value: Nullable<DataSeries>) {
        if (this._dataSource === value) {
            return;
        }

        this._dataSource = value;

        this.refresh();
    }

    /** Gets the filters applied to data source */
    public get dataFilters(): {[key: string]: string} {
        return this._dataFilters;
    }

    public set dataFilters(filters: {[key: string]: string}) {
        this._dataFilters = filters;

        this.refresh();
    }

    /** Gets the root node associated with this graph */
    public get rootNode(): TransformNode {
        return this._rootNode;
    }

    /** Gets or sets the name of the graph */
    public name: string; 

    /**
     * Creates a new Chart
     * @param name defines the name of the graph
     */
    constructor(name: string, scene?: Scene) {
        this.name = name;
        this._rootNode = new TransformNode(name, scene);
    }

    /** Force the graph to redraw itself */
    public abstract refresh(): Chart;
}