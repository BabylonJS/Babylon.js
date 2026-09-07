import { type USDFileLoaderOptions, type USDVirtualFiles } from "loaders/USD/usdLoadingOptions";

interface IFileWithInputPath extends File {
    correctName?: string;
}

function NormalizeInputFilePath(path: string): string {
    return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

/**
 * A file and its path in the dropped virtual file system.
 */
export interface IUsdInputFile {
    file: File;
    path: string;
}

/**
 * Returns whether a path uses a USD scene extension.
 * @param path file path to inspect
 * @returns whether the file can be a USD root layer
 */
export function IsUsdSceneFile(path: string): boolean {
    return /\.(?:usd|usda|usdc|usdz)$/i.test(path);
}

/**
 * Gets the case-preserving virtual path assigned by FilesInput.
 * @param file input file
 * @returns normalized relative virtual path
 */
export function GetInputFilePath(file: File): string {
    const inputFile = file as IFileWithInputPath;
    return NormalizeInputFilePath(inputFile.correctName || file.webkitRelativePath || file.name);
}

/**
 * Assigns a virtual path to a file before it is passed to FilesInput.
 * @param file input file
 * @param path virtual path from the selected directory
 */
export function SetInputFilePath(file: File, path: string): void {
    (file as IFileWithInputPath).correctName = NormalizeInputFilePath(path);
}

/**
 * Finds all USD files that can be selected as the root layer.
 * @param files current dropped or selected file batch
 * @returns USD root candidates
 */
export function GetUsdRootCandidates(files: readonly File[]): IUsdInputFile[] {
    return files.map((file) => ({ file, path: GetInputFilePath(file) })).filter(({ path }) => IsUsdSceneFile(path));
}

/**
 * Builds loader options that preserve the dropped directory hierarchy.
 * @param files current dropped or selected file batch
 * @param rootFile selected root USD layer
 * @returns USD loader options with transferable supporting-file data
 */
export async function CreateUsdFileLoaderOptionsAsync(files: readonly File[], rootFile: File): Promise<Partial<USDFileLoaderOptions>> {
    const rootFileName = GetInputFilePath(rootFile);
    const entries = await Promise.all(
        files
            .filter((file) => file !== rootFile)
            .map(async (file) => {
                const path = GetInputFilePath(file);
                return [path, new Uint8Array(await file.arrayBuffer())] as const;
            })
    );
    const virtualFiles: Record<string, Uint8Array> = {};
    for (const [path, bytes] of entries) {
        if (Object.prototype.hasOwnProperty.call(virtualFiles, path)) {
            throw new Error(`The dropped file set contains the duplicate path '${path}'.`);
        }
        virtualFiles[path] = bytes;
    }

    return {
        rootFileName,
        files: virtualFiles satisfies USDVirtualFiles,
    };
}
