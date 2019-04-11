import { Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { Matrix, Vector3, Vector2, Color3, Color4, Vector4 } from "../Maths/math";
import { Constants } from "../Engines/constants";
import { DomManagement } from "../Misc/domManagement";
import { Logger } from "../Misc/logger";
import { IDisposable } from '../scene';
import { IPipelineContext } from '../Engines/IPipelineContext';
import { DataBuffer } from '../Meshes/dataBuffer';

declare type Engine = import("../Engines/engine").Engine;
declare type InternalTexture = import("../Materials/Textures/internalTexture").InternalTexture;
declare type BaseTexture = import("../Materials/Textures/baseTexture").BaseTexture;
declare type RenderTargetTexture = import("../Materials/Textures/renderTargetTexture").RenderTargetTexture;
declare type PostProcess = import("../PostProcesses/postProcess").PostProcess;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;
/**
 * EffectFallbacks can be used to add fallbacks (properties to disable) to certain properties when desired to improve performance.
 * (Eg. Start at high quality with reflection and fog, if fps is low, remove reflection, if still low remove fog)
 */
export class EffectFallbacks {
    private _defines: { [key: string]: Array<String> } = {};

    private _currentRank = 32;
    private _maxRank = -1;

    private _mesh: Nullable<AbstractMesh>;

    /**
     * Removes the fallback from the bound mesh.
     */
    public unBindMesh() {
        this._mesh = null;
    }

    /**
     * Adds a fallback on the specified property.
     * @param rank The rank of the fallback (Lower ranks will be fallbacked to first)
     * @param define The name of the define in the shader
     */
    public addFallback(rank: number, define: string): void {
        if (!this._defines[rank]) {
            if (rank < this._currentRank) {
                this._currentRank = rank;
            }

            if (rank > this._maxRank) {
                this._maxRank = rank;
            }

            this._defines[rank] = new Array<String>();
        }

        this._defines[rank].push(define);
    }

    /**
     * Sets the mesh to use CPU skinning when needing to fallback.
     * @param rank The rank of the fallback (Lower ranks will be fallbacked to first)
     * @param mesh The mesh to use the fallbacks.
     */
    public addCPUSkinningFallback(rank: number, mesh: AbstractMesh) {
        this._mesh = mesh;

        if (rank < this._currentRank) {
            this._currentRank = rank;
        }
        if (rank > this._maxRank) {
            this._maxRank = rank;
        }
    }

    /**
     * Checks to see if more fallbacks are still availible.
     */
    public get isMoreFallbacks(): boolean {
        return this._currentRank <= this._maxRank;
    }

    /**
     * Removes the defines that shoould be removed when falling back.
     * @param currentDefines defines the current define statements for the shader.
     * @param effect defines the current effect we try to compile
     * @returns The resulting defines with defines of the current rank removed.
     */
    public reduce(currentDefines: string, effect: Effect): string {
        // First we try to switch to CPU skinning
        if (this._mesh && this._mesh.computeBonesUsingShaders && this._mesh.numBoneInfluencers > 0 && this._mesh.material) {
            this._mesh.computeBonesUsingShaders = false;
            currentDefines = currentDefines.replace("#define NUM_BONE_INFLUENCERS " + this._mesh.numBoneInfluencers, "#define NUM_BONE_INFLUENCERS 0");
            effect._bonesComputationForcedToCPU = true;

            var scene = this._mesh.getScene();
            for (var index = 0; index < scene.meshes.length; index++) {
                var otherMesh = scene.meshes[index];

                if (!otherMesh.material) {
                    continue;
                }

                if (!otherMesh.computeBonesUsingShaders || otherMesh.numBoneInfluencers === 0) {
                    continue;
                }

                if (otherMesh.material.getEffect() === effect) {
                    otherMesh.computeBonesUsingShaders = false;
                } else if (otherMesh.subMeshes) {
                    for (var subMesh of otherMesh.subMeshes) {
                        let subMeshEffect = subMesh.effect;

                        if (subMeshEffect === effect) {
                            otherMesh.computeBonesUsingShaders = false;
                            break;
                        }
                    }
                }
            }
        }
        else {
            var currentFallbacks = this._defines[this._currentRank];
            if (currentFallbacks) {
                for (var index = 0; index < currentFallbacks.length; index++) {
                    currentDefines = currentDefines.replace("#define " + currentFallbacks[index], "");
                }
            }

            this._currentRank++;
        }

        return currentDefines;
    }
}

/**
 * Options to be used when creating an effect.
 */
export class EffectCreationOptions {
    /**
     * Atrributes that will be used in the shader.
     */
    public attributes: string[];
    /**
     * Uniform varible names that will be set in the shader.
     */
    public uniformsNames: string[];
    /**
     * Uniform buffer varible names that will be set in the shader.
     */
    public uniformBuffersNames: string[];
    /**
     * Sampler texture variable names that will be set in the shader.
     */
    public samplers: string[];
    /**
     * Define statements that will be set in the shader.
     */
    public defines: any;
    /**
     * Possible fallbacks for this effect to improve performance when needed.
     */
    public fallbacks: Nullable<EffectFallbacks>;
    /**
     * Callback that will be called when the shader is compiled.
     */
    public onCompiled: Nullable<(effect: Effect) => void>;
    /**
     * Callback that will be called if an error occurs during shader compilation.
     */
    public onError: Nullable<(effect: Effect, errors: string) => void>;
    /**
     * Parameters to be used with Babylons include syntax to iterate over an array (eg. {lights: 10})
     */
    public indexParameters: any;
    /**
     * Max number of lights that can be used in the shader.
     */
    public maxSimultaneousLights: number;
    /**
     * See https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/transformFeedbackVaryings
     */
    public transformFeedbackVaryings: Nullable<string[]>;
}

/**
 * Effect containing vertex and fragment shader that can be executed on an object.
 */
export class Effect implements IDisposable {
    /**
     * Gets or sets the relative url used to load shaders if using the engine in non-minified mode
     */
    public static ShadersRepository = "src/Shaders/";
    /**
     * Name of the effect.
     */
    public name: any;
    /**
     * String container all the define statements that should be set on the shader.
     */
    public defines: string;
    /**
     * Callback that will be called when the shader is compiled.
     */
    public onCompiled: Nullable<(effect: Effect) => void>;
    /**
     * Callback that will be called if an error occurs during shader compilation.
     */
    public onError: Nullable<(effect: Effect, errors: string) => void>;
    /**
     * Callback that will be called when effect is bound.
     */
    public onBind: Nullable<(effect: Effect) => void>;
    /**
     * Unique ID of the effect.
     */
    public uniqueId = 0;
    /**
     * Observable that will be called when the shader is compiled.
     * It is recommended to use executeWhenCompile() or to make sure that scene.isReady() is called to get this observable raised.
     */
    public onCompileObservable = new Observable<Effect>();
    /**
     * Observable that will be called if an error occurs during shader compilation.
     */
    public onErrorObservable = new Observable<Effect>();

    /** @hidden */
    public _onBindObservable: Nullable<Observable<Effect>>;

    /**
     * Observable that will be called when effect is bound.
     */
    public get onBindObservable(): Observable<Effect> {
        if (!this._onBindObservable) {
            this._onBindObservable = new Observable<Effect>();
        }

        return this._onBindObservable;
    }

    /** @hidden */
    public _bonesComputationForcedToCPU = false;

    private static _uniqueIdSeed = 0;
    private _engine: Engine;
    private _uniformBuffersNames: { [key: string]: number } = {};
    private _uniformsNames: string[];
    private _samplerList: string[];
    private _samplers: { [key: string]: number } = {};
    private _isReady = false;
    private _compilationError = "";
    private _attributesNames: string[];
    private _attributes: number[];
    private _uniforms: { [key: string]: Nullable<WebGLUniformLocation> } = {};
    /**
     * Key for the effect.
     * @hidden
     */
    public _key: string;
    private _indexParameters: any;
    private _fallbacks: Nullable<EffectFallbacks>;
    private _vertexSourceCode: string;
    private _fragmentSourceCode: string;
    private _vertexSourceCodeOverride: string;
    private _fragmentSourceCodeOverride: string;
    private _transformFeedbackVaryings: Nullable<string[]>;
    /**
     * Compiled shader to webGL program.
     * @hidden
     */
    public _pipelineContext: IPipelineContext;
    private _valueCache: { [key: string]: any };
    private static _baseCache: { [key: number]: DataBuffer } = {};

    /**
     * Instantiates an effect.
     * An effect can be used to create/manage/execute vertex and fragment shaders.
     * @param baseName Name of the effect.
     * @param attributesNamesOrOptions List of attribute names that will be passed to the shader or set of all options to create the effect.
     * @param uniformsNamesOrEngine List of uniform variable names that will be passed to the shader or the engine that will be used to render effect.
     * @param samplers List of sampler variables that will be passed to the shader.
     * @param engine Engine to be used to render the effect
     * @param defines Define statements to be added to the shader.
     * @param fallbacks Possible fallbacks for this effect to improve performance when needed.
     * @param onCompiled Callback that will be called when the shader is compiled.
     * @param onError Callback that will be called if an error occurs during shader compilation.
     * @param indexParameters Parameters to be used with Babylons include syntax to iterate over an array (eg. {lights: 10})
     */
    constructor(baseName: any, attributesNamesOrOptions: string[] | EffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers: Nullable<string[]> = null, engine?: Engine, defines: Nullable<string> = null,
        fallbacks: Nullable<EffectFallbacks> = null, onCompiled: Nullable<(effect: Effect) => void> = null, onError: Nullable<(effect: Effect, errors: string) => void> = null, indexParameters?: any) {
        this.name = baseName;

        if ((<EffectCreationOptions>attributesNamesOrOptions).attributes) {
            var options = <EffectCreationOptions>attributesNamesOrOptions;
            this._engine = <Engine>uniformsNamesOrEngine;

            this._attributesNames = options.attributes;
            this._uniformsNames = options.uniformsNames.concat(options.samplers);
            this._samplerList = options.samplers.slice();
            this.defines = options.defines;
            this.onError = options.onError;
            this.onCompiled = options.onCompiled;
            this._fallbacks = options.fallbacks;
            this._indexParameters = options.indexParameters;
            this._transformFeedbackVaryings = options.transformFeedbackVaryings;

            if (options.uniformBuffersNames) {
                for (var i = 0; i < options.uniformBuffersNames.length; i++) {
                    this._uniformBuffersNames[options.uniformBuffersNames[i]] = i;
                }
            }
        } else {
            this._engine = <Engine>engine;
            this.defines = (defines == null ? "" : defines);
            this._uniformsNames = (<string[]>uniformsNamesOrEngine).concat(<string[]>samplers);
            this._samplerList = samplers ? <string[]>samplers.slice() : [];
            this._attributesNames = (<string[]>attributesNamesOrOptions);

            this.onError = onError;
            this.onCompiled = onCompiled;

            this._indexParameters = indexParameters;
            this._fallbacks = fallbacks;
        }

        this.uniqueId = Effect._uniqueIdSeed++;

        var vertexSource: any;
        var fragmentSource: any;

        if (baseName.vertexElement) {
            vertexSource = document.getElementById(baseName.vertexElement);

            if (!vertexSource) {
                vertexSource = baseName.vertexElement;
            }
        } else {
            vertexSource = baseName.vertex || baseName;
        }

        if (baseName.fragmentElement) {
            fragmentSource = document.getElementById(baseName.fragmentElement);

            if (!fragmentSource) {
                fragmentSource = baseName.fragmentElement;
            }
        } else {
            fragmentSource = baseName.fragment || baseName;
        }

        this._loadVertexShader(vertexSource, (vertexCode) => {
            this._processIncludes(vertexCode, (vertexCodeWithIncludes) => {
                this._processShaderConversion(vertexCodeWithIncludes, false, (migratedVertexCode) => {
                    this._loadFragmentShader(fragmentSource, (fragmentCode) => {
                        this._processIncludes(fragmentCode, (fragmentCodeWithIncludes) => {
                            this._processShaderConversion(fragmentCodeWithIncludes, true, (migratedFragmentCode) => {
                                if (baseName) {
                                    var vertex = baseName.vertexElement || baseName.vertex || baseName;
                                    var fragment = baseName.fragmentElement || baseName.fragment || baseName;

                                    this._vertexSourceCode = "#define SHADER_NAME vertex:" + vertex + "\n" + migratedVertexCode;
                                    this._fragmentSourceCode = "#define SHADER_NAME fragment:" + fragment + "\n" + migratedFragmentCode;
                                } else {
                                    this._vertexSourceCode = migratedVertexCode;
                                    this._fragmentSourceCode = migratedFragmentCode;
                                }
                                this._prepareEffect();
                            });
                        });
                    });
                });
            });
        });
    }

    /**
     * Unique key for this effect
     */
    public get key(): string {
        return this._key;
    }

    /**
     * If the effect has been compiled and prepared.
     * @returns if the effect is compiled and prepared.
     */
    public isReady(): boolean {
        if (this._isReady) {
            return true;
        }
        return this._pipelineContext.isReady;
    }

    /**
     * The engine the effect was initialized with.
     * @returns the engine.
     */
    public getEngine(): Engine {
        return this._engine;
    }

    /**
     * The pipeline context for this effect
     * @returns the associated pipeline context
     */
    public getPipelineContext(): IPipelineContext {
        return this._pipelineContext;
    }

    /**
     * The set of names of attribute variables for the shader.
     * @returns An array of attribute names.
     */
    public getAttributesNames(): string[] {
        return this._attributesNames;
    }

    /**
     * Returns the attribute at the given index.
     * @param index The index of the attribute.
     * @returns The location of the attribute.
     */
    public getAttributeLocation(index: number): number {
        return this._attributes[index];
    }

    /**
     * Returns the attribute based on the name of the variable.
     * @param name of the attribute to look up.
     * @returns the attribute location.
     */
    public getAttributeLocationByName(name: string): number {
        var index = this._attributesNames.indexOf(name);

        return this._attributes[index];
    }

    /**
     * The number of attributes.
     * @returns the numnber of attributes.
     */
    public getAttributesCount(): number {
        return this._attributes.length;
    }

    /**
     * Gets the index of a uniform variable.
     * @param uniformName of the uniform to look up.
     * @returns the index.
     */
    public getUniformIndex(uniformName: string): number {
        return this._uniformsNames.indexOf(uniformName);
    }

    /**
     * Returns the attribute based on the name of the variable.
     * @param uniformName of the uniform to look up.
     * @returns the location of the uniform.
     */
    public getUniform(uniformName: string): Nullable<WebGLUniformLocation> {
        return this._uniforms[uniformName];
    }

    /**
     * Returns an array of sampler variable names
     * @returns The array of sampler variable neames.
     */
    public getSamplers(): string[] {
        return this._samplerList;
    }

    /**
     * The error from the last compilation.
     * @returns the error string.
     */
    public getCompilationError(): string {
        return this._compilationError;
    }

    /**
     * Adds a callback to the onCompiled observable and call the callback imediatly if already ready.
     * @param func The callback to be used.
     */
    public executeWhenCompiled(func: (effect: Effect) => void): void {
        if (this.isReady()) {
            func(this);
            return;
        }

        this.onCompileObservable.add((effect) => {
            func(effect);
        });

        if (!this._pipelineContext || this._pipelineContext.isAsync) {
            setTimeout(() => {
                this._checkIsReady();
            }, 16);
        }
    }

    private _checkIsReady() {
        if (this.isReady()) {
            return;
        }
        setTimeout(() => {
            this._checkIsReady();
        }, 16);
    }

    /** @hidden */
    public _loadVertexShader(vertex: any, callback: (data: any) => void): void {
        if (DomManagement.IsWindowObjectExist()) {
            // DOM element ?
            if (vertex instanceof HTMLElement) {
                var vertexCode = DomManagement.GetDOMTextContent(vertex);
                callback(vertexCode);
                return;
            }
        }

        // Base64 encoded ?
        if (vertex.substr(0, 7) === "base64:") {
            var vertexBinary = window.atob(vertex.substr(7));
            callback(vertexBinary);
            return;
        }

        // Is in local store ?
        if (Effect.ShadersStore[vertex + "VertexShader"]) {
            callback(Effect.ShadersStore[vertex + "VertexShader"]);
            return;
        }

        var vertexShaderUrl;

        if (vertex[0] === "." || vertex[0] === "/" || vertex.indexOf("http") > -1) {
            vertexShaderUrl = vertex;
        } else {
            vertexShaderUrl = Effect.ShadersRepository + vertex;
        }

        // Vertex shader
        this._engine._loadFile(vertexShaderUrl + ".vertex.fx", callback);
    }

    /** @hidden */
    public _loadFragmentShader(fragment: any, callback: (data: any) => void): void {
        if (DomManagement.IsWindowObjectExist()) {
            // DOM element ?
            if (fragment instanceof HTMLElement) {
                var fragmentCode = DomManagement.GetDOMTextContent(fragment);
                callback(fragmentCode);
                return;
            }
        }

        // Base64 encoded ?
        if (fragment.substr(0, 7) === "base64:") {
            var fragmentBinary = window.atob(fragment.substr(7));
            callback(fragmentBinary);
            return;
        }

        // Is in local store ?
        if (Effect.ShadersStore[fragment + "PixelShader"]) {
            callback(Effect.ShadersStore[fragment + "PixelShader"]);
            return;
        }

        if (Effect.ShadersStore[fragment + "FragmentShader"]) {
            callback(Effect.ShadersStore[fragment + "FragmentShader"]);
            return;
        }

        var fragmentShaderUrl;

        if (fragment[0] === "." || fragment[0] === "/" || fragment.indexOf("http") > -1) {
            fragmentShaderUrl = fragment;
        } else {
            fragmentShaderUrl = Effect.ShadersRepository + fragment;
        }

        // Fragment shader
        this._engine._loadFile(fragmentShaderUrl + ".fragment.fx", callback);
    }

    /** @hidden */
    public _dumpShadersSource(vertexCode: string, fragmentCode: string, defines: string): void {
        // Rebuild shaders source code
        var shaderVersion = (this._engine.webGLVersion > 1) ? "#version 300 es\n#define WEBGL2 \n" : "";
        var prefix = shaderVersion + (defines ? defines + "\n" : "");
        vertexCode = prefix + vertexCode;
        fragmentCode = prefix + fragmentCode;

        // Number lines of shaders source code
        var i = 2;
        var regex = /\n/gm;
        var formattedVertexCode = "\n1\t" + vertexCode.replace(regex, function() { return "\n" + (i++) + "\t"; });
        i = 2;
        var formattedFragmentCode = "\n1\t" + fragmentCode.replace(regex, function() { return "\n" + (i++) + "\t"; });

        // Dump shaders name and formatted source code
        if (this.name.vertexElement) {
            Logger.Error("Vertex shader: " + this.name.vertexElement + formattedVertexCode);
            Logger.Error("Fragment shader: " + this.name.fragmentElement + formattedFragmentCode);
        }
        else if (this.name.vertex) {
            Logger.Error("Vertex shader: " + this.name.vertex + formattedVertexCode);
            Logger.Error("Fragment shader: " + this.name.fragment + formattedFragmentCode);
        }
        else {
            Logger.Error("Vertex shader: " + this.name + formattedVertexCode);
            Logger.Error("Fragment shader: " + this.name + formattedFragmentCode);
        }
    }

    private _processShaderConversion(sourceCode: string, isFragment: boolean, callback: (data: any) => void): void {

        var preparedSourceCode = this._processPrecision(sourceCode);

        if (this._engine.webGLVersion == 1) {
            callback(preparedSourceCode);
            return;
        }

        // Already converted
        if (preparedSourceCode.indexOf("#version 3") !== -1) {
            callback(preparedSourceCode.replace("#version 300 es", ""));
            return;
        }

        var hasDrawBuffersExtension = preparedSourceCode.search(/#extension.+GL_EXT_draw_buffers.+require/) !== -1;

        // Remove extensions
        // #extension GL_OES_standard_derivatives : enable
        // #extension GL_EXT_shader_texture_lod : enable
        // #extension GL_EXT_frag_depth : enable
        // #extension GL_EXT_draw_buffers : require
        var regex = /#extension.+(GL_OVR_multiview|GL_OES_standard_derivatives|GL_EXT_shader_texture_lod|GL_EXT_frag_depth|GL_EXT_draw_buffers).+(enable|require)/g;
        var result = preparedSourceCode.replace(regex, "");

        // Migrate to GLSL v300
        result = result.replace(/varying(?![\n\r])\s/g, isFragment ? "in " : "out ");
        result = result.replace(/attribute[ \t]/g, "in ");
        result = result.replace(/[ \t]attribute/g, " in");

        result = result.replace(/texture2D\s*\(/g, "texture(");
        if (isFragment) {
            result = result.replace(/texture2DLodEXT\s*\(/g, "textureLod(");
            result = result.replace(/textureCubeLodEXT\s*\(/g, "textureLod(");
            result = result.replace(/textureCube\s*\(/g, "texture(");
            result = result.replace(/gl_FragDepthEXT/g, "gl_FragDepth");
            result = result.replace(/gl_FragColor/g, "glFragColor");
            result = result.replace(/gl_FragData/g, "glFragData");
            result = result.replace(/void\s+?main\s*\(/g, (hasDrawBuffersExtension ? "" : "out vec4 glFragColor;\n") + "void main(");
        }

        // Add multiview setup to top of file when defined
        var hasMultiviewExtension = this.defines.indexOf("#define MULTIVIEW\n") !== -1;
        if (hasMultiviewExtension && !isFragment) {
            result = "#extension GL_OVR_multiview : require\nlayout (num_views = 2) in;\n" + result;
        }

        callback(result);
    }

    private _processIncludes(sourceCode: string, callback: (data: any) => void): void {
        var regex = /#include<(.+)>(\((.*)\))*(\[(.*)\])*/g;
        var match = regex.exec(sourceCode);

        var returnValue = new String(sourceCode);

        while (match != null) {
            var includeFile = match[1];

            // Uniform declaration
            if (includeFile.indexOf("__decl__") !== -1) {
                includeFile = includeFile.replace(/__decl__/, "");
                if (this._engine.supportsUniformBuffers) {
                    includeFile = includeFile.replace(/Vertex/, "Ubo");
                    includeFile = includeFile.replace(/Fragment/, "Ubo");
                }
                includeFile = includeFile + "Declaration";
            }

            if (Effect.IncludesShadersStore[includeFile]) {
                // Substitution
                var includeContent = Effect.IncludesShadersStore[includeFile];
                if (match[2]) {
                    var splits = match[3].split(",");

                    for (var index = 0; index < splits.length; index += 2) {
                        var source = new RegExp(splits[index], "g");
                        var dest = splits[index + 1];

                        includeContent = includeContent.replace(source, dest);
                    }
                }

                if (match[4]) {
                    var indexString = match[5];

                    if (indexString.indexOf("..") !== -1) {
                        var indexSplits = indexString.split("..");
                        var minIndex = parseInt(indexSplits[0]);
                        var maxIndex = parseInt(indexSplits[1]);
                        var sourceIncludeContent = includeContent.slice(0);
                        includeContent = "";

                        if (isNaN(maxIndex)) {
                            maxIndex = this._indexParameters[indexSplits[1]];
                        }

                        for (var i = minIndex; i < maxIndex; i++) {
                            if (!this._engine.supportsUniformBuffers) {
                                // Ubo replacement
                                sourceIncludeContent = sourceIncludeContent.replace(/light\{X\}.(\w*)/g, (str: string, p1: string) => {
                                    return p1 + "{X}";
                                });
                            }
                            includeContent += sourceIncludeContent.replace(/\{X\}/g, i.toString()) + "\n";
                        }
                    } else {
                        if (!this._engine.supportsUniformBuffers) {
                            // Ubo replacement
                            includeContent = includeContent.replace(/light\{X\}.(\w*)/g, (str: string, p1: string) => {
                                return p1 + "{X}";
                            });
                        }
                        includeContent = includeContent.replace(/\{X\}/g, indexString);
                    }
                }

                // Replace
                returnValue = returnValue.replace(match[0], includeContent);
            } else {
                var includeShaderUrl = Effect.ShadersRepository + "ShadersInclude/" + includeFile + ".fx";

                this._engine._loadFile(includeShaderUrl, (fileContent) => {
                    Effect.IncludesShadersStore[includeFile] = fileContent as string;
                    this._processIncludes(<string>returnValue, callback);
                });
                return;
            }

            match = regex.exec(sourceCode);
        }

        callback(returnValue);
    }

    private _processPrecision(source: string): string {
        const shouldUseHighPrecisionShader = this._engine._shouldUseHighPrecisionShader;

        if (source.indexOf("precision highp float") === -1) {
            if (!shouldUseHighPrecisionShader) {
                source = "precision mediump float;\n" + source;
            } else {
                source = "precision highp float;\n" + source;
            }
        } else {
            if (!shouldUseHighPrecisionShader) { // Moving highp to mediump
                source = source.replace("precision highp float", "precision mediump float");
            }
        }

        return source;
    }

    /**
     * Recompiles the webGL program
     * @param vertexSourceCode The source code for the vertex shader.
     * @param fragmentSourceCode The source code for the fragment shader.
     * @param onCompiled Callback called when completed.
     * @param onError Callback called on error.
     * @hidden
     */
    public _rebuildProgram(vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (pipelineContext: IPipelineContext) => void, onError: (message: string) => void) {
        this._isReady = false;

        this._vertexSourceCodeOverride = vertexSourceCode;
        this._fragmentSourceCodeOverride = fragmentSourceCode;
        this.onError = (effect, error) => {
            if (onError) {
                onError(error);
            }
        };
        this.onCompiled = () => {
            var scenes = this.getEngine().scenes;
            for (var i = 0; i < scenes.length; i++) {
                scenes[i].markAllMaterialsAsDirty(Constants.MATERIAL_AllDirtyFlag);
            }

            if (onCompiled) {
                onCompiled(this._pipelineContext);
            }
        };
        this._fallbacks = null;
        this._prepareEffect();
    }

    /**
     * Prepares the effect
     * @hidden
     */
    public _prepareEffect() {
        let attributesNames = this._attributesNames;
        let defines = this.defines;
        let fallbacks = this._fallbacks;
        this._valueCache = {};

        var previousPipelineContext = this._pipelineContext;

        try {
            let engine = this._engine;

            if (!this._pipelineContext) {
                this._pipelineContext = engine.createPipelineContext();
            }

            let rebuildRebind = this._rebuildProgram.bind(this);
            if (this._vertexSourceCodeOverride && this._fragmentSourceCodeOverride) {
                engine._preparePipelineContext(this._pipelineContext, this._vertexSourceCodeOverride, this._fragmentSourceCodeOverride, true, rebuildRebind, null, this._transformFeedbackVaryings);
            }
            else {
                engine._preparePipelineContext(this._pipelineContext, this._vertexSourceCode, this._fragmentSourceCode, false, rebuildRebind, defines, this._transformFeedbackVaryings);
            }

            engine._executeWhenRenderingStateIsCompiled(this._pipelineContext, () => {
                if (engine.supportsUniformBuffers) {
                    for (var name in this._uniformBuffersNames) {
                        this.bindUniformBlock(name, this._uniformBuffersNames[name]);
                    }
                }

                let uniforms = engine.getUniforms(this._pipelineContext, this._uniformsNames);
                uniforms.forEach((uniform, index) => {
                    this._uniforms[this._uniformsNames[index]] = uniform;
                });

                this._attributes = engine.getAttributes(this._pipelineContext, attributesNames);

                var index: number;
                for (index = 0; index < this._samplerList.length; index++) {
                    var sampler = this.getUniform(this._samplerList[index]);

                    if (sampler == null) {
                        this._samplerList.splice(index, 1);
                        index--;
                    }
                }

                this._samplerList.forEach((name, index) => {
                    this._samplers[name] = index;
                });

                engine.bindSamplers(this);

                this._compilationError = "";
                this._isReady = true;
                if (this.onCompiled) {
                    this.onCompiled(this);
                }
                this.onCompileObservable.notifyObservers(this);
                this.onCompileObservable.clear();

                // Unbind mesh reference in fallbacks
                if (this._fallbacks) {
                    this._fallbacks.unBindMesh();
                }

                if (previousPipelineContext) {
                    this.getEngine()._deletePipelineContext(previousPipelineContext);
                }
            });

            if (this._pipelineContext.isAsync) {
                this._checkIsReady();
            }

        } catch (e) {
            this._compilationError = e.message;

            // Let's go through fallbacks then
            Logger.Error("Unable to compile effect:");
            Logger.Error("Uniforms: " + this._uniformsNames.map(function(uniform) {
                return " " + uniform;
            }));
            Logger.Error("Attributes: " + attributesNames.map(function(attribute) {
                return " " + attribute;
            }));
            Logger.Error("Error: " + this._compilationError);
            if (previousPipelineContext) {
                this._pipelineContext = previousPipelineContext;
                this._isReady = true;
                if (this.onError) {
                    this.onError(this, this._compilationError);
                }
                this.onErrorObservable.notifyObservers(this);
            }

            if (fallbacks && fallbacks.isMoreFallbacks) {
                Logger.Error("Trying next fallback.");
                this.defines = fallbacks.reduce(this.defines, this);
                this._prepareEffect();
            } else { // Sorry we did everything we can

                if (this.onError) {
                    this.onError(this, this._compilationError);
                }
                this.onErrorObservable.notifyObservers(this);
                this.onErrorObservable.clear();

                // Unbind mesh reference in fallbacks
                if (this._fallbacks) {
                    this._fallbacks.unBindMesh();
                }
            }
        }
    }

    /**
     * Checks if the effect is supported. (Must be called after compilation)
     */
    public get isSupported(): boolean {
        return this._compilationError === "";
    }

    /**
     * Binds a texture to the engine to be used as output of the shader.
     * @param channel Name of the output variable.
     * @param texture Texture to bind.
     * @hidden
     */
    public _bindTexture(channel: string, texture: InternalTexture): void {
        this._engine._bindTexture(this._samplers[channel], texture);
    }

    /**
     * Sets a texture on the engine to be used in the shader.
     * @param channel Name of the sampler variable.
     * @param texture Texture to set.
     */
    public setTexture(channel: string, texture: Nullable<BaseTexture>): void {
        this._engine.setTexture(this._samplers[channel], this._uniforms[channel], texture);
    }

    /**
     * Sets a depth stencil texture from a render target on the engine to be used in the shader.
     * @param channel Name of the sampler variable.
     * @param texture Texture to set.
     */
    public setDepthStencilTexture(channel: string, texture: Nullable<RenderTargetTexture>): void {
        this._engine.setDepthStencilTexture(this._samplers[channel], this._uniforms[channel], texture);
    }

    /**
     * Sets an array of textures on the engine to be used in the shader.
     * @param channel Name of the variable.
     * @param textures Textures to set.
     */
    public setTextureArray(channel: string, textures: BaseTexture[]): void {
        let exName = channel + "Ex";
        if (this._samplerList.indexOf(exName) === -1) {
            var initialPos = this._samplers[channel];
            for (var index = 1; index < textures.length; index++) {
                this._samplerList.splice(initialPos + index, 0, exName);
                this._samplers[exName] = initialPos + index;
            }
        }

        this._engine.setTextureArray(this._samplers[channel], this._uniforms[channel], textures);
    }

    /**
     * Sets a texture to be the input of the specified post process. (To use the output, pass in the next post process in the pipeline)
     * @param channel Name of the sampler variable.
     * @param postProcess Post process to get the input texture from.
     */
    public setTextureFromPostProcess(channel: string, postProcess: Nullable<PostProcess>): void {
        this._engine.setTextureFromPostProcess(this._samplers[channel], postProcess);
    }

    /**
     * (Warning! setTextureFromPostProcessOutput may be desired instead)
     * Sets the input texture of the passed in post process to be input of this effect. (To use the output of the passed in post process use setTextureFromPostProcessOutput)
     * @param channel Name of the sampler variable.
     * @param postProcess Post process to get the output texture from.
     */
    public setTextureFromPostProcessOutput(channel: string, postProcess: Nullable<PostProcess>): void {
        this._engine.setTextureFromPostProcessOutput(this._samplers[channel], postProcess);
    }

    /** @hidden */
    public _cacheMatrix(uniformName: string, matrix: Matrix): boolean {
        var cache = this._valueCache[uniformName];
        var flag = matrix.updateFlag;
        if (cache !== undefined && cache === flag) {
            return false;
        }

        this._valueCache[uniformName] = flag;

        return true;
    }

    /** @hidden */
    public _cacheFloat2(uniformName: string, x: number, y: number): boolean {
        var cache = this._valueCache[uniformName];
        if (!cache) {
            cache = [x, y];
            this._valueCache[uniformName] = cache;
            return true;
        }

        var changed = false;
        if (cache[0] !== x) {
            cache[0] = x;
            changed = true;
        }
        if (cache[1] !== y) {
            cache[1] = y;
            changed = true;
        }

        return changed;
    }

    /** @hidden */
    public _cacheFloat3(uniformName: string, x: number, y: number, z: number): boolean {
        var cache = this._valueCache[uniformName];
        if (!cache) {
            cache = [x, y, z];
            this._valueCache[uniformName] = cache;
            return true;
        }

        var changed = false;
        if (cache[0] !== x) {
            cache[0] = x;
            changed = true;
        }
        if (cache[1] !== y) {
            cache[1] = y;
            changed = true;
        }
        if (cache[2] !== z) {
            cache[2] = z;
            changed = true;
        }

        return changed;
    }

    /** @hidden */
    public _cacheFloat4(uniformName: string, x: number, y: number, z: number, w: number): boolean {
        var cache = this._valueCache[uniformName];
        if (!cache) {
            cache = [x, y, z, w];
            this._valueCache[uniformName] = cache;
            return true;
        }

        var changed = false;
        if (cache[0] !== x) {
            cache[0] = x;
            changed = true;
        }
        if (cache[1] !== y) {
            cache[1] = y;
            changed = true;
        }
        if (cache[2] !== z) {
            cache[2] = z;
            changed = true;
        }
        if (cache[3] !== w) {
            cache[3] = w;
            changed = true;
        }

        return changed;
    }

    /**
     * Binds a buffer to a uniform.
     * @param buffer Buffer to bind.
     * @param name Name of the uniform variable to bind to.
     */
    public bindUniformBuffer(buffer: DataBuffer, name: string): void {
        let bufferName = this._uniformBuffersNames[name];
        if (bufferName === undefined || Effect._baseCache[bufferName] === buffer) {
            return;
        }
        Effect._baseCache[bufferName] = buffer;
        this._engine.bindUniformBufferBase(buffer, bufferName);
    }

    /**
     * Binds block to a uniform.
     * @param blockName Name of the block to bind.
     * @param index Index to bind.
     */
    public bindUniformBlock(blockName: string, index: number): void {
        this._engine.bindUniformBlock(this._pipelineContext, blockName, index);
    }

    /**
     * Sets an interger value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     * @returns this effect.
     */
    public setInt(uniformName: string, value: number): Effect {
        var cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return this;
        }

        this._valueCache[uniformName] = value;

        this._engine.setInt(this._uniforms[uniformName], value);

        return this;
    }

    /**
     * Sets an int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setIntArray(uniformName: string, array: Int32Array): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setIntArray2(uniformName: string, array: Int32Array): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray2(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setIntArray3(uniformName: string, array: Int32Array): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray3(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setIntArray4(uniformName: string, array: Int32Array): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray4(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an float array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setFloatArray(uniformName: string, array: Float32Array): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an float array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setFloatArray2(uniformName: string, array: Float32Array): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray2(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an float array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setFloatArray3(uniformName: string, array: Float32Array): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray3(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an float array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setFloatArray4(uniformName: string, array: Float32Array): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray4(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray(uniformName: string, array: number[]): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setArray(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray2(uniformName: string, array: number[]): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setArray2(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray3(uniformName: string, array: number[]): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setArray3(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray4(uniformName: string, array: number[]): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setArray4(this._uniforms[uniformName], array);

        return this;
    }

    /**
     * Sets matrices on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrices matrices to be set.
     * @returns this effect.
     */
    public setMatrices(uniformName: string, matrices: Float32Array): Effect {
        if (!matrices) {
            return this;
        }

        this._valueCache[uniformName] = null;
        this._engine.setMatrices(this._uniforms[uniformName], matrices);

        return this;
    }

    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     * @returns this effect.
     */
    public setMatrix(uniformName: string, matrix: Matrix): Effect {
        if (this._cacheMatrix(uniformName, matrix)) {
            this._engine.setMatrix(this._uniforms[uniformName], matrix);
        }
        return this;
    }

    /**
     * Sets a 3x3 matrix on a uniform variable. (Speicified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     * @returns this effect.
     */
    public setMatrix3x3(uniformName: string, matrix: Float32Array): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setMatrix3x3(this._uniforms[uniformName], matrix);

        return this;
    }

    /**
     * Sets a 2x2 matrix on a uniform variable. (Speicified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     * @returns this effect.
     */
    public setMatrix2x2(uniformName: string, matrix: Float32Array): Effect {
        this._valueCache[uniformName] = null;
        this._engine.setMatrix2x2(this._uniforms[uniformName], matrix);

        return this;
    }

    /**
     * Sets a float on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value value to be set.
     * @returns this effect.
     */
    public setFloat(uniformName: string, value: number): Effect {
        var cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return this;
        }

        this._valueCache[uniformName] = value;

        this._engine.setFloat(this._uniforms[uniformName], value);

        return this;
    }

    /**
     * Sets a boolean on a uniform variable.
     * @param uniformName Name of the variable.
     * @param bool value to be set.
     * @returns this effect.
     */
    public setBool(uniformName: string, bool: boolean): Effect {
        var cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === bool) {
            return this;
        }

        this._valueCache[uniformName] = bool;

        this._engine.setBool(this._uniforms[uniformName], bool ? 1 : 0);

        return this;
    }

    /**
     * Sets a Vector2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector2 vector2 to be set.
     * @returns this effect.
     */
    public setVector2(uniformName: string, vector2: Vector2): Effect {
        if (this._cacheFloat2(uniformName, vector2.x, vector2.y)) {
            this._engine.setFloat2(this._uniforms[uniformName], vector2.x, vector2.y);
        }
        return this;
    }

    /**
     * Sets a float2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float2.
     * @param y Second float in float2.
     * @returns this effect.
     */
    public setFloat2(uniformName: string, x: number, y: number): Effect {
        if (this._cacheFloat2(uniformName, x, y)) {
            this._engine.setFloat2(this._uniforms[uniformName], x, y);
        }
        return this;
    }

    /**
     * Sets a Vector3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector3 Value to be set.
     * @returns this effect.
     */
    public setVector3(uniformName: string, vector3: Vector3): Effect {
        if (this._cacheFloat3(uniformName, vector3.x, vector3.y, vector3.z)) {
            this._engine.setFloat3(this._uniforms[uniformName], vector3.x, vector3.y, vector3.z);
        }
        return this;
    }

    /**
     * Sets a float3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float3.
     * @param y Second float in float3.
     * @param z Third float in float3.
     * @returns this effect.
     */
    public setFloat3(uniformName: string, x: number, y: number, z: number): Effect {
        if (this._cacheFloat3(uniformName, x, y, z)) {
            this._engine.setFloat3(this._uniforms[uniformName], x, y, z);
        }
        return this;
    }

    /**
     * Sets a Vector4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector4 Value to be set.
     * @returns this effect.
     */
    public setVector4(uniformName: string, vector4: Vector4): Effect {
        if (this._cacheFloat4(uniformName, vector4.x, vector4.y, vector4.z, vector4.w)) {
            this._engine.setFloat4(this._uniforms[uniformName], vector4.x, vector4.y, vector4.z, vector4.w);
        }
        return this;
    }

    /**
     * Sets a float4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float4.
     * @param y Second float in float4.
     * @param z Third float in float4.
     * @param w Fourth float in float4.
     * @returns this effect.
     */
    public setFloat4(uniformName: string, x: number, y: number, z: number, w: number): Effect {
        if (this._cacheFloat4(uniformName, x, y, z, w)) {
            this._engine.setFloat4(this._uniforms[uniformName], x, y, z, w);
        }
        return this;
    }

    /**
     * Sets a Color3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @returns this effect.
     */
    public setColor3(uniformName: string, color3: Color3): Effect {

        if (this._cacheFloat3(uniformName, color3.r, color3.g, color3.b)) {
            this._engine.setColor3(this._uniforms[uniformName], color3);
        }
        return this;
    }

    /**
     * Sets a Color4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @param alpha Alpha value to be set.
     * @returns this effect.
     */
    public setColor4(uniformName: string, color3: Color3, alpha: number): Effect {
        if (this._cacheFloat4(uniformName, color3.r, color3.g, color3.b, alpha)) {
            this._engine.setColor4(this._uniforms[uniformName], color3, alpha);
        }
        return this;
    }

    /**
     * Sets a Color4 on a uniform variable
     * @param uniformName defines the name of the variable
     * @param color4 defines the value to be set
     * @returns this effect.
     */
    public setDirectColor4(uniformName: string, color4: Color4): Effect {
        if (this._cacheFloat4(uniformName, color4.r, color4.g, color4.b, color4.a)) {
            this._engine.setDirectColor4(this._uniforms[uniformName], color4);
        }
        return this;
    }

    /** Release all associated resources */
    public dispose() {
        this._engine._releaseEffect(this);
    }

    /**
     * This function will add a new shader to the shader store
     * @param name the name of the shader
     * @param pixelShader optional pixel shader content
     * @param vertexShader optional vertex shader content
     */
    public static RegisterShader(name: string, pixelShader?: string, vertexShader?: string) {
        if (pixelShader) {
            Effect.ShadersStore[`${name}PixelShader`] = pixelShader;
        }

        if (vertexShader) {
            Effect.ShadersStore[`${name}VertexShader`] = vertexShader;
        }
    }

    /**
     * Store of each shader (The can be looked up using effect.key)
     */
    public static ShadersStore: { [key: string]: string } = {};
    /**
     * Store of each included file for a shader (The can be looked up using effect.key)
     */
    public static IncludesShadersStore: { [key: string]: string } = {};

    /**
     * Resets the cache of effects.
     */
    public static ResetCache() {
        Effect._baseCache = {};
    }
}