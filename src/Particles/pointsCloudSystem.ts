import { IndicesArray, FloatArray } from "../types";
import { Color4, Color3 } from "../Maths/math";
import { Vector2, Vector3, Vector4, TmpVectors, Matrix } from "../Maths/math.vector";
import { Logger } from "../Misc/logger";
import { VertexBuffer } from "../Buffers/buffer";
import { VertexData } from "../Meshes/mesh.vertexData";
import { Mesh } from "../Meshes/mesh";
import { EngineStore } from "../Engines/engineStore";
import { Scene, IDisposable } from "../scene";
import { CloudPoint, PointsGroup } from "./cloudPoint";
import { BoundingInfo } from "../Culling/boundingInfo";
import { Ray } from "../Culling/ray";
import { PickingInfo } from "../Collisions/pickingInfo";
import { StandardMaterial } from "../Materials/standardMaterial";
import { BaseTexture } from "./../Materials/Textures/baseTexture";
import { Scalar } from "../Maths/math.scalar";
import { Material } from "../Materials/material";

/** Defines the 4 color options */
export enum PointColor {
    /** color value */
    Color = 2,
    /** uv value */
    UV = 1,
    /** random value */
    Random = 0,
    /** stated value */
    Stated = 3
}

/**
 * The PointCloudSystem (PCS) is a single updatable mesh. The points corresponding to the vertices of this big mesh.
 * As it is just a mesh, the PointCloudSystem has all the same properties as any other BJS mesh : not more, not less. It can be scaled, rotated, translated, enlighted, textured, moved, etc.

 * The PointCloudSystem is also a particle system, with each point being a particle. It provides some methods to manage the particles.
 * However it is behavior agnostic. This means it has no emitter, no particle physics, no particle recycler. You have to implement your own behavior.
 *
 * Full documentation here : TO BE ENTERED
 */
export class PointsCloudSystem implements IDisposable {
    /**
     *  The PCS array of cloud point objects. Just access each particle as with any classic array.
     *  Example : var p = SPS.particles[i];
     */
    public particles: CloudPoint[] = new Array<CloudPoint>();
    /**
     * The PCS total number of particles. Read only. Use PCS.counter instead if you need to set your own value.
     */
    public nbParticles: number = 0;
    /**
     * This a counter for your own usage. It's not set by any SPS functions.
     */
    public counter: number = 0;
    /**
     * The PCS name. This name is also given to the underlying mesh.
     */
    public name: string;
    /**
     * The PCS mesh. It's a standard BJS Mesh, so all the methods from the Mesh class are available.
     */
    public mesh: Mesh;
    /**
     * This empty object is intended to store some PCS specific or temporary values in order to lower the Garbage Collector activity.
     * Please read :
     */
    public vars: any = {};
    /**
     * @hidden
     */
    public _size: number; //size of each point particle

    private _scene: Scene;
    private _promises: Array<Promise<any>> = [];
    private _positions: number[] = new Array<number>();
    private _indices: number[] = new Array<number>();
    private _normals: number[] = new Array<number>();
    private _colors: number[] = new Array<number>();
    private _uvs: number[] = new Array<number>();
    private _indices32: IndicesArray;           // used as depth sorted array if depth sort enabled, else used as typed indices
    private _positions32: Float32Array;         // updated positions for the VBO
    private _colors32: Float32Array;
    private _uvs32: Float32Array;
    private _updatable: boolean = true;
    private _isVisibilityBoxLocked = false;
    private _alwaysVisible: boolean = false;
    private _groups: number[] = new Array<number>();  //start indices for each group of particles
    private _groupCounter: number = 0;
    private _computeParticleColor: boolean = true;
    private _computeParticleTexture: boolean = true;
    private _computeParticleRotation: boolean = true;
    private _computeBoundingBox: boolean = false;
    private _isReady: boolean = false;

    /**
     * Creates a PCS (Points Cloud System) object
     * @param name (String) is the PCS name, this will be the underlying mesh name
     * @param pointSize (number) is the size for each point
     * @param scene (Scene) is the scene in which the PCS is added
     * @param options defines the options of the PCS e.g.
     * * updatable (optional boolean, default true) : if the PCS must be updatable or immutable
     */
    constructor(name: string, pointSize: number, scene: Scene, options?: { updatable?: boolean}) {
        this.name = name;
        this._size = pointSize;
        this._scene = scene || EngineStore.LastCreatedScene;
        if (options && options.updatable !== undefined) {
            this._updatable = options.updatable;
        } else {
            this._updatable = true;
        }
    }

    /**
     * Builds the PCS underlying mesh. Returns a standard Mesh.
     * If no points were added to the PCS, the returned mesh is just a single point.
     * @param material The material to use to render the mesh. If not provided, will create a default one
     * @returns a promise for the created mesh
     */
    public buildMeshAsync(material?: Material): Promise<Mesh> {
        return Promise.all(this._promises).then(() => {
            this._isReady = true;
            return this._buildMesh(material);
        });
    }

