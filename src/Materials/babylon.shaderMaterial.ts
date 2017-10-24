module BABYLON {
    export class ShaderMaterial extends Material {
        private _shaderPath: any;
        private _options: any;
        private _textures: { [name: string]: Texture } = {};
        private _textureArrays: { [name: string]: Texture[] } = {};
        private _floats: { [name: string]: number } = {};
        private _floatsArrays: { [name: string]: number[] } = {};
        private _colors3: { [name: string]: Color3 } = {};
        private _colors3Arrays: { [name: string]: number[] } = {};
        private _colors4: { [name: string]: Color4 } = {};
        private _vectors2: { [name: string]: Vector2 } = {};
        private _vectors3: { [name: string]: Vector3 } = {};
        private _vectors4: { [name: string]: Vector4 } = {};
        private _matrices: { [name: string]: Matrix } = {};
        private _matrices3x3: { [name: string]: Float32Array } = {};
        private _matrices2x2: { [name: string]: Float32Array } = {};
        private _vectors3Arrays: { [name: string]: number[] } = {};
        private _cachedWorldViewMatrix = new Matrix();
        private _renderId: number;

        constructor(name: string, scene: Scene, shaderPath: any, options: any) {
            super(name, scene);
            this._shaderPath = shaderPath;

            options.needAlphaBlending = options.needAlphaBlending || false;
            options.needAlphaTesting = options.needAlphaTesting || false;
            options.attributes = options.attributes || ["position", "normal", "uv"];
            options.uniforms = options.uniforms || ["worldViewProjection"];
            options.uniformBuffers = options.uniformBuffers || [];
            options.samplers = options.samplers || [];
            options.defines = options.defines || [];

            this._options = options;
        }

        public getClassName(): string {
            return "ShaderMaterial";
        }

        public needAlphaBlending(): boolean {
            return this._options.needAlphaBlending;
        }

        public needAlphaTesting(): boolean {
            return this._options.needAlphaTesting;
        }

        private _checkUniform(uniformName: string): void {
            if (this._options.uniforms.indexOf(uniformName) === -1) {
                this._options.uniforms.push(uniformName);
            }
        }

        public setTexture(name: string, texture: Texture): ShaderMaterial {
            if (this._options.samplers.indexOf(name) === -1) {
                this._options.samplers.push(name);
            }
            this._textures[name] = texture;

            return this;
        }

        public setTextureArray(name: string, textures: Texture[]): ShaderMaterial {
            if (this._options.samplers.indexOf(name) === -1) {
                this._options.samplers.push(name);
            }

            this._checkUniform(name);

            this._textureArrays[name] = textures;

            return this;
        }

        public setFloat(name: string, value: number): ShaderMaterial {
            this._checkUniform(name);
            this._floats[name] = value;

            return this;
        }

        public setFloats(name: string, value: number[]): ShaderMaterial {
            this._checkUniform(name);
            this._floatsArrays[name] = value;

            return this;
        }

        public setColor3(name: string, value: Color3): ShaderMaterial {
            this._checkUniform(name);
            this._colors3[name] = value;

            return this;
        }
        public setColor3Array(name: string, value: Color3[]): ShaderMaterial {
            this._checkUniform(name);
            this._colors3Arrays[name] = value.reduce((arr, color) => {
                color.toArray(arr, arr.length);
                return arr;
            }, [])
            return this;
        }

        public setColor4(name: string, value: Color4): ShaderMaterial {
            this._checkUniform(name);
            this._colors4[name] = value;

            return this;
        }

        public setVector2(name: string, value: Vector2): ShaderMaterial {
            this._checkUniform(name);
            this._vectors2[name] = value;

            return this;
        }

        public setVector3(name: string, value: Vector3): ShaderMaterial {
            this._checkUniform(name);
            this._vectors3[name] = value;

            return this;
        }

        public setVector4(name: string, value: Vector4): ShaderMaterial {
            this._checkUniform(name);
            this._vectors4[name] = value;

            return this;
        }

        public setMatrix(name: string, value: Matrix): ShaderMaterial {
            this._checkUniform(name);
            this._matrices[name] = value;

            return this;
        }

        public setMatrix3x3(name: string, value: Float32Array): ShaderMaterial {
            this._checkUniform(name);
            this._matrices3x3[name] = value;

            return this;
        }

        public setMatrix2x2(name: string, value: Float32Array): ShaderMaterial {
            this._checkUniform(name);
            this._matrices2x2[name] = value;

            return this;
        }

        public setArray3(name: string, value: number[]): ShaderMaterial {
            this._checkUniform(name);
            this._vectors3Arrays[name] = value;

            return this;
        }

        private _checkCache(scene: Scene, mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (!mesh) {
                return true;
            }

            if (this._effect && (this._effect.defines.indexOf("#define INSTANCES") !== -1) !== useInstances) {
                return false;
            }

            return false;
        }
        
        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            var scene = this.getScene();
            var engine = scene.getEngine();

            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    if (this._checkCache(scene, mesh, useInstances)) {
                        return true;
                    }
                }
            }

            // Instances
            var defines = [];
            var attribs = [];
            var fallbacks = new EffectFallbacks();
            if (useInstances) {
                defines.push("#define INSTANCES");
            }

            for (var index = 0; index < this._options.defines.length; index++) {
                defines.push(this._options.defines[index]);
            }

            for (var index = 0; index < this._options.attributes.length; index++) {
                attribs.push(this._options.attributes[index]);
            }

            if (mesh && mesh.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                attribs.push(VertexBuffer.ColorKind);
                defines.push("#define VERTEXCOLOR");
            }
            
            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                }
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
                fallbacks.addCPUSkinningFallback(0, mesh);

                if (this._options.uniforms.indexOf("mBones") === -1) {
                    this._options.uniforms.push("mBones");
                }

            } else {
                defines.push("#define NUM_BONE_INFLUENCERS 0");
            }  

            // Textures
            for (var name in this._textures) {
                if (!this._textures[name].isReady()) {
                    return false;
                }
            }

            // Alpha test
            if (engine.getAlphaTesting()) {
                defines.push("#define ALPHATEST");
            }

            var previousEffect = this._effect;
            var join = defines.join("\n");

            this._effect = engine.createEffect(this._shaderPath, <EffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: this._options.uniforms,
                    uniformBuffersNames: this._options.uniformBuffers,
                    samplers: this._options.samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError
                }, engine);

            if (!this._effect.isReady()) {
                return false;
            }

            if (previousEffect !== this._effect) {
                scene.resetCachedMaterial();
            }

            this._renderId = scene.getRenderId();

            return true;
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            var scene = this.getScene();

            if (!this._effect) {
                return;
            }

            if (this._options.uniforms.indexOf("world") !== -1) {
                this._effect.setMatrix("world", world);
            }

            if (this._options.uniforms.indexOf("worldView") !== -1) {
                world.multiplyToRef(scene.getViewMatrix(), this._cachedWorldViewMatrix);
                this._effect.setMatrix("worldView", this._cachedWorldViewMatrix);
            }

            if (this._options.uniforms.indexOf("worldViewProjection") !== -1) {
                this._effect.setMatrix("worldViewProjection", world.multiply(scene.getTransformMatrix()));
            }
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            // Std values
            this.bindOnlyWorldMatrix(world);

            if (this._effect && this.getScene().getCachedMaterial() !== this) {
                if (this._options.uniforms.indexOf("view") !== -1) {
                    this._effect.setMatrix("view", this.getScene().getViewMatrix());
                }

                if (this._options.uniforms.indexOf("projection") !== -1) {
                    this._effect.setMatrix("projection", this.getScene().getProjectionMatrix());
                }

                if (this._options.uniforms.indexOf("viewProjection") !== -1) {
                    this._effect.setMatrix("viewProjection", this.getScene().getTransformMatrix());
                }

                // Bones
                MaterialHelper.BindBonesParameters(mesh, this._effect);

                var name: string;
                // Texture
                for (name in this._textures) {
                    this._effect.setTexture(name, this._textures[name]);
                }

                // Texture arrays
                for (name in this._textureArrays) {
                    this._effect.setTextureArray(name, this._textureArrays[name]);
                }

                // Float    
                for (name in this._floats) {
                    this._effect.setFloat(name, this._floats[name]);
                }

                // Float s   
                for (name in this._floatsArrays) {
                    this._effect.setArray(name, this._floatsArrays[name]);
                }

                // Color3        
                for (name in this._colors3) {
                    this._effect.setColor3(name, this._colors3[name]);
                }

                for (name in this._colors3Arrays) {
                    this._effect.setArray3(name, this._colors3Arrays[name]);
                }

                // Color4      
                for (name in this._colors4) {
                    var color = this._colors4[name];
                    this._effect.setFloat4(name, color.r, color.g, color.b, color.a);
                }

                // Vector2        
                for (name in this._vectors2) {
                    this._effect.setVector2(name, this._vectors2[name]);
                }

                // Vector3        
                for (name in this._vectors3) {
                    this._effect.setVector3(name, this._vectors3[name]);
                }

                // Vector4        
                for (name in this._vectors4) {
                    this._effect.setVector4(name, this._vectors4[name]);
                }

                // Matrix      
                for (name in this._matrices) {
                    this._effect.setMatrix(name, this._matrices[name]);
                }

                // Matrix 3x3
                for (name in this._matrices3x3) {
                    this._effect.setMatrix3x3(name, this._matrices3x3[name]);
                }

                // Matrix 2x2
                for (name in this._matrices2x2) {
                    this._effect.setMatrix2x2(name, this._matrices2x2[name]);
                }
                
                // Vector3Array   
                for (name in this._vectors3Arrays) {
                    this._effect.setArray3(name, this._vectors3Arrays[name]);
                }
            }

            this._afterBind(mesh);
        }

        public getActiveTextures(): BaseTexture[] {
            var activeTextures = super.getActiveTextures();

            for (var name in this._textures) {
                activeTextures.push(this._textures[name]);
            }

            for (var name in this._textureArrays) {
                var array = this._textureArrays[name];
                for (var index = 0; index < array.length; index++) {
                    activeTextures.push(array[index]);
                }
            }

            return activeTextures;
        }

        public hasTexture(texture: BaseTexture): boolean {
            if (super.hasTexture(texture)) {
                return true;
            }

            for (var name in this._textures) {
                if (this._textures[name] === texture) {
                    return true;
                }
            }       

            for (var name in this._textureArrays) {
                var array = this._textureArrays[name];
                for (var index = 0; index < array.length; index++) {
                    if (array[index] === texture) {
                        return true;
                    }
                }
            }             

            return false;    
        }

        public clone(name: string): ShaderMaterial {
            var newShaderMaterial = new ShaderMaterial(name, this.getScene(), this._shaderPath, this._options);

            return newShaderMaterial;
        }

        public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {

            if (forceDisposeTextures) {
                var name: string;
                for (name in this._textures) {
                    this._textures[name].dispose();
                }

                for (name in this._textureArrays) {
                    var array = this._textureArrays[name];
                    for (var index = 0; index < array.length; index++) {
                        array[index].dispose();
                    }
                }
            }

            this._textures = {};

            super.dispose(forceDisposeEffect, forceDisposeTextures);
        }

        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.ShaderMaterial";
			
            serializationObject.options = this._options;
            serializationObject.shaderPath = this._shaderPath;

            var name: string;

            // Texture
            serializationObject.textures = {};
            for (name in this._textures) {
                serializationObject.textures[name] = this._textures[name].serialize();
            }

            // Texture arrays
            serializationObject.textureArrays = {};
            for (name in this._textureArrays) {
                serializationObject.textureArrays[name] = [];
                var array = this._textureArrays[name];
                for (var index = 0; index < array.length; index++) {
                    serializationObject.textureArrays[name].push(array[index].serialize());
                }
            }

            // Float    
            serializationObject.floats = {};
            for (name in this._floats) {
                serializationObject.floats[name] = this._floats[name];
            }

            // Float s   
            serializationObject.FloatArrays = {};
            for (name in this._floatsArrays) {
                serializationObject.FloatArrays[name] = this._floatsArrays[name];
            }

            // Color3    
            serializationObject.colors3 = {};
            for (name in this._colors3) {
                serializationObject.colors3[name] = this._colors3[name].asArray();
            }

            // Color3 array
            serializationObject.colors3Arrays = {};
            for (name in this._colors3Arrays) {
                serializationObject.colors3Arrays[name] = this._colors3Arrays[name];
            }

            // Color4  
            serializationObject.colors4 = {};
            for (name in this._colors4) {
                serializationObject.colors4[name] = this._colors4[name].asArray();
            }

            // Vector2  
            serializationObject.vectors2 = {};
            for (name in this._vectors2) {
                serializationObject.vectors2[name] = this._vectors2[name].asArray();
            }

            // Vector3        
            serializationObject.vectors3 = {};
            for (name in this._vectors3) {
                serializationObject.vectors3[name] = this._vectors3[name].asArray();
            }

            // Vector4        
            serializationObject.vectors4 = {};
            for (name in this._vectors4) {
                serializationObject.vectors4[name] = this._vectors4[name].asArray();
            }

            // Matrix      
            serializationObject.matrices = {};
            for (name in this._matrices) {
                serializationObject.matrices[name] = this._matrices[name].asArray();
            }

            // Matrix 3x3
            serializationObject.matrices3x3 = {};
            for (name in this._matrices3x3) {
                serializationObject.matrices3x3[name] = this._matrices3x3[name];
            }

            // Matrix 2x2
            serializationObject.matrices2x2 = {};
            for (name in this._matrices2x2) {
                serializationObject.matrices2x2[name] = this._matrices2x2[name];
            }

            // Vector3Array
            serializationObject.vectors3Arrays = {};
            for (name in this._vectors3Arrays) {
                serializationObject.vectors3Arrays[name] = this._vectors3Arrays[name];
            }
            
            return serializationObject;
        }

        public static Parse(source: any, scene: Scene, rootUrl: string): ShaderMaterial {
            var material = SerializationHelper.Parse(() => new ShaderMaterial(source.name, scene, source.shaderPath, source.options), source, scene, rootUrl);

            var name: string;

            // Texture
            for (name in source.textures) {
                material.setTexture(name, <Texture>Texture.Parse(source.textures[name], scene, rootUrl));
            }

            // Texture arrays
            for (name in source.textureArrays) {
                var array = source.textureArrays[name];
                var textureArray = new Array<Texture>();

                for (var index = 0; index < array.length; index++) {
                    textureArray.push(<Texture>Texture.Parse(array[index], scene, rootUrl));
                }
                material.setTextureArray(name, textureArray);
            }

            // Float    
            for (name in source.floats) {
                material.setFloat(name, source.floats[name]);
            }

            // Float s   
            for (name in source.floatsArrays) {
                material.setFloats(name, source.floatsArrays[name]);
            }

            // Color3        
            for (name in source.colors3) {
                material.setColor3(name, Color3.FromArray(source.colors3[name]));
            }

            // Color3 arrays
            for (name in source.colors3Arrays) {
                const colors: Color3[] = source.colors3Arrays[name].reduce((arr: Array<Array<number>>, num: number, i: number) => {
                    if (i % 3 === 0) {
                        arr.push([num]);
                    } else {
                        arr[arr.length - 1].push(num);
                    }
                    return arr;
                }, []).map((color: ArrayLike<number>) => Color3.FromArray(color));
                material.setColor3Array(name, colors);
            }

            // Color4      
            for (name in source.colors4) {
                material.setColor4(name, Color4.FromArray(source.colors4[name]));
            }

            // Vector2        
            for (name in source.vectors2) {
                material.setVector2(name, Vector2.FromArray(source.vectors2[name]));
            }

            // Vector3        
            for (name in source.vectors3) {
                material.setVector3(name, Vector3.FromArray(source.vectors3[name]));
            }

            // Vector4        
            for (name in source.vectors4) {
                material.setVector4(name, Vector4.FromArray(source.vectors4[name]));
            }

            // Matrix      
            for (name in source.matrices) {
                material.setMatrix(name, Matrix.FromArray(source.matrices[name]));
            }

            // Matrix 3x3
            for (name in source.matrices3x3) {
                material.setMatrix3x3(name, source.matrices3x3[name]);
            }

            // Matrix 2x2
            for (name in source.matrices2x2) {
                material.setMatrix2x2(name, source.matrices2x2[name]);
            }

            // Vector3Array
            for (name in source.vectors3Arrays) {
                material.setArray3(name, source.vectors3Arrays[name]);
            }
            
            return material;
        }
    }
} 
