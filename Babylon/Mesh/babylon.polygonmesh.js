var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
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
    })(BABYLON.Vector2);
    var PolygonPoints = (function () {
        function PolygonPoints() {
            this.elements = new Array();
        }
        PolygonPoints.prototype.add = function (originalPoints) {
            var _this = this;
            var result = new Array();
            originalPoints.forEach(function (point) {
                if (result.length === 0 || !(BABYLON.Tools.WithinEpsilon(point.x, result[0].x, 0.00001) && BABYLON.Tools.WithinEpsilon(point.y, result[0].y, 0.00001))) {
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
    })();
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
                result.push(new poly2tri.Point(floats[i], floats[i + 1]));
            }
            return result;
        };
        Polygon.StartingAt = function (x, y) {
            return BABYLON.Path2.StartingAt(x, y);
        };
        return Polygon;
    })();
    BABYLON.Polygon = Polygon;
    var PolygonMeshBuilder = (function () {
        function PolygonMeshBuilder(name, contours, scene) {
            this._points = new PolygonPoints();
            if (!("poly2tri" in window)) {
                throw "PolygonMeshBuilder cannot be used because poly2tri is not referenced";
            }
            this._name = name;
            this._scene = scene;
            var points;
            if (contours instanceof BABYLON.Path2) {
                points = contours.getPoints();
            }
            else {
                points = contours;
            }
            this._swctx = new poly2tri.SweepContext(this._points.add(points));
        }
        PolygonMeshBuilder.prototype.addHole = function (hole) {
            this._swctx.addHole(this._points.add(hole));
            return this;
        };
        PolygonMeshBuilder.prototype.build = function (updatable) {
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
            this._swctx.triangulate();
            this._swctx.getTriangles().forEach(function (triangle) {
                triangle.getPoints().forEach(function (point) {
                    indices.push(point.index);
                });
            });
            result.setVerticesData(positions, BABYLON.VertexBuffer.PositionKind, updatable);
            result.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatable);
            result.setVerticesData(uvs, BABYLON.VertexBuffer.UVKind, updatable);
            result.setIndices(indices);
            return result;
        };
        return PolygonMeshBuilder;
    })();
    BABYLON.PolygonMeshBuilder = PolygonMeshBuilder;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.polygonMesh.js.map