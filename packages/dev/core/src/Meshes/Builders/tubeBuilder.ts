import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import type { Vector4 } from "../../Maths/math.vector";
import { Vector3, TmpVectors, Matrix } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import { CreateRibbon } from "./ribbonBuilder";
import { Path3D } from "../../Maths/math.path";

/**
 * Creates a tube mesh.
 * The tube is a parametric shape. It has no predefined shape. Its final shape will depend on the input parameters
 * * The parameter `path` is a required array of successive Vector3. It is the curve used as the axis of the tube
 * * The parameter `radius` (positive float, default 1) sets the tube radius size
 * * The parameter `tessellation` (positive float, default 64) is the number of sides on the tubular surface
 * * The parameter `radiusFunction` (javascript function, default null) is a vanilla javascript function. If it is not null, it overrides the parameter `radius`
 * * This function is called on each point of the tube path and is passed the index `i` of the i-th point and the distance of this point from the first point of the path. It must return a radius value (positive float)
 * * The parameter `arc` (positive float, maximum 1, default 1) is the ratio to apply to the tube circumference : 2 x PI x arc
 * * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
 * * The optional parameter `instance` is an instance of an existing Tube object to be updated with the passed `pathArray` parameter. The `path`Array HAS to have the SAME number of points as the previous one: https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph#tube
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created. The NUMBER of points CAN'T CHANGE, only their positions.
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the tube mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#tube
 */
export function CreateTube(
    name: string,
    options: {
        path: Vector3[];
        radius?: number;
        tessellation?: number;
        radiusFunction?: { (i: number, distance: number): number };
        cap?: number;
        arc?: number;
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
    let instance = options.instance;
    let radius = 1.0;

    if (options.radius !== undefined) {
        radius = options.radius;
    } else if (instance) {
        radius = instance._creationDataStorage!.radius;
    }

    const tessellation = options.tessellation || 64 | 0;
    const radiusFunction = options.radiusFunction || null;
    let cap = options.cap || Mesh.NO_CAP;
    const invertUV = options.invertUV || false;
    const updatable = options.updatable;
    const sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    options.arc = options.arc && (options.arc <= 0.0 || options.arc > 1.0) ? 1.0 : options.arc || 1.0;

    // tube geometry
    const tubePathArray = (
        path: Vector3[],
        path3D: Path3D,
        circlePaths: Vector3[][],
        radius: number,
        tessellation: number,
        radiusFunction: Nullable<{ (i: number, distance: number): number }>,
        cap: number,
        arc: number
    ) => {
        const tangents = path3D.getTangents();
        const normals = path3D.getNormals();
        const distances = path3D.getDistances();
        const pi2 = Math.PI * 2;
        const step = (pi2 / tessellation) * arc;
        const returnRadius: { (i: number, distance: number): number } = () => radius;
        const radiusFunctionFinal: { (i: number, distance: number): number } = radiusFunction || returnRadius;

        let circlePath: Vector3[];
        let rad: number;
        let normal: Vector3;
        let rotated: Vector3;
        const rotationMatrix: Matrix = TmpVectors.Matrix[0];
        let index = cap === Mesh.NO_CAP || cap === Mesh.CAP_END ? 0 : 2;
        for (let i = 0; i < path.length; i++) {
            rad = radiusFunctionFinal(i, distances[i]); // current radius
            circlePath = Array<Vector3>(); // current circle array
            normal = normals[i]; // current normal
            for (let t = 0; t < tessellation; t++) {
                Matrix.RotationAxisToRef(tangents[i], step * t, rotationMatrix);
                rotated = circlePath[t] ? circlePath[t] : Vector3.Zero();
                Vector3.TransformCoordinatesToRef(normal, rotationMatrix, rotated);
                rotated.scaleInPlace(rad).addInPlace(path[i]);
                circlePath[t] = rotated;
            }
            circlePaths[index] = circlePath;
            index++;
        }
        // cap
        const capPath = (nbPoints: number, pathIndex: number): Array<Vector3> => {
            const pointCap = Array<Vector3>();
            for (let i = 0; i < nbPoints; i++) {
                pointCap.push(path[pathIndex]);
            }
            return pointCap;
        };
        switch (cap) {
            case Mesh.NO_CAP:
                break;
            case Mesh.CAP_START:
                circlePaths[0] = capPath(tessellation, 0);
                circlePaths[1] = circlePaths[2].slice(0);
                break;
            case Mesh.CAP_END:
                circlePaths[index] = circlePaths[index - 1].slice(0);
                circlePaths[index + 1] = capPath(tessellation, path.length - 1);
                break;
            case Mesh.CAP_ALL:
                circlePaths[0] = capPath(tessellation, 0);
                circlePaths[1] = circlePaths[2].slice(0);
                circlePaths[index] = circlePaths[index - 1].slice(0);
                circlePaths[index + 1] = capPath(tessellation, path.length - 1);
                break;
            default:
                break;
        }
        return circlePaths;
    };

    let path3D;
    let pathArray;
    if (instance) {
        // tube update
        const storage = instance._creationDataStorage!;
        const arc = options.arc || storage.arc;
        path3D = storage.path3D.update(path);
        pathArray = tubePathArray(path, path3D, storage.pathArray, radius, storage.tessellation, radiusFunction, storage.cap, arc);
        instance = CreateRibbon("", { pathArray: pathArray, instance: instance });
        // Update mode, no need to recreate the storage.
        storage.path3D = path3D;
        storage.pathArray = pathArray;
        storage.arc = arc;
        storage.radius = radius;

        return instance;
    }

    // tube creation
    path3D = <any>new Path3D(path);
    const newPathArray = new Array<Array<Vector3>>();
    cap = cap < 0 || cap > 3 ? 0 : cap;
    pathArray = tubePathArray(path, path3D, newPathArray, radius, tessellation, radiusFunction, cap, options.arc);
    const tube = CreateRibbon(
        name,
        {
            pathArray: pathArray,
            closePath: true,
            closeArray: false,
            updatable: updatable,
            sideOrientation: sideOrientation,
            invertUV: invertUV,
            frontUVs: options.frontUVs,
            backUVs: options.backUVs,
        },
        scene
    );
    tube._creationDataStorage!.pathArray = pathArray;
    tube._creationDataStorage!.path3D = path3D;
    tube._creationDataStorage!.tessellation = tessellation;
    tube._creationDataStorage!.cap = cap;
    tube._creationDataStorage!.arc = options.arc;
    tube._creationDataStorage!.radius = radius;

    return tube;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use CreateTube directly
 */
export const TubeBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateTube,
};

Mesh.CreateTube = (
    name: string,
    path: Vector3[],
    radius: number,
    tessellation: number,
    radiusFunction: { (i: number, distance: number): number },
    cap: number,
    scene: Scene,
    updatable?: boolean,
    sideOrientation?: number,
    instance?: Mesh
): Mesh => {
    const options = {
        path: path,
        radius: radius,
        tessellation: tessellation,
        radiusFunction: radiusFunction,
        arc: 1,
        cap: cap,
        updatable: updatable,
        sideOrientation: sideOrientation,
        instance: instance,
    };
    return CreateTube(name, options, scene);
};
