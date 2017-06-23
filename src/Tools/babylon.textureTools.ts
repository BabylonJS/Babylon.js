module BABYLON {
    export class TextureTools {
		/**
		 * Uses the GPU to create a copy texture rescaled at a given size
		 * @param texture Texture to copy from
		 * @param width Desired width
		 * @param height Desired height
		 * @return Generated texture
		 */
		public static CreateResizedCopy(texture: BABYLON.Texture, width: number, height: number, useBilinearMode: boolean = true): BABYLON.Texture {
			let rtt = new BABYLON.RenderTargetTexture(
				'resized' + texture.name,
				{ width: width, height: height },
				scene,
				!texture.noMipmap,
				true,
				texture._texture.type,
				false,
				texture._samplingMode,
				false
			);

            var scene = texture.getScene();
			var engine = scene.getEngine();

			rtt.wrapU = texture.wrapU;
			rtt.wrapV = texture.wrapV;
            rtt.uOffset = texture.uOffset;
            rtt.vOffset = texture.vOffset;
            rtt.uScale = texture.uScale;
            rtt.vScale = texture.vScale;
            rtt.uAng = texture.uAng;
            rtt.vAng = texture.vAng;
            rtt.wAng = texture.wAng;
            rtt.coordinatesIndex = texture.coordinatesIndex;
            rtt.level = texture.level;
            rtt.anisotropicFilteringLevel = texture.anisotropicFilteringLevel;
			rtt._texture.isReady = false;

			texture.wrapU = Texture.CLAMP_ADDRESSMODE;
			texture.wrapV = Texture.CLAMP_ADDRESSMODE;

            let passPostProcess = new BABYLON.PassPostProcess("pass", 1, null, useBilinearMode ? Texture.BILINEAR_SAMPLINGMODE : Texture.NEAREST_SAMPLINGMODE, engine, false, Engine.TEXTURETYPE_UNSIGNED_INT);
			passPostProcess.getEffect().executeWhenCompiled(() => {
                passPostProcess.onApply = function (effect) {
                    effect.setTexture("textureSampler", texture);
                }

                scene.postProcessManager.directRender([passPostProcess], rtt.getInternalTexture());

                engine.unBindFramebuffer(rtt.getInternalTexture());
                rtt.disposeFramebufferObjects();
				passPostProcess.dispose();

				rtt._texture.isReady = true;
            });

			return rtt;
		}        
    }
} 
