import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import type { IMultiRenderTargetOptions } from "../../Materials/Textures/multiRenderTarget";
import { Logger } from "../../Misc/logger";
import type { Nullable } from "../../types";
import { Constants } from "../constants";
import { ThinEngine } from "../thinEngine";
import type { RenderTargetWrapper } from "../renderTargetWrapper";
import type { WebGLRenderTargetWrapper } from "../WebGL/webGLRenderTargetWrapper";
import type { WebGLHardwareTexture } from "../WebGL/webGLHardwareTexture";
import type { TextureSize } from "../../Materials/Textures/textureCreationOptions";

declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Unbind a list of render target textures from the webGL context
         * This is used only when drawBuffer extension or webGL2 are active
         * @param rtWrapper defines the render target wrapper to unbind
         * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
         * @param onBeforeUnbind defines a function which will be called before the effective unbind
         */
        unBindMultiColorAttachmentFramebuffer(rtWrapper: RenderTargetWrapper, disableGenerateMipMaps: boolean, onBeforeUnbind?: () => void): void;

        /**
         * Create a multi render target texture
         * @see https://doc.babylonjs.com/setup/support/webGL2#multiple-render-target
         * @param size defines the size of the texture
         * @param options defines the creation options
         * @param initializeBuffers if set to true, the engine will make an initializing call of drawBuffers
         * @returns a new render target wrapper ready to render textures
         */
        createMultipleRenderTarget(size: TextureSize, options: IMultiRenderTargetOptions, initializeBuffers?: boolean): RenderTargetWrapper;

        /**
         * Update the sample count for a given multiple render target texture
         * @see https://doc.babylonjs.com/setup/support/webGL2#multisample-render-targets
         * @param rtWrapper defines the render target wrapper to update
         * @param samples defines the sample count to set
         * @param initializeBuffers if set to true, the engine will make an initializing call of drawBuffers
         * @returns the effective sample count (could be 0 if multisample render targets are not supported)
         */
        updateMultipleRenderTargetTextureSampleCount(rtWrapper: Nullable<RenderTargetWrapper>, samples: number, initializeBuffers?: boolean): number;

        /**
         * Generates mipmaps for the texture of the (multi) render target
         * @param texture The render target containing the textures to generate the mipmaps for
         */
        generateMipMapsMultiFramebuffer(texture: RenderTargetWrapper): void;

        /**
         * Resolves the MSAA textures of the (multi) render target into their non-MSAA version.
         * Note that if "texture" is not a MSAA render target, no resolve is performed.
         * @param texture The render target texture containing the MSAA textures to resolve
         */
        resolveMultiFramebuffer(texture: RenderTargetWrapper): void;

        /**
         * Select a subsets of attachments to draw to.
         * @param attachments gl attachments
         */
        bindAttachments(attachments: number[]): void;

        /**
         * Creates a layout object to draw/clear on specific textures in a MRT
         * @param textureStatus textureStatus[i] indicates if the i-th is active
         * @returns A layout to be fed to the engine, calling `bindAttachments`.
         */
        buildTextureLayout(textureStatus: boolean[]): number[];

        /**
         * Restores the webgl state to only draw on the main color attachment
         * when the frame buffer associated is the canvas frame buffer
         */
        restoreSingleAttachment(): void;

        /**
         * Restores the webgl state to only draw on the main color attachment
         * when the frame buffer associated is not the canvas frame buffer
         */
        restoreSingleAttachmentForRenderTarget(): void;
    }
}

ThinEngine.prototype.restoreSingleAttachment = function (): void {
    const gl = this._gl;

    this.bindAttachments([gl.BACK]);
};

ThinEngine.prototype.restoreSingleAttachmentForRenderTarget = function (): void {
    const gl = this._gl;

    this.bindAttachments([gl.COLOR_ATTACHMENT0]);
};

ThinEngine.prototype.buildTextureLayout = function (textureStatus: boolean[]): number[] {
    const gl = this._gl;

    const result = [];

    for (let i = 0; i < textureStatus.length; i++) {
        if (textureStatus[i]) {
            result.push((<any>gl)["COLOR_ATTACHMENT" + i]);
        } else {
            result.push(gl.NONE);
        }
    }

    return result;
};

