import { ImageMimeType } from "babylonjs-gltf2interface";
import { Tools } from "core/Misc/tools";

function getMimeType(fileName: string): string | undefined {
    if (fileName.endsWith(".glb")) {
        return "model/gltf-binary";
    } else if (fileName.endsWith(".bin")) {
        return "application/octet-stream";
    } else if (fileName.endsWith(".gltf")) {
        return "model/gltf+json";
    } else if (fileName.endsWith(".jpeg") || fileName.endsWith(".jpg")) {
        return ImageMimeType.JPEG;
    } else if (fileName.endsWith(".png")) {
        return ImageMimeType.PNG;
    } else if (fileName.endsWith(".webp")) {
        return ImageMimeType.WEBP;
    }

    return undefined;
}

/**
 * Class for holding and downloading glTF file data
 */
export class GLTFData {
    /**
     * Object which contains the file name as the key and its data as the value
     */
    public readonly files: { [fileName: string]: string | Blob } = {};

    /**
     * @deprecated Use files instead
     */
    public get glTFFiles() {
        return this.files;
    }

    /**
     * Downloads the glTF data as files based on their names and data
     */
    public downloadFiles(): void {
        for (const key in this.files) {
            const value = this.files[key];
            const blob = new Blob([value], { type: getMimeType(key) });
            Tools.Download(blob, key);
        }
    }
}
