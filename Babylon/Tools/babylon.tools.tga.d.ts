/**
* Based on jsTGALoader - Javascript loader for TGA file
* By Vincent Thibault
* @blog http://blog.robrowser.com/javascript-tga-loader.html
*/
declare module BABYLON.Internals {
    class TGATools {
        private static _TYPE_NO_DATA;
        private static _TYPE_INDEXED;
        private static _TYPE_RGB;
        private static _TYPE_GREY;
        private static _TYPE_RLE_INDEXED;
        private static _TYPE_RLE_RGB;
        private static _TYPE_RLE_GREY;
        private static _ORIGIN_MASK;
        private static _ORIGIN_SHIFT;
        private static _ORIGIN_BL;
        private static _ORIGIN_BR;
        private static _ORIGIN_UL;
        private static _ORIGIN_UR;
        static GetTGAHeader(data: Uint8Array): any;
        static UploadContent(gl: WebGLRenderingContext, data: Uint8Array): void;
        static _getImageData8bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageData16bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageData24bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageData32bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageDataGrey8bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageDataGrey16bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
    }
}
