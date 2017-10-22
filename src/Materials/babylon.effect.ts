module BABYLON {
    export class EffectFallbacks {
        private _defines: {[key: string]: Array<String>} = {};

        private _currentRank = 32;
        private _maxRank = -1;

        private _mesh: Nullable<AbstractMesh>;
        private _meshRank: number;

        public unBindMesh() {
            this._mesh = null;
        }

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

        public addCPUSkinningFallback(rank: number, mesh: BABYLON.AbstractMesh) {
            this._meshRank = rank;
            this._mesh = mesh;

            if (rank < this._currentRank) {
                this._currentRank = rank;
            }
            if (rank > this._maxRank) {
                this._maxRank = rank;
            }
        }

        public get isMoreFallbacks(): boolean {
            return this._currentRank <= this._maxRank;
        }

        public reduce(currentDefines: string): string {
            // First we try to switch to CPU skinning
            if (this._mesh && this._mesh.computeBonesUsingShaders && this._mesh.numBoneInfluencers > 0) {
                this._mesh.computeBonesUsingShaders = false;
                currentDefines = currentDefines.replace("#define NUM_BONE_INFLUENCERS " + this._mesh.numBoneInfluencers, "#define NUM_BONE_INFLUENCERS 0");
                Tools.Log("Falling back to CPU skinning for " + this._mesh.name);

                var scene = this._mesh.getScene();
                for (var index = 0; index < scene.meshes.length; index++) {
                    var otherMesh = scene.meshes[index];

                    if (otherMesh.material === this._mesh.material && otherMesh.computeBonesUsingShaders && otherMesh.numBoneInfluencers > 0) {
                        otherMesh.computeBonesUsingShaders = false;
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

    export class EffectCreationOptions {
        public attributes: string[];
        public uniformsNames: string[];
        public uniformBuffersNames: string[];
        public samplers: string[];
        public defines: any;
        public fallbacks: EffectFallbacks;
        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public indexParameters: any;
        public maxSimultaneousLights: number;
    }

    export class Effect {
        public name: any;
        public defines: string;
        public onCompiled: Nullable<(effect: Effect) => void>;
        public onError: Nullable<(effect: Effect, errors: string) => void>;
        public onBind: Nullable<(effect: Effect) => void>;
        public uniqueId = 0;
        public onCompileObservable = new Observable<Effect>();
        public onErrorObservable = new Observable<Effect>();
        public onBindObservable = new Observable<Effect>();

        private static _uniqueIdSeed = 0;
        private _engine: Engine;
        private _uniformBuffersNames: { [key: string]: number } = {};
        private _uniformsNames: string[];
        private _samplers: string[];
        private _isReady = false;
        private _compilationError = "";
        private _attributesNames: string[];
        private _attributes: number[];
        private _uniforms: Nullable<WebGLUniformLocation>[];
        public _key: string;
        private _indexParameters: any;
        private _fallbacks: Nullable<EffectFallbacks>;
        private _vertexSourceCode: string;
        private _fragmentSourceCode: string;
        private _vertexSourceCodeOverride: string;
        private _fragmentSourceCodeOverride: string;

        public _program: WebGLProgram;
        private _valueCache: { [key: string]: any };
        private static _baseCache: { [key: number]: WebGLBuffer } = {};

        constructor(baseName: any, attributesNamesOrOptions: string[] | EffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers: Nullable<string[]> = null, engine?: Engine, defines: Nullable<string> = null, 
                    fallbacks: Nullable<EffectFallbacks> = null, onCompiled: Nullable<(effect: Effect) => void> = null, onError: Nullable<(effect: Effect, errors: string) => void> = null, indexParameters?: any) {
            this.name = baseName;

            if ((<EffectCreationOptions>attributesNamesOrOptions).attributes) {
                var options = <EffectCreationOptions>attributesNamesOrOptions;
                this._engine = <Engine>uniformsNamesOrEngine;

                this._attributesNames = options.attributes;
                this._uniformsNames = options.uniformsNames.concat(options.samplers);
                this._samplers = options.samplers;
                this.defines = options.defines;
                this.onError = options.onError;
                this.onCompiled = options.onCompiled;
                this._fallbacks = options.fallbacks;
                this._indexParameters = options.indexParameters;  

                if (options.uniformBuffersNames) {
                    for (var i = 0; i < options.uniformBuffersNames.length; i++) {
                        this._uniformBuffersNames[options.uniformBuffersNames[i]] = i;
                    }          
                }    
            } else {
                this._engine = <Engine>engine;
                this.defines = <string>defines;
                this._uniformsNames = (<string[]>uniformsNamesOrEngine).concat(<string[]>samplers);
                this._samplers = <string[]>samplers;
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

            this._loadVertexShader(vertexSource, vertexCode => {
                this._processIncludes(vertexCode, vertexCodeWithIncludes => {
                    this._processShaderConversion(vertexCodeWithIncludes, false, migratedVertexCode => {
                        this._loadFragmentShader(fragmentSource, (fragmentCode) => {
                            this._processIncludes(fragmentCode, fragmentCodeWithIncludes => {
                                this._processShaderConversion(fragmentCodeWithIncludes, true, migratedFragmentCode => {
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

        public get key(): string {
            return this._key;
        }

        // Properties
        public isReady(): boolean {
            return this._isReady;
        }

        public getEngine(): Engine {
            return this._engine;
        }

        public getProgram(): WebGLProgram {
            return this._program;
        }

        public getAttributesNames(): string[] {
            return this._attributesNames;
        }

        public getAttributeLocation(index: number): number {
            return this._attributes[index];
        }

        public getAttributeLocationByName(name: string): number {
            var index = this._attributesNames.indexOf(name);

            return this._attributes[index];
        }

        public getAttributesCount(): number {
            return this._attributes.length;
        }

        public getUniformIndex(uniformName: string): number {
            return this._uniformsNames.indexOf(uniformName);
        }

        public getUniform(uniformName: string): Nullable<WebGLUniformLocation> {
            return this._uniforms[this._uniformsNames.indexOf(uniformName)];
        }

        public getSamplers(): string[] {
            return this._samplers;
        }

        public getCompilationError(): string {
            return this._compilationError;
        }

        // Methods
        public executeWhenCompiled(func: (effect: Effect) => void): void {
            if (this.isReady()) {
                func(this);
                return;
            }
            
            this.onCompileObservable.add((effect) => {
                func(effect);
            });
        }

        public _loadVertexShader(vertex: any, callback: (data: any) => void): void {
            if (Tools.IsWindowObjectExist()) {
                // DOM element ?
                if (vertex instanceof HTMLElement) {
                    var vertexCode = Tools.GetDOMTextContent(vertex);
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
                vertexShaderUrl = Engine.ShadersRepository + vertex;
            }

            // Vertex shader
            Tools.LoadFile(vertexShaderUrl + ".vertex.fx", callback);
        }

        public _loadFragmentShader(fragment: any, callback: (data: any) => void): void {
            if (Tools.IsWindowObjectExist()) {
                // DOM element ?
                if (fragment instanceof HTMLElement) {
                    var fragmentCode = Tools.GetDOMTextContent(fragment);
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
                fragmentShaderUrl = Engine.ShadersRepository + fragment;
            }

            // Fragment shader
            Tools.LoadFile(fragmentShaderUrl + ".fragment.fx", callback);
        }

        private _dumpShadersSource(vertexCode: string, fragmentCode: string, defines: string): void {
            // Rebuild shaders source code
            var shaderVersion = (this._engine.webGLVersion > 1) ? "#version 300 es\n" : "";
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
                BABYLON.Tools.Error("Vertex shader: " + this.name.vertexElement + formattedVertexCode);
                BABYLON.Tools.Error("Fragment shader: " + this.name.fragmentElement + formattedFragmentCode);
            }
            else if (this.name.vertex) {
                BABYLON.Tools.Error("Vertex shader: " + this.name.vertex + formattedVertexCode);
                BABYLON.Tools.Error("Fragment shader: " + this.name.fragment + formattedFragmentCode);
            }
            else {
                BABYLON.Tools.Error("Vertex shader: " + this.name + formattedVertexCode);
                BABYLON.Tools.Error("Fragment shader: " + this.name + formattedFragmentCode);
            }
        };

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
            var regex = /#extension.+(GL_OES_standard_derivatives|GL_EXT_shader_texture_lod|GL_EXT_frag_depth|GL_EXT_draw_buffers).+(enable|require)/g;
            var result = preparedSourceCode.replace(regex, "");

            // Migrate to GLSL v300
            result = result.replace(/varying(?![\n\r])\s/g, isFragment ? "in " : "out ");
            result = result.replace(/attribute[ \t]/g, "in ");
            result = result.replace(/[ \t]attribute/g, " in");
            
            if (isFragment) {
                result = result.replace(/texture2DLodEXT\s*\(/g, "textureLod(");
                result = result.replace(/textureCubeLodEXT\s*\(/g, "textureLod(");
                result = result.replace(/texture2D\s*\(/g, "texture(");
                result = result.replace(/textureCube\s*\(/g, "texture(");
                result = result.replace(/gl_FragDepthEXT/g, "gl_FragDepth");
                result = result.replace(/gl_FragColor/g, "glFragColor");
                result = result.replace(/gl_FragData/g, "glFragData");
                result = result.replace(/void\s+?main\s*\(/g, (hasDrawBuffersExtension ? "" : "out vec4 glFragColor;\n") + "void main(");
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
                    var includeShaderUrl = Engine.ShadersRepository + "ShadersInclude/" + includeFile + ".fx";

                    Tools.LoadFile(includeShaderUrl, (fileContent) => {
                        Effect.IncludesShadersStore[includeFile] = fileContent;
                        this._processIncludes(<string>returnValue, callback);
                    });
                    return;
                }

                match = regex.exec(sourceCode);
            }

            callback(returnValue);
        }

        private _processPrecision(source: string): string {
            if (source.indexOf("precision highp float") === -1) {
                if (!this._engine.getCaps().highPrecisionShaderSupported) {
                    source = "precision mediump float;\n" + source;
                } else {
                    source = "precision highp float;\n" + source;
                }
            } else {
                if (!this._engine.getCaps().highPrecisionShaderSupported) { // Moving highp to mediump
                    source = source.replace("precision highp float", "precision mediump float");
                }
            }

            return source;
        }

        public _rebuildProgram(vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (program: WebGLProgram) => void, onError: (message: string) => void) {
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
                    scenes[i].markAllMaterialsAsDirty(Material.TextureDirtyFlag);
                }

                if (onCompiled) {
                    onCompiled(this._program);
                }
            };
            this._fallbacks = null;
            this._prepareEffect();
        }

        public _prepareEffect() {
            let attributesNames = this._attributesNames;
            let defines = this.defines;
            let fallbacks = this._fallbacks;
            this._valueCache = {};

            var previousProgram = this._program;

            try {
                var engine = this._engine;

                if (this._vertexSourceCodeOverride && this._fragmentSourceCodeOverride) {
                    this._program = engine.createRawShaderProgram(this._vertexSourceCodeOverride, this._fragmentSourceCodeOverride);
                }
                else {
                    this._program = engine.createShaderProgram(this._vertexSourceCode, this._fragmentSourceCode, defines);
                }
                this._program.__SPECTOR_rebuildProgram = this._rebuildProgram.bind(this);

                if (engine.webGLVersion > 1) {
                    for (var name in this._uniformBuffersNames) {
                        this.bindUniformBlock(name, this._uniformBuffersNames[name]);
                    }
                }

                this._uniforms = engine.getUniforms(this._program, this._uniformsNames);
                this._attributes = engine.getAttributes(this._program, attributesNames);

                var index: number;
                for (index = 0; index < this._samplers.length; index++) {
                    var sampler = this.getUniform(this._samplers[index]);

                    if (sampler == null) {
                        this._samplers.splice(index, 1);
                        index--;
                    }
                }

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

                if (previousProgram) {
                    this.getEngine()._deleteProgram(previousProgram);
                }
            } catch (e) {
                this._compilationError = e.message;

                // Let's go through fallbacks then
                Tools.Error("Unable to compile effect:");
                BABYLON.Tools.Error("Uniforms: " + this._uniformsNames.map(function(uniform) {
                    return " " + uniform;
                }));
                BABYLON.Tools.Error("Attributes: " + attributesNames.map(function(attribute) {
                    return " " + attribute;
                }));
                this._dumpShadersSource(this._vertexSourceCode, this._fragmentSourceCode, defines);
                Tools.Error("Error: " + this._compilationError);
                if (previousProgram) {
                    this._program = previousProgram;
                    this._isReady = true;
                    if (this.onError) {
                        this.onError(this, this._compilationError);
                    }
                    this.onErrorObservable.notifyObservers(this);
                }

                if (fallbacks && fallbacks.isMoreFallbacks) {
                    Tools.Error("Trying next fallback.");
                    this.defines = fallbacks.reduce(this.defines);
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

        public get isSupported(): boolean {
            return this._compilationError === "";
        }

        public _bindTexture(channel: string, texture: InternalTexture): void {
            this._engine._bindTexture(this._samplers.indexOf(channel), texture);
        }

        public setTexture(channel: string, texture: Nullable<BaseTexture>): void {
            this._engine.setTexture(this._samplers.indexOf(channel), this.getUniform(channel), texture);
        }

        public setTextureArray(channel: string, textures: BaseTexture[]): void {
            if (this._samplers.indexOf(channel + "Ex") === -1) {
                var initialPos = this._samplers.indexOf(channel);
                for (var index = 1; index < textures.length; index++) {
                    this._samplers.splice(initialPos + index, 0, channel + "Ex");
                }
            }

            this._engine.setTextureArray(this._samplers.indexOf(channel), this.getUniform(channel), textures);
        }

        public setTextureFromPostProcess(channel: string, postProcess: PostProcess): void {
            this._engine.setTextureFromPostProcess(this._samplers.indexOf(channel), postProcess);
        }

        public _cacheMatrix(uniformName: string, matrix: Matrix): boolean {
            var cache = this._valueCache[uniformName];
            var flag = matrix.updateFlag;
            if (cache !== undefined && cache === flag) {
                return false;
            }

            this._valueCache[uniformName] = flag;

            return true;
        }

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

        public bindUniformBuffer(buffer: WebGLBuffer, name: string): void {
            if (Effect._baseCache[this._uniformBuffersNames[name]] === buffer) {
                return;
            }
            Effect._baseCache[this._uniformBuffersNames[name]] = buffer;
            this._engine.bindUniformBufferBase(buffer, this._uniformBuffersNames[name]);
        }

        public bindUniformBlock(blockName: string, index: number): void {
            this._engine.bindUniformBlock(this._program, blockName, index);
        }

        public setIntArray(uniformName: string, array: Int32Array): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setIntArray(this.getUniform(uniformName), array);

            return this;
        }

        public setIntArray2(uniformName: string, array: Int32Array): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setIntArray2(this.getUniform(uniformName), array);

            return this;
        }

        public setIntArray3(uniformName: string, array: Int32Array): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setIntArray3(this.getUniform(uniformName), array);

            return this;
        }

        public setIntArray4(uniformName: string, array: Int32Array): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setIntArray4(this.getUniform(uniformName), array);

            return this;
        }

        public setFloatArray(uniformName: string, array: Float32Array): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setFloatArray(this.getUniform(uniformName), array);

            return this;
        }

        public setFloatArray2(uniformName: string, array: Float32Array): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setFloatArray2(this.getUniform(uniformName), array);

            return this;
        }

        public setFloatArray3(uniformName: string, array: Float32Array): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setFloatArray3(this.getUniform(uniformName), array);

            return this;
        }

        public setFloatArray4(uniformName: string, array: Float32Array): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setFloatArray4(this.getUniform(uniformName), array);

            return this;
        }

        public setArray(uniformName: string, array: number[]): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setArray(this.getUniform(uniformName), array);

            return this;
        }

        public setArray2(uniformName: string, array: number[]): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setArray2(this.getUniform(uniformName), array);

            return this;
        }

        public setArray3(uniformName: string, array: number[]): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setArray3(this.getUniform(uniformName), array);

            return this;
        }

        public setArray4(uniformName: string, array: number[]): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setArray4(this.getUniform(uniformName), array);

            return this;
        }

        public setMatrices(uniformName: string, matrices: Float32Array): Effect {
            if (!matrices) {
                return this;
            }

            this._valueCache[uniformName] = null;
            this._engine.setMatrices(this.getUniform(uniformName), matrices);

            return this;
        }

        public setMatrix(uniformName: string, matrix: Matrix): Effect {
            if (this._cacheMatrix(uniformName, matrix)) {
                this._engine.setMatrix(this.getUniform(uniformName), matrix);
            }
            return this;
        }

        public setMatrix3x3(uniformName: string, matrix: Float32Array): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setMatrix3x3(this.getUniform(uniformName), matrix);

            return this;
        }

        public setMatrix2x2(uniformName: string, matrix: Float32Array): Effect {
            this._valueCache[uniformName] = null;
            this._engine.setMatrix2x2(this.getUniform(uniformName), matrix);

            return this;
        }

        public setFloat(uniformName: string, value: number): Effect {
            var cache = this._valueCache[uniformName];
            if (cache !== undefined && cache === value)
                return this;

            this._valueCache[uniformName] = value;

            this._engine.setFloat(this.getUniform(uniformName), value);

            return this;
        }

        public setBool(uniformName: string, bool: boolean): Effect {
            var cache = this._valueCache[uniformName];
            if (cache !== undefined && cache === bool)
                return this;

            this._valueCache[uniformName] = bool;

            this._engine.setBool(this.getUniform(uniformName), bool ? 1 : 0);

            return this;
        }

        public setVector2(uniformName: string, vector2: Vector2): Effect {
            if (this._cacheFloat2(uniformName, vector2.x, vector2.y)) {
                this._engine.setFloat2(this.getUniform(uniformName), vector2.x, vector2.y);
            }
            return this;
        }

        public setFloat2(uniformName: string, x: number, y: number): Effect {
            if (this._cacheFloat2(uniformName, x, y)) {
                this._engine.setFloat2(this.getUniform(uniformName), x, y);
            }
            return this;
        }

        public setVector3(uniformName: string, vector3: Vector3): Effect {
            if (this._cacheFloat3(uniformName, vector3.x, vector3.y, vector3.z)) {
                this._engine.setFloat3(this.getUniform(uniformName), vector3.x, vector3.y, vector3.z);
            }
            return this;
        }

        public setFloat3(uniformName: string, x: number, y: number, z: number): Effect {
            if (this._cacheFloat3(uniformName, x, y, z)) {
                this._engine.setFloat3(this.getUniform(uniformName), x, y, z);
            }
            return this;
        }

        public setVector4(uniformName: string, vector4: Vector4): Effect {
            if (this._cacheFloat4(uniformName, vector4.x, vector4.y, vector4.z, vector4.w)) {
                this._engine.setFloat4(this.getUniform(uniformName), vector4.x, vector4.y, vector4.z, vector4.w);
            }
            return this;
        }

        public setFloat4(uniformName: string, x: number, y: number, z: number, w: number): Effect {
            if (this._cacheFloat4(uniformName, x, y, z, w)) {
                this._engine.setFloat4(this.getUniform(uniformName), x, y, z, w);
            }
            return this;
        }

        public setColor3(uniformName: string, color3: Color3): Effect {

            if (this._cacheFloat3(uniformName, color3.r, color3.g, color3.b)) {
                this._engine.setColor3(this.getUniform(uniformName), color3);
            }
            return this;
        }

        public setColor4(uniformName: string, color3: Color3, alpha: number): Effect {
            if (this._cacheFloat4(uniformName, color3.r, color3.g, color3.b, alpha)) {
                this._engine.setColor4(this.getUniform(uniformName), color3, alpha);
            }
            return this;
        }

        // Statics
        public static ShadersStore: { [key: string]: string } = {};
        public static IncludesShadersStore: { [key: string]: string } = {};

        public static ResetCache() {
            Effect._baseCache = {};
        }
    }
} 
