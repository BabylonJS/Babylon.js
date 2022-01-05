import * as scene from "babylonjs/scene"
import * as engine from "babylonjs/Engines/nullEngine"

// @ponicode
describe("_clear", () => {
    let inst: any
    let inst2: any

    beforeEach(() => {
        inst = new engine.NullEngine({ limitDeviceRatio: 1.0, autoEnableWebVR: false, disableWebGL2Support: false, audioEngine: false, audioEngineOptions: { audioContext: "ar", audioDestination: "it" }, deterministicLockstep: true, lockstepMaxSteps: 0.5, timeStep: 0.1, doNotHandleContextLost: false, doNotHandleTouchAction: true, useHighPrecisionFloats: false, xrCompatible: true, useHighPrecisionMatrix: true, failIfMajorPerformanceCaveat: false, adaptToDeviceRatio: false, alpha: true, antialias: false, depth: true, desynchronized: true, powerPreference: "default", premultipliedAlpha: true, preserveDrawingBuffer: false, stencil: false }, true)
        inst2 = new scene.Scene(inst, { useGeometryUniqueIdsMap: false, useMaterialMeshMap: false, useClonedMeshMap: false, virtual: false })
    })

    test("0", () => {
        inst2._clear()
    })
})

// @ponicode
describe("render", () => {
    let inst: any
    let inst2: any

    beforeEach(() => {
        inst = new engine.NullEngine(false, { limitDeviceRatio: 0.1, autoEnableWebVR: false, disableWebGL2Support: true, audioEngine: true, audioEngineOptions: { audioContext: false, audioDestination: "it" }, deterministicLockstep: true, lockstepMaxSteps: 1.0, timeStep: 10.0, doNotHandleContextLost: true, doNotHandleTouchAction: false, useHighPrecisionFloats: false, xrCompatible: true, useHighPrecisionMatrix: true, failIfMajorPerformanceCaveat: false, adaptToDeviceRatio: true, alpha: true, antialias: true, depth: false, desynchronized: true, powerPreference: "low-power", premultipliedAlpha: false, preserveDrawingBuffer: false, stencil: true }, true)
        inst2 = new scene.Scene(inst, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: true, useClonedMeshMap: true, virtual: true })
    })

    test("0", () => {
        let callFunction: any = () => {
            inst2.render(undefined, undefined)
        }
    
        expect(callFunction).toThrow('No camera defined')
    })
})
