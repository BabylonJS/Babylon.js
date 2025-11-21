import type { Nullable } from "core/types.js";
import { Logger } from "core/Misc/logger.js";

import type { ConnectionPoint } from "../connection/connectionPoint.js";
import type { ShaderBinding } from "../runtime/shaderRuntime.js";
import type { InputBlock } from "../blockFoundation/inputBlock.js";
import type { BaseBlock } from "../blockFoundation/baseBlock.js";
import { SmartFilter } from "../smartFilter.js";
import { ConnectionPointType } from "../connection/connectionPointType.js";
import { ShaderBlock } from "../blockFoundation/shaderBlock.js";
import { IsTextureInputBlock } from "../blockFoundation/inputBlock.js";
import { OptimizedShaderBlock } from "./optimizedShaderBlock.js";
import { AutoDisableMainInputColorName, DecorateChar, DecorateSymbol, GetShaderFragmentCode, type ShaderProgram, UndecorateSymbol } from "../utils/shaderCodeUtils.js";
import { DependencyGraph } from "./dependencyGraph.js";
import { DisableableShaderBlock, BlockDisableStrategy } from "../blockFoundation/disableableShaderBlock.js";
import { TextureOptionsMatch, type OutputTextureOptions } from "../blockFoundation/textureOptions.js";

const GetDefineRegEx = /^\S*#define\s+(\w+).*$/; // Matches a #define statement line, capturing its decorated or undecorated name
const ShowDebugData = false;

type Rename = {
    from: string;
    to: string;
};

type RenameWork = {
    symbolRenames: Rename[];
    samplerRenames: Rename[];
    sampleToFunctionCallSwaps: Rename[];
    samplersToApplyAutoTo: string[];
};

/**
 * @internal
 */
type RemappedSymbol = {
    /**
     * The type of the symbol.
     */
    type: "uniform" | "const" | "sampler" | "function" | "define";

    /**
     * The name of the symbol.
     */
    name: string;

    /**
     * The name of the symbol after it has been remapped.
     */
    remappedName: string;

    /**
     * For "function", this is the parameter list to differentiate between overloads.
     */
    params?: string;

    /**
     * The declaration of the symbol. For "function" it is the function code.
     */
    declaration: string;

    /**
     * The ShaderBlock(s) that owns the symbol.
     */
    owners: ShaderBlock[];

    /**
     * The InputBlock that owns the texture. Only used for type="sampler".
     */
    inputBlock: InputBlock<ConnectionPointType.Texture> | undefined;
};

/**
 * @internal
 */
export type StackItem = {
    /**
     * The connection points to which to connect the output of the optimized block, once the optimized block has been created.
     */
    inputsToConnectTo: ConnectionPoint[];

    /**
     * The connection point to process.
     */
    outputConnectionPoint: ConnectionPoint;
};

/**
 * Options for the smart filter optimizer.
 */
export interface ISmartFilterOptimizerOptions {
    /**
     * The maximum number of samplers allowed in the fragment shader. Default: 8
     */
    maxSamplersInFragmentShader?: number;

    /**
     * If true, the optimizer will remove the disabled blocks from the optimized smart filter. Default: false
     * It allows more aggressive optimizations, but removed blocks will no longer be available in the optimized smart filter.
     */
    removeDisabledBlocks?: boolean;
}

/**
 * Optimizes a smart filter by aggregating blocks whenever possible, to reduce the number of draw calls.
 */
export class SmartFilterOptimizer {
    private _sourceSmartFilter: SmartFilter;
    private _options: ISmartFilterOptimizerOptions;
    private _blockStack: StackItem[] = [];
    private _blockToStackItem: Map<BaseBlock, StackItem> = new Map();
    private _savedBlockStack: StackItem[] = [];
    private _savedBlockToStackItem: Map<BaseBlock, StackItem> = new Map();

    private _symbolOccurrences: { [name: string]: number } = {};
    private _remappedSymbols: Array<RemappedSymbol> = [];
    private _blockToMainFunctionName: Map<BaseBlock, string> = new Map();
    private _mainFunctionNameToCode: Map<string, string> = new Map();
    private _dependencyGraph: DependencyGraph<string> = new DependencyGraph<string>();
    private _vertexShaderCode: string | undefined;
    private _currentOutputTextureOptions: OutputTextureOptions | undefined;
    private _forceUnoptimized: boolean = false;

