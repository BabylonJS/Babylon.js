import * as React from "react";
import { GlobalState } from '../globalState';
import {Engine} from "babylonjs/Engines/engine"
import { Nullable } from 'babylonjs/types';
import { Scene } from 'babylonjs/scene';
import { Utilities } from '../tools/utilities';

require("../scss/rendering.scss");

interface IRenderingComponentProps {
    globalState: GlobalState;
}

export class RenderingComponent extends React.Component<IRenderingComponentProps> {
    private _engine: Nullable<Engine>;
    private _scene: Nullable<Scene>;
    private _canvasRef: React.RefObject<HTMLCanvasElement>;

    public constructor(props: IRenderingComponentProps) {
        super(props);

        this._canvasRef = React.createRef();

        // Create the global handleException
        (window as any).handleException = (e: Error) => {
            console.error(e);
        }

        this.props.globalState.onRunRequiredObservable.add(() => {
            this.compileAndRun();
        })
    }

    componentDidMount() {
        this.compileAndRun();
    }

    compileAndRun() {
        if (this._engine) {
            try {
                this._engine.dispose();
            } 
            catch (ex) {
                // just ignore
            }
            this._engine = null;
        }   

        let globalObject = window as any;
        let canvas = this._canvasRef.current!;
        globalObject.canvas = canvas;
        
        globalObject.createDefaultEngine = function () {
            return new Engine(canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true
            });
        }

       // let zipVariables = "var engine = null;\r\nvar scene = null;\r\nvar sceneToRender = null;\r\n";
       // let defaultEngineZip = "var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }); }";
        let code = this.props.globalState.currentCode;        
        let createEngineFunction = "createDefaultEngine";
        let createSceneFunction = "";
        let checkCamera = true;
        let checkSceneCount = true;

        if (code.indexOf("createEngine") !== -1) {
            createEngineFunction = "createEngine";
        }

        // Check for different typos
        if (code.indexOf("delayCreateScene") !== -1) { // delayCreateScene
            createSceneFunction = "delayCreateScene";
            checkCamera = false;
        } else if (code.indexOf("createScene") !== -1) { // createScene
            createSceneFunction = "createScene";
        } else if (code.indexOf("CreateScene") !== -1) { // CreateScene
            createSceneFunction = "CreateScene";
        } else if (code.indexOf("createscene") !== -1) { // createscene
            createSceneFunction = "createscene";
        }

        if (!createSceneFunction) {
            this._engine = globalObject.createDefaultEngine() as Engine;
            this._scene = new Scene(this._engine);

            globalObject.engine = this._engine;
            globalObject.scene = this._scene;

            let runScript:any = null;
            Utilities.FastEval("runScript = function(scene, canvas) {" + code + "}");
            runScript(this._scene, canvas);            

            //parent.zipTool.ZipCode = zipVariables + defaultEngineZip + "var engine = createDefaultEngine();" + ";\r\nvar scene = new BABYLON.Scene(engine);\r\n\r\n" + code;
        } else {
            code += `
var engine;
try {
engine = ${createEngineFunction}();
} catch(e) {
console.log("the available createEngine function failed. Creating the default engine instead");
engine = createDefaultEngine();
}`;
            code += "\r\nif (!engine) throw 'engine should not be null.';";

            if (this.props.globalState.language === "JS") {
                code += "\r\n" + "scene = " + createSceneFunction + "();";
            } else {
                var startCar = code.search('var ' + createSceneFunction);
                code = code.substr(0, startCar) + code.substr(startCar + 4);
                code += "\n" + "scene = " + createSceneFunction + "();";
            }

            // Execute the code
            Utilities.FastEval(code);

            this._engine = globalObject.engine;

            if (!this._engine) {
                this.props.globalState.onErrorObservable.notifyObservers("createEngine function must return an engine.");
                return;
            }

            if (!globalObject.scene) {
                this.props.globalState.onErrorObservable.notifyObservers(createSceneFunction + " function must return a scene.");
                return;
            }

            // let sceneToRenderCode = 'sceneToRender = scene';

            // if scene returns a promise avoid checks
            if (globalObject.scene.then) {
                checkCamera = false;
                checkSceneCount = false;
                // sceneToRenderCode = 'scene.then(returnedScene => { sceneToRender = returnedScene; });\r\n';
            } 

            // let createEngineZip = (createEngineFunction === "createEngine") ?
            //     zipVariables :
            //     zipVariables + defaultEngineZip;

            // parent.zipTool.zipCode =
            //     createEngineZip + ";\r\n" +
            //     code + ";\r\n" +
            //     sceneToRenderCode;
        }

        if (globalObject.scene.then) {
            globalObject.scene.then((s : Scene) => {
                this._scene = s;
                globalObject.scene = this._scene;
            });
        } else {
            this._scene = globalObject.scene as Scene;
        }

        this._engine.runRenderLoop(() => {
            if (!this._scene || !this._engine) {
                return;
            }

            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                this._engine.resize();
            }

            if (this._scene.activeCamera || this._scene.activeCameras.length > 0) {
                this._scene.render();
            }

            // Update FPS if camera is not a webxr camera
            if(!(this._scene.activeCamera && 
                this._scene.activeCamera.getClassName && 
                this._scene.activeCamera.getClassName() === 'WebXRCamera')) {
                this.props.globalState.fpsElement.innerHTML = this._engine.getFps().toFixed() + " fps";
            }
        });

        if (checkSceneCount && this._engine.scenes.length === 0) {
            this.props.globalState.onErrorObservable.notifyObservers("You must at least create a scene.");
            return;
        }

        if (checkCamera && this._engine.scenes[0].activeCamera == null) {
            this.props.globalState.onErrorObservable.notifyObservers("You must at least create a camera.");
            return;
        } else if (globalObject.scene.then) {
            globalObject.scene.then(function () {
            });
        } else {
            this._engine.scenes[0].executeWhenReady(function () {
            });
        }

    }

    public render() {
        return (
            <canvas id="renderingCanvas" ref={this._canvasRef}></canvas>
        )
    }
}