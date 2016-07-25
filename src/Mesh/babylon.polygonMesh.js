var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var IndexedVector2 = (function (_super) {
        __extends(IndexedVector2, _super);
        function IndexedVector2(original, index) {
            _super.call(this, original.x, original.y);
            this.index = index;
        }
        return IndexedVector2;
    }(BABYLON.Vector2));
    var PolygonPoints = (function () {
        function PolygonPoints() {
            this.elements = new Array();
        }
        PolygonPoints.prototype.add = function (originalPoints) {
            var _this = this;
            var result = new Array();
            originalPoints.forEach(function (point) {
                if (result.length === 0 || !point.equalsWithEpsilon(result[0])) {
                    var newPoint = new IndexedVector2(point, _this.elements.length);
                    result.push(newPoint);
                    _this.elements.push(newPoint);
                }
            });
            return result;
        };
        PolygonPoints.prototype.computeBounds = function () {
            var lmin = new BABYLON.Vector2(this.elements[0].x, this.elements[0].y);
            var lmax = new BABYLON.Vector2(this.elements[0].x, this.elements[0].y);
            this.elements.forEach(function (point) {
                // x
                if (point.x < lmin.x) {
                    lmin.x = point.x;
                }
                else if (point.x > lmax.x) {
                    lmax.x = point.x;
                }
                // y
                if (point.y < lmin.y) {
                    lmin.y = point.y;
                }
                else if (point.y > lmax.y) {
                    lmax.y = point.y;
                }
            });
            return {
                min: lmin,
                max: lmax,
                width: lmax.x - lmin.x,
                height: lmax.y - lmin.y
            };
        };
        return PolygonPoints;
    }());
    var Polygon = (function () {
        function Polygon() {
        }
        Polygon.Rectangle = function (xmin, ymin, xmax, ymax) {
            return [
                new BABYLON.Vector2(xmin, ymin),
                new BABYLON.Vector2(xmax, ymin),
                new BABYLON.Vector2(xmax, ymax),
                new BABYLON.Vector2(xmin, ymax)
            ];
        };
        Polygon.Circle = function (radius, cx, cy, numberOfSides) {
            if (cx === void 0) { cx = 0; }
            if (cy === void 0) { cy = 0; }
            if (numberOfSides === void 0) { numberOfSides = 32; }
            var result = new Array();
            var angle = 0;
            var increment = (Math.PI * 2) / numberOfSides;
            for (var i = 0; i < numberOfSides; i++) {
                result.push(new BABYLON.Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
                angle -= increment;
            }
            return result;
        };
        Polygon.Parse = function (input) {
            var floats = input.split(/[^-+eE\.\d]+/).map(parseFloat).filter(function (val) { return (!isNaN(val)); });
            var i, result = [];
            for (i = 0; i < (floats.length & 0x7FFFFFFE); i += 2) {
                result.push(new BABYLON.Vector2(floats[i], floats[i + 1]));
            }
            return result;
        };
        Polygon.StartingAt = function (x, y) {
            return BABYLON.Path2.StartingAt(x, y);
        };
        return Polygon;
    }());
    BABYLON.Polygon = Polygon;
    var PolygonMeshBuilder = (function () {
        function PolygonMeshBuilder(name, contours, scene) {
            this._points = new PolygonPoints();
            this._outlinepoints = new PolygonPoints();
            this._holes = [];
            this._epoints = new Array();
            this._eholes = new Array();
            this._name = name;
            this._scene = scene;
            var points;
            if (contours instanceof BABYLON.Path2) {
                points = contours.getPoints();
            }
            else {
                points = contours;
            }
            this._addToepoint(points);
            this._points.add(points);
            this._outlinepoints.add(points);
        }
        PolygonMeshBuilder.prototype._addToepoint = function (points) {
            for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
                var p = points_1[_i];
                this._epoints.push(p.x, p.y);
            }
        };
        PolygonMeshBuilder.prototype.addHole = function (hole) {
            this._points.add(hole);
            var holepoints = new PolygonPoints();
            holepoints.add(hole);
            this._holes.push(holepoints);
            this._eholes.push(this._epoints.length / 2);
            this._addToepoint(hole);
            return this;
        };
        PolygonMeshBuilder.prototype.build = function (updatable, depth) {
            var _this = this;
            if (updatable === void 0) { updatable = false; }
            var result = new BABYLON.Mesh(this._name, this._scene);
            var normals = [];
            var positions = [];
            var uvs = [];
            var bounds = this._points.computeBounds();
            this._points.elements.forEach(function (p) {
                normals.push(0, 1.0, 0);
                positions.push(p.x, 0, p.y);
                uvs.push((p.x - bounds.min.x) / bounds.width, (p.y - bounds.min.y) / bounds.height);
            });
            var indices = [];
            var res = Earcut.earcut(this._epoints, this._eholes, 2);
            for (var i = 0; i < res.length; i++) {
                indices.push(res[i]);
            }
            if (depth > 0) {
                var positionscount = (positions.length / 3); //get the current pointcount
                this._points.elements.forEach(function (p) {
                    normals.push(0, -1.0, 0);
                    positions.push(p.x, -depth, p.y);
                    uvs.push(1 - (p.x - bounds.min.x) / bounds.width, 1 - (p.y - bounds.min.y) / bounds.height);
                });
                var totalCount = indices.length;
                for (var i = 0; i < totalCount; i += 3) {
                    var i0 = indices[i + 0];
                    var i1 = indices[i + 1];
                    var i2 = indices[i + 2];
                    indices.push(i2 + positionscount);
                    indices.push(i1 + positionscount);
                    indices.push(i0 + positionscount);
                }
                //Add the sides
                this.addSide(positions, normals, uvs, indices, bounds, this._outlinepoints, depth, false);
                this._holes.forEach(function (hole) {
                    _this.addSide(positions, normals, uvs, indices, bounds, hole, depth, true);
                });
            }
            result.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions, updatable);
            result.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals, updatable);
            result.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs, updatable);
            result.setIndices(indices);
            return result;
        };
        PolygonMeshBuilder.prototype.addSide = function (positions, normals, uvs, indices, bounds, points, depth, flip) {
            var StartIndex = positions.length / 3;
            var ulength = 0;
            for (var i = 0; i < points.elements.length; i++) {
                var p = points.elements[i];
                var p1;
                if ((i + 1) > points.elements.length - 1) {
                    p1 = points.elements[0];
                }
                else {
                    p1 = points.elements[i + 1];
                }
                positions.push(p.x, 0, p.y);
                positions.push(p.x, -depth, p.y);
                positions.push(p1.x, 0, p1.y);
                positions.push(p1.x, -depth, p1.y);
                var v1 = new BABYLON.Vector3(p.x, 0, p.y);
                var v2 = new BABYLON.Vector3(p1.x, 0, p1.y);
                var v3 = v2.subtract(v1);
                var v4 = new BABYLON.Vector3(0, 1, 0);
                var vn = BABYLON.Vector3.Cross(v3, v4);
                vn = vn.normalize();
                uvs.push(ulength / bounds.width, 0);
                uvs.push(ulength / bounds.width, 1);
                ulength += v3.length();
                uvs.push((ulength / bounds.width), 0);
                uvs.push((ulength / bounds.width), 1);
                if (!flip) {
                    normals.push(-vn.x, -vn.y, -vn.z);
                    normals.push(-vn.x, -vn.y, -vn.z);
                    normals.push(-vn.x, -vn.y, -vn.z);
                    normals.push(-vn.x, -vn.y, -vn.z);
                    indices.push(StartIndex);
                    indices.push(StartIndex + 1);
                    indices.push(StartIndex + 2);
                    indices.push(StartIndex + 1);
                    indices.push(StartIndex + 3);
                    indices.push(StartIndex + 2);
                }
                else {
                    normals.push(vn.x, vn.y, vn.z);
                    normals.push(vn.x, vn.y, vn.z);
                    normals.push(vn.x, vn.y, vn.z);
                    normals.push(vn.x, vn.y, vn.z);
                    indices.push(StartIndex);
                    indices.push(StartIndex + 2);
                    indices.push(StartIndex + 1);
                    indices.push(StartIndex + 1);
                    indices.push(StartIndex + 2);
                    indices.push(StartIndex + 3);
                }
                StartIndex += 4;
            }
            ;
        };
        return PolygonMeshBuilder;
    }());
    BABYLON.PolygonMeshBuilder = PolygonMeshBuilder;
})(BABYLON || (BABYLON = {}));
