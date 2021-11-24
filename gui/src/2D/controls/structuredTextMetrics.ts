export class StructuredTextMetrics {
    // Those properties are always defined on creation
    public width: number = 0;
    public height: number = 0;
    public ascent: number = 0;
    public descent: number = 0;

    // If computed is true, then the following properties are computed
    public computed: boolean = false;
    public x: number = 0;
    public baselineY: number = 0;

    constructor(width: number, height: number, ascent: number, descent: number) {
        if ( width ) { this.width = width ; }
        if ( height ) { this.height = height ; }
        if ( ascent ) { this.ascent = ascent ; }
        if ( descent ) { this.descent = descent ; }
    }

    public fuseWithRightPart(metrics: StructuredTextMetrics) {
        // widths are summed
        this.width += metrics.width;

        if (! this.computed || ! metrics.computed) {
            this.computed = false;
            return;
        }

        // .x and .baselineY does not change,
        // while .height, .ascent and .descent are maximized
        if (metrics.height > this.height) { this.height = metrics.height; }
        if (metrics.ascent > this.ascent) { this.ascent = metrics.ascent; }
        if (metrics.descent > this.descent) { this.descent = metrics.descent; }
    }
}
