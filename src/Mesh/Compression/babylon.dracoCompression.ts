/// <reference path="../../../dist/preview release/babylon.d.ts" />

declare var DracoDecoderModule: any;

module BABYLON {
    /**
     * Draco compression (https://google.github.io/draco/)
     */
    export class DracoCompression {
        /**
         * Returns whether Draco compression is supported.
         */
        public static get IsSupported(): boolean {
            return !!window.DracoDecoderModule;
        }

        /**
         * Decodes Draco compressed data to vertex data.
         * @param data The array buffer view for the Draco compression data
         * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
         * @returns The decoded vertex data
         */
        public static Decode(data: ArrayBufferView, attributes: { [kind: string]: number }): VertexData {
            const dracoModule = new DracoDecoderModule();
            const buffer = new dracoModule.DecoderBuffer();
            buffer.Init(data, data.byteLength);

            const decoder = new dracoModule.Decoder();
            let geometry: any;
            let status: any;

            const vertexData = new VertexData();

            try {
                const type = decoder.GetEncodedGeometryType(buffer);
                switch (type) {
                    case dracoModule.TRIANGULAR_MESH:
                        geometry = new dracoModule.Mesh();
                        status = decoder.DecodeBufferToMesh(buffer, geometry);
                        break;
                    case dracoModule.POINT_CLOUD:
                        geometry = new dracoModule.PointCloud();
                        status = decoder.DecodeBufferToPointCloud(buffer, geometry);
                        break;
                    default:
                        throw new Error(`Invalid geometry type ${type}`);
                }

                if (!status.ok() || !geometry.ptr) {
                    throw new Error(status.error_msg());
                }

                const numPoints = geometry.num_points();

                if (type === dracoModule.TRIANGULAR_MESH) {
                    const numFaces = geometry.num_faces();
                    const faceIndices = new dracoModule.DracoInt32Array();
                    try {
                        vertexData.indices = new Uint32Array(numFaces * 3);
                        for (let i = 0; i < numFaces; i++) {
                            decoder.GetFaceFromMesh(geometry, i, faceIndices);
                            const offset = i * 3;
                            vertexData.indices[offset + 0] = faceIndices.GetValue(0);
                            vertexData.indices[offset + 1] = faceIndices.GetValue(1);
                            vertexData.indices[offset + 2] = faceIndices.GetValue(2);
                        }
                    }
                    finally {
                        dracoModule.destroy(faceIndices);
                    }
                }

                for (const kind in attributes) {
                    const uniqueId = attributes[kind];
                    const attribute = decoder.GetAttributeByUniqueId(geometry, uniqueId);
                    const dracoData = new dracoModule.DracoFloat32Array();
                    try {
                        decoder.GetAttributeFloatForAllPoints(geometry, attribute, dracoData);
                        const data = new Float32Array(numPoints * VertexBuffer.DeduceStride(kind));
                        for (let i = 0; i < data.length; i++) {
                            data[i] = dracoData.GetValue(i);
                        }
                        vertexData.set(data, kind);
                    }
                    finally {
                        dracoModule.destroy(dracoData);
                    }
                }
            }
            finally {
                if (geometry) {
                    dracoModule.destroy(geometry);
                }

                dracoModule.destroy(decoder);
                dracoModule.destroy(buffer);
            }

            return vertexData;
        }
    }
}