    /**
     * @hidden
     */
    private _buildMesh(material?: Material): Promise<Mesh> {
        if (this.nbParticles === 0) {
            this.addPoints(1);
        }

        this._positions32 = new Float32Array(this._positions);
        this._uvs32 = new Float32Array(this._uvs);
        this._colors32 = new Float32Array(this._colors);

        var vertexData = new VertexData();
        vertexData.set(this._positions32, VertexBuffer.PositionKind);

        if (this._uvs32.length > 0) {
            vertexData.set(this._uvs32, VertexBuffer.UVKind);
        }
        var ec = 0; //emissive color value 0 for UVs, 1 for color
        if (this._colors32.length > 0) {
            ec = 1;
            vertexData.set(this._colors32, VertexBuffer.ColorKind);
        }
        var mesh = new Mesh(this.name, this._scene);
        vertexData.applyToMesh(mesh, this._updatable);
        this.mesh = mesh;

        // free memory
        (<any>this._positions) = null;
        (<any>this._uvs) = null;
        (<any>this._colors) = null;

        if (!this._updatable) {
            this.particles.length = 0;
        }

        let mat = material;

        if (!mat) {
            mat = new StandardMaterial("point cloud material", this._scene);
            (<StandardMaterial>mat).emissiveColor = new Color3(ec, ec, ec);
            (<StandardMaterial>mat).disableLighting = true;
            (<StandardMaterial>mat).pointsCloud = true;
            (<StandardMaterial>mat).pointSize = this._size;
        }
        mesh.material = mat;

        return new Promise((resolve) => resolve(mesh));
    }

    // adds a new particle object in the particles array
    private _addParticle(idx: number, group: PointsGroup, groupId: number, idxInGroup: number): CloudPoint {
        var cp = new CloudPoint(idx, group, groupId, idxInGroup, this);
        this.particles.push(cp);
        return cp;
    }

    private _randomUnitVector(particle: CloudPoint): void {
        particle.position = new Vector3(Math.random(), Math.random(), Math.random());
        particle.color = new Color4(1, 1, 1, 1);
    }

    private _getColorIndicesForCoord(pointsGroup: PointsGroup, x: number, y: number, width: number): Color4 {
        var imageData = <Uint8Array>pointsGroup._groupImageData;
        var color = y * (width * 4) + x * 4;
        var colorIndices = [color, color + 1, color + 2, color + 3];
        var redIndex = colorIndices[0];
        var greenIndex = colorIndices[1];
        var blueIndex = colorIndices[2];
        var alphaIndex = colorIndices[3];
        var redForCoord = imageData[redIndex];
        var greenForCoord = imageData[greenIndex];
        var blueForCoord = imageData[blueIndex];
        var alphaForCoord = imageData[alphaIndex];
        return new Color4(redForCoord / 255, greenForCoord / 255, blueForCoord / 255, alphaForCoord);
    }

