import { useCallback, useRef, useState, type FunctionComponent } from "react";

import { type Scene, type IDisposable } from "core/scene";
import { SmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { OverrideManager } from "core/SmartAssets/overrideManager";
import { serializeProject, loadProjectAsync } from "core/SmartAssets/projectSerializer";
import { Tools } from "core/Misc/tools";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IToolsService, ToolsServiceIdentity } from "../toolsService";

import { inspectorAssetNotFoundHandler } from "../../smartAssetHandler";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { ArrowDownloadRegular, ArrowUploadRegular, DocumentTextRegular } from "@fluentui/react-icons";

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

    const getOrCreateManagers = useCallback(() => {
        let sam = SmartAssetManager.GetFromScene(scene);
        if (!sam) {
            sam = new SmartAssetManager(scene);
        }

        // Install Inspector's file picker handler — always override any existing
        // handler so Inspector provides a consistent UX for missing assets
        sam.onAssetNotFound = inspectorAssetNotFoundHandler;

        let overrides = OverrideManager.GetFromScene(scene);
        if (!overrides) {
            overrides = new OverrideManager(scene);
            overrides.linkSmartAssetManager(sam);
        }

        return { sam, overrides };
    }, [scene]);

    const onSaveProject = useCallback(() => {
        const { sam, overrides } = getOrCreateManagers();
        const project = serializeProject(sam, overrides);
        const json = JSON.stringify(project, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        Tools.Download(blob, "project.json");
        setStatusMessage(`Saved: ${Object.keys(project.assets).length} assets, ${project.overrides.length} overrides`);
    }, [getOrCreateManagers]);

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
                const { sam, overrides } = getOrCreateManagers();
                await loadProjectAsync(file, sam, overrides);
                setStatusMessage(`Loaded: ${sam.getAll().size} assets, ${overrides.getOverrides().length} overrides`);
            } catch (err) {
                setStatusMessage(`Error: ${err}`);
            }

            // Reset file input so the same file can be loaded again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
        [getOrCreateManagers]
    );

    const onShowProjectJson = useCallback(() => {
        const { sam, overrides } = getOrCreateManagers();
        const project = serializeProject(sam, overrides);
        setStatusMessage("Project JSON logged to console");
    }, [getOrCreateManagers]);

    return (
        <>
            <ButtonLine label="Save Project" icon={ArrowDownloadRegular} onClick={onSaveProject} />
            <ButtonLine label="Load Project" icon={ArrowUploadRegular} onClick={onLoadProject} />
            <ButtonLine label="Log Project to Console" icon={DocumentTextRegular} onClick={onShowProjectJson} />
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={onFileSelected} />
            {statusMessage && <div style={{ padding: "4px 8px", fontSize: "11px", opacity: 0.7 }}>{statusMessage}</div>}
        </>
    );
};