    /**
     * Creates a new smart filter optimizer
     * @param smartFilter - The smart filter to optimize
     * @param options - Options for the optimizer
     */
    constructor(smartFilter: SmartFilter, options?: ISmartFilterOptimizerOptions) {
        this._sourceSmartFilter = smartFilter;
        this._options = {
            maxSamplersInFragmentShader: 8,
            ...options,
        };
    }

    /**
     * Optimizes the smart filter by aggregating blocks whenever possible, to lower the number of rendering passes
     * @returns The optimized smart filter, or null if the optimization failed
     */
    public optimize(): Nullable<SmartFilter> {
        this._blockStack = [];
        this._blockToStackItem = new Map();

        let newSmartFilter: Nullable<SmartFilter> = null;

        this._sourceSmartFilter._workWithAggregateFreeGraph(() => {
            if (this._sourceSmartFilter.output.connectedTo && !IsTextureInputBlock(this._sourceSmartFilter.output.connectedTo.ownerBlock)) {
                const connectionsToReconnect: [ConnectionPoint, ConnectionPoint][] = [];

                if (this._options.removeDisabledBlocks) {
                    // Need to propagate runtime data to ensure we can tell if a block is disabled
                    this._sourceSmartFilter.output.ownerBlock.propagateRuntimeData();

                    const alreadyVisitedBlocks = new Set<BaseBlock>();
                    this._disconnectDisabledBlocks(this._sourceSmartFilter.output.connectedTo.ownerBlock, alreadyVisitedBlocks, connectionsToReconnect);
                }

                newSmartFilter = new SmartFilter(this._sourceSmartFilter.name + " - optimized");

                // We must recheck isTextureInputBlock because all shader blocks may have been disconnected by the previous code
                if (!IsTextureInputBlock(this._sourceSmartFilter.output.connectedTo.ownerBlock)) {
                    // Make sure all the connections in the graph have a runtimeData associated to them
                    // Note that the value of the runtimeData may not be set yet, we just need the objects to be created and propagated correctly
                    this._sourceSmartFilter.output.ownerBlock.prepareForRuntime();
                    this._sourceSmartFilter.output.ownerBlock.propagateRuntimeData();

                    const item: StackItem = {
                        inputsToConnectTo: [newSmartFilter.output],
                        outputConnectionPoint: this._sourceSmartFilter.output.connectedTo,
                    };

                    this._blockStack.push(item);
                    this._blockToStackItem.set(item.outputConnectionPoint.ownerBlock, item);

                    while (this._blockStack.length > 0) {
                        const { inputsToConnectTo, outputConnectionPoint } = this._blockStack.pop()!;

                        const newBlock = this._processBlock(newSmartFilter, outputConnectionPoint);

                        if (newBlock) {
                            for (const inputToConnectTo of inputsToConnectTo) {
                                inputToConnectTo.connectTo(newBlock.output);
                            }
                        }
                    }
                } else {
                    newSmartFilter.output.connectTo(this._sourceSmartFilter.output.connectedTo);
                }

                if (this._options.removeDisabledBlocks) {
                    // We must reconnect the connections that were reconnected differently by the disconnect process, so that the original graph is left unmodified
                    for (const [input, connectedTo] of connectionsToReconnect) {
                        input.connectTo(connectedTo);
                    }
                }
            }
        });

        return newSmartFilter;
    }

    private _disconnectDisabledBlocks(block: BaseBlock, alreadyVisitedBlocks: Set<BaseBlock>, inputsToReconnect: [ConnectionPoint, ConnectionPoint][]) {
        if (alreadyVisitedBlocks.has(block)) {
            return;
        }

        alreadyVisitedBlocks.add(block);

        for (const input of block.inputs) {
            if (!input.connectedTo || input.type !== ConnectionPointType.Texture) {
                continue;
            }

            this._disconnectDisabledBlocks(input.connectedTo.ownerBlock, alreadyVisitedBlocks, inputsToReconnect);
        }

        if (block instanceof DisableableShaderBlock && block.disabled.runtimeData.value) {
            block.disconnectFromGraph(inputsToReconnect);
        }
    }

