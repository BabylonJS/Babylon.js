import { Scene } from "../scene";
import { Buffer, VertexBuffer } from "../Buffers/buffer";
import type { SubMesh } from "../Meshes/subMesh";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { SmartArray } from "../Misc/smartArray";
import type { Nullable, FloatArray, IndicesArray } from "../types";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import { BoundingBox } from "../Culling/boundingBox";
import type { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { ShaderMaterial } from "../Materials/shaderMaterial";
import type { DataBuffer } from "../Buffers/dataBuffer";
import { Color3 } from "../Maths/math.color";
import { Observable } from "../Misc/observable";
import { DrawWrapper } from "../Materials/drawWrapper";
import { UniformBuffer } from "../Materials/uniformBuffer";
import { CreateBoxVertexData } from "../Meshes/Builders/boxBuilder";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "../Engines/constants";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _boundingBoxRenderer: BoundingBoxRenderer;

        /** @internal (Backing field) */
        _forceShowBoundingBoxes: boolean;

        /**
         * Gets or sets a boolean indicating if all bounding boxes must be rendered
         */
        forceShowBoundingBoxes: boolean;

        /**
         * Gets the bounding box renderer associated with the scene
         * @returns a BoundingBoxRenderer
         */
        getBoundingBoxRenderer(): BoundingBoxRenderer;
    }
}

Object.defineProperty(Scene.prototype, "forceShowBoundingBoxes", {
    get: function (this: Scene) {
        return this._forceShowBoundingBoxes || false;
    },
    set: function (this: Scene, value: boolean) {
        this._forceShowBoundingBoxes = value;
        // Lazyly creates a BB renderer if needed.
        if (value) {
            this.getBoundingBoxRenderer();
        }
    },
    enumerable: true,
    configurable: true,
});

Scene.prototype.getBoundingBoxRenderer = function (): BoundingBoxRenderer {
    if (!this._boundingBoxRenderer) {
        this._boundingBoxRenderer = new BoundingBoxRenderer(this);
    }

    return this._boundingBoxRenderer;
};

declare module "../Meshes/abstractMesh" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /** @internal (Backing field) */
        _showBoundingBox: boolean;

        /**
         * Gets or sets a boolean indicating if the bounding box must be rendered as well (false by default)
         */
        showBoundingBox: boolean;
    }
}

Object.defineProperty(AbstractMesh.prototype, "showBoundingBox", {
    get: function (this: AbstractMesh) {
        return this._showBoundingBox || false;
    },
    set: function (this: AbstractMesh, value: boolean) {
        this._showBoundingBox = value;
        // Lazyly creates a BB renderer if needed.
        if (value) {
            this.getScene().getBoundingBoxRenderer();
        }
    },
    enumerable: true,
    configurable: true,
});

const TempMatrix = Matrix.Identity();
const TempVec1 = new Vector3();
const TempVec2 = new Vector3();
// `Matrix.asArray` returns its internal array, so it can be directly updated
const TempMatrixArray = TempMatrix.asArray();

// BoundingBox copies from it, so it's safe to reuse vectors here
const DummyBoundingBox = new BoundingBox(TempVec1, TempVec1);

/**
 * Component responsible of rendering the bounding box of the meshes in a scene.
 * This is usually used through the mesh.showBoundingBox or the scene.forceShowBoundingBoxes properties
 */
