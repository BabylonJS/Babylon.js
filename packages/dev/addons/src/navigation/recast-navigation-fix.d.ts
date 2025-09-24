declare module "recast-navigation" {
    class TileCacheMeshProcessJsImpl {
        process(params: dtNavMeshCreateParams | number, polyAreas: UnsignedCharArray | number, polyFlags: UnsignedShortArray | number): void;
    }

    class TileCacheMeshProcess extends TileCacheMeshProcessJsImpl {
        constructor();
        process(params: dtNavMeshCreateParams | number, polyAreas: UnsignedCharArray | number, polyFlags: UnsignedShortArray | number): void;
    }
}