    private _setPointsColorOrUV(mesh: Mesh, pointsGroup: PointsGroup, isVolume: boolean, colorFromTexture?: boolean, hasTexture?: boolean, color?: Color4, range?: number) {
        if (isVolume) {
            mesh.updateFacetData();
        }

        var boundInfo = mesh.getBoundingInfo();
        var diameter = 2 * boundInfo.boundingSphere.radius;

        var meshPos = <FloatArray>mesh.getVerticesData(VertexBuffer.PositionKind);
        var meshInd = <IndicesArray>mesh.getIndices();
        var meshUV = <FloatArray>mesh.getVerticesData(VertexBuffer.UVKind);
        var meshCol = <FloatArray>mesh.getVerticesData(VertexBuffer.ColorKind);

        var place = Vector3.Zero();
        mesh.computeWorldMatrix();
        var meshMatrix: Matrix = mesh.getWorldMatrix();
        if (!meshMatrix.isIdentity()) {
            meshPos = meshPos.slice(0);
            for (var p = 0; p < meshPos.length / 3; p++) {
                Vector3.TransformCoordinatesFromFloatsToRef(meshPos[3 * p], meshPos[3 * p + 1], meshPos[3 * p + 2], meshMatrix, place);
                meshPos[3 * p] = place.x;
                meshPos[3 * p + 1] = place.y;
                meshPos[3 * p + 2] = place.z;
            }
        }

        var idxPoints: number = 0;

        var index:  number = 0;
        var id0:  number = 0;
        var id1:  number = 0;
        var id2:  number = 0;
        var v0X:  number = 0;
        var v0Y:  number = 0;
        var v0Z:  number = 0;
        var v1X:  number = 0;
        var v1Y:  number = 0;
        var v1Z:  number = 0;
        var v2X:  number = 0;
        var v2Y:  number = 0;
        var v2Z:  number = 0;
        var vertex0 = Vector3.Zero();
        var vertex1 = Vector3.Zero();
        var vertex2 = Vector3.Zero();
        var vec0 = Vector3.Zero();
        var vec1 = Vector3.Zero();

        var uv0X:  number = 0;
        var uv0Y:  number = 0;
        var uv1X:  number = 0;
        var uv1Y:  number = 0;
        var uv2X:  number = 0;
        var uv2Y:  number = 0;
        var uv0 = Vector2.Zero();
        var uv1 = Vector2.Zero();
        var uv2 = Vector2.Zero();
        var uvec0 = Vector2.Zero();
        var uvec1 = Vector2.Zero();

        var col0X:  number = 0;
        var col0Y:  number = 0;
        var col0Z:  number = 0;
        var col0A:  number = 0;
        var col1X:  number = 0;
        var col1Y:  number = 0;
        var col1Z:  number = 0;
        var col1A:  number = 0;
        var col2X:  number = 0;
        var col2Y:  number = 0;
        var col2Z:  number = 0;
        var col2A:  number = 0;
        var col0 = Vector4.Zero();
        var col1 = Vector4.Zero();
        var col2 = Vector4.Zero();
        var colvec0 = Vector4.Zero();
        var colvec1 = Vector4.Zero();

        var lamda:  number = 0;
        var mu:  number = 0;
        range = range ? range : 0;

        var facetPoint: Vector3;
        var uvPoint: Vector2;
        var colPoint: Vector4 = new Vector4(0, 0, 0, 0);

        var norm = Vector3.Zero();
        var tang = Vector3.Zero();
        var biNorm = Vector3.Zero();
        var angle = 0;
        var facetPlaneVec = Vector3.Zero();

        var gap = 0;
        var distance = 0;
        var ray = new Ray(Vector3.Zero(), new Vector3(1, 0, 0));
        var pickInfo: PickingInfo;
        var direction = Vector3.Zero();

        for (var index = 0; index < meshInd.length / 3; index++) {
            id0 = meshInd[3 * index];
            id1 = meshInd[3 * index + 1];
            id2 = meshInd[3 * index + 2];
            v0X = meshPos[3 * id0];
            v0Y = meshPos[3 * id0 + 1];
            v0Z = meshPos[3 * id0 + 2];
            v1X = meshPos[3 * id1];
            v1Y = meshPos[3 * id1 + 1];
            v1Z = meshPos[3 * id1 + 2];
            v2X = meshPos[3 * id2];
            v2Y = meshPos[3 * id2 + 1];
            v2Z = meshPos[3 * id2 + 2];
            vertex0.set(v0X, v0Y, v0Z);
            vertex1.set(v1X, v1Y, v1Z);
            vertex2.set(v2X, v2Y, v2Z);
            vertex1.subtractToRef(vertex0, vec0);
            vertex2.subtractToRef(vertex1, vec1);

            if (meshUV) {
                uv0X = meshUV[2 * id0];
                uv0Y = meshUV[2 * id0 + 1];
                uv1X = meshUV[2 * id1];
                uv1Y = meshUV[2 * id1 + 1];
                uv2X = meshUV[2 * id2];
                uv2Y = meshUV[2 * id2 + 1];
                uv0.set(uv0X, uv0Y);
                uv1.set(uv1X, uv1Y);
                uv2.set(uv2X, uv2Y);
                uv1.subtractToRef(uv0, uvec0);
                uv2.subtractToRef(uv1, uvec1);
            }

            if (meshCol && colorFromTexture) {
                col0X = meshCol[4 * id0];
                col0Y = meshCol[4 * id0 + 1];
                col0Z = meshCol[4 * id0 + 2];
                col0A = meshCol[4 * id0 + 3];
                col1X = meshCol[4 * id1];
                col1Y = meshCol[4 * id1 + 1];
                col1Z = meshCol[4 * id1 + 2];
                col1A = meshCol[4 * id1 + 3];
                col2X = meshCol[4 * id2];
                col2Y = meshCol[4 * id2 + 1];
                col2Z = meshCol[4 * id2 + 2];
                col2A = meshCol[4 * id2 + 3];
                col0.set(col0X, col0Y, col0Z, col0A);
                col1.set(col1X, col1Y, col1Z, col1A);
                col2.set(col2X, col2Y, col2Z, col2A);
                col1.subtractToRef(col0, colvec0);
                col2.subtractToRef(col1, colvec1);
            }

            var width: number;
            var height: number;
            var deltaS: number;
            var deltaV: number;
            var h: number;
            var s: number;
            var v: number;
            var hsvCol: Color3;
            var statedColor: Color3 = new Color3(0, 0, 0);
            var colPoint3: Color3 = new Color3(0, 0, 0);
            var pointColors: Color4;
            var particle: CloudPoint;

            for (var i = 0; i < pointsGroup._groupDensity[index]; i++) {
                idxPoints = this.particles.length;
                this._addParticle(idxPoints, pointsGroup, this._groupCounter, index + i);
                particle = this.particles[idxPoints];
                //form a point inside the facet v0, v1, v2;
                lamda = Scalar.RandomRange(0, 1);
                mu = Scalar.RandomRange(0, 1);
                facetPoint = vertex0.add(vec0.scale(lamda)).add(vec1.scale(lamda * mu));
                if (isVolume) {
                    norm = mesh.getFacetNormal(index).normalize().scale(-1);
                    tang = vec0.clone().normalize();
                    biNorm = Vector3.Cross(norm, tang);
                    angle = Scalar.RandomRange(0, 2 * Math.PI);
                    facetPlaneVec = tang.scale(Math.cos(angle)).add(biNorm.scale(Math.sin(angle)));
                    angle = Scalar.RandomRange(0.1, Math.PI / 2);
                    direction = facetPlaneVec.scale(Math.cos(angle)).add(norm.scale(Math.sin(angle)));

                    ray.origin = facetPoint.add(direction.scale(0.00001));
                    ray.direction = direction;
                    ray.length = diameter;
                    pickInfo = ray.intersectsMesh(mesh);
                    if (pickInfo.hit) {
                        distance = pickInfo.pickedPoint!.subtract(facetPoint).length();
                        gap = Scalar.RandomRange(0, 1) * distance;
                        facetPoint.addInPlace(direction.scale(gap));
                    }
                }
                particle.position = facetPoint.clone();
                this._positions.push(particle.position.x, particle.position.y, particle.position.z);
                if (colorFromTexture !== undefined) {
                    if (meshUV) {
                        uvPoint = uv0.add(uvec0.scale(lamda)).add(uvec1.scale(lamda * mu));
                        if (colorFromTexture) { //Set particle color to texture color
                            if (hasTexture && pointsGroup._groupImageData !== null) {
                                width = pointsGroup._groupImgWidth;
                                height = pointsGroup._groupImgHeight;
                                pointColors = this._getColorIndicesForCoord(pointsGroup, Math.round(uvPoint.x * width), Math.round(uvPoint.y * height), width);
                                particle.color = pointColors;
                                this._colors.push(pointColors.r, pointColors.g, pointColors.b, pointColors.a);
                            }
                            else {
                                if (meshCol) { //failure in texture and colors available
                                    colPoint = col0.add(colvec0.scale(lamda)).add(colvec1.scale(lamda * mu));
                                    particle.color = new Color4(colPoint.x, colPoint.y, colPoint.z, colPoint.w);
                                    this._colors.push(colPoint.x, colPoint.y, colPoint.z, colPoint.w);
                                }
                                else {
                                    colPoint = col0.set(Math.random(), Math.random(), Math.random(), 1);
                                    particle.color = new Color4(colPoint.x, colPoint.y, colPoint.z, colPoint.w);
                                    this._colors.push(colPoint.x, colPoint.y, colPoint.z, colPoint.w);
                                }
                            }
                        }
                        else { //Set particle uv based on a mesh uv
                            particle.uv = uvPoint.clone();
                            this._uvs.push(particle.uv.x, particle.uv.y);
                        }
                    }
                }
                else {
                    if (color) {
                        statedColor.set(color.r, color.g, color.b);
                        deltaS = Scalar.RandomRange(-range, range);
                        deltaV = Scalar.RandomRange(-range, range);
                        hsvCol = statedColor.toHSV();
                        h = hsvCol.r;
                        s = hsvCol.g + deltaS;
                        v = hsvCol.b + deltaV;
                        if (s < 0) {
                            s = 0;
                        }
                        if (s > 1) {
                            s = 1;
                        }
                        if (v < 0) {
                            v = 0;
                        }
                        if (v > 1) {
                            v = 1;
                        }
                        Color3.HSVtoRGBToRef(h, s, v, colPoint3);
                        colPoint.set(colPoint3.r, colPoint3.g, colPoint3.b, 1);
                    }
                    else {
                        colPoint = col0.set(Math.random(), Math.random(), Math.random(), 1);
                    }
                    particle.color = new Color4(colPoint.x, colPoint.y, colPoint.z, colPoint.w);
                    this._colors.push(colPoint.x, colPoint.y, colPoint.z, colPoint.w);
                }
            }
        }
    }

