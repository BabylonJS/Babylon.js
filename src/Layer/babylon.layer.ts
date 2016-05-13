module BABYLON {
    export class Layer {
        public texture: Texture;
        public isBackground: boolean;
        public color: Color4;
        public scale = new Vector2(1, 1);
        public offset = new Vector2(0, 0);
        public alphaBlendingMode = Engine.ALPHA_COMBINE;
        public alphaTest: boolean;

        private _scene: Scene;
        private _vertexDeclaration = [2];
        private _vertexStrideSize = 2 * 4;
        private _vertexBuffer: WebGLBuffer;
        private _indexBuffer: WebGLBuffer;
        private _effect: Effect;
        private _alphaTestEffect: Effect;


        // Events

        /**
        * An event triggered when the layer is disposed.
        * @type {BABYLON.Observable}
        */
        public onDisposeObservable = new Observable<Layer>();

        private _onDisposeObserver: Observer<Layer>;
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        /**
        * An event triggered before rendering the scene
        * @type {BABYLON.Observable}
        */
        public onBeforeRenderObservable = new Observable<Layer>();

        private _onBeforeRenderObserver: Observer<Layer>;
        public set onBeforeRender(callback: () => void) {
            if (this._onBeforeRenderObserver) {
                this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            }
            this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
        }

        /**
        * An event triggered after rendering the scene
        * @type {BABYLON.Observable}
        */
        public onAfterRenderObservable = new Observable<Layer>();

        private _onAfterRenderObserver: Observer<Layer>;
        public set onAfterRender(callback: () => void) {
            if (this._onAfterRenderObserver) {
                this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
            }
            this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
        }

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
                ["textureMatrix", "color", "scale", "offset"],
                ["textureSampler"], "");

            this._alphaTestEffect = this._scene.getEngine().createEffect("layer",
                ["position"],
                ["textureMatrix", "color", "scale", "offset"],
                ["textureSampler"], "#define ALPHATEST");
        }

        public render(): void {
            var currentEffect = this.alphaTest ? this._alphaTestEffect : this._effect;

            // Check
            if (!currentEffect.isReady() || !this.texture || !this.texture.isReady())
                return;

            var engine = this._scene.getEngine();

            this.onBeforeRenderObservable.notifyObservers(this);

            // Render
            engine.enableEffect(currentEffect);
            engine.setState(false);


            // Texture
            currentEffect.setTexture("textureSampler", this.texture);
            currentEffect.setMatrix("textureMatrix", this.texture.getTextureMatrix());

            // Color
            currentEffect.setFloat4("color", this.color.r, this.color.g, this.color.b, this.color.a);

            // Scale / offset
            currentEffect.setVector2("offset", this.offset);
            currentEffect.setVector2("scale", this.scale);

            // VBOs
            engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, currentEffect);

            // Draw order
            if (!this._alphaTestEffect) {
                engine.setAlphaMode(this.alphaBlendingMode);
                engine.draw(true, 0, 6);
                engine.setAlphaMode(Engine.ALPHA_DISABLE);
            }
            else {
                engine.draw(true, 0, 6);
            }

            this.onAfterRenderObservable.notifyObservers(this);
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
            this.onDisposeObservable.notifyObservers(this);

            this.onDisposeObservable.clear();
            this.onAfterRenderObservable.clear();
            this.onBeforeRenderObservable.clear();
        }
    }
} 