/// <reference path="../../../dist/preview release/gltf2Interface/babylon.glTF2Interface.d.ts"/>
/// <reference path="../../../dist/preview release/loaders/babylon.glTF2FileLoader.d.ts"/>
/// <reference path="../../../dist/preview release/serializers/babylon.glTF2Serializer.d.ts"/>

declare function Split(elements: HTMLElement[], options: any): any;

module INSPECTOR {
    interface ILoaderExtensionSettings {
        [extensionName: string]: {
            [settingName: string]: any
        }
    };

    export class GLTFTab extends Tab {
        private static _LoaderExtensionSettings: ILoaderExtensionSettings | null = null;

        private _inspector: Inspector;
        private _actions: HTMLDivElement;
        private _detailsPanel: DetailPanel | null = null;
        private _split: any;

        /** @hidden */
        public static _Initialize(): void {
            // Must register with OnPluginActivatedObservable as early as possible to
            // override the default settings for each extension.
            BABYLON.SceneLoader.OnPluginActivatedObservable.add((loader: BABYLON.GLTFFileLoader) => {
                if (loader.name === "gltf" && GLTFTab._LoaderExtensionSettings) {
                    loader.onExtensionLoadedObservable.add(extension => {
                        const settings = GLTFTab._LoaderExtensionSettings![extension.name];
                        for (const settingName in settings) {
                            (extension as any)[settingName] = settings[settingName];
                        }
                    });
                }
            });
        }

        constructor(tabbar: TabBar, inspector: Inspector) {
            super(tabbar, 'GLTF');

            this._inspector = inspector;
            this._panel = Helpers.CreateDiv('tab-panel') as HTMLDivElement;
            this._actions = Helpers.CreateDiv('gltf-actions', this._panel) as HTMLDivElement;
            this._actions.addEventListener('click', event => {
                this._closeDetailsPanel();
            });

            this._addImport();
            this._addExport();
        }

        public dispose() {
            if (this._detailsPanel) {
                this._detailsPanel.dispose();
            }
        }

        private _addImport() {
            const importActions = Helpers.CreateDiv(null, this._actions) as HTMLDivElement;

            this._getLoaderExtensionOverridesAsync().then(loaderExtensionSettings => {
                const title = Helpers.CreateDiv('gltf-title', importActions);
                title.textContent = 'Import';

                const extensionActions = Helpers.CreateDiv('gltf-actions', importActions) as HTMLDivElement;

                const extensionsTitle = Helpers.CreateDiv('gltf-title', extensionActions) as HTMLDivElement;
                extensionsTitle.textContent = "Extensions";

                for (const extensionName in loaderExtensionSettings) {
                    const settings = loaderExtensionSettings[extensionName];

                    const extensionAction = Helpers.CreateDiv('gltf-action', extensionActions);
                    extensionAction.addEventListener('click', event => {
                        if (this._updateLoaderExtensionDetails(settings)) {
                            event.stopPropagation();
                        }
                    });

                    const checkbox = Helpers.CreateElement('span', 'gltf-checkbox', extensionAction);

                    if (settings.enabled) {
                        checkbox.classList.add('action', 'active');
                    }

                    checkbox.addEventListener('click', () => {
                        checkbox.classList.toggle('active');
                        settings.enabled = checkbox.classList.contains('active');
                    });

                    const label = Helpers.CreateElement('span', null, extensionAction);
                    label.textContent = extensionName;
                }
            });
        }

        private _getLoaderExtensionOverridesAsync(): Promise<ILoaderExtensionSettings> {
            if (GLTFTab._LoaderExtensionSettings) {
                return Promise.resolve(GLTFTab._LoaderExtensionSettings);
            }

            const loaderExtensionSettings: ILoaderExtensionSettings = {};

            const engine = new BABYLON.NullEngine();
            const scene = new BABYLON.Scene(engine);
            const loader = new BABYLON.GLTF2.GLTFLoader();
            loader.onExtensionLoadedObservable.add(extension => {
                loaderExtensionSettings[extension.name] = {};
                const settings = loaderExtensionSettings[extension.name];
                for (const key of Object.keys(extension)) {
                    if (key !== "name" && key[0] !== '_') {
                        const value = (extension as any)[key];
                        if (typeof value !== "object") {
                            settings[key] = value;
                        }
                    }
                }
            });

            const data = { json: {}, bin: null };
            return loader.importMeshAsync([], scene, data, "").then(() => {
                scene.dispose();
                engine.dispose();

                return (GLTFTab._LoaderExtensionSettings = loaderExtensionSettings);
            });
        }

        private _updateLoaderExtensionDetails(settings: { [settingName: string]: any }): boolean {
            if (Object.keys(settings).length === 1) {
                return false;
            }

            if (!this._detailsPanel) {
                this._detailsPanel = new DetailPanel();
                this._panel.appendChild(this._detailsPanel.toHtml());

                this._split = Split([this._actions, this._detailsPanel.toHtml()], {
                    blockDrag: this._inspector.popupMode,
                    sizes: [50, 50],
                    direction: 'vertical'
                });
            }

            this._detailsPanel.clean();

            const details = new Array<PropertyLine>();
            for (const key in settings) {
                if (key !== "enabled") {
                    details.push(new PropertyLine(new Property(key, settings)));
                }
            }
            this._detailsPanel.details = details;

            return true;
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

        private _addExport() {
            const exportActions = Helpers.CreateDiv(null, this._actions) as HTMLDivElement;

            const title = Helpers.CreateDiv('gltf-title', exportActions);
            title.textContent = 'Export';

            const name = Helpers.CreateInput('gltf-input', exportActions);
            name.placeholder = "File name...";

            const button = Helpers.CreateElement('button', 'gltf-button', exportActions) as HTMLButtonElement;
            button.innerText = 'Export GLB';
            button.addEventListener('click', () => {
                BABYLON.GLTF2Export.GLBAsync(this._inspector.scene, name.value || "scene", {
                    shouldExportTransformNode: transformNode => !GLTFTab._IsSkyBox(transformNode)
                }).then((glb) => {
                    glb.downloadFiles();
                });
            });
        }

        private static _IsSkyBox(transformNode: BABYLON.TransformNode): boolean {
            if (transformNode instanceof BABYLON.Mesh) {
                if (transformNode.material) {
                    const material = transformNode.material as BABYLON.PBRMaterial | BABYLON.StandardMaterial;
                    const reflectionTexture = material.reflectionTexture;
                    if (reflectionTexture && reflectionTexture.coordinatesMode === BABYLON.Texture.SKYBOX_MODE) {
                        return true;
                    }
                }
            }

            return false;
        }
    }

    GLTFTab._Initialize();
}