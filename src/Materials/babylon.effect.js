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
        function Effect(baseName, attributesNames, uniformsNames, samplers, engine, defines, fallbacks, onCompiled, onError, indexParameters) {
            var _this = this;
            this._isReady = false;
            this._compilationError = "";
            this._valueCache = {};
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
                _this._processIncludes(vertexCode, function (vertexCodeWithIncludes) {
                    _this._loadFragmentShader(fragmentSource, function (fragmentCode) {
                        _this._processIncludes(fragmentCode, function (fragmentCodeWithIncludes) {
                            _this._prepareEffect(vertexCodeWithIncludes, fragmentCodeWithIncludes, attributesNames, defines, fallbacks);
                        });
                    });
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
            if (vertex[0] === "." || vertex[0] === "/" || vertex.indexOf("http") > -1) {
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
            if (fragment[0] === "." || fragment[0] === "/" || fragment.indexOf("http") > -1) {
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
        Effect.prototype._processIncludes = function (sourceCode, callback) {
            var _this = this;
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
                        }
                        else {
                            includeContent = includeContent.replace(/\{X\}/g, indexString);
                        }
                    }
                    // Replace
                    returnValue = returnValue.replace(match[0], includeContent);
                }
                else {
                    var includeShaderUrl = BABYLON.Engine.ShadersRepository + "ShadersInclude/" + includeFile + ".fx";
                    BABYLON.Tools.LoadFile(includeShaderUrl, function (fileContent) {
                        Effect.IncludesShadersStore[includeFile] = fileContent;
                        _this._processIncludes(returnValue, callback);
                    });
                    return;
                }
                match = regex.exec(sourceCode);
            }
            callback(returnValue);
        };
        Effect.prototype._processPrecision = function (source) {
            if (source.indexOf("precision highp float") === -1) {
                if (!this._engine.getCaps().highPrecisionShaderSupported) {
                    source = "precision mediump float;\n" + source;
                }
                else {
                    source = "precision highp float;\n" + source;
                }
            }
            else {
                if (!this._engine.getCaps().highPrecisionShaderSupported) {
                    source = source.replace("precision highp float", "precision mediump float");
                }
            }
            return source;
        };
        Effect.prototype._prepareEffect = function (vertexSourceCode, fragmentSourceCode, attributesNames, defines, fallbacks) {
            try {
                var engine = this._engine;
                // Precision
                vertexSourceCode = this._processPrecision(vertexSourceCode);
                fragmentSourceCode = this._processPrecision(fragmentSourceCode);
                this._program = engine.createShaderProgram(vertexSourceCode, fragmentSourceCode, defines);
                this._uniforms = engine.getUniforms(this._program, this._uniformsNames);
                this._attributes = engine.getAttributes(this._program, attributesNames);
                var index;
                for (index = 0; index < this._samplers.length; index++) {
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
            this._engine.setTexture(this._samplers.indexOf(channel), this.getUniform(channel), texture);
        };
        Effect.prototype.setTextureArray = function (channel, textures) {
            if (this._samplers.indexOf(channel + "Ex") === -1) {
                var initialPos = this._samplers.indexOf(channel);
                for (var index = 1; index < textures.length; index++) {
                    this._samplers.splice(initialPos + index, 0, channel + "Ex");
                }
            }
            this._engine.setTextureArray(this._samplers.indexOf(channel), this.getUniform(channel), textures);
        };
        Effect.prototype.setTextureFromPostProcess = function (channel, postProcess) {
            this._engine.setTextureFromPostProcess(this._samplers.indexOf(channel), postProcess);
        };
        Effect.prototype._cacheMatrix = function (uniformName, matrix) {
            var changed = false;
            var cache = this._valueCache[uniformName];
            if (!cache || !(cache instanceof BABYLON.Matrix)) {
                changed = true;
                cache = new BABYLON.Matrix();
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
        };
        Effect.prototype._cacheFloat2 = function (uniformName, x, y) {
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
            this._valueCache[uniformName] = cache;
            return changed;
        };
        Effect.prototype._cacheFloat3 = function (uniformName, x, y, z) {
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
            this._valueCache[uniformName] = cache;
            return changed;
        };
        Effect.prototype._cacheFloat4 = function (uniformName, x, y, z, w) {
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
            this._valueCache[uniformName] = cache;
            return changed;
        };
        Effect.prototype.setArray = function (uniformName, array) {
            this._valueCache[uniformName] = null;
            this._engine.setArray(this.getUniform(uniformName), array);
            return this;
        };
        Effect.prototype.setArray2 = function (uniformName, array) {
            this._valueCache[uniformName] = null;
            this._engine.setArray2(this.getUniform(uniformName), array);
            return this;
        };
        Effect.prototype.setArray3 = function (uniformName, array) {
            this._valueCache[uniformName] = null;
            this._engine.setArray3(this.getUniform(uniformName), array);
            return this;
        };
        Effect.prototype.setArray4 = function (uniformName, array) {
            this._valueCache[uniformName] = null;
            this._engine.setArray4(this.getUniform(uniformName), array);
            return this;
        };
        Effect.prototype.setMatrices = function (uniformName, matrices) {
            this._valueCache[uniformName] = null;
            this._engine.setMatrices(this.getUniform(uniformName), matrices);
            return this;
        };
        Effect.prototype.setMatrix = function (uniformName, matrix) {
            if (this._cacheMatrix(uniformName, matrix)) {
                this._engine.setMatrix(this.getUniform(uniformName), matrix);
            }
            return this;
        };
        Effect.prototype.setMatrix3x3 = function (uniformName, matrix) {
            this._valueCache[uniformName] = null;
            this._engine.setMatrix3x3(this.getUniform(uniformName), matrix);
            return this;
        };
        Effect.prototype.setMatrix2x2 = function (uniformName, matrix) {
            this._valueCache[uniformName] = null;
            this._engine.setMatrix2x2(this.getUniform(uniformName), matrix);
            return this;
        };
        Effect.prototype.setFloat = function (uniformName, value) {
            var cache = this._valueCache[uniformName];
            if (cache && cache === value)
                return this;
            this._valueCache[uniformName] = value;
            this._engine.setFloat(this.getUniform(uniformName), value);
            return this;
        };
        Effect.prototype.setBool = function (uniformName, bool) {
            var cache = this._valueCache[uniformName];
            if (cache && cache === bool)
                return this;
            this._valueCache[uniformName] = bool;
            this._engine.setBool(this.getUniform(uniformName), bool ? 1 : 0);
            return this;
        };
        Effect.prototype.setVector2 = function (uniformName, vector2) {
            if (this._cacheFloat2(uniformName, vector2.x, vector2.y)) {
                this._engine.setFloat2(this.getUniform(uniformName), vector2.x, vector2.y);
            }
            return this;
        };
        Effect.prototype.setFloat2 = function (uniformName, x, y) {
            if (this._cacheFloat2(uniformName, x, y)) {
                this._engine.setFloat2(this.getUniform(uniformName), x, y);
            }
            return this;
        };
        Effect.prototype.setVector3 = function (uniformName, vector3) {
            if (this._cacheFloat3(uniformName, vector3.x, vector3.y, vector3.z)) {
                this._engine.setFloat3(this.getUniform(uniformName), vector3.x, vector3.y, vector3.z);
            }
            return this;
        };
        Effect.prototype.setFloat3 = function (uniformName, x, y, z) {
            if (this._cacheFloat3(uniformName, x, y, z)) {
                this._engine.setFloat3(this.getUniform(uniformName), x, y, z);
            }
            return this;
        };
        Effect.prototype.setVector4 = function (uniformName, vector4) {
            if (this._cacheFloat4(uniformName, vector4.x, vector4.y, vector4.z, vector4.w)) {
                this._engine.setFloat4(this.getUniform(uniformName), vector4.x, vector4.y, vector4.z, vector4.w);
            }
            return this;
        };
        Effect.prototype.setFloat4 = function (uniformName, x, y, z, w) {
            if (this._cacheFloat4(uniformName, x, y, z, w)) {
                this._engine.setFloat4(this.getUniform(uniformName), x, y, z, w);
            }
            return this;
        };
        Effect.prototype.setColor3 = function (uniformName, color3) {
            if (this._cacheFloat3(uniformName, color3.r, color3.g, color3.b)) {
                this._engine.setColor3(this.getUniform(uniformName), color3);
            }
            return this;
        };
        Effect.prototype.setColor4 = function (uniformName, color3, alpha) {
            if (this._cacheFloat4(uniformName, color3.r, color3.g, color3.b, alpha)) {
                this._engine.setColor4(this.getUniform(uniformName), color3, alpha);
            }
            return this;
        };
        // Statics
        Effect.ShadersStore = {};
        Effect.IncludesShadersStore = {};
        return Effect;
    })();
    BABYLON.Effect = Effect;
})(BABYLON || (BABYLON = {}));
