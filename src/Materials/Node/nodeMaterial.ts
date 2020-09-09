import { NodeMaterialBlock } from './nodeMaterialBlock';
import { PushMaterial } from '../pushMaterial';
import { Scene } from '../../scene';
import { AbstractMesh } from '../../Meshes/abstractMesh';
import { Matrix, Vector2 } from '../../Maths/math.vector';
import { Color3, Color4 } from '../../Maths/math.color';
import { Mesh } from '../../Meshes/mesh';
import { Engine } from '../../Engines/engine';
import { NodeMaterialBuildState } from './nodeMaterialBuildState';
import { IEffectCreationOptions } from '../effect';
import { BaseTexture } from '../../Materials/Textures/baseTexture';
import { Observable, Observer } from '../../Misc/observable';
import { NodeMaterialBlockTargets } from './Enums/nodeMaterialBlockTargets';
import { NodeMaterialBuildStateSharedData } from './nodeMaterialBuildStateSharedData';
import { SubMesh } from '../../Meshes/subMesh';
import { MaterialDefines } from '../../Materials/materialDefines';
import { NodeMaterialOptimizer } from './Optimizers/nodeMaterialOptimizer';
import { ImageProcessingConfiguration, IImageProcessingConfigurationDefines } from '../imageProcessingConfiguration';
import { Nullable } from '../../types';
import { VertexBuffer } from '../../Meshes/buffer';
import { Tools } from '../../Misc/tools';
import { TransformBlock } from './Blocks/transformBlock';
import { VertexOutputBlock } from './Blocks/Vertex/vertexOutputBlock';
import { FragmentOutputBlock } from './Blocks/Fragment/fragmentOutputBlock';
import { InputBlock } from './Blocks/Input/inputBlock';
import { _TypeStore } from '../../Misc/typeStore';
import { serialize, SerializationHelper } from '../../Misc/decorators';
import { TextureBlock } from './Blocks/Dual/textureBlock';
import { ReflectionTextureBaseBlock } from './Blocks/Dual/reflectionTextureBaseBlock';
import { RefractionBlock } from './Blocks/PBR/refractionBlock';
import { CurrentScreenBlock } from './Blocks/Dual/currentScreenBlock';
import { ParticleTextureBlock } from './Blocks/Particle/particleTextureBlock';
import { ParticleRampGradientBlock } from './Blocks/Particle/particleRampGradientBlock';
import { ParticleBlendMultiplyBlock } from './Blocks/Particle/particleBlendMultiplyBlock';
import { EffectFallbacks } from '../effectFallbacks';
import { WebRequest } from '../../Misc/webRequest';
import { Effect } from '../effect';
import { PostProcess, PostProcessOptions } from '../../PostProcesses/postProcess';
import { Constants } from '../../Engines/constants';
import { Camera } from '../../Cameras/camera';
import { VectorMergerBlock } from './Blocks/vectorMergerBlock';
import { RemapBlock } from './Blocks/remapBlock';
import { MultiplyBlock } from './Blocks/multiplyBlock';
import { NodeMaterialModes } from './Enums/nodeMaterialModes';
import { Texture } from '../Textures/texture';
import { IParticleSystem } from '../../Particles/IParticleSystem';
import { BaseParticleSystem } from '../../Particles/baseParticleSystem';
import { ColorSplitterBlock } from './Blocks/colorSplitterBlock';
import { TimingTools } from '../../Misc/timingTools';
import { ProceduralTexture } from '../Textures/Procedurals/proceduralTexture';
import { AnimatedInputBlockTypes } from './Blocks/Input/animatedInputBlockTypes';
import { TrigonometryBlock, TrigonometryBlockOperations } from './Blocks/trigonometryBlock';