    // stores mesh texture in dynamic texture for color pixel retrieval
    // when pointColor type is color for surface points
    private _colorFromTexture(mesh: Mesh, pointsGroup: PointsGroup, isVolume: boolean): void {
        if (mesh.material === null) {
            Logger.Warn(mesh.name + "has no material.");
            pointsGroup._groupImageData = null;
            this._setPointsColorOrUV(mesh, pointsGroup, isVolume, true, false);
            return;
        }

        var mat = mesh.material;
        let textureList: BaseTexture[] = mat.getActiveTextures();
        if (textureList.length === 0) {
            Logger.Warn(mesh.name + "has no usable texture.");
            pointsGroup._groupImageData = null;
            this._setPointsColorOrUV(mesh, pointsGroup, isVolume, true, false);
            return;
        }

        var clone = <Mesh>mesh.clone();
        clone.setEnabled(false);
        this._promises.push(new Promise((resolve: (_: void) => void) => {
            BaseTexture.WhenAllReady(textureList, () => {
                let n = pointsGroup._textureNb;
                if (n < 0) {
                    n = 0;
                }
                if (n > textureList.length - 1) {
                    n =  textureList.length - 1;
                }
                const finalize = () => {
                    pointsGroup._groupImgWidth = textureList[n].getSize().width;
                    pointsGroup._groupImgHeight = textureList[n].getSize().height;
                    this._setPointsColorOrUV(clone, pointsGroup, isVolume, true, true);
                    clone.dispose();
                    resolve();
                };
                pointsGroup._groupImageData = null;
                const dataPromise = textureList[n].readPixels();
                if (!dataPromise) {
                    finalize();
                } else {
                    dataPromise.then((data) => {
                        pointsGroup._groupImageData = data;
                        finalize();
                    });
                }
            });
        }));
    }

