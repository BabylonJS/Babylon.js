import { DataSeries } from "./dataSeries";
import { TransformNode } from "babylonjs";

export interface IGraph {
    /** Gets the root node associated with this graph */
    rootNode: TransformNode;

    /** Gets or sets the data source used by the graph */
    dataSource: DataSeries;

    /** Gets or sets the name of the graph */
    name: string;

    /** 
     * Force the graph to redraw itself
     * @returns the current graph 
     */
    refresh(): IGraph;
}