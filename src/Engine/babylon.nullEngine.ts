module BABYLON {
   
    /**
     * The null engine class provides support for headless version of babylon.js.
     * This can be used in server side scenario or for testing purposes
     */
    export class NullEngine extends Engine {     
        public constructor() {
            super(null);

            // Init caps
            // We consider we are on a webgl1 capable device

            this._caps = new EngineCapabilities();
            this._caps.maxTexturesImageUnits = 16;
            this._caps.maxVertexTextureImageUnits = 16;
            this._caps.maxTextureSize = 512;
            this._caps.maxCubemapTextureSize = 512;
            this._caps.maxRenderTextureSize = 512;
            this._caps.maxVertexAttribs = 16;
            this._caps.maxVaryingVectors = 16;
            this._caps.maxFragmentUniformVectors = 16;
            this._caps.maxVertexUniformVectors = 16;

            // Extensions
            this._caps.standardDerivatives = false;

            this._caps.astc = null;
            this._caps.s3tc = null;
            this._caps.pvrtc = null;
            this._caps.etc1 = null;
            this._caps.etc2 = null;

            this._caps.textureAnisotropicFilterExtension = null;
            this._caps.maxAnisotropy = 0;
            this._caps.uintIndices = false;
            this._caps.fragmentDepthSupported = false;
            this._caps.highPrecisionShaderSupported = true;

            this._caps.colorBufferFloat = false;
            this._caps.textureFloat = false;
            this._caps.textureFloatLinearFiltering = false;
            this._caps.textureFloatRender = false;

            this._caps.textureHalfFloat = false;
            this._caps.textureHalfFloatLinearFiltering = false;
            this._caps.textureHalfFloatRender = false;

            this._caps.textureLOD = false;
            this._caps.drawBuffersExtension = false;

            this._caps.depthTextureExtension = false;
            this._caps.vertexArrayObject = false;
            this._caps.instancedArrays = false;
        }
    }
}