    // calculates the point density per facet of a mesh for surface points
    private _calculateDensity(nbPoints: number, positions: FloatArray, indices: IndicesArray): number[] {
        var density: number[] = new Array<number>();
        var index: number;
        var id0: number;
        var id1: number;
        var id2: number;
        var v0X: number;
        var v0Y: number;
        var v0Z: number;
        var v1X: number;
        var v1Y: number;
        var v1Z: number;
        var v2X: number;
        var v2Y: number;
        var v2Z: number;
        var vertex0 = Vector3.Zero();
        var vertex1 = Vector3.Zero();
        var vertex2 = Vector3.Zero();
        var vec0 = Vector3.Zero();
        var vec1 = Vector3.Zero();
        var vec2 = Vector3.Zero();

        var a: number; //length of side of triangle
        var b: number; //length of side of triangle
        var c: number; //length of side of triangle
        var p: number; //perimeter of triangle
        var area: number;
        var areas: number[] = new Array<number>();
        var surfaceArea: number = 0;

        var nbFacets = indices.length / 3;

        //surface area
        for (var index = 0; index < nbFacets; index++) {
            id0 = indices[3 * index];
            id1 = indices[3 * index + 1];
            id2 = indices[3 * index + 2];
            v0X = positions[3 * id0];
            v0Y = positions[3 * id0 + 1];
            v0Z = positions[3 * id0 + 2];
            v1X = positions[3 * id1];
            v1Y = positions[3 * id1 + 1];
            v1Z = positions[3 * id1 + 2];
            v2X = positions[3 * id2];
            v2Y = positions[3 * id2 + 1];
            v2Z = positions[3 * id2 + 2];
            vertex0.set(v0X, v0Y, v0Z);
            vertex1.set(v1X, v1Y, v1Z);
            vertex2.set(v2X, v2Y, v2Z);
            vertex1.subtractToRef(vertex0, vec0);
            vertex2.subtractToRef(vertex1, vec1);
            vertex2.subtractToRef(vertex0, vec2);
            a = vec0.length();
            b = vec1.length();
            c = vec2.length();
            p = (a + b + c) / 2;
            area = Math.sqrt(p * (p - a) * (p - b) * (p - c));
            surfaceArea += area;
            areas[index] = area;
        }
        var pointCount: number = 0;
        for (var index = 0; index < nbFacets; index++) {
            density[index] = Math.floor(nbPoints * areas[index] / surfaceArea);
            pointCount += density[index];
        }

        var diff: number = nbPoints - pointCount;
        var pointsPerFacet: number = Math.floor(diff / nbFacets);
        var extraPoints: number = diff % nbFacets;

        if (pointsPerFacet > 0) {
            density = density.map((x) => x + pointsPerFacet);
        }

        for (var index = 0; index < extraPoints; index++) {
            density[index] += 1;
        }

        return density;
    }

    /**
     * Adds points to the PCS in random positions within a unit sphere
     * @param nb (positive integer) the number of particles to be created from this model
     * @param pointFunction is an optional javascript function to be called for each particle on PCS creation
     * @returns the number of groups in the system
     */
    public addPoints(nb: number, pointFunction: any = this._randomUnitVector): number {
        var pointsGroup = new PointsGroup(this._groupCounter, pointFunction);
        var cp: CloudPoint;

        // particles
        var idx = this.nbParticles;
        for (var i = 0; i < nb; i++) {
            cp = this._addParticle(idx, pointsGroup, this._groupCounter, i);
            if (pointsGroup && pointsGroup._positionFunction) {
                pointsGroup._positionFunction(cp, idx, i);
            }
            this._positions.push(cp.position.x, cp.position.y, cp.position.z);
            if (cp.color) {
                this._colors.push(cp.color.r, cp.color.g, cp.color.b, cp.color.a);
            }
            if (cp.uv) {
                this._uvs.push(cp.uv.x, cp.uv.y);
            }
            idx++;
        }
        this.nbParticles += nb;
        this._groupCounter++;
        return this._groupCounter;
    }

    /**
     * Adds points to the PCS from the surface of the model shape
     * @param mesh is any Mesh object that will be used as a surface model for the points
     * @param nb (positive integer) the number of particles to be created from this model
     * @param colorWith determines whether a point is colored using color (default), uv, random, stated or none (invisible)
     * @param color (color4) to be used when colorWith is stated or color (number) when used to specify texture position
     * @param range (number from 0 to 1) to determine the variation in shape and tone for a stated color
     * @returns the number of groups in the system
     */
    public addSurfacePoints(mesh: Mesh, nb: number, colorWith?: number, color?: Color4 | number, range?: number): number {
        var colored = colorWith ? colorWith : PointColor.Random;
        if (isNaN(colored) ||  colored < 0 || colored > 3) {
            colored = PointColor.Random ;
        }

        var meshPos = <FloatArray>mesh.getVerticesData(VertexBuffer.PositionKind);
        var meshInd = <IndicesArray>mesh.getIndices();

        this._groups.push(this._groupCounter);
        var pointsGroup = new PointsGroup(this._groupCounter, null);

        pointsGroup._groupDensity = this._calculateDensity(nb, meshPos, meshInd);
        if (colored === PointColor.Color) {
            pointsGroup._textureNb = <number>color ? <number>color : 0;
        }
        else {
            color = <Color4>color ? <Color4>color : new Color4(1, 1, 1, 1);
        }
        switch (colored) {
            case PointColor.Color:
                this._colorFromTexture(mesh, pointsGroup, false);
                break;
            case PointColor.UV:
                this._setPointsColorOrUV(mesh, pointsGroup, false, false, false);
                break;
            case PointColor.Random:
                this._setPointsColorOrUV(mesh, pointsGroup, false);
                break;
            case PointColor.Stated:
                this._setPointsColorOrUV(mesh, pointsGroup, false, undefined, undefined, <Color4>color, range);
                break;
        }
        this.nbParticles += nb;
        this._groupCounter++;
        return this._groupCounter - 1;
    }

