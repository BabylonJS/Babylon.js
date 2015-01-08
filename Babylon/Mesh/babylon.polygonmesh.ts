module BABYLON {
    class IndexedVector2 extends Vector2 {
        constructor(
            original: Vector2,
            public index: number
        ) {
            super(original.x, original.y);
        }
    }


    class PolygonPoints {
        elements = new Array<IndexedVector2>();

        add(originalPoints: Array<Vector2>): Array<IndexedVector2> {
            
            var result = new Array<IndexedVector2>();
            
            originalPoints.forEach(point => {
                var newPoint = new IndexedVector2(point, this.elements.length);
                result.push(newPoint);
                this.elements.push(newPoint);
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
        static rectangle(xmin: number, ymin: number, xmax: number, ymax: number): Vector2[] {
            return [
                new Vector2(xmin, ymin),
                new Vector2(xmax, ymin),
                new Vector2(xmax, ymax),
                new Vector2(xmin, ymax)
            ];
        }

        static circle(radius: number, cx: number = 0, cy: number = 0, numberOfSides: number = 32): Vector2[] {
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

        static parse(input: string): Vector2[] {
            var floats = input.split(/[^-+eE\.\d]+/).map(parseFloat).filter(val => (!isNaN(val)));
            var i: number, result = [];
            for (i = 0; i < (floats.length & 0x7FFFFFFE); i += 2) {
                result.push(new poly2tri.Point(floats[i], floats[i + 1]));
            }
            return result;
        }

        static bird(): Vector2[] {
            var birdData = "4.57998 4.03402 4.06435 4.06435 3.51839 4.21601 3.09376 4.42832 2.60846 4.57998 2.09284 4.7013 1.51655 4.82263 0.909929 4.94395 \
0.242648 5.06527 -0.30331 5.0956 -1.15258 5.12594 -1.72887 5.12594 -2.48714 5.12594 -2.85111 5.03494 -3.36674 5.30792 -3.70038 5.52024 \
-4.15534 5.9752 -4.7013 6.27851 -5.0956 6.61215 -5.73255 6.67281 -6.55149 6.73348 -6.88513 6.61215 -7.46142 6.36951 -7.88605 6.18752 \
-8.25003 5.91454 -8.64433 5.61123 -8.88698 5.30792 -9.06896 5.00461 -9.25095 4.88329 -9.94856 4.73163 -10.6462 4.64064 -11.1011 4.54965 \
-11.3741 4.42832 -11.5561 4.21601 -11.0101 4.21601 -10.1305 3.94303 -9.61492 3.73071 -9.15996 3.4274 -8.73532 3.00277 -8.34102 2.6388 \
-7.97705 2.36582 -7.61308 2.03218 -7.18844 1.45589 -6.79414 1.12225 -6.64248 0.788605 -6.36951 0.242648 -6.24818 -0.212317 -6.00553 -0.515627 \
-5.73255 -0.818936 -5.24726 -1.2739 -4.7923 -1.60754 -4.42832 -2.00184 -3.67005 -2.21416 -3.18475 -2.39615 -2.5478 -2.69946 \
-1.91085 -2.79045 -1.06158 -2.88144 -0.333641 -2.88144 0.242648 -2.85111 0.94026 -2.82078 1.2739 -2.85111 1.42556 -3.0331 \
1.42556 -3.30608 1.33456 -3.57905 1.15258 -4.00369 1.03125 -4.57998 0.849267 -5.15627 0.63695 -5.5809 0.30331 -5.91454 \
0.060662 -6.15719 -0.333641 -6.27851 -0.697612 -6.27851 -1.15258 -6.36951 -1.57721 -6.39984 -2.09284 -6.52116 -2.36582 -6.79414 \
-2.48714 -7.06712 -2.18383 -6.97612 -1.85019 -6.79414 -1.42556 -6.76381 -1.15258 -6.79414 -1.36489 -6.88513 -1.69853 -6.97612 \
-1.97151 -7.12778 -2.12317 -7.37043 -2.27482 -7.64341 -2.39615 -7.91639 -2.36582 -8.21969 -2.03218 -7.85572 -1.81986 -7.7344 \
-1.57721 -7.67374 -1.36489 -7.49175 -1.21324 -7.40076 -0.849267 -7.2491  -0.60662 -7.12778 -0.242648 -6.91546 0.030331 -6.70315 \
0.363972 -6.4605 0.242648 -6.61215 0.152837 -6.72007 -0.092855 -6.88818 -0.506653 -7.15974 -0.765276 -7.31491 -1.01097 -7.41836 \
-1.16614 -7.5606 -1.32132 -7.71577 -1.45063 -7.81922 -1.50235 -8.06492 -1.50235 -8.29768 -1.46356 -8.53044 -1.38597 -8.29768 \
-1.28252 -8.05199 -1.14028 -7.87095 -0.985106 -7.84509 -0.817001 -7.84509 -0.623033 -7.70284 -0.390272 -7.52181 -0.105787 -7.31491 \
0.178699 -7.06922 0.489047 -6.84939  0.670083 -6.66835 0.928707 -6.47438 1.16147 -6.33214 1.47182 -6.13817 1.82096 -5.91834 \
2.04079 -5.84076 2.15717 -5.71144 2.18303 -5.45282 2.06665 -5.28472 1.87268 -5.3623 1.49768 -5.63386 1.22612 -5.81489 1.03216 -5.91834 \
0.876982 -5.95714 0.954569 -5.80196 1.00629 -5.60799 1.16147 -5.29765 1.3425 -4.9873 1.45888 -4.65109 1.47182 -4.4054 1.73044 -3.95281 \
1.84682 -3.6166 1.98906 -3.30625 2.14424 -2.95711 2.26062 -2.75021 2.42872 -2.59503 2.63562 -2.50452 2.98476 -2.51745 3.12701 -2.71141 \
3.06235 -3.09935 2.9589 -3.4097 2.86838 -3.75884 2.79079 -4.12091 2.70028 -4.43126 2.55803 -4.75454 2.48045 -5.03902 2.3382 -5.37523 \
2.29941 -5.59506 2.23475 -5.90541 2.11837 -6.21576 1.7951 -6.65542 1.39423 -7.05628 1.09681 -7.26318 0.838188 -7.37956 \
0.41146 -7.49594 -0.002337 -7.62526 -0.416135 -7.7675 -0.687689 -8.05199 -0.907519 -8.40113 -0.70062 -8.19423 -0.312685 -8.05199 \
-0.015268 -7.89681 0.217493 -7.89681 0.243355 -7.90974 0.023525 -8.1425 -0.157511 -8.25888 -0.403203 -8.43992 -0.648896 -8.75027 \
-0.778207 -8.90544 -0.881657 -9.18993 -0.80407 -9.60372 -0.597171 -9.177 -0.14458 -8.9701 0.269217 -8.62096 0.695946 -8.28475 1.13561 -8.00026 \
1.52354 -7.62526 1.82096 -7.26318 1.95027 -7.09508 1.9632 -7.15974 1.66578 -7.58646  1.45888 -7.84509 1.13561 -8.20716 0.760601 -8.65975 \
0.450253 -8.99596 0.269217 -9.28045 0.126974 -9.65545 0.19163 -10.2761 0.333873 -9.84942 0.63129 -9.68131 0.980431 -9.26751 1.26492 -8.72441 \
1.60113 -8.31061 1.98906 -7.7675 2.36407 -7.34077 2.79079 -7.00456 3.13994 -6.7718 3.68304 -6.46145 4.14857 -6.33214 4.7434 -6.09938 \
5.19599 -6.13817 4.85978 -5.87955 4.29081 -5.76317 3.77356 -5.81489 3.34683 -6.07352 2.77786 -6.47438 2.41579 -6.60369 \
2.41579 -6.28042 2.59683 -5.84076 2.79079 -5.42696 2.99769 -4.90971 3.25632 -4.30195 3.50201 -3.52608 3.83822 -2.63383 4.07098 -2.40107 \
4.39426 -2.28469 4.79512 -2.23296 4.54943 -2.02606 4.49771 -1.6252 4.54943 -1.50882 4.91151 -1.50882 5.54513 -1.45709 6.12704 -1.39244 \
6.85118 -1.32778 7.44601 -1.14674 7.85981 -0.78467 7.79516 -0.409667 7.49774 -0.151043 7.84688 0.042924 8.23481 0.314479 \
8.64861 0.702414 8.70034 1.09035 8.41585 1.42656 8.11843 1.62053 8.3512 2.06019 8.53223 2.38347 8.67447 2.74554 8.66154 3.22399 \
8.80379 3.87055 8.90724 4.36193 9.1012 4.85332 9.43741 5.40936 9.90293 6.04298 10.3167 6.58609 10.7047 7.3749 10.9374 7.96973 11.1573 8.40939 \
11.1573 8.84905 10.9374 9.05595 10.6659 9.28871 10.3426 9.37922 9.99345 9.34043 9.63138 8.97836 9.20465 8.48697 8.86844 8.1249 8.50637 7.72404 \
8.17016 7.28438 7.74343 6.88351 7.43308 6.5473 7.16153 6.1723 6.70894 5.71971 6.20462 5.25418 5.72617 4.80159 5.13134 4.41366 \
4.87271 4.16797";
            return this.parse(birdData);
        }
    }

    
    export class PolygonMeshBuilder {

        private _swctx: poly2tri.SweepContext;
        private _points = new PolygonPoints();

        constructor(
            private name: string,
            contours: Vector2[],
            private scene: Scene
        ) {
            if (!("poly2tri" in window)) {
                throw "poly2tri reference is missing.";
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

            // how I miss linq!
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