/// <reference path="../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>
/// <reference path="../../../dist/preview release/loaders/babylon.glTF2FileLoader.d.ts"/>
/// <reference path="../../../dist/preview release/serializers/babylon.glTF2Serializer.d.ts"/>

declare function Split(elements: HTMLElement[], options: any): any;

module INSPECTOR {
    interface ILoaderDefaults {
        [extensionName: string]: {
            [key: string]: any
        },
        extensions: {
            [extensionName: string]: {
                [key: string]: any
            }
        }
    }

    export class GLTFTab extends Tab {
        private static _LoaderDefaults: ILoaderDefaults | null = null;

        private _inspector: Inspector;
        private _actions: HTMLDivElement;
        private _detailsPanel: DetailPanel | null = null;
        private _split: any;

        public static get IsSupported(): boolean {
            return !!(BABYLON.SceneLoader && BABYLON.GLTFFileLoader && BABYLON.GLTF2.GLTFLoader) || !!BABYLON.GLTF2Export;
        }

        /** @hidden */
        public static _Initialize(): void {
            // Must register with OnPluginActivatedObservable as early as possible to override the loader defaults.
            BABYLON.SceneLoader.OnPluginActivatedObservable.add((loader: BABYLON.GLTFFileLoader) => {
                if (loader.name === "gltf" && GLTFTab._LoaderDefaults) {
                    const defaults = GLTFTab._LoaderDefaults;
                    for (const key in defaults) {
                        if (key !== "extensions") {
                            (loader as any)[key] = GLTFTab._LoaderDefaults[key];
                        }
                    }

                    loader.onExtensionLoadedObservable.add(extension => {
                        const extensionDefaults = defaults.extensions[extension.name];
                        for (const key in extensionDefaults) {
                            (extension as any)[key] = extensionDefaults[key];
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

            if (BABYLON.SceneLoader && BABYLON.GLTFFileLoader && BABYLON.GLTF2.GLTFLoader) {
                this._addImport();
            }

            if (BABYLON.GLTF2Export) {
                this._addExport();
            }
        }

        public dispose() {
            if (this._detailsPanel) {
                this._detailsPanel.dispose();
            }
        }

        private _addImport() {
            const importTitle = Helpers.CreateDiv('gltf-title', this._actions);
            importTitle.textContent = 'Import';

            const importActions = Helpers.CreateDiv('gltf-actions', this._actions) as HTMLDivElement;

            this._getLoaderDefaultsAsync().then(defaults => {
                importTitle.addEventListener('click', event => {
                    this._showLoaderDefaults(defaults);
                    event.stopPropagation();
                });

                importActions.addEventListener('click', event => {
                    this._showLoaderDefaults(defaults);
                    event.stopPropagation();
                });

                const extensionsTitle = Helpers.CreateDiv('gltf-title', importActions) as HTMLDivElement;
                extensionsTitle.textContent = "Extensions";

                for (const extensionName in defaults.extensions) {
                    const extensionDefaults = defaults.extensions[extensionName];

                    const extensionAction = Helpers.CreateDiv('gltf-action', importActions);
                    extensionAction.addEventListener('click', event => {
                        if (this._showLoaderExtensionDefaults(extensionDefaults)) {
                            event.stopPropagation();
                        }
                    });

                    const checkbox = Helpers.CreateElement('span', 'gltf-checkbox', extensionAction);

                    if (extensionDefaults.enabled) {
                        checkbox.classList.add('action', 'active');
                    }

                    checkbox.addEventListener('click', () => {
                        checkbox.classList.toggle('active');
                        extensionDefaults.enabled = checkbox.classList.contains('active');
                    });

                    const label = Helpers.CreateElement('span', null, extensionAction);
                    label.textContent = extensionName;
                }
            });
        }

        private static _EnumeratePublic(obj: any, callback: (key: string, value: any) => void): void {
            for (const key in obj) {
                if (key !== "name" && key[0] !== '_') {
                    const value = obj[key];
                    const type = typeof value;
                    if (type !== "object" && type !== "function" && type !== "undefined") {
                        callback(key, value);
                    }
                }
            }
        }

        private _getLoaderDefaultsAsync(): Promise<ILoaderDefaults> {
            if (GLTFTab._LoaderDefaults) {
                return Promise.resolve(GLTFTab._LoaderDefaults);
            }

            const defaults: ILoaderDefaults = {
                extensions: {}
            };

            const engine = new BABYLON.NullEngine();
            const scene = new BABYLON.Scene(engine);

            const loader = new BABYLON.GLTFFileLoader();
            GLTFTab._EnumeratePublic(loader, (key, value) => {
                defaults[key] = value;
            });

            loader.onExtensionLoadedObservable.add(extension => {
                const extensionDefaults: any = {};
                GLTFTab._EnumeratePublic(extension, (key, value) => {
                    extensionDefaults[key] = value;
                });
                defaults.extensions[extension.name] = extensionDefaults;
            });

            const data = '{ "asset": { "version": "2.0" }, "scenes": [ { } ] }';
            return loader.loadAsync(scene, data, "").then(() => {
                scene.dispose();
                engine.dispose();

                return (GLTFTab._LoaderDefaults = defaults);
            });
        }

        private _openDetailsPanel(): DetailPanel {
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
                    details.push(new PropertyLine(new Property(key, defaults)));
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
                    details.push(new PropertyLine(new Property(key, defaults)));
                }
            }
            detailsPanel.details = details;

            return true;
        }

        private _addExport() {
            const exportTitle = Helpers.CreateDiv('gltf-title', this._actions);
            exportTitle.textContent = 'Export';

            const exportActions = Helpers.CreateDiv('gltf-actions', this._actions) as HTMLDivElement;

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