    private _initialize() {
        this._symbolOccurrences = {};
        this._remappedSymbols = [];
        this._blockToMainFunctionName = new Map();
        this._mainFunctionNameToCode = new Map();
        this._dependencyGraph = new DependencyGraph();
        this._vertexShaderCode = undefined;
        this._currentOutputTextureOptions = undefined;
        this._forceUnoptimized = false;
    }

    private _makeSymbolUnique(symbolName: string): string {
        let newVarName = symbolName;
        if (!this._symbolOccurrences[symbolName]) {
            this._symbolOccurrences[symbolName] = 1;
        } else {
            this._symbolOccurrences[symbolName]++;
            newVarName += "_" + this._symbolOccurrences[symbolName];
        }

        return newVarName;
    }

    private _processDefines(block: ShaderBlock, renameWork: RenameWork) {
        const defines = block.getShaderProgram().fragment.defines;
        if (!defines) {
            return;
        }

        for (const define of defines) {
            const match = define.match(GetDefineRegEx);
            const defName = match?.[1];

            if (!match || !defName) {
                continue;
            }

            // See if we have already processed this define for this block type
            const existingRemapped = this._remappedSymbols.find((s) => s.type === "define" && s.name === defName && s.owners[0] && s.owners[0].blockType === block.blockType);

            let newDefName: string;
            if (existingRemapped) {
                newDefName = existingRemapped.remappedName;
            } else {
                // Add the new define to the remapped symbols list
                newDefName = DecorateSymbol(this._makeSymbolUnique(UndecorateSymbol(defName)));

                this._remappedSymbols.push({
                    type: "define",
                    name: defName,
                    remappedName: newDefName,
                    declaration: define.replace(defName, newDefName), // No need to reconstruct the declaration
                    owners: [block],
                    inputBlock: undefined,
                });
            }

            // Note the rename to be used later in all the functions (main and helper)
            renameWork.symbolRenames.push({
                from: defName,
                to: newDefName,
            });
        }
    }

    /**
     * Processes each helper function (any function that's not the main function), adding those to emit in the final
     * block to _remappedSymbols and noting any necessary renames in renameWork. If a helper does not access any
     * uniforms, it only needs to be emitted once regardless of how many instances of the block that define it are
     * folded into the final optimized block.
     * NOTE: so this function can know about the uniforms to test for them, it must be called after _processVariables.
     * @param block - The block we are processing
     * @param renameWork - The list of rename work to add to as needed
     * @param samplerList - The list of sampler names
     */
    private _processHelperFunctions(block: ShaderBlock, renameWork: RenameWork, samplerList: string[]): void {
        const functions = block.getShaderProgram().fragment.functions;

        if (functions.length === 1) {
            // There's only the main function, so we don't need to do anything
            return;
        }

        for (const func of functions) {
            let funcName = func.name;

            if (funcName === block.getShaderProgram().fragment.mainFunctionName) {
                continue;
            }

            funcName = UndecorateSymbol(funcName);

            // Test to see if this function accesses any uniforms
            let uniformsAccessed: string[] = [];
            for (const sampler of samplerList) {
                // Use word boundary check to ensure the sampler name is not part of another variable name
                const regex = new RegExp(`(?<!\\w)${sampler}(?!\\w)`);
                if (regex.test(func.code)) {
                    uniformsAccessed.push(sampler);
                }
            }
            for (const remappedSymbol of this._remappedSymbols) {
                if (
                    remappedSymbol.type === "uniform" &&
                    remappedSymbol.owners[0] &&
                    remappedSymbol.owners[0].blockType === block.blockType &&
                    func.code.includes(remappedSymbol.remappedName)
                ) {
                    uniformsAccessed.push(remappedSymbol.remappedName);
                }
            }

            // Strip out any matches which are actually function params
            const functionParams = func.params ? func.params.split(",").map((p) => p.trim().split(" ")[1]) : [];
            uniformsAccessed = uniformsAccessed.filter((u) => !functionParams.includes(u));

            // If it accessed any uniforms, throw an error
            if (uniformsAccessed.length > 0) {
                uniformsAccessed = uniformsAccessed.map((u) => (u[0] === DecorateChar ? UndecorateSymbol(u) : u));
                throw new Error(
                    `Helper function ${funcName} in blockType ${block.blockType} accesses uniform(s) ${uniformsAccessed.join(", ")} which is not supported. Pass them in instead.`
                );
            }

            // Look to see if we have an exact match including parameters of this function in the list of remapped symbols
            const existingFunctionExactOverload = this._remappedSymbols.find(
                (s) => s.type === "function" && s.name === funcName && s.params === func.params && s.owners[0] && s.owners[0].blockType === block.blockType
            );

            // Look to see if we already have this function in the list of remapped symbols, regardless of parameters
            const existingFunction = this._remappedSymbols.find((s) => s.type === "function" && s.name === funcName && s.owners[0] && s.owners[0].blockType === block.blockType);

            // Get or create the remapped name, ignoring the parameter list
            let remappedName = existingFunction?.remappedName;
            let createdNewName = false;
            if (!remappedName) {
                remappedName = DecorateSymbol(this._makeSymbolUnique(funcName));
                createdNewName = true;
                // Since we've created a new name add it to the list of symbol renames
                renameWork.symbolRenames.push({
                    from: DecorateSymbol(funcName),
                    to: remappedName,
                });
            }

            // If we created a new name, or if we didn't but this exact overload wasn't found,
            // add it to the list of remapped symbols so it'll be emitted in the final shader.
            if (createdNewName || !existingFunctionExactOverload) {
                this._remappedSymbols.push({
                    type: "function",
                    name: funcName,
                    remappedName,
                    params: func.params,
                    declaration: func.code,
                    owners: [block],
                    inputBlock: undefined,
                });
            }
        }
    }

