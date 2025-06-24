/* eslint-disable import/no-internal-modules */
import * as React from "react";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { SceneSerializer } from "core/Misc/sceneSerializer";
import { Tools } from "core/Misc/tools";
import { EnvironmentTextureTools } from "core/Misc/environmentTextureTools";
import type { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Logger } from "core/Misc/logger";
import { useCallback } from "react";
import type { Scene } from "core/scene";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { SyncedSliderLine } from "shared-ui-components/fluent/hoc/syncedSliderLine";

const EnvExportImageTypes = [
    { label: "PNG", value: 0, imageType: "image/png" },
    { label: "WebP", value: 1, imageType: "image/webp" },
];

interface IBabylonExportOptionsState {
    imageTypeIndex: number;
    imageQuality: number;
    iblDiffuse: boolean;
}

interface IExportBabylonPropertiesProps {
    scene: Scene;
}

export const ExportBabylonProperties = ({ scene }: IExportBabylonPropertiesProps) => {
    const [babylonExportOptions, setBabylonExportOptions] = React.useState<IBabylonExportOptionsState>({
        imageTypeIndex: 0,
        imageQuality: 0.8,
        iblDiffuse: false,
    });

    const exportBabylon = useCallback(async () => {
        const strScene = JSON.stringify(SceneSerializer.Serialize(scene));
        const blob = new Blob([strScene], { type: "octet/stream" });
        Tools.Download(blob, "scene.babylon");
    }, [scene]);

    const createEnvTexture = useCallback(async () => {
        if (!scene.environmentTexture) {
            return;
        }

        try {
            const buffer = await EnvironmentTextureTools.CreateEnvTextureAsync(scene.environmentTexture as CubeTexture, {
                imageType: EnvExportImageTypes[babylonExportOptions.imageTypeIndex].imageType,
                imageQuality: babylonExportOptions.imageQuality,
                disableIrradianceTexture: !babylonExportOptions.iblDiffuse,
            });
            const blob = new Blob([buffer], { type: "octet/stream" });
            Tools.Download(blob, "environment.env");
        } catch (error: any) {
            Logger.Error(error);
            alert(error);
        }
    }, [scene, babylonExportOptions]);

    return (
        <>
            <ButtonLine label="Export to Babylon" onClick={exportBabylon} />
            {!scene.getEngine().premultipliedAlpha && scene.environmentTexture && scene.environmentTexture._prefiltered && scene.activeCamera && (
                <>
                    <ButtonLine label="Generate .env texture" onClick={createEnvTexture} />
                    {scene.environmentTexture.irradianceTexture && (
                        <SwitchPropertyLine
                            key="iblDiffuse"
                            label="Diffuse Texture"
                            description="Export diffuse texture for IBL"
                            value={babylonExportOptions.iblDiffuse}
                            onChange={(value) => {
                                setBabylonExportOptions((prev) => ({ ...prev, iblDiffuse: value }));
                            }}
                        />
                    )}
                    {/* <OptionsLine
                        label="Image type"
                        options={EnvExportImageTypes}
                        target={babylonExportOptions}
                        propertyName="imageTypeIndex"
                        onSelect={(val) => {
                            setBabylonExportOptions((prev) => ({ ...prev, imageTypeIndex: val as number }));
                        }}
                    /> */}
                    {babylonExportOptions.imageTypeIndex > 0 && (
                        <SyncedSliderLine
                            label="Quality"
                            value={babylonExportOptions.imageQuality}
                            onChange={(value) => setBabylonExportOptions((prev) => ({ ...prev, imageQuality: value }))}
                            min={0}
                            max={1}
                        />
                    )}
                </>
            )}
        </>
    );
};
