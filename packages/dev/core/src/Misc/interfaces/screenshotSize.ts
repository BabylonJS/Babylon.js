/**
 * Interface for screenshot methods with describe argument called `size` as object with options
 * @link https://doc.babylonjs.com/api/classes/babylon.screenshottools
 */
export interface IScreenshotSize {
  /**
   * number in pixels for canvas height
   */
  height?: number;

  /**
   * multiplier allowing render at a higher or lower resolution
   * If value is defined then height and width will be ignored and taken from camera
   */
  precision?: number;

  /**
   * number in pixels for canvas width
   */
  width?: number;
}