    private _processVariables(
        block: ShaderBlock,
        renameWork: RenameWork,
        varDecl: "const" | "uniform",
        declarations?: string,
        hasValue = false,
        forceSingleInstance = false
    ): Array<string> {
        if (!declarations) {
            return [];
        }

        let rex = `${varDecl}\\s+(\\S+)\\s+${DecorateChar}(\\w+)${DecorateChar}\\s*`;
        if (hasValue) {
            rex += "=\\s*(.+);";
        } else {
            rex += ";";
        }

        const samplerList = [];
        const rx = new RegExp(rex, "g");

        let match = rx.exec(declarations);
        while (match !== null) {
            const singleInstance = forceSingleInstance || varDecl === "const";
            const varType = match[1]!;
            const varName = match[2]!;
            const varValue = hasValue ? match[3]! : null;

            let newVarName: Nullable<string> = null;

            if (varType === "sampler2D") {
                samplerList.push(DecorateSymbol(varName));
            } else {
                const existingRemapped = this._remappedSymbols.find((s) => s.type === varDecl && s.name === varName && s.owners[0] && s.owners[0].blockType === block.blockType);
                if (existingRemapped && singleInstance) {
                    newVarName = existingRemapped.remappedName;
                    if (varDecl === "uniform") {
                        existingRemapped.owners.push(block);
                    }
                } else {
                    newVarName = DecorateSymbol(this._makeSymbolUnique(varName));

                    this._remappedSymbols.push({
                        type: varDecl,
                        name: varName,
                        remappedName: newVarName,
                        declaration: `${varDecl} ${varType} ${newVarName}${hasValue ? " = " + varValue : ""};`,
                        owners: [block],
                        inputBlock: undefined,
                    });
                }
            }

            if (newVarName) {
                renameWork.symbolRenames.push({
                    from: DecorateSymbol(varName),
                    to: newVarName,
                });
            }

            match = rx.exec(declarations);
        }

        return samplerList;
    }

