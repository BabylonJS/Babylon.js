import { useCallback, useRef, useState, type FunctionComponent } from "react";

import { type Scene, type IDisposable } from "core/scene";
import { SmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { OverrideManager } from "core/SmartAssets/overrideManager";
import { serializeProject, loadProjectAsync } from "core/SmartAssets/projectSerializer";
import { Tools } from "core/Misc/tools";

import { type ServiceDefinition } from "../../../modularity/serviceDefinition";
import { type IToolsService, ToolsServiceIdentity } from "../toolsService";

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
        sam.onAssetNotFound = _inspectorAssetNotFoundHandler;

        // Look for existing OverrideManager in scene metadata
        let overrides = scene.metadata?.["babylonjs:overrideManager"] as OverrideManager | undefined;
        if (!overrides) {
            overrides = new OverrideManager(scene);
            overrides.linkSmartAssetManager(sam);
            if (!scene.metadata) {
                scene.metadata = {};
            }
            Object.defineProperty(scene.metadata, "babylonjs:overrideManager", {
                value: overrides,
                enumerable: false,
                configurable: true,
                writable: true,
            });
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

/**
 * Default Inspector handler for missing assets — shows a centered overlay
 * message and opens a file picker so the user can locate the file.
 * @param key - The smart asset key that was not found.
 * @param expectedUrl - The URL that failed to load.
 * @returns A promise resolving to a new URL, File, or null to skip.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
async function _inspectorAssetNotFoundHandler(key: string, expectedUrl: string): Promise<string | File | null> {
    return await new Promise<string | File | null>((resolve) => {
        const shortUrl = expectedUrl.length > 60 ? "…" + expectedUrl.slice(-50) : expectedUrl;

        const overlay = document.createElement("div");
        overlay.style.cssText =
            "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);" + "display:flex;align-items:center;justify-content:center;z-index:10000;";

        const dialog = document.createElement("div");
        dialog.style.cssText =
            "background:#2d2d2d;color:#eee;padding:24px 32px;border-radius:8px;" + "font:14px sans-serif;max-width:500px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.6);";
        dialog.innerHTML =
            `<div style="font-size:16px;font-weight:bold;margin-bottom:8px;">Asset not found</div>` +
            `<div style="margin-bottom:4px;">Key: <b>${key}</b></div>` +
            `<div style="margin-bottom:16px;opacity:0.6;font-size:12px;word-break:break-all;">${shortUrl}</div>` +
            `<div style="margin-bottom:16px;">Locate the file or click Skip to continue without it.</div>`;

        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display:flex;gap:12px;justify-content:center;";

        const locateBtn = document.createElement("button");
        locateBtn.textContent = "Locate File…";
        locateBtn.style.cssText = "padding:8px 20px;background:#0078d4;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;";

        const skipBtn = document.createElement("button");
        skipBtn.textContent = "Skip";
        skipBtn.style.cssText = "padding:8px 20px;background:#444;color:#ccc;border:none;border-radius:4px;cursor:pointer;font-size:13px;";

        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".glb,.gltf,.babylon,.obj,.png,.jpg,.jpeg,.env,.hdr,.dds,.ktx,.ktx2";
        input.style.display = "none";

        locateBtn.onclick = () => input.click();
        skipBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(null);
        };

        input.onchange = () => {
            document.body.removeChild(overlay);
            const file = input.files?.[0] ?? null;
            resolve(file);
        };

        btnRow.appendChild(locateBtn);
        btnRow.appendChild(skipBtn);
        dialog.appendChild(btnRow);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    });
}
