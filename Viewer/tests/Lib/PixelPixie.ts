import { Helper } from "../commons/helper";
import { AbstractViewer } from "babylonjs-viewer";


export class PixelPixieUtils {
    public static threshold = 3;
    public static errorRatio = 1;

    public static loadReferenceImage(name: string, callback: (success) => void) {
        const img = Helper.getReferenceImg();
        const timeout = setTimeout(() => {
            img.onload = null;

            if (callback) {
                callback(false);
            }
        }, 1000);
        img.onload = () => {
            clearTimeout(timeout);
            const resultCanvas = Helper.getReferenceCanvas();
            const resultContext = resultCanvas.getContext("2d");
            resultCanvas.width = img.width;
            resultCanvas.height = img.height;
            resultContext.drawImage(img, 0, 0);

            if (callback) {
                callback(true);
            }
        };

        img.src = "base/assets/referenceImages/" + name + ".png";
    }

    public static compare(canvas: HTMLCanvasElement, renderData: Uint8Array, stats: { maxDelta: number, differencesCount: number }): boolean {
        const referenceCanvas = canvas;
        const width = referenceCanvas.width;
        const height = referenceCanvas.height;
        const size = width * height * 4;

        const referenceContext = referenceCanvas.getContext("2d");

        const referenceData = referenceContext.getImageData(0, 0, width, height);

        let maxDelta = 0;
        let differencesCount = 0;
        for (let index = 0; index < size; index += 4) {
            const [r, g, b] = [index, index + 1, index + 2];

            const maxComponentDelta = Math.max(
                Math.abs(renderData[r] - referenceData.data[r]),
                Math.abs(renderData[g] - referenceData.data[g]),
                Math.abs(renderData[b] - referenceData.data[b])
            );

            maxDelta = Math.max(maxDelta, maxComponentDelta);

            if (maxComponentDelta < this.threshold) {
                continue;
            }

            referenceData.data[r] = 255;
            referenceData.data[g] *= 0.5;
            referenceData.data[b] *= 0.5;
            differencesCount++;
        }

        referenceContext.putImageData(referenceData, 0, 0);

        stats.maxDelta = maxDelta;
        stats.differencesCount = differencesCount;

        return (differencesCount * 100) / (width * height) > this.errorRatio;
    }

    public static getRenderData(renderEngine: AbstractViewer): Uint8Array {
        const width = renderEngine.canvas.width;
        const height = renderEngine.canvas.height;

        const renderData = renderEngine.engine.readPixels(0, 0, width, height);
        const numberOfChannelsByLine = width * 4;
        const halfHeight = height / 2;

        for (let i = 0; i < halfHeight; i++) {
            for (let j = 0; j < numberOfChannelsByLine; j++) {
                const currentCell = j + i * numberOfChannelsByLine;
                const targetLine = height - i - 1;
                const targetCell = j + targetLine * numberOfChannelsByLine;

                const temp = renderData[currentCell];
                renderData[currentCell] = renderData[targetCell];
                renderData[targetCell] = temp;
            }
        }

        return renderData;
    }

    public static evaluate(testName, renderEngine: AbstractViewer, callback: (result: boolean, picture: string, maxDelta: number, differencesCount: number) => void): void {
        renderEngine.scene.executeWhenReady(() => {
            // Extra render shouldn't be necessary, this is due to a bug in IE

            //TODO - this should be the viewer's render loop
            renderEngine.forceRender();

            const renderData = this.getRenderData(renderEngine);
            Helper.getRenderImg().src = renderEngine.canvas.toDataURL();

            renderEngine.runRenderLoop = false;

            this.loadReferenceImage(testName, (success) => {
                const referenceCanvas = Helper.getReferenceCanvas();
                if (success) {
                    const stats = { maxDelta: 0, differencesCount: 0 };
                    const different = this.compare(referenceCanvas, renderData, stats);
                    const resultPicture = referenceCanvas.toDataURL();
                    Helper.getReferenceImg().onload = null;
                    Helper.getReferenceImg().src = resultPicture;

                    callback(!different, resultPicture, stats.maxDelta, stats.differencesCount);
                }
                else {
                    callback(false, "Reference image not loaded.", 0, 0);
                }
            });
        });
    }
}
