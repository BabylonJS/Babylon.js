import { useCallback, useState, type FunctionComponent } from "react";

import { type Scene, type IDisposable } from "core/scene";
import { SerializeProject } from "core/SmartAssets/projectSerializer";
import { GetOverrides } from "core/SmartAssets/overrideManager";
import { GetAllSmartAssets } from "core/SmartAssets/smartAssetManager";
import { Tools } from "core/Misc/tools";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IToolsService, ToolsServiceIdentity } from "../toolsService";

import { getOrCreateManagers } from "../../smartAssetHandler";
import { saveProjectBundleAsync, loadProjectBundleAsync } from "./projectBundleIO";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { makeStyles, tokens } from "@fluentui/react-components";
import { ArrowDownloadRegular, DocumentTextRegular } from "@fluentui/react-icons";

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
    const [statusMessage, setStatusMessage] = useState<string>("");
    const styles = useStyles();

    const managers = useCallback(() => getOrCreateManagers(scene), [scene]);

    const onSaveProject = useCallback(async () => {
        try {
            const { sam, overrides } = managers();
            const zipBlob = await saveProjectBundleAsync(sam, overrides);
            Tools.Download(zipBlob, "project.zip");

            const bundle = SerializeProject(sam, overrides);
            const assetCount = Object.keys(bundle.project.assets).length;
            const overrideCount = bundle.project.overrides.length;
            setStatusMessage(`Saved: ${assetCount} assets, ${overrideCount} overrides`);
        } catch (err) {
            setStatusMessage(`Save error: ${err}`);
        }
    }, [managers]);

    const onLoadProject = useCallback(
        async (files: FileList) => {
            const file = files[0];
            if (!file) {
                return;
            }

            try {
                const { sam, overrides } = managers();
                await loadProjectBundleAsync(file, sam, overrides);
                setStatusMessage(`Loaded: ${GetAllSmartAssets(sam).size} assets, ${GetOverrides(overrides).length} overrides`);
            } catch (err) {
                setStatusMessage(`Load error: ${err}`);
            }
        },
        [managers]
    );

    const onShowProjectJson = useCallback(() => {
        const { sam, overrides } = managers();
        const bundle = SerializeProject(sam, overrides);
        // eslint-disable-next-line no-console
        console.log("Project bundle:", bundle);
        setStatusMessage("Project bundle logged to console");
    }, [managers]);

    return (
        <>
            <ButtonLine label="Save Project" icon={ArrowDownloadRegular} onClick={onSaveProject} />
            <FileUploadLine label="Load Project" accept=".zip" onClick={onLoadProject} />
            <ButtonLine label="Log Project to Console" icon={DocumentTextRegular} onClick={onShowProjectJson} />
            {statusMessage && <div className={styles.statusMessage}>{statusMessage}</div>}
        </>
    );
};