    private _processSampleTexture(
        block: ShaderBlock,
        renameWork: RenameWork,
        sampler: string,
        samplers: string[],
        inputTextureBlock?: InputBlock<ConnectionPointType.Texture>
    ): string {
        let newSamplerName = sampler;

        const existingRemapped = this._remappedSymbols.find((s) => s.type === "sampler" && s.inputBlock && s.inputBlock === inputTextureBlock);
        if (existingRemapped) {
            // The texture is shared by multiple blocks. We must reuse the same sampler name
            newSamplerName = existingRemapped.remappedName;
        } else {
            newSamplerName = DecorateSymbol(this._makeSymbolUnique(newSamplerName));

            this._remappedSymbols.push({
                type: "sampler",
                name: sampler,
                remappedName: newSamplerName,
                declaration: `uniform sampler2D ${newSamplerName};`,
                owners: [block],
                inputBlock: inputTextureBlock,
            });
        }

        if (samplers.indexOf(newSamplerName) === -1) {
            samplers.push(newSamplerName);
        }

        renameWork.samplerRenames.push({
            from: sampler,
            to: newSamplerName,
        });

        return UndecorateSymbol(newSamplerName);
    }

    private _canBeOptimized(block: BaseBlock): boolean {
        if (block.disableOptimization) {
            return false;
        }

        if (block instanceof ShaderBlock) {
            if (block.getShaderProgram().vertex !== this._vertexShaderCode) {
                return false;
            }

            if (!TextureOptionsMatch(block.outputTextureOptions, this._currentOutputTextureOptions)) {
                return false;
            }
        }

        return true;
    }

    // Processes a block given one of its output connection point
    // Returns the name of the main function in the shader code
    private _optimizeBlock(optimizedBlock: OptimizedShaderBlock, outputConnectionPoint: ConnectionPoint, samplers: string[]): string {
        const block = outputConnectionPoint.ownerBlock;

        if (!(block instanceof ShaderBlock)) {
            throw `Unhandled block type! blockType=${block.blockType}`;
        }

        if (this._currentOutputTextureOptions === undefined) {
            this._currentOutputTextureOptions = block.outputTextureOptions;
        }

        const shaderProgram = block.getShaderProgram();
        if (!shaderProgram) {
            throw new Error(`Shader program not found for block "${block.name}"!`);
        }

        this._vertexShaderCode = this._vertexShaderCode ?? shaderProgram.vertex;

        // The operations we collect which we will apply to all functions of this block later
        const renameWork: RenameWork = {
            symbolRenames: [],
            samplerRenames: [],
            sampleToFunctionCallSwaps: [],
            samplersToApplyAutoTo: [],
        };

        // Generates a unique name for the fragment main function (if not already generated)
        const shaderFuncName = shaderProgram.fragment.mainFunctionName;

        let newShaderFuncName = this._blockToMainFunctionName.get(block);

        if (!newShaderFuncName) {
            newShaderFuncName = UndecorateSymbol(shaderFuncName);
            newShaderFuncName = DecorateSymbol(this._makeSymbolUnique(newShaderFuncName));

            this._blockToMainFunctionName.set(block, newShaderFuncName);
            this._dependencyGraph.addElement(newShaderFuncName);
        }

        // Processes the defines to make them unique
        this._processDefines(block, renameWork);

        // Processes the constants to make them unique
        this._processVariables(block, renameWork, "const", shaderProgram.fragment.const, true);

        // Processes the uniform inputs to make them unique. Also extract the list of samplers
        let samplerList: string[] = [];
        samplerList = this._processVariables(block, renameWork, "uniform", shaderProgram.fragment.uniform, false);

        let additionalSamplers = [];
        additionalSamplers = this._processVariables(block, renameWork, "uniform", shaderProgram.fragment.uniformSingle, false, true);

        samplerList.push(...additionalSamplers);

        // Processes the functions other than the main function - must be done after _processVariables()
        this._processHelperFunctions(block, renameWork, samplerList);

        // Processes the texture inputs
        for (const sampler of samplerList) {
            const samplerName = UndecorateSymbol(sampler);

            const input = block.findInput(samplerName);
            if (!input) {
                // No connection point found corresponding to this texture: it must be a texture used internally by the filter (here we are assuming that the shader code is not bugged!)
                this._processSampleTexture(block, renameWork, samplerName, samplers);
                continue;
            }

            // input found. Is it connected?
            if (!input.connectedTo) {
                throw `The connection point corresponding to the input named "${samplerName}" in block named "${block.name}" is not connected!`;
            }

            // If we are using the AutoSample strategy, we must preprocess the code that samples the texture
            if (block instanceof DisableableShaderBlock && block.blockDisableStrategy === BlockDisableStrategy.AutoSample) {
                renameWork.samplersToApplyAutoTo.push(sampler);
            }

            const parentBlock = input.connectedTo.ownerBlock;

            if (IsTextureInputBlock(parentBlock)) {
                // input is connected to an InputBlock of type "Texture": we must directly sample a texture
                this._processSampleTexture(block, renameWork, samplerName, samplers, parentBlock);
            } else if (this._forceUnoptimized || !this._canBeOptimized(parentBlock)) {
                // the block connected to this input cannot be optimized: we must directly sample its output texture
                const uniqueSamplerName = this._processSampleTexture(block, renameWork, samplerName, samplers);
                let stackItem = this._blockToStackItem.get(parentBlock);
                if (!stackItem) {
                    stackItem = {
                        inputsToConnectTo: [],
                        outputConnectionPoint: input.connectedTo,
                    };
                    this._blockStack.push(stackItem);
                    this._blockToStackItem.set(parentBlock, stackItem);
                }
                // creates a new input connection point for the texture in the optimized block
                const connectionPoint = optimizedBlock._registerInput(uniqueSamplerName, ConnectionPointType.Texture);
                stackItem.inputsToConnectTo.push(connectionPoint);
            } else {
                let parentFuncName: string;

                if (this._blockToMainFunctionName.has(parentBlock)) {
                    // The parent block has already been processed. We can directly use the main function name
                    parentFuncName = this._blockToMainFunctionName.get(parentBlock)!;
                } else {
                    // Recursively processes the block connected to this input to get the main function name of the parent block
                    parentFuncName = this._optimizeBlock(optimizedBlock, input.connectedTo, samplers);
                    this._dependencyGraph.addDependency(newShaderFuncName, parentFuncName);
                }

                // The texture samplerName is not used anymore by the block, as it is replaced by a call to the main function of the parent block
                // We remap it to an non existent sampler name, because the code that binds the texture still exists in the ShaderBinding.bind function.
                // We don't want this code to have any effect, as it could overwrite (and remove) the texture binding of another block using this same sampler name!
                this._remappedSymbols.push({
                    type: "sampler",
                    name: samplerName,
                    remappedName: "L(° O °L)",
                    declaration: ``,
                    owners: [block],
                    inputBlock: undefined,
                });

                // We have to replace the call(s) to __sampleTexture by a call to the main function of the parent block
                renameWork.sampleToFunctionCallSwaps.push({ from: DecorateSymbol(samplerName), to: parentFuncName });
            }
        }

        this._processAllFunctions(block, shaderProgram, renameWork, newShaderFuncName);

        return newShaderFuncName;
    }

