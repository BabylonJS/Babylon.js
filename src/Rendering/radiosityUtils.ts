import { Vector2, Vector3 } from "../Maths/math";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { VertexBuffer } from "../Meshes/buffer";
import { Scene } from "../scene";
import { Mesh } from "../Meshes/mesh";

/**
 * Utilities for the radiosity solver
 */
class RadiosityUtils {

    private static _tempEdgeBuffer: number[] = [-1, -1];

    private static appendToNew(arr: Float32Array | number[], newValues: number[]): Float32Array {
        var newArr = new Float32Array(arr.length + newValues.length);

        for (let i = 0; i < arr.length; i++) {
            newArr[i] = arr[i];
        }

        for (let i = 0; i < newValues.length; i++) {
            newArr[i + arr.length] = newValues[i];
        }

        return newArr;
    }

    /**
     * Recursively subdivides triangles in a mesh, so their area is under a fixed threshold
     * @param mesh The mesh
     * @param areaThreshold Area threshold
     * @param scene Current scene
     * @returns Another mesh, with higher or equal level of tesselation
     */
    public static RetesselateMesh(mesh: AbstractMesh, areaThreshold: number, scene: Scene): AbstractMesh {
        var indices = mesh.getIndices();
        var vertices = mesh.getVerticesData(VertexBuffer.PositionKind);
        var normals = mesh.getVerticesData(VertexBuffer.NormalKind);
        var uvs = mesh.getVerticesData(VertexBuffer.UVKind);
        var worldMat = mesh.computeWorldMatrix(true);

        if (!indices || !vertices || !normals || !uvs || !vertices.length) {
            return mesh;
        }

        var v0 = new Vector3(),
            v1 = new Vector3(),
            v2 = new Vector3();
        var n0 = new Vector3(),
            n1 = new Vector3(),
            n2 = new Vector3();
        var uv0 = new Vector2(),
            uv1 = new Vector2(),
            uv2 = new Vector2();

        var i0, i1, i2: number;

        var newPositions = [];
        var newNormals = [];
        var newUvs = [];

        var oldPositions = new Float32Array(vertices.length);
        var oldNormals = new Float32Array(normals.length);
        var oldUVs = uvs.slice(0);

        var newIndices: number[] = [];
        var tempPositionBuffer: Vector3[] = [];
        var tempNormalBuffer: Vector3[] = [];
        var tempUVBuffer: Vector2[] = [];
        var indexPointer = vertices.length / 3 - 1;

        for (let i = 0; i < indices.length; i += 3) {
            i0 = indices[i];
            i1 = indices[i + 1];
            i2 = indices[i + 2];
            uv0.copyFromFloats(uvs[i0 * 2], uvs[i0 * 2 + 1]);
            uv1.copyFromFloats(uvs[i1 * 2], uvs[i1 * 2 + 1]);
            uv2.copyFromFloats(uvs[i2 * 2], uvs[i2 * 2 + 1]);
            Vector3.TransformCoordinatesFromFloatsToRef(vertices[i0 * 3], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2], worldMat, v0);
            Vector3.TransformCoordinatesFromFloatsToRef(vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2], worldMat, v1);
            Vector3.TransformCoordinatesFromFloatsToRef(vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2], worldMat, v2);
            Vector3.TransformNormalFromFloatsToRef(normals[i0 * 3], normals[i0 * 3 + 1], normals[i0 * 3 + 2], worldMat, n0);
            Vector3.TransformNormalFromFloatsToRef(normals[i1 * 3], normals[i1 * 3 + 1], normals[i1 * 3 + 2], worldMat, n1);
            Vector3.TransformNormalFromFloatsToRef(normals[i2 * 3], normals[i2 * 3 + 1], normals[i2 * 3 + 2], worldMat, n2);

            oldPositions[i0 * 3] = v0.x;
            oldPositions[i0 * 3 + 1] = v0.y;
            oldPositions[i0 * 3 + 2] = v0.z;
            oldPositions[i1 * 3] = v1.x;
            oldPositions[i1 * 3 + 1] = v1.y;
            oldPositions[i1 * 3 + 2] = v1.z;
            oldPositions[i2 * 3] = v2.x;
            oldPositions[i2 * 3 + 1] = v2.y;
            oldPositions[i2 * 3 + 2] = v2.z;

            oldNormals[i0 * 3] = n0.x;
            oldNormals[i0 * 3 + 1] = n0.y;
            oldNormals[i0 * 3 + 2] = n0.z;
            oldNormals[i1 * 3] = n1.x;
            oldNormals[i1 * 3 + 1] = n1.y;
            oldNormals[i1 * 3 + 2] = n1.z;
            oldNormals[i2 * 3] = n2.x;
            oldNormals[i2 * 3 + 1] = n2.y;
            oldNormals[i2 * 3 + 2] = n2.z;

            tempPositionBuffer.length = 0;
            tempNormalBuffer.length = 0;
            tempUVBuffer.length = 0;

            indexPointer = RadiosityUtils.subdiviseRec(v0, v1, v2, n0, n1, n2, uv0, uv1, uv2, i0, i1, i2, areaThreshold, tempPositionBuffer, tempNormalBuffer, tempUVBuffer, newIndices, indexPointer);

            for (let j = 0; j < tempPositionBuffer.length; j++) {
                newPositions.push(tempPositionBuffer[j].x, tempPositionBuffer[j].y, tempPositionBuffer[j].z);
                newNormals.push(tempNormalBuffer[j].x, tempNormalBuffer[j].y, tempNormalBuffer[j].z);
            }

            for (let j = 0; j < tempUVBuffer.length; j++) {
                newUvs.push(tempUVBuffer[j].x, tempUVBuffer[j].y);
            }
        }

        var m = new Mesh(mesh.name, scene);
        m.setIndices(newIndices, (oldPositions.length + newPositions.length) / 3);
        m.setVerticesData(VertexBuffer.PositionKind, RadiosityUtils.appendToNew(oldPositions, newPositions));
        m.setVerticesData(VertexBuffer.NormalKind, RadiosityUtils.appendToNew(oldNormals, newNormals));
        m.setVerticesData(VertexBuffer.UVKind, RadiosityUtils.appendToNew(oldUVs, newUvs));
        (<any>m).color = (<any>mesh).color;

        mesh.dispose();

        return m;
    }

    private static subdiviseRec(v0: Vector3,
        v1: Vector3,
        v2: Vector3,
        n0: Vector3,
        n1: Vector3,
        n2: Vector3,
        uv0: Vector2,
        uv1: Vector2,
        uv2: Vector2,
        i0: number,
        i1: number,
        i2: number,
        areaThreshold: number,
        buffer: Vector3[],
        normBuffer: Vector3[],
        uvBuffer: Vector2[],
        indices: number[],
        indexPointer: number): number {

        if (RadiosityUtils.triangleArea(v0, v1, v2) <= areaThreshold) {
            indices.push(i0, i1, i2);
            return indexPointer;
        }

        // Subdivision
        var side = RadiosityUtils.findBiggestSide(v0, v1, v2);
        let vecs = [v0, v1, v2];
        let norms = [n0, n1, n2];
        let uvs = [uv0, uv1, uv2];
        let e0 = vecs[side[0]];
        let e1 = vecs[side[1]];
        let norm0 = norms[side[0]];
        let norm1 = norms[side[1]];
        let uvFor0 = uvs[side[0]];
        let uvFor1 = uvs[side[1]];
        let middle = e1.add(e0).scaleInPlace(0.5);
        let interpNormal = norm1.add(norm0).normalize();
        let interpUv = uvFor0.add(uvFor1).scaleInPlace(0.5);

        indexPointer++;
        let ni0 = [i0, i1, i2];
        let ni1 = [i0, i1, i2];
        let nv0 = vecs.slice(0);
        let nv1 = vecs.slice(0);
        let nn0 = norms.slice(0);
        let nn1 = norms.slice(0);
        let nuv0 = uvs.slice(0);
        let nuv1 = uvs.slice(0);

        ni0[side[0]] = indexPointer;
        ni1[side[1]] = indexPointer;
        nv0[side[0]] = middle;
        nv1[side[1]] = middle;
        nn0[side[0]] = interpNormal;
        nn1[side[1]] = interpNormal;
        nuv0[side[0]] = interpUv;
        nuv1[side[1]] = interpUv;

        buffer.push(middle);
        normBuffer.push(interpNormal);
        uvBuffer.push(interpUv);

        indexPointer = RadiosityUtils.subdiviseRec(nv0[0], nv0[1], nv0[2], nn0[0], nn0[1], nn0[2], nuv0[0], nuv0[1], nuv0[2], ni0[0], ni0[1], ni0[2], areaThreshold, buffer, normBuffer, uvBuffer, indices, indexPointer);
        return RadiosityUtils.subdiviseRec(nv1[0], nv1[1], nv1[2], nn1[0], nn1[1], nn1[2], nuv1[0], nuv1[1], nuv1[2], ni1[0], ni1[1], ni1[2], areaThreshold, buffer, normBuffer, uvBuffer, indices, indexPointer);
    }

    private static findBiggestSide(v0: Vector3, v1: Vector3, v2: Vector3): number[] {
        // TODO : buffer this
        let l10 = v1.subtract(v0).lengthSquared();
        let l20 = v2.subtract(v0).lengthSquared();
        let l21 = v2.subtract(v1).lengthSquared();

        if (l10 >= l20 && l10 >= l21) {
            RadiosityUtils._tempEdgeBuffer = [1, 0];
        }

        if (l20 >= l10 && l20 >= l21) {
            RadiosityUtils._tempEdgeBuffer = [2, 0];
        }

        if (l21 >= l10 && l21 >= l20) {
            RadiosityUtils._tempEdgeBuffer = [2, 1];
        }

        return RadiosityUtils._tempEdgeBuffer;
    }

    private static triangleArea(v0: Vector3, v1: Vector3, v2: Vector3) {
        // TODO : buffer this
        let v10 = v1.subtract(v0);
        let v20 = v2.subtract(v0);
        let c = Vector3.Cross(v10, v20);
        return 0.5 * c.length();
    }

    /**
     * Encodes a number into a Vector3
     * @param n Numeric id
     * @returns Encoded id
     */
    public static EncodeId(n: number) {
        var id = new Vector3();
        var remain = n;
        id.x = remain % 256;
        remain = Math.floor(remain / 256);
        id.y = remain % 256;
        remain = Math.floor(remain / 256);
        id.z = remain % 256;

        return id;
    }

    /**
     * Decodes a number from a Vector3
     * @param v Encoded number
     * @returns Decoded id
     */
    public static DecodeId(v: Vector3) {
        return (v.x + 256 * v.y + 65536 * v.z);
    }
}

export { RadiosityUtils };