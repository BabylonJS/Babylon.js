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
    function nearlyEqual(a, b, epsilon) {
        if (epsilon === void 0) { epsilon = 0.0001; }
        if (a === b) {
            return true;
        }
        return Math.abs(a - b) < epsilon;
    }
    var PolygonPoints = (function () {
        function PolygonPoints() {
            this.elements = new Array();
        }
        PolygonPoints.prototype.add = function (originalPoints) {
            var _this = this;
            var result = new Array();
            originalPoints.forEach(function (point) {
                if (result.length == 0 || !(nearlyEqual(point.x, result[0].x) && nearlyEqual(point.y, result[0].y))) {
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
            return Path.StartingAt(x, y);
        };
        return Polygon;
    })();
    BABYLON.Polygon = Polygon;
    var Arc = (function () {
        function Arc(startPoint, midPoint, endPoint) {
            this.startPoint = startPoint;
            this.midPoint = midPoint;
            this.endPoint = endPoint;
            var temp = Math.pow(midPoint.x, 2) + Math.pow(midPoint.y, 2);
            var startToMid = (Math.pow(startPoint.x, 2) + Math.pow(startPoint.y, 2) - temp) / 2.;
            var midToEnd = (temp - Math.pow(endPoint.x, 2) - Math.pow(endPoint.y, 2)) / 2.;
            var det = (startPoint.x - midPoint.x) * (midPoint.y - endPoint.y) - (midPoint.x - endPoint.x) * (startPoint.y - midPoint.y);
            this.centerPoint = new BABYLON.Vector2((startToMid * (midPoint.y - endPoint.y) - midToEnd * (startPoint.y - midPoint.y)) / det, ((startPoint.x - midPoint.x) * midToEnd - (midPoint.x - endPoint.x) * startToMid) / det);
            this.radius = this.centerPoint.subtract(this.startPoint).length();
            this.startAngle = Angle.BetweenTwoPoints(this.centerPoint, this.startPoint);
            var a1 = this.startAngle.degrees();
            var a2 = Angle.BetweenTwoPoints(this.centerPoint, this.midPoint).degrees();
            var a3 = Angle.BetweenTwoPoints(this.centerPoint, this.endPoint).degrees();
            // angles correction
            if (a2 - a1 > +180.0)
                a2 -= 360.0;
            if (a2 - a1 < -180.0)
                a2 += 360.0;
            if (a3 - a2 > +180.0)
                a3 -= 360.0;
            if (a3 - a2 < -180.0)
                a3 += 360.0;
            this.orientation = (a2 - a1) < 0 ? 0 /* CW */ : 1 /* CCW */;
            this.angle = Angle.FromDegrees(this.orientation === 0 /* CW */ ? a1 - a3 : a3 - a1);
        }
        return Arc;
    })();
    var Orientation;
    (function (Orientation) {
        Orientation[Orientation["CW"] = 0] = "CW";
        Orientation[Orientation["CCW"] = 1] = "CCW";
    })(Orientation || (Orientation = {}));
    var Angle = (function () {
        function Angle(radians) {
            var _this = this;
            this.degrees = function () { return _this._radians * 180 / Math.PI; };
            this.radians = function () { return _this._radians; };
            this._radians = radians;
            if (this._radians < 0)
                this._radians += (2 * Math.PI);
        }
        Angle.BetweenTwoPoints = function (a, b) {
            var delta = b.subtract(a);
            var theta = Math.atan2(delta.y, delta.x);
            return new Angle(theta);
        };
        Angle.FromRadians = function (radians) {
            return new Angle(radians);
        };
        Angle.FromDegrees = function (degrees) {
            return new Angle(degrees * Math.PI / 180);
        };
        return Angle;
    })();
    var Path = (function () {
        function Path(x, y) {
            this._points = [];
            this._points.push(new BABYLON.Vector2(x, y));
        }
        Path.prototype.addLineTo = function (x, y) {
            this._points.push(new BABYLON.Vector2(x, y));
            return this;
        };
        Path.prototype.addArcTo = function (midX, midY, endX, endY, numberOfSegments) {
            if (numberOfSegments === void 0) { numberOfSegments = 36; }
            var startPoint = this._points[this._points.length - 1];
            var midPoint = new BABYLON.Vector2(midX, midY);
            var endPoint = new BABYLON.Vector2(endX, endY);
            var arc = new Arc(startPoint, midPoint, endPoint);
            var increment = arc.angle.radians() / numberOfSegments;
            if (arc.orientation === 0 /* CW */)
                increment *= -1;
            var currentAngle = arc.startAngle.radians() + increment;
            for (var i = 0; i < numberOfSegments; i++) {
                var x = Math.cos(currentAngle) * arc.radius + arc.centerPoint.x;
                var y = Math.sin(currentAngle) * arc.radius + arc.centerPoint.y;
                this.addLineTo(x, y);
                currentAngle += increment;
            }
            return this;
        };
        Path.prototype.close = function () {
            return this._points;
        };
        Path.StartingAt = function (x, y) {
            return new Path(x, y);
        };
        return Path;
    })();
    BABYLON.Path = Path;
    var PolygonMeshBuilder = (function () {
        function PolygonMeshBuilder(name, contours, scene) {
            this.name = name;
            this.scene = scene;
            this._points = new PolygonPoints();
            if (!("poly2tri" in window)) {
                throw "PolygonMeshBuilder cannot be used because poly2tri is not referenced";
            }
            this._swctx = new poly2tri.SweepContext(this._points.add(contours));
        }
        PolygonMeshBuilder.prototype.addHole = function (hole) {
            this._swctx.addHole(this._points.add(hole));
            return this;
        };
        PolygonMeshBuilder.prototype.build = function (updatable) {
            if (updatable === void 0) { updatable = false; }
            var result = new BABYLON.Mesh(this.name, this.scene);
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
//# sourceMappingURL=babylon.polygonmesh.js.map