import { Mesh, Nullable, NullEngine, PBRMaterial, Scene, SceneLoader, StandardMaterial, Texture, TransformNode } from "babylonjs";
import { GLTF2, GLTFFileLoader } from "babylonjs-loaders";
import { GLTF2Export } from "babylonjs-serializers";
import { DetailPanel } from "../details/DetailPanel";
import { Property } from "../details/Property";
import { PropertyLine } from "../details/PropertyLine";
import { Helpers } from "../helpers/Helpers";
import { Inspector } from "../Inspector";
import { Tab } from "./Tab";
import { TabBar } from "./TabBar";

import * as Split from "Split";

import {} from "babylonjs-gltf2interface";

export class GLTFTab extends Tab {
    private static _LoaderDefaults: any = null;
    private static _ValidationResults: Nullable<IGLTFValidationResults> = null;
    private static _OnValidationResultsUpdated: Nullable<(results: IGLTFValidationResults) => void> = null;

    private _inspector: Inspector;
    private _actions: HTMLDivElement;
    private _detailsPanel: Nullable<DetailPanel> = null;
    private _split: any;

    public static get IsSupported(): boolean {
        return !!(SceneLoader && GLTFFileLoader && GLTF2.GLTFLoader) || !!GLTF2Export;
    }

    /** @hidden */
    public static _Initialize(): void {
        // Must register with OnPluginActivatedObservable as early as possible to override the loader defaults.
        SceneLoader.OnPluginActivatedObservable.add((loader: GLTFFileLoader) => {
            if (loader.name === "gltf") {
                GLTFTab._ApplyLoaderDefaults(loader);

                loader.onValidatedObservable.add((results) => {
                    GLTFTab._ValidationResults = results;

                    if (GLTFTab._OnValidationResultsUpdated) {
                        GLTFTab._OnValidationResultsUpdated(results);
                    }
                });
            }
        });
    }

    constructor(tabbar: TabBar, inspector: Inspector) {
        super(tabbar, "GLTF");

        this._inspector = inspector;
        this._panel = Helpers.CreateDiv("tab-panel") as HTMLDivElement;
        this._actions = Helpers.CreateDiv("gltf-actions", this._panel) as HTMLDivElement;
        this._actions.addEventListener("click", (event) => {
            this._closeDetailsPanel();
        });

        if (SceneLoader && GLTFFileLoader && GLTF2.GLTFLoader) {
            this._addImport();
        }

        if (GLTF2Export) {
            this._addExport();
        }
    }

    public dispose() {
        if (this._detailsPanel) {
            this._detailsPanel.dispose();
        }
    }

    private _addImport() {
        const importTitle = Helpers.CreateDiv("gltf-title", this._actions);
        importTitle.textContent = "Import";

        const importActions = Helpers.CreateDiv("gltf-actions", this._actions) as HTMLDivElement;

        GLTFTab._GetLoaderDefaultsAsync().then((defaults) => {
            const loaderAction = Helpers.CreateDiv("gltf-action", importActions) as HTMLDivElement;
            loaderAction.innerText = "Loader";
            loaderAction.addEventListener("click", (event) => {
                this._showLoaderDefaults(defaults);
                event.stopPropagation();
            });

            const extensionsTitle = Helpers.CreateDiv("gltf-title", importActions) as HTMLDivElement;
            extensionsTitle.textContent = "Extensions";

            for (const extensionName in defaults.extensions) {
                const extensionDefaults = defaults.extensions[extensionName];

                const extensionAction = Helpers.CreateDiv("gltf-action", importActions);
                extensionAction.addEventListener("click", (event) => {
                    if (this._showLoaderExtensionDefaults(extensionDefaults)) {
                        event.stopPropagation();
                    }
                });

                const checkbox = Helpers.CreateElement("span", "gltf-checkbox", extensionAction);

                if (extensionDefaults.enabled) {
                    checkbox.classList.add("action", "active");
                }

                checkbox.addEventListener("click", () => {
                    checkbox.classList.toggle("active");
                    extensionDefaults.enabled = checkbox.classList.contains("active");
                });

                const label = Helpers.CreateElement("span", null, extensionAction);
                label.textContent = extensionName;
            }

            let validationTitle: Nullable<HTMLDivElement> = null;
            let validationAction: Nullable<HTMLDivElement> = null;

            GLTFTab._OnValidationResultsUpdated = (results) => {
                if (!validationTitle) {
                    validationTitle = Helpers.CreateDiv("gltf-title", importActions) as HTMLDivElement;
                }

                if (!validationAction) {
                    validationAction = Helpers.CreateDiv("gltf-action", importActions) as HTMLDivElement;
                    validationAction.addEventListener("click", (event) => {
                        GLTFTab._ShowValidationResults();
                        event.stopPropagation();
                    });
                }

                validationTitle.textContent = results.uri === "null" ? "Validation" : `Validation - ${BABYLON.Tools.GetFilename(results.uri)}`;
                GLTFTab._FormatValidationResultsShort(validationAction, results);
            };

            if (GLTFTab._ValidationResults) {
                GLTFTab._OnValidationResultsUpdated(GLTFTab._ValidationResults);
            }
        });
    }