    /**
     * Replaces calls to __sampleTexture(foo, uv); with calls to a function bar(uv); for chaining optimized blocks together
     * @param code - The code to process
     * @param samplerName - The old name of the sampler
     * @param functionName - The name of the function to call instead
     * @returns The updated code
     */
    private _replaceSampleTextureWithFunctionCall(code: string, samplerName: string, functionName: string): string {
        const rx = new RegExp(`__sampleTexture\\s*\\(\\s*${samplerName}\\s*,\\s*(.*?)\\s*\\)`);

        let match = rx.exec(code);
        while (match !== null) {
            const uv = match[1];

            code = code.substring(0, match.index) + `${functionName}(${uv})` + code.substring(match.index + match[0]!.length);
            match = rx.exec(code);
        }

        return code;
    }

    private _replaceSampleTextureWithTexture2DCall(code: string, sampler: string, newSamplerName: string): string {
        const rx = new RegExp(`__sampleTexture\\s*\\(\\s*${DecorateChar}${sampler}${DecorateChar}\\s*,\\s*(.*?)\\s*\\)`);
        let match = rx.exec(code);
        while (match !== null) {
            const uv = match[1]!;

            code = code.substring(0, match.index) + `texture2D(${newSamplerName}, ${uv})` + code.substring(match.index + match[0]!.length);

            match = rx.exec(code);
        }
        return code;
    }

