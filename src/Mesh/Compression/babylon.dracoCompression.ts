/// <reference path="../../../dist/preview release/babylon.d.ts" />

declare var DracoDecoderModule: any;

module BABYLON {
    /**
     * Draco compression (https://google.github.io/draco/)
     */
    export class DracoCompression implements IDisposable {
        private _workerPool: WorkerPool;

        /**
         * Gets the url to the draco decoder if available.
         */
        public static DecoderUrl: Nullable<string> = DracoCompression._GetDefaultDecoderUrl();

        /**
         * Constructor
         * @param numWorkers The number of workers for async operations
         */
        constructor(numWorkers = (navigator.hardwareConcurrency || 4)) {
            const workers = new Array<Worker>(numWorkers);
            for (let i = 0; i < workers.length; i++) {
                const worker = new Worker(DracoCompression._WorkerBlobUrl);
                worker.postMessage({ id: "initDecoder", url: DracoCompression.DecoderUrl });
                workers[i] = worker;
            }

            this._workerPool = new WorkerPool(workers);
        }

        /**
         * Stop all async operations and release resources.
         */
        public dispose(): void {
            this._workerPool.dispose();
            delete this._workerPool;
        }

        /**
         * Decode Draco compressed mesh data to vertex data.
         * @param data The array buffer view for the Draco compression data
         * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
         * @returns A promise that resolves with the decoded vertex data
         */
        public decodeMeshAsync(data: ArrayBufferView, attributes: { [kind: string]: number }): Promise<VertexData> {
            return new Promise((resolve, reject) => {
                this._workerPool.push((worker, onComplete) => {
                    const vertexData = new VertexData();

                    const onError = (error: ErrorEvent) => {
                        worker.removeEventListener("error", onError);
                        worker.removeEventListener("message", onMessage);
                        reject(error);
                        onComplete();
                    };

                    const onMessage = (message: MessageEvent) => {
                        if (message.data === "done") {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            resolve(vertexData);
                            onComplete();
                        }
                        else if (message.data.id === "indices") {
                            vertexData.indices = message.data.value;
                        }
                        else {
                            vertexData.set(message.data.value, message.data.id);
                        }
                    };

                    worker.addEventListener("error", onError);
                    worker.addEventListener("message", onMessage);

                    const dataCopy = new Uint8Array(data.byteLength);
                    dataCopy.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));

                    worker.postMessage({ id: "decodeMesh", data: dataCopy, attributes: attributes }, [dataCopy.buffer]);
                });
            });
        }

        /**
         * The worker function that gets converted to a blob url to pass into a worker.
         */
        private static _Worker(): void {
            // self is actually a DedicatedWorkerGlobalScope
            const _self = self as any as {
                onmessage: (event: MessageEvent) => void;
                postMessage: (message: any, transfer?: any[]) => void;
                close: () => void;
            };

            const decodeMesh = (data: ArrayBufferView, attributes: { [kind: string]: number }): void => {
                const dracoModule = new DracoDecoderModule();
                const buffer = new dracoModule.DecoderBuffer();
                buffer.Init(data, data.byteLength);

                const decoder = new dracoModule.Decoder();
                let geometry: any;
                let status: any;

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
                            const indices = new Uint32Array(numFaces * 3);
                            for (let i = 0; i < numFaces; i++) {
                                decoder.GetFaceFromMesh(geometry, i, faceIndices);
                                const offset = i * 3;
                                indices[offset + 0] = faceIndices.GetValue(0);
                                indices[offset + 1] = faceIndices.GetValue(1);
                                indices[offset + 2] = faceIndices.GetValue(2);
                            }
                            _self.postMessage({ id: "indices", value: indices }, [indices.buffer]);
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
                            const babylonData = new Float32Array(numPoints * attribute.num_components());
                            for (let i = 0; i < babylonData.length; i++) {
                                babylonData[i] = dracoData.GetValue(i);
                            }
                            _self.postMessage({ id: kind, value: babylonData }, [babylonData.buffer]);
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

                _self.postMessage("done");
            }

            _self.onmessage = event => {
                switch (event.data.id) {
                    case "initDecoder": {
                        importScripts(event.data.url);
                        break;
                    }
                    case "decodeMesh": {
                        decodeMesh(event.data.data, event.data.attributes);
                        break;
                    }
                }
            };
        }

        private static _WorkerBlobUrl = URL.createObjectURL(new Blob([`(${DracoCompression._Worker.toString()})()`], { type: "application/javascript" }));

        private static _GetDefaultDecoderUrl(): Nullable<string> {
            for (let i = 0; i < document.scripts.length; i++) {
                if (document.scripts[i].type === "text/x-draco-decoder") {
                    return document.scripts[i].src;
                }
            }

            return null;
        }
    }
}
