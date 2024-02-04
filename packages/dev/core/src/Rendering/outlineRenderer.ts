import { VertexBuffer } from "../Buffers/buffer";
import type { SubMesh } from "../Meshes/subMesh";
import type { _InstancesBatch } from "../Meshes/mesh";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";
import type { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import { DrawWrapper } from "../Materials/drawWrapper";
import { MaterialHelper } from "../Materials/materialHelper";

import "../Shaders/outline.fragment";
import "../Shaders/outline.vertex";
import { addClipPlaneUniforms, bindClipPlane, prepareStringDefinesForClipPlanes } from "core/Materials/clipPlaneMaterialHelper";

declare module "../scene" {
    export interface Scene {
        /** @internal */
        _outlineRenderer: OutlineRenderer;

        /**
         * Gets the outline renderer associated with the scene
         * @returns a OutlineRenderer
         */
        getOutlineRenderer(): OutlineRenderer;
    }
}

/**
 * Gets the outline renderer associated with the scene
 * @returns a OutlineRenderer
 */
Scene.prototype.getOutlineRenderer = function (): OutlineRenderer {
    if (!this._outlineRenderer) {
        this._outlineRenderer = new OutlineRenderer(this);
    }
    return this._outlineRenderer;
};

declare module "../Meshes/abstractMesh" {
    export interface AbstractMesh {
        /** @internal (Backing field) */
        _renderOutline: boolean;
        /**
         * Gets or sets a boolean indicating if the outline must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#3
         */
        renderOutline: boolean;

        /** @internal (Backing field) */
        _renderOverlay: boolean;
        /**
         * Gets or sets a boolean indicating if the overlay must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#2
         */
        renderOverlay: boolean;
    }
}

Object.defineProperty(Mesh.prototype, "renderOutline", {
    get: function (this: Mesh) {
        return this._renderOutline;
    },
    set: function (this: Mesh, value: boolean) {
        if (value) {
            // Lazy Load the component.
            this.getScene().getOutlineRenderer();
        }
        this._renderOutline = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Mesh.prototype, "renderOverlay", {
    get: function (this: Mesh) {
        return this._renderOverlay;
    },
    set: function (this: Mesh, value: boolean) {
        if (value) {
            // Lazy Load the component.
            this.getScene().getOutlineRenderer();
        }
        this._renderOverlay = value;
    },
    enumerable: true,
    configurable: true,
});

/**
 * This class is responsible to draw the outline/overlay of meshes.
 * It should not be used directly but through the available method on mesh.
 */
export class OutlineRenderer implements ISceneComponent {
    /**
     * Stencil value used to avoid outline being seen within the mesh when the mesh is transparent
     */
    private static _StencilReference = 0x04;
    /**
     * The name of the component. Each component must have a unique name.
     */
    public name = SceneComponentConstants.NAME_OUTLINERENDERER;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Defines a zOffset default Factor to prevent zFighting between the overlay and the mesh.
     */
    public zOffset = 1;

    /**
     * Defines a zOffset default Unit to prevent zFighting between the overlay and the mesh.
     */
    public zOffsetUnits = 4; // 4 to account for projection a bit by default

    private _engine: Engine;
    private _savedDepthWrite: boolean;
    private _passIdForDrawWrapper: number[];

    /**
     * Instantiates a new outline renderer. (There could be only one per scene).
     * @param scene Defines the scene it belongs to
     */
    constructor(scene: Scene) {
        this.scene = scene;
        this._engine = scene.getEngine();
        this.scene._addComponent(this);
        this._passIdForDrawWrapper = [];
        for (let i = 0; i < 4; ++i) {
            this._passIdForDrawWrapper[i] = this._engine.createRenderPassId(`Outline Renderer (${i})`);
        }
    }

    /**
     * Register the component to one instance of a scene.
     */
    public register(): void {
        this.scene._beforeRenderingMeshStage.registerStep(SceneComponentConstants.STEP_BEFORERENDERINGMESH_OUTLINE, this, this._beforeRenderingMesh);
        this.scene._afterRenderingMeshStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERINGMESH_OUTLINE, this, this._afterRenderingMesh);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do here.
    }

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {
        for (let i = 0; i < this._passIdForDrawWrapper.length; ++i) {
            this._engine.releaseRenderPassId(this._passIdForDrawWrapper[i]);
        }
    }

    /**
     * Renders the outline in the canvas.
     * @param subMesh Defines the sumesh to render
     * @param batch Defines the batch of meshes in case of instances
     * @param useOverlay Defines if the rendering is for the overlay or the outline
     * @param renderPassId Render pass id to use to render the mesh
     */
    public render(subMesh: SubMesh, batch: _InstancesBatch, useOverlay: boolean = false, renderPassId?: number): void {
        renderPassId = renderPassId ?? this._passIdForDrawWrapper[0];

        const scene = this.scene;
        const engine = scene.getEngine();

        const hardwareInstancedRendering =
            engine.getCaps().instancedArrays &&
            ((batch.visibleInstances[subMesh._id] !== null && batch.visibleInstances[subMesh._id] !== undefined) || subMesh.getRenderingMesh().hasThinInstances);

        if (!this.isReady(subMesh, hardwareInstancedRendering, renderPassId)) {
            return;
        }

        const ownerMesh = subMesh.getMesh();
        const replacementMesh = ownerMesh._internalAbstractMeshDataInfo._actAsRegularMesh ? ownerMesh : null;
        const renderingMesh = subMesh.getRenderingMesh();
        const effectiveMesh = replacementMesh ? replacementMesh : renderingMesh;
        const material = subMesh.getMaterial();

        if (!material || !scene.activeCamera) {
            return;
        }

        const drawWrapper = subMesh._getDrawWrapper(renderPassId)!;
        const effect = DrawWrapper.GetEffect(drawWrapper)!;

        engine.enableEffect(drawWrapper);

        // Logarithmic depth
        if ((<any>material).useLogarithmicDepth) {
            effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(scene.activeCamera.maxZ + 1.0) / Math.LN2));
        }

        effect.setFloat("offset", useOverlay ? 0 : renderingMesh.outlineWidth);
        effect.setColor4("color", useOverlay ? renderingMesh.overlayColor : renderingMesh.outlineColor, useOverlay ? renderingMesh.overlayAlpha : material.alpha);
        effect.setMatrix("viewProjection", scene.getTransformMatrix());
        effect.setMatrix("world", effectiveMesh.getWorldMatrix());

        // Bones
        if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
            effect.setMatrices("mBones", renderingMesh.skeleton.getTransformMatrices(renderingMesh));
        }

        if (renderingMesh.morphTargetManager && renderingMesh.morphTargetManager.isUsingTextureForTargets) {
            renderingMesh.morphTargetManager._bind(effect);
        }

        // Morph targets
        MaterialHelper.BindMorphTargetParameters(renderingMesh, effect);

        if (!hardwareInstancedRendering) {
            renderingMesh._bind(subMesh, effect, material.fillMode);
        }

        // Alpha test
        if (material && material.needAlphaTesting()) {
            const alphaTexture = material.getAlphaTestTexture();
            if (alphaTexture) {
                effect.setTexture("diffuseSampler", alphaTexture);
                effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
            }
        }

        // Clip plane
        bindClipPlane(effect, material, scene);

        engine.setZOffset(-this.zOffset);
        engine.setZOffsetUnits(-this.zOffsetUnits);

        renderingMesh._processRendering(effectiveMesh, subMesh, effect, material.fillMode, batch, hardwareInstancedRendering, (isInstance, world) => {
            effect.setMatrix("world", world);
        });

        engine.setZOffset(0);
        engine.setZOffsetUnits(0);
    }

    /**
     * Returns whether or not the outline renderer is ready for a given submesh.
     * All the dependencies e.g. submeshes, texture, effect... mus be ready
     * @param subMesh Defines the submesh to check readiness for
     * @param useInstances Defines whether wee are trying to render instances or not
     * @param renderPassId Render pass id to use to render the mesh
     * @returns true if ready otherwise false
     */
    public isReady(subMesh: SubMesh, useInstances: boolean, renderPassId?: number): boolean {
        renderPassId = renderPassId ?? this._passIdForDrawWrapper[0];

        const defines = [];
        const attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

        const mesh = subMesh.getMesh();
        const material = subMesh.getMaterial();

        if (!material) {
            return false;
        }

        const scene = mesh.getScene();

        // Alpha test
        if (material.needAlphaTesting()) {
            defines.push("#define ALPHATEST");
            if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                attribs.push(VertexBuffer.UVKind);
                defines.push("#define UV1");
            }
            if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                attribs.push(VertexBuffer.UV2Kind);
                defines.push("#define UV2");
            }
        }
        //Logarithmic depth
        if ((<any>material).useLogarithmicDepth) {
            defines.push("#define LOGARITHMICDEPTH");
        }
        // Clip planes
        prepareStringDefinesForClipPlanes(material, scene, defines);

        // Bones
        if (mesh.useBones && mesh.computeBonesUsingShaders) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }
            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            defines.push("#define BonesPerMesh " + (mesh.skeleton ? mesh.skeleton.bones.length + 1 : 0));
        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }

        // Morph targets
        const morphTargetManager = (mesh as Mesh).morphTargetManager;
        let numMorphInfluencers = 0;
        if (morphTargetManager) {
            numMorphInfluencers = morphTargetManager.numMaxInfluencers || morphTargetManager.numInfluencers;
            if (numMorphInfluencers > 0) {
                defines.push("#define MORPHTARGETS");
                defines.push("#define NUM_MORPH_INFLUENCERS " + numMorphInfluencers);

                if (morphTargetManager.isUsingTextureForTargets) {
                    defines.push("#define MORPHTARGETS_TEXTURE");
                }

                MaterialHelper.PrepareAttributesForMorphTargetsInfluencers(attribs, mesh, numMorphInfluencers);
            }
        }

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            MaterialHelper.PushAttributesForInstances(attribs);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }

        // Get correct effect
        const drawWrapper = subMesh._getDrawWrapper(renderPassId, true)!;
        const cachedDefines = drawWrapper.defines;
        const join = defines.join("\n");

        if (cachedDefines !== join) {
            const uniforms = [
                "world",
                "mBones",
                "viewProjection",
                "diffuseMatrix",
                "offset",
                "color",
                "logarithmicDepthConstant",
                "morphTargetInfluences",
                "morphTargetCount",
                "morphTargetTextureInfo",
                "morphTargetTextureIndices",
            ];
            addClipPlaneUniforms(uniforms);

            drawWrapper.setEffect(
                this.scene.getEngine().createEffect("outline", attribs, uniforms, ["diffuseSampler", "morphTargets"], join, undefined, undefined, undefined, {
                    maxSimultaneousMorphTargets: numMorphInfluencers,
                }),
                join
            );
        }

        return drawWrapper.effect!.isReady();
    }

    private _beforeRenderingMesh(mesh: Mesh, subMesh: SubMesh, batch: _InstancesBatch): void {
        // Outline - step 1
        this._savedDepthWrite = this._engine.getDepthWrite();
        if (mesh.renderOutline) {
            const material = subMesh.getMaterial();
            if (material && material.needAlphaBlendingForMesh(mesh)) {
                this._engine.cacheStencilState();
                // Draw only to stencil buffer for the original mesh
                // The resulting stencil buffer will be used so the outline is not visible inside the mesh when the mesh is transparent
                this._engine.setDepthWrite(false);
                this._engine.setColorWrite(false);
                this._engine.setStencilBuffer(true);
                this._engine.setStencilOperationPass(Constants.REPLACE);
                this._engine.setStencilFunction(Constants.ALWAYS);
                this._engine.setStencilMask(OutlineRenderer._StencilReference);
                this._engine.setStencilFunctionReference(OutlineRenderer._StencilReference);
                this._engine.stencilStateComposer.useStencilGlobalOnly = true;
                this.render(subMesh, batch, /* This sets offset to 0 */ true, this._passIdForDrawWrapper[1]);

                this._engine.setColorWrite(true);
                this._engine.setStencilFunction(Constants.NOTEQUAL);
            }

            // Draw the outline using the above stencil if needed to avoid drawing within the mesh
            this._engine.setDepthWrite(false);
            this.render(subMesh, batch, false, this._passIdForDrawWrapper[0]);
            this._engine.setDepthWrite(this._savedDepthWrite);

            if (material && material.needAlphaBlendingForMesh(mesh)) {
                this._engine.stencilStateComposer.useStencilGlobalOnly = false;
                this._engine.restoreStencilState();
            }
        }
    }

    private _afterRenderingMesh(mesh: Mesh, subMesh: SubMesh, batch: _InstancesBatch): void {
        // Overlay
        if (mesh.renderOverlay) {
            const currentMode = this._engine.getAlphaMode();
            const alphaBlendState = this._engine.alphaState.alphaBlend;
            this._engine.setAlphaMode(Constants.ALPHA_COMBINE);
            this.render(subMesh, batch, true, this._passIdForDrawWrapper[3]);
            this._engine.setAlphaMode(currentMode);
            this._engine.setDepthWrite(this._savedDepthWrite);
            this._engine.alphaState.alphaBlend = alphaBlendState;
        }

        // Outline - step 2
        if (mesh.renderOutline && this._savedDepthWrite) {
            this._engine.setDepthWrite(true);
            this._engine.setColorWrite(false);
            this.render(subMesh, batch, false, this._passIdForDrawWrapper[2]);
            this._engine.setColorWrite(true);
        }
    }
}
