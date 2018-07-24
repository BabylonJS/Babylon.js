import { Nullable, Scene, Mesh, Observable, StandardMaterial, Material, Color3, Animation, Animatable } from "babylonjs";
import { Chart } from ".";

/** Class used to render bar graphs */
export class BarGraph extends Chart {
    private _margin = 1;
    private _barWidth = 2
    private _maxBarHeight = 10;
    private _defaultMaterial: Nullable<Material>;
    protected _ownDefaultMaterial = false;

    public onElementCreated = new Observable<Mesh>();

    /** Gets or sets the margin between bars */
    public get margin(): number {
        return this._margin;
    }

    public set margin(value: number) {
        if (this._margin === value) {
            return;
        }

        this._margin = value;

        this.refresh();
    }

    /** Gets or sets the with of each bar */
    public get barWidth(): number {
        return this._barWidth;
    }

    public set barWidth(value: number) {
        if (this._barWidth === value) {
            return;
        }

        this._barWidth = value;

        this.refresh();
    }

    /** Gets or sets the maximum height of a bar */
    public get maxBarHeight(): number {
        return this._maxBarHeight;
    }

    public set maxBarHeight(value: number) {
        if (this._maxBarHeight === value) {
            return;
        }

        this._maxBarHeight = value;

        this.refresh();
    }

    /** Gets or sets the material used by bar meshes */
    public get defaultMaterial(): Nullable<Material> {
        return this._defaultMaterial;
    }

    public set defaultMaterial(value: Nullable<Material>) {
        if (this._defaultMaterial === value) {
            return;
        }

        this._defaultMaterial = value;

        this.refresh();
    }

    /**
     * Creates a new BarGraph
     * @param name defines the name of the graph
     */
    constructor(name: string, scene?: Scene) {
        super(name, scene);
    }

    protected _createDefaultMaterial(scene: Scene): Material {
        var result = new StandardMaterial("Plastic", scene);

        result.diffuseColor = this._dataSource!.color;
        result.specularColor = Color3.Black();

        return result;
    }

    /**
     * Children class can override this function to provide a new mesh (as long as it stays inside a 1x1x1 box)
     * @param name defines the mesh name
     * @param scene defines the hosting scene
     * @returns a new mesh used to represent the current bar
     */
    protected _createBarMesh(name: string, scene: Scene): Mesh {
        var box = Mesh.CreateBox(name, 1, scene);
        box.setPivotPoint(new BABYLON.Vector3(0, -0.5, 0));

        return box;
    }

    /** Force the graph to redraw itself */
    public refresh(): BarGraph {
        // Cleanup
        var descendants = this._rootNode.getDescendants();
        descendants.forEach(n => n.dispose());

        if (!this._dataSource) {
            return this;
        }

        let scene = this._rootNode.getScene();

        // Default material
        if (!this._defaultMaterial) {
            this._defaultMaterial = this._createDefaultMaterial(scene);
        }

        // Scan data
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        this._dataSource.data.forEach(entry => {
            if (min > entry.value) {
                min = entry.value;
            }

            if (max < entry.value) {
                max = entry.value;
            }
        });

        let ratio = this.maxBarHeight / (max - min);

        // We will generate one bar per entry
        let left = -(this._dataSource.data.length / 2) * (this.barWidth + this.margin) + 1.5 * this._margin;
        let index = 0;
        this._dataSource.data.forEach(entry => {

            var barMesh = this._createBarMesh(this.name + "_box_" + index++, scene);

            barMesh.parent = this._rootNode;
            barMesh.position.x += left;
            barMesh.scaling.set(this.barWidth, 0, this._barWidth);

            Animation.CreateAndStartAnimation("entryScale", barMesh, "scaling.y", 30, 30, 0, entry.value * ratio, 0);

            barMesh.material = this._defaultMaterial;

            this.onElementCreated.notifyObservers(barMesh);

            left += this.barWidth + this.margin;
        });


        return this;
    }

    public dispose() {
        if (this._ownDefaultMaterial && this._defaultMaterial) {
            this._defaultMaterial.dispose();
            this._defaultMaterial = null;
        }

        this._rootNode.dispose();
    }
}