import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Vector3, TmpVectors, Vector4, Matrix } from "../../Maths/math.vector";
import { Mesh, _CreationDataStorage } from "../mesh";
import { RibbonBuilder } from "./ribbonBuilder";
import { Path3D } from "../../Maths/math.path";

Mesh.ExtrudeShape = (name: string, shape: Vector3[], path: Vector3[], scale: number, rotation: number, cap: number, scene: Nullable<Scene> = null, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh => {
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

    return ShapeBuilder.ExtrudeShape(name, options, scene);
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

    return ShapeBuilder.ExtrudeShapeCustom(name, options, scene);
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class ShapeBuilder {
    /**
     * Creates an extruded shape mesh. The extrusion is a parametric shape. It has no predefined shape. Its final shape will depend on the input parameters.
     * * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be extruded along the Z axis.
     * * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
     * * The parameter `rotation` (float, default 0 radians) is the angle value to rotate the shape each step (each path point), from the former step (so rotation added each step) along the curve.
     * * The parameter `scale` (float, default 1) is the value to scale the shape.
     * * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
     * * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#extruded-shape
     * * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture.
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the extruded shape mesh
     * @see https://doc.babylonjs.com/how_to/parametric_shapes
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#extruded-shapes
     */
    public static ExtrudeShape(
        name: string,
        options: { shape: Vector3[]; path: Vector3[]; scale?: number; rotation?: number; cap?: number; updatable?: boolean; sideOrientation?: number; frontUVs?: Vector4; backUVs?: Vector4; instance?: Mesh; invertUV?: boolean },
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

        return ShapeBuilder._ExtrudeShapeGeneric(name, shape, path, scale, rotation, null, null, false, false, cap, false, scene, updatable ? true : false, sideOrientation, instance, invertUV, options.frontUVs || null, options.backUVs || null);
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
     * * The parameter `ribbonClosePath` (boolean, default false) forces the extrusion underlying ribbon to close all the paths in its `pathArray`
     * * The parameter `ribbonCloseArray` (boolean, default false) forces the extrusion underlying ribbon to close its `pathArray`
     * * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
     * * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#extruded-shape
     * * Remember you can only change the shape or path point positions, not their number when updating an extruded shape
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the custom extruded shape mesh
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#custom-extruded-shapes
     * @see https://doc.babylonjs.com/how_to/parametric_shapes
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#extruded-shapes
     */
    public static ExtrudeShapeCustom(
        name: string,
        options: {
            shape: Vector3[];
            path: Vector3[];
            scaleFunction?: Nullable<{ (i: number, distance: number): number }>;
            rotationFunction?: Nullable<{ (i: number, distance: number): number }>;
            ribbonCloseArray?: boolean;
            ribbonClosePath?: boolean;
            cap?: number;
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            instance?: Mesh;
            invertUV?: boolean;
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
        const ribbonCloseArray = options.ribbonCloseArray || false;
        const ribbonClosePath = options.ribbonClosePath || false;
        const cap = options.cap === 0 ? 0 : options.cap || Mesh.NO_CAP;
        const updatable = options.updatable;
        const sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        const instance = options.instance;
        const invertUV = options.invertUV || false;
        return ShapeBuilder._ExtrudeShapeGeneric(name, shape, path, null, null, scaleFunction, rotationFunction, ribbonCloseArray, ribbonClosePath, cap, true, scene, updatable ? true : false, sideOrientation, instance || null, invertUV, options.frontUVs || null, options.backUVs || null);
    }

    private static _ExtrudeShapeGeneric(
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
        backUVs: Nullable<Vector4>
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
            custom: boolean
        ) => {
            const tangents = path3D.getTangents();
            const normals = path3D.getNormals();
            const binormals = path3D.getBinormals();
            const distances = path3D.getDistances();

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
                const shapePath = new Array<Vector3>();
                const angleStep = rotate(i, distances[i]);
                const scaleRatio = scl(i, distances[i]);
                for (let p = 0; p < shape.length; p++) {
                    Matrix.RotationAxisToRef(tangents[i], angle, rotationMatrix);
                    const planed = tangents[i].scale(shape[p].z).add(normals[i].scale(shape[p].x)).add(binormals[i].scale(shape[p].y));
                    const rotated = shapePath[p] ? shapePath[p] : Vector3.Zero();
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
            let storage = instance._creationDataStorage!;
            path3D = storage.path3D.update(curve);
            pathArray = extrusionPathArray(shape, curve, storage.path3D, storage.pathArray, scale, rotation, scaleFunction, rotateFunction, storage.cap, custom);
            instance = Mesh.CreateRibbon("", pathArray, false, false, 0, scene || undefined, false, 0, instance);

            return instance;
        }
        // extruded shape creation
        path3D = <any>new Path3D(curve);
        const newShapePaths = new Array<Array<Vector3>>();
        cap = cap < 0 || cap > 3 ? 0 : cap;
        pathArray = extrusionPathArray(shape, curve, path3D, newShapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom);
        const extrudedGeneric = RibbonBuilder.CreateRibbon(name, { pathArray: pathArray, closeArray: rbCA, closePath: rbCP, updatable: updtbl, sideOrientation: side, invertUV: invertUV, frontUVs: frontUVs || undefined, backUVs: backUVs || undefined }, scene);
        extrudedGeneric._creationDataStorage!.pathArray = pathArray;
        extrudedGeneric._creationDataStorage!.path3D = path3D;
        extrudedGeneric._creationDataStorage!.cap = cap;

        return extrudedGeneric;
    }
}
