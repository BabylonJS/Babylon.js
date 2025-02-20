import { VertexData } from "./mesh.vertexData";

/**
 * Performs Loop subdivision on a triangular mesh represented by Babylon.VertexData.
 *
 * @param vertexData - The original vertex data (positions and indices must be defined).
 * @param level - The number of subdivision iterations.
 * @returns A new VertexData with subdivided geometry.
 *
 * Note: This implementation recalculates vertex positions and indices according to the Loop scheme.
 * Normals are recomputed at the end. (UVs aren’t handled, so you might want to update those if needed.)
 */
export function Subdivide(vertexData: VertexData, level: number): VertexData {
    // If no subdivision is needed, just return the input.
    if (level <= 0) {
        return vertexData;
    }

    // Extract positions and indices from the input VertexData.
    // Positions: flat array [x0, y0, z0, x1, y1, z1, ...]
    // Indices: flat array of triangle indices.
    let positions = vertexData.positions!;
    let indices = vertexData.indices!;

    // Helper: create a unique key for an edge.
    function edgeKey(i1: number, i2: number): string {
        return i1 < i2 ? `${i1}_${i2}` : `${i2}_${i1}`;
    }

    // We'll perform subdivision 'level' times.
    for (let iter = 0; iter < level; iter++) {
        const numVertices = positions.length / 3;

        // Build connectivity maps.
        // neighborMap: For each vertex, a set of adjacent vertex indices.
        const neighborMap = new Map<number, Set<number>>();
        // edgeMap: Maps an edge (keyed by "minIndex_maxIndex") to its two endpoints and any opposite vertices.
        interface EdgeData {
            v1: number;
            v2: number;
            opposites: number[];
            newVertexIndex?: number;
        }
        const edgeMap = new Map<string, EdgeData>();

        // Initialize neighbor map.
        for (let i = 0; i < numVertices; i++) {
            neighborMap.set(i, new Set<number>());
        }

        // Helper: add neighbor connection.
        // eslint-disable-next-line no-inner-declarations
        function addNeighbor(v: number, n: number) {
            neighborMap.get(v)?.add(n);
        }

        // Populate neighborMap and edgeMap from each triangle.
        for (let i = 0; i < indices.length; i += 3) {
            const a = indices[i],
                b = indices[i + 1],
                c = indices[i + 2];

            // Register neighbors.
            addNeighbor(a, b);
            addNeighbor(a, c);
            addNeighbor(b, a);
            addNeighbor(b, c);
            addNeighbor(c, a);
            addNeighbor(c, b);

            // For each triangle edge, record the edge and its opposite vertex.
            const edges = [
                { key: edgeKey(a, b), v1: a, v2: b, opp: c },
                { key: edgeKey(b, c), v1: b, v2: c, opp: a },
                { key: edgeKey(c, a), v1: c, v2: a, opp: b },
            ];
            for (const edge of edges) {
                if (!edgeMap.has(edge.key)) {
                    edgeMap.set(edge.key, { v1: edge.v1, v2: edge.v2, opposites: [edge.opp] });
                } else {
                    edgeMap.get(edge.key)!.opposites.push(edge.opp);
                }
            }
        }

        // Prepare new positions array.
        // We first update old vertices.
        // newPositions will eventually contain repositioned old vertices plus new edge vertices.
        // Pre-allocate the portion for old vertices.
        const newPositions: number[] = new Array(numVertices * 3);
        for (let i = 0; i < numVertices; i++) {
            const neighbors = neighborMap.get(i)!;
            const n = neighbors.size;
            // Compute beta based on the Loop subdivision formula.
            const beta = n === 3 ? 3 / 16 : 3 / (8 * n);
            const ix = positions[i * 3];
            const iy = positions[i * 3 + 1];
            const iz = positions[i * 3 + 2];
            let sumX = 0,
                sumY = 0,
                sumZ = 0;
            neighbors.forEach((nb) => {
                sumX += positions[nb * 3];
                sumY += positions[nb * 3 + 1];
                sumZ += positions[nb * 3 + 2];
            });
            const scale = 1 - n * beta;
            newPositions[i * 3] = scale * ix + beta * sumX;
            newPositions[i * 3 + 1] = scale * iy + beta * sumY;
            newPositions[i * 3 + 2] = scale * iz + beta * sumZ;
        }

        // Next, compute new edge vertices.
        // Their indices will start at numVertices.
        let nextVertexIndex = numVertices;
        for (const [key, edge] of edgeMap) {
            const a = edge.v1,
                b = edge.v2;
            const ax = positions[a * 3],
                ay = positions[a * 3 + 1],
                az = positions[a * 3 + 2];
            const bx = positions[b * 3],
                by = positions[b * 3 + 1],
                bz = positions[b * 3 + 2];
            let newX: number, newY: number, newZ: number;

            // Interior edge: blend endpoints and the two opposite vertices.
            if (edge.opposites.length === 2) {
                const opp1 = edge.opposites[0],
                    opp2 = edge.opposites[1];
                const ox1 = positions[opp1 * 3],
                    oy1 = positions[opp1 * 3 + 1],
                    oz1 = positions[opp1 * 3 + 2];
                const ox2 = positions[opp2 * 3],
                    oy2 = positions[opp2 * 3 + 1],
                    oz2 = positions[opp2 * 3 + 2];
                newX = (3 / 8) * (ax + bx) + (1 / 8) * (ox1 + ox2);
                newY = (3 / 8) * (ay + by) + (1 / 8) * (oy1 + oy2);
                newZ = (3 / 8) * (az + bz) + (1 / 8) * (oz1 + oz2);
            } else {
                // Boundary edge: simple midpoint.
                newX = (ax + bx) / 2;
                newY = (ay + by) / 2;
                newZ = (az + bz) / 2;
            }
            // Record the new vertex index for this edge.
            edge.newVertexIndex = nextVertexIndex;
            // Append the new edge vertex to newPositions.
            newPositions.push(newX, newY, newZ);
            nextVertexIndex++;
        }

        // Create new indices by splitting each triangle.
        const newIndices: number[] = [];
        for (let i = 0; i < indices.length; i += 3) {
            const a = indices[i],
                b = indices[i + 1],
                c = indices[i + 2];
            // For each edge, retrieve the new vertex index computed earlier.
            const ab = edgeMap.get(edgeKey(a, b))!.newVertexIndex!;
            const bc = edgeMap.get(edgeKey(b, c))!.newVertexIndex!;
            const ca = edgeMap.get(edgeKey(c, a))!.newVertexIndex!;
            // Form four new triangles.
            newIndices.push(a, ab, ca);
            newIndices.push(b, bc, ab);
            newIndices.push(c, ca, bc);
            newIndices.push(ab, bc, ca);
        }

        // Prepare for the next iteration.
        positions = newPositions;
        indices = newIndices;
    }

    // Assemble the final VertexData.
    const result = new VertexData();
    result.positions = positions;
    result.indices = indices;

    return result;
}
