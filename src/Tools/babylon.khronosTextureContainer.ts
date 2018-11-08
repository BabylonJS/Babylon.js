module BABYLON {
    /**
     * for description see https://www.khronos.org/opengles/sdk/tools/KTX/
     * for file layout see https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/
     */
    export class KhronosTextureContainer {
        private static HEADER_LEN = 12 + (13 * 4); // identifier + header elements (not including key value meta-data pairs)

        // load types
        private static COMPRESSED_2D = 0; // uses a gl.compressedTexImage2D()
        private static COMPRESSED_3D = 1; // uses a gl.compressedTexImage3D()
        private static TEX_2D = 2; // uses a gl.texImage2D()
        private static TEX_3D = 3; // uses a gl.texImage3D()

        // elements of the header
        /**
         * Gets the openGL type
         */
        public glType: number;
        /**
         * Gets the openGL type size
         */
        public glTypeSize: number;
        /**
         * Gets the openGL format
         */
        public glFormat: number;
        /**
         * Gets the openGL internal format
         */
        public glInternalFormat: number;
        /**
         * Gets the base internal format
         */
        public glBaseInternalFormat: number;
        /**
         * Gets image width in pixel
         */
        public pixelWidth: number;
        /**
         * Gets image height in pixel
         */
        public pixelHeight: number;
        /**
         * Gets image depth in pixels
         */
        public pixelDepth: number;
        /**
         * Gets the number of array elements
         */
        public numberOfArrayElements: number;
        /**
         * Gets the number of faces
         */
        public numberOfFaces: number;
        /**
         * Gets the number of mipmap levels
         */
        public numberOfMipmapLevels: number;
        /**
         * Gets the bytes of key value data
         */
        public bytesOfKeyValueData: number;
        /**
         * Gets the load type
         */
        public loadType: number;
        /**
         * If the container has been made invalid (eg. constructor failed to correctly load array buffer)
         */
        public isInvalid = false;

        /**
         * Creates a new KhronosTextureContainer
         * @param arrayBuffer contents of the KTX container file
         * @param facesExpected should be either 1 or 6, based whether a cube texture or or
         * @param threeDExpected provision for indicating that data should be a 3D texture, not implemented
         * @param textureArrayExpected provision for indicating that data should be a texture array, not implemented
         */
        public constructor(
            /** contents of the KTX container file */
            public arrayBuffer: any, facesExpected: number, threeDExpected?: boolean, textureArrayExpected?: boolean) {
            // Test that it is a ktx formatted file, based on the first 12 bytes, character representation is:
            // '�', 'K', 'T', 'X', ' ', '1', '1', '�', '\r', '\n', '\x1A', '\n'
            // 0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A
            var identifier = new Uint8Array(this.arrayBuffer, 0, 12);
            if (identifier[0] !== 0xAB || identifier[1] !== 0x4B || identifier[2] !== 0x54 || identifier[3] !== 0x58 || identifier[4] !== 0x20 || identifier[5] !== 0x31 ||
                identifier[6] !== 0x31 || identifier[7] !== 0xBB || identifier[8] !== 0x0D || identifier[9] !== 0x0A || identifier[10] !== 0x1A || identifier[11] !== 0x0A) {
                this.isInvalid = true;
                    Tools.Error("texture missing KTX identifier");
                return;
            }

            // load the reset of the header in native 32 bit int
            var header = new Int32Array(this.arrayBuffer, 12, 13);

            // determine of the remaining header values are recorded in the opposite endianness & require conversion
            var oppositeEndianess = header[0] === 0x01020304;

            // read all the header elements in order they exist in the file, without modification (sans endainness)
            this.glType = oppositeEndianess ? this.switchEndianness(header[1]) : header[1]; // must be 0 for compressed textures
            this.glTypeSize = oppositeEndianess ? this.switchEndianness(header[2]) : header[2]; // must be 1 for compressed textures
            this.glFormat = oppositeEndianess ? this.switchEndianness(header[3]) : header[3]; // must be 0 for compressed textures
            this.glInternalFormat = oppositeEndianess ? this.switchEndianness(header[4]) : header[4]; // the value of arg passed to gl.compressedTexImage2D(,,x,,,,)
            this.glBaseInternalFormat = oppositeEndianess ? this.switchEndianness(header[5]) : header[5]; // specify GL_RGB, GL_RGBA, GL_ALPHA, etc (un-compressed only)
            this.pixelWidth = oppositeEndianess ? this.switchEndianness(header[6]) : header[6]; // level 0 value of arg passed to gl.compressedTexImage2D(,,,x,,,)
            this.pixelHeight = oppositeEndianess ? this.switchEndianness(header[7]) : header[7]; // level 0 value of arg passed to gl.compressedTexImage2D(,,,,x,,)
            this.pixelDepth = oppositeEndianess ? this.switchEndianness(header[8]) : header[8]; // level 0 value of arg passed to gl.compressedTexImage3D(,,,,,x,,)
            this.numberOfArrayElements = oppositeEndianess ? this.switchEndianness(header[9]) : header[9]; // used for texture arrays
            this.numberOfFaces = oppositeEndianess ? this.switchEndianness(header[10]) : header[10]; // used for cubemap textures, should either be 1 or 6
            this.numberOfMipmapLevels = oppositeEndianess ? this.switchEndianness(header[11]) : header[11]; // number of levels; disregard possibility of 0 for compressed textures
            this.bytesOfKeyValueData = oppositeEndianess ? this.switchEndianness(header[12]) : header[12]; // the amount of space after the header for meta-data

            // Make sure we have a compressed type.  Not only reduces work, but probably better to let dev know they are not compressing.
            if (this.glType !== 0) {
                Tools.Error("only compressed formats currently supported");
                return;
            } else {
                // value of zero is an indication to generate mipmaps @ runtime.  Not usually allowed for compressed, so disregard.
                this.numberOfMipmapLevels = Math.max(1, this.numberOfMipmapLevels);
            }

            if (this.pixelHeight === 0 || this.pixelDepth !== 0) {
                Tools.Error("only 2D textures currently supported");
                return;
            }

            if (this.numberOfArrayElements !== 0) {
                Tools.Error("texture arrays not currently supported");
                return;
            }

            if (this.numberOfFaces !== facesExpected) {
                Tools.Error("number of faces expected" + facesExpected + ", but found " + this.numberOfFaces);
                return;
            }

            // we now have a completely validated file, so could use existence of loadType as success
            // would need to make this more elaborate & adjust checks above to support more than one load type
            this.loadType = KhronosTextureContainer.COMPRESSED_2D;
        }

        //
        /**
         * Revert the endianness of a value.
         * Not as fast hardware based, but will probably never need to use
         * @param val defines the value to convert
         * @returns the new value
         */
        public switchEndianness(val: number): number {
            return ((val & 0xFF) << 24)
                | ((val & 0xFF00) << 8)
                | ((val >> 8) & 0xFF00)
                | ((val >> 24) & 0xFF);
        }

        /**
         * Uploads KTX content to a Babylon Texture.
         * It is assumed that the texture has already been created & is currently bound
         * @hidden
         */
        public uploadLevels(texture: InternalTexture, loadMipmaps: boolean): void {
            switch (this.loadType) {
                case KhronosTextureContainer.COMPRESSED_2D:
                    this._upload2DCompressedLevels(texture, loadMipmaps);
                    break;

                case KhronosTextureContainer.TEX_2D:
                case KhronosTextureContainer.COMPRESSED_3D:
                case KhronosTextureContainer.TEX_3D:
            }
        }

        private _upload2DCompressedLevels(texture: InternalTexture, loadMipmaps: boolean): void {
            // initialize width & height for level 1
            var dataOffset = KhronosTextureContainer.HEADER_LEN + this.bytesOfKeyValueData;
            var width = this.pixelWidth;
            var height = this.pixelHeight;

            var mipmapCount = loadMipmaps ? this.numberOfMipmapLevels : 1;
            for (var level = 0; level < mipmapCount; level++) {
                var imageSize = new Int32Array(this.arrayBuffer, dataOffset, 1)[0]; // size per face, since not supporting array cubemaps
                dataOffset += 4; //image data starts from next multiple of 4 offset. Each face refers to same imagesize field above.
                for (var face = 0; face < this.numberOfFaces; face++) {
                    var byteArray = new Uint8Array(this.arrayBuffer, dataOffset, imageSize);

                    const engine = texture.getEngine();
                    engine._uploadCompressedDataToTextureDirectly(texture, this.glInternalFormat, width, height, byteArray, face, level);

                    dataOffset += imageSize; // add size of the image for the next face/mipmap
                    dataOffset += 3 - ((imageSize + 3) % 4); // add padding for odd sized image
                }
                width = Math.max(1.0, width * 0.5);
                height = Math.max(1.0, height * 0.5);
            }
        }
    }
}