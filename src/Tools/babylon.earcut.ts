// All the credit goes to this project and the guy who's behind it https://github.com/mapbox/earcut
// Huge respect for a such great lib. 
// Earcut license:
// Copyright (c) 2016, Mapbox
// 
// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.
// 
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
// OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
// TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
// THIS SOFTWARE.
module Earcut {
    /**
     * The fastest and smallest JavaScript polygon triangulation library for your WebGL apps
     * @param data is a flat array of vertice coordinates like [x0, y0, x1, y1, x2, y2, ...].
     * @param holeIndices is an array of hole indices if any (e.g. [5, 8] for a 12- vertice input would mean one hole with vertices 5–7 and another with 8–11).
     * @param dim is the number of coordinates per vertice in the input array (2 by default).
     */
    export function earcut(data: number[], holeIndices: number[], dim: number): Array<number> {
        dim = dim || 2;

        var hasHoles = holeIndices && holeIndices.length,
            outerLen = hasHoles ? holeIndices[0] * dim : data.length,
            outerNode = linkedList(data, 0, outerLen, dim, true),
            triangles = new Array<number>();

        if (!outerNode) return triangles;

        var minX = 0, minY = 0, maxX, maxY, x, y, size = 0;

        if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

        // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
        if (data.length > 80 * dim) {
            minX = maxX = data[0];
            minY = maxY = data[1];

            for (var i = dim; i < outerLen; i += dim) {
                x = data[i];
                y = data[i + 1];
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }

            // minX, minY and size are later used to transform coords into integers for z-order calculation
            size = Math.max(maxX - minX, maxY - minY);
        }

        earcutLinked(outerNode, triangles, dim, minX, minY, size, 0);

        return triangles;
    }

    class Node {
        public prev: any = null;
        public next: any = null;

        public z: any = null;
        public prevZ: any = null;
        public nextZ: any = null;  
        
        public steiner: boolean = false;

        public constructor(public i: number, public x: number, public y: number) {
        }
    }

