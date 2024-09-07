import { DynamicTexture, RawTexture } from "@dev/core";
import type { GlobalState } from "../globalState";
import type { Nullable } from "@dev/core";
import type { Engine } from "@dev/core";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let JSZip: any;
declare let saveAs: any;

export class DownloadManager {
    public constructor(public globalState: GlobalState) {}

    private _addContentToZipAsync(zip: typeof JSZip, name: string, url: string, replace: Nullable<string>, buffer = false): Promise<void> {
        return new Promise((resolve) => {
            if (url.substring(0, 5) == "data:" || url.substring(0, 5) == "http:" || url.substring(0, 5) == "blob:" || url.substring(0, 6) == "https:") {
                resolve();
                return;
            }

            const xhr = new XMLHttpRequest();

            xhr.open("GET", url, true);

            if (buffer) {
                xhr.responseType = "arraybuffer";
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        let text;
                        if (!buffer) {
                            if (replace) {
                                const splits = replace.split("\r\n");
                                for (let index = 0; index < splits.length; index++) {
                                    splits[index] = "        " + splits[index];
                                }
                                replace = splits.join("\r\n");

                                text = xhr.responseText.replace("####INJECT####", replace);
                            } else {
                                text = xhr.responseText;
                            }
                        }

                        zip.file(name, buffer ? xhr.response : text);

                        resolve();
                    }
                }
            };

            xhr.send(null);
        });
    }

    private _addTexturesToZipAsync(zip: typeof JSZip, index: number, textures: any[], folder: Nullable<string>): Promise<void> {
        if (index === textures.length || !textures[index].name) {
            return Promise.resolve();
        }

        if (textures[index].isRenderTarget || textures[index] instanceof RawTexture || textures[index] instanceof DynamicTexture || textures[index].name.indexOf("data:") !== -1) {
            return this._addTexturesToZipAsync(zip, index + 1, textures, folder);
        }

        if (textures[index].isCube) {
            if (textures[index].name.indexOf("dds") === -1 && textures[index].name.indexOf(".env") === -1) {
                if (textures[index]._extensions) {
                    for (let i = 0; i < 6; i++) {
                        textures.push({ name: textures[index].name + textures[index]._extensions[i] });
                    }
                } else if (textures[index]._files) {
                    for (let i = 0; i < 6; i++) {
                        textures.push({ name: textures[index]._files[i] });
                    }
                }
            } else {
                textures.push({ name: textures[index].name });
            }
            return this._addTexturesToZipAsync(zip, index + 1, textures, folder);
        }

        if (folder == null) {
            folder = zip.folder("textures");
        }
        let url;

        if (textures[index].video) {
            url = textures[index].video.currentSrc;
        } else {
            url = textures[index].url;
        }

        const name = textures[index].name.replace("textures/", "");

        if (url != null) {
            return this._addContentToZipAsync(folder, name, url, null, true).then(() => {
                return this._addTexturesToZipAsync(zip, index + 1, textures, folder);
            });
        } else {
            return this._addTexturesToZipAsync(zip, index + 1, textures, folder);
        }
    }

    private _addImportedFilesToZipAsync(zip: typeof JSZip, index: number, importedFiles: string[], folder: Nullable<string>): Promise<void> {
        if (index === importedFiles.length) {
            return Promise.resolve();
        }

        if (!folder) {
            folder = zip.folder("scenes");
        }
        const url = importedFiles[index];

        const name = url.substring(url.lastIndexOf("/") + 1);

        return this._addContentToZipAsync(folder, name, url, null, true).then(() => {
            return this._addImportedFilesToZipAsync(zip, index + 1, importedFiles, folder);
        });
    }

    public download(engine: Engine) {
        const zip = new JSZip();

        const scene = engine.scenes[0];
        const textures = scene.textures?.slice(0) as any;
        const importedFiles = scene.importedMeshesFiles?.slice(0) as string[];

        const zipCode = this.globalState.zipCode;

        this.globalState.onDisplayWaitRingObservable.notifyObservers(true);

        const regex = /CreateGroundFromHeightMap\(".+", "(.+)"/g;

        do {
            const match = regex.exec(zipCode);

            if (!match) {
                break;
            }

            textures.push({ name: match[1] });
            // eslint-disable-next-line no-constant-condition
        } while (true);

        this._addContentToZipAsync(zip, "index.html", "/zipContent/index.html", zipCode)
            .then(() => {
                return this._addTexturesToZipAsync(zip, 0, textures, null);
            })
            .then(() => {
                return this._addImportedFilesToZipAsync(zip, 0, importedFiles, null);
            })
            .then(() => {
                const blob = zip.generate({ type: "blob" });
                saveAs(blob, "sample.zip");
                this.globalState.onDisplayWaitRingObservable.notifyObservers(false);
            });
    }
}
