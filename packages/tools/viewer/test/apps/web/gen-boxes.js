// Generates self-contained (embedded buffer) glTF box files at several scales.
// Each box is a unit cube scaled to `size`, centered so its base sits at y=0.
const fs = require("fs");
const path = require("path");

function buildBoxGltf(size) {
    const h = size; // full height; box spans x/z [-size/2, size/2], y [0, size]
    const s = size / 2;
    // 24 vertices (4 per face) so each face has a flat normal.
    // Face order: +X, -X, +Y, -Y, +Z, -Z
    const faces = [
        { n: [1, 0, 0], v: [[s, 0, s], [s, 0, -s], [s, h, -s], [s, h, s]] },
        { n: [-1, 0, 0], v: [[-s, 0, -s], [-s, 0, s], [-s, h, s], [-s, h, -s]] },
        { n: [0, 1, 0], v: [[-s, h, s], [s, h, s], [s, h, -s], [-s, h, -s]] },
        { n: [0, -1, 0], v: [[-s, 0, -s], [s, 0, -s], [s, 0, s], [-s, 0, s]] },
        { n: [0, 0, 1], v: [[-s, 0, s], [s, 0, s], [s, h, s], [-s, h, s]] },
        { n: [0, 0, -1], v: [[s, 0, -s], [-s, 0, -s], [-s, h, -s], [s, h, -s]] },
    ];

    const positions = [];
    const normals = [];
    const indices = [];
    faces.forEach((f, fi) => {
        f.v.forEach((p) => {
            positions.push(p[0], p[1], p[2]);
            normals.push(f.n[0], f.n[1], f.n[2]);
        });
        const base = fi * 4;
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    });

    const posArr = new Float32Array(positions);
    const normArr = new Float32Array(normals);
    const idxArr = new Uint16Array(indices);

    // Align each accessor to 4 bytes.
    const posBytes = Buffer.from(posArr.buffer);
    const normBytes = Buffer.from(normArr.buffer);
    let idxBytes = Buffer.from(idxArr.buffer);
    // pad indices to 4-byte boundary
    if (idxBytes.length % 4 !== 0) {
        idxBytes = Buffer.concat([idxBytes, Buffer.alloc(4 - (idxBytes.length % 4))]);
    }

    const buffer = Buffer.concat([posBytes, normBytes, idxBytes]);
    const posOffset = 0;
    const normOffset = posBytes.length;
    const idxOffset = posBytes.length + normBytes.length;

    // bounds
    const min = [-s, 0, -s];
    const max = [s, h, s];

    const gltf = {
        asset: { version: "2.0", generator: "gen-boxes.js" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0, name: `box_${size}` }],
        meshes: [
            {
                name: `box_${size}`,
                primitives: [
                    {
                        attributes: { POSITION: 0, NORMAL: 1 },
                        indices: 2,
                        material: 0,
                    },
                ],
            },
        ],
        materials: [
            {
                name: "boxMat",
                pbrMetallicRoughness: {
                    baseColorFactor: [0.8, 0.3, 0.2, 1.0],
                    metallicFactor: 0.0,
                    roughnessFactor: 0.6,
                },
            },
        ],
        buffers: [
            {
                byteLength: buffer.length,
                uri: "data:application/octet-stream;base64," + buffer.toString("base64"),
            },
        ],
        bufferViews: [
            { buffer: 0, byteOffset: posOffset, byteLength: posBytes.length, target: 34962 },
            { buffer: 0, byteOffset: normOffset, byteLength: normBytes.length, target: 34962 },
            { buffer: 0, byteOffset: idxOffset, byteLength: idxArr.byteLength, target: 34963 },
        ],
        accessors: [
            { bufferView: 0, componentType: 5126, count: posArr.length / 3, type: "VEC3", min, max },
            { bufferView: 1, componentType: 5126, count: normArr.length / 3, type: "VEC3" },
            { bufferView: 2, componentType: 5123, count: idxArr.length, type: "SCALAR" },
        ],
    };

    return JSON.stringify(gltf);
}

const sizes = [0.1, 1, 10, 100];
for (const size of sizes) {
    const name = `box-${String(size).replace(".", "_")}.gltf`;
    fs.writeFileSync(path.join(__dirname, name), buildBoxGltf(size));
    console.log("wrote", name);
}
