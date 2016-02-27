'use strict';

var through = require('through2');
var PluginError = require('gulp-util').PluginError;
var singleComment = 1;
var multiComment = 2;

function uncomment(str, opts) {
    opts = opts || {};

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

function gulpUncomment(options) {
    return main(options, uncomment);
}

function main(options, func) {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }
        if (file.isStream()) {
            cb(new PluginError("Remove Shader Comments", "Streaming not supported."));
        }
        file.contents = new Buffer(func(file.contents.toString(), options));
        this.push(file);
        return cb();
    });
}

module.exports = gulpUncomment;