var fs = require('fs');
var path = require('path');
 function parse(loader, source, context, cb) {
    var imports = [];
    var importPattern = /@import ([.\/\w_-]+);/gi;
    var match = importPattern.exec(source);
     while (match != null) {
        imports.push({
            key: match[1],
            target: match[0],
            content: ''
        });
        match = importPattern.exec(source);
    }
     source = uncomment(source);
     processImports(loader, source, context, imports, cb);
}
 var singleComment = 1;
var multiComment = 2;
 function uncomment(str) {
     var currentChar;
    var nextChar;
    var insideString = false;
    var insideComment = 0;
    var offset = 0;
    var ret = '';
     str = str.replace(/\r\n/g, '\n');
    str = str.replace(/[ \f\t\v]+/g, ' ');
    str = str.replace(/^\s*\n/gm, '');
    str = str.replace(/ \+ /g, '+');
    str = str.replace(/ \- /g, '-');
    str = str.replace(/ \/ /g, '/');
    str = str.replace(/ \* /g, '*');
    str = str.replace(/ > /g, '>');
    str = str.replace(/ < /g, '<');
    str = str.replace(/ >= /g, '>=');
    str = str.replace(/ <= /g, '<=');
    str = str.replace(/ \+= /g, '+=');
    str = str.replace(/ \-= /g, '-=');
    str = str.replace(/ \/= /g, '/=');
    str = str.replace(/ \*= /g, '*=');
    str = str.replace(/ = /g, '=');
    str = str.replace(/, /g, ',');
    str = str.replace(/\n\n/g, '\n');
    str = str.replace(/\n /g, '\n');
     for (var i = 0; i < str.length; i++) {
        currentChar = str[i];
        nextChar = str[i + 1];
         if (!insideComment && currentChar === '"') {
            var escaped = str[i - 1] === '\\' && str[i - 2] !== '\\';
            if (!escaped) {
                insideString = !insideString;
            }
        }
         if (insideString) {
            continue;
        }
         if (!insideComment && currentChar + nextChar === '//') {
            ret += str.slice(offset, i);
            offset = i;
            insideComment = singleComment;
            i++;
        } else if (insideComment === singleComment && currentChar === '\n') {
            insideComment = 0;
            offset = i;
        } else if (!insideComment && currentChar + nextChar === '/*') {
            ret += str.slice(offset, i);
            offset = i;
            insideComment = multiComment;
            i++;
            continue;
        } else if (insideComment === multiComment && currentChar + nextChar === '*/') {
            i++;
            insideComment = 0;
            offset = i + 1;
            continue;
        }
    }
     return ret + (insideComment ? '' : str.substr(offset));
}
 function processImports(loader, source, context, imports, cb) {
    if (imports.length === 0) {
        return cb(null, source);
    }
     var imp = imports.pop();
     loader.resolve(context, imp.key + '.fx', function (err, resolved) {
        if (err) {
            return cb(err);
        }
         loader.addDependency(resolved);
        fs.readFile(resolved, 'utf-8', function (err, src) {
            if (err) {
                return cb(err);
            }
             parse(loader, src, path.dirname(resolved), function (err, bld) {
                if (err) {
                    return cb(err);
                }
                 source = source.replace(imp.target, bld);
                processImports(loader, source, context, imports, cb);
            });
        });
    });
}
 module.exports = parse; 