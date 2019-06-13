import { Vector3 } from "../Maths/math";
import { INavigationEngine, INavigationEnginePlugin, ICrowd } from "./INavigationEngine";
import { _DevTools } from '../Misc/devTools';
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";

/**
 * Class used to control navigation engine
 */
export class NavigationEngine implements INavigationEngine {

    /**
     * Factory used to create the default navigation plugin.
     * @returns The default navigation plugin
     */
    public static DefaultPluginFactory(): INavigationEnginePlugin {
        throw _DevTools.WarnImport("RecastJSPlugin");
    }

    /**
     * Creates a new Navigation Engine
     * @param _navigationPlugin defines the plugin to use (RecastJS by default)
     */
    constructor(private _navigationPlugin: INavigationEnginePlugin = NavigationEngine.DefaultPluginFactory()) {
        if (!this._navigationPlugin.isSupported()) {
            throw new Error("Navigation Engine " + this._navigationPlugin.name + " cannot be found. "
                + "Please make sure it is included.");
        }
    }

    createMavMesh(mesh: AbstractMesh): void {
        this._navigationPlugin.createMavMesh(mesh);
    }

    createDebugNavMesh(scene: Scene): Mesh {
        return this._navigationPlugin.createDebugNavMesh(scene);
    }

    getClosestPoint(position: Vector3): Vector3
    {
        return this._navigationPlugin.getClosestPoint(position);
    }

    createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene) : ICrowd
    {
        var crowd = this._navigationPlugin.createCrowd(maxAgents, maxAgentRadius, scene);
        return crowd;
    }

    /**
     * Release all resources
     */
    public dispose(): void {
        this._navigationPlugin.dispose();
    }

    public check(): void {
        this._navigationPlugin.check();
    }
}
