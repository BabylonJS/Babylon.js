/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {

    export class STLFileLoader implements ISceneLoaderPlugin {

        public solidPattern = /solid (\S*)([\S\s]*)endsolid[ ]*(\S*)/g;
        public facetsPattern = /facet([\s\S]*?)endfacet/g;
        public normalPattern = /normal[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
        public vertexPattern = /vertex[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;


        public name = "stl";

        // force data to come in as an ArrayBuffer
        // we'll convert to string if it looks like it's an ASCII .stl
        public extensions: ISceneLoaderPluginExtensions = {
            ".stl": {isBinary: true},
        };

        public importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: Nullable<AbstractMesh[]>, particleSystems: Nullable<ParticleSystem[]>, skeletons: Nullable<Skeleton[]>): boolean {
            var matches;

            if (this.isBinary(data)) {
                // binary .stl
                var babylonMesh = new Mesh("stlmesh", scene);
                this.parseBinary(babylonMesh, data);
                if (meshes) {
                    meshes.push(babylonMesh);
                }
                return true;
            }

            // ASCII .stl

            // convert to string
            var array_buffer = new Uint8Array(data);
            var str = '';
            for (var i = 0; i < data.byteLength; i++) {
                str += String.fromCharCode( array_buffer[ i ] ); // implicitly assumes little-endian
            }
            data = str;

            while (matches = this.solidPattern.exec(data)) {
                var meshName = matches[1];
                var meshNameFromEnd = matches[3];
                if (meshName != meshNameFromEnd) {
                    Tools.Error("Error in STL, solid name != endsolid name");
                    return false;
                }

                // check meshesNames
                if (meshesNames && meshName) {
                    if (meshesNames instanceof Array) {
                        if (!meshesNames.indexOf(meshName)) {
                            continue;
                        }
                    } else {
                        if (meshName !== meshesNames) {
                            continue;
                        }
                    }
                }

                // stl mesh name can be empty as well
                meshName = meshName || "stlmesh";

                var babylonMesh = new Mesh(meshName, scene);
                this.parseASCII(babylonMesh, matches[2]);
                if (meshes) {
                    meshes.push(babylonMesh);
                }
            }

            return true;

        }

        public load(scene: Scene, data: any, rootUrl: string): boolean {
            var result = this.importMesh(null, scene, data, rootUrl, null, null, null);

            if (result) {
                scene.createDefaultCameraOrLight();
            }

            return result;
        }

        private isBinary (data: any) {

            // check if file size is correct for binary stl
            var faceSize, nFaces, reader;
            reader = new DataView(data);
            faceSize = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8);
            nFaces = reader.getUint32( 80, true );

            if (80 + (32 / 8) + (nFaces * faceSize) === reader.byteLength) {
                return true;
            }

            // check characters higher than ASCII to confirm binary
            var fileLength = reader.byteLength;
            for (var index=0; index < fileLength; index++) {
                if (reader.getUint8( index ) > 127) {
                    return true;
                }
            }

            return false;
        }

        private parseBinary(mesh: Mesh, data: ArrayBuffer) {

            var reader = new DataView(data);
            var faces = reader.getUint32(80, true);

            var dataOffset = 84;
            var faceLength = 12 * 4 + 2;

            var offset = 0;

            var positions = new Float32Array(faces * 3 * 3);
            var normals = new Float32Array(faces * 3 * 3);
            var indices = new Uint32Array(faces * 3);
            var indicesCount = 0;

            for (var face = 0; face < faces; face++) {

                var start = dataOffset + face * faceLength;
                var normalX = reader.getFloat32( start, true );
                var normalY = reader.getFloat32( start + 4, true );
                var normalZ = reader.getFloat32( start + 8, true );


                for (var i = 1; i <= 3; i++) {

                    var vertexstart = start + i * 12;

                    // ordering is intentional to match ascii import
                    positions[offset] = reader.getFloat32( vertexstart, true );
                    positions[offset + 2] = reader.getFloat32( vertexstart + 4, true );
                    positions[offset + 1] = reader.getFloat32( vertexstart + 8, true );

                    normals[offset] = normalX;
                    normals[offset + 2] = normalY;
                    normals[offset + 1] = normalZ;

                    offset += 3;
                }
                indices[indicesCount] = indicesCount++;
                indices[indicesCount] = indicesCount++;
                indices[indicesCount] = indicesCount++;
            }

            mesh.setVerticesData(VertexBuffer.PositionKind, positions);
            mesh.setVerticesData(VertexBuffer.NormalKind, normals);
            mesh.setIndices(indices);
            mesh.computeWorldMatrix(true);
        }

        private parseASCII(mesh: Mesh, solidData: string) {

            var positions = [];
            var normals = [];
            var indices = [];
            var indicesCount = 0;

            //load facets, ignoring loop as the standard doesn't define it can contain more than vertices
            var matches;
            while (matches = this.facetsPattern.exec(solidData)) {
                var facet = matches[1];
                //one normal per face
                var normalMatches = this.normalPattern.exec(facet);
                this.normalPattern.lastIndex = 0;
                if (!normalMatches) {
                    continue;
                }
                var normal = [Number(normalMatches[1]), Number(normalMatches[5]), Number(normalMatches[3])];

                var vertexMatch;
                while (vertexMatch = this.vertexPattern.exec(facet)) {
                    positions.push(Number(vertexMatch[1]), Number(vertexMatch[5]), Number(vertexMatch[3]));
                    normals.push(normal[0], normal[1], normal[2]);
                }
                indices.push(indicesCount++, indicesCount++, indicesCount++);
                this.vertexPattern.lastIndex = 0;
            }

            this.facetsPattern.lastIndex = 0;
            mesh.setVerticesData(VertexBuffer.PositionKind, positions);
            mesh.setVerticesData(VertexBuffer.NormalKind, normals);
            mesh.setIndices(indices);
            mesh.computeWorldMatrix(true);
        }
    }

    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new STLFileLoader());
    }
}