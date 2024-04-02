import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import type { Vector4 } from "../../Maths/math.vector";
import { Vector3, TmpVectors, Matrix } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import { CreateRibbon } from "./ribbonBuilder";
import { Path3D } from "../../Maths/math.path";

/**
 * Creates an extruded shape mesh. The extrusion is a parametric shape. It has no predefined shape. Its final shape will depend on the input parameters.
 * * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be extruded along the Z axis.
 * * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
 * * The parameter `rotation` (float, default 0 radians) is the angle value to rotate the shape each step (each path point), from the former step (so rotation added each step) along the curve.
 * * The parameter `scale` (float, default 1) is the value to scale the shape.
 * * The parameter `closeShape` (boolean, default false) closes the shape when true, since v5.0.0.
 * * The parameter `closePath` (boolean, default false) closes the path when true and no caps, since v5.0.0.
 * * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
 * * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph#extruded-shape
 * * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture.
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
 * * The optional parameter `firstNormal` (Vector3) defines the direction of the first normal of the supplied path. Consider using this for any path that is straight, and particular for paths in the xy plane.
 * * The optional `adjustFrame` (boolean, default false) will cause the internally generated Path3D tangents, normals, and binormals to be adjusted so that a) they are always well-defined, and b) they do not reverse from one path point to the next. This prevents the extruded shape from being flipped and/or rotated with resulting mesh self-intersections. This is primarily useful for straight paths that can reverse direction.
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the extruded shape mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#extruded-shapes
 */
export function ExtrudeShape(
    name: string,
    options: {
        shape: Vector3[];
        path: Vector3[];
        scale?: number;
        rotation?: number;
        closeShape?: boolean;
        closePath?: boolean;
        cap?: number;
        updatable?: boolean;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
        instance?: Mesh;
        invertUV?: boolean;
        firstNormal?: Vector3;
        adjustFrame?: boolean;
    },
    scene: Nullable<Scene> = null
): Mesh {
    const path = options.path;
    const shape = options.shape;
    const scale = options.scale || 1;
    const rotation = options.rotation || 0;
    const cap = options.cap === 0 ? 0 : options.cap || Mesh.NO_CAP;
    const updatable = options.updatable;
    const sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    const instance = options.instance || null;
    const invertUV = options.invertUV || false;
    const closeShape = options.closeShape || false;
    const closePath = options.closePath || false;

    return _ExtrudeShapeGeneric(
        name,
        shape,
        path,
        scale,
        rotation,
        null,
        null,
        closePath,
        closeShape,
        cap,
        false,
        scene,
        updatable ? true : false,
        sideOrientation,
        instance,
        invertUV,
        options.frontUVs || null,
        options.backUVs || null,
        options.firstNormal || null,
        options.adjustFrame ? true : false
    );
}

/**
 * Creates an custom extruded shape mesh.
 * The custom extrusion is a parametric shape. It has no predefined shape. Its final shape will depend on the input parameters.
 * * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be extruded along the Z axis.
 * * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
 * * The parameter `rotationFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path and the distance of this point from the beginning of the path
 * * It must returns a float value that will be the rotation in radians applied to the shape on each path point.
 * * The parameter `scaleFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path and the distance of this point from the beginning of the path
 * * It must returns a float value that will be the scale value applied to the shape on each path point
 * * The parameter `closeShape` (boolean, default false) closes the shape when true, since v5.0.0.
 * * The parameter `closePath` (boolean, default false) closes the path when true and no caps, since v5.0.0.
 * * The parameter `ribbonClosePath` (boolean, default false) forces the extrusion underlying ribbon to close all the paths in its `pathArray` - depreciated in favor of closeShape
 * * The parameter `ribbonCloseArray` (boolean, default false) forces the extrusion underlying ribbon to close its `pathArray` - depreciated in favor of closePath
 * * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
 * * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph#extruded-shape
 * * Remember you can only change the shape or path point positions, not their number when updating an extruded shape
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * * The optional parameter `firstNormal` (Vector3) defines the direction of the first normal of the supplied path. It should be supplied when the path is in the xy plane, and particularly if these sections are straight, because the underlying Path3D object will pick a normal in the xy plane that causes the extrusion to be collapsed into the plane. This should be used for any path that is straight.
 * * The optional `adjustFrame` (boolean, default false) will cause the internally generated Path3D tangents, normals, and binormals to be adjusted so that a) they are always well-defined, and b) they do not reverse from one path point to the next. This prevents the extruded shape from being flipped and/or rotated with resulting mesh self-intersections. This is primarily useful for straight paths that can reverse direction.
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the custom extruded shape mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#custom-extruded-shapes
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#extruded-shapes
 */