    /**
     * Adds points to the PCS inside the model shape
     * @param mesh is any Mesh object that will be used as a surface model for the points
     * @param nb (positive integer) the number of particles to be created from this model
     * @param colorWith determines whether a point is colored using color (default), uv, random, stated or none (invisible)
     * @param color (color4) to be used when colorWith is stated or color (number) when used to specify texture position
     * @param range (number from 0 to 1) to determine the variation in shape and tone for a stated color
     * @returns the number of groups in the system
     */
    public addVolumePoints(mesh: Mesh, nb: number, colorWith?: number, color?: Color4 | number, range?: number): number {
        var colored = colorWith ? colorWith : PointColor.Random;
        if (isNaN(colored) ||  colored < 0 || colored > 3) {
            colored = PointColor.Random;
        }

        var meshPos = <FloatArray>mesh.getVerticesData(VertexBuffer.PositionKind);
        var meshInd = <IndicesArray>mesh.getIndices();

        this._groups.push(this._groupCounter);
        var pointsGroup = new PointsGroup(this._groupCounter, null);

        pointsGroup._groupDensity = this._calculateDensity(nb, meshPos, meshInd);
        if (colored === PointColor.Color) {
            pointsGroup._textureNb = <number>color ? <number>color : 0;
        }
        else {
            color = <Color4>color ? <Color4>color : new Color4(1, 1, 1, 1);
        }
        switch (colored) {
            case PointColor.Color:
                this._colorFromTexture(mesh, pointsGroup, true);
                break;
            case PointColor.UV:
                this._setPointsColorOrUV(mesh, pointsGroup, true, false, false);
            break;
            case PointColor.Random:
                this._setPointsColorOrUV(mesh, pointsGroup, true);
                break;
            case PointColor.Stated:
                this._setPointsColorOrUV(mesh, pointsGroup, true, undefined, undefined, <Color4>color, range);
                break;
        }
        this.nbParticles += nb;
        this._groupCounter++;
        return this._groupCounter - 1;
    }