const onCreatedEffectParameters = { effect: null as unknown as Effect, subMesh: null as unknown as Nullable<SubMesh> };

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
    public NORMAL = false;
    public TANGENT = false;
    public UV1 = false;

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

    /** MISC. */
    public BUMPDIRECTUV = 0;

    constructor() {
        super();
        this.rebuild();
    }

    public setValue(name: string, value: any, markAsUnprocessedIfDirty = false) {
        if (this[name] === undefined) {
            this._keys.push(name);
        }

        if (markAsUnprocessedIfDirty && this[name] !== value) {
            this.markAsUnprocessed();
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
    private static _BuildIdGenerator: number = 0;
    private _options: INodeMaterialOptions;
    private _vertexCompilationState: NodeMaterialBuildState;
    private _fragmentCompilationState: NodeMaterialBuildState;
    private _sharedData: NodeMaterialBuildStateSharedData;
    private _buildId: number = NodeMaterial._BuildIdGenerator++;
    private _buildWasSuccessful = false;
    private _cachedWorldViewMatrix = new Matrix();
    private _cachedWorldViewProjectionMatrix = new Matrix();
    private _optimizers = new Array<NodeMaterialOptimizer>();
    private _animationFrame = -1;

    /** Define the Url to load node editor script */
    public static EditorURL = `https://unpkg.com/babylonjs-node-editor@${Engine.Version}/babylon.nodeEditor.js`;

    /** Define the Url to load snippets */
    public static SnippetUrl = "https://snippet.babylonjs.com";

    /** Gets or sets a boolean indicating that node materials should not deserialize textures from json / snippet content */
    public static IgnoreTexturesAtLoadTime = false;

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
     * Snippet ID if the material was created from the snippet server
     */
    public snippetId: string;

    /**
     * Gets or sets data used by visual editor
     * @see https://nme.babylonjs.com
     */
    public editorData: any = null;

    /**
     * Gets or sets a boolean indicating that alpha value must be ignored (This will turn alpha blending off even if an alpha value is produced by the material)
     */
    public ignoreAlpha = false;

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
     * Gets an array of blocks that needs to be serialized even if they are not yet connected
     */
    public attachedBlocks = new Array<NodeMaterialBlock>();

    /**
     * Specifies the mode of the node material
     * @hidden
     */
    @serialize("mode")
    public _mode: NodeMaterialModes = NodeMaterialModes.Material;

    /**
     * Gets the mode property
     */
    public get mode(): NodeMaterialModes {
        return this._mode;
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
     * Get a block by its name
     * @param name defines the name of the block to retrieve
     * @returns the required block or null if not found
     */
    public getBlockByName(name: string) {
        let result = null;
        for (var block of this.attachedBlocks) {
            if (block.name === name) {
                if (!result) {
                    result = block;
                } else {
                    Tools.Warn("More than one block was found with the name `" + name + "`");
                    return result;
                }
            }
        }

        return result;
    }

    /**
     * Get a block by its name
     * @param predicate defines the predicate used to find the good candidate
     * @returns the required block or null if not found
     */
    public getBlockByPredicate(predicate: (block: NodeMaterialBlock) => boolean) {
        for (var block of this.attachedBlocks) {
            if (predicate(block)) {
                return block;
            }
        }

        return null;
    }

    /**
     * Get an input block by its name
     * @param predicate defines the predicate used to find the good candidate
     * @returns the required input block or null if not found
     */
    public getInputBlockByPredicate(predicate: (block: InputBlock) => boolean): Nullable<InputBlock> {
        for (var block of this.attachedBlocks) {
            if (block.isInput && predicate(block as InputBlock)) {
                return block as InputBlock;
            }
        }

        return null;
    }

    /**
     * Gets the list of input blocks attached to this material
     * @returns an array of InputBlocks
     */
    public getInputBlocks() {
        let blocks: InputBlock[] = [];
        for (var block of this.attachedBlocks) {
            if (block.isInput) {
                blocks.push(block as InputBlock);
            }
        }

        return blocks;
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
        if (this.ignoreAlpha) {
            return false;
        }
        return (this.alpha < 1.0) || (this._sharedData && this._sharedData.hints.needAlphaBlending);
    }

    /**
     * Specifies if this material should be rendered in alpha test mode
     * @returns a boolean specifying if an alpha test is needed.
     */
    public needAlphaTesting(): boolean {
        return this._sharedData && this._sharedData.hints.needAlphaTesting;
    }

    private _initializeBlock(node: NodeMaterialBlock, state: NodeMaterialBuildState, nodesToProcessForOtherBuildState: NodeMaterialBlock[]) {
        node.initialize(state);
        node.autoConfigure(this);
        node._preparationId = this._buildId;

        if (this.attachedBlocks.indexOf(node) === -1) {
            if (node.isUnique) {
                const className = node.getClassName();

                for (var other of this.attachedBlocks) {
                    if (other.getClassName() === className) {
                        throw `Cannot have multiple blocks of type ${className} in the same NodeMaterial`;
                    }
                }
            }
            this.attachedBlocks.push(node);
        }

        for (var input of node.inputs) {
            input.associatedVariableName = "";

            let connectedPoint = input.connectedPoint;
            if (connectedPoint) {
                let block = connectedPoint.ownerBlock;
                if (block !== node) {
                    if (block.target === NodeMaterialBlockTargets.VertexAndFragment) {
                        nodesToProcessForOtherBuildState.push(block);
                    } else if (state.target ===  NodeMaterialBlockTargets.Fragment
                        && block.target === NodeMaterialBlockTargets.Vertex
                        && block._preparationId !== this._buildId) {
                            nodesToProcessForOtherBuildState.push(block);
                        }
                    this._initializeBlock(block, state, nodesToProcessForOtherBuildState);
                }
            }
        }

        for (var output of node.outputs) {
            output.associatedVariableName = "";
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
     * Remove a block from the current node material
     * @param block defines the block to remove
     */
    public removeBlock(block: NodeMaterialBlock) {
        let attachedBlockIndex = this.attachedBlocks.indexOf(block);
        if (attachedBlockIndex > -1) {
            this.attachedBlocks.splice(attachedBlockIndex, 1);
        }

        if (block.isFinalMerger) {
            this.removeOutputNode(block);
        }
    }

    /**
     * Build the material and generates the inner effect
     * @param verbose defines if the build should log activity
     */
    public build(verbose: boolean = false) {
        this._buildWasSuccessful = false;
        var engine = this.getScene().getEngine();

        const allowEmptyVertexProgram = this._mode === NodeMaterialModes.Particle;

        if (this._vertexOutputNodes.length === 0 && !allowEmptyVertexProgram) {
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
        this._sharedData.scene = this.getScene();
        this._sharedData.allowEmptyVertexProgram = allowEmptyVertexProgram;

        // Initialize blocks
        let vertexNodes: NodeMaterialBlock[] = [];
        let fragmentNodes: NodeMaterialBlock[] = [];

        for (var vertexOutputNode of this._vertexOutputNodes) {
            vertexNodes.push(vertexOutputNode);
            this._initializeBlock(vertexOutputNode, this._vertexCompilationState, fragmentNodes);
        }

        for (var fragmentOutputNode of this._fragmentOutputNodes) {
            fragmentNodes.push(fragmentOutputNode);
            this._initializeBlock(fragmentOutputNode, this._fragmentCompilationState, vertexNodes);
        }

        // Optimize
        this.optimize();

        // Vertex
        for (var vertexOutputNode of vertexNodes) {
            vertexOutputNode.build(this._vertexCompilationState, vertexNodes);
        }

        // Fragment
        this._fragmentCompilationState.uniforms = this._vertexCompilationState.uniforms.slice(0);
        this._fragmentCompilationState._uniformDeclaration = this._vertexCompilationState._uniformDeclaration;
        this._fragmentCompilationState._constantDeclaration = this._vertexCompilationState._constantDeclaration;
        this._fragmentCompilationState._vertexState = this._vertexCompilationState;

        for (var fragmentOutputNode of fragmentNodes) {
            this._resetDualBlocks(fragmentOutputNode, this._buildId - 1);
        }

        for (var fragmentOutputNode of fragmentNodes) {
            fragmentOutputNode.build(this._fragmentCompilationState, fragmentNodes);
        }

        // Finalize
        this._vertexCompilationState.finalize(this._vertexCompilationState);
        this._fragmentCompilationState.finalize(this._fragmentCompilationState);

        this._buildId = NodeMaterial._BuildIdGenerator++;

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

        // Wipe defines
        const meshes = this.getScene().meshes;
        for (var mesh of meshes) {
            if (!mesh.subMeshes) {
                continue;
            }
            for (var subMesh of mesh.subMeshes) {
                if (subMesh.getMaterial() !== this) {
                    continue;
                }

                if (!subMesh._materialDefines) {
                    continue;
                }

                let defines = subMesh._materialDefines;
                defines.markAllAsDirty();
                defines.reset();
            }
        }
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
        let oldNormal = defines["NORMAL"];
        let oldTangent = defines["TANGENT"];
        let oldUV1 = defines["UV1"];

        defines["NORMAL"] = mesh.isVerticesDataPresent(VertexBuffer.NormalKind);

        defines["TANGENT"] = mesh.isVerticesDataPresent(VertexBuffer.TangentKind);

        defines["UV1"] = mesh.isVerticesDataPresent(VertexBuffer.UVKind);

        if (oldNormal !== defines["NORMAL"] || oldTangent !== defines["TANGENT"] || oldUV1 !== defines["UV1"]) {
            defines.markAsAttributesDirty();
        }
    }

    /**
     * Create a post process from the material
     * @param camera The camera to apply the render pass to.
     * @param options The required width/height ratio to downsize to before computing the render pass. (Use 1.0 for full size)
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param textureFormat Format of textures used when performing the post process. (default: TEXTUREFORMAT_RGBA)
     * @returns the post process created
     */
    public createPostProcess(
        camera: Nullable<Camera>, options: number | PostProcessOptions = 1, samplingMode: number = Constants.TEXTURE_NEAREST_SAMPLINGMODE, engine?: Engine, reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, textureFormat = Constants.TEXTUREFORMAT_RGBA): PostProcess {
            return this._createEffectForPostProcess(null, camera, options, samplingMode, engine, reusable, textureType, textureFormat);
    }

    /**
     * Create the post process effect from the material
     * @param postProcess The post process to create the effect for
     */
    public createEffectForPostProcess(postProcess: PostProcess) {
        this._createEffectForPostProcess(postProcess);
    }

    private _createEffectForPostProcess(postProcess: Nullable<PostProcess>,
        camera?: Nullable<Camera>, options: number | PostProcessOptions = 1, samplingMode: number = Constants.TEXTURE_NEAREST_SAMPLINGMODE, engine?: Engine, reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, textureFormat = Constants.TEXTUREFORMAT_RGBA): PostProcess {
        let tempName = this.name + this._buildId;

        const defines = new NodeMaterialDefines();

        const dummyMesh = new AbstractMesh(tempName + "PostProcess", this.getScene());

        let buildId = this._buildId;

        this._processDefines(dummyMesh, defines);

        Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString);

        if (!postProcess) {
            postProcess = new PostProcess(
                this.name + "PostProcess", tempName, this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers,
                options, camera!, samplingMode, engine, reusable, defines.toString(), textureType, tempName, { maxSimultaneousLights: this.maxSimultaneousLights }, false, textureFormat
            );
        } else {
            postProcess.updateEffect(defines.toString(), this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, { maxSimultaneousLights: this.maxSimultaneousLights }, undefined, undefined, tempName, tempName);
        }

        postProcess.nodeMaterialSource = this;

        postProcess.onApplyObservable.add((effect) => {
            if (buildId !== this._buildId) {
                delete Effect.ShadersStore[tempName + "VertexShader"];
                delete Effect.ShadersStore[tempName + "PixelShader"];

                tempName = this.name + this._buildId;

                defines.markAsUnprocessed();

                buildId = this._buildId;
            }

            const result = this._processDefines(dummyMesh, defines);

            if (result) {
                Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString);

                TimingTools.SetImmediate(() =>
                    postProcess!.updateEffect(defines.toString(), this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, { maxSimultaneousLights: this.maxSimultaneousLights }, undefined, undefined, tempName, tempName)
                );
            }

            this._checkInternals(effect);
        });

        return postProcess;
    }

    /**
     * Create a new procedural texture based on this node material
     * @param size defines the size of the texture (which will be squared)
     * @param scene defines the hosting scene
     * @returns the new procedural texture attached to this node material
     */
    public createProceduralTexture(size: number, scene: Scene): ProceduralTexture {
        let tempName = this.name + this._buildId;

        let proceduralTexture = new ProceduralTexture(tempName, size, null, scene);

        const dummyMesh = new AbstractMesh(tempName + "Procedural", this.getScene());
        dummyMesh.reservedDataStore = {
            hidden: true
        };

        const defines = new NodeMaterialDefines();
        let result = this._processDefines(dummyMesh, defines);
        Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString);

        let effect = this.getScene().getEngine().createEffect({
                vertexElement: tempName,
                fragmentElement: tempName
            },
            [VertexBuffer.PositionKind],
            this._fragmentCompilationState.uniforms,
            this._fragmentCompilationState.samplers,
            defines.toString(), result?.fallbacks, undefined);

        proceduralTexture.nodeMaterialSource = this;
        proceduralTexture._effect = effect;

        let buildId = this._buildId;
        proceduralTexture.onBeforeGenerationObservable.add(() => {
            if (buildId !== this._buildId) {
                delete Effect.ShadersStore[tempName + "VertexShader"];
                delete Effect.ShadersStore[tempName + "PixelShader"];

                tempName = this.name + this._buildId;

                defines.markAsUnprocessed();

                buildId = this._buildId;
            }

            const result = this._processDefines(dummyMesh, defines);

            if (result) {
                Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString);

                TimingTools.SetImmediate(() => {
                    effect = this.getScene().getEngine().createEffect({
                        vertexElement: tempName,
                        fragmentElement: tempName
                    },
                    [VertexBuffer.PositionKind],
                    this._fragmentCompilationState.uniforms,
                    this._fragmentCompilationState.samplers,
                    defines.toString(), result?.fallbacks, undefined);
                });
            }

            this._checkInternals(effect);
        });

        return proceduralTexture;
    }

    private _createEffectForParticles(particleSystem: IParticleSystem, blendMode: number, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, effect?: Effect, defines?: NodeMaterialDefines, dummyMesh?: Nullable<AbstractMesh>, particleSystemDefinesJoined_ = "") {
        let tempName = this.name + this._buildId + "_" + blendMode;

        if (!defines) {
            defines = new NodeMaterialDefines();
        }

        if (!dummyMesh) {
            dummyMesh = this.getScene().getMeshByName(this.name + "Particle");
            if (!dummyMesh) {
                dummyMesh = new AbstractMesh(this.name + "Particle", this.getScene());
                dummyMesh.reservedDataStore = {
                    hidden: true
                };
            }
        }

        let buildId = this._buildId;

        let particleSystemDefines: Array<string> = [];
        let particleSystemDefinesJoined = particleSystemDefinesJoined_;

        if (!effect) {
            const result = this._processDefines(dummyMesh, defines);

            Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString);

            particleSystem.fillDefines(particleSystemDefines, blendMode);

            particleSystemDefinesJoined = particleSystemDefines.join("\n");

            effect = this.getScene().getEngine().createEffectForParticles(tempName, this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, defines.toString() + "\n" + particleSystemDefinesJoined, result?.fallbacks, onCompiled, onError, particleSystem);

            particleSystem.setCustomEffect(effect, blendMode);
        }

        effect.onBindObservable.add((effect) => {
            if (buildId !== this._buildId) {
                delete Effect.ShadersStore[tempName + "PixelShader"];

                tempName = this.name + this._buildId + "_" + blendMode;

                defines!.markAsUnprocessed();

                buildId = this._buildId;
            }

            particleSystemDefines.length = 0;

            particleSystem.fillDefines(particleSystemDefines, blendMode);

            const particleSystemDefinesJoinedCurrent = particleSystemDefines.join("\n");

            if (particleSystemDefinesJoinedCurrent !== particleSystemDefinesJoined) {
                defines!.markAsUnprocessed();
                particleSystemDefinesJoined = particleSystemDefinesJoinedCurrent;
            }

            const result = this._processDefines(dummyMesh!, defines!);

            if (result) {
                Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString);

                effect = this.getScene().getEngine().createEffectForParticles(tempName, this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, defines!.toString() + "\n" + particleSystemDefinesJoined, result?.fallbacks, onCompiled, onError, particleSystem);
                particleSystem.setCustomEffect(effect, blendMode);
                this._createEffectForParticles(particleSystem, blendMode, onCompiled, onError, effect, defines, dummyMesh, particleSystemDefinesJoined); // add the effect.onBindObservable observer
                return;
            }

            this._checkInternals(effect);
        });
    }

    private _checkInternals(effect: Effect) {
         // Animated blocks
         if (this._sharedData.animatedInputs) {
            const scene = this.getScene();

            let frameId = scene.getFrameId();

            if (this._animationFrame !== frameId) {
                for (var input of this._sharedData.animatedInputs) {
                    input.animate(scene);
                }

                this._animationFrame = frameId;
            }
        }

        // Bindable blocks
        for (var block of this._sharedData.bindableBlocks) {
            block.bind(effect, this);
        }

        // Connection points
        for (var inputBlock of this._sharedData.inputBlocks) {
            inputBlock._transmit(effect, this.getScene());
        }
    }

    /**
     * Create the effect to be used as the custom effect for a particle system
     * @param particleSystem Particle system to create the effect for
     * @param onCompiled defines a function to call when the effect creation is successful
     * @param onError defines a function to call when the effect creation has failed
     */
    public createEffectForParticles(particleSystem: IParticleSystem, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void) {
        this._createEffectForParticles(particleSystem, BaseParticleSystem.BLENDMODE_ONEONE, onCompiled, onError);
        this._createEffectForParticles(particleSystem, BaseParticleSystem.BLENDMODE_MULTIPLY, onCompiled, onError);
    }

    private _processDefines(mesh: AbstractMesh, defines: NodeMaterialDefines, useInstances = false, subMesh?: SubMesh): Nullable<{
        lightDisposed: boolean,
        uniformBuffers: string[],
        mergedUniforms: string[],
        mergedSamplers: string[],
        fallbacks: EffectFallbacks,
     }> {
         let result = null;

        // Shared defines
        this._sharedData.blocksWithDefines.forEach((b) => {
            b.initializeDefines(mesh, this, defines, useInstances);
        });

        this._sharedData.blocksWithDefines.forEach((b) => {
            b.prepareDefines(mesh, this, defines, useInstances, subMesh);
        });

        // Need to recompile?
        if (defines.isDirty) {
            const lightDisposed = defines._areLightsDisposed;
            defines.markAsProcessed();

            // Repeatable content generators
            this._vertexCompilationState.compilationString = this._vertexCompilationState._builtCompilationString;
            this._fragmentCompilationState.compilationString = this._fragmentCompilationState._builtCompilationString;

            this._sharedData.repeatableContentBlocks.forEach((b) => {
                b.replaceRepeatableContent(this._vertexCompilationState, this._fragmentCompilationState, mesh, defines);
            });

            // Uniforms
            let uniformBuffers: string[] = [];
            this._sharedData.dynamicUniformBlocks.forEach((b) => {
                b.updateUniformsAndSamples(this._vertexCompilationState, this, defines, uniformBuffers);
            });

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

            this._sharedData.blocksWithFallbacks.forEach((b) => {
                b.provideFallbacks(mesh, fallbacks);
            });

            result = {
                lightDisposed,
                uniformBuffers,
                mergedUniforms,
                mergedSamplers,
                fallbacks,
            };
        }

        return result;
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

        var scene = this.getScene();
        if (this._sharedData.animatedInputs) {
            let frameId = scene.getFrameId();

            if (this._animationFrame !== frameId) {
                for (var input of this._sharedData.animatedInputs) {
                    input.animate(scene);
                }

                this._animationFrame = frameId;
            }
        }

        if (subMesh.effect && this.isFrozen) {
            if (subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh._materialDefines) {
            subMesh._materialDefines = new NodeMaterialDefines();
        }

        var defines = <NodeMaterialDefines>subMesh._materialDefines;
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        var engine = scene.getEngine();

        this._prepareDefinesForAttributes(mesh, defines);

        // Check if blocks are ready
        if (this._sharedData.blockingBlocks.some((b) => !b.isReady(mesh, this, defines, useInstances))) {
            return false;
        }

        const result = this._processDefines(mesh, defines, useInstances, subMesh);

        if (result) {
            let previousEffect = subMesh.effect;
            // Compilation
            var join = defines.toString();
            var effect = engine.createEffect({
                vertex: "nodeMaterial" + this._buildId,
                fragment: "nodeMaterial" + this._buildId,
                vertexSource: this._vertexCompilationState.compilationString,
                fragmentSource: this._fragmentCompilationState.compilationString
            }, <IEffectCreationOptions>{
                attributes: this._vertexCompilationState.attributes,
                uniformsNames: result.mergedUniforms,
                uniformBuffersNames: result.uniformBuffers,
                samplers: result.mergedSamplers,
                defines: join,
                fallbacks: result.fallbacks,
                onCompiled: this.onCompiled,
                onError: this.onError,
                indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS }
            }, engine);

            if (effect) {
                if (this._onEffectCreatedObservable) {
                    onCreatedEffectParameters.effect = effect;
                    onCreatedEffectParameters.subMesh = subMesh;
                    this._onEffectCreatedObservable.notifyObservers(onCreatedEffectParameters);
                }

                // Use previous effect while new one is compiling
                if (this.allowShaderHotSwapping && previousEffect && !effect.isReady()) {
                    effect = previousEffect;
                    defines.markAsUnprocessed();

                    if (result.lightDisposed) {
                        // re register in case it takes more than one frame.
                        defines._areLightsDisposed = true;
                        return false;
                    }

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
        subMesh.effect._wasPreviouslyReady = true;

        return true;
    }

    /**
     * Get a string representing the shaders built by the current node graph
     */
    public get compiledShaders() {
        return `// Vertex shader\r\n${this._vertexCompilationState.compilationString}\r\n\r\n// Fragment shader\r\n${this._fragmentCompilationState.compilationString}`;
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
            if (effect && scene.getCachedEffect() !== effect) {
                // Bindable blocks
                for (var block of sharedData.bindableBlocks) {
                    block.bind(effect, this, mesh, subMesh);
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

        if (this._sharedData) {
            activeTextures.push(...this._sharedData.textureBlocks.filter((tb) => tb.texture).map((tb) => tb.texture!));
        }

        return activeTextures;
    }

    /**
     * Gets the list of texture blocks
     * @returns an array of texture blocks
     */
    public getTextureBlocks(): (TextureBlock | ReflectionTextureBaseBlock | RefractionBlock | CurrentScreenBlock | ParticleTextureBlock)[] {
        if (!this._sharedData) {
            return [];
        }

        return this._sharedData.textureBlocks;
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

        if (!this._sharedData) {
            return false;
        }

        for (var t of this._sharedData.textureBlocks) {
            if (t.texture === texture) {
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
            for (var texture of this._sharedData.textureBlocks.filter((tb) => tb.texture).map((tb) => tb.texture!)) {
                texture.dispose();
            }
        }

        for (var block of this.attachedBlocks) {
            block.dispose();
        }

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
        this.attachedBlocks = [];
    }

    /**
     * Clear the current material and set it to a default state
     */
    public setToDefault() {
        this.clear();

        this.editorData = null;

        var positionInput = new InputBlock("Position");
        positionInput.setAsAttribute("position");

        var worldInput = new InputBlock("World");
        worldInput.setAsSystemValue(BABYLON.NodeMaterialSystemValues.World);

        var worldPos = new TransformBlock("WorldPos");
        positionInput.connectTo(worldPos);
        worldInput.connectTo(worldPos);

        var viewProjectionInput = new InputBlock("ViewProjection");
        viewProjectionInput.setAsSystemValue(BABYLON.NodeMaterialSystemValues.ViewProjection);

        var worldPosdMultipliedByViewProjection = new TransformBlock("WorldPos * ViewProjectionTransform");
        worldPos.connectTo(worldPosdMultipliedByViewProjection);
        viewProjectionInput.connectTo(worldPosdMultipliedByViewProjection);

        var vertexOutput = new VertexOutputBlock("VertexOutput");
        worldPosdMultipliedByViewProjection.connectTo(vertexOutput);

        // Pixel
        var pixelColor = new InputBlock("color");
        pixelColor.value = new Color4(0.8, 0.8, 0.8, 1);

        var fragmentOutput = new FragmentOutputBlock("FragmentOutput");
        pixelColor.connectTo(fragmentOutput);

        // Add to nodes
        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragmentOutput);

        this._mode = NodeMaterialModes.Material;
    }

    /**
     * Clear the current material and set it to a default state for procedural texture
     */
    public setToDefaultPostProcess() {
        this.clear();

        this.editorData = null;

        const position = new InputBlock("Position");
        position.setAsAttribute("position2d");

        const const1 = new InputBlock("Constant1");
        const1.isConstant = true;
        const1.value = 1;

        const vmerger = new VectorMergerBlock("Position3D");

        position.connectTo(vmerger);
        const1.connectTo(vmerger, { input: "w" });

        const vertexOutput = new VertexOutputBlock("VertexOutput");
        vmerger.connectTo(vertexOutput);

        // Pixel
        const scale = new InputBlock("scale");
        scale.visibleInInspector = true;
        scale.value = new Vector2(1, 1);

        const uv0 = new RemapBlock("uv0");
        position.connectTo(uv0);

        const uv = new MultiplyBlock("uv");
        uv0.connectTo(uv);
        scale.connectTo(uv);

        const currentScreen = new CurrentScreenBlock("CurrentScreen");
        uv.connectTo(currentScreen);

        currentScreen.texture = new Texture("https://assets.babylonjs.com/nme/currentScreenPostProcess.png", this.getScene());

        var fragmentOutput = new FragmentOutputBlock("FragmentOutput");
        currentScreen.connectTo(fragmentOutput, { output: "rgba" });

        // Add to nodes
        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragmentOutput);

        this._mode = NodeMaterialModes.PostProcess;
    }

    /**
     * Clear the current material and set it to a default state for post process
     */
    public setToDefaultProceduralTexture() {
        this.clear();

        this.editorData = null;

        const position = new InputBlock("Position");
        position.setAsAttribute("position2d");

        const const1 = new InputBlock("Constant1");
        const1.isConstant = true;
        const1.value = 1;

        const vmerger = new VectorMergerBlock("Position3D");

        position.connectTo(vmerger);
        const1.connectTo(vmerger, { input: "w" });

        const vertexOutput = new VertexOutputBlock("VertexOutput");
        vmerger.connectTo(vertexOutput);

        // Pixel
        var time = new InputBlock("Time");
        time.value = 0;
        time.min = 0;
        time.max = 0;
        time.isBoolean = false;
        time.matrixMode = 0;
        time.animationType = AnimatedInputBlockTypes.Time;
        time.isConstant = false;

        const color = new InputBlock("Color3");
        color.value = new Color3(1, 1, 1);
        color.isConstant = false;
        var fragmentOutput = new FragmentOutputBlock("FragmentOutput");

        var vectorMerger = new VectorMergerBlock("VectorMerger");
        vectorMerger.visibleInInspector = false;

        var cos = new TrigonometryBlock("Cos");
        cos.operation = TrigonometryBlockOperations.Cos;

        position.connectTo(vectorMerger);
        time.output.connectTo(cos.input);
        cos.output.connectTo(vectorMerger.z);
        vectorMerger.xyzOut.connectTo(fragmentOutput.rgb);

        // Add to nodes
        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragmentOutput);

        this._mode = NodeMaterialModes.ProceduralTexture;
    }

    /**
     * Clear the current material and set it to a default state for particle
     */
    public setToDefaultParticle() {
        this.clear();

        this.editorData = null;

        // Pixel
        const uv = new InputBlock("uv");
        uv.setAsAttribute("particle_uv");

        const texture = new ParticleTextureBlock("ParticleTexture");
        uv.connectTo(texture);

        const color = new InputBlock("Color");
        color.setAsAttribute("particle_color");

        const multiply = new MultiplyBlock("Texture * Color");
        texture.connectTo(multiply);
        color.connectTo(multiply);

        const rampGradient = new ParticleRampGradientBlock("ParticleRampGradient");
        multiply.connectTo(rampGradient);

        const cSplitter = new ColorSplitterBlock("ColorSplitter");
        color.connectTo(cSplitter);

        const blendMultiply = new ParticleBlendMultiplyBlock("ParticleBlendMultiply");
        rampGradient.connectTo(blendMultiply);
        texture.connectTo(blendMultiply, { "output": "a" });
        cSplitter.connectTo(blendMultiply, { "output": "a" });

        const fragmentOutput = new FragmentOutputBlock("FragmentOutput");
        blendMultiply.connectTo(fragmentOutput);

        // Add to nodes
        this.addOutputNode(fragmentOutput);

        this._mode = NodeMaterialModes.Particle;
    }

    /**
     * Loads the current Node Material from a url pointing to a file save by the Node Material Editor
     * @param url defines the url to load from
     * @returns a promise that will fullfil when the material is fully loaded
     */
    public loadAsync(url: string) {
        return this.getScene()._loadFileAsync(url).then((data) => {
            const serializationObject = JSON.parse(data as string);
            this.loadFromSerialization(serializationObject, "");
        });
    }

    private _gatherBlocks(rootNode: NodeMaterialBlock, list: NodeMaterialBlock[]) {
        if (list.indexOf(rootNode) !== -1) {
            return;
        }
        list.push(rootNode);

        for (var input of rootNode.inputs) {
            let connectedPoint = input.connectedPoint;
            if (connectedPoint) {
                let block = connectedPoint.ownerBlock;
                if (block !== rootNode) {
                    this._gatherBlocks(block, list);
                }
            }
        }
    }

    /**
     * Generate a string containing the code declaration required to create an equivalent of this material
     * @returns a string
     */
    public generateCode() {

        let alreadyDumped: NodeMaterialBlock[] = [];
        let vertexBlocks: NodeMaterialBlock[] = [];
        let uniqueNames: string[] = [];
        // Gets active blocks
        for (var outputNode of this._vertexOutputNodes) {
            this._gatherBlocks(outputNode, vertexBlocks);

        }

        let fragmentBlocks: NodeMaterialBlock[] = [];
        for (var outputNode of this._fragmentOutputNodes) {
            this._gatherBlocks(outputNode, fragmentBlocks);
        }

        // Generate vertex shader
        let codeString = `var nodeMaterial = new BABYLON.NodeMaterial("${this.name || "node material"}");\r\n`;
        for (var node of vertexBlocks) {
            if (node.isInput && alreadyDumped.indexOf(node) === -1) {
                codeString += node._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        // Generate fragment shader
        for (var node of fragmentBlocks) {
            if (node.isInput && alreadyDumped.indexOf(node) === -1) {
                codeString += node._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        // Connections
        alreadyDumped = [];
        codeString += "\r\n// Connections\r\n";
        for (var node of this._vertexOutputNodes) {
            codeString += node._dumpCodeForOutputConnections(alreadyDumped);
        }
        for (var node of this._fragmentOutputNodes) {
            codeString += node._dumpCodeForOutputConnections(alreadyDumped);
        }

        // Output nodes
        codeString += "\r\n// Output nodes\r\n";
        for (var node of this._vertexOutputNodes) {
            codeString += `nodeMaterial.addOutputNode(${node._codeVariableName});\r\n`;
        }

        for (var node of this._fragmentOutputNodes) {
            codeString += `nodeMaterial.addOutputNode(${node._codeVariableName});\r\n`;
        }

        codeString += `nodeMaterial.build();\r\n`;

        return codeString;
    }

    /**
     * Serializes this material in a JSON representation
     * @returns the serialized material object
     */
    public serialize(selectedBlocks?: NodeMaterialBlock[]): any {
        var serializationObject = selectedBlocks ? {} : SerializationHelper.Serialize(this);
        serializationObject.editorData = JSON.parse(JSON.stringify(this.editorData)); // Copy

        let blocks: NodeMaterialBlock[] = [];

        if (selectedBlocks) {
            blocks = selectedBlocks;
        } else {
            serializationObject.customType = "BABYLON.NodeMaterial";
            serializationObject.outputNodes = [];

            // Outputs
            for (var outputNode of this._vertexOutputNodes) {
                this._gatherBlocks(outputNode, blocks);
                serializationObject.outputNodes.push(outputNode.uniqueId);
            }

            for (var outputNode of this._fragmentOutputNodes) {
                this._gatherBlocks(outputNode, blocks);

                if (serializationObject.outputNodes.indexOf(outputNode.uniqueId) === -1) {
                    serializationObject.outputNodes.push(outputNode.uniqueId);
                }
            }
        }

        // Blocks
        serializationObject.blocks = [];

        for (var block of blocks) {
            serializationObject.blocks.push(block.serialize());
        }

        if (!selectedBlocks) {
            for (var block of this.attachedBlocks) {
                if (blocks.indexOf(block) !== -1) {
                    continue;
                }
                serializationObject.blocks.push(block.serialize());
            }
        }

        return serializationObject;
    }

    private _restoreConnections(block: NodeMaterialBlock, source: any, map: {[key: number]: NodeMaterialBlock}) {
        for (var outputPoint of block.outputs) {
            for (var candidate of source.blocks) {
                let target = map[candidate.id];

                for (var input of candidate.inputs) {
                    if (map[input.targetBlockId] === block && input.targetConnectionName === outputPoint.name) {
                        let inputPoint = target.getInputByName(input.inputName);
                        if (!inputPoint || inputPoint.isConnected) {
                            continue;
                        }

                        outputPoint.connectTo(inputPoint, true);
                        this._restoreConnections(target, source, map);
                        continue;
                    }
                }
            }
        }
    }

    /**
     * Clear the current graph and load a new one from a serialization object
     * @param source defines the JSON representation of the material
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param merge defines whether or not the source must be merged or replace the current content
     */
    public loadFromSerialization(source: any, rootUrl: string = "", merge = false) {
        if (!merge) {
            this.clear();
        }

        let map: {[key: number]: NodeMaterialBlock} = {};

        // Create blocks
        for (var parsedBlock of source.blocks) {
            let blockType = _TypeStore.GetClass(parsedBlock.customType);
            if (blockType) {
                let block: NodeMaterialBlock = new blockType();
                block._deserialize(parsedBlock, this.getScene(), rootUrl);
                map[parsedBlock.id] = block;

                this.attachedBlocks.push(block);
            }
        }

        // Connections - Starts with input blocks only (except if in "merge" mode where we scan all blocks)
        for (var blockIndex = 0; blockIndex < source.blocks.length; blockIndex++) {
            let parsedBlock = source.blocks[blockIndex];
            let block = map[parsedBlock.id];

            if (block.inputs.length && !merge) {
                continue;
            }
            this._restoreConnections(block, source, map);
        }

        // Outputs
        if (source.outputNodes) {
            for (var outputNodeId of source.outputNodes) {
                this.addOutputNode(map[outputNodeId]);
            }
        }

        // UI related info
        if (source.locations || source.editorData && source.editorData.locations) {
            let locations: {
                blockId: number;
                x: number;
                y: number;
            }[] = source.locations || source.editorData.locations;

            for (var location of locations) {
                if (map[location.blockId]) {
                    location.blockId = map[location.blockId].uniqueId;
                }
            }

            if (merge && this.editorData && this.editorData.locations) {
                locations.concat(this.editorData.locations);
            }

            if (source.locations) {
                this.editorData = {
                    locations: locations
                };
            } else {
                this.editorData = source.editorData;
                this.editorData.locations = locations;
            }

            let blockMap: number[] = [];

            for (var key in map) {
                blockMap[key] = map[key].uniqueId;
            }

            this.editorData.map = blockMap;
        }

        if (!merge) {
            this._mode = source.mode ?? NodeMaterialModes.Material;
        }
    }

    /**
     * Makes a duplicate of the current material.
     * @param name - name to use for the new material.
     */
    public clone(name: string): NodeMaterial {
        const serializationObject = this.serialize();

        const clone = SerializationHelper.Clone(() => new NodeMaterial(name, this.getScene(), this.options), this);
        clone.id = name;
        clone.name = name;

        clone.loadFromSerialization(serializationObject);
        clone.build();

        return clone;
    }

    /**
     * Creates a node material from parsed material data
     * @param source defines the JSON representation of the material
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a new node material
     */
    public static Parse(source: any, scene: Scene, rootUrl: string = ""): NodeMaterial {
        let nodeMaterial = SerializationHelper.Parse(() => new NodeMaterial(source.name, scene), source, scene, rootUrl);

        nodeMaterial.loadFromSerialization(source, rootUrl);
        nodeMaterial.build();

        return nodeMaterial;
    }

    /**
     * Creates a node material from a snippet saved in a remote file
     * @param name defines the name of the material to create
     * @param url defines the url to load from
     * @param scene defines the hosting scene
     * @returns a promise that will resolve to the new node material
     */
    public static ParseFromFileAsync(name: string, url: string, scene: Scene): Promise<NodeMaterial> {
        var material = new NodeMaterial(name, scene);

        return new Promise((resolve, reject) => {
            return material.loadAsync(url).then(() => resolve(material)).catch(reject);
        });
    }

    /**
     * Creates a node material from a snippet saved by the node material editor
     * @param snippetId defines the snippet to load
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param nodeMaterial defines a node material to update (instead of creating a new one)
     * @returns a promise that will resolve to the new node material
     */
    public static ParseFromSnippetAsync(snippetId: string, scene: Scene, rootUrl: string = "", nodeMaterial?: NodeMaterial): Promise<NodeMaterial> {
        return new Promise((resolve, reject) => {
            var request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        var snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        let serializationObject = JSON.parse(snippet.nodeMaterial);

                        if (!nodeMaterial) {
                            nodeMaterial = SerializationHelper.Parse(() => new NodeMaterial(snippetId, scene), serializationObject, scene, rootUrl);
                            nodeMaterial.uniqueId = scene.getUniqueId();
                        }

                        nodeMaterial.loadFromSerialization(serializationObject);
                        nodeMaterial.snippetId = snippetId;

                        try {
                            nodeMaterial.build();
                            resolve(nodeMaterial);
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        reject("Unable to load the snippet " + snippetId);
                    }
                }
            });

            request.open("GET", this.SnippetUrl + "/" + snippetId.replace(/#/g, "/"));
            request.send();
        });
    }

    /**
     * Creates a new node material set to default basic configuration
     * @param name defines the name of the material
     * @param scene defines the hosting scene
     * @returns a new NodeMaterial
     */
    public static CreateDefault(name: string, scene?: Scene) {
        let newMaterial = new NodeMaterial(name, scene);

        newMaterial.setToDefault();
        newMaterial.build();

        return newMaterial;
    }
}

_TypeStore.RegisteredTypes["BABYLON.NodeMaterial"] = NodeMaterial;