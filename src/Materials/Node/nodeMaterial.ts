import { NodeMaterialBlock } from './nodeMaterialBlock';
import { PushMaterial } from '../pushMaterial';
import { Scene } from '../../scene';
import { AbstractMesh } from '../../Meshes/abstractMesh';
import { Matrix, Color4 } from '../../Maths/math';
import { Mesh } from '../../Meshes/mesh';
import { Engine } from '../../Engines/engine';
import { NodeMaterialBuildState } from './nodeMaterialBuildState';
import { EffectCreationOptions, EffectFallbacks } from '../effect';
import { BaseTexture } from '../../Materials/Textures/baseTexture';
import { Observable, Observer } from '../../Misc/observable';
import { NodeMaterialBlockTargets } from './nodeMaterialBlockTargets';
import { NodeMaterialBuildStateSharedData } from './nodeMaterialBuildStateSharedData';
import { SubMesh } from '../../Meshes/subMesh';
import { MaterialDefines } from '../../Materials/materialDefines';
import { NodeMaterialOptimizer } from './Optimizers/nodeMaterialOptimizer';
import { ImageProcessingConfiguration, IImageProcessingConfigurationDefines } from '../imageProcessingConfiguration';
import { Nullable } from '../../types';
import { VertexBuffer } from '../../Meshes/buffer';
import { Tools } from '../../Misc/tools';
import { Vector4TransformBlock } from './Blocks/vector4TransformBlock';
import { VertexOutputBlock } from './Blocks/Vertex/vertexOutputBlock';
import { FragmentOutputBlock } from './Blocks/Fragment/fragmentOutputBlock';
import { InputBlock } from './Blocks/Input/inputBlock';

// declare NODEEDITOR namespace for compilation issue
declare var NODEEDITOR: any;
declare var BABYLON: any;

/**
 * Interface used to configure the node material editor
 */
export interface INodeMaterialEditorOptions {
    /** Define the URl to load node editor script */
    editorURL?: string;
}

