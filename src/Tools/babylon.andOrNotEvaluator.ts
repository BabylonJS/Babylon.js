module BABYLON.Internals {
    export class AndOrNotEvaluator {
        public static Eval(query: string, evaluateCallback: (val: any) => boolean): boolean {
            if (!query.match(/\([^\(\)]*\)/g)) {
                query = AndOrNotEvaluator._HandleParenthesisContent(query, evaluateCallback);
            }
            else {
                query = query.replace(/\([^\(\)]*\)/g, r => {
                    // remove parenthesis
                    r = r.slice(1, r.length - 1);
                    return AndOrNotEvaluator._HandleParenthesisContent(r, evaluateCallback);
                });
            }

            if (query === "true") {
                return true;
            }

            if (query === "false") {
                return false;
            }

            return AndOrNotEvaluator.Eval(query, evaluateCallback);
        }

        private static _HandleParenthesisContent(parenthesisContent: string, evaluateCallback: (val) => boolean): string {
            evaluateCallback = evaluateCallback || ((r) => {
                return r === "true" ? true : false;
            });

            var result;
            var or = parenthesisContent.split("||");

            for (var i in or) {
                var ori = AndOrNotEvaluator._SimplifyNegation(or[i].trim());
                var and = ori.split("&&");

                if (and.length > 1) {
                    for (var j = 0; j < and.length; ++j) {
                        var andj = AndOrNotEvaluator._SimplifyNegation(and[j].trim());
                        if (andj !== "true" && andj !== "false") {
                            if (andj[0] === "!") {
                                result = !evaluateCallback(andj.substring(1));
                            }
                            else {
                                result = evaluateCallback(andj);
                            }
                        }
                        else {
                            result = andj === "true" ? true : false;
                        }
                        if (!result) { // no need to continue since 'false && ... && ...' will always return false
                            ori = "false";
                            break;
                        }
                    }
                }

                if (result || ori === "true") { // no need to continue since 'true || ... || ...' will always return true
                    result = true;
                    break;
                }

                // result equals false (or undefined)

                if (ori !== "true" && ori !== "false") {
                    if (ori[0] === "!") {
                        result = !evaluateCallback(ori.substring(1));
                    }
                    else {
                        result = evaluateCallback(ori);
                    }
                }
                else {
                    result = ori === "true" ? true : false;
                }
            }

            // the whole parenthesis scope is replaced by 'true' or 'false'
            return result ? "true" : "false";
        }

        private static _SimplifyNegation(booleanString: string): string {
            booleanString = booleanString.replace(/^[\s!]+/, r => {
                // remove whitespaces
                r = r.replace(/[\s]/g, () => "");
                return r.length % 2 ? "!" : "";
            });

            booleanString = booleanString.trim();

            if (booleanString === "!true") {
                booleanString = "false";
            }
            else if (booleanString === "!false") {
                booleanString = "true";
            }

            return booleanString;
        }
    }
}