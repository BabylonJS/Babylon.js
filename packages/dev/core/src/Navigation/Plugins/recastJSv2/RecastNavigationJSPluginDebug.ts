import { StandardMaterial } from "../../../Materials/standardMaterial";
import type { GreasedLineMaterialOptions } from "../../../Materials/GreasedLine/greasedLineMaterialInterfaces";
import type { GreasedLineMeshOptions } from "../../../Meshes/GreasedLine/greasedLineBaseMesh";
import { Color3 } from "../../../Maths/math.color";
import { CreateDisc } from "../../../Meshes/Builders/discBuilder";
import { Mesh } from "../../../Meshes/mesh";
import { Matrix } from "../../../Maths/math.vector";
import { CreateGreasedLine } from "../../../Meshes/Builders/greasedLineBuilder";
import { VertexData } from "../../../Meshes/mesh.vertexData";
import { TransformNode } from "../../../Meshes/transformNode";

import type {
    DebugDrawerPrimitive,
    NavMesh,
    NavMeshQuery,
    RecastCompactHeightfield,
    RecastContourSet,
    RecastHeightfield,
    RecastHeightfieldLayer,
    RecastHeightfieldLayerSet,
    RecastPolyMesh,
    RecastPolyMeshDetail,
} from "recast-navigation";
import { DebugDrawerUtils } from "recast-navigation";

export const NavMeshDebugName = "nav-mesh-debug";

/**
 *
 */
export class RecastNavigationJSPluginDebug {
    /**
     *
     */
    public triMaterial: StandardMaterial;
    /**
     *
     */
    public pointMaterial: StandardMaterial;
    /**
     *
     */
    public lineMaterials: StandardMaterial[] = [];
    private _pointMesh: Mesh;

    /**
     *
     */
    public debugDrawerParent = new TransformNode("debugDrawerParent");

    private _debugDrawerUtils: DebugDrawerUtils;
    constructor(materials?: {
        triMaterial?: StandardMaterial;
        pointMaterial?: StandardMaterial;
        lineMaterials: {
            /**
             *
             */
            graasedLineMaterialOptions: GreasedLineMaterialOptions;
            graasedLineMeshlOptions: GreasedLineMeshOptions;
        };
    }) {
        this._debugDrawerUtils = new DebugDrawerUtils();

        this.debugDrawerParent.position.y += 0.01;

        if (materials?.triMaterial) {
            this.triMaterial = materials.triMaterial;
        } else {
            this.triMaterial = new StandardMaterial("triMaterial");
            this.triMaterial.backFaceCulling = false;
            this.triMaterial.specularColor = Color3.Black();
        }

        if (materials?.pointMaterial) {
            this.pointMaterial = materials.pointMaterial;
        } else {
            this.pointMaterial = new StandardMaterial("pointMaterial");
            this.pointMaterial.backFaceCulling = false;
            this.pointMaterial.specularColor = Color3.Black();
        }

        this._pointMesh = CreateDisc("point", { radius: 0.02, tessellation: 8 });
        this._pointMesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
    }

    public reset() {
        for (const child of this.debugDrawerParent.getChildMeshes()) {
            child.dispose();
        }
    }

    public dispose() {
        this.reset();
        this._debugDrawerUtils.dispose();
        this._pointMesh.dispose();
        this.triMaterial.dispose();
        this.pointMaterial.dispose();
        for (const m of this.lineMaterials) {
            m.dispose();
        }
    }

    public drawPrimitives(primitives: DebugDrawerPrimitive[]) {
        for (const primitive of primitives) {
            switch (primitive.type) {
                case "points":
                    this._drawPoints(primitive);
                    break;
                case "lines":
                    this._drawLines(primitive);
                    break;
                case "tris":
                    this._drawTris(primitive);
                    break;
                case "quads":
                    this._drawQuads(primitive);
                    break;
            }
        }
    }

    public drawHeightfieldSolid(hf: RecastHeightfield): void {
        const primitives = this._debugDrawerUtils.drawHeightfieldSolid(hf);
        this.drawPrimitives(primitives);
    }

