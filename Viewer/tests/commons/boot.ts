import webglSupport from './mockWebGL';
import { Helper, useNullEngine } from "./helper";
import { viewerGlobals } from "../../src";

export class Boot {
    public static AppendResult = false;

    public static main() {
        //let babylonSource = Boot.loadSync('base/js/babylon.viewer.max.js');
        //let spectreSource = Boot.loadSync('base/js/spectreonly.js');

        document.body.innerHTML = `<div id="result-div"></div><div id="working-div"></div>`;

        //register actions to occur before each test
        beforeEach(function(done) {
            // tslint:disable-next-line:no-console
            //console.debug('> Executing "' + details.name + '"');

            //clear DOM and create canvas and container
            document.getElementById('working-div')!.innerHTML = `<div style="font-size:30px;">WORKING CANVASES.</div>
				<div id="viewer-testing" style="width:512px;height:512px;">
                    <div id="renderCanvas" width="512" height="512" style="width:512px;height:512px;">
                    <canvas width="512" height="512" style="width:512px;height:512px;"></canvas></div>
					<canvas id="referenceCanvas" width="512" height="512" style="width:512px;height:512px;"></canvas>
				</div>
			`;

            if (Boot.AppendResult) {
                var newResult = document.createElement('div');
                document.getElementById('result-div')!.appendChild(newResult);

                newResult.innerHTML = `<div class="result">
						<div class="resultDisplay"></div>
						<img class="renderImg" width="512" height="512" style="width:512px;height:512px;"></img>
						<img class="referenceImg" width="512" height="512" style="width:512px;height:512px;"></img>
                    </div>`;

                /*if (!(<any>window).BABYLON) {
                    eval.call(null, babylonSource);
                    eval.call(null, spectreSource);
                }*/

            }
            else {
                //reset global state before executing test
                //delete (<any>window).BABYLON;
                //delete (<any>window).BabylonViewer;
                //delete (<any>window).SPECTRE;

                /*eval.call(null, babylonSource);
                eval.call(null, spectreSource);*/
            }

            viewerGlobals.disableInit = true;

            var DOMContentLoaded_event = document.createEvent("Event");
            DOMContentLoaded_event.initEvent("DOMContentLoaded", true, true);
            window.document.dispatchEvent(DOMContentLoaded_event);

            // Disable Webgl2 support in test mode for chrome headless/IE compatibility.
            viewerGlobals.disableWebGL2Support = true;
            done();
        });

        afterEach(function(done) {
            Helper.disposeViewer();
            //(<any>window).BabylonViewer.disposeAll();
            done();
        });
    }

}

if (!useNullEngine) {
    console.log("mocking webgl");
    webglSupport();
}
export var main = Boot.main;
