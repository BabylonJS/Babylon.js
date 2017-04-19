module BABYLON {

    // Pool for avoiding memory leaks
    var MAX_UNIFORM_SIZE = 256;
    var _tempBuffer = new Float32Array(MAX_UNIFORM_SIZE);

    export class UniformBuffer {
        private _engine: Engine;
        private _buffer: WebGLBuffer;
        private _data: number[];
        private _bufferData: Float32Array;
        private _dynamic: boolean;
        private _uniformName: string;
        private _uniformLocations: { [key:string]:number; };
        private _uniformSizes: { [key:string]:number; };
        private _uniformLocationPointer: number;
        private _needSync: boolean;
        private _cache: Float32Array;
        private _noUbo: boolean;
        private _currentEffect: Effect;

        /**
         * Uniform buffer objects.
         * 
         * Handles blocks of uniform on the GPU.
         *
         * If WebGL 2 is not available, this class falls back on traditionnal setUniformXXX calls.
         *
         * For more information, please refer to : 
         * https://www.khronos.org/opengl/wiki/Uniform_Buffer_Object
         */
        constructor(engine: Engine, data?: number[], dynamic?: boolean) {
            this._engine = engine;
            this._noUbo = engine.webGLVersion === 1;
            this._dynamic = dynamic;

            this._data = data || [];

            this._uniformLocations = {};
            this._uniformSizes = {};
            this._uniformLocationPointer = 0;
            this._needSync = false;

        }

        // Properties
        /**
         * Indicates if the buffer is using the WebGL2 UBO implementation,
         * or just falling back on setUniformXXX calls.
         */
        public get useUbo(): boolean {
            return !this._noUbo;
        }
        
        /**
         * Indicates if the WebGL underlying uniform buffer is in sync
         * with the javascript cache data.
         */
        public get isSync(): boolean {
            return !this._needSync;
        }

        /**
         * Indicates if the WebGL underlying uniform buffer is dynamic.
         * Also, a dynamic UniformBuffer will disable cache verification and always 
         * update the underlying WebGL uniform buffer to the GPU.
         */
        public isDynamic(): boolean {
            return this._dynamic;
        }

        /**
         * The data cache on JS side.
         */
        public getData(): Float32Array {
            return this._bufferData;
        }

        /**
         * The underlying WebGL Uniform buffer.
         */
        public getBuffer(): WebGLBuffer {
            return this._buffer;
        }

        /**
         * std140 layout specifies how to align data within an UBO structure.
         * See https://khronos.org/registry/OpenGL/specs/gl/glspec45.core.pdf#page=159
         * for specs.
         */
        private _fillAlignment(size: number) {
            // This code has been simplified because we only use floats, vectors of 1, 2, 3, 4 components
            // and 4x4 matrices
            // TODO : change if other types are used

            var alignment;
            if (size <= 2) {
                alignment = size;
            } else {
                alignment = 4;
            }

            if ((this._uniformLocationPointer % alignment) !== 0) {
                var oldPointer = this._uniformLocationPointer;
                this._uniformLocationPointer += alignment - (this._uniformLocationPointer % alignment);
                var diff = this._uniformLocationPointer - oldPointer;

                for (var i = 0; i < diff; i++) {
                      this._data.push(0); 
                }
            }
        }

        /**
         * Adds an uniform in the buffer.
         * Warning : the subsequents calls of this function must be in the same order as declared in the shader
         * for the layout to be correct !
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number|number[]} size Data size, or data directly.
         */
        public addUniform(name: string, size: number | number[]) {
            if (this._noUbo) {
                return;
            }

            if (this._uniformLocations[name] !== undefined) {
                // Already existing uniform
                return;
            }
            // This function must be called in the order of the shader layout !
            // size can be the size of the uniform, or data directly
            var data;
            if (size instanceof Array) {
                data = size;
                size = data.length;
            } else {
                size = <number>size;
                data = [];

                // Fill with zeros
                for (var i = 0; i < size; i++) {
                    data.push(0);
                }
            }


            this._fillAlignment(<number>size);
            this._uniformSizes[name] = <number>size;
            this._uniformLocations[name] = this._uniformLocationPointer;
            this._uniformLocationPointer += <number>size;


            for (var i = 0; i < size; i++) {
                this._data.push(data[i]);
            }

            this._needSync = true;
        }

        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Matrix} mat A 4x4 matrix.
         */
        public addMatrix(name: string, mat: Matrix) {
            this.addUniform(name, Array.prototype.slice.call(mat.toArray()));
        }

        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         */
        public addFloat2(name: string, x: number, y: number) {
            var temp = [x, y];
            this.addUniform(name, temp);
        }

        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {number} z
         */
        public addFloat3(name: string, x: number, y: number, z: number) {
            var temp = [x, y, z];
            this.addUniform(name, temp);
        }

        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         */
        public addColor3(name: string, color: Color3) {
            var temp = [];
            color.toArray(temp);
            this.addUniform(name, temp);
        }

        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         * @param {number} alpha
         */
        public addColor4(name: string, color: Color3, alpha: number) {
            var temp = [];
            color.toArray(temp);
            temp.push(alpha);
            this.addUniform(name, temp);
        }

        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Vector3} vector
         */
        public addVector3(name: string, vector: Vector3) {
            var temp = [];
            vector.toArray(temp);
            this.addUniform(name, temp);
        }

        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         */
        public addMatrix3x3(name: string) {
            this.addUniform(name, 12);
        }

        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         */
        public addMatrix2x2(name: string) {
            this.addUniform(name, 8);
        }

        /**
         * Effectively creates the WebGL Uniform Buffer, once layout is completed with `addUniform`.
         */
        public create(): void {
            if (this._noUbo) {
                return;
            }
            if (this._buffer) {
                return; // nothing to do
            }

            this._bufferData = new Float32Array(this._data);

            if (this._dynamic) {
                this._buffer = this._engine.createDynamicUniformBuffer(this._bufferData);
            } else {
                this._buffer = this._engine.createUniformBuffer(this._bufferData);
            }

            this._needSync = true;
        } 

        /**
         * Updates the WebGL Uniform Buffer on the GPU.
         * If the `dynamic` flag is set to true, no cache comparison is done.
         * Otherwise, the buffer will be updated only if the cache differs.
         */
        public update(): void {
            if (!this._buffer) {
                this.create();
                return;
            }

            if (!this._dynamic && !this._needSync) {
                return;
            }

            this._engine.updateUniformBuffer(this._buffer, this._bufferData);

            this._needSync = false;
        }

        /**
         * Updates the value of an uniform. The `update` method must be called afterwards to make it effective in the GPU.
         * @param {string} uniformName Name of the uniform, as used in the uniform block in the shader.
         * @param {number[]|Float32Array} data Flattened data
         * @param {number} size Size of the data.
         */
        public updateUniform(uniformName: string, data: number[] | Float32Array, size: number) {

            var location = this._uniformLocations[uniformName];
            if (location === undefined) {
                if (this._buffer) {
                    // Cannot add an uniform if the buffer is already created
                    Tools.Error("Cannot add an uniform after UBO has been created.");
                    return;
                }
                this.addUniform(uniformName, size);
                location = this._uniformLocations[uniformName];
            }

            if (!this._buffer) {
                this.create();
            }

            if (!this._dynamic) {
                // Cache for static uniform buffers
                var changed = false;
                for (var i = 0; i < size; i++) {
                    if (this._bufferData[location + i] !== data[i]) {
                       changed = true;
                        this._bufferData[location + i] = data[i];
                    }
                }

                this._needSync = this._needSync || changed;
            } else {
                // No cache for dynamic
                for (var i = 0; i < size; i++) {
                    this._bufferData[location + i] = data[i];
                }
            }
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Float32Array} matrix
         */
        public updateMatrix3x3(name: string, matrix: Float32Array): Effect {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setMatrix3x3(name, matrix);
                }
                return;
            }

            // To match std140, matrix must be realigned
            for (var i = 0; i < 3; i++) {
                _tempBuffer[i * 4] = matrix[i * 3];
                _tempBuffer[i * 4 + 1] = matrix[i * 3 + 1];
                _tempBuffer[i * 4 + 2] = matrix[i * 3 + 2];
                _tempBuffer[i * 4 + 3] = 0.0;
            }

            this.updateUniform(name, _tempBuffer, 12);
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Float32Array} matrix
         */
        public updateMatrix2x2(name: string, matrix: Float32Array): Effect {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setMatrix2x2(name, matrix);
                }
                return;
            }

            // To match std140, matrix must be realigned
            for (var i = 0; i < 2; i++) {
                _tempBuffer[i * 4] = matrix[i * 2];
                _tempBuffer[i * 4 + 1] = matrix[i * 2 + 1];
                _tempBuffer[i * 4 + 2] = 0.0;
                _tempBuffer[i * 4 + 3] = 0.0;
            }

            this.updateUniform(name, _tempBuffer, 8);
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         */
        public updateFloat(name: string, x: number) {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setFloat(name, x);
                }
                return;
            }

            _tempBuffer[0] = x;
            this.updateUniform(name, _tempBuffer, 1);
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         */
        public updateFloat2(name: string, x: number, y: number) {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setFloat2(name, x, y);
                }
                return;
            }

            _tempBuffer[0] = x;
            _tempBuffer[1] = y;
            this.updateUniform(name, _tempBuffer, 2);
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {number} z
         */
        public updateFloat3(name: string, x: number, y: number, z: number) {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setFloat3(name, x, y, z);
                }
                return;
            }

            _tempBuffer[0] = x;
            _tempBuffer[1] = y;
            _tempBuffer[2] = z;
            this.updateUniform(name, _tempBuffer, 3);
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @param {number} w
         */
        public updateFloat4(name: string, x: number, y: number, z: number, w: number) {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setFloat4(name, x, y, z, w);
                }
                return;
            }

            _tempBuffer[0] = x;
            _tempBuffer[1] = y;
            _tempBuffer[2] = z;
            _tempBuffer[3] = w;
            this.updateUniform(name, _tempBuffer, 4);
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Matrix} A 4x4 matrix.
         */
        public updateMatrix(name: string, mat: Matrix) {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setMatrix(name, mat);
                }
                return;
            }

            this.updateUniform(name, mat.toArray(), 16);
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Vector3} vector
         */
        public updateVector3(name: string, vector: Vector3) {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setVector3(name, vector);
                }
                return;
            }
            vector.toArray(_tempBuffer);
            this.updateUniform(name, _tempBuffer, 3);
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Vector4} vector
         */
        public updateVector4(name: string, vector: Vector4) {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setVector4(name, vector);
                }
                return;
            }
            vector.toArray(_tempBuffer);
            this.updateUniform(name, _tempBuffer, 4);
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         */
        public updateColor3(name: string, color: Color3) {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setColor3(name, color);
                }
                return;
            }
            color.toArray(_tempBuffer);
            this.updateUniform(name, _tempBuffer, 3);
        }

        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         * @param {number} alpha
         */
        public updateColor4(name: string, color: Color3, alpha: number) {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setColor4(name, color, alpha);
                }
                return;
            }
            color.toArray(_tempBuffer);
            _tempBuffer[3] = alpha;
            this.updateUniform(name, _tempBuffer, 4);
        }

        /**
         * Sets a sampler uniform on the effect.
         * @param {string} name Name of the sampler.
         * @param {Texture} texture
         */
        public setTexture(name: string, texture: BaseTexture) {
            this._currentEffect.setTexture(name, texture);
        }

        /**
         * Directly updates the value of the uniform in the cache AND on the GPU.
         * @param {string} uniformName Name of the uniform, as used in the uniform block in the shader.
         * @param {number[]|Float32Array} data Flattened data
         */
        public updateUniformDirectly(uniformName: string, data: number[] | Float32Array) {
            this.updateUniform(uniformName, data, data.length);

            this.update();
        }

        /**
         * Binds this uniform buffer to an effect.
         * @param {Effect} effect
         * @param {string} name Name of the uniform block in the shader.
         */
        public bindToEffect(effect: Effect, name: string): void {
            this._currentEffect = effect;

            if (this._noUbo) {
                return;
            }
            
            effect.bindUniformBuffer(this._buffer, name);
        }

        /**
         * Disposes the uniform buffer.
         */
        public dispose(): void {
            if (!this._buffer) {
                return;
            }
            if (this._engine._releaseBuffer(this._buffer)) {
                this._buffer = null;
            }
        }
    }
} 
