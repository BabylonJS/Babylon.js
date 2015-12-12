module BABYLON {
    export class ProceduralTexture extends Texture {
        private _size: number;
        public _generateMipMaps: boolean;
        public isEnabled = true;
        private _doNotChangeAspectRatio: boolean;
        private _currentRefreshId = -1;
        private _refreshRate = 1;

        private _vertexBuffer: WebGLBuffer;
        private _indexBuffer: WebGLBuffer;
        private _effect: Effect;

        private _vertexDeclaration = [2];
        private _vertexStrideSize = 2 * 4;

        private _uniforms = new Array<string>();
        private _samplers = new Array<string>();
        private _fragment: any;

        public _textures = new Array<Texture>();
        private _floats = new Array<number>();
        private _floatsArrays = {};
        private _colors3 = new Array<Color3>();
        private _colors4 = new Array<Color4>();
        private _vectors2 = new Array<Vector2>();
        private _vectors3 = new Array<Vector3>();
        private _matrices = new Array<Matrix>();

        private _fallbackTexture: Texture;

        private _fallbackTextureUsed = false;

        constructor(name: string, size: any, fragment: any, scene: Scene, fallbackTexture?: Texture, generateMipMaps = true) {
            super(null, scene, !generateMipMaps);

            scene._proceduralTextures.push(this);

            this.name = name;
            this.isRenderTarget = true;
            this._size = size;
            this._generateMipMaps = generateMipMaps;

            this.setFragment(fragment);

            this._fallbackTexture = fallbackTexture;

            this._texture = scene.getEngine().createRenderTargetTexture(size, generateMipMaps);

            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);

            this._vertexBuffer = scene.getEngine().createVertexBuffer(vertices);

            // Indices
            var indices = [];
            indices.push(0);
            indices.push(1);
            indices.push(2);

            indices.push(0);
            indices.push(2);
            indices.push(3);

            this._indexBuffer = scene.getEngine().createIndexBuffer(indices);
        }

        public reset(): void {
            if (this._effect === undefined) {
                return;
            }
            var engine = this.getScene().getEngine();
            engine._releaseEffect(this._effect);
        }


        public isReady(): boolean {
            var engine = this.getScene().getEngine();
            var shaders;

            if (!this._fragment) {
                return false;
            }

            if (this._fallbackTextureUsed) {
                return true;
            }

            if (this._fragment.fragmentElement !== undefined) {
                shaders = { vertex: "procedural", fragmentElement: this._fragment.fragmentElement };
            }
            else {
                shaders = { vertex: "procedural", fragment: this._fragment };
            }

            this._effect = engine.createEffect(shaders,
                ["position"],
                this._uniforms,
                this._samplers,
                "", null, null, () => {
                    this.releaseInternalTexture();

                    if (this._fallbackTexture) {
                        this._texture = this._fallbackTexture._texture;
                        this._texture.references++;
                    }

                    this._fallbackTextureUsed = true;
                });

            return this._effect.isReady();
        }

        public resetRefreshCounter(): void {
            this._currentRefreshId = -1;
        }

        public setFragment(fragment: any) {
            this._fragment = fragment;
        }

        public get refreshRate(): number {
            return this._refreshRate;
        }

        // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
        public set refreshRate(value: number) {
            this._refreshRate = value;
            this.resetRefreshCounter();
        }

        public _shouldRender(): boolean {
            if (!this.isEnabled || !this.isReady() || !this._texture) {
                return false;
            }

            if (this._fallbackTextureUsed) {
                return false;
            }

            if (this._currentRefreshId === -1) { // At least render once
                this._currentRefreshId = 1;
                return true;
            }

            if (this.refreshRate === this._currentRefreshId) {
                this._currentRefreshId = 1;
                return true;
            }

            this._currentRefreshId++;
            return false;
        }

        public getRenderSize(): number {
            return this._size;
        }

        public resize(size, generateMipMaps) {
            if (this._fallbackTextureUsed) {
                return;
            }

            this.releaseInternalTexture();
            this._texture = this.getScene().getEngine().createRenderTargetTexture(size, generateMipMaps);
        }

        private _checkUniform(uniformName): void {
            if (this._uniforms.indexOf(uniformName) === -1) {
                this._uniforms.push(uniformName);
            }
        }

        public setTexture(name: string, texture: Texture): ProceduralTexture {
            if (this._samplers.indexOf(name) === -1) {
                this._samplers.push(name);
            }
            this._textures[name] = texture;

            return this;
        }

        public setFloat(name: string, value: number): ProceduralTexture {
            this._checkUniform(name);
            this._floats[name] = value;

            return this;
        }

        public setFloats(name: string, value: number[]): ProceduralTexture {
            this._checkUniform(name);
            this._floatsArrays[name] = value;

            return this;
        }

        public setColor3(name: string, value: Color3): ProceduralTexture {
            this._checkUniform(name);
            this._colors3[name] = value;

            return this;
        }

        public setColor4(name: string, value: Color4): ProceduralTexture {
            this._checkUniform(name);
            this._colors4[name] = value;

            return this;
        }

        public setVector2(name: string, value: Vector2): ProceduralTexture {
            this._checkUniform(name);
            this._vectors2[name] = value;

            return this;
        }

        public setVector3(name: string, value: Vector3): ProceduralTexture {
            this._checkUniform(name);
            this._vectors3[name] = value;

            return this;
        }

        public setMatrix(name: string, value: Matrix): ProceduralTexture {
            this._checkUniform(name);
            this._matrices[name] = value;

            return this;
        }

        public render(useCameraPostProcess?: boolean) {
            var scene = this.getScene();
            var engine = scene.getEngine();

            engine.bindFramebuffer(this._texture);

            // Clear
            engine.clear(scene.clearColor, true, true);

            // Render
            engine.enableEffect(this._effect);
            engine.setState(false);

            // Texture
            for (var name in this._textures) {
                this._effect.setTexture(name, this._textures[name]);
            }

            // Float    
            for (name in this._floats) {
                this._effect.setFloat(name, this._floats[name]);
            }

            // Floats   
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

            // VBOs
            engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, this._effect);

            // Draw order
            engine.draw(true, 0, 6);

            // Unbind
            engine.unBindFramebuffer(this._texture);
        }

        public clone(): ProceduralTexture {
            var textureSize = this.getSize();
            var newTexture = new ProceduralTexture(this.name, textureSize.width, this._fragment, this.getScene(), this._fallbackTexture, this._generateMipMaps);

            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;

            // RenderTarget Texture
            newTexture.coordinatesMode = this.coordinatesMode;

            return newTexture;
        }

        public dispose(): void {
            var index = this.getScene()._proceduralTextures.indexOf(this);

            if (index >= 0) {
                this.getScene()._proceduralTextures.splice(index, 1);
            }
            super.dispose();
        }
    }
} 