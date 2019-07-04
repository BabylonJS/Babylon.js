import {WebXRExperienceHelper} from "./webXRExperienceHelper"
import { Scene } from 'scene';
import { WebXRInput } from './webXRInput';
import { WebXRControllerModelLoader } from './webXRControllerModelLoader';
import { WebXRControllerPointerSelection } from './webXRControllerPointerSelection';
import { WebXRControllerTeleportation } from './webXRControllerTeleportation';
import { WebXRManagedOutputCanvas } from './webXRManagedOutputCanvas';
import { WebXREnterExitUI } from './webXREnterExitUI';
import { AbstractMesh } from '../../Meshes/abstractMesh';
export class WebXRDefaultExperienceOptions {
    floorMeshes: Array<AbstractMesh>
}

export class WebXRDefaultExperience {
    public baseExperience:WebXRExperienceHelper;
    public input:WebXRInput;
    public controllerModelLoader:WebXRControllerModelLoader;
    public pointerSelection:WebXRControllerPointerSelection;
    public teleportation:WebXRControllerTeleportation;
    public enterExitUI:WebXREnterExitUI
    public outputCanvas:WebXRManagedOutputCanvas

    public static CreateAsync(scene:Scene, options:WebXRDefaultExperienceOptions){
        var result = new WebXRDefaultExperience();

        // Create base experience
        return WebXRExperienceHelper.CreateAsync(scene).then((xrHelper)=>{
            result.baseExperience = xrHelper;

            // Add controller support
            result.input = new WebXRInput(xrHelper);
            result.controllerModelLoader = new WebXRControllerModelLoader(result.input);
            result.pointerSelection = new WebXRControllerPointerSelection(result.input);
            result.teleportation = new WebXRControllerTeleportation(result.input, options.floorMeshes);

            // Create output canvas manager (this controls where the xr frames will be rendered)
            result.outputCanvas = new WebXRManagedOutputCanvas(xrHelper, scene.getEngine().getRenderingCanvas() as HTMLCanvasElement);

            // Create ui for entering/exiting xr
            return WebXREnterExitUI.CreateAsync(scene, result.baseExperience, {webXRManagedOutputCanvas: result.outputCanvas})
        }).then((ui)=>{
            result.enterExitUI = ui;
            return result
        })
    }
    constructor(){

    }
    public dispose(){

    }
}