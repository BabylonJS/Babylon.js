import { VertexData } from "../mesh.vertexData";
import { Vector2, Vector3, Matrix } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { useOpenGLOrientationForUV } from "../../Compat/compatibilityOptions";
/**
 * Scripts based off of https://github.com/maximeq/three-js-capsule-geometry/blob/master/src/CapsuleBufferGeometry.js
 * @param options the constructors options used to shape the mesh.
 * @returns the capsule VertexData
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set/capsule
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function CreateCapsuleVertexData(
    options: ICreateCapsuleOptions = {
        subdivisions: 2,
        tessellation: 16,
        height: 1,
        radius: 0.25,
        capSubdivisions: 6,
    }
): VertexData {
    const subdivisions = Math.max(options.subdivisions ? options.subdivisions : 2, 1) | 0;
    const tessellation = Math.max(options.tessellation ? options.tessellation : 16, 3) | 0;
    const height = Math.max(options.height ? options.height : 1, 0);
    const radius = Math.max(options.radius ? options.radius : 0.25, 0);
    const capDetail = Math.max(options.capSubdivisions ? options.capSubdivisions : 6, 1) | 0;

    const radialSegments = tessellation;
    const heightSegments = subdivisions;

    const radiusTop = Math.max(options.radiusTop ? options.radiusTop : radius, 0);
    const radiusBottom = Math.max(options.radiusBottom ? options.radiusBottom : radius, 0);

    const heightMinusCaps = height - (radiusTop + radiusBottom);

    const thetaStart = 0.0;
    const thetaLength = 2.0 * Math.PI;

    const capsTopSegments = Math.max(options.topCapSubdivisions ? options.topCapSubdivisions : capDetail, 1);
    const capsBottomSegments = Math.max(options.bottomCapSubdivisions ? options.bottomCapSubdivisions : capDetail, 1);

    const alpha = Math.acos((radiusBottom - radiusTop) / height);

    let indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    let index = 0;
    const indexArray = [],
        halfHeight = heightMinusCaps * 0.5;
    const pi2 = Math.PI * 0.5;

    let x, y;
    const normal = Vector3.Zero();
    const vertex = Vector3.Zero();

    const cosAlpha = Math.cos(alpha);
    const sinAlpha = Math.sin(alpha);

    const coneLength = new Vector2(radiusTop * sinAlpha, halfHeight + radiusTop * cosAlpha)
        .subtract(new Vector2(radiusBottom * sinAlpha, -halfHeight + radiusBottom * cosAlpha))
        .length();

    // Total length for v texture coord
    const vl = radiusTop * alpha + coneLength + radiusBottom * (pi2 - alpha);

    let v = 0;
    for (y = 0; y <= capsTopSegments; y++) {
        const indexRow = [];

        const a = pi2 - alpha * (y / capsTopSegments);

        v += (radiusTop * alpha) / capsTopSegments;

        const cosA = Math.cos(a);
        const sinA = Math.sin(a);

        // calculate the radius of the current row
        const _radius = cosA * radiusTop;

        for (x = 0; x <= radialSegments; x++) {
            const u = x / radialSegments;
            const theta = u * thetaLength + thetaStart;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            // vertex
            vertex.x = _radius * sinTheta;
            vertex.y = halfHeight + sinA * radiusTop;
            vertex.z = _radius * cosTheta;
            vertices.push(vertex.x, vertex.y, vertex.z);
            // normal
            normal.set(cosA * sinTheta, sinA, cosA * cosTheta);
            normals.push(normal.x, normal.y, normal.z);
            // uv
            uvs.push(u, useOpenGLOrientationForUV ? v / vl : 1 - v / vl);
            // save index of vertex in respective row
            indexRow.push(index);
            // increase index
            index++;
        }
        // now save vertices of the row in our index array
        indexArray.push(indexRow);
    }

    const coneHeight = height - radiusTop - radiusBottom + cosAlpha * radiusTop - cosAlpha * radiusBottom;
    const slope = (sinAlpha * (radiusBottom - radiusTop)) / coneHeight;

    for (y = 1; y <= heightSegments; y++) {
        const indexRow = [];
        v += coneLength / heightSegments;
        // calculate the radius of the current row
        const _radius = sinAlpha * ((y * (radiusBottom - radiusTop)) / heightSegments + radiusTop);
        for (x = 0; x <= radialSegments; x++) {
            const u = x / radialSegments;
            const theta = u * thetaLength + thetaStart;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            // vertex
            vertex.x = _radius * sinTheta;
            vertex.y = halfHeight + cosAlpha * radiusTop - (y * coneHeight) / heightSegments;
            vertex.z = _radius * cosTheta;
            vertices.push(vertex.x, vertex.y, vertex.z);
            // normal
            normal.set(sinTheta, slope, cosTheta).normalize();
            normals.push(normal.x, normal.y, normal.z);
            // uv
            uvs.push(u, useOpenGLOrientationForUV ? v / vl : 1 - v / vl);
            // save index of vertex in respective row
            indexRow.push(index);
            // increase index
            index++;
        }
        // now save vertices of the row in our index array
        indexArray.push(indexRow);
    }

    for (y = 1; y <= capsBottomSegments; y++) {
        const indexRow = [];
        const a = pi2 - alpha - (Math.PI - alpha) * (y / capsBottomSegments);
        v += (radiusBottom * alpha) / capsBottomSegments;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        // calculate the radius of the current row
        const _radius = cosA * radiusBottom;
        for (x = 0; x <= radialSegments; x++) {
            const u = x / radialSegments;
            const theta = u * thetaLength + thetaStart;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            // vertex
            vertex.x = _radius * sinTheta;
            vertex.y = -halfHeight + sinA * radiusBottom;
            vertex.z = _radius * cosTheta;
            vertices.push(vertex.x, vertex.y, vertex.z);
            // normal
            normal.set(cosA * sinTheta, sinA, cosA * cosTheta);
            normals.push(normal.x, normal.y, normal.z);
            // uv
            uvs.push(u, useOpenGLOrientationForUV ? v / vl : 1 - v / vl);
            // save index of vertex in respective row
            indexRow.push(index);
            // increase index
            index++;
        }
        // now save vertices of the row in our index array
        indexArray.push(indexRow);
    }
    // generate indices
    for (x = 0; x < radialSegments; x++) {
        for (y = 0; y < capsTopSegments + heightSegments + capsBottomSegments; y++) {
            // we use the index array to access the correct indices
            const i1 = indexArray[y][x];
            const i2 = indexArray[y + 1][x];
            const i3 = indexArray[y + 1][x + 1];
            const i4 = indexArray[y][x + 1];
            // face one
            indices.push(i1);
            indices.push(i2);
            indices.push(i4);
            // face two
            indices.push(i2);
            indices.push(i3);
            indices.push(i4);
        }
    }

    indices = indices.reverse();

    if (options.orientation && !options.orientation.equals(Vector3.Up())) {
        const m = new Matrix();
        options.orientation
            .clone()
            .scale(Math.PI * 0.5)
            .cross(Vector3.Up())
            .toQuaternion()
            .toRotationMatrix(m);
        const v = Vector3.Zero();
        for (let i = 0; i < vertices.length; i += 3) {
            v.set(vertices[i], vertices[i + 1], vertices[i + 2]);
            Vector3.TransformCoordinatesToRef(v.clone(), m, v);
            vertices[i] = v.x;
            vertices[i + 1] = v.y;
            vertices[i + 2] = v.z;
        }
    }

    const vDat = new VertexData();
    vDat.positions = vertices;
    vDat.normals = normals;
    vDat.uvs = uvs;
    vDat.indices = indices;

    return vDat;
}

/**
 * The options Interface for creating a Capsule Mesh
 */
