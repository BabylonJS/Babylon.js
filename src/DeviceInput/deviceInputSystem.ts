/**
 * IDeviceInputSystem
 * Interface for input systems
 */
export interface IDeviceInputSystem
{
    /**
     * pollInput - Get value from input
     * @param deviceName - name of device
     * @param inputIndex - index of specific input
     * @returns value of input
     */
    pollInput(deviceName : string, inputIndex : number) : number;
    /**
     * onDeviceConnected - Set callback for when a device is connected
     * @param callback - function to perform when a device is connected
     */
    onDeviceConnected(callback : (deviceName : string) => void) : void;
    /**
     * onDeviceDisconnected - Set callback for when a device is disconnected
     * @param callback - function to perform when a device is disconnected
     */
    onDeviceDisconnected(callback : (deviceName : string) => void) : void;
}