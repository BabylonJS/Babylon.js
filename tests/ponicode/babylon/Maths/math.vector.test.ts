import * as math_vector from "babylonjs/Maths/math.vector"
// @ponicode
describe("getClassName", () => {
    let inst: any

    beforeEach(() => {
        inst = new math_vector.Vector2(0, 0)
    })

    test("0", () => {
        let result: any = inst.getClassName()
        expect(result).toBe("Vector2")
    })
})

// @ponicode
describe("getHashCode", () => {
    let inst: any

    beforeEach(() => {
        inst = new math_vector.Vector2(0, 10.0)
    })

    test("0", () => {
        let result: any = inst.getHashCode()
        expect(result).toBe(10)
    })
})

// @ponicode
describe("copyFromFloats", () => {
    let inst: any

    beforeEach(() => {
        inst = new math_vector.Vector2(0, 0)
    })

    test("0", () => {
        let result: any = inst.copyFromFloats(0, 0)
        expect(result).toMatchObject({ x: 0, y: 0 })
    })

    test("1", () => {
        let result: any = inst.copyFromFloats(1.0, 10.0)
        expect(result).toMatchObject({ x: 1, y: 10 })
    })

    test("2", () => {
        let result: any = inst.copyFromFloats(NaN, NaN)
        expect(result).toMatchObject({ x: NaN, y: NaN })
    })

    test("3", () => {
        let result: any = inst.copyFromFloats(Infinity, Infinity)
        expect(result).toMatchObject({ x: Infinity, y: Infinity })
    })
})

// @ponicode
describe("add", () => {
    let inst: any

    beforeEach(() => {
        inst = new math_vector.Vector2(1, 2)
    })

    test("0", () => {
        let param1: any = new math_vector.Vector2(-100, -1)
        let result: any = inst.add(param1)
        expect(result).toMatchObject({ x: -99, y: 1 })
    })

    test("1", () => {
        let param1: any = new math_vector.Vector2(-Infinity, -Infinity)
        let result: any = inst.add(param1)
        expect(result).toMatchObject({ x: -Infinity, y: -Infinity })
    })
})

// @ponicode
describe("fract", () => {
    let inst: any
    let inst2: any
    let inst3: any

    beforeEach(() => {
        inst = new math_vector.Vector2(0, 0)
        inst2 = new math_vector.Vector2(0.5, 0.99)
        inst3 = new math_vector.Vector2(5, 0.99)
    })

    test("0", () => {
        let result: any = inst.fract()(undefined, undefined)
        expect(result).toMatchObject({ x: 0, y: 0 })
    })

    test("1", () => {
        let result: any = inst2.fract()(undefined, undefined)
        expect(result).toMatchObject({ x: 0.5, y: 0.99 })
    })

    test("2", () => {
        let result: any = inst3.fract()(undefined, undefined)
        expect(result).toMatchObject({ x: 0, y: 0.99 })
    })
})