    /**
     *  Sets all the particles : this method actually really updates the mesh according to the particle positions, rotations, colors, textures, etc.
     *  This method calls `updateParticle()` for each particle of the SPS.
     *  For an animated SPS, it is usually called within the render loop.
     * @param start The particle index in the particle array where to start to compute the particle property values _(default 0)_
     * @param end The particle index in the particle array where to stop to compute the particle property values _(default nbParticle - 1)_
     * @param update If the mesh must be finally updated on this call after all the particle computations _(default true)_
     * @returns the PCS.
     */
    public setParticles(start: number = 0, end: number = this.nbParticles - 1, update: boolean = true): PointsCloudSystem {
        if (!this._updatable  || !this._isReady) {
            return this;
        }

        // custom beforeUpdate
        this.beforeUpdateParticles(start, end, update);

        const rotMatrix = TmpVectors.Matrix[0];
        const mesh = this.mesh;
        const colors32 = this._colors32;
        const positions32 = this._positions32;
        const uvs32 = this._uvs32;

        const tempVectors = TmpVectors.Vector3;
        const camAxisX = tempVectors[5].copyFromFloats(1.0, 0.0, 0.0);
        const camAxisY = tempVectors[6].copyFromFloats(0.0, 1.0, 0.0);
        const camAxisZ = tempVectors[7].copyFromFloats(0.0, 0.0, 1.0);
        const minimum = tempVectors[8].setAll(Number.MAX_VALUE);
        const maximum = tempVectors[9].setAll(-Number.MAX_VALUE);

        Matrix.IdentityToRef(rotMatrix);
        var idx = 0;            // current index of the particle

        if (this.mesh.isFacetDataEnabled) {
            this._computeBoundingBox = true;
        }

        end = (end >= this.nbParticles) ? this.nbParticles - 1 : end;
        if (this._computeBoundingBox) {
            if (start != 0 || end != this.nbParticles - 1) { // only some particles are updated, then use the current existing BBox basis. Note : it can only increase.
                const boundingInfo = this.mesh._boundingInfo;
                if (boundingInfo) {
                    minimum.copyFrom(boundingInfo.minimum);
                    maximum.copyFrom(boundingInfo.maximum);
                }
            }
        }

        var idx = 0; // particle index
        var pindex = 0; //index in positions array
        var cindex = 0; //index in color array
        var uindex = 0; //index in uv array

        // particle loop
        for (var p = start; p <= end; p++) {
            const particle = this.particles[p];
            idx = particle.idx;
            pindex = 3 * idx;
            cindex = 4 * idx;
            uindex = 2 * idx;

            // call to custom user function to update the particle properties
            this.updateParticle(particle);

            const particleRotationMatrix = particle._rotationMatrix;
            const particlePosition = particle.position;
            const particleGlobalPosition = particle._globalPosition;

            if (this._computeParticleRotation) {
                particle.getRotationMatrix(rotMatrix);
            }

            const particleHasParent = (particle.parentId !== null);
            if (particleHasParent) {
                const parent = this.particles[particle.parentId!];
                const parentRotationMatrix = parent._rotationMatrix;
                const parentGlobalPosition = parent._globalPosition;

                const rotatedY = particlePosition.x * parentRotationMatrix[1] + particlePosition.y * parentRotationMatrix[4] + particlePosition.z * parentRotationMatrix[7];
                const rotatedX = particlePosition.x * parentRotationMatrix[0] + particlePosition.y * parentRotationMatrix[3] + particlePosition.z * parentRotationMatrix[6];
                const rotatedZ = particlePosition.x * parentRotationMatrix[2] + particlePosition.y * parentRotationMatrix[5] + particlePosition.z * parentRotationMatrix[8];

                particleGlobalPosition.x = parentGlobalPosition.x + rotatedX;
                particleGlobalPosition.y = parentGlobalPosition.y + rotatedY;
                particleGlobalPosition.z = parentGlobalPosition.z + rotatedZ;

                if (this._computeParticleRotation) {
                    const rotMatrixValues = rotMatrix.m;
                    particleRotationMatrix[0] = rotMatrixValues[0] * parentRotationMatrix[0] + rotMatrixValues[1] * parentRotationMatrix[3] + rotMatrixValues[2] * parentRotationMatrix[6];
                    particleRotationMatrix[1] = rotMatrixValues[0] * parentRotationMatrix[1] + rotMatrixValues[1] * parentRotationMatrix[4] + rotMatrixValues[2] * parentRotationMatrix[7];
                    particleRotationMatrix[2] = rotMatrixValues[0] * parentRotationMatrix[2] + rotMatrixValues[1] * parentRotationMatrix[5] + rotMatrixValues[2] * parentRotationMatrix[8];
                    particleRotationMatrix[3] = rotMatrixValues[4] * parentRotationMatrix[0] + rotMatrixValues[5] * parentRotationMatrix[3] + rotMatrixValues[6] * parentRotationMatrix[6];
                    particleRotationMatrix[4] = rotMatrixValues[4] * parentRotationMatrix[1] + rotMatrixValues[5] * parentRotationMatrix[4] + rotMatrixValues[6] * parentRotationMatrix[7];
                    particleRotationMatrix[5] = rotMatrixValues[4] * parentRotationMatrix[2] + rotMatrixValues[5] * parentRotationMatrix[5] + rotMatrixValues[6] * parentRotationMatrix[8];
                    particleRotationMatrix[6] = rotMatrixValues[8] * parentRotationMatrix[0] + rotMatrixValues[9] * parentRotationMatrix[3] + rotMatrixValues[10] * parentRotationMatrix[6];
                    particleRotationMatrix[7] = rotMatrixValues[8] * parentRotationMatrix[1] + rotMatrixValues[9] * parentRotationMatrix[4] + rotMatrixValues[10] * parentRotationMatrix[7];
                    particleRotationMatrix[8] = rotMatrixValues[8] * parentRotationMatrix[2] + rotMatrixValues[9] * parentRotationMatrix[5] + rotMatrixValues[10] * parentRotationMatrix[8];
                }
            }
            else {
                particleGlobalPosition.x = 0;
                particleGlobalPosition.y = 0;
                particleGlobalPosition.z = 0;

                if (this._computeParticleRotation) {
                    const rotMatrixValues = rotMatrix.m;
                    particleRotationMatrix[0] = rotMatrixValues[0];
                    particleRotationMatrix[1] = rotMatrixValues[1];
                    particleRotationMatrix[2] = rotMatrixValues[2];
                    particleRotationMatrix[3] = rotMatrixValues[4];
                    particleRotationMatrix[4] = rotMatrixValues[5];
                    particleRotationMatrix[5] = rotMatrixValues[6];
                    particleRotationMatrix[6] = rotMatrixValues[8];
                    particleRotationMatrix[7] = rotMatrixValues[9];
                    particleRotationMatrix[8] = rotMatrixValues[10];
                }
            }

            const pivotBackTranslation = tempVectors[11];
            if (particle.translateFromPivot) {
                pivotBackTranslation.setAll(0.0);
            }
            else {
                pivotBackTranslation.copyFrom(particle.pivot);
            }

            // positions
            const tmpVertex = tempVectors[0];
            tmpVertex.copyFrom(particle.position);
            const vertexX = tmpVertex.x - particle.pivot.x;
            const vertexY = tmpVertex.y - particle.pivot.y;
            const vertexZ = tmpVertex.z - particle.pivot.z;

            let rotatedX = vertexX * particleRotationMatrix[0] + vertexY * particleRotationMatrix[3] + vertexZ * particleRotationMatrix[6];
            let rotatedY = vertexX * particleRotationMatrix[1] + vertexY * particleRotationMatrix[4] + vertexZ * particleRotationMatrix[7];
            let rotatedZ = vertexX * particleRotationMatrix[2] + vertexY * particleRotationMatrix[5] + vertexZ * particleRotationMatrix[8];

            rotatedX += pivotBackTranslation.x;
            rotatedY += pivotBackTranslation.y;
            rotatedZ += pivotBackTranslation.z;

            const px = positions32[pindex] = particleGlobalPosition.x + camAxisX.x * rotatedX + camAxisY.x * rotatedY + camAxisZ.x * rotatedZ;
            const py = positions32[pindex + 1] = particleGlobalPosition.y + camAxisX.y * rotatedX + camAxisY.y * rotatedY + camAxisZ.y * rotatedZ;
            const pz = positions32[pindex + 2] = particleGlobalPosition.z + camAxisX.z * rotatedX + camAxisY.z * rotatedY + camAxisZ.z * rotatedZ;

            if (this._computeBoundingBox) {
                minimum.minimizeInPlaceFromFloats(px, py, pz);
                maximum.maximizeInPlaceFromFloats(px, py, pz);
            }

            if (this._computeParticleColor && particle.color) {
                const color = particle.color;
                const colors32 = this._colors32;
                colors32[cindex] = color.r;
                colors32[cindex + 1] = color.g;
                colors32[cindex + 2] = color.b;
                colors32[cindex + 3] = color.a;
            }
            if (this._computeParticleTexture && particle.uv) {
                const uv = particle.uv;
                const uvs32 = this._uvs32;
                uvs32[uindex] = uv.x;
                uvs32[uindex + 1] = uv.y;
            }

        }

        // if the VBO must be updated
        if (update) {
            if (this._computeParticleColor) {
                mesh.updateVerticesData(VertexBuffer.ColorKind, colors32, false, false);
            }
            if (this._computeParticleTexture) {
                mesh.updateVerticesData(VertexBuffer.UVKind, uvs32, false, false);
            }
            mesh.updateVerticesData(VertexBuffer.PositionKind, positions32, false, false);
        }

        if (this._computeBoundingBox) {
            if (mesh._boundingInfo) {
                mesh._boundingInfo.reConstruct(minimum, maximum, mesh._worldMatrix);
            }
            else {
                mesh._boundingInfo = new BoundingInfo(minimum, maximum, mesh._worldMatrix);
            }
        }
        this.afterUpdateParticles(start, end, update);
        return this;
    }

