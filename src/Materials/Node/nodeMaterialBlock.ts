import { NodeMaterialBlockConnectionPointTypes } from './Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from './nodeMaterialBuildState';
import { Nullable } from '../../types';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from './nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from './Enums/nodeMaterialBlockTargets';
import { Effect } from '../effect';
import { AbstractMesh } from '../../Meshes/abstractMesh';
import { Mesh } from '../../Meshes/mesh';
import { SubMesh } from '../../Meshes/subMesh';
import { NodeMaterial, NodeMaterialDefines } from './nodeMaterial';
import { InputBlock } from './Blocks/Input/inputBlock';
import { UniqueIdGenerator } from '../../Misc/uniqueIdGenerator';
import { Scene } from '../../scene';
import { _TypeStore } from '../../Misc/typeStore';
import { EffectFallbacks } from '../effectFallbacks';

/**
 * Defines a block that can be used inside a node based material
 */
export class NodeMaterialBlock {
    private _buildId: number;
    private _buildTarget: NodeMaterialBlockTargets;
    private _target: NodeMaterialBlockTargets;
    private _isFinalMerger = false;
    private _isInput = false;
    private _name = "";
    protected _isUnique = false;

    /** Gets or sets a boolean indicating that only one input can be connected at a time */
    public inputsAreExclusive = false;

    /** @hidden */
    public _codeVariableName = "";

    /** @hidden */
    public _inputs = new Array<NodeMaterialConnectionPoint>();
    /** @hidden */
    public _outputs = new Array<NodeMaterialConnectionPoint>();

    /** @hidden */
    public _preparationId: number;

    /**
     * Gets or sets the name of the block
     */

    public get name (): string {
         return this._name;
    }
    
    public set name (newName: string) {

        if(!this.validateBlockName(newName))
        {
            return;
        }
        
        this._name = newName;
    }

    /**
     * Gets or sets the unique id of the node
     */
    public uniqueId: number;

    /**
     * Gets or sets the comments associated with this block
     */
    public comments: string = "";

    /**
     * Gets a boolean indicating that this block can only be used once per NodeMaterial
     */
    public get isUnique() {
        return this._isUnique;
    }

    /**
     * Gets a boolean indicating that this block is an end block (e.g. it is generating a system value)
     */
    public get isFinalMerger(): boolean {
        return this._isFinalMerger;
    }

    /**
     * Gets a boolean indicating that this block is an input (e.g. it sends data to the shader)
     */
    public get isInput(): boolean {
        return this._isInput;
    }

    /**
     * Gets or sets the build Id
     */
    public get buildId(): number {
        return this._buildId;
    }

    public set buildId(value: number) {
        this._buildId = value;
    }

    /**
     * Gets or sets the target of the block
     */
    public get target() {
        return this._target;
    }

    public set target(value: NodeMaterialBlockTargets) {
        if ((this._target & value) !== 0) {
            return;
        }
        this._target = value;
    }

    /**
     * Gets the list of input points
     */
    public get inputs(): NodeMaterialConnectionPoint[] {
        return this._inputs;
    }

    /** Gets the list of output points */
    public get outputs(): NodeMaterialConnectionPoint[] {
        return this._outputs;
    }

    /**
     * Find an input by its name
     * @param name defines the name of the input to look for
     * @returns the input or null if not found
     */
    public getInputByName(name: string) {
        let filter = this._inputs.filter((e) => e.name === name);

        if (filter.length) {
            return filter[0];
        }

        return null;
    }

    /**
     * Find an output by its name
     * @param name defines the name of the outputto look for
     * @returns the output or null if not found
     */
    public getOutputByName(name: string) {
        let filter = this._outputs.filter((e) => e.name === name);

        if (filter.length) {
            return filter[0];
        }

        return null;
    }

    /**
     * Creates a new NodeMaterialBlock
     * @param name defines the block name
     * @param target defines the target of that block (Vertex by default)
     * @param isFinalMerger defines a boolean indicating that this block is an end block (e.g. it is generating a system value). Default is false
     * @param isInput defines a boolean indicating that this block is an input (e.g. it sends data to the shader). Default is false
     */
    public constructor(name: string, target = NodeMaterialBlockTargets.Vertex, isFinalMerger = false, isInput = false) {

        this._target = target;
        this._isFinalMerger = isFinalMerger;
        this._isInput = isInput;
        this._name = name;
        this.uniqueId = UniqueIdGenerator.UniqueId;
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        // Do nothing
    }

