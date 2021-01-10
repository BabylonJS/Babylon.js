/**
 * Get result using toRef function
 * @param func defines an original toRef function
 * @param ref defines ref value
 * @param args defines original function params
 */
export function byRefFunc<T>(func: Function, ref: any, ...args: any[]): T {
    return func.apply(args, ref);
}