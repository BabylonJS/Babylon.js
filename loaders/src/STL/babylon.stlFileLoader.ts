/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {

    export class STLFileLoader implements ISceneLoaderPlugin {

        public solidPattern = /solid (\S*)([\S\s]*)endsolid[ ]*(\S*)/g;
        public facetsPattern = /facet([\s\S]*?)endfacet/g;
        public normalPattern = /normal[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
        public vertexPattern = /vertex[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;

        public extensions = ".stl";

        public importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]): boolean {
            var matches;

            while (matches = this.solidPattern.exec(data)) {
                var meshName = matches[1];
                var meshNameFromEnd = matches[3];
                if (meshName != meshNameFromEnd) {
                    console.log("error in stl, solid name != endsolid name");
                }

                //check meshesNames
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

                //stl mesh name can be empty as well
                meshName = meshName || "stlmesh";
                var babylonMesh = new Mesh(meshName, scene);
                this.parseSolid(babylonMesh, matches[2]);
            }

            return true;
        }

        public load(scene: Scene, data: string, rootUrl: string): boolean {
            var result = this.importMesh(null, scene, data, rootUrl, null, null, null);

            if (result) {
                scene.createDefaultCameraOrLight();
            }

            return result;
        }

        private parseSolid(mesh: Mesh, solidData: string) {
            var normals = [];
            var positions = [];
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

    BABYLON.SceneLoader.RegisterPlugin(new STLFileLoader());
}