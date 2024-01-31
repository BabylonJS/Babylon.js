import type { Scene } from "../../scene";
import { Vector4 } from "../../Maths/math.vector";
import { Color4 } from "../../Maths/math.color";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Nullable } from "../../types";
import { CompatibilityOptions } from "../../Compat/compatibilityOptions";

// inspired from // http://stemkoski.github.io/Three.js/Polyhedra.html
/**
 * Creates the VertexData for a Polyhedron
 * @param options an object used to set the following optional parameters for the polyhedron, required but can be empty
 * * type provided types are:
 *  * 0 : Tetrahedron, 1 : Octahedron, 2 : Dodecahedron, 3 : Icosahedron, 4 : Rhombicuboctahedron, 5 : Triangular Prism, 6 : Pentagonal Prism, 7 : Hexagonal Prism, 8 : Square Pyramid (J1)
 *  * 9 : Pentagonal Pyramid (J2), 10 : Triangular Dipyramid (J12), 11 : Pentagonal Dipyramid (J13), 12 : Elongated Square Dipyramid (J15), 13 : Elongated Pentagonal Dipyramid (J16), 14 : Elongated Pentagonal Cupola (J20)
 * * size the size of the IcoSphere, optional default 1
 * * sizeX allows stretching in the x direction, optional, default size
 * * sizeY allows stretching in the y direction, optional, default size
 * * sizeZ allows stretching in the z direction, optional, default size
 * * custom a number that overwrites the type to create from an extended set of polyhedron from https://www.babylonjs-playground.com/#21QRSK#15 with minimised editor
 * * faceUV an array of Vector4 elements used to set different images to the top, rings and bottom respectively
 * * faceColors an array of Color3 elements used to set different colors to the top, rings and bottom respectively
 * * flat when true creates a flat shaded mesh, optional, default true
 * * subdivisions increasing the subdivisions increases the number of faces, optional, default 4
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
 * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * @returns the VertexData of the Polyhedron
 */
