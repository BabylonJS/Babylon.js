/**
 * Constant used to convert a value to gamma space
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ToGammaSpace = 1 / 2.2;

/**
 * Constant used to convert a value to linear space
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ToLinearSpace = 2.2;

/**
 * Constant Golden Ratio value in Babylon.js
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * Constant used to define the minimal number value in Babylon.js
 * Forced to "let" so the users can change it if they want to use another epsilon value
 * @ignorenaming
 */
// eslint-disable-next-line prefer-const
export let Epsilon = 0.001;
