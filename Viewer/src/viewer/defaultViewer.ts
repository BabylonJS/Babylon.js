import { AbstractViewer } from './viewer';
import { Observable, Engine, Scene, ArcRotateCamera, Vector3, SceneLoader, Mesh, HemisphericLight } from 'babylonjs';

// A small hack for the inspector. to be removed!
import * as BABYLON from 'babylonjs';
window['BABYLON'] = BABYLON;

export class DefaultViewer extends AbstractViewer {

    protected initScene() {
        return super.initScene();

    }

    protected onTemplatesLoaded() {

        this.showLoadingScreen();

        // navbar
        let viewerElement = this.templateManager.getTemplate('viewer');
        let navbar = this.templateManager.getTemplate('navBar');

        viewerElement.parent.addEventListener('pointerover', () => {
            navbar.parent.style.bottom = '0px';
        });

        viewerElement.parent.addEventListener('pointerout', () => {
            navbar.parent.style.bottom = '-80px';
        });

        return super.onTemplatesLoaded();
    }

    protected prepareContainerElement() {
        this.containerElement.style.display = 'flex';
    }

    protected initCameras(): Promise<Scene> {
        var camera = new BABYLON.ArcRotateCamera("camera", 4.712, 1.571, 0.05, BABYLON.Vector3.Zero(), this.scene);
        camera.attachControl(this.engine.getRenderingCanvas(), true);
        camera.wheelPrecision = 100.0;
        camera.minZ = 0.01;
        camera.maxZ = 1000;
        camera.useFramingBehavior = true;

        return Promise.resolve(this.scene);
    }

    protected initLights(): Promise<Scene> {
        var light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        return Promise.resolve(this.scene);
    }

    public loadModel(model: any = this.configuration.model): Promise<Scene> {
        this.showLoadingScreen();

        //TODO should the scene be cleared?

        let modelUrl = (typeof model === 'string') ? model : model.url;
        let parts = modelUrl.split('/');
        let filename = parts.pop();
        let base = parts.join('/') + '/';

        return new Promise((resolve, reject) => {
            SceneLoader.Append(base, filename, this.scene, (scene) => {
                console.log("scene loaded");
                //this.scene.debugLayer.show();

                // TODO do it better, no casting!
                let camera: ArcRotateCamera = <ArcRotateCamera>this.scene.activeCamera;

                camera.setTarget(scene.meshes[0]);

                this.engine.runRenderLoop(() => {
                    this.scene.render();
                });

                this.hideLoadingScreen();
                this.showViewer().then(() => {
                    resolve(this.scene);
                });

            }, undefined, (e, m, exception) => {
                console.log(m, exception);
                reject(m);
            });
        })


    }

    public showLoadingScreen() {
        return this.templateManager.getTemplate('loadingScreen').show();
    }

    public hideLoadingScreen() {
        return this.templateManager.getTemplate('loadingScreen').hide();
    }

    public showViewer() {
        return this.templateManager.getTemplate('viewer').show().then(() => {
            this.engine.resize();
        });
    }

}