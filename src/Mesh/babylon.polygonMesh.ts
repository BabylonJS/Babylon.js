module BABYLON {
    declare var earcut: any;
    /**
     * Vector2 wth index property
     */
    class IndexedVector2 extends Vector2 {
        constructor(
            original: Vector2,
            /** Index of the vector2 */
            public index: number) {
            super(original.x, original.y);
        }
    }

    /**
     * Defines points to create a polygon
     */
    class PolygonPoints {
        elements = new Array<IndexedVector2>();

        add(originalPoints: Array<Vector2>): Array<IndexedVector2> {

            var result = new Array<IndexedVector2>();
            originalPoints.forEach((point) => {
                if (result.length === 0 || !point.equalsWithEpsilon(result[0])) {
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

            this.elements.forEach((point) => {

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

    /**
     * Polygon
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#non-regular-polygon
     */
    export class Polygon {
        /**
         * Creates a rectangle
         * @param xmin bottom X coord
         * @param ymin bottom Y coord
         * @param xmax top X coord
         * @param ymax top Y coord
         * @returns points that make the resulting rectation
         */
        static Rectangle(xmin: number, ymin: number, xmax: number, ymax: number): Vector2[] {
            return [
                new Vector2(xmin, ymin),
                new Vector2(xmax, ymin),
                new Vector2(xmax, ymax),
                new Vector2(xmin, ymax)
            ];
        }

        /**
         * Creates a circle
         * @param radius radius of circle
         * @param cx scale in x
         * @param cy scale in y
         * @param numberOfSides number of sides that make up the circle
         * @returns points that make the resulting circle
         */
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

        /**
         * Creates a polygon from input string
         * @param input Input polygon data
         * @returns the parsed points
         */
        static Parse(input: string): Vector2[] {
            var floats = input.split(/[^-+eE\.\d]+/).map(parseFloat).filter((val) => (!isNaN(val)));
            var i: number, result = [];
            for (i = 0; i < (floats.length & 0x7FFFFFFE); i += 2) {
                result.push(new Vector2(floats[i], floats[i + 1]));
            }
            return result;
        }

        /**
         * Starts building a polygon from x and y coordinates
         * @param x x coordinate
         * @param y y coordinate
         * @returns the started path2
         */
        static StartingAt(x: number, y: number): Path2 {
            return Path2.StartingAt(x, y);
        }
    }

    /**
     * Builds a polygon
     * @see https://doc.babylonjs.com/how_to/polygonmeshbuilder
     */
    export class PolygonMeshBuilder {

        private _points = new PolygonPoints();
        private _outlinepoints = new PolygonPoints();
        private _holes = new Array<PolygonPoints>();

        private _name: string;
        private _scene: Scene;

        private _epoints: number[] = new Array<number>();
        private _eholes: number[] = new Array<number>();

        private _addToepoint(points: Vector2[]) {
            for (let p of points) {
                this._epoints.push(p.x, p.y);
            }
        }

        /**
         * Creates a PolygonMeshBuilder
         * @param name name of the builder
         * @param contours Path of the polygon
         * @param scene scene to add to
         */
        constructor(name: string, contours: Path2 | Vector2[] | any, scene: Scene) {
            this._name = name;
            this._scene = scene;

            var points: Vector2[];
            if (contours instanceof Path2) {
                points = (<Path2>contours).getPoints();
            } else {
                points = (<Vector2[]>contours);
            }

            this._addToepoint(points);

            this._points.add(points);
            this._outlinepoints.add(points);

            if (typeof earcut === 'undefined') {
                Tools.Warn("Earcut was not found, the polygon will not be built.");
            }
        }

        /**
         * Adds a whole within the polygon
         * @param hole Array of points defining the hole
         * @returns this
         */
        addHole(hole: Vector2[]): PolygonMeshBuilder {
            this._points.add(hole);
            var holepoints = new PolygonPoints();
            holepoints.add(hole);
            this._holes.push(holepoints);

            this._eholes.push(this._epoints.length / 2);
            this._addToepoint(hole);

            return this;
        }

        /**
         * Creates the polygon
         * @param updatable If the mesh should be updatable
         * @param depth The depth of the mesh created
         * @returns the created mesh
         */
        build(updatable: boolean = false, depth: number = 0): Mesh {
            var result = new Mesh(this._name, this._scene);

            var normals = new Array<number>();
            var positions = new Array<number>();
            var uvs = new Array<number>();

            var bounds = this._points.computeBounds();
            this._points.elements.forEach((p) => {
                normals.push(0, 1.0, 0);
                positions.push(p.x, 0, p.y);
                uvs.push((p.x - bounds.min.x) / bounds.width, (p.y - bounds.min.y) / bounds.height);
            });

            var indices = new Array<number>();

            let res = earcut(this._epoints, this._eholes, 2);

            for (let i = 0; i < res.length; i++) {
                indices.push(res[i]);
            }

            if (depth > 0) {
                var positionscount = (positions.length / 3); //get the current pointcount

                this._points.elements.forEach((p) => { //add the elements at the depth
                    normals.push(0, -1.0, 0);
                    positions.push(p.x, -depth, p.y);
                    uvs.push(1 - (p.x - bounds.min.x) / bounds.width, 1 - (p.y - bounds.min.y) / bounds.height);
                });

                let totalCount = indices.length;
                for (let i = 0; i < totalCount; i += 3) {
                    let i0 = indices[i + 0];
                    let i1 = indices[i + 1];
                    let i2 = indices[i + 2];

                    indices.push(i2 + positionscount);
                    indices.push(i1 + positionscount);
                    indices.push(i0 + positionscount);
                }

                //Add the sides
                this.addSide(positions, normals, uvs, indices, bounds, this._outlinepoints, depth, false);

                this._holes.forEach((hole) => {
                    this.addSide(positions, normals, uvs, indices, bounds, hole, depth, true);
                });
            }

            result.setVerticesData(VertexBuffer.PositionKind, positions, updatable);
            result.setVerticesData(VertexBuffer.NormalKind, normals, updatable);
            result.setVerticesData(VertexBuffer.UVKind, uvs, updatable);
            result.setIndices(indices);

            return result;
        }

        /**
         * Adds a side to the polygon
         * @param positions points that make the polygon
         * @param normals normals of the polygon
         * @param uvs uvs of the polygon
         * @param indices indices of the polygon
         * @param bounds bounds of the polygon
         * @param points points of the polygon
         * @param depth depth of the polygon
         * @param flip flip of the polygon
         */
        private addSide(positions: any[], normals: any[], uvs: any[], indices: any[], bounds: any, points: PolygonPoints, depth: number, flip: boolean) {
            var StartIndex: number = positions.length / 3;
            var ulength: number = 0;
            for (var i: number = 0; i < points.elements.length; i++) {
                var p: IndexedVector2 = points.elements[i];
                var p1: IndexedVector2;
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

                var v1 = new Vector3(p.x, 0, p.y);
                var v2 = new Vector3(p1.x, 0, p1.y);
                var v3 = v2.subtract(v1);
                var v4 = new Vector3(0, 1, 0);
                var vn = Vector3.Cross(v3, v4);
                vn = vn.normalize();

                uvs.push(ulength / bounds.width, 0);
                uvs.push(ulength / bounds.width, 1);
                ulength += v3.length();
                uvs.push((ulength / bounds.width), 0);
                uvs.push((ulength / bounds.width), 1);

                if (!flip) {
                    normals.push(-vn.x, - vn.y, -vn.z);
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
        }
    }
}
