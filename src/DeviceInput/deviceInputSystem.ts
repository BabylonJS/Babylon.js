import { Engine } from '../Engines/engine';
import { INative } from '../Engines/Native/nativeInterfaces';
import { NativeDeviceInputWrapper } from './Implementations/nativeDeviceInputWrapper';
import { WebDeviceInputSystem } from './Implementations/webDeviceInputSystem';
import { IDeviceInputSystem } from './Interfaces/inputInterfaces';

declare const _native: INative;

/**
 * This class will take all inputs from Keyboard, Pointer, and
 * any Gamepads and provide a polling system that all devices
 * will use.  This class assumes that there will only be one
 * pointer device and one keyboard.
 */
export class DeviceInputSystem {
    /**
     * Creates a new DeviceInputSystem instance or returns existing one in engine
     * @param engine Engine to assign input system to
     * @returns The new instance
     */
    public static Create(engine: Engine): IDeviceInputSystem {
        // If running in Babylon Native, then defer to the native input system, which has the same public contract
        if (!engine.deviceInputSystem) {
            engine.deviceInputSystem = (typeof _native !== 'undefined' && _native.DeviceInputSystem) ? new NativeDeviceInputWrapper(new _native.DeviceInputSystem()) : new WebDeviceInputSystem(engine);
        }

        return engine.deviceInputSystem;
    }
}
