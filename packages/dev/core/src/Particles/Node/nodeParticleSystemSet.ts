import { serialize } from "core/Misc/decorators";
import { ParticleSystemSet } from "../particleSystemSet";
import { SystemBlock } from "./Blocks/systemBlock";
import type { Scene } from "core/scene";
import { NodeParticleBuildState } from "./nodeParticleBuildState";
import type { NodeParticleBlock } from "./nodeParticleBlock";
import { SerializationHelper } from "core/Misc/decorators.serialization";
import { Observable } from "core/Misc/observable";
import { GetClass } from "core/Misc/typeStore";
import { WebRequest } from "core/Misc/webRequest";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools";
import { AbstractEngine } from "core/Engines/abstractEngine";
import { ParticleInputBlock } from "./Blocks/particleInputBlock";
import { ParticleTextureSourceBlock } from "./Blocks/particleSourceTextureBlock";
import { NodeParticleContextualSources } from "./Enums/nodeParticleContextualSources";
import { UpdatePositionBlock } from "./Blocks/Update/updatePositionBlock";
import { ParticleMathBlock, ParticleMathBlockOperations } from "./Blocks/particleMathBlock";
import type { ParticleTeleportOutBlock } from "./Blocks/Teleport/particleTeleportOutBlock";
import type { ParticleTeleportInBlock } from "./Blocks/Teleport/particleTeleportInBlock";
import { BoxShapeBlock } from "./Blocks/Emitters/boxShapeBlock";
import { CreateParticleBlock } from "./Blocks/Emitters/createParticleBlock";
import type { Nullable } from "core/types";
import { Color4 } from "core/Maths/math.color";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import {
    SPSParticleConfigBlock,
    SPSInitBlock,
    SPSMeshShapeType,
    SPSMeshSourceBlock,
    SPSSystemBlock,
    SPSCreateBlock,
    SPSUpdateBlock,
    SpsParticlePropsSetBlock,
    SpsParticlePropsGetBlock,
    SPSMeshFileBlock,
    SPSNodeMaterialBlock,
} from "./Blocks";
import { ParticleSystem } from "core/Particles/particleSystem";
import { ParticleRandomBlock, ParticleRandomBlockLocks } from "./Blocks/particleRandomBlock";
import { ParticleConverterBlock } from "./Blocks/particleConverterBlock";
import { ParticleTrigonometryBlock, ParticleTrigonometryBlockOperations } from "./Blocks/particleTrigonometryBlock";
import { NodeParticleSystemSources } from "./Enums/nodeParticleSystemSources";
import { NodeParticleBlockConnectionPointTypes } from "./Enums/nodeParticleBlockConnectionPointTypes";

// declare NODEPARTICLEEDITOR namespace for compilation issue
declare let NODEPARTICLEEDITOR: any;
declare let BABYLON: any;

/**
 * Interface used to configure the node particle editor
 */
export interface INodeParticleEditorOptions {
    /** Define the URL to load node editor script from */
    editorURL?: string;
    /** Additional configuration for the NPE */
    nodeEditorConfig?: {
        backgroundColor?: Color4;
    };
}

/**
 * Defines a set of particle systems defined as a node graph.
 * NPE: #K6F1ZB#1
 * PG: #ZT509U#1
 */
export class NodeParticleSystemSet {
    private _systemBlocks: (SystemBlock | SPSSystemBlock)[] = [];
    private _buildId: number = 0;

    /** Define the Url to load node editor script */
    public static EditorURL = `${Tools._DefaultCdnUrl}/v${AbstractEngine.Version}/nodeParticleEditor/babylon.nodeParticleEditor.js`;

    /** Define the Url to load snippets */
    public static SnippetUrl = Constants.SnippetUrl;

    /**
     * Snippet ID if the material was created from the snippet server
     */
    public snippetId: string;

    /**
     * Gets an array of blocks that needs to be serialized even if they are not yet connected
     */
    public attachedBlocks: NodeParticleBlock[] = [];

    /**
     * Gets or sets data used by visual editor
     * @see https://npe.babylonjs.com
     */
    public editorData: any = null;

    /**
     * Observable raised when the particle set is built
     */
    public onBuildObservable = new Observable<NodeParticleSystemSet>();

    /**
     * The name of the set
     */
    @serialize()
    public name: string;

    /**
     * A free comment about the set
     */
    @serialize("comment")
    public comment: string;

    /**
     * Gets the system blocks
     */
    public get systemBlocks(): (SystemBlock | SPSSystemBlock)[] {
        return this._systemBlocks;
    }

    /**
     * Gets the list of input blocks attached to this material
     * @returns an array of InputBlocks
     */
    public get inputBlocks() {
        const blocks: ParticleInputBlock[] = [];
        for (const block of this.attachedBlocks) {
            if (block.isInput) {
                blocks.push(block as ParticleInputBlock);
            }
        }

        return blocks;
    }

