import { Vector3 } from "core/Maths/math.vector";
import type { IBrushPlane } from "./mapParser";

export class MapMathUtils {
    private static readonly _DETERMINANT_EPSILON = 1e-5;
    private static readonly _POSITION_EPSILON = 1e-3;

    /**
     * Calculates the determinant of a 3x3 matrix
     * @param matrix - The 3x3 matrix to calculate the determinant of
     * @returns The determinant of the matrix
     */
    public static Determinant3x3(matrix: number[][]): number {
        return (
            matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
            matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
            matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
        );
    }

    /**
     * Solves a 3x3 system of linear equations using Cramer's rule
     * @param matrix - The 3x3 matrix to solve
     * @param constants - The constants to solve for
     * @param precomputedDet - The precomputed determinant of the matrix (optional)
     * @returns The solution to the system of equations or null if the matrix is singular
     */
    public static SolveLinearSystem3x3(matrix: number[][], constants: number[], precomputedDet?: number): number[] | null {
        if (matrix.length !== 3 || matrix.some((row) => row.length !== 3) || constants.length !== 3) {
            throw new Error("Expected a 3x3 matrix and 3-length constants array.");
        }

        const det = precomputedDet !== undefined ? precomputedDet : this.Determinant3x3(matrix);
        if (Math.abs(det) < this._DETERMINANT_EPSILON) {
            return null;
        }

        const detX = this.Determinant3x3([
            [constants[0], matrix[0][1], matrix[0][2]],
            [constants[1], matrix[1][1], matrix[1][2]],
            [constants[2], matrix[2][1], matrix[2][2]],
        ]);

        const detY = this.Determinant3x3([
            [matrix[0][0], constants[0], matrix[0][2]],
            [matrix[1][0], constants[1], matrix[1][2]],
            [matrix[2][0], constants[2], matrix[2][2]],
        ]);

        const detZ = this.Determinant3x3([
            [matrix[0][0], matrix[0][1], constants[0]],
            [matrix[1][0], matrix[1][1], constants[1]],
            [matrix[2][0], matrix[2][1], constants[2]],
        ]);

        return [detX / det, detY / det, detZ / det];
    }

    /**
     * Sorts vertices in clockwise order around a face's normal
     * @param vertices - The vertices to sort
     * @param normal - The normal of the face
     */
    public static SortVerticesForFace(vertices: Vector3[], normal: Vector3): void {
        if (vertices.length < 3) {
            return;
        }

        const center = vertices.reduce((sum, v) => sum.add(v), Vector3.Zero()).scale(1 / vertices.length);
        const refDir = vertices[0].subtract(center).normalize();

        if (refDir.lengthSquared() < this._POSITION_EPSILON) {
            // eslint-disable-next-line no-console
            console.warn("Degenerate geometry detected in sortVerticesForFace.");
            return;
        }

        const axisX = refDir;
        const axisY = Vector3.Cross(normal, axisX).normalize();

        vertices.sort((a, b) => {
            const dirA = a.subtract(center).normalize();
            const dirB = b.subtract(center).normalize();
            const angleA = Math.atan2(Vector3.Dot(dirA, axisY), Vector3.Dot(dirA, axisX));
            const angleB = Math.atan2(Vector3.Dot(dirB, axisY), Vector3.Dot(dirB, axisX));
            return angleA - angleB;
        });
    }

    /**
     * Checks if there's a nearby vertex in the array
     * @param vertices - The vertices to check
     * @param vertex - The vertex to check for
     * @returns True if there's a nearby vertex, false otherwise
     */
    public static HasNearbyVertex(vertices: Vector3[], vertex: Vector3): boolean {
        return vertices.some((v) => Vector3.Distance(v, vertex) < this._POSITION_EPSILON);
    }

    /**
     * Finds the vertices of a brush by intersecting its planes
     * @param planeEquations - The plane equations of the brush
     * @returns Array of vertices
     */
    public static FindBrushVertices(planeEquations: { normal: Vector3; distance: number }[]): Vector3[] {
        const vertices: Vector3[] = [];

        for (let i = 0; i < planeEquations.length - 2; i++) {
            for (let j = i + 1; j < planeEquations.length - 1; j++) {
                for (let k = j + 1; k < planeEquations.length; k++) {
                    const p1 = planeEquations[i];
                    const p2 = planeEquations[j];
                    const p3 = planeEquations[k];

                    const vertex = MapMathUtils.SolveThreePlaneIntersection(p1, p2, p3);
                    if (!vertex) {
                        continue;
                    }

                    const isValid = planeEquations.every((plane, idx) => {
                        if (idx === i || idx === j || idx === k) {
                            return true;
                        }
                        const d = Vector3.Dot(plane.normal, vertex) + plane.distance;
                        return d <= this._POSITION_EPSILON;
                    });

                    if (isValid && !this.HasNearbyVertex(vertices, vertex)) {
                        vertices.push(vertex);
                    }
                }
            }
        }

        if (vertices.length === 0) {
            // eslint-disable-next-line no-console
            console.warn("Failed to find any valid vertices for brush");
        } else {
            // eslint-disable-next-line no-console
            console.debug(`Found ${vertices.length} vertices for brush`);
        }

        return vertices;
    }

