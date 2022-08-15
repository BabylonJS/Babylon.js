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
     * Customize the event of the accessible object.
     * This will be applied on the generated HTML twin node.
     */
    eventHandler?: { [key in keyof HTMLElementEventMap]: (e?: Event) => void };

    /**
     * ARIA roles and attributes to customize accessibility support.
     * If you use BabylonJS's accessibility html twin renderer, and want to override the default behavior (not suggested), this can be your way.
     * Learn more about ARIA: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
     */
    role?: AcceptedRole;
    aria?: { [key in AcceptedARIA]: any };
}

// Based on https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles
type AcceptedRole =
    | "toolbar"
    | "tooltip"
    | "feed"
    | "math"
    | "presentation"
    | "none"
    | "note"
    | "application"
    | "article"
    | "cell"
    | "columnheader"
    | "definition"
    | "directory"
    | "document"
    | "figure"
    | "group"
    | "heading"
    | "img"
    | "list"
    | "listitem"
    | "meter"
    | "row"
    | "rowgroup"
    | "rowheader"
    | "separator"
    | "table"
    | "term"
    | "scrollbar"
    | "searchbox"
    | "separator"
    | "slider"
    | "spinbutton"
    | "switch"
    | "tab"
    | "tabpanel"
    | "treeitem"
    | "combobox"
    | "menu"
    | "menubar"
    | "tablist"
    | "tree"
    | "treegrid"
    | "banner"
    | "complementary"
    | "contentinfo"
    | "form"
    | "main"
    | "navigation"
    | "region"
    | "search"
    | "alert"
    | "log"
    | "marquee"
    | "status"
    | "timer"
    | "alertdialog"
    | "dialog";

// Based on https://developer.mozilla.org/en-US/docs/web/Accessibility/ARIA/Attributes#aria_attribute_types
type AcceptedARIA =
    | "aria-autocomplete"
    | "aria-checked"
    | "aria-disabled"
    | "aria-errormessage"
    | "aria-expanded"
    | "aria-haspopup"
    | "aria-hidden"
    | "aria-invalid"
    | "aria-label"
    | "aria-level"
    | "aria-modal"
    | "aria-multiline"
    | "aria-multiselectable"
    | "aria-orientation"
    | "aria-placeholder"
    | "aria-pressed"
    | "aria-readonly"
    | "aria-required"
    | "aria-selected"
    | "aria-sort"
    | "aria-valuemax"
    | "aria-valuemin"
    | "aria-valuenow"
    | "aria-valuetext"
    | "aria-busy"
    | "aria-live"
    | "aria-relevant"
    | "aria-atomic"
    | "aria-dropeffect"
    | "aria-grabbed"
    | "aria-activedescendant"
    | "aria-colcount"
    | "aria-colindex"
    | "aria-colspan"
    | "aria-controls"
    | "aria-describedby"
    | "aria-description"
    | "aria-details"
    | "aria-errormessage"
    | "aria-flowto"
    | "aria-labelledby"
    | "aria-owns"
    | "aria-posinset"
    | "aria-rowcount"
    | "aria-rowindex"
    | "aria-rowspan"
    | "aria-setsize";
