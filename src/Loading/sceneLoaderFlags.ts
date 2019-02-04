import { Constants } from "../Engines/constants";

/**
 * Class used to represent data loading progression
 */
export class SceneLoaderFlags {
    // Flags
    private static _ForceFullSceneLoadingForIncremental = false;
    private static _ShowLoadingScreen = true;
    private static _CleanBoneMatrixWeights = false;
    private static _loggingLevel = Constants.SCENELOADER_NO_LOGGING;

    /**
     * Gets or sets a boolean indicating if entire scene must be loaded even if scene contains incremental data
     */
    public static get ForceFullSceneLoadingForIncremental() {
        return SceneLoaderFlags._ForceFullSceneLoadingForIncremental;
    }

    public static set ForceFullSceneLoadingForIncremental(value: boolean) {
        SceneLoaderFlags._ForceFullSceneLoadingForIncremental = value;
    }

    /**
     * Gets or sets a boolean indicating if loading screen must be displayed while loading a scene
     */
    public static get ShowLoadingScreen(): boolean {
        return SceneLoaderFlags._ShowLoadingScreen;
    }

    public static set ShowLoadingScreen(value: boolean) {
        SceneLoaderFlags._ShowLoadingScreen = value;
    }

    /**
     * Defines the current logging level (while loading the scene)
     * @ignorenaming
     */
    public static get loggingLevel(): number {
        return SceneLoaderFlags._loggingLevel;
    }

    public static set loggingLevel(value: number) {
        SceneLoaderFlags._loggingLevel = value;
    }

    /**
     * Gets or set a boolean indicating if matrix weights must be cleaned upon loading
     */
    public static get CleanBoneMatrixWeights(): boolean {
        return SceneLoaderFlags._CleanBoneMatrixWeights;
    }

    public static set CleanBoneMatrixWeights(value: boolean) {
        SceneLoaderFlags._CleanBoneMatrixWeights = value;
    }
}
