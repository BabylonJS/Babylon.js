import type { Nullable, FloatArray, IndicesArray } from "../types";
import type { Scene } from "../scene";
import { Quaternion, Matrix, Vector3, Vector2 } from "../Maths/math.vector";
import { VertexBuffer } from "../Buffers/buffer";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { SubMesh } from "../Meshes/subMesh";
import { Mesh } from "../Meshes/mesh";
import type { Material } from "../Materials/material";
import { Color4 } from "../Maths/math.color";
import { Constants } from "../Engines/constants";
import { VertexData } from "./mesh.vertexData";
/**
 * Unique ID when we import meshes from Babylon to CSG
 */
let currentCSGMeshId = 0;

/**
 * Represents a vertex of a polygon. Use your own vertex class instead of this
 * one to provide additional features like texture coordinates and vertex
 * colors. Custom vertex classes need to provide a `pos` property and `clone()`,
 * `flip()`, and `interpolate()` methods that behave analogous to the ones
 * defined by `BABYLON.CSG.Vertex`. This class provides `normal` so convenience
 * functions like `BABYLON.CSG.sphere()` can return a smooth vertex normal, but `normal`
 * is not used anywhere else.
 * Same goes for uv, it allows to keep the original vertex uv coordinates of the 2 meshes
 */
class Vertex {
    /**
     * Initializes the vertex
     * @param pos The position of the vertex
     * @param normal The normal of the vertex
     * @param uv The texture coordinate of the vertex
     * @param vertColor The RGBA color of the vertex
     */
    constructor(
        /**
         * The position of the vertex
         */
        public pos: Vector3,
        /**
         * The normal of the vertex
         */
        public normal: Vector3,
        /**
         * The texture coordinate of the vertex
         */
        public uv?: Vector2,
        /**
         * The texture coordinate of the vertex
         */
        public vertColor?: Color4
    ) {}

    /**
     * Make a clone, or deep copy, of the vertex
     * @returns A new Vertex
     */
    public clone(): Vertex {
        return new Vertex(this.pos.clone(), this.normal.clone(), this.uv?.clone(), this.vertColor?.clone());
    }

    /**
     * Invert all orientation-specific data (e.g. vertex normal). Called when the
     * orientation of a polygon is flipped.
     */
    public flip(): void {
        this.normal = this.normal.scale(-1);
    }

    /**
     * Create a new vertex between this vertex and `other` by linearly
     * interpolating all properties using a parameter of `t`. Subclasses should
     * override this to interpolate additional properties.
     * @param other the vertex to interpolate against
     * @param t The factor used to linearly interpolate between the vertices
     * @returns The new interpolated vertex
     */
    public interpolate(other: Vertex, t: number): Vertex {
        return new Vertex(
            Vector3.Lerp(this.pos, other.pos, t),
            Vector3.Lerp(this.normal, other.normal, t),
            this.uv && other.uv ? Vector2.Lerp(this.uv, other.uv, t) : undefined,
            this.vertColor && other.vertColor ? Color4.Lerp(this.vertColor, other.vertColor, t) : undefined
        );
    }
}

/**
 * Represents a plane in 3D space.
 */
class CSGPlane {
    /**
     * Initializes the plane
     * @param normal The normal for the plane
     * @param w
     */
    constructor(
        public normal: Vector3,
        public w: number
    ) {}

    /**
     * `CSG.Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
     * point is on the plane
     */
    static EPSILON = 1e-5;

    /**
     * Construct a plane from three points
     * @param a Point a
     * @param b Point b
     * @param c Point c
     * @returns A new plane
     */
    public static FromPoints(a: Vector3, b: Vector3, c: Vector3): Nullable<CSGPlane> {
        const v0 = c.subtract(a);
        const v1 = b.subtract(a);

        if (v0.lengthSquared() === 0 || v1.lengthSquared() === 0) {
            return null;
        }

        const n = Vector3.Normalize(Vector3.Cross(v0, v1));
        return new CSGPlane(n, Vector3.Dot(n, a));
    }

