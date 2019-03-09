import { NodeMaterialBlock } from './nodeMaterialBlock';
import { PushMaterial } from '../pushMaterial';
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
import { SubMesh } from '../../Meshes/subMesh';
import { MaterialDefines } from '../../Materials/materialDefines';
import { MaterialHelper } from '../../Materials/materialHelper';

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
export class NodeMaterial extends PushMaterial {
    private _options: INodeMaterialOptions;
    private _vertexCompilationState: NodeMaterialBuildState;
    private _fragmentCompilationState: NodeMaterialBuildState;
    private _sharedData: NodeMaterialBuildStateSharedData;
    private _buildId: number = 0;
    private _buildWasSuccessful = false;
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
        return (this.alpha < 1.0) || this._sharedData.hints.needAlphaBlending;
    }

    /**
     * Specifies if this material should be rendered in alpha test mode
     * @returns a boolean specifying if an alpha test is needed.
     */
    public needAlphaTesting(): boolean {
        return this._sharedData.hints.needAlphaTesting;
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
        this._buildWasSuccessful = false;
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
        this._sharedData = new NodeMaterialBuildStateSharedData();
        this._vertexCompilationState.sharedData = this._sharedData;
        this._fragmentCompilationState.sharedData = this._sharedData;
        this._sharedData.buildId = this._buildId;
        this._sharedData.emitComments = this._options.emitComments;
        this._sharedData.verbose = verbose;

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
        this._textureConnectionPoints = this._sharedData.uniformConnectionPoints.filter((u) => u.type === NodeMaterialBlockConnectionPointTypes.Texture);

        this._buildId++;

        // Errors
        this._sharedData.emitErrors();

        if (verbose) {
            console.log("Vertex shader:");
            console.log(this._vertexCompilationState.compilationString);
            console.log("Fragment shader:");
            console.log(this._fragmentCompilationState.compilationString);
        }

        this._buildWasSuccessful = true;
        this.onBuildObservable.notifyObservers(this);
    }

   /**
     * Get if the submesh is ready to be used and all its information available.
     * Child classes can use it to update shaders
     * @param mesh defines the mesh to check
     * @param subMesh defines which submesh to check
     * @param useInstances specifies that instances should be used
     * @returns a boolean indicating that the submesh is ready or not
     */
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances: boolean = false): boolean {
        if (!this._buildWasSuccessful) {
            return false;
        }

        if (subMesh.effect && this.isFrozen) {
            if (this._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh._materialDefines) {
            subMesh._materialDefines = new MaterialDefines();
        }

        var scene = this.getScene();
        var defines = subMesh._materialDefines;
        if (!this.checkReadyOnEveryCall && subMesh.effect) {
            if (defines._renderId === scene.getRenderId()) {
                return true;
            }
        }

        var engine = scene.getEngine();
        // Textures
        for (var connectionPoint of this._textureConnectionPoints) {
            let texture = connectionPoint.value as BaseTexture;
            if (texture && !texture.isReady()) {
                return false;
            }
        }

        // Bones
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true, false, false);

        if (defines.isDirty) {
            defines.markAsProcessed();
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

            var fallbacks = new EffectFallbacks();

            this._sharedData.blocksWithFallbacks.forEach(b => {
                b.provideFallbacks(mesh, fallbacks);
            })

            let previousEffect = subMesh.effect;
            // Compilation
            var join = defines.toString();
            var effect = engine.createEffect({
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

            if (effect) {
                // Use previous effect while new one is compiling
                if (this.allowShaderHotSwapping && previousEffect && !effect.isReady()) {
                    effect = previousEffect;
                    defines.markAsUnprocessed();
                } else {
                    scene.resetCachedMaterial();
                    subMesh.setEffect(effect, defines);
                }
            }
        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        this._wasPreviouslyReady = true;

        return true;
    }

    /**
     * Binds the world matrix to the material
     * @param world defines the world transformation matrix
     */
    public bindOnlyWorldMatrix(world: Matrix): void {
        var scene = this.getScene();

        if (!this._activeEffect) {
            return;
        }

        let hints = this._sharedData.hints;

        if (hints.needWorldViewMatrix) {
            world.multiplyToRef(scene.getViewMatrix(), this._cachedWorldViewMatrix);
        }

        if (hints.needWorldViewProjectionMatrix) {
            world.multiplyToRef(scene.getTransformMatrix(), this._cachedWorldViewProjectionMatrix);
        }

        // Connection points
        for (var connectionPoint of this._sharedData.uniformConnectionPoints) {
            connectionPoint.transmitWorld(this._activeEffect, world, this._cachedWorldViewMatrix, this._cachedWorldViewProjectionMatrix);
        }
    }

    /**
     * Binds the submesh to this material by preparing the effect and shader to draw
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        let scene = this.getScene();
        var effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;

        // Matrices
        this.bindOnlyWorldMatrix(world);

        let mustRebind = this._mustRebind(scene, effect, mesh.visibility);

        if (mustRebind) {
            let sharedData = this._sharedData;
            if (effect && scene.getCachedMaterial() !== this) {
                // Connection points
                for (var connectionPoint of sharedData.uniformConnectionPoints) {
                    connectionPoint.transmit(effect, scene);
                }

                // Bindable blocks
                for (var block of sharedData.bindableBlocks) {
                    block.bind(effect, mesh);
                }
            }
        }

        this._afterBind(mesh, this._activeEffect);
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