    /**
     * Processes all the functions, both main and helper functions, applying the renames and changes which have been collected
     * @param block - The original block we are optimizing
     * @param shaderProgram - The shader of the block we are optimizing
     * @param renameWork - The rename work to apply
     * @param newMainFunctionName - The new name for the main function
     */
    private _processAllFunctions(block: ShaderBlock, shaderProgram: ShaderProgram, renameWork: RenameWork, newMainFunctionName: string) {
        // Get the main function and process it
        let declarationsAndMainFunction = GetShaderFragmentCode(shaderProgram, true);
        declarationsAndMainFunction = this._processMainFunction(declarationsAndMainFunction, shaderProgram, newMainFunctionName);
        declarationsAndMainFunction = this._processFunction(block, declarationsAndMainFunction, renameWork);
        this._mainFunctionNameToCode.set(newMainFunctionName, declarationsAndMainFunction);

        // Now process all the helper functions
        this._remappedSymbols.forEach((remappedSymbol) => {
            if (remappedSymbol.type === "function" && remappedSymbol.owners[0] && remappedSymbol.owners[0] === block) {
                remappedSymbol.declaration = this._processFunction(block, remappedSymbol.declaration, renameWork);
            }
        });
    }

    /**
     * Applies all required changes specific to just the main function
     * @param code - The code of the main function
     * @param shaderProgram - The shader program containing the main function
     * @param newMainFunctionName - The new name for the main function
     * @returns The updated main function code
     */
    private _processMainFunction(code: string, shaderProgram: ShaderProgram, newMainFunctionName: string): string {
        // Replaces the main function name by the new one
        code = code.replace(shaderProgram.fragment.mainFunctionName, newMainFunctionName);

        // Removes the vUV declaration if it exists
        code = code.replace(/varying\s+vec2\s+vUV\s*;/g, "");

        return code;
    }

