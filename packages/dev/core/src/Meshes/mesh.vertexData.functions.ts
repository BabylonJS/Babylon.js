import type { IndicesArray } from "core/types";

/**
 * Sort (in place) the index array so that faces with common indices are close
 * @param indices the array of indices to sort
 */
export function OptimizeIndices(indices: IndicesArray) {
    const faces: Array<Array<number>> = [];
    const faceCount = indices.length / 3;

    // Step 1: Break the indices array into faces
    for (let i = 0; i < faceCount; i++) {
        faces.push([indices[i * 3], indices[i * 3 + 1], indices[i * 3 + 2]]);
    }

    // Step 2: Build a graph connecting faces sharing a vertex
    const vertexToFaceMap = new Map<number, number[]>();
    faces.forEach((face, faceIndex) => {
        face.forEach((vertex) => {
            let face = vertexToFaceMap.get(vertex);
            if (!face) {
                vertexToFaceMap.set(vertex, face = []);
            }
            face.push(faceIndex);
        });
    });

    // Step 3: Traverse faces using DFS to ensure connected faces are close
    const visited = new Array(faceCount).fill(false);
    const sortedFaces: Array<number[]> = [];

    // Using a stack and not a recursive version to avoid call stack overflow
    const deepFirstSearchStack = (startFaceIndex: number) => {
        const stack: Array<number> = [startFaceIndex];

        while (stack.length > 0) {
            const currentFaceIndex = stack.pop()!;

            if (visited[currentFaceIndex]) {
                continue;
            }
            visited[currentFaceIndex] = true;
            sortedFaces.push(faces[currentFaceIndex]);

            // Push unvisited neighbors (faces sharing a vertex) onto the stack
            faces[currentFaceIndex].forEach((vertex) => {
                const neighbors = vertexToFaceMap.get(vertex);

                if (!neighbors) {
                    return;
                }

                neighbors.forEach((neighborFaceIndex) => {
                    if (!visited[neighborFaceIndex]) {
                        stack.push(neighborFaceIndex);
                    }
                });
            });
        }
    };

    // Start DFS from the first face
    for (let i = 0; i < faceCount; i++) {
        if (!visited[i]) {
            deepFirstSearchStack(i);
        }
    }

    // Step 4: Flatten the sorted faces back into an array
    let index = 0;
    sortedFaces.forEach((face) => {
        indices[index++] = face[0];
        indices[index++] = face[1];
        indices[index++] = face[2];
    });
}
