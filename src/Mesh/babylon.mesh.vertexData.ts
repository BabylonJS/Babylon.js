module BABYLON {
    /**
     * Define an interface for all classes that will get and set the data on vertices
     */
    export interface IGetSetVerticesData {
        /**
         * Gets a boolean indicating if specific vertex data is present
         * @param kind defines the vertex data kind to use
         * @returns true is data kind is present
         */
        isVerticesDataPresent(kind: string): boolean;
        /**
         * Gets a specific vertex data attached to this geometry. Float data is constructed if the vertex buffer data cannot be returned directly.
         * @param kind defines the data kind (Position, normal, etc...)
         * @param copyWhenShared defines if the returned array must be cloned upon returning it if the current geometry is shared between multiple meshes
         * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
         * @returns a float array containing vertex data
         */
        getVerticesData(kind: string, copyWhenShared?: boolean, forceCopy?: boolean): Nullable<FloatArray>;
        /**
         * Returns an array of integers or a typed array (Int32Array, Uint32Array, Uint16Array) populated with the mesh indices.
         * @param copyWhenShared If true (default false) and and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
         * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
         * @returns the indices array or an empty array if the mesh has no geometry
         */
        getIndices(copyWhenShared?: boolean, forceCopy?: boolean): Nullable<IndicesArray>;
        /**
         * Set specific vertex data
         * @param kind defines the data kind (Position, normal, etc...)
         * @param data defines the vertex data to use
         * @param updatable defines if the vertex must be flagged as updatable (false as default)
         * @param stride defines the stride to use (0 by default). This value is deduced from the kind value if not specified
         */
        setVerticesData(kind: string, data: FloatArray, updatable: boolean): void;
        /**
         * Update a specific associated vertex buffer
         * @param kind defines which buffer to write to (positions, indices, normals, etc). Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         * @param data defines the data source
         * @param updateExtends defines if extends info of the mesh must be updated (can be null). This is mostly useful for "position" kind
         * @param makeItUnique defines if the geometry associated with the mesh must be cloned to make the change only for this mesh (and not all meshes associated with the same geometry)
         */
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): void;
        /**
         * Creates a new index buffer
         * @param indices defines the indices to store in the index buffer
         * @param totalVertices defines the total number of vertices (could be null)
         * @param updatable defines if the index buffer must be flagged as updatable (false by default)
         */
        setIndices(indices: IndicesArray, totalVertices: Nullable<number>, updatable?: boolean): void;
    }

    /**
     * This class contains the various kinds of data on every vertex of a mesh used in determining its shape and appearance
     */
    export class VertexData {

        /**
         * An array of the x, y, z position of each vertex  [...., x, y, z, .....]
         */
        public positions: Nullable<FloatArray>;

        /**
         * An array of the x, y, z normal vector of each vertex  [...., x, y, z, .....]
         */
        public normals: Nullable<FloatArray>;

        /**
         * An array of the x, y, z tangent vector of each vertex  [...., x, y, z, .....]
         */
        public tangents: Nullable<FloatArray>;

        /**
         * An array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
         */
        public uvs: Nullable<FloatArray>;

        /**
         * A second array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
         */
        public uvs2: Nullable<FloatArray>;

        /**
         * A third array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
         */
        public uvs3: Nullable<FloatArray>;

        /**
         * A fourth array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
         */
        public uvs4: Nullable<FloatArray>;

        /**
         * A fifth array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
         */
        public uvs5: Nullable<FloatArray>;

        /**
         * A sixth array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
         */
        public uvs6: Nullable<FloatArray>;

        /**
         * An array of the r, g, b, a, color of each vertex  [...., r, g, b, a, .....]
         */
        public colors: Nullable<FloatArray>;

        /**
         * An array containing the list of indices to the array of matrices produced by bones, each vertex have up to 4 indices (8 if the matricesIndicesExtra is set).
         */
        public matricesIndices: Nullable<FloatArray>;

        /**
         * An array containing the list of weights defining the weight of each indexed matrix in the final computation
         */
        public matricesWeights: Nullable<FloatArray>;

        /**
         * An array extending the number of possible indices
         */
        public matricesIndicesExtra: Nullable<FloatArray>;

        /**
         * An array extending the number of possible weights when the number of indices is extended
         */
        public matricesWeightsExtra: Nullable<FloatArray>;

        /**
         * An array of i, j, k the three vertex indices required for each triangular facet  [...., i, j, k .....]
         */
        public indices: Nullable<IndicesArray>;

        /**
         * Uses the passed data array to set the set the values for the specified kind of data
         * @param data a linear array of floating numbers
         * @param kind the type of data that is being set, eg positions, colors etc
         */
        public set(data: FloatArray, kind: string) {
            switch (kind) {
                case VertexBuffer.PositionKind:
                    this.positions = data;
                    break;
                case VertexBuffer.NormalKind:
                    this.normals = data;
                    break;
                case VertexBuffer.TangentKind:
                    this.tangents = data;
                    break;
                case VertexBuffer.UVKind:
                    this.uvs = data;
                    break;
                case VertexBuffer.UV2Kind:
                    this.uvs2 = data;
                    break;
                case VertexBuffer.UV3Kind:
                    this.uvs3 = data;
                    break;
                case VertexBuffer.UV4Kind:
                    this.uvs4 = data;
                    break;
                case VertexBuffer.UV5Kind:
                    this.uvs5 = data;
                    break;
                case VertexBuffer.UV6Kind:
                    this.uvs6 = data;
                    break;
                case VertexBuffer.ColorKind:
                    this.colors = data;
                    break;
                case VertexBuffer.MatricesIndicesKind:
                    this.matricesIndices = data;
                    break;
                case VertexBuffer.MatricesWeightsKind:
                    this.matricesWeights = data;
                    break;
                case VertexBuffer.MatricesIndicesExtraKind:
                    this.matricesIndicesExtra = data;
                    break;
                case VertexBuffer.MatricesWeightsExtraKind:
                    this.matricesWeightsExtra = data;
                    break;
            }
        }

        /**
         * Associates the vertexData to the passed Mesh.
         * Sets it as updatable or not (default `false`)
         * @param mesh the mesh the vertexData is applied to
         * @param updatable when used and having the value true allows new data to update the vertexData
         * @returns the VertexData
         */
        public applyToMesh(mesh: Mesh, updatable?: boolean): VertexData {
            this._applyTo(mesh, updatable);
            return this;
        }

        /**
         * Associates the vertexData to the passed Geometry.
         * Sets it as updatable or not (default `false`)
         * @param geometry the geometry the vertexData is applied to
         * @param updatable when used and having the value true allows new data to update the vertexData
         * @returns VertexData
         */
        public applyToGeometry(geometry: Geometry, updatable?: boolean): VertexData {
            this._applyTo(geometry, updatable);
            return this;
        }

        /**
         * Updates the associated mesh
         * @param mesh the mesh to be updated
         * @param updateExtends when true the mesh BoundingInfo will be renewed when and if position kind is updated, optional with default false
         * @param makeItUnique when true, and when and if position kind is updated, a new global geometry will be  created from these positions and set to the mesh, optional with default false
         * @returns VertexData
         */
        public updateMesh(mesh: Mesh, updateExtends?: boolean, makeItUnique?: boolean): VertexData {
            this._update(mesh);
            return this;
        }

        /**
         * Updates the associated geometry
         * @param geometry the geometry to be updated
         * @param updateExtends when true BoundingInfo will be renewed when and if position kind is updated, optional with default false
         * @param makeItUnique when true, and when and if position kind is updated, a new global geometry will be created from these positions and set to the mesh, optional with default false
         * @returns VertexData.
         */
        public updateGeometry(geometry: Geometry, updateExtends?: boolean, makeItUnique?: boolean): VertexData {
            this._update(geometry);
            return this;
        }

        private _applyTo(meshOrGeometry: IGetSetVerticesData, updatable: boolean = false): VertexData {
            if (this.positions) {
                meshOrGeometry.setVerticesData(VertexBuffer.PositionKind, this.positions, updatable);
            }

            if (this.normals) {
                meshOrGeometry.setVerticesData(VertexBuffer.NormalKind, this.normals, updatable);
            }

            if (this.tangents) {
                meshOrGeometry.setVerticesData(VertexBuffer.TangentKind, this.tangents, updatable);
            }

            if (this.uvs) {
                meshOrGeometry.setVerticesData(VertexBuffer.UVKind, this.uvs, updatable);
            }

            if (this.uvs2) {
                meshOrGeometry.setVerticesData(VertexBuffer.UV2Kind, this.uvs2, updatable);
            }

            if (this.uvs3) {
                meshOrGeometry.setVerticesData(VertexBuffer.UV3Kind, this.uvs3, updatable);
            }

            if (this.uvs4) {
                meshOrGeometry.setVerticesData(VertexBuffer.UV4Kind, this.uvs4, updatable);
            }

            if (this.uvs5) {
                meshOrGeometry.setVerticesData(VertexBuffer.UV5Kind, this.uvs5, updatable);
            }

            if (this.uvs6) {
                meshOrGeometry.setVerticesData(VertexBuffer.UV6Kind, this.uvs6, updatable);
            }

            if (this.colors) {
                meshOrGeometry.setVerticesData(VertexBuffer.ColorKind, this.colors, updatable);
            }

            if (this.matricesIndices) {
                meshOrGeometry.setVerticesData(VertexBuffer.MatricesIndicesKind, this.matricesIndices, updatable);
            }

            if (this.matricesWeights) {
                meshOrGeometry.setVerticesData(VertexBuffer.MatricesWeightsKind, this.matricesWeights, updatable);
            }

            if (this.matricesIndicesExtra) {
                meshOrGeometry.setVerticesData(VertexBuffer.MatricesIndicesExtraKind, this.matricesIndicesExtra, updatable);
            }

            if (this.matricesWeightsExtra) {
                meshOrGeometry.setVerticesData(VertexBuffer.MatricesWeightsExtraKind, this.matricesWeightsExtra, updatable);
            }

            if (this.indices) {
                meshOrGeometry.setIndices(this.indices, null, updatable);
            } else {
                meshOrGeometry.setIndices([], null);
            }

            return this;
        }

        private _update(meshOrGeometry: IGetSetVerticesData, updateExtends?: boolean, makeItUnique?: boolean): VertexData {
            if (this.positions) {
                meshOrGeometry.updateVerticesData(VertexBuffer.PositionKind, this.positions, updateExtends, makeItUnique);
            }

            if (this.normals) {
                meshOrGeometry.updateVerticesData(VertexBuffer.NormalKind, this.normals, updateExtends, makeItUnique);
            }

            if (this.tangents) {
                meshOrGeometry.updateVerticesData(VertexBuffer.TangentKind, this.tangents, updateExtends, makeItUnique);
            }

            if (this.uvs) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UVKind, this.uvs, updateExtends, makeItUnique);
            }

            if (this.uvs2) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UV2Kind, this.uvs2, updateExtends, makeItUnique);
            }

            if (this.uvs3) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UV3Kind, this.uvs3, updateExtends, makeItUnique);
            }

            if (this.uvs4) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UV4Kind, this.uvs4, updateExtends, makeItUnique);
            }

            if (this.uvs5) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UV5Kind, this.uvs5, updateExtends, makeItUnique);
            }

            if (this.uvs6) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UV6Kind, this.uvs6, updateExtends, makeItUnique);
            }

            if (this.colors) {
                meshOrGeometry.updateVerticesData(VertexBuffer.ColorKind, this.colors, updateExtends, makeItUnique);
            }

            if (this.matricesIndices) {
                meshOrGeometry.updateVerticesData(VertexBuffer.MatricesIndicesKind, this.matricesIndices, updateExtends, makeItUnique);
            }

            if (this.matricesWeights) {
                meshOrGeometry.updateVerticesData(VertexBuffer.MatricesWeightsKind, this.matricesWeights, updateExtends, makeItUnique);
            }

            if (this.matricesIndicesExtra) {
                meshOrGeometry.updateVerticesData(VertexBuffer.MatricesIndicesExtraKind, this.matricesIndicesExtra, updateExtends, makeItUnique);
            }

            if (this.matricesWeightsExtra) {
                meshOrGeometry.updateVerticesData(VertexBuffer.MatricesWeightsExtraKind, this.matricesWeightsExtra, updateExtends, makeItUnique);
            }

            if (this.indices) {
                meshOrGeometry.setIndices(this.indices, null);
            }
            return this;
        }

        /**
         * Transforms each position and each normal of the vertexData according to the passed Matrix
         * @param matrix the transforming matrix
         * @returns the VertexData
         */
        public transform(matrix: Matrix): VertexData {
            var flip = matrix.m[0] * matrix.m[5] * matrix.m[10] < 0;
            var transformed = Vector3.Zero();
            var index: number;
            if (this.positions) {
                var position = Vector3.Zero();

                for (index = 0; index < this.positions.length; index += 3) {
                    Vector3.FromArrayToRef(this.positions, index, position);

                    Vector3.TransformCoordinatesToRef(position, matrix, transformed);
                    this.positions[index] = transformed.x;
                    this.positions[index + 1] = transformed.y;
                    this.positions[index + 2] = transformed.z;
                }
            }

            if (this.normals) {
                var normal = Vector3.Zero();

                for (index = 0; index < this.normals.length; index += 3) {
                    Vector3.FromArrayToRef(this.normals, index, normal);

                    Vector3.TransformNormalToRef(normal, matrix, transformed);
                    this.normals[index] = transformed.x;
                    this.normals[index + 1] = transformed.y;
                    this.normals[index + 2] = transformed.z;
                }
            }

            if (this.tangents) {
                var tangent = Vector4.Zero();
                var tangentTransformed = Vector4.Zero();

                for (index = 0; index < this.tangents.length; index += 4) {
                    Vector4.FromArrayToRef(this.tangents, index, tangent);

                    Vector4.TransformNormalToRef(tangent, matrix, tangentTransformed);
                    this.tangents[index] = tangentTransformed.x;
                    this.tangents[index + 1] = tangentTransformed.y;
                    this.tangents[index + 2] = tangentTransformed.z;
                    this.tangents[index + 3] = tangentTransformed.w;
                }
            }

            if (flip && this.indices) {
                for (index = 0; index < this.indices!.length; index += 3) {
                    let tmp = this.indices[index + 1];
                    this.indices[index + 1] = this.indices[index + 2];
                    this.indices[index + 2] = tmp;
                }
            }

            return this;
        }

        /**
         * Merges the passed VertexData into the current one
         * @param other the VertexData to be merged into the current one
         * @param use32BitsIndices defines a boolean indicating if indices must be store in a 32 bits array
         * @returns the modified VertexData
         */
        public merge(other: VertexData, use32BitsIndices = false): VertexData {
            this._validate();
            other._validate();

            if (!this.normals !== !other.normals ||
                !this.tangents !== !other.tangents ||
                !this.uvs !== !other.uvs ||
                !this.uvs2 !== !other.uvs2 ||
                !this.uvs3 !== !other.uvs3 ||
                !this.uvs4 !== !other.uvs4 ||
                !this.uvs5 !== !other.uvs5 ||
                !this.uvs6 !== !other.uvs6 ||
                !this.colors !== !other.colors ||
                !this.matricesIndices !== !other.matricesIndices ||
                !this.matricesWeights !== !other.matricesWeights ||
                !this.matricesIndicesExtra !== !other.matricesIndicesExtra ||
                !this.matricesWeightsExtra !== !other.matricesWeightsExtra)
            {
                throw new Error("Cannot merge vertex data that do not have the same set of attributes");
            }

            if (other.indices) {
                if (!this.indices) {
                    this.indices = [];
                }

                var offset = this.positions ? this.positions.length / 3 : 0;

                var isSrcTypedArray = (<any>this.indices).BYTES_PER_ELEMENT !== undefined;

                if (isSrcTypedArray) {
                    var len = this.indices.length + other.indices.length;
                    var temp = use32BitsIndices || this.indices instanceof Uint32Array ? new Uint32Array(len) : new Uint16Array(len);
                    temp.set(this.indices);

                    let decal = this.indices.length;
                    for (var index = 0; index < other.indices.length; index++) {
                        temp[decal + index] = other.indices[index] + offset;
                    }

                    this.indices = temp;
                } else {
                    for (var index = 0; index < other.indices.length; index++) {
                        (<number[]>this.indices).push(other.indices[index] + offset);
                    }
                }
            }

            this.positions = this._mergeElement(this.positions, other.positions);
            this.normals = this._mergeElement(this.normals, other.normals);
            this.tangents = this._mergeElement(this.tangents, other.tangents);
            this.uvs = this._mergeElement(this.uvs, other.uvs);
            this.uvs2 = this._mergeElement(this.uvs2, other.uvs2);
            this.uvs3 = this._mergeElement(this.uvs3, other.uvs3);
            this.uvs4 = this._mergeElement(this.uvs4, other.uvs4);
            this.uvs5 = this._mergeElement(this.uvs5, other.uvs5);
            this.uvs6 = this._mergeElement(this.uvs6, other.uvs6);
            this.colors = this._mergeElement(this.colors, other.colors);
            this.matricesIndices = this._mergeElement(this.matricesIndices, other.matricesIndices);
            this.matricesWeights = this._mergeElement(this.matricesWeights, other.matricesWeights);
            this.matricesIndicesExtra = this._mergeElement(this.matricesIndicesExtra, other.matricesIndicesExtra);
            this.matricesWeightsExtra = this._mergeElement(this.matricesWeightsExtra, other.matricesWeightsExtra);
            return this;
        }

        private _mergeElement(source: Nullable<FloatArray>, other: Nullable<FloatArray>): Nullable<FloatArray> {
            if (!source) {
                return other;
            }

            if (!other) {
                return source;
            }

            var len = other.length + source.length;
            var isSrcTypedArray = source instanceof Float32Array;
            var isOthTypedArray = other instanceof Float32Array;

            // use non-loop method when the source is Float32Array
            if (isSrcTypedArray) {
                var ret32 = new Float32Array(len);
                ret32.set(source);
                ret32.set(other, source.length);
                return ret32;

                // source is number[], when other is also use concat
            } else if (!isOthTypedArray) {
                return (<number[]>source).concat(<number[]>other);

                // source is a number[], but other is a Float32Array, loop required
            } else {
                var ret = (<number[]>source).slice(0); // copy source to a separate array
                for (var i = 0, len = other.length; i < len; i++) {
                    ret.push(other[i]);
                }
                return ret;
            }
        }

        private _validate(): void {
            if (!this.positions) {
                throw new Error("Positions are required");
            }

            const getElementCount = (kind: string, values: FloatArray) => {
                const stride = VertexBuffer.DeduceStride(kind);
                if ((values.length % stride) !== 0) {
                    throw new Error("The " + kind + "s array count must be a multiple of " + stride);
                }

                return values.length / stride;
            };

            const positionsElementCount = getElementCount(VertexBuffer.PositionKind, this.positions);

            const validateElementCount = (kind: string, values: FloatArray) => {
                const elementCount = getElementCount(kind, values);
                if (elementCount !== positionsElementCount) {
                    throw new Error("The " + kind + "s element count (" + elementCount + ") does not match the positions count (" + positionsElementCount + ")");
                }
            };

            if (this.normals) { validateElementCount(VertexBuffer.NormalKind, this.normals); }
            if (this.tangents) { validateElementCount(VertexBuffer.TangentKind, this.tangents); }
            if (this.uvs) { validateElementCount(VertexBuffer.UVKind, this.uvs); }
            if (this.uvs2) { validateElementCount(VertexBuffer.UV2Kind, this.uvs2); }
            if (this.uvs3) { validateElementCount(VertexBuffer.UV3Kind, this.uvs3); }
            if (this.uvs4) { validateElementCount(VertexBuffer.UV4Kind, this.uvs4); }
            if (this.uvs5) { validateElementCount(VertexBuffer.UV5Kind, this.uvs5); }
            if (this.uvs6) { validateElementCount(VertexBuffer.UV6Kind, this.uvs6); }
            if (this.colors) { validateElementCount(VertexBuffer.ColorKind, this.colors); }
            if (this.matricesIndices) { validateElementCount(VertexBuffer.MatricesIndicesKind, this.matricesIndices); }
            if (this.matricesWeights) { validateElementCount(VertexBuffer.MatricesWeightsKind, this.matricesWeights); }
            if (this.matricesIndicesExtra) { validateElementCount(VertexBuffer.MatricesIndicesExtraKind, this.matricesIndicesExtra); }
            if (this.matricesWeightsExtra) { validateElementCount(VertexBuffer.MatricesWeightsExtraKind, this.matricesWeightsExtra); }
        }

        /**
         * Serializes the VertexData
         * @returns a serialized object
         */
        public serialize(): any {
            var serializationObject = this.serialize();

            if (this.positions) {
                serializationObject.positions = this.positions;
            }

            if (this.normals) {
                serializationObject.normals = this.normals;
            }

            if (this.tangents) {
                serializationObject.tangents = this.tangents;
            }

            if (this.uvs) {
                serializationObject.uvs = this.uvs;
            }

            if (this.uvs2) {
                serializationObject.uvs2 = this.uvs2;
            }

            if (this.uvs3) {
                serializationObject.uvs3 = this.uvs3;
            }

            if (this.uvs4) {
                serializationObject.uvs4 = this.uvs4;
            }

            if (this.uvs5) {
                serializationObject.uvs5 = this.uvs5;
            }

            if (this.uvs6) {
                serializationObject.uvs6 = this.uvs6;
            }

            if (this.colors) {
                serializationObject.colors = this.colors;
            }

            if (this.matricesIndices) {
                serializationObject.matricesIndices = this.matricesIndices;
                serializationObject.matricesIndices._isExpanded = true;
            }

            if (this.matricesWeights) {
                serializationObject.matricesWeights = this.matricesWeights;
            }

            if (this.matricesIndicesExtra) {
                serializationObject.matricesIndicesExtra = this.matricesIndicesExtra;
                serializationObject.matricesIndicesExtra._isExpanded = true;
            }

            if (this.matricesWeightsExtra) {
                serializationObject.matricesWeightsExtra = this.matricesWeightsExtra;
            }

            serializationObject.indices = this.indices;

            return serializationObject;
        }

        // Statics
        /**
         * Extracts the vertexData from a mesh
         * @param mesh the mesh from which to extract the VertexData
         * @param copyWhenShared defines if the VertexData must be cloned when shared between multiple meshes, optional, default false
         * @param forceCopy indicating that the VertexData must be cloned, optional, default false
         * @returns the object VertexData associated to the passed mesh
         */
        public static ExtractFromMesh(mesh: Mesh, copyWhenShared?: boolean, forceCopy?: boolean): VertexData {
            return VertexData._ExtractFrom(mesh, copyWhenShared, forceCopy);
        }

        /**
         * Extracts the vertexData from the geometry
         * @param geometry the geometry from which to extract the VertexData
         * @param copyWhenShared defines if the VertexData must be cloned when the geometrty is shared between multiple meshes, optional, default false
         * @param forceCopy indicating that the VertexData must be cloned, optional, default false
         * @returns the object VertexData associated to the passed mesh
         */
        public static ExtractFromGeometry(geometry: Geometry, copyWhenShared?: boolean, forceCopy?: boolean): VertexData {
            return VertexData._ExtractFrom(geometry, copyWhenShared, forceCopy);
        }

        private static _ExtractFrom(meshOrGeometry: IGetSetVerticesData, copyWhenShared?: boolean, forceCopy?: boolean): VertexData {
            var result = new VertexData();

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.PositionKind)) {
                result.positions = meshOrGeometry.getVerticesData(VertexBuffer.PositionKind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                result.normals = meshOrGeometry.getVerticesData(VertexBuffer.NormalKind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.TangentKind)) {
                result.tangents = meshOrGeometry.getVerticesData(VertexBuffer.TangentKind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UVKind)) {
                result.uvs = meshOrGeometry.getVerticesData(VertexBuffer.UVKind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                result.uvs2 = meshOrGeometry.getVerticesData(VertexBuffer.UV2Kind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV3Kind)) {
                result.uvs3 = meshOrGeometry.getVerticesData(VertexBuffer.UV3Kind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV4Kind)) {
                result.uvs4 = meshOrGeometry.getVerticesData(VertexBuffer.UV4Kind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV5Kind)) {
                result.uvs5 = meshOrGeometry.getVerticesData(VertexBuffer.UV5Kind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV6Kind)) {
                result.uvs6 = meshOrGeometry.getVerticesData(VertexBuffer.UV6Kind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                result.colors = meshOrGeometry.getVerticesData(VertexBuffer.ColorKind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind)) {
                result.matricesIndices = meshOrGeometry.getVerticesData(VertexBuffer.MatricesIndicesKind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind)) {
                result.matricesWeights = meshOrGeometry.getVerticesData(VertexBuffer.MatricesWeightsKind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.MatricesIndicesExtraKind)) {
                result.matricesIndicesExtra = meshOrGeometry.getVerticesData(VertexBuffer.MatricesIndicesExtraKind, copyWhenShared, forceCopy);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.MatricesWeightsExtraKind)) {
                result.matricesWeightsExtra = meshOrGeometry.getVerticesData(VertexBuffer.MatricesWeightsExtraKind, copyWhenShared, forceCopy);
            }

            result.indices = meshOrGeometry.getIndices(copyWhenShared, forceCopy);

            return result;
        }

        /**
         * Creates the VertexData for a Ribbon
         * @param options an object used to set the following optional parameters for the ribbon, required but can be empty
          * * pathArray array of paths, each of which an array of successive Vector3
          * * closeArray creates a seam between the first and the last paths of the pathArray, optional, default false
          * * closePath creates a seam between the first and the last points of each path of the path array, optional, default false
          * * offset a positive integer, only used when pathArray contains a single path (offset = 10 means the point 1 is joined to the point 11), default rounded half size of the pathArray length
          * * sideOrientation optional and takes the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
          * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
          * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
          * * invertUV swaps in the U and V coordinates when applying a texture, optional, default false
          * * uvs a linear array, of length 2 * number of vertices, of custom UV values, optional
          * * colors a linear array, of length 4 * number of vertices, of custom color values, optional
         * @returns the VertexData of the ribbon
         */
        public static CreateRibbon(options: { pathArray: Vector3[][], closeArray?: boolean, closePath?: boolean, offset?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, invertUV?: boolean, uvs?: Vector2[], colors?: Color4[] }): VertexData {
            var pathArray: Vector3[][] = options.pathArray;
            var closeArray: boolean = options.closeArray || false;
            var closePath: boolean = options.closePath || false;
            var invertUV: boolean = options.invertUV || false;
            var defaultOffset: number = Math.floor(pathArray[0].length / 2);
            var offset: number = options.offset || defaultOffset;
            offset = offset > defaultOffset ? defaultOffset : Math.floor(offset); // offset max allowed : defaultOffset
            var sideOrientation: number = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;
            var customUV = options.uvs;
            var customColors = options.colors;

            var positions: number[] = [];
            var indices: number[] = [];
            var normals: number[] = [];
            var uvs: number[] = [];

            var us: number[][] = [];        		// us[path_id] = [uDist1, uDist2, uDist3 ... ] distances between points on path path_id
            var vs: number[][] = [];        		// vs[i] = [vDist1, vDist2, vDist3, ... ] distances between points i of consecutives paths from pathArray
            var uTotalDistance: number[] = []; 		// uTotalDistance[p] : total distance of path p
            var vTotalDistance: number[] = []; 		//  vTotalDistance[i] : total distance between points i of first and last path from pathArray
            var minlg: number;          	        // minimal length among all paths from pathArray
            var lg: number[] = [];        		    // array of path lengths : nb of vertex per path
            var idx: number[] = [];       		    // array of path indexes : index of each path (first vertex) in the total vertex number
            var p: number;							// path iterator
            var i: number;							// point iterator
            var j: number;							// point iterator

            // if single path in pathArray
            if (pathArray.length < 2) {
                var ar1: Vector3[] = [];
                var ar2: Vector3[] = [];
                for (i = 0; i < pathArray[0].length - offset; i++) {
                    ar1.push(pathArray[0][i]);
                    ar2.push(pathArray[0][i + offset]);
                }
                pathArray = [ar1, ar2];
            }

            // positions and horizontal distances (u)
            var idc: number = 0;
            var closePathCorr: number = (closePath) ? 1 : 0;    // the final index will be +1 if closePath
            var path: Vector3[];
            var l: number;
            minlg = pathArray[0].length;
            var vectlg: number;
            var dist: number;
            for (p = 0; p < pathArray.length; p++) {
                uTotalDistance[p] = 0;
                us[p] = [0];
                path = pathArray[p];
                l = path.length;
                minlg = (minlg < l) ? minlg : l;

                j = 0;
                while (j < l) {
                    positions.push(path[j].x, path[j].y, path[j].z);
                    if (j > 0) {
                        vectlg = path[j].subtract(path[j - 1]).length();
                        dist = vectlg + uTotalDistance[p];
                        us[p].push(dist);
                        uTotalDistance[p] = dist;
                    }
                    j++;
                }

                if (closePath) {        // an extra hidden vertex is added in the "positions" array
                    j--;
                    positions.push(path[0].x, path[0].y, path[0].z);
                    vectlg = path[j].subtract(path[0]).length();
                    dist = vectlg + uTotalDistance[p];
                    us[p].push(dist);
                    uTotalDistance[p] = dist;
                }

                lg[p] = l + closePathCorr;
                idx[p] = idc;
                idc += (l + closePathCorr);
            }

            // vertical distances (v)
            var path1: Vector3[];
            var path2: Vector3[];
            var vertex1: Nullable<Vector3> = null;
            var vertex2: Nullable<Vector3> = null;
            for (i = 0; i < minlg + closePathCorr; i++) {
                vTotalDistance[i] = 0;
                vs[i] = [0];
                for (p = 0; p < pathArray.length - 1; p++) {
                    path1 = pathArray[p];
                    path2 = pathArray[p + 1];
                    if (i === minlg) {   // closePath
                        vertex1 = path1[0];
                        vertex2 = path2[0];
                    }
                    else {
                        vertex1 = path1[i];
                        vertex2 = path2[i];
                    }
                    vectlg = vertex2.subtract(vertex1).length();
                    dist = vectlg + vTotalDistance[i];
                    vs[i].push(dist);
                    vTotalDistance[i] = dist;
                }

                if (closeArray && vertex2 && vertex1) {
                    path1 = pathArray[p];
                    path2 = pathArray[0];
                    if (i === minlg) {   // closePath
                        vertex2 = path2[0];
                    }
                    vectlg = vertex2.subtract(vertex1).length();
                    dist = vectlg + vTotalDistance[i];
                    vTotalDistance[i] = dist;
                }
            }

            // uvs
            var u: number;
            var v: number;
            if (customUV) {
                for (p = 0; p < customUV.length; p++) {
                    uvs.push(customUV[p].x, customUV[p].y);
                }
            }
            else {
                for (p = 0; p < pathArray.length; p++) {
                    for (i = 0; i < minlg + closePathCorr; i++) {
                        u = (uTotalDistance[p] != 0.0) ? us[p][i] / uTotalDistance[p] : 0.0;
                        v = (vTotalDistance[i] != 0.0) ? vs[i][p] / vTotalDistance[i] : 0.0;
                        if (invertUV) {
                            uvs.push(v, u);
                        } else {
                            uvs.push(u, v);
                        }
                    }
                }
            }

            // indices
            p = 0;                    					// path index
            var pi: number = 0;                    		// positions array index
            var l1: number = lg[p] - 1;           		// path1 length
            var l2: number = lg[p + 1] - 1;         	// path2 length
            var min: number = (l1 < l2) ? l1 : l2;   	// current path stop index
            var shft: number = idx[1] - idx[0];         // shift
            var path1nb: number = closeArray ? lg.length : lg.length - 1;     // number of path1 to iterate	on

            while (pi <= min && p < path1nb) {       	//  stay under min and don't go over next to last path
                // draw two triangles between path1 (p1) and path2 (p2) : (p1.pi, p2.pi, p1.pi+1) and (p2.pi+1, p1.pi+1, p2.pi) clockwise

                indices.push(pi, pi + shft, pi + 1);
                indices.push(pi + shft + 1, pi + 1, pi + shft);
                pi += 1;
                if (pi === min) {                   			// if end of one of two consecutive paths reached, go to next existing path
                    p++;
                    if (p === lg.length - 1) {                 // last path of pathArray reached <=> closeArray == true
                        shft = idx[0] - idx[p];
                        l1 = lg[p] - 1;
                        l2 = lg[0] - 1;
                    }
                    else {
                        shft = idx[p + 1] - idx[p];
                        l1 = lg[p] - 1;
                        l2 = lg[p + 1] - 1;
                    }
                    pi = idx[p];
                    min = (l1 < l2) ? l1 + pi : l2 + pi;
                }
            }

            // normals
            VertexData.ComputeNormals(positions, indices, normals);

            if (closePath) {        // update both the first and last vertex normals to their average value
                var indexFirst: number = 0;
                var indexLast: number = 0;
                for (p = 0; p < pathArray.length; p++) {
                    indexFirst = idx[p] * 3;
                    if (p + 1 < pathArray.length) {
                        indexLast = (idx[p + 1] - 1) * 3;
                    }
                    else {
                        indexLast = normals.length - 3;
                    }
                    normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * 0.5;
                    normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * 0.5;
                    normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * 0.5;
                    normals[indexLast] = normals[indexFirst];
                    normals[indexLast + 1] = normals[indexFirst + 1];
                    normals[indexLast + 2] = normals[indexFirst + 2];
                }
            }

            // sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

            // Colors
            let colors: Nullable<Float32Array> = null;
            if (customColors) {
                colors = new Float32Array(customColors.length * 4);
                for (var c = 0; c < customColors.length; c++) {
                    colors[c * 4] = customColors[c].r;
                    colors[c * 4 + 1] = customColors[c].g;
                    colors[c * 4 + 2] = customColors[c].b;
                    colors[c * 4 + 3] = customColors[c].a;
                }
            }

            // Result
            var vertexData = new VertexData();
            var positions32 = new Float32Array(positions);
            var normals32 = new Float32Array(normals);
            var uvs32 = new Float32Array(uvs);

            vertexData.indices = indices;
            vertexData.positions = positions32;
            vertexData.normals = normals32;
            vertexData.uvs = uvs32;
            if (colors) {
                vertexData.set(colors, VertexBuffer.ColorKind);
            }

            if (closePath) {
                (<any>vertexData)._idx = idx;
            }

            return vertexData;
        }

        /**
         * Creates the VertexData for a box
         * @param options an object used to set the following optional parameters for the box, required but can be empty
          * * size sets the width, height and depth of the box to the value of size, optional default 1
          * * width sets the width (x direction) of the box, overwrites the width set by size, optional, default size
          * * height sets the height (y direction) of the box, overwrites the height set by size, optional, default size
          * * depth sets the depth (z direction) of the box, overwrites the depth set by size, optional, default size
          * * faceUV an array of 6 Vector4 elements used to set different images to each box side
          * * faceColors an array of 6 Color3 elements used to set different colors to each box side
          * * sideOrientation optional and takes the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
          * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
          * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
         * @returns the VertexData of the box
         */
        public static CreateBox(options: { size?: number, width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
            var normalsSource = [
                new Vector3(0, 0, 1),
                new Vector3(0, 0, -1),
                new Vector3(1, 0, 0),
                new Vector3(-1, 0, 0),
                new Vector3(0, 1, 0),
                new Vector3(0, -1, 0)
            ];

            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];

            var width = options.width || options.size || 1;
            var height = options.height || options.size || 1;
            var depth = options.depth || options.size || 1;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;
            var faceUV: Vector4[] = options.faceUV || new Array<Vector4>(6);
            var faceColors = options.faceColors;
            var colors = [];

            // default face colors and UV if undefined
            for (var f = 0; f < 6; f++) {
                if (faceUV[f] === undefined) {
                    faceUV[f] = new Vector4(0, 0, 1, 1);
                }
                if (faceColors && faceColors[f] === undefined) {
                    faceColors[f] = new Color4(1, 1, 1, 1);
                }
            }

            var scaleVector = new Vector3(width / 2, height / 2, depth / 2);

            // Create each face in turn.
            for (var index = 0; index < normalsSource.length; index++) {
                var normal = normalsSource[index];

                // Get two vectors perpendicular to the face normal and to each other.
                var side1 = new Vector3(normal.y, normal.z, normal.x);
                var side2 = Vector3.Cross(normal, side1);

                // Six indices (two triangles) per face.
                var verticesLength = positions.length / 3;
                indices.push(verticesLength);
                indices.push(verticesLength + 1);
                indices.push(verticesLength + 2);

                indices.push(verticesLength);
                indices.push(verticesLength + 2);
                indices.push(verticesLength + 3);

                // Four vertices per face.
                var vertex = normal.subtract(side1).subtract(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].z, faceUV[index].w);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }

                vertex = normal.subtract(side1).add(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].x, faceUV[index].w);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }

                vertex = normal.add(side1).add(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].x, faceUV[index].y);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }

                vertex = normal.add(side1).subtract(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].z, faceUV[index].y);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }
            }

            // sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            if (faceColors) {
                var totalColors = (sideOrientation === Mesh.DOUBLESIDE) ? colors.concat(colors) : colors;
                vertexData.colors = totalColors;
            }

            return vertexData;
        }

        /**
         * Creates the VertexData for an ellipsoid, defaults to a sphere
         * @param options an object used to set the following optional parameters for the box, required but can be empty
          * * segments sets the number of horizontal strips optional, default 32
          * * diameter sets the axes dimensions, diameterX, diameterY and diameterZ to the value of diameter, optional default 1
          * * diameterX sets the diameterX (x direction) of the ellipsoid, overwrites the diameterX set by diameter, optional, default diameter
          * * diameterY sets the diameterY (y direction) of the ellipsoid, overwrites the diameterY set by diameter, optional, default diameter
          * * diameterZ sets the diameterZ (z direction) of the ellipsoid, overwrites the diameterZ set by diameter, optional, default diameter
          * * arc a number from 0 to 1, to create an unclosed ellipsoid based on the fraction of the circumference (latitude) given by the arc value, optional, default 1
          * * slice a number from 0 to 1, to create an unclosed ellipsoid based on the fraction of the height (latitude) given by the arc value, optional, default 1
          * * sideOrientation optional and takes the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
          * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
          * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
         * @returns the VertexData of the ellipsoid
         */
        public static CreateSphere(options: { segments?: number, diameter?: number, diameterX?: number, diameterY?: number, diameterZ?: number, arc?: number, slice?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
            var segments: number = options.segments || 32;
            var diameterX: number = options.diameterX || options.diameter || 1;
            var diameterY: number = options.diameterY || options.diameter || 1;
            var diameterZ: number = options.diameterZ || options.diameter || 1;
            var arc: number = options.arc && (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
            var slice: number = options.slice && (options.slice <= 0) ? 1.0 : options.slice || 1.0;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;

            var radius = new Vector3(diameterX / 2, diameterY / 2, diameterZ / 2);

            var totalZRotationSteps = 2 + segments;
            var totalYRotationSteps = 2 * totalZRotationSteps;

            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];

            for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
                var normalizedZ = zRotationStep / totalZRotationSteps;
                var angleZ = normalizedZ * Math.PI * slice;

                for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
                    var normalizedY = yRotationStep / totalYRotationSteps;

                    var angleY = normalizedY * Math.PI * 2 * arc;

                    var rotationZ = Matrix.RotationZ(-angleZ);
                    var rotationY = Matrix.RotationY(angleY);
                    var afterRotZ = Vector3.TransformCoordinates(Vector3.Up(), rotationZ);
                    var complete = Vector3.TransformCoordinates(afterRotZ, rotationY);

                    var vertex = complete.multiply(radius);
                    var normal = complete.divide(radius).normalize();

                    positions.push(vertex.x, vertex.y, vertex.z);
                    normals.push(normal.x, normal.y, normal.z);
                    uvs.push(normalizedY, normalizedZ);
                }

                if (zRotationStep > 0) {
                    var verticesCount = positions.length / 3;
                    for (var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1); (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
                        indices.push((firstIndex));
                        indices.push((firstIndex + 1));
                        indices.push(firstIndex + totalYRotationSteps + 1);

                        indices.push((firstIndex + totalYRotationSteps + 1));
                        indices.push((firstIndex + 1));
                        indices.push((firstIndex + totalYRotationSteps + 2));
                    }
                }
            }

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        /**
         * Creates the VertexData for a cylinder, cone or prism
         * @param options an object used to set the following optional parameters for the box, required but can be empty
          * * height sets the height (y direction) of the cylinder, optional, default 2
          * * diameterTop sets the diameter of the top of the cone, overwrites diameter,  optional, default diameter
          * * diameterBottom sets the diameter of the bottom of the cone, overwrites diameter,  optional, default diameter
          * * diameter sets the diameter of the top and bottom of the cone, optional default 1
          * * tessellation the number of prism sides, 3 for a triangular prism, optional, default 24
          * * subdivisions` the number of rings along the cylinder height, optional, default 1
          * * arc a number from 0 to 1, to create an unclosed cylinder based on the fraction of the circumference given by the arc value, optional, default 1
          * * faceColors an array of Color3 elements used to set different colors to the top, rings and bottom respectively
          * * faceUV an array of Vector4 elements used to set different images to the top, rings and bottom respectively
          * * hasRings when true makes each subdivision independantly treated as a face for faceUV and faceColors, optional, default false
          * * enclose when true closes an open cylinder by adding extra flat faces between the height axis and vertical edges, think cut cake
          * * sideOrientation optional and takes the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
          * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
          * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
         * @returns the VertexData of the cylinder, cone or prism
         */
        public static CreateCylinder(options: { height?: number, diameterTop?: number, diameterBottom?: number, diameter?: number, tessellation?: number, subdivisions?: number, arc?: number, faceColors?: Color4[], faceUV?: Vector4[], hasRings?: boolean, enclose?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
            var height: number = options.height || 2;
            var diameterTop: number = (options.diameterTop === 0) ? 0 : options.diameterTop || options.diameter || 1;
            var diameterBottom: number = (options.diameterBottom === 0) ? 0 : options.diameterBottom || options.diameter || 1;
            var tessellation: number = options.tessellation || 24;
            var subdivisions: number = options.subdivisions || 1;
            var hasRings: boolean = options.hasRings ? true : false;
            var enclose: boolean = options.enclose ? true : false;
            var arc: number = options.arc && (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
            var sideOrientation: number = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;
            var faceUV: Vector4[] = options.faceUV || new Array<Vector4>(3);
            var faceColors = options.faceColors;
            // default face colors and UV if undefined
            var quadNb: number = (arc !== 1 && enclose) ? 2 : 0;
            var ringNb: number = (hasRings) ? subdivisions : 1;
            var surfaceNb: number = 2 + (1 + quadNb) * ringNb;
            var f: number;

            for (f = 0; f < surfaceNb; f++) {
                if (faceColors && faceColors[f] === undefined) {
                    faceColors[f] = new Color4(1, 1, 1, 1);
                }
            }
            for (f = 0; f < surfaceNb; f++) {
                if (faceUV && faceUV[f] === undefined) {
                    faceUV[f] = new Vector4(0, 0, 1, 1);
                }
            }

            var indices = new Array<number>();
            var positions = new Array<number>();
            var normals = new Array<number>();
            var uvs = new Array<number>();
            var colors = new Array<number>();

            var angle_step = Math.PI * 2 * arc / tessellation;
            var angle: number;
            var h: number;
            var radius: number;
            var tan = (diameterBottom - diameterTop) / 2 / height;
            var ringVertex: Vector3 = Vector3.Zero();
            var ringNormal: Vector3 = Vector3.Zero();
            var ringFirstVertex: Vector3 = Vector3.Zero();
            var ringFirstNormal: Vector3 = Vector3.Zero();
            var quadNormal: Vector3 = Vector3.Zero();
            var Y: Vector3 = Axis.Y;

            // positions, normals, uvs
            var i: number;
            var j: number;
            var r: number;
            var ringIdx: number = 1;
            var s: number = 1;      // surface index
            var cs: number = 0;
            var v: number = 0;

            for (i = 0; i <= subdivisions; i++) {
                h = i / subdivisions;
                radius = (h * (diameterTop - diameterBottom) + diameterBottom) / 2;
                ringIdx = (hasRings && i !== 0 && i !== subdivisions) ? 2 : 1;
                for (r = 0; r < ringIdx; r++) {
                    if (hasRings) {
                        s += r;
                    }
                    if (enclose) {
                        s += 2 * r;
                    }
                    for (j = 0; j <= tessellation; j++) {
                        angle = j * angle_step;

                        // position
                        ringVertex.x = Math.cos(-angle) * radius;
                        ringVertex.y = -height / 2 + h * height;
                        ringVertex.z = Math.sin(-angle) * radius;

                        // normal
                        if (diameterTop === 0 && i === subdivisions) {
                            // if no top cap, reuse former normals
                            ringNormal.x = normals[normals.length - (tessellation + 1) * 3];
                            ringNormal.y = normals[normals.length - (tessellation + 1) * 3 + 1];
                            ringNormal.z = normals[normals.length - (tessellation + 1) * 3 + 2];
                        }
                        else {
                            ringNormal.x = ringVertex.x;
                            ringNormal.z = ringVertex.z;
                            ringNormal.y = Math.sqrt(ringNormal.x * ringNormal.x + ringNormal.z * ringNormal.z) * tan;
                            ringNormal.normalize();
                        }

                        // keep first ring vertex values for enclose
                        if (j === 0) {
                            ringFirstVertex.copyFrom(ringVertex);
                            ringFirstNormal.copyFrom(ringNormal);
                        }

                        positions.push(ringVertex.x, ringVertex.y, ringVertex.z);
                        normals.push(ringNormal.x, ringNormal.y, ringNormal.z);
                        if (hasRings) {
                            v = (cs !== s) ? faceUV[s].y : faceUV[s].w;
                        } else {
                            v = faceUV[s].y + (faceUV[s].w - faceUV[s].y) * h;
                        }
                        uvs.push(faceUV[s].x + (faceUV[s].z - faceUV[s].x) * j / tessellation, v);
                        if (faceColors) {
                            colors.push(faceColors[s].r, faceColors[s].g, faceColors[s].b, faceColors[s].a);
                        }
                    }

                    // if enclose, add four vertices and their dedicated normals
                    if (arc !== 1 && enclose) {
                        positions.push(ringVertex.x, ringVertex.y, ringVertex.z);
                        positions.push(0, ringVertex.y, 0);
                        positions.push(0, ringVertex.y, 0);
                        positions.push(ringFirstVertex.x, ringFirstVertex.y, ringFirstVertex.z);
                        Vector3.CrossToRef(Y, ringNormal, quadNormal);
                        quadNormal.normalize();
                        normals.push(quadNormal.x, quadNormal.y, quadNormal.z, quadNormal.x, quadNormal.y, quadNormal.z);
                        Vector3.CrossToRef(ringFirstNormal, Y, quadNormal);
                        quadNormal.normalize();
                        normals.push(quadNormal.x, quadNormal.y, quadNormal.z, quadNormal.x, quadNormal.y, quadNormal.z);
                        if (hasRings) {
                            v = (cs !== s) ? faceUV[s + 1].y : faceUV[s + 1].w;
                        } else {
                            v = faceUV[s + 1].y + (faceUV[s + 1].w - faceUV[s + 1].y) * h;
                        }
                        uvs.push(faceUV[s + 1].x, v);
                        uvs.push(faceUV[s + 1].z, v);
                        if (hasRings) {
                            v = (cs !== s) ? faceUV[s + 2].y : faceUV[s + 2].w;
                        } else {
                            v = faceUV[s + 2].y + (faceUV[s + 2].w - faceUV[s + 2].y) * h;
                        }
                        uvs.push(faceUV[s + 2].x, v);
                        uvs.push(faceUV[s + 2].z, v);
                        if (faceColors) {
                            colors.push(faceColors[s + 1].r, faceColors[s + 1].g, faceColors[s + 1].b, faceColors[s + 1].a);
                            colors.push(faceColors[s + 1].r, faceColors[s + 1].g, faceColors[s + 1].b, faceColors[s + 1].a);
                            colors.push(faceColors[s + 2].r, faceColors[s + 2].g, faceColors[s + 2].b, faceColors[s + 2].a);
                            colors.push(faceColors[s + 2].r, faceColors[s + 2].g, faceColors[s + 2].b, faceColors[s + 2].a);
                        }
                    }
                    if (cs !== s) {
                        cs = s;
                    }

                }

            }

            // indices
            var e: number = (arc !== 1 && enclose) ? tessellation + 4 : tessellation;     // correction of number of iteration if enclose
            var s: number;
            i = 0;
            for (s = 0; s < subdivisions; s++) {
                let i0: number = 0;
                let i1: number = 0;
                let i2: number = 0;
                let i3: number = 0;
                for (j = 0; j < tessellation; j++) {
                    i0 = i * (e + 1) + j;
                    i1 = (i + 1) * (e + 1) + j;
                    i2 = i * (e + 1) + (j + 1);
                    i3 = (i + 1) * (e + 1) + (j + 1);
                    indices.push(i0, i1, i2);
                    indices.push(i3, i2, i1);
                }
                if (arc !== 1 && enclose) {      // if enclose, add two quads
                    indices.push(i0 + 2, i1 + 2, i2 + 2);
                    indices.push(i3 + 2, i2 + 2, i1 + 2);
                    indices.push(i0 + 4, i1 + 4, i2 + 4);
                    indices.push(i3 + 4, i2 + 4, i1 + 4);
                }
                i = (hasRings) ? (i + 2) : (i + 1);
            }

            // Caps
            var createCylinderCap = (isTop: boolean) => {
                var radius = isTop ? diameterTop / 2 : diameterBottom / 2;
                if (radius === 0) {
                    return;
                }

                // Cap positions, normals & uvs
                var angle;
                var circleVector;
                var i: number;
                var u: Vector4 = (isTop) ? faceUV[surfaceNb - 1] : faceUV[0];
                var c: Nullable<Color4> = null;
                if (faceColors) {
                    c = (isTop) ? faceColors[surfaceNb - 1] : faceColors[0];
                }
                // cap center
                var vbase = positions.length / 3;
                var offset = isTop ? height / 2 : -height / 2;
                var center = new Vector3(0, offset, 0);
                positions.push(center.x, center.y, center.z);
                normals.push(0, isTop ? 1 : -1, 0);
                uvs.push(u.x + (u.z - u.x) * 0.5, u.y + (u.w - u.y) * 0.5);
                if (c) {
                    colors.push(c.r, c.g, c.b, c.a);
                }

                var textureScale = new Vector2(0.5, 0.5);
                for (i = 0; i <= tessellation; i++) {
                    angle = Math.PI * 2 * i * arc / tessellation;
                    var cos = Math.cos(-angle);
                    var sin = Math.sin(-angle);
                    circleVector = new Vector3(cos * radius, offset, sin * radius);
                    var textureCoordinate = new Vector2(cos * textureScale.x + 0.5, sin * textureScale.y + 0.5);
                    positions.push(circleVector.x, circleVector.y, circleVector.z);
                    normals.push(0, isTop ? 1 : -1, 0);
                    uvs.push(u.x + (u.z - u.x) * textureCoordinate.x, u.y + (u.w - u.y) * textureCoordinate.y);
                    if (c) {
                        colors.push(c.r, c.g, c.b, c.a);
                    }
                }
                // Cap indices
                for (i = 0; i < tessellation; i++) {
                    if (!isTop) {
                        indices.push(vbase);
                        indices.push(vbase + (i + 1));
                        indices.push(vbase + (i + 2));
                    }
                    else {
                        indices.push(vbase);
                        indices.push(vbase + (i + 2));
                        indices.push(vbase + (i + 1));
                    }
                }
            };

            // add caps to geometry
            createCylinderCap(false);
            createCylinderCap(true);

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            if (faceColors) {
                vertexData.colors = colors;
            }

            return vertexData;
        }

        /**
         * Creates the VertexData for a torus
         * @param options an object used to set the following optional parameters for the box, required but can be empty
          * * diameter the diameter of the torus, optional default 1
          * * thickness the diameter of the tube forming the torus, optional default 0.5
          * * tessellation the number of prism sides, 3 for a triangular prism, optional, default 24
          * * sideOrientation optional and takes the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
          * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
          * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
         * @returns the VertexData of the torus
         */
        public static CreateTorus(options: { diameter?: number, thickness?: number, tessellation?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];

            var diameter = options.diameter || 1;
            var thickness = options.thickness || 0.5;
            var tessellation = options.tessellation || 16;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;

            var stride = tessellation + 1;

            for (var i = 0; i <= tessellation; i++) {
                var u = i / tessellation;

                var outerAngle = i * Math.PI * 2.0 / tessellation - Math.PI / 2.0;

                var transform = Matrix.Translation(diameter / 2.0, 0, 0).multiply(Matrix.RotationY(outerAngle));

                for (var j = 0; j <= tessellation; j++) {
                    var v = 1 - j / tessellation;

                    var innerAngle = j * Math.PI * 2.0 / tessellation + Math.PI;
                    var dx = Math.cos(innerAngle);
                    var dy = Math.sin(innerAngle);

                    // Create a vertex.
                    var normal = new Vector3(dx, dy, 0);
                    var position = normal.scale(thickness / 2);
                    var textureCoordinate = new Vector2(u, v);

                    position = Vector3.TransformCoordinates(position, transform);
                    normal = Vector3.TransformNormal(normal, transform);

                    positions.push(position.x, position.y, position.z);
                    normals.push(normal.x, normal.y, normal.z);
                    uvs.push(textureCoordinate.x, textureCoordinate.y);

                    // And create indices for two triangles.
                    var nextI = (i + 1) % stride;
                    var nextJ = (j + 1) % stride;

                    indices.push(i * stride + j);
                    indices.push(i * stride + nextJ);
                    indices.push(nextI * stride + j);

                    indices.push(i * stride + nextJ);
                    indices.push(nextI * stride + nextJ);
                    indices.push(nextI * stride + j);
                }
            }

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        /**
         * Creates the VertexData of the LineSystem
         * @param options an object used to set the following optional parameters for the LineSystem, required but can be empty
         *  - lines an array of lines, each line being an array of successive Vector3
         *  - colors an array of line colors, each of the line colors being an array of successive Color4, one per line point
         * @returns the VertexData of the LineSystem
         */
        public static CreateLineSystem(options: { lines: Vector3[][], colors?: Nullable<Color4[][]> }): VertexData {
            var indices = [];
            var positions = [];
            var lines = options.lines;
            var colors = options.colors;
            var vertexColors = [];
            var idx = 0;

            for (var l = 0; l < lines.length; l++) {
                var points = lines[l];
                for (var index = 0; index < points.length; index++) {
                    positions.push(points[index].x, points[index].y, points[index].z);
                    if (colors) {
                        var color = colors[l];
                        vertexColors.push(color[index].r, color[index].g, color[index].b, color[index].a);
                    }
                    if (index > 0) {
                        indices.push(idx - 1);
                        indices.push(idx);
                    }
                    idx++;
                }
            }
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            if (colors) {
                vertexData.colors = vertexColors;
            }
            return vertexData;
        }

        /**
         * Create the VertexData for a DashedLines
         * @param options an object used to set the following optional parameters for the DashedLines, required but can be empty
         *  - points an array successive Vector3
         *  - dashSize the size of the dashes relative to the dash number, optional, default 3
         *  - gapSize the size of the gap between two successive dashes relative to the dash number, optional, default 1
         *  - dashNb the intended total number of dashes, optional, default 200
         * @returns the VertexData for the DashedLines
         */
        public static CreateDashedLines(options: { points: Vector3[], dashSize?: number, gapSize?: number, dashNb?: number }): VertexData {
            var dashSize = options.dashSize || 3;
            var gapSize = options.gapSize || 1;
            var dashNb = options.dashNb || 200;
            var points = options.points;

            var positions = new Array<number>();
            var indices = new Array<number>();

            var curvect = Vector3.Zero();
            var lg = 0;
            var nb = 0;
            var shft = 0;
            var dashshft = 0;
            var curshft = 0;
            var idx = 0;
            var i = 0;
            for (i = 0; i < points.length - 1; i++) {
                points[i + 1].subtractToRef(points[i], curvect);
                lg += curvect.length();
            }
            shft = lg / dashNb;
            dashshft = dashSize * shft / (dashSize + gapSize);
            for (i = 0; i < points.length - 1; i++) {
                points[i + 1].subtractToRef(points[i], curvect);
                nb = Math.floor(curvect.length() / shft);
                curvect.normalize();
                for (var j = 0; j < nb; j++) {
                    curshft = shft * j;
                    positions.push(points[i].x + curshft * curvect.x, points[i].y + curshft * curvect.y, points[i].z + curshft * curvect.z);
                    positions.push(points[i].x + (curshft + dashshft) * curvect.x, points[i].y + (curshft + dashshft) * curvect.y, points[i].z + (curshft + dashshft) * curvect.z);
                    indices.push(idx, idx + 1);
                    idx += 2;
                }
            }

            // Result
            var vertexData = new VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;

            return vertexData;
        }

        /**
         * Creates the VertexData for a Ground
         * @param options an object used to set the following optional parameters for the Ground, required but can be empty
         *  - width the width (x direction) of the ground, optional, default 1
         *  - height the height (z direction) of the ground, optional, default 1
         *  - subdivisions the number of subdivisions per side, optional, default 1
         * @returns the VertexData of the Ground
         */
        public static CreateGround(options: { width?: number, height?: number, subdivisions?: number, subdivisionsX?: number, subdivisionsY?: number }): VertexData {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row: number, col: number;

            var width: number = options.width || 1;
            var height: number = options.height || 1;
            var subdivisionsX: number = options.subdivisionsX || options.subdivisions || 1;
            var subdivisionsY: number = options.subdivisionsY || options.subdivisions || 1;

            for (row = 0; row <= subdivisionsY; row++) {
                for (col = 0; col <= subdivisionsX; col++) {
                    var position = new Vector3((col * width) / subdivisionsX - (width / 2.0), 0, ((subdivisionsY - row) * height) / subdivisionsY - (height / 2.0));
                    var normal = new Vector3(0, 1.0, 0);

                    positions.push(position.x, position.y, position.z);
                    normals.push(normal.x, normal.y, normal.z);
                    uvs.push(col / subdivisionsX, 1.0 - row / subdivisionsY);
                }
            }

            for (row = 0; row < subdivisionsY; row++) {
                for (col = 0; col < subdivisionsX; col++) {
                    indices.push(col + 1 + (row + 1) * (subdivisionsX + 1));
                    indices.push(col + 1 + row * (subdivisionsX + 1));
                    indices.push(col + row * (subdivisionsX + 1));

                    indices.push(col + (row + 1) * (subdivisionsX + 1));
                    indices.push(col + 1 + (row + 1) * (subdivisionsX + 1));
                    indices.push(col + row * (subdivisionsX + 1));
                }
            }

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        /**
         * Creates the VertexData for a TiledGround by subdividing the ground into tiles
         * @param options an object used to set the following optional parameters for the Ground, required but can be empty
          * * xmin the ground minimum X coordinate, optional, default -1
          * * zmin the ground minimum Z coordinate, optional, default -1
          * * xmax the ground maximum X coordinate, optional, default 1
          * * zmax the ground maximum Z coordinate, optional, default 1
          * * subdivisions a javascript object {w: positive integer, h: positive integer}, `w` and `h` are the numbers of subdivisions on the ground width and height creating 'tiles', default {w: 6, h: 6}
          * * precision a javascript object {w: positive integer, h: positive integer}, `w` and `h` are the numbers of subdivisions on the tile width and height, default {w: 2, h: 2}
         * @returns the VertexData of the TiledGround
         */
        public static CreateTiledGround(options: { xmin: number, zmin: number, xmax: number, zmax: number, subdivisions?: { w: number; h: number; }, precision?: { w: number; h: number; } }): VertexData {
            var xmin = (options.xmin !== undefined && options.xmin !== null) ? options.xmin : -1.0;
            var zmin = (options.zmin !== undefined && options.zmin !== null) ? options.zmin : -1.0;
            var xmax = (options.xmax !== undefined && options.xmax !== null) ? options.xmax : 1.0;
            var zmax = (options.zmax !== undefined && options.zmax !== null) ? options.zmax : 1.0;
            var subdivisions = options.subdivisions || { w: 1, h: 1 };
            var precision = options.precision || { w: 1, h: 1 };

            var indices = new Array<number>();
            var positions = new Array<number>();
            var normals = new Array<number>();
            var uvs = new Array<number>();
            var row: number, col: number, tileRow: number, tileCol: number;

            subdivisions.h = (subdivisions.h < 1) ? 1 : subdivisions.h;
            subdivisions.w = (subdivisions.w < 1) ? 1 : subdivisions.w;
            precision.w = (precision.w < 1) ? 1 : precision.w;
            precision.h = (precision.h < 1) ? 1 : precision.h;

            var tileSize = {
                'w': (xmax - xmin) / subdivisions.w,
                'h': (zmax - zmin) / subdivisions.h
            };

            function applyTile(xTileMin: number, zTileMin: number, xTileMax: number, zTileMax: number) {
                // Indices
                var base = positions.length / 3;
                var rowLength = precision.w + 1;
                for (row = 0; row < precision.h; row++) {
                    for (col = 0; col < precision.w; col++) {
                        var square = [
                            base + col + row * rowLength,
                            base + (col + 1) + row * rowLength,
                            base + (col + 1) + (row + 1) * rowLength,
                            base + col + (row + 1) * rowLength
                        ];

                        indices.push(square[1]);
                        indices.push(square[2]);
                        indices.push(square[3]);
                        indices.push(square[0]);
                        indices.push(square[1]);
                        indices.push(square[3]);
                    }
                }

                // Position, normals and uvs
                var position = Vector3.Zero();
                var normal = new Vector3(0, 1.0, 0);
                for (row = 0; row <= precision.h; row++) {
                    position.z = (row * (zTileMax - zTileMin)) / precision.h + zTileMin;
                    for (col = 0; col <= precision.w; col++) {
                        position.x = (col * (xTileMax - xTileMin)) / precision.w + xTileMin;
                        position.y = 0;

                        positions.push(position.x, position.y, position.z);
                        normals.push(normal.x, normal.y, normal.z);
                        uvs.push(col / precision.w, row / precision.h);
                    }
                }
            }

            for (tileRow = 0; tileRow < subdivisions.h; tileRow++) {
                for (tileCol = 0; tileCol < subdivisions.w; tileCol++) {
                    applyTile(
                        xmin + tileCol * tileSize.w,
                        zmin + tileRow * tileSize.h,
                        xmin + (tileCol + 1) * tileSize.w,
                        zmin + (tileRow + 1) * tileSize.h
                    );
                }
            }

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        /**
         * Creates the VertexData of the Ground designed from a heightmap
         * @param options an object used to set the following parameters for the Ground, required and provided by MeshBuilder.CreateGroundFromHeightMap
          * * width the width (x direction) of the ground
          * * height the height (z direction) of the ground
          * * subdivisions the number of subdivisions per side
          * * minHeight the minimum altitude on the ground, optional, default 0
          * * maxHeight the maximum altitude on the ground, optional default 1
          * * colorFilter the filter to apply to the image pixel colors to compute the height, optional Color3, default (0.3, 0.59, 0.11)
          * * buffer the array holding the image color data
          * * bufferWidth the width of image
          * * bufferHeight the height of image
          * * alphaFilter Remove any data where the alpha channel is below this value, defaults 0 (all data visible)
         * @returns the VertexData of the Ground designed from a heightmap
         */
        public static CreateGroundFromHeightMap(options: { width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, colorFilter: Color3, buffer: Uint8Array, bufferWidth: number, bufferHeight: number, alphaFilter: number }): VertexData {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;
            var filter = options.colorFilter || new Color3(0.3, 0.59, 0.11);
            var alphaFilter = options.alphaFilter || 0.0;

            // Vertices
            for (row = 0; row <= options.subdivisions; row++) {
                for (col = 0; col <= options.subdivisions; col++) {
                    var position = new Vector3((col * options.width) / options.subdivisions - (options.width / 2.0), 0, ((options.subdivisions - row) * options.height) / options.subdivisions - (options.height / 2.0));

                    // Compute height
                    var heightMapX = (((position.x + options.width / 2) / options.width) * (options.bufferWidth - 1)) | 0;
                    var heightMapY = ((1.0 - (position.z + options.height / 2) / options.height) * (options.bufferHeight - 1)) | 0;

                    var pos = (heightMapX + heightMapY * options.bufferWidth) * 4;
                    var r = options.buffer[pos] / 255.0;
                    var g = options.buffer[pos + 1] / 255.0;
                    var b = options.buffer[pos + 2] / 255.0;
                    var a = options.buffer[pos + 3] / 255.0;

                    var gradient = r * filter.r + g * filter.g + b * filter.b;

                    // If our alpha channel is not within our filter then we will assign a 'special' height
                    // Then when building the indices, we will ignore any vertex that is using the special height
                    if (a >= alphaFilter) {
                        position.y = options.minHeight + (options.maxHeight - options.minHeight) * gradient;
                    }
                    else {
                        position.y = options.minHeight - BABYLON.Epsilon; // We can't have a height below minHeight, normally.
                    }

                    // Add  vertex
                    positions.push(position.x, position.y, position.z);
                    normals.push(0, 0, 0);
                    uvs.push(col / options.subdivisions, 1.0 - row / options.subdivisions);
                }
            }

            // Indices
            for (row = 0; row < options.subdivisions; row++) {
                for (col = 0; col < options.subdivisions; col++) {
                    // Calculate Indices
                    var idx1 = (col + 1 + (row + 1) * (options.subdivisions + 1));
                    var idx2 = (col + 1 + row * (options.subdivisions + 1));
                    var idx3 = (col + row * (options.subdivisions + 1));
                    var idx4 = (col + (row + 1) * (options.subdivisions + 1));

                    // Check that all indices are visible (based on our special height)
                    // Only display the vertex if all Indices are visible
                    // Positions are stored x,y,z for each vertex, hence the * 3 and + 1 for height
                    var isVisibleIdx1 = positions[idx1 * 3 + 1] >= options.minHeight;
                    var isVisibleIdx2 = positions[idx2 * 3 + 1] >= options.minHeight;
                    var isVisibleIdx3 = positions[idx3 * 3 + 1] >= options.minHeight;
                    if (isVisibleIdx1 && isVisibleIdx2 && isVisibleIdx3) {
                        indices.push(idx1);
                        indices.push(idx2);
                        indices.push(idx3);
                    }

                    var isVisibleIdx4 = positions[idx4 * 3 + 1] >= options.minHeight;
                    if (isVisibleIdx4 && isVisibleIdx1 && isVisibleIdx3) {
                        indices.push(idx4);
                        indices.push(idx1);
                        indices.push(idx3);
                    }
                }
            }

            // Normals
            VertexData.ComputeNormals(positions, indices, normals);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        /**
         * Creates the VertexData for a Plane
         * @param options an object used to set the following optional parameters for the plane, required but can be empty
          * * size sets the width and height of the plane to the value of size, optional default 1
          * * width sets the width (x direction) of the plane, overwrites the width set by size, optional, default size
          * * height sets the height (y direction) of the plane, overwrites the height set by size, optional, default size
          * * sideOrientation optional and takes the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
          * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
          * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
         * @returns the VertexData of the box
         */
        public static CreatePlane(options: { size?: number, width?: number, height?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];

            var width: number = options.width || options.size || 1;
            var height: number = options.height || options.size || 1;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;

            // Vertices
            var halfWidth = width / 2.0;
            var halfHeight = height / 2.0;

            positions.push(-halfWidth, -halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(0.0, 0.0);

            positions.push(halfWidth, -halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(1.0, 0.0);

            positions.push(halfWidth, halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(1.0, 1.0);

            positions.push(-halfWidth, halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(0.0, 1.0);

            // Indices
            indices.push(0);
            indices.push(1);
            indices.push(2);

            indices.push(0);
            indices.push(2);
            indices.push(3);

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        /**
         * Creates the VertexData of the Disc or regular Polygon
         * @param options an object used to set the following optional parameters for the disc, required but can be empty
          * * radius the radius of the disc, optional default 0.5
          * * tessellation the number of polygon sides, optional, default 64
          * * arc a number from 0 to 1, to create an unclosed polygon based on the fraction of the circumference given by the arc value, optional, default 1
          * * sideOrientation optional and takes the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
          * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
          * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
         * @returns the VertexData of the box
         */
        public static CreateDisc(options: { radius?: number, tessellation?: number, arc?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
            var positions = new Array<number>();
            var indices = new Array<number>();
            var normals = new Array<number>();
            var uvs = new Array<number>();

            var radius = options.radius || 0.5;
            var tessellation = options.tessellation || 64;
            var arc: number = options.arc && (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;

            // positions and uvs
            positions.push(0, 0, 0);    // disc center first
            uvs.push(0.5, 0.5);

            var theta = Math.PI * 2 * arc;
            var step = theta / tessellation;
            for (var a = 0; a < theta; a += step) {
                var x = Math.cos(a);
                var y = Math.sin(a);
                var u = (x + 1) / 2;
                var v = (1 - y) / 2;
                positions.push(radius * x, radius * y, 0);
                uvs.push(u, v);
            }
            if (arc === 1) {
                positions.push(positions[3], positions[4], positions[5]); // close the circle
                uvs.push(uvs[2], uvs[3]);
            }

            //indices
            var vertexNb = positions.length / 3;
            for (var i = 1; i < vertexNb - 1; i++) {
                indices.push(i + 1, 0, i);
            }

            // result
            VertexData.ComputeNormals(positions, indices, normals);
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        /**
         * Creates the VertexData for an irregular Polygon in the XoZ plane using a mesh built by polygonTriangulation.build()
         * All parameters are provided by MeshBuilder.CreatePolygon as needed
         * @param polygon a mesh built from polygonTriangulation.build()
         * @param sideOrientation takes the values BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * @param fUV an array of Vector4 elements used to set different images to the top, rings and bottom respectively
         * @param fColors an array of Color3 elements used to set different colors to the top, rings and bottom respectively
         * @param frontUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
         * @param backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
         * @returns the VertexData of the Polygon
         */
        public static CreatePolygon(polygon: Mesh, sideOrientation: number, fUV?: Vector4[], fColors?: Color4[], frontUVs?: Vector4, backUVs?: Vector4) {
            var faceUV: Vector4[] = fUV || new Array<Vector4>(3);
            var faceColors = fColors;
            var colors = [];

            // default face colors and UV if undefined
            for (var f = 0; f < 3; f++) {
                if (faceUV[f] === undefined) {
                    faceUV[f] = new Vector4(0, 0, 1, 1);
                }
                if (faceColors && faceColors[f] === undefined) {
                    faceColors[f] = new Color4(1, 1, 1, 1);
                }
            }

            var positions = <FloatArray>polygon.getVerticesData(VertexBuffer.PositionKind);
            var normals = <FloatArray>polygon.getVerticesData(VertexBuffer.NormalKind);
            var uvs = <FloatArray>polygon.getVerticesData(VertexBuffer.UVKind);
            var indices = <IndicesArray>polygon.getIndices();

            // set face colours and textures
            var idx: number = 0;
            var face: number = 0;
            for (var index = 0; index < normals.length; index += 3) {
                //Edge Face  no. 1
                if (Math.abs(normals[index + 1]) < 0.001) {
                    face = 1;
                }
                //Top Face  no. 0
                if (Math.abs(normals[index + 1] - 1) < 0.001) {
                    face = 0;
                }
                //Bottom Face  no. 2
                if (Math.abs(normals[index + 1] + 1) < 0.001) {
                    face = 2;
                }
                idx = index / 3;
                uvs[2 * idx] = (1 - uvs[2 * idx]) * faceUV[face].x + uvs[2 * idx] * faceUV[face].z;
                uvs[2 * idx + 1] = (1 - uvs[2 * idx + 1]) * faceUV[face].y + uvs[2 * idx + 1] * faceUV[face].w;
                if (faceColors) {
                    colors.push(faceColors[face].r, faceColors[face].g, faceColors[face].b, faceColors[face].a);
                }
            }

            // sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, frontUVs, backUVs);

            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            if (faceColors) {
                var totalColors = (sideOrientation === Mesh.DOUBLESIDE) ? colors.concat(colors) : colors;
                vertexData.colors = totalColors;
            }

            return vertexData;

        }

        /**
         * Creates the VertexData of the IcoSphere
         * @param options an object used to set the following optional parameters for the IcoSphere, required but can be empty
          * * radius the radius of the IcoSphere, optional default 1
          * * radiusX allows stretching in the x direction, optional, default radius
          * * radiusY allows stretching in the y direction, optional, default radius
          * * radiusZ allows stretching in the z direction, optional, default radius
          * * flat when true creates a flat shaded mesh, optional, default true
          * * subdivisions increasing the subdivisions increases the number of faces, optional, default 4
          * * sideOrientation optional and takes the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
          * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
          * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
         * @returns the VertexData of the IcoSphere
         */
        public static CreateIcoSphere(options: { radius?: number, radiusX?: number, radiusY?: number, radiusZ?: number, flat?: boolean, subdivisions?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
            var sideOrientation = options.sideOrientation || Mesh.DEFAULTSIDE;
            var radius = options.radius || 1;
            var flat = (options.flat === undefined) ? true : options.flat;
            var subdivisions = options.subdivisions || 4;
            var radiusX = options.radiusX || radius;
            var radiusY = options.radiusY || radius;
            var radiusZ = options.radiusZ || radius;

            var t = (1 + Math.sqrt(5)) / 2;

            // 12 vertex x,y,z
            var ico_vertices = [
                -1, t, -0, 1, t, 0, -1, -t, 0, 1, -t, 0, // v0-3
                0, -1, -t, 0, 1, -t, 0, -1, t, 0, 1, t, // v4-7
                t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, -1  // v8-11
            ];

            // index of 3 vertex makes a face of icopshere
            var ico_indices = [
                0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 12, 22, 23,
                1, 5, 20, 5, 11, 4, 23, 22, 13, 22, 18, 6, 7, 1, 8,
                14, 21, 4, 14, 4, 2, 16, 13, 6, 15, 6, 19, 3, 8, 9,
                4, 21, 5, 13, 17, 23, 6, 13, 22, 19, 6, 18, 9, 8, 1
            ];
            // vertex for uv have aliased position, not for UV
            var vertices_unalias_id = [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                // vertex alias
                0,  // 12: 0 + 12
                2,  // 13: 2 + 11
                3,  // 14: 3 + 11
                3,  // 15: 3 + 12
                3,  // 16: 3 + 13
                4,  // 17: 4 + 13
                7,  // 18: 7 + 11
                8,  // 19: 8 + 11
                9,  // 20: 9 + 11
                9,  // 21: 9 + 12
                10, // 22: A + 12
                11 // 23: B + 12
            ];

            // uv as integer step (not pixels !)
            var ico_vertexuv = [
                5, 1, 3, 1, 6, 4, 0, 0,  // v0-3
                5, 3, 4, 2, 2, 2, 4, 0,  // v4-7
                2, 0, 1, 1, 6, 0, 6, 2,  // v8-11
                // vertex alias (for same vertex on different faces)
                0, 4, // 12: 0 + 12
                3, 3, // 13: 2 + 11
                4, 4, // 14: 3 + 11
                3, 1, // 15: 3 + 12
                4, 2, // 16: 3 + 13
                4, 4, // 17: 4 + 13
                0, 2, // 18: 7 + 11
                1, 1, // 19: 8 + 11
                2, 2, // 20: 9 + 11
                3, 3, // 21: 9 + 12
                1, 3, // 22: A + 12
                2, 4  // 23: B + 12
            ];

            // Vertices[0, 1, ...9, A, B] : position on UV plane
            // '+' indicate duplicate position to be fixed (3,9:0,2,3,4,7,8,A,B)
            // First island of uv mapping
            // v = 4h          3+  2
            // v = 3h        9+  4
            // v = 2h      9+  5   B
            // v = 1h    9   1   0
            // v = 0h  3   8   7   A
            //     u = 0 1 2 3 4 5 6  *a

            // Second island of uv mapping
            // v = 4h  0+  B+  4+
            // v = 3h    A+  2+
            // v = 2h  7+  6   3+
            // v = 1h    8+  3+
            // v = 0h
            //     u = 0 1 2 3 4 5 6  *a

            // Face layout on texture UV mapping
            // ============
            // \ 4  /\ 16 /   ======
            //  \  /  \  /   /\ 11 /
            //   \/ 7  \/   /  \  /
            //    =======  / 10 \/
            //   /\ 17 /\  =======
            //  /  \  /  \ \ 15 /\
            // / 8  \/ 12 \ \  /  \
            // ============  \/ 6  \
            // \ 18 /\  ============
            //  \  /  \ \ 5  /\ 0  /
            //   \/ 13 \ \  /  \  /
            //   =======  \/ 1  \/
            //       =============
            //      /\ 19 /\  2 /\
            //     /  \  /  \  /  \
            //    / 14 \/ 9  \/  3 \
            //   ===================

            // uv step is u:1 or 0.5, v:cos(30)=sqrt(3)/2, ratio approx is 84/97
            var ustep = 138 / 1024;
            var vstep = 239 / 1024;
            var uoffset = 60 / 1024;
            var voffset = 26 / 1024;
            // Second island should have margin, not to touch the first island
            // avoid any borderline artefact in pixel rounding
            var island_u_offset = -40 / 1024;
            var island_v_offset = +20 / 1024;
            // face is either island 0 or 1 :
            // second island is for faces : [4, 7, 8, 12, 13, 16, 17, 18]
            var island = [
                0, 0, 0, 0, 1, //  0 - 4
                0, 0, 1, 1, 0, //  5 - 9
                0, 0, 1, 1, 0, //  10 - 14
                0, 1, 1, 1, 0 //  15 - 19
            ];

            var indices = new Array<number>();
            var positions = new Array<number>();
            var normals = new Array<number>();
            var uvs = new Array<number>();

            var current_indice = 0;
            // prepare array of 3 vector (empty) (to be worked in place, shared for each face)
            var face_vertex_pos = new Array(3);
            var face_vertex_uv = new Array(3);
            var v012;
            for (v012 = 0; v012 < 3; v012++) {
                face_vertex_pos[v012] = Vector3.Zero();
                face_vertex_uv[v012] = Vector2.Zero();
            }
            // create all with normals
            for (var face = 0; face < 20; face++) {
                // 3 vertex per face
                for (v012 = 0; v012 < 3; v012++) {
                    // look up vertex 0,1,2 to its index in 0 to 11 (or 23 including alias)
                    var v_id = ico_indices[3 * face + v012];
                    // vertex have 3D position (x,y,z)
                    face_vertex_pos[v012].copyFromFloats(
                        ico_vertices[3 * vertices_unalias_id[v_id]],
                        ico_vertices[3 * vertices_unalias_id[v_id] + 1],
                        ico_vertices[3 * vertices_unalias_id[v_id] + 2]);
                    // Normalize to get normal, then scale to radius
                    face_vertex_pos[v012].normalize().scaleInPlace(radius);

                    // uv Coordinates from vertex ID
                    face_vertex_uv[v012].copyFromFloats(
                        ico_vertexuv[2 * v_id] * ustep + uoffset + island[face] * island_u_offset,
                        ico_vertexuv[2 * v_id + 1] * vstep + voffset + island[face] * island_v_offset);
                }

                // Subdivide the face (interpolate pos, norm, uv)
                // - pos is linear interpolation, then projected to sphere (converge polyhedron to sphere)
                // - norm is linear interpolation of vertex corner normal
                //   (to be checked if better to re-calc from face vertex, or if approximation is OK ??? )
                // - uv is linear interpolation
                //
                // Topology is as below for sub-divide by 2
                // vertex shown as v0,v1,v2
                // interp index is i1 to progress in range [v0,v1[
                // interp index is i2 to progress in range [v0,v2[
                // face index as  (i1,i2)  for /\  : (i1,i2),(i1+1,i2),(i1,i2+1)
                //            and (i1,i2)' for \/  : (i1+1,i2),(i1+1,i2+1),(i1,i2+1)
                //
                //
                //                    i2    v2
                //                    ^    ^
                //                   /    / \
                //                  /    /   \
                //                 /    /     \
                //                /    / (0,1) \
                //               /    #---------\
                //              /    / \ (0,0)'/ \
                //             /    /   \     /   \
                //            /    /     \   /     \
                //           /    / (0,0) \ / (1,0) \
                //          /    #---------#---------\
                //              v0                    v1
                //
                //              --------------------> i1
                //
                // interp of (i1,i2):
                //  along i2 :  x0=lerp(v0,v2, i2/S) <---> x1=lerp(v1,v2, i2/S)
                //  along i1 :  lerp(x0,x1, i1/(S-i2))
                //
                // centroid of triangle is needed to get help normal computation
                //  (c1,c2) are used for centroid location

                var interp_vertex = (i1: number, i2: number, c1: number, c2: number) => {
                    // vertex is interpolated from
                    //   - face_vertex_pos[0..2]
                    //   - face_vertex_uv[0..2]
                    var pos_x0 = Vector3.Lerp(face_vertex_pos[0], face_vertex_pos[2], i2 / subdivisions);
                    var pos_x1 = Vector3.Lerp(face_vertex_pos[1], face_vertex_pos[2], i2 / subdivisions);
                    var pos_interp = (subdivisions === i2) ? face_vertex_pos[2] : Vector3.Lerp(pos_x0, pos_x1, i1 / (subdivisions - i2));
                    pos_interp.normalize();

                    var vertex_normal;
                    if (flat) {
                        // in flat mode, recalculate normal as face centroid normal
                        var centroid_x0 = Vector3.Lerp(face_vertex_pos[0], face_vertex_pos[2], c2 / subdivisions);
                        var centroid_x1 = Vector3.Lerp(face_vertex_pos[1], face_vertex_pos[2], c2 / subdivisions);
                        vertex_normal = Vector3.Lerp(centroid_x0, centroid_x1, c1 / (subdivisions - c2));
                    } else {
                        // in smooth mode, recalculate normal from each single vertex position
                        vertex_normal = new Vector3(pos_interp.x, pos_interp.y, pos_interp.z);
                    }
                    // Vertex normal need correction due to X,Y,Z radius scaling
                    vertex_normal.x /= radiusX;
                    vertex_normal.y /= radiusY;
                    vertex_normal.z /= radiusZ;
                    vertex_normal.normalize();

                    var uv_x0 = Vector2.Lerp(face_vertex_uv[0], face_vertex_uv[2], i2 / subdivisions);
                    var uv_x1 = Vector2.Lerp(face_vertex_uv[1], face_vertex_uv[2], i2 / subdivisions);
                    var uv_interp = (subdivisions === i2) ? face_vertex_uv[2] : Vector2.Lerp(uv_x0, uv_x1, i1 / (subdivisions - i2));
                    positions.push(pos_interp.x * radiusX, pos_interp.y * radiusY, pos_interp.z * radiusZ);
                    normals.push(vertex_normal.x, vertex_normal.y, vertex_normal.z);
                    uvs.push(uv_interp.x, uv_interp.y);
                    // push each vertex has member of a face
                    // Same vertex can bleong to multiple face, it is pushed multiple time (duplicate vertex are present)
                    indices.push(current_indice);
                    current_indice++;
                };

                for (var i2 = 0; i2 < subdivisions; i2++) {
                    for (var i1 = 0; i1 + i2 < subdivisions; i1++) {
                        // face : (i1,i2)  for /\  :
                        // interp for : (i1,i2),(i1+1,i2),(i1,i2+1)
                        interp_vertex(i1, i2, i1 + 1.0 / 3, i2 + 1.0 / 3);
                        interp_vertex(i1 + 1, i2, i1 + 1.0 / 3, i2 + 1.0 / 3);
                        interp_vertex(i1, i2 + 1, i1 + 1.0 / 3, i2 + 1.0 / 3);
                        if (i1 + i2 + 1 < subdivisions) {
                            // face : (i1,i2)' for \/  :
                            // interp for (i1+1,i2),(i1+1,i2+1),(i1,i2+1)
                            interp_vertex(i1 + 1, i2, i1 + 2.0 / 3, i2 + 2.0 / 3);
                            interp_vertex(i1 + 1, i2 + 1, i1 + 2.0 / 3, i2 + 2.0 / 3);
                            interp_vertex(i1, i2 + 1, i1 + 2.0 / 3, i2 + 2.0 / 3);
                        }
                    }
                }
            }

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

            // Result
            var vertexData = new VertexData();
            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            return vertexData;
        }

        // inspired from // http://stemkoski.github.io/Three.js/Polyhedra.html
        /**
         * Creates the VertexData for a Polyhedron
         * @param options an object used to set the following optional parameters for the polyhedron, required but can be empty
         * * type provided types are:
         *  * 0 : Tetrahedron, 1 : Octahedron, 2 : Dodecahedron, 3 : Icosahedron, 4 : Rhombicuboctahedron, 5 : Triangular Prism, 6 : Pentagonal Prism, 7 : Hexagonal Prism, 8 : Square Pyramid (J1)
         *  * 9 : Pentagonal Pyramid (J2), 10 : Triangular Dipyramid (J12), 11 : Pentagonal Dipyramid (J13), 12 : Elongated Square Dipyramid (J15), 13 : Elongated Pentagonal Dipyramid (J16), 14 : Elongated Pentagonal Cupola (J20)
         * * size the size of the IcoSphere, optional default 1
         * * sizeX allows stretching in the x direction, optional, default size
         * * sizeY allows stretching in the y direction, optional, default size
         * * sizeZ allows stretching in the z direction, optional, default size
         * * custom a number that overwrites the type to create from an extended set of polyhedron from https://www.babylonjs-playground.com/#21QRSK#15 with minimised editor
         * * faceUV an array of Vector4 elements used to set different images to the top, rings and bottom respectively
         * * faceColors an array of Color3 elements used to set different colors to the top, rings and bottom respectively
         * * flat when true creates a flat shaded mesh, optional, default true
         * * subdivisions increasing the subdivisions increases the number of faces, optional, default 4
         * * sideOrientation optional and takes the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
         * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
         * @returns the VertexData of the Polyhedron
         */
        public static CreatePolyhedron(options: { type?: number, size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, custom?: any, faceUV?: Vector4[], faceColors?: Color4[], flat?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
            // provided polyhedron types :
            // 0 : Tetrahedron, 1 : Octahedron, 2 : Dodecahedron, 3 : Icosahedron, 4 : Rhombicuboctahedron, 5 : Triangular Prism, 6 : Pentagonal Prism, 7 : Hexagonal Prism, 8 : Square Pyramid (J1)
            // 9 : Pentagonal Pyramid (J2), 10 : Triangular Dipyramid (J12), 11 : Pentagonal Dipyramid (J13), 12 : Elongated Square Dipyramid (J15), 13 : Elongated Pentagonal Dipyramid (J16), 14 : Elongated Pentagonal Cupola (J20)
            var polyhedra: { vertex: number[][], face: number[][] }[] = [];
            polyhedra[0] = { vertex: [[0, 0, 1.732051], [1.632993, 0, -0.5773503], [-0.8164966, 1.414214, -0.5773503], [-0.8164966, -1.414214, -0.5773503]], face: [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]] };
            polyhedra[1] = { vertex: [[0, 0, 1.414214], [1.414214, 0, 0], [0, 1.414214, 0], [-1.414214, 0, 0], [0, -1.414214, 0], [0, 0, -1.414214]], face: [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [1, 4, 5], [1, 5, 2], [2, 5, 3], [3, 5, 4]] };
            polyhedra[2] = {
                vertex: [[0, 0, 1.070466], [0.7136442, 0, 0.7978784], [-0.3568221, 0.618034, 0.7978784], [-0.3568221, -0.618034, 0.7978784], [0.7978784, 0.618034, 0.3568221], [0.7978784, -0.618034, 0.3568221], [-0.9341724, 0.381966, 0.3568221], [0.1362939, 1, 0.3568221], [0.1362939, -1, 0.3568221], [-0.9341724, -0.381966, 0.3568221], [0.9341724, 0.381966, -0.3568221], [0.9341724, -0.381966, -0.3568221], [-0.7978784, 0.618034, -0.3568221], [-0.1362939, 1, -0.3568221], [-0.1362939, -1, -0.3568221], [-0.7978784, -0.618034, -0.3568221], [0.3568221, 0.618034, -0.7978784], [0.3568221, -0.618034, -0.7978784], [-0.7136442, 0, -0.7978784], [0, 0, -1.070466]],
                face: [[0, 1, 4, 7, 2], [0, 2, 6, 9, 3], [0, 3, 8, 5, 1], [1, 5, 11, 10, 4], [2, 7, 13, 12, 6], [3, 9, 15, 14, 8], [4, 10, 16, 13, 7], [5, 8, 14, 17, 11], [6, 12, 18, 15, 9], [10, 11, 17, 19, 16], [12, 13, 16, 19, 18], [14, 15, 18, 19, 17]]
            };
            polyhedra[3] = {
                vertex: [[0, 0, 1.175571], [1.051462, 0, 0.5257311], [0.3249197, 1, 0.5257311], [-0.8506508, 0.618034, 0.5257311], [-0.8506508, -0.618034, 0.5257311], [0.3249197, -1, 0.5257311], [0.8506508, 0.618034, -0.5257311], [0.8506508, -0.618034, -0.5257311], [-0.3249197, 1, -0.5257311], [-1.051462, 0, -0.5257311], [-0.3249197, -1, -0.5257311], [0, 0, -1.175571]],
                face: [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 1], [1, 5, 7], [1, 7, 6], [1, 6, 2], [2, 6, 8], [2, 8, 3], [3, 8, 9], [3, 9, 4], [4, 9, 10], [4, 10, 5], [5, 10, 7], [6, 7, 11], [6, 11, 8], [7, 10, 11], [8, 11, 9], [9, 11, 10]]
            };
            polyhedra[4] = {
                vertex: [[0, 0, 1.070722], [0.7148135, 0, 0.7971752], [-0.104682, 0.7071068, 0.7971752], [-0.6841528, 0.2071068, 0.7971752], [-0.104682, -0.7071068, 0.7971752], [0.6101315, 0.7071068, 0.5236279], [1.04156, 0.2071068, 0.1367736], [0.6101315, -0.7071068, 0.5236279], [-0.3574067, 1, 0.1367736], [-0.7888348, -0.5, 0.5236279], [-0.9368776, 0.5, 0.1367736], [-0.3574067, -1, 0.1367736], [0.3574067, 1, -0.1367736], [0.9368776, -0.5, -0.1367736], [0.7888348, 0.5, -0.5236279], [0.3574067, -1, -0.1367736], [-0.6101315, 0.7071068, -0.5236279], [-1.04156, -0.2071068, -0.1367736], [-0.6101315, -0.7071068, -0.5236279], [0.104682, 0.7071068, -0.7971752], [0.6841528, -0.2071068, -0.7971752], [0.104682, -0.7071068, -0.7971752], [-0.7148135, 0, -0.7971752], [0, 0, -1.070722]],
                face: [[0, 2, 3], [1, 6, 5], [4, 9, 11], [7, 15, 13], [8, 16, 10], [12, 14, 19], [17, 22, 18], [20, 21, 23], [0, 1, 5, 2], [0, 3, 9, 4], [0, 4, 7, 1], [1, 7, 13, 6], [2, 5, 12, 8], [2, 8, 10, 3], [3, 10, 17, 9], [4, 11, 15, 7], [5, 6, 14, 12], [6, 13, 20, 14], [8, 12, 19, 16], [9, 17, 18, 11], [10, 16, 22, 17], [11, 18, 21, 15], [13, 15, 21, 20], [14, 20, 23, 19], [16, 19, 23, 22], [18, 22, 23, 21]]
            };
            polyhedra[5] = { vertex: [[0, 0, 1.322876], [1.309307, 0, 0.1889822], [-0.9819805, 0.8660254, 0.1889822], [0.1636634, -1.299038, 0.1889822], [0.3273268, 0.8660254, -0.9449112], [-0.8183171, -0.4330127, -0.9449112]], face: [[0, 3, 1], [2, 4, 5], [0, 1, 4, 2], [0, 2, 5, 3], [1, 3, 5, 4]] };
            polyhedra[6] = { vertex: [[0, 0, 1.159953], [1.013464, 0, 0.5642542], [-0.3501431, 0.9510565, 0.5642542], [-0.7715208, -0.6571639, 0.5642542], [0.6633206, 0.9510565, -0.03144481], [0.8682979, -0.6571639, -0.3996071], [-1.121664, 0.2938926, -0.03144481], [-0.2348831, -1.063314, -0.3996071], [0.5181548, 0.2938926, -0.9953061], [-0.5850262, -0.112257, -0.9953061]], face: [[0, 1, 4, 2], [0, 2, 6, 3], [1, 5, 8, 4], [3, 6, 9, 7], [5, 7, 9, 8], [0, 3, 7, 5, 1], [2, 4, 8, 9, 6]] };
            polyhedra[7] = { vertex: [[0, 0, 1.118034], [0.8944272, 0, 0.6708204], [-0.2236068, 0.8660254, 0.6708204], [-0.7826238, -0.4330127, 0.6708204], [0.6708204, 0.8660254, 0.2236068], [1.006231, -0.4330127, -0.2236068], [-1.006231, 0.4330127, 0.2236068], [-0.6708204, -0.8660254, -0.2236068], [0.7826238, 0.4330127, -0.6708204], [0.2236068, -0.8660254, -0.6708204], [-0.8944272, 0, -0.6708204], [0, 0, -1.118034]], face: [[0, 1, 4, 2], [0, 2, 6, 3], [1, 5, 8, 4], [3, 6, 10, 7], [5, 9, 11, 8], [7, 10, 11, 9], [0, 3, 7, 9, 5, 1], [2, 4, 8, 11, 10, 6]] };
            polyhedra[8] = { vertex: [[-0.729665, 0.670121, 0.319155], [-0.655235, -0.29213, -0.754096], [-0.093922, -0.607123, 0.537818], [0.702196, 0.595691, 0.485187], [0.776626, -0.36656, -0.588064]], face: [[1, 4, 2], [0, 1, 2], [3, 0, 2], [4, 3, 2], [4, 1, 0, 3]] };
            polyhedra[9] = { vertex: [[-0.868849, -0.100041, 0.61257], [-0.329458, 0.976099, 0.28078], [-0.26629, -0.013796, -0.477654], [-0.13392, -1.034115, 0.229829], [0.738834, 0.707117, -0.307018], [0.859683, -0.535264, -0.338508]], face: [[3, 0, 2], [5, 3, 2], [4, 5, 2], [1, 4, 2], [0, 1, 2], [0, 3, 5, 4, 1]] };
            polyhedra[10] = { vertex: [[-0.610389, 0.243975, 0.531213], [-0.187812, -0.48795, -0.664016], [-0.187812, 0.9759, -0.664016], [0.187812, -0.9759, 0.664016], [0.798201, 0.243975, 0.132803]], face: [[1, 3, 0], [3, 4, 0], [3, 1, 4], [0, 2, 1], [0, 4, 2], [2, 4, 1]] };
            polyhedra[11] = { vertex: [[-1.028778, 0.392027, -0.048786], [-0.640503, -0.646161, 0.621837], [-0.125162, -0.395663, -0.540059], [0.004683, 0.888447, -0.651988], [0.125161, 0.395663, 0.540059], [0.632925, -0.791376, 0.433102], [1.031672, 0.157063, -0.354165]], face: [[3, 2, 0], [2, 1, 0], [2, 5, 1], [0, 4, 3], [0, 1, 4], [4, 1, 5], [2, 3, 6], [3, 4, 6], [5, 2, 6], [4, 5, 6]] };
            polyhedra[12] = { vertex: [[-0.669867, 0.334933, -0.529576], [-0.669867, 0.334933, 0.529577], [-0.4043, 1.212901, 0], [-0.334933, -0.669867, -0.529576], [-0.334933, -0.669867, 0.529577], [0.334933, 0.669867, -0.529576], [0.334933, 0.669867, 0.529577], [0.4043, -1.212901, 0], [0.669867, -0.334933, -0.529576], [0.669867, -0.334933, 0.529577]], face: [[8, 9, 7], [6, 5, 2], [3, 8, 7], [5, 0, 2], [4, 3, 7], [0, 1, 2], [9, 4, 7], [1, 6, 2], [9, 8, 5, 6], [8, 3, 0, 5], [3, 4, 1, 0], [4, 9, 6, 1]] };
            polyhedra[13] = { vertex: [[-0.931836, 0.219976, -0.264632], [-0.636706, 0.318353, 0.692816], [-0.613483, -0.735083, -0.264632], [-0.326545, 0.979634, 0], [-0.318353, -0.636706, 0.692816], [-0.159176, 0.477529, -0.856368], [0.159176, -0.477529, -0.856368], [0.318353, 0.636706, 0.692816], [0.326545, -0.979634, 0], [0.613482, 0.735082, -0.264632], [0.636706, -0.318353, 0.692816], [0.931835, -0.219977, -0.264632]], face: [[11, 10, 8], [7, 9, 3], [6, 11, 8], [9, 5, 3], [2, 6, 8], [5, 0, 3], [4, 2, 8], [0, 1, 3], [10, 4, 8], [1, 7, 3], [10, 11, 9, 7], [11, 6, 5, 9], [6, 2, 0, 5], [2, 4, 1, 0], [4, 10, 7, 1]] };
            polyhedra[14] = {
                vertex: [[-0.93465, 0.300459, -0.271185], [-0.838689, -0.260219, -0.516017], [-0.711319, 0.717591, 0.128359], [-0.710334, -0.156922, 0.080946], [-0.599799, 0.556003, -0.725148], [-0.503838, -0.004675, -0.969981], [-0.487004, 0.26021, 0.48049], [-0.460089, -0.750282, -0.512622], [-0.376468, 0.973135, -0.325605], [-0.331735, -0.646985, 0.084342], [-0.254001, 0.831847, 0.530001], [-0.125239, -0.494738, -0.966586], [0.029622, 0.027949, 0.730817], [0.056536, -0.982543, -0.262295], [0.08085, 1.087391, 0.076037], [0.125583, -0.532729, 0.485984], [0.262625, 0.599586, 0.780328], [0.391387, -0.726999, -0.716259], [0.513854, -0.868287, 0.139347], [0.597475, 0.85513, 0.326364], [0.641224, 0.109523, 0.783723], [0.737185, -0.451155, 0.538891], [0.848705, -0.612742, -0.314616], [0.976075, 0.365067, 0.32976], [1.072036, -0.19561, 0.084927]],
                face: [[15, 18, 21], [12, 20, 16], [6, 10, 2], [3, 0, 1], [9, 7, 13], [2, 8, 4, 0], [0, 4, 5, 1], [1, 5, 11, 7], [7, 11, 17, 13], [13, 17, 22, 18], [18, 22, 24, 21], [21, 24, 23, 20], [20, 23, 19, 16], [16, 19, 14, 10], [10, 14, 8, 2], [15, 9, 13, 18], [12, 15, 21, 20], [6, 12, 16, 10], [3, 6, 2, 0], [9, 3, 1, 7], [9, 15, 12, 6, 3], [22, 17, 11, 5, 4, 8, 14, 19, 23, 24]]
            };

            var type: number = options.type && (options.type < 0 || options.type >= polyhedra.length) ? 0 : options.type || 0;
            var size = options.size;
            var sizeX: number = options.sizeX || size || 1;
            var sizeY: number = options.sizeY || size || 1;
            var sizeZ: number = options.sizeZ || size || 1;
            var data: { vertex: number[][], face: number[][], name?: string, category?: string } = options.custom || polyhedra[type];
            var nbfaces = data.face.length;
            var faceUV = options.faceUV || new Array(nbfaces);
            var faceColors = options.faceColors;
            var flat = (options.flat === undefined) ? true : options.flat;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;

            var positions = new Array<number>();
            var indices = new Array<number>();
            var normals = new Array<number>();
            var uvs = new Array<number>();
            var colors = new Array<number>();
            var index = 0;
            var faceIdx = 0;  // face cursor in the array "indexes"
            var indexes = new Array<number>();
            var i = 0;
            var f = 0;
            var u: number, v: number, ang: number, x: number, y: number, tmp: number;

            // default face colors and UV if undefined
            if (flat) {
                for (f = 0; f < nbfaces; f++) {
                    if (faceColors && faceColors[f] === undefined) {
                        faceColors[f] = new Color4(1, 1, 1, 1);
                    }
                    if (faceUV && faceUV[f] === undefined) {
                        faceUV[f] = new Vector4(0, 0, 1, 1);
                    }
                }
            }

            if (!flat) {

                for (i = 0; i < data.vertex.length; i++) {
                    positions.push(data.vertex[i][0] * sizeX, data.vertex[i][1] * sizeY, data.vertex[i][2] * sizeZ);
                    uvs.push(0, 0);
                }
                for (f = 0; f < nbfaces; f++) {
                    for (i = 0; i < data.face[f].length - 2; i++) {
                        indices.push(data.face[f][0], data.face[f][i + 2], data.face[f][i + 1]);
                    }
                }

            } else {

                for (f = 0; f < nbfaces; f++) {
                    var fl = data.face[f].length;  // number of vertices of the current face
                    ang = 2 * Math.PI / fl;
                    x = 0.5 * Math.tan(ang / 2);
                    y = 0.5;

                    // positions, uvs, colors
                    for (i = 0; i < fl; i++) {
                        // positions
                        positions.push(data.vertex[data.face[f][i]][0] * sizeX, data.vertex[data.face[f][i]][1] * sizeY, data.vertex[data.face[f][i]][2] * sizeZ);
                        indexes.push(index);
                        index++;
                        // uvs
                        u = faceUV[f].x + (faceUV[f].z - faceUV[f].x) * (0.5 + x);
                        v = faceUV[f].y + (faceUV[f].w - faceUV[f].y) * (y - 0.5);
                        uvs.push(u, v);
                        tmp = x * Math.cos(ang) - y * Math.sin(ang);
                        y = x * Math.sin(ang) + y * Math.cos(ang);
                        x = tmp;
                        // colors
                        if (faceColors) {
                            colors.push(faceColors[f].r, faceColors[f].g, faceColors[f].b, faceColors[f].a);
                        }
                    }

                    // indices from indexes
                    for (i = 0; i < fl - 2; i++) {
                        indices.push(indexes[0 + faceIdx], indexes[i + 2 + faceIdx], indexes[i + 1 + faceIdx]);
                    }
                    faceIdx += fl;
                }
            }

            VertexData.ComputeNormals(positions, indices, normals);
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

            var vertexData = new VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            if (faceColors && flat) {
                vertexData.colors = colors;
            }
            return vertexData;
        }

        // based on http://code.google.com/p/away3d/source/browse/trunk/fp10/Away3D/src/away3d/primitives/TorusKnot.as?spec=svn2473&r=2473
        /**
         * Creates the VertexData for a TorusKnot
         * @param options an object used to set the following optional parameters for the TorusKnot, required but can be empty
          * * radius the radius of the torus knot, optional, default 2
          * * tube the thickness of the tube, optional, default 0.5
          * * radialSegments the number of sides on each tube segments, optional, default 32
          * * tubularSegments the number of tubes to decompose the knot into, optional, default 32
          * * p the number of windings around the z axis, optional,  default 2
          * * q the number of windings around the x axis, optional,  default 3
          * * sideOrientation optional and takes the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
          * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
          * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
         * @returns the VertexData of the Torus Knot
         */
        public static CreateTorusKnot(options: { radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number, p?: number, q?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
            var indices = new Array<number>();
            var positions = new Array<number>();
            var normals = new Array<number>();
            var uvs = new Array<number>();

            var radius = options.radius || 2;
            var tube = options.tube || 0.5;
            var radialSegments = options.radialSegments || 32;
            var tubularSegments = options.tubularSegments || 32;
            var p = options.p || 2;
            var q = options.q || 3;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;

            // Helper
            var getPos = (angle: number) => {

                var cu = Math.cos(angle);
                var su = Math.sin(angle);
                var quOverP = q / p * angle;
                var cs = Math.cos(quOverP);

                var tx = radius * (2 + cs) * 0.5 * cu;
                var ty = radius * (2 + cs) * su * 0.5;
                var tz = radius * Math.sin(quOverP) * 0.5;

                return new Vector3(tx, ty, tz);
            };

            // Vertices
            var i: number;
            var j: number;
            for (i = 0; i <= radialSegments; i++) {
                var modI = i % radialSegments;
                var u = modI / radialSegments * 2 * p * Math.PI;
                var p1 = getPos(u);
                var p2 = getPos(u + 0.01);
                var tang = p2.subtract(p1);
                var n = p2.add(p1);

                var bitan = Vector3.Cross(tang, n);
                n = Vector3.Cross(bitan, tang);

                bitan.normalize();
                n.normalize();

                for (j = 0; j < tubularSegments; j++) {
                    var modJ = j % tubularSegments;
                    var v = modJ / tubularSegments * 2 * Math.PI;
                    var cx = -tube * Math.cos(v);
                    var cy = tube * Math.sin(v);

                    positions.push(p1.x + cx * n.x + cy * bitan.x);
                    positions.push(p1.y + cx * n.y + cy * bitan.y);
                    positions.push(p1.z + cx * n.z + cy * bitan.z);

                    uvs.push(i / radialSegments);
                    uvs.push(j / tubularSegments);
                }
            }

            for (i = 0; i < radialSegments; i++) {
                for (j = 0; j < tubularSegments; j++) {
                    var jNext = (j + 1) % tubularSegments;
                    var a = i * tubularSegments + j;
                    var b = (i + 1) * tubularSegments + j;
                    var c = (i + 1) * tubularSegments + jNext;
                    var d = i * tubularSegments + jNext;

                    indices.push(d); indices.push(b); indices.push(a);
                    indices.push(d); indices.push(c); indices.push(b);
                }
            }

            // Normals
            VertexData.ComputeNormals(positions, indices, normals);

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        // Tools

        /**
         * Compute normals for given positions and indices
         * @param positions an array of vertex positions, [...., x, y, z, ......]
         * @param indices an array of indices in groups of three for each triangular facet, [...., i, j, k, ......]
         * @param normals an array of vertex normals, [...., x, y, z, ......]
         * @param options an object used to set the following optional parameters for the TorusKnot, optional
          * * facetNormals : optional array of facet normals (vector3)
          * * facetPositions : optional array of facet positions (vector3)
          * * facetPartitioning : optional partitioning array. facetPositions is required for facetPartitioning computation
          * * ratio : optional partitioning ratio / bounding box, required for facetPartitioning computation
          * * bInfo : optional bounding info, required for facetPartitioning computation
          * * bbSize : optional bounding box size data, required for facetPartitioning computation
          * * subDiv : optional partitioning data about subdivsions on  each axis (int), required for facetPartitioning computation
          * * useRightHandedSystem: optional boolean to for right handed system computation
          * * depthSort : optional boolean to enable the facet depth sort computation
          * * distanceTo : optional Vector3 to compute the facet depth from this location
          * * depthSortedFacets : optional array of depthSortedFacets to store the facet distances from the reference location
         */
        public static ComputeNormals(positions: any, indices: any, normals: any,
            options?: {
                facetNormals?: any, facetPositions?: any, facetPartitioning?: any, ratio?: number, bInfo?: any, bbSize?: Vector3, subDiv?: any,
                useRightHandedSystem?: boolean, depthSort?: boolean, distanceTo?: Vector3, depthSortedFacets?: any
            }): void {

            // temporary scalar variables
            var index = 0;                      // facet index
            var p1p2x = 0.0;                    // p1p2 vector x coordinate
            var p1p2y = 0.0;                    // p1p2 vector y coordinate
            var p1p2z = 0.0;                    // p1p2 vector z coordinate
            var p3p2x = 0.0;                    // p3p2 vector x coordinate
            var p3p2y = 0.0;                    // p3p2 vector y coordinate
            var p3p2z = 0.0;                    // p3p2 vector z coordinate
            var faceNormalx = 0.0;              // facet normal x coordinate
            var faceNormaly = 0.0;              // facet normal y coordinate
            var faceNormalz = 0.0;              // facet normal z coordinate
            var length = 0.0;                   // facet normal length before normalization
            var v1x = 0;                        // vector1 x index in the positions array
            var v1y = 0;                        // vector1 y index in the positions array
            var v1z = 0;                        // vector1 z index in the positions array
            var v2x = 0;                        // vector2 x index in the positions array
            var v2y = 0;                        // vector2 y index in the positions array
            var v2z = 0;                        // vector2 z index in the positions array
            var v3x = 0;                        // vector3 x index in the positions array
            var v3y = 0;                        // vector3 y index in the positions array
            var v3z = 0;                        // vector3 z index in the positions array
            var computeFacetNormals = false;
            var computeFacetPositions = false;
            var computeFacetPartitioning = false;
            var computeDepthSort = false;
            var faceNormalSign = 1;
            let ratio = 0;
            var distanceTo: Nullable<Vector3> = null;
            if (options) {
                computeFacetNormals = (options.facetNormals) ? true : false;
                computeFacetPositions = (options.facetPositions) ? true : false;
                computeFacetPartitioning = (options.facetPartitioning) ? true : false;
                faceNormalSign = (options.useRightHandedSystem === true) ? -1 : 1;
                ratio = options.ratio || 0;
                computeDepthSort = (options.depthSort) ? true : false;
                distanceTo = <Vector3>(options.distanceTo);
                if (computeDepthSort) {
                    if (distanceTo === undefined) {
                        distanceTo = Vector3.Zero();
                    }
                    var depthSortedFacets = options.depthSortedFacets;
                }
            }

            // facetPartitioning reinit if needed
            let xSubRatio = 0;
            let ySubRatio = 0;
            let zSubRatio = 0;
            let subSq = 0;
            if (computeFacetPartitioning && options && options.bbSize) {
                var ox = 0;                 // X partitioning index for facet position
                var oy = 0;                 // Y partinioning index for facet position
                var oz = 0;                 // Z partinioning index for facet position
                var b1x = 0;                // X partitioning index for facet v1 vertex
                var b1y = 0;                // Y partitioning index for facet v1 vertex
                var b1z = 0;                // z partitioning index for facet v1 vertex
                var b2x = 0;                // X partitioning index for facet v2 vertex
                var b2y = 0;                // Y partitioning index for facet v2 vertex
                var b2z = 0;                // Z partitioning index for facet v2 vertex
                var b3x = 0;                // X partitioning index for facet v3 vertex
                var b3y = 0;                // Y partitioning index for facet v3 vertex
                var b3z = 0;                // Z partitioning index for facet v3 vertex
                var block_idx_o = 0;        // facet barycenter block index
                var block_idx_v1 = 0;       // v1 vertex block index
                var block_idx_v2 = 0;       // v2 vertex block index
                var block_idx_v3 = 0;       // v3 vertex block index

                var bbSizeMax = (options.bbSize.x > options.bbSize.y) ? options.bbSize.x : options.bbSize.y;
                bbSizeMax = (bbSizeMax > options.bbSize.z) ? bbSizeMax : options.bbSize.z;
                xSubRatio = options.subDiv.X * ratio / options.bbSize.x;
                ySubRatio = options.subDiv.Y * ratio / options.bbSize.y;
                zSubRatio = options.subDiv.Z * ratio / options.bbSize.z;
                subSq = options.subDiv.max * options.subDiv.max;
                options.facetPartitioning.length = 0;
            }

            // reset the normals
            for (index = 0; index < positions.length; index++) {
                normals[index] = 0.0;
            }

            // Loop : 1 indice triplet = 1 facet
            var nbFaces = (indices.length / 3) | 0;
            for (index = 0; index < nbFaces; index++) {

                // get the indexes of the coordinates of each vertex of the facet
                v1x = indices[index * 3] * 3;
                v1y = v1x + 1;
                v1z = v1x + 2;
                v2x = indices[index * 3 + 1] * 3;
                v2y = v2x + 1;
                v2z = v2x + 2;
                v3x = indices[index * 3 + 2] * 3;
                v3y = v3x + 1;
                v3z = v3x + 2;

                p1p2x = positions[v1x] - positions[v2x];          // compute two vectors per facet : p1p2 and p3p2
                p1p2y = positions[v1y] - positions[v2y];
                p1p2z = positions[v1z] - positions[v2z];

                p3p2x = positions[v3x] - positions[v2x];
                p3p2y = positions[v3y] - positions[v2y];
                p3p2z = positions[v3z] - positions[v2z];

                // compute the face normal with the cross product
                faceNormalx = faceNormalSign * (p1p2y * p3p2z - p1p2z * p3p2y);
                faceNormaly = faceNormalSign * (p1p2z * p3p2x - p1p2x * p3p2z);
                faceNormalz = faceNormalSign * (p1p2x * p3p2y - p1p2y * p3p2x);
                // normalize this normal and store it in the array facetData
                length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
                length = (length === 0) ? 1.0 : length;
                faceNormalx /= length;
                faceNormaly /= length;
                faceNormalz /= length;

                if (computeFacetNormals && options) {
                    options.facetNormals[index].x = faceNormalx;
                    options.facetNormals[index].y = faceNormaly;
                    options.facetNormals[index].z = faceNormalz;
                }

                if (computeFacetPositions && options) {
                    // compute and the facet barycenter coordinates in the array facetPositions
                    options.facetPositions[index].x = (positions[v1x] + positions[v2x] + positions[v3x]) / 3.0;
                    options.facetPositions[index].y = (positions[v1y] + positions[v2y] + positions[v3y]) / 3.0;
                    options.facetPositions[index].z = (positions[v1z] + positions[v2z] + positions[v3z]) / 3.0;
                }

                if (computeFacetPartitioning && options) {
                    // store the facet indexes in arrays in the main facetPartitioning array :
                    // compute each facet vertex (+ facet barycenter) index in the partiniong array
                    ox = Math.floor((options.facetPositions[index].x - options.bInfo.minimum.x * ratio) * xSubRatio);
                    oy = Math.floor((options.facetPositions[index].y - options.bInfo.minimum.y * ratio) * ySubRatio);
                    oz = Math.floor((options.facetPositions[index].z - options.bInfo.minimum.z * ratio) * zSubRatio);
                    b1x = Math.floor((positions[v1x] - options.bInfo.minimum.x * ratio) * xSubRatio);
                    b1y = Math.floor((positions[v1y] - options.bInfo.minimum.y * ratio) * ySubRatio);
                    b1z = Math.floor((positions[v1z] - options.bInfo.minimum.z * ratio) * zSubRatio);
                    b2x = Math.floor((positions[v2x] - options.bInfo.minimum.x * ratio) * xSubRatio);
                    b2y = Math.floor((positions[v2y] - options.bInfo.minimum.y * ratio) * ySubRatio);
                    b2z = Math.floor((positions[v2z] - options.bInfo.minimum.z * ratio) * zSubRatio);
                    b3x = Math.floor((positions[v3x] - options.bInfo.minimum.x * ratio) * xSubRatio);
                    b3y = Math.floor((positions[v3y] - options.bInfo.minimum.y * ratio) * ySubRatio);
                    b3z = Math.floor((positions[v3z] - options.bInfo.minimum.z * ratio) * zSubRatio);

                    block_idx_v1 = b1x + options.subDiv.max * b1y + subSq * b1z;
                    block_idx_v2 = b2x + options.subDiv.max * b2y + subSq * b2z;
                    block_idx_v3 = b3x + options.subDiv.max * b3y + subSq * b3z;
                    block_idx_o = ox + options.subDiv.max * oy + subSq * oz;

                    options.facetPartitioning[block_idx_o] = options.facetPartitioning[block_idx_o] ? options.facetPartitioning[block_idx_o] : new Array();
                    options.facetPartitioning[block_idx_v1] = options.facetPartitioning[block_idx_v1] ? options.facetPartitioning[block_idx_v1] : new Array();
                    options.facetPartitioning[block_idx_v2] = options.facetPartitioning[block_idx_v2] ? options.facetPartitioning[block_idx_v2] : new Array();
                    options.facetPartitioning[block_idx_v3] = options.facetPartitioning[block_idx_v3] ? options.facetPartitioning[block_idx_v3] : new Array();

                    // push each facet index in each block containing the vertex
                    options.facetPartitioning[block_idx_v1].push(index);
                    if (block_idx_v2 != block_idx_v1) {
                        options.facetPartitioning[block_idx_v2].push(index);
                    }
                    if (!(block_idx_v3 == block_idx_v2 || block_idx_v3 == block_idx_v1)) {
                        options.facetPartitioning[block_idx_v3].push(index);
                    }
                    if (!(block_idx_o == block_idx_v1 || block_idx_o == block_idx_v2 || block_idx_o == block_idx_v3)) {
                        options.facetPartitioning[block_idx_o].push(index);
                    }
                }

                if (computeDepthSort && options && options.facetPositions) {
                    var dsf = depthSortedFacets[index];
                    dsf.ind = index * 3;
                    dsf.sqDistance = Vector3.DistanceSquared(options.facetPositions[index], distanceTo!);
                }

                // compute the normals anyway
                normals[v1x] += faceNormalx;                         // accumulate all the normals per face
                normals[v1y] += faceNormaly;
                normals[v1z] += faceNormalz;
                normals[v2x] += faceNormalx;
                normals[v2y] += faceNormaly;
                normals[v2z] += faceNormalz;
                normals[v3x] += faceNormalx;
                normals[v3y] += faceNormaly;
                normals[v3z] += faceNormalz;
            }
            // last normalization of each normal
            for (index = 0; index < normals.length / 3; index++) {
                faceNormalx = normals[index * 3];
                faceNormaly = normals[index * 3 + 1];
                faceNormalz = normals[index * 3 + 2];

                length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
                length = (length === 0) ? 1.0 : length;
                faceNormalx /= length;
                faceNormaly /= length;
                faceNormalz /= length;

                normals[index * 3] = faceNormalx;
                normals[index * 3 + 1] = faceNormaly;
                normals[index * 3 + 2] = faceNormalz;
            }
        }

        private static _ComputeSides(sideOrientation: number, positions: FloatArray, indices: FloatArray, normals: FloatArray, uvs: FloatArray, frontUVs?: Vector4, backUVs?: Vector4) {
            var li: number = indices.length;
            var ln: number = normals.length;
            var i: number;
            var n: number;
            sideOrientation = sideOrientation || Mesh.DEFAULTSIDE;

            switch (sideOrientation) {

                case Mesh.FRONTSIDE:
                    // nothing changed
                    break;

                case Mesh.BACKSIDE:
                    var tmp: number;
                    // indices
                    for (i = 0; i < li; i += 3) {
                        tmp = indices[i];
                        indices[i] = indices[i + 2];
                        indices[i + 2] = tmp;
                    }
                    // normals
                    for (n = 0; n < ln; n++) {
                        normals[n] = -normals[n];
                    }
                    break;

                case Mesh.DOUBLESIDE:
                    // positions
                    var lp: number = positions.length;
                    var l: number = lp / 3;
                    for (var p = 0; p < lp; p++) {
                        positions[lp + p] = positions[p];
                    }
                    // indices
                    for (i = 0; i < li; i += 3) {
                        indices[i + li] = indices[i + 2] + l;
                        indices[i + 1 + li] = indices[i + 1] + l;
                        indices[i + 2 + li] = indices[i] + l;
                    }
                    // normals
                    for (n = 0; n < ln; n++) {
                        normals[ln + n] = -normals[n];
                    }

                    // uvs
                    var lu: number = uvs.length;
                    var u: number = 0;
                    for (u = 0; u < lu; u++) {
                        uvs[u + lu] = uvs[u];
                    }
                    frontUVs = frontUVs ? frontUVs : new Vector4(0.0, 0.0, 1.0, 1.0);
                    backUVs = backUVs ? backUVs : new Vector4(0.0, 0.0, 1.0, 1.0);
                    u = 0;
                    for (i = 0; i < lu / 2; i++) {
                        uvs[u] = frontUVs.x + (frontUVs.z - frontUVs.x) * uvs[u];
                        uvs[u + 1] = frontUVs.y + (frontUVs.w - frontUVs.y) * uvs[u + 1];
                        uvs[u + lu] = backUVs.x + (backUVs.z - backUVs.x) * uvs[u + lu];
                        uvs[u + lu + 1] = backUVs.y + (backUVs.w - backUVs.y) * uvs[u + lu + 1];
                        u += 2;
                    }
                    break;
            }
        }

        /**
         * Applies VertexData created from the imported parameters to the geometry
         * @param parsedVertexData the parsed data from an imported file
         * @param geometry the geometry to apply the VertexData to
         */
        public static ImportVertexData(parsedVertexData: any, geometry: Geometry) {
            var vertexData = new VertexData();

            // positions
            var positions = parsedVertexData.positions;
            if (positions) {
                vertexData.set(positions, VertexBuffer.PositionKind);
            }

            // normals
            var normals = parsedVertexData.normals;
            if (normals) {
                vertexData.set(normals, VertexBuffer.NormalKind);
            }

            // tangents
            var tangents = parsedVertexData.tangents;
            if (tangents) {
                vertexData.set(tangents, VertexBuffer.TangentKind);
            }

            // uvs
            var uvs = parsedVertexData.uvs;
            if (uvs) {
                vertexData.set(uvs, VertexBuffer.UVKind);
            }

            // uv2s
            var uv2s = parsedVertexData.uv2s;
            if (uv2s) {
                vertexData.set(uv2s, VertexBuffer.UV2Kind);
            }

            // uv3s
            var uv3s = parsedVertexData.uv3s;
            if (uv3s) {
                vertexData.set(uv3s, VertexBuffer.UV3Kind);
            }

            // uv4s
            var uv4s = parsedVertexData.uv4s;
            if (uv4s) {
                vertexData.set(uv4s, VertexBuffer.UV4Kind);
            }

            // uv5s
            var uv5s = parsedVertexData.uv5s;
            if (uv5s) {
                vertexData.set(uv5s, VertexBuffer.UV5Kind);
            }

            // uv6s
            var uv6s = parsedVertexData.uv6s;
            if (uv6s) {
                vertexData.set(uv6s, VertexBuffer.UV6Kind);
            }

            // colors
            var colors = parsedVertexData.colors;
            if (colors) {
                vertexData.set(Color4.CheckColors4(colors, positions.length / 3), VertexBuffer.ColorKind);
            }

            // matricesIndices
            var matricesIndices = parsedVertexData.matricesIndices;
            if (matricesIndices) {
                vertexData.set(matricesIndices, VertexBuffer.MatricesIndicesKind);
            }

            // matricesWeights
            var matricesWeights = parsedVertexData.matricesWeights;
            if (matricesWeights) {
                vertexData.set(matricesWeights, VertexBuffer.MatricesWeightsKind);
            }

            // indices
            var indices = parsedVertexData.indices;
            if (indices) {
                vertexData.indices = indices;
            }

            geometry.setAllVerticesData(vertexData, parsedVertexData.updatable);
        }
    }
}