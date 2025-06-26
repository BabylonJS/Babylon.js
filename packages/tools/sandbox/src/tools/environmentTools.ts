import { HDRCubeTexture } from "core/Materials/Textures/hdrCubeTexture";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import type { Scene } from "core/scene";
import { LocalStorageHelper } from "./localStorageHelper";
import type { GlobalState } from "../globalState";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { EngineStore } from "core/Engines/engineStore";
import type { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";

export class EnvironmentTools {
    public static SkyboxPath = "";
    public static Skyboxes = [
        "https://assets.babylonjs.com/environments/sanGiuseppeBridge.env",
        "https://assets.babylonjs.com/environments/ulmerMuenster.env",
        "https://assets.babylonjs.com/environments/studio.env",
    ];

    public static SkyboxesNames = ["Default", "Plaza", "Studio"];

    public static SkyboxesRotation = [5.54, 1.9, 0];

    public static LoadSkyboxPathTexture(scene: Scene) {
        let path = this.SkyboxPath;
        let rotationY = 0;

        if (path.length === 0) {
            const defaultSkyboxIndex = Math.max(0, LocalStorageHelper.ReadLocalStorageValue("defaultSkyboxId", 0));
            path = this.Skyboxes[defaultSkyboxIndex];
            rotationY = this.SkyboxesRotation[defaultSkyboxIndex];
        }

        if (path.indexOf(".hdr") === path.length - 4) {
            return new HDRCubeTexture(path, scene, 256, false, true, false, true, undefined, undefined, undefined, true, true);
        }

        const envTexture = CubeTexture.CreateFromPrefilteredData(path, scene);
        envTexture.rotationY = rotationY;
        return envTexture;
    }

    public static GetActiveSkyboxName() {
        const defaultSkyboxIndex = Math.max(0, LocalStorageHelper.ReadLocalStorageValue("defaultSkyboxId", 0));
        return this.SkyboxesNames[defaultSkyboxIndex];
    }

    public static ResetEnvironmentTexture() {
        const currentScene = EngineStore.LastCreatedScene!;
        if (!currentScene) {
            return;
        }

        if (currentScene.environmentTexture) {
            currentScene.environmentTexture.dispose();
        }

        currentScene.environmentTexture = this.LoadSkyboxPathTexture(currentScene);
        for (let i = 0; i < currentScene.materials.length; i++) {
            const material = currentScene.materials[i] as StandardMaterial | PBRMaterial | OpenPBRMaterial;
            if (material.name === "skyBox") {
                const reflectionTexture = material.reflectionTexture;
                if (reflectionTexture && reflectionTexture.coordinatesMode === Texture.SKYBOX_MODE) {
                    if (material.reflectionTexture) {
                        material.reflectionTexture.dispose();
                    }

                    if (currentScene.environmentTexture) {
                        material.reflectionTexture = currentScene.environmentTexture.clone();
                        if (material.reflectionTexture) {
                            material.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
                        }
                    }
                }
            }
        }
    }

    public static HookWithEnvironmentChange(globalState: GlobalState) {
        globalState.onEnvironmentChanged.add((option) => {
            this.SkyboxPath = "";
            const index = EnvironmentTools.SkyboxesNames.indexOf(option);

            if (typeof Storage !== "undefined") {
                localStorage.setItem("defaultSkyboxId", index.toString());
            }

            this.ResetEnvironmentTexture();
        });
    }
}
