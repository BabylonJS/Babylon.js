import { Vector4, Vector3, Vector2 } from "../../Maths/math.vector";
import { Color4 } from "../../Maths/math.color";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { Scene } from "../../scene";
import type { Nullable } from "../../types";
import { Axis } from "../../Maths/math.axis";
import { CompatibilityOptions } from "../../Compat/compatibilityOptions";

/**
 * Creates the VertexData for a cylinder, cone or prism
 * @param options an object used to set the following optional parameters for the box, required but can be empty
 * * height sets the height (y direction) of the cylinder, optional, default 2
 * * diameterTop sets the diameter of the top of the cone, overwrites diameter,  optional, default diameter
 * * diameterBottom sets the diameter of the bottom of the cone, overwrites diameter,  optional, default diameter
 * * diameter sets the diameter of the top and bottom of the cone, optional default 1
 * * tessellation the number of prism sides, 3 for a triangular prism, optional, default 24
 * * subdivisions` the number of rings along the cylinder height, optional, default 1
 * * arc a number from 0 to 1, to create an unclosed cylinder based on the fraction of the circumference given by the arc value, optional, default 1
 * * faceColors an array of Color3 elements used to set different colors to the top, rings and bottom respectively
 * * faceUV an array of Vector4 elements used to set different images to the top, rings and bottom respectively
 * * hasRings when true makes each subdivision independently treated as a face for faceUV and faceColors, optional, default false
 * * enclose when true closes an open cylinder by adding extra flat faces between the height axis and vertical edges, think cut cake
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
 * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * @returns the VertexData of the cylinder, cone or prism
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function CreateCylinderVertexData(options: {
    height?: number;
    diameterTop?: number;
    diameterBottom?: number;
    diameter?: number;
    tessellation?: number;
    subdivisions?: number;
    arc?: number;
    faceColors?: Color4[];
    faceUV?: Vector4[];
    hasRings?: boolean;
    enclose?: boolean;
    cap?: number;
    sideOrientation?: number;
    frontUVs?: Vector4;
    backUVs?: Vector4;
}): VertexData {
    const height: number = options.height || 2;
    let diameterTop: number = options.diameterTop === 0 ? 0 : options.diameterTop || options.diameter || 1;
    let diameterBottom: number = options.diameterBottom === 0 ? 0 : options.diameterBottom || options.diameter || 1;
    diameterTop = diameterTop || 0.00001; // Prevent broken normals
    diameterBottom = diameterBottom || 0.00001; // Prevent broken normals
    const tessellation: number = (options.tessellation || 24) | 0;
    const subdivisions: number = (options.subdivisions || 1) | 0;
    const hasRings: boolean = options.hasRings ? true : false;
    const enclose: boolean = options.enclose ? true : false;
    const cap = options.cap === 0 ? 0 : options.cap || Mesh.CAP_ALL;
    const arc: number = options.arc && (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
    const sideOrientation: number = options.sideOrientation === 0 ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;
    const faceUV: Vector4[] = options.faceUV || new Array<Vector4>(3);
    const faceColors = options.faceColors;
    // default face colors and UV if undefined
    const quadNb: number = arc !== 1 && enclose ? 2 : 0;
    const ringNb: number = hasRings ? subdivisions : 1;
    const surfaceNb: number = 2 + (1 + quadNb) * ringNb;
    let f: number;

    for (f = 0; f < surfaceNb; f++) {
        if (faceColors && faceColors[f] === undefined) {
            faceColors[f] = new Color4(1, 1, 1, 1);
        }
    }
    for (f = 0; f < surfaceNb; f++) {
        if (faceUV && faceUV[f] === undefined) {
            faceUV[f] = new Vector4(0, 0, 1, 1);
        }
    }

    const indices: number[] = [];
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];

    const angleStep = (Math.PI * 2 * arc) / tessellation;
    let angle: number;
    let h: number;
    let radius: number;
    const tan = (diameterBottom - diameterTop) / 2 / height;
    const ringVertex: Vector3 = Vector3.Zero();
    const ringNormal: Vector3 = Vector3.Zero();
    const ringFirstVertex: Vector3 = Vector3.Zero();
    const ringFirstNormal: Vector3 = Vector3.Zero();
    const quadNormal: Vector3 = Vector3.Zero();
    const Y: Vector3 = Axis.Y;

    // positions, normals, uvs
    let i: number;
    let j: number;
    let r: number;
    let ringIdx: number = 1;
    let s: number = 1; // surface index
    let cs: number = 0;
    let v: number = 0;

    for (i = 0; i <= subdivisions; i++) {
        h = i / subdivisions;
        radius = (h * (diameterTop - diameterBottom) + diameterBottom) / 2;
        ringIdx = hasRings && i !== 0 && i !== subdivisions ? 2 : 1;
        for (r = 0; r < ringIdx; r++) {
            if (hasRings) {
                s += r;
            }
            if (enclose) {
                s += 2 * r;
            }
            for (j = 0; j <= tessellation; j++) {
                angle = j * angleStep;

                // position
                ringVertex.x = Math.cos(-angle) * radius;
                ringVertex.y = -height / 2 + h * height;
                ringVertex.z = Math.sin(-angle) * radius;

                // normal
                if (diameterTop === 0 && i === subdivisions) {
                    // if no top cap, reuse former normals
                    ringNormal.x = normals[normals.length - (tessellation + 1) * 3];
                    ringNormal.y = normals[normals.length - (tessellation + 1) * 3 + 1];
                    ringNormal.z = normals[normals.length - (tessellation + 1) * 3 + 2];
                } else {
                    ringNormal.x = ringVertex.x;
                    ringNormal.z = ringVertex.z;
                    ringNormal.y = Math.sqrt(ringNormal.x * ringNormal.x + ringNormal.z * ringNormal.z) * tan;
                    ringNormal.normalize();
                }

                // keep first ring vertex values for enclose
                if (j === 0) {
                    ringFirstVertex.copyFrom(ringVertex);
                    ringFirstNormal.copyFrom(ringNormal);
                }

                positions.push(ringVertex.x, ringVertex.y, ringVertex.z);
                normals.push(ringNormal.x, ringNormal.y, ringNormal.z);
                if (hasRings) {
                    v = cs !== s ? faceUV[s].y : faceUV[s].w;
                } else {
                    v = faceUV[s].y + (faceUV[s].w - faceUV[s].y) * h;
                }
                uvs.push(faceUV[s].x + ((faceUV[s].z - faceUV[s].x) * j) / tessellation, CompatibilityOptions.UseOpenGLOrientationForUV ? 1 - v : v);
                if (faceColors) {
                    colors.push(faceColors[s].r, faceColors[s].g, faceColors[s].b, faceColors[s].a);
                }
            }

            // if enclose, add four vertices and their dedicated normals
            if (arc !== 1 && enclose) {
                positions.push(ringVertex.x, ringVertex.y, ringVertex.z);
                positions.push(0, ringVertex.y, 0);
                positions.push(0, ringVertex.y, 0);
                positions.push(ringFirstVertex.x, ringFirstVertex.y, ringFirstVertex.z);
                Vector3.CrossToRef(Y, ringNormal, quadNormal);
                quadNormal.normalize();
                normals.push(quadNormal.x, quadNormal.y, quadNormal.z, quadNormal.x, quadNormal.y, quadNormal.z);
                Vector3.CrossToRef(ringFirstNormal, Y, quadNormal);
                quadNormal.normalize();
                normals.push(quadNormal.x, quadNormal.y, quadNormal.z, quadNormal.x, quadNormal.y, quadNormal.z);
                if (hasRings) {
                    v = cs !== s ? faceUV[s + 1].y : faceUV[s + 1].w;
                } else {
                    v = faceUV[s + 1].y + (faceUV[s + 1].w - faceUV[s + 1].y) * h;
                }
                uvs.push(faceUV[s + 1].x, CompatibilityOptions.UseOpenGLOrientationForUV ? 1 - v : v);
                uvs.push(faceUV[s + 1].z, CompatibilityOptions.UseOpenGLOrientationForUV ? 1 - v : v);
                if (hasRings) {
                    v = cs !== s ? faceUV[s + 2].y : faceUV[s + 2].w;
                } else {
                    v = faceUV[s + 2].y + (faceUV[s + 2].w - faceUV[s + 2].y) * h;
                }
                uvs.push(faceUV[s + 2].x, CompatibilityOptions.UseOpenGLOrientationForUV ? 1 - v : v);
                uvs.push(faceUV[s + 2].z, CompatibilityOptions.UseOpenGLOrientationForUV ? 1 - v : v);
                if (faceColors) {
                    colors.push(faceColors[s + 1].r, faceColors[s + 1].g, faceColors[s + 1].b, faceColors[s + 1].a);
                    colors.push(faceColors[s + 1].r, faceColors[s + 1].g, faceColors[s + 1].b, faceColors[s + 1].a);
                    colors.push(faceColors[s + 2].r, faceColors[s + 2].g, faceColors[s + 2].b, faceColors[s + 2].a);
                    colors.push(faceColors[s + 2].r, faceColors[s + 2].g, faceColors[s + 2].b, faceColors[s + 2].a);
                }
            }
            if (cs !== s) {
                cs = s;
            }
        }
    }

    // indices
    const e: number = arc !== 1 && enclose ? tessellation + 4 : tessellation; // correction of number of iteration if enclose
    i = 0;
    for (s = 0; s < subdivisions; s++) {
        let i0: number = 0;
        let i1: number = 0;
        let i2: number = 0;
        let i3: number = 0;
        for (j = 0; j < tessellation; j++) {
            i0 = i * (e + 1) + j;
            i1 = (i + 1) * (e + 1) + j;
            i2 = i * (e + 1) + (j + 1);
            i3 = (i + 1) * (e + 1) + (j + 1);
            indices.push(i0, i1, i2);
            indices.push(i3, i2, i1);
        }
        if (arc !== 1 && enclose) {
            // if enclose, add two quads
            indices.push(i0 + 2, i1 + 2, i2 + 2);
            indices.push(i3 + 2, i2 + 2, i1 + 2);
            indices.push(i0 + 4, i1 + 4, i2 + 4);
            indices.push(i3 + 4, i2 + 4, i1 + 4);
        }
        i = hasRings ? i + 2 : i + 1;
    }

    // Caps
    const createCylinderCap = (isTop: boolean) => {
        const radius = isTop ? diameterTop / 2 : diameterBottom / 2;
        if (radius === 0) {
            return;
        }

        // Cap positions, normals & uvs
        let angle;
        let circleVector;
        let i: number;
        const u: Vector4 = isTop ? faceUV[surfaceNb - 1] : faceUV[0];
        let c: Nullable<Color4> = null;
        if (faceColors) {
            c = isTop ? faceColors[surfaceNb - 1] : faceColors[0];
        }
        // cap center
        const vbase = positions.length / 3;
        const offset = isTop ? height / 2 : -height / 2;
        const center = new Vector3(0, offset, 0);
        positions.push(center.x, center.y, center.z);
        normals.push(0, isTop ? 1 : -1, 0);
        const v = u.y + (u.w - u.y) * 0.5;
        uvs.push(u.x + (u.z - u.x) * 0.5, CompatibilityOptions.UseOpenGLOrientationForUV ? 1 - v : v);
        if (c) {
            colors.push(c.r, c.g, c.b, c.a);
        }

        const textureScale = new Vector2(0.5, 0.5);
        for (i = 0; i <= tessellation; i++) {
            angle = (Math.PI * 2 * i * arc) / tessellation;
            const cos = Math.cos(-angle);
            const sin = Math.sin(-angle);
            circleVector = new Vector3(cos * radius, offset, sin * radius);
            const textureCoordinate = new Vector2(cos * textureScale.x + 0.5, sin * textureScale.y + 0.5);
            positions.push(circleVector.x, circleVector.y, circleVector.z);
            normals.push(0, isTop ? 1 : -1, 0);
            const v = u.y + (u.w - u.y) * textureCoordinate.y;
            uvs.push(u.x + (u.z - u.x) * textureCoordinate.x, CompatibilityOptions.UseOpenGLOrientationForUV ? 1 - v : v);
            if (c) {
                colors.push(c.r, c.g, c.b, c.a);
            }
        }
        // Cap indices
        for (i = 0; i < tessellation; i++) {
            if (!isTop) {
                indices.push(vbase);
                indices.push(vbase + (i + 1));
                indices.push(vbase + (i + 2));
            } else {
                indices.push(vbase);
                indices.push(vbase + (i + 2));
                indices.push(vbase + (i + 1));
            }
        }
    };

    // add caps to geometry based on cap parameter
    if (cap === Mesh.CAP_START || cap === Mesh.CAP_ALL) {
        createCylinderCap(false);
    }
    if (cap === Mesh.CAP_END || cap === Mesh.CAP_ALL) {
        createCylinderCap(true);
    }

    // Sides
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

    const vertexData = new VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    if (faceColors) {
        vertexData.colors = colors;
    }

    return vertexData;
}

/**
 * Creates a cylinder or a cone mesh
 * * The parameter `height` sets the height size (float) of the cylinder/cone (float, default 2).
 * * The parameter `diameter` sets the diameter of the top and bottom cap at once (float, default 1).
 * * The parameters `diameterTop` and `diameterBottom` overwrite the parameter `diameter` and set respectively the top cap and bottom cap diameter (floats, default 1). The parameter "diameterBottom" can't be zero.
 * * The parameter `tessellation` sets the number of cylinder sides (positive integer, default 24). Set it to 3 to get a prism for instance.
 * * The parameter `subdivisions` sets the number of rings along the cylinder height (positive integer, default 1).
 * * The parameter `hasRings` (boolean, default false) makes the subdivisions independent from each other, so they become different faces.
 * * The parameter `enclose`  (boolean, default false) adds two extra faces per subdivision to a sliced cylinder to close it around its height axis.
 * * The parameter `cap` sets the way the cylinder is capped. Possible values : BABYLON.Mesh.NO_CAP, BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL (default).
 * * The parameter `arc` (float, default 1) is the ratio (max 1) to apply to the circumference to slice the cylinder.
 * * You can set different colors and different images to each box side by using the parameters `faceColors` (an array of n Color3 elements) and `faceUV` (an array of n Vector4 elements).
 * * The value of n is the number of cylinder faces. If the cylinder has only 1 subdivisions, n equals : top face + cylinder surface + bottom face = 3
 * * Now, if the cylinder has 5 independent subdivisions (hasRings = true), n equals : top face + 5 stripe surfaces + bottom face = 2 + 5 = 7
 * * Finally, if the cylinder has 5 independent subdivisions and is enclose, n equals : top face + 5 x (stripe surface + 2 closing faces) + bottom face = 2 + 5 * 3 = 17
 * * Each array (color or UVs) is always ordered the same way : the first element is the bottom cap, the last element is the top cap. The other elements are each a ring surface.
 * * If `enclose` is false, a ring surface is one element.
 * * If `enclose` is true, a ring surface is 3 successive elements in the array : the tubular surface, then the two closing faces.
 * * Example how to set colors and textures on a sliced cylinder : https://www.html5gamedevs.com/topic/17945-creating-a-closed-slice-of-a-cylinder/#comment-106379
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the cylinder mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#cylinder-or-cone
 */
