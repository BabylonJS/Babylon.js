/**
 * Define an interface for a node to indicate it's info for accessibility.
 * By default, Node type doesn't imply accessibility info unless this tag is assigned. Whereas GUI controls already indicate accessibility info, but one can override the info using this tag.
 */
 export interface IAccessibilityTag {
    /**
     * A string as alt text of the node, describing what the node is/does, for accessibility purpose.
     */
    description?: string;

    /**
     * ARIA lables to customize accessibility support.
     * If you use BabylonJS's accessibility html twin renderer, and want to override the default behavior (not suggested), this can be your way.
     * Learn more about ARIA: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
     */
    role?: string;
    aria?: {[key: string]: string}
}