export function CreatePolyhedronVertexData(options: {
    type?: number;
    size?: number;
    sizeX?: number;
    sizeY?: number;
    sizeZ?: number;
    custom?: any;
    faceUV?: Vector4[];
    faceColors?: Color4[];
    flat?: boolean;
    sideOrientation?: number;
    frontUVs?: Vector4;
    backUVs?: Vector4;
}): VertexData {
    // provided polyhedron types :
    // 0 : Tetrahedron, 1 : Octahedron, 2 : Dodecahedron, 3 : Icosahedron, 4 : Rhombicuboctahedron, 5 : Triangular Prism, 6 : Pentagonal Prism, 7 : Hexagonal Prism, 8 : Square Pyramid (J1)
    // 9 : Pentagonal Pyramid (J2), 10 : Triangular Dipyramid (J12), 11 : Pentagonal Dipyramid (J13), 12 : Elongated Square Dipyramid (J15), 13 : Elongated Pentagonal Dipyramid (J16), 14 : Elongated Pentagonal Cupola (J20)
    const polyhedra: { vertex: number[][]; face: number[][] }[] = [];
    polyhedra[0] = {
        vertex: [
            [0, 0, 1.732051],
            [1.632993, 0, -0.5773503],
            [-0.8164966, 1.414214, -0.5773503],
            [-0.8164966, -1.414214, -0.5773503],
        ],
        face: [
            [0, 1, 2],
            [0, 2, 3],
            [0, 3, 1],
            [1, 3, 2],
        ],
    };
    polyhedra[1] = {
        vertex: [
            [0, 0, 1.414214],
            [1.414214, 0, 0],
            [0, 1.414214, 0],
            [-1.414214, 0, 0],
            [0, -1.414214, 0],
            [0, 0, -1.414214],
        ],
        face: [
            [0, 1, 2],
            [0, 2, 3],
            [0, 3, 4],
            [0, 4, 1],
            [1, 4, 5],
            [1, 5, 2],
            [2, 5, 3],
            [3, 5, 4],
        ],
    };
    polyhedra[2] = {
        vertex: [
            [0, 0, 1.070466],
            [0.7136442, 0, 0.7978784],
            [-0.3568221, 0.618034, 0.7978784],
            [-0.3568221, -0.618034, 0.7978784],
            [0.7978784, 0.618034, 0.3568221],
            [0.7978784, -0.618034, 0.3568221],
            [-0.9341724, 0.381966, 0.3568221],
            [0.1362939, 1, 0.3568221],
            [0.1362939, -1, 0.3568221],
            [-0.9341724, -0.381966, 0.3568221],
            [0.9341724, 0.381966, -0.3568221],
            [0.9341724, -0.381966, -0.3568221],
            [-0.7978784, 0.618034, -0.3568221],
            [-0.1362939, 1, -0.3568221],
            [-0.1362939, -1, -0.3568221],
            [-0.7978784, -0.618034, -0.3568221],
            [0.3568221, 0.618034, -0.7978784],
            [0.3568221, -0.618034, -0.7978784],
            [-0.7136442, 0, -0.7978784],
            [0, 0, -1.070466],
        ],
        face: [
            [0, 1, 4, 7, 2],
            [0, 2, 6, 9, 3],
            [0, 3, 8, 5, 1],
            [1, 5, 11, 10, 4],
            [2, 7, 13, 12, 6],
            [3, 9, 15, 14, 8],
            [4, 10, 16, 13, 7],
            [5, 8, 14, 17, 11],
            [6, 12, 18, 15, 9],
            [10, 11, 17, 19, 16],
            [12, 13, 16, 19, 18],
            [14, 15, 18, 19, 17],
        ],
    };
    polyhedra[3] = {
        vertex: [
            [0, 0, 1.175571],
            [1.051462, 0, 0.5257311],
            [0.3249197, 1, 0.5257311],
            [-0.8506508, 0.618034, 0.5257311],
            [-0.8506508, -0.618034, 0.5257311],
            [0.3249197, -1, 0.5257311],
            [0.8506508, 0.618034, -0.5257311],
            [0.8506508, -0.618034, -0.5257311],
            [-0.3249197, 1, -0.5257311],
            [-1.051462, 0, -0.5257311],
            [-0.3249197, -1, -0.5257311],
            [0, 0, -1.175571],
        ],
        face: [
            [0, 1, 2],
            [0, 2, 3],
            [0, 3, 4],
            [0, 4, 5],
            [0, 5, 1],
            [1, 5, 7],
            [1, 7, 6],
            [1, 6, 2],
            [2, 6, 8],
            [2, 8, 3],
            [3, 8, 9],
            [3, 9, 4],
            [4, 9, 10],
            [4, 10, 5],
            [5, 10, 7],
            [6, 7, 11],
            [6, 11, 8],
            [7, 10, 11],
            [8, 11, 9],
            [9, 11, 10],
        ],
    };
    polyhedra[4] = {
        vertex: [
            [0, 0, 1.070722],
            [0.7148135, 0, 0.7971752],
            [-0.104682, 0.7071068, 0.7971752],
            [-0.6841528, 0.2071068, 0.7971752],
            [-0.104682, -0.7071068, 0.7971752],
            [0.6101315, 0.7071068, 0.5236279],
            [1.04156, 0.2071068, 0.1367736],
            [0.6101315, -0.7071068, 0.5236279],
            [-0.3574067, 1, 0.1367736],
            [-0.7888348, -0.5, 0.5236279],
            [-0.9368776, 0.5, 0.1367736],
            [-0.3574067, -1, 0.1367736],
            [0.3574067, 1, -0.1367736],
            [0.9368776, -0.5, -0.1367736],
            [0.7888348, 0.5, -0.5236279],
            [0.3574067, -1, -0.1367736],
            [-0.6101315, 0.7071068, -0.5236279],
            [-1.04156, -0.2071068, -0.1367736],
            [-0.6101315, -0.7071068, -0.5236279],
            [0.104682, 0.7071068, -0.7971752],
            [0.6841528, -0.2071068, -0.7971752],
            [0.104682, -0.7071068, -0.7971752],
            [-0.7148135, 0, -0.7971752],
            [0, 0, -1.070722],
        ],
        face: [
            [0, 2, 3],
            [1, 6, 5],
            [4, 9, 11],
            [7, 15, 13],
            [8, 16, 10],
            [12, 14, 19],
            [17, 22, 18],
            [20, 21, 23],
            [0, 1, 5, 2],
            [0, 3, 9, 4],
            [0, 4, 7, 1],
            [1, 7, 13, 6],
            [2, 5, 12, 8],
            [2, 8, 10, 3],
            [3, 10, 17, 9],
            [4, 11, 15, 7],
            [5, 6, 14, 12],
            [6, 13, 20, 14],
            [8, 12, 19, 16],
            [9, 17, 18, 11],
            [10, 16, 22, 17],
            [11, 18, 21, 15],
            [13, 15, 21, 20],
            [14, 20, 23, 19],
            [16, 19, 23, 22],
            [18, 22, 23, 21],
        ],
    };
    polyhedra[5] = {
        vertex: [
            [0, 0, 1.322876],
            [1.309307, 0, 0.1889822],
            [-0.9819805, 0.8660254, 0.1889822],
            [0.1636634, -1.299038, 0.1889822],
            [0.3273268, 0.8660254, -0.9449112],
            [-0.8183171, -0.4330127, -0.9449112],
        ],
        face: [
            [0, 3, 1],
            [2, 4, 5],
            [0, 1, 4, 2],
            [0, 2, 5, 3],
            [1, 3, 5, 4],
        ],
    };
    polyhedra[6] = {
        vertex: [
            [0, 0, 1.159953],
            [1.013464, 0, 0.5642542],
            [-0.3501431, 0.9510565, 0.5642542],
            [-0.7715208, -0.6571639, 0.5642542],
            [0.6633206, 0.9510565, -0.03144481],
            [0.8682979, -0.6571639, -0.3996071],
            [-1.121664, 0.2938926, -0.03144481],
            [-0.2348831, -1.063314, -0.3996071],
            [0.5181548, 0.2938926, -0.9953061],
            [-0.5850262, -0.112257, -0.9953061],
        ],
        face: [
            [0, 1, 4, 2],
            [0, 2, 6, 3],
            [1, 5, 8, 4],
            [3, 6, 9, 7],
            [5, 7, 9, 8],
            [0, 3, 7, 5, 1],
            [2, 4, 8, 9, 6],
        ],
    };
    polyhedra[7] = {
        vertex: [
            [0, 0, 1.118034],
            [0.8944272, 0, 0.6708204],
            [-0.2236068, 0.8660254, 0.6708204],
            [-0.7826238, -0.4330127, 0.6708204],
            [0.6708204, 0.8660254, 0.2236068],
            [1.006231, -0.4330127, -0.2236068],
            [-1.006231, 0.4330127, 0.2236068],
            [-0.6708204, -0.8660254, -0.2236068],
            [0.7826238, 0.4330127, -0.6708204],
            [0.2236068, -0.8660254, -0.6708204],
            [-0.8944272, 0, -0.6708204],
            [0, 0, -1.118034],
        ],
        face: [
            [0, 1, 4, 2],
            [0, 2, 6, 3],
            [1, 5, 8, 4],
            [3, 6, 10, 7],
            [5, 9, 11, 8],
            [7, 10, 11, 9],
            [0, 3, 7, 9, 5, 1],
            [2, 4, 8, 11, 10, 6],
        ],
    };
    polyhedra[8] = {
        vertex: [
            [-0.729665, 0.670121, 0.319155],
            [-0.655235, -0.29213, -0.754096],
            [-0.093922, -0.607123, 0.537818],
            [0.702196, 0.595691, 0.485187],
            [0.776626, -0.36656, -0.588064],
        ],
        face: [
            [1, 4, 2],
            [0, 1, 2],
            [3, 0, 2],
            [4, 3, 2],
            [4, 1, 0, 3],
        ],
    };
    polyhedra[9] = {
        vertex: [
            [-0.868849, -0.100041, 0.61257],
            [-0.329458, 0.976099, 0.28078],
            [-0.26629, -0.013796, -0.477654],
            [-0.13392, -1.034115, 0.229829],
            [0.738834, 0.707117, -0.307018],
            [0.859683, -0.535264, -0.338508],
        ],
        face: [
            [3, 0, 2],
            [5, 3, 2],
            [4, 5, 2],
            [1, 4, 2],
            [0, 1, 2],
            [0, 3, 5, 4, 1],
        ],
    };
    polyhedra[10] = {
        vertex: [
            [-0.610389, 0.243975, 0.531213],
            [-0.187812, -0.48795, -0.664016],
            [-0.187812, 0.9759, -0.664016],
            [0.187812, -0.9759, 0.664016],
            [0.798201, 0.243975, 0.132803],
        ],
        face: [
            [1, 3, 0],
            [3, 4, 0],
            [3, 1, 4],
            [0, 2, 1],
            [0, 4, 2],
            [2, 4, 1],
        ],
    };
    polyhedra[11] = {
        vertex: [
            [-1.028778, 0.392027, -0.048786],
            [-0.640503, -0.646161, 0.621837],
            [-0.125162, -0.395663, -0.540059],
            [0.004683, 0.888447, -0.651988],
            [0.125161, 0.395663, 0.540059],
            [0.632925, -0.791376, 0.433102],
            [1.031672, 0.157063, -0.354165],
        ],
        face: [
            [3, 2, 0],
            [2, 1, 0],
            [2, 5, 1],
            [0, 4, 3],
            [0, 1, 4],
            [4, 1, 5],
            [2, 3, 6],
            [3, 4, 6],
            [5, 2, 6],
            [4, 5, 6],
        ],
    };
    polyhedra[12] = {
        vertex: [
            [-0.669867, 0.334933, -0.529576],
            [-0.669867, 0.334933, 0.529577],
            [-0.4043, 1.212901, 0],
            [-0.334933, -0.669867, -0.529576],
            [-0.334933, -0.669867, 0.529577],
            [0.334933, 0.669867, -0.529576],
            [0.334933, 0.669867, 0.529577],
            [0.4043, -1.212901, 0],
            [0.669867, -0.334933, -0.529576],
            [0.669867, -0.334933, 0.529577],
        ],
        face: [
            [8, 9, 7],
            [6, 5, 2],
            [3, 8, 7],
            [5, 0, 2],
            [4, 3, 7],
            [0, 1, 2],
            [9, 4, 7],
            [1, 6, 2],
            [9, 8, 5, 6],
            [8, 3, 0, 5],
            [3, 4, 1, 0],
            [4, 9, 6, 1],
        ],
    };
    polyhedra[13] = {
        vertex: [
            [-0.931836, 0.219976, -0.264632],
            [-0.636706, 0.318353, 0.692816],
            [-0.613483, -0.735083, -0.264632],
            [-0.326545, 0.979634, 0],
            [-0.318353, -0.636706, 0.692816],
            [-0.159176, 0.477529, -0.856368],
            [0.159176, -0.477529, -0.856368],
            [0.318353, 0.636706, 0.692816],
            [0.326545, -0.979634, 0],
            [0.613482, 0.735082, -0.264632],
            [0.636706, -0.318353, 0.692816],
            [0.931835, -0.219977, -0.264632],
        ],
        face: [
            [11, 10, 8],
            [7, 9, 3],
            [6, 11, 8],
            [9, 5, 3],
            [2, 6, 8],
            [5, 0, 3],
            [4, 2, 8],
            [0, 1, 3],
            [10, 4, 8],
            [1, 7, 3],
            [10, 11, 9, 7],
            [11, 6, 5, 9],
            [6, 2, 0, 5],
            [2, 4, 1, 0],
            [4, 10, 7, 1],
        ],
    };
    polyhedra[14] = {
        vertex: [
            [-0.93465, 0.300459, -0.271185],
            [-0.838689, -0.260219, -0.516017],
            [-0.711319, 0.717591, 0.128359],
            [-0.710334, -0.156922, 0.080946],
            [-0.599799, 0.556003, -0.725148],
            [-0.503838, -0.004675, -0.969981],
            [-0.487004, 0.26021, 0.48049],
            [-0.460089, -0.750282, -0.512622],
            [-0.376468, 0.973135, -0.325605],
            [-0.331735, -0.646985, 0.084342],
            [-0.254001, 0.831847, 0.530001],
            [-0.125239, -0.494738, -0.966586],
            [0.029622, 0.027949, 0.730817],
            [0.056536, -0.982543, -0.262295],
            [0.08085, 1.087391, 0.076037],
            [0.125583, -0.532729, 0.485984],
            [0.262625, 0.599586, 0.780328],
            [0.391387, -0.726999, -0.716259],
            [0.513854, -0.868287, 0.139347],
            [0.597475, 0.85513, 0.326364],
            [0.641224, 0.109523, 0.783723],
            [0.737185, -0.451155, 0.538891],
            [0.848705, -0.612742, -0.314616],
            [0.976075, 0.365067, 0.32976],
            [1.072036, -0.19561, 0.084927],
        ],
        face: [
            [15, 18, 21],
            [12, 20, 16],
            [6, 10, 2],
            [3, 0, 1],
            [9, 7, 13],
            [2, 8, 4, 0],
            [0, 4, 5, 1],
            [1, 5, 11, 7],
            [7, 11, 17, 13],
            [13, 17, 22, 18],
            [18, 22, 24, 21],
            [21, 24, 23, 20],
            [20, 23, 19, 16],
            [16, 19, 14, 10],
            [10, 14, 8, 2],
            [15, 9, 13, 18],
            [12, 15, 21, 20],
            [6, 12, 16, 10],
            [3, 6, 2, 0],
            [9, 3, 1, 7],
            [9, 15, 12, 6, 3],
            [22, 17, 11, 5, 4, 8, 14, 19, 23, 24],
        ],
    };

    const type: number = options.type && (options.type < 0 || options.type >= polyhedra.length) ? 0 : options.type || 0;
    const size = options.size;
    const sizeX: number = options.sizeX || size || 1;
    const sizeY: number = options.sizeY || size || 1;
    const sizeZ: number = options.sizeZ || size || 1;
    const data: { vertex: number[][]; face: number[][]; name?: string; category?: string } = options.custom || polyhedra[type];
    const nbfaces = data.face.length;
    const faceUV = options.faceUV || new Array(nbfaces);
    const faceColors = options.faceColors;
    const flat = options.flat === undefined ? true : options.flat;
    const sideOrientation = options.sideOrientation === 0 ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    let index = 0;
    let faceIdx = 0; // face cursor in the array "indexes"
    const indexes: number[] = [];
    let i = 0;
    let f = 0;
    let u: number, v: number, ang: number, x: number, y: number, tmp: number;

    // default face colors and UV if undefined
    if (flat) {
        for (f = 0; f < nbfaces; f++) {
            if (faceColors && faceColors[f] === undefined) {
                faceColors[f] = new Color4(1, 1, 1, 1);
            }
            if (faceUV && faceUV[f] === undefined) {
                faceUV[f] = new Vector4(0, 0, 1, 1);
            }
        }
    }

    if (!flat) {
        for (i = 0; i < data.vertex.length; i++) {
            positions.push(data.vertex[i][0] * sizeX, data.vertex[i][1] * sizeY, data.vertex[i][2] * sizeZ);
            uvs.push(0, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 : 0);
        }
        for (f = 0; f < nbfaces; f++) {
            for (i = 0; i < data.face[f].length - 2; i++) {
                indices.push(data.face[f][0], data.face[f][i + 2], data.face[f][i + 1]);
            }
        }
    } else {
        for (f = 0; f < nbfaces; f++) {
            const fl = data.face[f].length; // number of vertices of the current face
            ang = (2 * Math.PI) / fl;
            x = 0.5 * Math.tan(ang / 2);
            y = 0.5;

            // positions, uvs, colors
            for (i = 0; i < fl; i++) {
                // positions
                positions.push(data.vertex[data.face[f][i]][0] * sizeX, data.vertex[data.face[f][i]][1] * sizeY, data.vertex[data.face[f][i]][2] * sizeZ);
                indexes.push(index);
                index++;
                // uvs
                u = faceUV[f].x + (faceUV[f].z - faceUV[f].x) * (0.5 + x);
                v = faceUV[f].y + (faceUV[f].w - faceUV[f].y) * (y - 0.5);
                uvs.push(u, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 - v : v);
                tmp = x * Math.cos(ang) - y * Math.sin(ang);
                y = x * Math.sin(ang) + y * Math.cos(ang);
                x = tmp;
                // colors
                if (faceColors) {
                    colors.push(faceColors[f].r, faceColors[f].g, faceColors[f].b, faceColors[f].a);
                }
            }

            // indices from indexes
            for (i = 0; i < fl - 2; i++) {
                indices.push(indexes[0 + faceIdx], indexes[i + 2 + faceIdx], indexes[i + 1 + faceIdx]);
            }
            faceIdx += fl;
        }
    }

    VertexData.ComputeNormals(positions, indices, normals);
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    if (faceColors && flat) {
        vertexData.colors = colors;
    }
    return vertexData;
}

