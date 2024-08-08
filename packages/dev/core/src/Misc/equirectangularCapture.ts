import type { Scene } from "../scene";
import { ReflectionProbe } from "../Probes/reflectionProbe";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { CustomProceduralTexture } from "../Materials/Textures/Procedurals/customProceduralTexture";
import { DumpData } from "./dumpTools";
import type { Vector3 } from "../Maths/math.vector";
import "../Shaders/equirectangularPanorama.fragment";

/**
 * Interface containing options related to equirectangular capture of the current scene
 */
export interface EquiRectangularCaptureOptions {
    /**
     * This option relates to smallest dimension of the given equirectangular capture
     * Giving a 512px size would result in an image that 512 x 1024px
     */
    size: number;
    /**
     * Optional function to map which meshes should get rendered on the equirectangular map
     * This is specifically helpful when you have certain meshes that you want to skip, especially ground
     */
    meshesFilter?: (mesh: AbstractMesh) => boolean;
    /**
     * Optional argument to specify filename, passing this would auto download the given file
     */
    filename?: string;

    /**
     * Optional argument to specify position in 3D Space from where the equirectangular capture should be taken, if not specified, it would take the position of the scene's active camera or else origin
     */
    position?: Vector3;

    /**
     * Optional argument to specify probe with which the equirectangular image is generated
     * When passing this, size and position arguments are ignored
     */
    probe?: ReflectionProbe;
}

/**
 * @param scene This refers to the scene which would be rendered in the given equirectangular capture
 * @param options This refers to the options for a given equirectangular capture
 * @returns the requested capture's pixel-data or auto downloads the file if options.filename is specified
 */
export async function captureEquirectangularFromScene(scene: Scene, options: EquiRectangularCaptureOptions): Promise<ArrayBufferView | null> {
    const probe: ReflectionProbe = options.probe ?? new ReflectionProbe("tempProbe", options.size, scene);
    const wasProbeProvided = !!options.probe;
    if (!wasProbeProvided) {
        if (options.position) {
            probe.position = options.position.clone();
        } else if (scene.activeCamera) {
            probe.position = scene.activeCamera.position.clone();
        }
    }
    const meshesToConsider = options.meshesFilter ? scene.meshes.filter(options.meshesFilter) : scene.meshes;
    probe.renderList?.push(...meshesToConsider);
    probe.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    probe.cubeTexture.render();
    const dumpTexture = new CustomProceduralTexture("tempProceduralTexture", "equirectangularPanorama", { width: options.size * 2, height: options.size }, scene);
    dumpTexture.setTexture("cubeMap", probe.cubeTexture);
    return new Promise((resolve, reject) => {
        dumpTexture.onGeneratedObservable.addOnce(() => {
            const pixelDataPromise = dumpTexture.readPixels();
            if (!pixelDataPromise) {
                reject(new Error("No Pixel Data found on procedural texture"));
                dumpTexture.dispose();
                if (!wasProbeProvided) {
                    probe.dispose();
                }
                return;
            }
            pixelDataPromise.then((pixelData) => {
                dumpTexture.dispose();
                if (!wasProbeProvided) {
                    probe.dispose();
                }
                if (options.filename) {
                    DumpData(options.size * 2, options.size, pixelData, undefined, "image/png", options.filename);
                    resolve(null);
                } else {
                    resolve(pixelData);
                }
            });
        });
    });
}
