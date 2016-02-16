var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var GroundMesh = (function (_super) {
        __extends(GroundMesh, _super);
        function GroundMesh(name, scene) {
            _super.call(this, name, scene);
            this.generateOctree = false;
            this._worldInverse = new BABYLON.Matrix();
        }
        Object.defineProperty(GroundMesh.prototype, "subdivisions", {
            get: function () {
                return this._subdivisions;
            },
            enumerable: true,
            configurable: true
        });
        GroundMesh.prototype.optimize = function (chunksCount, octreeBlocksSize) {
            if (octreeBlocksSize === void 0) { octreeBlocksSize = 32; }
            this._subdivisions = chunksCount;
            this.subdivide(this._subdivisions);
            this.createOrUpdateSubmeshesOctree(octreeBlocksSize);
        };
        /**
         * Returns a height (y) value in the Worl system :
         * the ground altitude at the coordinates (x, z) expressed in the World system.
         * Returns the ground y position if (x, z) are outside the ground surface.
         * Not pertinent if the ground is rotated.
         */
        GroundMesh.prototype.getHeightAtCoordinates = function (x, z) {
            // express x and y in the ground local system
            x -= this.position.x;
            z -= this.position.z;
            x /= this.scaling.x;
            z /= this.scaling.z;
            if (x < this._minX || x > this._maxX || z < this._minZ || z > this._maxZ) {
                return this.position.y;
            }
            if (!this._heightQuads || this._heightQuads.length == 0) {
                this._computeHeightQuads();
            }
            var facet = this._getFacetAt(x, z);
            var y = -(facet.x * x + facet.z * z + facet.w) / facet.y;
            // return y in the World system
            return y * this.scaling.y + this.position.y;
        };
        /**
         * Returns a normalized vector (Vector3) orthogonal to the ground
         * at the ground coordinates (x, z) expressed in the World system.
         * Returns Vector3(0, 1, 0) if (x, z) are outside the ground surface.
         * Not pertinent if the ground is rotated.
         */
        GroundMesh.prototype.getNormalAtCoordinates = function (x, z) {
            var normal = new BABYLON.Vector3(0, 1, 0);
            this.getNormalAtCoordinatesToRef(x, z, normal);
            return normal;
        };
        /**
         * Updates the Vector3 passed a reference with a normalized vector orthogonal to the ground
         * at the ground coordinates (x, z) expressed in the World system.
         * Doesn't uptade the reference Vector3 if (x, z) are outside the ground surface.
         * Not pertinent if the ground is rotated.
         */
        GroundMesh.prototype.getNormalAtCoordinatesToRef = function (x, z, ref) {
            // express x and y in the ground local system
            x -= this.position.x;
            z -= this.position.z;
            x /= this.scaling.x;
            z /= this.scaling.z;
            if (x < this._minX || x > this._maxX || z < this._minZ || z > this._maxZ) {
                return;
            }
            if (!this._heightQuads || this._heightQuads.length == 0) {
                this._computeHeightQuads();
            }
            var facet = this._getFacetAt(x, z);
            ref.x = facet.x;
            ref.y = facet.y;
            ref.z = facet.z;
        };
        // Returns the element "facet" from the heightQuads array relative to (x, z) local coordinates
        GroundMesh.prototype._getFacetAt = function (x, z) {
            // retrieve col and row from x, z coordinates in the ground local system
            var col = Math.floor((x + this._maxX) * this._subdivisions / this._width);
            var row = Math.floor(-(z + this._maxZ) * this._subdivisions / this._height + this._subdivisions);
            var quad = this._heightQuads[row * this._subdivisions + col];
            var facet;
            if (z < quad.slope.x * x + quad.slope.y) {
                facet = quad.facet1;
            }
            else {
                facet = quad.facet2;
            }
            return facet;
        };
        // Populates the heightMap array with "facet" elements :
        // a quad is two triangular facets separated by a slope, so a "facet" element is 1 slope + 2 facets
        // slope : Vector2(c, h) = 2D diagonal line equation setting appart two triangular facets in a quad : z = cx + h
        // facet1 : Vector4(a, b, c, d) = first facet 3D plane equation : ax + by + cz + d = 0
        // facet2 :  Vector4(a, b, c, d) = second facet 3D plane equation : ax + by + cz + d = 0
        GroundMesh.prototype._computeHeightQuads = function () {
            this._heightQuads = new Array();
            var positions = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var v1 = BABYLON.Vector3.Zero();
            var v2 = BABYLON.Vector3.Zero();
            var v3 = BABYLON.Vector3.Zero();
            var v4 = BABYLON.Vector3.Zero();
            var v1v2 = BABYLON.Vector3.Zero();
            var v1v3 = BABYLON.Vector3.Zero();
            var v1v4 = BABYLON.Vector3.Zero();
            var norm1 = BABYLON.Vector3.Zero();
            var norm2 = BABYLON.Vector3.Zero();
            var i = 0;
            var j = 0;
            var k = 0;
            var cd = 0; // 2D slope coefficient : z = cd * x + h
            var h = 0;
            var d1 = 0; // facet plane equation : ax + by + cz + d = 0
            var d2 = 0;
            for (var row = 0; row < this._subdivisions; row++) {
                for (var col = 0; col < this._subdivisions; col++) {
                    i = col * 3;
                    j = row * (this._subdivisions + 1) * 3;
                    k = (row + 1) * (this._subdivisions + 1) * 3;
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
                    h = v1.z - cd * v1.x; // v1 belongs to the slope
                    var slope = new BABYLON.Vector2(cd, h);
                    // facet equations :
                    // we compute each facet normal vector
                    // the equation of the facet plane is : norm.x * x + norm.y * y + norm.z * z + d = 0
                    // we compute the value d by applying the equation to v1 which belongs to the plane
                    // then we store the facet equation in a Vector4
                    v2.subtractToRef(v1, v1v2);
                    v3.subtractToRef(v1, v1v3);
                    v4.subtractToRef(v1, v1v4);
                    BABYLON.Vector3.CrossToRef(v1v4, v1v3, norm1);
                    BABYLON.Vector3.CrossToRef(v1v2, v1v4, norm2);
                    norm1.normalize();
                    norm2.normalize();
                    d1 = -(norm1.x * v1.x + norm1.y * v1.y + norm1.z * v1.z);
                    d2 = -(norm2.x * v2.x + norm2.y * v2.y + norm2.z * v2.z);
                    var facet1 = new BABYLON.Vector4(norm1.x, norm1.y, norm1.z, d1);
                    var facet2 = new BABYLON.Vector4(norm2.x, norm2.y, norm2.z, d2);
                    var quad = { slope: slope, facet1: facet1, facet2: facet2 };
                    this._heightQuads.push(quad);
                }
            }
        };
        return GroundMesh;
    })(BABYLON.Mesh);
    BABYLON.GroundMesh = GroundMesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.groundMesh.js.map