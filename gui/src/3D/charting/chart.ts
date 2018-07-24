import { DataSeries } from ".";
import { Nullable, TransformNode, Scene } from "babylonjs";

/** base class for all chart controls*/
export abstract class Chart {
    protected _dataSource: Nullable<DataSeries>;
    protected _rootNode: TransformNode;

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

    /** Gets the root node associated with this graph */
    public get rootNode(): TransformNode {
        return this._rootNode;
    }

    /** Gets or sets the name of the graph */
    public name: string; 

    /**
     * Creates a new BarGraph
     * @param name defines the name of the graph
     */
    constructor(name: string, scene?: Scene) {
        this.name = name;
        this._rootNode = new TransformNode(name, scene);
    }

    /** Force the graph to redraw itself */
    public abstract refresh(): Chart;
}