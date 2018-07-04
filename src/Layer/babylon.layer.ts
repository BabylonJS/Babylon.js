﻿module BABYLON {
    export class Layer {
        public texture: Nullable<Texture>;
        public isBackground: boolean;
        public color: Color4;
        public scale = new Vector2(1, 1);
        public offset = new Vector2(0, 0);
        public alphaBlendingMode = Engine.ALPHA_COMBINE;
        public alphaTest: boolean;
        public layerMask: number = 0x0FFFFFFF;
        
        private _scene: Scene;
        private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
        private _indexBuffer: Nullable<WebGLBuffer>;
        private _effect: Effect;
        private _alphaTestEffect: Effect;


        // Events

        /**
        * An event triggered when the layer is disposed.
        */
        public onDisposeObservable = new Observable<Layer>();

        private _onDisposeObserver: Nullable<Observer<Layer>>;
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
        public set onAfterRender(callback: () => void) {
            if (this._onAfterRenderObserver) {
                this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
            }
            this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
        }

        constructor(public name: string, imgUrl: Nullable<string>, scene: Nullable<Scene>, isBackground?: boolean, color?: Color4) {
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

        public _rebuild(): void {
            let vb = this._vertexBuffers[VertexBuffer.PositionKind];

            if (vb) {
                vb._rebuild();
            }

            this._createIndexBuffer();
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