    /**
     * Bind data to effect. Will only be called for blocks with isBindable === true
     * @param effect defines the effect to bind data to
     * @param nodeMaterial defines the hosting NodeMaterial
     * @param mesh defines the mesh that will be rendered
     * @param subMesh defines the submesh that will be rendered
     */
    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh, subMesh?: SubMesh) {
        // Do nothing
    }

    protected _declareOutput(output: NodeMaterialConnectionPoint, state: NodeMaterialBuildState): string {
        return `${state._getGLType(output.type)} ${output.associatedVariableName}`;
    }

    protected _writeVariable(currentPoint: NodeMaterialConnectionPoint): string {
        let connectionPoint = currentPoint.connectedPoint;

        if (connectionPoint) {
            return `${currentPoint.associatedVariableName}`;
        }

        return `0.`;
    }

    protected _writeFloat(value: number) {
        let stringVersion = value.toString();

        if (stringVersion.indexOf(".") === -1) {
            stringVersion += ".0";
        }
        return `${stringVersion}`;
    }

    /**
     * Gets the current class name e.g. "NodeMaterialBlock"
     * @returns the class name
     */
    public getClassName() {
        return "NodeMaterialBlock";
    }

    /**
     * Register a new input. Must be called inside a block constructor
     * @param name defines the connection point name
     * @param type defines the connection point type
     * @param isOptional defines a boolean indicating that this input can be omitted
     * @param target defines the target to use to limit the connection point (will be VertexAndFragment by default)
     * @param point an already created connection point. If not provided, create a new one
     * @returns the current block
     */
    public registerInput(name: string, type: NodeMaterialBlockConnectionPointTypes, isOptional: boolean = false, target?: NodeMaterialBlockTargets, point?: NodeMaterialConnectionPoint) {
        point = point ?? new NodeMaterialConnectionPoint(name, this, NodeMaterialConnectionPointDirection.Input);
        point.type = type;
        point.isOptional = isOptional;
        if (target) {
            point.target = target;
        }

        this._inputs.push(point);

        return this;
    }

    /**
     * Register a new output. Must be called inside a block constructor
     * @param name defines the connection point name
     * @param type defines the connection point type
     * @param target defines the target to use to limit the connection point (will be VertexAndFragment by default)
     * @param point an already created connection point. If not provided, create a new one
     * @returns the current block
     */
    public registerOutput(name: string, type: NodeMaterialBlockConnectionPointTypes, target?: NodeMaterialBlockTargets, point?: NodeMaterialConnectionPoint) {
        point = point ?? new NodeMaterialConnectionPoint(name, this, NodeMaterialConnectionPointDirection.Output);
        point.type = type;
        if (target) {
            point.target = target;
        }

        this._outputs.push(point);

        return this;
    }

    /**
     * Will return the first available input e.g. the first one which is not an uniform or an attribute
     * @param forOutput defines an optional connection point to check compatibility with
     * @returns the first available input or null
     */
    public getFirstAvailableInput(forOutput: Nullable<NodeMaterialConnectionPoint> = null) {
        for (var input of this._inputs) {
            if (!input.connectedPoint) {
                if (!forOutput || (forOutput.type === input.type) || (input.type === NodeMaterialBlockConnectionPointTypes.AutoDetect)) {
                    return input;
                }
            }
        }

        return null;
    }

    /**
     * Will return the first available output e.g. the first one which is not yet connected and not a varying
     * @param forBlock defines an optional block to check compatibility with
     * @returns the first available input or null
     */
    public getFirstAvailableOutput(forBlock: Nullable<NodeMaterialBlock> = null) {
        for (var output of this._outputs) {
            if (!forBlock || !forBlock.target || forBlock.target === NodeMaterialBlockTargets.Neutral || (forBlock.target & output.target) !== 0) {
                return output;
            }
        }

        return null;
    }

    /**
     * Gets the sibling of the given output
     * @param current defines the current output
     * @returns the next output in the list or null
     */
    public getSiblingOutput(current: NodeMaterialConnectionPoint) {
        let index = this._outputs.indexOf(current);

        if (index === -1 || index >= this._outputs.length) {
            return null;
        }

        return this._outputs[index + 1];
    }

    /**
     * Connect current block with another block
     * @param other defines the block to connect with
     * @param options define the various options to help pick the right connections
     * @returns the current block
     */
    public connectTo(other: NodeMaterialBlock, options?: {
        input?: string,
        output?: string,
        outputSwizzle?: string
    }) {
        if (this._outputs.length === 0) {
            return;
        }

        let output = options && options.output ? this.getOutputByName(options.output) : this.getFirstAvailableOutput(other);

        let notFound = true;
        while (notFound) {
            let input = options && options.input ? other.getInputByName(options.input) : other.getFirstAvailableInput(output);

            if (output && input && output.canConnectTo(input)) {
                output.connectTo(input);
                notFound = false;
            } else if (!output) {
                throw "Unable to find a compatible match";
            } else {
                output = this.getSiblingOutput(output);
            }
        }

        return this;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        // Empty. Must be defined by child nodes
    }

    /**
     * Add uniforms, samplers and uniform buffers at compilation time
     * @param state defines the state to update
     * @param nodeMaterial defines the node material requesting the update
     * @param defines defines the material defines to update
     * @param uniformBuffers defines the list of uniform buffer names
     */
    public updateUniformsAndSamples(state: NodeMaterialBuildState, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines, uniformBuffers: string[]) {
        // Do nothing
    }

    /**
     * Add potential fallbacks if shader compilation fails
     * @param mesh defines the mesh to be rendered
     * @param fallbacks defines the current prioritized list of fallbacks
     */
    public provideFallbacks(mesh: AbstractMesh, fallbacks: EffectFallbacks) {
        // Do nothing
    }

    /**
     * Initialize defines for shader compilation
     * @param mesh defines the mesh to be rendered
     * @param nodeMaterial defines the node material requesting the update
     * @param defines defines the material defines to update
     * @param useInstances specifies that instances should be used
     */
    public initializeDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines, useInstances: boolean = false) {
    }

    /**
     * Update defines for shader compilation
     * @param mesh defines the mesh to be rendered
     * @param nodeMaterial defines the node material requesting the update
     * @param defines defines the material defines to update
     * @param useInstances specifies that instances should be used
     * @param subMesh defines which submesh to render
     */
    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines, useInstances: boolean = false, subMesh?: SubMesh) {
        // Do nothing
    }

    /**
     * Lets the block try to connect some inputs automatically
     * @param material defines the hosting NodeMaterial
     */
    public autoConfigure(material: NodeMaterial) {
        // Do nothing
    }

    /**
     * Function called when a block is declared as repeatable content generator
     * @param vertexShaderState defines the current compilation state for the vertex shader
     * @param fragmentShaderState defines the current compilation state for the fragment shader
     * @param mesh defines the mesh to be rendered
     * @param defines defines the material defines to update
     */
    public replaceRepeatableContent(vertexShaderState: NodeMaterialBuildState, fragmentShaderState: NodeMaterialBuildState, mesh: AbstractMesh, defines: NodeMaterialDefines) {
        // Do nothing
    }

    /**
     * Checks if the block is ready
     * @param mesh defines the mesh to be rendered
     * @param nodeMaterial defines the node material requesting the update
     * @param defines defines the material defines to update
     * @param useInstances specifies that instances should be used
     * @returns true if the block is ready
     */
    public isReady(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines, useInstances: boolean = false) {
        return true;
    }

    protected _linkConnectionTypes(inputIndex0: number, inputIndex1: number) {
        this._inputs[inputIndex0]._linkedConnectionSource = this._inputs[inputIndex1];
        this._inputs[inputIndex1]._linkedConnectionSource = this._inputs[inputIndex0];
    }

    private _processBuild(block: NodeMaterialBlock, state: NodeMaterialBuildState, input: NodeMaterialConnectionPoint, activeBlocks: NodeMaterialBlock[]) {
        block.build(state, activeBlocks);

        const localBlockIsFragment = (state._vertexState != null);
        const otherBlockWasGeneratedInVertexShader = block._buildTarget === NodeMaterialBlockTargets.Vertex && block.target !== NodeMaterialBlockTargets.VertexAndFragment;

        if (localBlockIsFragment && (
            ((block.target & block._buildTarget) === 0) ||
            ((block.target & input.target) === 0) ||
            (this.target !== NodeMaterialBlockTargets.VertexAndFragment && otherBlockWasGeneratedInVertexShader)
            )) { // context switch! We need a varying
            if ((!block.isInput && state.target !== block._buildTarget) // block was already emitted by vertex shader
                || (block.isInput && (block as InputBlock).isAttribute && !(block as InputBlock)._noContextSwitch) // block is an attribute
            ) {
                let connectedPoint = input.connectedPoint!;
                if (state._vertexState._emitVaryingFromString("v_" + connectedPoint.associatedVariableName, state._getGLType(connectedPoint.type))) {
                    state._vertexState.compilationString += `${"v_" + connectedPoint.associatedVariableName} = ${connectedPoint.associatedVariableName};\r\n`;
                }
                input.associatedVariableName = "v_" + connectedPoint.associatedVariableName;
                input._enforceAssociatedVariableName = true;
            }
        }
    }

    public validateBlockName(newName: string)
     {
        //if(this._isInput)
        //{
            let reservedNames: Array<string> = [
            "position",
            "normal",
            "tangent",
            "particle_positionw",
            "uv",
            "uv2",
            "position2d",
            "particle_uv",
            "matricesIndices",
            "matricesWeights",
            "world0",
            "world1",
            "world2",
            "world3",
            "color",
            "particle_color",
            "particle_texturemask"]; 
            for (var reservedName of reservedNames)
            {
                if(newName == reservedName)
                {
                    return false;
                }
            };
        //}
        return true;
    }

    /**
     * Compile the current node and generate the shader code
     * @param state defines the current compilation state (uniforms, samplers, current string)
     * @param activeBlocks defines the list of active blocks (i.e. blocks to compile)
     * @returns true if already built
     */
    public build(state: NodeMaterialBuildState, activeBlocks: NodeMaterialBlock[]): boolean {
        if (this._buildId === state.sharedData.buildId) {
            return true;
        }

        if (!this.isInput) {
            /** Prepare outputs */
            for (var output of this._outputs) {
                if (!output.associatedVariableName) {
                    output.associatedVariableName = state._getFreeVariableName(output.name);
                }
            }
        }

        // Check if "parent" blocks are compiled
        for (var input of this._inputs) {
            if (!input.connectedPoint) {
                if (!input.isOptional) { // Emit a warning
                    state.sharedData.checks.notConnectedNonOptionalInputs.push(input);
                }
                continue;
            }

            if (this.target !== NodeMaterialBlockTargets.Neutral) {
                if ((input.target & this.target!) === 0) {
                    continue;
                }

                if ((input.target & state.target!) === 0) {
                    continue;
                }
            }

            let block = input.connectedPoint.ownerBlock;
            if (block && block !== this) {
                this._processBuild(block, state, input, activeBlocks);
            }
        }

        if (this._buildId === state.sharedData.buildId) {
            return true; // Need to check again as inputs can be connected multiple time to this endpoint
        }

        // Logs
        if (state.sharedData.verbose) {
            console.log(`${state.target === NodeMaterialBlockTargets.Vertex ? "Vertex shader" : "Fragment shader"}: Building ${this.name} [${this.getClassName()}]`);
        }

        // Checks final outputs
        if (this.isFinalMerger) {
            switch (state.target) {
                case NodeMaterialBlockTargets.Vertex:
                    state.sharedData.checks.emitVertex = true;
                    break;
                case NodeMaterialBlockTargets.Fragment:
                    state.sharedData.checks.emitFragment = true;
                    break;
            }
        }

        if (!this.isInput && state.sharedData.emitComments) {
            state.compilationString += `\r\n//${this.name}\r\n`;
        }

        this._buildBlock(state);

        this._buildId = state.sharedData.buildId;
        this._buildTarget = state.target;

        // Compile connected blocks
        for (var output of this._outputs) {
            if ((output.target & state.target) === 0) {
                continue;
            }

            for (var endpoint of output.endpoints) {
                let block = endpoint.ownerBlock;

                if (block && (block.target & state.target) !== 0 && activeBlocks.indexOf(block) !== -1) {
                    this._processBuild(block, state, endpoint, activeBlocks);
                }
            }
        }
        return false;
    }

    protected _inputRename(name: string) {
        return name;
    }

    protected _outputRename(name: string) {
        return name;
    }

    protected _dumpPropertiesCode() {
        return "";
    }

    /** @hidden */
    public _dumpCode(uniqueNames: string[], alreadyDumped: NodeMaterialBlock[]) {
        alreadyDumped.push(this);

        let codeString: string;

        // Get unique name
        let nameAsVariableName = this.name.replace(/[^A-Za-z_]+/g, "");
        this._codeVariableName = nameAsVariableName || `${this.getClassName()}_${this.uniqueId}`;

        if (uniqueNames.indexOf(this._codeVariableName) !== -1) {
            let index = 0;
            do {
                index++;
                this._codeVariableName = nameAsVariableName + index;
            }
            while (uniqueNames.indexOf(this._codeVariableName) !== -1);
        }

        uniqueNames.push(this._codeVariableName);

        // Declaration
        codeString = `\r\n// ${this.getClassName()}\r\n`;
        if (this.comments) {
            codeString += `// ${this.comments}\r\n`;
        }
        codeString += `var ${this._codeVariableName} = new BABYLON.${this.getClassName()}("${this.name}");\r\n`;

        // Properties
        codeString += this._dumpPropertiesCode();

        // Inputs
        for (var input of this.inputs) {
            if (!input.isConnected) {
                continue;
            }

            var connectedOutput = input.connectedPoint!;
            var connectedBlock = connectedOutput.ownerBlock;

            if (alreadyDumped.indexOf(connectedBlock) === -1) {
                codeString += connectedBlock._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        // Outputs
        for (var output of this.outputs) {
            if (!output.hasEndpoints) {
                continue;
            }

            for (var endpoint of output.endpoints) {
                var connectedBlock = endpoint.ownerBlock;
                if (connectedBlock && alreadyDumped.indexOf(connectedBlock) === -1) {
                    codeString += connectedBlock._dumpCode(uniqueNames, alreadyDumped);
                }
            }
        }

        return codeString;
    }

    /** @hidden */
    public _dumpCodeForOutputConnections(alreadyDumped: NodeMaterialBlock[]) {
        let codeString = "";

        if (alreadyDumped.indexOf(this) !== -1) {
            return codeString;
        }

        alreadyDumped.push(this);

        for (var input of this.inputs) {
            if (!input.isConnected) {
                continue;
            }

            var connectedOutput = input.connectedPoint!;
            var connectedBlock = connectedOutput.ownerBlock;

            codeString += connectedBlock._dumpCodeForOutputConnections(alreadyDumped);
            codeString += `${connectedBlock._codeVariableName}.${connectedBlock._outputRename(connectedOutput.name)}.connectTo(${this._codeVariableName}.${this._inputRename(input.name)});\r\n`;
        }

        return codeString;
    }

    /**
     * Clone the current block to a new identical block
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a copy of the current block
     */
    public clone(scene: Scene, rootUrl: string = "") {
        let serializationObject = this.serialize();

        let blockType = _TypeStore.GetClass(serializationObject.customType);
        if (blockType) {
            let block: NodeMaterialBlock = new blockType();
            block._deserialize(serializationObject, scene, rootUrl);

            return block;
        }

        return null;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        let serializationObject: any = {};
        serializationObject.customType = "BABYLON." + this.getClassName();
        serializationObject.id = this.uniqueId;
        serializationObject.name = this.name;
        serializationObject.comments = this.comments;

        serializationObject.inputs = [];
        serializationObject.outputs = [];

        for (var input of this.inputs) {
            serializationObject.inputs.push(input.serialize());
        }

        for (var output of this.outputs) {
            serializationObject.outputs.push(output.serialize(false));
        }

        return serializationObject;
    }

    /** @hidden */
    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        this.name = serializationObject.name;
        this.comments = serializationObject.comments;
        this._deserializePortDisplayNamesAndExposedOnFrame(serializationObject);
    }

    private _deserializePortDisplayNamesAndExposedOnFrame(serializationObject: any) {
        const serializedInputs = serializationObject.inputs;
        const serializedOutputs = serializationObject.outputs;
        if (serializedInputs) {
            serializedInputs.forEach((port: any, i: number) => {
                if (port.displayName) {
                    this.inputs[i].displayName = port.displayName;
                }
                if (port.isExposedOnFrame) {
                    this.inputs[i].isExposedOnFrame = port.isExposedOnFrame;
                }
            });
        }
        if (serializedOutputs) {
            serializedOutputs.forEach((port: any, i: number) => {
                if (port.displayName) {
                    this.outputs[i].displayName = port.displayName;
                }
                if (port.isExposedOnFrame) {
                    this.outputs[i].isExposedOnFrame = port.isExposedOnFrame;
                }
            });
        }
    }

    /**
     * Release resources
     */
    public dispose() {
        for (var input of this.inputs) {
            input.dispose();
        }

        for (var output of this.outputs) {
            output.dispose();
        }
    }
}