    /**
     * Solves the intersection of three planes
     * @param p1 - The first plane
     * @param p2 - The second plane
     * @param p3 - The third plane
     * @returns The intersection point or null if no intersection
     */
    public static SolveThreePlaneIntersection(
        p1: { normal: Vector3; distance: number },
        p2: { normal: Vector3; distance: number },
        p3: { normal: Vector3; distance: number }
    ): Vector3 | null {
        try {
            const matrix = [
                [p1.normal.x, p1.normal.y, p1.normal.z],
                [p2.normal.x, p2.normal.y, p2.normal.z],
                [p3.normal.x, p3.normal.y, p3.normal.z],
            ];

            const constants = [-p1.distance, -p2.distance, -p3.distance];
            const det = this.Determinant3x3(matrix);

            if (Math.abs(det) < this._DETERMINANT_EPSILON) {
                return null;
            }

            const solution = this.SolveLinearSystem3x3(matrix, constants, det);
            return solution ? new Vector3(solution[0], solution[1], solution[2]) : null;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("Error solving plane intersection:", e);
            return null;
        }
    }

    /**
     * Converts brush planes to plane equations with texture information
     * @param planes - The brush planes to convert
     * @returns Array of plane equations with texture information
     */
    public static ConvertBrushPlanesToEquations(planes: IBrushPlane[]): {
        normal: Vector3;
        distance: number;
        textureName: string;
        xOffset: number;
        yOffset: number;
        rotation: number;
        xScale: number;
        yScale: number;
        p1: Vector3;
    }[] {
        const equations = planes.map((plane) => {
            try {
                // Important: Quake is right-handed with Z-up, we need to convert to Babylon's right-handed Y-up
                // The coordinate system conversion is:
                // Quake (x,y,z) -> Babylon (x,z,y)
                const p1 = new Vector3(plane.points[0].x, plane.points[0].z, plane.points[0].y);
                const p2 = new Vector3(plane.points[1].x, plane.points[1].z, plane.points[1].y);
                const p3 = new Vector3(plane.points[2].x, plane.points[2].z, plane.points[2].y);

                // Calculate vectors along the plane
                const v1 = p2.subtract(p1);
                const v2 = p3.subtract(p1);

                // Calculate normal using cross product
                // Note: For Quake planes, p1, p2, p3 should be in clockwise order to get the correct normal direction
                const normal = Vector3.Cross(v1, v2);

                // Skip planes with degenerate normals
                if (normal.lengthSquared() < 0.0001) {
                    // eslint-disable-next-line no-console
                    console.warn(`Skipping plane with degenerate normal`);
                    return null;
                }

                normal.normalize();

                // Calculate distance from origin (D term in plane equation Ax + By + Cz + D = 0)
                // Note: In our equation format, we want the D term such that the plane equation is:
                // normal.x * x + normal.y * y + normal.z * z + distance = 0
                // For a point on the plane, dot(normal, point) + distance = 0
                // So distance = -dot(normal, point)
                const distance = -Vector3.Dot(normal, p1);

                return {
                    normal,
                    distance,
                    p1,
                    textureName: plane.textureName,
                    xOffset: plane.xOffset,
                    yOffset: plane.yOffset,
                    rotation: plane.rotation,
                    xScale: plane.xScale,
                    yScale: plane.yScale,
                };
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn(`Error calculating plane equation:`, e);
                return null;
            }
        });

        return equations.filter((p) => p !== null) as {
            normal: Vector3;
            distance: number;
            textureName: string;
            xOffset: number;
            yOffset: number;
            rotation: number;
            xScale: number;
            yScale: number;
            p1: Vector3;
        }[];
    }

