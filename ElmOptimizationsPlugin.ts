import type * as webpack from 'webpack';

const htmlLazyReplacement = `			var same = i === yRefs.length;
			var recheck = [];
			while (same && i--)
			{
			    if (xRefs[i] !== yRefs[i]){
			        if (typeof(xRefs[i]) === "object" && !(Array.isArray(xRefs[i])) && xRefs[i]['$$'] === undefined){
			            recheck.push(i);
			        } else {
			            same = false;
			        }
			    }
			}
			i = recheck.length;
			while (same && i--){
			    var check = recheck[i];
			    for (var key in xRefs[check])
			    {
			        same = (xRefs[check][key] === yRefs[check][key]);
			        if (!same) {break;}
			    }
			}`

export type ElmOptimizationsPluginOptions = {
    htmlLazy: boolean;
    debug?: boolean;
} | null | undefined;

module.exports = function(this: webpack.LoaderContext<ElmOptimizationsPluginOptions>, source: string): string {
    const options = this.getOptions();

    if (options) {
        if (options.htmlLazy) {
            source = source.replace(/var\s+same\s*=\s*i\s*=+\s*yRefs.length;\s*while\s*\(\s*same\s*&&\s*i--\)\s*\{\s*same\s*=\s*xRefs\[i\]\s*=+\s*yRefs\[i\];\s*\}/g, htmlLazyReplacement);
        }

        if (options.debug) {
            require('fs').writeFileSync(require('path').join(__dirname, 'ElmOptimizationsPlugin.debug.js'), source);
        }
    }

    return source;
}
