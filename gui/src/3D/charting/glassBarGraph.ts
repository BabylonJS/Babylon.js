import { BarGraph } from "./barGraph";
import { Scene, Material, PBRMaterial, Mesh, Vector3 } from "babylonjs";

/** Class used to render bar graphs */
export class GlassBarGraph extends BarGraph {
    private _innerMaterial: PBRMaterial;

    /**
     * Creates a new GlassBarGraph
     * @param name defines the name of the graph
     */
    constructor(name: string, scene?: Scene) {
        super(name, scene);

        this.onElementCreated.add(mesh => {
            // Clone the mesh
            var innerMesh = mesh.clone("Inner", mesh);
            innerMesh.material = this._innerMaterial;

            innerMesh.scaling = new Vector3(1, 1, 1);
            innerMesh.position = Vector3.Zero();

            mesh.alphaIndex = 0;
            innerMesh.alphaIndex = 1;
        });
    }

    protected _createBarMesh(name: string, scene: Scene): Mesh {
        var path = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 1.0, 0.0),
        ];        

        var tube = BABYLON.MeshBuilder.CreateTube("tube", {
            path: path, 
            tessellation:16, 
            cap: Mesh.CAP_ALL,
            radius: 0.5}, scene);

        return tube;
    }    

    protected _createDefaultMaterial(scene: Scene): Material {
        var result = new PBRMaterial("OuterGlass", scene);
        const dataSource = this.dataSource;
        
        let reflectionTexture = scene.environmentTexture;
        if (!reflectionTexture) {
            reflectionTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://assets.babylonjs.com/environments/environmentSpecular.env", scene);
        }

        // Outside material
        result.alphaMode = BABYLON.Engine.ALPHA_SCREENMODE;
        result.reflectionTexture = reflectionTexture;
        result.alpha = 0.0;
        result.directIntensity = 1.0;
        result.environmentIntensity = 1.0;
        result.microSurface = 1;
        result.useAlphaFresnel = true;
        result.reflectivityColor = new BABYLON.Color3(0.01, 0.01, 0.01);
        result.albedoColor = new BABYLON.Color3(0, 0, 0);

        this._innerMaterial = new PBRMaterial("InnerGlass", scene);;
        this._innerMaterial.alphaMode = BABYLON.Engine.ALPHA_MULTIPLY;
        this._innerMaterial.alpha = 0;
        this._innerMaterial.directIntensity = 1.0;
        this._innerMaterial.environmentIntensity = 1.0;
        this._innerMaterial.microSurface = 0.0;
        this._innerMaterial.reflectivityColor = new BABYLON.Color3(0, 0, 0);

        if (dataSource) {
            this._innerMaterial.albedoColor = dataSource.color;
        }

        return result;
    }

    public dispose() {
        super.dispose();
        this._innerMaterial.dispose();
    }
}