ThinEngine.prototype.bindAttachments = function (attachments: number[]): void {
    const gl = this._gl;

    gl.drawBuffers(attachments);
};

ThinEngine.prototype.unBindMultiColorAttachmentFramebuffer = function (
    rtWrapper: WebGLRenderTargetWrapper,
    disableGenerateMipMaps: boolean = false,
    onBeforeUnbind?: () => void
): void {
    this._currentRenderTarget = null;

    if (!rtWrapper.disableAutomaticMSAAResolve) {
        this.resolveMultiFramebuffer(rtWrapper);
    }

    if (!disableGenerateMipMaps) {
        this.generateMipMapsMultiFramebuffer(rtWrapper);
    }

    if (onBeforeUnbind) {
        if (rtWrapper._MSAAFramebuffer) {
            // Bind the correct framebuffer
            this._bindUnboundFramebuffer(rtWrapper._framebuffer);
        }
        onBeforeUnbind();
    }

    this._bindUnboundFramebuffer(null);
};

ThinEngine.prototype.createMultipleRenderTarget = function (size: TextureSize, options: IMultiRenderTargetOptions, initializeBuffers: boolean = true): RenderTargetWrapper {
    let generateMipMaps = false;
    let generateDepthBuffer = true;
    let generateStencilBuffer = false;
    let generateDepthTexture = false;
    let depthTextureFormat: number | undefined = undefined;
    let textureCount = 1;
    let samples = 1;

    const defaultType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
    const defaultSamplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
    const defaultUseSRGBBuffer = false;
    const defaultFormat = Constants.TEXTUREFORMAT_RGBA;
    const defaultTarget = Constants.TEXTURE_2D;

    let types: number[] = [];
    let samplingModes: number[] = [];
    let useSRGBBuffers: boolean[] = [];
    let formats: number[] = [];
    let targets: number[] = [];
    let faceIndex: number[] = [];
    let layerIndex: number[] = [];
    let layers: number[] = [];
    let labels: string[] = [];
    let dontCreateTextures = false;

    const rtWrapper = this._createHardwareRenderTargetWrapper(true, false, size) as WebGLRenderTargetWrapper;

    if (options !== undefined) {
        generateMipMaps = options.generateMipMaps === undefined ? false : options.generateMipMaps;
        generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
        generateStencilBuffer = options.generateStencilBuffer === undefined ? false : options.generateStencilBuffer;
        generateDepthTexture = options.generateDepthTexture === undefined ? false : options.generateDepthTexture;
        textureCount = options.textureCount ?? 1;
        samples = options.samples ?? samples;
        types = options.types || types;
        samplingModes = options.samplingModes || samplingModes;
        useSRGBBuffers = options.useSRGBBuffers || useSRGBBuffers;
        formats = options.formats || formats;
        targets = options.targetTypes || targets;
        faceIndex = options.faceIndex || faceIndex;
        layerIndex = options.layerIndex || layerIndex;
        layers = options.layerCounts || layers;
        labels = options.labels || labels;
        dontCreateTextures = options.dontCreateTextures ?? false;

        if (
            this.webGLVersion > 1 &&
            (options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 ||
                options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 ||
                options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24 ||
                options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH32_FLOAT ||
                options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8)
        ) {
            depthTextureFormat = options.depthTextureFormat;
        }
    }

    if (depthTextureFormat === undefined) {
        depthTextureFormat = generateStencilBuffer ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT;
    }

    const gl = this._gl;
    // Create the framebuffer
    const currentFramebuffer = this._currentFramebuffer;
    const framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);

    const width = (<{ width: number; height: number }>size).width ?? <number>size;
    const height = (<{ width: number; height: number }>size).height ?? <number>size;

    const textures: InternalTexture[] = [];
    const attachments: number[] = [];

    const useStencilTexture =
        this.webGLVersion > 1 &&
        (depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 ||
            depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 ||
            depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8);

    rtWrapper.label = options?.label ?? "MultiRenderTargetWrapper";
    rtWrapper._framebuffer = framebuffer;
    rtWrapper._generateDepthBuffer = generateDepthTexture || generateDepthBuffer;
    rtWrapper._generateStencilBuffer = generateDepthTexture ? useStencilTexture : generateStencilBuffer;
    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(rtWrapper._generateStencilBuffer, rtWrapper._generateDepthBuffer, width, height, 1, depthTextureFormat);
    rtWrapper._attachments = attachments;

    for (let i = 0; i < textureCount; i++) {
        let samplingMode = samplingModes[i] || defaultSamplingMode;
        let type = types[i] || defaultType;
        let useSRGBBuffer = useSRGBBuffers[i] || defaultUseSRGBBuffer;
        const format = formats[i] || defaultFormat;

        const target = targets[i] || defaultTarget;
        const layerCount = layers[i] ?? 1;

        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }

        const filters = this._getSamplingParameters(samplingMode, generateMipMaps);
        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
            Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
        }

        useSRGBBuffer = useSRGBBuffer && this._caps.supportSRGBBuffers && (this.webGLVersion > 1 || this.isWebGPU);

        const isWebGL2 = this.webGLVersion > 1;
        const attachment = (<any>gl)[isWebGL2 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];

        attachments.push(attachment);

        if (target === -1 || dontCreateTextures) {
            continue;
        }

        const texture = new InternalTexture(this, InternalTextureSource.MultiRenderTarget);
        textures[i] = texture;

        gl.activeTexture((<any>gl)["TEXTURE" + i]);
        gl.bindTexture(target, texture._hardwareTexture!.underlyingResource);

        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filters.mag);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filters.min);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const internalSizedFormat = this._getRGBABufferInternalSizedFormat(type, format, useSRGBBuffer);
        const internalFormat = this._getInternalFormat(format);
        const webGLTextureType = this._getWebGLTextureType(type);

        if (isWebGL2 && (target === Constants.TEXTURE_2D_ARRAY || target === Constants.TEXTURE_3D)) {
            if (target === Constants.TEXTURE_2D_ARRAY) {
                texture.is2DArray = true;
            } else {
                texture.is3D = true;
            }

            texture.baseDepth = texture.depth = layerCount;

            gl.texImage3D(target, 0, internalSizedFormat, width, height, layerCount, 0, internalFormat, webGLTextureType, null);
        } else if (target === Constants.TEXTURE_CUBE_MAP) {
            // We have to generate all faces to complete the framebuffer
            for (let i = 0; i < 6; i++) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, internalSizedFormat, width, height, 0, internalFormat, webGLTextureType, null);
            }
            texture.isCube = true;
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, internalSizedFormat, width, height, 0, internalFormat, webGLTextureType, null);
        }

        if (generateMipMaps) {
            gl.generateMipmap(target);
        }

        // Unbind
        this._bindTextureDirectly(target, null);

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.isReady = true;
        texture.samples = 1;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.type = type;
        texture._useSRGBBuffer = useSRGBBuffer;
        texture.format = format;
        texture.label = labels[i] ?? rtWrapper.label + "-Texture" + i;

        this._internalTexturesCache.push(texture);
    }

    if (generateDepthTexture && this._caps.depthTextureExtension && !dontCreateTextures) {
        // Depth texture
        const depthTexture = new InternalTexture(this, InternalTextureSource.Depth);

        let depthTextureType = Constants.TEXTURETYPE_UNSIGNED_SHORT;
        let glDepthTextureInternalFormat: GLenum = gl.DEPTH_COMPONENT16;
        let glDepthTextureFormat: GLenum = gl.DEPTH_COMPONENT;
        let glDepthTextureType: GLenum = gl.UNSIGNED_SHORT;
        let glDepthTextureAttachment: GLenum = gl.DEPTH_ATTACHMENT;
        if (this.webGLVersion < 2) {
            glDepthTextureInternalFormat = gl.DEPTH_COMPONENT;
        } else {
            if (depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH32_FLOAT) {
                depthTextureType = Constants.TEXTURETYPE_FLOAT;
                glDepthTextureType = gl.FLOAT;
                glDepthTextureInternalFormat = gl.DEPTH_COMPONENT32F;
            } else if (depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8) {
                depthTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
                glDepthTextureType = gl.FLOAT_32_UNSIGNED_INT_24_8_REV;
                glDepthTextureInternalFormat = gl.DEPTH32F_STENCIL8;
                glDepthTextureFormat = gl.DEPTH_STENCIL;
                glDepthTextureAttachment = gl.DEPTH_STENCIL_ATTACHMENT;
            } else if (depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24) {
                depthTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
                glDepthTextureType = gl.UNSIGNED_INT;
                glDepthTextureInternalFormat = gl.DEPTH_COMPONENT24;
                glDepthTextureAttachment = gl.DEPTH_ATTACHMENT;
            } else if (depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 || depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8) {
                depthTextureType = Constants.TEXTURETYPE_UNSIGNED_INT_24_8;
                glDepthTextureType = gl.UNSIGNED_INT_24_8;
                glDepthTextureInternalFormat = gl.DEPTH24_STENCIL8;
                glDepthTextureFormat = gl.DEPTH_STENCIL;
                glDepthTextureAttachment = gl.DEPTH_STENCIL_ATTACHMENT;
            }
        }

        this._bindTextureDirectly(gl.TEXTURE_2D, depthTexture, true);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, glDepthTextureInternalFormat, width, height, 0, glDepthTextureFormat, glDepthTextureType, null);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, glDepthTextureAttachment, gl.TEXTURE_2D, depthTexture._hardwareTexture!.underlyingResource, 0);

        this._bindTextureDirectly(gl.TEXTURE_2D, null);

        rtWrapper._depthStencilTexture = depthTexture;
        rtWrapper._depthStencilTextureWithStencil = useStencilTexture;

        depthTexture.baseWidth = width;
        depthTexture.baseHeight = height;
        depthTexture.width = width;
        depthTexture.height = height;
        depthTexture.isReady = true;
        depthTexture.samples = 1;
        depthTexture.generateMipMaps = generateMipMaps;
        depthTexture.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        depthTexture.format = depthTextureFormat;
        depthTexture.type = depthTextureType;
        depthTexture.label = rtWrapper.label + "-DepthStencil";

        textures[textureCount] = depthTexture;
        this._internalTexturesCache.push(depthTexture);
    }
    rtWrapper.setTextures(textures);
    if (initializeBuffers) {
        gl.drawBuffers(attachments);
    }

    this._bindUnboundFramebuffer(currentFramebuffer);

    rtWrapper.setLayerAndFaceIndices(layerIndex, faceIndex);

    this.resetTextureCache();

    if (!dontCreateTextures) {
        this.updateMultipleRenderTargetTextureSampleCount(rtWrapper, samples, initializeBuffers);
    } else if (samples > 1) {
        const framebuffer = gl.createFramebuffer();

        if (!framebuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }

        rtWrapper._samples = samples;
        rtWrapper._MSAAFramebuffer = framebuffer;

        if (textureCount > 0 && initializeBuffers) {
            this._bindUnboundFramebuffer(framebuffer);
            gl.drawBuffers(attachments);
            this._bindUnboundFramebuffer(currentFramebuffer);
        }
    }

    return rtWrapper;
};

