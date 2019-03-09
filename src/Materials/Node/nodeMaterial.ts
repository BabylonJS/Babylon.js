import { NodeMaterialBlock } from './nodeMaterialBlock';
import { Material } from '../material';
import { Scene } from '../../scene';
import { AbstractMesh } from '../../Meshes/abstractMesh';
import { Matrix } from '../../Maths/math';
import { Mesh } from '../../Meshes/mesh';
import { Engine } from '../../Engines/engine';
import { NodeMaterialBuildState } from './nodeMaterialBuildState';
import { EffectCreationOptions, EffectFallbacks } from '../effect';
import { BaseTexture } from '../../Materials/Textures/baseTexture';
import { NodeMaterialConnectionPoint } from './nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockConnectionPointTypes } from './nodeMaterialBlockConnectionPointTypes';
import { Observable } from '../../Misc/observable';
import { NodeMaterialBlockTargets } from './nodeMaterialBlockTargets';
import { NodeMaterialBuildStateSharedData } from './NodeMaterialBuildStateSharedData';

/**
 * Class used to configure NodeMaterial
 */
export interface INodeMaterialOptions {
    /**
     * Defines if blocks should emit comments
     */
    emitComments: boolean;
}

/**
 * Class used to create a node based material built by assembling shader blocks
 */
export class NodeMaterial extends Material {
    private _options: INodeMaterialOptions;
    private _vertexCompilationState: NodeMaterialBuildState;
    private _fragmentCompilationState: NodeMaterialBuildState;
    private _buildId: number = 0;
    private _renderId: number;
    private _effectCompileId: number = 0;
    private _cachedWorldViewMatrix = new Matrix();
    private _cachedWorldViewProjectionMatrix = new Matrix();
    private _textureConnectionPoints = new Array<NodeMaterialConnectionPoint>();

    /**
     * Observable raised when the material is built
     */
    public onBuildObservable = new Observable<NodeMaterial>();

    /**
     * Gets or sets the root nodes of the material vertex shader
     */
    private _vertexRootNodes = new Array<NodeMaterialBlock>();

    /**
     * Gets or sets the root nodes of the material fragment (pixel) shader
     */
    private _fragmentRootNodes = new Array<NodeMaterialBlock>();

    /** Gets or sets options to control the node material overall behavior */
    public get options() {
        return this._options;
    }

    public set options(options: INodeMaterialOptions) {
        this._options = options;
    }

    /**
     * Create a new node based material
     * @param name defines the material name
     * @param scene defines the hosting scene
     * @param options defines creation option
     */
    constructor(name: string, scene?: Scene, options: Partial<INodeMaterialOptions> = {}) {
        super(name, scene || Engine.LastCreatedScene!);

        this._options = {
            emitComments: false,
            ...options
        };
    }

    /**
     * Gets the current class name of the material e.g. "NodeMaterial"
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeMaterial";
    }

    /**
     * Add a new block to the list of root nodes
     * @param node defines the node to add
     * @returns the current material
     */
    public addRootNode(node: NodeMaterialBlock) {
        if (node.target === null) {
            throw "This node is not meant to be at root level. You may want to explicitly set its target value.";
        }

        if ((node.target & NodeMaterialBlockTargets.Vertex) !== 0 && node._canAddAtVertexRoot) {
            this._addVertexRootNode(node);
        }

        if ((node.target & NodeMaterialBlockTargets.Fragment) !== 0 && node._canAddAtFragmentRoot) {
            this._addFragmentRootNode(node);
        }

        return this;
    }

    /**
     * Remove a block from the list of root nodes
     * @param node defines the node to remove
     * @returns the current material
     */
    public removeRootNode(node: NodeMaterialBlock) {
        if (node.target === null) {
            return this;
        }

        if ((node.target & NodeMaterialBlockTargets.Vertex) !== 0) {
            this._removeVertexRootNode(node);
        }

        if ((node.target & NodeMaterialBlockTargets.Fragment) !== 0) {
            this._removeFragmentRootNode(node);
        }

        return this;
    }

    private _addVertexRootNode(node: NodeMaterialBlock) {
        if (this._vertexRootNodes.indexOf(node) !== -1) {
            return;
        }

        node.target = NodeMaterialBlockTargets.Vertex;
        this._vertexRootNodes.push(node);

        return this;
    }

    private _removeVertexRootNode(node: NodeMaterialBlock) {
        let index = this._vertexRootNodes.indexOf(node);
        if (index === -1) {
            return;
        }

        this._vertexRootNodes.splice(index, 1);

        return this;
    }

    private _addFragmentRootNode(node: NodeMaterialBlock) {
        if (this._fragmentRootNodes.indexOf(node) !== -1) {
            return;
        }

        node.target = NodeMaterialBlockTargets.Fragment;
        this._fragmentRootNodes.push(node);

        return this;
    }

    private _removeFragmentRootNode(node: NodeMaterialBlock) {
        let index = this._fragmentRootNodes.indexOf(node);
        if (index === -1) {
            return;
        }

        this._fragmentRootNodes.splice(index, 1);

        return this;
    }

