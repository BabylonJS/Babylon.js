//import { Quaternion, Vector3, Matrix } from "../../Maths/math";
import { INavigationEnginePlugin } from "../../Navigation/INavigationEngine";
import { Logger } from "../../Misc/logger";
//import { VertexBuffer } from "../../Meshes/buffer";
import { VertexData } from "../../Meshes/mesh.vertexData";
//import { Nullable } from "../../types";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { Scene } from "../../scene";

declare var Recast: any;

/**
 * RecastJS navigation plugin
 */
export class RecastJSPlugin implements INavigationEnginePlugin {
    /**
     * Reference to the Recast library
     */
    public bjsRECAST: any = {};
    public name: string = "RecastJSPlugin";
    private navMesh: any;
    /**
     * Initializes the recastJS plugin
     */
    public constructor(recastInjection: any = Recast) {
        this.bjsRECAST = recastInjection();

        if (!this.isSupported()) {
            Logger.Error("RecastJS is not available. Please make sure you included the js file.");
            return;
        }
        this.check();
    }

    createMavMesh(mesh: AbstractMesh): void {
        var rc = new this.bjsRECAST.rcConfig();
        this.navMesh = new this.bjsRECAST.NavMesh();
        var meshIndices = mesh.getIndices();
        var positions = mesh.getVerticesData('position');	

        Logger.Error(`mesh infos vt=${mesh.getTotalVertices()} indices = ${mesh.getTotalIndices()}`);
        this.navMesh.Build(positions, mesh.getTotalVertices(), meshIndices, mesh.getTotalIndices(), rc);
    }

    createDebugNavMesh(scene: Scene): Mesh {
        var tri: number;
        var pt: number;
        var debugNavMesh = this.navMesh.GetDebugNavMesh();
        let triangleCount = debugNavMesh.TriangleCount();
        Logger.Error(`navmesh has ${triangleCount} triangles`);

        var indices = [];
        var positions = [];
        for (tri = 0; tri < triangleCount*3; tri++) 
        {
            indices.push(tri);
            Logger.Error(`tri in=${tri}`);
        }
        for (tri = 0; tri < triangleCount; tri++) 
        {
            for (pt = 0; pt < 3 ; pt++)
            {
                let point = debugNavMesh.GetTriangle(tri).GetPoint(pt);
                positions.push(point.x(), point.y(), point.z());
                Logger.Error(`tri x=${point.x()} y=${point.y()} x=${point.z()}`);
            }
        }
        

        var mesh = new Mesh("NavMeshDebug", scene);
        var vertexData = new VertexData();

        vertexData.indices = indices;
        vertexData.positions = positions;
        vertexData.applyToMesh(mesh, false);

        

        return mesh;
    }

    /**
     * Disposes
     */
    public dispose() {
        // Dispose of world
    }

    public check() {
    }

    public isSupported(): boolean {
        return this.bjsRECAST !== undefined;
    }
}
