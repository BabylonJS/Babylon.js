import type { Scene } from "../../scene";
import type { Vector4 } from "../../Maths/math.vector";
import { Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import { CreateRibbon } from "./ribbonBuilder";
import type { Nullable } from "../../types";

/**
 * Creates lathe mesh.
 * The lathe is a shape with a symmetry axis : a 2D model shape is rotated around this axis to design the lathe
 * * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be rotated in its local space : the shape must be designed in the xOy plane and will be rotated around the Y axis. It's usually a 2D shape, so the Vector3 z coordinates are often set to zero
 * * The parameter `radius` (positive float, default 1) is the radius value of the lathe
 * * The parameter `tessellation` (positive integer, default 64) is the side number of the lathe
 * * The parameter `clip` (positive integer, default 0) is the number of sides to not create without effecting the general shape of the sides
 * * The parameter `arc` (positive float, default 1) is the ratio of the lathe. 0.5 builds for instance half a lathe, so an opened shape
 * * The parameter `closed` (boolean, default true) opens/closes the lathe circumference. This should be set to false when used with the parameter "arc"
 * * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the lathe mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#lathe
 */
export function CreateLathe(
    name: string,
    options: {
        shape: Vector3[];
        radius?: number;
        tessellation?: number;
        clip?: number;
        arc?: number;
        closed?: boolean;
        updatable?: boolean;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
        cap?: number;
        invertUV?: boolean;
    },
    scene: Nullable<Scene> = null
): Mesh {
    const arc: number = options.arc ? (options.arc <= 0 || options.arc > 1 ? 1.0 : options.arc) : 1.0;
    const closed: boolean = options.closed === undefined ? true : options.closed;
    const shape = options.shape;
    const radius = options.radius || 1;
    const tessellation = options.tessellation || 64;
    const clip = options.clip || 0;
    const updatable = options.updatable;
    const sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    const cap = options.cap || Mesh.NO_CAP;
    const pi2 = Math.PI * 2;
    const paths = [];
    const invertUV = options.invertUV || false;

    let i = 0;
    let p = 0;
    const step = (pi2 / tessellation) * arc;
    let rotated;
    let path: Array<Vector3>;
    for (i = 0; i <= tessellation - clip; i++) {
        path = [];
        if (cap == Mesh.CAP_START || cap == Mesh.CAP_ALL) {
            path.push(new Vector3(0, shape[0].y, 0));
            path.push(new Vector3(Math.cos(i * step) * shape[0].x * radius, shape[0].y, Math.sin(i * step) * shape[0].x * radius));
        }
        for (p = 0; p < shape.length; p++) {
            rotated = new Vector3(Math.cos(i * step) * shape[p].x * radius, shape[p].y, Math.sin(i * step) * shape[p].x * radius);
            path.push(rotated);
        }
        if (cap == Mesh.CAP_END || cap == Mesh.CAP_ALL) {
            path.push(new Vector3(Math.cos(i * step) * shape[shape.length - 1].x * radius, shape[shape.length - 1].y, Math.sin(i * step) * shape[shape.length - 1].x * radius));
            path.push(new Vector3(0, shape[shape.length - 1].y, 0));
        }
        paths.push(path);
    }

    // lathe ribbon
    const lathe = CreateRibbon(
        name,
        { pathArray: paths, closeArray: closed, sideOrientation: sideOrientation, updatable: updatable, invertUV: invertUV, frontUVs: options.frontUVs, backUVs: options.backUVs },
        scene
    );
    return lathe;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use the function direction from the module
 */
export const LatheBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateLathe,
};

Mesh.CreateLathe = (name: string, shape: Vector3[], radius: number, tessellation: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        shape: shape,
        radius: radius,
        tessellation: tessellation,
        sideOrientation: sideOrientation,
        updatable: updatable,
    };

    return CreateLathe(name, options, scene);
};
