var __extends = (this && this.__extends) || (function () {
var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
})();


if(typeof require !== 'undefined'){
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    var BABYLON = globalObject["BABYLON"] || {}; 
var BABYLON0 = require('babylonjs/shaderMaterial');
if(BABYLON !== BABYLON0) __extends(BABYLON, BABYLON0);
var BABYLON;
(function (BABYLON) {
    var OutlineRenderer = /** @class */ (function () {
        function OutlineRenderer(scene) {
            this.zOffset = 1;
            this._scene = scene;
        }
        OutlineRenderer.prototype.render = function (subMesh, batch, useOverlay) {
            var _this = this;
            if (useOverlay === void 0) { useOverlay = false; }
            var scene = this._scene;
            var engine = this._scene.getEngine();
            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);
            if (!this.isReady(subMesh, hardwareInstancedRendering)) {
                return;
            }
            var mesh = subMesh.getRenderingMesh();
            var material = subMesh.getMaterial();
            if (!material || !scene.activeCamera) {
                return;
            }
            engine.enableEffect(this._effect);
            // Logarithmic depth
            if (material.useLogarithmicDepth) {
                this._effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(scene.activeCamera.maxZ + 1.0) / Math.LN2));
            }
            this._effect.setFloat("offset", useOverlay ? 0 : mesh.outlineWidth);
            this._effect.setColor4("color", useOverlay ? mesh.overlayColor : mesh.outlineColor, useOverlay ? mesh.overlayAlpha : material.alpha);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }
            mesh._bind(subMesh, this._effect, BABYLON.Material.TriangleFillMode);
            // Alpha test
            if (material && material.needAlphaTesting()) {
                var alphaTexture = material.getAlphaTestTexture();
                if (alphaTexture) {
                    this._effect.setTexture("diffuseSampler", alphaTexture);
                    this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                }
            }
            engine.setZOffset(-this.zOffset);
            mesh._processRendering(subMesh, this._effect, BABYLON.Material.TriangleFillMode, batch, hardwareInstancedRendering, function (isInstance, world) { _this._effect.setMatrix("world", world); });
            engine.setZOffset(0);
        };
        OutlineRenderer.prototype.isReady = function (subMesh, useInstances) {
            var defines = [];
            var attribs = [BABYLON.VertexBuffer.PositionKind, BABYLON.VertexBuffer.NormalKind];
            var mesh = subMesh.getMesh();
            var material = subMesh.getMaterial();
            if (material) {
                // Alpha test
                if (material.needAlphaTesting()) {
                    defines.push("#define ALPHATEST");
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        attribs.push(BABYLON.VertexBuffer.UVKind);
                        defines.push("#define UV1");
                    }
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                        attribs.push(BABYLON.VertexBuffer.UV2Kind);
                        defines.push("#define UV2");
                    }
                }
                //Logarithmic depth
                if (material.useLogarithmicDepth) {
                    defines.push("#define LOGARITHMICDEPTH");
                }
            }
            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders) {
                attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(BABYLON.VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(BABYLON.VertexBuffer.MatricesWeightsExtraKind);
                }
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + (mesh.skeleton ? mesh.skeleton.bones.length + 1 : 0));
            }
            else {
                defines.push("#define NUM_BONE_INFLUENCERS 0");
            }
            // Instances
            if (useInstances) {
                defines.push("#define INSTANCES");
                attribs.push("world0");
                attribs.push("world1");
                attribs.push("world2");
                attribs.push("world3");
            }
            // Get correct effect      
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;
                this._effect = this._scene.getEngine().createEffect("outline", attribs, ["world", "mBones", "viewProjection", "diffuseMatrix", "offset", "color", "logarithmicDepthConstant"], ["diffuseSampler"], join);
            }
            return this._effect.isReady();
        };
        return OutlineRenderer;
    }());
    BABYLON.OutlineRenderer = OutlineRenderer;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.outlineRenderer.js.map