    /**
     * Specifies if the material will require alpha blending
     * @returns a boolean specifying if alpha blending is needed
     */
    public needAlphaBlending(): boolean {
        return (this.alpha < 1.0) || this._fragmentCompilationState.sharedData.hints.needAlphaBlending;
    }

    /**
     * Specifies if this material should be rendered in alpha test mode
     * @returns a boolean specifying if an alpha test is needed.
     */
    public needAlphaTesting(): boolean {
        return this._fragmentCompilationState.sharedData.hints.needAlphaTesting;
    }

    private _propagateTarget(node: NodeMaterialBlock, target: NodeMaterialBlockTargets, state: NodeMaterialBuildState) {
        node.target = target;
        node.initialize(state);

        for (var exitPoint of node.outputs) {
            for (var block of exitPoint.connectedBlocks) {
                if (block) {
                    this._propagateTarget(block, target, state);
                }
            }
        }
    }

    private _resetDualBlocks(node: NodeMaterialBlock, id: number) {
        if (node.target === NodeMaterialBlockTargets.VertexAndFragment) {
            node.buildId = id;
        }

        for (var exitPoint of node.outputs) {
            for (var block of exitPoint.connectedBlocks) {
                if (block) {
                    this._resetDualBlocks(block, id);
                }
            }
        }
    }

    /**
     * Build the material and generates the inner effect
     * @param verbose defines if the build should log activity
     */
    public build(verbose: boolean = false) {
        if (this._vertexRootNodes.length === 0) {
            throw "You must define at least one vertexRootNode";
        }

        if (this._fragmentRootNodes.length === 0) {
            throw "You must define at least one fragmentRootNode";
        }

        // Compilation state
        this._vertexCompilationState = new NodeMaterialBuildState();
        this._vertexCompilationState.target = NodeMaterialBlockTargets.Vertex;
        this._fragmentCompilationState = new NodeMaterialBuildState();
        this._fragmentCompilationState.target = NodeMaterialBlockTargets.Fragment;

        // Shared data
        let sharedData = new NodeMaterialBuildStateSharedData();
        this._vertexCompilationState.sharedData = sharedData;
        this._fragmentCompilationState.sharedData = sharedData;
        sharedData.buildId = this._buildId;
        sharedData.emitComments = this._options.emitComments;
        sharedData.verbose = verbose;

        // Propagate targets
        for (var vertexRootNode of this._vertexRootNodes) {
            this._propagateTarget(vertexRootNode, NodeMaterialBlockTargets.Vertex, this._vertexCompilationState);
        }

        for (var fragmentRootNode of this._fragmentRootNodes) {
            this._propagateTarget(fragmentRootNode, NodeMaterialBlockTargets.Fragment, this._fragmentCompilationState);
        }

        // Vertex
        for (var vertexRootNode of this._vertexRootNodes) {
            vertexRootNode.build(this._vertexCompilationState);
        }

        // Fragment
        this._fragmentCompilationState._vertexState = this._vertexCompilationState;

        for (var fragmentRootNode of this._fragmentRootNodes) {
            this._resetDualBlocks(fragmentRootNode, this._buildId - 1);
        }

        for (var fragmentRootNode of this._fragmentRootNodes) {
            fragmentRootNode.build(this._fragmentCompilationState);
        }

        // Finalize
        this._vertexCompilationState.finalize(this._vertexCompilationState);
        this._fragmentCompilationState.finalize(this._fragmentCompilationState);

        // Textures
        this._textureConnectionPoints = sharedData.uniformConnectionPoints.filter((u) => u.type === NodeMaterialBlockConnectionPointTypes.Texture);

        this._buildId++;

        // Errors
        sharedData.emitErrors();

        if (verbose) {
            console.log("Vertex shader:");
            console.log(this._vertexCompilationState.compilationString);
            console.log("Fragment shader:");
            console.log(this._fragmentCompilationState.compilationString);
        }

        this.onBuildObservable.notifyObservers(this);
    }

    /**
     * Checks if the material is ready to render the requested mesh
     * @param mesh defines the mesh to render
     * @param useInstances defines whether or not the material is used with instances
     * @returns true if ready, otherwise false
     */
    public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
        var scene = this.getScene();
        var engine = scene.getEngine();
        let defines: string[] = [];
        var fallbacks = new EffectFallbacks();

        if (!this.checkReadyOnEveryCall) {
            if (this._renderId === scene.getRenderId()) {
                return true;
            }
        }

        // Textures
        for (var connectionPoint of this._textureConnectionPoints) {
            let texture = connectionPoint.value as BaseTexture;
            if (texture && !texture.isReady()) {
                return false;
            }
        }

        this._renderId = scene.getRenderId();

        if (this._effectCompileId === this._buildId) {
            return true;
        }

        var previousEffect = this._effect;

        // Uniforms
        let mergedUniforms = this._vertexCompilationState.uniforms;

        this._fragmentCompilationState.uniforms.forEach((u) => {
            let index = mergedUniforms.indexOf(u);

            if (index === -1) {
                mergedUniforms.push(u);
            }

        });

        // Samplers
        let mergedSamplers = this._vertexCompilationState.samplers;