    /**
     * Clone, or make a deep copy of the plane
     * @returns a new Plane
     */
    public clone(): CSGPlane {
        return new CSGPlane(this.normal.clone(), this.w);
    }

    /**
     * Flip the face of the plane
     */
    public flip() {
        this.normal.scaleInPlace(-1);
        this.w = -this.w;
    }

    /**
     * Split `polygon` by this plane if needed, then put the polygon or polygon
     * fragments in the appropriate lists. Coplanar polygons go into either
    `* coplanarFront` or `coplanarBack` depending on their orientation with
     * respect to this plane. Polygons in front or in back of this plane go into
     * either `front` or `back`
     * @param polygon The polygon to be split
     * @param coplanarFront Will contain polygons coplanar with the plane that are oriented to the front of the plane
     * @param coplanarBack Will contain polygons coplanar with the plane that are oriented to the back of the plane
     * @param front Will contain the polygons in front of the plane
     * @param back Will contain the polygons begind the plane
     */
    public splitPolygon(polygon: CSGPolygon, coplanarFront: CSGPolygon[], coplanarBack: CSGPolygon[], front: CSGPolygon[], back: CSGPolygon[]): void {
        const COPLANAR = 0;
        const FRONT = 1;
        const BACK = 2;
        const SPANNING = 3;

        // Classify each point as well as the entire polygon into one of the above
        // four classes.
        let polygonType = 0;
        const types = [];
        let i: number;
        let t: number;
        for (i = 0; i < polygon.vertices.length; i++) {
            t = Vector3.Dot(this.normal, polygon.vertices[i].pos) - this.w;
            const type = t < -CSGPlane.EPSILON ? BACK : t > CSGPlane.EPSILON ? FRONT : COPLANAR;
            polygonType |= type;
            types.push(type);
        }

        // Put the polygon in the correct list, splitting it when necessary
        switch (polygonType) {
            case COPLANAR:
                (Vector3.Dot(this.normal, polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
                break;
            case FRONT:
                front.push(polygon);
                break;
            case BACK:
                back.push(polygon);
                break;
            case SPANNING: {
                const f = [],
                    b = [];
                for (i = 0; i < polygon.vertices.length; i++) {
                    const j = (i + 1) % polygon.vertices.length;
                    const ti = types[i],
                        tj = types[j];
                    const vi = polygon.vertices[i],
                        vj = polygon.vertices[j];
                    if (ti !== BACK) {
                        f.push(vi);
                    }
                    if (ti !== FRONT) {
                        b.push(ti !== BACK ? vi.clone() : vi);
                    }
                    if ((ti | tj) === SPANNING) {
                        t = (this.w - Vector3.Dot(this.normal, vi.pos)) / Vector3.Dot(this.normal, vj.pos.subtract(vi.pos));
                        const v = vi.interpolate(vj, t);
                        f.push(v);
                        b.push(v.clone());
                    }
                }
                let poly: CSGPolygon;
                if (f.length >= 3) {
                    poly = new CSGPolygon(f, polygon.shared);
                    if (poly.plane) {
                        front.push(poly);
                    }
                }

                if (b.length >= 3) {
                    poly = new CSGPolygon(b, polygon.shared);

                    if (poly.plane) {
                        back.push(poly);
                    }
                }

                break;
            }
        }
    }
}

/**
 * Represents a convex polygon. The vertices used to initialize a polygon must
 * be coplanar and form a convex loop.
 *
 * Each convex polygon has a `shared` property, which is shared between all
 * polygons that are clones of each other or were split from the same polygon.
 * This can be used to define per-polygon properties (such as surface color)
 */
class CSGPolygon {
    /**
     * Vertices of the polygon
     */
    public vertices: Vertex[];
    /**
     * Properties that are shared across all polygons
     */
    public shared: any;
    /**
     * A plane formed from the vertices of the polygon
     */
    public plane: CSGPlane;

    /**
     * Initializes the polygon
     * @param vertices The vertices of the polygon
     * @param shared The properties shared across all polygons
     */
    constructor(vertices: Vertex[], shared: any) {
        this.vertices = vertices;
        this.shared = shared;
        this.plane = <CSGPlane>CSGPlane.FromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
    }

    /**
     * Clones, or makes a deep copy, or the polygon
     * @returns A new CSGPolygon
     */
    public clone(): CSGPolygon {
        const vertices = this.vertices.map((v) => v.clone());
        return new CSGPolygon(vertices, this.shared);
    }

    /**
     * Flips the faces of the polygon
     */
    public flip() {
        this.vertices.reverse().map((v) => {
            v.flip();
        });
        this.plane.flip();
    }
}

/**
 * Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
 * by picking a polygon to split along. That polygon (and all other coplanar
 * polygons) are added directly to that node and the other polygons are added to
 * the front and/or back subtrees. This is not a leafy BSP tree since there is
 * no distinction between internal and leaf nodes
 */
class Node {
    private _plane: Nullable<CSGPlane> = null;
    private _front: Nullable<Node> = null;
    private _back: Nullable<Node> = null;
    private _polygons = new Array<CSGPolygon>();

    /**
     * Initializes the node
     * @param polygons A collection of polygons held in the node
     */
    constructor(polygons?: Array<CSGPolygon>) {
        if (polygons) {
            this.build(polygons);
        }
    }

    /**
     * Clones, or makes a deep copy, of the node
     * @returns The cloned node
     */
    public clone(): Node {
        const node = new Node();
        node._plane = this._plane && this._plane.clone();
        node._front = this._front && this._front.clone();
        node._back = this._back && this._back.clone();
        node._polygons = this._polygons.map((p) => p.clone());
        return node;
    }

    /**
     * Convert solid space to empty space and empty space to solid space
     */
    public invert(): void {
        for (let i = 0; i < this._polygons.length; i++) {
            this._polygons[i].flip();
        }
        if (this._plane) {
            this._plane.flip();
        }
        if (this._front) {
            this._front.invert();
        }
        if (this._back) {
            this._back.invert();
        }
        const temp = this._front;
        this._front = this._back;
        this._back = temp;
    }

    /**
     * Recursively remove all polygons in `polygons` that are inside this BSP
     * tree.
     * @param polygons Polygons to remove from the BSP
     * @returns Polygons clipped from the BSP
     */
    clipPolygons(polygons: CSGPolygon[]): CSGPolygon[] {
        if (!this._plane) {
            return polygons.slice();
        }
        let front: CSGPolygon[] = [],
            back = [] as CSGPolygon[];
        for (let i = 0; i < polygons.length; i++) {
            this._plane.splitPolygon(polygons[i], front, back, front, back);
        }
        if (this._front) {
            front = this._front.clipPolygons(front);
        }
        if (this._back) {
            back = this._back.clipPolygons(back);
        } else {
            back = [];
        }
        return front.concat(back);
    }

    /**
     * Remove all polygons in this BSP tree that are inside the other BSP tree
     * `bsp`.
     * @param bsp BSP containing polygons to remove from this BSP
     */
    clipTo(bsp: Node): void {
        this._polygons = bsp.clipPolygons(this._polygons);
        if (this._front) {
            this._front.clipTo(bsp);
        }
        if (this._back) {
            this._back.clipTo(bsp);
        }
    }

    /**
     * Return a list of all polygons in this BSP tree
     * @returns List of all polygons in this BSP tree
     */
    allPolygons(): CSGPolygon[] {
        let polygons = this._polygons.slice();
        if (this._front) {
            polygons = polygons.concat(this._front.allPolygons());
        }
        if (this._back) {
            polygons = polygons.concat(this._back.allPolygons());
        }
        return polygons;
    }

    /**
     * Build a BSP tree out of `polygons`. When called on an existing tree, the
     * new polygons are filtered down to the bottom of the tree and become new
     * nodes there. Each set of polygons is partitioned using the first polygon
     * (no heuristic is used to pick a good split)
     * @param polygons Polygons used to construct the BSP tree
     */
    build(polygons: CSGPolygon[]): void {
        if (!polygons.length) {
            return;
        }
        if (!this._plane) {
            this._plane = polygons[0].plane.clone();
        }
        const front: CSGPolygon[] = [],
            back = [] as CSGPolygon[];
        for (let i = 0; i < polygons.length; i++) {
            this._plane.splitPolygon(polygons[i], this._polygons, this._polygons, front, back);
        }
        if (front.length) {
            if (!this._front) {
                this._front = new Node();
            }
            this._front.build(front);
        }
        if (back.length) {
            if (!this._back) {
                this._back = new Node();
            }
            this._back.build(back);
        }
    }
}

/**
 * Class for building Constructive Solid Geometry
 */
export class CSG {
    private _polygons = new Array<CSGPolygon>();
    /**
     * The world matrix
     */
    public matrix: Matrix;
    /**
     * Stores the position
     */
    public position: Vector3;
    /**
     * Stores the rotation
     */
    public rotation: Vector3;
    /**
     * Stores the rotation quaternion
     */
    public rotationQuaternion: Nullable<Quaternion>;
    /**
     * Stores the scaling vector
     */
    public scaling: Vector3;

    /**
     * Convert a VertexData to CSG
     * @param data defines the VertexData to convert to CSG
     * @returns the new CSG
     */
    public static FromVertexData(data: VertexData): CSG {
        let vertex: Vertex, polygon: CSGPolygon, vertices: Vertex[];
        const polygons: CSGPolygon[] = [];

        const indices = data.indices;
        const positions = data.positions;
        const normals = data.normals;
        const uvs = data.uvs;
        const vertColors = data.colors;

        if (!indices || !positions) {
            // eslint-disable-next-line no-throw-literal
            throw "BABYLON.CSG: VertexData must at least contain positions and indices";
        }

        for (let i = 0; i < indices.length; i += 3) {
            vertices = [];
            for (let j = 0; j < 3; j++) {
                const indexIndices = i + j;
                const offset = indices[indexIndices];

                const normal = normals ? Vector3.FromArray(normals, offset * 3) : Vector3.Zero();
                const uv = uvs ? Vector2.FromArray(uvs, offset * 2) : undefined;
                const vertColor = vertColors ? Color4.FromArray(vertColors, offset * 4) : undefined;

                const position = Vector3.FromArray(positions, offset * 3);

                vertex = new Vertex(position, normal, uv, vertColor);
                vertices.push(vertex);
            }

            polygon = new CSGPolygon(vertices, { subMeshId: 0, meshId: currentCSGMeshId, materialIndex: 0 });

            // To handle the case of degenerated triangle
            // polygon.plane == null <=> the polygon does not represent 1 single plane <=> the triangle is degenerated
            if (polygon.plane) {
                polygons.push(polygon);
            }
        }

        const csg = CSG._FromPolygons(polygons);
        csg.matrix = Matrix.Identity();
        csg.position = Vector3.Zero();
        csg.rotation = Vector3.Zero();
        csg.scaling = Vector3.One();
        csg.rotationQuaternion = Quaternion.Identity();
        currentCSGMeshId++;

        return csg;
    }

    /**
     * Convert the Mesh to CSG
     * @param mesh The Mesh to convert to CSG
     * @param absolute If true, the final (local) matrix transformation is set to the identity and not to that of `mesh`. It can help when dealing with right-handed meshes (default: false)
     * @returns A new CSG from the Mesh
     */
    public static FromMesh(mesh: Mesh, absolute = false): CSG {
        let vertex: Vertex,
            normal: Vector3,
            uv: Vector2 | undefined = undefined,
            position: Vector3,
            vertColor: Color4 | undefined = undefined,
            polygon: CSGPolygon,
            vertices: Vertex[];
        const polygons: CSGPolygon[] = [];
        let matrix: Matrix,
            meshPosition: Vector3,
            meshRotation: Vector3,
            meshRotationQuaternion: Nullable<Quaternion> = null,
            meshScaling: Vector3;

        let invertWinding = false;
        if (mesh instanceof Mesh) {
            mesh.computeWorldMatrix(true);
            matrix = mesh.getWorldMatrix();
            meshPosition = mesh.position.clone();
            meshRotation = mesh.rotation.clone();
            if (mesh.rotationQuaternion) {
                meshRotationQuaternion = mesh.rotationQuaternion.clone();
            }
            meshScaling = mesh.scaling.clone();
            if (mesh.material && absolute) {
                invertWinding = mesh.material.sideOrientation === Constants.MATERIAL_ClockWiseSideOrientation;
            }
        } else {
            // eslint-disable-next-line no-throw-literal
            throw "BABYLON.CSG: Wrong Mesh type, must be BABYLON.Mesh";
        }

        const indices = <IndicesArray>mesh.getIndices(),
            positions = <FloatArray>mesh.getVerticesData(VertexBuffer.PositionKind),
            normals = <FloatArray>mesh.getVerticesData(VertexBuffer.NormalKind),
            uvs = <FloatArray>mesh.getVerticesData(VertexBuffer.UVKind),
            vertColors = <FloatArray>mesh.getVerticesData(VertexBuffer.ColorKind);

        const subMeshes = mesh.subMeshes;

        for (let sm = 0, sml = subMeshes.length; sm < sml; sm++) {
            for (let i = subMeshes[sm].indexStart, il = subMeshes[sm].indexCount + subMeshes[sm].indexStart; i < il; i += 3) {
                vertices = [];
                for (let j = 0; j < 3; j++) {
                    const indexIndices = j === 0 ? i + j : invertWinding ? i + 3 - j : i + j;
                    const sourceNormal = new Vector3(normals[indices[indexIndices] * 3], normals[indices[indexIndices] * 3 + 1], normals[indices[indexIndices] * 3 + 2]);
                    if (uvs) {
                        uv = new Vector2(uvs[indices[indexIndices] * 2], uvs[indices[indexIndices] * 2 + 1]);
                    }
                    if (vertColors) {
                        vertColor = new Color4(
                            vertColors[indices[indexIndices] * 4],
                            vertColors[indices[indexIndices] * 4 + 1],
                            vertColors[indices[indexIndices] * 4 + 2],
                            vertColors[indices[indexIndices] * 4 + 3]
                        );
                    }
                    const sourcePosition = new Vector3(positions[indices[indexIndices] * 3], positions[indices[indexIndices] * 3 + 1], positions[indices[indexIndices] * 3 + 2]);
                    position = Vector3.TransformCoordinates(sourcePosition, matrix);
                    normal = Vector3.TransformNormal(sourceNormal, matrix);

                    vertex = new Vertex(position, normal, uv, vertColor);
                    vertices.push(vertex);
                }

                polygon = new CSGPolygon(vertices, { subMeshId: sm, meshId: currentCSGMeshId, materialIndex: subMeshes[sm].materialIndex });

                // To handle the case of degenerated triangle
                // polygon.plane == null <=> the polygon does not represent 1 single plane <=> the triangle is degenerated
                if (polygon.plane) {
                    polygons.push(polygon);
                }
            }
        }

        const csg = CSG._FromPolygons(polygons);
        csg.matrix = absolute ? Matrix.Identity() : matrix;
        csg.position = absolute ? Vector3.Zero() : meshPosition;
        csg.rotation = absolute ? Vector3.Zero() : meshRotation;
        csg.scaling = absolute ? Vector3.One() : meshScaling;
        csg.rotationQuaternion = absolute && meshRotationQuaternion ? Quaternion.Identity() : meshRotationQuaternion;
        currentCSGMeshId++;

        return csg;
    }

    /**
     * Construct a CSG solid from a list of `CSG.Polygon` instances.
     * @param polygons Polygons used to construct a CSG solid
     * @returns A new CSG solid
     */
    private static _FromPolygons(polygons: CSGPolygon[]): CSG {
        const csg = new CSG();
        csg._polygons = polygons;
        return csg;
    }

    /**
     * Clones, or makes a deep copy, of the CSG
     * @returns A new CSG
     */
    public clone(): CSG {
        const csg = new CSG();
        csg._polygons = this._polygons.map((p) => p.clone());
        csg.copyTransformAttributes(this);
        return csg;
    }

    /**
     * Unions this CSG with another CSG
     * @param csg The CSG to union against this CSG
     * @returns The unioned CSG
     */
    public union(csg: CSG): CSG {
        const a = new Node(this.clone()._polygons);
        const b = new Node(csg.clone()._polygons);
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        return CSG._FromPolygons(a.allPolygons()).copyTransformAttributes(this);
    }

    /**
     * Unions this CSG with another CSG in place
     * @param csg The CSG to union against this CSG
     */
    public unionInPlace(csg: CSG): void {
        const a = new Node(this._polygons);
        const b = new Node(csg._polygons);

        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());

        this._polygons = a.allPolygons();
    }

    /**
     * Subtracts this CSG with another CSG
     * @param csg The CSG to subtract against this CSG
     * @returns A new CSG
     */
    public subtract(csg: CSG): CSG {
        const a = new Node(this.clone()._polygons);
        const b = new Node(csg.clone()._polygons);
        a.invert();
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        a.invert();
        return CSG._FromPolygons(a.allPolygons()).copyTransformAttributes(this);
    }

    /**
     * Subtracts this CSG with another CSG in place
     * @param csg The CSG to subtract against this CSG
     */
    public subtractInPlace(csg: CSG): void {
        const a = new Node(this._polygons);
        const b = new Node(csg._polygons);

        a.invert();
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        a.invert();

        this._polygons = a.allPolygons();
    }

    /**
     * Intersect this CSG with another CSG
     * @param csg The CSG to intersect against this CSG
     * @returns A new CSG
     */
    public intersect(csg: CSG): CSG {
        const a = new Node(this.clone()._polygons);
        const b = new Node(csg.clone()._polygons);
        a.invert();
        b.clipTo(a);
        b.invert();
        a.clipTo(b);
        b.clipTo(a);
        a.build(b.allPolygons());
        a.invert();
        return CSG._FromPolygons(a.allPolygons()).copyTransformAttributes(this);
    }

    /**
     * Intersects this CSG with another CSG in place
     * @param csg The CSG to intersect against this CSG
     */
    public intersectInPlace(csg: CSG): void {
        const a = new Node(this._polygons);
        const b = new Node(csg._polygons);

        a.invert();
        b.clipTo(a);
        b.invert();
        a.clipTo(b);
        b.clipTo(a);
        a.build(b.allPolygons());
        a.invert();

        this._polygons = a.allPolygons();
    }

    /**
     * Return a new CSG solid with solid and empty space switched. This solid is
     * not modified.
     * @returns A new CSG solid with solid and empty space switched
     */
    public inverse(): CSG {
        const csg = this.clone();
        csg.inverseInPlace();
        return csg;
    }

    /**
     * Inverses the CSG in place
     */
    public inverseInPlace(): void {
        this._polygons.map((p) => {
            p.flip();
        });
    }

    /**
     * This is used to keep meshes transformations so they can be restored
     * when we build back a Babylon Mesh
     * NB : All CSG operations are performed in world coordinates
     * @param csg The CSG to copy the transform attributes from
     * @returns This CSG
     */
    public copyTransformAttributes(csg: CSG): CSG {
        this.matrix = csg.matrix;
        this.position = csg.position;
        this.rotation = csg.rotation;
        this.scaling = csg.scaling;
        this.rotationQuaternion = csg.rotationQuaternion;

        return this;
    }

    /**
     * Build vertex data from CSG
     * Coordinates here are in world space
     * @param onBeforePolygonProcessing called before each polygon is being processed
     * @param onAfterPolygonProcessing called after each polygon has been processed
     * @returns the final vertex data
     */
    public toVertexData(onBeforePolygonProcessing: Nullable<(polygon: CSGPolygon) => void> = null, onAfterPolygonProcessing: Nullable<() => void> = null): VertexData {
        const matrix = this.matrix.clone();
        matrix.invert();

        const polygons = this._polygons;
        const vertices = [];
        const indices = [];
        const normals = [];
        let uvs: Nullable<number[]> = null;
        let vertColors: Nullable<number[]> = null;
        const vertex = Vector3.Zero();
        const normal = Vector3.Zero();
        const uv = Vector2.Zero();
        const vertColor = new Color4(0, 0, 0, 0);
        const polygonIndices = [0, 0, 0];
        const vertice_dict = {};
        let vertex_idx;

        for (let i = 0, il = polygons.length; i < il; i++) {
            const polygon = polygons[i];

            if (onBeforePolygonProcessing) {
                onBeforePolygonProcessing(polygon);
            }

            for (let j = 2, jl = polygon.vertices.length; j < jl; j++) {
                polygonIndices[0] = 0;
                polygonIndices[1] = j - 1;
                polygonIndices[2] = j;

                for (let k = 0; k < 3; k++) {
                    vertex.copyFrom(polygon.vertices[polygonIndices[k]].pos);
                    normal.copyFrom(polygon.vertices[polygonIndices[k]].normal);
                    if (polygon.vertices[polygonIndices[k]].uv) {
                        if (!uvs) {
                            uvs = [];
                        }
                        uv.copyFrom(polygon.vertices[polygonIndices[k]].uv!);
                    }

                    if (polygon.vertices[polygonIndices[k]].vertColor) {
                        if (!vertColors) {
                            vertColors = [];
                        }
                        vertColor.copyFrom(polygon.vertices[polygonIndices[k]].vertColor!);
                    }
                    const localVertex = Vector3.TransformCoordinates(vertex, matrix);
                    const localNormal = Vector3.TransformNormal(normal, matrix);

                    vertex_idx = (<any>vertice_dict)[localVertex.x + "," + localVertex.y + "," + localVertex.z];

                    let areUvsDifferent = false;

                    if (uvs && !(uvs[vertex_idx * 2] === uv.x || uvs[vertex_idx * 2 + 1] === uv.y)) {
                        areUvsDifferent = true;
                    }

                    let areColorsDifferent = false;

                    if (
                        vertColors &&
                        !(
                            vertColors[vertex_idx * 4] === vertColor.r ||
                            vertColors[vertex_idx * 4 + 1] === vertColor.g ||
                            vertColors[vertex_idx * 4 + 2] === vertColor.b ||
                            vertColors[vertex_idx * 4 + 3] === vertColor.a
                        )
                    ) {
                        areColorsDifferent = true;
                    }

                    // Check if 2 points can be merged
                    if (
                        !(
                            typeof vertex_idx !== "undefined" &&
                            normals[vertex_idx * 3] === localNormal.x &&
                            normals[vertex_idx * 3 + 1] === localNormal.y &&
                            normals[vertex_idx * 3 + 2] === localNormal.z
                        ) ||
                        areUvsDifferent ||
                        areColorsDifferent
                    ) {
                        vertices.push(localVertex.x, localVertex.y, localVertex.z);
                        if (uvs) {
                            uvs.push(uv.x, uv.y);
                        }
                        normals.push(normal.x, normal.y, normal.z);
                        if (vertColors) {
                            vertColors.push(vertColor.r, vertColor.g, vertColor.b, vertColor.a);
                        }
                        vertex_idx = (<any>vertice_dict)[localVertex.x + "," + localVertex.y + "," + localVertex.z] = vertices.length / 3 - 1;
                    }

                    indices.push(vertex_idx);

                    if (onAfterPolygonProcessing) {
                        onAfterPolygonProcessing();
                    }
                }
            }
        }

        const result = new VertexData();
        result.positions = vertices;
        result.normals = normals;
        if (uvs) {
            result.uvs = uvs;
        }
        if (vertColors) {
            result.colors = vertColors;
        }
        result.indices = indices;

        return result;
    }

    /**
     * Build Raw mesh from CSG
     * Coordinates here are in world space
     * @param name The name of the mesh geometry
     * @param scene The Scene
     * @param keepSubMeshes Specifies if the submeshes should be kept
     * @returns A new Mesh
     */
    public buildMeshGeometry(name: string, scene?: Scene, keepSubMeshes?: boolean): Mesh {
        const mesh = new Mesh(name, scene);
        const polygons = this._polygons;
        let currentIndex = 0;
        const subMeshDict = {};
        let subMeshObj: {
            materialIndex: number;
            indexStart: number;
            indexEnd: number;
        };

        if (keepSubMeshes) {
            // Sort Polygons, since subMeshes are indices range
            polygons.sort((a, b) => {
                if (a.shared.meshId === b.shared.meshId) {
                    return a.shared.subMeshId - b.shared.subMeshId;
                } else {
                    return a.shared.meshId - b.shared.meshId;
                }
            });
        }

        const vertexData = this.toVertexData(
            (polygon) => {
                // Building SubMeshes
                if (!(<any>subMeshDict)[polygon.shared.meshId]) {
                    (<any>subMeshDict)[polygon.shared.meshId] = {};
                }
                if (!(<any>subMeshDict)[polygon.shared.meshId][polygon.shared.subMeshId]) {
                    (<any>subMeshDict)[polygon.shared.meshId][polygon.shared.subMeshId] = {
                        indexStart: +Infinity,
                        indexEnd: -Infinity,
                        materialIndex: polygon.shared.materialIndex,
                    };
                }
                subMeshObj = (<any>subMeshDict)[polygon.shared.meshId][polygon.shared.subMeshId];
            },
            () => {
                subMeshObj.indexStart = Math.min(currentIndex, subMeshObj.indexStart);
                subMeshObj.indexEnd = Math.max(currentIndex, subMeshObj.indexEnd);
                currentIndex++;
            }
        );

        vertexData.applyToMesh(mesh);

        if (keepSubMeshes) {
            // We offset the materialIndex by the previous number of materials in the CSG mixed meshes
            let materialIndexOffset = 0,
                materialMaxIndex;

            mesh.subMeshes = [] as SubMesh[];

            for (const m in subMeshDict) {
                materialMaxIndex = -1;
                for (const sm in (<any>subMeshDict)[m]) {
                    subMeshObj = (<any>subMeshDict)[m][sm];
                    SubMesh.CreateFromIndices(
                        subMeshObj.materialIndex + materialIndexOffset,
                        subMeshObj.indexStart,
                        subMeshObj.indexEnd - subMeshObj.indexStart + 1,
                        <AbstractMesh>mesh
                    );
                    materialMaxIndex = Math.max(subMeshObj.materialIndex, materialMaxIndex);
                }
                materialIndexOffset += ++materialMaxIndex;
            }
        }

        return mesh;
    }

    /**
     * Build Mesh from CSG taking material and transforms into account
     * @param name The name of the Mesh
     * @param material The material of the Mesh
     * @param scene The Scene
     * @param keepSubMeshes Specifies if submeshes should be kept
     * @returns The new Mesh
     */
    public toMesh(name: string, material: Nullable<Material> = null, scene?: Scene, keepSubMeshes?: boolean): Mesh {
        const mesh = this.buildMeshGeometry(name, scene, keepSubMeshes);

        mesh.material = material;

        mesh.position.copyFrom(this.position);
        mesh.rotation.copyFrom(this.rotation);
        if (this.rotationQuaternion) {
            mesh.rotationQuaternion = this.rotationQuaternion.clone();
        }
        mesh.scaling.copyFrom(this.scaling);
        mesh.computeWorldMatrix(true);

        return mesh;
    }
}
