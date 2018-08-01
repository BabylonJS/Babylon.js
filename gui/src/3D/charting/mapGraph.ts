import { Chart } from ".";
import { Engine, Scene, Nullable, Mesh, Animation, StandardMaterial, Texture, Matrix, Material, Observer, Vector3 } from "babylonjs";
import { FluentMaterial } from "../materials";

/** 
 * Class used to render bar graphs 
 * @see http://doc.babylonjs.com/how_to/chart3d#mapgraph
 */
export class MapGraph extends Chart {

    private _cylinderMeshes: Nullable<Array<Mesh>>;
    private _cylinderRadius = 0.5;    
    private _maxCylinderHeight = 10;
    private _worldMap: Nullable<Mesh>;
    private _mercatorMaterial: Nullable<StandardMaterial>;
    private _worldMapSize = 40;   
    private _pickedPointObserver: Nullable<Observer<Vector3>>;    
    private _defaultMaterial: Nullable<Material>;

    /** Gets or sets the radius of each cylinder */
    public get cylinderRadius(): number {
        return this._cylinderRadius;
    }

    public set cylinderRadius(value: number) {
        if (this._cylinderRadius === value) {
            return;
        }

        this._cylinderRadius = value;

        this.refresh();
    }
    
    /** Gets or sets the size of the world map (this will define the width) */
    public get worldMapSize(): number {
        return this._worldMapSize;
    }

    public set worldMapSize(value: number) {
        if (this._worldMapSize === value) {
            return;
        }

        this._worldMapSize = value;

        this.refresh();
    }    
    
    /**
     * Creates a new MapGraph
     * @param name defines the name of the graph
     * @param scene defines the hosting scene
     */
    constructor(name: string, mapUrl: string, scene: Nullable<Scene> = Engine.LastCreatedScene) {
        super(name, scene);

        this._mercatorMaterial = new StandardMaterial("WorldMap", scene!);
        this._mercatorMaterial.emissiveTexture = new Texture(mapUrl, scene, false, true, Texture.LINEAR_LINEAR_MIPLINEAR, () => {
            this.refresh();
        });
        this._mercatorMaterial.disableLighting = true;
        this._mercatorMaterial.backFaceCulling = false;
    }

    protected _createCylinderMesh(name: string, scene: Scene): Mesh {
        var cylinder = Mesh.CreateCylinder(name, 1, 1, 1, 16, 1, scene);
        cylinder.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);

        return cylinder;
    }

    protected _createDefaultMaterial(scene: Scene): Material {
        var result = new FluentMaterial("fluent", scene);
        result.albedoColor = this._dataSource!.color.scale(0.5);
        result.innerGlowColorIntensity = 0.6;
        result.renderHoverLight = true;
        result.hoverRadius = 5;

        this._pickedPointObserver = this.onPickedPointChangedObservable.add(pickedPoint => {
            if (pickedPoint) {
                result.hoverPosition = pickedPoint;
                result.hoverColor.a = 1.0;
            } else {
                result.hoverColor.a = 0;
            }
        });

        return result;
    }

    public refresh(): MapGraph {
        if (this._blockRefresh || !this._mercatorMaterial || !this._mercatorMaterial.emissiveTexture!.isReady()) {
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
        if (!this._cylinderMeshes || this._cylinderMeshes.length !== data.length) {
            this._clean();
            createMesh = true;
            this._cylinderMeshes = [];
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

        let ratio = this._maxCylinderHeight / (max - min);     
        
        const worldMaptextureSize = this._mercatorMaterial.emissiveTexture!.getSize();
        const worldMapWidth = this._worldMapSize;
        const worldMapHeight = worldMapWidth * worldMaptextureSize.height / worldMaptextureSize.width;

        if (this._worldMap) {
            this._worldMap.dispose();
        }

        this._worldMap = Mesh.CreateGround("WorldMap", worldMapWidth, worldMapHeight, 1, scene);
        this._worldMap.parent = this._rootNode;
        this._worldMap.material = this._mercatorMaterial;

        // Default material
        if (!this._defaultMaterial) {
            this._defaultMaterial = this._createDefaultMaterial(scene);
        }        
        
        // We will generate one cylinder per entry
        let index = 0;
        data.forEach(entry => {

            var cylinderMesh: Mesh;
            if (createMesh) {
                cylinderMesh = this._createCylinderMesh(this.name + "_cylinder_" + index++, scene);
                cylinderMesh.enablePointerMoveEvents = true;
                this._cylinderMeshes!.push(cylinderMesh);
            } else {
                cylinderMesh = this._cylinderMeshes![index++];
            }

            cylinderMesh.material = this._defaultMaterial;
            cylinderMesh.metadata = entry;
            cylinderMesh.parent = this._rootNode;
            let currentScalingYState = cylinderMesh.scaling.y;
            cylinderMesh.scaling.set(this._cylinderRadius, 0, this._cylinderRadius);

            // Lat/long convertion
            const latitude: number = entry.latitude;
            const longitude: number = entry.longitude;
            const x = (longitude + 180) * (worldMapWidth / 360) - worldMapWidth / 2;
            const latRad = latitude * Math.PI / 180;
            const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
            const z = worldMapWidth * mercN / (2 * Math.PI);
            cylinderMesh.position.set(x, 0, z);

            var easing = new BABYLON.CircleEase();
            Animation.CreateAndStartAnimation("entryScale", cylinderMesh, "scaling.y", 30, 30, currentScalingYState, entry.value * ratio, 0, easing);

            this.onElementCreatedObservable.notifyObservers(cylinderMesh);
        });

        this.onRefreshObservable.notifyObservers(this);
    
        return this;
    }

    protected _clean(): void {
        super._clean();
        this._worldMap = null;
        this._cylinderMeshes = null;
    }
    
    /** Clean associated resources */
    public dispose() {
        super.dispose();
        if (this._pickedPointObserver) {
            this.onPickedPointChangedObservable.remove(this._pickedPointObserver);
            this._pickedPointObserver = null;
        }
    }
}