export function CreateCylinder(
    name: string,
    options: {
        height?: number;
        diameterTop?: number;
        diameterBottom?: number;
        diameter?: number;
        tessellation?: number;
        subdivisions?: number;
        arc?: number;
        faceColors?: Color4[];
        faceUV?: Vector4[];
        updatable?: boolean;
        hasRings?: boolean;
        enclose?: boolean;
        cap?: number;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    } = {},
    scene?: Nullable<Scene>
): Mesh {
    const cylinder = new Mesh(name, scene);

    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    cylinder._originalBuilderSideOrientation = options.sideOrientation;

    const vertexData = CreateCylinderVertexData(options);

    vertexData.applyToMesh(cylinder, options.updatable);

    return cylinder;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated Please use CreateCylinder directly
 */
export const CylinderBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateCylinder,
};

VertexData.CreateCylinder = CreateCylinderVertexData;

Mesh.CreateCylinder = (
    name: string,
    height: number,
    diameterTop: number,
    diameterBottom: number,
    tessellation: number,
    subdivisions: any,
    scene?: Scene,
    updatable?: any,
    sideOrientation?: number
): Mesh => {
    if (scene === undefined || !(scene instanceof Scene)) {
        if (scene !== undefined) {
            sideOrientation = updatable || Mesh.DEFAULTSIDE;
            updatable = scene;
        }
        scene = <Scene>subdivisions;
        subdivisions = 1;
    }

    const options = {
        height,
        diameterTop,
        diameterBottom,
        tessellation,
        subdivisions,
        sideOrientation,
        updatable,
    };

    return CreateCylinder(name, options, scene);
};
