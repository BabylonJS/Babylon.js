import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Vector3, TmpVectors, Vector4, Matrix } from "../../Maths/math.vector";
import { Mesh, _CreationDataStorage } from "../mesh";
import { RibbonBuilder } from "./ribbonBuilder";
import { Path3D } from '../../Maths/math.path';

Mesh.CreateTube = (name: string, path: Vector3[], radius: number, tessellation: number, radiusFunction: { (i: number, distance: number): number; }, cap: number, scene: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh => {
    var options = {
        path: path,
        radius: radius,
        tessellation: tessellation,
        radiusFunction: radiusFunction,
        arc: 1,
        cap: cap,
        updatable: updatable,
        sideOrientation: sideOrientation,
        instance: instance
    };
    return TubeBuilder.CreateTube(name, options, scene);
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class TubeBuilder {
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
     * * The optional parameter `instance` is an instance of an existing Tube object to be updated with the passed `pathArray` parameter : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#tube
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the tube mesh
     * @see https://doc.babylonjs.com/how_to/parametric_shapes
     * @see https://doc.babylonjs.com/how_to/set_shapes#tube
     */
    public static CreateTube(name: string, options: { path: Vector3[], radius?: number, tessellation?: number, radiusFunction?: { (i: number, distance: number): number; }, cap?: number, arc?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, instance?: Mesh, invertUV?: boolean }, scene: Nullable<Scene> = null): Mesh {
        var path = options.path;
        var instance = options.instance;
        var radius = 1.0;

        if (options.radius !== undefined) {
            radius = options.radius;
        } else if (instance) {
            radius = instance._creationDataStorage!.radius;
        }

        var tessellation = options.tessellation || 64 | 0;
        var radiusFunction = options.radiusFunction || null;
        var cap = options.cap || Mesh.NO_CAP;
        var invertUV = options.invertUV || false;
        var updatable = options.updatable;
        var sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        options.arc = options.arc && (options.arc <= 0.0 || options.arc > 1.0) ? 1.0 : options.arc || 1.0;

        // tube geometry
        var tubePathArray = (path: Vector3[], path3D: Path3D, circlePaths: Vector3[][], radius: number, tessellation: number,
            radiusFunction: Nullable<{ (i: number, distance: number): number; }>, cap: number, arc: number) => {
            var tangents = path3D.getTangents();
            var normals = path3D.getNormals();
            var distances = path3D.getDistances();
            var pi2 = Math.PI * 2;
            var step = pi2 / tessellation * arc;
            var returnRadius: { (i: number, distance: number): number; } = () => radius;
            var radiusFunctionFinal: { (i: number, distance: number): number; } = radiusFunction || returnRadius;

            var circlePath: Vector3[];
            var rad: number;
            var normal: Vector3;
            var rotated: Vector3;
            var rotationMatrix: Matrix = TmpVectors.Matrix[0];
            var index = (cap === Mesh.NO_CAP || cap === Mesh.CAP_END) ? 0 : 2;
            for (var i = 0; i < path.length; i++) {
                rad = radiusFunctionFinal(i, distances[i]); // current radius
                circlePath = Array<Vector3>();              // current circle array
                normal = normals[i];                        // current normal
                for (var t = 0; t < tessellation; t++) {
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
            var capPath = (nbPoints: number, pathIndex: number): Array<Vector3> => {
                var pointCap = Array<Vector3>();
                for (var i = 0; i < nbPoints; i++) {
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

        var path3D;
        var pathArray;
        if (instance) { // tube update
            let storage = instance._creationDataStorage!;
            var arc = options.arc || storage.arc;
            path3D = storage.path3D.update(path);
            pathArray = tubePathArray(path, path3D, storage.pathArray, radius, storage.tessellation, radiusFunction, storage.cap, arc);
            instance = RibbonBuilder.CreateRibbon("", { pathArray: pathArray, instance: instance });
            // Update mode, no need to recreate the storage.
            storage.path3D = path3D;
            storage.pathArray = pathArray;
            storage.arc = arc;
            storage.radius = radius;

            return instance;
        }

        // tube creation
        path3D = <any>new Path3D(path);
        var newPathArray = new Array<Array<Vector3>>();
        cap = (cap < 0 || cap > 3) ? 0 : cap;
        pathArray = tubePathArray(path, path3D, newPathArray, radius, tessellation, radiusFunction, cap, options.arc);
        var tube = RibbonBuilder.CreateRibbon(name, { pathArray: pathArray, closePath: true, closeArray: false, updatable: updatable, sideOrientation: sideOrientation, invertUV: invertUV, frontUVs: options.frontUVs, backUVs: options.backUVs }, scene);
        tube._creationDataStorage!.pathArray = pathArray;
        tube._creationDataStorage!.path3D = path3D;
        tube._creationDataStorage!.tessellation = tessellation;
        tube._creationDataStorage!.cap = cap;
        tube._creationDataStorage!.arc = options.arc;
        tube._creationDataStorage!.radius = radius;

        return tube;
    }
}