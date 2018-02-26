module BABYLON {
    export class MorphTarget {
        public animations = new Array<Animation>();

        private _positions: Nullable<FloatArray> = null;
        private _normals: Nullable<FloatArray> = null;
        private _tangents: Nullable<FloatArray> = null;
        private _influence: number;

        public onInfluenceChanged = new Observable<boolean>();

        public get influence(): number {
            return this._influence;
        }

        public set influence(influence: number) {
            if (this._influence === influence) {
                return;
            }

            var previous = this._influence;
            this._influence = influence;

            if (this.onInfluenceChanged.hasObservers) {
                this.onInfluenceChanged.notifyObservers(previous === 0 || influence === 0);
            }
        }

        public constructor(public name: string, influence = 0) {
            this.influence = influence;
        }

        public get hasPositions(): boolean {
            return !!this._positions;
        }

        public get hasNormals(): boolean {
            return !!this._normals;
        }

        public get hasTangents(): boolean {
            return !!this._tangents;
        }

        public setPositions(data: Nullable<FloatArray>) {
            this._positions = data;
        }

        public getPositions(): Nullable<FloatArray> {
            return this._positions;
        }

        public setNormals(data: Nullable<FloatArray>) {
            this._normals = data;
        }

        public getNormals(): Nullable<FloatArray> {
            return this._normals;
        }

        public setTangents(data: Nullable<FloatArray>) {
            this._tangents = data;
        }

        public getTangents(): Nullable<FloatArray> {
            return this._tangents;
        }

        /**
         * Serializes the current target into a Serialization object.  
         * Returns the serialized object.  
         */
        public serialize(): any {
            var serializationObject:any = {};

            serializationObject.name = this.name;
            serializationObject.influence = this.influence;

            serializationObject.positions = Array.prototype.slice.call(this.getPositions());
            if (this.hasNormals) {
                serializationObject.normals = Array.prototype.slice.call(this.getNormals());
            }
            if (this.hasTangents) {
                serializationObject.tangents = Array.prototype.slice.call(this.getTangents());
            }

            // Animations
            Animation.AppendSerializedAnimations(this, serializationObject);

            return serializationObject;
        }

        // Statics
        public static Parse(serializationObject: any): MorphTarget {
            var result = new MorphTarget(serializationObject.name , serializationObject.influence);

            result.setPositions(serializationObject.positions);

            if (serializationObject.normals) {
                result.setNormals(serializationObject.normals);
            }
            if (serializationObject.tangents) {
                result.setTangents(serializationObject.tangents);
            }

            // Animations
            if (serializationObject.animations) {
                for (var animationIndex = 0; animationIndex < serializationObject.animations.length; animationIndex++) {
                    var parsedAnimation = serializationObject.animations[animationIndex];

                    result.animations.push(Animation.Parse(parsedAnimation));
                }
            }

            return result;
        }

        public static FromMesh(mesh: AbstractMesh, name?: string, influence?: number): MorphTarget {
            if (!name) {
                name = mesh.name;
            }

            var result = new MorphTarget(name, influence);

            result.setPositions(<FloatArray>mesh.getVerticesData(VertexBuffer.PositionKind));

            if (mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                result.setNormals(<FloatArray>mesh.getVerticesData(VertexBuffer.NormalKind));
            }
            if (mesh.isVerticesDataPresent(VertexBuffer.TangentKind)) {
                result.setTangents(<FloatArray>mesh.getVerticesData(VertexBuffer.TangentKind));
            }

            return result;
        }
    }
}