var BABYLON;
(function (BABYLON) {
    var FaceAdjacencies = /** @class */ (function () {
        function FaceAdjacencies() {
            this.edges = new Array();
            this.edgesConnectedCount = 0;
        }
        return FaceAdjacencies;
    }());
    var EdgesRenderer = /** @class */ (function () {
        // Beware when you use this class with complex objects as the adjacencies computation can be really long
        function EdgesRenderer(source, epsilon, checkVerticesInsteadOfIndices) {
            if (epsilon === void 0) { epsilon = 0.95; }
            if (checkVerticesInsteadOfIndices === void 0) { checkVerticesInsteadOfIndices = false; }
            this.edgesWidthScalerForOrthographic = 1000.0;
            this.edgesWidthScalerForPerspective = 50.0;
            this._linesPositions = new Array();
            this._linesNormals = new Array();
            this._linesIndices = new Array();
            this._buffers = {};
            this._checkVerticesInsteadOfIndices = false;
            this._source = source;
            this._checkVerticesInsteadOfIndices = checkVerticesInsteadOfIndices;
            this._epsilon = epsilon;
            this._prepareRessources();
            this._generateEdgesLines();
        }
        EdgesRenderer.prototype._prepareRessources = function () {
            if (this._lineShader) {
                return;
            }
            this._lineShader = new BABYLON.ShaderMaterial("lineShader", this._source.getScene(), "line", {
                attributes: ["position", "normal"],
                uniforms: ["worldViewProjection", "color", "width", "aspectRatio"]
            });
            this._lineShader.disableDepthWrite = true;
            this._lineShader.backFaceCulling = false;
        };
        EdgesRenderer.prototype._rebuild = function () {
            var buffer = this._buffers[BABYLON.VertexBuffer.PositionKind];
            if (buffer) {
                buffer._rebuild();
            }
            buffer = this._buffers[BABYLON.VertexBuffer.NormalKind];
            if (buffer) {
                buffer._rebuild();
            }
            var scene = this._source.getScene();
            var engine = scene.getEngine();
            this._ib = engine.createIndexBuffer(this._linesIndices);
        };
        EdgesRenderer.prototype.dispose = function () {
            var buffer = this._buffers[BABYLON.VertexBuffer.PositionKind];
            if (buffer) {
                buffer.dispose();
                this._buffers[BABYLON.VertexBuffer.PositionKind] = null;
            }
            buffer = this._buffers[BABYLON.VertexBuffer.NormalKind];
            if (buffer) {
                buffer.dispose();
                this._buffers[BABYLON.VertexBuffer.NormalKind] = null;
            }
            this._source.getScene().getEngine()._releaseBuffer(this._ib);
            this._lineShader.dispose();
        };
        EdgesRenderer.prototype._processEdgeForAdjacencies = function (pa, pb, p0, p1, p2) {
            if (pa === p0 && pb === p1 || pa === p1 && pb === p0) {
                return 0;
            }
            if (pa === p1 && pb === p2 || pa === p2 && pb === p1) {
                return 1;
            }
            if (pa === p2 && pb === p0 || pa === p0 && pb === p2) {
                return 2;
            }
            return -1;
        };
        EdgesRenderer.prototype._processEdgeForAdjacenciesWithVertices = function (pa, pb, p0, p1, p2) {
            if (pa.equalsWithEpsilon(p0) && pb.equalsWithEpsilon(p1) || pa.equalsWithEpsilon(p1) && pb.equalsWithEpsilon(p0)) {
                return 0;
            }
            if (pa.equalsWithEpsilon(p1) && pb.equalsWithEpsilon(p2) || pa.equalsWithEpsilon(p2) && pb.equalsWithEpsilon(p1)) {
                return 1;
            }
            if (pa.equalsWithEpsilon(p2) && pb.equalsWithEpsilon(p0) || pa.equalsWithEpsilon(p0) && pb.equalsWithEpsilon(p2)) {
                return 2;
            }
            return -1;
        };
        EdgesRenderer.prototype._checkEdge = function (faceIndex, edge, faceNormals, p0, p1) {
            var needToCreateLine;
            if (edge === undefined) {
                needToCreateLine = true;
            }
            else {
                var dotProduct = BABYLON.Vector3.Dot(faceNormals[faceIndex], faceNormals[edge]);
                needToCreateLine = dotProduct < this._epsilon;
            }
            if (needToCreateLine) {
                var offset = this._linesPositions.length / 3;
                var normal = p0.subtract(p1);
                normal.normalize();
                // Positions
                this._linesPositions.push(p0.x);
                this._linesPositions.push(p0.y);
                this._linesPositions.push(p0.z);
                this._linesPositions.push(p0.x);
                this._linesPositions.push(p0.y);
                this._linesPositions.push(p0.z);
                this._linesPositions.push(p1.x);
                this._linesPositions.push(p1.y);
                this._linesPositions.push(p1.z);
                this._linesPositions.push(p1.x);
                this._linesPositions.push(p1.y);
                this._linesPositions.push(p1.z);
                // Normals
                this._linesNormals.push(p1.x);
                this._linesNormals.push(p1.y);
                this._linesNormals.push(p1.z);
                this._linesNormals.push(-1);
                this._linesNormals.push(p1.x);
                this._linesNormals.push(p1.y);
                this._linesNormals.push(p1.z);
                this._linesNormals.push(1);
                this._linesNormals.push(p0.x);
                this._linesNormals.push(p0.y);
                this._linesNormals.push(p0.z);
                this._linesNormals.push(-1);
                this._linesNormals.push(p0.x);
                this._linesNormals.push(p0.y);
                this._linesNormals.push(p0.z);
                this._linesNormals.push(1);
                // Indices
                this._linesIndices.push(offset);
                this._linesIndices.push(offset + 1);
                this._linesIndices.push(offset + 2);
                this._linesIndices.push(offset);
                this._linesIndices.push(offset + 2);
                this._linesIndices.push(offset + 3);
            }
        };
        EdgesRenderer.prototype._generateEdgesLines = function () {
            var positions = this._source.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var indices = this._source.getIndices();
            if (!indices || !positions) {
                return;
            }
            // First let's find adjacencies
            var adjacencies = new Array();
            var faceNormals = new Array();
            var index;
            var faceAdjacencies;
            // Prepare faces
            for (index = 0; index < indices.length; index += 3) {
                faceAdjacencies = new FaceAdjacencies();
                var p0Index = indices[index];
                var p1Index = indices[index + 1];
                var p2Index = indices[index + 2];
                faceAdjacencies.p0 = new BABYLON.Vector3(positions[p0Index * 3], positions[p0Index * 3 + 1], positions[p0Index * 3 + 2]);
                faceAdjacencies.p1 = new BABYLON.Vector3(positions[p1Index * 3], positions[p1Index * 3 + 1], positions[p1Index * 3 + 2]);
                faceAdjacencies.p2 = new BABYLON.Vector3(positions[p2Index * 3], positions[p2Index * 3 + 1], positions[p2Index * 3 + 2]);
                var faceNormal = BABYLON.Vector3.Cross(faceAdjacencies.p1.subtract(faceAdjacencies.p0), faceAdjacencies.p2.subtract(faceAdjacencies.p1));
                faceNormal.normalize();
                faceNormals.push(faceNormal);
                adjacencies.push(faceAdjacencies);
            }
            // Scan
            for (index = 0; index < adjacencies.length; index++) {
                faceAdjacencies = adjacencies[index];
                for (var otherIndex = index + 1; otherIndex < adjacencies.length; otherIndex++) {
                    var otherFaceAdjacencies = adjacencies[otherIndex];
                    if (faceAdjacencies.edgesConnectedCount === 3) {
                        break;
                    }
                    if (otherFaceAdjacencies.edgesConnectedCount === 3) {
                        continue;
                    }
                    var otherP0 = indices[otherIndex * 3];
                    var otherP1 = indices[otherIndex * 3 + 1];
                    var otherP2 = indices[otherIndex * 3 + 2];
                    for (var edgeIndex = 0; edgeIndex < 3; edgeIndex++) {
                        var otherEdgeIndex = 0;
                        if (faceAdjacencies.edges[edgeIndex] !== undefined) {
                            continue;
                        }
                        switch (edgeIndex) {
                            case 0:
                                if (this._checkVerticesInsteadOfIndices) {
                                    otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p0, faceAdjacencies.p1, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                                }
                                else {
                                    otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3], indices[index * 3 + 1], otherP0, otherP1, otherP2);
                                }
                                break;
                            case 1:
                                if (this._checkVerticesInsteadOfIndices) {
                                    otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p1, faceAdjacencies.p2, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                                }
                                else {
                                    otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3 + 1], indices[index * 3 + 2], otherP0, otherP1, otherP2);
                                }
                                break;
                            case 2:
                                if (this._checkVerticesInsteadOfIndices) {
                                    otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p2, faceAdjacencies.p0, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                                }
                                else {
                                    otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3 + 2], indices[index * 3], otherP0, otherP1, otherP2);
                                }
                                break;
                        }
                        if (otherEdgeIndex === -1) {
                            continue;
                        }
                        faceAdjacencies.edges[edgeIndex] = otherIndex;
                        otherFaceAdjacencies.edges[otherEdgeIndex] = index;
                        faceAdjacencies.edgesConnectedCount++;
                        otherFaceAdjacencies.edgesConnectedCount++;
                        if (faceAdjacencies.edgesConnectedCount === 3) {
                            break;
                        }
                    }
                }
            }
            // Create lines
            for (index = 0; index < adjacencies.length; index++) {
                // We need a line when a face has no adjacency on a specific edge or if all the adjacencies has an angle greater than epsilon
                var current = adjacencies[index];
                this._checkEdge(index, current.edges[0], faceNormals, current.p0, current.p1);
                this._checkEdge(index, current.edges[1], faceNormals, current.p1, current.p2);
                this._checkEdge(index, current.edges[2], faceNormals, current.p2, current.p0);
            }
            // Merge into a single mesh
            var engine = this._source.getScene().getEngine();
            this._buffers[BABYLON.VertexBuffer.PositionKind] = new BABYLON.VertexBuffer(engine, this._linesPositions, BABYLON.VertexBuffer.PositionKind, false);
            this._buffers[BABYLON.VertexBuffer.NormalKind] = new BABYLON.VertexBuffer(engine, this._linesNormals, BABYLON.VertexBuffer.NormalKind, false, false, 4);
            this._ib = engine.createIndexBuffer(this._linesIndices);
            this._indicesCount = this._linesIndices.length;
        };
        EdgesRenderer.prototype.render = function () {
            var scene = this._source.getScene();
            if (!this._lineShader.isReady() || !scene.activeCamera) {
                return;
            }
            var engine = scene.getEngine();
            this._lineShader._preBind();
            // VBOs
            engine.bindBuffers(this._buffers, this._ib, this._lineShader.getEffect());
            scene.resetCachedMaterial();
            this._lineShader.setColor4("color", this._source.edgesColor);
            if (scene.activeCamera.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA) {
                this._lineShader.setFloat("width", this._source.edgesWidth / this.edgesWidthScalerForOrthographic);
            }
            else {
                this._lineShader.setFloat("width", this._source.edgesWidth / this.edgesWidthScalerForPerspective);
            }
            this._lineShader.setFloat("aspectRatio", engine.getAspectRatio(scene.activeCamera));
            this._lineShader.bind(this._source.getWorldMatrix());
            // Draw order
            engine.drawElementsType(BABYLON.Material.TriangleFillMode, 0, this._indicesCount);
            this._lineShader.unbind();
            engine.setDepthWrite(true);
        };
        return EdgesRenderer;
    }());
    BABYLON.EdgesRenderer = EdgesRenderer;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.edgesRenderer.js.map


