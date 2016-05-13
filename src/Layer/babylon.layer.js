var BABYLON;
(function (BABYLON) {
    var Layer = (function () {
        function Layer(name, imgUrl, scene, isBackground, color) {
            this.name = name;
            this.scale = new BABYLON.Vector2(1, 1);
            this.offset = new BABYLON.Vector2(0, 0);
            this.alphaBlendingMode = BABYLON.Engine.ALPHA_COMBINE;
            this._vertexDeclaration = [2];
            this._vertexStrideSize = 2 * 4;
            // Events
            /**
            * An event triggered when the layer is disposed.
            * @type {BABYLON.Observable}
            */
            this.onDisposeObservable = new BABYLON.Observable();
            /**
            * An event triggered before rendering the scene
            * @type {BABYLON.Observable}
            */
            this.onBeforeRenderObservable = new BABYLON.Observable();
            /**
            * An event triggered after rendering the scene
            * @type {BABYLON.Observable}
            */
            this.onAfterRenderObservable = new BABYLON.Observable();
            this.texture = imgUrl ? new BABYLON.Texture(imgUrl, scene, true) : null;
            this.isBackground = isBackground === undefined ? true : isBackground;
            this.color = color === undefined ? new BABYLON.Color4(1, 1, 1, 1) : color;
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
            this._effect = this._scene.getEngine().createEffect("layer", ["position"], ["textureMatrix", "color", "scale", "offset"], ["textureSampler"], "");
            this._alphaTestEffect = this._scene.getEngine().createEffect("layer", ["position"], ["textureMatrix", "color", "scale", "offset"], ["textureSampler"], "#define ALPHATEST");
        }
        Object.defineProperty(Layer.prototype, "onDispose", {
            set: function (callback) {
                if (this._onDisposeObserver) {
                    this.onDisposeObservable.remove(this._onDisposeObserver);
                }
                this._onDisposeObserver = this.onDisposeObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Layer.prototype, "onBeforeRender", {
            set: function (callback) {
                if (this._onBeforeRenderObserver) {
                    this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
                }
                this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Layer.prototype, "onAfterRender", {
            set: function (callback) {
                if (this._onAfterRenderObserver) {
                    this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
                }
                this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Layer.prototype.render = function () {
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
                engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
            }
            else {
                engine.draw(true, 0, 6);
            }
            this.onAfterRenderObservable.notifyObservers(this);
        };
        Layer.prototype.dispose = function () {
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
        };
        return Layer;
    })();
    BABYLON.Layer = Layer;
})(BABYLON || (BABYLON = {}));
