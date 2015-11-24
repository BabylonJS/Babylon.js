module BABYLON {
    export class Layer {
        public texture: Texture;
        public isBackground: boolean;
        public color: Color4;
        public onDispose: () => void;
        public alphaBlendingMode = Engine.ALPHA_COMBINE;

        private _scene: Scene;
        private _vertexDeclaration = [2];
        private _vertexStrideSize = 2 * 4;
        private _vertexBuffer: WebGLBuffer;
        private _indexBuffer: WebGLBuffer;
        private _effect: Effect;

        constructor(public name: string, imgUrl: string, scene: Scene, isBackground?: boolean, color?: Color4) {
            this.texture = imgUrl ? new Texture(imgUrl, scene, true) : null;
            this.isBackground = isBackground === undefined ? true : isBackground;
            this.color = color === undefined ? new Color4(1, 1, 1, 1) : color;

            this._scene = scene;
            this._scene.layers.push(this);

            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);

            this._vertexBuffer = scene.getEngine().createVertexBuffer(vertices);

            // Indices
            var indices = [];
            indices.push(0);
            indices.push(1);
            indices.push(2);

            indices.push(0);
            indices.push(2);
            indices.push(3);

            this._indexBuffer = scene.getEngine().createIndexBuffer(indices);

            // Effects
            this._effect = this._scene.getEngine().createEffect("layer",
                ["position"],
                ["textureMatrix", "color"],
                ["textureSampler"], "");
        }

        public render(): void {
            // Check
            if (!this._effect.isReady() || !this.texture || !this.texture.isReady())
                return;

            var engine = this._scene.getEngine();

            // Render
            engine.enableEffect(this._effect);
            engine.setState(false);

            // Texture
            this._effect.setTexture("textureSampler", this.texture);
            this._effect.setMatrix("textureMatrix", this.texture.getTextureMatrix());

            // Color
            this._effect.setFloat4("color", this.color.r, this.color.g, this.color.b, this.color.a);

            // VBOs
            engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, this._effect);

            // Draw order
            engine.setAlphaMode(this.alphaBlendingMode);
            engine.draw(true, 0, 6);
            engine.setAlphaMode(Engine.ALPHA_DISABLE);
        }

        public dispose(): void {
            if (this._vertexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._vertexBuffer);
                this._vertexBuffer = null;
            }

            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }

            if (this.texture) {
                this.texture.dispose();
                this.texture = null;
            }

            // Remove from scene
            var index = this._scene.layers.indexOf(this);
            this._scene.layers.splice(index, 1);

            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        }
    }
} 