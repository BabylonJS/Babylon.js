module BABYLON.Internals {
    /**
     * for description see https://www.khronos.org/opengles/sdk/tools/KTX/
     * for file layout see https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/
     */
    export class KhronosTextureContainer {
        static HEADER_LEN = 12 + (13 * 4); // identifier + header elements (not including key value meta-data pairs)
        
        // load types
        static COMPRESSED_2D = 0; // uses a gl.compressedTexImage2D()
        static COMPRESSED_3D = 1; // uses a gl.compressedTexImage3D()
        static TEX_2D        = 2; // uses a gl.texImage2D()
        static TEX_3D        = 3; // uses a gl.texImage3D()
        
        // elements of the header 
        public glType : number;
        public glTypeSize : number;
        public glFormat : number;
        public glInternalFormat : number;
        public glBaseInternalFormat : number;
        public pixelWidth : number;
        public pixelHeight : number;
        public pixelDepth : number;
        public numberOfArrayElements : number;
        public numberOfFaces : number;
        public numberOfMipmapLevels : number;
        public bytesOfKeyValueData : number;
        
        public loadType : number;
        /**
         * @param {ArrayBuffer} arrayBuffer- contents of the KTX container file
         * @param {number} facesExpected- should be either 1 or 6, based whether a cube texture or or
         * @param {boolean} threeDExpected- provision for indicating that data should be a 3D texture, not implemented
         * @param {boolean} textureArrayExpected- provision for indicating that data should be a texture array, not implemented
         */
        public constructor (public arrayBuffer : any, facesExpected : number, threeDExpected? : boolean, textureArrayExpected? : boolean) {
            // Test that it is a ktx formatted file, based on the first 12 bytes, character representation is:
            // '«', 'K', 'T', 'X', ' ', '1', '1', '»', '\r', '\n', '\x1A', '\n'
            // 0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A
            var identifier = new Uint8Array(this.arrayBuffer, 0, 12);
            if (identifier[ 0] !== 0xAB || identifier[ 1] !== 0x4B || identifier[ 2] !== 0x54 || identifier[ 3] !== 0x58 || identifier[ 4] !== 0x20 || identifier[ 5] !== 0x31 || 
                identifier[ 6] !== 0x31 || identifier[ 7] !== 0xBB || identifier[ 8] !== 0x0D || identifier[ 9] !== 0x0A || identifier[10] !== 0x1A || identifier[11] !== 0x0A) {
                Tools.Error("texture missing KTX identifier");
                return;
            }
            
            // load the reset of the header in native 32 bit int
            var header = new Int32Array(this.arrayBuffer, 12, 13);
            
            // determine of the remaining header values are recorded in the opposite endianness & require conversion
            var oppositeEndianess = header[0] === 0x01020304;
            
            // read all the header elements in order they exist in the file, without modification (sans endainness)
            this.glType                = oppositeEndianess ? this.switchEndainness(header[ 1]) : header[ 1]; // must be 0 for compressed textures
            this.glTypeSize            = oppositeEndianess ? this.switchEndainness(header[ 2]) : header[ 2]; // must be 1 for compressed textures
            this.glFormat              = oppositeEndianess ? this.switchEndainness(header[ 3]) : header[ 3]; // must be 0 for compressed textures
            this.glInternalFormat      = oppositeEndianess ? this.switchEndainness(header[ 4]) : header[ 4]; // the value of arg passed to gl.compressedTexImage2D(,,x,,,,)
            this.glBaseInternalFormat  = oppositeEndianess ? this.switchEndainness(header[ 5]) : header[ 5]; // specify GL_RGB, GL_RGBA, GL_ALPHA, etc (un-compressed only)
            this.pixelWidth            = oppositeEndianess ? this.switchEndainness(header[ 6]) : header[ 6]; // level 0 value of arg passed to gl.compressedTexImage2D(,,,x,,,)
            this.pixelHeight           = oppositeEndianess ? this.switchEndainness(header[ 7]) : header[ 7]; // level 0 value of arg passed to gl.compressedTexImage2D(,,,,x,,)
            this.pixelDepth            = oppositeEndianess ? this.switchEndainness(header[ 8]) : header[ 8]; // level 0 value of arg passed to gl.compressedTexImage3D(,,,,,x,,)
            this.numberOfArrayElements = oppositeEndianess ? this.switchEndainness(header[ 9]) : header[ 9]; // used for texture arrays
            this.numberOfFaces         = oppositeEndianess ? this.switchEndainness(header[10]) : header[10]; // used for cubemap textures, should either be 1 or 6
            this.numberOfMipmapLevels  = oppositeEndianess ? this.switchEndainness(header[11]) : header[11]; // number of levels; disregard possibility of 0 for compressed textures
            this.bytesOfKeyValueData   = oppositeEndianess ? this.switchEndainness(header[12]) : header[12]; // the amount of space after the header for meta-data
            
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
        
        // not as fast hardware based, but will probably never need to use
        public switchEndainness(val : number) : number {
            return ((val & 0xFF) << 24)
                 | ((val & 0xFF00) << 8)
                 | ((val >> 8) & 0xFF00)
                 | ((val >> 24) & 0xFF);            
        }
        
        /**
         * It is assumed that the texture has already been created & is currently bound
         */
        public uploadLevels(gl: WebGLRenderingContext, loadMipmaps: boolean) : void {
            switch (this.loadType){
                case KhronosTextureContainer.COMPRESSED_2D:
                    this._upload2DCompressedLevels(gl, loadMipmaps);
                    break;
                    
                case KhronosTextureContainer.TEX_2D:
                case KhronosTextureContainer.COMPRESSED_3D:
                case KhronosTextureContainer.TEX_3D:
            }
        }
        
        private _upload2DCompressedLevels(gl: WebGLRenderingContext, loadMipmaps: boolean): void {
            // initialize width & height for level 1
            var dataOffset = KhronosTextureContainer.HEADER_LEN + this.bytesOfKeyValueData;
            var width = this.pixelWidth;
            var height = this.pixelHeight;
            
            var mipmapCount = loadMipmaps ? this.numberOfMipmapLevels : 1;
            for (var level = 0; level < mipmapCount; level++) {
                var imageSize = new Int32Array(this.arrayBuffer, dataOffset, 1)[0]; // size per face, since not supporting array cubemaps
                
                for (var face = 0; face < this.numberOfFaces; face++) {
                    var sampler = this.numberOfFaces === 1 ? gl.TEXTURE_2D : (gl.TEXTURE_CUBE_MAP_POSITIVE_X + face);
                    var byteArray = new Uint8Array(this.arrayBuffer, dataOffset + 4, imageSize);
                    gl.compressedTexImage2D(sampler, level, this.glInternalFormat, width, height, 0, byteArray);

                    dataOffset += imageSize + 4; // size of the image + 4 for the imageSize field
                    dataOffset += 3 - ((imageSize + 3) % 4); // add padding for odd sized image
                }
                width = Math.max(1.0, width * 0.5);
                height = Math.max(1.0, height * 0.5);
            }
        }
    }
} 