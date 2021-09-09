import * as standardMaterial from "babylonjs/Materials/standardMaterial"
import * as scene from "babylonjs/scene"
import * as nullEngine from "babylonjs/Engines/nullEngine"

// @ponicode
describe("needAlphaBlending", () => {
    let inst: any
    let inst2: any
    let inst3: any

    beforeEach(() => {
        inst = new nullEngine.NullEngine({ limitDeviceRatio: 1.0, autoEnableWebVR: false, disableWebGL2Support: false, audioEngine: false, audioEngineOptions: { audioContext: 75, audioDestination: false }, deterministicLockstep: true, lockstepMaxSteps: 0.1, timeStep: 0.1, doNotHandleContextLost: true, doNotHandleTouchAction: true, useHighPrecisionFloats: true, xrCompatible: false, useHighPrecisionMatrix: true, failIfMajorPerformanceCaveat: false, adaptToDeviceRatio: true, alpha: false, antialias: false, depth: true, desynchronized: false, powerPreference: "high-performance", premultipliedAlpha: true, preserveDrawingBuffer: true, stencil: true }, true)
        inst2 = new scene.Scene(inst, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: false, useClonedMeshMap: false, virtual: false })
        inst3 = new standardMaterial.StandardMaterial("object", inst2)
    })

    test("0", () => {
        let result: any = inst3.needAlphaBlending()
        expect(result).toBe(undefined)
    })
})

// @ponicode
describe("getAlphaTestTexture", () => {
    let inst: any
    let inst2: any
    let inst3: any
    let inst4: any

    beforeEach(() => {
        inst = new nullEngine.NullEngine({ limitDeviceRatio: 1.0, autoEnableWebVR: false, disableWebGL2Support: false, audioEngine: false, audioEngineOptions: { audioContext: 75, audioDestination: false }, deterministicLockstep: true, lockstepMaxSteps: 0.1, timeStep: 0.1, doNotHandleContextLost: true, doNotHandleTouchAction: true, useHighPrecisionFloats: true, xrCompatible: false, useHighPrecisionMatrix: true, failIfMajorPerformanceCaveat: false, adaptToDeviceRatio: true, alpha: false, antialias: false, depth: true, desynchronized: false, powerPreference: "high-performance", premultipliedAlpha: true, preserveDrawingBuffer: true, stencil: true }, true)
        inst2 = new scene.Scene(inst, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: false, useClonedMeshMap: true, virtual: true })
        inst3 = new standardMaterial.StandardMaterial("array", inst2)
        inst4 = new standardMaterial.StandardMaterial("array", inst2)
    })

    test("0", () => {
        let result: any = inst3.getAlphaTestTexture()
        expect(result).toBe(null)
    })
})
