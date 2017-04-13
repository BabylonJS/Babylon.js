module BABYLON {

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

        public get useUbo(): boolean {
            return !this._noUbo;
        }
        
        public get isSync(): boolean {
            return !this._needSync;
        }

        // Properties
        public isDynamic(): boolean {
            return this._dynamic;
        }

        public getData(): Float32Array {
            return this._bufferData;
        }

        public getBuffer(): WebGLBuffer {
            return this._buffer;
        }

        private _fillAlignment(size: number) {
            // std140 layout
            // This computation is really simple because we only use floats, vectors of 1, 2, 3, 4 components
            // and 4x4 matrices
            // TODO : change if other types are used
            // See https://khronos.org/registry/OpenGL/specs/gl/glspec45.core.pdf#page=159

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

        public addMatrix(name: string, mat: Matrix) {
            this.addUniform(name, Array.prototype.slice.call(mat.toArray()));
        }

        public addFloat2(name: string, x: number, y: number) {
            var temp = [x, y];
            this.addUniform(name, temp);
        }

        public addFloat3(name: string, x: number, y: number, z: number) {
            var temp = [x, y, z];
            this.addUniform(name, temp);
        }

        public addColor3(name: string, color: Color3) {
            var temp = [];
            color.toArray(temp);
            this.addUniform(name, temp);
        }

        public addColor4(name: string, color: Color3, alpha: number) {
            var temp = [];
            color.toArray(temp);
            temp.push(alpha);
            this.addUniform(name, temp);
        }

        public addVector3(name: string, vector: Vector3) {
            var temp = [];
            vector.toArray(temp);
            this.addUniform(name, temp);
        }

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

        public updateUniform(uniformName: string, data: number[] | Float32Array, size: number) {

            var location = this._uniformLocations[uniformName];
            if (location === undefined) {
                if (this._buffer) {
                    // Cannot add an uniform if the buffer is already created
                    Tools.Error("Uniform buffer overflow.");
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

        public updateMatrix(name: string, mat: Matrix) {
            if (this._noUbo) {
                if (this._currentEffect) {
                    this._currentEffect.setMatrix(name, mat);
                }
                return;
            }

            this.updateUniform(name, mat.toArray(), 16);
        }

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

        public updateUniformDirectly(uniformName: string, data: number[]) {
            this.updateUniform(uniformName, data, data.length);

            this.update();
        }

        public bindToEffect(effect: Effect, name: string): void {
            this._currentEffect = effect;

            if (this._noUbo) {
                return;
            }
            
            effect.bindUniformBuffer(this._buffer, name);
        }

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
