import { VertexData } from "../mesh.vertexData";
import { Vector2, Vector3 } from "../../Maths/math.vector";
import { Mesh, _CreationDataStorage } from "../mesh";
    /** based off of https://github.com/maximeq/three-js-capsule-geometry/blob/master/src/CapsuleBufferGeometry.js
     * @param options the constructors options used to shape the mesh.
     * @returns the capsule VertexData
     * @see https://doc.babylonjs.com/how_to/capsule_shape
     */
VertexData.CreateCapsule = function(
    options: ICreateCapsuleOptions = {
        orientation : Vector3.Up(),
        subdivisions: 2,
        tessellation: 16,
        height: 1,
        radius: 0.25,
        capSubdivisions: 6
    }): VertexData {
    //let path = options.orientation || Vector3.Up()
    let subdivisions = Math.max(options.subdivisions ? options.subdivisions : 2, 1);
    let tessellation = Math.max(options.tessellation ? options.tessellation : 16, 3);
    let height = Math.max(options.height ? options.height : 2, 0.);
    let radius = Math.max(options.radius ? options.radius : 1, 0.);
    let capDetail = Math.max(options.capSubdivisions ? options.capSubdivisions : 6, 1);

    let  radialSegments = tessellation;
    let  heightSegments = subdivisions;

    let radiusTop = Math.max(options.radiusTop ? options.radiusTop : radius, 0.);
    let radiusBottom = Math.max(options.radiusBottom ? options.radiusBottom : radius, 0.);

    let thetaStart = 0.0;
    let thetaLength = (2.0 * Math.PI);

    let capsTopSegments = Math.max(options.topCapSubdivisions ? options.topCapSubdivisions : capDetail, 1);
    let capsBottomSegments = Math.max(options.bottomCapSubdivisions ? options.bottomCapSubdivisions : capDetail, 1);

    var alpha = Math.acos((radiusBottom - radiusTop) / height);

    var indices = [];
    var vertices = [];
    var normals = [];
    var uvs = [];

    var index = 0,
        //indexOffset = 0,
        indexArray = [],
        halfHeight = height / 2;

    var x, y;
    var normal = Vector3.Zero();
    var vertex = Vector3.Zero();

        var cosAlpha = Math.cos(alpha);
        var sinAlpha = Math.sin(alpha);

        var cone_length =
            new Vector2(
                radiusTop * sinAlpha,
                halfHeight + radiusTop * cosAlpha
                ).subtract(new Vector2(
                    radiusBottom * sinAlpha,
                    -halfHeight + radiusBottom * cosAlpha
                )
            ).length();

        // Total length for v texture coord
        var vl = radiusTop * alpha
                 + cone_length
                 + radiusBottom * (Math.PI / 2 - alpha);

        //var groupCount = 0;

        // generate vertices, normals and uvs

        var v = 0;
        for (y = 0; y <= capsTopSegments; y++) {

            var indexRow = [];

            var a = Math.PI / 2 - alpha * (y / capsTopSegments);

            v += radiusTop * alpha / capsTopSegments;

            var cosA = Math.cos(a);
            var sinA = Math.sin(a);

            // calculate the radius of the current row
            var _radius = cosA * radiusTop;

            for (x = 0; x <= radialSegments; x ++) {

                var u = x / radialSegments;

                var theta = u * thetaLength + thetaStart;

                var sinTheta = Math.sin(theta);
                var cosTheta = Math.cos(theta);

                // vertex
                vertex.x = _radius * sinTheta;
                vertex.y = halfHeight + sinA * radiusTop;
                vertex.z = _radius * cosTheta;
                vertices.push(vertex.x, vertex.y, vertex.z);

                // normal
                normal.set(cosA * sinTheta, sinA, cosA * cosTheta);
                normals.push(normal.x, normal.y, normal.z);
                // uv
                uvs.push(u, 1 - v / vl);
                // save index of vertex in respective row
                indexRow.push(index);
                // increase index
                index ++;
            }

            // now save vertices of the row in our index array
            indexArray.push(indexRow);

        }

        var cone_height = height + cosAlpha * radiusTop - cosAlpha * radiusBottom;
        var slope = sinAlpha * (radiusBottom - radiusTop) / cone_height;
        for (y = 1; y <= heightSegments; y++) {

            var indexRow = [];

            v += cone_length / heightSegments;

            // calculate the radius of the current row
            var _radius = sinAlpha * (y * (radiusBottom - radiusTop) / heightSegments + radiusTop);

            for (x = 0; x <= radialSegments; x ++) {

                var u = x / radialSegments;

                var theta = u * thetaLength + thetaStart;

                var sinTheta = Math.sin(theta);
                var cosTheta = Math.cos(theta);

                // vertex
                vertex.x = _radius * sinTheta;
                vertex.y = halfHeight + cosAlpha * radiusTop - y * cone_height / heightSegments;
                vertex.z = _radius * cosTheta;
                vertices.push(vertex.x, vertex.y, vertex.z);

                // normal
                normal.set(sinTheta, slope, cosTheta).normalize();
                normals.push(normal.x, normal.y, normal.z);

                // uv
                uvs.push(u, 1 - v / vl);

                // save index of vertex in respective row
                indexRow.push(index);

                // increase index
                index ++;

            }

            // now save vertices of the row in our index array
            indexArray.push(indexRow);

        }

        for (y = 1; y <= capsBottomSegments; y++) {

            var indexRow = [];

            var a = (Math.PI / 2 - alpha) - (Math.PI - alpha) * (y / capsBottomSegments);

            v += radiusBottom * alpha / capsBottomSegments;

            var cosA = Math.cos(a);
            var sinA = Math.sin(a);

            // calculate the radius of the current row
            var _radius = cosA * radiusBottom;

            for (x = 0; x <= radialSegments; x ++) {

                var u = x / radialSegments;

                var theta = u * thetaLength + thetaStart;

                var sinTheta = Math.sin(theta);
                var cosTheta = Math.cos(theta);

                // vertex
                vertex.x = _radius * sinTheta;
                vertex.y = -halfHeight + sinA * radiusBottom;
                vertex.z = _radius * cosTheta;
                vertices.push(vertex.x, vertex.y, vertex.z);

                // normal
                normal.set(cosA * sinTheta, sinA, cosA * cosTheta);
                normals.push(normal.x, normal.y, normal.z);

                // uv
                uvs.push(u, 1 - v / vl);

                // save index of vertex in respective row
                indexRow.push(index);
                // increase index
                index ++;
            }
            // now save vertices of the row in our index array
            indexArray.push(indexRow);
        }
        // generate indices
        for (x = 0; x < radialSegments; x ++) {
            for (y = 0; y < capsTopSegments + heightSegments + capsBottomSegments; y ++) {
                // we use the index array to access the correct indices
                var i1 = indexArray[ y ][ x ];
                var i2 = indexArray[ y + 1 ][ x ];
                var i3 = indexArray[ y + 1 ][ x + 1 ];
                var i4 = indexArray[ y ][ x + 1 ];
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

       let vDat = new VertexData();
       vDat.positions = vertices;
       vDat.normals = normals;
       vDat.uvs = uvs;
       vDat.indices = indices;

       return vDat;
};

/**
 * The options Interface for creating a Capsule Mesh
 */
export interface ICreateCapsuleOptions{
    /** The Orientation of the capsule.  Default : Vector3.Up() */
    orientation: Vector3;

    /** Number of sub segments on the tube section of the capsule running parallel to orientation. */
    subdivisions: number;

    /** Number of cylindrical segments on the capsule. */
    tessellation: number;

    /** Height or Length of the capsule. */
    height: number;

    /** Radius of the capsule. */
    radius: number;

    /** Height or Length of the capsule. */
    capSubdivisions: number;

    /** Overwrite for the top radius. */
    radiusTop?: number;

    /** Overwrite for the bottom radius. */
    radiusBottom?: number;

    /** Overwrite for the top capSubdivisions. */
    topCapSubdivisions?: number;

    /** Overwrite for the bottom capSubdivisions. */
    bottomCapSubdivisions?: number;
}

/**
 * Creates a capsule or a pill mesh
 * @param name defines the name of the mesh.
 * @param options the constructors options used to shape the mesh.
 * @param scene defines the scene the mesh is scoped to.
 * @returns the capsule mesh
 * @see https://doc.babylonjs.com/how_to/capsule_shape
 */
Mesh.CreateCapsule = (name: string, options: ICreateCapsuleOptions, scene): Mesh => {
    return CapsuleBuilder.CreateCapsule(name, options, scene);
};
/**
 * Class containing static functions to help procedurally build meshes
 */
export class CapsuleBuilder {
    /**
     * Creates a capsule or a pill mesh
     * @param name defines the name of the mesh
     * @param options The constructors options.
     * @param scene The scene the mesh is scoped to.
     * @returns Capsule Mesh
     */
    public static CreateCapsule(name: string, options: ICreateCapsuleOptions = {
            orientation : Vector3.Up(),
            subdivisions: 2,
            tessellation: 16,
            height: 1,
            radius: 0.25,
            capSubdivisions: 6
        }, scene: any): Mesh {

        var capsule = new Mesh(name, scene);
        var vertexData = VertexData.CreateCapsule(options);
        vertexData.applyToMesh(capsule);
        return capsule;
    }
}