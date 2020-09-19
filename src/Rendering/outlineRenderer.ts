import { VertexBuffer } from "../Meshes/buffer";
import { SubMesh } from "../Meshes/subMesh";
import { _InstancesBatch, Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";
import { ISceneComponent, SceneComponentConstants } from "../sceneComponent";
import { Effect } from "../Materials/effect";
import { MaterialHelper } from "../Materials/materialHelper";

import "../Shaders/outline.fragment";
import "../Shaders/outline.vertex";

declare module "../scene" {
    export interface Scene {
        /** @hidden */
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
Scene.prototype.getOutlineRenderer = function(): OutlineRenderer {
    if (!this._outlineRenderer) {
        this._outlineRenderer = new OutlineRenderer(this);
    }
    return this._outlineRenderer;
};

declare module "../Meshes/abstractMesh" {
    export interface AbstractMesh {
        /** @hidden (Backing field) */
        _renderOutline: boolean;
        /**
         * Gets or sets a boolean indicating if the outline must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#3
         */
        renderOutline: boolean;

        /** @hidden (Backing field) */
        _renderOverlay: boolean;
        /**
         * Gets or sets a boolean indicating if the overlay must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#2
         */
        renderOverlay: boolean;
    }
}

Object.defineProperty(Mesh.prototype, "renderOutline", {
    get: function(this: Mesh) {
        return this._renderOutline;
    },
    set: function(this: Mesh, value: boolean) {
        if (value) {
            // Lazy Load the component.
            this.getScene().getOutlineRenderer();
        }
        this._renderOutline = value;
    },
    enumerable: true,
    configurable: true
});

Object.defineProperty(Mesh.prototype, "renderOverlay", {
    get: function(this: Mesh) {
        return this._renderOverlay;
    },
    set: function(this: Mesh, value: boolean) {
        if (value) {
            // Lazy Load the component.
            this.getScene().getOutlineRenderer();
        }
        this._renderOverlay = value;
    },
    enumerable: true,
    configurable: true
});

/**
 * This class is responsible to draw bothe outline/overlay of meshes.
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
     * Defines a zOffset to prevent zFighting between the overlay and the mesh.
     */
    public zOffset = 1;

    private _engine: Engine;
    private _effect: Effect;
    private _cachedDefines: string;
    private _savedDepthWrite: boolean;

    /**
     * Instantiates a new outline renderer. (There could be only one per scene).
     * @param scene Defines the scene it belongs to
     */
    constructor(scene: Scene) {
        this.scene = scene;
        this._engine = scene.getEngine();
        this.scene._addComponent(this);
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
     * Disposes the component and the associated ressources.
     */
    public dispose(): void {
        // Nothing to do here.
    }

    /**
     * Renders the outline in the canvas.
     * @param subMesh Defines the sumesh to render
     * @param batch Defines the batch of meshes in case of instances
     * @param useOverlay Defines if the rendering is for the overlay or the outline
     */
    public render(subMesh: SubMesh, batch: _InstancesBatch, useOverlay: boolean = false): void {
        var scene = this.scene;
        var engine = scene.getEngine();

        var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null && batch.visibleInstances[subMesh._id] !== undefined || subMesh.getRenderingMesh().hasThinInstances);

        if (!this.isReady(subMesh, hardwareInstancedRendering)) {
            return;
        }

        var ownerMesh = subMesh.getMesh();
        var replacementMesh = ownerMesh._internalAbstractMeshDataInfo._actAsRegularMesh ? ownerMesh : null;
        var renderingMesh = subMesh.getRenderingMesh();
        var effectiveMesh = replacementMesh ? replacementMesh : renderingMesh;
        var material = subMesh.getMaterial();

        if (!material || !scene.activeCamera) {
            return;
        }

        engine.enableEffect(this._effect);

        // Logarithmic depth
        if ((<any>material).useLogarithmicDepth) {
            this._effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(scene.activeCamera.maxZ + 1.0) / Math.LN2));
        }

        this._effect.setFloat("offset", useOverlay ? 0 : renderingMesh.outlineWidth);
        this._effect.setColor4("color", useOverlay ? renderingMesh.overlayColor : renderingMesh.outlineColor, useOverlay ? renderingMesh.overlayAlpha : material.alpha);
        this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
        this._effect.setMatrix("world", effectiveMesh.getWorldMatrix());

        // Bones
        if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
            this._effect.setMatrices("mBones", renderingMesh.skeleton.getTransformMatrices(renderingMesh));
        }

        // Morph targets
        MaterialHelper.BindMorphTargetParameters(renderingMesh, this._effect);

        renderingMesh._bind(subMesh, this._effect, material.fillMode);

        // Alpha test
        if (material && material.needAlphaTesting()) {
            var alphaTexture = material.getAlphaTestTexture();
            if (alphaTexture) {
                this._effect.setTexture("diffuseSampler", alphaTexture);
                this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
            }
        }

        engine.setZOffset(-this.zOffset);
        renderingMesh._processRendering(effectiveMesh, subMesh, this._effect, material.fillMode, batch, hardwareInstancedRendering,
            (isInstance, world) => { this._effect.setMatrix("world", world); });

        engine.setZOffset(0);
    }

    /**
     * Returns whether or not the outline renderer is ready for a given submesh.
     * All the dependencies e.g. submeshes, texture, effect... mus be ready
     * @param subMesh Defines the submesh to check readyness for
     * @param useInstances Defines wheter wee are trying to render instances or not
     * @returns true if ready otherwise false
     */
    public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        var defines = [];
        var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

        var mesh = subMesh.getMesh();
        var material = subMesh.getMaterial();

        if (material) {
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
        }
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
            if (morphTargetManager.numInfluencers > 0) {
                numMorphInfluencers = morphTargetManager.numInfluencers;

                defines.push("#define MORPHTARGETS");
                defines.push("#define NUM_MORPH_INFLUENCERS " + numMorphInfluencers);

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
        var join = defines.join("\n");
        if (this._cachedDefines !== join) {
            this._cachedDefines = join;
            this._effect = this.scene.getEngine().createEffect("outline",
                attribs,
                ["world", "mBones", "viewProjection", "diffuseMatrix", "offset", "color", "logarithmicDepthConstant", "morphTargetInfluences"],
                ["diffuseSampler"], join,
                undefined, undefined, undefined,
                { maxSimultaneousMorphTargets: numMorphInfluencers });
        }

        return this._effect.isReady();
    }

    private _beforeRenderingMesh(mesh: Mesh, subMesh: SubMesh, batch: _InstancesBatch): void {
        // Outline - step 1
        this._savedDepthWrite = this._engine.getDepthWrite();
        if (mesh.renderOutline) {
            var material = subMesh.getMaterial();
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
                this.render(subMesh, batch, /* This sets offset to 0 */ true);

                this._engine.setColorWrite(true);
                this._engine.setStencilFunction(Constants.NOTEQUAL);
            }

            // Draw the outline using the above stencil if needed to avoid drawing within the mesh
            this._engine.setDepthWrite(false);
            this.render(subMesh, batch);
            this._engine.setDepthWrite(this._savedDepthWrite);

            if (material && material.needAlphaBlendingForMesh(mesh)) {
                this._engine.restoreStencilState();
            }
        }
    }

    private _afterRenderingMesh(mesh: Mesh, subMesh: SubMesh, batch: _InstancesBatch): void {
        // Overlay
        if (mesh.renderOverlay) {
            var currentMode = this._engine.getAlphaMode();
            let alphaBlendState = this._engine.alphaState.alphaBlend;
            this._engine.setAlphaMode(Constants.ALPHA_COMBINE);
            this.render(subMesh, batch, true);
            this._engine.setAlphaMode(currentMode);
            this._engine.setDepthWrite(this._savedDepthWrite);
            this._engine.alphaState.alphaBlend = alphaBlendState;
        }

        // Outline - step 2
        if (mesh.renderOutline && this._savedDepthWrite) {
            this._engine.setDepthWrite(true);
            this._engine.setColorWrite(false);
            this.render(subMesh, batch);
            this._engine.setColorWrite(true);
        }
    }
}