    public drawHeightfieldWalkable(hf: RecastHeightfield): void {
        const primitives = this._debugDrawerUtils.drawHeightfieldWalkable(hf);
        this.drawPrimitives(primitives);
    }

    public drawCompactHeightfieldSolid(chf: RecastCompactHeightfield): void {
        const primitives = this._debugDrawerUtils.drawCompactHeightfieldSolid(chf);
        this.drawPrimitives(primitives);
    }

    public drawCompactHeightfieldRegions(chf: RecastCompactHeightfield): void {
        const primitives = this._debugDrawerUtils.drawCompactHeightfieldRegions(chf);
        this.drawPrimitives(primitives);
    }

    public drawCompactHeightfieldDistance(chf: RecastCompactHeightfield): void {
        const primitives = this._debugDrawerUtils.drawCompactHeightfieldDistance(chf);
        this.drawPrimitives(primitives);
    }

    public drawHeightfieldLayer(layer: RecastHeightfieldLayer, idx: number): void {
        const primitives = this._debugDrawerUtils.drawHeightfieldLayer(layer, idx);
        this.drawPrimitives(primitives);
    }

    public drawHeightfieldLayers(lset: RecastHeightfieldLayerSet): void {
        const primitives = this._debugDrawerUtils.drawHeightfieldLayers(lset);
        this.drawPrimitives(primitives);
    }

    public drawRegionConnections(cset: RecastContourSet, alpha: number = 1): void {
        const primitives = this._debugDrawerUtils.drawRegionConnections(cset, alpha);
        this.drawPrimitives(primitives);
    }

    public drawRawContours(cset: RecastContourSet, alpha: number = 1): void {
        const primitives = this._debugDrawerUtils.drawRawContours(cset, alpha);
        this.drawPrimitives(primitives);
    }

    public drawContours(cset: RecastContourSet, alpha: number = 1): void {
        const primitives = this._debugDrawerUtils.drawContours(cset, alpha);
        this.drawPrimitives(primitives);
    }

    public drawPolyMesh(mesh: RecastPolyMesh): void {
        const primitives = this._debugDrawerUtils.drawPolyMesh(mesh);
        this.drawPrimitives(primitives);
    }

    public drawPolyMeshDetail(dmesh: RecastPolyMeshDetail): void {
        const primitives = this._debugDrawerUtils.drawPolyMeshDetail(dmesh);
        this.drawPrimitives(primitives);
    }

    public drawNavMesh(mesh: NavMesh, flags: number = 0): void {
        const primitives = this._debugDrawerUtils.drawNavMesh(mesh, flags);
        this.drawPrimitives(primitives);
    }

    // todo:
    // - drawTileCacheLayerAreas
    // - drawTileCacheLayerRegions
    // - drawTileCacheContours
    // - drawTileCachePolyMesh

    public drawNavMeshWithClosedList(mesh: NavMesh, query: NavMeshQuery, flags: number = 0): void {
        const primitives = this._debugDrawerUtils.drawNavMeshWithClosedList(mesh, query, flags);
        this.drawPrimitives(primitives);
    }

    public drawNavMeshNodes(query: NavMeshQuery): void {
        const primitives = this._debugDrawerUtils.drawNavMeshNodes(query);
        this.drawPrimitives(primitives);
    }

    public drawNavMeshBVTree(mesh: NavMesh): void {
        const primitives = this._debugDrawerUtils.drawNavMeshBVTree(mesh);
        this.drawPrimitives(primitives);
    }

    public drawNavMeshPortals(mesh: NavMesh): void {
        const primitives = this._debugDrawerUtils.drawNavMeshPortals(mesh);
        this.drawPrimitives(primitives);
    }

    public drawNavMeshPolysWithFlags(mesh: NavMesh, flags: number, col: number): void {
        const primitives = this._debugDrawerUtils.drawNavMeshPolysWithFlags(mesh, flags, col);
        this.drawPrimitives(primitives);
    }

