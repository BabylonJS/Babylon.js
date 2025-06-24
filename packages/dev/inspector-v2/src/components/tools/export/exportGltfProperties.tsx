import type { Scene } from "core/scene";
import { useCallback, useState } from "react";
import type { Node } from "core/node";
import { Mesh } from "core/Meshes/mesh";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import type { BackgroundMaterial } from "core/Materials/Background/backgroundMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { Camera } from "core/Cameras/camera";
import { Light } from "core/Lights/light";
import { Logger } from "core/Misc/logger";
import { Text } from "@fluentui/react-components";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";

// NOTE: At top level, only import types from serializers package, as it is a dev dependency
import type { GLTF2Export } from "serializers/glTF/2.0/glTFSerializer";

interface IGltfExportOptionsState {
    exportDisabledNodes: boolean;
    exportSkyboxes: boolean;
    exportCameras: boolean;
    exportLights: boolean;
}

interface IExportGltfPropertiesProps {
    scene: Scene;
    exporterClass: typeof GLTF2Export;
}

export const ExportGltfProperties = ({ scene, exporterClass }: IExportGltfPropertiesProps) => {
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
            const glb = await exporterClass.GLBAsync(scene, "scene", { shouldExportNode: (node) => shouldExport(node) });
            glb.downloadFiles();
        } catch (reason) {
            Logger.Error(`Failed to export GLB: ${reason}`);
        } finally {
            setIsExportingGltf(false);
        }
    }, [gltfExportOptions, scene]);

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
                        onChange={(checked) => setGltfExportOptions({ ...gltfExportOptions, exportDisabledNodes: checked })}
                    />
                    <SwitchPropertyLine
                        key="GLTFExportSkyboxes"
                        label="Export Skyboxes"
                        description="Whether to export skybox nodes in the scene."
                        value={gltfExportOptions.exportSkyboxes}
                        onChange={(checked) => setGltfExportOptions({ ...gltfExportOptions, exportSkyboxes: checked })}
                    />
                    <SwitchPropertyLine
                        key="GLTFExportCameras"
                        label="Export Cameras"
                        description="Whether to export cameras in the scene."
                        value={gltfExportOptions.exportCameras}
                        onChange={(checked) => setGltfExportOptions({ ...gltfExportOptions, exportCameras: checked })}
                    />
                    <SwitchPropertyLine
                        key="GLTFExportLights"
                        label="Export Lights"
                        description="Whether to export lights in the scene."
                        value={gltfExportOptions.exportLights}
                        onChange={(checked) => setGltfExportOptions({ ...gltfExportOptions, exportLights: checked })}
                    />
                </>
            )}
            {!isExportingGltf && <ButtonLine label="Export to GLB" onClick={exportGLTF} />}
        </>
    );
};
