declare module BABYLON.Internals {
    interface DDSInfo {
        width: number;
        height: number;
        mipmapCount: number;
        isFourCC: boolean;
        isRGB: boolean;
        isLuminance: boolean;
        isCube: boolean;
    }
    class DDSTools {
        static GetDDSInfo(arrayBuffer: any): DDSInfo;
        private static GetRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
        private static GetRGBArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
        private static GetLuminanceArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
        static UploadDDSLevels(gl: WebGLRenderingContext, ext: any, arrayBuffer: any, info: DDSInfo, loadMipmaps: boolean, faces: number): void;
    }
}
