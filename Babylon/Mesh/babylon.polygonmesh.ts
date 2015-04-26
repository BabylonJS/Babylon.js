module BABYLON {
    class IndexedVector2 extends Vector2 {
        constructor(original: Vector2, public index: number) {
            super(original.x, original.y);
        }
    }

    class PolygonPoints {
        elements = new Array<IndexedVector2>();

        add(originalPoints: Array<Vector2>): Array<IndexedVector2> {

            var result = new Array<IndexedVector2>();
            originalPoints.forEach(point => {
                if (result.length === 0 || !(Tools.WithinEpsilon(point.x, result[0].x, 0.00001) && Tools.WithinEpsilon(point.y, result[0].y, 0.00001))) {
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

        static StartingAt(x: number, y: number): Path2 {
            return Path2.StartingAt(x, y);
        }
    }

    export class PolygonMeshBuilder {

        private _swctx: poly2tri.SweepContext;
        private _points = new PolygonPoints();

        private _name: string;
        private _scene: Scene;

        constructor(name: string, contours: Path2, scene: Scene) 
        constructor(name: string, contours: Vector2[], scene: Scene)
        constructor(name: string, contours: any, scene: Scene) {
            if (!("poly2tri" in window)) {
                throw "PolygonMeshBuilder cannot be used because poly2tri is not referenced";
            }

            this._name = name;
            this._scene = scene;

            var points: Vector2[];
            if (contours instanceof Path2) {
                points = (<Path2>contours).getPoints();
            } else {
                points = (<Vector2[]>contours);
            }

            this._swctx = new poly2tri.SweepContext(this._points.add(points));
        }

        addHole(hole: Vector2[]): PolygonMeshBuilder {
            this._swctx.addHole(this._points.add(hole));
            return this;
        }

        build(updatable: boolean = false): Mesh {
            var result = new Mesh(this._name, this._scene);

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

            result.setVerticesData(VertexBuffer.PositionKind, positions, updatable);
            result.setVerticesData(VertexBuffer.NormalKind, normals, updatable);
            result.setVerticesData(VertexBuffer.UVKind, uvs, updatable);
            result.setIndices(indices);

            return result;
        }

    }
}