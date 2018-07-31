import { Nullable, TransformNode, Scene, Vector3, Engine, Observer, PointerInfo, Observable, Mesh, AbstractMesh } from "babylonjs";
import { DataSeries } from ".";
import { AdvancedDynamicTexture, TextBlock, Rectangle, TextWrapping } from "../../2D";

/** 
 * Base class for all chart controls
 * @see http://doc.babylonjs.com/how_to/chart3d#charts
 */
export abstract class Chart {
    protected _dataSource: Nullable<DataSeries>;
    protected _rootNode: TransformNode;
    protected _dataFilters: {[key: string]: string};
    private _pointerObserver: Nullable<Observer<PointerInfo>>;
    protected _scene: Scene;
    private _lastElementOver: Nullable<AbstractMesh>;
    private _labelMeshes = new Array<Mesh>();
    protected _blockRefresh = false;

    /** Observable raised when a new element is created */
    public onElementCreatedObservable  = new Observable<Mesh>();

    /**
     * Observable raised when the point picked by the pointer events changed
     */
    public onPickedPointChangedObservable = new Observable<Nullable<Vector3>>();

    /**
     * Observable raised when the pointer enters an element of the chart
    */
    public onElementEnterObservable = new Observable<AbstractMesh>();

    /**
     * Observable raised when the pointer leaves an element of the chart
     */
    public onElementOutObservable = new Observable<AbstractMesh>();

    /** User defined callback used to create labels */
    public labelCreationFunction: Nullable<(label: string, width: number, includeBackground: boolean) => Mesh>;

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

    /** Gets or sets the filters applied to data source */
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

    /** Gets or sets a value indicating if refresh function should be executed (useful when multiple changes will happen and you want to run refresh only at the end) */
    public get blockRefresh(): boolean {
        return this._blockRefresh;
    }

    public set blockRefresh(value: boolean) {
        if (this._blockRefresh === value) {
            return;
        }

        this._blockRefresh = value;

        if (value) {
            this.refresh();
        }
    }

    /** Gets or sets the name of the graph */
    public name: string; 

    /**
     * Creates a new Chart
     * @param name defines the name of the graph
     * @param scene defines the hosting scene
     */
    constructor(name: string, scene: Nullable<Scene> = Engine.LastCreatedScene) {
        this.name = name;
        this._rootNode = new TransformNode(name, scene);

        this._scene = scene!;

        this._pointerObserver = this._scene.onPointerObservable.add((pi, state) => {
            if (!pi.pickInfo || !pi.pickInfo.hit) {
                if (this._lastElementOver) {
                    this.onElementOutObservable.notifyObservers(this._lastElementOver);
                    this._lastElementOver = null;
                }

                this.onPickedPointChangedObservable.notifyObservers(null);
                return;
            }

            let metadata = pi.pickInfo.pickedMesh!.metadata;
            if (metadata && metadata.value) {
                if (this._lastElementOver !== pi.pickInfo.pickedMesh) {
                    if (this._lastElementOver) {
                        this.onElementOutObservable.notifyObservers(this._lastElementOver);
                        this._lastElementOver = null;
                    }
                    this._lastElementOver = pi.pickInfo.pickedMesh;
                    this.onElementEnterObservable.notifyObservers(this._lastElementOver!);
                }
            } else {
                if (this._lastElementOver) {
                    this.onElementOutObservable.notifyObservers(this._lastElementOver);
                    this._lastElementOver = null;
                }
            }

            this.onPickedPointChangedObservable.notifyObservers(pi.pickInfo.pickedPoint);
        });
    }

    /**
     * Function called by the chart objects when they need a label. Could be user defined if you set this.labelCreationFunction to a custom callback
     * @param label defines the text of the label
     * @param width defines the expected width (height is supposed to be 1)
     * @param includeBackground defines if a background rectangle must be added (default is true)
     * @returns a mesh used to host the label
     */
    protected _addLabel(label: string, width: number, includeBackground = true): Mesh {
        if (this.labelCreationFunction) {
            let labelMesh = this.labelCreationFunction(label, width, includeBackground);
            labelMesh.parent = this._rootNode;

            this._labelMeshes.push(labelMesh);

            return labelMesh;
        }

        let plane = Mesh.CreatePlane(label, 1, this._scene);

        this._labelMeshes.push(plane);

        plane.parent = this._rootNode;
        plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
        plane.scaling.x = width;

        let resolution = 256;
        let adt = AdvancedDynamicTexture.CreateForMesh(plane, resolution, resolution / width, false, true);
        let textBlock = new TextBlock(label, label);
        textBlock.color = "White";
        textBlock.textWrapping = TextWrapping.Ellipsis;
        textBlock.fontWeight = "Bold";
        textBlock.fontSize = 50;

        if (includeBackground) {
            let rectangle = new Rectangle(label + "Border");
            rectangle.thickness = 4;
            rectangle.color = "White";
            rectangle.background = "Black";
            rectangle.addControl(textBlock);
            adt.addControl(rectangle);
        } else {
            adt.addControl(textBlock);
        }

        return plane;
    }

    /**
     * Remove specific label mesh
     * @param label defines the label mesh to remove
     */
    protected _removeLabel(label: Mesh): void {
        let index = this._labelMeshes.indexOf(label);

        if (index === -1) {
            return;
        }

        this._labelMeshes.splice(index, 1);
        label.dispose(false, true);
    }

    /** Remove all created labels */
    protected _removeLabels(): void {
        this._labelMeshes.forEach(label => {
            label.dispose(false, true);
        });

        this._labelMeshes = [];
    }

    /** 
     * Force the chart to redraw itself 
     * @returns the current chart
    */
    public abstract refresh(): Chart;

    /** Release all associated resources */
    public dispose() {
        this.onElementCreatedObservable.clear();
        this.onPickedPointChangedObservable.clear();
        this.onElementEnterObservable.clear();
        this.onElementOutObservable.clear();

        this.labelCreationFunction = null;

        if (this._pointerObserver) {
            this._scene.onPointerObservable.remove(this._pointerObserver);
            this._pointerObserver = null;
        }

        this._rootNode.dispose();
    }

    protected _clean(): void {
        // Cleanup
        var descendants = this._rootNode.getDescendants();
        descendants.forEach(n => n.dispose());
    }
}