var BABYLON = BABYLON || {};

(function () {

    BABYLON.Effect = function (baseName, attributesNames, uniformsNames, samplers, engine, defines) {
        this._engine = engine;
        this.name = baseName;
        this.defines = defines;
        this._uniformsNames = uniformsNames.concat(samplers);
        this._samplers = samplers;
        this._isReady = false;
        this._compilationError = "";

        var that = this;

        // Is in local store ?
        if (BABYLON.Effect.ShadersStore[baseName + "VertexShader"]) {
            this._prepareEffect(BABYLON.Effect.ShadersStore[baseName + "VertexShader"], BABYLON.Effect.ShadersStore[baseName + "PixelShader"], attributesNames, defines);
        } else {
            var shaderUrl = BABYLON.Engine.ShadersRepository + baseName;
            // Vertex shader
            BABYLON.Tools.LoadFile(shaderUrl + ".vertex.fx",
                function (vertexSourceCode) {
                    // Fragment shader
                    BABYLON.Tools.LoadFile(shaderUrl + ".fragment.fx",
                        function (fragmentSourceCode) {
                            that._prepareEffect(vertexSourceCode, fragmentSourceCode, attributesNames, defines);
                        });
                }
            );
        }

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
    BABYLON.Effect.prototype._prepareEffect = function (vertexSourceCode, fragmentSourceCode, attributesNames, defines) {
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
            this._compilationError = e.message;
        }
    };

    BABYLON.Effect.prototype.setTexture = function (channel, texture) {
        this._engine.setTexture(this._samplers.indexOf(channel), texture);
    };

    BABYLON.Effect.prototype.setMatrix = function (uniformName, matrix) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName].equals(matrix))
            return;

        this._valueCache[uniformName] = matrix;
        this._engine.setMatrix(this.getUniform(uniformName), matrix);
    };

    BABYLON.Effect.prototype.setBool = function (uniformName, bool) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName] === bool)
            return;

        this._valueCache[uniformName] = bool;

        this._engine.setBool(this.getUniform(uniformName), bool);
    };

    BABYLON.Effect.prototype.setVector2 = function (uniformName, x, y) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == x && this._valueCache[uniformName][1] == y)
            return;

        this._valueCache[uniformName] = [x, y];

        this._engine.setVector2(this.getUniform(uniformName), x, y);
    };

    BABYLON.Effect.prototype.setVector3 = function (uniformName, vector3) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == vector3.x && this._valueCache[uniformName][1] == vector3.y && this._valueCache[uniformName][2] == vector3.z)
            return;

        this._valueCache[uniformName] = [vector3.x, vector3.y, vector3.z];

        this._engine.setVector3(this.getUniform(uniformName), vector3);
    };

    BABYLON.Effect.prototype.setFloat2 = function (uniformName, x, y) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == x && this._valueCache[uniformName][1] == y)
            return;

        this._valueCache[uniformName] = [x, y];
        this._engine.setFloat2(this.getUniform(uniformName), x, y);
    };

    BABYLON.Effect.prototype.setFloat3 = function (uniformName, x, y, z) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == x && this._valueCache[uniformName][1] == y && this._valueCache[uniformName][2] == z)
            return;

        this._valueCache[uniformName] = [x, y, z];
        this._engine.setFloat3(this.getUniform(uniformName), x, y, z);
    };

    BABYLON.Effect.prototype.setFloat4 = function (uniformName, x, y, z, w) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == x && this._valueCache[uniformName][1] == y && this._valueCache[uniformName][2] == z && this._valueCache[uniformName][3] == w)
            return;

        this._valueCache[uniformName] = [x, y, z, w];
        this._engine.setFloat4(this.getUniform(uniformName), x, y, z, w);
    };

    BABYLON.Effect.prototype.setColor3 = function (uniformName, color3) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == color3.r && this._valueCache[uniformName][1] == color3.g && this._valueCache[uniformName][2] == color3.b)
            return;

        this._valueCache[uniformName] = [color3.r, color3.g, color3.b];
        this._engine.setColor3(this.getUniform(uniformName), color3);
    };

    BABYLON.Effect.prototype.setColor4 = function (uniformName, color3, alpha) {
        if (this._valueCache[uniformName] && this._valueCache[uniformName][0] == color3.r && this._valueCache[uniformName][1] == color3.g && this._valueCache[uniformName][2] == color3.b && this._valueCache[uniformName][3] == alpha)
            return;

        this._valueCache[uniformName] = [color3.r, color3.g, color3.b, alpha];
        this._engine.setColor4(this.getUniform(uniformName), color3, alpha);
    };

    // Statics
    BABYLON.Effect.ShadersStore = {};

})();