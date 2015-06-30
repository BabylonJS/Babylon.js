module BABYLON {
    export class ShaderMaterial extends Material {
        private _shaderPath: any;
        private _options: any;
        private _textures = new Array<Texture>();
        private _floats = new Array<number>();
        private _floatsArrays = {};
        private _colors3 = new Array<Color3>();
        private _colors4 = new Array<Color4>();
        private _vectors2 = new Array<Vector2>();
        private _vectors3 = new Array<Vector3>();
        private _matrices = new Array<Matrix>();
        private _cachedWorldViewMatrix = new Matrix();
        private _renderId: number;

        constructor(name: string, scene: Scene, shaderPath: any, options: any) {
            super(name, scene);
            this._shaderPath = shaderPath;

            options.needAlphaBlending = options.needAlphaBlending || false;
            options.needAlphaTesting = options.needAlphaTesting || false;
            options.attributes = options.attributes || ["position", "normal", "uv"];
            options.uniforms = options.uniforms || ["worldViewProjection"];
            options.samplers = options.samplers || [];

            this._options = options;
        }

        public needAlphaBlending(): boolean {
            return this._options.needAlphaBlending;
        }

        public needAlphaTesting(): boolean {
            return this._options.needAlphaTesting;
        }

        private _checkUniform(uniformName): void {
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

        public setMatrix(name: string, value: Matrix): ShaderMaterial {
            this._checkUniform(name);
            this._matrices[name] = value;

            return this;
        }

        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            var scene = this.getScene();
            var engine = scene.getEngine();

            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            // Instances
            var defines = [];
            var fallbacks = new EffectFallbacks();
            if (useInstances) {
                defines.push("#define INSTANCES");
            }

            // Bones
            if (mesh && mesh.useBones) {
                defines.push("#define BONES");
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
                defines.push("#define BONES4");
                fallbacks.addFallback(0, "BONES4");
            }

            // Alpha test
            if (engine.getAlphaTesting()) {
                defines.push("#define ALPHATEST");
            }

            var previousEffect = this._effect;
            var join = defines.join("\n");

            this._effect = engine.createEffect(this._shaderPath,
                this._options.attributes,
                this._options.uniforms,
                this._options.samplers,
                join, fallbacks, this.onCompiled, this.onError);

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

            if (this.getScene().getCachedMaterial() !== this) {
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
                if (mesh && mesh.useBones) {
                    this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
                }

                // Texture
                for (var name in this._textures) {
                    this._effect.setTexture(name, this._textures[name]);
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

                // Matrix      
                for (name in this._matrices) {
                    this._effect.setMatrix(name, this._matrices[name]);
                }
            }

            super.bind(world, mesh);
        }

        public clone(name: string): ShaderMaterial {
            var newShaderMaterial = new ShaderMaterial(name, this.getScene(), this._shaderPath, this._options);

            return newShaderMaterial;
        }        

        public dispose(forceDisposeEffect?: boolean): void {
            for (var name in this._textures) {
                this._textures[name].dispose();
            }

            this._textures = [];

            super.dispose(forceDisposeEffect);
        }
    }
} 