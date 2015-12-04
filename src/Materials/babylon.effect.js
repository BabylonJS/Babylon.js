var BABYLON;
(function (BABYLON) {
    var EffectFallbacks = (function () {
        function EffectFallbacks() {
            this._defines = {};
            this._currentRank = 32;
            this._maxRank = -1;
        }
        EffectFallbacks.prototype.addFallback = function (rank, define) {
            if (!this._defines[rank]) {
                if (rank < this._currentRank) {
                    this._currentRank = rank;
                }
                if (rank > this._maxRank) {
                    this._maxRank = rank;
                }
                this._defines[rank] = new Array();
            }
            this._defines[rank].push(define);
        };
        EffectFallbacks.prototype.addCPUSkinningFallback = function (rank, mesh) {
            this._meshRank = rank;
            this._mesh = mesh;
            if (rank > this._maxRank) {
                this._maxRank = rank;
            }
        };
        Object.defineProperty(EffectFallbacks.prototype, "isMoreFallbacks", {
            get: function () {
                return this._currentRank <= this._maxRank;
            },
            enumerable: true,
            configurable: true
        });
        EffectFallbacks.prototype.reduce = function (currentDefines) {
            var currentFallbacks = this._defines[this._currentRank];
            for (var index = 0; index < currentFallbacks.length; index++) {
                currentDefines = currentDefines.replace("#define " + currentFallbacks[index], "");
            }
            if (this._mesh && this._currentRank === this._meshRank) {
                this._mesh.computeBonesUsingShaders = false;
                currentDefines = currentDefines.replace("#define NUM_BONE_INFLUENCERS " + this._mesh.numBoneInfluencers, "#define NUM_BONE_INFLUENCERS 0");
                BABYLON.Tools.Log("Falling back to CPU skinning for " + this._mesh.name);
            }
            this._currentRank++;
            return currentDefines;
        };
        return EffectFallbacks;
    })();
    BABYLON.EffectFallbacks = EffectFallbacks;
    var Effect = (function () {
        function Effect(baseName, attributesNames, uniformsNames, samplers, engine, defines, fallbacks, onCompiled, onError) {
            var _this = this;
            this._isReady = false;
            this._compilationError = "";
            this._valueCache = [];
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
            }
            else {
                vertexSource = baseName.vertex || baseName;
            }
            if (baseName.fragmentElement) {
                fragmentSource = document.getElementById(baseName.fragmentElement);
                if (!fragmentSource) {
                    fragmentSource = baseName.fragmentElement;
                }
            }
            else {
                fragmentSource = baseName.fragment || baseName;
            }
            this._loadVertexShader(vertexSource, function (vertexCode) {
                _this._loadFragmentShader(fragmentSource, function (fragmentCode) {
                    _this._prepareEffect(vertexCode, fragmentCode, attributesNames, defines, fallbacks);
                });
            });
        }
        // Properties
        Effect.prototype.isReady = function () {
            return this._isReady;
        };
        Effect.prototype.getProgram = function () {
            return this._program;
        };
        Effect.prototype.getAttributesNames = function () {
            return this._attributesNames;
        };
        Effect.prototype.getAttributeLocation = function (index) {
            return this._attributes[index];
        };
        Effect.prototype.getAttributeLocationByName = function (name) {
            var index = this._attributesNames.indexOf(name);
            return this._attributes[index];
        };
        Effect.prototype.getAttributesCount = function () {
            return this._attributes.length;
        };
        Effect.prototype.getUniformIndex = function (uniformName) {
            return this._uniformsNames.indexOf(uniformName);
        };
        Effect.prototype.getUniform = function (uniformName) {
            return this._uniforms[this._uniformsNames.indexOf(uniformName)];
        };
        Effect.prototype.getSamplers = function () {
            return this._samplers;
        };
        Effect.prototype.getCompilationError = function () {
            return this._compilationError;
        };
        // Methods
        Effect.prototype._loadVertexShader = function (vertex, callback) {
            // DOM element ?
            if (vertex instanceof HTMLElement) {
                var vertexCode = BABYLON.Tools.GetDOMTextContent(vertex);
                callback(vertexCode);
                return;
            }
            // Is in local store ?
            if (Effect.ShadersStore[vertex + "VertexShader"]) {
                callback(Effect.ShadersStore[vertex + "VertexShader"]);
                return;
            }
            var vertexShaderUrl;
            if (vertex[0] === "." || vertex[0] === "/") {
                vertexShaderUrl = vertex;
            }
            else {
                vertexShaderUrl = BABYLON.Engine.ShadersRepository + vertex;
            }
            // Vertex shader
            BABYLON.Tools.LoadFile(vertexShaderUrl + ".vertex.fx", callback);
        };
        Effect.prototype._loadFragmentShader = function (fragment, callback) {
            // DOM element ?
            if (fragment instanceof HTMLElement) {
                var fragmentCode = BABYLON.Tools.GetDOMTextContent(fragment);
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
            if (fragment[0] === "." || fragment[0] === "/") {
                fragmentShaderUrl = fragment;
            }
            else {
                fragmentShaderUrl = BABYLON.Engine.ShadersRepository + fragment;
            }
            // Fragment shader
            BABYLON.Tools.LoadFile(fragmentShaderUrl + ".fragment.fx", callback);
        };
        Effect.prototype._dumpShadersName = function () {
            if (this.name.vertexElement) {
                BABYLON.Tools.Error("Vertex shader:" + this.name.vertexElement);
                BABYLON.Tools.Error("Fragment shader:" + this.name.fragmentElement);
            }
            else if (this.name.vertex) {
                BABYLON.Tools.Error("Vertex shader:" + this.name.vertex);
                BABYLON.Tools.Error("Fragment shader:" + this.name.fragment);
            }
            else {
                BABYLON.Tools.Error("Vertex shader:" + this.name);
                BABYLON.Tools.Error("Fragment shader:" + this.name);
            }
        };
        Effect.prototype._prepareEffect = function (vertexSourceCode, fragmentSourceCode, attributesNames, defines, fallbacks) {
            try {
                var engine = this._engine;
                if (!engine.getCaps().highPrecisionShaderSupported) {
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
            }
            catch (e) {
                // Is it a problem with precision?
                if (e.message.indexOf("highp") !== -1) {
                    vertexSourceCode = vertexSourceCode.replace("precision highp float", "precision mediump float");
                    fragmentSourceCode = fragmentSourceCode.replace("precision highp float", "precision mediump float");
                    this._prepareEffect(vertexSourceCode, fragmentSourceCode, attributesNames, defines, fallbacks);
                    return;
                }
                // Let's go through fallbacks then
                if (fallbacks && fallbacks.isMoreFallbacks) {
                    BABYLON.Tools.Error("Unable to compile effect with current defines. Trying next fallback.");
                    this._dumpShadersName();
                    defines = fallbacks.reduce(defines);
                    this._prepareEffect(vertexSourceCode, fragmentSourceCode, attributesNames, defines, fallbacks);
                }
                else {
                    BABYLON.Tools.Error("Unable to compile effect: ");
                    this._dumpShadersName();
                    BABYLON.Tools.Error("Defines: " + defines);
                    BABYLON.Tools.Error("Error: " + e.message);
                    this._compilationError = e.message;
                    if (this.onError) {
                        this.onError(this, this._compilationError);
                    }
                }
            }
        };
        Object.defineProperty(Effect.prototype, "isSupported", {
            get: function () {
                return this._compilationError === "";
            },
            enumerable: true,
            configurable: true
        });
        Effect.prototype._bindTexture = function (channel, texture) {
            this._engine._bindTexture(this._samplers.indexOf(channel), texture);
        };
        Effect.prototype.setTexture = function (channel, texture) {
            this._engine.setTexture(this._samplers.indexOf(channel), texture);
        };
        Effect.prototype.setTextureFromPostProcess = function (channel, postProcess) {
            this._engine.setTextureFromPostProcess(this._samplers.indexOf(channel), postProcess);
        };
        Effect.prototype._cacheMatrix = function (uniformName, matrix) {
            if (!this._valueCache[uniformName]) {
                this._valueCache[uniformName] = new BABYLON.Matrix();
            }
            for (var index = 0; index < 16; index++) {
                this._valueCache[uniformName].m[index] = matrix.m[index];
            }
        };
        Effect.prototype._cacheFloat2 = function (uniformName, x, y) {
            if (!this._valueCache[uniformName]) {
                this._valueCache[uniformName] = [x, y];
                return;
            }
            this._valueCache[uniformName][0] = x;
            this._valueCache[uniformName][1] = y;
        };
        Effect.prototype._cacheFloat3 = function (uniformName, x, y, z) {
            if (!this._valueCache[uniformName]) {
                this._valueCache[uniformName] = [x, y, z];
                return;
            }
            this._valueCache[uniformName][0] = x;
            this._valueCache[uniformName][1] = y;
            this._valueCache[uniformName][2] = z;
        };
        Effect.prototype._cacheFloat4 = function (uniformName, x, y, z, w) {
            if (!this._valueCache[uniformName]) {
                this._valueCache[uniformName] = [x, y, z, w];
                return;
            }
            this._valueCache[uniformName][0] = x;
            this._valueCache[uniformName][1] = y;
            this._valueCache[uniformName][2] = z;
            this._valueCache[uniformName][3] = w;
        };
        Effect.prototype.setArray = function (uniformName, array) {
            this._engine.setArray(this.getUniform(uniformName), array);
            return this;
        };
        Effect.prototype.setArray2 = function (uniformName, array) {
            this._engine.setArray2(this.getUniform(uniformName), array);
            return this;
        };
        Effect.prototype.setArray3 = function (uniformName, array) {
            this._engine.setArray3(this.getUniform(uniformName), array);
            return this;
        };
        Effect.prototype.setArray4 = function (uniformName, array) {
            this._engine.setArray4(this.getUniform(uniformName), array);
            return this;
        };
        Effect.prototype.setMatrices = function (uniformName, matrices) {
            this._engine.setMatrices(this.getUniform(uniformName), matrices);
            return this;
        };
        Effect.prototype.setMatrix = function (uniformName, matrix) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName].equals(matrix))
                return this;
            this._cacheMatrix(uniformName, matrix);
            this._engine.setMatrix(this.getUniform(uniformName), matrix);
            return this;
        };
        Effect.prototype.setMatrix3x3 = function (uniformName, matrix) {
            this._engine.setMatrix3x3(this.getUniform(uniformName), matrix);
            return this;
        };
        Effect.prototype.setMatrix2x2 = function (uniformname, matrix) {
            this._engine.setMatrix2x2(this.getUniform(uniformname), matrix);
            return this;
        };
        Effect.prototype.setFloat = function (uniformName, value) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName] === value)
                return this;
            this._valueCache[uniformName] = value;
            this._engine.setFloat(this.getUniform(uniformName), value);
            return this;
        };
        Effect.prototype.setBool = function (uniformName, bool) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName] === bool)
                return this;
            this._valueCache[uniformName] = bool;
            this._engine.setBool(this.getUniform(uniformName), bool ? 1 : 0);
            return this;
        };
        Effect.prototype.setVector2 = function (uniformName, vector2) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === vector2.x && this._valueCache[uniformName][1] === vector2.y)
                return this;
            this._cacheFloat2(uniformName, vector2.x, vector2.y);
            this._engine.setFloat2(this.getUniform(uniformName), vector2.x, vector2.y);
            return this;
        };
        Effect.prototype.setFloat2 = function (uniformName, x, y) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === x && this._valueCache[uniformName][1] === y)
                return this;
            this._cacheFloat2(uniformName, x, y);
            this._engine.setFloat2(this.getUniform(uniformName), x, y);
            return this;
        };
        Effect.prototype.setVector3 = function (uniformName, vector3) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === vector3.x && this._valueCache[uniformName][1] === vector3.y && this._valueCache[uniformName][2] === vector3.z)
                return this;
            this._cacheFloat3(uniformName, vector3.x, vector3.y, vector3.z);
            this._engine.setFloat3(this.getUniform(uniformName), vector3.x, vector3.y, vector3.z);
            return this;
        };
        Effect.prototype.setFloat3 = function (uniformName, x, y, z) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === x && this._valueCache[uniformName][1] === y && this._valueCache[uniformName][2] === z)
                return this;
            this._cacheFloat3(uniformName, x, y, z);
            this._engine.setFloat3(this.getUniform(uniformName), x, y, z);
            return this;
        };
        Effect.prototype.setVector4 = function (uniformName, vector4) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === vector4.x && this._valueCache[uniformName][1] === vector4.y && this._valueCache[uniformName][2] === vector4.z && this._valueCache[uniformName][3] === vector4.w)
                return this;
            this._cacheFloat4(uniformName, vector4.x, vector4.y, vector4.z, vector4.w);
            this._engine.setFloat4(this.getUniform(uniformName), vector4.x, vector4.y, vector4.z, vector4.w);
            return this;
        };
        Effect.prototype.setFloat4 = function (uniformName, x, y, z, w) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === x && this._valueCache[uniformName][1] === y && this._valueCache[uniformName][2] === z && this._valueCache[uniformName][3] === w)
                return this;
            this._cacheFloat4(uniformName, x, y, z, w);
            this._engine.setFloat4(this.getUniform(uniformName), x, y, z, w);
            return this;
        };
        Effect.prototype.setColor3 = function (uniformName, color3) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === color3.r && this._valueCache[uniformName][1] === color3.g && this._valueCache[uniformName][2] === color3.b)
                return this;
            this._cacheFloat3(uniformName, color3.r, color3.g, color3.b);
            this._engine.setColor3(this.getUniform(uniformName), color3);
            return this;
        };
        Effect.prototype.setColor4 = function (uniformName, color3, alpha) {
            if (this._valueCache[uniformName] && this._valueCache[uniformName][0] === color3.r && this._valueCache[uniformName][1] === color3.g && this._valueCache[uniformName][2] === color3.b && this._valueCache[uniformName][3] === alpha)
                return this;
            this._cacheFloat4(uniformName, color3.r, color3.g, color3.b, alpha);
            this._engine.setColor4(this.getUniform(uniformName), color3, alpha);
            return this;
        };
        // Statics
        Effect.ShadersStore = {};
        return Effect;
    })();
    BABYLON.Effect = Effect;
})(BABYLON || (BABYLON = {}));
