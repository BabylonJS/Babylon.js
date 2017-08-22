module BABYLON {
    
    export class OcclusionBoundingBoxRenderer {
        private _scene: Scene;
        private _colorShader: ShaderMaterial;
        private _vertexBuffers: { [key: string]: VertexBuffer } = {};
        private _indexBuffer: WebGLBuffer;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        private _prepareRessources(): void {
            if (this._colorShader) {
                return;
            }

            this._colorShader = new ShaderMaterial("colorShader", this._scene, "color",
                {
                    attributes: [VertexBuffer.PositionKind],
                    uniforms: ["world", "viewProjection", "color"]
                });

            var engine = this._scene.getEngine();
            var boxdata = VertexData.CreateBox({ size: 1.0 });
            this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, boxdata.positions, VertexBuffer.PositionKind, false);
            this._indexBuffer = engine.createIndexBuffer([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 7, 1, 6, 2, 5, 3, 4]);
        }

        public render(mesh: AbstractMesh): void {

            this._prepareRessources();

            if (!this._colorShader.isReady()) {
                return;
            }

            var engine = this._scene.getEngine();
            engine.setDepthWrite(false);
            engine.setColorWrite(false);
            this._colorShader._preBind();

            var boundingBox = mesh._boundingInfo.boundingBox;
            var min = boundingBox.minimum;
            var max = boundingBox.maximum;
            var diff = max.subtract(min);
            var median = min.add(diff.scale(0.5));

            var worldMatrix = Matrix.Scaling(diff.x, diff.y, diff.z)
                .multiply(Matrix.Translation(median.x, median.y, median.z))
                .multiply(boundingBox.getWorldMatrix());

            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._colorShader.getEffect());

            engine.setDepthFunctionToLess();
            this._scene.resetCachedMaterial();
            this._colorShader.bind(worldMatrix);

            engine.draw(false, 0, 24);

            this._colorShader.unbind();
            engine.setDepthFunctionToLessOrEqual();
            engine.setDepthWrite(true);
            engine.setColorWrite(true);
        }

        public dispose(): void {
            if (!this._colorShader) {
                return;
            }

            this._colorShader.dispose();

            var buffer = this._vertexBuffers[VertexBuffer.PositionKind];
            if (buffer) {
                buffer.dispose();
                this._vertexBuffers[VertexBuffer.PositionKind] = null;
            }
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
        }
    }
}