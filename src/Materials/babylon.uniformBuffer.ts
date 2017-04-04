module BABYLON {
    export class UniformBuffer {
        private _engine: Engine;
        private _buffer: WebGLBuffer;
        private _data: number[];
        private _dynamic: boolean;
        private _uniformName: string;
        private _uniformNames: string[];
        private _uniformLocations: number[];
        private _uniformSizes: number[];
        private _uniformLocationPointer: number;
        private _needSync: boolean;

        constructor(engine: Engine, data?: number[], dynamic?: boolean) {
            this._engine = engine;

            this._dynamic = dynamic;

            this._data = data || [];

            this._uniformNames = [];
            this._uniformLocations = [];
            this._uniformSizes = [];
            this._uniformLocationPointer = 0;
            this._needSync = false;
        }

        public get isSync(): boolean {
            return !this._needSync;
        }

        // Properties
        public isDynamic(): boolean {
            return this._dynamic;
        }

        public getData(): number[] {
            return this._data;
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
            if (this._uniformNames.indexOf(name) !== -1) {
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
            this._uniformNames.push(name);
            this._uniformSizes.push(<number>size);
            this._uniformLocations.push(this._uniformLocationPointer);
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
            if (this._buffer) {
                return; // nothing to do
            }

            var data = this._data;

            if (this._dynamic) {
                this._buffer = this._engine.createDynamicUniformBuffer(data);
            } else {
                this._buffer = this._engine.createUniformBuffer(data);
            }

            this._needSync = false;
        } 

        public update(): void {
            if (!this._buffer) {
                this.create();
                return;
            }

            if (!this._needSync) {
                return;
            }

            this._engine.updateUniformBuffer(this._buffer, this._data);

            this._needSync = false;
        }

        public updateUniform(uniformName: string, data: number[] | Float32Array) {
            var index = this._uniformNames.indexOf(uniformName);

            if (index === -1) {
                return;
            }

            if (!this._buffer) {
                this.create();
            }

            var location = this._uniformLocations[index];
            var size = data.length;

            if (size != this._uniformSizes[index]) {
                Tools.Error("Wrong uniform size.");
                return;
            }

            var changed = false;
            for (var i = 0; i < data.length; i++) {
                if (this._data[location + i] !== data[i]) {
                   changed = true;
                    this._data[location + i] = data[i];
                }
            }

            this._needSync = this._needSync || changed;
        }

        public updateFloat(name: string, x: number) {
            var temp = [x];
            this.updateUniform(name, temp);
        }

        public updateFloat2(name: string, x: number, y: number) {
            var temp = [x, y];
            this.updateUniform(name, temp);
        }

        public updateFloat3(name: string, x: number, y: number, z: number) {
            var temp = [x, y, z];
            this.updateUniform(name, temp);
        }

        public updateFloat4(name: string, x: number, y: number, z: number, w: number) {
            var temp = [x, y, z, w];
            this.updateUniform(name, temp);
        }

        public updateMatrix(name: string, mat: Matrix) {
            this.updateUniform(name, mat.toArray());
        }

        public updateVector3(name: string, vector: Vector3) {
            var temp = [];
            vector.toArray(temp);
            this.updateUniform(name, temp);
        }

        public updateColor3(name: string, color: Color3) {
            var temp = [];
            color.toArray(temp);
            this.updateUniform(name, temp);
        }

        public updateColor4(name: string, color: Color3, alpha: number) {
            var temp = [];
            color.toArray(temp);
            temp.push(alpha);
            this.updateUniform(name, temp);
        }

        public updateUniformDirectly(uniformName: string, data: number[]) {
            this.updateUniform(uniformName, data);

            this.update();
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