/**
 * Creates a polyhedron mesh
 * * The parameter `type` (positive integer, max 14, default 0) sets the polyhedron type to build among the 15 embbeded types. Please refer to the type sheet in the tutorial to choose the wanted type
 * * The parameter `size` (positive float, default 1) sets the polygon size
 * * You can overwrite the `size` on each dimension bu using the parameters `sizeX`, `sizeY` or `sizeZ` (positive floats, default to `size` value)
 * * You can build other polyhedron types than the 15 embbeded ones by setting the parameter `custom` (`polyhedronObject`, default null). If you set the parameter `custom`, this overrides the parameter `type`
 * * A `polyhedronObject` is a formatted javascript object. You'll find a full file with pre-set polyhedra here : https://github.com/BabylonJS/Extensions/tree/master/Polyhedron
 * * You can set the color and the UV of each side of the polyhedron with the parameters `faceColors` (Color4, default `(1, 1, 1, 1)`) and faceUV (Vector4, default `(0, 0, 1, 1)`)
 * * To understand how to set `faceUV` or `faceColors`, please read this by considering the right number of faces of your polyhedron, instead of only 6 for the box : https://doc.babylonjs.com/features/featuresDeepDive/materials/using/texturePerBoxFace
 * * The parameter `flat` (boolean, default true). If set to false, it gives the polyhedron a single global face, so less vertices and shared normals. In this case, `faceColors` and `faceUV` are ignored
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the polyhedron mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/polyhedra
 */
export function CreatePolyhedron(
    name: string,
    options: {
        type?: number;
        size?: number;
        sizeX?: number;
        sizeY?: number;
        sizeZ?: number;
        custom?: any;
        faceUV?: Vector4[];
        faceColors?: Color4[];
        flat?: boolean;
        updatable?: boolean;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    } = {},
    scene: Nullable<Scene> = null
): Mesh {
    const polyhedron = new Mesh(name, scene);

    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    polyhedron._originalBuilderSideOrientation = options.sideOrientation;

    const vertexData = CreatePolyhedronVertexData(options);

    vertexData.applyToMesh(polyhedron, options.updatable);

    return polyhedron;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use the function directly from the module
 */
export const PolyhedronBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreatePolyhedron,
};

VertexData.CreatePolyhedron = CreatePolyhedronVertexData;

Mesh.CreatePolyhedron = (
    name: string,
    options: {
        type?: number;
        size?: number;
        sizeX?: number;
        sizeY?: number;
        sizeZ?: number;
        custom?: any;
        faceUV?: Vector4[];
        faceColors?: Color4[];
        updatable?: boolean;
        sideOrientation?: number;
    },
    scene: Scene
): Mesh => {
    return CreatePolyhedron(name, options, scene);
};
