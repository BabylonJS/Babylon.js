import { Logger } from "../Misc/logger";
import { InternalTexture } from "../Materials/Textures/internalTexture";

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
     * @param data contents of the KTX container file
     * @param facesExpected should be either 1 or 6, based whether a cube texture or or
     * @param threeDExpected provision for indicating that data should be a 3D texture, not implemented
     * @param textureArrayExpected provision for indicating that data should be a texture array, not implemented
     */
    public constructor(
        /** contents of the KTX container file */
        public data: ArrayBufferView, facesExpected: number, threeDExpected?: boolean, textureArrayExpected?: boolean) {
        if (!KhronosTextureContainer.IsValid(data)) {
            this.isInvalid = true;
            Logger.Error("texture missing KTX identifier");
            return;
        }

        // load the reset of the header in native 32 bit uint
        var dataSize = Uint32Array.BYTES_PER_ELEMENT;
        var headerDataView = new DataView(this.data.buffer, this.data.byteOffset + 12, 13 * dataSize);
        var endianness = headerDataView.getUint32(0, true);
        var littleEndian = endianness === 0x04030201;

        this.glType = headerDataView.getUint32(1 * dataSize, littleEndian); // must be 0 for compressed textures
        this.glTypeSize = headerDataView.getUint32(2 * dataSize, littleEndian); // must be 1 for compressed textures
        this.glFormat = headerDataView.getUint32(3 * dataSize, littleEndian); // must be 0 for compressed textures
        this.glInternalFormat = headerDataView.getUint32(4 * dataSize, littleEndian); // the value of arg passed to gl.compressedTexImage2D(,,x,,,,)
        this.glBaseInternalFormat = headerDataView.getUint32(5 * dataSize, littleEndian); // specify GL_RGB, GL_RGBA, GL_ALPHA, etc (un-compressed only)
        this.pixelWidth = headerDataView.getUint32(6 * dataSize, littleEndian); // level 0 value of arg passed to gl.compressedTexImage2D(,,,x,,,)
        this.pixelHeight = headerDataView.getUint32(7 * dataSize, littleEndian); // level 0 value of arg passed to gl.compressedTexImage2D(,,,,x,,)
        this.pixelDepth = headerDataView.getUint32(8 * dataSize, littleEndian); // level 0 value of arg passed to gl.compressedTexImage3D(,,,,,x,,)
        this.numberOfArrayElements = headerDataView.getUint32(9 * dataSize, littleEndian); // used for texture arrays
        this.numberOfFaces = headerDataView.getUint32(10 * dataSize, littleEndian); // used for cubemap textures, should either be 1 or 6
        this.numberOfMipmapLevels = headerDataView.getUint32(11 * dataSize, littleEndian); // number of levels; disregard possibility of 0 for compressed textures
        this.bytesOfKeyValueData = headerDataView.getUint32(12 * dataSize, littleEndian); // the amount of space after the header for meta-data

        // Make sure we have a compressed type.  Not only reduces work, but probably better to let dev know they are not compressing.
        if (this.glType !== 0) {
            Logger.Error("only compressed formats currently supported");
            return;
        } else {
            // value of zero is an indication to generate mipmaps @ runtime.  Not usually allowed for compressed, so disregard.
            this.numberOfMipmapLevels = Math.max(1, this.numberOfMipmapLevels);
        }

        if (this.pixelHeight === 0 || this.pixelDepth !== 0) {
            Logger.Error("only 2D textures currently supported");
            return;
        }

        if (this.numberOfArrayElements !== 0) {
            Logger.Error("texture arrays not currently supported");
            return;
        }

        if (this.numberOfFaces !== facesExpected) {
            Logger.Error("number of faces expected" + facesExpected + ", but found " + this.numberOfFaces);
            return;
        }

        // we now have a completely validated file, so could use existence of loadType as success
        // would need to make this more elaborate & adjust checks above to support more than one load type
        this.loadType = KhronosTextureContainer.COMPRESSED_2D;
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
            var imageSize = new Int32Array(this.data.buffer, this.data.byteOffset + dataOffset, 1)[0]; // size per face, since not supporting array cubemaps
            dataOffset += 4; //image data starts from next multiple of 4 offset. Each face refers to same imagesize field above.
            for (var face = 0; face < this.numberOfFaces; face++) {
                var byteArray = new Uint8Array(this.data.buffer, this.data.byteOffset + dataOffset, imageSize);

                const engine = texture.getEngine();
                engine._uploadCompressedDataToTextureDirectly(texture, this.glInternalFormat, width, height, byteArray, face, level);

                dataOffset += imageSize; // add size of the image for the next face/mipmap
                dataOffset += 3 - ((imageSize + 3) % 4); // add padding for odd sized image
            }
            width = Math.max(1.0, width * 0.5);
            height = Math.max(1.0, height * 0.5);
        }
    }

    /**
     * Checks if the given data starts with a KTX file identifier.
     * @param data the data to check
     * @returns true if the data is a KTX file or false otherwise
     */
    public static IsValid(data: ArrayBufferView): boolean {
        if (data.byteLength >= 12)
        {
            // '«', 'K', 'T', 'X', ' ', '1', '1', '»', '\r', '\n', '\x1A', '\n'
            const identifier = new Uint8Array(data.buffer, data.byteOffset, 12);
            if (identifier[0] === 0xAB && identifier[1] === 0x4B && identifier[2] === 0x54 && identifier[3] === 0x58 && identifier[4] === 0x20 && identifier[5] === 0x31 &&
                identifier[6] === 0x31 && identifier[7] === 0xBB && identifier[8] === 0x0D && identifier[9] === 0x0A && identifier[10] === 0x1A && identifier[11] === 0x0A) {
                return true;
            }
        }

        return false;
    }
}
