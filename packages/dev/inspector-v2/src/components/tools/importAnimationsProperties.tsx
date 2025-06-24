import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { useState } from "react";
import type { Scene } from "core/scene";
import { ImportAnimationsAsync, SceneLoaderAnimationGroupLoadingMode } from "core/Loading/sceneLoader";
import { FilesInput } from "core/Misc/filesInput";
import { Logger } from "core/Misc";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
// import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";

interface IImportAnimationPropertiesProps {
    scene: Scene;
}

export const ImportAnimationsProperties = ({ scene }: IImportAnimationPropertiesProps) => {
    const [importDefaults, setImportDefaults] = useState({
        overwriteAnimations: true,
        animationGroupLoadingMode: SceneLoaderAnimationGroupLoadingMode.Clean,
    });

    // const animationGroupLoadingModes = [
    //     { label: "Clean", value: SceneLoaderAnimationGroupLoadingMode.Clean },
    //     { label: "Stop", value: SceneLoaderAnimationGroupLoadingMode.Stop },
    //     { label: "Sync", value: SceneLoaderAnimationGroupLoadingMode.Sync },
    //     { label: "NoSync", value: SceneLoaderAnimationGroupLoadingMode.NoSync },
    // ];

    const importAnimations = (event: any) => {
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

        const filesInputAnimation = new FilesInput(
            scene.getEngine() as any,
            scene as any,
            () => {},
            () => {},
            () => {},
            () => {},
            () => {},
            reloadAsync,
            () => {}
        );

        filesInputAnimation.loadFiles(event);
    };

    return (
        <>
            <FileButtonLine label="Import animations" accept="gltf" onClick={(evt: any) => importAnimations(evt)} />
            <SwitchPropertyLine
                label="Overwrite animations"
                value={importDefaults.overwriteAnimations}
                onChange={(value) => {
                    setImportDefaults({ ...importDefaults, overwriteAnimations: value });
                }}
            />
            {importDefaults.overwriteAnimations === false &&
                {
                    /* <OptionsLine
                        label="Animation merge mode"
                        options={animationGroupLoadingModes}
                        target={importDefaults}
                        propertyName="animationGroupLoadingMode"
                        onSelect={(val) => {
                            setImportDefaults({ ...importDefaults, animationGroupLoadingMode: value });
                        }}
                    /> */
                }}
        </>
    );
};