export function ExtrudeShapeCustom(
    name: string,
    options: {
        shape: Vector3[];
        path: Vector3[];
        scaleFunction?: Nullable<{ (i: number, distance: number): number }>;
        rotationFunction?: Nullable<{ (i: number, distance: number): number }>;
        ribbonCloseArray?: boolean;
        ribbonClosePath?: boolean;
        closeShape?: boolean;
        closePath?: boolean;
        cap?: number;
        updatable?: boolean;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
        instance?: Mesh;
        invertUV?: boolean;
        firstNormal?: Vector3;
        adjustFrame?: boolean;
    },
    scene: Nullable<Scene> = null
): Mesh {
    const path = options.path;
    const shape = options.shape;
    const scaleFunction =
        options.scaleFunction ||
        (() => {
            return 1;
        });
    const rotationFunction =
        options.rotationFunction ||
        (() => {
            return 0;
        });
    const ribbonCloseArray = options.closePath || options.ribbonCloseArray || false;
    const ribbonClosePath = options.closeShape || options.ribbonClosePath || false;
    const cap = options.cap === 0 ? 0 : options.cap || Mesh.NO_CAP;
    const updatable = options.updatable;
    const firstNormal = options.firstNormal || null;
    const adjustFrame = options.adjustFrame || false;
    const sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    const instance = options.instance;
    const invertUV = options.invertUV || false;
    return _ExtrudeShapeGeneric(
        name,
        shape,
        path,
        null,
        null,
        scaleFunction,
        rotationFunction,
        ribbonCloseArray,
        ribbonClosePath,
        cap,
        true,
        scene,
        updatable ? true : false,
        sideOrientation,
        instance || null,
        invertUV,
        options.frontUVs || null,
        options.backUVs || null,
        firstNormal,
        adjustFrame
    );
}

function _ExtrudeShapeGeneric(
    name: string,
    shape: Vector3[],
    curve: Vector3[],
    scale: Nullable<number>,
    rotation: Nullable<number>,
    scaleFunction: Nullable<{ (i: number, distance: number): number }>,
    rotateFunction: Nullable<{ (i: number, distance: number): number }>,
    rbCA: boolean,
    rbCP: boolean,
    cap: number,
    custom: boolean,
    scene: Nullable<Scene>,
    updtbl: boolean,
    side: number,
    instance: Nullable<Mesh>,
    invertUV: boolean,
    frontUVs: Nullable<Vector4>,
    backUVs: Nullable<Vector4>,
    firstNormal: Nullable<Vector3>,
    adjustFrame: boolean
): Mesh {
    // extrusion geometry
    const extrusionPathArray = (
        shape: Vector3[],
        curve: Vector3[],
        path3D: Path3D,
        shapePaths: Vector3[][],
        scale: Nullable<number>,
        rotation: Nullable<number>,
        scaleFunction: Nullable<{ (i: number, distance: number): number }>,
        rotateFunction: Nullable<{ (i: number, distance: number): number }>,
        cap: number,
        custom: boolean,
        adjustFrame: boolean
    ) => {
        const tangents = path3D.getTangents();
        const normals = path3D.getNormals();
        const binormals = path3D.getBinormals();
        const distances = path3D.getDistances();
        if (adjustFrame) {
            /* fix tangents,normals, binormals */
            for (let i = 0; i < tangents.length; i++) {
                if (tangents[i].x == 0 && tangents[i].y == 0 && tangents[i].z == 0) {
                    tangents[i].copyFrom(tangents[i - 1]);
                }
                if (normals[i].x == 0 && normals[i].y == 0 && normals[i].z == 0) {
                    normals[i].copyFrom(normals[i - 1]);
                }
                if (binormals[i].x == 0 && binormals[i].y == 0 && binormals[i].z == 0) {
                    binormals[i].copyFrom(binormals[i - 1]);
                }
                if (i > 0) {
                    let v = tangents[i - 1];
                    if (Vector3.Dot(v, tangents[i]) < 0) {
                        tangents[i].scaleInPlace(-1);
                    }
                    v = normals[i - 1];
                    if (Vector3.Dot(v, normals[i]) < 0) {
                        normals[i].scaleInPlace(-1);
                    }
                    v = binormals[i - 1];
                    if (Vector3.Dot(v, binormals[i]) < 0) {
                        binormals[i].scaleInPlace(-1);
                    }
                }
            }
        }
        let angle = 0;
        const returnScale = () => {
            return scale !== null ? scale : 1;
        };
        const returnRotation = () => {
            return rotation !== null ? rotation : 0;
        };
        const rotate: { (i: number, distance: number): number } = custom && rotateFunction ? rotateFunction : returnRotation;
        const scl: { (i: number, distance: number): number } = custom && scaleFunction ? scaleFunction : returnScale;
        let index = cap === Mesh.NO_CAP || cap === Mesh.CAP_END ? 0 : 2;
        const rotationMatrix: Matrix = TmpVectors.Matrix[0];

        for (let i = 0; i < curve.length; i++) {
            const shapePath: Vector3[] = [];
            const angleStep = rotate(i, distances[i]);
            const scaleRatio = scl(i, distances[i]);
            Matrix.RotationAxisToRef(tangents[i], angle, rotationMatrix);
            for (let p = 0; p < shape.length; p++) {
                const planed = tangents[i].scale(shape[p].z).add(normals[i].scale(shape[p].x)).add(binormals[i].scale(shape[p].y));
                const rotated = Vector3.Zero();
                Vector3.TransformCoordinatesToRef(planed, rotationMatrix, rotated);
                rotated.scaleInPlace(scaleRatio).addInPlace(curve[i]);
                shapePath[p] = rotated;
            }
            shapePaths[index] = shapePath;
            angle += angleStep;
            index++;
        }
        // cap
        const capPath = (shapePath: Vector3[]) => {
            const pointCap = Array<Vector3>();
            const barycenter = Vector3.Zero();
            let i: number;
            for (i = 0; i < shapePath.length; i++) {
                barycenter.addInPlace(shapePath[i]);
            }
            barycenter.scaleInPlace(1.0 / shapePath.length);
            for (i = 0; i < shapePath.length; i++) {
                pointCap.push(barycenter);
            }
            return pointCap;
        };
        switch (cap) {
            case Mesh.NO_CAP:
                break;
            case Mesh.CAP_START:
                shapePaths[0] = capPath(shapePaths[2]);
                shapePaths[1] = shapePaths[2];
                break;
            case Mesh.CAP_END:
                shapePaths[index] = shapePaths[index - 1];
                shapePaths[index + 1] = capPath(shapePaths[index - 1]);
                break;
            case Mesh.CAP_ALL:
                shapePaths[0] = capPath(shapePaths[2]);
                shapePaths[1] = shapePaths[2];
                shapePaths[index] = shapePaths[index - 1];
                shapePaths[index + 1] = capPath(shapePaths[index - 1]);
                break;
            default:
                break;
        }
        return shapePaths;
    };
    let path3D;
    let pathArray;
    if (instance) {
        // instance update
        const storage = instance._creationDataStorage!;
        path3D = firstNormal ? storage.path3D.update(curve, firstNormal) : storage.path3D.update(curve);
        pathArray = extrusionPathArray(shape, curve, storage.path3D, storage.pathArray, scale, rotation, scaleFunction, rotateFunction, storage.cap, custom, adjustFrame);
        instance = CreateRibbon("", { pathArray, closeArray: false, closePath: false, offset: 0, updatable: false, sideOrientation: 0, instance }, scene || undefined);

        return instance;
    }
    // extruded shape creation
    path3D = firstNormal ? new Path3D(curve, firstNormal) : new Path3D(curve);
    const newShapePaths = new Array<Array<Vector3>>();
    cap = cap < 0 || cap > 3 ? 0 : cap;
    pathArray = extrusionPathArray(shape, curve, path3D, newShapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom, adjustFrame);
    const extrudedGeneric = CreateRibbon(
        name,
        {
            pathArray: pathArray,
            closeArray: rbCA,
            closePath: rbCP,
            updatable: updtbl,
            sideOrientation: side,
            invertUV: invertUV,
            frontUVs: frontUVs || undefined,
            backUVs: backUVs || undefined,
        },
        scene
    );
    extrudedGeneric._creationDataStorage!.pathArray = pathArray;
    extrudedGeneric._creationDataStorage!.path3D = path3D;
    extrudedGeneric._creationDataStorage!.cap = cap;

    return extrudedGeneric;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated please use the functions directly from the module
 */
export const ShapeBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ExtrudeShape,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ExtrudeShapeCustom,
};

