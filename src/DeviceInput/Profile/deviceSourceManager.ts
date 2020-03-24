//import { IDeviceInputSystem } from '../deviceInputSystem';
//import { WebDeviceInputSystem } from '../../DeviceInput/Systems/webDeviceInputSystem';
import { Scene } from '../../scene';
import { Engine } from '../../Engines/engine';

/**
 * DeviceSourceManager
 * Initializes Input System and keeps track of devices
 */
export class DeviceSourceManager
{
    //private _deviceInputSystem : IDeviceInputSystem;

    /**
     * Constructor
     * @param scene - Needed to get engine
     */
    constructor(scene : Scene)
    {
        var engine = scene.getEngine();
        // Check if DOM is available
        if (engine instanceof Engine)
        {
            console.log("test");
            //console.log(scene.getEngine() instanceof Engine);
            //console.log(scene.getEngine() instanceof ThinEngine);
            //this._deviceInputSystem = new WebDeviceInputSystem(canvas);
        }
    }
}