import { type Nullable } from "../../types";
declare module "../abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _excludedCompressedTextures: string[];

        /** @internal */
        _textureFormatInUse: string;

        /**
         * Gets the list of texture formats supported
         */
        readonly texturesSupported: Array<string>;

        /**
         * Gets the texture format in use
         */
        readonly textureFormatInUse: Nullable<string>;

        /**
         * Set the compressed texture extensions or file names to skip.
         *
         * @param skippedFiles defines the list of those texture files you want to skip
         * Example: [".dds", ".env", "myfile.png"]
         */
        setCompressedTextureExclusions(skippedFiles: Array<string>): void;

        /**
         * Set the compressed texture format to use, based on the formats you have, and the formats
         * supported by the hardware / browser.
         *
         * Khronos Texture Container (.ktx) files are used to support this.  This format has the
         * advantage of being specifically designed for OpenGL.  Header elements directly correspond
         * to API arguments needed to compressed textures.  This puts the burden on the container
         * generator to house the arcane code for determining these for current & future formats.
         *
         * for description see https://www.khronos.org/opengles/sdk/tools/KTX/
         * for file layout see https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/
         *
         * Note: The result of this call is not taken into account when a texture is base64.
         *
         * @param formatsAvailable defines the list of those format families you have created
         * on your server.  Syntax: '-' + format family + '.ktx'.  (Case and order do not matter.)
         *
         * Current families are astc, dxt, pvrtc, etc2, & etc1.
         * @returns The extension selected.
         */
        setTextureFormatToUse(formatsAvailable: Array<string>): Nullable<string>;
    }
}