    /**
    * Disposes the PCS.
    */
    public dispose(): void {
        this.mesh.dispose();
        this.vars = null;
        // drop references to internal big arrays for the GC
        (<any>this._positions) = null;
        (<any>this._indices) = null;
        (<any>this._normals) = null;
        (<any>this._uvs) = null;
        (<any>this._colors) = null;
        (<any>this._indices32) = null;
        (<any>this._positions32) = null;
        (<any>this._uvs32) = null;
        (<any>this._colors32) = null;
    }

    /**
     * Visibility helper : Recomputes the visible size according to the mesh bounding box
     * doc :
     * @returns the PCS.
     */
    public refreshVisibleSize(): PointsCloudSystem {
        if (!this._isVisibilityBoxLocked) {
            this.mesh.refreshBoundingInfo();
        }
        return this;
    }

    /**
     * Visibility helper : Sets the size of a visibility box, this sets the underlying mesh bounding box.
     * @param size the size (float) of the visibility box
     * note : this doesn't lock the PCS mesh bounding box.
     * doc :
     */
    public setVisibilityBox(size: number): void {
        var vis = size / 2;
        this.mesh._boundingInfo = new BoundingInfo(new Vector3(-vis, -vis, -vis), new Vector3(vis, vis, vis));
    }

    /**
     * Gets whether the PCS is always visible or not
     * doc :
     */
    public get isAlwaysVisible(): boolean {
        return this._alwaysVisible;
    }

    /**
     * Sets the PCS as always visible or not
     * doc :
     */
    public set isAlwaysVisible(val: boolean) {
        this._alwaysVisible = val;
        this.mesh.alwaysSelectAsActiveMesh = val;
    }

    /**
     * Tells to `setParticles()` to compute the particle rotations or not
     * Default value : false. The PCS is faster when it's set to false
     * Note : particle rotations are only applied to parent particles
     * Note : the particle rotations aren't stored values, so setting `computeParticleRotation` to false will prevents the particle to rotate
     */
    public set computeParticleRotation(val: boolean) {
        this._computeParticleRotation = val;
    }

    /**
     * Tells to `setParticles()` to compute the particle colors or not.
     * Default value : true. The PCS is faster when it's set to false.
     * Note : the particle colors are stored values, so setting `computeParticleColor` to false will keep yet the last colors set.
     */
    public set computeParticleColor(val: boolean) {
        this._computeParticleColor = val;
    }

    public set computeParticleTexture(val: boolean) {
        this._computeParticleTexture = val;
    }
    /**
     * Gets if `setParticles()` computes the particle colors or not.
     * Default value : false. The PCS is faster when it's set to false.
     * Note : the particle colors are stored values, so setting `computeParticleColor` to false will keep yet the last colors set.
     */
    public get computeParticleColor(): boolean {
        return this._computeParticleColor;
    }
    /**
     * Gets if `setParticles()` computes the particle textures or not.
     * Default value : false. The PCS is faster when it's set to false.
     * Note : the particle textures are stored values, so setting `computeParticleTexture` to false will keep yet the last colors set.
     */
    public get computeParticleTexture(): boolean {
        return this._computeParticleTexture;
    }
    /**
     * Tells to `setParticles()` to compute or not the mesh bounding box when computing the particle positions.
     */
    public set computeBoundingBox(val: boolean) {
        this._computeBoundingBox = val;
    }
    /**
     * Gets if `setParticles()` computes or not the mesh bounding box when computing the particle positions.
     */
    public get computeBoundingBox(): boolean {
        return this._computeBoundingBox;
    }

    // =======================================================================
    // Particle behavior logic
    // these following methods may be overwritten by users to fit their needs

    /**
     * This function does nothing. It may be overwritten to set all the particle first values.
     * The PCS doesn't call this function, you may have to call it by your own.
     * doc :
     */
    public initParticles(): void {
    }

    /**
     * This function does nothing. It may be overwritten to recycle a particle
     * The PCS doesn't call this function, you can to call it
     * doc :
     * @param particle The particle to recycle
     * @returns the recycled particle
     */
    public recycleParticle(particle: CloudPoint): CloudPoint {
        return particle;
    }

    /**
     * Updates a particle : this function should  be overwritten by the user.
     * It is called on each particle by `setParticles()`. This is the place to code each particle behavior.
     * doc :
     * @example : just set a particle position or velocity and recycle conditions
     * @param particle The particle to update
     * @returns the updated particle
     */
    public updateParticle(particle: CloudPoint): CloudPoint {
        return particle;
    }

    /**
     * This will be called before any other treatment by `setParticles()` and will be passed three parameters.
     * This does nothing and may be overwritten by the user.
     * @param start the particle index in the particle array where to start to iterate, same than the value passed to setParticle()
     * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
     * @param update the boolean update value actually passed to setParticles()
     */
    public beforeUpdateParticles(start?: number, stop?: number, update?: boolean): void {
    }
    /**
     * This will be called  by `setParticles()` after all the other treatments and just before the actual mesh update.
     * This will be passed three parameters.
     * This does nothing and may be overwritten by the user.
     * @param start the particle index in the particle array where to start to iterate, same than the value passed to setParticle()
     * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
     * @param update the boolean update value actually passed to setParticles()
     */
    public afterUpdateParticles(start?: number, stop?: number, update?: boolean): void {
    }
}