    public drawNavMeshPoly(mesh: NavMesh, ref: number, col: number): void {
        const primitives = this._debugDrawerUtils.drawNavMeshPoly(mesh, ref, col);
        this.drawPrimitives(primitives);
    }

    private _drawPoints(primitive: DebugDrawerPrimitive): void {
        if (primitive.vertices.length === 0) {
            return;
        }

        const matricesData = new Float32Array(16 * primitive.vertices.length);
        const colorData = new Float32Array(4 * primitive.vertices.length);

        for (let i = 0; i < primitive.vertices.length; i++) {
            const [x, y, z, r, g, b, a] = primitive.vertices[i];

            colorData[i * 4] = r;
            colorData[i * 4 + 1] = g;
            colorData[i * 4 + 2] = b;
            colorData[i * 4 + 3] = a;

            const matrix = Matrix.Translation(x, y, z);
            matrix.copyToArray(matricesData, i * 16);
        }

        this._pointMesh.thinInstanceSetBuffer("matrix", matricesData, 16);
        this._pointMesh.thinInstanceSetBuffer("color", colorData, 4);

        this._pointMesh.parent = this.debugDrawerParent;
    }

    private _drawLines(primitive: DebugDrawerPrimitive): void {
        if (primitive.vertices.length === 0) {
            return;
        }

        const points: number[][] = [];
        const colors: Color3[] = [];

        for (let i = 0; i < primitive.vertices.length; i += 2) {
            const [x1, y1, z1, r1, g1, b1] = primitive.vertices[i];
            const [x2, y2, z2, r2, g2, b2] = primitive.vertices[i + 1];

            points.push([x1, y1, z1, x2, y2, z2]);

            colors.push(new Color3(r1, g1, b1));
            colors.push(new Color3(r2, g2, b2));
        }

        const lines = CreateGreasedLine(
            "debugLines",
            {
                points,
            },
            {
                colors,
                width: 0.2,
            }
        );

        lines.parent = this.debugDrawerParent;
        this.lineMaterials.push(lines.material as StandardMaterial);
    }

    private _drawTris(primitive: DebugDrawerPrimitive): void {
        if (primitive.vertices.length === 0) {
            return;
        }

        const positions = new Float32Array(primitive.vertices.length * 3);
        const colors = new Float32Array(primitive.vertices.length * 4);

        for (let i = 0; i < primitive.vertices.length; i++) {
            const [x, y, z, r, g, b] = primitive.vertices[i];
            positions[i * 3 + 0] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            colors[i * 4 + 0] = r;
            colors[i * 4 + 1] = g;
            colors[i * 4 + 2] = b;
            colors[i * 4 + 3] = 1;
        }

        const vertexData = new VertexData();

        vertexData.positions = positions;
        vertexData.colors = colors;

        const customMesh = new Mesh(NavMeshDebugName);
        customMesh.isUnIndexed = true;
        vertexData.applyToMesh(customMesh);

        customMesh.material = this.triMaterial;

        customMesh.parent = this.debugDrawerParent;
    }

    private _drawQuads(primitive: DebugDrawerPrimitive): void {
        if (primitive.vertices.length === 0) {
            return;
        }

        const positions: number[] = [];
        const colors: number[] = [];
        for (let i = 0; i < primitive.vertices.length; i += 4) {
            const vertices = [
                primitive.vertices[i],
                primitive.vertices[i + 1],
                primitive.vertices[i + 2],
                primitive.vertices[i],
                primitive.vertices[i + 2],
                primitive.vertices[i + 3],
            ];
            for (const [x, y, z, r, g, b] of vertices) {
                positions.push(x, y, z);
                colors.push(r, g, b, 1);
            }
        }

        const vertexData = new VertexData();

        vertexData.positions = positions;
        vertexData.colors = colors;

        const customMesh = new Mesh("custom");
        customMesh.isUnIndexed = true;
        vertexData.applyToMesh(customMesh);

        customMesh.material = this.triMaterial;

        customMesh.parent = this.debugDrawerParent;
    }
}