    /**
     * Triangulates a polygon using the ear clipping algorithm
     * @param vertices - Polygon vertices in clockwise order (when viewed from outside)
     * @param normal - Face normal for orientation checks
     * @returns Array of triangle indices (triplets)
     */
    public static TriangulatePolygon(vertices: Vector3[], normal: Vector3): number[] {
        if (vertices.length < 3) {
            return [];
        }

        // Create working copy of indices
        const indices = vertices.map((_, i) => i);
        const triangles: number[] = [];

        // Project 3D vertices to 2D space using face normal
        const basis = this._CreateBasisVectors(normal);
        const points2D = vertices.map((v) => this._ProjectTo2D(v, basis));

        let currentIndex = 0;
        let safeGuard = 0;

        while (indices.length > 3 && safeGuard++ < 1000) {
            const prevIndex = (currentIndex - 1 + indices.length) % indices.length;
            const nextIndex = (currentIndex + 1) % indices.length;

            const a = indices[prevIndex];
            const b = indices[currentIndex];
            const c = indices[nextIndex];

            const triangle = [a, b, c];

            if (this._IsEar(points2D, indices, prevIndex, currentIndex, nextIndex)) {
                // Add the ear triangle
                triangles.push(...triangle);

                // Remove the ear tip vertex
                indices.splice(currentIndex, 1);

                // Reset search
                currentIndex = prevIndex % indices.length;
            } else {
                currentIndex = nextIndex % indices.length;
            }
        }

        // Add remaining triangle
        if (indices.length === 3) {
            triangles.push(indices[0], indices[1], indices[2]);
        }

        return triangles;
    }

    /**
     * Creates orthogonal basis vectors for 2D projection
     * @param normal - The normal of the face
     * @returns The basis vectors
     */
    private static _CreateBasisVectors(normal: Vector3): {
        u: Vector3;
        v: Vector3;
    } {
        // Create orthogonal basis vectors for 2D projection
        const u = new Vector3();
        const v = new Vector3();

        if (Math.abs(normal.y) > 0.707) {
            u.set(1, 0, 0);
            v.set(0, 0, 1);
        } else {
            u.set(0, 1, 0);
            v.set(0, 0, 1);
        }

        // Make basis orthogonal to normal
        const n = normal.clone().normalize();
        u.subtractInPlace(n.scale(Vector3.Dot(u, n))).normalize();
        Vector3.CrossToRef(n, u, v);

        return { u, v };
    }

    /**
     * Projects a 3D point to 2D space using the basis vectors
     * @param point - The point to project
     * @param basis - The basis vectors
     * @returns The projected point
     */
    private static _ProjectTo2D(point: Vector3, basis: { u: Vector3; v: Vector3 }): { x: number; y: number } {
        return {
            x: Vector3.Dot(point, basis.u),
            y: Vector3.Dot(point, basis.v),
        };
    }

    /**
     * Checks if a triangle is an ear
     * @param points2D - The projected points
     * @param indices - The indices of the points
     * @param prevIndex - The previous index
     * @param currentIndex - The current index
     * @param nextIndex - The next index
     * @returns True if the triangle is an ear, false otherwise
     */
    private static _IsEar(points2D: { x: number; y: number }[], indices: number[], prevIndex: number, currentIndex: number, nextIndex: number): boolean {
        const a = points2D[indices[prevIndex]];
        const b = points2D[indices[currentIndex]];
        const c = points2D[indices[nextIndex]];

        // Check if triangle is convex
        if (!this._IsConvex(a, b, c)) {
            return false;
        }

        // Check if any other points are inside the triangle
        for (let i = 0; i < indices.length; i++) {
            if (i === prevIndex || i === currentIndex || i === nextIndex) {
                continue;
            }
            const p = points2D[indices[i]];
            if (this._PointInTriangle(p, a, b, c)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if a triangle is convex
     * @param a - The first point
     * @param b - The second point
     * @param c - The third point
     * @returns True if the triangle is convex, false otherwise
     */
    private static _IsConvex(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): boolean {
        // Calculate cross product of AB and BC vectors
        const abx = b.x - a.x;
        const aby = b.y - a.y;
        const bcx = c.x - b.x;
        const bcy = c.y - b.y;

        return abx * bcy - aby * bcx > 0;
    }

    /**
     * Checks if a point is inside a triangle
     * @param p - The point to check
     * @param a - The first point
     * @param b - The second point
     * @param c - The third point
     * @returns True if the point is inside the triangle, false otherwise
     */
    private static _PointInTriangle(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): boolean {
        // Barycentric coordinate check
        const v0 = { x: c.x - a.x, y: c.y - a.y };
        const v1 = { x: b.x - a.x, y: b.y - a.y };
        const v2 = { x: p.x - a.x, y: p.y - a.y };

        const dot00 = v0.x * v0.x + v0.y * v0.y;
        const dot01 = v0.x * v1.x + v0.y * v1.y;
        const dot02 = v0.x * v2.x + v0.y * v2.y;
        const dot11 = v1.x * v1.x + v1.y * v1.y;
        const dot12 = v1.x * v2.x + v1.y * v2.y;

        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return u >= 0 && v >= 0 && u + v <= 1;
    }
}
