/**
 * Define an interface for a node to indicate it's info for accessibility.
 */
 export interface IAccessibilityTag {
    /**
     * A boolean indicating that this node is salience to be considered in the accesibility tree. (false by default)
     */
    isSalient: boolean;
    /**
     * A string as alt text of the node, describing what the node is/does, for accessibility purpose.
     */
    description: string;
}