    /**
     * Get a block by its name
     * @param name defines the name of the block to retrieve
     * @returns the required block or null if not found
     */
    public getBlockByName(name: string) {
        let result = null;
        for (const block of this.attachedBlocks) {
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
     * Get a block using a predicate
     * @param predicate defines the predicate used to find the good candidate
     * @returns the required block or null if not found
     */
    public getBlockByPredicate(predicate: (block: NodeParticleBlock) => boolean) {
        for (const block of this.attachedBlocks) {
            if (predicate(block)) {
                return block;
            }
        }

        return null;
    }

    /**
     * Get an input block using a predicate
     * @param predicate defines the predicate used to find the good candidate
     * @returns the required input block or null if not found
     */
    public getInputBlockByPredicate(predicate: (block: ParticleInputBlock) => boolean): Nullable<ParticleInputBlock> {
        for (const block of this.attachedBlocks) {
            if (block.isInput && predicate(block as ParticleInputBlock)) {
                return block as ParticleInputBlock;
            }
        }

        return null;
    }
    /**
     * Creates a new set
     * @param name defines the name of the set
     */
    public constructor(name: string) {
        this.name = name;
    }

    /**
     * Gets the current class name of the node particle set e.g. "NodeParticleSystemSet"
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeParticleSystemSet";
    }

    private _initializeBlock(node: NodeParticleBlock, autoConfigure = true) {
        if (this.attachedBlocks.indexOf(node) === -1) {
            this.attachedBlocks.push(node);
        }

        for (const input of node.inputs) {
            const connectedPoint = input.connectedPoint;
            if (connectedPoint) {
                const block = connectedPoint.ownerBlock;
                if (block !== node) {
                    this._initializeBlock(block, autoConfigure);
                }
            }
        }
    }

    private BJSNODEPARTICLEEDITOR = this._getGlobalNodeParticleEditor();

    /** Get the editor from bundle or global
     * @returns the global NPE
     */
    private _getGlobalNodeParticleEditor(): any {
        // UMD Global name detection from Webpack Bundle UMD Name.
        if (typeof NODEPARTICLEEDITOR !== "undefined") {
            return NODEPARTICLEEDITOR;
        }

        // In case of module let's check the global emitted from the editor entry point.
        if (typeof BABYLON !== "undefined" && typeof BABYLON.NodeParticleEditor !== "undefined") {
            return BABYLON;
        }

        return undefined;
    }

    /** Creates the node editor window.
     * @param additionalConfig Define the configuration of the editor
     */
    private _createNodeParticleEditor(additionalConfig?: any) {
        const nodeEditorConfig: any = {
            nodeParticleSet: this,
            ...additionalConfig,
        };
        this.BJSNODEPARTICLEEDITOR.NodeParticleEditor.Show(nodeEditorConfig);
    }

    /**
     * Launch the node particle editor
     * @param config Define the configuration of the editor
     * @returns a promise fulfilled when the node editor is visible
     */
    public async editAsync(config?: INodeParticleEditorOptions): Promise<void> {
        return await new Promise((resolve) => {
            this.BJSNODEPARTICLEEDITOR = this.BJSNODEPARTICLEEDITOR || this._getGlobalNodeParticleEditor();
            if (typeof this.BJSNODEPARTICLEEDITOR == "undefined") {
                const editorUrl = config && config.editorURL ? config.editorURL : NodeParticleSystemSet.EditorURL;

                // Load editor and add it to the DOM
                Tools.LoadBabylonScript(editorUrl, () => {
                    this.BJSNODEPARTICLEEDITOR = this.BJSNODEPARTICLEEDITOR || this._getGlobalNodeParticleEditor();
                    this._createNodeParticleEditor(config?.nodeEditorConfig);
                    resolve();
                });
            } else {
                // Otherwise creates the editor
                this._createNodeParticleEditor(config?.nodeEditorConfig);
                resolve();
            }
        });
    }

    /**
     * Builds the particle system set from the defined blocks.
     * @param scene defines the hosting scene
     * @param verbose defines whether to log detailed information during the build process (false by default)
     * @returns a promise that resolves to the built particle system set
     */
    public async buildAsync(scene: Scene, verbose = false): Promise<ParticleSystemSet> {
        return await new Promise<ParticleSystemSet>((resolve) => {
            const output = new ParticleSystemSet();

            // Initialize all blocks
            for (const block of this._systemBlocks) {
                this._initializeBlock(block);
            }

            // Build the blocks
            for (const block of this.systemBlocks) {
                const state = new NodeParticleBuildState();
                state.buildId = this._buildId++;
                state.scene = scene;
                state.verbose = verbose;

                const system = block.createSystem(state);
                if (system instanceof ParticleSystem) {
                    system._source = this;
                    system._blockReference = block._internalId;
                }
                output.systems.push(system);
                // Errors
                state.emitErrors();
            }

            this.onBuildObservable.notifyObservers(this);

            resolve(output);
        });
    }

    /**
     * Clear the current node particle set
     */
    public clear() {
        this.attachedBlocks.length = 0;
        this._systemBlocks.length = 0;
    }

    /**
     * Clear the current set and restore it to a default state
     */
    public setToDefault() {
        this.clear();

        this.editorData = null;

        // Main system
        const system = new SystemBlock("Particle system");

        // Update position
        const updatePositionBlock = new UpdatePositionBlock("Update position");
        updatePositionBlock.output.connectTo(system.particle);

        // Contextual inputs
        const positionBlock = new ParticleInputBlock("Position");
        positionBlock.contextualValue = NodeParticleContextualSources.Position;
        const directionBlock = new ParticleInputBlock("Scaled direction");
        directionBlock.contextualValue = NodeParticleContextualSources.ScaledDirection;

        // Add
        const addBlock = new ParticleMathBlock("Add");
        addBlock.operation = ParticleMathBlockOperations.Add;
        positionBlock.output.connectTo(addBlock.left);
        directionBlock.output.connectTo(addBlock.right);
        addBlock.output.connectTo(updatePositionBlock.position);

        // Create particle
        const createParticleBlock = new CreateParticleBlock("Create particle");

        // Shape
        const emitterShape = new BoxShapeBlock("Box shape");
        createParticleBlock.particle.connectTo(emitterShape.particle);
        emitterShape.output.connectTo(updatePositionBlock.particle);

        // Texture
        const textureBlock = new ParticleTextureSourceBlock("Texture");
        textureBlock.texture.connectTo(system.texture);
        textureBlock.url = Tools.GetAssetUrl("https://assets.babylonjs.com/core/textures/flare.png");

        this._systemBlocks.push(system);
    }

    public setToDefaultSps() {
        this.createShockwaveSps();
    }

    public createDefaultSps() {
        this.clear();
        this.editorData = null;

        const spsSystem = new SPSSystemBlock("SPS System");
        spsSystem.billboard = false;

        const spsCreateBlock = new SPSCreateBlock("Create Particles System");
        spsCreateBlock.solidParticle.connectTo(spsSystem.solidParticle);

        const spsCreateTetra = new SPSParticleConfigBlock("Create Tetrahedron Particles");
        spsCreateTetra.count.value = 2000;
        spsCreateTetra.config.connectTo(spsCreateBlock.config);

        const meshSourceTetra = new SPSMeshSourceBlock("Tetrahedron Mesh");
        meshSourceTetra.shapeType = SPSMeshShapeType.Box;
        meshSourceTetra.size = 0.1;
        meshSourceTetra.mesh.connectTo(spsCreateTetra.mesh);

        const spsInitTetra = new SPSInitBlock("Initialize Tetrahedron Particles");
        spsInitTetra.initData.connectTo(spsCreateTetra.initBlock);

        const randomXZMin = new ParticleInputBlock("Random XZ Min");
        randomXZMin.value = new Vector2(-10, -10);
        const randomXZMax = new ParticleInputBlock("Random XZ Max");
        randomXZMax.value = new Vector2(10, 10);
        const randomXZ = new ParticleRandomBlock("Random XZ");
        randomXZ.lockMode = ParticleRandomBlockLocks.PerParticle;
        randomXZMin.output.connectTo(randomXZ.min);
        randomXZMax.output.connectTo(randomXZ.max);

        const randomAngleMin = new ParticleInputBlock("Random Angle Min");
        randomAngleMin.value = -Math.PI;
        const randomAngleMax = new ParticleInputBlock("Random Angle Max");
        randomAngleMax.value = Math.PI;
        const randomAngle = new ParticleRandomBlock("Random Angle");
        randomAngle.lockMode = ParticleRandomBlockLocks.PerParticle;
        randomAngleMin.output.connectTo(randomAngle.min);
        randomAngleMax.output.connectTo(randomAngle.max);

        const randomRangeMin = new ParticleInputBlock("Random Range Min");
        randomRangeMin.value = 1;
        const randomRangeMax = new ParticleInputBlock("Random Range Max");
        randomRangeMax.value = 5;
        const randomRange = new ParticleRandomBlock("Random Range");
        randomRange.lockMode = ParticleRandomBlockLocks.PerParticle;
        randomRangeMin.output.connectTo(randomRange.min);
        randomRangeMax.output.connectTo(randomRange.max);

        const one = new ParticleInputBlock("One");
        one.value = 1;
        const cosAngle = new ParticleTrigonometryBlock("Cos Angle");
        cosAngle.operation = ParticleTrigonometryBlockOperations.Cos;
        // Store angle in props so we can reuse during update
        const setAnglePropInit = new SpsParticlePropsSetBlock("Set Angle Prop Init");
        setAnglePropInit.propertyName = "angle";
        randomAngle.output.connectTo(setAnglePropInit.value);
        setAnglePropInit.output.connectTo(cosAngle.input);
        const addOne = new ParticleMathBlock("Add One");
        addOne.operation = ParticleMathBlockOperations.Add;
        one.output.connectTo(addOne.left);
        cosAngle.output.connectTo(addOne.right);
        const multiplyRange = new ParticleMathBlock("Multiply Range");
        multiplyRange.operation = ParticleMathBlockOperations.Multiply;
        const setRangePropInit = new SpsParticlePropsSetBlock("Set Range Prop Init");
        setRangePropInit.propertyName = "range";
        randomRange.output.connectTo(setRangePropInit.value);
        setRangePropInit.output.connectTo(multiplyRange.left);
        addOne.output.connectTo(multiplyRange.right);

        const extractXZ = new ParticleConverterBlock("Extract XZ");
        randomXZ.output.connectTo(extractXZ.xyIn);
        const positionConverter = new ParticleConverterBlock("Position Converter");
        extractXZ.xOut.connectTo(positionConverter.xIn);
        multiplyRange.output.connectTo(positionConverter.yIn);
        extractXZ.yOut.connectTo(positionConverter.zIn);
        positionConverter.xyzOut.connectTo(spsInitTetra.position);

        const randomRotMin = new ParticleInputBlock("Random Rot Min");
        randomRotMin.value = new Vector3(-Math.PI, -Math.PI, -Math.PI);
        const randomRotMax = new ParticleInputBlock("Random Rot Max");
        randomRotMax.value = new Vector3(Math.PI, Math.PI, Math.PI);
        const randomRot = new ParticleRandomBlock("Random Rotation");
        randomRot.lockMode = ParticleRandomBlockLocks.PerParticle;
        randomRotMin.output.connectTo(randomRot.min);
        randomRotMax.output.connectTo(randomRot.max);
        randomRot.output.connectTo(spsInitTetra.rotation);

        const randomColorMin = new ParticleInputBlock("Random Color Min");
        randomColorMin.value = new Vector3(0, 0, 0);
        const randomColorMax = new ParticleInputBlock("Random Color Max");
        randomColorMax.value = new Vector3(1, 1, 1);
        const randomColorRGB = new ParticleRandomBlock("Random Color RGB");
        randomColorRGB.lockMode = ParticleRandomBlockLocks.PerParticle;
        randomColorMin.output.connectTo(randomColorRGB.min);
        randomColorMax.output.connectTo(randomColorRGB.max);
        const colorAlpha = new ParticleInputBlock("Color Alpha");
        colorAlpha.value = 1;
        const colorConverter = new ParticleConverterBlock("Color Converter");
        randomColorRGB.output.connectTo(colorConverter.xyzIn);
        colorAlpha.output.connectTo(colorConverter.wIn);
        colorConverter.colorOut.connectTo(spsInitTetra.color);

        // Create update block
        const spsUpdateTetra = new SPSUpdateBlock("Update Tetrahedron Particles");
        spsUpdateTetra.updateData.connectTo(spsCreateTetra.updateBlock);

        // Get current position (X, Z stay the same, Y updates)
        const currentPosition = new ParticleInputBlock("Current Position");
        currentPosition.contextualValue = NodeParticleContextualSources.Position;

        // Extract X and Z from current position
        const extractPosition = new ParticleConverterBlock("Extract Position");
        currentPosition.output.connectTo(extractPosition.xyzIn);

        // Retrieve stored properties
        const getAngleProp = new SpsParticlePropsGetBlock("Get Angle Prop");
        getAngleProp.propertyName = "angle";
        getAngleProp.type = NodeParticleBlockConnectionPointTypes.Float;

        const getRangeProp = new SpsParticlePropsGetBlock("Get Range Prop");
        getRangeProp.propertyName = "range";
        getRangeProp.type = NodeParticleBlockConnectionPointTypes.Float;

        // Accumulate angle using delta time to avoid relying on absolute frame id
        const deltaBlock = new ParticleInputBlock("Delta Time");
        deltaBlock.systemSource = NodeParticleSystemSources.Delta;

        const milliToSecond = new ParticleInputBlock("Milli To Second");
        milliToSecond.value = 0.001;

        const deltaSeconds = new ParticleMathBlock("Delta Seconds");
        deltaSeconds.operation = ParticleMathBlockOperations.Multiply;
        deltaBlock.output.connectTo(deltaSeconds.left);
        milliToSecond.output.connectTo(deltaSeconds.right);

        const targetFps = new ParticleInputBlock("Target FPS");
        targetFps.value = 60;

        const normalizedDelta = new ParticleMathBlock("Normalized Delta");
        normalizedDelta.operation = ParticleMathBlockOperations.Multiply;
        deltaSeconds.output.connectTo(normalizedDelta.left);
        targetFps.output.connectTo(normalizedDelta.right);

        const speedPerFrame = new ParticleInputBlock("Speed Per Frame");
        speedPerFrame.value = Math.PI / 100;

        const scaledIncrement = new ParticleMathBlock("Scaled Increment");
        scaledIncrement.operation = ParticleMathBlockOperations.Multiply;
        speedPerFrame.output.connectTo(scaledIncrement.left);
        normalizedDelta.output.connectTo(scaledIncrement.right);

        const accumulateAngle = new ParticleMathBlock("Accumulate Angle");
        accumulateAngle.operation = ParticleMathBlockOperations.Add;
        getAngleProp.output.connectTo(accumulateAngle.left);
        scaledIncrement.output.connectTo(accumulateAngle.right);

        const setAnglePropUpdate = new SpsParticlePropsSetBlock("Set Angle Prop Update");
        setAnglePropUpdate.propertyName = "angle";
        setAnglePropUpdate.type = NodeParticleBlockConnectionPointTypes.Float;
        accumulateAngle.output.connectTo(setAnglePropUpdate.value);

        // Calculate new Y position: range * (1 + cos(angle))
        const oneUpdate = new ParticleInputBlock("One Update");
        oneUpdate.value = 1;
        const cosUpdatedAngle = new ParticleTrigonometryBlock("Cos Updated Angle");
        cosUpdatedAngle.operation = ParticleTrigonometryBlockOperations.Cos;
        setAnglePropUpdate.output.connectTo(cosUpdatedAngle.input);
        const addOneUpdate = new ParticleMathBlock("Add One Update");
        addOneUpdate.operation = ParticleMathBlockOperations.Add;
        oneUpdate.output.connectTo(addOneUpdate.left);
        cosUpdatedAngle.output.connectTo(addOneUpdate.right);
        const multiplyRangeUpdate = new ParticleMathBlock("Multiply Range Update");
        multiplyRangeUpdate.operation = ParticleMathBlockOperations.Multiply;
        getRangeProp.output.connectTo(multiplyRangeUpdate.left);
        addOneUpdate.output.connectTo(multiplyRangeUpdate.right);

        // Combine X (from current position), Y (new), Z (from current position)
        const updatePositionConverter = new ParticleConverterBlock("Update Position Converter");
        extractPosition.xOut.connectTo(updatePositionConverter.xIn);
        multiplyRangeUpdate.output.connectTo(updatePositionConverter.yIn);
        extractPosition.zOut.connectTo(updatePositionConverter.zIn);
        updatePositionConverter.xyzOut.connectTo(spsUpdateTetra.position);

        this._systemBlocks.push(spsSystem);
    }

    /**
     * Sets the current set to an SPS shockwave preset inspired by Patrick Ryan's createShockwave sample
     */
    public createShockwaveSps() {
        this.clear();
        this.editorData = null;

        const spsSystem = new SPSSystemBlock("Shockwave SPS System");
        spsSystem.billboard = false;

        const lifetimeMs = new ParticleInputBlock("Shockwave Lifetime (ms)");
        lifetimeMs.value = 2500;
        const minLifetimeMs = new ParticleInputBlock("Shockwave Min Lifetime (ms)");
        minLifetimeMs.value = 1;
        const lifetimeSafe = new ParticleMathBlock("Shockwave Lifetime Safe");
        lifetimeSafe.operation = ParticleMathBlockOperations.Max;
        lifetimeMs.output.connectTo(lifetimeSafe.left);
        minLifetimeMs.output.connectTo(lifetimeSafe.right);
        lifetimeSafe.output.connectTo(spsSystem.lifeTime);
        spsSystem.disposeOnEnd = true;

        const spsCreateBlock = new SPSCreateBlock("Create Shockwave SPS");
        spsCreateBlock.solidParticle.connectTo(spsSystem.solidParticle);

        const shockwaveConfig = new SPSParticleConfigBlock("Shockwave Particle Config");
        shockwaveConfig.count.value = 7;
        shockwaveConfig.config.connectTo(spsCreateBlock.config);

        const shockwaveMesh = new SPSMeshSourceBlock("Shockwave Mesh Source");
        shockwaveMesh.shapeType = SPSMeshShapeType.Custom;
        const shockwaveMeshFile = new SPSMeshFileBlock("Shockwave Mesh File");
        shockwaveMeshFile.meshUrl = "https://patrickryanms.github.io/BabylonJStextures/Demos/attack_fx/assets/gltf/shockwaveMesh.glb";
        shockwaveMeshFile.meshName = "shockwaveMesh";
        shockwaveMeshFile.mesh.connectTo(shockwaveMesh.customMesh);
        shockwaveMesh.mesh.connectTo(shockwaveConfig.mesh);

        const shockwaveMaterial = new SPSNodeMaterialBlock("Shockwave Material");
        shockwaveMaterial.shaderUrl = "https://patrickryanms.github.io/BabylonJStextures/Demos/attack_fx/assets/shaders/shockwaveParticleShader.json";
        shockwaveMaterial.textureUrl = "https://patrickryanms.github.io/BabylonJStextures/Demos/attack_fx/assets/textures/electricityRing.png";
        shockwaveMaterial.textureBlockName = "particleTex";
        shockwaveMaterial.material.connectTo(shockwaveConfig.material);

        const shockwaveInit = new SPSInitBlock("Initialize Shockwave Particles");
        shockwaveInit.initData.connectTo(shockwaveConfig.initBlock);

        const shockwaveUpdate = new SPSUpdateBlock("Update Shockwave Particles");
        shockwaveUpdate.updateData.connectTo(shockwaveConfig.updateBlock);

        const deltaBlock = new ParticleInputBlock("Shockwave Delta Time");
        deltaBlock.systemSource = NodeParticleSystemSources.Delta;
        const milliToSecond = new ParticleInputBlock("Shockwave Milli To Second");
        milliToSecond.value = 0.001;
        const deltaSeconds = new ParticleMathBlock("Shockwave Delta Seconds");
        deltaSeconds.operation = ParticleMathBlockOperations.Multiply;
        deltaBlock.output.connectTo(deltaSeconds.left);
        milliToSecond.output.connectTo(deltaSeconds.right);
        const targetFps = new ParticleInputBlock("Shockwave Target FPS");
        targetFps.value = 60;
        const normalizedDelta = new ParticleMathBlock("Shockwave Normalized Delta");
        normalizedDelta.operation = ParticleMathBlockOperations.Multiply;
        deltaSeconds.output.connectTo(normalizedDelta.left);
        targetFps.output.connectTo(normalizedDelta.right);

        const lifetimeSeconds = new ParticleMathBlock("Shockwave Lifetime Seconds");
        lifetimeSeconds.operation = ParticleMathBlockOperations.Multiply;
        lifetimeSafe.output.connectTo(lifetimeSeconds.left);
        milliToSecond.output.connectTo(lifetimeSeconds.right);
        const framesPerLifetime = new ParticleMathBlock("Shockwave Frames Per Lifetime");
        framesPerLifetime.operation = ParticleMathBlockOperations.Multiply;
        lifetimeSeconds.output.connectTo(framesPerLifetime.left);
        targetFps.output.connectTo(framesPerLifetime.right);

        const origin = new ParticleInputBlock("Shockwave Origin");
        origin.value = new Vector3(0, 0.05, 0);
        origin.output.connectTo(shockwaveInit.position);

        const shockwaveColor = new ParticleInputBlock("Shockwave Base Color");
        shockwaveColor.value = new Color4(0.33, 0.49, 0.88, 0.9);
        shockwaveColor.output.connectTo(shockwaveInit.color);

        const zeroValue = new ParticleInputBlock("Shockwave Zero");
        zeroValue.value = 0;

        const radiusStart = new ParticleInputBlock("Shockwave Radius Start");
        radiusStart.value = 1;
        const storeRadiusInit = new SpsParticlePropsSetBlock("Store Radius Init");
        storeRadiusInit.propertyName = "radius";
        storeRadiusInit.type = NodeParticleBlockConnectionPointTypes.Float;
        radiusStart.output.connectTo(storeRadiusInit.value);

        const maxRadius = new ParticleInputBlock("Shockwave Max Radius");
        maxRadius.value = 4;

        const radiusRangeBlock = new ParticleMathBlock("Shockwave Radius Range");
        radiusRangeBlock.operation = ParticleMathBlockOperations.Subtract;
        maxRadius.output.connectTo(radiusRangeBlock.left);
        radiusStart.output.connectTo(radiusRangeBlock.right);

        const growthMultiplierMin = new ParticleInputBlock("Shockwave Growth Multiplier Min");
        growthMultiplierMin.value = 0.85;
        const growthMultiplierMax = new ParticleInputBlock("Shockwave Growth Multiplier Max");
        growthMultiplierMax.value = 1.15;
        const growthMultiplier = new ParticleRandomBlock("Shockwave Growth Multiplier");
        growthMultiplier.lockMode = ParticleRandomBlockLocks.OncePerParticle;
        growthMultiplierMin.output.connectTo(growthMultiplier.min);
        growthMultiplierMax.output.connectTo(growthMultiplier.max);

        const baseGrowthPerFrame = new ParticleMathBlock("Shockwave Base Growth Per Frame");
        baseGrowthPerFrame.operation = ParticleMathBlockOperations.Divide;
        radiusRangeBlock.output.connectTo(baseGrowthPerFrame.left);
        framesPerLifetime.output.connectTo(baseGrowthPerFrame.right);

        const growthPerFrame = new ParticleMathBlock("Shockwave Growth Per Frame");
        growthPerFrame.operation = ParticleMathBlockOperations.Multiply;
        baseGrowthPerFrame.output.connectTo(growthPerFrame.left);
        growthMultiplier.output.connectTo(growthPerFrame.right);

        const storeScaleStepInit = new SpsParticlePropsSetBlock("Store Scale Step Init");
        storeScaleStepInit.propertyName = "scaleStep";
        storeScaleStepInit.type = NodeParticleBlockConnectionPointTypes.Float;
        growthPerFrame.output.connectTo(storeScaleStepInit.value);

        const initScaleConverter = new ParticleConverterBlock("Shockwave Init Scale Converter");
        storeRadiusInit.output.connectTo(initScaleConverter.xIn);
        storeScaleStepInit.output.connectTo(initScaleConverter.yIn);
        storeRadiusInit.output.connectTo(initScaleConverter.zIn);
        initScaleConverter.xyzOut.connectTo(shockwaveInit.scaling);

        const rotationMin = new ParticleInputBlock("Shockwave Rotation Min");
        rotationMin.value = new Vector3(0, -Math.PI, 0);
        const rotationMax = new ParticleInputBlock("Shockwave Rotation Max");
        rotationMax.value = new Vector3(0, Math.PI, 0);
        const initialRotation = new ParticleRandomBlock("Shockwave Initial Rotation");
        initialRotation.lockMode = ParticleRandomBlockLocks.OncePerParticle;
        rotationMin.output.connectTo(initialRotation.min);
        rotationMax.output.connectTo(initialRotation.max);

        const rotationConverter = new ParticleConverterBlock("Shockwave Rotation Converter");
        initialRotation.output.connectTo(rotationConverter.xyzIn);
        const storeRotationAngleInit = new SpsParticlePropsSetBlock("Store Rotation Angle Init");
        storeRotationAngleInit.propertyName = "rotationAngle";
        storeRotationAngleInit.type = NodeParticleBlockConnectionPointTypes.Float;
        rotationConverter.yOut.connectTo(storeRotationAngleInit.value);

        const rotationCompose = new ParticleConverterBlock("Shockwave Rotation Compose");
        rotationConverter.xOut.connectTo(rotationCompose.xIn);
        storeRotationAngleInit.output.connectTo(rotationCompose.yIn);
        rotationConverter.zOut.connectTo(rotationCompose.zIn);
        rotationCompose.xyzOut.connectTo(shockwaveInit.rotation);

        const rotationSpeedMin = new ParticleInputBlock("Shockwave Rotation Speed Min");
        rotationSpeedMin.value = -0.06;
        const rotationSpeedMax = new ParticleInputBlock("Shockwave Rotation Speed Max");
        rotationSpeedMax.value = 0.06;
        const rotationSpeedRandom = new ParticleRandomBlock("Shockwave Rotation Speed Random");
        rotationSpeedRandom.lockMode = ParticleRandomBlockLocks.OncePerParticle;
        rotationSpeedMin.output.connectTo(rotationSpeedRandom.min);
        rotationSpeedMax.output.connectTo(rotationSpeedRandom.max);
        const storeRotationSpeed = new SpsParticlePropsSetBlock("Store Rotation Speed");
        storeRotationSpeed.propertyName = "rotationSpeed";
        storeRotationSpeed.type = NodeParticleBlockConnectionPointTypes.Float;
        rotationSpeedRandom.output.connectTo(storeRotationSpeed.value);

        const rotationSpeedSink = new ParticleMathBlock("Shockwave Rotation Speed Sink");
        rotationSpeedSink.operation = ParticleMathBlockOperations.Multiply;
        storeRotationSpeed.output.connectTo(rotationSpeedSink.left);
        zeroValue.output.connectTo(rotationSpeedSink.right);
        const rotationSpeedVelocity = new ParticleConverterBlock("Shockwave Rotation Speed Velocity");
        rotationSpeedSink.output.connectTo(rotationSpeedVelocity.xIn);
        zeroValue.output.connectTo(rotationSpeedVelocity.yIn);
        zeroValue.output.connectTo(rotationSpeedVelocity.zIn);
        rotationSpeedVelocity.xyzOut.connectTo(shockwaveInit.velocity);

        const getRadiusProp = new SpsParticlePropsGetBlock("Get Radius Prop");
        getRadiusProp.propertyName = "radius";
        getRadiusProp.type = NodeParticleBlockConnectionPointTypes.Float;

        const getScaleStepProp = new SpsParticlePropsGetBlock("Get Scale Step Prop");
        getScaleStepProp.propertyName = "scaleStep";
        getScaleStepProp.type = NodeParticleBlockConnectionPointTypes.Float;

        const getRotationSpeedProp = new SpsParticlePropsGetBlock("Get Rotation Speed Prop");
        getRotationSpeedProp.propertyName = "rotationSpeed";
        getRotationSpeedProp.type = NodeParticleBlockConnectionPointTypes.Float;

        const getRotationAngleProp = new SpsParticlePropsGetBlock("Get Rotation Angle Prop");
        getRotationAngleProp.propertyName = "rotationAngle";
        getRotationAngleProp.type = NodeParticleBlockConnectionPointTypes.Float;

        const scaleStepDelta = new ParticleMathBlock("Shockwave Radius Delta");
        scaleStepDelta.operation = ParticleMathBlockOperations.Multiply;
        getScaleStepProp.output.connectTo(scaleStepDelta.left);
        normalizedDelta.output.connectTo(scaleStepDelta.right);

        const radiusIncrement = new ParticleMathBlock("Shockwave Radius Increment");
        radiusIncrement.operation = ParticleMathBlockOperations.Add;
        getRadiusProp.output.connectTo(radiusIncrement.left);
        scaleStepDelta.output.connectTo(radiusIncrement.right);

        const setRadiusPropUpdate = new SpsParticlePropsSetBlock("Set Radius Prop Update");
        setRadiusPropUpdate.propertyName = "radius";
        setRadiusPropUpdate.type = NodeParticleBlockConnectionPointTypes.Float;
        radiusIncrement.output.connectTo(setRadiusPropUpdate.value);

        const clampRadius = new ParticleMathBlock("Shockwave Clamp Radius");
        clampRadius.operation = ParticleMathBlockOperations.Min;
        setRadiusPropUpdate.output.connectTo(clampRadius.left);
        maxRadius.output.connectTo(clampRadius.right);

        const normalizedRadius = new ParticleMathBlock("Shockwave Normalized Radius");
        normalizedRadius.operation = ParticleMathBlockOperations.Divide;
        clampRadius.output.connectTo(normalizedRadius.left);
        maxRadius.output.connectTo(normalizedRadius.right);

        const normalizedMin = new ParticleMathBlock("Shockwave Normalized Min");
        normalizedMin.operation = ParticleMathBlockOperations.Max;
        zeroValue.output.connectTo(normalizedMin.left);
        normalizedRadius.output.connectTo(normalizedMin.right);

        const oneValue = new ParticleInputBlock("Shockwave One");
        oneValue.value = 1;
        const normalizedClamp = new ParticleMathBlock("Shockwave Normalized Clamp");
        normalizedClamp.operation = ParticleMathBlockOperations.Min;
        normalizedMin.output.connectTo(normalizedClamp.left);
        oneValue.output.connectTo(normalizedClamp.right);

        const minThickness = new ParticleInputBlock("Shockwave Min Thickness");
        minThickness.value = 0.25;
        const maxThickness = new ParticleInputBlock("Shockwave Max Thickness");
        maxThickness.value = 4;
        const thicknessRange = new ParticleMathBlock("Shockwave Thickness Range");
        thicknessRange.operation = ParticleMathBlockOperations.Subtract;
        maxThickness.output.connectTo(thicknessRange.left);
        minThickness.output.connectTo(thicknessRange.right);
        const thicknessScale = new ParticleMathBlock("Shockwave Thickness Scale");
        thicknessScale.operation = ParticleMathBlockOperations.Multiply;
        thicknessRange.output.connectTo(thicknessScale.left);
        normalizedClamp.output.connectTo(thicknessScale.right);
        const thicknessValue = new ParticleMathBlock("Shockwave Thickness Value");
        thicknessValue.operation = ParticleMathBlockOperations.Add;
        minThickness.output.connectTo(thicknessValue.left);
        thicknessScale.output.connectTo(thicknessValue.right);

        const minHeight = new ParticleInputBlock("Shockwave Min Height");
        minHeight.value = 0.05;
        const maxHeight = new ParticleInputBlock("Shockwave Max Height");
        maxHeight.value = 0.25;
        const heightRange = new ParticleMathBlock("Shockwave Height Range");
        heightRange.operation = ParticleMathBlockOperations.Subtract;
        maxHeight.output.connectTo(heightRange.left);
        minHeight.output.connectTo(heightRange.right);
        const heightScale = new ParticleMathBlock("Shockwave Height Scale");
        heightScale.operation = ParticleMathBlockOperations.Multiply;
        heightRange.output.connectTo(heightScale.left);
        normalizedClamp.output.connectTo(heightScale.right);
        const heightValue = new ParticleMathBlock("Shockwave Height Value");
        heightValue.operation = ParticleMathBlockOperations.Add;
        minHeight.output.connectTo(heightValue.left);
        heightScale.output.connectTo(heightValue.right);

        const scalingConverter = new ParticleConverterBlock("Shockwave Scaling Converter");
        clampRadius.output.connectTo(scalingConverter.xIn);
        thicknessValue.output.connectTo(scalingConverter.yIn);
        clampRadius.output.connectTo(scalingConverter.zIn);
        scalingConverter.xyzOut.connectTo(shockwaveUpdate.scaling);

        const positionConverter = new ParticleConverterBlock("Shockwave Position Converter");
        zeroValue.output.connectTo(positionConverter.xIn);
        heightValue.output.connectTo(positionConverter.yIn);
        zeroValue.output.connectTo(positionConverter.zIn);
        positionConverter.xyzOut.connectTo(shockwaveUpdate.position);

        const rotationIncrement = new ParticleMathBlock("Shockwave Rotation Increment");
        rotationIncrement.operation = ParticleMathBlockOperations.Multiply;
        getRotationSpeedProp.output.connectTo(rotationIncrement.left);
        normalizedDelta.output.connectTo(rotationIncrement.right);

        const updatedRotationAngle = new ParticleMathBlock("Shockwave Updated Rotation Angle");
        updatedRotationAngle.operation = ParticleMathBlockOperations.Add;
        getRotationAngleProp.output.connectTo(updatedRotationAngle.left);
        rotationIncrement.output.connectTo(updatedRotationAngle.right);

        const setRotationAngleUpdate = new SpsParticlePropsSetBlock("Set Rotation Angle Update");
        setRotationAngleUpdate.propertyName = "rotationAngle";
        setRotationAngleUpdate.type = NodeParticleBlockConnectionPointTypes.Float;
        updatedRotationAngle.output.connectTo(setRotationAngleUpdate.value);

        const rotationUpdateConverter = new ParticleConverterBlock("Shockwave Rotation Update Converter");
        zeroValue.output.connectTo(rotationUpdateConverter.xIn);
        setRotationAngleUpdate.output.connectTo(rotationUpdateConverter.yIn);
        zeroValue.output.connectTo(rotationUpdateConverter.zIn);
        rotationUpdateConverter.xyzOut.connectTo(shockwaveUpdate.rotation);

        const colorEnd = new ParticleInputBlock("Shockwave Color End");
        colorEnd.value = new Color4(0, 0, 0, 0);
        const colorRange = new ParticleMathBlock("Shockwave Color Range");
        colorRange.operation = ParticleMathBlockOperations.Subtract;
        colorEnd.output.connectTo(colorRange.left);
        shockwaveColor.output.connectTo(colorRange.right);
        const colorScale = new ParticleMathBlock("Shockwave Color Scale");
        colorScale.operation = ParticleMathBlockOperations.Multiply;
        colorRange.output.connectTo(colorScale.left);
        normalizedClamp.output.connectTo(colorScale.right);
        const colorValue = new ParticleMathBlock("Shockwave Color Value");
        colorValue.operation = ParticleMathBlockOperations.Add;
        shockwaveColor.output.connectTo(colorValue.left);
        colorScale.output.connectTo(colorValue.right);
        colorValue.output.connectTo(shockwaveUpdate.color);

        this._systemBlocks.push(spsSystem);
    }

    /**
     * Remove a block from the current system set
     * @param block defines the block to remove
     */
    public removeBlock(block: NodeParticleBlock) {
        const attachedBlockIndex = this.attachedBlocks.indexOf(block);
        if (attachedBlockIndex > -1) {
            this.attachedBlocks.splice(attachedBlockIndex, 1);
        }

        if (block.isSystem) {
            const index = this._systemBlocks.indexOf(block as SystemBlock);
            if (index > -1) {
                this._systemBlocks.splice(index, 1);
            }
        }
    }

    /**
     * Clear the current graph and load a new one from a serialization object
     * @param source defines the JSON representation of the particle set
     * @param merge defines whether or not the source must be merged or replace the current content
     */
    public parseSerializedObject(source: any, merge = false) {
        if (!merge) {
            this.clear();
        }

        const map: { [key: number]: NodeParticleBlock } = {};

        // Create blocks
        for (const parsedBlock of source.blocks) {
            const blockType = GetClass(parsedBlock.customType);
            if (blockType) {
                const block: NodeParticleBlock = new blockType();
                block._deserialize(parsedBlock);
                map[parsedBlock.id] = block;

                this.attachedBlocks.push(block);

                if (block.isSystem) {
                    this._systemBlocks.push(block as SystemBlock);
                }
            }
        }

        // Reconnect teleportation
        for (const block of this.attachedBlocks) {
            if (block.isTeleportOut) {
                const teleportOut = block as ParticleTeleportOutBlock;
                const id = teleportOut._tempEntryPointUniqueId;
                if (id) {
                    const source = map[id] as ParticleTeleportInBlock;
                    if (source) {
                        source.attachToEndpoint(teleportOut);
                    }
                }
            }
        }

        // Connections - Starts with input blocks only (except if in "merge" mode where we scan all blocks)
        for (let blockIndex = 0; blockIndex < source.blocks.length; blockIndex++) {
            const parsedBlock = source.blocks[blockIndex];
            const block = map[parsedBlock.id];

            if (!block) {
                continue;
            }

            if (block.inputs.length && parsedBlock.inputs.some((i: any) => i.targetConnectionName) && !merge) {
                continue;
            }
            this._restoreConnections(block, source, map);
        }

        // UI related info
        if (source.locations || (source.editorData && source.editorData.locations)) {
            const locations: {
                blockId: number;
                x: number;
                y: number;
                isCollapsed: boolean;
            }[] = source.locations || source.editorData.locations;

            for (const location of locations) {
                if (map[location.blockId]) {
                    location.blockId = map[location.blockId].uniqueId;
                }
            }

            if (merge && this.editorData && this.editorData.locations) {
                locations.concat(this.editorData.locations);
            }

            if (source.locations) {
                this.editorData = {
                    locations: locations,
                };
            } else {
                this.editorData = source.editorData;
                this.editorData.locations = locations;
            }

            const blockMap: { [key: number]: number } = {};

            for (const key in map) {
                blockMap[key] = map[key].uniqueId;
            }

            this.editorData.map = blockMap;
        }

        this.comment = source.comment;
    }

    private _restoreConnections(block: NodeParticleBlock, source: any, map: { [key: number]: NodeParticleBlock }) {
        for (const outputPoint of block.outputs) {
            for (const candidate of source.blocks) {
                const target = map[candidate.id];

                if (!target) {
                    continue;
                }

                for (const input of candidate.inputs) {
                    if (map[input.targetBlockId] === block && input.targetConnectionName === outputPoint.name) {
                        const inputPoint = target.getInputByName(input.inputName);
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
     * Serializes this node particle set in a JSON representation
     * @param selectedBlocks defines the list of blocks to save (if null the whole node particle set will be saved)
     * @returns the serialized particle system set object
     */
    public serialize(selectedBlocks?: NodeParticleBlock[]): any {
        const serializationObject = selectedBlocks ? {} : SerializationHelper.Serialize(this);
        serializationObject.editorData = JSON.parse(JSON.stringify(this.editorData)); // Copy

        let blocks: NodeParticleBlock[] = [];

        if (selectedBlocks) {
            blocks = selectedBlocks;
        } else {
            serializationObject.customType = "BABYLON.NodeParticleSystemSet";
        }

        // Blocks
        serializationObject.blocks = [];

        for (const block of blocks) {
            serializationObject.blocks.push(block.serialize());
        }

        if (!selectedBlocks) {
            for (const block of this.attachedBlocks) {
                if (blocks.indexOf(block) !== -1) {
                    continue;
                }
                serializationObject.blocks.push(block.serialize());
            }
        }

        return serializationObject;
    }

    /**
     * Makes a duplicate of the current particle system set.
     * @param name defines the name to use for the new particle system set
     * @returns the cloned particle system set
     */
    public clone(name: string): NodeParticleSystemSet {
        const serializationObject = this.serialize();

        const clone = SerializationHelper.Clone(() => new NodeParticleSystemSet(name), this);
        clone.name = name;
        clone.snippetId = this.snippetId;

        clone.parseSerializedObject(serializationObject);
        clone._buildId = this._buildId;

        return clone;
    }

    /**
     * Disposes the resources
     */
    public dispose(): void {
        for (const block of this.attachedBlocks) {
            block.dispose();
        }

        this.attachedBlocks.length = 0;
        this.onBuildObservable.clear();
    }

    /**
     * Creates a new node particle set set to default basic configuration
     * @param name defines the name of the particle set
     * @returns a new NodeParticleSystemSet
     */
    public static CreateDefault(name: string) {
        const nodeParticleSet = new NodeParticleSystemSet(name);

        nodeParticleSet.setToDefault();

        return nodeParticleSet;
    }

    /**
     * Creates a node particle set from parsed data
     * @param source defines the JSON representation of the particle set
     * @returns a new node particle set
     */
    public static Parse(source: any): NodeParticleSystemSet {
        const nodeParticleSet = SerializationHelper.Parse(() => new NodeParticleSystemSet(source.name), source, null);

        nodeParticleSet.parseSerializedObject(source);

        return nodeParticleSet;
    }

    /**
     * Creates a node particle set from a snippet saved in a remote file
     * @param name defines the name of the node particle set to create
     * @param url defines the url to load from
     * @param nodeParticleSet defines a node particle set to update (instead of creating a new one)
     * @returns a promise that will resolve to the new node particle set
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public static ParseFromFileAsync(name: string, url: string, nodeParticleSet?: NodeParticleSystemSet): Promise<NodeParticleSystemSet> {
        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const serializationObject = JSON.parse(request.responseText);
                        if (!nodeParticleSet) {
                            nodeParticleSet = SerializationHelper.Parse(() => new NodeParticleSystemSet(name), serializationObject, null);
                        }

                        nodeParticleSet.parseSerializedObject(serializationObject);

                        resolve(nodeParticleSet);
                    } else {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject("Unable to load the node particle system set");
                    }
                }
            });

            request.open("GET", url);
            request.send();
        });
    }

    /**
     * Creates a node particle set from a snippet saved by the node particle editor
     * @param snippetId defines the snippet to load
     * @param nodeParticleSet defines a node particle set to update (instead of creating a new one)
     * @returns a promise that will resolve to the new node particle set
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public static ParseFromSnippetAsync(snippetId: string, nodeParticleSet?: NodeParticleSystemSet): Promise<NodeParticleSystemSet> {
        if (snippetId === "_BLANK") {
            return Promise.resolve(NodeParticleSystemSet.CreateDefault("blank"));
        }

        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.nodeParticle);

                        if (!nodeParticleSet) {
                            nodeParticleSet = SerializationHelper.Parse(() => new NodeParticleSystemSet(snippetId), serializationObject, null);
                        }

                        nodeParticleSet.parseSerializedObject(serializationObject);
                        nodeParticleSet.snippetId = snippetId;

                        try {
                            resolve(nodeParticleSet);
                        } catch (err) {
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(err);
                        }
                    } else {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject("Unable to load the snippet " + snippetId);
                    }
                }
            });

            request.open("GET", this.SnippetUrl + "/" + snippetId.replace(/#/g, "/"));
            request.send();
        });
    }
}
