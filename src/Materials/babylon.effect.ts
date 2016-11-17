module BABYLON {
    export class EffectFallbacks {
        private _defines = {};

        private _currentRank = 32;
        private _maxRank = -1;

        private _mesh: AbstractMesh;
        private _meshRank: number;

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

            if (rank > this._maxRank) {
                this._maxRank = rank;
            }
        }

        public get isMoreFallbacks(): boolean {
            return this._currentRank <= this._maxRank;
        }

        public reduce(currentDefines: string): string {

            var currentFallbacks = this._defines[this._currentRank];

            for (var index = 0; index < currentFallbacks.length; index++) {
                currentDefines = currentDefines.replace("#define " + currentFallbacks[index], "");
            }

            if (this._mesh && this._currentRank === this._meshRank) {
                this._mesh.computeBonesUsingShaders = false;
                currentDefines = currentDefines.replace("#define NUM_BONE_INFLUENCERS " + this._mesh.numBoneInfluencers, "#define NUM_BONE_INFLUENCERS 0");
                Tools.Log("Falling back to CPU skinning for " + this._mesh.name);
            }

            this._currentRank++;

            return currentDefines;
        }
    }

    export class Effect {
        public name: any;
        public defines: string;
        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public onBind: (effect: Effect) => void;

        private _engine: Engine;
        private _uniformsNames: string[];
        private _samplers: string[];
        private _isReady = false;
        private _compilationError = "";
        private _attributesNames: string[];
        private _attributes: number[];
        private _uniforms: WebGLUniformLocation[];
        public _key: string;
        private _indexParameters: any;

        private _program: WebGLProgram;
        private _valueCache: { [key: string]: any } = {};

        constructor(baseName: any, attributesNames: string[], uniformsNames: string[], samplers: string[], engine, defines?: string, fallbacks?: EffectFallbacks, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, indexParameters?: any) {
            this._engine = engine;
            this.name = baseName;
            this.defines = defines;
            this._uniformsNames = uniformsNames.concat(samplers);
            this._samplers = samplers;
            this._attributesNames = attributesNames;

            this.onError = onError;
            this.onCompiled = onCompiled;

            this._indexParameters = indexParameters;

            var vertexSource;
            var fragmentSource;

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
                    this._loadFragmentShader(fragmentSource, (fragmentCode) => {
                        this._processIncludes(fragmentCode, fragmentCodeWithIncludes => {
                            this._prepareEffect(vertexCodeWithIncludes, fragmentCodeWithIncludes, attributesNames, defines, fallbacks);
                        });
                    });
                });
            });
        }

        // Properties
        public isReady(): boolean {
            return this._isReady;
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

        public getUniform(uniformName: string): WebGLUniformLocation {
            return this._uniforms[this._uniformsNames.indexOf(uniformName)];
        }

        public getSamplers(): string[] {
            return this._samplers;
        }

        public getCompilationError(): string {
            return this._compilationError;
        }

        public getVertexShaderSource(): string {
            return this._engine.getVertexShaderSource(this._program);
        }

        public getFragmentShaderSource(): string {
            return this._engine.getFragmentShaderSource(this._program);
        }

        // Methods
        public _loadVertexShader(vertex: any, callback: (data: any) => void): void {
            // DOM element ?
            if (vertex instanceof HTMLElement) {
                var vertexCode = Tools.GetDOMTextContent(vertex);
                callback(vertexCode);
                return;
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
            // DOM element ?
            if (fragment instanceof HTMLElement) {
                var fragmentCode = Tools.GetDOMTextContent(fragment);
                callback(fragmentCode);
                return;
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

        private _dumpShadersName(): void {
            if (this.name.vertexElement) {
                Tools.Error("Vertex shader:" + this.name.vertexElement);
                Tools.Error("Fragment shader:" + this.name.fragmentElement);
            } else if (this.name.vertex) {
                Tools.Error("Vertex shader:" + this.name.vertex);
                Tools.Error("Fragment shader:" + this.name.fragment);
            } else {
                Tools.Error("Vertex shader:" + this.name);
                Tools.Error("Fragment shader:" + this.name);
            }
        }

        private _processIncludes(sourceCode: string, callback: (data: any) => void): void {
            var regex = /#include<(.+)>(\((.*)\))*(\[(.*)\])*/g;
            var match = regex.exec(sourceCode);

            var returnValue = new String(sourceCode);

            while (match != null) {
                var includeFile = match[1];

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

                            for (var i = minIndex; i <= maxIndex; i++) {
                                includeContent += sourceIncludeContent.replace(/\{X\}/g, i) + "\n";
                            }
                        } else {
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

        private _prepareEffect(vertexSourceCode: string, fragmentSourceCode: string, attributesNames: string[], defines: string, fallbacks?: EffectFallbacks): void {
            try {
                var engine = this._engine;

                // Precision
                vertexSourceCode = this._processPrecision(vertexSourceCode);
                fragmentSourceCode = this._processPrecision(fragmentSourceCode);

                this._program = engine.createShaderProgram(vertexSourceCode, fragmentSourceCode, defines);

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
            } catch (e) {
                this._compilationError = e.message;

                // Let's go through fallbacks then
                Tools.Error("Unable to compile effect: ");
                Tools.Error("Defines: " + defines);
                Tools.Error("Error: " + this._compilationError);
                this._dumpShadersName();

                if (fallbacks && fallbacks.isMoreFallbacks) {
                    Tools.Error("Trying next fallback.");
                    defines = fallbacks.reduce(defines);
                    this._prepareEffect(vertexSourceCode, fragmentSourceCode, attributesNames, defines, fallbacks);
                } else { // Sorry we did everything we can

                    if (this.onError) {
                        this.onError(this, this._compilationError);
                    }
                }
            }
        }

        public get isSupported(): boolean {
            return this._compilationError === "";
        }

        public _bindTexture(channel: string, texture: WebGLTexture): void {
            this._engine._bindTexture(this._samplers.indexOf(channel), texture);
        }

        public setTexture(channel: string, texture: BaseTexture): void {
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
            var changed = false;
            var cache: Matrix = this._valueCache[uniformName];
            if (!cache || !(cache instanceof Matrix)) {
                changed = true;
                cache = new Matrix();
            }

            var tm = cache.m;
            var om = matrix.m;
            for (var index = 0; index < 16; index++) {
                if (tm[index] !== om[index]) {
                    tm[index] = om[index];
                    changed = true;
                }
            }

            this._valueCache[uniformName] = cache;
            return changed;
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
        public static ShadersStore = {};
        public static IncludesShadersStore = {};
    }
} 