        this._fragmentCompilationState.samplers.forEach((s) => {
            let index = mergedSamplers.indexOf(s);

            if (index === -1) {
                mergedSamplers.push(s);
            }
        });

        // Bones
        if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            const skeleton = mesh.skeleton;

            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            fallbacks.addCPUSkinningFallback(0, mesh);

            if (skeleton.isUsingTextureForMatrices) {
                defines.push("#define BONETEXTURE");

                if (mergedUniforms.indexOf("boneTextureWidth") === -1) {
                    mergedUniforms.push("boneTextureWidth");
                }

                if (mergedSamplers.indexOf("boneSampler") === -1) {
                    mergedSamplers.push("boneSampler");
                }
            } else {
                defines.push("#define BonesPerMesh " + (skeleton.bones.length + 1));

                if (mergedUniforms.indexOf("mBones") === -1) {
                    mergedUniforms.push("mBones");
                }
            }

        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }

        // Compilation
        var join = defines.join("\n");
        this._effect = engine.createEffect({
            vertex: "nodeMaterial" + this._buildId,
            fragment: "nodeMaterial" + this._buildId,
            vertexSource: this._vertexCompilationState.compilationString,
            fragmentSource: this._fragmentCompilationState.compilationString
        }, <EffectCreationOptions>{
            attributes: this._vertexCompilationState.attributes,
            uniformsNames: mergedUniforms,
            samplers: mergedSamplers,
            defines: join,
            fallbacks: fallbacks,
            onCompiled: this.onCompiled,
            onError: this.onError
        }, engine);

        if (!this._effect.isReady()) {
            return false;
        }

        if (previousEffect !== this._effect) {
            scene.resetCachedMaterial();
        }

        this._effectCompileId = this._buildId;

        return true;
    }

    /**
     * Binds the world matrix to the material
     * @param world defines the world transformation matrix
     */
    public bindOnlyWorldMatrix(world: Matrix): void {
        var scene = this.getScene();

        if (!this._effect) {
            return;
        }

        let hints = this._fragmentCompilationState.sharedData.hints;
        if (hints.needWorldMatrix) {
            this._effect.setMatrix("world", world);
        }

        if (hints.needWorldViewMatrix) {
            world.multiplyToRef(scene.getViewMatrix(), this._cachedWorldViewMatrix);
            this._effect.setMatrix("worldView", this._cachedWorldViewMatrix);
        }

        if (hints.needWorldViewProjectionMatrix) {
            world.multiplyToRef(scene.getTransformMatrix(), this._cachedWorldViewProjectionMatrix);
            this._effect.setMatrix("worldViewProjection", this._cachedWorldViewProjectionMatrix);
        }
    }

    /**
     * Binds the material to the mesh
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh to bind the material to
     */
    public bind(world: Matrix, mesh?: Mesh): void {
        let scene = this.getScene();
        // Std values
        this.bindOnlyWorldMatrix(world);

        let sharedData = this._fragmentCompilationState.sharedData;
        if (this._effect && scene.getCachedMaterial() !== this) {
            let hints = sharedData.hints;

            if (hints.needViewMatrix) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }

            if (hints.needProjectionMatrix) {
                this._effect.setMatrix("projection", scene.getProjectionMatrix());
            }

            if (hints.needViewProjectionMatrix) {
                this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
            }

            if (hints.needFogColor) {
                this._effect.setColor3("fogColor", scene.fogColor);
            }

            if (hints.needFogParameters) {
                this._effect.setFloat4("fogParameters", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
            }

            // Connection points
            for (var connectionPoint of sharedData.uniformConnectionPoints) {
                connectionPoint.transmit(this._effect);
            }

            // Bindable blocks
            for (var block of sharedData.activeBlocks) {
                block.bind(this._effect, mesh);
            }
        }

        this._afterBind(mesh);
    }

    /**
     * Gets the active textures from the material
     * @returns an array of textures
     */
    public getActiveTextures(): BaseTexture[] {
        var activeTextures = super.getActiveTextures();

        for (var connectionPoint of this._textureConnectionPoints) {
            if (connectionPoint.value) {
                activeTextures.push(connectionPoint.value);
            }
        }

        return activeTextures;
    }

    /**
     * Specifies if the material uses a texture
     * @param texture defines the texture to check against the material
     * @returns a boolean specifying if the material uses the texture
     */
    public hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        for (var connectionPoint of this._textureConnectionPoints) {
            if (connectionPoint.value === texture) {
                return true;
            }
        }

        return false;
    }

    /**
     * Disposes the material
     * @param forceDisposeEffect specifies if effects should be forcefully disposed
     * @param forceDisposeTextures specifies if textures should be forcefully disposed
     * @param notBoundToMesh specifies if the material that is being disposed is known to be not bound to any mesh
     */
    public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean, notBoundToMesh?: boolean): void {

        if (forceDisposeTextures) {
            for (var connectionPoint of this._textureConnectionPoints) {
                if (connectionPoint.value) {
                    (connectionPoint.value as BaseTexture).dispose();
                }
            }
        }

        this._textureConnectionPoints = [];
        this.onBuildObservable.clear();

        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
    }
}