/** @hidden */
export class NodeMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
    /** BONES */
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public BONETEXTURE = false;

    /** MORPH TARGETS */
    public MORPHTARGETS = false;
    public MORPHTARGETS_NORMAL = false;
    public MORPHTARGETS_TANGENT = false;
    public MORPHTARGETS_UV = false;
    public NUM_MORPH_INFLUENCERS = 0;

    /** IMAGE PROCESSING */
    public IMAGEPROCESSING = false;
    public VIGNETTE = false;
    public VIGNETTEBLENDMODEMULTIPLY = false;
    public VIGNETTEBLENDMODEOPAQUE = false;
    public TONEMAPPING = false;
    public TONEMAPPING_ACES = false;
    public CONTRAST = false;
    public EXPOSURE = false;
    public COLORCURVES = false;
    public COLORGRADING = false;
    public COLORGRADING3D = false;
    public SAMPLER3DGREENDEPTH = false;
    public SAMPLER3DBGRMAP = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;

    constructor() {
        super();
        this.rebuild();
    }

    public setValue(name: string, value: boolean) {
        if (this[name] === undefined) {
            this._keys.push(name);
        }

        this[name] = value;
    }
}

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
    private _textures: BaseTexture[];
    private _optimizers = new Array<NodeMaterialOptimizer>();

    /** Define the URl to load node editor script */
    public static EditorURL = `https://unpkg.com/babylonjs-node-editor@${Engine.Version}/babylon.nodeEditor.js`;

    private BJSNODEMATERIALEDITOR = this._getGlobalNodeMaterialEditor();

    /** Get the inspector from bundle or global */
    private _getGlobalNodeMaterialEditor(): any {
        // UMD Global name detection from Webpack Bundle UMD Name.
        if (typeof NODEEDITOR !== 'undefined') {
            return NODEEDITOR;
        }

        // In case of module let's check the global emitted from the editor entry point.
        if (typeof BABYLON !== 'undefined' && typeof BABYLON.NodeEditor !== 'undefined') {
            return BABYLON;
        }

        return undefined;
    }

    /**
    * Defines the maximum number of lights that can be used in the material
    */
    public maxSimultaneousLights = 4;

    /**
     * Observable raised when the material is built
     */
    public onBuildObservable = new Observable<NodeMaterial>();

    /**
     * Gets or sets the root nodes of the material vertex shader
     */
    public _vertexOutputNodes = new Array<NodeMaterialBlock>();

    /**
     * Gets or sets the root nodes of the material fragment (pixel) shader
     */
    public _fragmentOutputNodes = new Array<NodeMaterialBlock>();

    /** Gets or sets options to control the node material overall behavior */
    public get options() {
        return this._options;
    }

    public set options(options: INodeMaterialOptions) {
        this._options = options;
    }

    /**
     * Default configuration related to image processing available in the standard Material.
     */
    protected _imageProcessingConfiguration: ImageProcessingConfiguration;

    /**
     * Gets the image processing configuration used either in this material.
     */
    public get imageProcessingConfiguration(): ImageProcessingConfiguration {
        return this._imageProcessingConfiguration;
    }

    /**
     * Sets the Default image processing configuration used either in the this material.
     *
     * If sets to null, the scene one is in use.
     */
    public set imageProcessingConfiguration(value: ImageProcessingConfiguration) {
        this._attachImageProcessingConfiguration(value);

        // Ensure the effect will be rebuilt.
        this._markAllSubMeshesAsTexturesDirty();
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

        // Setup the default processing configuration to the scene.
        this._attachImageProcessingConfiguration(null);
    }

    /**
     * Gets the current class name of the material e.g. "NodeMaterial"
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeMaterial";
    }

    /**
     * Keep track of the image processing observer to allow dispose and replace.
     */
    private _imageProcessingObserver: Nullable<Observer<ImageProcessingConfiguration>>;

    /**
     * Attaches a new image processing configuration to the Standard Material.
     * @param configuration
     */
    protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void {
        if (configuration === this._imageProcessingConfiguration) {
            return;
        }

        // Detaches observer.
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        // Pick the scene configuration if needed.
        if (!configuration) {
            this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
        }
        else {
            this._imageProcessingConfiguration = configuration;
        }

        // Attaches observer.
        if (this._imageProcessingConfiguration) {
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                this._markAllSubMeshesAsImageProcessingDirty();
            });
        }
    }

    /**
     * Adds a new optimizer to the list of optimizers
     * @param optimizer defines the optimizers to add
     * @returns the current material
     */
    public registerOptimizer(optimizer: NodeMaterialOptimizer) {
        let index = this._optimizers.indexOf(optimizer);

        if (index > -1) {
            return;
        }

        this._optimizers.push(optimizer);

        return this;
    }

    /**
     * Remove an optimizer from the list of optimizers
     * @param optimizer defines the optimizers to remove
     * @returns the current material
     */
    public unregisterOptimizer(optimizer: NodeMaterialOptimizer) {
        let index = this._optimizers.indexOf(optimizer);

        if (index === -1) {
            return;
        }

        this._optimizers.splice(index, 1);

        return this;
    }

    /**
     * Add a new block to the list of output nodes
     * @param node defines the node to add
     * @returns the current material
     */
    public addOutputNode(node: NodeMaterialBlock) {
        if (node.target === null) {
            throw "This node is not meant to be an output node. You may want to explicitly set its target value.";
        }

        if ((node.target & NodeMaterialBlockTargets.Vertex) !== 0) {
            this._addVertexOutputNode(node);
        }

        if ((node.target & NodeMaterialBlockTargets.Fragment) !== 0) {
            this._addFragmentOutputNode(node);
        }

        return this;
    }

    /**
     * Remove a block from the list of root nodes
     * @param node defines the node to remove
     * @returns the current material
     */
    public removeOutputNode(node: NodeMaterialBlock) {
        if (node.target === null) {
            return this;
        }

        if ((node.target & NodeMaterialBlockTargets.Vertex) !== 0) {
            this._removeVertexOutputNode(node);
        }

        if ((node.target & NodeMaterialBlockTargets.Fragment) !== 0) {
            this._removeFragmentOutputNode(node);
        }

        return this;
    }

    private _addVertexOutputNode(node: NodeMaterialBlock) {
        if (this._vertexOutputNodes.indexOf(node) !== -1) {
            return;
        }

        node.target = NodeMaterialBlockTargets.Vertex;
        this._vertexOutputNodes.push(node);

        return this;
    }

    private _removeVertexOutputNode(node: NodeMaterialBlock) {
        let index = this._vertexOutputNodes.indexOf(node);
        if (index === -1) {
            return;
        }

        this._vertexOutputNodes.splice(index, 1);

        return this;
    }

    private _addFragmentOutputNode(node: NodeMaterialBlock) {
        if (this._fragmentOutputNodes.indexOf(node) !== -1) {
            return;
        }

        node.target = NodeMaterialBlockTargets.Fragment;
        this._fragmentOutputNodes.push(node);

        return this;
    }

    private _removeFragmentOutputNode(node: NodeMaterialBlock) {
        let index = this._fragmentOutputNodes.indexOf(node);
        if (index === -1) {
            return;
        }

        this._fragmentOutputNodes.splice(index, 1);

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

    private _initializeBlock(node: NodeMaterialBlock, state: NodeMaterialBuildState) {
        node.initialize(state);
        node.autoConfigure();

        for (var inputs of node.inputs) {
            let connectedPoint = inputs.connectedPoint;
            if (connectedPoint) {
                let block = connectedPoint.ownerBlock;
                if (block !== node) {
                    this._initializeBlock(block, state);
                }
            }
        }
    }

    private _resetDualBlocks(node: NodeMaterialBlock, id: number) {
        if (node.target === NodeMaterialBlockTargets.VertexAndFragment) {
            node.buildId = id;
        }

        for (var inputs of node.inputs) {
            let connectedPoint = inputs.connectedPoint;
            if (connectedPoint) {
                let block = connectedPoint.ownerBlock;
                if (block !== node) {
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
        var engine = this.getScene().getEngine();

        if (this._vertexOutputNodes.length === 0) {
            throw "You must define at least one vertexOutputNode";
        }

        if (this._fragmentOutputNodes.length === 0) {
            throw "You must define at least one fragmentOutputNode";
        }

        // Compilation state
        this._vertexCompilationState = new NodeMaterialBuildState();
        this._vertexCompilationState.supportUniformBuffers = engine.supportsUniformBuffers;
        this._vertexCompilationState.target = NodeMaterialBlockTargets.Vertex;
        this._fragmentCompilationState = new NodeMaterialBuildState();
        this._fragmentCompilationState.supportUniformBuffers = engine.supportsUniformBuffers;
        this._fragmentCompilationState.target = NodeMaterialBlockTargets.Fragment;

        // Shared data
        this._sharedData = new NodeMaterialBuildStateSharedData();
        this._vertexCompilationState.sharedData = this._sharedData;
        this._fragmentCompilationState.sharedData = this._sharedData;
        this._sharedData.buildId = this._buildId;
        this._sharedData.emitComments = this._options.emitComments;
        this._sharedData.verbose = verbose;

        // Initialize blocks
        for (var vertexOutputNode of this._vertexOutputNodes) {
            this._initializeBlock(vertexOutputNode, this._vertexCompilationState);
        }

        for (var fragmentOutputNode of this._fragmentOutputNodes) {
            this._initializeBlock(fragmentOutputNode, this._fragmentCompilationState);
        }

        // Optimize
        this.optimize();

        // Vertex
        for (var vertexOutputNode of this._vertexOutputNodes) {
            vertexOutputNode.build(this._vertexCompilationState);
        }

        // Fragment
        this._fragmentCompilationState._vertexState = this._vertexCompilationState;

        for (var fragmentOutputNode of this._fragmentOutputNodes) {
            this._resetDualBlocks(fragmentOutputNode, this._buildId - 1);
        }

        for (var fragmentOutputNode of this._fragmentOutputNodes) {
            fragmentOutputNode.build(this._fragmentCompilationState);
        }

        // Finalize
        this._vertexCompilationState.finalize(this._vertexCompilationState);
        this._fragmentCompilationState.finalize(this._fragmentCompilationState);

        this._textures = this._sharedData.textureBlocks.filter((tb) => tb.texture).map((tb) => tb.texture);
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

        this._markAllSubMeshesAsAllDirty();
    }

    /**
     * Runs an otpimization phase to try to improve the shader code
     */
    public optimize() {
        for (var optimizer of this._optimizers) {
            optimizer.optimize(this._vertexOutputNodes, this._fragmentOutputNodes);
        }
    }

    private _prepareDefinesForAttributes(mesh: AbstractMesh, defines: NodeMaterialDefines) {
        if (!defines._areAttributesDirty && defines._needNormals === defines._normals && defines._needUVs === defines._uvs) {
            return;
        }

        defines._normals = defines._needNormals;
        defines._uvs = defines._needUVs;

        defines.setValue("NORMAL", (defines._needNormals && mesh.isVerticesDataPresent(VertexBuffer.NormalKind)));
        defines.setValue("TANGENT", mesh.isVerticesDataPresent(VertexBuffer.TangentKind));
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
            subMesh._materialDefines = new NodeMaterialDefines();
        }

        var scene = this.getScene();
        var defines = <NodeMaterialDefines>subMesh._materialDefines;
        if (!this.checkReadyOnEveryCall && subMesh.effect) {
            if (defines._renderId === scene.getRenderId()) {
                return true;
            }
        }

        var engine = scene.getEngine();

        this._prepareDefinesForAttributes(mesh, defines);

        // Check if blocks are ready
        if (this._sharedData.blockingBlocks.some((b) => !b.isReady(mesh, this, defines, useInstances))) {
            return false;
        }

        // Shared defines
        this._sharedData.blocksWithDefines.forEach((b) => {
            b.initializeDefines(mesh, this, defines, useInstances);
        });

        this._sharedData.blocksWithDefines.forEach((b) => {
            b.prepareDefines(mesh, this, defines, useInstances);
        });

        // Need to recompile?
        if (defines.isDirty) {
            defines.markAsProcessed();

            // Repeatable content generators
            this._vertexCompilationState.compilationString = this._vertexCompilationState._builtCompilationString;
            this._fragmentCompilationState.compilationString = this._fragmentCompilationState._builtCompilationString;

            this._sharedData.repeatableContentBlocks.forEach((b) => {
                b.replaceRepeatableContent(this._vertexCompilationState, this._fragmentCompilationState, mesh, defines);
            });

            // Uniforms
            this._sharedData.dynamicUniformBlocks.forEach((b) => {
                b.updateUniformsAndSamples(this._vertexCompilationState, this, defines);
            });

            let mergedUniforms = this._vertexCompilationState.uniforms;

            this._fragmentCompilationState.uniforms.forEach((u) => {
                let index = mergedUniforms.indexOf(u);

                if (index === -1) {
                    mergedUniforms.push(u);
                }
            });

            // Uniform buffers
            let mergedUniformBuffers = this._vertexCompilationState.uniformBuffers;

            this._fragmentCompilationState.uniformBuffers.forEach((u) => {
                let index = mergedUniformBuffers.indexOf(u);

                if (index === -1) {
                    mergedUniformBuffers.push(u);
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

            this._sharedData.blocksWithFallbacks.forEach((b) => {
                b.provideFallbacks(mesh, fallbacks);
            });

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
                uniformBuffersNames: mergedUniformBuffers,
                samplers: mergedSamplers,
                defines: join,
                fallbacks: fallbacks,
                onCompiled: this.onCompiled,
                onError: this.onError,
                indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS }
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
        for (var inputBlock of this._sharedData.inputBlocks) {
            inputBlock._transmitWorld(this._activeEffect, world, this._cachedWorldViewMatrix, this._cachedWorldViewProjectionMatrix);
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
                // Bindable blocks
                for (var block of sharedData.bindableBlocks) {
                    block.bind(effect, this, mesh);
                }

                // Connection points
                for (var inputBlock of sharedData.inputBlocks) {
                    inputBlock._transmit(effect, scene);
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

        activeTextures.push(...this._textures);

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

        for (var t of this._textures) {
            if (t === texture) {
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
            for (var texture of this._textures) {
                texture.dispose();
            }
        }

        this._textures = [];
        this.onBuildObservable.clear();

        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
    }

    /** Creates the node editor window. */
    private _createNodeEditor() {
        this.BJSNODEMATERIALEDITOR = this.BJSNODEMATERIALEDITOR || this._getGlobalNodeMaterialEditor();

        this.BJSNODEMATERIALEDITOR.NodeEditor.Show({
            nodeMaterial: this
        });
    }

    /**
     * Launch the node material editor
     * @param config Define the configuration of the editor
     * @return a promise fulfilled when the node editor is visible
     */
    public edit(config?: INodeMaterialEditorOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof this.BJSNODEMATERIALEDITOR == 'undefined') {
                const editorUrl = config && config.editorURL ? config.editorURL : NodeMaterial.EditorURL;

                // Load editor and add it to the DOM
                Tools.LoadScript(editorUrl, () => {
                    this._createNodeEditor();
                    resolve();
                });
            } else {
                // Otherwise creates the editor
                this._createNodeEditor();
                resolve();
            }
        });
    }

    /**
     * Clear the current material
     */
    public clear() {
        this._vertexOutputNodes = [];
        this._fragmentOutputNodes = [];
    }

    /**
     * Clear the current material and set it to a default state
     */
    public setToDefault() {
        this.clear();

        var positionInput = new InputBlock("position");
        positionInput.setAsAttribute("position");

        var worldInput = new InputBlock("world");
        worldInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.World);

        var worldPos = new Vector4TransformBlock("worldPos");
        positionInput.connectTo(worldPos);
        worldInput.connectTo(worldPos);

        var viewProjectionInput = new InputBlock("viewProjection");
        viewProjectionInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.ViewProjection);

        var worldPosdMultipliedByViewProjection = new Vector4TransformBlock("worldPos * viewProjectionTransform");
        worldPos.connectTo(worldPosdMultipliedByViewProjection);
        viewProjectionInput.connectTo(worldPosdMultipliedByViewProjection);

        var vertexOutput = new VertexOutputBlock("vertexOutput");
        worldPosdMultipliedByViewProjection.connectTo(vertexOutput);

        // Pixel
        var pixelColor = new InputBlock("color");
        pixelColor.value = new Color4(0.8, 0.8, 0.8, 1);

        var pixelOutput = new FragmentOutputBlock("pixelOutput");
        pixelColor.connectTo(pixelOutput);

        // Add to nodes
        this.addOutputNode(vertexOutput);
        this.addOutputNode(pixelOutput);
    }
}