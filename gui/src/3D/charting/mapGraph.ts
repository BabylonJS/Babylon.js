import { Chart } from ".";
import { Engine, Scene, Nullable, Mesh, Animation, StandardMaterial, Texture } from "babylonjs";

/** 
 * Class used to render bar graphs 
 * @see http://doc.babylonjs.com/how_to/chart3d#mapgraph
 */
export class MapGraph extends Chart {

    private _barMeshes: Nullable<Array<Mesh>>;
    private _barWidth = 0.5;    
    private _maxBarHeight = 10;
    private _worldMap: Nullable<Mesh>;
    private _mercatorMaterial: Nullable<StandardMaterial>;
    
    /**
     * Creates a new MapGraph
     * @param name defines the name of the graph
     * @param scene defines the hosting scene
     */
    constructor(name: string, mapUrl: string, scene: Nullable<Scene> = Engine.LastCreatedScene) {
        super(name, scene);

        this._mercatorMaterial = new StandardMaterial("WorldMap", scene!);
        this._mercatorMaterial.emissiveTexture = new Texture(mapUrl, scene);
        this._mercatorMaterial.disableLighting = true;
    }

    protected _createBarMesh(name: string, scene: Scene): Mesh {
        var box = Mesh.CreateBox(name, 1, scene);
        box.setPivotPoint(new BABYLON.Vector3(0, -0.5, 0));

        return box;
    }

    public refresh(): MapGraph {
        if (this._blockRefresh) {
            return this;
        }

        if (!this._dataSource) {
            this._clean();
            return this;
        }

        const scene = this._rootNode.getScene();
        const data = this._dataFilters ? this._dataSource.getFilteredData(this._dataFilters) : this._dataSource.data;
        let createMesh = false;

        // Do we need to create new graph or animate the current one
        if (!this._barMeshes || this._barMeshes.length !== data.length) {
            this._clean();
            createMesh = true;
            this._barMeshes = [];
        }      

        // Scan data
        let min = 0;
        let max = Number.MIN_VALUE;

        // Check the limit of the entire series
        this._dataSource.data.forEach(entry => {
            if (min > entry.value) {
                min = entry.value;
            }

            if (max < entry.value) {
                max = entry.value;
            }
        });

        let ratio = this._maxBarHeight / (max - min);     
        
        const worldMapWidth = 40;
        const worldMapHeight = 20;

        if (this._worldMap) {
            this._worldMap.dispose();
        }

        this._worldMap = Mesh.CreateGround("WorldMap", worldMapWidth, worldMapHeight, 1, scene);
        this._worldMap.parent = this._rootNode;
        this._worldMap.material = this._mercatorMaterial;
        
        // We will generate one bar per entry
        let index = 0;
        data.forEach(entry => {

            var barMesh: Mesh;
            if (createMesh) {
                barMesh = this._createBarMesh(this.name + "_box_" + index++, scene);
                barMesh.enablePointerMoveEvents = true;
                this._barMeshes!.push(barMesh);
            } else {
                barMesh = this._barMeshes![index++];
            }

            barMesh.metadata = entry;
            barMesh.parent = this._worldMap;
            let currentScalingYState = barMesh.scaling.y;
            barMesh.scaling.set(this._barWidth, 0, this._barWidth);

            // Lat/long convertion
            const latitude: number = entry.latitude;
            const longitude: number = entry.longitude;
            const x = (longitude + 180) * (worldMapWidth / 360) - worldMapWidth / 2;
            const latRad = latitude * Math.PI / 180;
            const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
            const z = worldMapWidth * mercN / (2 * Math.PI);
            barMesh.position.set(x, 0, z);

            var easing = new BABYLON.CircleEase();
            Animation.CreateAndStartAnimation("entryScale", barMesh, "scaling.y", 30, 30, currentScalingYState, entry.value * ratio, 0, easing);

            this.onElementCreatedObservable.notifyObservers(barMesh);
        });
    
        return this;
    }


    protected _clean(): void {
        super._clean();
        this._barMeshes = null;
    }    
}