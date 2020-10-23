import { IEvent } from '../../Events/deviceInputEvents';
import { Nullable } from '../../types';
import { DeviceType, PointerInput } from '../InputDevices/deviceEnums';
import { DeviceSource, DeviceSourceManager } from '../InputDevices/deviceSourceManager';
import { DeviceInput } from '../InputDevices/deviceTypes';

/**
 * Class with event factory for device input events
 */
export class DeviceInputEventFactory {

    /**
     * Generate a Native friendly event, currently only generates IKeyboardEvents and IPointerEvents
     * @param target element where input is being read from
     * @param eventType string of event type
     * @param device DeviceSource object that can be used to access all of the current values for a given device
     * @param inputIndex input index of device input triggering the event
     * @param currentState value of input
     * @param deviceSourceManager reference to DeviceSourceManager for additional input data needed
     * @returns native friendly event
     */
    public static GenerateEvent(target: any, eventType: string, device: DeviceSource<DeviceType>, inputIndex: DeviceInput<DeviceType>, currentState: Nullable<number>, deviceSourceManager?: DeviceSourceManager): IEvent {
        // If we have access to a DeviceSourceManager, check for additional keys pressed
        const altKey = (deviceSourceManager?.getDeviceSource(DeviceType.Keyboard)?.getInput(18) == 1);
        const ctrlKey = (deviceSourceManager?.getDeviceSource(DeviceType.Keyboard)?.getInput(17) == 1);
        const metaKey = (deviceSourceManager?.getDeviceSource(DeviceType.Keyboard)?.getInput(91) == 1
            || deviceSourceManager?.getDeviceSource(DeviceType.Keyboard)?.getInput(92) == 1
            || deviceSourceManager?.getDeviceSource(DeviceType.Keyboard)?.getInput(93) == 1);
        const shiftKey = (deviceSourceManager?.getDeviceSource(DeviceType.Keyboard)?.getInput(16) == 1);

        let generatedEvent = {
            target: target,
            type: eventType,
            preventDefault: () => {}
        };

        if (device.deviceType === DeviceType.Mouse || device.deviceType === DeviceType.Touch) {
            const pointerX = device.getInput(PointerInput.Horizontal) || 0;
            const pointerY = device.getInput(PointerInput.Vertical) || 0;
            // If dealing with a change to the delta, grab values for event init
            const movementX = (inputIndex === PointerInput.DeltaHorizontal) ? device.getInput(PointerInput.DeltaHorizontal) : 0;
            const movementY = (inputIndex === PointerInput.DeltaVertical) ? device.getInput(PointerInput.DeltaVertical) : 0;
            // Get offsets from container
            const offsetX = (inputIndex === PointerInput.DeltaHorizontal && target) ? (device.getInput(PointerInput.DeltaHorizontal) - target.getBoundingClientRect().x) : 0;
            const offsetY = (inputIndex === PointerInput.DeltaVertical && target) ? (device.getInput(PointerInput.DeltaVertical) - target.getBoundingClientRect().y) : 0;

            Object.defineProperties(generatedEvent, {
                pointerId: {
                    value: (device.deviceType === DeviceType.Mouse ? 1 : device.deviceSlot)
                },
                clientX: {
                    value: pointerX
                },
                clientY: {
                    value: pointerY
                },
                deltaX: {
                    value: movementX
                },
                deltaY: {
                    value: movementY
                },
                offsetX: {
                    value: offsetX
                },
                offsetY: {
                    value: offsetY
                },
                x: {
                    value: pointerX
                },
                y: {
                    value: pointerY
                },
                altKey: {
                    value: altKey
                },
                ctrlKey: {
                    value: ctrlKey
                },
                metaKey: {
                    value: metaKey
                },
                shiftKey: {
                    value: shiftKey
                }
            });

            if (inputIndex >= PointerInput.LeftClick && inputIndex <= PointerInput.RightClick) {
                Object.defineProperty(generatedEvent, 'button', {value: inputIndex});
            }
            else if (inputIndex === PointerInput.MouseWheelX || inputIndex === PointerInput.MouseWheelY || inputIndex === PointerInput.MouseWheelZ) {
                const deltaX = device.getInput(PointerInput.MouseWheelX) || 0;
                const deltaY = device.getInput(PointerInput.MouseWheelY) || 0;
                const deltaZ = device.getInput(PointerInput.MouseWheelZ) || 0;

                Object.defineProperties(generatedEvent, {
                    deltaX: {
                        value: deltaX
                    },
                    deltaY: {
                        value: deltaY
                    },
                    deltaZ: {
                        value: deltaZ
                    }
                });
            }
        }
        else if (device.deviceType === DeviceType.Keyboard) {
            Object.defineProperties(generatedEvent, {
                key: {
                    value: String.fromCharCode(inputIndex)
                },
                keyCode: {
                    value: inputIndex
                }
            });
        }

        return generatedEvent;
    }
}