export interface ICreateCapsuleOptions {
    /** The Orientation of the capsule.  Default : Vector3.Up() */
    orientation?: Vector3;

    /** Number of sub segments on the tube section of the capsule running parallel to orientation. */
    subdivisions?: number;

    /** Number of cylindrical segments on the capsule. */
    tessellation?: number;

    /** Height or Length of the capsule. */
    height?: number;

    /** Radius of the capsule. */
    radius?: number;

    /** Number of sub segments on the cap sections of the capsule running parallel to orientation. */
    capSubdivisions?: number;

    /** Overwrite for the top radius. */
    radiusTop?: number;

    /** Overwrite for the bottom radius. */
    radiusBottom?: number;

    /** Overwrite for the top capSubdivisions. */
    topCapSubdivisions?: number;

    /** Overwrite for the bottom capSubdivisions. */
    bottomCapSubdivisions?: number;

    /** Internal geometry is supposed to change once created. */
    updatable?: boolean;
}

/**
 * Creates a capsule or a pill mesh
 * @param name defines the name of the mesh
 * @param options The constructors options.
 * @param scene The scene the mesh is scoped to.
 * @returns Capsule Mesh
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function CreateCapsule(
    name: string,
    options: ICreateCapsuleOptions = {
        orientation: Vector3.Up(),
        subdivisions: 2,
        tessellation: 16,
        height: 1,
        radius: 0.25,
        capSubdivisions: 6,
        updatable: false,
    },
    scene: Nullable<Scene> = null
): Mesh {
    const capsule = new Mesh(name, scene);
    const vertexData = CreateCapsuleVertexData(options);
    vertexData.applyToMesh(capsule, options.updatable);
    return capsule;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated please use CreateCapsule directly
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CapsuleBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateCapsule,
};

/**
 * Creates a capsule or a pill mesh
 * @param name defines the name of the mesh.
 * @param options the constructors options used to shape the mesh.
 * @param scene defines the scene the mesh is scoped to.
 * @returns the capsule mesh
 * @see https://doc.babylonjs.com/how_to/capsule_shape
 */
Mesh.CreateCapsule = (name: string, options: ICreateCapsuleOptions, scene?: Nullable<Scene>): Mesh => {
    return CreateCapsule(name, options, scene);
};

VertexData.CreateCapsule = CreateCapsuleVertexData;
