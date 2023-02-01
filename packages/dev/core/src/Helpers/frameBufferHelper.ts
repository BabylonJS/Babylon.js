
import { Engine, RenderTargetTexture, RenderTargetWrapper, Scene } from "..";


 function copyFramebufferToTexture(engine: Engine, scene: Scene) {
        // Create a render target texture
        let texture = new RenderTargetTexture("framebufferTexture", {
          width: engine.getRenderWidth(),
          height: engine.getRenderHeight()
        }, scene, false, false, Engine.TEXTURETYPE_UNSIGNED_INT);

        // Set the render target textu(as the )current render target
        engine.bindFramebuffer(<RenderTargetWrapper>texture.renderTarget);
      
        // Render the scene to the texture
        scene.render();
      
        // Unbind the framebuffer
        engine.unBindFramebuffer(<RenderTargetWrapper>texture.renderTarget);
      
        return texture;
}

export { copyFramebufferToTexture }