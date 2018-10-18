module BABYLON {
    /**
     * Mesh representing the gorund
     */
    export class GroundMesh extends Mesh {
        /** If octree should be generated */
        public generateOctree = false;

        private _heightQuads: { slope: Vector2; facet1: Vector4; facet2: Vector4 }[];

        /** @hidden */
        public _subdivisionsX: number;
        /** @hidden */
        public _subdivisionsY: number;
        /** @hidden */
        public _width: number;
        /** @hidden */
        public _height: number;
        /** @hidden */
        public _minX: number;
        /** @hidden */
        public _maxX: number;
        /** @hidden */
        public _minZ: number;
        /** @hidden */
        public _maxZ: number;

        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        /**
         * "GroundMesh"
         * @returns "GroundMesh"
         */
        public getClassName(): string {
            return "GroundMesh";
        }

        /**
         * The minimum of x and y subdivisions
         */
        public get subdivisions(): number {
            return Math.min(this._subdivisionsX, this._subdivisionsY);
        }

        /**
         * X subdivisions
         */
        public get subdivisionsX(): number {
            return this._subdivisionsX;
        }

        /**
         * Y subdivisions
         */
        public get subdivisionsY(): number {
            return this._subdivisionsY;
        }

        /**
         * This function will update an octree to help to select the right submeshes for rendering, picking and collision computations.
         * Please note that you must have a decent number of submeshes to get performance improvements when using an octree
         * @param chunksCount the number of subdivisions for x and y
         * @param octreeBlocksSize (Default: 32)
         */
        public optimize(chunksCount: number, octreeBlocksSize = 32): void {
            this._subdivisionsX = chunksCount;
            this._subdivisionsY = chunksCount;
            this.subdivide(chunksCount);

            // Call the octree system optimization if it is defined.
            const thisAsAny = this as any;
            if (thisAsAny.createOrUpdateSubmeshesOctree) {
                thisAsAny.createOrUpdateSubmeshesOctree(octreeBlocksSize);
            }
        }

        /**
         * Returns a height (y) value in the Worl system :
         * the ground altitude at the coordinates (x, z) expressed in the World system.
         * @param x x coordinate
         * @param z z coordinate
         * @returns the ground y position if (x, z) are outside the ground surface.
         */
        public getHeightAtCoordinates(x: number, z: number): number {
            var world = this.getWorldMatrix();
            var invMat = Tmp.Matrix[5];
            world.invertToRef(invMat);
            var tmpVect = Tmp.Vector3[8];
            Vector3.TransformCoordinatesFromFloatsToRef(x, 0.0, z, invMat, tmpVect); // transform x,z in the mesh local space
            x = tmpVect.x;
            z = tmpVect.z;
            if (x < this._minX || x > this._maxX || z < this._minZ || z > this._maxZ) {
                return this.position.y;
            }
            if (!this._heightQuads || this._heightQuads.length == 0) {
                this._initHeightQuads();
                this._computeHeightQuads();
            }
            var facet = this._getFacetAt(x, z);
            var y = -(facet.x * x + facet.z * z + facet.w) / facet.y;
            // return y in the World system
            Vector3.TransformCoordinatesFromFloatsToRef(0.0, y, 0.0, world, tmpVect);
            return tmpVect.y;
        }

        /**
         * Returns a normalized vector (Vector3) orthogonal to the ground
         * at the ground coordinates (x, z) expressed in the World system.
         * @param x x coordinate
         * @param z z coordinate
         * @returns Vector3(0.0, 1.0, 0.0) if (x, z) are outside the ground surface.
         */
        public getNormalAtCoordinates(x: number, z: number): Vector3 {
            var normal = new Vector3(0.0, 1.0, 0.0);
            this.getNormalAtCoordinatesToRef(x, z, normal);
            return normal;
        }

        /**
         * Updates the Vector3 passed a reference with a normalized vector orthogonal to the ground
         * at the ground coordinates (x, z) expressed in the World system.
         * Doesn't uptade the reference Vector3 if (x, z) are outside the ground surface.
         * @param x x coordinate
         * @param z z coordinate
         * @param ref vector to store the result
         * @returns the GroundMesh.
         */
        public getNormalAtCoordinatesToRef(x: number, z: number, ref: Vector3): GroundMesh {
            var world = this.getWorldMatrix();
            var tmpMat = Tmp.Matrix[5];
            world.invertToRef(tmpMat);
            var tmpVect = Tmp.Vector3[8];
            Vector3.TransformCoordinatesFromFloatsToRef(x, 0.0, z, tmpMat, tmpVect); // transform x,z in the mesh local space
            x = tmpVect.x;
            z = tmpVect.z;
            if (x < this._minX || x > this._maxX || z < this._minZ || z > this._maxZ) {
                return this;
            }
            if (!this._heightQuads || this._heightQuads.length == 0) {
                this._initHeightQuads();
                this._computeHeightQuads();
            }
            var facet = this._getFacetAt(x, z);
            Vector3.TransformNormalFromFloatsToRef(facet.x, facet.y, facet.z, world, ref);
            return this;
        }

        /**
        * Force the heights to be recomputed for getHeightAtCoordinates() or getNormalAtCoordinates()
        * if the ground has been updated.
        * This can be used in the render loop.
        * @returns the GroundMesh.
        */
        public updateCoordinateHeights(): GroundMesh {
            if (!this._heightQuads || this._heightQuads.length == 0) {
                this._initHeightQuads();
            }
            this._computeHeightQuads();
            return this;
        }

        // Returns the element "facet" from the heightQuads array relative to (x, z) local coordinates
        private _getFacetAt(x: number, z: number): Vector4 {
            // retrieve col and row from x, z coordinates in the ground local system
            var col = Math.floor((x + this._maxX) * this._subdivisionsX / this._width);
            var row = Math.floor(-(z + this._maxZ) * this._subdivisionsY / this._height + this._subdivisionsY);
            var quad = this._heightQuads[row * this._subdivisionsX + col];
            var facet;
            if (z < quad.slope.x * x + quad.slope.y) {
                facet = quad.facet1;
            } else {
                facet = quad.facet2;
            }
            return facet;
        }

        //  Creates and populates the heightMap array with "facet" elements :
        // a quad is two triangular facets separated by a slope, so a "facet" element is 1 slope + 2 facets
        // slope : Vector2(c, h) = 2D diagonal line equation setting appart two triangular facets in a quad : z = cx + h
        // facet1 : Vector4(a, b, c, d) = first facet 3D plane equation : ax + by + cz + d = 0
        // facet2 :  Vector4(a, b, c, d) = second facet 3D plane equation : ax + by + cz + d = 0
        // Returns the GroundMesh.
        private _initHeightQuads(): GroundMesh {
            var subdivisionsX = this._subdivisionsX;
            var subdivisionsY = this._subdivisionsY;
            this._heightQuads = new Array();
            for (var row = 0; row < subdivisionsY; row++) {
                for (var col = 0; col < subdivisionsX; col++) {
                    var quad = { slope: Vector2.Zero(), facet1: new Vector4(0.0, 0.0, 0.0, 0.0), facet2: new Vector4(0.0, 0.0, 0.0, 0.0) };
                    this._heightQuads[row * subdivisionsX + col] = quad;
                }
            }
            return this;
        }

        // Compute each quad element values and update the the heightMap array :
        // slope : Vector2(c, h) = 2D diagonal line equation setting appart two triangular facets in a quad : z = cx + h
        // facet1 : Vector4(a, b, c, d) = first facet 3D plane equation : ax + by + cz + d = 0
        // facet2 :  Vector4(a, b, c, d) = second facet 3D plane equation : ax + by + cz + d = 0
        // Returns the GroundMesh.
        private _computeHeightQuads(): GroundMesh {
            var positions = this.getVerticesData(VertexBuffer.PositionKind);

            if (!positions) {
                return this;
            }

            var v1 = Tmp.Vector3[3];
            var v2 = Tmp.Vector3[2];
            var v3 = Tmp.Vector3[1];
            var v4 = Tmp.Vector3[0];
            var v1v2 = Tmp.Vector3[4];
            var v1v3 = Tmp.Vector3[5];
            var v1v4 = Tmp.Vector3[6];
            var norm1 = Tmp.Vector3[7];
            var norm2 = Tmp.Vector3[8];
            var i = 0;
            var j = 0;
            var k = 0;
            var cd = 0;     // 2D slope coefficient : z = cd * x + h
            var h = 0;
            var d1 = 0;     // facet plane equation : ax + by + cz + d = 0
            var d2 = 0;

            var subdivisionsX = this._subdivisionsX;
            var subdivisionsY = this._subdivisionsY;

            for (var row = 0; row < subdivisionsY; row++) {
                for (var col = 0; col < subdivisionsX; col++) {
                    i = col * 3;
                    j = row * (subdivisionsX + 1) * 3;
                    k = (row + 1) * (subdivisionsX + 1) * 3;
                    v1.x = positions[j + i];
                    v1.y = positions[j + i + 1];
                    v1.z = positions[j + i + 2];
                    v2.x = positions[j + i + 3];
                    v2.y = positions[j + i + 4];
                    v2.z = positions[j + i + 5];
                    v3.x = positions[k + i];
                    v3.y = positions[k + i + 1];
                    v3.z = positions[k + i + 2];
                    v4.x = positions[k + i + 3];
                    v4.y = positions[k + i + 4];
                    v4.z = positions[k + i + 5];

                    // 2D slope V1V4
                    cd = (v4.z - v1.z) / (v4.x - v1.x);
                    h = v1.z - cd * v1.x;             // v1 belongs to the slope

                    // facet equations :
                    // we compute each facet normal vector
                    // the equation of the facet plane is : norm.x * x + norm.y * y + norm.z * z + d = 0
                    // we compute the value d by applying the equation to v1 which belongs to the plane
                    // then we store the facet equation in a Vector4
                    v2.subtractToRef(v1, v1v2);
                    v3.subtractToRef(v1, v1v3);
                    v4.subtractToRef(v1, v1v4);
                    Vector3.CrossToRef(v1v4, v1v3, norm1);  // caution : CrossToRef uses the Tmp class
                    Vector3.CrossToRef(v1v2, v1v4, norm2);
                    norm1.normalize();
                    norm2.normalize();
                    d1 = -(norm1.x * v1.x + norm1.y * v1.y + norm1.z * v1.z);
                    d2 = -(norm2.x * v2.x + norm2.y * v2.y + norm2.z * v2.z);

                    var quad = this._heightQuads[row * subdivisionsX + col];
                    quad.slope.copyFromFloats(cd, h);
                    quad.facet1.copyFromFloats(norm1.x, norm1.y, norm1.z, d1);
                    quad.facet2.copyFromFloats(norm2.x, norm2.y, norm2.z, d2);
                }
            }
            return this;
        }

        /**
         * Serializes this ground mesh
         * @param serializationObject object to write serialization to
         */
        public serialize(serializationObject: any): void {
            super.serialize(serializationObject);
            serializationObject.subdivisionsX = this._subdivisionsX;
            serializationObject.subdivisionsY = this._subdivisionsY;

            serializationObject.minX = this._minX;
            serializationObject.maxX = this._maxX;

            serializationObject.minZ = this._minZ;
            serializationObject.maxZ = this._maxZ;

            serializationObject.width = this._width;
            serializationObject.height = this._height;
        }

        /**
         * Parses a serialized ground mesh
         * @param parsedMesh the serialized mesh
         * @param scene the scene to create the ground mesh in
         * @returns the created ground mesh
         */
        public static Parse(parsedMesh: any, scene: Scene): GroundMesh {
            var result = new GroundMesh(parsedMesh.name, scene);

            result._subdivisionsX = parsedMesh.subdivisionsX || 1;
            result._subdivisionsY = parsedMesh.subdivisionsY || 1;

            result._minX = parsedMesh.minX;
            result._maxX = parsedMesh.maxX;

            result._minZ = parsedMesh.minZ;
            result._maxZ = parsedMesh.maxZ;

            result._width = parsedMesh.width;
            result._height = parsedMesh.height;

            return result;
        }
    }
}