    // create a circular doubly linked list from polygon points in the specified winding order
    function linkedList(data: number[], start: number, end: number, dim: number, clockwise: boolean): Node {
        var i, last: Nullable<Node> = null;

        if (clockwise === (signedArea(data, start, end, dim) > 0)) {
            for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], (<Node>last));
        } else {
            for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], (<Node>last));
        }

        if (last && equals(last, last.next)) {
            removeNode(last);
            last = last.next;
        }

        return (<Node>last);
    }

    // eliminate colinear or duplicate points
    function filterPoints(start: Node, end?: Node) {
        if (!start) return start;
        if (!end) end = start;

        var p = start,
            again;
        do {
            again = false;

            if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
                removeNode(p);
                p = end = p.prev;
                if (p === p.next) return undefined;
                again = true;

            } else {
                p = p.next;
            }
        } while (again || p !== end);

        return end;
    }

    // main ear slicing loop which triangulates a polygon (given as a linked list)
    function earcutLinked(ear: any, triangles: number[], dim: number, minX: number, minY: number, size: number, pass?: number) {
        if (!ear) return;

        // interlink polygon nodes in z-order
        if (!pass && size) indexCurve(ear, minX, minY, size);

        var stop = ear,
            prev,
            next;

        // iterate through ears, slicing them one by one
        while (ear.prev !== ear.next) {
            prev = ear.prev;
            next = ear.next;

            if (size ? isEarHashed(ear, minX, minY, size) : isEar(ear)) {
                // cut off the triangle
                triangles.push(prev.i / dim);
                triangles.push(ear.i / dim);
                triangles.push(next.i / dim);

                removeNode(ear);

                // skipping the next vertice leads to less sliver triangles
                ear = next.next;
                stop = next.next;

                continue;
            }

            ear = next;

            // if we looped through the whole remaining polygon and can't find any more ears
            if (ear === stop) {
                // try filtering points and slicing again
                if (!pass) {
                    earcutLinked(filterPoints(ear, undefined), triangles, dim, minX, minY, size, 1);

                    // if this didn't work, try curing all small self-intersections locally
                } else if (pass === 1) {
                    ear = cureLocalIntersections(ear, triangles, dim);
                    earcutLinked(ear, triangles, dim, minX, minY, size, 2);

                    // as a last resort, try splitting the remaining polygon into two
                } else if (pass === 2) {
                    splitEarcut(ear, triangles, dim, minX, minY, size);
                }

                break;
            }
        }
    }

    // check whether a polygon node forms a valid ear with adjacent nodes
    function isEar(ear: Node) {
        var a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

        // now make sure we don't have other points inside the potential ear
        var p = ear.next.next;

        while (p !== ear.prev) {
            if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.next;
        }

        return true;
    }

    function isEarHashed(ear: Node, minX: number, minY: number, size: number) {
        var a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

        // triangle bbox; min & max are calculated like this for speed
        var minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x),
            minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y),
            maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x),
            maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);

        // z-order range for the current triangle bbox;
        var minZ = zOrder(minTX, minTY, minX, minY, size),
            maxZ = zOrder(maxTX, maxTY, minX, minY, size);

        // first look for points inside the triangle in increasing z-order
        var p = ear.nextZ;

        while (p && p.z <= maxZ) {
            if (p !== ear.prev &&
                p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.nextZ;
        }

        // then look for points in decreasing z-order
        p = ear.prevZ;

        while (p && p.z >= minZ) {
            if (p !== ear.prev &&
                p !== ear.next &&
                pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.prevZ;
        }

        return true;
    }

    // go through all polygon nodes and cure small local self-intersections
    function cureLocalIntersections(start: Node, triangles: number[], dim: number) {
        var p = start;
        do {
            var a = p.prev,
                b = p.next.next;

            if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

                triangles.push(a.i / dim);
                triangles.push(p.i / dim);
                triangles.push(b.i / dim);

                // remove two nodes involved
                removeNode(p);
                removeNode(p.next);

                p = start = b;
            }
            p = p.next;
        } while (p !== start);

        return p;
    }

    // try splitting polygon into two and triangulate them independently
    function splitEarcut(start: Node, triangles: number[], dim: number, minX: number, minY: number, size: number) {
        // look for a valid diagonal that divides the polygon into two
        var a = start;
        do {
            var b = a.next.next;
            while (b !== a.prev) {
                if (a.i !== b.i && isValidDiagonal(a, b)) {
                    // split the polygon in two by the diagonal
                    var c = splitPolygon(a, b);

                    // filter colinear points around the cuts
                    a = (<Node>filterPoints(a, a.next));
                    c = (<Node>filterPoints(c, c.next));

                    // run earcut on each half
                    earcutLinked(a, triangles, dim, minX, minY, size, undefined);
                    earcutLinked(c, triangles, dim, minX, minY, size, undefined);
                    return;
                }
                b = b.next;
            }
            a = a.next;
        } while (a !== start);
    }

    // link every hole into the outer loop, producing a single-ring polygon without holes
    function eliminateHoles(data: number[], holeIndices: number[], outerNode: Node, dim: number) {
        var queue = [],
            i,
            len,
            start,
            end,
            list;

        for (i = 0, len = holeIndices.length; i < len; i++) {
            start = holeIndices[i] * dim;
            end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            list = linkedList(data, start, end, dim, false);
            if (list === list.next) list.steiner = true;
            queue.push(getLeftmost(list));
        }

        queue.sort(compareX);

        // process holes from left to right
        for (i = 0; i < queue.length; i++) {
            eliminateHole(queue[i], outerNode);
            outerNode = (<Node>filterPoints(outerNode, outerNode.next));
        }

        return outerNode;
    }

    function compareX(a: Node, b: Node) {
        return a.x - b.x;
    }

    // find a bridge between vertices that connects hole with an outer ring and and link it
    function eliminateHole(hole: Node, outerNode: Node) {
        outerNode = (<Node>findHoleBridge(hole, outerNode));
        if (outerNode) {
            var b = splitPolygon(outerNode, hole);
            filterPoints(b, b.next);
        }
    }

    // David Eberly's algorithm for finding a bridge between hole and outer polygon
    function findHoleBridge(hole: Node, outerNode: Node) {
        var p = outerNode,
            hx = hole.x,
            hy = hole.y,
            qx = -Infinity,
            m;

        // find a segment intersected by a ray from the hole's leftmost point to the left;
        // segment's endpoint with lesser x will be potential connection point
        do {
            if (hy <= p.y && hy >= p.next.y) {
                var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
                if (x <= hx && x > qx) {
                    qx = x;
                    if (x === hx) {
                        if (hy === p.y) return p;
                        if (hy === p.next.y) return p.next;
                    }
                    m = p.x < p.next.x ? p : p.next;
                }
            }
            p = p.next;
        } while (p !== outerNode);

        if (!m) return null;

        if (hx === qx) return m.prev; // hole touches outer segment; pick lower endpoint

        // look for points inside the triangle of hole point, segment intersection and endpoint;
        // if there are no points found, we have a valid connection;
        // otherwise choose the point of the minimum angle with the ray as connection point

        var stop = m,
            mx = m.x,
            my = m.y,
            tanMin = Infinity,
            tan;

        p = m.next;

        while (p !== stop) {
            if (hx >= p.x &&
                p.x >= mx &&
                pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

                tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

                if ((tan < tanMin || (tan === tanMin && p.x > m.x)) && locallyInside(p, hole)) {
                    m = p;
                    tanMin = tan;
                }
            }

            p = p.next;
        }

        return m;
    }

    // interlink polygon nodes in z-order
    function indexCurve(start: Node, minX: number, minY: number, size: number) {
        var p = start;
        do {
            if (p.z === null) p.z = zOrder(p.x, p.y, minX, minY, size);
            p.prevZ = p.prev;
            p.nextZ = p.next;
            p = p.next;
        } while (p !== start);

        (<any>p.prevZ.nextZ) = null;
        (<any>p.prevZ) = null;

        sortLinked(p);
    }

    // Simon Tatham's linked list merge sort algorithm
    // http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
    function sortLinked(list: Node) {
        var i, p, q, e, tail, numMerges, pSize, qSize, inSize = 1;
        do {
            p = list;
            (<any>list) = null;
            tail = null;
            numMerges = 0;

            while (p) {
                numMerges++;
                q = p;
                pSize = 0;
                for (i = 0; i < inSize; i++) {
                    pSize++;
                    q = q.nextZ;
                    if (!q) break;
                }

                qSize = inSize;

                while (pSize > 0 || (qSize > 0 && q)) {

                    if (pSize === 0) {
                        e = q;
                        q = q.nextZ;
                        qSize--;
                    } else if (qSize === 0 || !q) {
                        e = p;
                        p = p.nextZ;
                        pSize--;
                    } else if (p.z <= q.z) {
                        e = p;
                        p = p.nextZ;
                        pSize--;
                    } else {
                        e = q;
                        q = q.nextZ;
                        qSize--;
                    }

                    if (tail) tail.nextZ = e;
                    else list = e;

                    (<any>e.prevZ) = tail;
                    tail = e;
                }

                p = q;
            }

            (<any>tail).nextZ = null;
            inSize *= 2;

        } while (numMerges > 1);

        return list;
    }

    // z-order of a point given coords and size of the data bounding box
    function zOrder(x: number, y: number, minX: number, minY: number, size: number) {
        // coords are transformed into non-negative 15-bit integer range
        x = 32767 * (x - minX) / size;
        y = 32767 * (y - minY) / size;

        x = (x | (x << 8)) & 0x00FF00FF;
        x = (x | (x << 4)) & 0x0F0F0F0F;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;

        y = (y | (y << 8)) & 0x00FF00FF;
        y = (y | (y << 4)) & 0x0F0F0F0F;
        y = (y | (y << 2)) & 0x33333333;
        y = (y | (y << 1)) & 0x55555555;

        return x | (y << 1);
    }

    // find the leftmost node of a polygon ring
    function getLeftmost(start: Node) {
        var p = start,
            leftmost = start;
        do {
            if (p.x < leftmost.x) leftmost = p;
            p = p.next;
        } while (p !== start);

        return leftmost;
    }

    // check if a point lies within a convex triangle
    function pointInTriangle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, px: number, py: number) {
        return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
        (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
        (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
    }

    // check if a diagonal between two polygon nodes is valid (lies in polygon interior)
    function isValidDiagonal(a: Node, b: Node) {
        return a.next.i !== b.i &&
            a.prev.i !== b.i &&
            !intersectsPolygon(a, b) &&
            locallyInside(a, b) &&
            locallyInside(b, a) &&
            middleInside(a, b);
    }

    // signed area of a triangle
    function area(p: Node, q: Node, r: Node) {
        return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    }

    // check if two points are equal
    function equals(p1: Node, p2: Node) {
        return p1.x === p2.x && p1.y === p2.y;
    }

    // check if two segments intersect
    function intersects(p1: Node, q1: Node, p2: Node, q2: Node) {
        if ((equals(p1, q1) && equals(p2, q2)) ||
        (equals(p1, q2) && equals(p2, q1))) return true;
        return area(p1, q1, p2) > 0 !== area(p1, q1, q2) > 0 &&
            area(p2, q2, p1) > 0 !== area(p2, q2, q1) > 0;
    }

    // check if a polygon diagonal intersects any polygon segments
    function intersectsPolygon(a: Node, b: Node) {
        var p = a;
        do {
            if (p.i !== a.i &&
                p.next.i !== a.i &&
                p.i !== b.i &&
                p.next.i !== b.i &&
                intersects(p, p.next, a, b)) return true;
            p = p.next;
        } while (p !== a);

        return false;
    }

    // check if a polygon diagonal is locally inside the polygon
    function locallyInside(a: Node, b: Node) {
        return area(a.prev, a, a.next) < 0
            ? area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0
            : area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
    }

    // check if the middle point of a polygon diagonal is inside the polygon
    function middleInside(a: Node, b: Node) {
        var p = a,
            inside = false,
            px = (a.x + b.x) / 2,
            py = (a.y + b.y) / 2;
        do {
            if (((p.y > py) !== (p.next.y > py)) && (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
                inside = !inside;
            p = p.next;
        } while (p !== a);

        return inside;
    }

    // link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
    // if one belongs to the outer ring and another to a hole, it merges it into a single ring
    function splitPolygon(a: Node, b: Node) {
        var a2 = new Node(a.i, a.x, a.y),
            b2 = new Node(b.i, b.x, b.y),
            an = a.next,
            bp = b.prev;

        a.next = b;
        b.prev = a;

        a2.next = an;
        an.prev = a2;

        b2.next = a2;
        a2.prev = b2;

        bp.next = b2;
        b2.prev = bp;

        return b2;
    }

    // create a node and optionally link it with previous one (in a circular doubly linked list)
    function insertNode(i: number, x: number, y: number, last?: Node) {
        var p = new Node(i, x, y);

        if (!last) {
            p.prev = p;
            p.next = p;

        } else {
            p.next = last.next;
            p.prev = last;
            last.next.prev = p;
            last.next = p;
        }
        return p;
    }

    function removeNode(p: Node) {
        p.next.prev = p.prev;
        p.prev.next = p.next;

        if (p.prevZ) p.prevZ.nextZ = p.nextZ;
        if (p.nextZ) p.nextZ.prevZ = p.prevZ;
    }

    /**
     * return a percentage difference between the polygon area and its triangulation area;
     * used to verify correctness of triangulation
     */
    export function deviation(data: number[], holeIndices: number[], dim: number, triangles: number[]) {
        var hasHoles = holeIndices && holeIndices.length;
        var outerLen = hasHoles ? holeIndices[0] * dim : data.length;

        var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
        if (hasHoles) {
            for (var i = 0, len = holeIndices.length; i < len; i++) {
                var start = holeIndices[i] * dim;
                var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
                polygonArea -= Math.abs(signedArea(data, start, end, dim));
            }
        }

        var trianglesArea = 0;
        for (i = 0; i < triangles.length; i += 3) {
            var a = triangles[i] * dim;
            var b = triangles[i + 1] * dim;
            var c = triangles[i + 2] * dim;
            trianglesArea += Math.abs(
            (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
            (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
        }

        return polygonArea === 0 && trianglesArea === 0 ? 0 : Math.abs((trianglesArea - polygonArea) / polygonArea);
    };

    function signedArea(data: number[], start: number, end: number, dim: number) {
        var sum = 0;
        for (var i = start, j = end - dim; i < end; i += dim) {
            sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
            j = i;
        }
        return sum;
    }

    /**
     *  turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts
     */
    export function flatten(data: number[][][]) {
        var dim = data[0][0].length,
            result = { vertices: new Array<number>(), holes: new Array<number>(), dimensions: dim },
            holeIndex = 0;

        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].length; j++) {
                for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
            }
            if (i > 0) {
                holeIndex += data[i - 1].length;
                result.holes.push(holeIndex);
            }
        }
        return result;
    };
}