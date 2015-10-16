module BABYLON {
    export class MeshBuilder {
        public static CreateBox(name: string, options: { width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, updatable?: boolean }, scene: Scene): Mesh {
            var box = new Mesh(name, scene);
            var vertexData = VertexData.CreateBox(options);

            vertexData.applyToMesh(box, options.updatable);

            return box;
        }
    }
}