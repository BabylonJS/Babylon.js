import { Nullable, TransformNode, Scene, Vector3 } from "babylonjs";
import { DataSeries } from ".";

/** base class for all chart controls*/
export abstract class Chart {
    protected _dataSource: Nullable<DataSeries>;
    protected _rootNode: TransformNode;
    protected _dataFilters: {[key: string]: string};

    /** Gets or sets the rotation of the entire chart */
    public set rotation(value: Vector3) {
        this._rootNode.rotation = value;
    }

    public get rotation(): Vector3 {
        return this._rootNode.rotation;
    }

    /** Gets or sets the position of the entire chart */
    public set position(value: Vector3) {
        this._rootNode.position = value;
    }

    public get position(): Vector3 {
        return this._rootNode.position;
    }

    /** Gets or sets the scaling of the entire chart */
    public set scaling(value: Vector3) {
        this._rootNode.scaling = value;
    }

    public get scaling(): Vector3 {
        return this._rootNode.scaling;
    }

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

    protected _clean(): void {
        // Cleanup
        var descendants = this._rootNode.getDescendants();
        descendants.forEach(n => n.dispose());
    }
}