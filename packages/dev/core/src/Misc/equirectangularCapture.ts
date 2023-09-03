import type { Scene } from "../scene";
import { ShaderStore } from "../Engines/shaderStore";
import { ReflectionProbe } from "../Probes/reflectionProbe";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { CustomProceduralTexture } from "../Materials/Textures/Procedurals/customProceduralTexture";
import { Tools } from "./tools";

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
}

/**
 * @param scene This refers to the scene which would be rendered in the given equirectangular capture
 * @param options This refers to the options for a given equirectangular capture
 * @returns the requested capture's pixel-data or auto downloads the file if options.filename is specified
 */
export async function captureEquirectangularFromScene(scene: Scene, options: EquiRectangularCaptureOptions): Promise<ArrayBufferView | null> {
    const probe = new ReflectionProbe("tempProbe", options.size, scene);
    const meshesToConsider = options.meshesFilter ? scene.meshes.filter(options.meshesFilter) : scene.meshes;
    probe.renderList?.push(...meshesToConsider);
    probe.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    probe.cubeTexture.render();
    const dumpTexture = new CustomProceduralTexture("tempProceduralTexture", "EquirectangularPanorama", { width: options.size * 2, height: options.size }, scene);
    dumpTexture.setTexture('cubeMap', probe.cubeTexture);
    return new Promise((resolve, reject) => {
        dumpTexture.onGeneratedObservable.add(() => {
            const pixelDataPromise = dumpTexture.readPixels();
            if (!pixelDataPromise) {
                reject(new Error("No Pixel Data found on procedural texture"));
                dumpTexture.dispose();
                probe.dispose();
                return;
            }
            pixelDataPromise.then(pixelData => {
                if (options.filename) {
                    const blob = new Blob([pixelData.buffer], { type: 'image/png' });
                    Tools.DownloadBlob(blob, options.filename);
                    resolve(null);
                } else {
                    resolve(pixelData);
                }
            });
        })
    })
}


ShaderStore.ShadersStore["EquirectangularPanoramaPixelShader"] = `
    #ifdef GL_ES
    precision highp float;
    #endif

    #define M_PI 3.1415926535897932384626433832795

    varying vec2 vUV;
    uniform samplerCube cubeMap;
    void main(void) {

        vec2 uv = vUV;
        float longitude = uv.x * 2. * M_PI - M_PI + M_PI / 2.;
        float latitude = uv.y * M_PI;
        vec3 dir = vec3(
            - sin( longitude ) * sin( latitude ),
            cos( latitude ),
            - cos( longitude ) * sin( latitude )
        );
        
        normalize( dir );

        gl_FragColor = textureCube( cubeMap, dir );
    }
`;