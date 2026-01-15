import { useState } from "react";
import type { FunctionComponent } from "react";
import type { Scene } from "core/scene";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { ImportAnimationsAsync, SceneLoaderAnimationGroupLoadingMode } from "core/Loading/sceneLoader";
import { FilesInput } from "core/Misc/filesInput";
import { Logger } from "core/Misc/logger";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";

const AnimationGroupLoadingModes = [
    { label: "Clean", value: SceneLoaderAnimationGroupLoadingMode.Clean },
    { label: "Stop", value: SceneLoaderAnimationGroupLoadingMode.Stop },
    { label: "Sync", value: SceneLoaderAnimationGroupLoadingMode.Sync },
    { label: "NoSync", value: SceneLoaderAnimationGroupLoadingMode.NoSync },
] as const satisfies DropdownOption<number>[];

export const GLTFAnimationImportTool: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
    const [importDefaults, setImportDefaults] = useState({
        overwriteAnimations: true,
        animationGroupLoadingMode: SceneLoaderAnimationGroupLoadingMode.Clean,
    });

    const importAnimations = (event: FileList) => {
        const reloadAsync = async function (sceneFile: File) {
            if (sceneFile) {
                try {
                    await ImportAnimationsAsync(sceneFile, scene, {
                        overwriteAnimations: importDefaults.overwriteAnimations,
                        animationGroupLoadingMode: importDefaults.animationGroupLoadingMode,
                    });

                    if (scene.animationGroups.length > 0) {
                        const currentGroup = scene.animationGroups[0];
                        currentGroup.play(true);
                    }
                } catch (error) {
                    Logger.Error(`Error importing animations: ${error}`);
                }
            }
        };

        const filesInputAnimation = new FilesInput(scene.getEngine(), scene, null, null, null, null, null, reloadAsync, null);
        filesInputAnimation.loadFiles(event);
        filesInputAnimation.dispose();
    };

    return (
        <>
            <FileUploadLine label="Import Animations" accept="gltf" onClick={(evt: FileList) => importAnimations(evt)} />
            <SwitchPropertyLine
                label="Overwrite Animations"
                value={importDefaults.overwriteAnimations}
                onChange={(value) => {
                    setImportDefaults({ ...importDefaults, overwriteAnimations: value });
                }}
            />
            <Collapse visible={!importDefaults.overwriteAnimations}>
                <NumberDropdownPropertyLine
                    label="Animation Merge Mode"
                    options={AnimationGroupLoadingModes}
                    value={importDefaults.animationGroupLoadingMode}
                    onChange={(value) => {
                        setImportDefaults({ ...importDefaults, animationGroupLoadingMode: value });
                    }}
                />
            </Collapse>
        </>
    );
};
