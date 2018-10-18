module BABYLON {

    /**
     * This represents a full screen 2d layer.
     * This can be usefull to display a picture in the  background of your scene for instance.
     * @see https://www.babylonjs-playground.com/#08A2BS#1
     */
    export class Layer {
        /**
         * Define the texture the layer should display.
         */
        public texture: Nullable<Texture>;

        /**
         * Is the layer in background or foreground.
         */
        public isBackground: boolean;

        /**
         * Define the color of the layer (instead of texture).
         */
        public color: Color4;

        /**
         * Define the scale of the layer in order to zoom in out of the texture.
         */
        public scale = new Vector2(1, 1);

        /**
         * Define an offset for the layer in order to shift the texture.
         */
        public offset = new Vector2(0, 0);

        /**
         * Define the alpha blending mode used in the layer in case the texture or color has an alpha.
         */
        public alphaBlendingMode = Engine.ALPHA_COMBINE;

        /**
         * Define if the layer should alpha test or alpha blend with the rest of the scene.
         * Alpha test will not mix with the background color in case of transparency.
         * It will either use the texture color or the background depending on the alpha value of the current pixel.
         */
        public alphaTest: boolean;

        /**
         * Define a mask to restrict the layer to only some of the scene cameras.
         */
        public layerMask: number = 0x0FFFFFFF;

        private _scene: Scene;
        private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
        private _indexBuffer: Nullable<WebGLBuffer>;
        private _effect: Effect;
        private _alphaTestEffect: Effect;

        /**
         * An event triggered when the layer is disposed.
         */
        public onDisposeObservable = new Observable<Layer>();

        private _onDisposeObserver: Nullable<Observer<Layer>>;
        /**
         * Back compatibility with callback before the onDisposeObservable existed.
         * The set callback will be triggered when the layer has been disposed.
         */
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        /**
        * An event triggered before rendering the scene
        */
        public onBeforeRenderObservable = new Observable<Layer>();

        private _onBeforeRenderObserver: Nullable<Observer<Layer>>;
        /**
         * Back compatibility with callback before the onBeforeRenderObservable existed.
         * The set callback will be triggered just before rendering the layer.
         */
        public set onBeforeRender(callback: () => void) {
            if (this._onBeforeRenderObserver) {
                this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            }
            this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
        }

        /**
        * An event triggered after rendering the scene
        */
        public onAfterRenderObservable = new Observable<Layer>();

        private _onAfterRenderObserver: Nullable<Observer<Layer>>;
        /**
         * Back compatibility with callback before the onAfterRenderObservable existed.
         * The set callback will be triggered just after rendering the layer.
         */
        public set onAfterRender(callback: () => void) {
            if (this._onAfterRenderObserver) {
                this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
            }
            this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
        }

        /**
         * Instantiates a new layer.
         * This represents a full screen 2d layer.
         * This can be usefull to display a picture in the  background of your scene for instance.
         * @see https://www.babylonjs-playground.com/#08A2BS#1
         * @param name Define the name of the layer in the scene
         * @param imgUrl Define the url of the texture to display in the layer
         * @param scene Define the scene the layer belongs to
         * @param isBackground Defines whether the layer is displayed in front or behind the scene
         * @param color Defines a color for the layer
         */
        constructor(
            /**
             * Define the name of the layer.
             */
            public name: string,
            imgUrl: Nullable<string>,
            scene: Nullable<Scene>,
            isBackground?: boolean, color?: Color4) {

            this.texture = imgUrl ? new Texture(imgUrl, scene, true) : null;
            this.isBackground = isBackground === undefined ? true : isBackground;
            this.color = color === undefined ? new Color4(1, 1, 1, 1) : color;

            this._scene = <Scene>(scene || Engine.LastCreatedScene);
            let layerComponent = this._scene._getComponent(SceneComponentConstants.NAME_LAYER) as LayerSceneComponent;
            if (!layerComponent) {
                layerComponent = new LayerSceneComponent(this._scene);
                this._scene._addComponent(layerComponent);
            }
            this._scene.layers.push(this);

            var engine = this._scene.getEngine();

            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);

            var vertexBuffer = new VertexBuffer(engine, vertices, VertexBuffer.PositionKind, false, false, 2);
            this._vertexBuffers[VertexBuffer.PositionKind] = vertexBuffer;

            this._createIndexBuffer();

            // Effects
            this._effect = engine.createEffect("layer",
                [VertexBuffer.PositionKind],
                ["textureMatrix", "color", "scale", "offset"],
                ["textureSampler"], "");

            this._alphaTestEffect = engine.createEffect("layer",
                [VertexBuffer.PositionKind],
                ["textureMatrix", "color", "scale", "offset"],
                ["textureSampler"], "#define ALPHATEST");
        }

        private _createIndexBuffer(): void {
            var engine = this._scene.getEngine();

            // Indices
            var indices = [];
            indices.push(0);
            indices.push(1);
            indices.push(2);

            indices.push(0);
            indices.push(2);
            indices.push(3);

            this._indexBuffer = engine.createIndexBuffer(indices);
        }

        /** @hidden */
        public _rebuild(): void {
            let vb = this._vertexBuffers[VertexBuffer.PositionKind];

            if (vb) {
                vb._rebuild();
            }

            this._createIndexBuffer();
        }

        /**
         * Renders the layer in the scene.
         */
        public render(): void {
            var currentEffect = this.alphaTest ? this._alphaTestEffect : this._effect;

            // Check
            if (!currentEffect.isReady() || !this.texture || !this.texture.isReady()) {
                return;
            }

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
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, currentEffect);

            // Draw order
            if (!this.alphaTest) {
                engine.setAlphaMode(this.alphaBlendingMode);
                engine.drawElementsType(Material.TriangleFillMode, 0, 6);
                engine.setAlphaMode(Engine.ALPHA_DISABLE);
            }
            else {
                engine.drawElementsType(Material.TriangleFillMode, 0, 6);
            }

            this.onAfterRenderObservable.notifyObservers(this);
        }

        /**
         * Disposes and releases the associated ressources.
         */
        public dispose(): void {
            var vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
            if (vertexBuffer) {
                vertexBuffer.dispose();
                this._vertexBuffers[VertexBuffer.PositionKind] = null;
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