var BABYLON;
(function (BABYLON) {
    /**
     * Special Glow Blur post process only blurring the alpha channel
     * It enforces keeping the most luminous color in the color channel.
     */
    var GlowBlurPostProcess = /** @class */ (function (_super) {
        __extends(GlowBlurPostProcess, _super);
        function GlowBlurPostProcess(name, direction, kernel, options, camera, samplingMode, engine, reusable) {
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE; }
            var _this = _super.call(this, name, "glowBlurPostProcess", ["screenSize", "direction", "blurWidth"], null, options, camera, samplingMode, engine, reusable) || this;
            _this.direction = direction;
            _this.kernel = kernel;
            _this.onApplyObservable.add(function (effect) {
                effect.setFloat2("screenSize", _this.width, _this.height);
                effect.setVector2("direction", _this.direction);
                effect.setFloat("blurWidth", _this.kernel);
            });
            return _this;
        }
        return GlowBlurPostProcess;
    }(BABYLON.PostProcess));
    /**
     * The highlight layer Helps adding a glow effect around a mesh.
     *
     * Once instantiated in a scene, simply use the pushMesh or removeMesh method to add or remove
     * glowy meshes to your scene.
     *
     * !!! THIS REQUIRES AN ACTIVE STENCIL BUFFER ON THE CANVAS !!!
     */
    var HighlightLayer = /** @class */ (function () {
        /**
         * Instantiates a new highlight Layer and references it to the scene..
         * @param name The name of the layer
         * @param scene The scene to use the layer in
         * @param options Sets of none mandatory options to use with the layer (see IHighlightLayerOptions for more information)
         */
        function HighlightLayer(name, scene, options) {
            this.name = name;
            this._vertexBuffers = {};
            this._mainTextureDesiredSize = { width: 0, height: 0 };
            this._meshes = {};
            this._maxSize = 0;
            this._shouldRender = false;
            this._instanceGlowingMeshStencilReference = HighlightLayer.glowingMeshStencilReference++;
            this._excludedMeshes = {};
            /**
             * Specifies whether or not the inner glow is ACTIVE in the layer.
             */
            this.innerGlow = true;
            /**
             * Specifies whether or not the outer glow is ACTIVE in the layer.
             */
            this.outerGlow = true;
            /**
             * Specifies wether the highlight layer is enabled or not.
             */
            this.isEnabled = true;
            /**
             * An event triggered when the highlight layer has been disposed.
             * @type {BABYLON.Observable}
             */
            this.onDisposeObservable = new BABYLON.Observable();
            /**
             * An event triggered when the highlight layer is about rendering the main texture with the glowy parts.
             * @type {BABYLON.Observable}
             */
            this.onBeforeRenderMainTextureObservable = new BABYLON.Observable();
            /**
             * An event triggered when the highlight layer is being blurred.
             * @type {BABYLON.Observable}
             */
            this.onBeforeBlurObservable = new BABYLON.Observable();
            /**
             * An event triggered when the highlight layer has been blurred.
             * @type {BABYLON.Observable}
             */
            this.onAfterBlurObservable = new BABYLON.Observable();
            /**
             * An event triggered when the glowing blurred texture is being merged in the scene.
             * @type {BABYLON.Observable}
             */
            this.onBeforeComposeObservable = new BABYLON.Observable();
            /**
             * An event triggered when the glowing blurred texture has been merged in the scene.
             * @type {BABYLON.Observable}
             */
            this.onAfterComposeObservable = new BABYLON.Observable();
            /**
             * An event triggered when the highlight layer changes its size.
             * @type {BABYLON.Observable}
             */
            this.onSizeChangedObservable = new BABYLON.Observable();
            this._scene = scene || BABYLON.Engine.LastCreatedScene;
            var engine = scene.getEngine();
            this._engine = engine;
            this._maxSize = this._engine.getCaps().maxTextureSize;
            this._scene.highlightLayers.push(this);
            // Warn on stencil.
            if (!this._engine.isStencilEnable) {
                BABYLON.Tools.Warn("Rendering the Highlight Layer requires the stencil to be active on the canvas. var engine = new BABYLON.Engine(canvas, antialias, { stencil: true }");
            }
            // Adapt options
            this._options = options || {
                mainTextureRatio: 0.5,
                blurTextureSizeRatio: 0.5,
                blurHorizontalSize: 1.0,
                blurVerticalSize: 1.0,
                alphaBlendingMode: BABYLON.Engine.ALPHA_COMBINE,
                camera: null
            };
            this._options.mainTextureRatio = this._options.mainTextureRatio || 0.5;
            this._options.blurTextureSizeRatio = this._options.blurTextureSizeRatio || 1.0;
            this._options.blurHorizontalSize = this._options.blurHorizontalSize || 1;
            this._options.blurVerticalSize = this._options.blurVerticalSize || 1;
            this._options.alphaBlendingMode = this._options.alphaBlendingMode || BABYLON.Engine.ALPHA_COMBINE;
            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);
            var vertexBuffer = new BABYLON.VertexBuffer(engine, vertices, BABYLON.VertexBuffer.PositionKind, false, false, 2);
            this._vertexBuffers[BABYLON.VertexBuffer.PositionKind] = vertexBuffer;
            this._createIndexBuffer();
            // Effect
            this._glowMapMergeEffect = engine.createEffect("glowMapMerge", [BABYLON.VertexBuffer.PositionKind], ["offset"], ["textureSampler"], "");
            // Render target
            this.setMainTextureSize();
            // Create Textures and post processes
            this.createTextureAndPostProcesses();
        }
        Object.defineProperty(HighlightLayer.prototype, "blurHorizontalSize", {
            /**
             * Gets the horizontal size of the blur.
             */
            get: function () {
                return this._horizontalBlurPostprocess.kernel;
            },
            /**
             * Specifies the horizontal size of the blur.
             */
            set: function (value) {
                this._horizontalBlurPostprocess.kernel = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HighlightLayer.prototype, "blurVerticalSize", {
            /**
             * Gets the vertical size of the blur.
             */
            get: function () {
                return this._verticalBlurPostprocess.kernel;
            },
            /**
             * Specifies the vertical size of the blur.
             */
            set: function (value) {
                this._verticalBlurPostprocess.kernel = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HighlightLayer.prototype, "camera", {
            /**
             * Gets the camera attached to the layer.
             */
            get: function () {
                return this._options.camera;
            },
            enumerable: true,
            configurable: true
        });
        HighlightLayer.prototype._createIndexBuffer = function () {
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
        };
        HighlightLayer.prototype._rebuild = function () {
            var vb = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind];
            if (vb) {
                vb._rebuild();
            }
            this._createIndexBuffer();
        };
        /**
         * Creates the render target textures and post processes used in the highlight layer.
         */
        HighlightLayer.prototype.createTextureAndPostProcesses = function () {
            var _this = this;
            var blurTextureWidth = this._mainTextureDesiredSize.width * this._options.blurTextureSizeRatio;
            var blurTextureHeight = this._mainTextureDesiredSize.height * this._options.blurTextureSizeRatio;
            blurTextureWidth = this._engine.needPOTTextures ? BABYLON.Tools.GetExponentOfTwo(blurTextureWidth, this._maxSize) : blurTextureWidth;
            blurTextureHeight = this._engine.needPOTTextures ? BABYLON.Tools.GetExponentOfTwo(blurTextureHeight, this._maxSize) : blurTextureHeight;
            this._mainTexture = new BABYLON.RenderTargetTexture("HighlightLayerMainRTT", {
                width: this._mainTextureDesiredSize.width,
                height: this._mainTextureDesiredSize.height
            }, this._scene, false, true, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this._mainTexture.activeCamera = this._options.camera;
            this._mainTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._mainTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._mainTexture.anisotropicFilteringLevel = 1;
            this._mainTexture.updateSamplingMode(BABYLON.Texture.BILINEAR_SAMPLINGMODE);
            this._mainTexture.renderParticles = false;
            this._mainTexture.renderList = null;
            this._mainTexture.ignoreCameraViewport = true;
            this._blurTexture = new BABYLON.RenderTargetTexture("HighlightLayerBlurRTT", {
                width: blurTextureWidth,
                height: blurTextureHeight
            }, this._scene, false, true, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this._blurTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._blurTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._blurTexture.anisotropicFilteringLevel = 16;
            this._blurTexture.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
            this._blurTexture.renderParticles = false;
            this._blurTexture.ignoreCameraViewport = true;
            this._downSamplePostprocess = new BABYLON.PassPostProcess("HighlightLayerPPP", this._options.blurTextureSizeRatio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
            this._downSamplePostprocess.onApplyObservable.add(function (effect) {
                effect.setTexture("textureSampler", _this._mainTexture);
            });
            if (this._options.alphaBlendingMode === BABYLON.Engine.ALPHA_COMBINE) {
                this._horizontalBlurPostprocess = new GlowBlurPostProcess("HighlightLayerHBP", new BABYLON.Vector2(1.0, 0), this._options.blurHorizontalSize, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
                this._horizontalBlurPostprocess.onApplyObservable.add(function (effect) {
                    effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
                });
                this._verticalBlurPostprocess = new GlowBlurPostProcess("HighlightLayerVBP", new BABYLON.Vector2(0, 1.0), this._options.blurVerticalSize, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
                this._verticalBlurPostprocess.onApplyObservable.add(function (effect) {
                    effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
                });
            }
            else {
                this._horizontalBlurPostprocess = new BABYLON.BlurPostProcess("HighlightLayerHBP", new BABYLON.Vector2(1.0, 0), this._options.blurHorizontalSize, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
                this._horizontalBlurPostprocess.onApplyObservable.add(function (effect) {
                    effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
                });
                this._verticalBlurPostprocess = new BABYLON.BlurPostProcess("HighlightLayerVBP", new BABYLON.Vector2(0, 1.0), this._options.blurVerticalSize, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
                this._verticalBlurPostprocess.onApplyObservable.add(function (effect) {
                    effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
                });
            }
            this._mainTexture.onAfterUnbindObservable.add(function () {
                _this.onBeforeBlurObservable.notifyObservers(_this);
                var internalTexture = _this._blurTexture.getInternalTexture();
                if (internalTexture) {
                    _this._scene.postProcessManager.directRender([_this._downSamplePostprocess, _this._horizontalBlurPostprocess, _this._verticalBlurPostprocess], internalTexture, true);
                }
                _this.onAfterBlurObservable.notifyObservers(_this);
            });
            // Custom render function
            var renderSubMesh = function (subMesh) {
                if (!_this._meshes) {
                    return;
                }
                var material = subMesh.getMaterial();
                var mesh = subMesh.getRenderingMesh();
                var scene = _this._scene;
                var engine = scene.getEngine();
                if (!material) {
                    return;
                }
                // Do not block in blend mode.
                if (material.needAlphaBlendingForMesh(mesh)) {
                    return;
                }
                // Culling
                engine.setState(material.backFaceCulling);
                // Managing instances
                var batch = mesh._getInstancesRenderList(subMesh._id);
                if (batch.mustReturn) {
                    return;
                }
                // Excluded Mesh
                if (_this._excludedMeshes && _this._excludedMeshes[mesh.uniqueId]) {
                    return;
                }
                ;
                var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);
                var highlightLayerMesh = _this._meshes[mesh.uniqueId];
                var emissiveTexture = null;
                if (highlightLayerMesh && highlightLayerMesh.glowEmissiveOnly && material) {
                    emissiveTexture = material.emissiveTexture;
                }
                if (_this.isReady(subMesh, hardwareInstancedRendering, emissiveTexture)) {
                    engine.enableEffect(_this._glowMapGenerationEffect);
                    mesh._bind(subMesh, _this._glowMapGenerationEffect, BABYLON.Material.TriangleFillMode);
                    _this._glowMapGenerationEffect.setMatrix("viewProjection", scene.getTransformMatrix());
                    if (highlightLayerMesh) {
                        _this._glowMapGenerationEffect.setFloat4("color", highlightLayerMesh.color.r, highlightLayerMesh.color.g, highlightLayerMesh.color.b, 1.0);
                    }
                    else {
                        _this._glowMapGenerationEffect.setFloat4("color", HighlightLayer.neutralColor.r, HighlightLayer.neutralColor.g, HighlightLayer.neutralColor.b, HighlightLayer.neutralColor.a);
                    }
                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();
                        if (alphaTexture) {
                            _this._glowMapGenerationEffect.setTexture("diffuseSampler", alphaTexture);
                            var textureMatrix = alphaTexture.getTextureMatrix();
                            if (textureMatrix) {
                                _this._glowMapGenerationEffect.setMatrix("diffuseMatrix", textureMatrix);
                            }
                        }
                    }
                    // Glow emissive only
                    if (emissiveTexture) {
                        _this._glowMapGenerationEffect.setTexture("emissiveSampler", emissiveTexture);
                        _this._glowMapGenerationEffect.setMatrix("emissiveMatrix", emissiveTexture.getTextureMatrix());
                    }
                    // Bones
                    if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                        _this._glowMapGenerationEffect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
                    }
                    // Draw
                    mesh._processRendering(subMesh, _this._glowMapGenerationEffect, BABYLON.Material.TriangleFillMode, batch, hardwareInstancedRendering, function (isInstance, world) { return _this._glowMapGenerationEffect.setMatrix("world", world); });
                }
                else {
                    // Need to reset refresh rate of the shadowMap
                    _this._mainTexture.resetRefreshCounter();
                }
            };
            this._mainTexture.customRenderFunction = function (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, depthOnlySubMeshes) {
                _this.onBeforeRenderMainTextureObservable.notifyObservers(_this);
                var index;
                var engine = _this._scene.getEngine();
                if (depthOnlySubMeshes.length) {
                    engine.setColorWrite(false);
                    for (index = 0; index < depthOnlySubMeshes.length; index++) {
                        renderSubMesh(depthOnlySubMeshes.data[index]);
                    }
                    engine.setColorWrite(true);
                }
                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }
                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
                for (index = 0; index < transparentSubMeshes.length; index++) {
                    renderSubMesh(transparentSubMeshes.data[index]);
                }
            };
            this._mainTexture.onClearObservable.add(function (engine) {
                engine.clear(HighlightLayer.neutralColor, true, true, true);
            });
        };
        /**
         * Checks for the readiness of the element composing the layer.
         * @param subMesh the mesh to check for
         * @param useInstances specify wether or not to use instances to render the mesh
         * @param emissiveTexture the associated emissive texture used to generate the glow
         * @return true if ready otherwise, false
         */
        HighlightLayer.prototype.isReady = function (subMesh, useInstances, emissiveTexture) {
            var material = subMesh.getMaterial();
            if (!material) {
                return false;
            }
            if (!material.isReady(subMesh.getMesh(), useInstances)) {
                return false;
            }
            var defines = [];
            var attribs = [BABYLON.VertexBuffer.PositionKind];
            var mesh = subMesh.getMesh();
            var uv1 = false;
            var uv2 = false;
            // Alpha test
            if (material && material.needAlphaTesting()) {
                var alphaTexture = material.getAlphaTestTexture();
                if (alphaTexture) {
                    defines.push("#define ALPHATEST");
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind) &&
                        alphaTexture.coordinatesIndex === 1) {
                        defines.push("#define DIFFUSEUV2");
                        uv2 = true;
                    }
                    else if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        defines.push("#define DIFFUSEUV1");
                        uv1 = true;
                    }
                }
            }
            // Emissive
            if (emissiveTexture) {
                defines.push("#define EMISSIVE");
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind) &&
                    emissiveTexture.coordinatesIndex === 1) {
                    defines.push("#define EMISSIVEUV2");
                    uv2 = true;
                }
                else if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                    defines.push("#define EMISSIVEUV1");
                    uv1 = true;
                }
            }
            if (uv1) {
                attribs.push(BABYLON.VertexBuffer.UVKind);
                defines.push("#define UV1");
            }
            if (uv2) {
                attribs.push(BABYLON.VertexBuffer.UV2Kind);
                defines.push("#define UV2");
            }
            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders) {
                attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(BABYLON.VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(BABYLON.VertexBuffer.MatricesWeightsExtraKind);
                }
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + (mesh.skeleton ? (mesh.skeleton.bones.length + 1) : 0));
            }
            else {
                defines.push("#define NUM_BONE_INFLUENCERS 0");
            }
            // Instances
            if (useInstances) {
                defines.push("#define INSTANCES");
                attribs.push("world0");
                attribs.push("world1");
                attribs.push("world2");
                attribs.push("world3");
            }
            // Get correct effect      
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;
                this._glowMapGenerationEffect = this._scene.getEngine().createEffect("glowMapGeneration", attribs, ["world", "mBones", "viewProjection", "diffuseMatrix", "color", "emissiveMatrix"], ["diffuseSampler", "emissiveSampler"], join);
            }
            return this._glowMapGenerationEffect.isReady();
        };
        /**
         * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
         */
        HighlightLayer.prototype.render = function () {
            var currentEffect = this._glowMapMergeEffect;
            // Check
            if (!currentEffect.isReady() || !this._blurTexture.isReady())
                return;
            var engine = this._scene.getEngine();
            this.onBeforeComposeObservable.notifyObservers(this);
            // Render
            engine.enableEffect(currentEffect);
            engine.setState(false);
            // Cache
            var previousStencilBuffer = engine.getStencilBuffer();
            var previousStencilFunction = engine.getStencilFunction();
            var previousStencilMask = engine.getStencilMask();
            var previousStencilOperationPass = engine.getStencilOperationPass();
            var previousStencilOperationFail = engine.getStencilOperationFail();
            var previousStencilOperationDepthFail = engine.getStencilOperationDepthFail();
            var previousAlphaMode = engine.getAlphaMode();
            // Texture
            currentEffect.setTexture("textureSampler", this._blurTexture);
            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, currentEffect);
            // Stencil operations
            engine.setStencilOperationPass(BABYLON.Engine.REPLACE);
            engine.setStencilOperationFail(BABYLON.Engine.KEEP);
            engine.setStencilOperationDepthFail(BABYLON.Engine.KEEP);
            // Draw order
            engine.setAlphaMode(this._options.alphaBlendingMode);
            engine.setStencilMask(0x00);
            engine.setStencilBuffer(true);
            engine.setStencilFunctionReference(this._instanceGlowingMeshStencilReference);
            if (this.outerGlow) {
                currentEffect.setFloat("offset", 0);
                engine.setStencilFunction(BABYLON.Engine.NOTEQUAL);
                engine.drawElementsType(BABYLON.Material.TriangleFillMode, 0, 6);
            }
            if (this.innerGlow) {
                currentEffect.setFloat("offset", 1);
                engine.setStencilFunction(BABYLON.Engine.EQUAL);
                engine.drawElementsType(BABYLON.Material.TriangleFillMode, 0, 6);
            }
            // Restore Cache
            engine.setStencilFunction(previousStencilFunction);
            engine.setStencilMask(previousStencilMask);
            engine.setAlphaMode(previousAlphaMode);
            engine.setStencilBuffer(previousStencilBuffer);
            engine.setStencilOperationPass(previousStencilOperationPass);
            engine.setStencilOperationFail(previousStencilOperationFail);
            engine.setStencilOperationDepthFail(previousStencilOperationDepthFail);
            engine._stencilState.reset();
            this.onAfterComposeObservable.notifyObservers(this);
            // Handle size changes.
            var size = this._mainTexture.getSize();
            this.setMainTextureSize();
            if (size.width !== this._mainTextureDesiredSize.width || size.height !== this._mainTextureDesiredSize.height) {
                // Recreate RTT and post processes on size change.
                this.onSizeChangedObservable.notifyObservers(this);
                this.disposeTextureAndPostProcesses();
                this.createTextureAndPostProcesses();
            }
        };
        /**
         * Add a mesh in the exclusion list to prevent it to impact or being impacted by the highlight layer.
         * @param mesh The mesh to exclude from the highlight layer
         */
        HighlightLayer.prototype.addExcludedMesh = function (mesh) {
            if (!this._excludedMeshes) {
                return;
            }
            var meshExcluded = this._excludedMeshes[mesh.uniqueId];
            if (!meshExcluded) {
                this._excludedMeshes[mesh.uniqueId] = {
                    mesh: mesh,
                    beforeRender: mesh.onBeforeRenderObservable.add(function (mesh) {
                        mesh.getEngine().setStencilBuffer(false);
                    }),
                    afterRender: mesh.onAfterRenderObservable.add(function (mesh) {
                        mesh.getEngine().setStencilBuffer(true);
                    }),
                };
            }
        };
        /**
          * Remove a mesh from the exclusion list to let it impact or being impacted by the highlight layer.
          * @param mesh The mesh to highlight
          */
        HighlightLayer.prototype.removeExcludedMesh = function (mesh) {
            if (!this._excludedMeshes) {
                return;
            }
            var meshExcluded = this._excludedMeshes[mesh.uniqueId];
            if (meshExcluded) {
                if (meshExcluded.beforeRender) {
                    mesh.onBeforeRenderObservable.remove(meshExcluded.beforeRender);
                }
                if (meshExcluded.afterRender) {
                    mesh.onAfterRenderObservable.remove(meshExcluded.afterRender);
                }
            }
            this._excludedMeshes[mesh.uniqueId] = null;
        };
        /**
         * Add a mesh in the highlight layer in order to make it glow with the chosen color.
         * @param mesh The mesh to highlight
         * @param color The color of the highlight
         * @param glowEmissiveOnly Extract the glow from the emissive texture
         */
        HighlightLayer.prototype.addMesh = function (mesh, color, glowEmissiveOnly) {
            var _this = this;
            if (glowEmissiveOnly === void 0) { glowEmissiveOnly = false; }
            if (!this._meshes) {
                return;
            }
            var meshHighlight = this._meshes[mesh.uniqueId];
            if (meshHighlight) {
                meshHighlight.color = color;
            }
            else {
                this._meshes[mesh.uniqueId] = {
                    mesh: mesh,
                    color: color,
                    // Lambda required for capture due to Observable this context
                    observerHighlight: mesh.onBeforeRenderObservable.add(function (mesh) {
                        if (_this._excludedMeshes && _this._excludedMeshes[mesh.uniqueId]) {
                            _this.defaultStencilReference(mesh);
                        }
                        else {
                            mesh.getScene().getEngine().setStencilFunctionReference(_this._instanceGlowingMeshStencilReference);
                        }
                    }),
                    observerDefault: mesh.onAfterRenderObservable.add(this.defaultStencilReference),
                    glowEmissiveOnly: glowEmissiveOnly
                };
            }
            this._shouldRender = true;
        };
        /**
         * Remove a mesh from the highlight layer in order to make it stop glowing.
         * @param mesh The mesh to highlight
         */
        HighlightLayer.prototype.removeMesh = function (mesh) {
            if (!this._meshes) {
                return;
            }
            var meshHighlight = this._meshes[mesh.uniqueId];
            if (meshHighlight) {
                if (meshHighlight.observerHighlight) {
                    mesh.onBeforeRenderObservable.remove(meshHighlight.observerHighlight);
                }
                if (meshHighlight.observerDefault) {
                    mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
                }
                delete this._meshes[mesh.uniqueId];
            }
            this._shouldRender = false;
            for (var meshHighlightToCheck in this._meshes) {
                if (this._meshes[meshHighlightToCheck]) {
                    this._shouldRender = true;
                    break;
                }
            }
        };
        /**
         * Returns true if the layer contains information to display, otherwise false.
         */
        HighlightLayer.prototype.shouldRender = function () {
            return this.isEnabled && this._shouldRender;
        };
        /**
         * Sets the main texture desired size which is the closest power of two
         * of the engine canvas size.
         */
        HighlightLayer.prototype.setMainTextureSize = function () {
            if (this._options.mainTextureFixedSize) {
                this._mainTextureDesiredSize.width = this._options.mainTextureFixedSize;
                this._mainTextureDesiredSize.height = this._options.mainTextureFixedSize;
            }
            else {
                this._mainTextureDesiredSize.width = this._engine.getRenderWidth() * this._options.mainTextureRatio;
                this._mainTextureDesiredSize.height = this._engine.getRenderHeight() * this._options.mainTextureRatio;
                this._mainTextureDesiredSize.width = this._engine.needPOTTextures ? BABYLON.Tools.GetExponentOfTwo(this._mainTextureDesiredSize.width, this._maxSize) : this._mainTextureDesiredSize.width;
                this._mainTextureDesiredSize.height = this._engine.needPOTTextures ? BABYLON.Tools.GetExponentOfTwo(this._mainTextureDesiredSize.height, this._maxSize) : this._mainTextureDesiredSize.height;
            }
        };
        /**
         * Force the stencil to the normal expected value for none glowing parts
         */
        HighlightLayer.prototype.defaultStencilReference = function (mesh) {
            mesh.getScene().getEngine().setStencilFunctionReference(HighlightLayer.normalMeshStencilReference);
        };
        /**
         * Dispose only the render target textures and post process.
         */
        HighlightLayer.prototype.disposeTextureAndPostProcesses = function () {
            this._blurTexture.dispose();
            this._mainTexture.dispose();
            this._downSamplePostprocess.dispose();
            this._horizontalBlurPostprocess.dispose();
            this._verticalBlurPostprocess.dispose();
        };
        /**
         * Dispose the highlight layer and free resources.
         */
        HighlightLayer.prototype.dispose = function () {
            var vertexBuffer = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind];
            if (vertexBuffer) {
                vertexBuffer.dispose();
                this._vertexBuffers[BABYLON.VertexBuffer.PositionKind] = null;
            }
            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }
            // Clean textures and post processes
            this.disposeTextureAndPostProcesses();
            if (this._meshes) {
                // Clean mesh references 
                for (var id in this._meshes) {
                    var meshHighlight = this._meshes[id];
                    if (meshHighlight && meshHighlight.mesh) {
                        if (meshHighlight.observerHighlight) {
                            meshHighlight.mesh.onBeforeRenderObservable.remove(meshHighlight.observerHighlight);
                        }
                        if (meshHighlight.observerDefault) {
                            meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
                        }
                    }
                }
                this._meshes = null;
            }
            if (this._excludedMeshes) {
                for (var id in this._excludedMeshes) {
                    var meshHighlight = this._excludedMeshes[id];
                    if (meshHighlight) {
                        if (meshHighlight.beforeRender) {
                            meshHighlight.mesh.onBeforeRenderObservable.remove(meshHighlight.beforeRender);
                        }
                        if (meshHighlight.afterRender) {
                            meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.afterRender);
                        }
                    }
                }
                this._excludedMeshes = null;
            }
            // Remove from scene
            var index = this._scene.highlightLayers.indexOf(this, 0);
            if (index > -1) {
                this._scene.highlightLayers.splice(index, 1);
            }
            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
            this.onBeforeRenderMainTextureObservable.clear();
            this.onBeforeBlurObservable.clear();
            this.onBeforeComposeObservable.clear();
            this.onAfterComposeObservable.clear();
            this.onSizeChangedObservable.clear();
        };
        /**
         * The neutral color used during the preparation of the glow effect.
         * This is black by default as the blend operation is a blend operation.
         */
        HighlightLayer.neutralColor = new BABYLON.Color4(0, 0, 0, 0);
        /**
         * Stencil value used for glowing meshes.
         */
        HighlightLayer.glowingMeshStencilReference = 0x02;
        /**
         * Stencil value used for the other meshes in the scene.
         */
        HighlightLayer.normalMeshStencilReference = 0x01;
        return HighlightLayer;
    }());
    BABYLON.HighlightLayer = HighlightLayer;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.highlightlayer.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";
