import { AssetsManager } from "core/Misc/assetsManager";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";

describe("Assets Manager", () => {
    it("should fulfill texture asset task with a texture when using NullEngine", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const assetsManager = new AssetsManager(scene);
        const textureTask = assetsManager.addTextureTask("texture task", "texture.jpg");
        const textureLoadingPromise = new Promise((resolve) => {
            textureTask.onSuccess = (task) => {
                resolve(task.texture);
            };
        });

        await assetsManager.loadAsync();

        await expect(textureLoadingPromise).resolves.toBeInstanceOf(Texture);
    });
});
