module BABYLON.Internals {
    /*
    * Based on jsTGALoader - Javascript loader for TGA file
    * By Vincent Thibault
    * @blog http://blog.robrowser.com/javascript-tga-loader.html
    */
    export class TGATools {

        //private static _TYPE_NO_DATA = 0;
        private static _TYPE_INDEXED = 1;
        private static _TYPE_RGB = 2;
        private static _TYPE_GREY = 3;
        private static _TYPE_RLE_INDEXED = 9;
        private static _TYPE_RLE_RGB = 10;
        private static _TYPE_RLE_GREY = 11;
        private static _ORIGIN_MASK = 0x30;
        private static _ORIGIN_SHIFT = 0x04;
        private static _ORIGIN_BL = 0x00;
        private static _ORIGIN_BR = 0x01;
        private static _ORIGIN_UL = 0x02;
        private static _ORIGIN_UR = 0x03;

        public static GetTGAHeader(data: Uint8Array): any {
            var offset = 0;

            var header = {
                id_length: data[offset++],
                colormap_type: data[offset++],
                image_type: data[offset++],
                colormap_index: data[offset++] | data[offset++] << 8,
                colormap_length: data[offset++] | data[offset++] << 8,
                colormap_size: data[offset++],
                origin: [
                    data[offset++] | data[offset++] << 8,
                    data[offset++] | data[offset++] << 8
                ],
                width: data[offset++] | data[offset++] << 8,
                height: data[offset++] | data[offset++] << 8,
                pixel_size: data[offset++],
                flags: data[offset++]
            };

            return header;
        }

        public static UploadContent(gl: WebGLRenderingContext, data: Uint8Array): void {
            // Not enough data to contain header ?
            if (data.length < 19) {
                Tools.Error("Unable to load TGA file - Not enough data to contain header");
                return;
            }

            // Read Header
            var offset = 18;
            var header = TGATools.GetTGAHeader(data);

            // Assume it's a valid Targa file.
            if (header.id_length + offset > data.length) {
                Tools.Error("Unable to load TGA file - Not enough data");
                return;
            }

            // Skip not needed data
            offset += header.id_length;

            var use_rle = false;
            var use_pal = false;
            var use_rgb = false;
            var use_grey = false;

            // Get some informations.
            switch (header.image_type) {
                case TGATools._TYPE_RLE_INDEXED:
                    use_rle = true;
                case TGATools._TYPE_INDEXED:
                    use_pal = true;
                    break;

                case TGATools._TYPE_RLE_RGB:
                    use_rle = true;
                case TGATools._TYPE_RGB:
                    use_rgb = true;
                    break;

                case TGATools._TYPE_RLE_GREY:
                    use_rle = true;
                case TGATools._TYPE_GREY:
                    use_grey = true;
                    break;
            }

            var pixel_data;

           // var numAlphaBits = header.flags & 0xf;
            var pixel_size = header.pixel_size >> 3;
            var pixel_total = header.width * header.height * pixel_size;

            // Read palettes
            var palettes;

            if (use_pal) {
                palettes = data.subarray(offset, offset += header.colormap_length * (header.colormap_size >> 3));
            }

            // Read LRE
            if (use_rle) {
                pixel_data = new Uint8Array(pixel_total);

                var c, count, i;
                var localOffset = 0;
                var pixels = new Uint8Array(pixel_size);

                while (offset < pixel_total && localOffset < pixel_total) {
                    c = data[offset++];
                    count = (c & 0x7f) + 1;

                    // RLE pixels
                    if (c & 0x80) {
                        // Bind pixel tmp array
                        for (i = 0; i < pixel_size; ++i) {
                            pixels[i] = data[offset++];
                        }

                        // Copy pixel array
                        for (i = 0; i < count; ++i) {
                            pixel_data.set(pixels, localOffset + i * pixel_size);
                        }

                        localOffset += pixel_size * count;
                    }
                    // Raw pixels
                    else {
                        count *= pixel_size;
                        for (i = 0; i < count; ++i) {
                            pixel_data[localOffset + i] = data[offset++];
                        }
                        localOffset += count;
                    }
                }
            }
            // RAW Pixels
            else {
                pixel_data = data.subarray(
                    offset,
                    offset += (use_pal ? header.width * header.height : pixel_total)
                    );
            }

            // Load to texture
            var x_start, y_start, x_step, y_step, y_end, x_end;

            switch ((header.flags & TGATools._ORIGIN_MASK) >> TGATools._ORIGIN_SHIFT) {
                default:
                case TGATools._ORIGIN_UL:
                    x_start = 0;
                    x_step = 1;
                    x_end = header.width;
                    y_start = 0;
                    y_step = 1;
                    y_end = header.height;
                    break;

                case TGATools._ORIGIN_BL:
                    x_start = 0;
                    x_step = 1;
                    x_end = header.width;
                    y_start = header.height - 1;
                    y_step = -1;
                    y_end = -1;
                    break;

                case TGATools._ORIGIN_UR:
                    x_start = header.width - 1;
                    x_step = -1;
                    x_end = -1;
                    y_start = 0;
                    y_step = 1;
                    y_end = header.height;
                    break;

                case TGATools._ORIGIN_BR:
                    x_start = header.width - 1;
                    x_step = -1;
                    x_end = -1;
                    y_start = header.height - 1;
                    y_step = -1;
                    y_end = -1;
                    break;
            }

            // Load the specify method
            var func = '_getImageData' + (use_grey ? 'Grey' : '') + (header.pixel_size) + 'bits';
            var imageData = (<any>TGATools)[func](header, palettes, pixel_data, y_start, y_step, y_end, x_start, x_step, x_end);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, header.width, header.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

        }

