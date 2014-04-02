"use strict";

var BABYLON = BABYLON || {};

(function () {

    BABYLON.Effect = function (baseName, attributesNames, uniformsNames, samplers, engine, defines, optionalDefines) {
        this._engine = engine;
        this.name = baseName;
        this.defines = defines;
        this._uniformsNames = uniformsNames.concat(samplers);
        this._samplers = samplers;
        this._isReady = false;
        this._compilationError = "";
        this._attributesNames = attributesNames;

        var vertexSource;
        var fragmentSource;

        if (baseName.vertexElement) {
            vertexSource = document.getElementById(baseName.vertexElement);
            fragmentSource = document.getElementById(baseName.fragmentElement);
        } else {
            vertexSource = baseName.vertexElement || baseName.vertex || baseName;
            fragmentSource = baseName.fragmentElement || baseName.fragment || baseName;
        }

        var that = this;
        this._loadVertexShader(vertexSource, function (vertexCode) {
            that._loadFragmentShader(fragmentSource, function (fragmentCode) {
                that._prepareEffect(vertexCode, fragmentCode, attributesNames, defines, optionalDefines);
            });
        });   

        // Cache
        this._valueCache = [];
    };

    // Properties
    BABYLON.Effect.prototype.isReady = function () {
        return this._isReady;
    };

    BABYLON.Effect.prototype.getProgram = function () {
        return this._program;
    };

    BABYLON.Effect.prototype.getAttributesNames = function () {
        return this._attributesNames;
    };

    BABYLON.Effect.prototype.getAttribute = function (index) {
        return this._attributes[index];
    };

    BABYLON.Effect.prototype.getAttributesCount = function () {
        return this._attributes.length;
    };

    BABYLON.Effect.prototype.getUniformIndex = function (uniformName) {
        return this._uniformsNames.indexOf(uniformName);
    };

    BABYLON.Effect.prototype.getUniform = function (uniformName) {
        return this._uniforms[this._uniformsNames.indexOf(uniformName)];
    };

    BABYLON.Effect.prototype.getSamplers = function () {
        return this._samplers;
    };

    BABYLON.Effect.prototype.getCompilationError = function () {
        return this._compilationError;
    };

    // Methods
    BABYLON.Effect.prototype._loadVertexShader = function (vertex, callback) {
        // DOM element ?
        if (vertex instanceof HTMLElement) {
            var vertexCode = BABYLON.Tools.GetDOMTextContent(vertex);
            callback(vertexCode);
            return;
        }

        // Is in local store ?
        if (BABYLON.Effect.ShadersStore[vertex + "VertexShader"]) {
            callback(BABYLON.Effect.ShadersStore[vertex + "VertexShader"]);
            return;
        }
        
        var vertexShaderUrl;

        if (vertex[0] === ".") {
            vertexShaderUrl = vertex;
        } else {
            vertexShaderUrl = BABYLON.Engine.ShadersRepository + vertex;
        }

        // Vertex shader
        BABYLON.Tools.LoadFile(vertexShaderUrl + ".vertex.fx", callback);
    };

    BABYLON.Effect.prototype._loadFragmentShader = function (fragment, callback) {
        // DOM element ?
        if (fragment instanceof HTMLElement) {
            var fragmentCode = BABYLON.Tools.GetDOMTextContent(fragment);
            callback(fragmentCode);
            return;
        }

        // Is in local store ?
        if (BABYLON.Effect.ShadersStore[fragment + "PixelShader"]) {
            callback(BABYLON.Effect.ShadersStore[fragment + "PixelShader"]);
            return;
        }
        
        var fragmentShaderUrl;

        if (fragment[0] === ".") {
            fragmentShaderUrl = fragment;
        } else {
            fragmentShaderUrl = BABYLON.Engine.ShadersRepository + fragment;
        }

        // Fragment shader
        BABYLON.Tools.LoadFile(fragmentShaderUrl + ".fragment.fx", callback);
    };

    BABYLON.Effect.prototype._prepareEffect = function (vertexSourceCode, fragmentSourceCode, attributesNames, defines, optionalDefines, useFallback) {
        try {
            var engine = this._engine;
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
        } catch (e) {
            if (!useFallback && optionalDefines) {
                for (var index = 0; index < optionalDefines.length; index++) {
                    defines = defines.replace(optionalDefines[index], "");
                }
                this._prepareEffect(vertexSourceCode, fragmentSourceCode, attributesNames, defines, optionalDefines, true);
            } else {
                console.error("Unable to compile effect: " + this.name);
                console.error("Defines: " + defines);
                console.error("Optional defines: " + optionalDefines);
                this._compilationError = e.message;
            }
        }
    };

    BABYLON.Effect.prototype._bindTexture = function (channel, texture) {
        this._engine._bindTexture(this._samplers.indexOf(channel), texture);
    };

    BABYLON.Effect.prototype.setTexture = function (channel, texture) {
        this._engine.setTexture(this._samplers.indexOf(channel), texture);
    };

    BABYLON.Effect.prototype.setTextureFromPostProcess = function (channel, postProcess) {
        this._engine.setTextureFromPostProcess(this._samplers.indexOf(channel), postProcess);
    };

    //BABYLON.Effect.prototype._cacheMatrix = function (uniformName, matrix) {
    //    if (!this._valueCache[uniformName]) {
    //        this._valueCache[uniformName] = new BABYLON.Matrix();
    //    }

    //    for (var index = 0; index < 16; index++) {
    //        this._valueCache[uniformName].m[index] = matrix.m[index];
    //    }
    //};

    BABYLON.Effect.prototype._cacheFloat2 = function (uniformName, x, y) {
        if (!this._valueCache[uniformName]) {
            this._valueCache[uniformName] = [x, y];
            return;
        }

        this._valueCache[uniformName][0] = x;
        this._valueCache[uniformName][1] = y;
    };

    BABYLON.Effect.prototype._cacheFloat3 = function (uniformName, x, y, z) {
        if (!this._valueCache[uniformName]) {
            this._valueCache[uniformName] = [x, y, z];
            return;
        }

        this._valueCache[uniformName][0] = x;
        this._valueCache[uniformName][1] = y;
        this._valueCache[uniformName][2] = z;
    };

    BABYLON.Effect.prototype._cacheFloat4 = function (uniformName, x, y, z, w) {
        if (!this._valueCache[uniformName]) {
            this._valueCache[uniformName] = [x, y, z, w];
            return;
        }

        this._valueCache[uniformName][0] = x;
        this._valueCache[uniformName][1] = y;
        this._valueCache[uniformName][2] = z;
        this._valueCache[uniformName][3] = w;
    };
    
    BABYLON.Effect.prototype.setArray = function (uniformName, array) {
        this._engine.setArray(this.getUniform(uniformName), array);

        return this;
    };

    BABYLON.Effect.prototype.setMatrices = function (uniformName, matrices) {
        this._engine.setMatrices(this.getUniform(uniformName), matrices);

        return this;
    };

    BABYLON.Effect.prototype.setMatrix = function (uniformName, matrix) {
        //if (this._valueCache[uniformName] && this._valueCache[uniformName].equals(matrix))
        //    return;

        //this._cacheMatrix(uniformName, matrix);
        this._engine.setMatrix(this.getUniform(uniformName), matrix);

        return this;
    };

    BABYLON.Effect.prototype.setFloat = function (uniformName, value) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName] === value)
            return this;

        this._valueCache[uniformName] = value;

        this._engine.setFloat(this.getUniform(uniformName), value);

        return this;
    };

    BABYLON.Effect.prototype.setBool = function (uniformName, bool) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName] === bool)
            return this;

        this._valueCache[uniformName] = bool;

        this._engine.setBool(this.getUniform(uniformName), bool);

        return this;
    };
    
    BABYLON.Effect.prototype.setVector2 = function (uniformName, vector2) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == vector2.x && this._valueCache[uniformName][1] == vector2.y)
            return this;

        this._cacheFloat2(uniformName, vector2.x, vector2.y);
        this._engine.setFloat2(this.getUniform(uniformName), vector2.x, vector2.y);

        return this;
    };

    BABYLON.Effect.prototype.setFloat2 = function (uniformName, x, y) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == x && this._valueCache[uniformName][1] == y)
            return this;

        this._cacheFloat2(uniformName, x, y);
        this._engine.setFloat2(this.getUniform(uniformName), x, y);

        return this;
    };
    
    BABYLON.Effect.prototype.setVector3 = function (uniformName, vector3) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == vector3.x && this._valueCache[uniformName][1] == vector3.y && this._valueCache[uniformName][2] == vector3.z)
            return this;

        this._cacheFloat3(uniformName, vector3.x, vector3.y, vector3.z);

        this._engine.setFloat3(this.getUniform(uniformName), vector3.x, vector3.y, vector3.z);

        return this;
    };

    BABYLON.Effect.prototype.setFloat3 = function (uniformName, x, y, z) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == x && this._valueCache[uniformName][1] == y && this._valueCache[uniformName][2] == z)
            return this;

        this._cacheFloat3(uniformName, x, y, z);
        this._engine.setFloat3(this.getUniform(uniformName), x, y, z);

        return this;
    };

    BABYLON.Effect.prototype.setFloat4 = function (uniformName, x, y, z, w) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == x && this._valueCache[uniformName][1] == y && this._valueCache[uniformName][2] == z && this._valueCache[uniformName][3] == w)
            return this;

        this._cacheFloat4(uniformName, x, y, z, w);
        this._engine.setFloat4(this.getUniform(uniformName), x, y, z, w);

        return this;
    };

    BABYLON.Effect.prototype.setColor3 = function (uniformName, color3) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == color3.r && this._valueCache[uniformName][1] == color3.g && this._valueCache[uniformName][2] == color3.b)
            return this;

        this._cacheFloat3(uniformName, color3.r, color3.g, color3.b);
        this._engine.setColor3(this.getUniform(uniformName), color3);

        return this;
    };

    BABYLON.Effect.prototype.setColor4 = function (uniformName, color3, alpha) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == color3.r && this._valueCache[uniformName][1] == color3.g && this._valueCache[uniformName][2] == color3.b && this._valueCache[uniformName][3] == alpha)
            return this;

        this._cacheFloat4(uniformName, color3.r, color3.g, color3.b, alpha);
        this._engine.setColor4(this.getUniform(uniformName), color3, alpha);

        return this;
    };

    // Statics
    BABYLON.Effect.ShadersStore = {};

})();