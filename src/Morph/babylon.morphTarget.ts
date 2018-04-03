module BABYLON {
    /**
     * Defines a target to use with MorphTargetManager
     * @see http://doc.babylonjs.com/how_to/how_to_use_morphtargets
     */
    export class MorphTarget implements IAnimatable {
        /**
         * Gets or sets the list of animations
         */
        public animations = new Array<Animation>();

        private _positions: Nullable<FloatArray> = null;
        private _normals: Nullable<FloatArray> = null;
        private _tangents: Nullable<FloatArray> = null;
        private _influence: number;

        /**
         * Observable raised when the influence changes
         */
        public onInfluenceChanged = new Observable<boolean>();

        /**
         * Gets or sets the influence of this target (ie. its weight in the overall morphing)
         */
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

        /**
         * Creates a new MorphTarget
         * @param name defines the name of the target
         * @param influence defines the influence to use
         */
        public constructor(
            /** defines the name of the target */
            public name: string, influence = 0) {
            this.influence = influence;
        }

        /**
         * Gets a boolean defining if the target contains position data
         */
        public get hasPositions(): boolean {
            return !!this._positions;
        }

        /**
         * Gets a boolean defining if the target contains normal data
         */
        public get hasNormals(): boolean {
            return !!this._normals;
        }

        /**
         * Gets a boolean defining if the target contains tangent data
         */        
        public get hasTangents(): boolean {
            return !!this._tangents;
        }

        /**
         * Affects position data to this target
         * @param data defines the position data to use
         */
        public setPositions(data: Nullable<FloatArray>) {
            this._positions = data;
        }

        /**
         * Gets the position data stored in this target
         * @returns a FloatArray containing the position data (or null if not present)
         */
        public getPositions(): Nullable<FloatArray> {
            return this._positions;
        }

        /**
         * Affects normal data to this target
         * @param data defines the normal data to use
         */        
        public setNormals(data: Nullable<FloatArray>) {
            this._normals = data;
        }

        /**
         * Gets the normal data stored in this target
         * @returns a FloatArray containing the normal data (or null if not present)
         */        
        public getNormals(): Nullable<FloatArray> {
            return this._normals;
        }

        /**
         * Affects tangent data to this target
         * @param data defines the tangent data to use
         */        
        public setTangents(data: Nullable<FloatArray>) {
            this._tangents = data;
        }

        /**
         * Gets the tangent data stored in this target
         * @returns a FloatArray containing the tangent data (or null if not present)
         */   
        public getTangents(): Nullable<FloatArray> {
            return this._tangents;
        }

        /**
         * Serializes the current target into a Serialization object
         * @returns the serialized object
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

        /**
         * Creates a new target from serialized data
         * @param serializationObject defines the serialized data to use
         * @returns a new MorphTarget
         */
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

        /**
         * Creates a MorphTarget from mesh data
         * @param mesh defines the source mesh
         * @param name defines the name to use for the new target
         * @param influence defines the influence to attach to the target
         * @returns a new MorphTarget
         */
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