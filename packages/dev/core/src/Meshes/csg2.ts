import { Tools } from "core/Misc/tools";
import type { Mesh } from "./mesh";

// Manifold access
// eslint-disable-next-line @typescript-eslint/naming-convention
let Manifold: any;

export interface ICSG2Options {
    manifoldUrl: string;
}

/**
 * Wrapper around the Manifold library
 * https://manifoldcad.org/
 * Use this class to perform performant boolean operations on meshes
 * #IW43EB#1
 */
export class CSG2 {
    /**
     * Create a new CSG2 object
     */
    constructor() {}

    public fromMesh(mesh: Mesh): any {}

    public toMesh(): void {
        const { cube, sphere } = Manifold;
        const box = cube([100, 100, 100], true);
        const ball = sphere(60, 100);
        box.subtract(ball);
    }
}

/**
 * Initialize the Manifold library
 * @param options defines the options to use to initialize the library
 */
export async function InitializeCSG2Async(options: Partial<ICSG2Options>) {
    const localOptions = {
        manifoldUrl: "https://unpkg.com/manifold-3d@2.5.1",
        ...options,
    };

    await Tools.LoadScriptModuleAsync(
        `
            import Module from '${localOptions.manifoldUrl}/manifold.js';
            const wasm = await Module();
            wasm.setup();
            window._Manifold = wasm;
        `
    );

    Manifold = (window as any)._Manifold;
}
