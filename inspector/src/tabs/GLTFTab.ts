/// <reference path="../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>
/// <reference path="../../../dist/preview release/serializers/babylon.glTF2Serializer.d.ts"/>

module INSPECTOR {
    export class GLTFTab extends Tab {
        constructor(tabbar: TabBar, inspector: Inspector) {
            super(tabbar, 'GLTF');

            this._panel = Helpers.CreateDiv('tab-panel') as HTMLDivElement;
            const actions = Helpers.CreateDiv('gltf-actions', this._panel) as HTMLDivElement;
            this._addExport(inspector, actions);
        }

        public dispose() {
            // Nothing to dispose
        }

        private _addExport(inspector: Inspector, actions: HTMLDivElement) {
            const title = Helpers.CreateDiv('gltf-title', actions);
            title.textContent = 'Export';

            const name = Helpers.CreateInput('gltf-input', actions);
            name.placeholder = "File name...";

            const button = Helpers.CreateElement('button', 'gltf-button', actions) as HTMLButtonElement;
            button.innerText = 'Export GLB';

            button.addEventListener('click', () => {
                const data = BABYLON.GLTF2Export.GLB(inspector.scene, name.value || "scene", {
                    shouldExportMesh: mesh => !GLTFTab._IsSkyBox(mesh)
                });

                if (data) {
                    data.downloadFiles();
                }
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
}