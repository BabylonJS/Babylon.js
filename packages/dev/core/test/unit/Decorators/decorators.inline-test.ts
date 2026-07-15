/* eslint-disable no-console */
/**
 * Quick inline test to verify TC39 decorators work correctly.
 * Run with: npx ts-node --esm --project tsconfig.test.json packages/dev/core/test/unit/Decorators/decorators.inline-test.ts
 */

// Test 1: Symbol.metadata polyfill
(Symbol as any).metadata ??= Symbol.for("Symbol.metadata");

// Test 2: A simple TC39 class field decorator
function trackField(displayName: string) {
    return function <This, V>(_value: undefined, context: ClassFieldDecoratorContext<This, V>) {
        const key = `__tracked_${String(context.name)}`;
        if (!Object.hasOwn(context.metadata, key)) {
            (context.metadata as any)[key] = displayName;
        }
    };
}

// Test 3: A TC39 accessor decorator (like expandToProperty)
function doubleAccessor<This, V extends number>(
    _value: ClassAccessorDecoratorTarget<This, V>,
    _context: ClassAccessorDecoratorContext<This, V>
): ClassAccessorDecoratorResult<This, V> {
    return {
        get(this: This): V {
            return (_value.get.call(this) * 2) as V;
        },
        set(this: This, value: V) {
            _value.set.call(this, value);
        },
    };
}

class TestClass {
    @trackField("My Number")
    myNum: number = 42;

    @doubleAccessor
    accessor doubled: number = 5;
}

// Verify metadata
const metadata = (TestClass as any)[Symbol.metadata];
console.assert(metadata !== undefined, "Symbol.metadata should be set on class");
console.assert((metadata as any).__tracked_myNum === "My Number", "Field decorator should store metadata");

// Verify accessor
const instance = new TestClass();
console.assert(instance.doubled === 10, `Accessor should return doubled value, got ${instance.doubled}`);
instance.doubled = 7;
console.assert(instance.doubled === 14, `After setting 7, accessor should return 14, got ${instance.doubled}`);

// Test 4: Inheritance
class ChildClass extends TestClass {
    @trackField("Child Prop")
    childProp: string = "hello";
}

const childMeta = (ChildClass as any)[Symbol.metadata];
console.assert(childMeta !== undefined, "Child should have metadata");
console.assert((childMeta as any).__tracked_childProp === "Child Prop", "Child metadata should have its own properties");

// Walk the prototype chain
const parentMeta = Object.getPrototypeOf(childMeta);
console.assert(parentMeta !== null, "Child metadata prototype should be parent metadata");
console.assert((parentMeta as any).__tracked_myNum === "My Number", "Parent metadata should be accessible via prototype chain");

console.log("All decorator tests passed!");
