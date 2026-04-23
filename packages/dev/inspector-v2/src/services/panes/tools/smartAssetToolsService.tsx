import { useCallback, useRef, useState, type FunctionComponent } from "react";

import { type Scene, type IDisposable } from "core/scene";
import { SerializeProject, LoadProjectAsync } from "core/SmartAssets/projectSerializer";
import { Tools } from "core/Misc/tools";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IToolsService, ToolsServiceIdentity } from "../toolsService";

import { getOrCreateManagers } from "../../smartAssetHandler";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { makeStyles, tokens } from "@fluentui/react-components";
import { ArrowDownloadRegular, ArrowUploadRegular, DocumentTextRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
    statusMessage: {
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
        fontSize: "11px",
        opacity: 0.7,
    },
});

/**
 * Inspector Tools service that adds Save/Load Project buttons for the
 * SmartAsset + Override system. Only shows when a SmartAssetManager is
 * present on the scene.
 */
export const SmartAssetToolsServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Smart Asset Tools",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const contentRegistrations: IDisposable[] = [];

        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Smart Asset Project",
                section: "Smart Asset Project",
                component: (props: { context: Scene }) => <SmartAssetProjectTools scene={props.context} />,
            })
        );

        return {
            dispose: () => {
                contentRegistrations.forEach((r) => r.dispose());
            },
        };
    },
};

const SmartAssetProjectTools: FunctionComponent<{ scene: Scene }> = (props: { scene: Scene }) => {
    const scene = props.scene;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [statusMessage, setStatusMessage] = useState<string>("");
    const styles = useStyles();

    const managers = useCallback(() => getOrCreateManagers(scene), [scene]);

    const onSaveProject = useCallback(() => {
        const { sam, overrides } = managers();
        const project = SerializeProject(sam, overrides);
        const json = JSON.stringify(project, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        Tools.Download(blob, "project.json");
        setStatusMessage(`Saved: ${Object.keys(project.assets).length} assets, ${project.overrides.length} overrides`);
    }, [managers]);

    const onLoadProject = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const onFileSelected = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) {
                return;
            }

            try {
                const { sam, overrides } = managers();
                await LoadProjectAsync(file, sam, overrides);
                setStatusMessage(`Loaded: ${sam.getAll().size} assets, ${overrides.getOverrides().length} overrides`);
            } catch (err) {
                setStatusMessage(`Error: ${err}`);
            }

            // Reset file input so the same file can be loaded again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
        [managers]
    );

    const onShowProjectJson = useCallback(() => {
        const { sam, overrides } = managers();
        SerializeProject(sam, overrides);
        setStatusMessage("Project JSON logged to console");
    }, [managers]);

    return (
        <>
            <ButtonLine label="Save Project" icon={ArrowDownloadRegular} onClick={onSaveProject} />
            <ButtonLine label="Load Project" icon={ArrowUploadRegular} onClick={onLoadProject} />
            <ButtonLine label="Log Project to Console" icon={DocumentTextRegular} onClick={onShowProjectJson} />
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={onFileSelected} />
            {statusMessage && <div className={styles.statusMessage}>{statusMessage}</div>}
        </>
    );
};