    /**
     * Applies all required changes to a function (main or helper)
     * @param block - The original block we are optimizing
     * @param code - The code of the function
     * @param renameWork - The rename work to apply
     * @returns The updated function code
     */
    private _processFunction(block: ShaderBlock, code: string, renameWork: RenameWork): string {
        // Replaces the texture2D calls by __sampleTexture for easier processing
        code = code.replace(/(?<!\w)texture2D\s*\(/g, "__sampleTexture(");

        for (const sampler of renameWork.samplersToApplyAutoTo) {
            code = this._applyAutoSampleStrategy(code, sampler);
        }

        for (const rename of renameWork.symbolRenames) {
            code = code.replace(new RegExp(`(?<!\\w)${rename.from}(?!\\w)`, "g"), rename.to);
        }

        for (const swap of renameWork.sampleToFunctionCallSwaps) {
            code = this._replaceSampleTextureWithFunctionCall(code, swap.from, swap.to);
        }

        for (const rename of renameWork.samplerRenames) {
            code = this._replaceSampleTextureWithTexture2DCall(code, rename.from, rename.to);
        }

        // Ensure all __sampleTexture( instances were replaced, and error out if not
        if (code.indexOf("__sampleTexture(") > -1) {
            throw new Error(`Could not optimize blockType ${block.blockType} because a texture2D() sampled something other than a uniform, which is unsupported`);
        }

        return code;
    }

    private _saveBlockStackState(): void {
        this._savedBlockStack = this._blockStack.slice();
        this._savedBlockToStackItem = new Map();

        for (const [key, value] of this._blockToStackItem) {
            value.inputsToConnectTo = value.inputsToConnectTo.slice();
            this._savedBlockToStackItem.set(key, value);
        }
    }

    private _restoreBlockStackState(): void {
        this._blockStack.length = 0;
        this._blockStack.push(...this._savedBlockStack);

        this._blockToStackItem.clear();
        for (const [key, value] of this._savedBlockToStackItem) {
            this._blockToStackItem.set(key, value);
        }
    }

    private _processBlock(newSmartFilter: SmartFilter, outputConnectionPoint: ConnectionPoint): Nullable<ShaderBlock> {
        this._saveBlockStackState();
        this._initialize();

        let optimizedBlock = new OptimizedShaderBlock(newSmartFilter, "optimized");

        const samplers: string[] = [];
        let mainFuncName = this._optimizeBlock(optimizedBlock, outputConnectionPoint, samplers);

        if (samplers.length > this._options.maxSamplersInFragmentShader!) {
            // Too many samplers for the optimized block.
            // We must force the unoptimized mode and regenerate the block, which will be unoptimized this time
            newSmartFilter.removeBlock(optimizedBlock);

            this._initialize();

            optimizedBlock = new OptimizedShaderBlock(newSmartFilter, "unoptimized");

            this._forceUnoptimized = true;
            samplers.length = 0;

            this._restoreBlockStackState();

            mainFuncName = this._optimizeBlock(optimizedBlock, outputConnectionPoint, samplers);
        }

        // Collects all the shader code
        let code = "";
        this._dependencyGraph.walk((element: string) => {
            code += this._mainFunctionNameToCode.get(element)! + "\n";
        });

        // Sets the remapping of the shader variables
        const blockOwnerToShaderBinding = new Map<ShaderBlock, ShaderBinding>();

        const codeDefines = [];
        let codeUniforms = "";
        let codeConsts = "";
        let codeHelperFunctions = "";
        let codeHelperFunctionPrototypes = "";

        for (const s of this._remappedSymbols) {
            switch (s.type) {
                case "define":
                    codeDefines.push(s.declaration);
                    break;
                case "const":
                    codeConsts += s.declaration + "\n";
                    break;
                case "uniform":
                case "sampler":
                    codeUniforms += s.declaration + "\n";
                    break;
                case "function":
                    codeHelperFunctionPrototypes += s.declaration.replace(/{[\s\S]*$/, ";\n");
                    codeHelperFunctions += s.declaration + "\n";
                    break;
            }

            for (const block of s.owners) {
                let shaderBinding = blockOwnerToShaderBinding.get(block);
                if (!shaderBinding) {
                    shaderBinding = block.getShaderBinding();
                    blockOwnerToShaderBinding.set(block, shaderBinding);
                }

                switch (s.type) {
                    case "uniform":
                    case "sampler":
                        shaderBinding.addShaderVariableRemapping(DecorateSymbol(s.name), s.remappedName);
                        break;
                }
            }
        }

        // Builds and sets the final shader code
        code = codeHelperFunctionPrototypes + code + codeHelperFunctions;
        if (ShowDebugData) {
            code = code.replace(/^ {16}/gm, "");
            code = code!.replace(/\r/g, "");
            code = code!.replace(/\n(\n)*/g, "\n");

            Logger.Log(`=================== BLOCK (forceUnoptimized=${this._forceUnoptimized}) ===================`);
            Logger.Log(codeDefines.join("\n"));
            Logger.Log(codeUniforms);
            Logger.Log(codeConsts);
            Logger.Log(code);
            Logger.Log(`remappedSymbols=${this._remappedSymbols}`);
            Logger.Log(`samplers=${samplers}`);
        }

        optimizedBlock.setShaderProgram({
            vertex: this._vertexShaderCode,
            fragment: {
                defines: codeDefines,
                const: codeConsts,
                uniform: codeUniforms,
                mainFunctionName: mainFuncName,
                functions: [
                    {
                        name: mainFuncName,
                        params: "",
                        code,
                    },
                ],
            },
        });

        if (this._currentOutputTextureOptions !== undefined) {
            optimizedBlock.outputTextureOptions = this._currentOutputTextureOptions;
        }

        optimizedBlock.setShaderBindings(Array.from(blockOwnerToShaderBinding.values()));

        return optimizedBlock;
    }

    /**
     * If this block used DisableStrategy.AutoSample, find all the __sampleTexture calls which just pass the vUV,
     * skip the first one, and for all others replace with the local variable created by the DisableStrategy.AutoSample
     *
     * @param code - The shader code to process
     * @param sampler - The name of the sampler
     *
     * @returns The processed code
     */
    private _applyAutoSampleStrategy(code: string, sampler: string): string {
        let isFirstMatch = true;
        const rx = new RegExp(`__sampleTexture\\s*\\(\\s*${sampler}\\s*,\\s*vUV\\s*\\)`, "g");
        return code.replace(rx, (match) => {
            if (isFirstMatch) {
                isFirstMatch = false;
                return match;
            }
            return DecorateSymbol(AutoDisableMainInputColorName);
        });
    }
}