ThinEngine.prototype.updateMultipleRenderTargetTextureSampleCount = function (
    rtWrapper: Nullable<WebGLRenderTargetWrapper>,
    samples: number,
    initializeBuffers: boolean = true
): number {
    if (this.webGLVersion < 2 || !rtWrapper) {
        return 1;
    }

    if (rtWrapper.samples === samples) {
        return samples;
    }

    const gl = this._gl;

    samples = Math.min(samples, this.getCaps().maxMSAASamples);

    // Dispose previous render buffers
    if (rtWrapper._depthStencilBuffer) {
        gl.deleteRenderbuffer(rtWrapper._depthStencilBuffer);
        rtWrapper._depthStencilBuffer = null;
    }

    if (rtWrapper._MSAAFramebuffer) {
        gl.deleteFramebuffer(rtWrapper._MSAAFramebuffer);
        rtWrapper._MSAAFramebuffer = null;
    }

    const count = rtWrapper._attachments!.length; // We do it this way instead of rtWrapper.textures.length to avoid taking into account the depth/stencil texture, in case it has been created

    for (let i = 0; i < count; i++) {
        const texture = rtWrapper.textures![i];
        const hardwareTexture = texture._hardwareTexture as Nullable<WebGLHardwareTexture>;

        hardwareTexture?.releaseMSAARenderBuffers();
    }

    if (samples > 1 && typeof gl.renderbufferStorageMultisample === "function") {
        const framebuffer = gl.createFramebuffer();

        if (!framebuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }

        rtWrapper._MSAAFramebuffer = framebuffer;
        this._bindUnboundFramebuffer(framebuffer);

        const attachments = [];

        for (let i = 0; i < count; i++) {
            const texture = rtWrapper.textures![i];
            const hardwareTexture = texture._hardwareTexture as WebGLHardwareTexture;
            const attachment = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];

            const colorRenderbuffer = this._createRenderBuffer(
                texture.width,
                texture.height,
                samples,
                -1 /* not used */,
                this._getRGBABufferInternalSizedFormat(texture.type, texture.format, texture._useSRGBBuffer),
                attachment
            );

            if (!colorRenderbuffer) {
                throw new Error("Unable to create multi sampled framebuffer");
            }

            hardwareTexture.addMSAARenderBuffer(colorRenderbuffer);
            texture.samples = samples;

            attachments.push(attachment);
        }
        if (initializeBuffers) {
            gl.drawBuffers(attachments);
        }
    } else {
        this._bindUnboundFramebuffer(rtWrapper._framebuffer);
    }

    const depthFormat = rtWrapper._depthStencilTexture ? rtWrapper._depthStencilTexture.format : undefined;

    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(
        rtWrapper._generateStencilBuffer,
        rtWrapper._generateDepthBuffer,
        rtWrapper.width,
        rtWrapper.height,
        samples,
        depthFormat
    );

    this._bindUnboundFramebuffer(null);

    rtWrapper._samples = samples;

    return samples;
};