export class BoundingBoxRenderer implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_BOUNDINGBOXRENDERER;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Color of the bounding box lines placed in front of an object
     */
    public frontColor = new Color3(1, 1, 1);
    /**
     * Color of the bounding box lines placed behind an object
     */
    public backColor = new Color3(0.1, 0.1, 0.1);
    /**
     * Defines if the renderer should show the back lines or not
     */
    public showBackLines = true;

    /**
     * Observable raised before rendering a bounding box
     * When {@link BoundingBoxRenderer.useInstances} enabled,
     * this would only be triggered once for one rendering, instead of once every bounding box.
     * Events would be triggered with a dummy box to keep backwards compatibility,
     * the passed bounding box has no meaning and should be ignored.
     */
    public onBeforeBoxRenderingObservable = new Observable<BoundingBox>();

    /**
     * Observable raised after rendering a bounding box
     * When {@link BoundingBoxRenderer.useInstances} enabled,
     * this would only be triggered once for one rendering, instead of once every bounding box.
     * Events would be triggered with a dummy box to keep backwards compatibility,
     * the passed bounding box has no meaning and should be ignored.
     */
    public onAfterBoxRenderingObservable = new Observable<BoundingBox>();

    /**
     * Observable raised after resources are created
     */
    public onResourcesReadyObservable = new Observable<BoundingBoxRenderer>();

    /**
     * When false, no bounding boxes will be rendered
     */
    public enabled = true;

    /** Shader language used by the renderer */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in this renderer.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    /**
     * @internal
     */
    public renderList = new SmartArray<BoundingBox>(32);

    private _colorShader: ShaderMaterial;
    private _colorShaderForOcclusionQuery: ShaderMaterial;
    private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
    private _indexBuffer: DataBuffer;
    private _fillIndexBuffer: Nullable<DataBuffer> = null;
    private _fillIndexData: Nullable<IndicesArray> = null;
    private _uniformBufferFront: UniformBuffer;
    private _uniformBufferBack: UniformBuffer;
    private _renderPassIdForOcclusionQuery: number;
    /**
     * Internal buffer for instanced rendering
     */
    private _matrixBuffer: Nullable<Buffer> = null;
    private _matrices: Nullable<Float32Array> = null;

    /**
     * Internal state of whether instanced rendering enabled
     */
    protected _useInstances = false;

    /** @internal */
    public _drawWrapperFront: Nullable<DrawWrapper> = null;
    /** @internal */
    public _drawWrapperBack: Nullable<DrawWrapper> = null;

    /**
     * Instantiates a new bounding box renderer in a scene.
     * @param scene the scene the  renderer renders in
     */
    constructor(scene: Scene) {
        this.scene = scene;

        const engine = this.scene.getEngine();
        if (engine.isWebGPU) {
            this._shaderLanguage = ShaderLanguage.WGSL;
        }

        scene._addComponent(this);
        this._uniformBufferFront = new UniformBuffer(this.scene.getEngine(), undefined, undefined, "BoundingBoxRendererFront", true);
        this._buildUniformLayout(this._uniformBufferFront);
        this._uniformBufferBack = new UniformBuffer(this.scene.getEngine(), undefined, undefined, "BoundingBoxRendererBack", true);
        this._buildUniformLayout(this._uniformBufferBack);
    }

    private _buildUniformLayout(ubo: UniformBuffer): void {
        ubo.addUniform("color", 4);
        ubo.addUniform("world", 16);
        ubo.addUniform("viewProjection", 16);
        ubo.addUniform("viewProjectionR", 16);
        ubo.create();
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this.scene._beforeEvaluateActiveMeshStage.registerStep(SceneComponentConstants.STEP_BEFOREEVALUATEACTIVEMESH_BOUNDINGBOXRENDERER, this, this.reset);

        this.scene._preActiveMeshStage.registerStep(SceneComponentConstants.STEP_PREACTIVEMESH_BOUNDINGBOXRENDERER, this, this._preActiveMesh);

        this.scene._evaluateSubMeshStage.registerStep(SceneComponentConstants.STEP_EVALUATESUBMESH_BOUNDINGBOXRENDERER, this, this._evaluateSubMesh);

        this.scene._afterRenderingGroupDrawStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERINGGROUPDRAW_BOUNDINGBOXRENDERER, this, this.render);
    }

    private _evaluateSubMesh(mesh: AbstractMesh, subMesh: SubMesh): void {
        if (mesh.showSubMeshesBoundingBox) {
            const boundingInfo = subMesh.getBoundingInfo();
            if (boundingInfo !== null && boundingInfo !== undefined) {
                boundingInfo.boundingBox._tag = mesh.renderingGroupId;
                this.renderList.push(boundingInfo.boundingBox);
            }
        }
    }

    private _preActiveMesh(mesh: AbstractMesh): void {
        if (mesh.showBoundingBox || this.scene.forceShowBoundingBoxes) {
            const boundingInfo = mesh.getBoundingInfo();
            boundingInfo.boundingBox._tag = mesh.renderingGroupId;
            this.renderList.push(boundingInfo.boundingBox);
        }
    }

    private _prepareResources(): void {
        if (this._colorShader) {
            return;
        }

        this._colorShader = new ShaderMaterial(
            "colorShader",
            this.scene,
            "boundingBoxRenderer",
            {
                attributes: [VertexBuffer.PositionKind, "world0", "world1", "world2", "world3"],

                uniforms: ["world", "viewProjection", "viewProjectionR", "color"],
                uniformBuffers: ["BoundingBoxRenderer"],
                shaderLanguage: this._shaderLanguage,
                extraInitializationsAsync: async () => {
                    if (this._shaderLanguage === ShaderLanguage.WGSL) {
                        await Promise.all([import("../ShadersWGSL/boundingBoxRenderer.vertex"), import("../ShadersWGSL/boundingBoxRenderer.fragment")]);
                    } else {
                        await Promise.all([import("../Shaders/boundingBoxRenderer.vertex"), import("../Shaders/boundingBoxRenderer.fragment")]);
                    }
                },
            },
            false
        );
        this._colorShader.setDefine("INSTANCES", this._useInstances);
        this._colorShader.doNotSerialize = true;

        this._colorShader.reservedDataStore = {
            hidden: true,
        };

        this._colorShaderForOcclusionQuery = new ShaderMaterial(
            "colorShaderOccQuery",
            this.scene,
            "boundingBoxRenderer",
            {
                attributes: [VertexBuffer.PositionKind],
                uniforms: ["world", "viewProjection", "viewProjectionR", "color"],
                uniformBuffers: ["BoundingBoxRenderer"],
                shaderLanguage: this._shaderLanguage,
                extraInitializationsAsync: async () => {
                    if (this._shaderLanguage === ShaderLanguage.WGSL) {
                        await Promise.all([import("../ShadersWGSL/boundingBoxRenderer.vertex"), import("../ShadersWGSL/boundingBoxRenderer.fragment")]);
                    } else {
                        await Promise.all([import("../Shaders/boundingBoxRenderer.vertex"), import("../Shaders/boundingBoxRenderer.fragment")]);
                    }
                },
            },
            true
        );
        this._colorShaderForOcclusionQuery.doNotSerialize = true;

        this._colorShaderForOcclusionQuery.reservedDataStore = {
            hidden: true,
        };

        const engine = this.scene.getEngine();
        const boxdata = CreateBoxVertexData({ size: 1.0 });
        this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, <FloatArray>boxdata.positions, VertexBuffer.PositionKind, false);
        this._createIndexBuffer();
        this._fillIndexData = boxdata.indices;
        this.onResourcesReadyObservable.notifyObservers(this);
    }

    private _createIndexBuffer(): void {
        const engine = this.scene.getEngine();
        this._indexBuffer = engine.createIndexBuffer([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 7, 1, 6, 2, 5, 3, 4]);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        const vb = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vb) {
            vb._rebuild();
        }
        this._createIndexBuffer();

        if (this._matrixBuffer) {
            this._matrixBuffer._rebuild();
        }
    }

    /**
     * @internal
     */
    public reset(): void {
        this.renderList.reset();
    }

    /**
     * Render the bounding boxes of a specific rendering group
     * @param renderingGroupId defines the rendering group to render
     */
    public render(renderingGroupId: number): void {
        if (this.renderList.length === 0 || !this.enabled) {
            return;
        }

        if (this._useInstances) {
            this._renderInstanced(renderingGroupId);
            return;
        }

        this._prepareResources();

        if (!this._colorShader.isReady()) {
            return;
        }

        const engine = this.scene.getEngine();
        engine.setDepthWrite(false);

        const transformMatrix = this.scene.getTransformMatrix();

        for (let boundingBoxIndex = 0; boundingBoxIndex < this.renderList.length; boundingBoxIndex++) {
            const boundingBox = this.renderList.data[boundingBoxIndex];
            if (boundingBox._tag !== renderingGroupId) {
                continue;
            }

            this._createWrappersForBoundingBox(boundingBox);
            this.onBeforeBoxRenderingObservable.notifyObservers(boundingBox);

            const min = boundingBox.minimum;
            const max = boundingBox.maximum;
            const diff = max.subtract(min);
            const median = min.add(diff.scale(0.5));

            const worldMatrix = Matrix.Scaling(diff.x, diff.y, diff.z)
                .multiply(Matrix.Translation(median.x, median.y, median.z))
                .multiply(boundingBox.getWorldMatrix());

            const useReverseDepthBuffer = engine.useReverseDepthBuffer;

            if (this.showBackLines) {
                const drawWrapperBack = boundingBox._drawWrapperBack ?? this._colorShader._getDrawWrapper();

                this._colorShader._preBind(drawWrapperBack);

                engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._colorShader.getEffect());

                // Back
                if (useReverseDepthBuffer) {
                    engine.setDepthFunctionToLessOrEqual();
                } else {
                    engine.setDepthFunctionToGreaterOrEqual();
                }
                this._uniformBufferBack.bindToEffect(drawWrapperBack.effect!, "BoundingBoxRenderer");
                this._uniformBufferBack.updateColor4("color", this.backColor, 1);
                this._uniformBufferBack.updateMatrix("world", worldMatrix);
                this._uniformBufferBack.updateMatrix("viewProjection", transformMatrix);
                this._uniformBufferBack.update();

                // Draw order
                engine.drawElementsType(Material.LineListDrawMode, 0, 24);
            }

            const drawWrapperFront = boundingBox._drawWrapperFront ?? this._colorShader._getDrawWrapper();

            this._colorShader._preBind(drawWrapperFront);

            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._colorShader.getEffect());

            // Front
            if (useReverseDepthBuffer) {
                engine.setDepthFunctionToGreater();
            } else {
                engine.setDepthFunctionToLess();
            }
            this._uniformBufferFront.bindToEffect(drawWrapperFront.effect!, "BoundingBoxRenderer");
            this._uniformBufferFront.updateColor4("color", this.frontColor, 1);
            this._uniformBufferFront.updateMatrix("world", worldMatrix);
            this._uniformBufferFront.updateMatrix("viewProjection", transformMatrix);
            this._uniformBufferFront.update();

            // Draw order
            engine.drawElementsType(Material.LineListDrawMode, 0, 24);

            this.onAfterBoxRenderingObservable.notifyObservers(boundingBox);
        }
        this._colorShader.unbind();
        engine.setDepthFunctionToLessOrEqual();
        engine.setDepthWrite(true);
    }

    private _createWrappersForBoundingBox(boundingBox: BoundingBox | BoundingBoxRenderer): void {
        if (!boundingBox._drawWrapperFront) {
            const engine = this.scene.getEngine();

            boundingBox._drawWrapperFront = new DrawWrapper(engine);
            boundingBox._drawWrapperBack = new DrawWrapper(engine);

            boundingBox._drawWrapperFront.setEffect(this._colorShader.getEffect());
            boundingBox._drawWrapperBack.setEffect(this._colorShader.getEffect());
        }
    }

    /**
     * In case of occlusion queries, we can render the occlusion bounding box through this method
     * @param mesh Define the mesh to render the occlusion bounding box for
     */
    public renderOcclusionBoundingBox(mesh: AbstractMesh): void {
        const engine = this.scene.getEngine();

        if (this._renderPassIdForOcclusionQuery === undefined) {
            this._renderPassIdForOcclusionQuery = engine.createRenderPassId(`Render pass for occlusion query`);
        }

        const currentRenderPassId = engine.currentRenderPassId;

        engine.currentRenderPassId = this._renderPassIdForOcclusionQuery;

        this._prepareResources();

        const subMesh = mesh.subMeshes[0];

        if (!this._colorShaderForOcclusionQuery.isReady(mesh, undefined, subMesh) || !mesh.hasBoundingInfo) {
            engine.currentRenderPassId = currentRenderPassId;
            return;
        }

        if (!this._fillIndexBuffer) {
            this._fillIndexBuffer = engine.createIndexBuffer(this._fillIndexData!);
        }

        const useReverseDepthBuffer = engine.useReverseDepthBuffer;

        engine.setDepthWrite(false);
        engine.setColorWrite(false);

        const boundingBox = mesh.getBoundingInfo().boundingBox;
        const min = boundingBox.minimum;
        const max = boundingBox.maximum;
        const diff = max.subtract(min);
        const median = min.add(diff.scale(0.5));

        const worldMatrix = Matrix.Scaling(diff.x, diff.y, diff.z)
            .multiply(Matrix.Translation(median.x, median.y, median.z))
            .multiply(boundingBox.getWorldMatrix());

        const drawWrapper = subMesh._drawWrapper;

        this._colorShaderForOcclusionQuery._preBind(drawWrapper);

        engine.bindBuffers(this._vertexBuffers, this._fillIndexBuffer, <Effect>drawWrapper.effect);

        if (useReverseDepthBuffer) {
            engine.setDepthFunctionToGreater();
        } else {
            engine.setDepthFunctionToLess();
        }

        this.scene.resetCachedMaterial();

        this._uniformBufferFront.bindToEffect(drawWrapper.effect!, "BoundingBoxRenderer");
        this._uniformBufferFront.updateMatrix("world", worldMatrix);
        this._uniformBufferFront.updateMatrix("viewProjection", this.scene.getTransformMatrix());
        this._uniformBufferFront.update();

        engine.drawElementsType(Material.TriangleFillMode, 0, 36);

        this._colorShaderForOcclusionQuery.unbind();
        engine.setDepthFunctionToLessOrEqual();
        engine.setDepthWrite(true);
        engine.setColorWrite(true);

        engine.currentRenderPassId = currentRenderPassId;
    }

    /**
     * Sets whether to use instanced rendering.
     * When not enabled, BoundingBoxRenderer renders in a loop,
     * calling engine.drawElementsType for each bounding box in renderList,
     * making every bounding box 1 or 2 draw call.
     * When enabled, it collects bounding boxes to render,
     * and render all boxes in 1 or 2 draw call.
     * This could make the rendering with many bounding boxes much faster than not enabled,
     * but could result in a difference in rendering result if
     * {@link BoundingBoxRenderer.showBackLines} enabled,
     * because drawing the black/white part of each box one after the other
     * can be different from drawing the black part of all boxes and then the white part.
     * Also, when enabled, events of {@link BoundingBoxRenderer.onBeforeBoxRenderingObservable}
     * and {@link BoundingBoxRenderer.onAfterBoxRenderingObservable} would only be triggered once
     * for one rendering, instead of once every bounding box.
     * Events would be triggered with a dummy box to keep backwards compatibility,
     * the passed bounding box has no meaning and should be ignored.
     * @param val whether to use instanced rendering
     */
    public set useInstances(val: boolean) {
        this._useInstances = val;
        if (this._colorShader) {
            this._colorShader.setDefine("INSTANCES", val);
        }
        if (!val) {
            this._cleanupInstances();
        }
    }

    public get useInstances(): boolean {
        return this._useInstances;
    }

    /**
     * Instanced render the bounding boxes of a specific rendering group
     * @param renderingGroupId defines the rendering group to render
     */
    private _renderInstanced(renderingGroupId: number): void {
        if (this.renderList.length === 0 || !this.enabled) {
            return;
        }
        this._prepareResources();

        if (!this._colorShader.isReady()) {
            return;
        }

        const colorShader = this._colorShader;
        let matrices = this._matrices;
        const expectedLength = this.renderList.length * 16;
        if (!matrices || matrices.length < expectedLength || matrices.length > expectedLength * 2) {
            matrices = new Float32Array(expectedLength);
            this._matrices = matrices;
        }

        this.onBeforeBoxRenderingObservable.notifyObservers(DummyBoundingBox);

        let instancesCount = 0;

        for (let boundingBoxIndex = 0; boundingBoxIndex < this.renderList.length; boundingBoxIndex++) {
            const boundingBox = this.renderList.data[boundingBoxIndex];
            if (boundingBox._tag !== renderingGroupId) {
                continue;
            }

            const min = boundingBox.minimum;
            const max = boundingBox.maximum;

            const diff = max.subtractToRef(min, TempVec2);
            const median = min.addToRef(diff.scaleToRef(0.5, TempVec1), TempVec1);

            const m = TempMatrixArray;

            // Directly update the matrix values in column-major order
            m[0] = diff._x; // Scale X
            m[3] = median._x; // Translate X

            m[5] = diff._y; // Scale Y
            m[7] = median._y; // Translate Y

            m[10] = diff._z; // Scale Z
            m[11] = median._z; // Translate Z
            TempMatrix.multiplyToArray(boundingBox.getWorldMatrix(), matrices, instancesCount * 16);

            instancesCount++;
        }

        const engine = this.scene.getEngine();
        // keeps the original depth function and depth write
        const depthFunction = engine.getDepthFunction() ?? Constants.LEQUAL;
        const depthWrite = engine.getDepthWrite();
        engine.setDepthWrite(false);
        const matrixBuffer = this._matrixBuffer;
        if (matrixBuffer?.isUpdatable() && matrixBuffer.getData() === matrices) {
            matrixBuffer.update(matrices);
        } else {
            this._createInstanceBuffer(matrices);
        }

        this._createWrappersForBoundingBox(this);

        const useReverseDepthBuffer = engine.useReverseDepthBuffer;
        const transformMatrix = this.scene.getTransformMatrix();

        if (this.showBackLines) {
            const drawWrapperBack = this._drawWrapperBack ?? colorShader._getDrawWrapper();

            colorShader._preBind(drawWrapperBack);

            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, colorShader.getEffect());

            // Back
            if (useReverseDepthBuffer) {
                engine.setDepthFunctionToLessOrEqual();
            } else {
                engine.setDepthFunctionToGreaterOrEqual();
            }
            const _uniformBufferBack: UniformBuffer = this._uniformBufferBack;

            _uniformBufferBack.bindToEffect(drawWrapperBack.effect!, "BoundingBoxRenderer");
            _uniformBufferBack.updateColor4("color", this.backColor, 1);
            _uniformBufferBack.updateMatrix("viewProjection", transformMatrix);
            _uniformBufferBack.update();

            // Draw order
            engine.drawElementsType(Material.LineListDrawMode, 0, 24, instancesCount);
        }

        const drawWrapperFront = colorShader._getDrawWrapper();

        colorShader._preBind(drawWrapperFront);

        engine.bindBuffers(this._vertexBuffers, this._indexBuffer, colorShader.getEffect());

        // Front
        if (useReverseDepthBuffer) {
            engine.setDepthFunctionToGreater();
        } else {
            engine.setDepthFunctionToLess();
        }
        const _uniformBufferFront: UniformBuffer = this._uniformBufferFront;
        _uniformBufferFront.bindToEffect(drawWrapperFront.effect!, "BoundingBoxRenderer");
        _uniformBufferFront.updateColor4("color", this.frontColor, 1);
        _uniformBufferFront.updateMatrix("viewProjection", transformMatrix);
        _uniformBufferFront.update();

        // Draw order
        engine.drawElementsType(Material.LineListDrawMode, 0, 24, instancesCount);

        this.onAfterBoxRenderingObservable.notifyObservers(DummyBoundingBox);

        colorShader.unbind();
        engine.setDepthFunction(depthFunction);
        engine.setDepthWrite(depthWrite);
    }

    /**
     * Creates buffer for instanced rendering
     * @param buffer buffer to set
     */
    private _createInstanceBuffer(buffer: Float32Array): void {
        const vertexBuffers = this._vertexBuffers;
        this._cleanupInstanceBuffer();
        const matrixBuffer = new Buffer(this.scene.getEngine(), buffer, true, 16, false, true);

        vertexBuffers.world0 = matrixBuffer.createVertexBuffer("world0", 0, 4);
        vertexBuffers.world1 = matrixBuffer.createVertexBuffer("world1", 4, 4);
        vertexBuffers.world2 = matrixBuffer.createVertexBuffer("world2", 8, 4);
        vertexBuffers.world3 = matrixBuffer.createVertexBuffer("world3", 12, 4);

        this._matrixBuffer = matrixBuffer;
    }

    /**
     * Clean up buffers for instanced rendering
     */
    private _cleanupInstanceBuffer(): void {
        const vertexBuffers = this._vertexBuffers;
        if (vertexBuffers.world0) {
            vertexBuffers.world0.dispose();
            delete vertexBuffers.world0;
        }
        if (vertexBuffers.world1) {
            vertexBuffers.world1.dispose();
            delete vertexBuffers.world1;
        }
        if (vertexBuffers.world2) {
            vertexBuffers.world2.dispose();
            delete vertexBuffers.world2;
        }
        if (vertexBuffers.world3) {
            vertexBuffers.world3.dispose();
            delete vertexBuffers.world3;
        }
        this._matrices = null;
        if (this._matrixBuffer) {
            this._matrixBuffer.dispose();
            this._matrixBuffer = null;
        }
    }

    /**
     * Clean up resources for instanced rendering
     */
    private _cleanupInstances(): void {
        this._cleanupInstanceBuffer();
        if (this._drawWrapperFront) {
            this._drawWrapperFront.dispose();
            this._drawWrapperFront = null;
        }
        if (this._drawWrapperBack) {
            this._drawWrapperBack.dispose();
            this._drawWrapperBack = null;
        }
    }

    /**
     * Dispose and release the resources attached to this renderer.
     */
    public dispose(): void {
        if (this._renderPassIdForOcclusionQuery !== undefined) {
            this.scene.getEngine().releaseRenderPassId(this._renderPassIdForOcclusionQuery);
            this._renderPassIdForOcclusionQuery = undefined as any;
        }

        if (!this._colorShader) {
            return;
        }

        this.onBeforeBoxRenderingObservable.clear();
        this.onAfterBoxRenderingObservable.clear();
        this.onResourcesReadyObservable.clear();

        this.renderList.dispose();

        this._colorShader.dispose();
        this._colorShaderForOcclusionQuery.dispose();

        this._uniformBufferFront.dispose();
        this._uniformBufferBack.dispose();

        const buffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (buffer) {
            buffer.dispose();
            this._vertexBuffers[VertexBuffer.PositionKind] = null;
        }
        this.scene.getEngine()._releaseBuffer(this._indexBuffer);

        if (this._fillIndexBuffer) {
            this.scene.getEngine()._releaseBuffer(this._fillIndexBuffer);
            this._fillIndexBuffer = null;
        }
        this._cleanupInstances();
    }
}
