/* eslint-disable import/no-internal-modules */
import * as React from "react";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SceneSerializer } from "core/Misc/sceneSerializer";
import { Tools } from "core/Misc/tools";
import { EnvironmentTextureTools } from "core/Misc/environmentTextureTools";
import type { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Logger } from "core/Misc/logger";
import { useCallback, useState } from "react";
import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import type { Node } from "core/node";
import { Mesh } from "core/Meshes/mesh";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import type { BackgroundMaterial } from "core/Materials/Background/backgroundMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { Camera } from "core/Cameras/camera";
import { Light } from "core/Lights/light";
import { Text } from "@fluentui/react-components";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

// NOTE: Only importing types from serializers package, which is a dev dependency
import type { GLTF2Export } from "serializers/glTF/2.0/glTFSerializer";
import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";

const EnvExportImageTypes = [
    { label: "PNG", value: 0, imageType: "image/png" },
    { label: "WebP", value: 1, imageType: "image/webp" },
];

interface IBabylonExportOptionsState {
    imageTypeIndex: number;
    imageQuality: number;
    iblDiffuse: boolean;
}

export const ExportBabylonProperties: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
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
                            onChange={(value: boolean) => {
                                setBabylonExportOptions((prev) => ({ ...prev, iblDiffuse: value }));
                            }}
                        />
                    )}
                    <NumberDropdownPropertyLine
                        label="Image type"
                        options={EnvExportImageTypes}
                        value={babylonExportOptions.imageTypeIndex}
                        onChange={(val) => {
                            setBabylonExportOptions((prev) => ({ ...prev, imageTypeIndex: val as number }));
                        }}
                    />
                    {babylonExportOptions.imageTypeIndex > 0 && (
                        <SyncedSliderPropertyLine
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

interface IGltfExportOptionsState {
    exportDisabledNodes: boolean;
    exportSkyboxes: boolean;
    exportCameras: boolean;
    exportLights: boolean;
}

export const ExportGltfProperties = MakeLazyComponent(async () => {
    // Defer importing anything from the gui package until this component is actually mounted.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { GLTF2Export } = await import("serializers/glTF/2.0/glTFSerializer");

    return (props: { scene: Scene }) => {
        const [isExportingGltf, setIsExportingGltf] = useState(false);
        const [gltfExportOptions, setGltfExportOptions] = useState<IGltfExportOptionsState>({
            exportDisabledNodes: false,
            exportSkyboxes: false,
            exportCameras: false,
            exportLights: false,
        });

        const exportGLTF = useCallback(async () => {
            setIsExportingGltf(true);

            const shouldExport = (node: Node): boolean => {
                if (!gltfExportOptions.exportDisabledNodes) {
                    if (!node.isEnabled()) {
                        return false;
                    }
                }

                if (!gltfExportOptions.exportSkyboxes) {
                    if (node instanceof Mesh) {
                        if (node.material) {
                            const material = node.material as PBRMaterial | StandardMaterial | BackgroundMaterial;
                            const reflectionTexture = material.reflectionTexture;
                            if (reflectionTexture && reflectionTexture.coordinatesMode === Texture.SKYBOX_MODE) {
                                return false;
                            }
                        }
                    }
                }

                if (!gltfExportOptions.exportCameras) {
                    if (node instanceof Camera) {
                        return false;
                    }
                }

                if (!gltfExportOptions.exportLights) {
                    if (node instanceof Light) {
                        return false;
                    }
                }

                return true;
            };

            try {
                const glb = await GLTF2Export.GLBAsync(props.scene, "scene", { shouldExportNode: (node) => shouldExport(node) });
                glb.downloadFiles();
            } catch (reason) {
                Logger.Error(`Failed to export GLB: ${reason}`);
            } finally {
                setIsExportingGltf(false);
            }
        }, [gltfExportOptions, props.scene]);

        return (
            <>
                {isExportingGltf && <Text title="Please wait..exporting" />}
                {!isExportingGltf && (
                    <>
                        <SwitchPropertyLine
                            key="GLTFExportDisabledNodes"
                            label="Export Disabled Nodes"
                            description="Whether to export nodes that are disabled in the scene."
                            value={gltfExportOptions.exportDisabledNodes}
                            onChange={(checked: boolean) => setGltfExportOptions({ ...gltfExportOptions, exportDisabledNodes: checked })}
                        />
                        <SwitchPropertyLine
                            key="GLTFExportSkyboxes"
                            label="Export Skyboxes"
                            description="Whether to export skybox nodes in the scene."
                            value={gltfExportOptions.exportSkyboxes}
                            onChange={(checked: boolean) => setGltfExportOptions({ ...gltfExportOptions, exportSkyboxes: checked })}
                        />
                        <SwitchPropertyLine
                            key="GLTFExportCameras"
                            label="Export Cameras"
                            description="Whether to export cameras in the scene."
                            value={gltfExportOptions.exportCameras}
                            onChange={(checked: boolean) => setGltfExportOptions({ ...gltfExportOptions, exportCameras: checked })}
                        />
                        <SwitchPropertyLine
                            key="GLTFExportLights"
                            label="Export Lights"
                            description="Whether to export lights in the scene."
                            value={gltfExportOptions.exportLights}
                            onChange={(checked: boolean) => setGltfExportOptions({ ...gltfExportOptions, exportLights: checked })}
                        />
                    </>
                )}
                {!isExportingGltf && <ButtonLine label="Export to GLB" onClick={exportGLTF} />}
            </>
        );
    };
});