ThinEngine.prototype.generateMipMapsMultiFramebuffer = function (texture: RenderTargetWrapper): void {
    const rtWrapper = texture as WebGLRenderTargetWrapper;
    const gl = this._gl;

    if (!rtWrapper.isMulti) {
        return;
    }

    for (let i = 0; i < rtWrapper._attachments!.length; i++) {
        const texture = rtWrapper.textures![i];
        if (texture?.generateMipMaps && !texture?.isCube && !texture?.is3D) {
            this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);
            gl.generateMipmap(gl.TEXTURE_2D);
            this._bindTextureDirectly(gl.TEXTURE_2D, null);
        }
    }
};

ThinEngine.prototype.resolveMultiFramebuffer = function (texture: RenderTargetWrapper): void {
    const rtWrapper = texture as WebGLRenderTargetWrapper;
    const gl = this._gl;

    if (!rtWrapper._MSAAFramebuffer || !rtWrapper.isMulti) {
        return;
    }

    let bufferBits = rtWrapper.resolveMSAAColors ? gl.COLOR_BUFFER_BIT : 0;
    bufferBits |= rtWrapper._generateDepthBuffer && rtWrapper.resolveMSAADepth ? gl.DEPTH_BUFFER_BIT : 0;
    bufferBits |= rtWrapper._generateStencilBuffer && rtWrapper.resolveMSAAStencil ? gl.STENCIL_BUFFER_BIT : 0;

    const attachments = rtWrapper._attachments!;
    const count = attachments.length;

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rtWrapper._MSAAFramebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, rtWrapper._framebuffer);

    for (let i = 0; i < count; i++) {
        const texture = rtWrapper.textures![i];

        for (let j = 0; j < count; j++) {
            attachments[j] = gl.NONE;
        }

        attachments[i] = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
        gl.readBuffer(attachments[i]);
        gl.drawBuffers(attachments);
        gl.blitFramebuffer(0, 0, texture.width, texture.height, 0, 0, texture.width, texture.height, bufferBits, gl.NEAREST);
    }

    for (let i = 0; i < count; i++) {
        attachments[i] = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
    }

    gl.drawBuffers(attachments);
    gl.bindFramebuffer(this._gl.FRAMEBUFFER, rtWrapper._MSAAFramebuffer);
};
