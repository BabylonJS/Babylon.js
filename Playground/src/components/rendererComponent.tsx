import * as React from "react";
import { GlobalState, RuntimeMode } from '../globalState';
import {Engine} from "babylonjs/Engines/engine"
import { Nullable } from 'babylonjs/types';
import { Scene } from 'babylonjs/scene';
import { Utilities } from '../tools/utilities';
import { DownloadManager } from '../tools/downloadManager';

require("../scss/rendering.scss");

interface IRenderingComponentProps {
    globalState: GlobalState;
}

export class RenderingComponent extends React.Component<IRenderingComponentProps> {
    private _engine: Nullable<Engine>;
    private _scene: Nullable<Scene>;
    private _canvasRef: React.RefObject<HTMLCanvasElement>;
    private _downloadManager: DownloadManager;

    public constructor(props: IRenderingComponentProps) {
        super(props);

        this._canvasRef = React.createRef();

        // Create the global handleException
        (window as any).handleException = (e: Error) => {
            console.error(e);
            this.props.globalState.onErrorObservable.notifyObservers(e);
        }

        this.props.globalState.onRunRequiredObservable.add(() => {
           this._compileAndRunAsync();
        });

        
        this._downloadManager = new DownloadManager(this.props.globalState);
        this.props.globalState.onDownloadRequiredObservable.add(() => {
            if (!this._engine) {
                return;
            }
            this._downloadManager.download(this._engine);
        });

        this.props.globalState.onInspectorRequiredObservable.add(() => {
            if (!this._scene) {
                return;
            }

            if (this._scene.debugLayer.isVisible()) {
                this._scene.debugLayer.hide();
            } else {
                this._scene.debugLayer.show({
                    embedMode: true
                });
            }
        });

        this.props.globalState.onFullcreenRequiredObservable.add(() => {
            this._engine?.switchFullscreen(false);
        });

        if (this.props.globalState.runtimeMode !== RuntimeMode.Editor) {
            this.props.globalState.onCodeLoaded.add(code => {      
                this.props.globalState.currentCode = code;
                this.props.globalState.onRunRequiredObservable.notifyObservers();
            });
        }

        window.addEventListener("resize", () => {
            if (!this._engine) {
                return;
            }

            this._engine.resize();
        });
    }

    private async _compileAndRunAsync() {
        this.props.globalState.onDisplayWaitRingObservable.notifyObservers(false);        
        this.props.globalState.onErrorObservable.notifyObservers(null);

        if (this._engine) {
            try {
                this._engine.dispose();
            } 
            catch (ex) {
                // just ignore
            }
            this._engine = null;
        }   

        try {
            let globalObject = window as any;
            let canvas = this._canvasRef.current!;
            globalObject.canvas = canvas;
            
            globalObject.createDefaultEngine = function () {
                return new Engine(canvas, true, {
                    preserveDrawingBuffer: true,
                    stencil: true
                });
            }

            let zipVariables = "var engine = null;\r\nvar scene = null;\r\nvar sceneToRender = null;\r\n";
            let defaultEngineZip = "var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }); }";
            let code = await this.props.globalState.getCompiledCode();     
            
            if (!code) {
                return;
            }
            
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

                this.props.globalState.zipCode = zipVariables + defaultEngineZip + "var engine = createDefaultEngine();" + ";\r\nvar scene = new BABYLON.Scene(engine);\r\n\r\n" + code;
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
                    this.props.globalState.onErrorObservable.notifyObservers({message: "createEngine function must return an engine."});
                    return;
                }

                if (!globalObject.scene) {
                    this.props.globalState.onErrorObservable.notifyObservers({message: createSceneFunction + " function must return a scene."});
                    return;
                }

                let sceneToRenderCode = 'sceneToRender = scene';

                // if scene returns a promise avoid checks
                if (globalObject.scene.then) {
                    checkCamera = false;
                    checkSceneCount = false;
                    sceneToRenderCode = 'scene.then(returnedScene => { sceneToRender = returnedScene; });\r\n';
                } 

                let createEngineZip = (createEngineFunction === "createEngine") ?
                    zipVariables :
                    zipVariables + defaultEngineZip;

                    this.props.globalState.zipCode =
                    createEngineZip + ";\r\n" +
                    code + ";\r\n" +
                    sceneToRenderCode;
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

                if (this.props.globalState.runtimeMode === RuntimeMode.Editor && window.innerWidth > this.props.globalState.MobileSizeTrigger) {
                    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                        this._engine.resize();
                    }
                }

                if (this._scene.activeCamera || this._scene.activeCameras.length > 0) {
                    this._scene.render();
                }

                // Update FPS if camera is not a webxr camera
                if(!(this._scene.activeCamera && 
                    this._scene.activeCamera.getClassName && 
                    this._scene.activeCamera.getClassName() === 'WebXRCamera')) {
                    if (this.props.globalState.runtimeMode !== RuntimeMode.Full) {
                        this.props.globalState.fpsElement.innerHTML = this._engine.getFps().toFixed() + " fps";
                    }
                }
            });

            if (checkSceneCount && this._engine.scenes.length === 0) {
                this.props.globalState.onErrorObservable.notifyObservers({message: "You must at least create a scene."});
                return;
            }

            if (checkCamera && this._engine.scenes[0].activeCamera == null) {
                this.props.globalState.onErrorObservable.notifyObservers({message: "You must at least create a camera."});
                return;
            } else if (globalObject.scene.then) {
                globalObject.scene.then(function () {
                });
            } else {
                this._engine.scenes[0].executeWhenReady(function () {
                });
            }
        } catch (err) {
            this.props.globalState.onErrorObservable.notifyObservers(err);
        }
    }

    public render() {
        return (
            <canvas id="renderingCanvas" ref={this._canvasRef}></canvas>
        )
    }
}