        static _getImageData8bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array {
            var image = pixel_data, colormap = palettes;
            var width = header.width, height = header.height;
            var color, i = 0, x, y;

            var imageData = new Uint8Array(width * height * 4);

            for (y = y_start; y !== y_end; y += y_step) {
                for (x = x_start; x !== x_end; x += x_step, i++) {
                    color = image[i];
                    imageData[(x + width * y) * 4 + 3] = 255;
                    imageData[(x + width * y) * 4 + 2] = colormap[(color * 3) + 0];
                    imageData[(x + width * y) * 4 + 1] = colormap[(color * 3) + 1];
                    imageData[(x + width * y) * 4 + 0] = colormap[(color * 3) + 2];
                }
            }

            return imageData;
        }

        static _getImageData16bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array {
            var image = pixel_data;
            var width = header.width, height = header.height;
            var color, i = 0, x, y;

            var imageData = new Uint8Array(width * height * 4);

            for (y = y_start; y !== y_end; y += y_step) {
                for (x = x_start; x !== x_end; x += x_step, i += 2) {
                    color = image[i + 0] + (image[i + 1] << 8); // Inversed ?
                    imageData[(x + width * y) * 4 + 0] = (color & 0x7C00) >> 7;
                    imageData[(x + width * y) * 4 + 1] = (color & 0x03E0) >> 2;
                    imageData[(x + width * y) * 4 + 2] = (color & 0x001F) >> 3;
                    imageData[(x + width * y) * 4 + 3] = (color & 0x8000) ? 0 : 255;
                }
            }

            return imageData;
        }

        static _getImageData24bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array {
            var image = pixel_data;
            var width = header.width, height = header.height;
            var i = 0, x, y;

            var imageData = new Uint8Array(width * height * 4);

            for (y = y_start; y !== y_end; y += y_step) {
                for (x = x_start; x !== x_end; x += x_step, i += 3) {
                    imageData[(x + width * y) * 4 + 3] = 255;
                    imageData[(x + width * y) * 4 + 2] = image[i + 0];
                    imageData[(x + width * y) * 4 + 1] = image[i + 1];
                    imageData[(x + width * y) * 4 + 0] = image[i + 2];
                }
            }

            return imageData;
        }

        static _getImageData32bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array {
            var image = pixel_data;
            var width = header.width, height = header.height;
            var i = 0, x, y;

            var imageData = new Uint8Array(width * height * 4);

            for (y = y_start; y !== y_end; y += y_step) {
                for (x = x_start; x !== x_end; x += x_step, i += 4) {
                    imageData[(x + width * y) * 4 + 2] = image[i + 0];
                    imageData[(x + width * y) * 4 + 1] = image[i + 1];
                    imageData[(x + width * y) * 4 + 0] = image[i + 2];
                    imageData[(x + width * y) * 4 + 3] = image[i + 3];
                }
            }

            return imageData;
        }

        static _getImageDataGrey8bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array {
            var image = pixel_data;
            var width = header.width, height = header.height;
            var color, i = 0, x, y;

            var imageData = new Uint8Array(width * height * 4);

            for (y = y_start; y !== y_end; y += y_step) {
                for (x = x_start; x !== x_end; x += x_step, i++) {
                    color = image[i];
                    imageData[(x + width * y) * 4 + 0] = color;
                    imageData[(x + width * y) * 4 + 1] = color;
                    imageData[(x + width * y) * 4 + 2] = color;
                    imageData[(x + width * y) * 4 + 3] = 255;
                }
            }

            return imageData;
        }

        static _getImageDataGrey16bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array {
            var image = pixel_data;
            var width = header.width, height = header.height;
            var i = 0, x, y;

            var imageData = new Uint8Array(width * height * 4);

            for (y = y_start; y !== y_end; y += y_step) {
                for (x = x_start; x !== x_end; x += x_step, i += 2) {
                    imageData[(x + width * y) * 4 + 0] = image[i + 0];
                    imageData[(x + width * y) * 4 + 1] = image[i + 0];
                    imageData[(x + width * y) * 4 + 2] = image[i + 0];
                    imageData[(x + width * y) * 4 + 3] = image[i + 1];
                }
            }

            return imageData;
        }

    }
} 