Mesh.ExtrudeShape = (
    name: string,
    shape: Vector3[],
    path: Vector3[],
    scale: number,
    rotation: number,
    cap: number,
    scene: Nullable<Scene> = null,
    updatable?: boolean,
    sideOrientation?: number,
    instance?: Mesh
): Mesh => {
    const options = {
        shape: shape,
        path: path,
        scale: scale,
        rotation: rotation,
        cap: cap === 0 ? 0 : cap || Mesh.NO_CAP,
        sideOrientation: sideOrientation,
        instance: instance,
        updatable: updatable,
    };

    return ExtrudeShape(name, options, scene);
};

Mesh.ExtrudeShapeCustom = (
    name: string,
    shape: Vector3[],
    path: Vector3[],
    scaleFunction: Nullable<{ (i: number, distance: number): number }>,
    rotationFunction: Nullable<{ (i: number, distance: number): number }>,
    ribbonCloseArray: boolean,
    ribbonClosePath: boolean,
    cap: number,
    scene: Scene,
    updatable?: boolean,
    sideOrientation?: number,
    instance?: Mesh
): Mesh => {
    const options = {
        shape: shape,
        path: path,
        scaleFunction: scaleFunction,
        rotationFunction: rotationFunction,
        ribbonCloseArray: ribbonCloseArray,
        ribbonClosePath: ribbonClosePath,
        cap: cap === 0 ? 0 : cap || Mesh.NO_CAP,
        sideOrientation: sideOrientation,
        instance: instance,
        updatable: updatable,
    };

    return ExtrudeShapeCustom(name, options, scene);
};