    private static _FormatValidationResultsShort(validationAction: HTMLDivElement, results: IGLTFValidationResults): void {
        validationAction.innerHTML = "";

        let message = "";
        const add = (count: number, issueType: string): void => {
            if (count) {
                if (message) {
                    message += ", ";
                }

                message += count === 1 ? `${count} ${issueType}` : `${count} ${issueType}s`;
            }
        };

        const issues = results.issues;
        add(issues.numErrors, "error");
        add(issues.numWarnings, "warning");
        add(issues.numInfos, "info");
        add(issues.numHints, "hint");

        const actionDiv = Helpers.CreateDiv("gltf-action", validationAction) as HTMLDivElement;

        const iconSpan = Helpers.CreateElement("span", "gltf-icon", actionDiv, issues.numErrors ? "The asset contains errors." : "The asset is valid.");
        iconSpan.textContent = issues.numErrors ? "\uf057" : "\uf058";
        iconSpan.style.color = issues.numErrors ? "red" : "green";

        const messageSpan = Helpers.CreateElement("span", "gltf-icon", actionDiv);
        messageSpan.textContent = message || "No issues";
    }

    private static _ShowValidationResults(): void {
        if (GLTFTab._ValidationResults) {
            const win = window.open("", "_blank");
            if (win) {
                // TODO: format this better and use generator registry (https://github.com/KhronosGroup/glTF-Generator-Registry)
                win.document.title = "glTF Validation Results";
                win.document.body.innerText = JSON.stringify(GLTFTab._ValidationResults, null, 2);
                win.document.body.style.whiteSpace = "pre";
                win.document.body.style.fontFamily = `monospace`;
                win.document.body.style.fontSize = `14px`;
                win.focus();
            }
        }
    }

    private static _ApplyLoaderDefaults(loader: GLTFFileLoader): void {
        const defaults = GLTFTab._LoaderDefaults;
        if (defaults) {
            for (const key in defaults) {
                if (key !== "extensions") {
                    (loader as any)[key] = defaults[key];
                }
            }

            loader.onExtensionLoadedObservable.add((extension) => {
                const extensionDefaults = defaults.extensions[extension.name];
                for (const key in extensionDefaults) {
                    (extension as any)[key] = extensionDefaults[key];
                }
            });
        }
    }

    private static _GetPublic(obj: any): any {
        const result: any = {};
        for (const key in obj) {
            if (key !== "name" && key[0] !== "_") {
                const value = obj[key];
                const type = typeof value;
                if (type !== "object" && type !== "function" && type !== "undefined") {
                    result[key] = value;
                }
            }
        }
        return result;
    }

    /** @hidden */
    public static _GetLoaderDefaultsAsync(): Promise<any> {
        if (GLTFTab._LoaderDefaults) {
            return Promise.resolve(GLTFTab._LoaderDefaults);
        }

        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new GLTFFileLoader();

        GLTFTab._LoaderDefaults = GLTFTab._GetPublic(loader);
        GLTFTab._LoaderDefaults.extensions = {};
        loader.onExtensionLoadedObservable.add((extension) => {
            GLTFTab._LoaderDefaults.extensions[extension.name] = GLTFTab._GetPublic(extension);
        });

        const data = '{ "asset": { "version": "2.0" } }';
        return loader.importMeshAsync([], scene, data, "").then(() => {
            engine.dispose();
            return GLTFTab._LoaderDefaults;
        });
    }

    private _openDetailsPanel(): DetailPanel {
        if (!this._detailsPanel) {
            this._detailsPanel = new DetailPanel();
            this._panel.appendChild(this._detailsPanel.toHtml());

            this._split = Split([this._actions, this._detailsPanel.toHtml()], {
                blockDrag: this._inspector.popupMode,
                sizes: [50, 50],
                direction: "vertical"
            });
        }

        this._detailsPanel.clean();
        return this._detailsPanel;
    }

    private _closeDetailsPanel(): void {
        if (this._detailsPanel) {
            this._detailsPanel.toHtml().remove();
            this._detailsPanel.dispose();
            this._detailsPanel = null;
        }

        if (this._split) {
            this._split.destroy();
            delete this._split;
        }
    }

    private _showLoaderDefaults(defaults: { [key: string]: any }): void {
        var detailsPanel = this._openDetailsPanel();
        const details = new Array<PropertyLine>();
        for (const key in defaults) {
            if (key !== "extensions") {
                details.push(new PropertyLine(new Property(key, defaults, this._inspector.scene)));
            }
        }
        detailsPanel.details = details;
    }

    private _showLoaderExtensionDefaults(defaults: { [key: string]: any }): boolean {
        if (Object.keys(defaults).length === 1) {
            return false;
        }

        var detailsPanel = this._openDetailsPanel();
        const details = new Array<PropertyLine>();
        for (const key in defaults) {
            if (key !== "enabled") {
                details.push(new PropertyLine(new Property(key, defaults, this._inspector.scene)));
            }
        }
        detailsPanel.details = details;

        return true;
    }

    private _addExport() {
        const exportTitle = Helpers.CreateDiv("gltf-title", this._actions);
        exportTitle.textContent = "Export";

        const exportActions = Helpers.CreateDiv("gltf-actions", this._actions) as HTMLDivElement;

        const name = Helpers.CreateInput("gltf-input", exportActions);
        name.placeholder = "File name...";

        const button = Helpers.CreateElement("button", "gltf-button", exportActions) as HTMLButtonElement;
        button.innerText = "Export GLB";
        button.addEventListener("click", () => {
            GLTF2Export.GLBAsync(this._inspector.scene, name.value || "scene", {
                shouldExportTransformNode: (transformNode) => !GLTFTab._IsSkyBox(transformNode)
            }).then((glb) => {
                glb.downloadFiles();
            });
        });
    }

    private static _IsSkyBox(transformNode: TransformNode): boolean {
        if (transformNode instanceof Mesh) {
            if (transformNode.material) {
                const material = transformNode.material as PBRMaterial | StandardMaterial;
                const reflectionTexture = material.reflectionTexture;
                if (reflectionTexture && reflectionTexture.coordinatesMode === Texture.SKYBOX_MODE) {
                    return true;
                }
            }
        }

        return false;
    }
}

GLTFTab._Initialize();
