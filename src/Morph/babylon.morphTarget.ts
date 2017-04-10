module BABYLON {
    export class MorphTarget {
        private _positions: Float32Array;
        private _normals: Float32Array;
        private _influence: number;

        public onInfluenceChanged = new Observable<MorphTarget>();

        public get influence(): number {
            return this._influence;
        }

        public set influence(influence: number) {
            this._influence = influence;

            if (this.onInfluenceChanged.hasObservers) {
                this.onInfluenceChanged.notifyObservers(this);
            }
        }

        public constructor(public name: string, influence = 0) {
            this.influence = influence;
        }

        public get hasNormals(): boolean {
            return this._normals !== undefined;
        }

        public setPositions(data: Float32Array | number[]) {
            this._positions = new Float32Array(data);
        }

        public getPositions(): Float32Array {
            return this._positions;
        }

        public setNormals(data: Float32Array | number[]) {
            this._normals = new Float32Array(data);
        }

        public getNormals(): Float32Array {
            return this._normals;
        }

        // Statics
        public static FromMesh(mesh: AbstractMesh, name?: string, influence?: number): MorphTarget {
            if (!name) {
                name = mesh.name;
            }

            var result = new MorphTarget(name, influence);

            result.setPositions(mesh.getVerticesData(VertexBuffer.PositionKind));

            if (mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                result.setNormals(mesh.getVerticesData(VertexBuffer.NormalKind));
            }

            return result;
        }
    }
}