BABYLON.Effect.ShadersStore['glowBlurPostProcessPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\n\nuniform vec2 screenSize;\nuniform vec2 direction;\nuniform float blurWidth;\n\nfloat getLuminance(vec3 color)\n{\nreturn dot(color,vec3(0.2126,0.7152,0.0722));\n}\nvoid main(void)\n{\nfloat weights[7];\nweights[0]=0.05;\nweights[1]=0.1;\nweights[2]=0.2;\nweights[3]=0.3;\nweights[4]=0.2;\nweights[5]=0.1;\nweights[6]=0.05;\nvec2 texelSize=vec2(1.0/screenSize.x,1.0/screenSize.y);\nvec2 texelStep=texelSize*direction*blurWidth;\nvec2 start=vUV-3.0*texelStep;\nvec4 baseColor=vec4(0.,0.,0.,0.);\nvec2 texelOffset=vec2(0.,0.);\nfor (int i=0; i<7; i++)\n{\n\nvec4 texel=texture2D(textureSampler,start+texelOffset);\nbaseColor.a+=texel.a*weights[i];\n\nfloat luminance=getLuminance(baseColor.rgb);\nfloat luminanceTexel=getLuminance(texel.rgb);\nfloat choice=step(luminanceTexel,luminance);\nbaseColor.rgb=choice*baseColor.rgb+(1.0-choice)*texel.rgb;\ntexelOffset+=texelStep;\n}\ngl_FragColor=baseColor;\n}";
BABYLON.Effect.ShadersStore['glowMapGenerationPixelShader'] = "#ifdef ALPHATEST\nvarying vec2 vUVDiffuse;\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef EMISSIVE\nvarying vec2 vUVEmissive;\nuniform sampler2D emissiveSampler;\n#endif\nuniform vec4 color;\nvoid main(void)\n{\n#ifdef ALPHATEST\nif (texture2D(diffuseSampler,vUVDiffuse).a<0.4)\ndiscard;\n#endif\n#ifdef EMISSIVE\ngl_FragColor=texture2D(emissiveSampler,vUVEmissive);\n#else\ngl_FragColor=color;\n#endif\n}";
BABYLON.Effect.ShadersStore['glowMapGenerationVertexShader'] = "\nattribute vec3 position;\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 viewProjection;\nvarying vec4 vPosition;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef ALPHATEST\nvarying vec2 vUVDiffuse;\nuniform mat4 diffuseMatrix;\n#endif\n#ifdef EMISSIVE\nvarying vec2 vUVEmissive;\nuniform mat4 emissiveMatrix;\n#endif\nvoid main(void)\n{\n#include<instancesVertex>\n#include<bonesVertex>\n#ifdef CUBEMAP\nvPosition=finalWorld*vec4(position,1.0);\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\n#else\nvPosition=viewProjection*finalWorld*vec4(position,1.0);\ngl_Position=vPosition;\n#endif\n#ifdef ALPHATEST\n#ifdef DIFFUSEUV1\nvUVDiffuse=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n#endif\n#ifdef DIFFUSEUV2\nvUVDiffuse=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n#endif\n#endif\n#ifdef EMISSIVE\n#ifdef EMISSIVEUV1\nvUVEmissive=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n#endif\n#ifdef EMISSIVEUV2\nvUVEmissive=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n#endif\n#endif\n}";
BABYLON.Effect.ShadersStore['glowMapMergePixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\n\nuniform float offset;\nvoid main(void) {\nvec4 baseColor=texture2D(textureSampler,vUV);\nbaseColor.a=abs(offset-baseColor.a);\ngl_FragColor=baseColor;\n}";
BABYLON.Effect.ShadersStore['glowMapMergeVertexShader'] = "\nattribute vec2 position;\n\nvarying vec2 vUV;\nconst vec2 madd=vec2(0.5,0.5);\nvoid main(void) {\nvUV=position*madd+madd;\ngl_Position=vec4(position,0.0,1.0);\n}";
BABYLON.Effect.ShadersStore['lineVertexShader'] = "\nattribute vec3 position;\nattribute vec4 normal;\n\nuniform mat4 worldViewProjection;\nuniform float width;\nuniform float aspectRatio;\nvoid main(void) {\nvec4 viewPosition=worldViewProjection*vec4(position,1.0);\nvec4 viewPositionNext=worldViewProjection*vec4(normal.xyz,1.0);\nvec2 currentScreen=viewPosition.xy/viewPosition.w;\nvec2 nextScreen=viewPositionNext.xy/viewPositionNext.w;\ncurrentScreen.x*=aspectRatio;\nnextScreen.x*=aspectRatio;\nvec2 dir=normalize(nextScreen-currentScreen);\nvec2 normalDir=vec2(-dir.y,dir.x);\nnormalDir*=width/2.0;\nnormalDir.x/=aspectRatio;\nvec4 offset=vec4(normalDir*normal.w,0.0,0.0);\ngl_Position=viewPosition+offset;\n}";
BABYLON.Effect.ShadersStore['linePixelShader'] = "uniform vec4 color;\nvoid main(void) {\ngl_FragColor=color;\n}";
BABYLON.Effect.ShadersStore['outlineVertexShader'] = "\nattribute vec3 position;\nattribute vec3 normal;\n#include<bonesDeclaration>\n\nuniform float offset;\n#include<instancesDeclaration>\nuniform mat4 viewProjection;\n#ifdef ALPHATEST\nvarying vec2 vUV;\nuniform mat4 diffuseMatrix;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#endif\n#include<logDepthDeclaration>\nvoid main(void)\n{\nvec3 offsetPosition=position+normal*offset;\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(offsetPosition,1.0);\n#ifdef ALPHATEST\n#ifdef UV1\nvUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n#endif\n#ifdef UV2\nvUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n#endif\n#endif\n#include<logDepthVertex>\n}\n";
BABYLON.Effect.ShadersStore['outlinePixelShader'] = "#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\nuniform vec4 color;\n#ifdef ALPHATEST\nvarying vec2 vUV;\nuniform sampler2D diffuseSampler;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\n#ifdef ALPHATEST\nif (texture2D(diffuseSampler,vUV).a<0.4)\ndiscard;\n#endif\n#include<logDepthFragment>\ngl_FragColor=color;\n}";

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
(function() {
var EXPORTS = {};EXPORTS['OutlineRenderer'] = BABYLON['OutlineRenderer'];EXPORTS['EdgesRenderer'] = BABYLON['EdgesRenderer'];EXPORTS['HighlightLayer'] = BABYLON['HighlightLayer'];
    globalObject["BABYLON"] = globalObject["BABYLON"] || BABYLON;
    module.exports = EXPORTS;
    })();
}