﻿module BABYLON {
    export class EffectFallbacks {
        private _defines = {};

        private _currentRank = 32;
        private _maxRank = -1;

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

        public get isMoreFallbacks(): boolean {
            return this._currentRank <= this._maxRank;
        }

        public reduce(currentDefines: string): string {

            var currentFallbacks = this._defines[this._currentRank];

            for (var index = 0; index < currentFallbacks.length; index++) {
                currentDefines = currentDefines.replace("#define " + currentFallbacks[index], "");
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

        private _program: WebGLProgram;
        private _valueCache = [];

        constructor(baseName: any, attributesNames: string[], uniformsNames: string[], samplers: string[], engine, defines?: string, fallbacks?: EffectFallbacks, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void) {
            this._engine = engine;
            this.name = baseName;
            this.defines = defines;
            this._uniformsNames = uniformsNames.concat(samplers);
            this._samplers = samplers;
            this._attributesNames = attributesNames;

            this.onError = onError;
            this.onCompiled = onCompiled;

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
                this._loadFragmentShader(fragmentSource, (fragmentCode) => {
                    this._prepareEffect(vertexCode, fragmentCode, attributesNames, defines, fallbacks);
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

        // Methods
        public _loadVertexShader(vertex: any, callback: (data: any) => void): void {
            // DOM element ?
            if (vertex instanceof HTMLElement) {
                var vertexCode = Tools.GetDOMTextContent(vertex);
                callback(vertexCode);
                return;
            }

            // Is in local store ?
            if (Effect.ShadersStore[vertex + "VertexShader"]) {
                callback(Effect.ShadersStore[vertex + "VertexShader"]);
                return;
            }

            var vertexShaderUrl;

            if (vertex[0] === ".") {
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

            if (fragment[0] === ".") {
                fragmentShaderUrl = fragment;
            } else {
                fragmentShaderUrl = Engine.ShadersRepository + fragment;
            }

            // Fragment shader
            Tools.LoadFile(fragmentShaderUrl + ".fragment.fx", callback);
        }

        private _prepareEffect(vertexSourceCode: string, fragmentSourceCode: string, attributesNames: string[], defines: string, fallbacks?: EffectFallbacks): void {
            try {
                var engine = this._engine;

                if (!engine.getCaps().highPrecisionShaderSupported) { // Moving highp to mediump
                    vertexSourceCode = vertexSourceCode.replace("precision highp float", "precision mediump float");
                    fragmentSourceCode = fragmentSourceCode.replace("precision highp float", "precision mediump float");
                }

                this._program = engine.createShaderProgram(vertexSourceCode, fragmentSourceCode, defines);

                this._uniforms = engine.getUniforms(this._program, this._uniformsNames);
                this._attributes = engine.getAttributes(this._program, attributesNames);

                for (var index = 0; index < this._samplers.length; index++) {
                    var sampler = this.getUniform(this._samplers[index]);

                    if (sampler == null) {
                        this._samplers.splice(index, 1);
                        index--;
                    }
                }
                engine.bindSamplers(this);

                this._isReady = true;
                if (this.onCompiled) {
                    this.onCompiled(this);
                }
            } catch (e) {
                // Is it a problem with precision?
                if (e.message.indexOf("highp") !== -1) {
                    vertexSourceCode = vertexSourceCode.replace("precision highp float", "precision mediump float");
                    fragmentSourceCode = fragmentSourceCode.replace("precision highp float", "precision mediump float");

                    this._prepareEffect(vertexSourceCode, fragmentSourceCode, attributesNames, defines, fallbacks);

                    return;
                }
                // Let's go through fallbacks then
                if (fallbacks && fallbacks.isMoreFallbacks) {
                    defines = fallbacks.reduce(defines);
                    this._prepareEffect(vertexSourceCode, fragmentSourceCode, attributesNames, defines, fallbacks);
                } else { // Sorry we did everything we can
                    Tools.Error("Unable to compile effect: " + this.name);
                    Tools.Error("Defines: " + defines);
                    Tools.Error("Error: " + e.message);
                    this._compilationError = e.message;

                    if (this.onError) {
                        this.onError(this, this._compilationError);
                    }
                }
            }
        }

        public _bindTexture(channel: string, texture: WebGLTexture): void {
            this._engine._bindTexture(this._samplers.indexOf(channel), texture);
        }

        public setTexture(channel: string, texture: BaseTexture): void {
            this._engine.setTexture(this._samplers.indexOf(channel), texture);
        }

        public setTextureFromPostProcess(channel: string, postProcess: PostProcess): void {
            this._engine.setTextureFromPostProcess(this._samplers.indexOf(channel), postProcess);
        }

        //public _cacheMatrix(uniformName, matrix) {
        //    if (!this._valueCache[uniformName]) {
        //        this._valueCache[uniformName] = new BABYLON.Matrix();
        //    }

        //    for (var index = 0; index < 16; index++) {
        //        this._valueCache[uniformName].m[index] = matrix.m[index];
        //    }
        //};

        public _cacheFloat2(uniformName: string, x: number, y: number): void {
            if (!this._valueCache[uniformName]) {
                this._valueCache[uniformName] = [x, y];
                return;
            }

            this._valueCache[uniformName][0] = x;
            this._valueCache[uniformName][1] = y;
        }

        public _cacheFloat3(uniformName: string, x: number, y: number, z: number): void {
            if (!this._valueCache[uniformName]) {
                this._valueCache[uniformName] = [x, y, z];
                return;
            }

            this._valueCache[uniformName][0] = x;
            this._valueCache[uniformName][1] = y;
            this._valueCache[uniformName][2] = z;
        }

        public _cacheFloat4(uniformName: string, x: number, y: number, z: number, w: number): void {
            if (!this._valueCache[uniformName]) {
                this._valueCache[uniformName] = [x, y, z, w];
                return;
            }

            this._valueCache[uniformName][0] = x;
            this._valueCache[uniformName][1] = y;
            this._valueCache[uniformName][2] = z;
            this._valueCache[uniformName][3] = w;
        }

        public setArray(uniformName: string, array: number[]): Effect {
            this._engine.setArray(this.getUniform(uniformName), array);

            return this;
        }

        public setArray2(uniformName: string, array: number[]): Effect {
            this._engine.setArray2(this.getUniform(uniformName), array);

            return this;
        }

        public setArray3(uniformName: string, array: number[]): Effect {
            this._engine.setArray3(this.getUniform(uniformName), array);

            return this;
        }

        public setArray4(uniformName: string, array: number[]): Effect {
            this._engine.setArray4(this.getUniform(uniformName), array);

            return this;
        }

        public setMatrices(uniformName: string, matrices: Float32Array): Effect {
            this._engine.setMatrices(this.getUniform(uniformName), matrices);

            return this;
        }

        public setMatrix(uniformName: string, matrix: Matrix): Effect {
            //if (this._valueCache[uniformName] && this._valueCache[uniformName].equals(matrix))
            //    return;

            //this._cacheMatrix(uniformName, matrix);
            this._engine.setMatrix(this.getUniform(uniformName), matrix);

            return this;
        }

        public setFloat(uniformName: string, value: number): Effect {
            if (this._valueCache[uniformName] && this._valueCache[uniformName] === value)
                return this;

            this._valueCache[uniformName] = value;

            this._engine.setFloat(this.getUniform(uniformName), value);

            return this;
        }

        public setBool(uniformName: string, bool: boolean): Effect {
            if (this._valueCache[uniformName] && this._valueCache[uniformName] === bool)
                return this;

            this._valueCache[uniformName] = bool;

            this._engine.setBool(this.getUniform(uniformName), bool ? 1 : 0);

            return this;
        }

        public setVector2(uniformName: string, vector2: Vector2): Effect {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === vector2.x && this._valueCache[uniformName][1] === vector2.y)
                return this;

            this._cacheFloat2(uniformName, vector2.x, vector2.y);
            this._engine.setFloat2(this.getUniform(uniformName), vector2.x, vector2.y);

            return this;
        }

        public setFloat2(uniformName: string, x: number, y: number): Effect {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === x && this._valueCache[uniformName][1] === y)
                return this;

            this._cacheFloat2(uniformName, x, y);
            this._engine.setFloat2(this.getUniform(uniformName), x, y);

            return this;
        }

        public setVector3(uniformName: string, vector3: Vector3): Effect {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === vector3.x && this._valueCache[uniformName][1] === vector3.y && this._valueCache[uniformName][2] === vector3.z)
                return this;

            this._cacheFloat3(uniformName, vector3.x, vector3.y, vector3.z);

            this._engine.setFloat3(this.getUniform(uniformName), vector3.x, vector3.y, vector3.z);

            return this;
        }

        public setFloat3(uniformName: string, x: number, y: number, z: number): Effect {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === x && this._valueCache[uniformName][1] === y && this._valueCache[uniformName][2] === z)
                return this;

            this._cacheFloat3(uniformName, x, y, z);
            this._engine.setFloat3(this.getUniform(uniformName), x, y, z);

            return this;
        }

        public setFloat4(uniformName: string, x: number, y: number, z: number, w: number): Effect {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === x && this._valueCache[uniformName][1] === y && this._valueCache[uniformName][2] === z && this._valueCache[uniformName][3] === w)
                return this;

            this._cacheFloat4(uniformName, x, y, z, w);
            this._engine.setFloat4(this.getUniform(uniformName), x, y, z, w);

            return this;
        }

        public setColor3(uniformName: string, color3: Color3): Effect {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === color3.r && this._valueCache[uniformName][1] === color3.g && this._valueCache[uniformName][2] === color3.b)
                return this;

            this._cacheFloat3(uniformName, color3.r, color3.g, color3.b);
            this._engine.setColor3(this.getUniform(uniformName), color3);

            return this;
        }

        public setColor4(uniformName: string, color3: Color3, alpha: number): Effect {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === color3.r && this._valueCache[uniformName][1] === color3.g && this._valueCache[uniformName][2] === color3.b && this._valueCache[uniformName][3] === alpha)
                return this;

            this._cacheFloat4(uniformName, color3.r, color3.g, color3.b, alpha);
            this._engine.setColor4(this.getUniform(uniformName), color3, alpha);

            return this;
        }

        // Statics
        public static ShadersStore = {};
    }
} 