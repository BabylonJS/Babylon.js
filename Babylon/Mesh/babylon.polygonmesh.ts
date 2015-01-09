module BABYLON {
    class IndexedVector2 extends Vector2 {
        constructor(original: Vector2, public index: number) {
            super(original.x, original.y);
        }
    }

    function nearlyEqual(a: number, b: number, epsilon: number = 0.0001): boolean {
        if (a === b) {
            return true;
        }
        return Math.abs(a - b) < epsilon;
    }

    class PolygonPoints {
        elements = new Array<IndexedVector2>();

        add(originalPoints: Array<Vector2>): Array<IndexedVector2> {

            var result = new Array<IndexedVector2>();
            originalPoints.forEach(point => {
                if (result.length == 0 || !(nearlyEqual(point.x, result[0].x) && nearlyEqual(point.y, result[0].y))) {
                    var newPoint = new IndexedVector2(point, this.elements.length);
                    result.push(newPoint);
                    this.elements.push(newPoint);
                }
            });

            return result;
        }

        computeBounds(): { min: Vector2; max: Vector2; width: number; height: number } {
            var lmin = new Vector2(this.elements[0].x, this.elements[0].y);
            var lmax = new Vector2(this.elements[0].x, this.elements[0].y);

            this.elements.forEach(point => {

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
        }
    }

    export class Polygon {
        static Rectangle(xmin: number, ymin: number, xmax: number, ymax: number): Vector2[] {
            return [
                new Vector2(xmin, ymin),
                new Vector2(xmax, ymin),
                new Vector2(xmax, ymax),
                new Vector2(xmin, ymax)
            ];
        }

        static Circle(radius: number, cx: number = 0, cy: number = 0, numberOfSides: number = 32): Vector2[] {
            var result = new Array<Vector2>();

            var angle = 0;
            var increment = (Math.PI * 2) / numberOfSides;

            for (var i = 0; i < numberOfSides; i++) {
                result.push(new Vector2(
                    cx + Math.cos(angle) * radius,
                    cy + Math.sin(angle) * radius
                    ));
                angle -= increment;
            }

            return result;
        }

        static Parse(input: string): Vector2[] {
            var floats = input.split(/[^-+eE\.\d]+/).map(parseFloat).filter(val => (!isNaN(val)));
            var i: number, result = [];
            for (i = 0; i < (floats.length & 0x7FFFFFFE); i += 2) {
                result.push(new poly2tri.Point(floats[i], floats[i + 1]));
            }
            return result;
        }

        static StartingAt(x: number, y: number): Path {
            return Path.StartingAt(x, y);
        }
    }

    class Arc {
        centerPoint: Vector2;
        radius: number;
        angle: Angle;
        startAngle: Angle;
        orientation : Orientation;

        constructor(public startPoint: Vector2, public midPoint: Vector2, public endPoint: Vector2) {
            
            var temp = Math.pow(midPoint.x, 2) + Math.pow(midPoint.y, 2);
            var startToMid = (Math.pow(startPoint.x, 2) + Math.pow(startPoint.y, 2) - temp) / 2.;
            var midToEnd = (temp - Math.pow(endPoint.x, 2) - Math.pow(endPoint.y, 2)) / 2.;
            var det = (startPoint.x - midPoint.x) * (midPoint.y - endPoint.y) - (midPoint.x - endPoint.x) * (startPoint.y - midPoint.y);

            this.centerPoint = new Vector2(
                (startToMid * (midPoint.y - endPoint.y) - midToEnd * (startPoint.y - midPoint.y)) / det,
                ((startPoint.x - midPoint.x) * midToEnd - (midPoint.x - endPoint.x) * startToMid) / det
                );
            
            this.radius = this.centerPoint.subtract(this.startPoint).length();

            this.startAngle = Angle.BetweenTwoPoints(this.centerPoint, this.startPoint);
            
            var a1 = this.startAngle.degrees();
            var a2 = Angle.BetweenTwoPoints(this.centerPoint, this.midPoint).degrees();
            var a3 = Angle.BetweenTwoPoints(this.centerPoint, this.endPoint).degrees();
            
            // angles correction
            if (a2 - a1 > +180.0) a2 -= 360.0;
            if (a2 - a1 < -180.0) a2 += 360.0;
            if (a3 - a2 > +180.0) a3 -= 360.0;
            if (a3 - a2 < -180.0) a3 += 360.0;

            this.orientation = (a2 - a1) < 0 ? Orientation.CW : Orientation.CCW;
            this.angle = Angle.FromDegrees(this.orientation === Orientation.CW ? a1 - a3 : a3 - a1);
        }
    }
    
    enum Orientation {
        CW,
        CCW
    }

    class Angle {

        private _radians: number;

        constructor(radians: number) {
            this._radians = radians;
            if (this._radians < 0) this._radians += (2 * Math.PI);
        }

        degrees = () => this._radians * 180 / Math.PI;
        radians = () => this._radians;

        static BetweenTwoPoints(a: Vector2, b: Vector2): Angle {
            var delta = b.subtract(a);
            var theta = Math.atan2(delta.y, delta.x);
            return new Angle(theta);
        }

        static FromRadians(radians: number): Angle {
            return new Angle(radians);
        }

        static FromDegrees(degrees: number): Angle {
            return new Angle(degrees * Math.PI / 180);
        }
    }

    
    
    export class Path {
        private _points : Vector2[] = [];

        constructor(x: number, y: number) {
            this._points.push(new Vector2(x, y));
        }
        
        addLineTo(x: number, y: number): Path {
            this._points.push(new Vector2(x, y));
            return this;
        }

        addArcTo(midX: number, midY: number, endX: number, endY: number, numberOfSegments = 36) : Path {
            var startPoint = this._points[this._points.length - 1];
            var midPoint = new Vector2(midX, midY);
            var endPoint = new Vector2(endX, endY);
            
            var arc = new Arc(startPoint, midPoint, endPoint);

            var increment = arc.angle.radians() / numberOfSegments;
            if (arc.orientation === Orientation.CW) increment *= -1;
            var currentAngle = arc.startAngle.radians() + increment;

            for (var i = 0; i < numberOfSegments; i++) {
                var x = Math.cos(currentAngle) * arc.radius + arc.centerPoint.x;
                var y = Math.sin(currentAngle) * arc.radius + arc.centerPoint.y;
                this.addLineTo(x, y);
                currentAngle += increment;
            }
            return this;
        }

        close() : Vector2[] {
            return this._points;
        }

        static StartingAt(x: number, y: number): Path {
            return new Path(x, y);
        }
    }

    export class PolygonMeshBuilder {

        private _swctx: poly2tri.SweepContext;
        private _points = new PolygonPoints();

        constructor(private name: string, contours: Vector2[], private scene: Scene) {
            if (!("poly2tri" in window)) {
                throw "PolygonMeshBuilder cannot be used because poly2tri is not referenced";
            }

            this._swctx = new poly2tri.SweepContext(this._points.add(contours));
        }

        addHole(hole: Vector2[]): PolygonMeshBuilder {
            this._swctx.addHole(this._points.add(hole));
            return this;
        }

        build(updatable: boolean = false): Mesh {
            var result = new Mesh(this.name, this.scene);

            var normals = [];
            var positions = [];
            var uvs = [];

            var bounds = this._points.computeBounds();
            this._points.elements.forEach((p) => {
                normals.push(0, 1.0, 0);
                positions.push(p.x, 0, p.y);
                uvs.push((p.x - bounds.min.x) / bounds.width, (p.y - bounds.min.y) / bounds.height);
            });

            var indices = [];

            this._swctx.triangulate();
            this._swctx.getTriangles().forEach((triangle) => {
                triangle.getPoints().forEach((point) => {
                    indices.push((<IndexedVector2>point).index);
                });
            });

            result.setVerticesData(positions, VertexBuffer.PositionKind, updatable);
            result.setVerticesData(normals, VertexBuffer.NormalKind, updatable);
            result.setVerticesData(uvs, VertexBuffer.UVKind, updatable);
            result.setIndices(indices);

            return result;
        }

    }
}