(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":4,"timers":5}],6:[function(require,module,exports){
GLTFValidator = require('gltf-validator');
},{"gltf-validator":8}],7:[function(require,module,exports){
(function (process,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){(function (){
var dartNodeIsActuallyNode="undefined"!=typeof process&&(process.versions||{}).hasOwnProperty("node"),self=dartNodeIsActuallyNode?Object.create(globalThis):globalThis;if(self.scheduleImmediate="undefined"!=typeof setImmediate?function(e){setImmediate(e)}:function(e){setTimeout(e,0)},"undefined"!=typeof require)self.require=require;if("undefined"!=typeof exports)self.exports=exports;if("undefined"!=typeof process)self.process=process;if("undefined"!=typeof __dirname)self.__dirname=__dirname;if("undefined"!=typeof __filename)self.__filename=__filename;if("undefined"!=typeof Buffer)self.Buffer=Buffer;if(dartNodeIsActuallyNode){var url=("undefined"!=typeof __webpack_require__?__non_webpack_require__:require)("url");Object.defineProperty(self,"location",{value:{get href(){if(url.pathToFileURL)return url.pathToFileURL(process.cwd()).href+"/";else return"file://"+function(){var e=process.cwd();if("win32"!=process.platform)return e;else return"/"+e.replace(/\\/g,"/")}()+"/"}}}),function(){function e(){try{throw new Error}catch(n){var e=n.stack,r=new RegExp("^ *at [^(]*\\((.*):[0-9]*:[0-9]*\\)$","mg"),f=null;do{var t=r.exec(e);if(null!=t)f=t}while(null!=t);return f[1]}}var r=null;Object.defineProperty(self,"document",{value:{get currentScript(){if(null==r)r={src:e()};return r}}})}(),self.dartDeferredLibraryLoader=function(e,r,f){try{load(e),r()}catch(e){f(e)}}}(function dartProgram(){function copyProperties(a,b){var s=Object.keys(a)
for(var r=0;r<s.length;r++){var q=s[r]
b[q]=a[q]}}function mixinPropertiesHard(a,b){var s=Object.keys(a)
for(var r=0;r<s.length;r++){var q=s[r]
if(!b.hasOwnProperty(q))b[q]=a[q]}}function mixinPropertiesEasy(a,b){Object.assign(b,a)}var z=function(){var s=function(){}
s.prototype={p:{}}
var r=new s()
if(!(r.__proto__&&r.__proto__.p===s.prototype.p))return false
try{if(typeof navigator!="undefined"&&typeof navigator.userAgent=="string"&&navigator.userAgent.indexOf("Chrome/")>=0)return true
if(typeof version=="function"&&version.length==0){var q=version()
if(/^\d+\.\d+\.\d+\.\d+$/.test(q))return true}}catch(p){}return false}()
function inherit(a,b){a.prototype.constructor=a
a.prototype["$i"+a.name]=a
if(b!=null){if(z){a.prototype.__proto__=b.prototype
return}var s=Object.create(b.prototype)
copyProperties(a.prototype,s)
a.prototype=s}}function inheritMany(a,b){for(var s=0;s<b.length;s++)inherit(b[s],a)}function mixinEasy(a,b){mixinPropertiesEasy(b.prototype,a.prototype)
a.prototype.constructor=a}function mixinHard(a,b){mixinPropertiesHard(b.prototype,a.prototype)
a.prototype.constructor=a}function lazyOld(a,b,c,d){var s=a
a[b]=s
a[c]=function(){a[c]=function(){A.xP(b)}
var r
var q=d
try{if(a[b]===s){r=a[b]=q
r=a[b]=d()}else r=a[b]}finally{if(r===q)a[b]=null
a[c]=function(){return this[b]}}return r}}function lazy(a,b,c,d){var s=a
a[b]=s
a[c]=function(){if(a[b]===s)a[b]=d()
a[c]=function(){return this[b]}
return a[b]}}function lazyFinal(a,b,c,d){var s=a
a[b]=s
a[c]=function(){if(a[b]===s){var r=d()
if(a[b]!==s)A.nU(b)
a[b]=r}var q=a[b]
a[c]=function(){return q}
return q}}function makeConstList(a){a.immutable$list=Array
a.fixed$length=Array
return a}function convertToFastObject(a){function t(){}t.prototype=a
new t()
return a}function convertAllToFastObject(a){for(var s=0;s<a.length;++s)convertToFastObject(a[s])}var y=0
function instanceTearOffGetter(a,b){var s=null
return a?function(c){if(s===null)s=A.nO(b)
return new s(c,this)}:function(){if(s===null)s=A.nO(b)
return new s(this,null)}}function staticTearOffGetter(a){var s=null
return function(){if(s===null)s=A.nO(a).prototype
return s}}var x=0
function tearOffParameters(a,b,c,d,e,f,g,h,i,j){if(typeof h=="number")h+=x
return{co:a,iS:b,iI:c,rC:d,dV:e,cs:f,fs:g,fT:h,aI:i||0,nDA:j}}function installStaticTearOff(a,b,c,d,e,f,g,h){var s=tearOffParameters(a,true,false,c,d,e,f,g,h,false)
var r=staticTearOffGetter(s)
a[b]=r}function installInstanceTearOff(a,b,c,d,e,f,g,h,i,j){c=!!c
var s=tearOffParameters(a,false,c,d,e,f,g,h,i,!!j)
var r=instanceTearOffGetter(c,s)
a[b]=r}function setOrUpdateInterceptorsByTag(a){var s=v.interceptorsByTag
if(!s){v.interceptorsByTag=a
return}copyProperties(a,s)}function setOrUpdateLeafTags(a){var s=v.leafTags
if(!s){v.leafTags=a
return}copyProperties(a,s)}function updateTypes(a){var s=v.types
var r=s.length
s.push.apply(s,a)
return r}function updateHolder(a,b){copyProperties(b,a)
return a}var hunkHelpers=function(){var s=function(a,b,c,d,e){return function(f,g,h,i){return installInstanceTearOff(f,g,a,b,c,d,[h],i,e,false)}},r=function(a,b,c,d){return function(e,f,g,h){return installStaticTearOff(e,f,a,b,c,[g],h,d)}}
return{inherit:inherit,inheritMany:inheritMany,mixin:mixinEasy,mixinHard:mixinHard,installStaticTearOff:installStaticTearOff,installInstanceTearOff:installInstanceTearOff,_instance_0u:s(0,0,null,["$0"],0),_instance_1u:s(0,1,null,["$1"],0),_instance_2u:s(0,2,null,["$2"],0),_instance_0i:s(1,0,null,["$0"],0),_instance_1i:s(1,1,null,["$1"],0),_instance_2i:s(1,2,null,["$2"],0),_static_0:r(0,null,["$0"],0),_static_1:r(1,null,["$1"],0),_static_2:r(2,null,["$2"],0),makeConstList:makeConstList,lazy:lazy,lazyFinal:lazyFinal,lazyOld:lazyOld,updateHolder:updateHolder,convertToFastObject:convertToFastObject,updateTypes:updateTypes,setOrUpdateInterceptorsByTag:setOrUpdateInterceptorsByTag,setOrUpdateLeafTags:setOrUpdateLeafTags}}()
function initializeDeferredHunk(a){x=v.types.length
a(hunkHelpers,v,w,$)}var A={ns:function ns(){},
he(a,b,c){if(b.h("q<0>").b(a))return new A.dZ(a,b.h("@<0>").I(c).h("dZ<1,2>"))
return new A.c5(a,b.h("@<0>").I(c).h("c5<1,2>"))},
uG(a){return new A.f1("Field '"+A.b(a)+"' has been assigned during initialization.")},
bg(a){return new A.fm(a)},
mW(a){var s,r=a^48
if(r<=9)return r
s=a|32
if(97<=s&&s<=102)return s-87
return-1},
pW(a,b){var s=A.mW(B.a.B(a,b)),r=A.mW(B.a.B(a,b+1))
return s*16+r-(r&256)},
bU(a,b,c){if(a==null)throw A.d(new A.dI(b,c.h("dI<0>")))
return a},
dQ(a,b,c,d){A.aW(b,"start")
if(c!=null){A.aW(c,"end")
if(b>c)A.Z(A.Y(b,0,c,"start",null))}return new A.dP(a,b,c,d.h("dP<0>"))},
jQ(a,b,c,d){if(t.O.b(a))return new A.c9(a,b,c.h("@<0>").I(d).h("c9<1,2>"))
return new A.bd(a,b,c.h("@<0>").I(d).h("bd<1,2>"))},
p0(a,b,c){var s="count"
if(t.O.b(a)){A.h8(b,s)
A.aW(b,s)
return new A.cR(a,b,c.h("cR<0>"))}A.h8(b,s)
A.aW(b,s)
return new A.bh(a,b,c.h("bh<0>"))},
nq(){return new A.bJ("No element")},
ui(){return new A.bJ("Too few elements")},
bM:function bM(){},
dm:function dm(a,b){this.a=a
this.$ti=b},
c5:function c5(a,b){this.a=a
this.$ti=b},
dZ:function dZ(a,b){this.a=a
this.$ti=b},
dU:function dU(){},
b5:function b5(a,b){this.a=a
this.$ti=b},
c6:function c6(a,b){this.a=a
this.$ti=b},
hf:function hf(a,b){this.a=a
this.b=b},
f1:function f1(a){this.a=a},
fm:function fm(a){this.a=a},
c8:function c8(a){this.a=a},
nd:function nd(){},
dI:function dI(a,b){this.a=a
this.$ti=b},
q:function q(){},
ah:function ah(){},
dP:function dP(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.$ti=d},
aa:function aa(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
bd:function bd(a,b,c){this.a=a
this.b=b
this.$ti=c},
c9:function c9(a,b,c){this.a=a
this.b=b
this.$ti=c},
dD:function dD(a,b,c){var _=this
_.a=null
_.b=a
_.c=b
_.$ti=c},
ab:function ab(a,b,c){this.a=a
this.b=b
this.$ti=c},
lK:function lK(a,b,c){this.a=a
this.b=b
this.$ti=c},
cF:function cF(a,b,c){this.a=a
this.b=b
this.$ti=c},
bh:function bh(a,b,c){this.a=a
this.b=b
this.$ti=c},
cR:function cR(a,b,c){this.a=a
this.b=b
this.$ti=c},
dN:function dN(a,b,c){this.a=a
this.b=b
this.$ti=c},
b7:function b7(a){this.$ti=a},
dq:function dq(a){this.$ti=a},
ds:function ds(){},
fy:function fy(){},
d4:function d4(){},
d3:function d3(a){this.a=a},
ep:function ep(){},
u2(){throw A.d(A.ad("Cannot modify unmodifiable Map"))},
ub(a){if(typeof a=="number")return B.c1.gE(a)
if(t.fo.b(a))return a.gE(a)
if(t.dd.b(a))return A.d0(a)
return A.fZ(a)},
uc(a){return new A.hY(a)},
q2(a){var s=v.mangledGlobalNames[a]
if(s!=null)return s
return"minified:"+a},
pU(a,b){var s
if(b!=null){s=b.x
if(s!=null)return s}return t.aU.b(a)},
b(a){var s
if(typeof a=="string")return a
if(typeof a=="number"){if(a!==0)return""+a}else if(!0===a)return"true"
else if(!1===a)return"false"
else if(a==null)return"null"
s=J.as(a)
if(typeof s!="string")throw A.d(A.h7(a,"object","toString method returned 'null'"))
return s},
d0(a){var s,r=$.oR
if(r==null)r=$.oR=Symbol("identityHashCode")
s=a[r]
if(s==null){s=Math.random()*0x3fffffff|0
a[r]=s}return s},
oY(a,b){var s,r,q,p,o,n,m=null
if(typeof a!="string")A.Z(A.cL(a))
s=/^\s*[+-]?((0x[a-f0-9]+)|(\d+)|([a-z0-9]+))\s*$/i.exec(a)
if(s==null)return m
r=s[3]
if(b==null){if(r!=null)return parseInt(a,10)
if(s[2]!=null)return parseInt(a,16)
return m}if(b<2||b>36)throw A.d(A.Y(b,2,36,"radix",m))
if(b===10&&r!=null)return parseInt(a,10)
if(b<10||r==null){q=b<=10?47+b:86+b
p=s[1]
for(o=p.length,n=0;n<o;++n)if((B.a.J(p,n)|32)>q)return m}return parseInt(a,b)},
ka(a){return A.uZ(a)},
uZ(a){var s,r,q,p
if(a instanceof A.c)return A.ar(A.ak(a),null)
s=J.bV(a)
if(s===B.bW||s===B.c3||t.ak.b(a)){r=B.a9(a)
if(r!=="Object"&&r!=="")return r
q=a.constructor
if(typeof q=="function"){p=q.name
if(typeof p=="string"&&p!=="Object"&&p!=="")return p}}return A.ar(A.ak(a),null)},
oQ(a){var s,r,q,p,o=a.length
if(o<=500)return String.fromCharCode.apply(null,a)
for(s="",r=0;r<o;r=q){q=r+500
p=q<o?q:o
s+=String.fromCharCode.apply(null,a.slice(r,p))}return s},
v1(a){var s,r,q,p=A.a([],t.Z)
for(s=a.length,r=0;r<a.length;a.length===s||(0,A.cN)(a),++r){q=a[r]
if(!A.aI(q))throw A.d(A.cL(q))
if(q<=65535)p.push(q)
else if(q<=1114111){p.push(55296+(B.c.ai(q-65536,10)&1023))
p.push(56320+(q&1023))}else throw A.d(A.cL(q))}return A.oQ(p)},
v0(a){var s,r,q
for(s=a.length,r=0;r<s;++r){q=a[r]
if(!A.aI(q))throw A.d(A.cL(q))
if(q<0)throw A.d(A.cL(q))
if(q>65535)return A.v1(a)}return A.oQ(a)},
v2(a,b,c){var s,r,q,p
if(c<=500&&b===0&&c===a.length)return String.fromCharCode.apply(null,a)
for(s=b,r="";s<c;s=q){q=s+500
p=q<c?q:c
r+=String.fromCharCode.apply(null,a.subarray(s,p))}return r},
be(a){var s
if(0<=a){if(a<=65535)return String.fromCharCode(a)
if(a<=1114111){s=a-65536
return String.fromCharCode((B.c.ai(s,10)|55296)>>>0,s&1023|56320)}}throw A.d(A.Y(a,0,1114111,null,null))},
ax(a){if(a.date===void 0)a.date=new Date(a.a)
return a.date},
fk(a){return a.b?A.ax(a).getUTCFullYear()+0:A.ax(a).getFullYear()+0},
oW(a){return a.b?A.ax(a).getUTCMonth()+1:A.ax(a).getMonth()+1},
oS(a){return a.b?A.ax(a).getUTCDate()+0:A.ax(a).getDate()+0},
oT(a){return a.b?A.ax(a).getUTCHours()+0:A.ax(a).getHours()+0},
oV(a){return a.b?A.ax(a).getUTCMinutes()+0:A.ax(a).getMinutes()+0},
oX(a){return a.b?A.ax(a).getUTCSeconds()+0:A.ax(a).getSeconds()+0},
oU(a){return a.b?A.ax(a).getUTCMilliseconds()+0:A.ax(a).getMilliseconds()+0},
bE(a,b,c){var s,r,q={}
q.a=0
s=[]
r=[]
q.a=b.length
B.d.D(s,b)
q.b=""
if(c!=null&&c.a!==0)c.M(0,new A.k9(q,r,s))
return J.tB(a,new A.iJ(B.dM,0,s,r,0))},
v_(a,b,c){var s,r,q
if(Array.isArray(b))s=c==null||c.a===0
else s=!1
if(s){r=b.length
if(r===0){if(!!a.$0)return a.$0()}else if(r===1){if(!!a.$1)return a.$1(b[0])}else if(r===2){if(!!a.$2)return a.$2(b[0],b[1])}else if(r===3){if(!!a.$3)return a.$3(b[0],b[1],b[2])}else if(r===4){if(!!a.$4)return a.$4(b[0],b[1],b[2],b[3])}else if(r===5)if(!!a.$5)return a.$5(b[0],b[1],b[2],b[3],b[4])
q=a[""+"$"+r]
if(q!=null)return q.apply(a,b)}return A.uY(a,b,c)},
uY(a,b,c){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e
if(b!=null)s=Array.isArray(b)?b:A.bc(b,!0,t.z)
else s=[]
r=s.length
q=a.$R
if(r<q)return A.bE(a,s,c)
p=a.$D
o=p==null
n=!o?p():null
m=J.bV(a)
l=m.$C
if(typeof l=="string")l=m[l]
if(o){if(c!=null&&c.a!==0)return A.bE(a,s,c)
if(r===q)return l.apply(a,s)
return A.bE(a,s,c)}if(Array.isArray(n)){if(c!=null&&c.a!==0)return A.bE(a,s,c)
k=q+n.length
if(r>k)return A.bE(a,s,null)
if(r<k){j=n.slice(r-q)
if(s===b)s=A.bc(s,!0,t.z)
B.d.D(s,j)}return l.apply(a,s)}else{if(r>q)return A.bE(a,s,c)
if(s===b)s=A.bc(s,!0,t.z)
i=Object.keys(n)
if(c==null)for(o=i.length,h=0;h<i.length;i.length===o||(0,A.cN)(i),++h){g=n[i[h]]
if(B.ad===g)return A.bE(a,s,c)
B.d.C(s,g)}else{for(o=i.length,f=0,h=0;h<i.length;i.length===o||(0,A.cN)(i),++h){e=i[h]
if(c.v(e)){++f
B.d.C(s,c.i(0,e))}else{g=n[e]
if(B.ad===g)return A.bE(a,s,c)
B.d.C(s,g)}}if(f!==c.a)return A.bE(a,s,c)}return l.apply(a,s)}},
eA(a,b){var s,r="index",q=null
if(!A.aI(b))return new A.at(!0,b,r,q)
s=J.a3(a)
if(b<0||b>=s)return A.eW(b,s,a,q,r)
return new A.dL(q,q,!0,b,r,"Value not in range")},
x0(a,b,c){if(a<0||a>c)return A.Y(a,0,c,"start",null)
if(b!=null)if(b<a||b>c)return A.Y(b,a,c,"end",null)
return new A.at(!0,b,"end",null)},
cL(a){return new A.at(!0,a,null,null)},
d(a){var s,r
if(a==null)a=new A.fg()
s=new Error()
s.dartException=a
r=A.xQ
if("defineProperty" in Object){Object.defineProperty(s,"message",{get:r})
s.name=""}else s.toString=r
return s},
xQ(){return J.as(this.dartException)},
Z(a){throw A.d(a)},
cN(a){throw A.d(A.ag(a))},
bl(a){var s,r,q,p,o,n
a=A.pZ(a.replace(String({}),"$receiver$"))
s=a.match(/\\\$[a-zA-Z]+\\\$/g)
if(s==null)s=A.a([],t.s)
r=s.indexOf("\\$arguments\\$")
q=s.indexOf("\\$argumentsExpr\\$")
p=s.indexOf("\\$expr\\$")
o=s.indexOf("\\$method\\$")
n=s.indexOf("\\$receiver\\$")
return new A.lt(a.replace(new RegExp("\\\\\\$arguments\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$argumentsExpr\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$expr\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$method\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$receiver\\\\\\$","g"),"((?:x|[^x])*)"),r,q,p,o,n)},
lu(a){return function($expr$){var $argumentsExpr$="$arguments$"
try{$expr$.$method$($argumentsExpr$)}catch(s){return s.message}}(a)},
p3(a){return function($expr$){try{$expr$.$method$}catch(s){return s.message}}(a)},
nt(a,b){var s=b==null,r=s?null:b.method
return new A.f0(a,r,s?null:b.receiver)},
M(a){if(a==null)return new A.fh(a)
if(a instanceof A.dr)return A.bW(a,a.a)
if(typeof a!=="object")return a
if("dartException" in a)return A.bW(a,a.dartException)
return A.wH(a)},
bW(a,b){if(t.Q.b(b))if(b.$thrownJsError==null)b.$thrownJsError=a
return b},
wH(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=null
if(!("message" in a))return a
s=a.message
if("number" in a&&typeof a.number=="number"){r=a.number
q=r&65535
if((B.c.ai(r,16)&8191)===10)switch(q){case 438:return A.bW(a,A.nt(A.b(s)+" (Error "+q+")",e))
case 445:case 5007:p=A.b(s)
return A.bW(a,new A.dJ(p+" (Error "+q+")",e))}}if(a instanceof TypeError){o=$.tb()
n=$.tc()
m=$.td()
l=$.te()
k=$.th()
j=$.ti()
i=$.tg()
$.tf()
h=$.tk()
g=$.tj()
f=o.a9(s)
if(f!=null)return A.bW(a,A.nt(s,f))
else{f=n.a9(s)
if(f!=null){f.method="call"
return A.bW(a,A.nt(s,f))}else{f=m.a9(s)
if(f==null){f=l.a9(s)
if(f==null){f=k.a9(s)
if(f==null){f=j.a9(s)
if(f==null){f=i.a9(s)
if(f==null){f=l.a9(s)
if(f==null){f=h.a9(s)
if(f==null){f=g.a9(s)
p=f!=null}else p=!0}else p=!0}else p=!0}else p=!0}else p=!0}else p=!0}else p=!0
if(p)return A.bW(a,new A.dJ(s,f==null?e:f.method))}}return A.bW(a,new A.fx(typeof s=="string"?s:""))}if(a instanceof RangeError){if(typeof s=="string"&&s.indexOf("call stack")!==-1)return new A.dO()
s=function(b){try{return String(b)}catch(d){}return null}(a)
return A.bW(a,new A.at(!1,e,e,typeof s=="string"?s.replace(/^RangeError:\s*/,""):s))}if(typeof InternalError=="function"&&a instanceof InternalError)if(typeof s=="string"&&s==="too much recursion")return new A.dO()
return a},
aS(a){var s
if(a instanceof A.dr)return a.b
if(a==null)return new A.ed(a)
s=a.$cachedTrace
if(s!=null)return s
return a.$cachedTrace=new A.ed(a)},
fZ(a){if(a==null||typeof a!="object")return J.bY(a)
else return A.d0(a)},
pN(a,b){var s,r,q,p=a.length
for(s=0;s<p;s=q){r=s+1
q=r+1
b.m(0,a[s],a[r])}return b},
x4(a,b){var s,r=a.length
for(s=0;s<r;++s)b.C(0,a[s])
return b},
xg(a,b,c,d,e,f){switch(b){case 0:return a.$0()
case 1:return a.$1(c)
case 2:return a.$2(c,d)
case 3:return a.$3(c,d,e)
case 4:return a.$4(c,d,e,f)}throw A.d(A.u9("Unsupported number of arguments for wrapped closure"))},
mO(a,b){var s
if(a==null)return null
s=a.$identity
if(!!s)return s
s=function(c,d,e){return function(f,g,h,i){return e(c,d,f,g,h,i)}}(a,b,A.xg)
a.$identity=s
return s},
u1(a2){var s,r,q,p,o,n,m,l,k,j,i=a2.co,h=a2.iS,g=a2.iI,f=a2.nDA,e=a2.aI,d=a2.fs,c=a2.cs,b=d[0],a=c[0],a0=i[b],a1=a2.fT
a1.toString
s=h?Object.create(new A.fq().constructor.prototype):Object.create(new A.cP(null,null).constructor.prototype)
s.$initialize=s.constructor
if(h)r=function static_tear_off(){this.$initialize()}
else r=function tear_off(a3,a4){this.$initialize(a3,a4)}
s.constructor=r
r.prototype=s
s.$_name=b
s.$_target=a0
q=!h
if(q)p=A.ox(b,a0,g,f)
else{s.$static_name=b
p=a0}s.$S=A.tY(a1,h,g)
s[a]=p
for(o=p,n=1;n<d.length;++n){m=d[n]
if(typeof m=="string"){l=i[m]
k=m
m=l}else k=""
j=c[n]
if(j!=null){if(q)m=A.ox(k,m,g,f)
s[j]=m}if(n===e)o=m}s.$C=o
s.$R=a2.rC
s.$D=a2.dV
return r},
tY(a,b,c){if(typeof a=="number")return a
if(typeof a=="string"){if(b)throw A.d("Cannot compute signature for static tearoff.")
return function(d,e){return function(){return e(this,d)}}(a,A.tR)}throw A.d("Error in functionType of tearoff")},
tZ(a,b,c,d){var s=A.ow
switch(b?-1:a){case 0:return function(e,f){return function(){return f(this)[e]()}}(c,s)
case 1:return function(e,f){return function(g){return f(this)[e](g)}}(c,s)
case 2:return function(e,f){return function(g,h){return f(this)[e](g,h)}}(c,s)
case 3:return function(e,f){return function(g,h,i){return f(this)[e](g,h,i)}}(c,s)
case 4:return function(e,f){return function(g,h,i,j){return f(this)[e](g,h,i,j)}}(c,s)
case 5:return function(e,f){return function(g,h,i,j,k){return f(this)[e](g,h,i,j,k)}}(c,s)
default:return function(e,f){return function(){return e.apply(f(this),arguments)}}(d,s)}},
ox(a,b,c,d){var s,r
if(c)return A.u0(a,b,d)
s=b.length
r=A.tZ(s,d,a,b)
return r},
u_(a,b,c,d){var s=A.ow,r=A.tS
switch(b?-1:a){case 0:throw A.d(new A.fp("Intercepted function with no arguments."))
case 1:return function(e,f,g){return function(){return f(this)[e](g(this))}}(c,r,s)
case 2:return function(e,f,g){return function(h){return f(this)[e](g(this),h)}}(c,r,s)
case 3:return function(e,f,g){return function(h,i){return f(this)[e](g(this),h,i)}}(c,r,s)
case 4:return function(e,f,g){return function(h,i,j){return f(this)[e](g(this),h,i,j)}}(c,r,s)
case 5:return function(e,f,g){return function(h,i,j,k){return f(this)[e](g(this),h,i,j,k)}}(c,r,s)
case 6:return function(e,f,g){return function(h,i,j,k,l){return f(this)[e](g(this),h,i,j,k,l)}}(c,r,s)
default:return function(e,f,g){return function(){var q=[g(this)]
Array.prototype.push.apply(q,arguments)
return e.apply(f(this),q)}}(d,r,s)}},
u0(a,b,c){var s,r
if($.ou==null)$.ou=A.ot("interceptor")
if($.ov==null)$.ov=A.ot("receiver")
s=b.length
r=A.u_(s,c,a,b)
return r},
nO(a){return A.u1(a)},
tR(a,b){return A.mt(v.typeUniverse,A.ak(a.a),b)},
ow(a){return a.a},
tS(a){return a.b},
ot(a){var s,r,q,p=new A.cP("receiver","interceptor"),o=J.nr(Object.getOwnPropertyNames(p))
for(s=o.length,r=0;r<s;++r){q=o[r]
if(p[q]===a)return q}throw A.d(A.K("Field name "+a+" not found.",null))},
xP(a){throw A.d(new A.eQ(a))},
xa(a){return v.getIsolateTag(a)},
uH(a,b,c){var s=new A.cx(a,b,c.h("cx<0>"))
s.c=a.e
return s},
Bh(a,b,c){Object.defineProperty(a,b,{value:c,enumerable:false,writable:true,configurable:true})},
xC(a){var s,r,q,p,o,n=$.pR.$1(a),m=$.mP[n]
if(m!=null){Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}s=$.n_[n]
if(s!=null)return s
r=v.interceptorsByTag[n]
if(r==null){q=$.pJ.$2(a,n)
if(q!=null){m=$.mP[q]
if(m!=null){Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}s=$.n_[q]
if(s!=null)return s
r=v.interceptorsByTag[q]
n=q}}if(r==null)return null
s=r.prototype
p=n[0]
if(p==="!"){m=A.nc(s)
$.mP[n]=m
Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}if(p==="~"){$.n_[n]=s
return s}if(p==="-"){o=A.nc(s)
Object.defineProperty(Object.getPrototypeOf(a),v.dispatchPropertyName,{value:o,enumerable:false,writable:true,configurable:true})
return o.i}if(p==="+")return A.pX(a,s)
if(p==="*")throw A.d(A.p4(n))
if(v.leafTags[n]===true){o=A.nc(s)
Object.defineProperty(Object.getPrototypeOf(a),v.dispatchPropertyName,{value:o,enumerable:false,writable:true,configurable:true})
return o.i}else return A.pX(a,s)},
pX(a,b){var s=Object.getPrototypeOf(a)
Object.defineProperty(s,v.dispatchPropertyName,{value:J.nS(b,s,null,null),enumerable:false,writable:true,configurable:true})
return b},
nc(a){return J.nS(a,!1,null,!!a.$iav)},
xE(a,b,c){var s=b.prototype
if(v.leafTags[a]===true)return A.nc(s)
else return J.nS(s,c,null,null)},
xe(){if(!0===$.nQ)return
$.nQ=!0
A.xf()},
xf(){var s,r,q,p,o,n,m,l
$.mP=Object.create(null)
$.n_=Object.create(null)
A.xd()
s=v.interceptorsByTag
r=Object.getOwnPropertyNames(s)
if(typeof window!="undefined"){window
q=function(){}
for(p=0;p<r.length;++p){o=r[p]
n=$.pY.$1(o)
if(n!=null){m=A.xE(o,s[o],n)
if(m!=null){Object.defineProperty(n,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
q.prototype=n}}}}for(p=0;p<r.length;++p){o=r[p]
if(/^[A-Za-z_]/.test(o)){l=s[o]
s["!"+o]=l
s["~"+o]=l
s["-"+o]=l
s["+"+o]=l
s["*"+o]=l}}},
xd(){var s,r,q,p,o,n,m=B.bb()
m=A.di(B.bc,A.di(B.bd,A.di(B.aa,A.di(B.aa,A.di(B.be,A.di(B.bf,A.di(B.bg(B.a9),m)))))))
if(typeof dartNativeDispatchHooksTransformer!="undefined"){s=dartNativeDispatchHooksTransformer
if(typeof s=="function")s=[s]
if(s.constructor==Array)for(r=0;r<s.length;++r){q=s[r]
if(typeof q=="function")m=q(m)||m}}p=m.getTag
o=m.getUnknownTag
n=m.prototypeForTag
$.pR=new A.mX(p)
$.pJ=new A.mY(o)
$.pY=new A.mZ(n)},
di(a,b){return a(b)||b},
uk(a,b,c,d,e,f){var s=b?"m":"",r=c?"":"i",q=d?"u":"",p=e?"s":"",o=f?"g":"",n=function(g,h){try{return new RegExp(g,h)}catch(m){return m}}(a,s+r+q+p+o)
if(n instanceof RegExp)return n
throw A.d(A.R("Illegal RegExp pattern ("+String(n)+")",a,null))},
x1(a){if(a.indexOf("$",0)>=0)return a.replace(/\$/g,"$$$$")
return a},
pZ(a){if(/[[\]{}()*+?.\\^$|]/.test(a))return a.replace(/[[\]{}()*+?.\\^$|]/g,"\\$&")
return a},
q0(a,b,c){var s=A.xN(a,b,c)
return s},
xN(a,b,c){var s,r,q,p
if(b===""){if(a==="")return c
s=a.length
for(r=c,q=0;q<s;++q)r=r+a[q]+c
return r.charCodeAt(0)==0?r:r}p=a.indexOf(b,0)
if(p<0)return a
if(a.length<500||c.indexOf("$",0)>=0)return a.split(b).join(c)
return a.replace(new RegExp(A.pZ(b),"g"),A.x1(c))},
dn:function dn(a,b){this.a=a
this.$ti=b},
cQ:function cQ(){},
aJ:function aJ(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.$ti=d},
dW:function dW(a,b){this.a=a
this.$ti=b},
X:function X(a,b){this.a=a
this.$ti=b},
hY:function hY(a){this.a=a},
iJ:function iJ(a,b,c,d,e){var _=this
_.a=a
_.c=b
_.d=c
_.e=d
_.f=e},
k9:function k9(a,b,c){this.a=a
this.b=b
this.c=c},
lt:function lt(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f},
dJ:function dJ(a,b){this.a=a
this.b=b},
f0:function f0(a,b,c){this.a=a
this.b=b
this.c=c},
fx:function fx(a){this.a=a},
fh:function fh(a){this.a=a},
dr:function dr(a,b){this.a=a
this.b=b},
ed:function ed(a){this.a=a
this.b=null},
c7:function c7(){},
eL:function eL(){},
eM:function eM(){},
ft:function ft(){},
fq:function fq(){},
cP:function cP(a,b){this.a=a
this.b=b},
fp:function fp(a){this.a=a},
mm:function mm(){},
aC:function aC(a){var _=this
_.a=0
_.f=_.e=_.d=_.c=_.b=null
_.r=0
_.$ti=a},
iP:function iP(a){this.a=a},
jN:function jN(a,b){this.a=a
this.b=b
this.c=null},
aO:function aO(a,b){this.a=a
this.$ti=b},
cx:function cx(a,b,c){var _=this
_.a=a
_.b=b
_.d=_.c=null
_.$ti=c},
mX:function mX(a){this.a=a},
mY:function mY(a){this.a=a},
mZ:function mZ(a){this.a=a},
iK:function iK(a,b){var _=this
_.a=a
_.b=b
_.d=_.c=null},
mk:function mk(a){this.b=a},
de(a,b,c){if(!A.aI(b))throw A.d(A.K("Invalid view offsetInBytes "+A.b(b),null))},
w8(a){return a},
f7(a,b,c){A.de(a,b,c)
return c==null?new DataView(a,b):new DataView(a,b,c)},
uQ(a){return new Float32Array(a)},
uR(a){return new Int8Array(a)},
oO(a,b,c){A.de(a,b,c)
return new Uint16Array(a,b,c)},
oP(a,b,c){A.de(a,b,c)
return new Uint32Array(a,b,c)},
uS(a){return new Uint8Array(a)},
nw(a,b,c){var s
A.de(a,b,c)
s=new Uint8Array(a,b,c)
return s},
bo(a,b,c){if(a>>>0!==a||a>=c)throw A.d(A.eA(b,a))},
bR(a,b,c){var s
if(!(a>>>0!==a))s=b>>>0!==b||a>b||b>c
else s=!0
if(s)throw A.d(A.x0(a,b,c))
return b},
dF:function dF(){},
d_:function d_(){},
dE:function dE(){},
aw:function aw(){},
f8:function f8(){},
f9:function f9(){},
fa:function fa(){},
fb:function fb(){},
fc:function fc(){},
fd:function fd(){},
fe:function fe(){},
dG:function dG(){},
cy:function cy(){},
e7:function e7(){},
e8:function e8(){},
e9:function e9(){},
ea:function ea(){},
v5(a,b){var s=b.c
return s==null?b.c=A.nG(a,b.y,!0):s},
oZ(a,b){var s=b.c
return s==null?b.c=A.ek(a,"a5",[b.y]):s},
p_(a){var s=a.x
if(s===6||s===7||s===8)return A.p_(a.y)
return s===12||s===13},
v4(a){return a.at},
aR(a){return A.fT(v.typeUniverse,a,!1)},
bT(a,b,a0,a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=b.x
switch(c){case 5:case 1:case 2:case 3:case 4:return b
case 6:s=b.y
r=A.bT(a,s,a0,a1)
if(r===s)return b
return A.pl(a,r,!0)
case 7:s=b.y
r=A.bT(a,s,a0,a1)
if(r===s)return b
return A.nG(a,r,!0)
case 8:s=b.y
r=A.bT(a,s,a0,a1)
if(r===s)return b
return A.pk(a,r,!0)
case 9:q=b.z
p=A.ey(a,q,a0,a1)
if(p===q)return b
return A.ek(a,b.y,p)
case 10:o=b.y
n=A.bT(a,o,a0,a1)
m=b.z
l=A.ey(a,m,a0,a1)
if(n===o&&l===m)return b
return A.nE(a,n,l)
case 12:k=b.y
j=A.bT(a,k,a0,a1)
i=b.z
h=A.wE(a,i,a0,a1)
if(j===k&&h===i)return b
return A.pj(a,j,h)
case 13:g=b.z
a1+=g.length
f=A.ey(a,g,a0,a1)
o=b.y
n=A.bT(a,o,a0,a1)
if(f===g&&n===o)return b
return A.nF(a,n,f,!0)
case 14:e=b.y
if(e<a1)return b
d=a0[e-a1]
if(d==null)return b
return d
default:throw A.d(A.eG("Attempted to substitute unexpected RTI kind "+c))}},
ey(a,b,c,d){var s,r,q,p,o=b.length,n=A.mv(o)
for(s=!1,r=0;r<o;++r){q=b[r]
p=A.bT(a,q,c,d)
if(p!==q)s=!0
n[r]=p}return s?n:b},
wF(a,b,c,d){var s,r,q,p,o,n,m=b.length,l=A.mv(m)
for(s=!1,r=0;r<m;r+=3){q=b[r]
p=b[r+1]
o=b[r+2]
n=A.bT(a,o,c,d)
if(n!==o)s=!0
l.splice(r,3,q,p,n)}return s?l:b},
wE(a,b,c,d){var s,r=b.a,q=A.ey(a,r,c,d),p=b.b,o=A.ey(a,p,c,d),n=b.c,m=A.wF(a,n,c,d)
if(q===r&&o===p&&m===n)return b
s=new A.fK()
s.a=q
s.b=o
s.c=m
return s},
a(a,b){a[v.arrayRti]=b
return a},
wY(a){var s,r=a.$S
if(r!=null){if(typeof r=="number")return A.xb(r)
s=a.$S()
return s}return null},
pT(a,b){var s
if(A.p_(b))if(a instanceof A.c7){s=A.wY(a)
if(s!=null)return s}return A.ak(a)},
ak(a){var s
if(a instanceof A.c){s=a.$ti
return s!=null?s:A.nJ(a)}if(Array.isArray(a))return A.a_(a)
return A.nJ(J.bV(a))},
a_(a){var s=a[v.arrayRti],r=t.b
if(s==null)return r
if(s.constructor!==r.constructor)return r
return s},
A(a){var s=a.$ti
return s!=null?s:A.nJ(a)},
nJ(a){var s=a.constructor,r=s.$ccache
if(r!=null)return r
return A.wj(a,s)},
wj(a,b){var s=a instanceof A.c7?a.__proto__.__proto__.constructor:b,r=A.vH(v.typeUniverse,s.name)
b.$ccache=r
return r},
xb(a){var s,r=v.types,q=r[a]
if(typeof q=="string"){s=A.fT(v.typeUniverse,q,!1)
r[a]=s
return s}return q},
pL(a){var s,r,q,p=a.w
if(p!=null)return p
s=a.at
r=s.replace(/\*/g,"")
if(r===s)return a.w=new A.eh(a)
q=A.fT(v.typeUniverse,r,!0)
p=q.w
return a.w=p==null?q.w=new A.eh(q):p},
u(a){return A.pL(A.fT(v.typeUniverse,a,!1))},
wi(a){var s,r,q,p=this,o=t.K
if(p===o)return A.df(p,a,A.wn)
if(!A.bq(p))if(!(p===t._))o=p===o
else o=!0
else o=!0
if(o)return A.df(p,a,A.wr)
o=p.x
s=o===6?p.y:p
if(s===t.S)r=A.aI
else if(s===t.gR||s===t.di)r=A.wm
else if(s===t.R)r=A.wp
else r=s===t.y?A.eu:null
if(r!=null)return A.df(p,a,r)
if(s.x===9){q=s.y
if(s.z.every(A.xh)){p.r="$i"+q
if(q==="o")return A.df(p,a,A.wl)
return A.df(p,a,A.wq)}}else if(o===7)return A.df(p,a,A.wb)
return A.df(p,a,A.w9)},
df(a,b,c){a.b=c
return a.b(b)},
wh(a){var s,r,q=this
if(!A.bq(q))if(!(q===t._))s=q===t.K
else s=!0
else s=!0
if(s)r=A.w1
else if(q===t.K)r=A.w_
else r=A.wa
q.a=r
return q.a(a)},
fX(a){var s,r=a.x
if(!A.bq(a))if(!(a===t._))if(!(a===t.A))if(r!==7)if(!(r===6&&A.fX(a.y)))s=r===8&&A.fX(a.y)||a===t.P||a===t.T
else s=!0
else s=!0
else s=!0
else s=!0
else s=!0
return s},
w9(a){var s=this
if(a==null)return A.fX(s)
return A.a7(v.typeUniverse,A.pT(a,s),null,s,null)},
wb(a){if(a==null)return!0
return this.y.b(a)},
wq(a){var s,r=this
if(a==null)return A.fX(r)
s=r.r
if(a instanceof A.c)return!!a[s]
return!!J.bV(a)[s]},
wl(a){var s,r=this
if(a==null)return A.fX(r)
if(typeof a!="object")return!1
if(Array.isArray(a))return!0
s=r.r
if(a instanceof A.c)return!!a[s]
return!!J.bV(a)[s]},
Ba(a){var s=this
if(a==null)return a
else if(s.b(a))return a
A.pw(a,s)},
wa(a){var s=this
if(a==null)return a
else if(s.b(a))return a
A.pw(a,s)},
pw(a,b){throw A.d(A.vw(A.pd(a,A.pT(a,b),A.ar(b,null))))},
pd(a,b,c){var s=A.cS(a)
return s+": type '"+A.b(A.ar(b==null?A.ak(a):b,null))+"' is not a subtype of type '"+A.b(c)+"'"},
vw(a){return new A.ei("TypeError: "+a)},
aq(a,b){return new A.ei("TypeError: "+A.pd(a,null,b))},
wn(a){return a!=null},
w_(a){return a},
wr(a){return!0},
w1(a){return a},
eu(a){return!0===a||!1===a},
AW(a){if(!0===a)return!0
if(!1===a)return!1
throw A.d(A.aq(a,"bool"))},
AY(a){if(!0===a)return!0
if(!1===a)return!1
if(a==null)return a
throw A.d(A.aq(a,"bool"))},
AX(a){if(!0===a)return!0
if(!1===a)return!1
if(a==null)return a
throw A.d(A.aq(a,"bool?"))},
AZ(a){if(typeof a=="number")return a
throw A.d(A.aq(a,"double"))},
B0(a){if(typeof a=="number")return a
if(a==null)return a
throw A.d(A.aq(a,"double"))},
B_(a){if(typeof a=="number")return a
if(a==null)return a
throw A.d(A.aq(a,"double?"))},
aI(a){return typeof a=="number"&&Math.floor(a)===a},
B1(a){if(typeof a=="number"&&Math.floor(a)===a)return a
throw A.d(A.aq(a,"int"))},
B3(a){if(typeof a=="number"&&Math.floor(a)===a)return a
if(a==null)return a
throw A.d(A.aq(a,"int"))},
B2(a){if(typeof a=="number"&&Math.floor(a)===a)return a
if(a==null)return a
throw A.d(A.aq(a,"int?"))},
wm(a){return typeof a=="number"},
B4(a){if(typeof a=="number")return a
throw A.d(A.aq(a,"num"))},
B6(a){if(typeof a=="number")return a
if(a==null)return a
throw A.d(A.aq(a,"num"))},
B5(a){if(typeof a=="number")return a
if(a==null)return a
throw A.d(A.aq(a,"num?"))},
wp(a){return typeof a=="string"},
B7(a){if(typeof a=="string")return a
throw A.d(A.aq(a,"String"))},
w0(a){if(typeof a=="string")return a
if(a==null)return a
throw A.d(A.aq(a,"String"))},
B8(a){if(typeof a=="string")return a
if(a==null)return a
throw A.d(A.aq(a,"String?"))},
pF(a,b){var s,r,q
for(s="",r="",q=0;q<a.length;++q,r=", ")s+=B.a.ae(r,A.ar(a[q],b))
return s},
wz(a,b){var s,r,q,p,o,n,m=a.y,l=a.z
if(""===m)return"("+A.pF(l,b)+")"
s=l.length
r=m.split(",")
q=r.length-s
for(p="(",o="",n=0;n<s;++n,o=", "){p+=o
if(q===0)p+="{"
p=B.a.ae(p,A.ar(l[n],b))
if(q>=0)p+=" "+r[q];++q}return p+"})"},
py(a4,a5,a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3=", "
if(a6!=null){s=a6.length
if(a5==null){a5=A.a([],t.s)
r=null}else r=a5.length
q=a5.length
for(p=s;p>0;--p)a5.push("T"+(q+p))
for(o=t.cK,n=t._,m=t.K,l="<",k="",p=0;p<s;++p,k=a3){l=B.a.ae(l+k,a5[a5.length-1-p])
j=a6[p]
i=j.x
if(!(i===2||i===3||i===4||i===5||j===o))if(!(j===n))h=j===m
else h=!0
else h=!0
if(!h)l+=B.a.ae(" extends ",A.ar(j,a5))}l+=">"}else{l=""
r=null}o=a4.y
g=a4.z
f=g.a
e=f.length
d=g.b
c=d.length
b=g.c
a=b.length
a0=A.ar(o,a5)
for(a1="",a2="",p=0;p<e;++p,a2=a3)a1+=B.a.ae(a2,A.ar(f[p],a5))
if(c>0){a1+=a2+"["
for(a2="",p=0;p<c;++p,a2=a3)a1+=B.a.ae(a2,A.ar(d[p],a5))
a1+="]"}if(a>0){a1+=a2+"{"
for(a2="",p=0;p<a;p+=3,a2=a3){a1+=a2
if(b[p+1])a1+="required "
a1+=J.om(A.ar(b[p+2],a5)," ")+b[p]}a1+="}"}if(r!=null){a5.toString
a5.length=r}return l+"("+a1+") => "+A.b(a0)},
ar(a,b){var s,r,q,p,o,n,m=a.x
if(m===5)return"erased"
if(m===2)return"dynamic"
if(m===3)return"void"
if(m===1)return"Never"
if(m===4)return"any"
if(m===6){s=A.ar(a.y,b)
return s}if(m===7){r=a.y
s=A.ar(r,b)
q=r.x
return J.om(q===12||q===13?B.a.ae("(",s)+")":s,"?")}if(m===8)return"FutureOr<"+A.b(A.ar(a.y,b))+">"
if(m===9){p=A.wG(a.y)
o=a.z
return o.length>0?p+("<"+A.pF(o,b)+">"):p}if(m===11)return A.wz(a,b)
if(m===12)return A.py(a,b,null)
if(m===13)return A.py(a.y,b,a.z)
if(m===14){b.toString
n=a.y
return b[b.length-1-n]}return"?"},
wG(a){var s=v.mangledGlobalNames[a]
if(s!=null)return s
return"minified:"+a},
vI(a,b){var s=a.tR[b]
for(;typeof s=="string";)s=a.tR[s]
return s},
vH(a,b){var s,r,q,p,o,n=a.eT,m=n[b]
if(m==null)return A.fT(a,b,!1)
else if(typeof m=="number"){s=m
r=A.el(a,5,"#")
q=A.mv(s)
for(p=0;p<s;++p)q[p]=r
o=A.ek(a,b,q)
n[b]=o
return o}else return m},
vF(a,b){return A.pt(a.tR,b)},
vE(a,b){return A.pt(a.eT,b)},
fT(a,b,c){var s,r=a.eC,q=r.get(b)
if(q!=null)return q
s=A.pi(A.pg(a,null,b,c))
r.set(b,s)
return s},
mt(a,b,c){var s,r,q=b.Q
if(q==null)q=b.Q=new Map()
s=q.get(c)
if(s!=null)return s
r=A.pi(A.pg(a,b,c,!0))
q.set(c,r)
return r},
vG(a,b,c){var s,r,q,p=b.as
if(p==null)p=b.as=new Map()
s=c.at
r=p.get(s)
if(r!=null)return r
q=A.nE(a,b,c.x===10?c.z:[c])
p.set(s,q)
return q},
bn(a,b){b.a=A.wh
b.b=A.wi
return b},
el(a,b,c){var s,r,q=a.eC.get(c)
if(q!=null)return q
s=new A.aF(null,null)
s.x=b
s.at=c
r=A.bn(a,s)
a.eC.set(c,r)
return r},
pl(a,b,c){var s,r=b.at+"*",q=a.eC.get(r)
if(q!=null)return q
s=A.vB(a,b,r,c)
a.eC.set(r,s)
return s},
vB(a,b,c,d){var s,r,q
if(d){s=b.x
if(!A.bq(b))r=b===t.P||b===t.T||s===7||s===6
else r=!0
if(r)return b}q=new A.aF(null,null)
q.x=6
q.y=b
q.at=c
return A.bn(a,q)},
nG(a,b,c){var s,r=b.at+"?",q=a.eC.get(r)
if(q!=null)return q
s=A.vA(a,b,r,c)
a.eC.set(r,s)
return s},
vA(a,b,c,d){var s,r,q,p
if(d){s=b.x
if(!A.bq(b))if(!(b===t.P||b===t.T))if(s!==7)r=s===8&&A.n0(b.y)
else r=!0
else r=!0
else r=!0
if(r)return b
else if(s===1||b===t.A)return t.P
else if(s===6){q=b.y
if(q.x===8&&A.n0(q.y))return q
else return A.v5(a,b)}}p=new A.aF(null,null)
p.x=7
p.y=b
p.at=c
return A.bn(a,p)},
pk(a,b,c){var s,r=b.at+"/",q=a.eC.get(r)
if(q!=null)return q
s=A.vy(a,b,r,c)
a.eC.set(r,s)
return s},
vy(a,b,c,d){var s,r,q
if(d){s=b.x
if(!A.bq(b))if(!(b===t._))r=b===t.K
else r=!0
else r=!0
if(r||b===t.K)return b
else if(s===1)return A.ek(a,"a5",[b])
else if(b===t.P||b===t.T)return t.eH}q=new A.aF(null,null)
q.x=8
q.y=b
q.at=c
return A.bn(a,q)},
vC(a,b){var s,r,q=""+b+"^",p=a.eC.get(q)
if(p!=null)return p
s=new A.aF(null,null)
s.x=14
s.y=b
s.at=q
r=A.bn(a,s)
a.eC.set(q,r)
return r},
ej(a){var s,r,q,p=a.length
for(s="",r="",q=0;q<p;++q,r=",")s+=r+a[q].at
return s},
vx(a){var s,r,q,p,o,n=a.length
for(s="",r="",q=0;q<n;q+=3,r=","){p=a[q]
o=a[q+1]?"!":":"
s+=r+p+o+a[q+2].at}return s},
ek(a,b,c){var s,r,q,p=b
if(c.length>0)p+="<"+A.ej(c)+">"
s=a.eC.get(p)
if(s!=null)return s
r=new A.aF(null,null)
r.x=9
r.y=b
r.z=c
if(c.length>0)r.c=c[0]
r.at=p
q=A.bn(a,r)
a.eC.set(p,q)
return q},
nE(a,b,c){var s,r,q,p,o,n
if(b.x===10){s=b.y
r=b.z.concat(c)}else{r=c
s=b}q=s.at+(";<"+A.ej(r)+">")
p=a.eC.get(q)
if(p!=null)return p
o=new A.aF(null,null)
o.x=10
o.y=s
o.z=r
o.at=q
n=A.bn(a,o)
a.eC.set(q,n)
return n},
vD(a,b,c){var s,r,q="+"+(b+"("+A.ej(c)+")"),p=a.eC.get(q)
if(p!=null)return p
s=new A.aF(null,null)
s.x=11
s.y=b
s.z=c
s.at=q
r=A.bn(a,s)
a.eC.set(q,r)
return r},
pj(a,b,c){var s,r,q,p,o,n=b.at,m=c.a,l=m.length,k=c.b,j=k.length,i=c.c,h=i.length,g="("+A.ej(m)
if(j>0){s=l>0?",":""
g+=s+"["+A.ej(k)+"]"}if(h>0){s=l>0?",":""
g+=s+"{"+A.vx(i)+"}"}r=n+(g+")")
q=a.eC.get(r)
if(q!=null)return q
p=new A.aF(null,null)
p.x=12
p.y=b
p.z=c
p.at=r
o=A.bn(a,p)
a.eC.set(r,o)
return o},
nF(a,b,c,d){var s,r=b.at+("<"+A.ej(c)+">"),q=a.eC.get(r)
if(q!=null)return q
s=A.vz(a,b,c,r,d)
a.eC.set(r,s)
return s},
vz(a,b,c,d,e){var s,r,q,p,o,n,m,l
if(e){s=c.length
r=A.mv(s)
for(q=0,p=0;p<s;++p){o=c[p]
if(o.x===1){r[p]=o;++q}}if(q>0){n=A.bT(a,b,r,0)
m=A.ey(a,c,r,0)
return A.nF(a,n,m,c!==m)}}l=new A.aF(null,null)
l.x=13
l.y=b
l.z=c
l.at=d
return A.bn(a,l)},
pg(a,b,c,d){return{u:a,e:b,r:c,s:[],p:0,n:d}},
pi(a){var s,r,q,p,o,n,m,l,k,j,i=a.r,h=a.s
for(s=i.length,r=0;r<s;){q=i.charCodeAt(r)
if(q>=48&&q<=57)r=A.vr(r+1,q,i,h)
else if((((q|32)>>>0)-97&65535)<26||q===95||q===36||q===124)r=A.ph(a,r,i,h,!1)
else if(q===46)r=A.ph(a,r,i,h,!0)
else{++r
switch(q){case 44:break
case 58:h.push(!1)
break
case 33:h.push(!0)
break
case 59:h.push(A.bQ(a.u,a.e,h.pop()))
break
case 94:h.push(A.vC(a.u,h.pop()))
break
case 35:h.push(A.el(a.u,5,"#"))
break
case 64:h.push(A.el(a.u,2,"@"))
break
case 126:h.push(A.el(a.u,3,"~"))
break
case 60:h.push(a.p)
a.p=h.length
break
case 62:p=a.u
o=h.splice(a.p)
A.nD(a.u,a.e,o)
a.p=h.pop()
n=h.pop()
if(typeof n=="string")h.push(A.ek(p,n,o))
else{m=A.bQ(p,a.e,n)
switch(m.x){case 12:h.push(A.nF(p,m,o,a.n))
break
default:h.push(A.nE(p,m,o))
break}}break
case 38:A.vs(a,h)
break
case 42:l=a.u
h.push(A.pl(l,A.bQ(l,a.e,h.pop()),a.n))
break
case 63:l=a.u
h.push(A.nG(l,A.bQ(l,a.e,h.pop()),a.n))
break
case 47:l=a.u
h.push(A.pk(l,A.bQ(l,a.e,h.pop()),a.n))
break
case 40:h.push(-3)
h.push(a.p)
a.p=h.length
break
case 41:A.vq(a,h)
break
case 91:h.push(a.p)
a.p=h.length
break
case 93:o=h.splice(a.p)
A.nD(a.u,a.e,o)
a.p=h.pop()
h.push(o)
h.push(-1)
break
case 123:h.push(a.p)
a.p=h.length
break
case 125:o=h.splice(a.p)
A.vu(a.u,a.e,o)
a.p=h.pop()
h.push(o)
h.push(-2)
break
case 43:k=i.indexOf("(",r)
h.push(i.substring(r,k))
h.push(-4)
h.push(a.p)
a.p=h.length
r=k+1
break
default:throw"Bad character "+q}}}j=h.pop()
return A.bQ(a.u,a.e,j)},
vr(a,b,c,d){var s,r,q=b-48
for(s=c.length;a<s;++a){r=c.charCodeAt(a)
if(!(r>=48&&r<=57))break
q=q*10+(r-48)}d.push(q)
return a},
ph(a,b,c,d,e){var s,r,q,p,o,n,m=b+1
for(s=c.length;m<s;++m){r=c.charCodeAt(m)
if(r===46){if(e)break
e=!0}else{if(!((((r|32)>>>0)-97&65535)<26||r===95||r===36||r===124))q=r>=48&&r<=57
else q=!0
if(!q)break}}p=c.substring(b,m)
if(e){s=a.u
o=a.e
if(o.x===10)o=o.y
n=A.vI(s,o.y)[p]
if(n==null)A.Z('No "'+p+'" in "'+A.v4(o)+'"')
d.push(A.mt(s,o,n))}else d.push(p)
return m},
vq(a,b){var s,r,q,p,o,n=null,m=a.u,l=b.pop()
if(typeof l=="number")switch(l){case-1:s=b.pop()
r=n
break
case-2:r=b.pop()
s=n
break
default:b.push(l)
r=n
s=r
break}else{b.push(l)
r=n
s=r}q=A.vp(a,b)
l=b.pop()
switch(l){case-3:l=b.pop()
if(s==null)s=m.sEA
if(r==null)r=m.sEA
p=A.bQ(m,a.e,l)
o=new A.fK()
o.a=q
o.b=s
o.c=r
b.push(A.pj(m,p,o))
return
case-4:b.push(A.vD(m,b.pop(),q))
return
default:throw A.d(A.eG("Unexpected state under `()`: "+A.b(l)))}},
vs(a,b){var s=b.pop()
if(0===s){b.push(A.el(a.u,1,"0&"))
return}if(1===s){b.push(A.el(a.u,4,"1&"))
return}throw A.d(A.eG("Unexpected extended operation "+A.b(s)))},
vp(a,b){var s=b.splice(a.p)
A.nD(a.u,a.e,s)
a.p=b.pop()
return s},
bQ(a,b,c){if(typeof c=="string")return A.ek(a,c,a.sEA)
else if(typeof c=="number"){b.toString
return A.vt(a,b,c)}else return c},
nD(a,b,c){var s,r=c.length
for(s=0;s<r;++s)c[s]=A.bQ(a,b,c[s])},
vu(a,b,c){var s,r=c.length
for(s=2;s<r;s+=3)c[s]=A.bQ(a,b,c[s])},
vt(a,b,c){var s,r,q=b.x
if(q===10){if(c===0)return b.y
s=b.z
r=s.length
if(c<=r)return s[c-1]
c-=r
b=b.y
q=b.x}else if(c===0)return b
if(q!==9)throw A.d(A.eG("Indexed base must be an interface type"))
s=b.z
if(c<=s.length)return s[c-1]
throw A.d(A.eG("Bad index "+c+" for "+b.k(0)))},
a7(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j
if(b===d)return!0
if(!A.bq(d))if(!(d===t._))s=d===t.K
else s=!0
else s=!0
if(s)return!0
r=b.x
if(r===4)return!0
if(A.bq(b))return!1
if(b.x!==1)s=b===t.P||b===t.T
else s=!0
if(s)return!0
q=r===14
if(q)if(A.a7(a,c[b.y],c,d,e))return!0
p=d.x
if(r===6)return A.a7(a,b.y,c,d,e)
if(p===6){s=d.y
return A.a7(a,b,c,s,e)}if(r===8){if(!A.a7(a,b.y,c,d,e))return!1
return A.a7(a,A.oZ(a,b),c,d,e)}if(r===7){s=A.a7(a,b.y,c,d,e)
return s}if(p===8){if(A.a7(a,b,c,d.y,e))return!0
return A.a7(a,b,c,A.oZ(a,d),e)}if(p===7){s=A.a7(a,b,c,d.y,e)
return s}if(q)return!1
s=r!==12
if((!s||r===13)&&d===t.b8)return!0
if(p===13){if(b===t.g)return!0
if(r!==13)return!1
o=b.z
n=d.z
m=o.length
if(m!==n.length)return!1
c=c==null?o:o.concat(c)
e=e==null?n:n.concat(e)
for(l=0;l<m;++l){k=o[l]
j=n[l]
if(!A.a7(a,k,c,j,e)||!A.a7(a,j,e,k,c))return!1}return A.pA(a,b.y,c,d.y,e)}if(p===12){if(b===t.g)return!0
if(s)return!1
return A.pA(a,b,c,d,e)}if(r===9){if(p!==9)return!1
return A.wk(a,b,c,d,e)}s=r===11
if(s&&d===t.gT)return!0
if(s&&p===11)return A.wo(a,b,c,d,e)
return!1},
pA(a2,a3,a4,a5,a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1
if(!A.a7(a2,a3.y,a4,a5.y,a6))return!1
s=a3.z
r=a5.z
q=s.a
p=r.a
o=q.length
n=p.length
if(o>n)return!1
m=n-o
l=s.b
k=r.b
j=l.length
i=k.length
if(o+j<n+i)return!1
for(h=0;h<o;++h){g=q[h]
if(!A.a7(a2,p[h],a6,g,a4))return!1}for(h=0;h<m;++h){g=l[h]
if(!A.a7(a2,p[o+h],a6,g,a4))return!1}for(h=0;h<i;++h){g=l[m+h]
if(!A.a7(a2,k[h],a6,g,a4))return!1}f=s.c
e=r.c
d=f.length
c=e.length
for(b=0,a=0;a<c;a+=3){a0=e[a]
for(;!0;){if(b>=d)return!1
a1=f[b]
b+=3
if(a0<a1)return!1
if(a1<a0)continue
g=f[b-1]
if(!A.a7(a2,e[a+2],a6,g,a4))return!1
break}}return!0},
wk(a,b,c,d,e){var s,r,q,p,o,n,m,l=b.y,k=d.y
for(;l!==k;){s=a.tR[l]
if(s==null)return!1
if(typeof s=="string"){l=s
continue}r=s[k]
if(r==null)return!1
q=r.length
p=q>0?new Array(q):v.typeUniverse.sEA
for(o=0;o<q;++o)p[o]=A.mt(a,b,r[o])
return A.pu(a,p,null,c,d.z,e)}n=b.z
m=d.z
return A.pu(a,n,null,c,m,e)},
pu(a,b,c,d,e,f){var s,r,q,p=b.length
for(s=0;s<p;++s){r=b[s]
q=e[s]
if(!A.a7(a,r,d,q,f))return!1}return!0},
wo(a,b,c,d,e){var s,r=b.z,q=d.z,p=r.length
if(p!==q.length)return!1
if(b.y!==d.y)return!1
for(s=0;s<p;++s)if(!A.a7(a,r[s],c,q[s],e))return!1
return!0},
n0(a){var s,r=a.x
if(!(a===t.P||a===t.T))if(!A.bq(a))if(r!==7)if(!(r===6&&A.n0(a.y)))s=r===8&&A.n0(a.y)
else s=!0
else s=!0
else s=!0
else s=!0
return s},
xh(a){var s
if(!A.bq(a))if(!(a===t._))s=a===t.K
else s=!0
else s=!0
return s},
bq(a){var s=a.x
return s===2||s===3||s===4||s===5||a===t.cK},
pt(a,b){var s,r,q=Object.keys(b),p=q.length
for(s=0;s<p;++s){r=q[s]
a[r]=b[r]}},
mv(a){return a>0?new Array(a):v.typeUniverse.sEA},
aF:function aF(a,b){var _=this
_.a=a
_.b=b
_.w=_.r=_.c=null
_.x=0
_.at=_.as=_.Q=_.z=_.y=null},
fK:function fK(){this.c=this.b=this.a=null},
eh:function eh(a){this.a=a},
fJ:function fJ(){},
ei:function ei(a){this.a=a},
vg(){var s,r,q={}
if(self.scheduleImmediate!=null)return A.wP()
if(self.MutationObserver!=null&&self.document!=null){s=self.document.createElement("div")
r=self.document.createElement("span")
q.a=null
new self.MutationObserver(A.mO(new A.lW(q),1)).observe(s,{childList:true})
return new A.lV(q,s,r)}else if(self.setImmediate!=null)return A.wQ()
return A.wR()},
vh(a){self.scheduleImmediate(A.mO(new A.lX(a),0))},
vi(a){self.setImmediate(A.mO(new A.lY(a),0))},
vj(a){A.vv(0,a)},
vv(a,b){var s=new A.mr()
s.dg(a,b)
return s},
ex(a){return new A.fD(new A.C($.B,a.h("C<0>")),a.h("fD<0>"))},
et(a,b){a.$2(0,null)
b.b=!0
return b.a},
dd(a,b){A.w2(a,b)},
es(a,b){b.a3(a)},
er(a,b){b.bK(A.M(a),A.aS(a))},
w2(a,b){var s,r,q=new A.mx(b),p=new A.my(b)
if(a instanceof A.C)a.cz(q,p,t.z)
else{s=t.z
if(t.d.b(a))a.au(0,q,p,s)
else{r=new A.C($.B,t.eI)
r.a=8
r.c=a
r.cz(q,p,s)}}},
ez(a){var s=function(b,c){return function(d,e){while(true)try{b(d,e)
break}catch(r){e=r
d=c}}}(a,1)
return $.B.c1(new A.mN(s))},
mf(a){return new A.d7(a,1)},
bO(){return B.eo},
bP(a){return new A.d7(a,3)},
bS(a,b){return new A.eg(a,b.h("eg<0>"))},
h9(a,b){var s=A.bU(a,"error",t.K)
return new A.eH(s,b==null?A.eI(a):b)},
eI(a){var s
if(t.Q.b(a)){s=a.gb2()
if(s!=null)return s}return B.bk},
nz(a,b){var s,r
for(;s=a.a,(s&4)!==0;)a=a.c
if((s&24)!==0){r=b.bb()
b.by(a)
A.d6(b,r)}else{r=b.c
b.a=b.a&1|4
b.c=a
a.cs(r)}},
d6(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f={},e=f.a=a
for(s=t.d;!0;){r={}
q=e.a
p=(q&16)===0
o=!p
if(b==null){if(o&&(q&1)===0){e=e.c
A.dh(e.a,e.b)}return}r.a=b
n=b.a
for(e=b;n!=null;e=n,n=m){e.a=null
A.d6(f.a,e)
r.a=n
m=n.a}q=f.a
l=q.c
r.b=o
r.c=l
if(p){k=e.c
k=(k&1)!==0||(k&15)===8}else k=!0
if(k){j=e.b.b
if(o){q=q.b===j
q=!(q||q)}else q=!1
if(q){A.dh(l.a,l.b)
return}i=$.B
if(i!==j)$.B=j
else i=null
e=e.c
if((e&15)===8)new A.md(r,f,o).$0()
else if(p){if((e&1)!==0)new A.mc(r,l).$0()}else if((e&2)!==0)new A.mb(f,r).$0()
if(i!=null)$.B=i
e=r.c
if(s.b(e)){q=r.a.$ti
q=q.h("a5<2>").b(e)||!q.z[1].b(e)}else q=!1
if(q){h=r.a.b
if(e instanceof A.C)if((e.a&24)!==0){g=h.c
h.c=null
b=h.bc(g)
h.a=e.a&30|h.a&1
h.c=e.c
f.a=e
continue}else A.nz(e,h)
else h.ce(e)
return}}h=r.a.b
g=h.c
h.c=null
b=h.bc(g)
e=r.b
q=r.c
if(!e){h.a=8
h.c=q}else{h.a=h.a&1|16
h.c=q}f.a=h
e=h}},
wA(a,b){if(t.C.b(a))return b.c1(a)
if(t.v.b(a))return a
throw A.d(A.h7(a,"onError",u.c))},
wv(){var s,r
for(s=$.dg;s!=null;s=$.dg){$.ew=null
r=s.b
$.dg=r
if(r==null)$.ev=null
s.a.$0()}},
wC(){$.nK=!0
try{A.wv()}finally{$.ew=null
$.nK=!1
if($.dg!=null)$.oj().$1(A.pK())}},
pH(a){var s=new A.fE(a),r=$.ev
if(r==null){$.dg=$.ev=s
if(!$.nK)$.oj().$1(A.pK())}else $.ev=r.b=s},
wB(a){var s,r,q,p=$.dg
if(p==null){A.pH(a)
$.ew=$.ev
return}s=new A.fE(a)
r=$.ew
if(r==null){s.b=p
$.dg=$.ew=s}else{q=r.b
s.b=q
$.ew=r.b=s
if(q==null)$.ev=s}},
q_(a){var s,r=null,q=$.B
if(B.i===q){A.cI(r,r,B.i,a)
return}s=!1
if(s){A.cI(r,r,q,a)
return}A.cI(r,r,q,q.cB(a))},
fs(a,b){var s=null,r=b.h("aZ<0>"),q=new A.aZ(s,s,s,s,r)
q.aJ(a)
q.aK()
return new A.aj(q,r.h("aj<1>"))},
v9(a,b){var s=null,r=b.h("db<0>"),q=new A.db(s,s,s,s,r)
a.au(0,new A.ln(q,b),new A.lo(q),t.P)
return new A.aj(q,r.h("aj<1>"))},
AG(a){A.bU(a,"stream",t.K)
return new A.fQ()},
p1(a,b,c,d){return new A.aZ(null,b,c,a,d.h("aZ<0>"))},
nM(a){var s,r,q
if(a==null)return
try{a.$0()}catch(q){s=A.M(q)
r=A.aS(q)
A.dh(s,r)}},
vn(a,b){if(b==null)b=A.wS()
if(t.k.b(b))return a.c1(b)
if(t.d5.b(b))return b
throw A.d(A.K("handleError callback must take either an Object (the error), or both an Object (the error) and a StackTrace.",null))},
ww(a,b){A.dh(a,b)},
dh(a,b){A.wB(new A.mK(a,b))},
pC(a,b,c,d){var s,r=$.B
if(r===c)return d.$0()
$.B=c
s=r
try{r=d.$0()
return r}finally{$.B=s}},
pE(a,b,c,d,e){var s,r=$.B
if(r===c)return d.$1(e)
$.B=c
s=r
try{r=d.$1(e)
return r}finally{$.B=s}},
pD(a,b,c,d,e,f){var s,r=$.B
if(r===c)return d.$2(e,f)
$.B=c
s=r
try{r=d.$2(e,f)
return r}finally{$.B=s}},
cI(a,b,c,d){if(B.i!==c)d=c.cB(d)
A.pH(d)},
lW:function lW(a){this.a=a},
lV:function lV(a,b,c){this.a=a
this.b=b
this.c=c},
lX:function lX(a){this.a=a},
lY:function lY(a){this.a=a},
mr:function mr(){},
ms:function ms(a,b){this.a=a
this.b=b},
fD:function fD(a,b){this.a=a
this.b=!1
this.$ti=b},
mx:function mx(a){this.a=a},
my:function my(a){this.a=a},
mN:function mN(a){this.a=a},
d7:function d7(a,b){this.a=a
this.b=b},
aH:function aH(a,b){var _=this
_.a=a
_.d=_.c=_.b=null
_.$ti=b},
eg:function eg(a,b){this.a=a
this.$ti=b},
eH:function eH(a,b){this.a=a
this.b=b},
fG:function fG(){},
ay:function ay(a,b){this.a=a
this.$ti=b},
bN:function bN(a,b,c,d,e){var _=this
_.a=null
_.b=a
_.c=b
_.d=c
_.e=d
_.$ti=e},
C:function C(a,b){var _=this
_.a=0
_.b=a
_.c=null
_.$ti=b},
m3:function m3(a,b){this.a=a
this.b=b},
ma:function ma(a,b){this.a=a
this.b=b},
m6:function m6(a){this.a=a},
m7:function m7(a){this.a=a},
m8:function m8(a,b,c){this.a=a
this.b=b
this.c=c},
m5:function m5(a,b){this.a=a
this.b=b},
m9:function m9(a,b){this.a=a
this.b=b},
m4:function m4(a,b,c){this.a=a
this.b=b
this.c=c},
md:function md(a,b,c){this.a=a
this.b=b
this.c=c},
me:function me(a){this.a=a},
mc:function mc(a,b){this.a=a
this.b=b},
mb:function mb(a,b){this.a=a
this.b=b},
fE:function fE(a){this.a=a
this.b=null},
bi:function bi(){},
ln:function ln(a,b){this.a=a
this.b=b},
lo:function lo(a){this.a=a},
lp:function lp(a,b){this.a=a
this.b=b},
lq:function lq(a,b){this.a=a
this.b=b},
fr:function fr(){},
da:function da(){},
mq:function mq(a){this.a=a},
mp:function mp(a){this.a=a},
fS:function fS(){},
fF:function fF(){},
aZ:function aZ(a,b,c,d,e){var _=this
_.a=null
_.b=0
_.c=null
_.d=a
_.e=b
_.f=c
_.r=d
_.$ti=e},
db:function db(a,b,c,d,e){var _=this
_.a=null
_.b=0
_.c=null
_.d=a
_.e=b
_.f=c
_.r=d
_.$ti=e},
aj:function aj(a,b){this.a=a
this.$ti=b},
dX:function dX(a,b,c,d,e,f){var _=this
_.w=a
_.a=b
_.b=c
_.c=d
_.d=e
_.e=f
_.r=_.f=null},
dT:function dT(){},
m0:function m0(a,b,c){this.a=a
this.b=b
this.c=c},
m_:function m_(a){this.a=a},
ee:function ee(){},
fI:function fI(){},
cG:function cG(a){this.b=a
this.a=null},
dY:function dY(a,b){this.b=a
this.c=b
this.a=null},
m1:function m1(){},
eb:function eb(){this.a=0
this.c=this.b=null},
ml:function ml(a,b){this.a=a
this.b=b},
fQ:function fQ(){},
mw:function mw(){},
mK:function mK(a,b){this.a=a
this.b=b},
mn:function mn(){},
mo:function mo(a,b){this.a=a
this.b=b},
pe(a,b){var s=a[b]
return s===a?null:s},
nA(a,b,c){if(c==null)a[b]=a
else a[b]=c},
pf(){var s=Object.create(null)
A.nA(s,"<non-identifier-key>",s)
delete s["<non-identifier-key>"]
return s},
uI(a,b,c,d){return A.vo(A.wZ(),a,b,c,d)},
nu(a,b,c){return A.pN(a,new A.aC(b.h("@<0>").I(c).h("aC<1,2>")))},
a9(a,b){return new A.aC(a.h("@<0>").I(b).h("aC<1,2>"))},
vo(a,b,c,d,e){var s=c!=null?c:new A.mi(d)
return new A.e5(a,b,s,d.h("@<0>").I(e).h("e5<1,2>"))},
oH(a){return new A.b_(a.h("b_<0>"))},
aD(a){return new A.b_(a.h("b_<0>"))},
aP(a,b){return A.x4(a,new A.b_(b.h("b_<0>")))},
nC(){var s=Object.create(null)
s["<non-identifier-key>"]=s
delete s["<non-identifier-key>"]
return s},
nB(a,b,c){var s=new A.cH(a,b,c.h("cH<0>"))
s.c=a.e
return s},
w7(a,b){return J.af(a,b)},
uh(a,b,c){var s,r
if(A.nL(a)){if(b==="("&&c===")")return"(...)"
return b+"..."+c}s=A.a([],t.s)
$.cJ.push(a)
try{A.ws(a,s)}finally{$.cJ.pop()}r=A.ny(b,s,", ")+c
return r.charCodeAt(0)==0?r:r},
iI(a,b,c){var s,r
if(A.nL(a))return b+"..."+c
s=new A.ac(b)
$.cJ.push(a)
try{r=s
r.a=A.ny(r.a,a,", ")}finally{$.cJ.pop()}s.a+=c
r=s.a
return r.charCodeAt(0)==0?r:r},
nL(a){var s,r
for(s=$.cJ.length,r=0;r<s;++r)if(a===$.cJ[r])return!0
return!1},
ws(a,b){var s,r,q,p,o,n,m,l=a.gH(a),k=0,j=0
while(!0){if(!(k<80||j<3))break
if(!l.q())return
s=A.b(l.gt())
b.push(s)
k+=s.length+2;++j}if(!l.q()){if(j<=5)return
r=b.pop()
q=b.pop()}else{p=l.gt();++j
if(!l.q()){if(j<=4){b.push(A.b(p))
return}r=A.b(p)
q=b.pop()
k+=r.length+2}else{o=l.gt();++j
for(;l.q();p=o,o=n){n=l.gt();++j
if(j>100){while(!0){if(!(k>75&&j>3))break
k-=b.pop().length+2;--j}b.push("...")
return}}q=A.b(p)
r=A.b(o)
k+=r.length+q.length+4}}if(j>b.length+2){k+=5
m="..."}else m=null
while(!0){if(!(k>80&&b.length>3))break
k-=b.pop().length+2
if(m==null){k+=5
m="..."}}if(m!=null)b.push(m)
b.push(q)
b.push(r)},
uJ(a,b){var s,r,q=A.oH(b)
for(s=a.length,r=0;r<a.length;a.length===s||(0,A.cN)(a),++r)q.C(0,b.a(a[r]))
return q},
nv(a){var s,r={}
if(A.nL(a))return"{...}"
s=new A.ac("")
try{$.cJ.push(a)
s.a+="{"
r.a=!0
a.M(0,new A.jO(r,s))
s.a+="}"}finally{$.cJ.pop()}r=s.a
return r.charCodeAt(0)==0?r:r},
e1:function e1(){},
e4:function e4(a){var _=this
_.a=0
_.e=_.d=_.c=_.b=null
_.$ti=a},
e2:function e2(a,b){this.a=a
this.$ti=b},
e3:function e3(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
e5:function e5(a,b,c,d){var _=this
_.w=a
_.x=b
_.y=c
_.a=0
_.f=_.e=_.d=_.c=_.b=null
_.r=0
_.$ti=d},
mi:function mi(a){this.a=a},
b_:function b_(a){var _=this
_.a=0
_.f=_.e=_.d=_.c=_.b=null
_.r=0
_.$ti=a},
mj:function mj(a){this.a=a
this.c=this.b=null},
cH:function cH(a,b,c){var _=this
_.a=a
_.b=b
_.d=_.c=null
_.$ti=c},
aX:function aX(a,b){this.a=a
this.$ti=b},
dw:function dw(){},
dA:function dA(){},
p:function p(){},
dB:function dB(){},
jO:function jO(a,b){this.a=a
this.b=b},
I:function I(){},
jP:function jP(a){this.a=a},
fU:function fU(){},
dC:function dC(){},
bm:function bm(a,b){this.a=a
this.$ti=b},
dM:function dM(){},
ec:function ec(){},
e6:function e6(){},
em:function em(){},
eq:function eq(){},
pB(a,b){var s,r,q,p=null
try{p=JSON.parse(a)}catch(r){s=A.M(r)
q=A.R(String(s),null,null)
throw A.d(q)}q=A.mA(p)
return q},
mA(a){var s
if(a==null)return null
if(typeof a!="object")return a
if(Object.getPrototypeOf(a)!==Array.prototype)return new A.fM(a,Object.create(null))
for(s=0;s<a.length;++s)a[s]=A.mA(a[s])
return a},
ve(a,b,c,d){var s,r
if(b instanceof Uint8Array){s=b
d=s.length
if(d-c<15)return null
r=A.vf(a,s,c,d)
if(r!=null&&a)if(r.indexOf("\ufffd")>=0)return null
return r}return null},
vf(a,b,c,d){var s=a?$.tm():$.tl()
if(s==null)return null
if(0===c&&d===b.length)return A.p8(s,b)
return A.p8(s,b.subarray(c,A.aQ(c,d,b.length)))},
p8(a,b){var s,r
try{s=a.decode(b)
return s}catch(r){}return null},
os(a,b,c,d,e,f){if(B.c.br(f,4)!==0)throw A.d(A.R("Invalid base64 padding, padded length must be multiple of four, is "+f,a,c))
if(d+e!==f)throw A.d(A.R("Invalid base64 padding, '=' not at the end",a,b))
if(e>2)throw A.d(A.R("Invalid base64 padding, more than two '=' characters",a,b))},
vm(a,b,c,d,e,f){var s,r,q,p,o,n,m="Invalid encoding before padding",l="Invalid character",k=B.c.ai(f,2),j=f&3,i=$.ok()
for(s=b,r=0;s<c;++s){q=B.a.B(a,s)
r|=q
p=i[q&127]
if(p>=0){k=(k<<6|p)&16777215
j=j+1&3
if(j===0){o=e+1
d[e]=k>>>16&255
e=o+1
d[o]=k>>>8&255
o=e+1
d[e]=k&255
e=o
k=0}continue}else if(p===-1&&j>1){if(r>127)break
if(j===3){if((k&3)!==0)throw A.d(A.R(m,a,s))
d[e]=k>>>10
d[e+1]=k>>>2}else{if((k&15)!==0)throw A.d(A.R(m,a,s))
d[e]=k>>>4}n=(3-j)*3
if(q===37)n+=2
return A.pc(a,s+1,c,-n-1)}throw A.d(A.R(l,a,s))}if(r>=0&&r<=127)return(k<<2|j)>>>0
for(s=b;s<c;++s){q=B.a.B(a,s)
if(q>127)break}throw A.d(A.R(l,a,s))},
vk(a,b,c,d){var s=A.vl(a,b,c),r=(d&3)+(s-b),q=B.c.ai(r,2)*3,p=r&3
if(p!==0&&s<c)q+=p-1
if(q>0)return new Uint8Array(q)
return $.tn()},
vl(a,b,c){var s,r=c,q=r,p=0
while(!0){if(!(q>b&&p<2))break
c$0:{--q
s=B.a.B(a,q)
if(s===61){++p
r=q
break c$0}if((s|32)===100){if(q===b)break;--q
s=B.a.B(a,q)}if(s===51){if(q===b)break;--q
s=B.a.B(a,q)}if(s===37){++p
r=q
break c$0}break}}return r},
pc(a,b,c,d){var s,r
if(b===c)return d
s=-d-1
for(;s>0;){r=B.a.B(a,b)
if(s===3){if(r===61){s-=3;++b
break}if(r===37){--s;++b
if(b===c)break
r=B.a.B(a,b)}else break}if((s>3?s-3:s)===2){if(r!==51)break;++b;--s
if(b===c)break
r=B.a.B(a,b)}if((r|32)!==100)break;++b;--s
if(b===c)break}if(b!==c)throw A.d(A.R("Invalid padding character",a,b))
return-s-1},
ps(a){switch(a){case 65:return"Missing extension byte"
case 67:return"Unexpected extension byte"
case 69:return"Invalid UTF-8 byte"
case 71:return"Overlong encoding"
case 73:return"Out of unicode range"
case 75:return"Encoded surrogate"
case 77:return"Unfinished UTF-8 octet sequence"
default:return""}},
vZ(a,b,c){var s,r,q,p=c-b,o=new Uint8Array(p)
for(s=J.V(a),r=0;r<p;++r){q=s.i(a,b+r)
o[r]=(q&4294967040)>>>0!==0?255:q}return o},
fM:function fM(a,b){this.a=a
this.b=b
this.c=null},
fN:function fN(a){this.a=a},
mh:function mh(a,b,c){this.b=a
this.c=b
this.a=c},
lD:function lD(){},
lC:function lC(){},
ha:function ha(){},
hc:function hc(){},
hb:function hb(){},
lZ:function lZ(){this.a=0},
hd:function hd(){},
eJ:function eJ(){},
fO:function fO(a,b,c){this.a=a
this.b=b
this.$ti=c},
eN:function eN(){},
eP:function eP(){},
hW:function hW(){},
iQ:function iQ(){},
iR:function iR(a){this.a=a},
lr:function lr(){},
ls:function ls(){},
ef:function ef(){},
mu:function mu(a,b,c){this.a=a
this.b=b
this.c=c},
lA:function lA(){},
lB:function lB(a){this.a=a},
fV:function fV(a){this.a=a
this.b=16
this.c=0},
cM(a,b){var s=A.oY(a,b)
if(s!=null)return s
throw A.d(A.R(a,null,null))},
u6(a){if(a instanceof A.c7)return a.k(0)
return"Instance of '"+A.b(A.ka(a))+"'"},
u7(a,b){a=A.d(a)
a.stack=J.as(b)
throw a
throw A.d("unreachable")},
U(a,b,c,d){var s,r=J.b8(a,d)
if(a!==0&&b!=null)for(s=0;s<a;++s)r[s]=b
return r},
uK(a,b){var s,r=A.a([],b.h("D<0>"))
for(s=a.gH(a);s.q();)r.push(s.gt())
return r},
bc(a,b,c){var s
if(b)return A.oI(a,c)
s=J.nr(A.oI(a,c))
return s},
oI(a,b){var s,r
if(Array.isArray(a))return A.a(a.slice(0),b.h("D<0>"))
s=A.a([],b.h("D<0>"))
for(r=J.aA(a);r.q();)s.push(r.gt())
return s},
oJ(a,b,c,d){var s,r=J.b8(a,d)
for(s=0;s<a;++s)r[s]=b.$1(s)
return r},
p2(a,b,c){if(t.bm.b(a))return A.v2(a,b,A.aQ(b,c,a.length))
return A.va(a,b,c)},
va(a,b,c){var s,r,q,p,o=null
if(b<0)throw A.d(A.Y(b,0,a.length,o,o))
s=c==null
if(!s&&c<b)throw A.d(A.Y(c,b,a.length,o,o))
r=new A.aa(a,a.length,A.ak(a).h("aa<p.E>"))
for(q=0;q<b;++q)if(!r.q())throw A.d(A.Y(b,0,q,o,o))
p=[]
if(s)for(;r.q();)p.push(r.d)
else for(q=b;q<c;++q){if(!r.q())throw A.d(A.Y(c,b,q,o,o))
p.push(r.d)}return A.v0(p)},
nx(a){return new A.iK(a,A.uk(a,!1,!0,!1,!1,!1))},
ny(a,b,c){var s=J.aA(b)
if(!s.q())return a
if(c.length===0){do a+=A.b(s.gt())
while(s.q())}else{a+=A.b(s.gt())
for(;s.q();)a=a+c+A.b(s.gt())}return a},
uT(a,b,c,d,e){return new A.dH(a,b,c,d,e)},
oy(a){var s=Math.abs(a),r=a<0?"-":""
if(s>=1000)return""+a
if(s>=100)return r+"0"+s
if(s>=10)return r+"00"+s
return r+"000"+s},
u5(a){var s=Math.abs(a),r=a<0?"-":"+"
if(s>=1e5)return r+s
return r+"0"+s},
oz(a){if(a>=100)return""+a
if(a>=10)return"0"+a
return"00"+a},
b6(a){if(a>=10)return""+a
return"0"+a},
cS(a){if(typeof a=="number"||A.eu(a)||a==null)return J.as(a)
if(typeof a=="string")return JSON.stringify(a)
return A.u6(a)},
u8(a,b){A.bU(a,"error",t.K)
A.bU(b,"stackTrace",t.gm)
A.u7(a,b)
A.bg(u.g)},
eG(a){return new A.eF(a)},
K(a,b){return new A.at(!1,null,b,a)},
h7(a,b,c){return new A.at(!0,a,b,c)},
h8(a,b){return a},
Y(a,b,c,d,e){return new A.dL(b,c,!0,a,d,"Invalid value")},
aQ(a,b,c){if(0>a||a>c)throw A.d(A.Y(a,0,c,"start",null))
if(b!=null){if(a>b||b>c)throw A.d(A.Y(b,a,c,"end",null))
return b}return c},
aW(a,b){if(a<0)throw A.d(A.Y(a,0,null,b,null))
return a},
eW(a,b,c,d,e){return new A.eV(b,!0,a,e,"Index out of range")},
ad(a){return new A.fz(a)},
p4(a){return new A.fu(a)},
d2(a){return new A.bJ(a)},
ag(a){return new A.eO(a)},
u9(a){return new A.e_(a)},
R(a,b,c){return new A.aK(a,b,c)},
oE(a,b,c){if(a<=0)return new A.b7(c.h("b7<0>"))
return new A.e0(a,b,c.h("e0<0>"))},
oK(a,b,c,d,e){return new A.c6(a,b.h("@<0>").I(c).I(d).I(e).h("c6<1,2,3,4>"))},
k6(a){var s,r,q=$.to()
for(s=a.length,r=0;r<s;++r){q=q+J.bY(a[r])&536870911
q=q+((q&524287)<<10)&536870911
q^=q>>>6}q=q+((q&67108863)<<3)&536870911
q^=q>>>11
return q+((q&16383)<<15)&536870911},
p6(a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4=null,a5=a6.length
if(a5>=5){s=A.pI(a6,0)
if(s===0){r=A.lw(a5<a5?B.a.u(a6,0,a5):a6,5,a4)
return r.gbo(r)}else if(s===32){r=A.lw(B.a.u(a6,5,a5),0,a4)
return r.gbo(r)}}q=A.U(8,0,!1,t.S)
q[0]=0
q[1]=-1
q[2]=-1
q[7]=-1
q[3]=0
q[4]=0
q[5]=a5
q[6]=a5
if(A.pG(a6,0,a5,0,q)>=14)q[7]=a5
p=q[1]
if(p>=0)if(A.pG(a6,0,p,20,q)===20)q[7]=p
o=q[2]+1
n=q[3]
m=q[4]
l=q[5]
k=q[6]
if(k<l)l=k
if(m<o)m=l
else if(m<=p)m=p+1
if(n<o)n=m
j=q[7]<0
if(j)if(o>p+3){i=a4
j=!1}else{r=n>0
if(r&&n+1===m){i=a4
j=!1}else{if(!B.a.U(a6,"\\",m))if(o>0)h=B.a.U(a6,"\\",o-1)||B.a.U(a6,"\\",o-2)
else h=!1
else h=!0
if(h){i=a4
j=!1}else{if(!(l<a5&&l===m+2&&B.a.U(a6,"..",m)))h=l>m+2&&B.a.U(a6,"/..",l-3)
else h=!0
if(h){i=a4
j=!1}else{if(p===4)if(B.a.U(a6,"file",0)){if(o<=0){if(!B.a.U(a6,"/",m)){g="file:///"
f=3}else{g="file://"
f=2}a6=g+B.a.u(a6,m,a5)
p-=0
r=f-0
l+=r
k+=r
a5=a6.length
o=7
n=7
m=7}else if(m===l){++k
e=l+1
a6=B.a.aH(a6,m,l,"/");++a5
l=e}i="file"}else if(B.a.U(a6,"http",0)){if(r&&n+3===m&&B.a.U(a6,"80",n+1)){k-=3
d=m-3
l-=3
a6=B.a.aH(a6,n,m,"")
a5-=3
m=d}i="http"}else i=a4
else if(p===5&&B.a.U(a6,"https",0)){if(r&&n+4===m&&B.a.U(a6,"443",n+1)){k-=4
d=m-4
l-=4
a6=B.a.aH(a6,n,m,"")
a5-=3
m=d}i="https"}else i=a4
j=!0}}}}else i=a4
if(j){if(a5<a6.length){a6=B.a.u(a6,0,a5)
p-=0
o-=0
n-=0
m-=0
l-=0
k-=0}return new A.fP(a6,p,o,n,m,l,k,i)}if(i==null)if(p>0)i=A.vS(a6,0,p)
else{if(p===0){A.dc(a6,0,"Invalid empty scheme")
A.bg(u.g)}i=""}if(o>0){c=p+3
b=c<o?A.vT(a6,c,o-1):""
a=A.vO(a6,o,n,!1)
r=n+1
if(r<m){a0=A.oY(B.a.u(a6,r,m),a4)
a1=A.vQ(a0==null?A.Z(A.R("Invalid port",a6,r)):a0,i)}else a1=a4}else{a1=a4
a=a1
b=""}a2=A.vP(a6,m,l,a4,i,a!=null)
a3=l<k?A.vR(a6,l+1,k,a4):a4
return A.vJ(i,b,a,a1,a2,a3,k<a5?A.vN(a6,k+1,a5):a4)},
vd(a,b,c){var s,r,q,p,o,n,m="IPv4 address should contain exactly 4 parts",l="each part must be in the range 0..255",k=new A.lx(a),j=new Uint8Array(4)
for(s=b,r=s,q=0;s<c;++s){p=B.a.B(a,s)
if(p!==46){if((p^48)>9)k.$2("invalid character",s)}else{if(q===3)k.$2(m,s)
o=A.cM(B.a.u(a,r,s),null)
if(o>255)k.$2(l,r)
n=q+1
j[q]=o
r=s+1
q=n}}if(q!==3)k.$2(m,c)
o=A.cM(B.a.u(a,r,c),null)
if(o>255)k.$2(l,r)
j[q]=o
return j},
p7(a,b,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=null,d=new A.ly(a),c=new A.lz(d,a)
if(a.length<2)d.$2("address is too short",e)
s=A.a([],t.Z)
for(r=b,q=r,p=!1,o=!1;r<a0;++r){n=B.a.B(a,r)
if(n===58){if(r===b){++r
if(B.a.B(a,r)!==58)d.$2("invalid start colon.",r)
q=r}if(r===q){if(p)d.$2("only one wildcard `::` is allowed",r)
s.push(-1)
p=!0}else s.push(c.$2(q,r))
q=r+1}else if(n===46)o=!0}if(s.length===0)d.$2("too few parts",e)
m=q===a0
l=B.d.gaV(s)
if(m&&l!==-1)d.$2("expected a part after last `:`",a0)
if(!m)if(!o)s.push(c.$2(q,a0))
else{k=A.vd(a,q,a0)
s.push((k[0]<<8|k[1])>>>0)
s.push((k[2]<<8|k[3])>>>0)}if(p){if(s.length>7)d.$2("an address with a wildcard must have less than 7 parts",e)}else if(s.length!==8)d.$2("an address without a wildcard must contain exactly 8 parts",e)
j=new Uint8Array(16)
for(l=s.length,i=9-l,r=0,h=0;r<l;++r){g=s[r]
if(g===-1)for(f=0;f<i;++f){j[h]=0
j[h+1]=0
h+=2}else{j[h]=B.c.ai(g,8)
j[h+1]=g&255
h+=2}}return j},
vJ(a,b,c,d,e,f,g){return new A.en(a,b,c,d,e,f,g)},
pm(a){if(a==="http")return 80
if(a==="https")return 443
return 0},
dc(a,b,c){throw A.d(A.R(c,a,b))},
vQ(a,b){var s=A.pm(b)
if(a===s)return null
return a},
vO(a,b,c,d){var s,r,q,p,o,n
if(b===c)return""
if(B.a.B(a,b)===91){s=c-1
if(B.a.B(a,s)!==93){A.dc(a,b,"Missing end `]` to match `[` in host")
A.bg(u.g)}r=b+1
q=A.vL(a,r,s)
if(q<s){p=q+1
o=A.pr(a,B.a.U(a,"25",p)?q+3:p,s,"%25")}else o=""
A.p7(a,r,q)
return B.a.u(a,b,q).toLowerCase()+o+"]"}for(n=b;n<c;++n)if(B.a.B(a,n)===58){q=B.a.bg(a,"%",b)
q=q>=b&&q<c?q:c
if(q<c){p=q+1
o=A.pr(a,B.a.U(a,"25",p)?q+3:p,c,"%25")}else o=""
A.p7(a,b,q)
return"["+B.a.u(a,b,q)+o+"]"}return A.vV(a,b,c)},
vL(a,b,c){var s=B.a.bg(a,"%",b)
return s>=b&&s<c?s:c},
pr(a,b,c,d){var s,r,q,p,o,n,m,l,k,j,i=d!==""?new A.ac(d):null
for(s=b,r=s,q=!0;s<c;){p=B.a.B(a,s)
if(p===37){o=A.nI(a,s,!0)
n=o==null
if(n&&q){s+=3
continue}if(i==null)i=new A.ac("")
m=i.a+=B.a.u(a,r,s)
if(n)o=B.a.u(a,s,s+3)
else if(o==="%"){A.dc(a,s,"ZoneID should not contain % anymore")
A.bg(u.g)}i.a=m+o
s+=3
r=s
q=!0}else if(p<127&&(B.av[p>>>4]&1<<(p&15))!==0){if(q&&65<=p&&90>=p){if(i==null)i=new A.ac("")
if(r<s){i.a+=B.a.u(a,r,s)
r=s}q=!1}++s}else{if((p&64512)===55296&&s+1<c){l=B.a.B(a,s+1)
if((l&64512)===56320){p=(p&1023)<<10|l&1023|65536
k=2}else k=1}else k=1
j=B.a.u(a,r,s)
if(i==null){i=new A.ac("")
n=i}else n=i
n.a+=j
n.a+=A.nH(p)
s+=k
r=s}}if(i==null)return B.a.u(a,b,c)
if(r<c)i.a+=B.a.u(a,r,c)
n=i.a
return n.charCodeAt(0)==0?n:n},
vV(a,b,c){var s,r,q,p,o,n,m,l,k,j,i
for(s=b,r=s,q=null,p=!0;s<c;){o=B.a.B(a,s)
if(o===37){n=A.nI(a,s,!0)
m=n==null
if(m&&p){s+=3
continue}if(q==null)q=new A.ac("")
l=B.a.u(a,r,s)
k=q.a+=!p?l.toLowerCase():l
if(m){n=B.a.u(a,s,s+3)
j=3}else if(n==="%"){n="%25"
j=1}else j=3
q.a=k+n
s+=j
r=s
p=!0}else if(o<127&&(B.db[o>>>4]&1<<(o&15))!==0){if(p&&65<=o&&90>=o){if(q==null)q=new A.ac("")
if(r<s){q.a+=B.a.u(a,r,s)
r=s}p=!1}++s}else if(o<=93&&(B.an[o>>>4]&1<<(o&15))!==0){A.dc(a,s,"Invalid character")
A.bg(u.g)}else{if((o&64512)===55296&&s+1<c){i=B.a.B(a,s+1)
if((i&64512)===56320){o=(o&1023)<<10|i&1023|65536
j=2}else j=1}else j=1
l=B.a.u(a,r,s)
if(!p)l=l.toLowerCase()
if(q==null){q=new A.ac("")
m=q}else m=q
m.a+=l
m.a+=A.nH(o)
s+=j
r=s}}if(q==null)return B.a.u(a,b,c)
if(r<c){l=B.a.u(a,r,c)
q.a+=!p?l.toLowerCase():l}m=q.a
return m.charCodeAt(0)==0?m:m},
vS(a,b,c){var s,r,q,p=u.g
if(b===c)return""
if(!A.po(B.a.J(a,b))){A.dc(a,b,"Scheme not starting with alphabetic character")
A.bg(p)}for(s=b,r=!1;s<c;++s){q=B.a.J(a,s)
if(!(q<128&&(B.as[q>>>4]&1<<(q&15))!==0)){A.dc(a,s,"Illegal scheme character")
A.bg(p)}if(65<=q&&q<=90)r=!0}a=B.a.u(a,b,c)
return A.vK(r?a.toLowerCase():a)},
vK(a){if(a==="http")return"http"
if(a==="file")return"file"
if(a==="https")return"https"
if(a==="package")return"package"
return a},
vT(a,b,c){return A.eo(a,b,c,B.cQ,!1,!1)},
vP(a,b,c,d,e,f){var s=e==="file",r=s||f,q=A.eo(a,b,c,B.ax,!0,!0)
if(q.length===0){if(s)return"/"}else if(r&&!B.a.Y(q,"/"))q="/"+q
return A.vU(q,e,f)},
vU(a,b,c){var s=b.length===0
if(s&&!c&&!B.a.Y(a,"/")&&!B.a.Y(a,"\\"))return A.vW(a,!s||c)
return A.vX(a)},
vR(a,b,c,d){return A.eo(a,b,c,B.D,!0,!1)},
vN(a,b,c){return A.eo(a,b,c,B.D,!0,!1)},
nI(a,b,c){var s,r,q,p,o,n=b+2
if(n>=a.length)return"%"
s=B.a.B(a,b+1)
r=B.a.B(a,n)
q=A.mW(s)
p=A.mW(r)
if(q<0||p<0)return"%"
o=q*16+p
if(o<127&&(B.av[B.c.ai(o,4)]&1<<(o&15))!==0)return A.be(c&&65<=o&&90>=o?(o|32)>>>0:o)
if(s>=97||r>=97)return B.a.u(a,b,b+3).toUpperCase()
return null},
nH(a){var s,r,q,p,o,n="0123456789ABCDEF"
if(a<128){s=new Uint8Array(3)
s[0]=37
s[1]=B.a.J(n,a>>>4)
s[2]=B.a.J(n,a&15)}else{if(a>2047)if(a>65535){r=240
q=4}else{r=224
q=3}else{r=192
q=2}s=new Uint8Array(3*q)
for(p=0;--q,q>=0;r=128){o=B.c.dT(a,6*q)&63|r
s[p]=37
s[p+1]=B.a.J(n,o>>>4)
s[p+2]=B.a.J(n,o&15)
p+=3}}return A.p2(s,0,null)},
eo(a,b,c,d,e,f){var s=A.pq(a,b,c,d,e,f)
return s==null?B.a.u(a,b,c):s},
pq(a,b,c,d,e,f){var s,r,q,p,o,n,m,l,k,j,i=null
for(s=!e,r=b,q=r,p=i;r<c;){o=B.a.B(a,r)
if(o<127&&(d[o>>>4]&1<<(o&15))!==0)++r
else{if(o===37){n=A.nI(a,r,!1)
if(n==null){r+=3
continue}if("%"===n){n="%25"
m=1}else m=3}else if(o===92&&f){n="/"
m=1}else if(s&&o<=93&&(B.an[o>>>4]&1<<(o&15))!==0){A.dc(a,r,"Invalid character")
A.bg(u.g)
m=i
n=m}else{if((o&64512)===55296){l=r+1
if(l<c){k=B.a.B(a,l)
if((k&64512)===56320){o=(o&1023)<<10|k&1023|65536
m=2}else m=1}else m=1}else m=1
n=A.nH(o)}if(p==null){p=new A.ac("")
l=p}else l=p
j=l.a+=B.a.u(a,q,r)
l.a=j+A.b(n)
r+=m
q=r}}if(p==null)return i
if(q<c)p.a+=B.a.u(a,q,c)
s=p.a
return s.charCodeAt(0)==0?s:s},
pp(a){if(B.a.Y(a,"."))return!0
return B.a.bR(a,"/.")!==-1},
vX(a){var s,r,q,p,o,n
if(!A.pp(a))return a
s=A.a([],t.s)
for(r=a.split("/"),q=r.length,p=!1,o=0;o<q;++o){n=r[o]
if(J.af(n,"..")){if(s.length!==0){s.pop()
if(s.length===0)s.push("")}p=!0}else if("."===n)p=!0
else{s.push(n)
p=!1}}if(p)s.push("")
return B.d.cQ(s,"/")},
vW(a,b){var s,r,q,p,o,n
if(!A.pp(a))return!b?A.pn(a):a
s=A.a([],t.s)
for(r=a.split("/"),q=r.length,p=!1,o=0;o<q;++o){n=r[o]
if(".."===n)if(s.length!==0&&B.d.gaV(s)!==".."){s.pop()
p=!0}else{s.push("..")
p=!1}else if("."===n)p=!0
else{s.push(n)
p=!1}}r=s.length
if(r!==0)r=r===1&&s[0].length===0
else r=!0
if(r)return"./"
if(p||B.d.gaV(s)==="..")s.push("")
if(!b)s[0]=A.pn(s[0])
return B.d.cQ(s,"/")},
pn(a){var s,r,q=a.length
if(q>=2&&A.po(B.a.J(a,0)))for(s=1;s<q;++s){r=B.a.J(a,s)
if(r===58)return B.a.u(a,0,s)+"%3A"+B.a.bu(a,s+1)
if(r>127||(B.as[r>>>4]&1<<(r&15))===0)break}return a},
vM(a,b){var s,r,q
for(s=0,r=0;r<2;++r){q=B.a.B(a,b+r)
if(48<=q&&q<=57)s=s*16+q-48
else{q|=32
if(97<=q&&q<=102)s=s*16+q-87
else throw A.d(A.K("Invalid URL encoding",null))}}return s},
vY(a,b,c,d,e){var s,r,q,p,o=b
while(!0){if(!(o<c)){s=!0
break}r=B.a.B(a,o)
if(r<=127)if(r!==37)q=!1
else q=!0
else q=!0
if(q){s=!1
break}++o}if(s){if(B.ac!==d)q=!1
else q=!0
if(q)return B.a.u(a,b,c)
else p=new A.c8(B.a.u(a,b,c))}else{p=A.a([],t.Z)
for(q=a.length,o=b;o<c;++o){r=B.a.B(a,o)
if(r>127)throw A.d(A.K("Illegal percent encoding in URI",null))
if(r===37){if(o+3>q)throw A.d(A.K("Truncated URI",null))
p.push(A.vM(a,o+1))
o+=2}else p.push(r)}}return B.em.e_(p)},
po(a){var s=a|32
return 97<=s&&s<=122},
p5(a){var s
if(a.length>=5){s=A.pI(a,0)
if(s===0)return A.lw(a,5,null)
if(s===32)return A.lw(B.a.bu(a,5),0,null)}throw A.d(A.R("Does not start with 'data:'",a,0))},
lw(a,b,c){var s,r,q,p,o,n,m,l,k="Invalid MIME type",j=A.a([b-1],t.Z)
for(s=a.length,r=b,q=-1,p=null;r<s;++r){p=B.a.J(a,r)
if(p===44||p===59)break
if(p===47){if(q<0){q=r
continue}throw A.d(A.R(k,a,r))}}if(q<0&&r>b)throw A.d(A.R(k,a,r))
for(;p!==44;){j.push(r);++r
for(o=-1;r<s;++r){p=B.a.J(a,r)
if(p===61){if(o<0)o=r}else if(p===59||p===44)break}if(o>=0)j.push(o)
else{n=B.d.gaV(j)
if(p!==44||r!==n+7||!B.a.U(a,"base64",n+1))throw A.d(A.R("Expecting '='",a,r))
break}}j.push(r)
m=r+1
if((j.length&1)===1)a=B.b7.ee(a,m,s)
else{l=A.pq(a,m,s,B.D,!0,!1)
if(l!=null)a=B.a.aH(a,m,s,l)}return new A.lv(a,j,c)},
w6(){var s,r,q,p,o,n="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~!$&'()*+,;=",m=".",l=":",k="/",j="\\",i="?",h="#",g="/\\",f=A.a(new Array(22),t.gN)
for(s=0;s<22;++s)f[s]=new Uint8Array(96)
r=new A.mB(f)
q=new A.mC()
p=new A.mD()
o=r.$2(0,225)
q.$3(o,n,1)
q.$3(o,m,14)
q.$3(o,l,34)
q.$3(o,k,3)
q.$3(o,j,227)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(14,225)
q.$3(o,n,1)
q.$3(o,m,15)
q.$3(o,l,34)
q.$3(o,g,234)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(15,225)
q.$3(o,n,1)
q.$3(o,"%",225)
q.$3(o,l,34)
q.$3(o,k,9)
q.$3(o,j,233)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(1,225)
q.$3(o,n,1)
q.$3(o,l,34)
q.$3(o,k,10)
q.$3(o,j,234)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(2,235)
q.$3(o,n,139)
q.$3(o,k,131)
q.$3(o,j,131)
q.$3(o,m,146)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(3,235)
q.$3(o,n,11)
q.$3(o,k,68)
q.$3(o,j,68)
q.$3(o,m,18)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(4,229)
q.$3(o,n,5)
p.$3(o,"AZ",229)
q.$3(o,l,102)
q.$3(o,"@",68)
q.$3(o,"[",232)
q.$3(o,k,138)
q.$3(o,j,138)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(5,229)
q.$3(o,n,5)
p.$3(o,"AZ",229)
q.$3(o,l,102)
q.$3(o,"@",68)
q.$3(o,k,138)
q.$3(o,j,138)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(6,231)
p.$3(o,"19",7)
q.$3(o,"@",68)
q.$3(o,k,138)
q.$3(o,j,138)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(7,231)
p.$3(o,"09",7)
q.$3(o,"@",68)
q.$3(o,k,138)
q.$3(o,j,138)
q.$3(o,i,172)
q.$3(o,h,205)
q.$3(r.$2(8,8),"]",5)
o=r.$2(9,235)
q.$3(o,n,11)
q.$3(o,m,16)
q.$3(o,g,234)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(16,235)
q.$3(o,n,11)
q.$3(o,m,17)
q.$3(o,g,234)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(17,235)
q.$3(o,n,11)
q.$3(o,k,9)
q.$3(o,j,233)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(10,235)
q.$3(o,n,11)
q.$3(o,m,18)
q.$3(o,k,10)
q.$3(o,j,234)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(18,235)
q.$3(o,n,11)
q.$3(o,m,19)
q.$3(o,g,234)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(19,235)
q.$3(o,n,11)
q.$3(o,g,234)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(11,235)
q.$3(o,n,11)
q.$3(o,k,10)
q.$3(o,j,234)
q.$3(o,i,172)
q.$3(o,h,205)
o=r.$2(12,236)
q.$3(o,n,12)
q.$3(o,i,12)
q.$3(o,h,205)
o=r.$2(13,237)
q.$3(o,n,13)
q.$3(o,i,13)
p.$3(r.$2(20,245),"az",21)
o=r.$2(21,245)
p.$3(o,"az",21)
p.$3(o,"09",21)
q.$3(o,"+-.",21)
return f},
pG(a,b,c,d,e){var s,r,q,p,o=$.ts()
for(s=b;s<c;++s){r=o[d]
q=B.a.J(a,s)^96
p=r[q>95?31:q]
d=p&31
e[p>>>5]=s}return d},
pI(a,b){return((B.a.J(a,b+4)^58)*3|B.a.J(a,b)^100|B.a.J(a,b+1)^97|B.a.J(a,b+2)^116|B.a.J(a,b+3)^97)>>>0},
k2:function k2(a,b){this.a=a
this.b=b},
dp:function dp(a,b){this.a=a
this.b=b},
m2:function m2(){},
H:function H(){},
eF:function eF(a){this.a=a},
aG:function aG(){},
fg:function fg(){},
at:function at(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
dL:function dL(a,b,c,d,e,f){var _=this
_.e=a
_.f=b
_.a=c
_.b=d
_.c=e
_.d=f},
eV:function eV(a,b,c,d,e){var _=this
_.f=a
_.a=b
_.b=c
_.c=d
_.d=e},
dH:function dH(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
fz:function fz(a){this.a=a},
fu:function fu(a){this.a=a},
bJ:function bJ(a){this.a=a},
eO:function eO(a){this.a=a},
fi:function fi(){},
dO:function dO(){},
eQ:function eQ(a){this.a=a},
e_:function e_(a){this.a=a},
aK:function aK(a,b,c){this.a=a
this.b=b
this.c=c},
j:function j(){},
e0:function e0(a,b,c){this.a=a
this.b=b
this.$ti=c},
P:function P(){},
cY:function cY(a,b,c){this.a=a
this.b=b
this.$ti=c},
l:function l(){},
c:function c(){},
fR:function fR(){},
ac:function ac(a){this.a=a},
lx:function lx(a){this.a=a},
ly:function ly(a){this.a=a},
lz:function lz(a,b){this.a=a
this.b=b},
en:function en(a,b,c,d,e,f,g){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.y=_.w=$},
lv:function lv(a,b,c){this.a=a
this.b=b
this.c=c},
mB:function mB(a){this.a=a},
mC:function mC(){},
mD:function mD(){},
fP:function fP(a,b,c,d,e,f,g,h){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.w=h
_.x=null},
fH:function fH(a,b,c,d,e,f,g){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.y=_.w=$},
nR(a){if(!t.I.b(a)&&!t.j.b(a))throw A.d(A.K("object must be a Map or Iterable",null))
return A.w5(a)},
w5(a){var s=new A.mz(new A.e4(t.aH)).$1(a)
s.toString
return s},
mz:function mz(a){this.a=a},
tN(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f="byteOffset",e=null,d="normalized"
A.w(a,B.cZ,b)
s=A.W(a,"bufferView",b,!1)
if(s===-1){r=a.v(f)
if(r)b.l($.cO(),A.a(["bufferView"],t.M),f)
q=0}else q=A.a0(a,f,b,0,e,-1,0,!1)
p=A.a0(a,"componentType",b,-1,B.cu,-1,0,!0)
o=A.a0(a,"count",b,-1,e,-1,1,!0)
n=A.J(a,"type",b,e,B.m.gN(),e,!0)
m=A.pO(a,d,b)
if(n!=null&&p!==-1){l=B.m.i(0,n)
if(l!=null)if(p===5126){r=t.V
k=A.ae(a,"min",b,e,A.a([l],r),1/0,-1/0,!0)
j=A.ae(a,"max",b,e,A.a([l],r),1/0,-1/0,!0)}else{k=A.pP(a,"min",b,p,l)
j=A.pP(a,"max",b,p,l)}else{k=e
j=k}}else{k=e
j=k}i=A.T(a,"sparse",b,A.wK(),!1)
if(m)r=p===5126||p===5125
else r=!1
if(r)b.n($.ru(),d)
if((n==="MAT2"||n==="MAT3"||n==="MAT4")&&q!==-1&&(q&3)!==0)b.n($.rt(),f)
switch(p){case 5120:case 5121:case 5122:case 5123:case 5125:r=t.w
r.a(j)
r.a(k)
A.J(a,"name",b,e,e,e,!1)
r=A.t(a,B.S,b,e)
h=A.x(a,b)
g=new A.fC(s,q,p,o,n,m,j,k,i,A.b0(p),r,h,!1)
if(k!=null){r=b.S()
h=t.e
b.a_(g,new A.f6(A.U(k.length,0,!1,h),A.U(k.length,0,!1,h),J.h4(k,!1),r))}if(j!=null){r=b.S()
h=t.e
b.a_(g,new A.f4(A.U(j.length,0,!1,h),A.U(j.length,0,!1,h),J.h4(j,!1),r))}break
default:r=t.fy
r.a(j)
r.a(k)
A.J(a,"name",b,e,e,e,!1)
r=A.t(a,B.S,b,e)
h=A.x(a,b)
g=new A.fB(s,q,p,o,n,m,j,k,i,A.b0(p),r,h,!1)
b.a_(g,new A.eY(b.S()))
if(k!=null){r=b.S()
b.a_(g,new A.f5(A.U(k.length,0,!1,t.e),A.U(k.length,0,!1,t.F),J.h4(k,!1),r))}if(j!=null){r=b.S()
b.a_(g,new A.f3(A.U(j.length,0,!1,t.e),A.U(j.length,0,!1,t.F),J.h4(j,!1),r))}break}return g},
bu(a,b,c,d,e,f){var s,r,q="byteOffset"
if(a===-1)return!1
if(a%b!==0)if(f!=null)f.l($.rv(),A.a([a,b],t.M),q)
else return!1
s=d.x
if(s===-1)return!1
r=s+a
if(r%b!==0)if(f!=null)f.F($.qM(),A.a([r,b],t.M))
else return!1
s=d.y
if(a>s)if(f!=null)f.l($.o3(),A.a([a,c,e,s],t.M),q)
else return!1
else if(a+c>s)if(f!=null)f.F($.o3(),A.a([a,c,e,s],t.M))
else return!1
return!0},
np(a,b,c,d){var s=b.byteLength,r=A.b0(a)
if(s<c+r*d)return null
switch(a){case 5121:return A.nw(b,c,d)
case 5123:return A.oO(b,c,d)
case 5125:return A.oP(b,c,d)
default:return null}},
oq(a,b,c,d){var s=b.byteLength,r=A.b0(a)
if(s<c+r*d)return null
switch(a){case 5126:A.de(b,c,d)
return new Float32Array(b,c,d)
default:return null}},
or(a,b,c,d){var s=b.byteLength,r=A.b0(a)
if(s<c+r*d)return null
switch(a){case 5120:A.de(b,c,d)
s=new Int8Array(b,c,d)
return s
case 5121:return A.nw(b,c,d)
case 5122:A.de(b,c,d)
return new Int16Array(b,c,d)
case 5123:return A.oO(b,c,d)
case 5125:return A.oP(b,c,d)
default:return null}},
tM(a,b){var s,r,q
A.w(a,B.cH,b)
s=A.a0(a,"count",b,-1,null,-1,1,!0)
r=A.T(a,"indices",b,A.wI(),!0)
q=A.T(a,"values",b,A.wJ(),!0)
if(s===-1||r==null||q==null)return null
return new A.bZ(s,r,q,A.t(a,B.dP,b,null),A.x(a,b),!1)},
tK(a,b){A.w(a,B.cA,b)
return new A.c_(A.W(a,"bufferView",b,!0),A.a0(a,"byteOffset",b,0,null,-1,0,!1),A.a0(a,"componentType",b,-1,B.ce,-1,0,!0),A.t(a,B.dN,b,null),A.x(a,b),!1)},
tL(a,b){A.w(a,B.cD,b)
return new A.c0(A.W(a,"bufferView",b,!0),A.a0(a,"byteOffset",b,0,null,-1,0,!1),A.t(a,B.dO,b,null),A.x(a,b),!1)},
a4:function a4(){},
fC:function fC(a,b,c,d,e,f,g,h,i,j,k,l,m){var _=this
_.w=a
_.x=b
_.y=c
_.z=d
_.Q=e
_.as=f
_.at=g
_.ax=h
_.ay=i
_.ch=j
_.CW=null
_.cx=0
_.fr=_.dy=null
_.a=k
_.b=l
_.a$=m},
lR:function lR(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
lS:function lS(a){this.a=a},
lT:function lT(){},
lU:function lU(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
lP:function lP(a){this.a=a},
lQ:function lQ(a){this.a=a},
fB:function fB(a,b,c,d,e,f,g,h,i,j,k,l,m){var _=this
_.w=a
_.x=b
_.y=c
_.z=d
_.Q=e
_.as=f
_.at=g
_.ax=h
_.ay=i
_.ch=j
_.CW=null
_.cx=0
_.fr=_.dy=null
_.a=k
_.b=l
_.a$=m},
lL:function lL(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
lM:function lM(a){this.a=a},
lN:function lN(){},
lO:function lO(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
bZ:function bZ(a,b,c,d,e,f){var _=this
_.d=a
_.e=b
_.f=c
_.a=d
_.b=e
_.a$=f},
c_:function c_(a,b,c,d,e,f){var _=this
_.d=a
_.e=b
_.f=c
_.r=null
_.a=d
_.b=e
_.a$=f},
c0:function c0(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
eY:function eY(a){this.a=a},
f5:function f5(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
f3:function f3(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
f6:function f6(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
f4:function f4(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
tP(a0,a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d=null,c="channels",b="extras",a="samplers"
A.w(a0,B.cF,a1)
s=A.eB(a0,c,a1)
if(s!=null){r=s.gj(s)
q=A.U(r,d,!1,t.aA)
p=new A.F(q,r,c,t.eq)
r=a1.c
r.push(c)
for(o=t.h,n=0;n<s.gj(s);++n){m=s.i(0,n)
r.push(B.c.k(n))
A.w(m,B.di,a1)
l=A.W(m,"sampler",a1,!0)
k=A.T(m,"target",a1,A.wM(),!0)
j=A.t(m,B.dQ,a1,d)
i=m.i(0,b)
if(i!=null&&!o.b(i))a1.n($.dk(),b)
q[n]=new A.b2(l,k,j,i,!1)
r.pop()}r.pop()}else p=d
h=A.eB(a0,a,a1)
if(h!=null){r=h.gj(h)
q=A.U(r,d,!1,t.gW)
g=new A.F(q,r,a,t.az)
r=a1.c
r.push(a)
for(o=t.h,n=0;n<h.gj(h);++n){f=h.i(0,n)
r.push(B.c.k(n))
A.w(f,B.cW,a1)
l=A.W(f,"input",a1,!0)
k=A.J(f,"interpolation",a1,"LINEAR",B.cq,d,!1)
j=A.W(f,"output",a1,!0)
e=A.t(f,B.dR,a1,d)
i=f.i(0,b)
if(i!=null&&!o.b(i))a1.n($.dk(),b)
q[n]=new A.b3(l,k,j,e,i,!1)
r.pop()}r.pop()}else g=d
A.J(a0,"name",a1,d,d,d,!1)
return new A.bv(p,g,A.t(a0,B.T,a1,d),A.x(a0,a1),!1)},
tO(a,b){var s,r
A.w(a,B.d3,b)
s=A.t(a,B.aC,b,B.T)
r=new A.bw(A.W(a,"node",b,!1),A.J(a,"path",b,null,b.fy,null,!0),s,A.x(a,b),!1)
b.W(r,A.bc(s.gX(),!0,t._))
return r},
bv:function bv(a,b,c,d,e){var _=this
_.w=a
_.x=b
_.a=c
_.b=d
_.a$=e},
h5:function h5(a,b){this.a=a
this.b=b},
h6:function h6(a,b,c){this.a=a
this.b=b
this.c=c},
b2:function b2(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
bw:function bw(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
b3:function b3(a,b,c,d,e,f){var _=this
_.d=a
_.e=b
_.f=c
_.w=_.r=null
_.a=d
_.b=e
_.a$=f},
eE:function eE(a){this.a=0
this.b=a},
dK:function dK(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.e=_.d=0
_.$ti=d},
tQ(a,b){var s,r,q,p,o=null,n="minVersion"
A.w(a,B.cC,b)
A.J(a,"copyright",b,o,o,o,!1)
s=A.J(a,"generator",b,o,o,o,!1)
r=$.br()
q=A.J(a,"version",b,o,o,r,!0)
r=A.J(a,n,b,o,o,r,!1)
p=new A.bx(s,q,r,A.t(a,B.dS,b,o),A.x(a,b),!1)
if(r!=null&&q!=null){if(p.gcS()<=p.gbj())s=p.gcS()===p.gbj()&&p.ged()>p.gbW()
else s=!0
if(s)b.l($.rV(),A.a([r,q],t.M),n)}return p},
bx:function bx(a,b,c,d,e,f){var _=this
_.e=a
_.f=b
_.r=c
_.a=d
_.b=e
_.a$=f},
tU(a,b){var s,r,q,p,o,n,m,l,k=null,j="uri"
A.w(a,B.dk,b)
p=A.a0(a,"byteLength",b,-1,k,-1,1,!0)
s=null
o=a.v(j)
if(o){r=A.J(a,j,b,k,k,k,!1)
if(r!=null){if(b.dx)b.n($.o2(),j)
q=null
try{q=A.p5(r)}catch(n){if(A.M(n) instanceof A.aK)s=A.pS(r,b)
else throw n}if(q!=null){if(b.dx)b.n($.o1(),j)
switch(q.gbV().toLowerCase()){case"application/gltf-buffer":case"application/octet-stream":m=q.cD()
break
default:b.l($.ry(),A.a([q.gbV()],t.M),j)
m=k
break}}else m=k}else m=k
o=!0}else m=k
l=s
A.J(a,"name",b,k,k,k,!1)
return new A.aT(l,p,o,m,A.t(a,B.dT,b,k),A.x(a,b),!1)},
aT:function aT(a,b,c,d,e,f,g){var _=this
_.w=a
_.x=b
_.y=c
_.z=d
_.a=e
_.b=f
_.a$=g},
tT(a,b){var s,r,q,p,o,n=null,m="byteStride"
A.w(a,B.cp,b)
s=A.a0(a,"byteLength",b,-1,n,-1,1,!0)
r=A.a0(a,m,b,-1,n,252,4,!1)
q=A.a0(a,"target",b,-1,B.cb,-1,0,!1)
if(r!==-1){if(s!==-1&&r>s)b.l($.rz(),A.a([r,s],t.M),m)
if(r%4!==0)b.l($.rr(),A.a([r,4],t.M),m)
if(q===34963)b.n($.nj(),m)}p=A.W(a,"buffer",b,!0)
o=A.a0(a,"byteOffset",b,0,n,-1,0,!1)
A.J(a,"name",b,n,n,n,!1)
return new A.by(p,o,s,r,q,A.t(a,B.aD,b,n),A.x(a,b),!1)},
by:function by(a,b,c,d,e,f,g,h){var _=this
_.w=a
_.x=b
_.y=c
_.z=d
_.Q=e
_.at=_.as=null
_.ax=-1
_.a=f
_.b=g
_.a$=h},
tX(a,b){var s=null,r="orthographic",q="perspective"
A.w(a,B.dj,b)
if(a.v(r)&&a.v(q))b.F($.oe(),B.aw)
switch(A.J(a,"type",b,s,B.aw,s,!0)){case"orthographic":A.T(a,r,b,A.wV(),!0)
break
case"perspective":A.T(a,q,b,A.wW(),!0)
break}A.J(a,"name",b,s,s,s,!1)
return new A.bz(A.t(a,B.dW,b,s),A.x(a,b),!1)},
tV(a,b){var s,r,q,p,o="xmag",n="ymag"
A.w(a,B.dq,b)
s=A.E(a,o,b,0/0,1/0,-1/0,1/0,-1/0,!0,0/0)
r=A.E(a,n,b,0/0,1/0,-1/0,1/0,-1/0,!0,0/0)
q=A.E(a,"zfar",b,0/0,1/0,0,1/0,-1/0,!0,0/0)
p=A.E(a,"znear",b,0/0,1/0,-1/0,1/0,0,!0,0/0)
if(q<=p)b.L($.oh())
if(s===0)b.n($.og(),o)
else if(s<0)b.n($.of(),o)
if(r===0)b.n($.og(),n)
else if(r<0)b.n($.of(),n)
return new A.c3(A.t(a,B.dU,b,null),A.x(a,b),!1)},
tW(a,b){var s,r,q
A.w(a,B.cB,b)
s=A.E(a,"yfov",b,0/0,1/0,0,1/0,-1/0,!0,0/0)
if(s>=3.141592653589793)b.L($.rA())
r=A.E(a,"zfar",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
q=A.E(a,"znear",b,0/0,1/0,0,1/0,-1/0,!0,0/0)
if(r<=q)b.L($.oh())
A.E(a,"aspectRatio",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
return new A.c4(A.t(a,B.dV,b,null),A.x(a,b),!1)},
bz:function bz(a,b,c){this.a=a
this.b=b
this.a$=c},
c3:function c3(a,b,c){this.a=a
this.b=b
this.a$=c},
c4:function c4(a,b,c){this.a=a
this.b=b
this.a$=c},
oC(c0,c1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6="extensionsRequired",b7="extensionsUsed",b8=null,b9=new A.iw(c1)
b9.$0()
A.w(c0,B.dr,c1)
if(c0.v(b6)&&!c0.v(b7))c1.l($.cO(),A.a(["extensionsUsed"],t.M),b6)
s=A.pQ(c0,b7,c1)
if(s==null)s=A.a([],t.i)
r=A.pQ(c0,b6,c1)
if(r==null)r=A.a([],t.i)
c1.e9(s,r)
q=new A.ix(c0,b9,c1)
p=new A.iy(b9,c0,c1).$1$3$req("asset",A.wO(),!0,t.gP)
if((p==null?b8:p.f)==null)return b8
else if(p.gbj()!==2){o=$.t8()
n=p.gbj()
c1.l(o,A.a([n],t.M),"version")
return b8}else if(p.gbW()>0){o=$.t9()
n=p.gbW()
c1.l(o,A.a([n],t.M),"version")}m=q.$1$2("accessors",A.wL(),t.W)
l=q.$1$2("animations",A.wN(),t.bj)
k=q.$1$2("buffers",A.wT(),t.cT)
j=q.$1$2("bufferViews",A.wU(),t.r)
i=q.$1$2("cameras",A.wX(),t.h2)
h=q.$1$2("images",A.xc(),t.ec)
g=q.$1$2("materials",A.xF(),t.fC)
f=q.$1$2("meshes",A.xI(),t.eM)
o=t.L
e=q.$1$2("nodes",A.xJ(),o)
d=q.$1$2("samplers",A.xK(),t.c2)
c=q.$1$2("scenes",A.xL(),t.bn)
b9.$0()
b=A.W(c0,"scene",c1,!1)
a=c.i(0,b)
if(b!==-1&&a==null)c1.l($.Q(),A.a([b],t.M),"scene")
a0=q.$1$2("skins",A.xM(),t.aV)
a1=q.$1$2("textures",A.xO(),t.ai)
b9.$0()
a2=A.t(c0,B.U,c1,b8)
b9.$0()
a3=new A.du(s,r,m,l,p,k,j,i,h,g,f,e,d,a,a0,a1,a2,A.x(c0,c1),!1)
a4=new A.iu(c1,a3)
a4.$2(j,B.aD)
a4.$2(m,B.S)
a4.$2(h,B.aE)
a4.$2(a1,B.W)
a4.$2(g,B.f)
a4.$2(f,B.aG)
a4.$2(e,B.V)
a4.$2(a0,B.aK)
a4.$2(l,B.T)
a4.$2(c,B.aJ)
if(a2.a!==0){n=c1.c
n.push("extensions")
a2.M(0,new A.is(c1,a3))
n.pop()}n=c1.c
n.push("nodes")
e.a4(new A.it(c1,A.aD(o)))
n.pop()
a5=[m,k,j,i,h,g,f,e,d,a0,a1]
for(a6=0;a6<11;++a6){a7=a5[a6]
if(a7.gj(a7)===0)continue
n.push(a7.c)
for(o=a7.b,a8=a7.a,a9=a8.length,b0=0;b0<o;++b0){b1=b0>=a9
b1=b1?b8:a8[b0]
if((b1==null?b8:b1.a$)===!1)c1.Z($.h1(),b0)}n.pop()}o=c1.x
if(o.a!==0){for(a8=A.uH(o,o.r,A.A(o).c);a8.q();){a9=a8.d
if(a9.gj(a9)===0)continue
b2=o.i(0,a9)
B.d.P(n)
B.d.D(n,b2)
for(b1=a9.b,a9=a9.a,b3=a9.length,b0=0;b0<b1;++b0){b4=b0>=b3
b4=b4?b8:a9[b0]
if((b4==null?b8:b4.a$)===!1)c1.Z($.h1(),b0)}}B.d.P(n)}n.push("meshes")
for(o=f.b,a8=f.a,a9=a8.length,b0=0;b0<o;++b0){b1=b0>=a9
b5=b1?b8:a8[b0]
if((b5==null?b8:b5.x)!=null&&b5.a$&&!b5.y){n.push(B.c.k(b0))
c1.n($.ro(),"weights")
n.pop()}}B.d.P(n)
return a3},
du:function du(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s){var _=this
_.d=a
_.e=b
_.f=c
_.r=d
_.w=e
_.x=f
_.y=g
_.z=h
_.Q=i
_.as=j
_.at=k
_.ax=l
_.ay=m
_.ch=n
_.cx=o
_.cy=p
_.a=q
_.b=r
_.a$=s},
iw:function iw(a){this.a=a},
ix:function ix(a,b,c){this.a=a
this.b=b
this.c=c},
iy:function iy(a,b,c){this.a=a
this.b=b
this.c=c},
iu:function iu(a,b){this.a=a
this.b=b},
iv:function iv(a,b){this.a=a
this.b=b},
is:function is(a,b){this.a=a
this.b=b},
it:function it(a,b){this.a=a
this.b=b},
iq:function iq(){},
ir:function ir(){},
iz:function iz(a,b){this.a=a
this.b=b},
iA:function iA(a,b){this.a=a
this.b=b},
m:function m(){},
k:function k(){},
eR:function eR(){},
fL:function fL(){},
ug(a,b){var s,r,q,p,o,n,m,l,k,j="bufferView",i=null,h="uri"
A.w(a,B.cE,b)
p=A.W(a,j,b,!1)
o=A.J(a,"mimeType",b,i,b.dy,i,!1)
s=A.J(a,h,b,i,i,i,!1)
n=p===-1
m=!n
if(m&&o==null)b.l($.cO(),A.a(["mimeType"],t.M),j)
if(!(m&&s!=null))n=n&&s==null
else n=!0
if(n)b.F($.oe(),A.a(["bufferView","uri"],t.M))
r=null
if(s!=null){if(b.dx)b.n($.o2(),h)
q=null
try{q=A.p5(s)}catch(l){if(A.M(l) instanceof A.aK)r=A.pS(s,b)
else throw l}if(q!=null){if(b.dx)b.n($.o1(),h)
k=q.cD()
n=A.oD(k)
n=n==null?i:B.ci[n.a]
n=n!==q.gbV().toLowerCase()
if(n){b.l($.od(),A.a([s,"The declared mediatype does not match the embedded content."],t.M),h)
k=i}}else k=i}else k=i
n=r
A.J(a,"name",b,i,i,i,!1)
return new A.aU(p,o,n,k,A.t(a,B.aE,b,i),A.x(a,b),!1)},
aU:function aU(a,b,c,d,e,f,g){var _=this
_.w=a
_.x=b
_.y=c
_.z=d
_.as=_.Q=null
_.a=e
_.b=f
_.a$=g},
uL(a,b){var s,r,q,p,o,n,m,l,k,j,i=null,h="alphaCutoff"
A.w(a,B.cs,b)
s=A.T(a,"pbrMetallicRoughness",b,A.xH(),!1)
r=A.T(a,"normalTexture",b,A.pV(),!1)
q=A.T(a,"occlusionTexture",b,A.xG(),!1)
p=A.T(a,"emissiveTexture",b,A.ao(),!1)
o=A.ae(a,"emissiveFactor",b,B.ak,B.l,1,0,!1)
n=A.J(a,"alphaMode",b,"OPAQUE",B.cr,i,!1)
A.E(a,h,b,0.5,1/0,-1/0,1/0,0,!1,0/0)
if(n!=="MASK"&&a.v(h))b.n($.rO(),h)
m=A.pO(a,"doubleSided",b)
l=A.t(a,B.f,b,i)
A.J(a,"name",b,i,i,i,!1)
k=new A.ai(s,r,q,p,o,m,A.a9(t.X,t.e),l,A.x(a,b),!1)
j=A.a([s,r,q,p],t.M)
B.d.D(j,l.gX())
b.W(k,j)
return k},
uX(a,b){var s,r,q,p,o
A.w(a,B.cG,b)
A.ae(a,"baseColorFactor",b,B.al,B.P,1,0,!1)
s=A.T(a,"baseColorTexture",b,A.ao(),!1)
A.E(a,"metallicFactor",b,1,1/0,-1/0,1,0,!1,0/0)
A.E(a,"roughnessFactor",b,1,1/0,-1/0,1,0,!1,0/0)
r=A.T(a,"metallicRoughnessTexture",b,A.ao(),!1)
q=A.t(a,B.ej,b,null)
p=new A.cB(s,r,q,A.x(a,b),!1)
o=A.a([s,r],t.M)
B.d.D(o,q.gX())
b.W(p,o)
return p},
uW(a,b){var s,r,q,p
A.w(a,B.cU,b)
s=A.t(a,B.aI,b,B.f)
r=A.W(a,"index",b,!0)
q=A.a0(a,"texCoord",b,0,null,-1,0,!1)
A.E(a,"strength",b,1,1/0,-1/0,1,0,!1,0/0)
p=new A.cA(r,q,s,A.x(a,b),!1)
b.W(p,s.gX())
return p},
uV(a,b){var s,r,q,p
A.w(a,B.cT,b)
s=A.t(a,B.aH,b,B.f)
r=A.W(a,"index",b,!0)
q=A.a0(a,"texCoord",b,0,null,-1,0,!1)
A.E(a,"scale",b,1,1/0,-1/0,1/0,-1/0,!1,0/0)
p=new A.cz(r,q,s,A.x(a,b),!1)
b.W(p,s.gX())
return p},
vb(a,b){var s,r
A.w(a,B.cS,b)
s=A.t(a,B.aL,b,B.f)
r=new A.bj(A.W(a,"index",b,!0),A.a0(a,"texCoord",b,0,null,-1,0,!1),s,A.x(a,b),!1)
b.W(r,s.gX())
return r},
ai:function ai(a,b,c,d,e,f,g,h,i,j){var _=this
_.w=a
_.x=b
_.y=c
_.z=d
_.Q=e
_.ax=f
_.ay=!1
_.ch=g
_.a=h
_.b=i
_.a$=j},
jR:function jR(a,b){this.a=a
this.b=b},
cB:function cB(a,b,c,d,e){var _=this
_.e=a
_.w=b
_.a=c
_.b=d
_.a$=e},
cA:function cA(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
cz:function cz(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
bj:function bj(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
dl(a){return new A.y(a.Q,a.y,a.as)},
c2:function c2(a){this.a=a},
c1:function c1(a){this.a=a},
y:function y(a,b,c){this.a=a
this.b=b
this.c=c},
uP(a,b){var s,r,q,p,o,n,m,l,k,j,i=null,h="primitives"
A.w(a,B.da,b)
s=A.ae(a,"weights",b,i,i,1/0,-1/0,!1)
r=A.eB(a,h,b)
if(r!=null){q=r.gj(r)
p=A.U(q,i,!1,t.ft)
o=new A.F(p,q,h,t.b_)
q=b.c
q.push(h)
for(n=0,m=0;m<r.gj(r);++m){q.push(B.c.k(m))
l=A.uO(r.i(0,m),b)
k=l.w
j=k==null?i:k.length
if(j==null)j=0
if(m===0)n=j
else if(n!==j){k=$.rU()
b.n(k,j>0?"targets":i)}p[m]=l
q.pop()}q.pop()
if(s!=null&&n!==s.length)b.l($.rP(),A.a([s.length,n],t.M),"weights")}else o=i
A.J(a,"name",b,i,i,i,!1)
return new A.aV(o,s,A.t(a,B.aG,b,i),A.x(a,b),!1)},
uN(a,b,c,d,e,f,g,h,i,j,k,l,m,n){var s,r=J.oF(l,t.e)
for(s=0;s<l;++s)r[s]=s
return new A.aE(a,b,c,d,e,g,h,j,k,l,A.a9(t.X,t.W),r,m,n,!1)},
uO(a,b){var s,r,q,p,o,n,m,l,k="attributes",j={}
A.w(a,B.cY,b)
j.a=j.b=j.c=!1
j.d=0
j.e=-1
j.f=0
j.r=-1
j.w=0
j.x=-1
j.y=0
j.z=-1
s=new A.jV()
r=A.a0(a,"mode",b,4,null,6,0,!1)
q=A.x5(a,k,b,new A.jS(j,b,s))
if(q!=null){p=b.c
p.push(k)
if(!j.c)b.L($.rS())
if(!j.b&&j.a)b.n($.rT(),"TANGENT")
o=new A.jT(b)
j.d=o.$3(j.e,j.d,"COLOR")
j.f=o.$3(j.r,j.f,"JOINTS")
j.w=o.$3(j.x,j.w,"WEIGHTS")
j.y=o.$3(j.z,j.y,"TEXCOORD")
o=j.f
n=j.w
if(o!==n){b.F($.rR(),A.a([o,n],t.M))
j.w=j.f=0}p.pop()}m=A.x6(a,"targets",b,new A.jU(s,b))
l=A.uN(q,A.W(a,"indices",b,!1),A.W(a,"material",b,!1),r,m,j.c,j.b,j.a,j.d,j.f,j.w,j.y,A.t(a,B.aF,b,null),A.x(a,b))
b.W(l,l.a.gX())
return l},
aV:function aV(a,b,c,d,e){var _=this
_.w=a
_.x=b
_.y=!1
_.a=c
_.b=d
_.a$=e},
k1:function k1(a,b){this.a=a
this.b=b},
k0:function k0(a,b){this.a=a
this.b=b},
aE:function aE(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o){var _=this
_.d=a
_.e=b
_.f=c
_.r=d
_.w=e
_.y=f
_.z=g
_.as=h
_.at=i
_.ax=j
_.ay=k
_.CW=_.ch=-1
_.db=_.cy=_.cx=null
_.dx=l
_.a=m
_.b=n
_.a$=o},
jV:function jV(){},
jS:function jS(a,b,c){this.a=a
this.b=b
this.c=c},
jT:function jT(a){this.a=a},
jU:function jU(a,b){this.a=a
this.b=b},
jX:function jX(a,b,c){this.a=a
this.b=b
this.c=c},
jY:function jY(a,b){this.a=a
this.b=b},
jZ:function jZ(){},
k_:function k_(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
jW:function jW(){},
eU:function eU(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.w=d
_.Q=_.z=0
_.as=e
_.at=f},
uU(b4,b5){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0=null,b1="matrix",b2="translation",b3="rotation"
A.w(b4,B.cj,b5)
if(b4.v(b1)){s=A.ae(b4,b1,b5,b0,B.c6,1/0,-1/0,!1)
if(s!=null){r=new Float32Array(16)
q=new A.cZ(r)
p=s[0]
o=s[1]
n=s[2]
m=s[3]
l=s[4]
k=s[5]
j=s[6]
i=s[7]
h=s[8]
g=s[9]
f=s[10]
e=s[11]
d=s[12]
c=s[13]
b=s[14]
r[15]=s[15]
r[14]=b
r[13]=c
r[12]=d
r[11]=e
r[10]=f
r[9]=g
r[8]=h
r[7]=i
r[6]=j
r[5]=k
r[4]=l
r[3]=m
r[2]=n
r[1]=o
r[0]=p}else q=b0}else q=b0
if(b4.v(b2)){a=A.ae(b4,b2,b5,b0,B.l,1/0,-1/0,!1)
a0=a!=null?A.pb(a):b0}else a0=b0
if(b4.v(b3)){a1=A.ae(b4,b3,b5,b0,B.P,1,-1,!1)
if(a1!=null){r=a1[0]
p=a1[1]
o=a1[2]
n=a1[3]
m=new Float32Array(4)
a2=new A.fl(m)
m[0]=r
m[1]=p
m[2]=o
m[3]=n
r=Math.sqrt(a2.gaW())
if(Math.abs(1-r)>0.00769)b5.n($.t5(),b3)}else a2=b0}else a2=b0
if(b4.v("scale")){a3=A.ae(b4,"scale",b5,b0,B.l,1/0,-1/0,!1)
a4=a3!=null?A.pb(a3):b0}else a4=b0
a5=A.W(b4,"camera",b5,!1)
a6=A.mR(b4,"children",b5,!1)
a7=A.W(b4,"mesh",b5,!1)
a8=A.W(b4,"skin",b5,!1)
a9=A.ae(b4,"weights",b5,b0,b0,1/0,-1/0,!1)
if(a7===-1){if(a8!==-1)b5.l($.cO(),A.a(["mesh"],t.M),"skin")
if(a9!=null)b5.l($.cO(),A.a(["mesh"],t.M),"weights")}if(q!=null){if(a0!=null||a2!=null||a4!=null)b5.n($.rZ(),b1)
if(q.cP())b5.n($.rX(),b1)
else if(!A.xi(q))b5.n($.t_(),b1)}A.J(b4,"name",b5,b0,b0,b0,!1)
return new A.ap(a5,a6,a8,q,a7,a0,a2,a4,a9,A.aD(t.bn),A.t(b4,B.V,b5,b0),A.x(b4,b5),!1)},
ap:function ap(a,b,c,d,e,f,g,h,i,j,k,l,m){var _=this
_.w=a
_.x=b
_.y=c
_.z=d
_.Q=e
_.as=f
_.at=g
_.ax=h
_.ay=i
_.ch=j
_.dx=_.db=_.cy=_.cx=_.CW=null
_.dy=!1
_.a=k
_.b=l
_.a$=m},
k3:function k3(){},
k4:function k4(){},
k5:function k5(a,b){this.a=a
this.b=b},
v6(a,b){var s=null
A.w(a,B.dc,b)
A.a0(a,"magFilter",b,-1,B.cg,-1,0,!1)
A.a0(a,"minFilter",b,-1,B.ck,-1,0,!1)
A.a0(a,"wrapS",b,10497,B.ao,-1,0,!1)
A.a0(a,"wrapT",b,10497,B.ao,-1,0,!1)
A.J(a,"name",b,s,s,s,!1)
return new A.bF(A.t(a,B.ek,b,s),A.x(a,b),!1)},
bF:function bF(a,b,c){this.a=a
this.b=b
this.a$=c},
v7(a,b){var s,r=null
A.w(a,B.d4,b)
s=A.mR(a,"nodes",b,!1)
A.J(a,"name",b,r,r,r,!1)
return new A.bG(s,A.t(a,B.aJ,b,r),A.x(a,b),!1)},
bG:function bG(a,b,c,d){var _=this
_.w=a
_.x=null
_.a=b
_.b=c
_.a$=d},
ke:function ke(a,b){this.a=a
this.b=b},
v8(a,b){var s,r,q,p=null
A.w(a,B.cw,b)
s=A.W(a,"inverseBindMatrices",b,!1)
r=A.W(a,"skeleton",b,!1)
q=A.mR(a,"joints",b,!0)
A.J(a,"name",b,p,p,p,!1)
return new A.bI(s,r,q,A.aD(t.L),A.t(a,B.aK,b,p),A.x(a,b),!1)},
bI:function bI(a,b,c,d,e,f,g){var _=this
_.w=a
_.x=b
_.y=c
_.as=_.Q=_.z=null
_.at=d
_.a=e
_.b=f
_.a$=g},
lm:function lm(a){this.a=a},
eT:function eT(a){this.a=a},
vc(a,b){var s,r,q=null
A.w(a,B.de,b)
s=A.W(a,"sampler",b,!1)
r=A.W(a,"source",b,!1)
A.J(a,"name",b,q,q,q,!1)
return new A.bK(s,r,A.t(a,B.W,b,q),A.x(a,b),!1)},
bK:function bK(a,b,c,d,e){var _=this
_.w=a
_.x=b
_.z=_.y=null
_.a=c
_.b=d
_.a$=e},
p9(a,b,c,d){var s,r=t.X,q=A.aD(r)
r=A.aD(r)
s=b==null?0:b
if(a!=null)q.D(0,a)
if(c!=null)r.D(0,c)
return new A.lE(s,q,r,d)},
u4(){return new A.ab(B.au,new A.hh(),t.gw)},
u3(a){var s,r,q,p,o=null,n=t.i,m=A.a([],n),l=t._,k=A.a([],t.d6),j=A.a9(t.al,t.f9),i=A.a([],n),h=A.a([],n),g=A.a([],t.fh),f=A.a([],t.a9)
n=A.a(["image/jpeg","image/png"],n)
s=t.aD
r=t.X
q=t.cn
p=A.nu(["POSITION",A.aP([B.k],s),"NORMAL",A.aP([B.k],s),"TANGENT",A.aP([B.n],s),"TEXCOORD",A.aP([B.a4,B.a0,B.a3],s),"COLOR",A.aP([B.k,B.H,B.I,B.n,B.y,B.z],s),"JOINTS",A.aP([B.b_,B.b0],s),"WEIGHTS",A.aP([B.n,B.y,B.z],s)],r,q)
q=A.nu(["POSITION",A.aP([B.k],s),"NORMAL",A.aP([B.k],s),"TANGENT",A.aP([B.k],s),"TEXCOORD",A.aP([B.a4,B.a_,B.a0,B.a2,B.a3],s),"COLOR",A.aP([B.k,B.w,B.H,B.x,B.I,B.n,B.J,B.y,B.K,B.z],s)],r,q)
r=A.bc(B.R,!0,r)
s=a==null?A.p9(o,o,o,o):a
r=new A.i(s,m,A.a9(t.W,t.b7),A.a9(l,l),A.a9(t.f7,t.an),k,A.a9(t.r,t.gz),A.a9(t.b5,t.eG),j,i,h,g,A.aD(t.af),f,new A.ac(""),n,p,q,r)
q=t.em
r.ay=new A.aX(h,q)
r.at=new A.aX(i,q)
r.Q=new A.bm(j,t.f8)
r.CW=new A.aX(g,t.go)
return r},
lE:function lE(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
i:function i(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s){var _=this
_.b=a
_.c=b
_.d=c
_.e=d
_.f=e
_.r=f
_.w=g
_.x=h
_.y=!1
_.z=i
_.Q=null
_.as=j
_.at=null
_.ax=k
_.ay=null
_.ch=l
_.CW=null
_.cx=m
_.cy=n
_.db=o
_.dx=!1
_.dy=p
_.fr=q
_.fx=r
_.fy=s},
hh:function hh(){},
hg:function hg(){},
hi:function hi(){},
hl:function hl(a){this.a=a},
hm:function hm(a){this.a=a},
hj:function hj(a){this.a=a},
hk:function hk(){},
hn:function hn(a,b){this.a=a
this.b=b},
bA:function bA(){},
uf(a){var s,r,q={}
q.a=q.b=null
s=new A.C($.B,t.dD)
r=new A.ay(s,t.eP)
q.c=!1
q.a=a.bT(new A.iC(q,r),new A.iD(q),new A.iE(q,r))
return s},
oD(a){var s,r
if(a.length<14)return null
s=A.f7(a.buffer,a.byteOffset,14)
r=s.getUint32(0,!0)
if((r&16777215)===16767231)return B.ag
if(r===1196314761&&s.getUint32(4,!0)===169478669)return B.ah
if(r===1179011410&&s.getUint32(8,!0)===1346520407&&s.getUint16(12,!0)===20566)return B.ai
if(r===1481919403&&s.getUint32(4,!0)===3140497952&&s.getUint32(8,!0)===169478669)return B.bV
return null},
cU:function cU(a,b){this.a=a
this.b=b},
dV:function dV(a,b){this.a=a
this.b=b},
d5:function d5(a,b){this.a=a
this.b=b},
cc:function cc(a,b){this.a=a
this.b=b},
cd:function cd(a,b,c,d,e,f,g,h,i){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.w=h
_.x=i},
iC:function iC(a,b){this.a=a
this.b=b},
iE:function iE(a,b){this.a=a
this.b=b},
iD:function iD(a){this.a=a},
iB:function iB(){},
iM:function iM(a,b){var _=this
_.f=_.e=_.d=_.c=0
_.r=null
_.a=a
_.b=b},
iO:function iO(){},
iN:function iN(){},
k7:function k7(a,b,c,d,e,f){var _=this
_.x=_.w=_.r=_.f=_.e=_.d=_.c=0
_.z=_.y=!1
_.Q=a
_.as=b
_.at=!1
_.ax=c
_.ay=d
_.a=e
_.b=f},
k8:function k8(a){this.a=a},
lJ:function lJ(a,b,c){var _=this
_.c=a
_.d=0
_.a=b
_.b=c},
dS:function dS(){},
dR:function dR(){},
aL:function aL(a){this.a=a},
d9:function d9(a,b){this.a=a
this.b=b},
fn:function fn(a){var _=this
_.a=a
_.f=_.e=_.d=_.c=_.b=null},
kb:function kb(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
kc:function kc(a,b,c){this.a=a
this.b=b
this.c=c},
kd:function kd(a,b){this.a=a
this.b=b},
mJ(a){if(a==null)return null
if(a.Q==null||a.y===-1||a.z===-1)return null
if(a.CW==null&&a.ay==null)return null
return a},
xS(a0,a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a
a0.f.a4(new A.ne(a1))
A.wx(a1)
s=A.a([],t.b2)
r=A.a([],t.bd)
q=a1.c
B.d.P(q)
q.push("meshes")
for(p=a0.at,o=p.b,n=a0.ax,m=n.$ti.h("aa<p.E>"),l=a0.cx,p=p.a,k=p.length,j=0;j<o;++j){i={}
h=j>=k
g=h?null:p[j]
if((g==null?null:g.w)==null)continue
h=g.w
if(h.be(h,new A.nf()))continue
i.a=i.b=-1
for(f=new A.aa(n,n.gj(n),m);f.q();){e=f.d
if(e.cy==g){d=e.dx
d=(d==null?null:d.Q)!=null}else d=!1
if(d){e=e.dx
c=e.Q.length
d=i.b
if(d===-1||c<d){i.b=c
i.a=l.bR(l,e)}}}if(i.b<1)continue
q.push(B.c.k(j))
q.push("primitives")
h.a4(new A.ng(i,a1,s,r))
q.pop()
q.pop()}q.pop()
if(s.length===0)return
for(;A.wD(s);)for(q=r.length,b=0;b<r.length;r.length===q||(0,A.cN)(r),++b){a=r[b]
if(!a.w)a.dY(a1)}},
wD(a){var s,r
for(s=a.length,r=0;r<a.length;a.length===s||(0,A.cN)(a),++r)a[r].q()
if(!!a.fixed$length)A.Z(A.ad("removeWhere"))
B.d.dP(a,new A.mL(),!0)
return a.length!==0},
wx(a){var s,r,q,p,o,n,m,l,k,j,i,h
for(s=a.d.ge4(),s=s.gH(s),r=a.c;s.q();){q=s.gt()
p=A.mJ(q.a)
if(p==null)continue
o=B.m.i(0,p.Q)
if(o==null)o=0
n=q.b
B.d.P(r)
for(q=p.af(),q=new A.aH(q.a(),A.A(q).h("aH<1>")),m=J.V(n),l=0,k=0,j=!1;q.q();j=!0){i=q.gt()
for(h=0;h<m.gj(n);++h)m.i(n,h).a0(a,l,k,i);++k
if(k===o)k=0;++l}if(j)for(h=0;h<m.gj(n);++h)m.i(n,h).aF(a)}},
ne:function ne(a){this.a=a},
nf:function nf(){},
ng:function ng(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
mL:function mL(){},
eX:function eX(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.r=_.f=0
_.w=!1
_.y=_.x=0
_.z=f},
G(a,b,c){return new A.ho(c,a,b)},
am(a,b,c){return new A.kf(c,a,b)},
r(a,b,c){return new A.kw(c,a,b)},
v(a,b,c){return new A.iY(c,a,b)},
al(a,b,c){return new A.hZ(c,a,b)},
wy(a){return"'"+A.b(a)+"'"},
wu(a){return typeof a=="string"?"'"+a+"'":J.as(a)},
bH:function bH(a,b){this.a=a
this.b=b},
iH:function iH(){},
ho:function ho(a,b,c){this.a=a
this.b=b
this.c=c},
hL:function hL(){},
hM:function hM(){},
hE:function hE(){},
hD:function hD(){},
ht:function ht(){},
hs:function hs(){},
hI:function hI(){},
hz:function hz(){},
hr:function hr(){},
hF:function hF(){},
hx:function hx(){},
hu:function hu(){},
hw:function hw(){},
hv:function hv(){},
hp:function hp(){},
hq:function hq(){},
hH:function hH(){},
hG:function hG(){},
hy:function hy(){},
hO:function hO(){},
hQ:function hQ(){},
hT:function hT(){},
hU:function hU(){},
hR:function hR(){},
hS:function hS(){},
hP:function hP(){},
hV:function hV(){},
hN:function hN(){},
hB:function hB(){},
hA:function hA(){},
hJ:function hJ(){},
hK:function hK(){},
hC:function hC(){},
iF:function iF(a,b,c){this.a=a
this.b=b
this.c=c},
iG:function iG(){},
kf:function kf(a,b,c){this.a=a
this.b=b
this.c=c},
kh:function kh(){},
ki:function ki(){},
kg:function kg(){},
kk:function kk(){},
kl:function kl(){},
km:function km(){},
kj:function kj(){},
kn:function kn(){},
ko:function ko(){},
kp:function kp(){},
ku:function ku(){},
kv:function kv(){},
kt:function kt(){},
kq:function kq(){},
kr:function kr(){},
ks:function ks(){},
kw:function kw(a,b,c){this.a=a
this.b=b
this.c=c},
lj:function lj(){},
lk:function lk(){},
l4:function l4(){},
kL:function kL(){},
ky:function ky(){},
kz:function kz(){},
kx:function kx(){},
kA:function kA(){},
kB:function kB(){},
kC:function kC(){},
kE:function kE(){},
kD:function kD(){},
kF:function kF(){},
kG:function kG(){},
kH:function kH(){},
kI:function kI(){},
kX:function kX(){},
l_:function l_(){},
l3:function l3(){},
l1:function l1(){},
kZ:function kZ(){},
l2:function l2(){},
l0:function l0(){},
kY:function kY(){},
l8:function l8(){},
l6:function l6(){},
l9:function l9(){},
lg:function lg(){},
ll:function ll(){},
lf:function lf(){},
kK:function kK(){},
l7:function l7(){},
lc:function lc(){},
lb:function lb(){},
la:function la(){},
lh:function lh(){},
li:function li(){},
le:function le(){},
l5:function l5(){},
ld:function ld(){},
kJ:function kJ(){},
kM:function kM(){},
kN:function kN(){},
kO:function kO(){},
kP:function kP(){},
kQ:function kQ(){},
kR:function kR(){},
kS:function kS(){},
kW:function kW(){},
kV:function kV(){},
kT:function kT(){},
kU:function kU(){},
iY:function iY(a,b,c){this.a=a
this.b=b
this.c=c},
j0:function j0(){},
iZ:function iZ(){},
j_:function j_(){},
j1:function j1(){},
j4:function j4(){},
j2:function j2(){},
j3:function j3(){},
j8:function j8(){},
j6:function j6(){},
ja:function ja(){},
j7:function j7(){},
j9:function j9(){},
j5:function j5(){},
jb:function jb(){},
je:function je(){},
jd:function jd(){},
jc:function jc(){},
jf:function jf(){},
jg:function jg(){},
jh:function jh(){},
jl:function jl(){},
jm:function jm(){},
ju:function ju(){},
jk:function jk(){},
jj:function jj(){},
jq:function jq(){},
jp:function jp(){},
jo:function jo(){},
jv:function jv(){},
jt:function jt(){},
jn:function jn(){},
jw:function jw(){},
js:function js(){},
jr:function jr(){},
jx:function jx(){},
jy:function jy(){},
jB:function jB(){},
jz:function jz(){},
jA:function jA(){},
jC:function jC(){},
jE:function jE(){},
jD:function jD(){},
jF:function jF(){},
jG:function jG(){},
jH:function jH(){},
jI:function jI(){},
jJ:function jJ(){},
jM:function jM(){},
jL:function jL(){},
jK:function jK(){},
ji:function ji(){},
hZ:function hZ(a,b,c){this.a=a
this.b=b
this.c=c},
i5:function i5(){},
i6:function i6(){},
i8:function i8(){},
i_:function i_(){},
i7:function i7(){},
i0:function i0(){},
i3:function i3(){},
i2:function i2(){},
i1:function i1(){},
ib:function ib(){},
ia:function ia(){},
ic:function ic(){},
id:function id(){},
i9:function i9(){},
ie:function ie(){},
i4:function i4(){},
cW:function cW(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
we(a){a.dy.push("image/webp")},
ua(a,b){b.toString
A.w(a,B.df,b)
return new A.ca(A.W(a,"source",b,!1),A.t(a,B.dY,b,null),A.x(a,b),!1)},
ca:function ca(a,b,c,d){var _=this
_.d=a
_.e=null
_.a=b
_.b=c
_.a$=d},
un(a,b){b.toString
A.w(a,B.d9,b)
A.J(a,"pointer",b,null,null,$.qK(),!0)
return new A.cf(A.t(a,B.dZ,b,null),A.x(a,b),!1)},
wf(a){a.fy.push("pointer")},
cf:function cf(a,b,c){this.a=a
this.b=b
this.a$=c},
uo(a,b){var s,r,q,p,o,n,m,l,k,j,i,h=null,g="lights",f="spot"
b.toString
A.w(a,B.d0,b)
s=A.eB(a,g,b)
r=t.cp
if(s!=null){q=s.gj(s)
r=A.U(q,h,!1,r)
p=new A.F(r,q,g,t.E)
q=b.c
q.push(g)
for(o=t.h,n=0;n<s.gj(s);++n){m=s.i(0,n)
q.push(B.c.k(n))
A.w(m,B.co,b)
A.ae(m,"color",b,B.C,B.l,1,0,!1)
A.E(m,"intensity",b,1,1/0,-1/0,1/0,0,!1,0/0)
l=A.J(m,"type",b,h,B.cJ,h,!0)
if(l==="spot")A.T(m,f,b,A.xm(),!0)
else{k=m.v(f)
if(k)b.n($.oi(),f)}j=A.E(m,"range",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
if(l==="directional"&&!isNaN(j))b.n($.oi(),"range")
A.J(m,"name",b,h,h,h,!1)
k=A.t(m,B.e1,b,h)
i=m.i(0,"extras")
if(i!=null&&!o.b(i))b.n($.dk(),"extras")
r[n]=new A.ba(k,i,!1)
q.pop()}q.pop()}else{r=J.b8(0,r)
p=new A.F(r,0,g,t.E)}return new A.bC(p,A.t(a,B.e_,b,h),A.x(a,b),!1)},
up(a,b){var s,r,q="outerConeAngle"
A.w(a,B.cV,b)
s=A.E(a,"innerConeAngle",b,0,1.5707963267948966,-1/0,1/0,0,!1,0/0)
r=A.E(a,q,b,0.7853981633974483,1/0,0,1.5707963267948966,-1/0,!1,0/0)
if(r<=s)b.l($.rF(),A.a([s,r],t.M),q)
return new A.cg(A.t(a,B.e0,b,null),A.x(a,b),!1)},
uq(a,b){b.toString
A.w(a,B.d_,b)
return new A.ch(A.W(a,"light",b,!0),A.t(a,B.e2,b,null),A.x(a,b),!1)},
bC:function bC(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
iS:function iS(a,b){this.a=a
this.b=b},
ba:function ba(a,b,c){this.a=a
this.b=b
this.a$=c},
cg:function cg(a,b,c){this.a=a
this.b=b
this.a$=c},
ch:function ch(a,b,c,d){var _=this
_.d=a
_.e=null
_.a=b
_.b=c
_.a$=d},
ur(a,b){var s,r,q,p
b.toString
A.w(a,B.cv,b)
A.E(a,"anisotropyStrength",b,0,1/0,-1/0,1,0,!1,0/0)
A.E(a,"anisotropyRotation",b,0,1/0,-1/0,1/0,-1/0,!1,0/0)
s=A.T(a,"anisotropyTexture",b,A.ao(),!1)
r=A.t(a,B.e3,b,null)
q=new A.ci(s,r,A.x(a,b),!1)
p=A.a([s],t.M)
B.d.D(p,r.gX())
b.W(q,p)
return q},
ci:function ci(a,b,c,d){var _=this
_.f=a
_.a=b
_.b=c
_.a$=d},
us(a,b){var s,r,q,p,o,n
b.toString
A.w(a,B.ca,b)
A.E(a,"clearcoatFactor",b,0,1/0,-1/0,1,0,!1,0/0)
s=A.T(a,"clearcoatTexture",b,A.ao(),!1)
A.E(a,"clearcoatRoughnessFactor",b,0,1/0,-1/0,1,0,!1,0/0)
r=A.T(a,"clearcoatRoughnessTexture",b,A.ao(),!1)
q=A.T(a,"clearcoatNormalTexture",b,A.pV(),!1)
p=A.t(a,B.e4,b,null)
o=new A.cj(s,r,q,p,A.x(a,b),!1)
n=A.a([s,r,q],t.M)
B.d.D(n,p.gX())
b.W(o,n)
return o},
cj:function cj(a,b,c,d,e,f){var _=this
_.e=a
_.r=b
_.w=c
_.a=d
_.b=e
_.a$=f},
ut(a,b){b.toString
A.w(a,B.cK,b)
A.E(a,"dispersion",b,0,1/0,-1/0,1/0,0,!1,0/0)
return new A.ck(A.t(a,B.e5,b,null),A.x(a,b),!1)},
ck:function ck(a,b,c){this.a=a
this.b=b
this.a$=c},
uu(a,b){b.toString
A.w(a,B.cL,b)
return new A.cl(A.E(a,"emissiveStrength",b,1,1/0,-1/0,1/0,0,!1,0/0),A.t(a,B.e6,b,null),A.x(a,b),!1)},
cl:function cl(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
uv(a,b){b.toString
A.w(a,B.cX,b)
A.E(a,"ior",b,1.5,1/0,-1/0,1/0,1,!1,0)
return new A.cm(A.t(a,B.e7,b,null),A.x(a,b),!1)},
cm:function cm(a,b,c){this.a=a
this.b=b
this.a$=c},
uw(a,b){var s,r,q,p,o,n,m,l="iridescenceThicknessMinimum",k="iridescenceThicknessTexture"
b.toString
A.w(a,B.dg,b)
A.E(a,"iridescenceFactor",b,0,1/0,-1/0,1,0,!1,0/0)
s=A.T(a,"iridescenceTexture",b,A.ao(),!1)
A.E(a,"iridescenceIor",b,1.3,1/0,-1/0,1/0,1,!1,0/0)
r=A.E(a,l,b,100,1/0,-1/0,1/0,0,!1,0/0)
q=A.E(a,"iridescenceThicknessMaximum",b,400,1/0,-1/0,1/0,0,!1,0/0)
p=A.T(a,k,b,A.ao(),!1)
if(p!=null){if(r===q)b.n($.rL(),k)}else if(!isNaN(r)&&a.v(l))b.n($.rK(),l)
o=A.t(a,B.e8,b,null)
n=new A.cn(s,p,o,A.x(a,b),!1)
m=A.a([s,p],t.M)
B.d.D(m,o.gX())
b.W(n,m)
return n},
cn:function cn(a,b,c,d,e){var _=this
_.e=a
_.x=b
_.a=c
_.b=d
_.a$=e},
ux(a,b){var s,r,q,p,o
b.toString
A.w(a,B.cI,b)
A.ae(a,"diffuseFactor",b,B.al,B.P,1,0,!1)
s=A.T(a,"diffuseTexture",b,A.ao(),!1)
A.ae(a,"specularFactor",b,B.C,B.l,1,0,!1)
A.E(a,"glossinessFactor",b,1,1/0,-1/0,1,0,!1,0/0)
r=A.T(a,"specularGlossinessTexture",b,A.ao(),!1)
q=A.t(a,B.dX,b,null)
p=new A.co(s,r,q,A.x(a,b),!1)
o=A.a([s,r],t.M)
B.d.D(o,q.gX())
b.W(p,o)
return p},
co:function co(a,b,c,d,e){var _=this
_.e=a
_.w=b
_.a=c
_.b=d
_.a$=e},
uy(a,b){var s,r,q,p,o
b.toString
A.w(a,B.c9,b)
A.ae(a,"sheenColorFactor",b,B.ak,B.l,1,0,!1)
s=A.T(a,"sheenColorTexture",b,A.ao(),!1)
A.E(a,"sheenRoughnessFactor",b,0,1/0,-1/0,1,0,!1,0/0)
r=A.T(a,"sheenRoughnessTexture",b,A.ao(),!1)
q=A.t(a,B.e9,b,null)
p=new A.cp(s,r,q,A.x(a,b),!1)
o=A.a([s,r],t.M)
B.d.D(o,q.gX())
b.W(p,o)
return p},
cp:function cp(a,b,c,d,e){var _=this
_.e=a
_.r=b
_.a=c
_.b=d
_.a$=e},
uz(a,b){var s,r,q,p,o
b.toString
A.w(a,B.cc,b)
A.E(a,"specularFactor",b,1,1/0,-1/0,1,0,!1,0/0)
s=A.T(a,"specularTexture",b,A.ao(),!1)
A.ae(a,"specularColorFactor",b,B.C,B.l,1/0,0,!1)
r=A.T(a,"specularColorTexture",b,A.ao(),!1)
q=A.t(a,B.ea,b,null)
p=new A.cq(s,r,q,A.x(a,b),!1)
o=A.a([s,r],t.M)
B.d.D(o,q.gX())
b.W(p,o)
return p},
cq:function cq(a,b,c,d,e){var _=this
_.e=a
_.r=b
_.a=c
_.b=d
_.a$=e},
uA(a,b){var s,r,q,p
b.toString
A.w(a,B.cf,b)
A.E(a,"transmissionFactor",b,0,1/0,-1/0,1,0,!1,0/0)
s=A.T(a,"transmissionTexture",b,A.ao(),!1)
r=A.t(a,B.eb,b,null)
q=new A.cr(s,r,A.x(a,b),!1)
p=A.a([s],t.M)
B.d.D(p,r.gX())
b.W(q,p)
return q},
cr:function cr(a,b,c,d){var _=this
_.e=a
_.a=b
_.b=c
_.a$=d},
uB(a,b){b.toString
A.w(a,B.cM,b)
return new A.cs(A.t(a,B.ec,b,null),A.x(a,b),!1)},
cs:function cs(a,b,c){this.a=a
this.b=b
this.a$=c},
uC(a,b){var s,r,q,p,o,n,m,l,k,j=null,i="variants"
b.toString
A.w(a,B.dl,b)
s=A.eB(a,i,b)
r=t.J
if(s!=null){q=s.gj(s)
r=A.U(q,j,!1,r)
p=new A.F(r,q,i,t.u)
q=b.c
q.push(i)
for(o=t.h,n=0;n<s.gj(s);++n){m=s.i(0,n)
q.push(B.c.k(n))
A.w(m,B.d2,b)
A.J(m,"name",b,j,j,j,!0)
l=A.t(m,B.ef,b,j)
k=m.i(0,"extras")
if(k!=null&&!o.b(k))b.n($.dk(),"extras")
r[n]=new A.aM(l,k,!1)
q.pop()}q.pop()}else{r=J.b8(0,r)
p=new A.F(r,0,i,t.u)}return new A.bD(p,A.t(a,B.ed,b,j),A.x(a,b),!1)},
uD(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g=null,f="mappings"
b.toString
A.w(a,B.d1,b)
s=A.eB(a,f,b)
r=t.aa
if(s!=null){q=s.gj(s)
r=A.U(q,g,!1,r)
p=new A.F(r,q,f,t.B)
q=b.c
q.push(f)
for(o=t.h,n=0;n<s.gj(s);++n){m=s.i(0,n)
q.push(B.c.k(n))
A.w(m,B.dm,b)
l=A.mR(m,"variants",b,!0)
k=A.W(m,"material",b,!0)
A.J(m,"name",b,g,g,g,!1)
j=A.t(m,B.ee,b,g)
i=m.i(0,"extras")
if(i!=null&&!o.b(i))b.n($.dk(),"extras")
r[n]=new A.bb(l,k,j,i,!1)
q.pop()}q.pop()}else{r=J.b8(0,r)
p=new A.F(r,0,f,t.B)}h=new A.ct(p,A.t(a,B.el,b,g),A.x(a,b),!1)
b.W(h,A.bc(p,!0,t._))
return h},
bD:function bD(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
iT:function iT(a,b){this.a=a
this.b=b},
aM:function aM(a,b,c){this.a=a
this.b=b
this.a$=c},
ct:function ct(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
iW:function iW(a,b,c){this.a=a
this.b=b
this.c=c},
bb:function bb(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.r=null
_.a=c
_.b=d
_.a$=e},
iU:function iU(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
iV:function iV(a,b){this.a=a
this.b=b},
uE(a,b){var s,r,q,p,o
b.toString
A.w(a,B.dp,b)
A.ae(a,"attenuationColor",b,B.C,B.l,1,0,!1)
A.E(a,"attenuationDistance",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
s=A.E(a,"thicknessFactor",b,0,1/0,-1/0,1/0,0,!1,0/0)
r=A.T(a,"thicknessTexture",b,A.ao(),!1)
q=A.t(a,B.eg,b,null)
p=new A.cu(s,r,q,A.x(a,b),!1)
o=A.a([r],t.M)
B.d.D(o,q.gX())
b.W(p,o)
return p},
cu:function cu(a,b,c,d,e){var _=this
_.f=a
_.r=b
_.a=c
_.b=d
_.a$=e},
iX:function iX(){},
uF(a,b){b.toString
A.w(a,B.d8,b)
A.ae(a,"offset",b,B.c5,B.am,1/0,-1/0,!1)
A.E(a,"rotation",b,0,1/0,-1/0,1/0,-1/0,!1,0/0)
A.ae(a,"scale",b,B.c7,B.am,1/0,-1/0,!1)
return new A.cv(A.a0(a,"texCoord",b,-1,null,-1,0,!1),A.t(a,B.eh,b,null),A.x(a,b),!1)},
cv:function cv(a,b,c,d){var _=this
_.r=a
_.a=b
_.b=c
_.a$=d},
L:function L(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
O:function O(a,b,c){this.a=a
this.b=b
this.c=c},
cb:function cb(a,b){this.a=a
this.b=b},
cw:function cw(a,b){this.a=a
this.b=b},
fo:function fo(a,b){this.a=a
this.b=b},
oA(a,b){var s=null,r=new Uint8Array(12),q=new A.dt(r,a,new A.ay(new A.C($.B,t.f),t.G))
b.dx=!0
q.f=b
q.b=A.f7(r.buffer,0,s)
q.ch=A.p1(s,s,s,t.w)
return q},
dt:function dt(a,b,c){var _=this
_.a=a
_.b=null
_.c=b
_.d=null
_.e=c
_.f=null
_.as=_.Q=_.z=_.y=_.x=_.w=_.r=0
_.at=!1
_.ch=_.ay=_.ax=null
_.CW=!1
_.cx=null},
ii:function ii(a){this.a=a},
ij:function ij(a){this.a=a},
ig:function ig(a){this.a=a},
ih:function ih(a){this.a=a},
ue(a,b){var s,r={},q=new A.C($.B,t.eD)
r.a=!1
r.b=null
s=A.p1(new A.il(r),new A.im(r),new A.io(r),t.w)
r.b=a.ea(new A.ip(r,s,new A.ay(q,t.a_),b),s.gdZ())
return q},
oB(a,b){var s=new A.cT(a,new A.ay(new A.C($.B,t.f),t.G))
s.e=b
return s},
ud(a,b){var s,r,q,p,o=null,n=null
try{n=B.ab.e1(a)}catch(q){p=A.M(q)
if(p instanceof A.aK){s=p
b.aE($.h3(),A.a([s],t.M),!0)
return o}else throw q}if(t.t.b(n))try{r=A.oC(n,b)
return new A.au("model/gltf+json",r,o)}catch(q){if(A.M(q) instanceof A.bA)return o
else throw q}else{b.aE($.a2(),A.a([n,"object"],t.M),!0)
return o}},
au:function au(a,b,c){this.a=a
this.b=b
this.c=c},
im:function im(a){this.a=a},
io:function io(a){this.a=a},
il:function il(a){this.a=a},
ip:function ip(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
cT:function cT(a,b){var _=this
_.a=a
_.b=null
_.c=b
_.e=_.d=null
_.f=!0},
ik:function ik(a){this.a=a},
dv:function dv(){},
az(a,b,c,d){var s=a.i(0,b)
if(s==null&&a.v(b))d.l($.a2(),A.a([null,c],t.M),b)
return s},
mM(a){return typeof a=="number"&&Math.floor(a)===a?J.no(a):a},
W(a,b,c,d){var s=A.mM(A.az(a,b,"integer",c))
if(A.aI(s)){if(s>=0)return s
c.n($.h2(),b)}else if(s==null){if(d)c.F($.bs(),A.a([b],t.M))}else c.l($.a2(),A.a([s,"integer"],t.M),b)
return-1},
pO(a,b,c){var s=A.az(a,b,"boolean",c)
if(s==null)return!1
if(A.eu(s))return s
c.l($.a2(),A.a([s,"boolean"],t.M),b)
return!1},
a0(a,b,c,d,e,f,g,h){var s,r=A.mM(A.az(a,b,"integer",c))
if(A.aI(r)){if(e!=null){if(!A.nN(b,r,e,c,!1))return-1}else{if(!(r<g))s=f!==-1&&r>f
else s=!0
if(s){c.l($.ni(),A.a([r],t.M),b)
return-1}}return r}else if(r==null){if(!h)return d
c.F($.bs(),A.a([b],t.M))}else c.l($.a2(),A.a([r,"integer"],t.M),b)
return-1},
E(a,b,c,d,e,f,g,h,i,j){var s,r=A.az(a,b,"number",c)
if(typeof r=="number"){if(r!==j)s=r<h||r<=f||r>g||r>=e
else s=!1
if(s){c.l($.ni(),A.a([r],t.M),b)
return 0/0}return r}else if(r==null){if(!i)return d
c.F($.bs(),A.a([b],t.M))}else c.l($.a2(),A.a([r,"number"],t.M),b)
return 0/0},
J(a,b,c,d,e,f,g){var s,r=A.az(a,b,"string",c)
if(typeof r=="string"){if(e!=null)A.nN(b,r,e,c,!1)
else{if(f==null)s=null
else{s=f.b
s=s.test(r)}if(s===!1){c.l($.rp(),A.a([r,f.a],t.M),b)
return null}}return r}else if(r==null){if(!g)return d
c.F($.bs(),A.a([b],t.M))}else c.l($.a2(),A.a([r,"string"],t.M),b)
return null},
pS(a,b){var s,r,q,p
try{s=A.p6(a)
q=s
if(q.gcK()||q.gbN()||q.gcJ()||q.gbP()||q.gbO())b.l($.t3(),A.a([a],t.M),"uri")
return s}catch(p){q=A.M(p)
if(q instanceof A.aK){r=q
b.l($.od(),A.a([a,r],t.M),"uri")
return null}else throw p}},
nP(a,b,c,d){var s=A.az(a,b,"object",c)
if(t.t.b(s))return s
else if(s==null){if(d){c.F($.bs(),A.a([b],t.M))
return null}}else{c.l($.a2(),A.a([s,"object"],t.M),b)
if(d)return null}return A.a9(t.X,t._)},
T(a,b,c,d,e){var s,r,q=A.az(a,b,"object",c)
if(t.t.b(q)){s=c.c
s.push(b)
r=d.$2(q,c)
s.pop()
return r}else if(q==null){if(e)c.F($.bs(),A.a([b],t.M))}else c.l($.a2(),A.a([q,"object"],t.M),b)
return null},
mR(a,b,c,d){var s,r,q,p,o,n,m=A.az(a,b,"array",c)
if(t.m.b(m)){s=J.V(m)
if(s.gA(m)){c.n($.bX(),b)
return null}r=c.c
r.push(b)
q=t.e
p=A.aD(q)
for(o=0;o<s.gj(m);++o){n=s.i(m,o)
if(typeof n=="number"&&Math.floor(n)===n)n=J.no(n)
if(A.aI(n)&&n>=0){if(!p.C(0,n))c.Z($.ob(),o)
s.m(m,o,n)}else{s.m(m,o,-1)
c.Z($.h2(),o)}}r.pop()
return s.aj(m,q)}else if(m==null){if(d)c.F($.bs(),A.a([b],t.M))}else c.l($.a2(),A.a([m,"array"],t.M),b)
return null},
x5(a,b,c,d){var s,r=A.az(a,b,"object",c)
if(t.t.b(r)){if(r.gA(r)){c.n($.bX(),b)
return null}s=c.c
s.push(b)
r.M(0,new A.mS(d,r,c))
s.pop()
return r.ak(0,t.X,t.e)}else{s=t.M
if(r==null)c.F($.bs(),A.a([b],s))
else c.l($.a2(),A.a([r,"object"],s),b)}return null},
x6(a,b,c,d){var s,r,q,p,o,n,m,l=A.az(a,b,"array",c)
if(t.m.b(l)){s=J.V(l)
if(s.gA(l)){c.n($.bX(),b)
return null}else{r=c.c
r.push(b)
for(q=t.M,p=t.t,o=!1,n=0;n<s.gj(l);++n){m=s.i(l,n)
if(p.b(m))if(m.gA(m)){c.Z($.bX(),n)
o=!0}else{r.push(B.c.k(n))
m.M(0,new A.mT(d,m,c))
r.pop()}else{c.F($.eC(),A.a([m,"object"],q))
o=!0}}r.pop()
if(o)return null}s=J.nn(l,t.h)
r=A.A(s).h("ab<p.E,h<e*,f*>*>")
return A.bc(new A.ab(s,new A.mU(),r),!1,r.h("ah.E"))}else if(l!=null)c.l($.a2(),A.a([l,"array"],t.M),b)
return null},
ae(a,b,c,d,e,f,g,h){var s,r,q,p,o,n,m,l,k=null,j=A.az(a,b,"array",c)
if(t.m.b(j)){s=J.V(j)
if(s.gA(j)){c.n($.bX(),b)
return k}if(e!=null&&!A.nN(b,s.gj(j),e,c,!0))return k
r=A.U(s.gj(j),0,!1,t.F)
for(q=t.M,p=c.c,o=!1,n=0;n<s.gj(j);++n){m=s.i(j,n)
if(typeof m=="number"){l=m==1/0||m==-1/0||m<g||m>f
if(l){p.push(b)
c.ao($.ni(),A.a([m],q),n)
p.pop()
o=!0}if(h){l=$.ol()
l[0]=m
r[n]=l[0]}else r[n]=m}else{c.l($.eC(),A.a([m,"number"],q),b)
o=!0}}if(o)return k
return r}else if(j==null){if(d==null)s=k
else s=J.cX(d.slice(0),A.a_(d).c)
return s}else c.l($.a2(),A.a([j,"array"],t.M),b)
return k},
pP(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j=A.az(a,b,"array",c)
if(t.m.b(j)){s=J.V(j)
if(s.gj(j)!==e){c.l($.oc(),A.a([s.gj(j),A.a([e],t.V)],t.M),b)
return null}r=A.xR(d)
q=A.q1(d)
p=A.x_(d,e)
for(o=t.M,n=!1,m=0;m<s.gj(j);++m){l=s.i(j,m)
if(typeof l=="number"&&Math.floor(l)===l)l=J.no(l)
if(A.aI(l)){k=l<r||l>q
if(k){c.l($.rC(),A.a([l,B.ay.i(0,d)],o),b)
n=!0}p[m]=l}else{c.l($.eC(),A.a([l,"integer"],o),b)
n=!0}}if(n)return null
return p}else if(j!=null)c.l($.a2(),A.a([j,"array"],t.M),b)
return null},
pQ(a,b,c){var s,r,q,p,o,n,m,l,k=A.az(a,b,"array",c)
if(t.m.b(k)){s=J.V(k)
if(s.gA(k)){c.n($.bX(),b)
return null}r=c.c
r.push(b)
q=t.X
p=A.aD(q)
for(o=t.M,n=!1,m=0;m<s.gj(k);++m){l=s.i(k,m)
if(typeof l=="string"){if(!p.C(0,l))c.Z($.ob(),m)}else{c.ao($.eC(),A.a([l,"string"],o),m)
n=!0}}r.pop()
if(n)return null
return s.aj(k,q)}else if(k!=null)c.l($.a2(),A.a([k,"array"],t.M),b)
return null},
eB(a,b,c){var s,r,q,p,o,n,m=A.az(a,b,"array",c)
if(t.m.b(m)){s=J.V(m)
if(s.gA(m)){c.n($.bX(),b)
return null}else{for(r=s.gH(m),q=t.t,p=t.M,o=!1;r.q();){n=r.gt()
if(!q.b(n)){c.l($.eC(),A.a([n,"object"],p),b)
o=!0}}if(o)return null}return s.aj(m,q)}else{s=t.M
if(m==null)c.F($.bs(),A.a([b],s))
else c.l($.a2(),A.a([m,"array"],s),b)}return null},
t(a,b,c,d){var s,r,q,p,o,n,m,l,k,j,i,h,g="extensions",f=A.a9(t.X,t._),e=A.nP(a,g,c,!1)
if(e.gA(e))return f
s=c.c
s.push(g)
for(r=e.gN(),r=r.gH(r),q=t.ax,p=t.c,o=d==null,n=c.f,m=c.r;r.q();){l=r.gt()
k=A.nP(e,l,c,!1)
j=c.ay
if(!j.G(j,l)){j=c.at
j=j.G(j,l)
if(!j)c.n($.rk(),l)
f.m(0,l,k)
continue}i=c.Q.a.i(0,new A.cb(b,l))
if(i==null){c.n($.rl(),l)
continue}if(e.gj(e)>1&&i.b)c.n($.rW(),l)
if(k!=null){s.push(l)
h=i.a.$2(k,c)
f.m(0,l,h)
if(!i.c&&p.b(h)){l=o?b:d
l=n.c_(l,new A.mQ())
j=A.a(s.slice(0),A.a_(s))
j.fixed$length=Array
J.nm(l,new A.cw(h,j))}if(q.b(h)){l=A.a(s.slice(0),A.a_(s))
l.fixed$length=Array
m.push(new A.fo(h,l))}s.pop()}}s.pop()
return f},
x(a,b){var s=a.i(0,"extras")
if(s!=null&&!t.h.b(s))b.n($.dk(),"extras")
return s},
nN(a,b,c,d,e){var s
if(!J.on(c,b)){s=e?$.oc():$.rs()
d.l(s,A.a([b,c],t.M),a)
return!1}return!0},
w(a,b,c){var s,r,q
for(s=a.gN(),s=s.gH(s);s.q();){r=s.gt()
if(!B.d.G(b,r)){q=B.d.G(B.cP,r)
q=!q}else q=!1
if(q)c.n($.rq(),r)}},
nT(a,b,c,d,e,f){var s,r,q,p,o,n,m=e.c
m.push(d)
for(s=t.M,r=c.a,q=r.length,p=0;p<a.gj(a);++p){o=a.i(0,p)
if(o===-1)continue
n=o==null||o<0||o>=q?null:r[o]
if(n!=null){n.a$=!0
b[p]=n
f.$3(n,o,p)}else e.ao($.Q(),A.a([o],s),p)}m.pop()},
xi(b8){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6,b7=b8.a
if(b7[3]!==0||b7[7]!==0||b7[11]!==0||b7[15]!==1)return!1
if(b8.cG()===0)return!1
s=$.tt()
r=$.tq()
q=$.tr()
p=$.oN
if(p==null)p=$.oN=new A.cE(new Float32Array(3))
p.bt(b7[0],b7[1],b7[2])
o=Math.sqrt(p.gaW())
p.bt(b7[4],b7[5],b7[6])
n=Math.sqrt(p.gaW())
p.bt(b7[8],b7[9],b7[10])
m=Math.sqrt(p.gaW())
if(b8.cG()<0)o=-o
s=s.a
s[0]=b7[12]
s[1]=b7[13]
s[2]=b7[14]
l=1/o
k=1/n
j=1/m
i=$.oL
if(i==null)i=$.oL=new A.cZ(new Float32Array(16))
h=i.a
h[15]=b7[15]
h[14]=b7[14]
h[13]=b7[13]
h[12]=b7[12]
h[11]=b7[11]
h[10]=b7[10]
h[9]=b7[9]
h[8]=b7[8]
h[7]=b7[7]
h[6]=b7[6]
h[5]=b7[5]
h[4]=b7[4]
h[3]=b7[3]
h[2]=b7[2]
h[1]=b7[1]
h[0]=b7[0]
h[0]=h[0]*l
h[1]=h[1]*l
h[2]=h[2]*l
h[4]=h[4]*k
h[5]=h[5]*k
h[6]=h[6]*k
h[8]=h[8]*j
h[9]=h[9]*j
h[10]=h[10]*j
g=$.oM
if(g==null)g=$.oM=new A.f2(new Float32Array(9))
f=g.a
f[0]=h[0]
f[1]=h[1]
f[2]=h[2]
f[3]=h[4]
f[4]=h[5]
f[5]=h[6]
f[6]=h[8]
f[7]=h[9]
f[8]=h[10]
r.toString
b7=f[0]
h=f[4]
e=f[8]
d=0+b7+h+e
if(d>0){c=Math.sqrt(d+1)
b7=r.a
b7[3]=c*0.5
c=0.5/c
b7[0]=(f[5]-f[7])*c
b7[1]=(f[6]-f[2])*c
b7[2]=(f[1]-f[3])*c}else{if(b7<h)b=h<e?2:1
else b=b7<e?2:0
a=(b+1)%3
a0=(b+2)%3
b7=b*3
h=a*3
e=a0*3
c=Math.sqrt(f[b7+b]-f[h+a]-f[e+a0]+1)
r=r.a
r[b]=c*0.5
c=0.5/c
r[3]=(f[h+a0]-f[e+a])*c
r[a]=(f[b7+a]+f[h+b])*c
r[a0]=(f[b7+a0]+f[e+b])*c
b7=r}q=q.a
q[0]=o
q[1]=n
q[2]=m
r=$.tp()
a1=b7[0]
a2=b7[1]
a3=b7[2]
a4=b7[3]
a5=a1+a1
a6=a2+a2
a7=a3+a3
a8=a1*a5
a9=a1*a6
b0=a1*a7
b1=a2*a6
b2=a2*a7
b3=a3*a7
b4=a4*a5
b5=a4*a6
b6=a4*a7
b7=r.a
b7[0]=1-(b1+b3)
b7[1]=a9+b6
b7[2]=b0-b5
b7[3]=0
b7[4]=a9-b6
b7[5]=1-(a8+b3)
b7[6]=b2+b4
b7[7]=0
b7[8]=b0+b5
b7[9]=b2-b4
b7[10]=1-(a8+b1)
b7[11]=0
b7[12]=s[0]
b7[13]=s[1]
b7[14]=s[2]
b7[15]=1
o=q[0]
n=q[1]
m=q[2]
b7[0]=b7[0]*o
b7[1]=b7[1]*o
b7[2]=b7[2]*o
b7[3]=b7[3]*o
b7[4]=b7[4]*n
b7[5]=b7[5]*n
b7[6]=b7[6]*n
b7[7]=b7[7]*n
b7[8]=b7[8]*m
b7[9]=b7[9]*m
b7[10]=b7[10]*m
b7[11]=b7[11]*m
b7[12]=b7[12]
b7[13]=b7[13]
b7[14]=b7[14]
b7[15]=b7[15]
return Math.abs(r.cL()-b8.cL())<0.00005},
x_(a,b){switch(a){case 5120:return new Int8Array(b)
case 5121:return new Uint8Array(b)
case 5122:return new Int16Array(b)
case 5123:return new Uint16Array(b)
case 5124:return new Int32Array(b)
case 5125:return new Uint32Array(b)
default:throw A.d(A.K(null,null))}},
mS:function mS(a,b,c){this.a=a
this.b=b
this.c=c},
mT:function mT(a,b,c){this.a=a
this.b=b
this.c=c},
mU:function mU(){},
mQ:function mQ(){},
F:function F(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.$ti=d},
a1:function a1(){},
fv:function fv(a,b){this.a=0
this.b=a
this.c=b},
fw:function fw(a,b){this.a=0
this.b=a
this.c=b},
eK:function eK(a){this.a=a},
lF:function lF(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
lI:function lI(a,b){this.a=a
this.b=b},
lH:function lH(){},
lG:function lG(){},
uM(){return new A.cZ(new Float32Array(16))},
v3(){return new A.fl(new Float32Array(4))},
pb(a){var s=new Float32Array(3)
s[2]=a[2]
s[1]=a[1]
s[0]=a[0]
return new A.cE(s)},
pa(){return new A.cE(new Float32Array(3))},
f2:function f2(a){this.a=a},
cZ:function cZ(a){this.a=a},
fl:function fl(a){this.a=a},
cE:function cE(a){this.a=a},
fA:function fA(a){this.a=a},
xD(){var s=new A.nb()
J.tE(self.exports,A.cK(new A.n7(s)))
J.tF(self.exports,A.cK(new A.n8(s)))
J.tG(self.exports,A.cK(new A.n9()))
J.tD(self.exports,A.cK(new A.na()))},
h_(a,b){return A.xT(a,b)},
xT(a,b){var s=0,r=A.ex(t.t),q,p=2,o,n,m,l,k,j,i,h,g,f
var $async$h_=A.ez(function(c,d){if(c===1){o=d
s=p}while(true)switch(s){case 0:if(!t.a.b(a))throw A.d(A.K("data: Argument must be a Uint8Array.",null))
l=A.pv(b)
n=A.pz(l)
m=null
k=A.w0(l==null?null:J.tw(l))
case 3:switch(k==null?null:k.toLowerCase()){case"glb":s=5
break
case"gltf":s=6
break
default:s=7
break}break
case 5:m=A.oA(A.fs(a,t.w),n)
s=4
break
case 6:m=A.oB(A.fs(a,t.w),n)
s=4
break
case 7:p=9
s=12
return A.dd(A.ue(A.fs(a,t.w),n),$async$h_)
case 12:m=d
p=2
s=11
break
case 9:p=8
i=o
if(A.M(i) instanceof A.dv)throw i
else throw i
s=11
break
case 8:s=2
break
case 11:case 4:h=A
g=l
f=n
s=13
return A.dd(m.c0(),$async$h_)
case 13:q=h.fY(g,f,d)
s=1
break
case 1:return A.es(q,r)
case 2:return A.er(o,r)}})
return A.et($async$h_,r)},
nV(a,b){var s=0,r=A.ex(t.t),q,p,o
var $async$nV=A.ez(function(c,d){if(c===1)return A.er(d,r)
while(true)switch(s){case 0:if(typeof a!="string")throw A.d(A.K("json: Argument must be a string.",null))
p=A.pv(b)
o=A.pz(p)
q=A.fY(p,o,A.ud(a,o))
s=1
break
case 1:return A.es(q,r)}})
return A.et($async$nV,r)},
pv(a){var s
if(a!=null)s=typeof a=="number"||A.eu(a)||typeof a=="string"||t.l.b(a)
else s=!1
if(s)throw A.d(A.K("options: Value must be an object.",null))
return t.bv.a(a)},
fY(a,b,c){var s=0,r=A.ex(t.t),q,p,o,n,m
var $async$fY=A.ez(function(d,e){if(d===1)return A.er(e,r)
while(true)switch(s){case 0:m=a==null
if(!m){p=J.b1(a)
o=A.wd(p.gbo(a))
if(p.gbL(a)!=null&&!t.b1.b(p.gbL(a)))throw A.d(A.K("options.externalResourceFunction: Value must be a function.",null))
else n=p.gbL(a)
if(p.gc6(a)!=null&&!A.eu(p.gc6(a)))throw A.d(A.K("options.writeTimestamp: Value must be a boolean.",null))}else{o=null
n=null}s=(c==null?null:c.b)!=null?3:4
break
case 3:s=5
return A.dd(A.wc(b,c,n).aX(),$async$fY)
case 5:case 4:m=m?null:J.tz(a)
q=new A.lF(o,b,c,m==null?!0:m).bn()
s=1
break
case 1:return A.es(q,r)}})
return A.et($async$fY,r)},
wd(a){var s,r,q
if(a!=null)if(typeof a=="string")try{r=A.p6(a)
return r}catch(q){r=A.M(q)
if(r instanceof A.aK){s=r
throw A.d(A.K("options.uri: "+A.b(s)+".",null))}else throw q}else throw A.d(A.K("options.uri: Value must be a string.",null))
return null},
pz(a){var s,r,q,p,o,n,m,l,k,j,i=null,h="]: Value must be a non-empty String."
if(a!=null){s=J.b1(a)
if(s.gbM(a)!=null&&typeof s.gbM(a)!="string")throw A.d(A.K("options.format: Value must be a string.",i))
if(s.gbk(a)!=null)r=!A.aI(s.gbk(a))||s.gbk(a)<0
else r=!1
if(r)throw A.d(A.K("options.maxIssues: Value must be a non-negative integer.",i))
if(s.gaY(a)!=null&&s.gaU(a)!=null)throw A.d(A.K("options.onlyIssues cannot be used along with options.ignoredIssues.",i))
if(s.gaY(a)!=null){if(!t.l.b(s.gaY(a)))throw A.d(A.K("options.onlyIssues: Value must be an array.",i))
q=A.a([],t.i)
for(p=0;p<J.a3(s.gaY(a));++p){o=J.nl(s.gaY(a),p)
if(typeof o=="string"&&o.length!==0)q.push(o)
else throw A.d(A.K("options.onlyIssues["+p+h,i))}}else q=i
if(s.gaU(a)!=null){if(!t.l.b(s.gaU(a)))throw A.d(A.K("options.ignoredIssues: Value must be an array.",i))
n=A.a([],t.i)
for(p=0;p<J.a3(s.gaU(a));++p){o=J.nl(s.gaU(a),p)
if(typeof o=="string"&&o.length!==0)n.push(o)
else throw A.d(A.K("options.ignoredIssues["+p+h,i))}}else n=i
if(s.gam(a)!=null){if(typeof s.gam(a)=="number"||A.eu(s.gam(a))||typeof s.gam(a)=="string"||t.l.b(s.gam(a)))throw A.d(A.K("options.severityOverrides: Value must be an object.",i))
r=t.X
m=A.a9(r,t.dz)
for(r=J.nn(self.Object.keys(s.gam(a)),r),r=new A.aa(r,r.gj(r),A.A(r).h("aa<p.E>"));r.q();){l=r.d
k=s.gam(a)[l]
if(A.aI(k)&&k>=0&&k<=3)m.m(0,l,B.cn[k])
else throw A.d(A.K('options.severityOverrides["'+A.b(l)+'"]: Value must be one of [0, 1, 2, 3].',i))}}else m=i
j=A.p9(n,s.gbk(a),q,m)}else j=i
return A.u3(j)},
wc(a,b,c){var s=new A.mG(c),r=new A.e_("options.externalResourceFunction is required to load this resource.")
return new A.kb(b.b,a,new A.mE(a,b,c,s,r),new A.mF(c,s,r))},
bf:function bf(){},
hX:function hX(){},
d8:function d8(){},
nb:function nb(){},
n7:function n7(a){this.a=a},
n6:function n6(a,b,c){this.a=a
this.b=b
this.c=c},
n3:function n3(a){this.a=a},
n4:function n4(a,b){this.a=a
this.b=b},
n8:function n8(a){this.a=a},
n5:function n5(a,b,c){this.a=a
this.b=b
this.c=c},
n1:function n1(a){this.a=a},
n2:function n2(a,b){this.a=a
this.b=b},
n9:function n9(){},
na:function na(){},
mG:function mG(a){this.a=a},
mH:function mH(a){this.a=a},
mI:function mI(a){this.a=a},
mE:function mE(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
mF:function mF(a,b,c){this.a=a
this.b=b
this.c=c},
ff:function ff(a){this.a=a},
nU(a){return A.Z(A.uG(a))},
w4(a){var s,r=a.$dart_jsFunction
if(r!=null)return r
s=function(b,c){return function(){return b(c,Array.prototype.slice.apply(arguments))}}(A.w3,a)
s[$.nW()]=a
a.$dart_jsFunction=s
return s},
w3(a,b){return A.v_(a,b,null)},
cK(a){if(typeof a=="function")return a
else return A.w4(a)},
wg(a){var s="POSITION",r="TEXCOORD",q=a.fr
q.i(0,s).D(0,B.dh)
q.i(0,"NORMAL").D(0,B.Q)
q.i(0,"TANGENT").D(0,B.ds)
q.i(0,r).D(0,B.cd)
q=a.fx
q.i(0,s).D(0,B.cx)
q.i(0,"NORMAL").D(0,B.Q)
q.i(0,"TANGENT").D(0,B.Q)
q.i(0,r).D(0,B.dn)},
b0(a){switch(a){case 5120:case 5121:return 1
case 5122:case 5123:return 2
case 5124:case 5125:case 5126:return 4
default:return-1}},
xR(a){switch(a){case 5121:case 5123:case 5125:return 0
case 5120:return-128
case 5122:return-32768
case 5124:return-2147483648
default:throw A.d(A.K(null,null))}},
q1(a){switch(a){case 5120:return 127
case 5121:return 255
case 5122:return 32767
case 5123:return 65535
case 5124:return 2147483647
case 5125:return 4294967295
default:throw A.d(A.K(null,null))}},
fW(a,b){var s=a+b&536870911
s=s+((s&524287)<<10)&536870911
return s^s>>>6},
px(a){var s=a+((a&67108863)<<3)&536870911
s^=s>>>11
return s+((s&16383)<<15)&536870911}},J={
nS(a,b,c,d){return{i:a,p:b,e:c,x:d}},
mV(a){var s,r,q,p,o,n=a[v.dispatchPropertyName]
if(n==null)if($.nQ==null){A.xe()
n=a[v.dispatchPropertyName]}if(n!=null){s=n.p
if(!1===s)return n.i
if(!0===s)return a
r=Object.getPrototypeOf(a)
if(s===r)return n.i
if(n.e===r)throw A.d(A.p4("Return interceptor for "+A.b(s(a,n))))}q=a.constructor
if(q==null)p=null
else{o=$.mg
if(o==null)o=$.mg=v.getIsolateTag("_$dart_js")
p=q[o]}if(p!=null)return p
p=A.xC(a)
if(p!=null)return p
if(typeof a=="function")return B.c2
s=Object.getPrototypeOf(a)
if(s==null)return B.aA
if(s===Object.prototype)return B.aA
if(typeof q=="function"){o=$.mg
if(o==null)o=$.mg=v.getIsolateTag("_$dart_js")
Object.defineProperty(q,o,{value:B.X,enumerable:false,writable:true,configurable:true})
return B.X}return B.X},
b8(a,b){if(a<0||a>4294967295)throw A.d(A.Y(a,0,4294967295,"length",null))
return J.cX(new Array(a),b)},
oF(a,b){if(a>4294967295)throw A.d(A.Y(a,0,4294967295,"length",null))
return J.cX(new Array(a),b)},
cX(a,b){return J.nr(A.a(a,b.h("D<0>")))},
nr(a){a.fixed$length=Array
return a},
uj(a){if(a<256)switch(a){case 9:case 10:case 11:case 12:case 13:case 32:case 133:case 160:return!0
default:return!1}switch(a){case 5760:case 8192:case 8193:case 8194:case 8195:case 8196:case 8197:case 8198:case 8199:case 8200:case 8201:case 8202:case 8232:case 8233:case 8239:case 8287:case 12288:case 65279:return!0
default:return!1}},
oG(a,b){var s,r
for(;b>0;b=s){s=b-1
r=B.a.B(a,s)
if(r!==32&&r!==13&&!J.uj(r))break}return b},
bV(a){if(typeof a=="number"){if(Math.floor(a)==a)return J.dy.prototype
return J.eZ.prototype}if(typeof a=="string")return J.bB.prototype
if(a==null)return J.dz.prototype
if(typeof a=="boolean")return J.dx.prototype
if(a.constructor==Array)return J.D.prototype
if(typeof a!="object"){if(typeof a=="function")return J.b9.prototype
return a}if(a instanceof A.c)return a
return J.mV(a)},
V(a){if(typeof a=="string")return J.bB.prototype
if(a==null)return a
if(a.constructor==Array)return J.D.prototype
if(typeof a!="object"){if(typeof a=="function")return J.b9.prototype
return a}if(a instanceof A.c)return a
return J.mV(a)},
bp(a){if(a==null)return a
if(a.constructor==Array)return J.D.prototype
if(typeof a!="object"){if(typeof a=="function")return J.b9.prototype
return a}if(a instanceof A.c)return a
return J.mV(a)},
x7(a){if(typeof a=="number")return J.ce.prototype
if(a==null)return a
if(!(a instanceof A.c))return J.bL.prototype
return a},
x8(a){if(typeof a=="number")return J.ce.prototype
if(typeof a=="string")return J.bB.prototype
if(a==null)return a
if(!(a instanceof A.c))return J.bL.prototype
return a},
x9(a){if(typeof a=="string")return J.bB.prototype
if(a==null)return a
if(!(a instanceof A.c))return J.bL.prototype
return a},
b1(a){if(a==null)return a
if(typeof a!="object"){if(typeof a=="function")return J.b9.prototype
return a}if(a instanceof A.c)return a
return J.mV(a)},
om(a,b){if(typeof a=="number"&&typeof b=="number")return a+b
return J.x8(a).ae(a,b)},
af(a,b){if(a==null)return b==null
if(typeof a!="object")return b!=null&&a===b
return J.bV(a).O(a,b)},
nl(a,b){if(typeof b==="number")if(a.constructor==Array||typeof a=="string"||A.pU(a,a[v.dispatchPropertyName]))if(b>>>0===b&&b<a.length)return a[b]
return J.V(a).i(a,b)},
tv(a,b,c){if(typeof b==="number")if((a.constructor==Array||A.pU(a,a[v.dispatchPropertyName]))&&!a.immutable$list&&b>>>0===b&&b<a.length)return a[b]=c
return J.bp(a).m(a,b,c)},
nm(a,b){return J.bp(a).C(a,b)},
nn(a,b){return J.bp(a).aj(a,b)},
on(a,b){return J.bp(a).G(a,b)},
eD(a,b){return J.bp(a).V(a,b)},
tw(a){return J.b1(a).gbM(a)},
bY(a){return J.bV(a).gE(a)},
oo(a){return J.V(a).gA(a)},
tx(a){return J.V(a).ga8(a)},
aA(a){return J.bp(a).gH(a)},
a3(a){return J.V(a).gj(a)},
ty(a){return J.b1(a).ger(a)},
tz(a){return J.b1(a).gc6(a)},
tA(a,b,c){return J.bp(a).b0(a,b,c)},
bt(a,b,c){return J.bp(a).al(a,b,c)},
tB(a,b){return J.bV(a).bm(a,b)},
tC(a,b){return J.V(a).sj(a,b)},
tD(a,b){return J.b1(a).sdf(a,b)},
tE(a,b){return J.b1(a).seB(a,b)},
tF(a,b){return J.b1(a).seD(a,b)},
tG(a,b){return J.b1(a).seE(a,b)},
op(a,b){return J.bp(a).a6(a,b)},
tH(a,b,c){return J.b1(a).d1(a,b,c)},
tI(a,b,c){return J.b1(a).es(a,b,c)},
no(a){return J.x7(a).eu(a)},
h4(a,b){return J.bp(a).b_(a,b)},
as(a){return J.bV(a).k(a)},
tJ(a){return J.x9(a).ey(a)},
cV:function cV(){},
dx:function dx(){},
dz:function dz(){},
f_:function f_(){},
aN:function aN(){},
fj:function fj(){},
bL:function bL(){},
b9:function b9(){},
D:function D(a){this.$ti=a},
iL:function iL(a){this.$ti=a},
b4:function b4(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
ce:function ce(){},
dy:function dy(){},
eZ:function eZ(){},
bB:function bB(){}},B={}
var w=[A,J,B]
var $={}
A.ns.prototype={}
J.cV.prototype={
O(a,b){return a===b},
gE(a){return A.d0(a)},
k(a){return"Instance of '"+A.b(A.ka(a))+"'"},
bm(a,b){throw A.d(new A.dH(a,b.gcT(),b.gcX(),b.gcU(),null))}}
J.dx.prototype={
k(a){return String(a)},
gE(a){return a?519018:218159},
$iS:1}
J.dz.prototype={
O(a,b){return null==b},
k(a){return"null"},
gE(a){return 0},
bm(a,b){return this.d6(a,b)},
$il:1}
J.f_.prototype={}
J.aN.prototype={
gE(a){return 0},
k(a){return String(a)},
$ibf:1,
$id8:1,
ger(a){return a.then},
d1(a,b){return a.then(b)},
es(a,b,c){return a.then(b,c)},
seB(a,b){return a.validateBytes=b},
seD(a,b){return a.validateString=b},
seE(a,b){return a.version=b},
sdf(a,b){return a.supportedExtensions=b},
gbo(a){return a.uri},
gbM(a){return a.format},
gbL(a){return a.externalResourceFunction},
gc6(a){return a.writeTimestamp},
gbk(a){return a.maxIssues},
gaU(a){return a.ignoredIssues},
gaY(a){return a.onlyIssues},
gam(a){return a.severityOverrides}}
J.fj.prototype={}
J.bL.prototype={}
J.b9.prototype={
k(a){var s=a[$.nW()]
if(s==null)return this.da(a)
return"JavaScript function for "+A.b(J.as(s))},
$iaB:1}
J.D.prototype={
aj(a,b){return new A.b5(a,A.a_(a).h("@<1>").I(b).h("b5<1,2>"))},
C(a,b){if(!!a.fixed$length)A.Z(A.ad("add"))
a.push(b)},
dP(a,b,c){var s,r,q,p=[],o=a.length
for(s=0;s<o;++s){r=a[s]
if(!b.$1(r))p.push(r)
if(a.length!==o)throw A.d(A.ag(a))}q=p.length
if(q===o)return
this.sj(a,q)
for(s=0;s<p.length;++s)a[s]=p[s]},
D(a,b){var s
if(!!a.fixed$length)A.Z(A.ad("addAll"))
if(Array.isArray(b)){this.di(a,b)
return}for(s=J.aA(b);s.q();)a.push(s.gt())},
di(a,b){var s,r=b.length
if(r===0)return
if(a===b)throw A.d(A.ag(a))
for(s=0;s<r;++s)a.push(b[s])},
P(a){if(!!a.fixed$length)A.Z(A.ad("clear"))
a.length=0},
al(a,b,c){return new A.ab(a,b,A.a_(a).h("@<1>").I(c).h("ab<1,2>"))},
cQ(a,b){var s,r=A.U(a.length,"",!1,t.R)
for(s=0;s<a.length;++s)r[s]=A.b(a[s])
return r.join(b)},
a6(a,b){return A.dQ(a,b,null,A.a_(a).c)},
bf(a,b,c){var s,r,q=a.length
for(s=0;s<q;++s){r=a[s]
if(b.$1(r))return r
if(a.length!==q)throw A.d(A.ag(a))}return c.$0()},
V(a,b){return a[b]},
a1(a,b,c){if(b<0||b>a.length)throw A.d(A.Y(b,0,a.length,"start",null))
if(c<b||c>a.length)throw A.d(A.Y(c,b,a.length,"end",null))
if(b===c)return A.a([],A.a_(a))
return A.a(a.slice(b,c),A.a_(a))},
b0(a,b,c){A.aQ(b,c,a.length)
return A.dQ(a,b,c,A.a_(a).c)},
gaV(a){var s=a.length
if(s>0)return a[s-1]
throw A.d(A.nq())},
G(a,b){var s
for(s=0;s<a.length;++s)if(J.af(a[s],b))return!0
return!1},
gA(a){return a.length===0},
ga8(a){return a.length!==0},
k(a){return A.iI(a,"[","]")},
b_(a,b){var s=J.cX(a.slice(0),A.a_(a).c)
return s},
c3(a){return A.uJ(a,A.a_(a).c)},
gH(a){return new J.b4(a,a.length,A.a_(a).h("b4<1>"))},
gE(a){return A.d0(a)},
gj(a){return a.length},
sj(a,b){if(!!a.fixed$length)A.Z(A.ad("set length"))
if(b<0)throw A.d(A.Y(b,0,null,"newLength",null))
a.length=b},
i(a,b){if(!(b>=0&&b<a.length))throw A.d(A.eA(a,b))
return a[b]},
m(a,b,c){if(!!a.immutable$list)A.Z(A.ad("indexed set"))
if(!(b>=0&&b<a.length))throw A.d(A.eA(a,b))
a[b]=c},
$iq:1,
$ij:1,
$io:1}
J.iL.prototype={}
J.b4.prototype={
gt(){return this.d},
q(){var s,r=this,q=r.a,p=q.length
if(r.b!==p)throw A.d(A.cN(q))
s=r.c
if(s>=p){r.d=null
return!1}r.d=q[s]
r.c=s+1
return!0},
$iP:1}
J.ce.prototype={
eu(a){var s
if(a>=-2147483648&&a<=2147483647)return a|0
if(isFinite(a)){s=a<0?Math.ceil(a):Math.floor(a)
return s+0}throw A.d(A.ad(""+a+".toInt()"))},
av(a,b){var s,r,q,p
if(b<2||b>36)throw A.d(A.Y(b,2,36,"radix",null))
s=a.toString(b)
if(B.a.B(s,s.length-1)!==41)return s
r=/^([\da-z]+)(?:\.([\da-z]+))?\(e\+(\d+)\)$/.exec(s)
if(r==null)A.Z(A.ad("Unexpected toString result: "+s))
s=r[1]
q=+r[3]
p=r[2]
if(p!=null){s+=p
q-=p.length}return s+B.a.bs("0",q)},
k(a){if(a===0&&1/a<0)return"-0.0"
else return""+a},
gE(a){var s,r,q,p,o=a|0
if(a===o)return o&536870911
s=Math.abs(a)
r=Math.log(s)/0.6931471805599453|0
q=Math.pow(2,r)
p=s<1?s/q:q/s
return((p*9007199254740992|0)+(p*3542243181176521|0))*599197+r*1259&536870911},
br(a,b){var s=a%b
if(s===0)return 0
if(s>0)return s
return s+b},
aw(a,b){if((a|0)===a)if(b>=1||b<-1)return a/b|0
return this.cv(a,b)},
bJ(a,b){return(a|0)===a?a/b|0:this.cv(a,b)},
cv(a,b){var s=a/b
if(s>=-2147483648&&s<=2147483647)return s|0
if(s>0){if(s!==1/0)return Math.floor(s)}else if(s>-1/0)return Math.ceil(s)
throw A.d(A.ad("Result of truncating division is "+A.b(s)+": "+A.b(a)+" ~/ "+b))},
aI(a,b){if(b<0)throw A.d(A.cL(b))
return b>31?0:a<<b>>>0},
ai(a,b){var s
if(a>0)s=this.cu(a,b)
else{s=b>31?31:b
s=a>>s>>>0}return s},
dT(a,b){if(0>b)throw A.d(A.cL(b))
return this.cu(a,b)},
cu(a,b){return b>31?0:a>>>b},
$iz:1,
$iN:1}
J.dy.prototype={$if:1}
J.eZ.prototype={}
J.bB.prototype={
B(a,b){if(b<0)throw A.d(A.eA(a,b))
if(b>=a.length)A.Z(A.eA(a,b))
return a.charCodeAt(b)},
J(a,b){if(b>=a.length)throw A.d(A.eA(a,b))
return a.charCodeAt(b)},
ae(a,b){if(typeof b!="string")throw A.d(A.h7(b,null,null))
return a+b},
aH(a,b,c,d){var s=A.aQ(b,c,a.length)
return a.substring(0,b)+d+a.substring(s)},
U(a,b,c){var s
if(c<0||c>a.length)throw A.d(A.Y(c,0,a.length,null,null))
s=c+b.length
if(s>a.length)return!1
return b===a.substring(c,s)},
Y(a,b){return this.U(a,b,0)},
u(a,b,c){return a.substring(b,A.aQ(b,c,a.length))},
bu(a,b){return this.u(a,b,null)},
ey(a){var s,r,q
if(typeof a.trimRight!="undefined"){s=a.trimRight()
r=s.length
if(r===0)return s
q=r-1
if(this.B(s,q)===133)r=J.oG(s,q)}else{r=J.oG(a,a.length)
s=a}if(r===s.length)return s
if(r===0)return""
return s.substring(0,r)},
bs(a,b){var s,r
if(0>=b)return""
if(b===1||a.length===0)return a
if(b!==b>>>0)throw A.d(B.bh)
for(s=a,r="";!0;){if((b&1)===1)r=s+r
b=b>>>1
if(b===0)break
s+=s}return r},
aq(a,b,c){var s=b-a.length
if(s<=0)return a
return this.bs(c,s)+a},
bg(a,b,c){var s
if(c<0||c>a.length)throw A.d(A.Y(c,0,a.length,null,null))
s=a.indexOf(b,c)
return s},
bR(a,b){return this.bg(a,b,0)},
k(a){return a},
gE(a){var s,r,q
for(s=a.length,r=0,q=0;q<s;++q){r=r+a.charCodeAt(q)&536870911
r=r+((r&524287)<<10)&536870911
r^=r>>6}r=r+((r&67108863)<<3)&536870911
r^=r>>11
return r+((r&16383)<<15)&536870911},
gj(a){return a.length},
$ie:1}
A.bM.prototype={
gH(a){var s=A.A(this)
return new A.dm(J.aA(this.gaa()),s.h("@<1>").I(s.z[1]).h("dm<1,2>"))},
gj(a){return J.a3(this.gaa())},
gA(a){return J.oo(this.gaa())},
ga8(a){return J.tx(this.gaa())},
a6(a,b){var s=A.A(this)
return A.he(J.op(this.gaa(),b),s.c,s.z[1])},
V(a,b){return A.A(this).z[1].a(J.eD(this.gaa(),b))},
G(a,b){return J.on(this.gaa(),b)},
k(a){return J.as(this.gaa())}}
A.dm.prototype={
q(){return this.a.q()},
gt(){return this.$ti.z[1].a(this.a.gt())},
$iP:1}
A.c5.prototype={
gaa(){return this.a}}
A.dZ.prototype={$iq:1}
A.dU.prototype={
i(a,b){return this.$ti.z[1].a(J.nl(this.a,b))},
m(a,b,c){J.tv(this.a,b,this.$ti.c.a(c))},
sj(a,b){J.tC(this.a,b)},
C(a,b){J.nm(this.a,this.$ti.c.a(b))},
b0(a,b,c){var s=this.$ti
return A.he(J.tA(this.a,b,c),s.c,s.z[1])},
$iq:1,
$io:1}
A.b5.prototype={
aj(a,b){return new A.b5(this.a,this.$ti.h("@<1>").I(b).h("b5<1,2>"))},
gaa(){return this.a}}
A.c6.prototype={
ak(a,b,c){var s=this.$ti
return new A.c6(this.a,s.h("@<1>").I(s.z[1]).I(b).I(c).h("c6<1,2,3,4>"))},
v(a){return this.a.v(a)},
i(a,b){return this.$ti.h("4?").a(this.a.i(0,b))},
m(a,b,c){var s=this.$ti
this.a.m(0,s.c.a(b),s.z[1].a(c))},
M(a,b){this.a.M(0,new A.hf(this,b))},
gN(){var s=this.$ti
return A.he(this.a.gN(),s.c,s.z[2])},
gj(a){var s=this.a
return s.gj(s)},
gA(a){var s=this.a
return s.gA(s)}}
A.hf.prototype={
$2(a,b){var s=this.a.$ti
this.b.$2(s.z[2].a(a),s.z[3].a(b))},
$S(){return this.a.$ti.h("~(1,2)")}}
A.f1.prototype={
k(a){return"LateInitializationError: "+this.a}}
A.fm.prototype={
k(a){return"ReachabilityError: "+this.a}}
A.c8.prototype={
gj(a){return this.a.length},
i(a,b){return B.a.B(this.a,b)}}
A.nd.prototype={
$0(){var s=new A.C($.B,t.U)
s.ah(null)
return s},
$S:47}
A.dI.prototype={
k(a){return"Null is not a valid value for '"+this.a+"' of type '"+A.pL(this.$ti.c).k(0)+"'"},
$iaG:1}
A.q.prototype={}
A.ah.prototype={
gH(a){var s=this
return new A.aa(s,s.gj(s),A.A(s).h("aa<ah.E>"))},
gA(a){return this.gj(this)===0},
G(a,b){var s,r=this,q=r.gj(r)
for(s=0;s<q;++s){if(J.af(r.V(0,s),b))return!0
if(q!==r.gj(r))throw A.d(A.ag(r))}return!1},
al(a,b,c){return new A.ab(this,b,A.A(this).h("@<ah.E>").I(c).h("ab<1,2>"))},
a6(a,b){return A.dQ(this,b,null,A.A(this).h("ah.E"))}}
A.dP.prototype={
gdu(){var s=J.a3(this.a),r=this.c
if(r==null||r>s)return s
return r},
gdU(){var s=J.a3(this.a),r=this.b
if(r>s)return s
return r},
gj(a){var s,r=J.a3(this.a),q=this.b
if(q>=r)return 0
s=this.c
if(s==null||s>=r)return r-q
return s-q},
V(a,b){var s=this,r=s.gdU()+b
if(b<0||r>=s.gdu())throw A.d(A.eW(b,s.gj(s),s,null,"index"))
return J.eD(s.a,r)},
a6(a,b){var s,r,q=this
A.aW(b,"count")
s=q.b+b
r=q.c
if(r!=null&&s>=r)return new A.b7(q.$ti.h("b7<1>"))
return A.dQ(q.a,s,r,q.$ti.c)},
b_(a,b){var s,r,q,p=this,o=p.b,n=p.a,m=J.V(n),l=m.gj(n),k=p.c
if(k!=null&&k<l)l=k
s=l-o
if(s<=0){n=J.b8(0,p.$ti.c)
return n}r=A.U(s,m.V(n,o),!1,p.$ti.c)
for(q=1;q<s;++q){r[q]=m.V(n,o+q)
if(m.gj(n)<l)throw A.d(A.ag(p))}return r}}
A.aa.prototype={
gt(){return this.d},
q(){var s,r=this,q=r.a,p=J.V(q),o=p.gj(q)
if(r.b!==o)throw A.d(A.ag(q))
s=r.c
if(s>=o){r.d=null
return!1}r.d=p.V(q,s);++r.c
return!0},
$iP:1}
A.bd.prototype={
gH(a){var s=A.A(this)
return new A.dD(J.aA(this.a),this.b,s.h("@<1>").I(s.z[1]).h("dD<1,2>"))},
gj(a){return J.a3(this.a)},
gA(a){return J.oo(this.a)},
V(a,b){return this.b.$1(J.eD(this.a,b))}}
A.c9.prototype={$iq:1}
A.dD.prototype={
q(){var s=this,r=s.b
if(r.q()){s.a=s.c.$1(r.gt())
return!0}s.a=null
return!1},
gt(){return this.a}}
A.ab.prototype={
gj(a){return J.a3(this.a)},
V(a,b){return this.b.$1(J.eD(this.a,b))}}
A.lK.prototype={
gH(a){return new A.cF(J.aA(this.a),this.b,this.$ti.h("cF<1>"))},
al(a,b,c){return new A.bd(this,b,this.$ti.h("@<1>").I(c).h("bd<1,2>"))}}
A.cF.prototype={
q(){var s,r
for(s=this.a,r=this.b;s.q();)if(r.$1(s.gt()))return!0
return!1},
gt(){return this.a.gt()}}
A.bh.prototype={
a6(a,b){A.h8(b,"count")
A.aW(b,"count")
return new A.bh(this.a,this.b+b,A.A(this).h("bh<1>"))},
gH(a){return new A.dN(J.aA(this.a),this.b,A.A(this).h("dN<1>"))}}
A.cR.prototype={
gj(a){var s=J.a3(this.a)-this.b
if(s>=0)return s
return 0},
a6(a,b){A.h8(b,"count")
A.aW(b,"count")
return new A.cR(this.a,this.b+b,this.$ti)},
$iq:1}
A.dN.prototype={
q(){var s,r
for(s=this.a,r=0;r<this.b;++r)s.q()
this.b=0
return s.q()},
gt(){return this.a.gt()}}
A.b7.prototype={
gH(a){return B.b9},
gA(a){return!0},
gj(a){return 0},
V(a,b){throw A.d(A.Y(b,0,0,"index",null))},
G(a,b){return!1},
al(a,b,c){return new A.b7(c.h("b7<0>"))},
a6(a,b){A.aW(b,"count")
return this}}
A.dq.prototype={
q(){return!1},
gt(){throw A.d(A.nq())},
$iP:1}
A.ds.prototype={
sj(a,b){throw A.d(A.ad("Cannot change the length of a fixed-length list"))},
C(a,b){throw A.d(A.ad("Cannot add to a fixed-length list"))}}
A.fy.prototype={
m(a,b,c){throw A.d(A.ad("Cannot modify an unmodifiable list"))},
sj(a,b){throw A.d(A.ad("Cannot change the length of an unmodifiable list"))},
C(a,b){throw A.d(A.ad("Cannot add to an unmodifiable list"))}}
A.d4.prototype={}
A.d3.prototype={
gE(a){var s=this._hashCode
if(s!=null)return s
s=664597*J.bY(this.a)&536870911
this._hashCode=s
return s},
k(a){return'Symbol("'+A.b(this.a)+'")'},
O(a,b){if(b==null)return!1
return b instanceof A.d3&&this.a==b.a},
$icD:1}
A.ep.prototype={}
A.dn.prototype={}
A.cQ.prototype={
ak(a,b,c){var s=A.A(this)
return A.oK(this,s.c,s.z[1],b,c)},
gA(a){return this.gj(this)===0},
k(a){return A.nv(this)},
m(a,b,c){A.u2()
A.bg(u.g)},
$ih:1}
A.aJ.prototype={
gj(a){return this.a},
v(a){if(typeof a!="string")return!1
if("__proto__"===a)return!1
return this.b.hasOwnProperty(a)},
i(a,b){if(!this.v(b))return null
return this.b[b]},
M(a,b){var s,r,q,p,o=this.c
for(s=o.length,r=this.b,q=0;q<s;++q){p=o[q]
b.$2(p,r[p])}},
gN(){return new A.dW(this,this.$ti.h("dW<1>"))}}
A.dW.prototype={
gH(a){var s=this.a.c
return new J.b4(s,s.length,A.a_(s).h("b4<1>"))},
gj(a){return this.a.c.length}}
A.X.prototype={
aM(){var s,r,q=this,p=q.$map
if(p==null){s=q.$ti
r=A.uc(s.h("1?"))
p=A.uI(A.wt(),r,s.c,s.z[1])
A.pN(q.a,p)
q.$map=p}return p},
v(a){return this.aM().v(a)},
i(a,b){return this.aM().i(0,b)},
M(a,b){this.aM().M(0,b)},
gN(){var s=this.aM()
return new A.aO(s,A.A(s).h("aO<1>"))},
gj(a){return this.aM().a}}
A.hY.prototype={
$1(a){return this.a.b(a)},
$S:14}
A.iJ.prototype={
gcT(){var s=this.a
return s},
gcX(){var s,r,q,p,o=this
if(o.c===1)return B.at
s=o.d
r=s.length-o.e.length-o.f
if(r===0)return B.at
q=[]
for(p=0;p<r;++p)q.push(s[p])
q.fixed$length=Array
q.immutable$list=Array
return q},
gcU(){var s,r,q,p,o,n,m=this
if(m.c!==0)return B.az
s=m.e
r=s.length
q=m.d
p=q.length-r-m.f
if(r===0)return B.az
o=new A.aC(t.eo)
for(n=0;n<r;++n)o.m(0,new A.d3(s[n]),q[p+n])
return new A.dn(o,t.gF)}}
A.k9.prototype={
$2(a,b){var s=this.a
s.b=s.b+"$"+A.b(a)
this.b.push(a)
this.c.push(b);++s.a},
$S:69}
A.lt.prototype={
a9(a){var s,r,q=this,p=new RegExp(q.a).exec(a)
if(p==null)return null
s=Object.create(null)
r=q.b
if(r!==-1)s.arguments=p[r+1]
r=q.c
if(r!==-1)s.argumentsExpr=p[r+1]
r=q.d
if(r!==-1)s.expr=p[r+1]
r=q.e
if(r!==-1)s.method=p[r+1]
r=q.f
if(r!==-1)s.receiver=p[r+1]
return s}}
A.dJ.prototype={
k(a){var s=this.b
if(s==null)return"NoSuchMethodError: "+A.b(this.a)
return"NoSuchMethodError: method not found: '"+s+"' on null"}}
A.f0.prototype={
k(a){var s,r=this,q="NoSuchMethodError: method not found: '",p=r.b
if(p==null)return"NoSuchMethodError: "+A.b(r.a)
s=r.c
if(s==null)return q+p+"' ("+A.b(r.a)+")"
return q+p+"' on '"+s+"' ("+A.b(r.a)+")"}}
A.fx.prototype={
k(a){var s=this.a
return s.length===0?"Error":"Error: "+s}}
A.fh.prototype={
k(a){return"Throw of null ('"+(this.a===null?"null":"undefined")+"' from JavaScript)"},
$ia8:1}
A.dr.prototype={}
A.ed.prototype={
k(a){var s,r=this.b
if(r!=null)return r
r=this.a
s=r!==null&&typeof r==="object"?r.stack:null
return this.b=s==null?"":s},
$ian:1}
A.c7.prototype={
k(a){var s=this.constructor,r=s==null?null:s.name
return"Closure '"+A.q2(r==null?"unknown":r)+"'"},
$iaB:1,
geF(){return this},
$C:"$1",
$R:1,
$D:null}
A.eL.prototype={$C:"$0",$R:0}
A.eM.prototype={$C:"$2",$R:2}
A.ft.prototype={}
A.fq.prototype={
k(a){var s=this.$static_name
if(s==null)return"Closure of unknown static method"
return"Closure '"+A.q2(s)+"'"}}
A.cP.prototype={
O(a,b){if(b==null)return!1
if(this===b)return!0
if(!(b instanceof A.cP))return!1
return this.$_target===b.$_target&&this.a===b.a},
gE(a){return(A.fZ(this.a)^A.d0(this.$_target))>>>0},
k(a){return"Closure '"+A.b(this.$_name)+"' of "+("Instance of '"+A.b(A.ka(this.a))+"'")}}
A.fp.prototype={
k(a){return"RuntimeError: "+this.a}}
A.mm.prototype={}
A.aC.prototype={
gj(a){return this.a},
gA(a){return this.a===0},
gN(){return new A.aO(this,A.A(this).h("aO<1>"))},
gX(){var s=A.A(this)
return A.jQ(new A.aO(this,s.h("aO<1>")),new A.iP(this),s.c,s.z[1])},
v(a){var s,r
if(typeof a=="string"){s=this.b
if(s==null)return!1
return s[a]!=null}else if(typeof a=="number"&&(a&0x3fffffff)===a){r=this.c
if(r==null)return!1
return r[a]!=null}else return this.cM(a)},
cM(a){var s=this.d
if(s==null)return!1
return this.bi(s[this.bh(a)],a)>=0},
i(a,b){var s,r,q,p,o=null
if(typeof b=="string"){s=this.b
if(s==null)return o
r=s[b]
q=r==null?o:r.b
return q}else if(typeof b=="number"&&(b&0x3fffffff)===b){p=this.c
if(p==null)return o
r=p[b]
q=r==null?o:r.b
return q}else return this.cN(b)},
cN(a){var s,r,q=this.d
if(q==null)return null
s=q[this.bh(a)]
r=this.bi(s,a)
if(r<0)return null
return s[r].b},
m(a,b,c){var s,r,q=this
if(typeof b=="string"){s=q.b
q.ca(s==null?q.b=q.bH():s,b,c)}else if(typeof b=="number"&&(b&0x3fffffff)===b){r=q.c
q.ca(r==null?q.c=q.bH():r,b,c)}else q.cO(b,c)},
cO(a,b){var s,r,q,p=this,o=p.d
if(o==null)o=p.d=p.bH()
s=p.bh(a)
r=o[s]
if(r==null)o[s]=[p.bI(a,b)]
else{q=p.bi(r,a)
if(q>=0)r[q].b=b
else r.push(p.bI(a,b))}},
c_(a,b){var s
if(this.v(a))return this.i(0,a)
s=b.$0()
this.m(0,a,s)
return s},
M(a,b){var s=this,r=s.e,q=s.r
for(;r!=null;){b.$2(r.a,r.b)
if(q!==s.r)throw A.d(A.ag(s))
r=r.c}},
ca(a,b,c){var s=a[b]
if(s==null)a[b]=this.bI(b,c)
else s.b=c},
bI(a,b){var s=this,r=new A.jN(a,b)
if(s.e==null)s.e=s.f=r
else s.f=s.f.c=r;++s.a
s.r=s.r+1&1073741823
return r},
bh(a){return J.bY(a)&0x3fffffff},
bi(a,b){var s,r
if(a==null)return-1
s=a.length
for(r=0;r<s;++r)if(J.af(a[r].a,b))return r
return-1},
k(a){return A.nv(this)},
bH(){var s=Object.create(null)
s["<non-identifier-key>"]=s
delete s["<non-identifier-key>"]
return s}}
A.iP.prototype={
$1(a){return this.a.i(0,a)},
$S(){return A.A(this.a).h("2(1)")}}
A.jN.prototype={}
A.aO.prototype={
gj(a){return this.a.a},
gA(a){return this.a.a===0},
gH(a){var s=this.a,r=new A.cx(s,s.r,this.$ti.h("cx<1>"))
r.c=s.e
return r},
G(a,b){return this.a.v(b)}}
A.cx.prototype={
gt(){return this.d},
q(){var s,r=this,q=r.a
if(r.b!==q.r)throw A.d(A.ag(q))
s=r.c
if(s==null){r.d=null
return!1}else{r.d=s.a
r.c=s.c
return!0}},
$iP:1}
A.mX.prototype={
$1(a){return this.a(a)},
$S:30}
A.mY.prototype={
$2(a,b){return this.a(a,b)},
$S:33}
A.mZ.prototype={
$1(a){return this.a(a)},
$S:50}
A.iK.prototype={
k(a){return"RegExp/"+this.a+"/"+this.b.flags},
aT(a){var s
if(typeof a!="string")A.Z(A.cL(a))
s=this.b.exec(a)
if(s==null)return null
return new A.mk(s)}}
A.mk.prototype={}
A.dF.prototype={
dE(a,b,c,d){var s=A.Y(b,0,c,d,null)
throw A.d(s)},
ci(a,b,c,d){if(b>>>0!==b||b>c)this.dE(a,b,c,d)}}
A.d_.prototype={
gj(a){return a.length},
dS(a,b,c,d,e){var s,r,q=a.length
this.ci(a,b,q,"start")
this.ci(a,c,q,"end")
if(b>c)throw A.d(A.Y(b,0,c,null,null))
s=c-b
if(e<0)throw A.d(A.K(e,null))
r=d.length
if(r-e<s)throw A.d(A.d2("Not enough elements"))
if(e!==0||r!==s)d=d.subarray(e,e+s)
a.set(d,b)},
$iav:1}
A.dE.prototype={
i(a,b){A.bo(b,a,a.length)
return a[b]},
m(a,b,c){A.bo(b,a,a.length)
a[b]=c},
$iq:1,
$ij:1,
$io:1}
A.aw.prototype={
m(a,b,c){A.bo(b,a,a.length)
a[b]=c},
a5(a,b,c,d,e){if(t.eB.b(d)){this.dS(a,b,c,d,e)
return}this.dc(a,b,c,d,e)},
d5(a,b,c,d){return this.a5(a,b,c,d,0)},
$iq:1,
$ij:1,
$io:1}
A.f8.prototype={
a1(a,b,c){return new Float32Array(a.subarray(b,A.bR(b,c,a.length)))}}
A.f9.prototype={
a1(a,b,c){return new Float64Array(a.subarray(b,A.bR(b,c,a.length)))}}
A.fa.prototype={
i(a,b){A.bo(b,a,a.length)
return a[b]},
a1(a,b,c){return new Int16Array(a.subarray(b,A.bR(b,c,a.length)))}}
A.fb.prototype={
i(a,b){A.bo(b,a,a.length)
return a[b]},
a1(a,b,c){return new Int32Array(a.subarray(b,A.bR(b,c,a.length)))}}
A.fc.prototype={
i(a,b){A.bo(b,a,a.length)
return a[b]},
a1(a,b,c){return new Int8Array(a.subarray(b,A.bR(b,c,a.length)))}}
A.fd.prototype={
i(a,b){A.bo(b,a,a.length)
return a[b]},
a1(a,b,c){return new Uint16Array(a.subarray(b,A.bR(b,c,a.length)))}}
A.fe.prototype={
i(a,b){A.bo(b,a,a.length)
return a[b]},
a1(a,b,c){return new Uint32Array(a.subarray(b,A.bR(b,c,a.length)))}}
A.dG.prototype={
gj(a){return a.length},
i(a,b){A.bo(b,a,a.length)
return a[b]},
a1(a,b,c){return new Uint8ClampedArray(a.subarray(b,A.bR(b,c,a.length)))}}
A.cy.prototype={
gj(a){return a.length},
i(a,b){A.bo(b,a,a.length)
return a[b]},
a1(a,b,c){return new Uint8Array(a.subarray(b,A.bR(b,c,a.length)))},
$icy:1,
$ia6:1}
A.e7.prototype={}
A.e8.prototype={}
A.e9.prototype={}
A.ea.prototype={}
A.aF.prototype={
h(a){return A.mt(v.typeUniverse,this,a)},
I(a){return A.vG(v.typeUniverse,this,a)}}
A.fK.prototype={}
A.eh.prototype={
k(a){return A.ar(this.a,null)},
$ibk:1}
A.fJ.prototype={
k(a){return this.a}}
A.ei.prototype={$iaG:1}
A.lW.prototype={
$1(a){var s=this.a,r=s.a
s.a=null
r.$0()},
$S:15}
A.lV.prototype={
$1(a){var s,r
this.a.a=a
s=this.b
r=this.c
s.firstChild?s.removeChild(r):s.appendChild(r)},
$S:122}
A.lX.prototype={
$0(){this.a.$0()},
$S:2}
A.lY.prototype={
$0(){this.a.$0()},
$S:2}
A.mr.prototype={
dg(a,b){if(self.setTimeout!=null)self.setTimeout(A.mO(new A.ms(this,b),0),a)
else throw A.d(A.ad("`setTimeout()` not found."))}}
A.ms.prototype={
$0(){this.b.$0()},
$S:1}
A.fD.prototype={
a3(a){var s,r=this
if(!r.b)r.a.ah(a)
else{s=r.a
if(r.$ti.h("a5<1>").b(a))s.cf(a)
else s.bA(a)}},
bK(a,b){var s
if(b==null)b=A.eI(a)
s=this.a
if(this.b)s.aA(a,b)
else s.b5(a,b)}}
A.mx.prototype={
$1(a){return this.a.$2(0,a)},
$S:34}
A.my.prototype={
$2(a,b){this.a.$2(1,new A.dr(a,b))},
$S:42}
A.mN.prototype={
$2(a,b){this.a(a,b)},
$S:48}
A.d7.prototype={
k(a){return"IterationMarker("+this.b+", "+A.b(this.a)+")"}}
A.aH.prototype={
gt(){var s=this.c
if(s==null)return this.b
return s.gt()},
q(){var s,r,q,p,o,n=this
for(;!0;){s=n.c
if(s!=null)if(s.q())return!0
else n.c=null
r=function(a,b,c){var m,l=b
while(true)try{return a(l,m)}catch(k){m=k
l=c}}(n.a,0,1)
if(r instanceof A.d7){q=r.b
if(q===2){p=n.d
if(p==null||p.length===0){n.b=null
return!1}n.a=p.pop()
continue}else{s=r.a
if(q===3)throw s
else{o=J.aA(s)
if(o instanceof A.aH){s=n.d
if(s==null)s=n.d=[]
s.push(n.a)
n.a=o.a
continue}else{n.c=o
continue}}}}else{n.b=r
return!0}}return!1},
$iP:1}
A.eg.prototype={
gH(a){return new A.aH(this.a(),this.$ti.h("aH<1>"))}}
A.eH.prototype={
k(a){return A.b(this.a)},
$iH:1,
gb2(){return this.b}}
A.fG.prototype={
bK(a,b){var s
A.bU(a,"error",t.K)
s=this.a
if((s.a&30)!==0)throw A.d(A.d2("Future already completed"))
if(b==null)b=A.eI(a)
s.b5(a,b)},
R(a){return this.bK(a,null)}}
A.ay.prototype={
a3(a){var s=this.a
if((s.a&30)!==0)throw A.d(A.d2("Future already completed"))
s.ah(a)},
bd(){return this.a3(null)}}
A.bN.prototype={
ec(a){if((this.c&15)!==6)return!0
return this.b.b.c2(this.d,a.a)},
e7(a){var s,r=this.e,q=null,p=this.b.b
if(t.C.b(r))q=p.el(r,a.a,a.b)
else q=p.c2(r,a.a)
try{p=q
return p}catch(s){if(t.eK.b(A.M(s))){if((this.c&1)!==0)throw A.d(A.K("The error handler of Future.then must return a value of the returned future's type","onError"))
throw A.d(A.K("The error handler of Future.catchError must return a value of the future's type","onError"))}else throw s}}}
A.C.prototype={
au(a,b,c,d){var s,r,q=$.B
if(q===B.i){if(c!=null&&!t.C.b(c)&&!t.v.b(c))throw A.d(A.h7(c,"onError",u.c))}else if(c!=null)c=A.wA(c,q)
s=new A.C(q,d.h("C<0>"))
r=c==null?1:3
this.b4(new A.bN(s,r,b,c,this.$ti.h("@<1>").I(d).h("bN<1,2>")))
return s},
d1(a,b,c){return this.au(a,b,null,c)},
cz(a,b,c){var s=new A.C($.B,c.h("C<0>"))
this.b4(new A.bN(s,3,a,b,this.$ti.h("@<1>").I(c).h("bN<1,2>")))
return s},
bp(a){var s=this.$ti,r=new A.C($.B,s)
this.b4(new A.bN(r,8,a,null,s.h("@<1>").I(s.c).h("bN<1,2>")))
return r},
dQ(a){this.a=this.a&1|16
this.c=a},
by(a){this.a=a.a&30|this.a&1
this.c=a.c},
b4(a){var s=this,r=s.a
if(r<=3){a.a=s.c
s.c=a}else{if((r&4)!==0){r=s.c
if((r.a&24)===0){r.b4(a)
return}s.by(r)}A.cI(null,null,s.b,new A.m3(s,a))}},
cs(a){var s,r,q,p,o,n=this,m={}
m.a=a
if(a==null)return
s=n.a
if(s<=3){r=n.c
n.c=a
if(r!=null){q=a.a
for(p=a;q!=null;p=q,q=o)o=q.a
p.a=r}}else{if((s&4)!==0){s=n.c
if((s.a&24)===0){s.cs(a)
return}n.by(s)}m.a=n.bc(a)
A.cI(null,null,n.b,new A.ma(m,n))}},
bb(){var s=this.c
this.c=null
return this.bc(s)},
bc(a){var s,r,q
for(s=a,r=null;s!=null;r=s,s=q){q=s.a
s.a=r}return r},
ce(a){var s,r,q,p=this
p.a^=2
try{a.au(0,new A.m6(p),new A.m7(p),t.P)}catch(q){s=A.M(q)
r=A.aS(q)
A.q_(new A.m8(p,s,r))}},
bA(a){var s=this,r=s.bb()
s.a=8
s.c=a
A.d6(s,r)},
aA(a,b){var s=this.bb()
this.dQ(A.h9(a,b))
A.d6(this,s)},
ah(a){if(this.$ti.h("a5<1>").b(a)){this.cf(a)
return}this.dk(a)},
dk(a){this.a^=2
A.cI(null,null,this.b,new A.m5(this,a))},
cf(a){var s=this
if(s.$ti.b(a)){if((a.a&16)!==0){s.a^=2
A.cI(null,null,s.b,new A.m9(s,a))}else A.nz(a,s)
return}s.ce(a)},
b5(a,b){this.a^=2
A.cI(null,null,this.b,new A.m4(this,a,b))},
$ia5:1}
A.m3.prototype={
$0(){A.d6(this.a,this.b)},
$S:1}
A.ma.prototype={
$0(){A.d6(this.b,this.a.a)},
$S:1}
A.m6.prototype={
$1(a){var s,r,q,p=this.a
p.a^=2
try{p.bA(p.$ti.c.a(a))}catch(q){s=A.M(q)
r=A.aS(q)
p.aA(s,r)}},
$S:15}
A.m7.prototype={
$2(a,b){this.a.aA(a,b)},
$S:52}
A.m8.prototype={
$0(){this.a.aA(this.b,this.c)},
$S:1}
A.m5.prototype={
$0(){this.a.bA(this.b)},
$S:1}
A.m9.prototype={
$0(){A.nz(this.b,this.a)},
$S:1}
A.m4.prototype={
$0(){this.a.aA(this.b,this.c)},
$S:1}
A.md.prototype={
$0(){var s,r,q,p,o,n,m=this,l=null
try{q=m.a.a
l=q.b.b.cZ(q.d)}catch(p){s=A.M(p)
r=A.aS(p)
if(m.c){q=m.b.a.c.a
o=s
o=q==null?o==null:q===o
q=o}else q=!1
o=m.a
if(q)o.c=m.b.a.c
else o.c=A.h9(s,r)
o.b=!0
return}if(l instanceof A.C&&(l.a&24)!==0){if((l.a&16)!==0){q=m.a
q.c=l.c
q.b=!0}return}if(t.d.b(l)){n=m.b.a
q=m.a
q.c=J.tH(l,new A.me(n),t.z)
q.b=!1}},
$S:1}
A.me.prototype={
$1(a){return this.a},
$S:53}
A.mc.prototype={
$0(){var s,r,q,p,o
try{q=this.a
p=q.a
q.c=p.b.b.c2(p.d,this.b)}catch(o){s=A.M(o)
r=A.aS(o)
q=this.a
q.c=A.h9(s,r)
q.b=!0}},
$S:1}
A.mb.prototype={
$0(){var s,r,q,p,o,n,m,l,k=this
try{s=k.a.a.c
p=k.b
if(p.a.ec(s)&&p.a.e!=null){p.c=p.a.e7(s)
p.b=!1}}catch(o){r=A.M(o)
q=A.aS(o)
p=k.a.a.c
n=p.a
m=r
l=k.b
if(n==null?m==null:n===m)l.c=p
else l.c=A.h9(r,q)
l.b=!0}},
$S:1}
A.fE.prototype={}
A.bi.prototype={
gj(a){var s={},r=new A.C($.B,t.fJ)
s.a=0
this.bU(new A.lp(s,this),!0,new A.lq(s,r),r.gdq())
return r}}
A.ln.prototype={
$1(a){var s=this.a
s.aJ(a)
s.aK()},
$S(){return this.b.h("l(0)")}}
A.lo.prototype={
$2(a,b){var s=this.a
s.b3(a,b)
s.aK()},
$S:55}
A.lp.prototype={
$1(a){++this.a.a},
$S(){return this.b.$ti.h("~(1)")}}
A.lq.prototype={
$0(){var s=this.b,r=this.a.a,q=s.bb()
s.a=8
s.c=r
A.d6(s,q)},
$S:1}
A.fr.prototype={}
A.da.prototype={
gdL(){if((this.b&8)===0)return this.a
return this.a.gc5()},
b6(){var s,r=this
if((r.b&8)===0){s=r.a
return s==null?r.a=new A.eb():s}s=r.a.gc5()
return s},
gaD(){var s=this.a
return(this.b&8)!==0?s.gc5():s},
bv(){if((this.b&4)!==0)return new A.bJ("Cannot add event after closing")
return new A.bJ("Cannot add event while adding a stream")},
ck(){var s=this.c
if(s==null)s=this.c=(this.b&2)!==0?$.h0():new A.C($.B,t.D)
return s},
C(a,b){if(this.b>=4)throw A.d(this.bv())
this.aJ(b)},
a7(){var s=this,r=s.b
if((r&4)!==0)return s.ck()
if(r>=4)throw A.d(s.bv())
s.aK()
return s.ck()},
aK(){var s=this.b|=4
if((s&1)!==0)this.aO()
else if((s&3)===0)this.b6().C(0,B.M)},
aJ(a){var s=this.b
if((s&1)!==0)this.aC(a)
else if((s&3)===0)this.b6().C(0,new A.cG(a))},
b3(a,b){var s=this.b
if((s&1)!==0)this.aP(a,b)
else if((s&3)===0)this.b6().C(0,new A.dY(a,b))},
dV(a,b,c,d){var s,r,q,p,o,n,m=this
if((m.b&3)!==0)throw A.d(A.d2("Stream has already been listened to."))
s=$.B
r=d?1:0
q=A.vn(s,b)
p=new A.dX(m,a,q,c,s,r)
o=m.gdL()
s=m.b|=1
if((s&8)!==0){n=m.a
n.sc5(p)
n.ar()}else m.a=p
p.dR(o)
p.bF(new A.mq(m))
return p},
dN(a){var s,r,q,p,o,n,m,l=this,k=null
if((l.b&8)!==0)k=l.a.K()
l.a=null
l.b=l.b&4294967286|2
s=l.r
if(s!=null)if(k==null)try{r=s.$0()
if(t.bq.b(r))k=r}catch(o){q=A.M(o)
p=A.aS(o)
n=new A.C($.B,t.D)
n.b5(q,p)
k=n}else k=k.bp(s)
m=new A.mp(l)
if(k!=null)k=k.bp(m)
else m.$0()
return k}}
A.mq.prototype={
$0(){A.nM(this.a.d)},
$S:1}
A.mp.prototype={
$0(){var s=this.a.c
if(s!=null&&(s.a&30)===0)s.ah(null)},
$S:1}
A.fS.prototype={
aC(a){this.gaD().aJ(a)},
aP(a,b){this.gaD().b3(a,b)},
aO(){this.gaD().dn()}}
A.fF.prototype={
aC(a){this.gaD().az(new A.cG(a))},
aP(a,b){this.gaD().az(new A.dY(a,b))},
aO(){this.gaD().az(B.M)}}
A.aZ.prototype={}
A.db.prototype={}
A.aj.prototype={
gE(a){return(A.d0(this.a)^892482866)>>>0},
O(a,b){if(b==null)return!1
if(this===b)return!0
return b instanceof A.aj&&b.a===this.a}}
A.dX.prototype={
cp(){return this.w.dN(this)},
b9(){var s=this.w
if((s.b&8)!==0)s.a.aZ()
A.nM(s.e)},
ba(){var s=this.w
if((s.b&8)!==0)s.a.ar()
A.nM(s.f)}}
A.dT.prototype={
dR(a){var s=this
if(a==null)return
s.r=a
if(a.c!=null){s.e=(s.e|64)>>>0
a.b1(s)}},
cW(a){var s,r,q=this,p=q.e
if((p&8)!==0)return
s=(p+128|4)>>>0
q.e=s
if(p<128){r=q.r
if(r!=null)if(r.a===1)r.a=3}if((p&4)===0&&(s&32)===0)q.bF(q.gcq())},
aZ(){return this.cW(null)},
ar(){var s=this,r=s.e
if((r&8)!==0)return
if(r>=128){r=s.e=r-128
if(r<128)if((r&64)!==0&&s.r.c!=null)s.r.b1(s)
else{r=(r&4294967291)>>>0
s.e=r
if((r&32)===0)s.bF(s.gcr())}}},
K(){var s=this,r=(s.e&4294967279)>>>0
s.e=r
if((r&8)===0)s.bw()
r=s.f
return r==null?$.h0():r},
bw(){var s,r=this,q=r.e=(r.e|8)>>>0
if((q&64)!==0){s=r.r
if(s.a===1)s.a=3}if((q&32)===0)r.r=null
r.f=r.cp()},
aJ(a){var s=this.e
if((s&8)!==0)return
if(s<32)this.aC(a)
else this.az(new A.cG(a))},
b3(a,b){var s=this.e
if((s&8)!==0)return
if(s<32)this.aP(a,b)
else this.az(new A.dY(a,b))},
dn(){var s=this,r=s.e
if((r&8)!==0)return
r=(r|2)>>>0
s.e=r
if(r<32)s.aO()
else s.az(B.M)},
b9(){},
ba(){},
cp(){return null},
az(a){var s,r=this,q=r.r
if(q==null)q=r.r=new A.eb()
q.C(0,a)
s=r.e
if((s&64)===0){s=(s|64)>>>0
r.e=s
if(s<128)q.b1(r)}},
aC(a){var s=this,r=s.e
s.e=(r|32)>>>0
s.d.d0(s.a,a)
s.e=(s.e&4294967263)>>>0
s.bx((r&4)!==0)},
aP(a,b){var s,r=this,q=r.e,p=new A.m0(r,a,b)
if((q&1)!==0){r.e=(q|16)>>>0
r.bw()
s=r.f
if(s!=null&&s!==$.h0())s.bp(p)
else p.$0()}else{p.$0()
r.bx((q&4)!==0)}},
aO(){var s,r=this,q=new A.m_(r)
r.bw()
r.e=(r.e|16)>>>0
s=r.f
if(s!=null&&s!==$.h0())s.bp(q)
else q.$0()},
bF(a){var s=this,r=s.e
s.e=(r|32)>>>0
a.$0()
s.e=(s.e&4294967263)>>>0
s.bx((r&4)!==0)},
bx(a){var s,r,q=this,p=q.e
if((p&64)!==0&&q.r.c==null){p=q.e=(p&4294967231)>>>0
if((p&4)!==0)if(p<128){s=q.r
s=s==null?null:s.c==null
s=s!==!1}else s=!1
else s=!1
if(s){p=(p&4294967291)>>>0
q.e=p}}for(;!0;a=r){if((p&8)!==0){q.r=null
return}r=(p&4)!==0
if(a===r)break
q.e=(p^32)>>>0
if(r)q.b9()
else q.ba()
p=(q.e&4294967263)>>>0
q.e=p}if((p&64)!==0&&p<128)q.r.b1(q)}}
A.m0.prototype={
$0(){var s,r,q=this.a,p=q.e
if((p&8)!==0&&(p&16)===0)return
q.e=(p|32)>>>0
s=q.b
p=this.b
r=q.d
if(t.k.b(s))r.eo(s,p,this.c)
else r.d0(s,p)
q.e=(q.e&4294967263)>>>0},
$S:1}
A.m_.prototype={
$0(){var s=this.a,r=s.e
if((r&16)===0)return
s.e=(r|42)>>>0
s.d.d_(s.c)
s.e=(s.e&4294967263)>>>0},
$S:1}
A.ee.prototype={
bU(a,b,c,d){return this.a.dV(a,d,c,b===!0)},
bT(a,b,c){return this.bU(a,null,b,c)},
ea(a,b){return this.bU(a,null,b,null)}}
A.fI.prototype={
gaG(){return this.a},
saG(a){return this.a=a}}
A.cG.prototype={
bY(a){a.aC(this.b)}}
A.dY.prototype={
bY(a){a.aP(this.b,this.c)}}
A.m1.prototype={
bY(a){a.aO()},
gaG(){return null},
saG(a){throw A.d(A.d2("No events after a done."))}}
A.eb.prototype={
b1(a){var s=this,r=s.a
if(r===1)return
if(r>=1){s.a=1
return}A.q_(new A.ml(s,a))
s.a=1},
C(a,b){var s=this,r=s.c
if(r==null)s.b=s.c=b
else{r.saG(b)
s.c=b}}}
A.ml.prototype={
$0(){var s,r,q=this.a,p=q.a
q.a=0
if(p===3)return
s=q.b
r=s.gaG()
q.b=r
if(r==null)q.c=null
s.bY(this.b)},
$S:1}
A.fQ.prototype={}
A.mw.prototype={}
A.mK.prototype={
$0(){A.u8(this.a,this.b)
A.bg(u.g)},
$S:1}
A.mn.prototype={
d_(a){var s,r,q
try{if(B.i===$.B){a.$0()
return}A.pC(null,null,this,a)}catch(q){s=A.M(q)
r=A.aS(q)
A.dh(s,r)}},
eq(a,b){var s,r,q
try{if(B.i===$.B){a.$1(b)
return}A.pE(null,null,this,a,b)}catch(q){s=A.M(q)
r=A.aS(q)
A.dh(s,r)}},
d0(a,b){return this.eq(a,b,t.z)},
en(a,b,c){var s,r,q
try{if(B.i===$.B){a.$2(b,c)
return}A.pD(null,null,this,a,b,c)}catch(q){s=A.M(q)
r=A.aS(q)
A.dh(s,r)}},
eo(a,b,c){return this.en(a,b,c,t.z,t.z)},
cB(a){return new A.mo(this,a)},
ek(a){if($.B===B.i)return a.$0()
return A.pC(null,null,this,a)},
cZ(a){return this.ek(a,t.z)},
ep(a,b){if($.B===B.i)return a.$1(b)
return A.pE(null,null,this,a,b)},
c2(a,b){return this.ep(a,b,t.z,t.z)},
em(a,b,c){if($.B===B.i)return a.$2(b,c)
return A.pD(null,null,this,a,b,c)},
el(a,b,c){return this.em(a,b,c,t.z,t.z,t.z)},
eh(a){return a},
c1(a){return this.eh(a,t.z,t.z,t.z)}}
A.mo.prototype={
$0(){return this.a.d_(this.b)},
$S:1}
A.e1.prototype={
gj(a){return this.a},
gA(a){return this.a===0},
gN(){return new A.e2(this,this.$ti.h("e2<1>"))},
v(a){var s,r
if(typeof a=="string"&&a!=="__proto__"){s=this.b
return s==null?!1:s[a]!=null}else if(typeof a=="number"&&(a&1073741823)===a){r=this.c
return r==null?!1:r[a]!=null}else return this.dt(a)},
dt(a){var s=this.d
if(s==null)return!1
return this.an(this.cl(s,a),a)>=0},
i(a,b){var s,r,q
if(typeof b=="string"&&b!=="__proto__"){s=this.b
r=s==null?null:A.pe(s,b)
return r}else if(typeof b=="number"&&(b&1073741823)===b){q=this.c
r=q==null?null:A.pe(q,b)
return r}else return this.dw(b)},
dw(a){var s,r,q=this.d
if(q==null)return null
s=this.cl(q,a)
r=this.an(s,a)
return r<0?null:s[r+1]},
m(a,b,c){var s,r,q,p,o,n=this
if(typeof b=="string"&&b!=="__proto__"){s=n.b
n.dj(s==null?n.b=A.pf():s,b,c)}else{r=n.d
if(r==null)r=n.d=A.pf()
q=A.fZ(b)&1073741823
p=r[q]
if(p==null){A.nA(r,q,[b,c]);++n.a
n.e=null}else{o=n.an(p,b)
if(o>=0)p[o+1]=c
else{p.push(b,c);++n.a
n.e=null}}}},
M(a,b){var s,r,q,p=this,o=p.cj()
for(s=o.length,r=0;r<s;++r){q=o[r]
b.$2(q,p.i(0,q))
if(o!==p.e)throw A.d(A.ag(p))}},
cj(){var s,r,q,p,o,n,m,l,k,j,i=this,h=i.e
if(h!=null)return h
h=A.U(i.a,null,!1,t.z)
s=i.b
if(s!=null){r=Object.getOwnPropertyNames(s)
q=r.length
for(p=0,o=0;o<q;++o){h[p]=r[o];++p}}else p=0
n=i.c
if(n!=null){r=Object.getOwnPropertyNames(n)
q=r.length
for(o=0;o<q;++o){h[p]=+r[o];++p}}m=i.d
if(m!=null){r=Object.getOwnPropertyNames(m)
q=r.length
for(o=0;o<q;++o){l=m[r[o]]
k=l.length
for(j=0;j<k;j+=2){h[p]=l[j];++p}}}return i.e=h},
dj(a,b,c){if(a[b]==null){++this.a
this.e=null}A.nA(a,b,c)},
cl(a,b){return a[A.fZ(b)&1073741823]}}
A.e4.prototype={
an(a,b){var s,r,q
if(a==null)return-1
s=a.length
for(r=0;r<s;r+=2){q=a[r]
if(q==null?b==null:q===b)return r}return-1}}
A.e2.prototype={
gj(a){return this.a.a},
gA(a){return this.a.a===0},
gH(a){var s=this.a
return new A.e3(s,s.cj(),this.$ti.h("e3<1>"))},
G(a,b){return this.a.v(b)}}
A.e3.prototype={
gt(){return this.d},
q(){var s=this,r=s.b,q=s.c,p=s.a
if(r!==p.e)throw A.d(A.ag(p))
else if(q>=r.length){s.d=null
return!1}else{s.d=r[q]
s.c=q+1
return!0}},
$iP:1}
A.e5.prototype={
i(a,b){if(!this.y.$1(b))return null
return this.d8(b)},
m(a,b,c){this.d9(b,c)},
v(a){if(!this.y.$1(a))return!1
return this.d7(a)},
bh(a){return this.x.$1(a)&1073741823},
bi(a,b){var s,r,q
if(a==null)return-1
s=a.length
for(r=this.w,q=0;q<s;++q)if(r.$2(a[q].a,b))return q
return-1}}
A.mi.prototype={
$1(a){return this.a.b(a)},
$S:63}
A.b_.prototype={
gH(a){var s=this,r=new A.cH(s,s.r,A.A(s).h("cH<1>"))
r.c=s.e
return r},
gj(a){return this.a},
gA(a){return this.a===0},
ga8(a){return this.a!==0},
G(a,b){var s,r
if(typeof b=="string"&&b!=="__proto__"){s=this.b
if(s==null)return!1
return s[b]!=null}else if(typeof b=="number"&&(b&1073741823)===b){r=this.c
if(r==null)return!1
return r[b]!=null}else return this.ds(b)},
ds(a){var s=this.d
if(s==null)return!1
return this.an(s[this.bB(a)],a)>=0},
C(a,b){var s,r,q=this
if(typeof b=="string"&&b!=="__proto__"){s=q.b
return q.cc(s==null?q.b=A.nC():s,b)}else if(typeof b=="number"&&(b&1073741823)===b){r=q.c
return q.cc(r==null?q.c=A.nC():r,b)}else return q.dh(b)},
dh(a){var s,r,q=this,p=q.d
if(p==null)p=q.d=A.nC()
s=q.bB(a)
r=p[s]
if(r==null)p[s]=[q.bz(a)]
else{if(q.an(r,a)>=0)return!1
r.push(q.bz(a))}return!0},
ei(a,b){var s=this
if(typeof b=="string"&&b!=="__proto__")return s.ct(s.b,b)
else if(typeof b=="number"&&(b&1073741823)===b)return s.ct(s.c,b)
else return s.dO(b)},
dO(a){var s,r,q,p,o=this,n=o.d
if(n==null)return!1
s=o.bB(a)
r=n[s]
q=o.an(r,a)
if(q<0)return!1
p=r.splice(q,1)[0]
if(0===r.length)delete n[s]
o.cA(p)
return!0},
dv(a,b){var s,r,q,p,o=this,n=o.e
for(;n!=null;n=r){s=n.a
r=n.b
q=o.r
p=a.$1(s)
if(q!==o.r)throw A.d(A.ag(o))
if(!1===p)o.ei(0,s)}},
P(a){var s=this
if(s.a>0){s.b=s.c=s.d=s.e=s.f=null
s.a=0
s.bG()}},
cc(a,b){if(a[b]!=null)return!1
a[b]=this.bz(b)
return!0},
ct(a,b){var s
if(a==null)return!1
s=a[b]
if(s==null)return!1
this.cA(s)
delete a[b]
return!0},
bG(){this.r=this.r+1&1073741823},
bz(a){var s,r=this,q=new A.mj(a)
if(r.e==null)r.e=r.f=q
else{s=r.f
s.toString
q.c=s
r.f=s.b=q}++r.a
r.bG()
return q},
cA(a){var s=this,r=a.c,q=a.b
if(r==null)s.e=q
else r.b=q
if(q==null)s.f=r
else q.c=r;--s.a
s.bG()},
bB(a){return J.bY(a)&1073741823},
an(a,b){var s,r
if(a==null)return-1
s=a.length
for(r=0;r<s;++r)if(J.af(a[r].a,b))return r
return-1}}
A.mj.prototype={}
A.cH.prototype={
gt(){return this.d},
q(){var s=this,r=s.c,q=s.a
if(s.b!==q.r)throw A.d(A.ag(q))
else if(r==null){s.d=null
return!1}else{s.d=r.a
s.c=r.b
return!0}},
$iP:1}
A.aX.prototype={
aj(a,b){return new A.aX(J.nn(this.a,b),b.h("aX<0>"))},
gj(a){return J.a3(this.a)},
i(a,b){return J.eD(this.a,b)}}
A.dw.prototype={}
A.dA.prototype={$iq:1,$ij:1,$io:1}
A.p.prototype={
gH(a){return new A.aa(a,this.gj(a),A.ak(a).h("aa<p.E>"))},
V(a,b){return this.i(a,b)},
gA(a){return this.gj(a)===0},
ga8(a){return!this.gA(a)},
gcH(a){if(this.gj(a)===0)throw A.d(A.nq())
return this.i(a,0)},
G(a,b){var s,r=this.gj(a)
for(s=0;s<r;++s){if(J.af(this.i(a,s),b))return!0
if(r!==this.gj(a))throw A.d(A.ag(a))}return!1},
be(a,b){var s,r=this.gj(a)
for(s=0;s<r;++s){if(!b.$1(this.i(a,s)))return!1
if(r!==this.gj(a))throw A.d(A.ag(a))}return!0},
aR(a,b){var s,r=this.gj(a)
for(s=0;s<r;++s){if(b.$1(this.i(a,s)))return!0
if(r!==this.gj(a))throw A.d(A.ag(a))}return!1},
al(a,b,c){return new A.ab(a,b,A.ak(a).h("@<p.E>").I(c).h("ab<1,2>"))},
a6(a,b){return A.dQ(a,b,null,A.ak(a).h("p.E"))},
b_(a,b){var s,r,q,p,o=this
if(o.gA(a)){s=J.b8(0,A.ak(a).h("p.E"))
return s}r=o.i(a,0)
q=A.U(o.gj(a),r,!1,A.ak(a).h("p.E"))
for(p=1;p<o.gj(a);++p)q[p]=o.i(a,p)
return q},
c3(a){var s,r=A.oH(A.ak(a).h("p.E"))
for(s=0;s<this.gj(a);++s)r.C(0,this.i(a,s))
return r},
C(a,b){var s=this.gj(a)
this.sj(a,s+1)
this.m(a,s,b)},
aj(a,b){return new A.b5(a,A.ak(a).h("@<p.E>").I(b).h("b5<1,2>"))},
a1(a,b,c){var s=this.gj(a)
A.aQ(b,c,s)
return A.uK(this.b0(a,b,c),A.ak(a).h("p.E"))},
b0(a,b,c){A.aQ(b,c,this.gj(a))
return A.dQ(a,b,c,A.ak(a).h("p.E"))},
e5(a,b,c,d){var s
A.aQ(b,c,this.gj(a))
for(s=b;s<c;++s)this.m(a,s,d)},
a5(a,b,c,d,e){var s,r,q,p,o
A.aQ(b,c,this.gj(a))
s=c-b
if(s===0)return
A.aW(e,"skipCount")
if(A.ak(a).h("o<p.E>").b(d)){r=e
q=d}else{q=J.op(d,e).b_(0,!1)
r=0}p=J.V(q)
if(r+s>p.gj(q))throw A.d(A.ui())
if(r<b)for(o=s-1;o>=0;--o)this.m(a,b+o,p.i(q,r+o))
else for(o=0;o<s;++o)this.m(a,b+o,p.i(q,r+o))},
bR(a,b){var s
for(s=0;s<this.gj(a);++s)if(J.af(this.i(a,s),b))return s
return-1},
k(a){return A.iI(a,"[","]")}}
A.dB.prototype={}
A.jO.prototype={
$2(a,b){var s,r=this.a
if(!r.a)this.b.a+=", "
r.a=!1
r=this.b
s=r.a+=A.b(a)
r.a=s+": "
r.a+=A.b(b)},
$S:64}
A.I.prototype={
ak(a,b,c){var s=A.A(this)
return A.oK(this,s.h("I.K"),s.h("I.V"),b,c)},
M(a,b){var s,r
for(s=this.gN(),s=s.gH(s);s.q();){r=s.gt()
b.$2(r,this.i(0,r))}},
ge4(){return this.gN().al(0,new A.jP(this),A.A(this).h("cY<I.K,I.V>"))},
v(a){return this.gN().G(0,a)},
gj(a){var s=this.gN()
return s.gj(s)},
gA(a){var s=this.gN()
return s.gA(s)},
k(a){return A.nv(this)},
$ih:1}
A.jP.prototype={
$1(a){var s=this.a,r=A.A(s)
return new A.cY(a,s.i(0,a),r.h("@<I.K>").I(r.h("I.V")).h("cY<1,2>"))},
$S(){return A.A(this.a).h("cY<I.K,I.V>(I.K)")}}
A.fU.prototype={
m(a,b,c){throw A.d(A.ad("Cannot modify unmodifiable map"))}}
A.dC.prototype={
ak(a,b,c){return this.a.ak(0,b,c)},
i(a,b){return this.a.i(0,b)},
m(a,b,c){this.a.m(0,b,c)},
v(a){return this.a.v(a)},
M(a,b){this.a.M(0,b)},
gA(a){var s=this.a
return s.gA(s)},
gj(a){var s=this.a
return s.gj(s)},
gN(){return this.a.gN()},
k(a){return this.a.k(0)},
$ih:1}
A.bm.prototype={
ak(a,b,c){return new A.bm(this.a.ak(0,b,c),b.h("@<0>").I(c).h("bm<1,2>"))}}
A.dM.prototype={
gA(a){return this.a===0},
ga8(a){return this.a!==0},
D(a,b){var s
for(s=J.aA(b);s.q();)this.C(0,s.gt())},
al(a,b,c){return new A.c9(this,b,A.A(this).h("@<1>").I(c).h("c9<1,2>"))},
k(a){return A.iI(this,"{","}")},
be(a,b){var s
for(s=A.nB(this,this.r,A.A(this).c);s.q();)if(!b.$1(s.d))return!1
return!0},
a6(a,b){return A.p0(this,b,A.A(this).c)},
bf(a,b,c){var s,r
for(s=A.nB(this,this.r,A.A(this).c);s.q();){r=s.d
if(b.$1(r))return r}return c.$0()},
V(a,b){var s,r,q,p=this,o="index"
A.bU(b,o,t.S)
A.aW(b,o)
for(s=A.nB(p,p.r,A.A(p).c),r=0;s.q();){q=s.d
if(b===r)return q;++r}throw A.d(A.eW(b,r,p,null,o))}}
A.ec.prototype={$iq:1,$ij:1,$id1:1}
A.e6.prototype={}
A.em.prototype={}
A.eq.prototype={}
A.fM.prototype={
i(a,b){var s,r=this.b
if(r==null)return this.c.i(0,b)
else if(typeof b!="string")return null
else{s=r[b]
return typeof s=="undefined"?this.dM(b):s}},
gj(a){return this.b==null?this.c.a:this.aL().length},
gA(a){return this.gj(this)===0},
gN(){if(this.b==null){var s=this.c
return new A.aO(s,A.A(s).h("aO<1>"))}return new A.fN(this)},
m(a,b,c){var s,r,q=this
if(q.b==null)q.c.m(0,b,c)
else if(q.v(b)){s=q.b
s[b]=c
r=q.a
if(r==null?s!=null:r!==s)r[b]=null}else q.dW().m(0,b,c)},
v(a){if(this.b==null)return this.c.v(a)
if(typeof a!="string")return!1
return Object.prototype.hasOwnProperty.call(this.a,a)},
M(a,b){var s,r,q,p,o=this
if(o.b==null)return o.c.M(0,b)
s=o.aL()
for(r=0;r<s.length;++r){q=s[r]
p=o.b[q]
if(typeof p=="undefined"){p=A.mA(o.a[q])
o.b[q]=p}b.$2(q,p)
if(s!==o.c)throw A.d(A.ag(o))}},
aL(){var s=this.c
if(s==null)s=this.c=A.a(Object.keys(this.a),t.s)
return s},
dW(){var s,r,q,p,o,n=this
if(n.b==null)return n.c
s=A.a9(t.R,t.z)
r=n.aL()
for(q=0;p=r.length,q<p;++q){o=r[q]
s.m(0,o,n.i(0,o))}if(p===0)r.push("")
else B.d.P(r)
n.a=n.b=null
return n.c=s},
dM(a){var s
if(!Object.prototype.hasOwnProperty.call(this.a,a))return null
s=A.mA(this.a[a])
return this.b[a]=s}}
A.fN.prototype={
gj(a){var s=this.a
return s.gj(s)},
V(a,b){var s=this.a
return s.b==null?s.gN().V(0,b):s.aL()[b]},
gH(a){var s=this.a
if(s.b==null){s=s.gN()
s=s.gH(s)}else{s=s.aL()
s=new J.b4(s,s.length,A.a_(s).h("b4<1>"))}return s},
G(a,b){return this.a.v(b)}}
A.mh.prototype={
a7(){var s,r,q,p=this
p.de()
s=p.a
r=s.a
s.a=""
s=p.c
q=s.b
q.push(A.pB(r.charCodeAt(0)==0?r:r,p.b))
s.a.$1(q)}}
A.lD.prototype={
$0(){var s,r
try{s=new TextDecoder("utf-8",{fatal:true})
return s}catch(r){}return null},
$S:7}
A.lC.prototype={
$0(){var s,r
try{s=new TextDecoder("utf-8",{fatal:false})
return s}catch(r){}return null},
$S:7}
A.ha.prototype={
ee(a,b,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c="Invalid base64 encoding length "
a0=A.aQ(b,a0,a.length)
s=$.ok()
for(r=b,q=r,p=null,o=-1,n=-1,m=0;r<a0;r=l){l=r+1
k=B.a.J(a,r)
if(k===37){j=l+2
if(j<=a0){i=A.pW(a,l)
if(i===37)i=-1
l=j}else i=-1}else i=k
if(0<=i&&i<=127){h=s[i]
if(h>=0){i=B.a.B("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",h)
if(i===k)continue
k=i}else{if(h===-1){if(o<0){g=p==null?null:p.a.length
if(g==null)g=0
o=g+(r-q)
n=r}++m
if(k===61)continue}k=i}if(h!==-2){if(p==null){p=new A.ac("")
g=p}else g=p
f=g.a+=B.a.u(a,q,r)
g.a=f+A.be(k)
q=l
continue}}throw A.d(A.R("Invalid base64 data",a,r))}if(p!=null){g=p.a+=B.a.u(a,q,a0)
f=g.length
if(o>=0)A.os(a,n,a0,o,m,f)
else{e=B.c.br(f-1,4)+1
if(e===1)throw A.d(A.R(c,a,a0))
for(;e<4;){g+="="
p.a=g;++e}}g=p.a
return B.a.aH(a,b,a0,g.charCodeAt(0)==0?g:g)}d=a0-b
if(o>=0)A.os(a,n,a0,o,m,d)
else{e=B.c.br(d,4)
if(e===1)throw A.d(A.R(c,a,a0))
if(e>1)a=B.a.aH(a,a0,a0,e===2?"==":"=")}return a}}
A.hc.prototype={}
A.hb.prototype={
e0(a,b){var s,r,q,p=A.aQ(b,null,a.length)
if(b===p)return new Uint8Array(0)
s=new A.lZ()
r=s.e2(a,b,p)
r.toString
q=s.a
if(q<-1)A.Z(A.R("Missing padding character",a,p))
if(q>0)A.Z(A.R("Invalid length, must be multiple of four",a,p))
s.a=-1
return r}}
A.lZ.prototype={
e2(a,b,c){var s,r=this,q=r.a
if(q<0){r.a=A.pc(a,b,c,q)
return null}if(b===c)return new Uint8Array(0)
s=A.vk(a,b,c,q)
r.a=A.vm(a,b,c,s,0,r.a)
return s}}
A.hd.prototype={}
A.eJ.prototype={}
A.fO.prototype={}
A.eN.prototype={}
A.eP.prototype={}
A.hW.prototype={}
A.iQ.prototype={
e1(a){var s=A.pB(a,this.gcF().a)
return s},
gcF(){return B.c4}}
A.iR.prototype={}
A.lr.prototype={}
A.ls.prototype={}
A.ef.prototype={
a7(){}}
A.mu.prototype={
a7(){this.a.e6(this.c)
this.b.a7()},
dX(a,b,c,d){this.c.a+=this.a.cE(a,b,c,!1)}}
A.lA.prototype={}
A.lB.prototype={
e_(a){var s=this.a,r=A.ve(s,a,0,null)
if(r!=null)return r
return new A.fV(s).cE(a,0,null,!0)}}
A.fV.prototype={
cE(a,b,c,d){var s,r,q,p,o,n=this,m=A.aQ(b,c,J.a3(a))
if(b===m)return""
if(t.gc.b(a)){s=a
r=0}else{s=A.vZ(a,b,m)
m-=b
r=b
b=0}q=n.bC(s,b,m,d)
p=n.b
if((p&1)!==0){o=A.ps(p)
n.b=0
throw A.d(A.R(o,a,r+n.c))}return q},
bC(a,b,c,d){var s,r,q=this
if(c-b>1000){s=B.c.bJ(b+c,2)
r=q.bC(a,b,s,!1)
if((q.b&1)!==0)return r
return r+q.bC(a,s,c,d)}return q.e3(a,b,c,d)},
e6(a){var s=this.b
this.b=0
if(s<=32)return
if(this.a)a.a+=A.be(65533)
else throw A.d(A.R(A.ps(77),null,null))},
e3(a,b,c,d){var s,r,q,p,o,n,m,l=this,k=65533,j=l.b,i=l.c,h=new A.ac(""),g=b+1,f=a[b]
$label0$0:for(s=l.a;!0;){for(;!0;g=p){r=B.a.J("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFFFFFFFFFFFFFFFFGGGGGGGGGGGGGGGGHHHHHHHHHHHHHHHHHHHHHHHHHHHIHHHJEEBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBKCCCCCCCCCCCCDCLONNNMEEEEEEEEEEE",f)&31
i=j<=32?f&61694>>>r:(f&63|i<<6)>>>0
j=B.a.J(" \x000:XECCCCCN:lDb \x000:XECCCCCNvlDb \x000:XECCCCCN:lDb AAAAA\x00\x00\x00\x00\x00AAAAA00000AAAAA:::::AAAAAGG000AAAAA00KKKAAAAAG::::AAAAA:IIIIAAAAA000\x800AAAAA\x00\x00\x00\x00 AAAAA",j+r)
if(j===0){h.a+=A.be(i)
if(g===c)break $label0$0
break}else if((j&1)!==0){if(s)switch(j){case 69:case 67:h.a+=A.be(k)
break
case 65:h.a+=A.be(k);--g
break
default:q=h.a+=A.be(k)
h.a=q+A.be(k)
break}else{l.b=j
l.c=g-1
return""}j=0}if(g===c)break $label0$0
p=g+1
f=a[g]}p=g+1
f=a[g]
if(f<128){while(!0){if(!(p<c)){o=c
break}n=p+1
f=a[p]
if(f>=128){o=n-1
p=n
break}p=n}if(o-g<20)for(m=g;m<o;++m)h.a+=A.be(a[m])
else h.a+=A.p2(a,g,o)
if(o===c)break $label0$0
g=p}else g=p}if(d&&j>32)if(s)h.a+=A.be(k)
else{l.b=77
l.c=c
return""}l.b=j
l.c=i
s=h.a
return s.charCodeAt(0)==0?s:s}}
A.k2.prototype={
$2(a,b){var s=this.b,r=this.a,q=s.a+=r.a
q+=A.b(a.a)
s.a=q
s.a=q+": "
s.a+=A.cS(b)
r.a=", "},
$S:75}
A.dp.prototype={
O(a,b){if(b==null)return!1
return b instanceof A.dp&&this.a===b.a&&this.b===b.b},
gE(a){var s=this.a
return(s^B.c.ai(s,30))&1073741823},
ew(){var s,r
if(this.b)return this
s=this.a
if(Math.abs(s)<=864e13)r=!1
else r=!0
if(r)A.Z(A.K("DateTime is outside valid range: "+s,null))
A.bU(!0,"isUtc",t.y)
return new A.dp(s,!0)},
k(a){var s=this,r=A.oy(A.fk(s)),q=A.b6(A.oW(s)),p=A.b6(A.oS(s)),o=A.b6(A.oT(s)),n=A.b6(A.oV(s)),m=A.b6(A.oX(s)),l=A.oz(A.oU(s)),k=r+"-"+q
if(s.b)return k+"-"+p+" "+o+":"+n+":"+m+"."+l+"Z"
else return k+"-"+p+" "+o+":"+n+":"+m+"."+l},
ev(){var s=this,r=A.fk(s)>=-9999&&A.fk(s)<=9999?A.oy(A.fk(s)):A.u5(A.fk(s)),q=A.b6(A.oW(s)),p=A.b6(A.oS(s)),o=A.b6(A.oT(s)),n=A.b6(A.oV(s)),m=A.b6(A.oX(s)),l=A.oz(A.oU(s)),k=r+"-"+q
if(s.b)return k+"-"+p+"T"+o+":"+n+":"+m+"."+l+"Z"
else return k+"-"+p+"T"+o+":"+n+":"+m+"."+l}}
A.m2.prototype={
k(a){return this.aB()}}
A.H.prototype={
gb2(){return A.aS(this.$thrownJsError)}}
A.eF.prototype={
k(a){var s=this.a
if(s!=null)return"Assertion failed: "+A.cS(s)
return"Assertion failed"}}
A.aG.prototype={}
A.fg.prototype={
k(a){return"Throw of null."},
$iaG:1}
A.at.prototype={
gbE(){return"Invalid argument"+(!this.a?"(s)":"")},
gbD(){return""},
k(a){var s=this,r=s.c,q=r==null?"":" ("+r+")",p=s.d,o=p==null?"":": "+A.b(p),n=s.gbE()+q+o
if(!s.a)return n
return n+s.gbD()+": "+A.cS(s.gbS())},
gbS(){return this.b}}
A.dL.prototype={
gbS(){return this.b},
gbE(){return"RangeError"},
gbD(){var s,r=this.e,q=this.f
if(r==null)s=q!=null?": Not less than or equal to "+A.b(q):""
else if(q==null)s=": Not greater than or equal to "+A.b(r)
else if(q>r)s=": Not in inclusive range "+A.b(r)+".."+A.b(q)
else s=q<r?": Valid value range is empty":": Only valid value is "+A.b(r)
return s}}
A.eV.prototype={
gbS(){return this.b},
gbE(){return"RangeError"},
gbD(){if(this.b<0)return": index must not be negative"
var s=this.f
if(s===0)return": no indices are valid"
return": index should be less than "+s},
gj(a){return this.f}}
A.dH.prototype={
k(a){var s,r,q,p,o,n,m,l,k=this,j={},i=new A.ac("")
j.a=""
s=k.c
for(r=s.length,q=0,p="",o="";q<r;++q,o=", "){n=s[q]
i.a=p+o
p=i.a+=A.cS(n)
j.a=", "}k.d.M(0,new A.k2(j,i))
m=A.cS(k.a)
l=i.k(0)
return"NoSuchMethodError: method not found: '"+A.b(k.b.a)+"'\nReceiver: "+m+"\nArguments: ["+l+"]"}}
A.fz.prototype={
k(a){return"Unsupported operation: "+this.a}}
A.fu.prototype={
k(a){var s=this.a
return s!=null?"UnimplementedError: "+s:"UnimplementedError"}}
A.bJ.prototype={
k(a){return"Bad state: "+this.a}}
A.eO.prototype={
k(a){var s=this.a
if(s==null)return"Concurrent modification during iteration."
return"Concurrent modification during iteration: "+A.cS(s)+"."}}
A.fi.prototype={
k(a){return"Out of Memory"},
gb2(){return null},
$iH:1}
A.dO.prototype={
k(a){return"Stack Overflow"},
gb2(){return null},
$iH:1}
A.eQ.prototype={
k(a){var s=this.a
return s==null?"Reading static variable during its initialization":"Reading static variable '"+s+"' during its initialization"}}
A.e_.prototype={
k(a){return"Exception: "+this.a},
$ia8:1}
A.aK.prototype={
k(a){var s,r,q,p,o,n,m,l,k,j,i,h=this.a,g=h!=null&&""!==h?"FormatException: "+A.b(h):"FormatException",f=this.c,e=this.b
if(typeof e=="string"){if(f!=null)s=f<0||f>e.length
else s=!1
if(s)f=null
if(f==null){if(e.length>78)e=B.a.u(e,0,75)+"..."
return g+"\n"+e}for(r=1,q=0,p=!1,o=0;o<f;++o){n=B.a.J(e,o)
if(n===10){if(q!==o||!p)++r
q=o+1
p=!1}else if(n===13){++r
q=o+1
p=!0}}g=r>1?g+(" (at line "+r+", character "+(f-q+1)+")\n"):g+(" (at character "+(f+1)+")\n")
m=e.length
for(o=f;o<m;++o){n=B.a.B(e,o)
if(n===10||n===13){m=o
break}}if(m-q>78)if(f-q<75){l=q+75
k=q
j=""
i="..."}else{if(m-f<75){k=m-75
l=m
i=""}else{k=f-36
l=f+36
i="..."}j="..."}else{l=m
k=q
j=""
i=""}return g+j+B.a.u(e,k,l)+i+"\n"+B.a.bs(" ",f-k+j.length)+"^\n"}else return f!=null?g+(" (at offset "+A.b(f)+")"):g},
$ia8:1}
A.j.prototype={
aj(a,b){return A.he(this,A.A(this).h("j.E"),b)},
al(a,b,c){return A.jQ(this,b,A.A(this).h("j.E"),c)},
G(a,b){var s
for(s=this.gH(this);s.q();)if(J.af(s.gt(),b))return!0
return!1},
aR(a,b){var s
for(s=this.gH(this);s.q();)if(b.$1(s.gt()))return!0
return!1},
b_(a,b){return A.bc(this,!1,A.A(this).h("j.E"))},
gj(a){var s,r=this.gH(this)
for(s=0;r.q();)++s
return s},
gA(a){return!this.gH(this).q()},
ga8(a){return!this.gA(this)},
a6(a,b){return A.p0(this,b,A.A(this).h("j.E"))},
V(a,b){var s,r,q
A.aW(b,"index")
for(s=this.gH(this),r=0;s.q();){q=s.gt()
if(b===r)return q;++r}throw A.d(A.eW(b,r,this,null,"index"))},
k(a){return A.uh(this,"(",")")}}
A.e0.prototype={
V(a,b){var s=this.a
if(0>b||b>=s)A.Z(A.eW(b,s,this,null,"index"))
return this.b.$1(b)},
gj(a){return this.a}}
A.P.prototype={}
A.cY.prototype={
k(a){return"MapEntry("+A.b(this.a)+": "+A.b(this.b)+")"}}
A.l.prototype={
gE(a){return A.c.prototype.gE.call(this,this)},
k(a){return"null"}}
A.c.prototype={$ic:1,
O(a,b){return this===b},
gE(a){return A.d0(this)},
k(a){return"Instance of '"+A.b(A.ka(this))+"'"},
bm(a,b){throw A.d(A.uT(this,b.gcT(),b.gcX(),b.gcU(),null))},
toString(){return this.k(this)}}
A.fR.prototype={
k(a){return""},
$ian:1}
A.ac.prototype={
gj(a){return this.a.length},
k(a){var s=this.a
return s.charCodeAt(0)==0?s:s}}
A.lx.prototype={
$2(a,b){throw A.d(A.R("Illegal IPv4 address, "+a,this.a,b))},
$S:87}
A.ly.prototype={
$2(a,b){throw A.d(A.R("Illegal IPv6 address, "+a,this.a,b))},
$S:88}
A.lz.prototype={
$2(a,b){var s
if(b-a>4)this.a.$2("an IPv6 part can only contain a maximum of 4 hex digits",a)
s=A.cM(B.a.u(this.b,a,b),16)
if(s<0||s>65535)this.a.$2("each part must be in the range of `0x0..0xFFFF`",a)
return s},
$S:89}
A.en.prototype={
gcw(){var s,r,q,p,o=this,n=o.w
if(n===$){s=o.a
r=s.length!==0?s+":":""
q=o.c
p=q==null
if(!p||s==="file"){s=r+"//"
r=o.b
if(r.length!==0)s=s+r+"@"
if(!p)s+=q
r=o.d
if(r!=null)s=s+":"+A.b(r)}else s=r
s+=o.e
r=o.f
if(r!=null)s=s+"?"+r
r=o.r
if(r!=null)s=s+"#"+r
n!==$&&A.nU("_text")
n=o.w=s.charCodeAt(0)==0?s:s}return n},
gE(a){var s,r=this,q=r.y
if(q===$){s=B.a.gE(r.gcw())
r.y!==$&&A.nU("hashCode")
r.y=s
q=s}return q},
gd2(){return this.b},
gbQ(){var s=this.c
if(s==null)return""
if(B.a.Y(s,"["))return B.a.u(s,1,s.length-1)
return s},
gbZ(){var s=this.d
return s==null?A.pm(this.a):s},
gcY(){var s=this.f
return s==null?"":s},
gcI(){var s=this.r
return s==null?"":s},
gcK(){return this.a.length!==0},
gbN(){return this.c!=null},
gbP(){return this.f!=null},
gbO(){return this.r!=null},
gcJ(){return B.a.Y(this.e,"/")},
k(a){return this.gcw()},
O(a,b){var s,r,q=this
if(b==null)return!1
if(q===b)return!0
if(t.n.b(b))if(q.a===b.gc8())if(q.c!=null===b.gbN())if(q.b===b.gd2())if(q.gbQ()===b.gbQ())if(q.gbZ()===b.gbZ())if(q.e===b.gcV()){s=q.f
r=s==null
if(!r===b.gbP()){if(r)s=""
if(s===b.gcY()){s=q.r
r=s==null
if(!r===b.gbO()){if(r)s=""
s=s===b.gcI()}else s=!1}else s=!1}else s=!1}else s=!1
else s=!1
else s=!1
else s=!1
else s=!1
else s=!1
else s=!1
return s},
$iaY:1,
gc8(){return this.a},
gcV(){return this.e}}
A.lv.prototype={
gbo(a){var s,r,q,p,o=this,n=null,m=o.c
if(m==null){m=o.a
s=o.b[0]+1
r=B.a.bg(m,"?",s)
q=m.length
if(r>=0){p=A.eo(m,r+1,q,B.D,!1,!1)
q=r}else p=n
m=o.c=new A.fH("data","",n,n,A.eo(m,s,q,B.ax,!1,!1),p,n)}return m},
gbV(){var s=this.b,r=s[0]+1,q=s[1]
if(r===q)return"text/plain"
return A.vY(this.a,r,q,B.ac,!1)},
cD(){var s,r,q,p,o,n,m,l,k=this.a,j=this.b,i=B.d.gaV(j)+1
if((j.length&1)===1)return B.b8.e0(k,i)
j=k.length
s=j-i
for(r=i;r<j;++r)if(B.a.B(k,r)===37){r+=2
s-=2}q=new Uint8Array(s)
if(s===j){B.j.a5(q,0,s,new A.c8(k),i)
return q}for(r=i,p=0;r<j;++r){o=B.a.B(k,r)
if(o!==37){n=p+1
q[p]=o}else{m=r+2
if(m<j){l=A.pW(k,r+1)
if(l>=0){n=p+1
q[p]=l
r=m
p=n
continue}}throw A.d(A.R("Invalid percent escape",k,r))}p=n}return q},
k(a){var s=this.a
return this.b[0]===-1?"data:"+s:s}}
A.mB.prototype={
$2(a,b){var s=this.a[a]
B.j.e5(s,0,96,b)
return s},
$S:96}
A.mC.prototype={
$3(a,b,c){var s,r
for(s=b.length,r=0;r<s;++r)a[B.a.J(b,r)^96]=c},
$S:17}
A.mD.prototype={
$3(a,b,c){var s,r
for(s=B.a.J(b,0),r=B.a.J(b,1);s<=r;++s)a[(s^96)>>>0]=c},
$S:17}
A.fP.prototype={
gcK(){return this.b>0},
gbN(){return this.c>0},
gbP(){return this.f<this.r},
gbO(){return this.r<this.a.length},
gcJ(){return B.a.U(this.a,"/",this.e)},
gc8(){var s=this.w
return s==null?this.w=this.dr():s},
dr(){var s,r=this,q=r.b
if(q<=0)return""
s=q===4
if(s&&B.a.Y(r.a,"http"))return"http"
if(q===5&&B.a.Y(r.a,"https"))return"https"
if(s&&B.a.Y(r.a,"file"))return"file"
if(q===7&&B.a.Y(r.a,"package"))return"package"
return B.a.u(r.a,0,q)},
gd2(){var s=this.c,r=this.b+3
return s>r?B.a.u(this.a,r,s-1):""},
gbQ(){var s=this.c
return s>0?B.a.u(this.a,s,this.d):""},
gbZ(){var s,r=this
if(r.c>0&&r.d+1<r.e)return A.cM(B.a.u(r.a,r.d+1,r.e),null)
s=r.b
if(s===4&&B.a.Y(r.a,"http"))return 80
if(s===5&&B.a.Y(r.a,"https"))return 443
return 0},
gcV(){return B.a.u(this.a,this.e,this.f)},
gcY(){var s=this.f,r=this.r
return s<r?B.a.u(this.a,s+1,r):""},
gcI(){var s=this.r,r=this.a
return s<r.length?B.a.bu(r,s+1):""},
gE(a){var s=this.x
return s==null?this.x=B.a.gE(this.a):s},
O(a,b){if(b==null)return!1
if(this===b)return!0
return t.n.b(b)&&this.a===b.k(0)},
k(a){return this.a},
$iaY:1}
A.fH.prototype={}
A.mz.prototype={
$1(a){var s,r,q,p=this.a
if(p.v(a))return p.i(0,a)
if(t.I.b(a)){s={}
p.m(0,a,s)
for(p=a.gN(),p=p.gH(p);p.q();){r=p.gt()
s[r]=this.$1(a.i(0,r))}return s}else if(t.j.b(a)){q=[]
p.m(0,a,q)
B.d.D(q,J.bt(a,this,t.z))
return q}else return a},
$S:123}
A.a4.prototype={
gco(){var s,r=this.y
if(r===5121||r===5120){s=this.Q
s=s==="MAT2"||s==="MAT3"}else s=!1
if(!s)r=(r===5123||r===5122)&&this.Q==="MAT3"
else r=!0
return r},
gac(){var s=B.m.i(0,this.Q)
return s==null?0:s},
gad(){var s=this,r=s.y
if(r===5121||r===5120){r=s.Q
if(r==="MAT2")return 6
else if(r==="MAT3")return 11
return s.gac()}else if(r===5123||r===5122){if(s.Q==="MAT3")return 22
return 2*s.gac()}return 4*s.gac()},
gap(){var s=this,r=s.cx
if(r!==0)return r
r=s.y
if(r===5121||r===5120){r=s.Q
if(r==="MAT2")return 8
else if(r==="MAT3")return 12
return s.gac()}else if(r===5123||r===5122){if(s.Q==="MAT3")return 24
return 2*s.gac()}return 4*s.gac()},
gaS(){return this.gap()*(this.z-1)+this.gad()},
p(a,b){var s,r,q,p=this,o="bufferView",n=a.y,m=p.w,l=p.CW=n.i(0,m),k=l==null
if(!k&&l.z!==-1)p.cx=l.z
if(p.y===-1||p.z===-1||p.Q==null)return
if(m!==-1)if(k)b.l($.Q(),A.a([m],t.M),o)
else{l.a$=!0
l=l.z
if(l!==-1&&l<p.gad())b.F($.qL(),A.a([p.CW.z,p.gad()],t.M))
A.bu(p.x,p.ch,p.gaS(),p.CW,m,b)}m=p.ay
if(m!=null){l=m.d
if(l!==-1)k=!1
else k=!0
if(k)return
k=b.c
k.push("sparse")
s=p.z
if(l>s)b.l($.rw(),A.a([l,s],t.M),"count")
s=m.f
r=s.d
s.f=n.i(0,r)
k.push("indices")
q=m.e
m=q.d
if(m!==-1){n=q.r=n.i(0,m)
if(n==null)b.l($.Q(),A.a([m],t.M),o)
else{n.T(B.o,o,b)
if(q.r.z!==-1)b.n($.nj(),o)
n=q.f
if(n!==-1)A.bu(q.e,A.b0(n),A.b0(n)*l,q.r,m,b)}}k.pop()
k.push("values")
if(r!==-1){n=s.f
if(n==null)b.l($.Q(),A.a([r],t.M),o)
else{n.T(B.o,o,b)
if(s.f.z!==-1)b.n($.nj(),o)
n=p.ch
m=B.m.i(0,p.Q)
if(m==null)m=0
A.bu(s.e,n,n*m*l,s.f,r,b)}}k.pop()
k.pop()}},
T(a,b,c){var s
this.a$=!0
s=this.fr
if(s==null)this.fr=a
else if(s!==a)c.l($.qN(),A.a([s,a],t.M),b)},
eA(a){var s=this.dy
if(s==null)this.dy=a
else if(s!==a)return!1
return!0},
ef(a){var s,r,q=this
if(!q.as||5126===q.y){a.toString
return a}s=q.ch*8
r=q.y
if(r===5120||r===5122||r===5124)return Math.max(a/(B.c.aI(1,s-1)-1),-1)
else return a/(B.c.aI(1,s)-1)}}
A.fC.prototype={
af(){var s=this
return A.bS(function(){var r=0,q=2,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0
return function $async$af(a1,a2){if(a1===1){p=a2
r=q}while(true)switch(r){case 0:a0=s.y
if(a0===-1||s.z===-1||s.Q==null){r=1
break}o=s.gac()
n=s.z
m=s.CW
if(m!=null){m=m.as
if((m==null?null:m.z)==null){r=1
break}if(s.gap()<s.gad()){r=1
break}m=s.x
l=s.ch
if(!A.bu(m,l,s.gaS(),s.CW,null,null)){r=1
break}k=s.CW
j=A.or(a0,k.as.z.buffer,k.x+m,B.c.aw(s.gaS(),l))
if(j==null){r=1
break}i=j.length
if(s.gco()){m=B.c.aw(s.gap(),l)
l=s.Q==="MAT2"
k=l?8:12
h=l?2:3
g=new A.lR(i,j,h,h,m-k).$0()}else g=new A.lS(j).$3(i,o,B.c.aw(s.gap(),l)-o)}else g=A.oE(n*o,new A.lT(),t.e)
m=s.ay
if(m!=null){l=m.f
k=l.e
if(k!==-1){f=l.f
if(f!=null)if(f.y!==-1)if(f.x!==-1){f=f.as
if((f==null?null:f.z)!=null){f=m.e
if(f.f!==-1)if(f.e!==-1){f=f.r
if(f!=null)if(f.y!==-1)if(f.x!==-1){f=f.as
f=(f==null?null:f.z)==null}else f=!0
else f=!0
else f=!0}else f=!0
else f=!0}else f=!0}else f=!0
else f=!0
else f=!0}else f=!0
if(f){r=1
break}f=m.d
if(f>n){r=1
break}n=m.e
m=n.e
e=n.f
if(A.bu(m,A.b0(e),A.b0(e)*f,n.r,null,null)){d=s.ch
c=B.m.i(0,s.Q)
if(c==null)c=0
c=!A.bu(k,d,d*c*f,l.f,null,null)
d=c}else d=!0
if(d){r=1
break}n=n.r
b=A.np(e,n.as.z.buffer,n.x+m,f)
l=l.f
a=A.or(a0,l.as.z.buffer,l.x+k,f*o)
if(b==null||a==null){r=1
break}g=new A.lU(s,b,g,o,a).$0()}r=3
return A.mf(g)
case 3:case 1:return A.bO()
case 2:return A.bP(p)}}},t.e)},
bq(){var s=this
return A.bS(function(){var r=0,q=1,p,o,n,m,l
return function $async$bq(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:m=s.ch*8
l=s.y
l=l===5120||l===5122||l===5124
o=t.F
r=l?2:4
break
case 2:l=B.c.aI(1,m-1)
n=s.af()
n.toString
r=5
return A.mf(A.jQ(n,new A.lP(1/(l-1)),n.$ti.h("j.E"),o))
case 5:r=3
break
case 4:l=B.c.aI(1,m)
n=s.af()
n.toString
r=6
return A.mf(A.jQ(n,new A.lQ(1/(l-1)),n.$ti.h("j.E"),o))
case 6:case 3:return A.bO()
case 1:return A.bP(p)}}},t.F)}}
A.lR.prototype={
$0(){var s=this
return A.bS(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h
return function $async$$0(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:o=s.a,n=s.c,m=s.b,l=s.d,k=s.e,j=0,i=0,h=0
case 2:if(!(j<o)){r=3
break}r=4
return m[j]
case 4:++j;++i
if(i===n){j+=4-i;++h
if(h===l){j+=k
h=0}i=0}r=2
break
case 3:return A.bO()
case 1:return A.bP(p)}}},t.e)},
$S:18}
A.lS.prototype={
$3(a,b,c){return this.d4(a,b,c)},
d4(a,b,c){var s=this
return A.bS(function(){var r=a,q=b,p=c
var o=0,n=1,m,l,k,j
return function $async$$3(d,e){if(d===1){m=e
o=n}while(true)switch(o){case 0:l=s.a,k=0,j=0
case 2:if(!(k<r)){o=3
break}o=4
return l[k]
case 4:++k;++j
if(j===q){k+=p
j=0}o=2
break
case 3:return A.bO()
case 1:return A.bP(m)}}},t.e)},
$S:31}
A.lT.prototype={
$1(a){return 0},
$S:32}
A.lU.prototype={
$0(){var s=this
return A.bS(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h,g,f
return function $async$$0(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:g=s.b
f=g[0]
o=J.aA(s.c),n=s.d,m=s.a.ay,l=s.e,k=0,j=0,i=0
case 2:if(!o.q()){r=3
break}h=o.gt()
if(j===n){if(k===f&&i!==m.d-1){++i
f=g[i]}++k
j=0}r=k===f?4:6
break
case 4:r=7
return l[i*n+j]
case 7:r=5
break
case 6:r=8
return h
case 8:case 5:++j
r=2
break
case 3:return A.bO()
case 1:return A.bP(p)}}},t.e)},
$S:18}
A.lP.prototype={
$1(a){return Math.max(a*this.a,-1)},
$S:8}
A.lQ.prototype={
$1(a){return a*this.a},
$S:8}
A.fB.prototype={
af(){var s=this
return A.bS(function(){var r=0,q=2,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0
return function $async$af(a1,a2){if(a1===1){p=a2
r=q}while(true)switch(r){case 0:a0=s.y
if(a0===-1||s.z===-1||s.Q==null){r=1
break}o=s.gac()
n=s.z
m=s.CW
if(m!=null){m=m.as
if((m==null?null:m.z)==null){r=1
break}if(s.gap()<s.gad()){r=1
break}m=s.x
l=s.ch
if(!A.bu(m,l,s.gaS(),s.CW,null,null)){r=1
break}k=s.CW
j=A.oq(a0,k.as.z.buffer,k.x+m,B.c.aw(s.gaS(),l))
if(j==null){r=1
break}i=j.length
if(s.gco()){m=B.c.aw(s.gap(),l)
l=s.Q==="MAT2"
k=l?8:12
h=l?2:3
g=new A.lL(i,j,h,h,m-k).$0()}else g=new A.lM(j).$3(i,o,B.c.aw(s.gap(),l)-o)}else g=A.oE(n*o,new A.lN(),t.F)
m=s.ay
if(m!=null){l=m.f
k=l.e
if(k!==-1){f=l.f
if(f!=null)if(f.y!==-1)if(f.x!==-1){f=f.as
if((f==null?null:f.z)!=null){f=m.e
if(f.f!==-1)if(f.e!==-1){f=f.r
if(f!=null)if(f.y!==-1)if(f.x!==-1){f=f.as
f=(f==null?null:f.z)==null}else f=!0
else f=!0
else f=!0}else f=!0
else f=!0}else f=!0}else f=!0
else f=!0
else f=!0}else f=!0
if(f){r=1
break}f=m.d
if(f>n){r=1
break}n=m.e
m=n.e
e=n.f
if(A.bu(m,A.b0(e),A.b0(e)*f,n.r,null,null)){d=s.ch
c=B.m.i(0,s.Q)
if(c==null)c=0
c=!A.bu(k,d,d*c*f,l.f,null,null)
d=c}else d=!0
if(d){r=1
break}n=n.r
b=A.np(e,n.as.z.buffer,n.x+m,f)
l=l.f
a=A.oq(a0,l.as.z.buffer,l.x+k,f*o)
if(b==null||a==null){r=1
break}g=new A.lO(s,b,g,o,a).$0()}r=3
return A.mf(g)
case 3:case 1:return A.bO()
case 2:return A.bP(p)}}},t.F)},
bq(){return this.af()}}
A.lL.prototype={
$0(){var s=this
return A.bS(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h
return function $async$$0(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:o=s.a,n=s.c,m=s.b,l=s.d,k=s.e,j=0,i=0,h=0
case 2:if(!(j<o)){r=3
break}r=4
return m[j]
case 4:++j;++i
if(i===n){j+=4-i;++h
if(h===l){j+=k
h=0}i=0}r=2
break
case 3:return A.bO()
case 1:return A.bP(p)}}},t.F)},
$S:19}
A.lM.prototype={
$3(a,b,c){return this.d3(a,b,c)},
d3(a,b,c){var s=this
return A.bS(function(){var r=a,q=b,p=c
var o=0,n=1,m,l,k,j
return function $async$$3(d,e){if(d===1){m=e
o=n}while(true)switch(o){case 0:l=s.a,k=0,j=0
case 2:if(!(k<r)){o=3
break}o=4
return l[k]
case 4:++k;++j
if(j===q){k+=p
j=0}o=2
break
case 3:return A.bO()
case 1:return A.bP(m)}}},t.F)},
$S:35}
A.lN.prototype={
$1(a){return 0},
$S:8}
A.lO.prototype={
$0(){var s=this
return A.bS(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h,g,f
return function $async$$0(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:g=s.b
f=g[0]
o=J.aA(s.c),n=s.d,m=s.a.ay,l=s.e,k=0,j=0,i=0
case 2:if(!o.q()){r=3
break}h=o.gt()
if(j===n){if(k===f&&i!==m.d-1){++i
f=g[i]}++k
j=0}r=k===f?4:6
break
case 4:r=7
return l[i*n+j]
case 7:r=5
break
case 6:r=8
return h
case 8:case 5:++j
r=2
break
case 3:return A.bO()
case 1:return A.bP(p)}}},t.F)},
$S:19}
A.bZ.prototype={
ge8(){var s=this.e,r=s.r,q=r==null?null:r.as
if((q==null?null:q.z)==null)return null
return A.np(s.f,r.as.z.buffer,r.x+s.e,this.d)}}
A.c_.prototype={
p(a,b){this.r=a.y.i(0,this.d)}}
A.c0.prototype={
p(a,b){this.f=a.y.i(0,this.d)}}
A.eY.prototype={
a0(a,b,c,d){d.toString
if(d==1/0||d==-1/0||isNaN(d)){a.l($.qa(),A.a([b,d],t.M),this.a)
return!1}return!0}}
A.f5.prototype={
a0(a,b,c,d){var s,r=this
if(b===c||r.b[c]>d)r.b[c]=d
if(d<r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
aF(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d+"/min/",n=t.M,m=0;m<r;++m)if(!J.af(q[m],s[m])){l=o+m
a.l($.o_(),A.a([q[m],s[m]],n),l)
k=p[m]
if(k>0)a.l($.nY(),A.a([k,q[m]],n),l)}return!0}}
A.f3.prototype={
a0(a,b,c,d){var s,r=this
if(b===c||r.b[c]<d)r.b[c]=d
if(d>r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
aF(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d+"/max/",n=t.M,m=0;m<r;++m)if(!J.af(q[m],s[m])){l=o+m
a.l($.nZ(),A.a([q[m],s[m]],n),l)
k=p[m]
if(k>0)a.l($.nX(),A.a([k,q[m]],n),l)}return!0}}
A.f6.prototype={
a0(a,b,c,d){var s,r=this
if(b===c||r.b[c]>d)r.b[c]=d
if(d<r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
aF(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d+"/min/",n=t.M,m=0;m<r;++m)if(!J.af(q[m],s[m])){l=o+m
a.l($.o_(),A.a([q[m],s[m]],n),l)
k=p[m]
if(k>0)a.l($.nY(),A.a([k,q[m]],n),l)}return!0}}
A.f4.prototype={
a0(a,b,c,d){var s,r=this
if(b===c||r.b[c]<d)r.b[c]=d
if(d>r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
aF(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d+"/max/",n=t.M,m=0;m<r;++m)if(!J.af(q[m],s[m])){l=o+m
a.l($.nZ(),A.a([q[m],s[m]],n),l)
k=p[m]
if(k>0)a.l($.nX(),A.a([k,q[m]],n),l)}return!0}}
A.bv.prototype={
p(a,b){var s,r,q,p,o,n=this,m="samplers",l=n.x
if(l==null||n.w==null)return
s=b.c
s.push(m)
l.a4(new A.h5(b,a))
s.pop()
s.push("channels")
n.w.a4(new A.h6(n,b,a))
s.pop()
s.push(m)
for(r=l.b,l=l.a,q=l.length,p=0;p<r;++p){o=p>=q
if(!(o?null:l[p]).a$)b.Z($.h1(),p)}s.pop()}}
A.h5.prototype={
$2(a,b){var s,r,q,p,o,n,m="input",l="output",k=this.a,j=k.c
j.push(B.c.k(a))
s=this.b.f
r=b.d
b.r=s.i(0,r)
q=b.f
b.w=s.i(0,q)
if(r!==-1){s=b.r
if(s==null)k.l($.Q(),A.a([r],t.M),m)
else{s.T(B.b1,m,k)
p=b.r.CW
if(p!=null){p.T(B.o,m,k)
s=p.z
if(s!==-1)k.n($.o4(),m)}j.push(m)
o=A.dl(b.r)
if(!o.O(0,B.G))k.F($.qR(),A.a([o,A.a([B.G],t.p)],t.M))
else k.a_(b.r,new A.eE(k.S()))
s=b.r
if(s.ax==null||s.at==null)k.L($.qT())
if(b.e==="CUBICSPLINE"&&b.r.z<2)k.F($.qS(),A.a(["CUBICSPLINE",2,b.r.z],t.M))
j.pop()}}if(q!==-1){s=b.w
if(s==null)k.l($.Q(),A.a([q],t.M),l)
else{s.T(B.b2,l,k)
n=b.w.CW
if(n!=null){n.T(B.o,l,k)
s=n.z
if(s!==-1)k.n($.o4(),l)}s=b.w.CW
if(s!=null)s.T(B.o,l,k)
b.w.eA("CUBICSPLINE"===b.e)}}j.pop()},
$S:36}
A.h6.prototype={
$2(a,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=null,d="sampler",c=this.b,b=c.c
b.push(B.c.k(a))
s=this.a
r=a0.d
a0.f=s.x.i(0,r)
q=a0.e
p=q!=null
if(p){o=q.d
q.f=this.c.ax.i(0,o)
if(o!==-1){b.push("target")
n=q.f
if(n==null)c.l($.Q(),A.a([o],t.M),"node")
else{n.a$=!0
switch(q.e){case"translation":case"rotation":case"scale":if(n.z!=null)c.L($.qO())
if(q.f.dx!=null)c.n($.rx(),"path")
break
case"weights":o=n.cy
o=o==null?e:o.w
o=o==null?e:o.gcH(o)
if((o==null?e:o.cx)==null)c.L($.qP())
break}}b.pop()}}if(r!==-1){o=a0.f
if(o==null)c.l($.Q(),A.a([r],t.M),d)
else{o.a$=!0
if(p&&o.w!=null){r=q.e
if(r==="rotation"){m=o.w
if(m.gac()===4){b.push(d)
o=c.S()
n=5126===m.y?e:m.gbX()
c.a_(m,new A.dK("CUBICSPLINE"===a0.f.e,n,o,t.ed))
b.pop()}o=a0.f
o.w.toString}l=A.dl(o.w)
k=B.dt.i(0,r)
if((k==null?e:B.d.G(k,l))===!1)c.l($.qV(),A.a([l,k,r],t.M),d)
o=a0.f
n=o.r
if(n!=null&&n.z!==-1&&o.w.z!==-1&&o.e!=null){j=n.z
if(o.e==="CUBICSPLINE")j*=3
if(r==="weights"){r=q.f
r=r==null?e:r.cy
r=r==null?e:r.w
r=r==null?e:r.gcH(r)
r=r==null?e:r.cx
i=r==null?e:r.length
j*=i==null?0:i}else if(!B.d.G(B.R,r))j=0
if(j!==0&&j!==a0.f.w.z)c.l($.qU(),A.a([j,a0.f.w.z],t.M),d)}}}for(h=a+1,s=s.w,r=s.b,o=t.M,s=s.a,n=s.length;h<r;++h){if(p){g=h>=n
f=(g?e:s[h]).e
if(f!=null){g=q.d
g=g!==-1&&g===f.d&&q.e==f.e}else g=!1}else g=!1
if(g)c.l($.qQ(),A.a([h],o),"target")}b.pop()}},
$S:37}
A.b2.prototype={}
A.bw.prototype={}
A.b3.prototype={}
A.eE.prototype={
a0(a,b,c,d){var s=this
if(d<0)a.l($.q4(),A.a([b,d],t.M),s.b)
else{if(b!==0&&d<=s.a)a.l($.q5(),A.a([b,d,s.a],t.M),s.b)
s.a=d}return!0}}
A.dK.prototype={
a0(a,b,c,d){var s,r,q=this
if(!q.a||4===(q.d&4)){s=q.b
r=s!=null?s.$1(d):d
s=q.e+r*r
q.e=s
if(3===c){if(Math.abs(Math.sqrt(s)-1)>0.00769)a.l($.q6(),A.a([b-3,b,Math.sqrt(q.e)],t.M),q.c)
q.e=0}}if(++q.d===12)q.d=0
return!0}}
A.bx.prototype={
gbj(){var s,r=this.f
if(r!=null){s=$.br().b
s=!s.test(r)}else s=!0
if(s)return 0
return A.cM($.br().aT(r).b[1],null)},
gbW(){var s,r=this.f
if(r!=null){s=$.br().b
s=!s.test(r)}else s=!0
if(s)return 0
return A.cM($.br().aT(r).b[2],null)},
gcS(){var s,r=this.r
if(r!=null){s=$.br().b
s=!s.test(r)}else s=!0
if(s)return 2
return A.cM($.br().aT(r).b[1],null)},
ged(){var s,r=this.r
if(r!=null){s=$.br().b
s=!s.test(r)}else s=!0
if(s)return 0
return A.cM($.br().aT(r).b[2],null)}}
A.aT.prototype={}
A.by.prototype={
T(a,b,c){var s
this.a$=!0
s=this.at
if(s==null){this.at=a
if(a===B.L||a===B.A)c.n($.qX(),b)}else if(s!==a)c.l($.qY(),A.a([s,a],t.M),b)},
p(a,b){var s,r=this,q=r.w,p=r.as=a.x.i(0,q)
r.ax=r.z
s=r.Q
if(s===34962)r.at=B.A
else if(s===34963)r.at=B.L
if(q!==-1)if(p==null)b.l($.Q(),A.a([q],t.M),"buffer")
else{p.a$=!0
p=p.x
if(p!==-1){s=r.x
if(s>=p)b.l($.o5(),A.a([q,p],t.M),"byteOffset")
else if(s+r.y>p)b.l($.o5(),A.a([q,p],t.M),"byteLength")}}}}
A.bz.prototype={}
A.c3.prototype={}
A.c4.prototype={}
A.du.prototype={
eC(a){var s,r,q,p,o
new A.iz(this,a).$1(this.cy)
s=a.r
for(r=s.length,q=a.c,p=0;p<s.length;s.length===r||(0,A.cN)(s),++p){o=s[p]
B.d.P(q)
B.d.D(q,o.b)
o.a.c4(this,a)}B.d.P(q)}}
A.iw.prototype={
$0(){return B.d.P(this.a.c)},
$S:1}
A.ix.prototype={
$1$2(a,b,c){var s,r,q,p,o,n,m,l,k,j=this,i=j.a
if(!i.v(a)){i=J.b8(0,c.h("0*"))
return new A.F(i,0,a,c.h("F<0*>"))}j.b.$0()
s=i.i(0,a)
if(t.m.b(s)){i=J.V(s)
r=j.c
q=c.h("0*")
if(i.ga8(s)){p=i.gj(s)
q=A.U(p,null,!1,q)
o=r.c
o.push(a)
for(n=t.M,m=t.t,l=0;l<i.gj(s);++l){k=i.i(s,l)
if(m.b(k)){o.push(B.c.k(l))
q[l]=b.$2(k,r)
o.pop()}else r.ao($.a2(),A.a([k,"object"],n),l)}return new A.F(q,p,a,c.h("F<0*>"))}else{r.n($.bX(),a)
i=J.b8(0,q)
return new A.F(i,0,a,c.h("F<0*>"))}}else{j.c.l($.a2(),A.a([s,"array"],t.M),a)
i=J.b8(0,c.h("0*"))
return new A.F(i,0,a,c.h("F<0*>"))}},
$2(a,b){return this.$1$2(a,b,t.z)},
$S:38}
A.iy.prototype={
$1$3$req(a,b,c,d){var s,r
this.a.$0()
s=this.c
r=A.nP(this.b,a,s,!0)
if(r==null)return null
s.c.push(a)
return b.$2(r,s)},
$2(a,b){return this.$1$3$req(a,b,!1,t.z)},
$1$2(a,b,c){return this.$1$3$req(a,b,!1,c)},
$S:39}
A.iu.prototype={
$2(a,b){var s,r,q,p,o,n=this.a,m=n.c
m.push(a.c)
s=this.b
a.a4(new A.iv(n,s))
r=n.f.i(0,b)
if(r!=null){q=J.cX(m.slice(0),A.a_(m).c)
for(p=J.aA(r);p.q();){o=p.gt()
B.d.P(m)
B.d.D(m,o.b)
o.a.p(s,n)}B.d.P(m)
B.d.D(m,q)}m.pop()},
$S:40}
A.iv.prototype={
$2(a,b){var s=this.a,r=s.c
r.push(B.c.k(a))
b.p(this.b,s)
r.pop()},
$S:41}
A.is.prototype={
$2(a,b){var s,r
if(t.c.b(b)){s=this.a
r=s.c
r.push(a)
b.p(this.b,s)
r.pop()}},
$S:3}
A.it.prototype={
$2(a,b){var s,r,q,p=this
if(!b.dy&&b.cx==null&&b.cy==null&&b.CW==null&&b.a.a===0&&b.b==null)p.a.Z($.rY(),a)
if(b.db!=null){s=p.b
s.P(0)
for(r=b;r.db!=null;)if(s.C(0,r))r=r.db
else{if(r===b)p.a.Z($.rc(),a)
break}}if(b.dx!=null){if(b.db!=null)p.a.Z($.t2(),a)
s=b.z
if(s==null||s.cP()){s=b.as
if(s!=null){s=s.a
s=s[0]===0&&s[1]===0&&s[2]===0}else s=!0
if(s){s=b.at
if(s!=null){s=s.a
s=s[0]===0&&s[1]===0&&s[2]===0&&s[3]===1}else s=!0
if(s){s=b.ax
if(s!=null){s=s.a
s=s[0]===1&&s[1]===1&&s[2]===1}else s=!0}else s=!1}else s=!1}else s=!1
if(!s)p.a.Z($.t1(),a)
q=b.dx.at.bf(0,new A.iq(),new A.ir())
if(q!=null){s=q.ch
s=!b.ch.be(0,s.gcC(s))}else s=!1
if(s)p.a.Z($.t0(),a)}},
$S:43}
A.iq.prototype={
$1(a){return a.db==null},
$S:44}
A.ir.prototype={
$0(){return null},
$S:2}
A.iz.prototype={
$1(a){var s=this.b,r=s.c
B.d.P(r)
r.push(a.c)
a.a4(new A.iA(this.a,s))
r.pop()},
$S:45}
A.iA.prototype={
$2(a,b){var s=this.b,r=s.c
r.push(B.c.k(a))
b.c4(this.a,s)
r.pop()},
$S:46}
A.m.prototype={}
A.k.prototype={
p(a,b){},
$in:1}
A.eR.prototype={}
A.fL.prototype={}
A.aU.prototype={
p(a,b){var s,r="bufferView",q=this.w
if(q!==-1){s=this.Q=a.y.i(0,q)
if(s==null)b.l($.Q(),A.a([q],t.M),r)
else{s.T(B.b6,r,b)
if(this.Q.z!==-1)b.n($.qZ(),r)}}},
ez(){var s,r=this.Q,q=r==null?null:r.as
if((q==null?null:q.z)!=null)try{this.z=A.nw(r.as.z.buffer,r.x,r.y)}catch(s){if(!(A.M(s) instanceof A.at))throw s}}}
A.ai.prototype={
p(a,b){var s=this,r=new A.jR(b,a)
r.$2(s.w,"pbrMetallicRoughness")
r.$2(s.x,"normalTexture")
r.$2(s.y,"occlusionTexture")
r.$2(s.z,"emissiveTexture")}}
A.jR.prototype={
$2(a,b){var s,r
if(a!=null){s=this.a
r=s.c
r.push(b)
a.p(this.b,s)
r.pop()}},
$S:28}
A.cB.prototype={
p(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("baseColorTexture")
r.p(a,b)
s.pop()}r=this.w
if(r!=null){s=b.c
s.push("metallicRoughnessTexture")
r.p(a,b)
s.pop()}}}
A.cA.prototype={}
A.cz.prototype={
p(a,b){var s,r
this.dd(a,b)
for(s=b.e,r=this;r!=null;){r=s.i(0,r)
if(r instanceof A.ai){r.ay=!0
break}}}}
A.bj.prototype={
p(a,b){var s,r=this,q=r.d,p=r.f=a.cy.i(0,q)
if(q!==-1)if(p==null)b.l($.Q(),A.a([q],t.M),"index")
else p.a$=!0
for(q=b.e,s=r;s!=null;){s=q.i(0,s)
if(s instanceof A.ai){s.ch.m(0,b.S(),r.e)
break}}}}
A.c2.prototype={
k(a){return this.a}}
A.c1.prototype={
k(a){return this.a}}
A.y.prototype={
k(a){var s=B.ay.i(0,this.b),r=this.c?" normalized":""
return"{"+A.b(this.a)+", "+A.b(s)+r+"}"},
O(a,b){if(b==null)return!1
return b instanceof A.y&&b.a==this.a&&b.b===this.b&&b.c===this.c},
gE(a){return A.px(A.fW(A.fW(A.fW(0,J.bY(this.a)),B.c.gE(this.b)),B.c0.gE(this.c)))}}
A.aV.prototype={
p(a,b){var s,r=b.c
r.push("primitives")
s=this.w
if(s!=null)s.a4(new A.k1(b,a))
r.pop()}}
A.k1.prototype={
$2(a,b){var s,r=this.a,q=r.c
q.push(B.c.k(a))
q.push("extensions")
s=this.b
b.a.M(0,new A.k0(r,s))
q.pop()
b.p(s,r)
q.pop()},
$S:20}
A.k0.prototype={
$2(a,b){var s,r
if(t.c.b(b)){s=this.a
r=s.c
r.push(a)
b.p(this.b,s)
r.pop()}},
$S:3}
A.aE.prototype={
gex(){switch(this.r){case 4:return B.c.bJ(this.ch,3)
case 5:case 6:var s=this.ch
return s>2?s-2:0
default:return 0}},
p(a,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=this,e="attributes",d="indices",c="material",b=f.d
if(b!=null){s=a0.c
s.push(e)
b.M(0,new A.jX(f,a,a0))
s.pop()}b=f.e
if(b!==-1){s=f.cy=a.f.i(0,b)
if(s==null)a0.l($.Q(),A.a([b],t.M),d)
else{f.ch=s.z
s.T(B.b4,d,a0)
b=f.cy.CW
if(b!=null)b.T(B.L,d,a0)
b=a0.c
b.push(d)
s=f.cy.CW
if(s!=null&&s.z!==-1)a0.L($.r7())
r=A.dl(f.cy)
if(!B.d.G(B.aq,r))a0.F($.r6(),A.a([r,B.aq],t.M))
else{s=f.CW
q=s!==-1?s-1:-1
s=f.r
p=s!==-1?B.c.aI(1,s):-1
if(p!==0&&q>=-1){s=f.cy
o=a0.S()
n=B.c.bJ(f.ch,3)
m=f.cy.y
l=new Uint32Array(3)
a0.a_(s,new A.eU(q,n,A.q1(m),16===(p&16),l,o))}}b.pop()}}b=f.ch
if(b!==-1){s=f.r
if(!(s===1&&b%2!==0))if(!((s===2||s===3)&&b<2))if(!(s===4&&b%3!==0))b=(s===5||s===6)&&b<3
else b=!0
else b=!0
else b=!0}else b=!1
if(b)a0.F($.r5(),A.a([f.ch,B.cz[f.r]],t.M))
b=f.f
s=f.db=a.as.i(0,b)
if(b!==-1)if(s==null)a0.l($.Q(),A.a([b],t.M),c)
else{s.a$=!0
if(!(f.y&&f.z)&&s.ay)a0.n(s.x!=null?$.r4():$.ra(),c)
f.db.ch.M(0,new A.jY(f,a0))}if(f.z){b=f.db
b=b==null||!b.ay}else b=!1
if(b){b=a0.c
b.push(e)
a0.n($.rn(),"TANGENT")
b.pop()}for(b=f.dx,s=B.d.gH(b),b=new A.cF(s,new A.jZ(),A.a_(b).h("cF<1>")),o=a0.c;b.q();){n=s.gt()
o.push(e)
a0.n($.h1(),"TEXCOORD_"+A.b(n))
o.pop()}b=f.w
if(b!=null){s=a0.c
s.push("targets")
k=b.length
j=J.oF(k,t.gj)
for(o=t.X,n=t.W,i=0;i<k;++i)j[i]=A.a9(o,n)
f.cx=j
for(h=0;h<b.length;++h){g=b[h]
s.push(B.c.k(h))
g.M(0,new A.k_(f,a,a0,h))
s.pop()}s.pop()}},
cg(a,b,c){var s,r=a.CW
if(r.z===-1){s=c.w.c_(r,new A.jW())
if(s.C(0,a)&&s.gj(s)>1)c.n($.r2(),b)}}}
A.jV.prototype={
$1(a){var s,r,q,p,o
if(a.gj(a)!==0){s=a.a
s=s.length>1&&B.a.J(s,0)===48}else s=!0
if(s)return-1
for(s=a.a,r=s.length,q=0,p=0;p<r;++p){o=B.a.J(s,p)-48
if(o>9||o<0)return-1
q=10*q+o}return q},
$S:49}
A.jS.prototype={
$1(a){var s,r,q,p,o,n,m,l,k=this
if(a.length!==0&&B.a.J(a,0)===95)return
switch(a){case"POSITION":k.a.c=!0
break
case"NORMAL":k.a.b=!0
break
case"TANGENT":k.a.a=!0
break
default:s=a.split("_")
r=s[0]
if(!B.d.G(B.cl,r)||s.length!==2){k.b.n($.nk(),a)
break}q=s[1]
q.toString
p=k.c.$1(new A.c8(q))
if(p!==-1)switch(r){case"COLOR":q=k.a;++q.d
o=q.e
q.e=p>o?p:o
break
case"JOINTS":q=k.a;++q.f
n=q.r
q.r=p>n?p:n
break
case"TEXCOORD":q=k.a;++q.y
m=q.z
q.z=p>m?p:m
break
case"WEIGHTS":q=k.a;++q.w
l=q.x
q.x=p>l?p:l
break}else k.b.n($.nk(),a)}},
$S:21}
A.jT.prototype={
$3(a,b,c){var s=a+1
if(s!==b){this.a.F($.rQ(),A.a([c,s,b],t.M))
return 0}return b},
$S:51}
A.jU.prototype={
$1(a){var s,r
if(a.length!==0&&B.a.J(a,0)===95)return
if(B.d.G(B.ct,a))return
s=a.split("_")
if(B.d.G(B.cm,s[0]))if(s.length===2){r=s[1]
r.toString
r=J.af(this.a.$1(new A.c8(r)),-1)}else r=!0
else r=!0
if(r)this.b.n($.nk(),a)},
$S:21}
A.jX.prototype={
$2(a,b){var s,r,q,p,o,n,m,l=this
if(b===-1)return
s=l.b.f.i(0,b)
if(s==null){l.c.l($.Q(),A.a([b],t.M),a)
return}r=l.a
r.ay.m(0,a,s)
q=l.c
s.T(B.a7,a,q)
p=s.CW
if(p!=null)p.T(B.A,a,q)
if(a==="POSITION")p=s.ax==null||s.at==null
else p=!1
if(p)q.n($.o8(),"POSITION")
o=A.dl(s)
n=q.fr.i(0,A.a(a.split("_"),t.s)[0])
if(n!=null){if(!n.G(0,o))q.l($.o7(),A.a([o,n],t.M),a)
else if(a==="NORMAL"){p=q.c
p.push("NORMAL")
m=q.S()
q.a_(s,new A.fv(m,5126===s.y?null:s.gbX()))
p.pop()}else if(a==="TANGENT"){p=q.c
p.push("TANGENT")
m=q.S()
q.a_(s,new A.fw(m,5126===s.y?null:s.gbX()))
p.pop()}else if(a==="COLOR_0"&&5126===s.y){p=q.c
p.push(a)
q.a_(s,new A.eK(q.S()))
p.pop()}}else if(s.y===5125)q.n($.r3(),a)
p=s.x
if(!(p!==-1&&p%4!==0))if(s.gad()%4!==0){p=s.CW
p=p!=null&&p.z===-1}else p=!1
else p=!0
if(p)q.n($.o6(),a)
p=r.CW
if(p===-1)r.ch=r.CW=s.z
else if(p!==s.z)q.n($.rb(),a)
p=s.CW
if(p!=null&&p.z===-1){if(p.ax===-1)p.ax=s.gad()
r.cg(s,a,q)}},
$S:4}
A.jY.prototype={
$2(a,b){var s
if(b!==-1){s=this.a
if(b+1>s.ax)this.b.l($.o9(),A.a([a,b],t.M),"material")
else s.dx[b]=-1}},
$S:4}
A.jZ.prototype={
$1(a){return a!==-1},
$S:9}
A.k_.prototype={
$2(a,b){var s,r,q,p,o,n,m=this
if(b===-1)return
s=m.b.f.i(0,b)
if(s==null)m.c.l($.Q(),A.a([b],t.M),a)
else{r=m.c
s.T(B.a7,a,r)
q=s.CW
if(q!=null)q.T(B.A,a,r)
p=m.a.ay.i(0,a)
if(p==null)r.n($.r9(),a)
else if(p.z!==s.z)r.n($.r8(),a)
if(a==="POSITION")q=s.ax==null||s.at==null
else q=!1
if(q)r.n($.o8(),"POSITION")
o=A.dl(s)
n=r.fx.i(0,A.a(a.split("_"),t.s)[0])
if(n!=null&&!n.G(0,o))r.l($.o7(),A.a([o,n],t.M),a)
q=s.x
if(!(q!==-1&&q%4!==0))if(s.gad()%4!==0){q=s.CW
q=q!=null&&q.z===-1}else q=!1
else q=!0
if(q)r.n($.o6(),a)
q=s.CW
if(q!=null&&q.z===-1){if(q.ax===-1)q.ax=s.gad()
m.a.cg(s,a,r)}}m.a.cx[m.d].m(0,a,s)},
$S:4}
A.jW.prototype={
$0(){return A.aD(t.W)},
$S:54}
A.eU.prototype={
a0(a,b,c,d){var s,r,q=this,p=q.a
if(d>p)a.l($.q7(),A.a([b,d,p],t.M),q.at)
if(d===q.c)a.l($.q8(),A.a([d,b],t.M),q.at)
if(q.w){p=q.as
s=q.z
p[s]=d;++s
q.z=s
if(s===3){q.z=0
s=p[0]
r=p[1]
if(s!==r){p=p[2]
p=r===p||p===s}else p=!0
if(p)++q.Q}}return!0},
aF(a){var s=this.Q
if(s>0)a.l($.q9(),A.a([s,this.b],t.M),this.at)
return!0}}
A.ap.prototype={
p(a,b){var s,r,q,p=this,o=p.w
p.CW=a.z.i(0,o)
s=p.y
p.dx=a.cx.i(0,s)
r=p.Q
p.cy=a.at.i(0,r)
if(o!==-1){q=p.CW
if(q==null)b.l($.Q(),A.a([o],t.M),"camera")
else q.a$=!0}if(s!==-1){o=p.dx
if(o==null)b.l($.Q(),A.a([s],t.M),"skin")
else o.a$=!0}if(r!==-1){o=p.cy
if(o==null)b.l($.Q(),A.a([r],t.M),"mesh")
else{o.a$=!0
o=o.w
if(o!=null){s=p.ay
r=s==null
if(!r){o=o.i(0,0).cx
o=o==null?null:o.length
o=o!==s.length}else o=!1
if(o){o=$.rg()
s=s.length
q=p.cy.w.i(0,0).cx
b.l(o,A.a([s,q==null?null:q.length],t.M),"weights")}if(r&&p.cy.x!=null)p.cy.y=!0
if(p.dx!=null){o=p.cy.w
if(o.be(o,new A.k3()))b.L($.re())}else{o=p.cy.w
if(o.aR(o,new A.k4()))b.L($.rf())}}}}o=p.x
if(o!=null){s=A.U(o.gj(o),null,!1,t.L)
p.cx=s
A.nT(o,s,a.ax,"children",b,new A.k5(p,b))}},
cd(a,b){var s,r,q,p,o=this
o.ch.C(0,a)
if(o.cx==null||!b.C(0,o))return
for(s=o.cx,r=s.length,q=0;q<r;++q){p=s[q]
if(p!=null)p.cd(a,b)}}}
A.k3.prototype={
$1(a){return a.as===0},
$S:5}
A.k4.prototype={
$1(a){return a.as!==0},
$S:5}
A.k5.prototype={
$3(a,b,c){if(a.db!=null)this.b.ao($.rd(),A.a([b],t.M),c)
a.db=this.a},
$S:10}
A.bF.prototype={}
A.bG.prototype={
p(a,b){var s,r=this.w
if(r==null)return
s=A.U(r.gj(r),null,!1,t.L)
this.x=s
A.nT(r,s,a.ax,"nodes",b,new A.ke(this,b))}}
A.ke.prototype={
$3(a,b,c){if(a.db!=null)this.b.ao($.rh(),A.a([b],t.M),c)
a.cd(this.a,A.aD(t.L))},
$S:10}
A.bI.prototype={
p(a,b){var s,r,q,p,o,n=this,m="inverseBindMatrices",l="skeleton",k=n.w
n.z=a.f.i(0,k)
s=a.ax
r=n.x
n.as=s.i(0,r)
q=n.y
if(q!=null){p=A.U(q.gj(q),null,!1,t.L)
n.Q=p
A.nT(q,p,s,"joints",b,new A.lm(n))
if(n.at.a===0)b.n($.t6(),"joints")}if(k!==-1){s=n.z
if(s==null)b.l($.Q(),A.a([k],t.M),m)
else{s.T(B.b3,m,b)
k=n.z.CW
if(k!=null)k.T(B.b5,m,b)
k=b.c
k.push(m)
s=n.z.CW
if(s!=null&&s.z!==-1)b.L($.ri())
o=A.dl(n.z)
if(!o.O(0,B.Y))b.F($.rj(),A.a([o,A.a([B.Y],t.p)],t.M))
else b.a_(n.z,new A.eT(b.S()))
s=n.Q
if(s!=null&&n.z.z<s.length)b.F($.r0(),A.a([s.length,n.z.z],t.M))
k.pop()}}if(r!==-1){k=n.as
if(k==null)b.l($.Q(),A.a([r],t.M),l)
else if(!n.at.G(0,k))b.n($.t7(),l)}}}
A.lm.prototype={
$3(a,b,c){var s,r,q
a.dy=!0
s=A.aD(t.L)
r=a
while(!0){if(!(r!=null&&s.C(0,r)))break
r=r.db}q=this.a.at
if(q.a===0)q.D(0,s)
else q.dv(s.gcC(s),!1)},
$S:10}
A.eT.prototype={
a0(a,b,c,d){var s
if(!(3===c&&0!==d))if(!(7===c&&0!==d))if(!(11===c&&0!==d))s=15===c&&1!==d
else s=!0
else s=!0
else s=!0
if(s)a.l($.qb(),A.a([b,c,d],t.M),this.a)
return!0}}
A.bK.prototype={
p(a,b){var s,r,q=this,p=q.x
q.z=a.Q.i(0,p)
s=q.w
q.y=a.ay.i(0,s)
if(p!==-1){r=q.z
if(r==null)b.l($.Q(),A.a([p],t.M),"source")
else r.a$=!0}if(s!==-1){p=q.y
if(p==null)b.l($.Q(),A.a([s],t.M),"sampler")
else p.a$=!0}},
c4(a,b){var s=this.z,r=s==null,q=r?null:s.x
if(q==null){s=r?null:s.as
q=s==null?null:s.a}if(q!=null&&!B.d.G(B.ap,q))b.l($.oa(),A.a([q,B.ap],t.M),"source")},
$icC:1}
A.lE.prototype={}
A.i.prototype={
a_(a,b){J.nm(this.d.c_(a,new A.hg()),b)},
W(a,b){var s,r,q
for(s=J.aA(b),r=this.e;s.q();){q=s.gt()
if(q!=null)r.m(0,q,a)}},
c7(a){var s,r,q,p=this.c
if(p.length===0&&a!=null&&B.a.Y(a,"/"))return a
s=a!=null
if(s)p.push(a)
r=this.db
q=r.a+="/"
r.a=A.ny(q,new A.ab(p,new A.hi(),A.a_(p).h("ab<1,e*>")),"/")
if(s)p.pop()
p=r.a
r.a=""
return p.charCodeAt(0)==0?p:p},
S(){return this.c7(null)},
e9(a,b){var s,r,q,p,o,n,m,l,k,j,i=this,h="/extensionsUsed/"
B.d.D(i.as,a)
for(s=J.V(a),r=i.ax,q=i.cx,p=J.V(b),o=t.M,n=0;n<s.gj(a);++n){m=s.i(a,n)
l=$.q3().aT(m)
if((l==null?null:l.b[1])==null)i.n($.rB(),h+n)
k=q.bf(0,new A.hl(m),new A.hm(m))
if(k==null){i.l($.rm(),A.a([m],o),h+n)
continue}k.b.M(0,new A.hn(i,k))
l=k.c
if(l!=null)l.$1(i)
if(k.d&&!p.G(b,m))i.l($.t4(),A.a([m],o),h+n)
r.push(m)}for(n=0;n<p.gj(b);++n){j=p.i(b,n)
if(!s.G(a,j))i.l($.ta(),A.a([j],o),"/extensionsRequired/"+n)}},
ab(a,b,c,d,e,f){var s,r,q,p=this,o=p.b,n=a.b
if(o.b.G(0,n))return
s=o.c
if(s.a!==0&&!s.G(0,n))return
s=o.a
if(s>0&&p.cy.length===s){p.y=!0
throw A.d(B.ba)}o=o.d
r=o!=null?o.i(0,n):null
if(f!=null)p.cy.push(new A.cW(a,r,null,f,b))
else{q=c!=null?B.c.k(c):d
o=e?"":p.c7(q)
p.cy.push(new A.cW(a,r,o,null,b))}},
n(a,b){return this.ab(a,null,null,b,!1,null)},
F(a,b){return this.ab(a,b,null,null,!1,null)},
l(a,b,c){return this.ab(a,b,null,c,!1,null)},
ao(a,b,c){return this.ab(a,b,c,null,!1,null)},
Z(a,b){return this.ab(a,null,b,null,!1,null)},
L(a){return this.ab(a,null,null,null,!1,null)},
aE(a,b,c){return this.ab(a,b,null,null,c,null)},
aQ(a,b){return this.ab(a,null,null,null,!1,b)},
a2(a,b,c){return this.ab(a,b,null,null,!1,c)}}
A.hh.prototype={
$1(a){return a.a},
$S:57}
A.hg.prototype={
$0(){return A.a([],t.gd)},
$S:58}
A.hi.prototype={
$1(a){var s
a.toString
s=A.q0(a,"~","~0")
return A.q0(s,"/","~1")},
$S:59}
A.hl.prototype={
$1(a){return a.a===this.a},
$S:22}
A.hm.prototype={
$0(){return B.d.bf(B.au,new A.hj(this.a),new A.hk())},
$S:61}
A.hj.prototype={
$1(a){return a.a===this.a},
$S:22}
A.hk.prototype={
$0(){return null},
$S:2}
A.hn.prototype={
$2(a,b){this.a.z.m(0,new A.cb(a,this.b.a),b)},
$S:62}
A.bA.prototype={$ia8:1}
A.cU.prototype={
aB(){return"ImageCodec."+this.b}}
A.dV.prototype={
aB(){return"_ColorPrimaries."+this.b}}
A.d5.prototype={
aB(){return"_ColorTransfer."+this.b}}
A.cc.prototype={
aB(){return"Format."+this.b}}
A.cd.prototype={}
A.iC.prototype={
$1(a){var s,r,q,p=this.a
if(!p.c){s=A.oD(t.a.a(a))
r=p.a
q=this.b
switch(s){case B.ag:p.b=new A.iM(q,r)
break
case B.ah:s=new Uint8Array(13)
p.b=new A.k7(B.u,B.r,s,new Uint8Array(32),q,r)
break
case B.ai:p.b=new A.lJ(new Uint8Array(30),q,r)
break
default:r.K()
q.R(B.bj)
return}p.c=!0}p.b.C(0,a)},
$S:11}
A.iE.prototype={
$1(a){this.a.a.K()
this.b.R(a)},
$S:23}
A.iD.prototype={
$0(){var s=this.a.b
s.b.K()
s=s.a
if((s.a.a&30)===0)s.R(B.bi)},
$S:2}
A.iB.prototype={
cb(a){var s
this.b.K()
s=this.a
if((s.a.a&30)===0)s.R(a)}}
A.iM.prototype={
C(a,b){var s,r,q
try{this.dD(b)}catch(r){q=A.M(r)
if(q instanceof A.aL){s=q
this.b.K()
this.a.R(s)}else throw r}},
dD(a){var s,r,q,p,o,n,m,l,k,j,i=this,h=new A.iO(),g=new A.iN()
for(s=J.V(a),r=0;r!==s.gj(a);){q=s.i(a,r)
switch(i.c){case 0:if(255===q)i.c=255
else throw A.d(B.c_)
break
case 255:if(g.$1(q)){i.c=1
i.d=q
i.e=i.f=0}break
case 1:i.e=q<<8>>>0
i.c=2
break
case 2:p=i.e+q
i.e=p
if(p<2)throw A.d(B.bY)
if(h.$1(i.d)){p=i.e
i.r=new Uint8Array(p-2)}i.c=3
break
case 3:o=Math.min(s.gj(a)-r,i.e-i.f-2)
p=h.$1(i.d)
n=i.f
m=n+o
if(p){p=i.r
i.f=m;(p&&B.j).a5(p,n,m,a,r)
if(i.f===i.e-2){i.b.K()
a=i.r
l=a[0]
s=a[1]
p=a[2]
n=a[3]
m=a[4]
k=a[5]
if(k===3)j=B.p
else if(k===1)j=B.ae
else{A.Z(B.bZ)
j=B.O}k=i.a.a
if((k.a&30)!==0)A.Z(A.d2("Future already completed"))
k.ah(new A.cd("image/jpeg",l,j,(n<<8|m)>>>0,(s<<8|p)>>>0,B.r,B.u,!1,!1))
return}}else{i.f=m
if(m===i.e-2)i.c=255}r+=o
continue}++r}}}
A.iO.prototype={
$1(a){return(a&240)===192&&a!==196&&a!==200&&a!==204||a===222},
$S:9}
A.iN.prototype={
$1(a){return!(a===1||(a&248)===208||a===216||a===217||a===255)},
$S:9}
A.k7.prototype={
C(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this,d=new A.k8(e)
for(s=J.V(b),r=e.ay,q=e.ax,p=0;p!==s.gj(b);){o=s.i(b,p)
switch(e.x){case 0:p+=8
e.x=1
continue
case 1:e.c=(e.c<<8|o)>>>0
if(++e.d===4)e.x=2
break
case 2:n=(e.e<<8|o)>>>0
e.e=n
if(++e.f===4){switch(n){case 1229472850:if(e.c!==13){e.b.K()
s=e.a
if((s.a.a&30)===0)s.R(B.q)
return}e.y=!0
break
case 1951551059:e.z=!0
break
case 1665684045:if(e.c!==32){e.b.K()
s=e.a
if((s.a.a&30)===0)s.R(B.q)
return}break
case 1934772034:if(e.c!==1){e.b.K()
s=e.a
if((s.a.a&30)===0)s.R(B.q)
return}break
case 1883789683:if(e.c!==9){e.b.K()
s=e.a
if((s.a.a&30)===0)s.R(B.q)
return}break
case 1732332865:if(e.c!==4){e.b.K()
s=e.a
if((s.a.a&30)===0)s.R(B.q)
return}break
case 1766015824:e.Q=B.F
e.as=B.E
break
case 1229209940:e.b.K()
if(!e.y)e.a.R(B.bX)
s=q.buffer
b=new DataView(s,0)
m=b.getUint32(0,!1)
l=b.getUint32(4,!1)
k=b.getUint8(8)
switch(b.getUint8(9)){case 0:j=e.z?B.af:B.ae
break
case 2:case 3:j=e.z?B.B:B.p
break
case 4:j=B.af
break
case 6:j=B.B
break
default:j=B.O}s=e.as
if(s===B.r)s=e.as=B.t
r=e.Q
if(r===B.u)r=e.Q=B.v
q=e.at
n=e.a.a
if((n.a&30)!==0)A.Z(A.d2("Future already completed"))
n.ah(new A.cd("image/png",k,j,m,l,s,r,q,!1))
return}if(e.c===0)e.x=4
else e.x=3}break
case 3:n=s.gj(b)
i=e.c
h=e.w
g=Math.min(n-p,i-h)
switch(e.e){case 1229472850:n=h+g
e.w=n
B.j.a5(q,h,n,b,p)
break
case 1665684045:case 1732332865:case 1883789683:n=h+g
e.w=n
B.j.a5(r,h,n,b,p)
break
case 1934772034:e.Q=B.v
e.as=B.t
e.w=h+1
break
default:e.w=h+g}if(e.w===e.c){switch(e.e){case 1665684045:if(e.as===B.r)e.dl()
break
case 1732332865:if(e.Q===B.u)e.dm()
break
case 1883789683:n=r.buffer
f=new DataView(n,0)
if(f.getUint32(0,!1)!==f.getUint32(4,!1))e.at=!0
break}e.x=4}p+=g
continue
case 4:if(++e.r===4){d.$0()
e.x=1}break}++p}},
dm(){var s=this
if(s.Q===B.v)return
switch(A.f7(s.ay.buffer,0,null).getUint32(0,!1)){case 45455:s.Q=B.v
break
case 1e5:s.Q=B.en
break
default:s.Q=B.F}},
dl(){var s,r=this
if(r.as===B.t)return
s=A.f7(r.ay.buffer,0,null)
if(s.getUint32(0,!1)===31270&&s.getUint32(4,!1)===32900&&s.getUint32(8,!1)===64e3&&s.getUint32(12,!1)===33e3&&s.getUint32(16,!1)===3e4&&s.getUint32(20,!1)===6e4&&s.getUint32(24,!1)===15e3&&s.getUint32(28,!1)===6000)r.as=B.t
else r.as=B.E}}
A.k8.prototype={
$0(){var s=this.a
s.r=s.w=s.f=s.e=s.d=s.c=0},
$S:1}
A.lJ.prototype={
C(a,b){var s,r,q,p,o,n,m,l=this,k=J.a3(b),j=l.d,i=l.c
k=j+Math.min(k,30-j)
l.d=k
B.j.d5(i,j,k,b)
k=l.d
if(k>=25)k=k<30&&i[15]!==76
else k=!0
if(k)return
l.b.K()
s=A.f7(i.buffer,0,null)
if(s.getUint32(0,!1)!==1380533830||s.getUint32(8,!1)!==1464156752){l.cb(B.aj)
return}switch(s.getUint32(12,!1)){case 1448097824:r=s.getUint16(26,!0)&16383
q=s.getUint16(28,!0)&16383
p=B.p
o=!1
n=!1
break
case 1448097868:k=i[21]
j=i[22]
r=1+((k|(j&63)<<8)>>>0)
k=i[23]
i=i[24]
q=1+((j>>>6|k<<2|(i&15)<<10)>>>0)
p=(i&16)===16?B.B:B.p
o=!1
n=!1
break
case 1448097880:m=i[20]
n=(m&2)===2
o=(m&32)===32
p=(m&16)===16?B.B:B.p
r=((i[24]|i[25]<<8|i[26]<<16)>>>0)+1
q=((i[27]|i[28]<<8|i[29]<<16)>>>0)+1
break
default:l.cb(B.aj)
return}k=o?B.F:B.v
j=o?B.E:B.t
l.a.a3(new A.cd("image/webp",8,p,r,q,j,k,!1,n))}}
A.dS.prototype={$ia8:1}
A.dR.prototype={$ia8:1}
A.aL.prototype={
k(a){return this.a},
$ia8:1}
A.d9.prototype={
aB(){return"_Storage."+this.b}}
A.fn.prototype={
bn(){var s,r=this,q=t.X,p=t._,o=A.a9(q,p)
o.m(0,"pointer",r.a)
s=r.b
if(s!=null)o.m(0,"mimeType",s)
s=r.c
if(s!=null)o.m(0,"storage",B.cy[s.a])
s=r.e
if(s!=null)o.m(0,"uri",s)
s=r.d
if(s!=null)o.m(0,"byteLength",s)
s=r.f
if(s!=null){q=A.a9(q,p)
q.m(0,"width",s.d)
q.m(0,"height",s.e)
p=s.c
if(p!==B.O)q.m(0,"format",B.dd[p.a])
p=s.f
if(p!==B.r)q.m(0,"primaries",B.d6[p.a])
p=s.r
if(p!==B.u)q.m(0,"transfer",B.d5[p.a])
p=s.b
if(p>0)q.m(0,"bits",p)
o.m(0,"image",q)}return o}}
A.kb.prototype={
aX(){var s=!0
return this.eb()},
eb(){var s=0,r=A.ex(t.H),q,p=2,o,n=this,m,l,k
var $async$aX=A.ez(function(a,b){if(a===1){o=b
s=p}while(true)switch(s){case 0:l=!0
p=4
s=7
return A.dd(n.b7(),$async$aX)
case 7:s=8
return A.dd(n.b8(),$async$aX)
case 8:if(l)A.xS(n.a,n.b)
n.a.eC(n.b)
p=2
s=6
break
case 4:p=3
k=o
if(A.M(k) instanceof A.bA){s=1
break}else throw k
s=6
break
case 3:s=2
break
case 6:case 1:return A.es(q,r)
case 2:return A.er(o,r)}})
return A.et($async$aX,r)},
b7(){var s=0,r=A.ex(t.H),q=1,p,o=this,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3
var $async$b7=A.ez(function(a4,a5){if(a4===1){p=a5
s=q}while(true)switch(s){case 0:a1=o.b
a2=a1.c
B.d.P(a2)
a2.push("buffers")
j=o.a.x,i=j.b,h=a1.ch,g=t.M,f=t.x,j=j.a,e=j.length,d=0
case 2:if(!(d<i)){s=4
break}c=d>=e
n=c?null:j[d]
if(n==null){s=3
break}a2.push(B.c.k(d))
b=new A.fn(a1.S())
b.b="application/gltf-buffer"
m=new A.kc(o,b,d)
l=null
q=6
s=9
return A.dd(m.$1(n),$async$b7)
case 9:l=a5
q=1
s=8
break
case 6:q=5
a3=p
c=A.M(a3)
if(f.b(c)){k=c
a1.l($.nh(),A.a([k],g),"uri")}else throw a3
s=8
break
case 5:s=1
break
case 8:if(l!=null){b.d=J.a3(l)
if(J.a3(l)<n.x)a1.F($.ql(),A.a([J.a3(l),n.x],g))
else{if(a1.dx&&d===0&&!n.y){c=n.x
a0=c+(-c&3)
if(J.a3(l)>a0)a1.F($.qm(),A.a([J.a3(l)-a0],g))}c=n
if(c.z==null)c.z=l}}h.push(b.bn())
a2.pop()
case 3:++d
s=2
break
case 4:return A.es(null,r)
case 1:return A.er(p,r)}})
return A.et($async$b7,r)},
b8(){var s=0,r=A.ex(t.H),q=1,p,o=this,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7
var $async$b8=A.ez(function(a9,b0){if(a9===1){p=b0
s=q}while(true)switch(s){case 0:a5=o.b
a6=a5.c
B.d.P(a6)
a6.push("images")
g=o.a.Q,f=g.b,e=a5.ch,d=t.M,c=t.x,b=a5.dy,g=g.a,a=g.length,a0=0
case 2:if(!(a0<f)){s=4
break}a1=a0>=a
n=a1?null:g[a0]
if(n==null){s=3
break}a6.push(B.c.k(a0))
a2=new A.fn(a5.S())
m=new A.kd(o,a2)
l=null
try{l=m.$1(n)}catch(a8){a1=A.M(a8)
if(c.b(a1)){k=a1
a5.l($.nh(),A.a([k],d),"uri")}else throw a8}j=null
s=l!=null?5:6
break
case 5:q=8
s=11
return A.dd(A.uf(l),$async$b8)
case 11:j=b0
a1=B.d.G(b,j.a)
if(!a1)a5.F($.qq(),A.a([j.a],d))
q=1
s=10
break
case 8:q=7
a7=p
a1=A.M(a7)
if(a1 instanceof A.dS)a5.L($.qt())
else if(a1 instanceof A.dR)a5.L($.qs())
else if(a1 instanceof A.aL){i=a1
a5.F($.qn(),A.a([i],d))}else if(c.b(a1)){h=a1
a5.l($.nh(),A.a([h],d),"uri")}else throw a7
s=10
break
case 7:s=1
break
case 10:if(j!=null){a2.b=j.a
if(n.x!=null&&n.x!==j.a){a1=$.qp()
a4=A.a([j.a,n.x],d)
a5.l(a1,a4,a2.c===B.aN?"bufferView":"uri")}a1=j.d
if(a1!==0&&(a1&a1-1)>>>0===0){a1=j.e
a1=!(a1!==0&&(a1&a1-1)>>>0===0)}else a1=!0
if(a1)a5.F($.qr(),A.a([j.d,j.e],d))
a1=j
if(a1.f===B.E||a1.r===B.F||j.x||j.w)a5.L($.qo())
n.as=j
a2.f=j}case 6:e.push(a2.bn())
a6.pop()
case 3:++a0
s=2
break
case 4:return A.es(null,r)
case 1:return A.er(p,r)}})
return A.et($async$b8,r)}}
A.kc.prototype={
$1(a){var s,r,q,p=this
if(a.x===-1)return null
s=a.w
if(s!=null){r=p.b
r.c=B.aO
r.e=s.k(0)
return p.a.c.$1(s)}else{s=a.z
if(s!=null){p.b.c=B.aM
return s}else{s=p.a
r=s.b
if(r.dx&&p.c===0&&!a.y){p.b.c=B.ep
q=s.c.$0()
if(q==null)r.L($.qW())
return q}}}return null},
$S:65}
A.kd.prototype={
$1(a){var s,r,q=this
if(a.a.a===0){s=a.y
if(s!=null){r=q.b
r.c=B.aO
r.e=s.k(0)
return q.a.d.$1(s)}else{s=a.z
if(s!=null){q.b.c=B.aM
return A.fs(s,t.w)}else if(a.Q!=null){q.b.c=B.aN
a.ez()
s=a.z
if(s!=null)return A.fs(s,t.w)}}}return null},
$S:66}
A.ne.prototype={
$2(a,b){var s,r,q,p,o,n,m,l,k=A.mJ(b)
if((k==null?null:k.ay)!=null){k=this.a
s=k.c
B.d.P(s)
s.push("accessors")
s.push(B.c.k(a))
r=b.ay.ge8()
if(r!=null)for(s=r.length,q=b.z,p=t.M,o=0,n=-1,m=0;m<s;++m,n=l){l=r[m]
if(n!==-1&&l<=n)k.l($.qi(),A.a([o,l,n],p),"sparse")
if(l>=q)k.l($.qh(),A.a([o,l,q],p),"sparse");++o}}},
$S:67}
A.nf.prototype={
$1(a){return a.as===0},
$S:5}
A.ng.prototype={
$2(a,b){var s,r,q,p,o=this,n=null,m=b.CW,l=b.as,k=A.U(l,n,!1,t.bF),j=A.U(l,n,!1,t.ga),i=t.hc,h=b.ay,g=0
while(!0){if(!(g<l)){s=!1
break}r=""+g
q=A.mJ(h.i(0,"JOINTS_"+r))
p=A.mJ(h.i(0,"WEIGHTS_"+r))
if((q==null?n:q.z)===m)r=(p==null?n:p.z)!==m
else r=!0
if(r){s=!0
break}r=i.a(q).af()
k[g]=new A.aH(r.a(),A.A(r).h("aH<1>"))
r=p.bq()
j[g]=new A.aH(r.a(),A.A(r).h("aH<1>"));++g}if(s)return
l=o.b
i=l.c
i.push(B.c.k(a))
i.push("attributes")
h=o.c
B.d.D(h,k)
B.d.D(h,j)
l=l.S()
h=o.a
o.d.push(new A.eX(k,j,h.b-1,h.a,l,A.aD(t.e)))
i.pop()
i.pop()},
$S:20}
A.mL.prototype={
$1(a){return a.gt()==null},
$S:68}
A.eX.prototype={
dY(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d=this
for(s=d.a,r=s.length,q=d.b,p=d.c,o=d.e,n=o+"/JOINTS_",m=t.M,l=d.z,o+="/WEIGHTS_",k=d.d,j=0;j<r;++j){i=s[j].gt()
if(i==null){d.w=!0
return}if(i>p){a.l($.qe(),A.a([d.f,d.r,i,p,k],m),n+j)
continue}h=q[j].gt()
if(h==null){d.w=!0
return}if(h!==0){if(!l.C(0,i)){a.l($.qd(),A.a([d.f,d.r,i],m),n+j)
g=!1}else g=!0
if(h<0)a.l($.qj(),A.a([d.f,d.r,h],m),o+j)
else if(g){f=d.x
e=$.ol()
e[0]=f+h
d.x=e[0]
d.y+=2e-7}}else if(i!==0)a.l($.qf(),A.a([d.f,d.r,i],m),n+j)}if(4===++d.r){if(Math.abs(d.x-1)>d.y)for(j=0;j<r;++j){s=$.qk()
q=d.f
a.l(s,A.a([q-3,q,d.x],m),o+j)}l.P(0)
d.x=d.y=d.r=0}++d.f}}
A.bH.prototype={
aB(){return"Severity."+this.b}}
A.iH.prototype={}
A.ho.prototype={}
A.hL.prototype={
$1(a){return"Actual data byte length ("+A.b(a[0])+") is less than the declared buffer byte length ("+A.b(a[1])+")."},
$S:0}
A.hM.prototype={
$1(a){return"GLB-stored BIN chunk contains "+A.b(a[0])+" extra padding byte(s)."},
$S:0}
A.hE.prototype={
$1(a){return"Declared minimum value for this component ("+A.b(a[0])+") does not match actual minimum ("+A.b(a[1])+")."},
$S:0}
A.hD.prototype={
$1(a){return"Declared maximum value for this component ("+A.b(a[0])+") does not match actual maximum ("+A.b(a[1])+")."},
$S:0}
A.ht.prototype={
$1(a){return"Accessor contains "+A.b(a[0])+" element(s) less than declared minimum value "+A.b(a[1])+"."},
$S:0}
A.hs.prototype={
$1(a){return"Accessor contains "+A.b(a[0])+" element(s) greater than declared maximum value "+A.b(a[1])+"."},
$S:0}
A.hI.prototype={
$1(a){return"Vector3 at accessor indices "+A.b(a[0])+".."+A.b(a[1])+" is not of unit length: "+A.b(a[2])+"."},
$S:0}
A.hz.prototype={
$1(a){return"Vector3 with sign at accessor indices "+A.b(a[0])+".."+A.b(a[1])+" has invalid w component: "+A.b(a[2])+". Must be 1.0 or -1.0."},
$S:0}
A.hr.prototype={
$1(a){return"Animation sampler output accessor element at indices "+A.b(a[0])+".."+A.b(a[1])+" is not of unit length: "+A.b(a[2])+"."},
$S:0}
A.hF.prototype={
$1(a){return"Accessor element at index "+A.b(a[0])+" is not clamped to 0..1 range: "+A.b(a[1])+"."},
$S:0}
A.hx.prototype={
$1(a){return"Accessor element at index "+A.b(a[0])+" is "+A.b(a[1])+"."},
$S:0}
A.hu.prototype={
$1(a){return"Indices accessor element at index "+A.b(a[0])+" has value "+A.b(a[1])+" that is greater than the maximum vertex index available ("+A.b(a[2])+")."},
$S:0}
A.hw.prototype={
$1(a){return"Indices accessor contains "+A.b(a[0])+" degenerate triangles (out of "+A.b(a[1])+")."},
$S:0}
A.hv.prototype={
$1(a){return"Indices accessor contains primitive restart value ("+A.b(a[0])+") at index "+A.b(a[1])+"."},
$S:0}
A.hp.prototype={
$1(a){return u.m+A.b(a[0])+" is negative: "+A.b(a[1])+"."},
$S:0}
A.hq.prototype={
$1(a){return u.m+A.b(a[0])+" is less than or equal to previous: "+A.b(a[1])+" <= "+A.b(a[2])+"."},
$S:0}
A.hH.prototype={
$1(a){return u.d+A.b(a[0])+" is less than or equal to previous: "+A.b(a[1])+" <= "+A.b(a[2])+"."},
$S:0}
A.hG.prototype={
$1(a){return u.d+A.b(a[0])+" is greater than or equal to the number of accessor elements: "+A.b(a[1])+" >= "+A.b(a[2])+"."},
$S:0}
A.hy.prototype={
$1(a){return"Matrix element at index "+A.b(a[0])+" (component index "+A.b(a[1])+") contains invalid value: "+A.b(a[2])+"."},
$S:0}
A.hO.prototype={
$1(a){return"Image data is invalid. "+A.b(a[0])},
$S:0}
A.hQ.prototype={
$1(a){return"Recognized image format "+("'"+A.b(a[0])+"'")+" does not match declared image format "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.hT.prototype={
$1(a){return"Unexpected end of image stream."},
$S:0}
A.hU.prototype={
$1(a){return"Image format not recognized."},
$S:0}
A.hR.prototype={
$1(a){return"'"+A.b(a[0])+"' MIME type requires an extension."},
$S:0}
A.hS.prototype={
$1(a){return"Image has non-power-of-two dimensions: "+A.b(a[0])+"x"+A.b(a[1])+"."},
$S:0}
A.hP.prototype={
$1(a){return"Image contains unsupported features like non-default colorspace information, non-square pixels, or animation."},
$S:0}
A.hV.prototype={
$1(a){return"URI is used in GLB container."},
$S:0}
A.hN.prototype={
$1(a){return"Data URI is used in GLB container."},
$S:0}
A.hB.prototype={
$1(a){return"Joints accessor element at index "+A.b(a[0])+" (component index "+A.b(a[1])+") has value "+A.b(a[2])+" that is greater than the maximum joint index ("+A.b(a[3])+") set by skin "+A.b(a[4])+"."},
$S:0}
A.hA.prototype={
$1(a){return"Joints accessor element at index "+A.b(a[0])+" (component index "+A.b(a[1])+") has value "+A.b(a[2])+" that is already in use for the vertex."},
$S:0}
A.hJ.prototype={
$1(a){return"Weights accessor element at index "+A.b(a[0])+" (component index "+A.b(a[1])+") has negative value "+A.b(a[2])+"."},
$S:0}
A.hK.prototype={
$1(a){return"Weights accessor elements (at indices "+A.b(a[0])+".."+A.b(a[1])+") have non-normalized sum: "+A.b(a[2])+"."},
$S:0}
A.hC.prototype={
$1(a){return"Joints accessor element at index "+A.b(a[0])+" (component index "+A.b(a[1])+") is used with zero weight but has non-zero value ("+A.b(a[2])+")."},
$S:0}
A.iF.prototype={}
A.iG.prototype={
$1(a){return J.as(a[0])},
$S:0}
A.kf.prototype={}
A.kh.prototype={
$1(a){return"Invalid array length "+A.b(a[0])+". Valid lengths are: "+J.bt(t.Y.a(a[1]),A.pM(),t.X).k(0)+"."},
$S:0}
A.ki.prototype={
$1(a){var s=a[0]
s=typeof s=="string"?"'"+s+"'":J.as(s)
return"Type mismatch. Array element "+A.b(s)+" is not a "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.kg.prototype={
$1(a){return"Duplicate element."},
$S:0}
A.kk.prototype={
$1(a){return"Index must be a non-negative integer."},
$S:0}
A.kl.prototype={
$1(a){return"Invalid JSON data. Parser output: "+A.b(a[0])},
$S:0}
A.km.prototype={
$1(a){return"Invalid URI "+("'"+A.b(a[0])+"'")+". Parser output:\n"+A.b(a[1])},
$S:0}
A.kj.prototype={
$1(a){return"Entity cannot be empty."},
$S:0}
A.kn.prototype={
$1(a){a.toString
return"Exactly one of "+new A.ab(a,A.dj(),A.a_(a).h("ab<1,e*>")).k(0)+" properties must be defined."},
$S:0}
A.ko.prototype={
$1(a){return"Value "+("'"+A.b(a[0])+"'")+" does not match regexp pattern "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.kp.prototype={
$1(a){var s=a[0]
s=typeof s=="string"?"'"+s+"'":J.as(s)
return"Type mismatch. Property value "+A.b(s)+" is not a "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.ku.prototype={
$1(a){var s=a[0]
s=typeof s=="string"?"'"+s+"'":J.as(s)
return"Invalid value "+A.b(s)+". Valid values are "+J.bt(t.Y.a(a[1]),A.pM(),t.X).k(0)+"."},
$S:0}
A.kv.prototype={
$1(a){return"Value "+A.b(a[0])+" is out of range."},
$S:0}
A.kt.prototype={
$1(a){return"Value "+A.b(a[0])+" is not a multiple of "+A.b(a[1])+"."},
$S:0}
A.kq.prototype={
$1(a){return"Property "+("'"+A.b(a[0])+"'")+" must be defined."},
$S:0}
A.kr.prototype={
$1(a){return"Unexpected property."},
$S:0}
A.ks.prototype={
$1(a){return"Dependency failed. "+("'"+A.b(a[0])+"'")+" must be defined."},
$S:0}
A.kw.prototype={}
A.lj.prototype={
$1(a){return"Unknown glTF major asset version: "+A.b(a[0])+"."},
$S:0}
A.lk.prototype={
$1(a){return"Unknown glTF minor asset version: "+A.b(a[0])+"."},
$S:0}
A.l4.prototype={
$1(a){return"Asset minVersion "+("'"+A.b(a[0])+"'")+" is greater than version "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.kL.prototype={
$1(a){return"Invalid value "+A.b(a[0])+" for GL type "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.ky.prototype={
$1(a){return"Only (u)byte and (u)short accessors can be normalized."},
$S:0}
A.kz.prototype={
$1(a){return"Offset "+A.b(a[0])+" is not a multiple of componentType length "+A.b(a[1])+"."},
$S:0}
A.kx.prototype={
$1(a){return"Matrix accessors must be aligned to 4-byte boundaries."},
$S:0}
A.kA.prototype={
$1(a){return"Sparse accessor overrides more elements ("+A.b(a[0])+") than the base accessor contains ("+A.b(a[1])+")."},
$S:0}
A.kB.prototype={
$1(a){return"Animated TRS properties will not affect a skinned mesh."},
$S:0}
A.kC.prototype={
$1(a){return"Data URI media type must be 'application/octet-stream' or 'application/gltf-buffer'. Found "+("'"+A.b(a[0])+"'")+" instead."},
$S:0}
A.kE.prototype={
$1(a){return"Buffer view's byteStride ("+A.b(a[0])+") is greater than byteLength ("+A.b(a[1])+")."},
$S:0}
A.kD.prototype={
$1(a){return"Only buffer views with raw vertex data can have byteStride."},
$S:0}
A.kF.prototype={
$1(a){return"xmag and ymag should not be negative."},
$S:0}
A.kG.prototype={
$1(a){return"xmag and ymag must not be zero."},
$S:0}
A.kH.prototype={
$1(a){return"yfov should be less than Pi."},
$S:0}
A.kI.prototype={
$1(a){return"zfar must be greater than znear."},
$S:0}
A.kX.prototype={
$1(a){return"Alpha cutoff is supported only for 'MASK' alpha mode."},
$S:0}
A.l_.prototype={
$1(a){return"Invalid attribute name."},
$S:0}
A.l3.prototype={
$1(a){return"All primitives must have the same number of morph targets."},
$S:0}
A.l1.prototype={
$1(a){return"No POSITION attribute found."},
$S:0}
A.kZ.prototype={
$1(a){return"Indices for indexed attribute semantic "+("'"+A.b(a[0])+"'")+" must start with 0 and be continuous. Total expected indices: "+A.b(a[1])+", total provided indices: "+A.b(a[2])+"."},
$S:0}
A.l2.prototype={
$1(a){return"TANGENT attribute without NORMAL found."},
$S:0}
A.l0.prototype={
$1(a){return"Number of JOINTS attribute semantics ("+A.b(a[0])+") does not match the number of WEIGHTS ("+A.b(a[1])+")."},
$S:0}
A.kY.prototype={
$1(a){return"The length of weights array ("+A.b(a[0])+u.p+A.b(a[1])+")."},
$S:0}
A.l8.prototype={
$1(a){return"A node can have either a matrix or any combination of translation/rotation/scale (TRS) properties."},
$S:0}
A.l6.prototype={
$1(a){return"Do not specify default transform matrix."},
$S:0}
A.l9.prototype={
$1(a){return"Matrix must be decomposable to TRS."},
$S:0}
A.lg.prototype={
$1(a){return"Rotation quaternion must be normalized."},
$S:0}
A.ll.prototype={
$1(a){return"Unused extension "+("'"+A.b(a[0])+"'")+" cannot be required."},
$S:0}
A.lf.prototype={
$1(a){return"Extension "+("'"+A.b(a[0])+"'")+" cannot be optional."},
$S:0}
A.kK.prototype={
$1(a){return"Extension name has invalid format."},
$S:0}
A.l7.prototype={
$1(a){return"Empty node encountered."},
$S:0}
A.lc.prototype={
$1(a){return"Node with a skinned mesh is not root. Parent transforms will not affect a skinned mesh."},
$S:0}
A.lb.prototype={
$1(a){return"Local transforms will not affect a skinned mesh."},
$S:0}
A.la.prototype={
$1(a){return"A node with a skinned mesh is used in a scene that does not contain joint nodes."},
$S:0}
A.lh.prototype={
$1(a){return"Joints do not have a common root."},
$S:0}
A.li.prototype={
$1(a){return"Skeleton node is not a common root."},
$S:0}
A.le.prototype={
$1(a){return"Non-relative URI found: "+("'"+A.b(a[0])+"'")+"."},
$S:0}
A.l5.prototype={
$1(a){return"This extension may be incompatible with other extensions for the object."},
$S:0}
A.ld.prototype={
$1(a){return"Prefer JSON Objects for extras."},
$S:0}
A.kJ.prototype={
$1(a){return"This property should not be defined as it will not be used."},
$S:0}
A.kM.prototype={
$1(a){return"This extension requires the animation channel target node to be undefined."},
$S:0}
A.kN.prototype={
$1(a){return"This extension requires the animation channel target path to be 'pointer'. Found "+("'"+A.b(a[0])+"'")+" instead."},
$S:0}
A.kO.prototype={
$1(a){return"outerConeAngle ("+A.b(a[1])+") is less than or equal to innerConeAngle ("+A.b(a[0])+")."},
$S:0}
A.kP.prototype={
$1(a){return"Normal and anisotropy textures should use the same texture coords."},
$S:0}
A.kQ.prototype={
$1(a){return"Normal and clearcoat normal textures should use the same texture coords."},
$S:0}
A.kR.prototype={
$1(a){return"The dispersion extension needs to be combined with the volume extension."},
$S:0}
A.kS.prototype={
$1(a){return"Emissive strength has no effect when the emissive factor is zero or undefined."},
$S:0}
A.kW.prototype={
$1(a){return"The volume extension needs to be combined with an extension that allows light to transmit through the surface."},
$S:0}
A.kV.prototype={
$1(a){return"The volume extension should not be used with double-sided materials."},
$S:0}
A.kT.prototype={
$1(a){return"Thickness minimum has no effect when a thickness texture is not defined."},
$S:0}
A.kU.prototype={
$1(a){return"Thickness texture has no effect when the thickness minimum is equal to the thickness maximum."},
$S:0}
A.iY.prototype={}
A.j0.prototype={
$1(a){return"Accessor's total byteOffset "+A.b(a[0])+" isn't a multiple of componentType length "+A.b(a[1])+"."},
$S:0}
A.iZ.prototype={
$1(a){return"Referenced bufferView's byteStride value "+A.b(a[0])+" is less than accessor element's length "+A.b(a[1])+"."},
$S:0}
A.j_.prototype={
$1(a){return"Accessor (offset: "+A.b(a[0])+", length: "+A.b(a[1])+") does not fit referenced bufferView ["+A.b(a[2])+"] length "+A.b(a[3])+"."},
$S:0}
A.j1.prototype={
$1(a){return"Override of previously set accessor usage. Initial: "+("'"+A.b(a[0])+"'")+", new: "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.j4.prototype={
$1(a){return"Animation channel has the same target as channel "+A.b(a[0])+"."},
$S:0}
A.j2.prototype={
$1(a){return"Animation channel cannot target TRS properties of a node with defined matrix."},
$S:0}
A.j3.prototype={
$1(a){return"Animation channel cannot target WEIGHTS when mesh does not have morph targets."},
$S:0}
A.j8.prototype={
$1(a){return"accessor.min and accessor.max must be defined for animation input accessor."},
$S:0}
A.j6.prototype={
$1(a){return"Invalid Animation sampler input accessor format "+("'"+A.b(a[0])+"'")+". Must be one of "+J.bt(t.Y.a(a[1]),A.dj(),t.X).k(0)+"."},
$S:0}
A.ja.prototype={
$1(a){return"Invalid animation sampler output accessor format "+("'"+A.b(a[0])+"'")+" for path "+("'"+A.b(a[2])+"'")+". Must be one of "+J.bt(t.Y.a(a[1]),A.dj(),t.X).k(0)+"."},
$S:0}
A.j7.prototype={
$1(a){return"Animation sampler output accessor with "+("'"+A.b(a[0])+"'")+" interpolation must have at least "+A.b(a[1])+" elements. Got "+A.b(a[2])+"."},
$S:0}
A.j9.prototype={
$1(a){return"Animation sampler output accessor of count "+A.b(a[0])+" expected. Found "+A.b(a[1])+"."},
$S:0}
A.j5.prototype={
$1(a){return"bufferView.byteStride must not be defined for buffer views used by animation sampler accessors."},
$S:0}
A.jb.prototype={
$1(a){return"Buffer refers to an unresolved GLB binary chunk."},
$S:0}
A.je.prototype={
$1(a){return"BufferView does not fit buffer ("+A.b(a[0])+") byteLength ("+A.b(a[1])+")."},
$S:0}
A.jd.prototype={
$1(a){return"Override of previously set bufferView target or usage. Initial: "+("'"+A.b(a[0])+"'")+", new: "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.jc.prototype={
$1(a){return"bufferView.target should be set for vertex or index data."},
$S:0}
A.jf.prototype={
$1(a){return"bufferView.byteStride must not be defined for buffer views containing image data."},
$S:0}
A.jg.prototype={
$1(a){return"Validation support for this extension is incomplete; the asset may have undetected issues."},
$S:0}
A.jh.prototype={
$1(a){return"IBM accessor must have at least "+A.b(a[0])+" elements. Found "+A.b(a[1])+"."},
$S:0}
A.jl.prototype={
$1(a){return"Invalid accessor format "+("'"+A.b(a[0])+"'")+" for this attribute semantic. Must be one of "+J.bt(t.Y.a(a[1]),A.dj(),t.X).k(0)+"."},
$S:0}
A.jm.prototype={
$1(a){return"Mesh attributes cannot use UNSIGNED_INT component type."},
$S:0}
A.ju.prototype={
$1(a){return"accessor.min and accessor.max must be defined for POSITION attribute accessor."},
$S:0}
A.jk.prototype={
$1(a){return"bufferView.byteStride must be defined when two or more accessors use the same buffer view."},
$S:0}
A.jj.prototype={
$1(a){return"Vertex attribute data must be aligned to 4-byte boundaries."},
$S:0}
A.jq.prototype={
$1(a){return"bufferView.byteStride must not be defined for indices accessor."},
$S:0}
A.jp.prototype={
$1(a){return"Invalid indices accessor format "+("'"+A.b(a[0])+"'")+". Must be one of "+J.bt(t.Y.a(a[1]),A.dj(),t.X).k(0)+". "},
$S:0}
A.jo.prototype={
$1(a){return"Number of vertices or indices ("+A.b(a[0])+") is not compatible with used drawing mode ("+("'"+A.b(a[1])+"'")+")."},
$S:0}
A.jv.prototype={
$1(a){return"Material is incompatible with mesh primitive: Texture binding "+("'"+A.b(a[0])+"'")+" needs 'TEXCOORD_"+A.b(a[1])+"' attribute."},
$S:0}
A.jt.prototype={
$1(a){return"Material requires a tangent space but the mesh primitive does not provide it and the material does not contain a normal map to generate it."},
$S:0}
A.jn.prototype={
$1(a){return"Material requires a tangent space but the mesh primitive does not provide it. Runtime-generated tangent space may be non-portable across implementations."},
$S:0}
A.jw.prototype={
$1(a){return"All accessors of the same primitive must have the same count."},
$S:0}
A.js.prototype={
$1(a){return"The mesh primitive does not define this attribute semantic."},
$S:0}
A.jr.prototype={
$1(a){return"Base accessor has different count."},
$S:0}
A.jx.prototype={
$1(a){return"Node is a part of a node loop."},
$S:0}
A.jy.prototype={
$1(a){return"Value overrides parent of node "+A.b(a[0])+"."},
$S:0}
A.jB.prototype={
$1(a){var s=A.b(a[0]),r=a[1]
return"The length of weights array ("+s+u.p+A.b(r==null?0:r)+")."},
$S:0}
A.jz.prototype={
$1(a){return"Node has skin defined, but mesh has no joints data."},
$S:0}
A.jA.prototype={
$1(a){return"Node uses skinned mesh, but has no skin defined."},
$S:0}
A.jC.prototype={
$1(a){return"Node "+A.b(a[0])+" is not a root node."},
$S:0}
A.jE.prototype={
$1(a){return"Invalid IBM accessor format "+("'"+A.b(a[0])+"'")+". Must be one of "+J.bt(t.Y.a(a[1]),A.dj(),t.X).k(0)+". "},
$S:0}
A.jD.prototype={
$1(a){return"bufferView.byteStride must not be defined for buffer views used by inverse bind matrices accessors."},
$S:0}
A.jF.prototype={
$1(a){return"Invalid MIME type "+("'"+A.b(a[0])+"'")+" for the texture source. Valid MIME types are "+J.bt(t.Y.a(a[1]),A.dj(),t.X).k(0)+"."},
$S:0}
A.jG.prototype={
$1(a){return"Extension is not declared in extensionsUsed."},
$S:0}
A.jH.prototype={
$1(a){return"Unexpected location for this extension."},
$S:0}
A.jI.prototype={
$1(a){return"Unresolved reference: "+A.b(a[0])+"."},
$S:0}
A.jJ.prototype={
$1(a){return"Cannot validate an extension as it is not supported by the validator: "+("'"+A.b(a[0])+"'")+"."},
$S:0}
A.jM.prototype={
$1(a){return"This object may be unused."},
$S:0}
A.jL.prototype={
$1(a){return"The static morph target weights are always overridden."},
$S:0}
A.jK.prototype={
$1(a){return"Tangents are not used because the material has no normal texture."},
$S:0}
A.ji.prototype={
$1(a){return"This variant is used more than once for this mesh primitive."},
$S:0}
A.hZ.prototype={}
A.i5.prototype={
$1(a){return"Invalid GLB magic value ("+A.b(a[0])+")."},
$S:0}
A.i6.prototype={
$1(a){return"Invalid GLB version value "+A.b(a[0])+"."},
$S:0}
A.i8.prototype={
$1(a){return"Declared GLB length ("+A.b(a[0])+") is too small."},
$S:0}
A.i_.prototype={
$1(a){return"Length of "+A.b(a[0])+" chunk is not aligned to 4-byte boundaries."},
$S:0}
A.i7.prototype={
$1(a){return"Declared length ("+A.b(a[0])+") does not match GLB length ("+A.b(a[1])+")."},
$S:0}
A.i0.prototype={
$1(a){return"Chunk ("+A.b(a[0])+") length ("+A.b(a[1])+") does not fit total GLB length."},
$S:0}
A.i3.prototype={
$1(a){return"Chunk ("+A.b(a[0])+") cannot have zero length."},
$S:0}
A.i2.prototype={
$1(a){return"Empty BIN chunk should be omitted."},
$S:0}
A.i1.prototype={
$1(a){return"Chunk of type "+A.b(a[0])+" has already been used."},
$S:0}
A.ib.prototype={
$1(a){return"Unexpected end of chunk header."},
$S:0}
A.ia.prototype={
$1(a){return"Unexpected end of chunk data."},
$S:0}
A.ic.prototype={
$1(a){return"Unexpected end of header."},
$S:0}
A.id.prototype={
$1(a){return"First chunk must be of JSON type. Found "+A.b(a[0])+" instead."},
$S:0}
A.i9.prototype={
$1(a){return"BIN chunk must be the second chunk."},
$S:0}
A.ie.prototype={
$1(a){return"Unknown GLB chunk type: "+A.b(a[0])+"."},
$S:0}
A.i4.prototype={
$1(a){return"Extra data after the end of GLB stream."},
$S:0}
A.cW.prototype={
gbl(){var s=J.tJ(this.a.c.$1(this.e))
return s},
gc9(){var s=this.b
return s==null?this.a.a:s},
gE(a){return B.a.gE(this.k(0))},
O(a,b){if(b==null)return!1
return b instanceof A.cW&&b.k(0)===this.k(0)},
k(a){var s=this,r=s.c
if(r!=null&&r.length!==0)return A.b(r)+": "+s.gbl()
r=s.d
if(r!=null)return"@"+A.b(r)+": "+s.gbl()
return s.gbl()}}
A.ca.prototype={
p(a,b){var s=this.d,r=this.e=a.Q.i(0,s)
if(s!==-1)if(r==null)b.l($.Q(),A.a([s],t.M),"source")
else r.a$=!0},
c4(a,b){var s=this.e,r=s==null,q=r?null:s.x
if(q==null){s=r?null:s.as
q=s==null?null:s.a}if(q!=null&&q!=="image/webp")b.l($.oa(),A.a([q,B.d7],t.M),"source")},
$icC:1}
A.cf.prototype={
p(a,b){var s,r
b.L($.r_())
for(s=b.e,r=this;r!=null;){r=s.i(0,r)
if(r instanceof A.bw){if(r.f!=null)b.L($.rD())
s=r.e
if(s!=="pointer")b.F($.rE(),A.a([s],t.M))
break}}}}
A.bC.prototype={
p(a,b){var s,r,q=b.c
q.push("lights")
s=this.d
r=J.cX(q.slice(0),A.a_(q).c)
b.x.m(0,s,r)
s.a4(new A.iS(b,a))
q.pop()}}
A.iS.prototype={
$2(a,b){var s=this.a.c
s.push(B.c.k(a))
s.pop()},
$S:70}
A.ba.prototype={}
A.cg.prototype={}
A.ch.prototype={
p(a,b){var s,r,q=a.a.i(0,"KHR_lights_punctual")
if(q instanceof A.bC){s=this.d
r=this.e=q.d.i(0,s)
if(s!==-1)if(r==null)b.l($.Q(),A.a([s],t.M),"light")
else r.a$=!0}else b.F($.cO(),A.a(["/extensions/KHR_lights_punctual"],t.M))}}
A.ci.prototype={
p(a,b){var s,r,q,p,o=this.f
if(o!=null){s=b.c
s.push("anisotropyTexture")
o.p(a,b)
for(r=b.e,q=this;q!=null;){q=r.i(0,q)
if(q instanceof A.ai){q.ay=!0
p=q.x
if(p!=null&&p.e!==o.e)b.L($.rG())
break}}s.pop()}}}
A.cj.prototype={
p(a,b){var s,r,q,p,o=this,n=o.e
if(n!=null){s=b.c
s.push("clearcoatTexture")
n.p(a,b)
s.pop()}n=o.r
if(n!=null){s=b.c
s.push("clearcoatRoughnessTexture")
n.p(a,b)
s.pop()}n=o.w
if(n!=null){s=b.c
s.push("clearcoatNormalTexture")
n.p(a,b)
for(r=b.e,q=o;q!=null;){q=r.i(0,q)
if(q instanceof A.ai){p=q.x
if(p!=null&&p.e!==n.e)b.L($.rH())
break}}s.pop()}}}
A.ck.prototype={
p(a,b){var s,r
for(s=b.e,r=this;r!=null;){r=s.i(0,r)
if(r instanceof A.ai){if(!r.a.v("KHR_materials_volume"))b.L($.rI())
break}}}}
A.cl.prototype={
p(a,b){var s,r,q=this.d
q=isNaN(q)||q===1
if(q)return
for(q=b.e,s=this;s!=null;){s=q.i(0,s)
if(s instanceof A.ai){r=s.Q
if(r!=null&&J.af(r[0],0)&&J.af(r[1],0)&&J.af(r[2],0))b.L($.rJ())
break}}}}
A.cm.prototype={}
A.cn.prototype={
p(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("iridescenceTexture")
r.p(a,b)
s.pop()}r=this.x
if(r!=null){s=b.c
s.push("iridescenceThicknessTexture")
r.p(a,b)
s.pop()}}}
A.co.prototype={
p(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("diffuseTexture")
r.p(a,b)
s.pop()}r=this.w
if(r!=null){s=b.c
s.push("specularGlossinessTexture")
r.p(a,b)
s.pop()}}}
A.cp.prototype={
p(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("sheenColorTexture")
r.p(a,b)
s.pop()}r=this.r
if(r!=null){s=b.c
s.push("sheenRoughnessTexture")
r.p(a,b)
s.pop()}}}
A.cq.prototype={
p(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("specularTexture")
r.p(a,b)
s.pop()}r=this.r
if(r!=null){s=b.c
s.push("specularColorTexture")
r.p(a,b)
s.pop()}}}
A.cr.prototype={
p(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("transmissionTexture")
r.p(a,b)
s.pop()}}}
A.cs.prototype={}
A.bD.prototype={
p(a,b){var s,r,q=b.c
q.push("variants")
s=this.d
r=J.cX(q.slice(0),A.a_(q).c)
b.x.m(0,s,r)
s.a4(new A.iT(b,a))
q.pop()}}
A.iT.prototype={
$2(a,b){var s=this.a.c
s.push(B.c.k(a))
s.pop()},
$S:71}
A.aM.prototype={}
A.ct.prototype={
p(a,b){var s=b.c
s.push("mappings")
this.d.a4(new A.iW(b,a,A.aD(t.e)))
s.pop()}}
A.iW.prototype={
$2(a,b){var s=this.a,r=s.c
r.push(B.c.k(a))
b.cR(this.b,s,this.c)
r.pop()},
$S:72}
A.bb.prototype={
cR(a,b,c){var s,r,q,p=this,o=a.a.i(0,"KHR_materials_variants")
if(o instanceof A.bD){s=p.d
if(s!=null){r=b.c
r.push("variants")
A.oJ(s.gj(s),new A.iU(p,o,b,c),!1,t.J)
r.pop()}s=p.e
r=p.r=a.as.i(0,s)
if(s!==-1)if(r==null)b.l($.Q(),A.a([s],t.M),"material")
else{r.a$=!0
for(s=b.e,q=p;q!=null;){q=s.i(0,q)
if(q instanceof A.aE){p.r.ch.M(0,new A.iV(q,b))
break}}}}else b.F($.cO(),A.a(["/extensions/KHR_materials_variants"],t.M))},
p(a,b){return this.cR(a,b,null)}}
A.iU.prototype={
$1(a){var s=this,r=s.a.d.i(0,a),q=s.b.d.i(0,r)
if(r!==-1){if(!s.d.C(0,r))s.c.Z($.r1(),a)
if(q==null)s.c.ao($.Q(),A.a([r],t.M),a)
else q.a$=!0}return q},
$S:73}
A.iV.prototype={
$2(a,b){var s
if(b!==-1){s=this.a
if(b+1>s.ax)this.b.l($.o9(),A.a([a,b],t.M),"material")
else s.dx[b]=-1}},
$S:4}
A.cu.prototype={
p(a,b){var s,r,q=this.r
if(q!=null){s=b.c
s.push("thicknessTexture")
q.p(a,b)
s.pop()}for(q=b.e,r=this;r!=null;){r=q.i(0,r)
if(r instanceof A.ai){q=r.a
if(!q.v("KHR_materials_transmission")&&!q.gX().aR(0,new A.iX()))b.L($.rN())
if(r.ax&&this.f>0)b.L($.rM())
break}}}}
A.iX.prototype={
$1(a){return t.h.b(a)},
$S:74}
A.cv.prototype={
p(a,b){var s,r
for(s=b.e,r=this;r!=null;){r=s.i(0,r)
if(r instanceof A.ai){r.ch.m(0,b.S(),this.r)
break}}}}
A.L.prototype={}
A.O.prototype={}
A.cb.prototype={
gE(a){var s=J.bY(this.a),r=J.bY(this.b)
return A.px(A.fW(A.fW(0,B.c.gE(s)),B.c.gE(r)))},
O(a,b){if(b==null)return!1
return b instanceof A.cb&&this.b==b.b&&this.a==b.a}}
A.cw.prototype={}
A.fo.prototype={}
A.dt.prototype={
c0(){var s=this,r=s.d=s.c.bT(new A.ii(s),s.gdB(),s.gcn()),q=s.ch
q.e=r.geg()
q.f=r.gej()
q.r=new A.ij(s)
return s.e.a},
aN(){this.d.K()
var s=this.e
if((s.a.a&30)===0)s.a3(new A.au("model/gltf-binary",null,this.cx))},
dA(a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=this,b="model/gltf-binary",a="0"
c.d.aZ()
for(s=J.V(a0),r=t.f,q=t.G,p=t.M,o=c.a,n=0;n!==s.gj(a0);)switch(c.r){case 0:m=s.gj(a0)
l=c.w
k=Math.min(m-n,12-l)
m=l+k
c.w=m
B.j.a5(o,l,m,a0,n)
n+=k
c.x=k
if(c.w!==12)break
j=c.b.getUint32(0,!0)
if(j!==1179937895){c.f.a2($.qA(),A.a([j],p),0)
c.d.K()
s=c.e.a
if((s.a&30)===0){r=c.cx
s.ah(new A.au(b,null,r))}return}i=c.b.getUint32(4,!0)
if(i!==2){c.f.a2($.qB(),A.a([i],p),4)
c.d.K()
s=c.e.a
if((s.a&30)===0){r=c.cx
s.ah(new A.au(b,null,r))}return}m=c.y=c.b.getUint32(8,!0)
if(m<=c.x)c.f.a2($.qD(),A.a([m],p),8)
c.r=1
c.w=0
break
case 1:m=c.x
if(m===c.y){c.f.aQ($.qz(),m)
c.d.K()
c.cm()
return}m=s.gj(a0)
l=c.w
k=Math.min(m-n,8-l)
m=l+k
c.w=m
B.j.a5(o,l,m,a0,n)
n+=k
c.x+=k
if(c.w!==8)break
c.Q=c.b.getUint32(0,!0)
m=c.b.getUint32(4,!0)
c.as=m
if((c.Q&3)!==0){l=c.f
h=$.qu()
g=c.x
l.a2(h,A.a(["0x"+B.a.aq(B.c.av(m,16),8,a)],p),g-8)}if(c.x+c.Q>c.y)c.f.a2($.qv(),A.a(["0x"+B.a.aq(B.c.av(c.as,16),8,a),c.Q],p),c.x-8)
if(c.z===0&&c.as!==1313821514)c.f.a2($.qI(),A.a(["0x"+B.a.aq(B.c.av(c.as,16),8,a)],p),c.x-8)
m=c.as
if(m===5130562&&c.z>1&&!c.CW)c.f.a2($.qE(),A.a(["0x"+B.a.aq(B.c.av(m,16),8,a)],p),c.x-8)
f=new A.ig(c)
m=c.as
switch(m){case 1313821514:if(c.Q===0){l=c.f
h=$.qy()
g=c.x
l.a2(h,A.a(["0x"+B.a.aq(B.c.av(m,16),8,a)],p),g-8)}f.$1$seen(c.at)
c.at=!0
break
case 5130562:if(c.Q===0)c.f.aQ($.qx(),c.x-8)
f.$1$seen(c.CW)
c.CW=!0
break
default:c.f.a2($.qJ(),A.a(["0x"+B.a.aq(B.c.av(m,16),8,a)],p),c.x-8)
c.r=4294967295}++c.z
c.w=0
break
case 1313821514:k=Math.min(s.gj(a0)-n,c.Q-c.w)
if(c.ax==null){m=c.ch
l=c.f
m=new A.cT(new A.aj(m,A.A(m).h("aj<1>")),new A.ay(new A.C($.B,r),q))
m.e=l
c.ax=m
c.ay=m.c0()}m=c.ch
e=n+k
l=s.a1(a0,n,e)
h=m.b
if(h>=4)A.Z(m.bv())
if((h&1)!==0)m.aC(l)
else if((h&3)===0){m=m.b6()
l=new A.cG(l)
d=m.c
if(d==null)m.b=m.c=l
else{d.saG(l)
m.c=l}}m=c.w+=k
c.x+=k
if(m===c.Q){c.ch.a7()
c.r=1
c.w=0}n=e
break
case 5130562:m=s.gj(a0)
l=c.Q
h=c.w
k=Math.min(m-n,l-h)
m=c.cx
if(m==null)m=c.cx=new Uint8Array(l)
l=h+k
c.w=l
B.j.a5(m,h,l,a0,n)
n+=k
c.x+=k
if(c.w===c.Q){c.r=1
c.w=0}break
case 4294967295:m=s.gj(a0)
l=c.Q
h=c.w
k=Math.min(m-n,l-h)
h+=k
c.w=h
n+=k
c.x+=k
if(h===l){c.r=1
c.w=0}break}c.d.ar()},
cm(){var s,r,q=this
switch(q.r){case 0:q.f.aQ($.qH(),q.x)
q.aN()
break
case 1:if(q.w!==0){q.f.aQ($.qG(),q.x)
q.aN()}else{s=q.y
r=q.x
if(s!==r)q.f.a2($.qC(),A.a([s,r],t.M),q.x)
s=q.ay
if(s!=null)s.au(0,new A.ih(q),q.gcn(),t.P)
else q.e.a3(new A.au("model/gltf-binary",null,q.cx))}break
default:if(q.Q>0)q.f.aQ($.qF(),q.x)
q.aN()}},
dC(a){var s
this.d.K()
s=this.e
if((s.a.a&30)===0)s.R(a)},
$ieS:1}
A.ii.prototype={
$1(a){var s
try{this.a.dA(a)}catch(s){if(A.M(s) instanceof A.bA)this.a.aN()
else throw s}},
$S:11}
A.ij.prototype={
$0(){var s=this.a
if((s.ch.b&4)!==0)s.d.ar()
else s.aN()},
$S:2}
A.ig.prototype={
$1$seen(a){var s=this.a
if(a){s.f.a2($.qw(),A.a(["0x"+B.a.aq(B.c.av(s.as,16),8,"0")],t.M),s.x-8)
s.r=4294967295}else s.r=s.as},
$0(){return this.$1$seen(null)},
$S:76}
A.ih.prototype={
$1(a){var s=this.a,r=a==null?null:a.b
s.e.a3(new A.au("model/gltf-binary",r,s.cx))},
$S:77}
A.au.prototype={}
A.im.prototype={
$0(){return this.a.b.aZ()},
$S:1}
A.io.prototype={
$0(){return this.a.b.ar()},
$S:1}
A.il.prototype={
$0(){return this.a.b.K()},
$S:78}
A.ip.prototype={
$1(a){var s,r,q,p,o=this,n=o.a
if(!n.a){s=J.V(a)
if(s.gA(a)){n.b.K()
o.b.a7()
o.c.R(B.a8)
return}r=s.i(a,0)
if(103===r){s=o.b
o.c.a3(A.oA(new A.aj(s,A.A(s).h("aj<1>")),o.d))
n.a=!0}else{s=123===r||9===r||32===r||10===r||13===r||239===r
q=o.c
p=o.b
if(s){q.a3(A.oB(new A.aj(p,A.A(p).h("aj<1>")),o.d))
n.a=!0}else{n.b.K()
p.a7()
q.R(B.a8)
return}}}o.b.C(0,a)},
$S:11}
A.cT.prototype={
c0(){var s=this,r=A.a([],t.M),q=new A.ac("")
s.d=new A.mu(new A.fV(!1),new A.mh(B.ab.gcF().a,new A.fO(new A.ik(s),r,t.cy),q),q)
s.b=s.a.bT(s.gdF(),s.gdH(),s.gdJ())
return s.c.a},
dG(a){var s,r,q,p=this
p.b.aZ()
if(p.f){r=J.V(a)
if(r.ga8(a)&&239===r.i(a,0))p.e.aE($.h3(),A.a(["BOM found at the beginning of UTF-8 stream."],t.M),!0)
p.f=!1}try{p.d.dX(a,0,J.a3(a),!1)
p.b.ar()}catch(q){r=A.M(q)
if(r instanceof A.aK){s=r
p.e.aE($.h3(),A.a([s],t.M),!0)
p.b.K()
p.c.bd()}else throw q}},
dK(a){var s
this.b.K()
s=this.c
if((s.a.a&30)===0)s.R(a)},
dI(){var s,r,q,p=this
try{p.d.a7()}catch(r){q=A.M(r)
if(q instanceof A.aK){s=q
p.e.aE($.h3(),A.a([s],t.M),!0)
p.b.K()
p.c.bd()}else throw r}},
$ieS:1}
A.ik.prototype={
$1(a){var s,r,q,p=a[0]
if(t.t.b(p))try{r=this.a
s=A.oC(p,r.e)
r.c.a3(new A.au("model/gltf+json",s,null))}catch(q){if(A.M(q) instanceof A.bA){r=this.a
r.b.K()
r.c.bd()}else throw q}else{r=this.a
r.e.aE($.a2(),A.a([p,"object"],t.M),!0)
r.b.K()
r.c.bd()}},
$S:80}
A.dv.prototype={
k(a){return"Invalid data: could not detect glTF format."},
$ia8:1}
A.mS.prototype={
$2(a,b){var s,r
this.a.$1(a)
b=A.mM(b)
s=A.aI(b)&&b>=0
r=this.b
if(s)r.m(0,a,b)
else{r.m(0,a,-1)
this.c.n($.h2(),a)}},
$S:3}
A.mT.prototype={
$2(a,b){var s,r
this.a.$1(a)
b=A.mM(b)
s=A.aI(b)&&b>=0
r=this.b
if(s)r.m(0,a,b)
else{r.m(0,a,-1)
this.c.n($.h2(),a)}},
$S:3}
A.mU.prototype={
$1(a){return a.ak(0,t.X,t.e)},
$S:81}
A.mQ.prototype={
$0(){return A.a([],t.bH)},
$S:82}
A.F.prototype={
i(a,b){return b==null||b<0||b>=this.a.length?null:this.a[b]},
m(a,b,c){this.a[b]=c},
gj(a){return this.b},
sj(a,b){throw A.d(A.ad("Changing length is not supported"))},
k(a){return A.iI(this.a,"[","]")},
a4(a){var s,r,q,p
for(s=this.b,r=this.a,q=0;q<s;++q){p=r[q]
if(p==null)continue
a.$2(q,p)}}}
A.a1.prototype={
aF(a){return!0}}
A.fv.prototype={
a0(a,b,c,d){var s=this,r=s.c,q=r!=null?r.$1(d):d
r=s.a+q*q
s.a=r
if(2===c){if(Math.abs(Math.sqrt(r)-1)>0.00674)a.l($.o0(),A.a([b-2,b,Math.sqrt(s.a)],t.M),s.b)
s.a=0}return!0}}
A.fw.prototype={
a0(a,b,c,d){var s=this,r=s.c,q=r!=null?r.$1(d):d
if(3===c){if(1!==q&&-1!==q)a.l($.qc(),A.a([b-3,b,q],t.M),s.b)}else{r=s.a+q*q
s.a=r
if(2===c){if(Math.abs(Math.sqrt(r)-1)>0.00674)a.l($.o0(),A.a([b-2,b,Math.sqrt(s.a)],t.M),s.b)
s.a=0}}return!0}}
A.eK.prototype={
a0(a,b,c,d){if(1<d||0>d)a.l($.qg(),A.a([b,d],t.M),this.a)
return!0}}
A.lF.prototype={
bn(){var s,r,q,p,o,n=this,m=t.X,l=t._,k=A.a9(m,l),j=n.a
if(j!=null)k.m(0,"uri",j.k(0))
j=n.c
s=j==null
if((s?null:j.a)!=null)k.m(0,"mimeType",s?null:j.a)
k.m(0,"validatorVersion","2.0.0-dev.3.10")
if(n.d)k.m(0,"validatedAt",new A.dp(Date.now(),!1).ew().ev())
j=n.b
r=j.cy
q=A.a9(m,l)
p=A.a([0,0,0,0],t.V)
o=A.oJ(r.length,new A.lI(r,p),!1,t.t)
q.m(0,"numErrors",p[0])
q.m(0,"numWarnings",p[1])
q.m(0,"numInfos",p[2])
q.m(0,"numHints",p[3])
q.m(0,"messages",o)
q.m(0,"truncated",j.y)
k.m(0,"issues",q)
j=n.dz()
if(j!=null)k.m(0,"info",j)
return k},
dz(){var s,r,q,p,o,n,m,l,k,j,i=null,h=this.c,g=h==null?i:h.b
h=g==null?i:g.w
if((h==null?i:h.f)==null)return i
s=A.a9(t.X,t._)
h=g.w
s.m(0,"version",h.f)
r=h.r
if(r!=null)s.m(0,"minVersion",r)
h=h.e
if(h!=null)s.m(0,"generator",h)
h=g.d
r=J.V(h)
if(r.ga8(h)){h=r.c3(h)
s.m(0,"extensionsUsed",A.bc(h,!1,A.A(h).c))}h=g.e
r=J.V(h)
if(r.ga8(h)){h=r.c3(h)
s.m(0,"extensionsRequired",A.bc(h,!1,A.A(h).c))}h=this.b
r=h.CW
if(!r.gA(r))s.m(0,"resources",h.CW)
s.m(0,"animationCount",g.r.b)
s.m(0,"materialCount",g.as.b)
h=g.at
s.m(0,"hasMorphTargets",h.aR(h,new A.lH()))
r=g.cx
s.m(0,"hasSkins",!r.gA(r))
r=g.cy
s.m(0,"hasTextures",!r.gA(r))
s.m(0,"hasDefaultScene",g.ch!=null)
for(h=new A.aa(h,h.gj(h),h.$ti.h("aa<p.E>")),q=0,p=0,o=0,n=0,m=0,l=0;h.q();){r=h.d.w
if(r!=null){q+=r.b
for(r=new A.aa(r,r.gj(r),r.$ti.h("aa<p.E>"));r.q();){k=r.d
j=k.CW
if(j!==-1)m+=j
l+=k.gex()
p=Math.max(p,k.ay.a)
o=Math.max(o,k.ax)
n=Math.max(n,k.as*4)}}}s.m(0,"drawCallCount",q)
s.m(0,"totalVertexCount",m)
s.m(0,"totalTriangleCount",l)
s.m(0,"maxUVs",o)
s.m(0,"maxInfluences",n)
s.m(0,"maxAttributes",p)
return s}}
A.lI.prototype={
$1(a){var s,r=this.a[a],q=r.gc9().a,p=this.b
p[q]=p[q]+1
s=A.nu(["code",r.a.b,"message",r.gbl(),"severity",r.gc9().a],t.X,t._)
q=r.c
if(q!=null)s.m(0,"pointer",q)
else{q=r.d
if(q!=null)s.m(0,"offset",q)}return s},
$S:83}
A.lH.prototype={
$1(a){var s=a.w
return s!=null&&s.aR(s,new A.lG())},
$S:84}
A.lG.prototype={
$1(a){return a.cx!=null},
$S:5}
A.f2.prototype={
k(a){return"[0] "+this.ag(0).k(0)+"\n[1] "+this.ag(1).k(0)+"\n[2] "+this.ag(2).k(0)+"\n"},
O(a,b){var s,r,q
if(b==null)return!1
if(b instanceof A.f2){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]&&s[3]===q[3]&&s[4]===q[4]&&s[5]===q[5]&&s[6]===q[6]&&s[7]===q[7]&&s[8]===q[8]}else s=!1
return s},
gE(a){return A.k6(this.a)},
ag(a){var s=new Float32Array(3),r=this.a
s[0]=r[a]
s[1]=r[3+a]
s[2]=r[6+a]
return new A.cE(s)}}
A.cZ.prototype={
k(a){var s=this
return"[0] "+s.ag(0).k(0)+"\n[1] "+s.ag(1).k(0)+"\n[2] "+s.ag(2).k(0)+"\n[3] "+s.ag(3).k(0)+"\n"},
O(a,b){var s,r,q
if(b==null)return!1
if(b instanceof A.cZ){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]&&s[3]===q[3]&&s[4]===q[4]&&s[5]===q[5]&&s[6]===q[6]&&s[7]===q[7]&&s[8]===q[8]&&s[9]===q[9]&&s[10]===q[10]&&s[11]===q[11]&&s[12]===q[12]&&s[13]===q[13]&&s[14]===q[14]&&s[15]===q[15]}else s=!1
return s},
gE(a){return A.k6(this.a)},
ag(a){var s=new Float32Array(4),r=this.a
s[0]=r[a]
s[1]=r[4+a]
s[2]=r[8+a]
s[3]=r[12+a]
return new A.fA(s)},
cG(){var s=this.a,r=s[0],q=s[5],p=s[1],o=s[4],n=r*q-p*o,m=s[6],l=s[2],k=r*m-l*o,j=s[7],i=s[3],h=r*j-i*o,g=p*m-l*q,f=p*j-i*q,e=l*j-i*m
m=s[8]
i=s[9]
j=s[10]
l=s[11]
return-(i*e-j*f+l*g)*s[12]+(m*e-j*h+l*k)*s[13]-(m*f-i*h+l*n)*s[14]+(m*g-i*k+j*n)*s[15]},
cL(){var s=this.a,r=0+Math.abs(s[0])+Math.abs(s[1])+Math.abs(s[2])+Math.abs(s[3]),q=r>0?r:0
r=0+Math.abs(s[4])+Math.abs(s[5])+Math.abs(s[6])+Math.abs(s[7])
if(r>q)q=r
r=0+Math.abs(s[8])+Math.abs(s[9])+Math.abs(s[10])+Math.abs(s[11])
if(r>q)q=r
r=0+Math.abs(s[12])+Math.abs(s[13])+Math.abs(s[14])+Math.abs(s[15])
return r>q?r:q},
cP(){var s=this.a
return s[0]===1&&s[1]===0&&s[2]===0&&s[3]===0&&s[4]===0&&s[5]===1&&s[6]===0&&s[7]===0&&s[8]===0&&s[9]===0&&s[10]===1&&s[11]===0&&s[12]===0&&s[13]===0&&s[14]===0&&s[15]===1}}
A.fl.prototype={
gaW(){var s=this.a,r=s[0],q=s[1],p=s[2],o=s[3]
return r*r+q*q+p*p+o*o},
gj(a){var s=this.a,r=s[0],q=s[1],p=s[2],o=s[3]
return Math.sqrt(r*r+q*q+p*p+o*o)},
k(a){var s=this.a
return A.b(s[0])+", "+A.b(s[1])+", "+A.b(s[2])+" @ "+A.b(s[3])}}
A.cE.prototype={
bt(a,b,c){var s=this.a
s[0]=a
s[1]=b
s[2]=c},
k(a){var s=this.a
return"["+A.b(s[0])+","+A.b(s[1])+","+A.b(s[2])+"]"},
O(a,b){var s,r,q
if(b==null)return!1
if(b instanceof A.cE){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]}else s=!1
return s},
gE(a){return A.k6(this.a)},
gj(a){var s=this.a,r=s[0],q=s[1]
s=s[2]
return Math.sqrt(r*r+q*q+s*s)},
gaW(){var s=this.a,r=s[0],q=s[1]
s=s[2]
return r*r+q*q+s*s}}
A.fA.prototype={
k(a){var s=this.a
return A.b(s[0])+","+A.b(s[1])+","+A.b(s[2])+","+A.b(s[3])},
O(a,b){var s,r,q
if(b==null)return!1
if(b instanceof A.fA){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]&&s[3]===q[3]}else s=!1
return s},
gE(a){return A.k6(this.a)},
gj(a){var s=this.a,r=s[0],q=s[1],p=s[2]
s=s[3]
return Math.sqrt(r*r+q*q+p*p+s*s)}}
A.bf.prototype={}
A.hX.prototype={}
A.d8.prototype={}
A.nb.prototype={
$3(a,b,c){var s=c.$1(J.as(a))
return s},
$S:85}
A.n7.prototype={
$2(a,b){return new self.Promise(A.cK(new A.n6(a,b,this.a)),t._)},
$S:86}
A.n6.prototype={
$2(a,b){A.h_(this.a,this.b).au(0,new A.n3(a),new A.n4(this.c,b),t.P)},
$S:24}
A.n3.prototype={
$1(a){this.a.$1(A.nR(a))},
$S:25}
A.n4.prototype={
$2(a,b){return this.a.$3(a,b,this.b)},
$S:26}
A.n8.prototype={
$2(a,b){return new self.Promise(A.cK(new A.n5(a,b,this.a)),t._)},
$S:90}
A.n5.prototype={
$2(a,b){A.nV(this.a,this.b).au(0,new A.n1(a),new A.n2(this.c,b),t.P)},
$S:24}
A.n1.prototype={
$1(a){this.a.$1(A.nR(a))},
$S:25}
A.n2.prototype={
$2(a,b){return this.a.$3(a,b,this.b)},
$S:26}
A.n9.prototype={
$0(){return"2.0.0-dev.3.10"},
$S:91}
A.na.prototype={
$0(){return A.nR(A.u4())},
$S:7}
A.mG.prototype={
$1(a){var s=new A.C($.B,t.q),r=new A.ay(s,t.as),q=this.a.$1(J.as(a))
if((q==null?null:J.ty(q))==null)r.R(new A.at(!1,null,null,"options.externalResourceFunction: Function must return a Promise."))
else J.tI(q,A.cK(new A.mH(r)),A.cK(new A.mI(r)))
return s},
$S:92}
A.mH.prototype={
$1(a){var s=this.a
if(t.a.b(a))s.a3(a)
else s.R(new A.at(!1,null,null,"options.externalResourceFunction: Promise must be fulfilled with Uint8Array or rejected."))},
$S:23}
A.mI.prototype={
$1(a){return this.a.R(new A.ff(J.as(a)))},
$S:12}
A.mE.prototype={
$1(a){var s,r,q,p=this
if(p.a.dx&&a==null)return p.b.c
if(p.c!=null)s=p.d.$1(a)
else{r=p.e
A.bU(r,"error",t.K)
$.B!==B.i
q=A.eI(r)
s=new A.C($.B,t.q)
s.b5(r,q)}return s},
$0(){return this.$1(null)},
$C:"$1",
$R:0,
$D(){return[null]},
$S:93}
A.mF.prototype={
$1(a){var s,r,q,p,o=null
if(this.a!=null){s=this.b.$1(a)
s=A.v9(s,A.ak(s).c)}else{s=this.c
A.bU(s,"error",t.K)
r=t.f1
q=new A.aZ(o,o,o,o,r)
p=A.eI(s)
q.b3(s,p)
q.aK()
s=new A.aj(q,r.h("aj<1>"))}return s},
$S:94}
A.ff.prototype={
k(a){return"Node Exception: "+A.b(this.a)},
$ia8:1};(function aliases(){var s=J.cV.prototype
s.d6=s.bm
s=J.aN.prototype
s.da=s.k
s=A.aC.prototype
s.d7=s.cM
s.d8=s.cN
s.d9=s.cO
s=A.p.prototype
s.dc=s.a5
s=A.ef.prototype
s.de=s.a7
s=A.bj.prototype
s.dd=s.p})();(function installTearOffs(){var s=hunkHelpers._static_1,r=hunkHelpers._static_0,q=hunkHelpers._static_2,p=hunkHelpers._instance_2u,o=hunkHelpers._instance_0u,n=hunkHelpers.installInstanceTearOff,m=hunkHelpers._instance_1i,l=hunkHelpers._instance_1u
s(A,"wt","ub",143)
s(A,"wP","vh",13)
s(A,"wQ","vi",13)
s(A,"wR","vj",13)
r(A,"pK","wC",1)
q(A,"wS","ww",16)
p(A.C.prototype,"gdq","aA",16)
o(A.da.prototype,"gdZ","a7",56)
var k
o(k=A.dX.prototype,"gcq","b9",1)
o(k,"gcr","ba",1)
n(k=A.dT.prototype,"geg",0,0,null,["$1","$0"],["cW","aZ"],60,0,0)
o(k,"gej","ar",1)
o(k,"gcq","b9",1)
o(k,"gcr","ba",1)
q(A,"wZ","w7",97)
m(A.b_.prototype,"gcC","G",14)
q(A,"wL","tN",98)
q(A,"wK","tM",99)
q(A,"wI","tK",100)
q(A,"wJ","tL",101)
l(A.a4.prototype,"gbX","ef",29)
q(A,"wN","tP",102)
q(A,"wM","tO",103)
q(A,"wO","tQ",104)
q(A,"wT","tU",105)
q(A,"wU","tT",106)
q(A,"wX","tX",107)
q(A,"wV","tV",108)
q(A,"wW","tW",109)
q(A,"xc","ug",110)
q(A,"xF","uL",111)
q(A,"xH","uX",112)
q(A,"xG","uW",113)
q(A,"pV","uV",114)
q(A,"ao","vb",115)
q(A,"xI","uP",116)
q(A,"xJ","uU",117)
q(A,"xK","v6",118)
q(A,"xL","v7",119)
q(A,"xM","v8",120)
q(A,"xO","vc",121)
s(A,"dj","wy",27)
s(A,"pM","wu",27)
s(A,"x3","we",6)
q(A,"x2","ua",124)
q(A,"xj","un",125)
s(A,"xk","wf",6)
q(A,"xl","uo",126)
q(A,"xm","up",127)
q(A,"xn","uq",128)
q(A,"xo","ur",129)
q(A,"xp","us",130)
q(A,"xq","ut",131)
q(A,"xr","uu",132)
q(A,"xs","uv",133)
q(A,"xt","uw",134)
q(A,"xu","ux",135)
q(A,"xv","uy",136)
q(A,"xw","uz",137)
q(A,"xx","uA",138)
q(A,"xy","uB",139)
q(A,"ul","uC",140)
q(A,"um","uD",141)
q(A,"xz","uE",142)
q(A,"xB","uF",95)
o(k=A.dt.prototype,"gdB","cm",1)
l(k,"gcn","dC",12)
l(k=A.cT.prototype,"gdF","dG",79)
l(k,"gdJ","dK",12)
o(k,"gdH","dI",1)
s(A,"xA","wg",6)})();(function inheritance(){var s=hunkHelpers.mixin,r=hunkHelpers.inherit,q=hunkHelpers.inheritMany
r(A.c,null)
q(A.c,[A.ns,J.cV,J.b4,A.j,A.dm,A.I,A.c7,A.H,A.e6,A.aa,A.P,A.dq,A.ds,A.fy,A.d3,A.dC,A.cQ,A.iJ,A.lt,A.fh,A.dr,A.ed,A.mm,A.jN,A.cx,A.iK,A.mk,A.aF,A.fK,A.eh,A.mr,A.fD,A.d7,A.aH,A.eH,A.fG,A.bN,A.C,A.fE,A.bi,A.fr,A.da,A.fS,A.fF,A.dT,A.fI,A.m1,A.eb,A.fQ,A.mw,A.e3,A.eq,A.mj,A.cH,A.p,A.fU,A.dM,A.ls,A.eN,A.lZ,A.eJ,A.fV,A.dp,A.m2,A.fi,A.dO,A.e_,A.aK,A.cY,A.l,A.fR,A.ac,A.en,A.lv,A.fP,A.fL,A.a1,A.m,A.c2,A.c1,A.y,A.lE,A.i,A.bA,A.cd,A.iB,A.dS,A.dR,A.aL,A.fn,A.kb,A.eX,A.iH,A.cW,A.L,A.O,A.cb,A.cw,A.fo,A.dt,A.au,A.cT,A.dv,A.lF,A.f2,A.cZ,A.fl,A.cE,A.fA,A.ff])
q(J.cV,[J.dx,J.dz,J.f_,J.D,J.ce,J.bB,A.dF])
r(J.aN,J.f_)
q(J.aN,[J.fj,J.bL,J.b9,A.bf,A.hX,A.d8])
r(J.iL,J.D)
q(J.ce,[J.dy,J.eZ])
q(A.j,[A.bM,A.q,A.bd,A.lK,A.bh,A.dW,A.dw])
q(A.bM,[A.c5,A.ep])
r(A.dZ,A.c5)
r(A.dU,A.ep)
r(A.b5,A.dU)
r(A.dB,A.I)
q(A.dB,[A.c6,A.aC,A.e1,A.fM])
q(A.c7,[A.eM,A.eL,A.hY,A.ft,A.iP,A.mX,A.mZ,A.lW,A.lV,A.mx,A.m6,A.me,A.ln,A.lp,A.mi,A.jP,A.mC,A.mD,A.mz,A.lS,A.lT,A.lP,A.lQ,A.lM,A.lN,A.ix,A.iy,A.iq,A.iz,A.jV,A.jS,A.jT,A.jU,A.jZ,A.k3,A.k4,A.k5,A.ke,A.lm,A.hh,A.hi,A.hl,A.hj,A.iC,A.iE,A.iO,A.iN,A.kc,A.kd,A.nf,A.mL,A.hL,A.hM,A.hE,A.hD,A.ht,A.hs,A.hI,A.hz,A.hr,A.hF,A.hx,A.hu,A.hw,A.hv,A.hp,A.hq,A.hH,A.hG,A.hy,A.hO,A.hQ,A.hT,A.hU,A.hR,A.hS,A.hP,A.hV,A.hN,A.hB,A.hA,A.hJ,A.hK,A.hC,A.iG,A.kh,A.ki,A.kg,A.kk,A.kl,A.km,A.kj,A.kn,A.ko,A.kp,A.ku,A.kv,A.kt,A.kq,A.kr,A.ks,A.lj,A.lk,A.l4,A.kL,A.ky,A.kz,A.kx,A.kA,A.kB,A.kC,A.kE,A.kD,A.kF,A.kG,A.kH,A.kI,A.kX,A.l_,A.l3,A.l1,A.kZ,A.l2,A.l0,A.kY,A.l8,A.l6,A.l9,A.lg,A.ll,A.lf,A.kK,A.l7,A.lc,A.lb,A.la,A.lh,A.li,A.le,A.l5,A.ld,A.kJ,A.kM,A.kN,A.kO,A.kP,A.kQ,A.kR,A.kS,A.kW,A.kV,A.kT,A.kU,A.j0,A.iZ,A.j_,A.j1,A.j4,A.j2,A.j3,A.j8,A.j6,A.ja,A.j7,A.j9,A.j5,A.jb,A.je,A.jd,A.jc,A.jf,A.jg,A.jh,A.jl,A.jm,A.ju,A.jk,A.jj,A.jq,A.jp,A.jo,A.jv,A.jt,A.jn,A.jw,A.js,A.jr,A.jx,A.jy,A.jB,A.jz,A.jA,A.jC,A.jE,A.jD,A.jF,A.jG,A.jH,A.jI,A.jJ,A.jM,A.jL,A.jK,A.ji,A.i5,A.i6,A.i8,A.i_,A.i7,A.i0,A.i3,A.i2,A.i1,A.ib,A.ia,A.ic,A.id,A.i9,A.ie,A.i4,A.iU,A.iX,A.ii,A.ig,A.ih,A.ip,A.ik,A.mU,A.lI,A.lH,A.lG,A.nb,A.n3,A.n1,A.mG,A.mH,A.mI,A.mE,A.mF])
q(A.eM,[A.hf,A.k9,A.mY,A.my,A.mN,A.m7,A.lo,A.jO,A.k2,A.lx,A.ly,A.lz,A.mB,A.h5,A.h6,A.iu,A.iv,A.is,A.it,A.iA,A.jR,A.k1,A.k0,A.jX,A.jY,A.k_,A.hn,A.ne,A.ng,A.iS,A.iT,A.iW,A.iV,A.mS,A.mT,A.n7,A.n6,A.n4,A.n8,A.n5,A.n2])
q(A.H,[A.f1,A.fm,A.dI,A.aG,A.f0,A.fx,A.fp,A.fJ,A.eF,A.fg,A.at,A.dH,A.fz,A.fu,A.bJ,A.eO,A.eQ])
r(A.dA,A.e6)
q(A.dA,[A.d4,A.F])
q(A.d4,[A.c8,A.aX])
q(A.eL,[A.nd,A.lX,A.lY,A.ms,A.m3,A.ma,A.m8,A.m5,A.m9,A.m4,A.md,A.mc,A.mb,A.lq,A.mq,A.mp,A.m0,A.m_,A.ml,A.mK,A.mo,A.lD,A.lC,A.lR,A.lU,A.lL,A.lO,A.iw,A.ir,A.jW,A.hg,A.hm,A.hk,A.iD,A.k8,A.ij,A.im,A.io,A.il,A.mQ,A.n9,A.na])
q(A.q,[A.ah,A.b7,A.aO,A.e2])
q(A.ah,[A.dP,A.ab,A.fN,A.e0])
r(A.c9,A.bd)
q(A.P,[A.dD,A.cF,A.dN])
r(A.cR,A.bh)
r(A.em,A.dC)
r(A.bm,A.em)
r(A.dn,A.bm)
q(A.cQ,[A.aJ,A.X])
r(A.dJ,A.aG)
q(A.ft,[A.fq,A.cP])
r(A.d_,A.dF)
q(A.d_,[A.e7,A.e9])
r(A.e8,A.e7)
r(A.dE,A.e8)
r(A.ea,A.e9)
r(A.aw,A.ea)
q(A.dE,[A.f8,A.f9])
q(A.aw,[A.fa,A.fb,A.fc,A.fd,A.fe,A.dG,A.cy])
r(A.ei,A.fJ)
r(A.eg,A.dw)
r(A.ay,A.fG)
q(A.da,[A.aZ,A.db])
r(A.ee,A.bi)
r(A.aj,A.ee)
r(A.dX,A.dT)
q(A.fI,[A.cG,A.dY])
r(A.mn,A.mw)
r(A.e4,A.e1)
r(A.e5,A.aC)
r(A.ec,A.eq)
r(A.b_,A.ec)
r(A.lr,A.ls)
r(A.ef,A.lr)
r(A.mh,A.ef)
q(A.eN,[A.ha,A.hW,A.iQ])
r(A.eP,A.fr)
q(A.eP,[A.hc,A.hb,A.iR,A.lB])
q(A.eJ,[A.hd,A.fO])
r(A.mu,A.hd)
r(A.lA,A.hW)
q(A.at,[A.dL,A.eV])
r(A.fH,A.en)
r(A.k,A.fL)
q(A.k,[A.eR,A.bZ,A.c_,A.c0,A.b2,A.bw,A.b3,A.bx,A.c3,A.c4,A.du,A.cB,A.bj,A.aE,A.ca,A.cf,A.bC,A.cg,A.ch,A.ci,A.cj,A.ck,A.cl,A.cm,A.cn,A.co,A.cp,A.cq,A.cr,A.cs,A.bD,A.ct,A.bb,A.cu,A.cv])
q(A.eR,[A.a4,A.bv,A.aT,A.by,A.bz,A.aU,A.ai,A.aV,A.ap,A.bF,A.bG,A.bI,A.bK,A.ba,A.aM])
q(A.a4,[A.fC,A.fB])
q(A.a1,[A.eY,A.f5,A.f3,A.f6,A.f4,A.eE,A.dK,A.eU,A.eT,A.fv,A.fw,A.eK])
q(A.bj,[A.cA,A.cz])
q(A.m2,[A.cU,A.dV,A.d5,A.cc,A.d9,A.bH])
q(A.iB,[A.iM,A.k7,A.lJ])
q(A.iH,[A.ho,A.iF,A.kf,A.kw,A.iY,A.hZ])
s(A.d4,A.fy)
s(A.ep,A.p)
s(A.e7,A.p)
s(A.e8,A.ds)
s(A.e9,A.p)
s(A.ea,A.ds)
s(A.aZ,A.fF)
s(A.db,A.fS)
s(A.e6,A.p)
s(A.em,A.fU)
s(A.eq,A.dM)
s(A.fL,A.m)})()
var v={typeUniverse:{eC:new Map(),tR:{},eT:{},tPV:{},sEA:[]},mangledGlobalNames:{f:"int",z:"double",N:"num",e:"String",S:"bool",l:"Null",o:"List"},mangledNames:{},types:["e*(o<@>*)","~()","l()","l(e*,c*)","l(e*,f*)","S*(aE*)","~(i*)","@()","z*(f*)","S*(f*)","l(ap*,f*,f*)","l(o<f*>*)","~(c*)","~(~())","S(c?)","l(@)","~(c,an)","~(a6,e,f)","j<f*>*()","j<z*>*()","l(f*,aE*)","~(e*)","S*(L*)","l(c*)","l(~(c*)*,aB*)","l(h<e*,c*>*)","~(c*,an*)","e*(c*)","~(k*,e*)","z*(N*)","@(@)","j<f*>*(f*,f*,f*)","f*(f*)","@(@,e)","~(@)","j<z*>*(f*,f*,f*)","l(f*,b3*)","l(f*,b2*)","F<0^*>*(e*,0^*(h<e*,c*>*,i*)*)<c*>","0^*(e*,0^*(h<e*,c*>*,i*)*{req:S*})<c*>","~(F<k*>*,bk*)","l(f*,k*)","l(@,an)","l(f*,ap*)","S*(ap*)","~(F<cC*>*)","l(f*,cC*)","a5<l>()","~(f,@)","f*(o<f*>*)","@(e)","f*(f*,f*,e*)","l(c,an)","C<@>(@)","d1<a4<N*>*>*()","l(@,@)","a5<@>()","e*(L*)","o<a1<N*>*>*()","e*(e*)","~([a5<~>?])","L*()","l(bk*,O*)","S(@)","~(c?,c?)","a6*/*(aT*)","bi<o<f*>*>*(aU*)","l(f*,a4<N*>*)","S*(P<N*>*)","~(e,@)","l(f*,ba*)","l(f*,aM*)","l(f*,bb*)","aM*(f*)","S*(c*)","~(cD,@)","~({seen:S*})","l(au*)","a5<~>*()","~(o<f*>*)","l(o<c*>*)","h<e*,f*>*(h<@,@>*)","o<cw*>*()","h<e*,c*>*(f*)","S*(aV*)","~(c*,an*,aB*)","bf<1&>*(a6*,c*)","~(e,f)","~(e,f?)","f(f,f)","bf<1&>*(e*,c*)","e*()","a5<a6*>*(aY*)","a6*/*([aY*])","bi<o<f*>*>*(aY*)","cv*(h<e*,c*>*,i*)","a6(@,@)","S(c?,c?)","a4<N*>*(h<e*,c*>*,i*)","bZ*(h<e*,c*>*,i*)","c_*(h<e*,c*>*,i*)","c0*(h<e*,c*>*,i*)","bv*(h<e*,c*>*,i*)","bw*(h<e*,c*>*,i*)","bx*(h<e*,c*>*,i*)","aT*(h<e*,c*>*,i*)","by*(h<e*,c*>*,i*)","bz*(h<e*,c*>*,i*)","c3*(h<e*,c*>*,i*)","c4*(h<e*,c*>*,i*)","aU*(h<e*,c*>*,i*)","ai*(h<e*,c*>*,i*)","cB*(h<e*,c*>*,i*)","cA*(h<e*,c*>*,i*)","cz*(h<e*,c*>*,i*)","bj*(h<e*,c*>*,i*)","aV*(h<e*,c*>*,i*)","ap*(h<e*,c*>*,i*)","bF*(h<e*,c*>*,i*)","bG*(h<e*,c*>*,i*)","bI*(h<e*,c*>*,i*)","bK*(h<e*,c*>*,i*)","l(~())","c?(c?)","ca*(h<e*,c*>*,i*)","cf*(h<e*,c*>*,i*)","bC*(h<e*,c*>*,i*)","cg*(h<e*,c*>*,i*)","ch*(h<e*,c*>*,i*)","ci*(h<e*,c*>*,i*)","cj*(h<e*,c*>*,i*)","ck*(h<e*,c*>*,i*)","cl*(h<e*,c*>*,i*)","cm*(h<e*,c*>*,i*)","cn*(h<e*,c*>*,i*)","co*(h<e*,c*>*,i*)","cp*(h<e*,c*>*,i*)","cq*(h<e*,c*>*,i*)","cr*(h<e*,c*>*,i*)","cs*(h<e*,c*>*,i*)","bD*(h<e*,c*>*,i*)","ct*(h<e*,c*>*,i*)","cu*(h<e*,c*>*,i*)","f(c?)"],interceptorsByTag:null,leafTags:null,arrayRti:Symbol("$ti")}
A.vF(v.typeUniverse,JSON.parse('{"fj":"aN","bL":"aN","b9":"aN","bf":"aN","hX":"aN","d8":"aN","dx":{"S":[]},"dz":{"l":[]},"aN":{"bf":["1&"],"d8":[]},"D":{"o":["1"],"q":["1"],"j":["1"]},"iL":{"D":["1"],"o":["1"],"q":["1"],"j":["1"]},"b4":{"P":["1"]},"ce":{"z":[],"N":[]},"dy":{"z":[],"f":[],"N":[]},"eZ":{"z":[],"N":[]},"bB":{"e":[]},"bM":{"j":["2"]},"dm":{"P":["2"]},"c5":{"bM":["1","2"],"j":["2"],"j.E":"2"},"dZ":{"c5":["1","2"],"bM":["1","2"],"q":["2"],"j":["2"],"j.E":"2"},"dU":{"p":["2"],"o":["2"],"bM":["1","2"],"q":["2"],"j":["2"]},"b5":{"dU":["1","2"],"p":["2"],"o":["2"],"bM":["1","2"],"q":["2"],"j":["2"],"p.E":"2","j.E":"2"},"c6":{"I":["3","4"],"h":["3","4"],"I.K":"3","I.V":"4"},"f1":{"H":[]},"fm":{"H":[]},"c8":{"p":["f"],"o":["f"],"q":["f"],"j":["f"],"p.E":"f"},"dI":{"aG":[],"H":[]},"q":{"j":["1"]},"ah":{"q":["1"],"j":["1"]},"dP":{"ah":["1"],"q":["1"],"j":["1"],"j.E":"1","ah.E":"1"},"aa":{"P":["1"]},"bd":{"j":["2"],"j.E":"2"},"c9":{"bd":["1","2"],"q":["2"],"j":["2"],"j.E":"2"},"dD":{"P":["2"]},"ab":{"ah":["2"],"q":["2"],"j":["2"],"j.E":"2","ah.E":"2"},"lK":{"j":["1"],"j.E":"1"},"cF":{"P":["1"]},"bh":{"j":["1"],"j.E":"1"},"cR":{"bh":["1"],"q":["1"],"j":["1"],"j.E":"1"},"dN":{"P":["1"]},"b7":{"q":["1"],"j":["1"],"j.E":"1"},"dq":{"P":["1"]},"d4":{"p":["1"],"o":["1"],"q":["1"],"j":["1"]},"d3":{"cD":[]},"dn":{"bm":["1","2"],"h":["1","2"]},"cQ":{"h":["1","2"]},"aJ":{"cQ":["1","2"],"h":["1","2"]},"dW":{"j":["1"],"j.E":"1"},"X":{"cQ":["1","2"],"h":["1","2"]},"dJ":{"aG":[],"H":[]},"f0":{"H":[]},"fx":{"H":[]},"fh":{"a8":[]},"ed":{"an":[]},"c7":{"aB":[]},"eL":{"aB":[]},"eM":{"aB":[]},"ft":{"aB":[]},"fq":{"aB":[]},"cP":{"aB":[]},"fp":{"H":[]},"aC":{"I":["1","2"],"h":["1","2"],"I.K":"1","I.V":"2"},"aO":{"q":["1"],"j":["1"],"j.E":"1"},"cx":{"P":["1"]},"d_":{"av":["1"]},"dE":{"p":["z"],"av":["z"],"o":["z"],"q":["z"],"j":["z"]},"aw":{"p":["f"],"av":["f"],"o":["f"],"q":["f"],"j":["f"]},"f8":{"p":["z"],"av":["z"],"o":["z"],"q":["z"],"j":["z"],"p.E":"z"},"f9":{"p":["z"],"av":["z"],"o":["z"],"q":["z"],"j":["z"],"p.E":"z"},"fa":{"aw":[],"p":["f"],"av":["f"],"o":["f"],"q":["f"],"j":["f"],"p.E":"f"},"fb":{"aw":[],"p":["f"],"av":["f"],"o":["f"],"q":["f"],"j":["f"],"p.E":"f"},"fc":{"aw":[],"p":["f"],"av":["f"],"o":["f"],"q":["f"],"j":["f"],"p.E":"f"},"fd":{"aw":[],"p":["f"],"av":["f"],"o":["f"],"q":["f"],"j":["f"],"p.E":"f"},"fe":{"aw":[],"p":["f"],"av":["f"],"o":["f"],"q":["f"],"j":["f"],"p.E":"f"},"dG":{"aw":[],"p":["f"],"av":["f"],"o":["f"],"q":["f"],"j":["f"],"p.E":"f"},"cy":{"aw":[],"p":["f"],"a6":[],"av":["f"],"o":["f"],"q":["f"],"j":["f"],"p.E":"f"},"eh":{"bk":[]},"fJ":{"H":[]},"ei":{"aG":[],"H":[]},"C":{"a5":["1"]},"aH":{"P":["1"]},"eg":{"j":["1"],"j.E":"1"},"eH":{"H":[]},"ay":{"fG":["1"]},"aZ":{"da":["1"]},"db":{"da":["1"]},"aj":{"bi":["1"]},"ee":{"bi":["1"]},"e1":{"I":["1","2"],"h":["1","2"]},"e4":{"e1":["1","2"],"I":["1","2"],"h":["1","2"],"I.K":"1","I.V":"2"},"e2":{"q":["1"],"j":["1"],"j.E":"1"},"e3":{"P":["1"]},"e5":{"aC":["1","2"],"I":["1","2"],"h":["1","2"],"I.K":"1","I.V":"2"},"b_":{"ec":["1"],"dM":["1"],"d1":["1"],"q":["1"],"j":["1"]},"cH":{"P":["1"]},"aX":{"p":["1"],"o":["1"],"q":["1"],"j":["1"],"p.E":"1"},"dw":{"j":["1"]},"dA":{"p":["1"],"o":["1"],"q":["1"],"j":["1"]},"dB":{"I":["1","2"],"h":["1","2"]},"I":{"h":["1","2"]},"dC":{"h":["1","2"]},"bm":{"h":["1","2"]},"ec":{"dM":["1"],"d1":["1"],"q":["1"],"j":["1"]},"fM":{"I":["e","@"],"h":["e","@"],"I.K":"e","I.V":"@"},"fN":{"ah":["e"],"q":["e"],"j":["e"],"j.E":"e","ah.E":"e"},"z":{"N":[]},"f":{"N":[]},"o":{"q":["1"],"j":["1"]},"d1":{"q":["1"],"j":["1"]},"eF":{"H":[]},"aG":{"H":[]},"fg":{"aG":[],"H":[]},"at":{"H":[]},"dL":{"H":[]},"eV":{"H":[]},"dH":{"H":[]},"fz":{"H":[]},"fu":{"H":[]},"bJ":{"H":[]},"eO":{"H":[]},"fi":{"H":[]},"dO":{"H":[]},"eQ":{"H":[]},"e_":{"a8":[]},"aK":{"a8":[]},"e0":{"ah":["1"],"q":["1"],"j":["1"],"j.E":"1","ah.E":"1"},"fR":{"an":[]},"en":{"aY":[]},"fP":{"aY":[]},"fH":{"aY":[]},"a4":{"k":[],"m":[],"n":[]},"bZ":{"k":[],"m":[],"n":[]},"c_":{"k":[],"m":[],"n":[]},"c0":{"k":[],"m":[],"n":[]},"fC":{"a4":["f*"],"k":[],"m":[],"n":[]},"fB":{"a4":["z*"],"k":[],"m":[],"n":[]},"eY":{"a1":["z*"]},"f5":{"a1":["z*"]},"f3":{"a1":["z*"]},"f6":{"a1":["f*"]},"f4":{"a1":["f*"]},"bv":{"k":[],"m":[],"n":[]},"b2":{"k":[],"m":[],"n":[]},"bw":{"k":[],"m":[],"n":[]},"b3":{"k":[],"m":[],"n":[]},"eE":{"a1":["z*"]},"dK":{"a1":["1*"]},"bx":{"k":[],"m":[],"n":[]},"aT":{"k":[],"m":[],"n":[]},"by":{"k":[],"m":[],"n":[]},"bz":{"k":[],"m":[],"n":[]},"c3":{"k":[],"m":[],"n":[]},"c4":{"k":[],"m":[],"n":[]},"du":{"k":[],"m":[],"n":[]},"k":{"m":[],"n":[]},"eR":{"k":[],"m":[],"n":[]},"aU":{"k":[],"m":[],"n":[]},"ai":{"k":[],"m":[],"n":[]},"cB":{"k":[],"m":[],"n":[]},"cA":{"k":[],"m":[],"n":[]},"cz":{"k":[],"m":[],"n":[]},"bj":{"k":[],"m":[],"n":[]},"aV":{"k":[],"m":[],"n":[]},"aE":{"k":[],"m":[],"n":[]},"eU":{"a1":["f*"]},"ap":{"k":[],"m":[],"n":[]},"bF":{"k":[],"m":[],"n":[]},"bG":{"k":[],"m":[],"n":[]},"bI":{"k":[],"m":[],"n":[]},"eT":{"a1":["z*"]},"bK":{"k":[],"m":[],"n":[],"cC":[]},"bA":{"a8":[]},"dS":{"a8":[]},"dR":{"a8":[]},"aL":{"a8":[]},"ca":{"k":[],"m":[],"n":[],"cC":[]},"cf":{"k":[],"m":[],"n":[]},"bC":{"k":[],"m":[],"n":[]},"ba":{"k":[],"m":[],"n":[]},"cg":{"k":[],"m":[],"n":[]},"ch":{"k":[],"m":[],"n":[]},"ci":{"k":[],"m":[],"n":[]},"cj":{"k":[],"m":[],"n":[]},"ck":{"k":[],"m":[],"n":[]},"cl":{"k":[],"m":[],"n":[]},"cm":{"k":[],"m":[],"n":[]},"cn":{"k":[],"m":[],"n":[]},"co":{"k":[],"m":[],"n":[]},"cp":{"k":[],"m":[],"n":[]},"cq":{"k":[],"m":[],"n":[]},"cr":{"k":[],"m":[],"n":[]},"cs":{"k":[],"m":[],"n":[]},"bD":{"k":[],"m":[],"n":[]},"aM":{"k":[],"m":[],"n":[]},"ct":{"k":[],"m":[],"n":[]},"bb":{"k":[],"m":[],"n":[]},"cu":{"k":[],"m":[],"n":[]},"cv":{"k":[],"m":[],"n":[]},"dt":{"eS":[]},"cT":{"eS":[]},"dv":{"a8":[]},"F":{"p":["1*"],"o":["1*"],"q":["1*"],"j":["1*"],"p.E":"1*"},"fv":{"a1":["N*"]},"fw":{"a1":["N*"]},"eK":{"a1":["z*"]},"ff":{"a8":[]},"a6":{"o":["f"],"q":["f"],"j":["f"]}}'))
A.vE(v.typeUniverse,JSON.parse('{"ds":1,"fy":1,"d4":1,"ep":2,"d_":1,"fr":2,"fS":1,"fF":1,"dX":1,"dT":1,"ee":1,"fI":1,"cG":1,"eb":1,"fQ":1,"dw":1,"dA":1,"dB":2,"fU":2,"dC":2,"e6":1,"em":2,"eq":1,"eJ":1,"eN":2,"eP":2,"ef":1}'))
var u={p:") does not match the number of morph targets (",d:"Accessor sparse indices element at index ",m:"Animation input accessor element at index ",c:"Error handler must accept one Object or one Object and a StackTrace as arguments, and return a value of the returned future's type",g:"`null` encountered as the result from expression with type `Never`."}
var t=(function rtii(){var s=A.aR
return{gF:s("dn<cD,@>"),O:s("q<@>"),Q:s("H"),b8:s("aB"),d:s("a5<@>"),bq:s("a5<~>"),N:s("X<bk*,O*>"),j:s("j<@>"),s:s("D<e>"),gN:s("D<a6>"),b:s("D<@>"),Z:s("D<f>"),p:s("D<y*>"),gd:s("D<a1<N*>*>"),bd:s("D<eX*>"),a9:s("D<cW*>"),b2:s("D<P<N*>*>"),bH:s("D<cw*>"),fh:s("D<h<e*,c*>*>"),M:s("D<c*>"),d6:s("D<fo*>"),i:s("D<e*>"),o:s("D<z*>"),V:s("D<f*>"),T:s("dz"),g:s("b9"),aU:s("av<@>"),eo:s("aC<cD,@>"),I:s("h<@,@>"),gw:s("ab<L*,e*>"),eB:s("aw"),bm:s("cy"),P:s("l"),K:s("c"),ed:s("dK<N*>"),gT:s("zA"),eq:s("F<b2*>"),az:s("F<b3*>"),E:s("F<ba*>"),B:s("F<bb*>"),u:s("F<aM*>"),b_:s("F<aE*>"),gm:s("an"),R:s("e"),fo:s("cD"),dd:s("bk"),eK:s("aG"),gc:s("a6"),ak:s("bL"),go:s("aX<h<e*,c*>*>"),em:s("aX<e*>"),f8:s("bm<cb*,O*>"),n:s("aY"),a_:s("ay<eS*>"),G:s("ay<au*>"),eP:s("ay<cd*>"),as:s("ay<a6*>"),f1:s("aZ<o<f*>*>"),U:s("C<l>"),eI:s("C<@>"),fJ:s("C<f>"),eD:s("C<eS*>"),f:s("C<au*>"),dD:s("C<cd*>"),q:s("C<a6*>"),D:s("C<~>"),aH:s("e4<@,@>"),cy:s("fO<c*>"),y:s("S"),gR:s("z"),z:s("@"),v:s("@(c)"),C:s("@(c,an)"),S:s("f"),aD:s("y*"),hc:s("a4<f*>*"),W:s("a4<N*>*"),bj:s("bv*"),aA:s("b2*"),gW:s("b3*"),gP:s("bx*"),cT:s("aT*"),r:s("by*"),h2:s("bz*"),x:s("a8*"),af:s("L*"),f9:s("O*"),al:s("cb*"),b1:s("aB*"),ec:s("aU*"),Y:s("j<@>*"),ga:s("P<z*>*"),bF:s("P<f*>*"),cp:s("ba*"),aa:s("bb*"),J:s("aM*"),c:s("n*"),l:s("o<@>*"),b7:s("o<a1<N*>*>*"),an:s("o<cw*>*"),m:s("o<c*>*"),eG:s("o<e*>*"),fy:s("o<z*>*"),w:s("o<f*>*"),h:s("h<@,@>*"),gj:s("h<e*,a4<N*>*>*"),t:s("h<e*,c*>*"),fC:s("ai*"),eM:s("aV*"),ft:s("aE*"),A:s("0&*"),L:s("ap*"),_:s("c*"),ax:s("cC*"),b5:s("F<m*>*"),c2:s("bF*"),bn:s("bG*"),cn:s("d1<y*>*"),gz:s("d1<a4<N*>*>*"),dz:s("bH*"),aV:s("bI*"),X:s("e*"),ai:s("bK*"),f7:s("bk*"),a:s("a6*"),bv:s("d8*"),F:s("z*"),e:s("f*"),eH:s("a5<l>?"),cK:s("c?"),di:s("N"),H:s("~"),d5:s("~(c)"),k:s("~(c,an)")}})();(function constants(){var s=hunkHelpers.makeConstList
B.bW=J.cV.prototype
B.d=J.D.prototype
B.c0=J.dx.prototype
B.c=J.dy.prototype
B.c1=J.ce.prototype
B.a=J.bB.prototype
B.c2=J.b9.prototype
B.c3=J.f_.prototype
B.j=A.cy.prototype
B.aA=J.fj.prototype
B.X=J.bL.prototype
B.Y=new A.y("MAT4",5126,!1)
B.G=new A.y("SCALAR",5126,!1)
B.a_=new A.y("VEC2",5120,!0)
B.a0=new A.y("VEC2",5121,!0)
B.a2=new A.y("VEC2",5122,!0)
B.a3=new A.y("VEC2",5123,!0)
B.a4=new A.y("VEC2",5126,!1)
B.w=new A.y("VEC3",5120,!0)
B.H=new A.y("VEC3",5121,!0)
B.x=new A.y("VEC3",5122,!0)
B.I=new A.y("VEC3",5123,!0)
B.k=new A.y("VEC3",5126,!1)
B.J=new A.y("VEC4",5120,!0)
B.b_=new A.y("VEC4",5121,!1)
B.y=new A.y("VEC4",5121,!0)
B.K=new A.y("VEC4",5122,!0)
B.b0=new A.y("VEC4",5123,!1)
B.z=new A.y("VEC4",5123,!0)
B.n=new A.y("VEC4",5126,!1)
B.b1=new A.c1("AnimationInput")
B.b2=new A.c1("AnimationOutput")
B.b3=new A.c1("IBM")
B.b4=new A.c1("PrimitiveIndices")
B.a7=new A.c1("VertexAttribute")
B.b5=new A.c2("IBM")
B.b6=new A.c2("Image")
B.L=new A.c2("IndexBuffer")
B.o=new A.c2("Other")
B.A=new A.c2("VertexBuffer")
B.eq=new A.hc()
B.b7=new A.ha()
B.b8=new A.hb()
B.b9=new A.dq(A.aR("dq<0&*>"))
B.a8=new A.dv()
B.ba=new A.bA()
B.a9=function getTagFallback(o) {
  var s = Object.prototype.toString.call(o);
  return s.substring(8, s.length - 1);
}
B.bb=function() {
  var toStringFunction = Object.prototype.toString;
  function getTag(o) {
    var s = toStringFunction.call(o);
    return s.substring(8, s.length - 1);
  }
  function getUnknownTag(object, tag) {
    if (/^HTML[A-Z].*Element$/.test(tag)) {
      var name = toStringFunction.call(object);
      if (name == "[object Object]") return null;
      return "HTMLElement";
    }
  }
  function getUnknownTagGenericBrowser(object, tag) {
    if (self.HTMLElement && object instanceof HTMLElement) return "HTMLElement";
    return getUnknownTag(object, tag);
  }
  function prototypeForTag(tag) {
    if (typeof window == "undefined") return null;
    if (typeof window[tag] == "undefined") return null;
    var constructor = window[tag];
    if (typeof constructor != "function") return null;
    return constructor.prototype;
  }
  function discriminator(tag) { return null; }
  var isBrowser = typeof navigator == "object";
  return {
    getTag: getTag,
    getUnknownTag: isBrowser ? getUnknownTagGenericBrowser : getUnknownTag,
    prototypeForTag: prototypeForTag,
    discriminator: discriminator };
}
B.bg=function(getTagFallback) {
  return function(hooks) {
    if (typeof navigator != "object") return hooks;
    var ua = navigator.userAgent;
    if (ua.indexOf("DumpRenderTree") >= 0) return hooks;
    if (ua.indexOf("Chrome") >= 0) {
      function confirm(p) {
        return typeof window == "object" && window[p] && window[p].name == p;
      }
      if (confirm("Window") && confirm("HTMLElement")) return hooks;
    }
    hooks.getTag = getTagFallback;
  };
}
B.bc=function(hooks) {
  if (typeof dartExperimentalFixupGetTag != "function") return hooks;
  hooks.getTag = dartExperimentalFixupGetTag(hooks.getTag);
}
B.bd=function(hooks) {
  var getTag = hooks.getTag;
  var prototypeForTag = hooks.prototypeForTag;
  function getTagFixed(o) {
    var tag = getTag(o);
    if (tag == "Document") {
      if (!!o.xmlVersion) return "!Document";
      return "!HTMLDocument";
    }
    return tag;
  }
  function prototypeForTagFixed(tag) {
    if (tag == "Document") return null;
    return prototypeForTag(tag);
  }
  hooks.getTag = getTagFixed;
  hooks.prototypeForTag = prototypeForTagFixed;
}
B.bf=function(hooks) {
  var userAgent = typeof navigator == "object" ? navigator.userAgent : "";
  if (userAgent.indexOf("Firefox") == -1) return hooks;
  var getTag = hooks.getTag;
  var quickMap = {
    "BeforeUnloadEvent": "Event",
    "DataTransfer": "Clipboard",
    "GeoGeolocation": "Geolocation",
    "Location": "!Location",
    "WorkerMessageEvent": "MessageEvent",
    "XMLDocument": "!Document"};
  function getTagFirefox(o) {
    var tag = getTag(o);
    return quickMap[tag] || tag;
  }
  hooks.getTag = getTagFirefox;
}
B.be=function(hooks) {
  var userAgent = typeof navigator == "object" ? navigator.userAgent : "";
  if (userAgent.indexOf("Trident/") == -1) return hooks;
  var getTag = hooks.getTag;
  var quickMap = {
    "BeforeUnloadEvent": "Event",
    "DataTransfer": "Clipboard",
    "HTMLDDElement": "HTMLElement",
    "HTMLDTElement": "HTMLElement",
    "HTMLPhraseElement": "HTMLElement",
    "Position": "Geoposition"
  };
  function getTagIE(o) {
    var tag = getTag(o);
    var newTag = quickMap[tag];
    if (newTag) return newTag;
    if (tag == "Object") {
      if (window.DataView && (o instanceof window.DataView)) return "DataView";
    }
    return tag;
  }
  function prototypeForTagIE(tag) {
    var constructor = window[tag];
    if (constructor == null) return null;
    return constructor.prototype;
  }
  hooks.getTag = getTagIE;
  hooks.prototypeForTag = prototypeForTagIE;
}
B.aa=function(hooks) { return hooks; }

B.ab=new A.iQ()
B.bh=new A.fi()
B.bi=new A.dR()
B.bj=new A.dS()
B.ac=new A.lA()
B.M=new A.m1()
B.ad=new A.mm()
B.i=new A.mn()
B.bk=new A.fR()
B.O=new A.cc(0,"Unknown")
B.p=new A.cc(1,"RGB")
B.B=new A.cc(2,"RGBA")
B.ae=new A.cc(3,"Luminance")
B.af=new A.cc(4,"LuminanceAlpha")
B.ag=new A.cU(0,"JPEG")
B.ah=new A.cU(1,"PNG")
B.ai=new A.cU(2,"WebP")
B.bV=new A.cU(3,"KTX2")
B.aj=new A.aL("Wrong WebP header.")
B.bX=new A.aL("PNG header not found.")
B.bY=new A.aL("Invalid JPEG marker segment length.")
B.q=new A.aL("Wrong chunk length.")
B.bZ=new A.aL("Invalid number of JPEG color channels.")
B.c_=new A.aL("Invalid start of file.")
B.c4=new A.iR(null)
B.c5=A.a(s([0,0]),t.o)
B.ak=A.a(s([0,0,0]),t.o)
B.c6=A.a(s([16]),t.V)
B.c7=A.a(s([1,1]),t.o)
B.C=A.a(s([1,1,1]),t.o)
B.al=A.a(s([1,1,1,1]),t.o)
B.am=A.a(s([2]),t.V)
B.c9=A.a(s(["sheenColorFactor","sheenColorTexture","sheenRoughnessFactor","sheenRoughnessTexture"]),t.i)
B.an=A.a(s([0,0,32776,33792,1,10240,0,0]),t.V)
B.ca=A.a(s(["clearcoatFactor","clearcoatTexture","clearcoatRoughnessFactor","clearcoatRoughnessTexture","clearcoatNormalTexture"]),t.i)
B.l=A.a(s([3]),t.V)
B.ao=A.a(s([33071,33648,10497]),t.V)
B.cb=A.a(s([34962,34963]),t.V)
B.cc=A.a(s(["specularFactor","specularTexture","specularColorFactor","specularColorTexture"]),t.i)
B.P=A.a(s([4]),t.V)
B.Z=new A.y("VEC2",5120,!1)
B.aW=new A.y("VEC2",5121,!1)
B.a1=new A.y("VEC2",5122,!1)
B.aX=new A.y("VEC2",5123,!1)
B.cd=A.a(s([B.Z,B.a_,B.aW,B.a1,B.a2,B.aX]),t.p)
B.ce=A.a(s([5121,5123,5125]),t.V)
B.ap=A.a(s(["image/jpeg","image/png"]),t.i)
B.cf=A.a(s(["transmissionFactor","transmissionTexture"]),t.i)
B.cg=A.a(s([9728,9729]),t.V)
B.aQ=new A.y("SCALAR",5121,!1)
B.aT=new A.y("SCALAR",5123,!1)
B.aV=new A.y("SCALAR",5125,!1)
B.aq=A.a(s([B.aQ,B.aT,B.aV]),t.p)
B.ci=A.a(s(["image/jpeg","image/png","image/webp","image/ktx2"]),t.i)
B.cj=A.a(s(["camera","children","skin","matrix","mesh","rotation","scale","translation","weights","name"]),t.i)
B.ck=A.a(s([9728,9729,9984,9985,9986,9987]),t.V)
B.cl=A.a(s(["COLOR","JOINTS","TEXCOORD","WEIGHTS"]),t.i)
B.cm=A.a(s(["COLOR","TEXCOORD"]),t.i)
B.D=A.a(s([0,0,65490,45055,65535,34815,65534,18431]),t.V)
B.b=new A.bH(0,"Error")
B.e=new A.bH(1,"Warning")
B.h=new A.bH(2,"Information")
B.aB=new A.bH(3,"Hint")
B.cn=A.a(s([B.b,B.e,B.h,B.aB]),A.aR("D<bH*>"))
B.co=A.a(s(["color","intensity","spot","type","range","name"]),t.i)
B.cp=A.a(s(["buffer","byteOffset","byteLength","byteStride","target","name"]),t.i)
B.as=A.a(s([0,0,26624,1023,65534,2047,65534,2047]),t.V)
B.cq=A.a(s(["LINEAR","STEP","CUBICSPLINE"]),t.i)
B.cr=A.a(s(["OPAQUE","MASK","BLEND"]),t.i)
B.cs=A.a(s(["pbrMetallicRoughness","normalTexture","occlusionTexture","emissiveTexture","emissiveFactor","alphaMode","alphaCutoff","doubleSided","name"]),t.i)
B.ct=A.a(s(["POSITION","NORMAL","TANGENT"]),t.i)
B.cu=A.a(s([5120,5121,5122,5123,5125,5126]),t.V)
B.cv=A.a(s(["anisotropyStrength","anisotropyRotation","anisotropyTexture"]),t.i)
B.cw=A.a(s(["inverseBindMatrices","skeleton","joints","name"]),t.i)
B.a5=new A.y("VEC3",5120,!1)
B.a6=new A.y("VEC3",5122,!1)
B.cx=A.a(s([B.a5,B.w,B.a6,B.x]),t.p)
B.cy=A.a(s(["data-uri","buffer-view","glb","external"]),t.i)
B.cz=A.a(s(["POINTS","LINES","LINE_LOOP","LINE_STRIP","TRIANGLES","TRIANGLE_STRIP","TRIANGLE_FAN"]),t.i)
B.cA=A.a(s(["bufferView","byteOffset","componentType"]),t.i)
B.Q=A.a(s([B.w,B.x]),t.p)
B.cB=A.a(s(["aspectRatio","yfov","zfar","znear"]),t.i)
B.cC=A.a(s(["copyright","generator","version","minVersion"]),t.i)
B.cD=A.a(s(["bufferView","byteOffset"]),t.i)
B.cE=A.a(s(["bufferView","mimeType","uri","name"]),t.i)
B.cF=A.a(s(["channels","samplers","name"]),t.i)
B.cG=A.a(s(["baseColorFactor","baseColorTexture","metallicFactor","roughnessFactor","metallicRoughnessTexture"]),t.i)
B.cH=A.a(s(["count","indices","values"]),t.i)
B.cI=A.a(s(["diffuseFactor","diffuseTexture","specularFactor","glossinessFactor","specularGlossinessTexture"]),t.i)
B.cJ=A.a(s(["directional","point","spot"]),t.i)
B.cK=A.a(s(["dispersion"]),t.i)
B.cL=A.a(s(["emissiveStrength"]),t.i)
B.at=A.a(s([]),t.b)
B.cM=A.a(s([]),t.i)
B.cP=A.a(s(["extensions","extras"]),t.i)
B.cQ=A.a(s([0,0,32722,12287,65534,34815,65534,18431]),t.V)
B.W=A.u("bK")
B.bl=new A.O(A.x2(),!1,!1)
B.dK=new A.X([B.W,B.bl],t.N)
B.bG=new A.L("EXT_texture_webp",B.dK,A.x3(),!1)
B.aC=A.u("bw")
B.bm=new A.O(A.xj(),!1,!1)
B.dG=new A.X([B.aC,B.bm],t.N)
B.bP=new A.L("KHR_animation_pointer",B.dG,A.xk(),!1)
B.U=A.u("du")
B.V=A.u("ap")
B.bn=new A.O(A.xl(),!1,!1)
B.bs=new A.O(A.xn(),!1,!1)
B.dI=new A.X([B.U,B.bn,B.V,B.bs],t.N)
B.bQ=new A.L("KHR_lights_punctual",B.dI,null,!1)
B.f=A.u("ai")
B.bt=new A.O(A.xo(),!1,!1)
B.du=new A.X([B.f,B.bt],t.N)
B.bD=new A.L("KHR_materials_anisotropy",B.du,null,!1)
B.bu=new A.O(A.xp(),!1,!1)
B.dv=new A.X([B.f,B.bu],t.N)
B.bM=new A.L("KHR_materials_clearcoat",B.dv,null,!1)
B.bv=new A.O(A.xq(),!1,!1)
B.dw=new A.X([B.f,B.bv],t.N)
B.bL=new A.L("KHR_materials_dispersion",B.dw,null,!1)
B.bw=new A.O(A.xr(),!1,!1)
B.dy=new A.X([B.f,B.bw],t.N)
B.bT=new A.L("KHR_materials_emissive_strength",B.dy,null,!1)
B.bx=new A.O(A.xs(),!1,!1)
B.dz=new A.X([B.f,B.bx],t.N)
B.bR=new A.L("KHR_materials_ior",B.dz,null,!1)
B.by=new A.O(A.xt(),!1,!1)
B.dA=new A.X([B.f,B.by],t.N)
B.bK=new A.L("KHR_materials_iridescence",B.dA,null,!1)
B.bB=new A.O(A.xu(),!0,!1)
B.dB=new A.X([B.f,B.bB],t.N)
B.bI=new A.L("KHR_materials_pbrSpecularGlossiness",B.dB,null,!1)
B.bz=new A.O(A.xv(),!1,!1)
B.dC=new A.X([B.f,B.bz],t.N)
B.bF=new A.L("KHR_materials_sheen",B.dC,null,!1)
B.bo=new A.O(A.xw(),!1,!1)
B.dD=new A.X([B.f,B.bo],t.N)
B.bO=new A.L("KHR_materials_specular",B.dD,null,!1)
B.bp=new A.O(A.xx(),!1,!1)
B.dE=new A.X([B.f,B.bp],t.N)
B.bN=new A.L("KHR_materials_transmission",B.dE,null,!1)
B.bC=new A.O(A.xy(),!0,!1)
B.dF=new A.X([B.f,B.bC],t.N)
B.bE=new A.L("KHR_materials_unlit",B.dF,null,!1)
B.aF=A.u("aE")
B.bq=new A.O(A.ul(),!1,!1)
B.bA=new A.O(A.um(),!1,!0)
B.dH=new A.X([B.U,B.bq,B.aF,B.bA],t.N)
B.bJ=new A.L("KHR_materials_variants",B.dH,null,!1)
B.br=new A.O(A.xz(),!1,!1)
B.dx=new A.X([B.f,B.br],t.N)
B.bS=new A.L("KHR_materials_volume",B.dx,null,!1)
B.cN=A.a(s([]),A.aR("D<bk*>"))
B.dL=new A.aJ(0,{},B.cN,A.aR("aJ<bk*,O*>"))
B.bU=new A.L("KHR_mesh_quantization",B.dL,A.xA(),!0)
B.aL=A.u("bj")
B.aH=A.u("cz")
B.aI=A.u("cA")
B.N=new A.O(A.xB(),!1,!1)
B.dJ=new A.X([B.aL,B.N,B.aH,B.N,B.aI,B.N],t.N)
B.bH=new A.L("KHR_texture_transform",B.dJ,null,!1)
B.au=A.a(s([B.bG,B.bP,B.bQ,B.bD,B.bM,B.bL,B.bT,B.bR,B.bK,B.bI,B.bF,B.bO,B.bN,B.bE,B.bJ,B.bS,B.bU,B.bH]),A.aR("D<L*>"))
B.cS=A.a(s(["index","texCoord"]),t.i)
B.cT=A.a(s(["index","texCoord","scale"]),t.i)
B.cU=A.a(s(["index","texCoord","strength"]),t.i)
B.cV=A.a(s(["innerConeAngle","outerConeAngle"]),t.i)
B.cW=A.a(s(["input","interpolation","output"]),t.i)
B.cX=A.a(s(["ior"]),t.i)
B.cY=A.a(s(["attributes","indices","material","mode","targets"]),t.i)
B.cZ=A.a(s(["bufferView","byteOffset","componentType","count","type","normalized","max","min","sparse","name"]),t.i)
B.d_=A.a(s(["light"]),t.i)
B.d0=A.a(s(["lights"]),t.i)
B.d1=A.a(s(["mappings"]),t.i)
B.d2=A.a(s(["name"]),t.i)
B.d3=A.a(s(["node","path"]),t.i)
B.d4=A.a(s(["nodes","name"]),t.i)
B.d5=A.a(s([null,"linear","srgb","custom"]),t.i)
B.d6=A.a(s([null,"srgb","custom"]),t.i)
B.av=A.a(s([0,0,24576,1023,65534,34815,65534,18431]),t.V)
B.d7=A.a(s(["image/webp"]),t.i)
B.d8=A.a(s(["offset","rotation","scale","texCoord"]),t.i)
B.aw=A.a(s(["orthographic","perspective"]),t.i)
B.d9=A.a(s(["pointer"]),t.i)
B.da=A.a(s(["primitives","weights","name"]),t.i)
B.db=A.a(s([0,0,32754,11263,65534,34815,65534,18431]),t.V)
B.dc=A.a(s(["magFilter","minFilter","wrapS","wrapT","name"]),t.i)
B.dd=A.a(s([null,"rgb","rgba","luminance","luminance-alpha"]),t.i)
B.ax=A.a(s([0,0,65490,12287,65535,34815,65534,18431]),t.V)
B.de=A.a(s(["sampler","source","name"]),t.i)
B.df=A.a(s(["source"]),t.i)
B.dg=A.a(s(["iridescenceFactor","iridescenceTexture","iridescenceIor","iridescenceThicknessMinimum","iridescenceThicknessMaximum","iridescenceThicknessTexture"]),t.i)
B.aY=new A.y("VEC3",5121,!1)
B.aZ=new A.y("VEC3",5123,!1)
B.dh=A.a(s([B.a5,B.w,B.aY,B.H,B.a6,B.x,B.aZ,B.I]),t.p)
B.di=A.a(s(["target","sampler"]),t.i)
B.R=A.a(s(["translation","rotation","scale","weights"]),t.i)
B.dj=A.a(s(["type","orthographic","perspective","name"]),t.i)
B.dk=A.a(s(["uri","byteLength","name"]),t.i)
B.dl=A.a(s(["variants"]),t.i)
B.dm=A.a(s(["variants","material","name"]),t.i)
B.dn=A.a(s([B.Z,B.a1]),t.p)
B.dp=A.a(s(["attenuationColor","attenuationDistance","thicknessFactor","thicknessTexture"]),t.i)
B.dq=A.a(s(["xmag","ymag","zfar","znear"]),t.i)
B.dr=A.a(s(["extensionsUsed","extensionsRequired","accessors","animations","asset","buffers","bufferViews","cameras","images","materials","meshes","nodes","samplers","scene","scenes","skins","textures"]),t.i)
B.ds=A.a(s([B.J,B.K]),t.p)
B.ar=A.a(s([B.k]),t.p)
B.c8=A.a(s([B.n,B.y,B.J,B.z,B.K]),t.p)
B.aR=new A.y("SCALAR",5121,!0)
B.aP=new A.y("SCALAR",5120,!0)
B.aU=new A.y("SCALAR",5123,!0)
B.aS=new A.y("SCALAR",5122,!0)
B.cR=A.a(s([B.G,B.aR,B.aP,B.aU,B.aS]),t.p)
B.dt=new A.aJ(4,{translation:B.ar,rotation:B.c8,scale:B.ar,weights:B.cR},B.R,A.aR("aJ<e*,o<y*>*>"))
B.ch=A.a(s(["SCALAR","VEC2","VEC3","VEC4","MAT2","MAT3","MAT4"]),t.i)
B.m=new A.aJ(7,{SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},B.ch,A.aR("aJ<e*,f*>"))
B.ay=new A.X([5120,"BYTE",5121,"UNSIGNED_BYTE",5122,"SHORT",5123,"UNSIGNED_SHORT",5124,"INT",5125,"UNSIGNED_INT",5126,"FLOAT",35664,"FLOAT_VEC2",35665,"FLOAT_VEC3",35666,"FLOAT_VEC4",35667,"INT_VEC2",35668,"INT_VEC3",35669,"INT_VEC4",35670,"BOOL",35671,"BOOL_VEC2",35672,"BOOL_VEC3",35673,"BOOL_VEC4",35674,"FLOAT_MAT2",35675,"FLOAT_MAT3",35676,"FLOAT_MAT4",35678,"SAMPLER_2D"],A.aR("X<f*,e*>"))
B.cO=A.a(s([]),A.aR("D<cD*>"))
B.az=new A.aJ(0,{},B.cO,A.aR("aJ<cD*,@>"))
B.dM=new A.d3("call")
B.dN=A.u("c_")
B.dO=A.u("c0")
B.dP=A.u("bZ")
B.S=A.u("a4<N>")
B.dQ=A.u("b2")
B.dR=A.u("b3")
B.T=A.u("bv")
B.dS=A.u("bx")
B.aD=A.u("by")
B.dT=A.u("aT")
B.dU=A.u("c3")
B.dV=A.u("c4")
B.dW=A.u("bz")
B.dX=A.u("co")
B.dY=A.u("ca")
B.aE=A.u("aU")
B.dZ=A.u("cf")
B.e_=A.u("bC")
B.e0=A.u("cg")
B.e1=A.u("ba")
B.e2=A.u("ch")
B.e3=A.u("ci")
B.e4=A.u("cj")
B.e5=A.u("ck")
B.e6=A.u("cl")
B.e7=A.u("cm")
B.e8=A.u("cn")
B.e9=A.u("cp")
B.ea=A.u("cq")
B.eb=A.u("cr")
B.ec=A.u("cs")
B.ed=A.u("bD")
B.ee=A.u("bb")
B.ef=A.u("aM")
B.eg=A.u("cu")
B.eh=A.u("cv")
B.aG=A.u("aV")
B.ei=A.u("c")
B.ej=A.u("cB")
B.ek=A.u("bF")
B.aJ=A.u("bG")
B.aK=A.u("bI")
B.el=A.u("ct")
B.em=new A.lB(!1)
B.r=new A.dV(0,"Unknown")
B.t=new A.dV(1,"sRGB")
B.E=new A.dV(2,"Custom")
B.u=new A.d5(0,"Unknown")
B.en=new A.d5(1,"Linear")
B.v=new A.d5(2,"sRGB")
B.F=new A.d5(3,"Custom")
B.eo=new A.d7(null,2)
B.aM=new A.d9(0,"DataUri")
B.aN=new A.d9(1,"BufferView")
B.ep=new A.d9(2,"GLB")
B.aO=new A.d9(3,"External")})();(function staticFields(){$.mg=null
$.oR=null
$.ov=null
$.ou=null
$.pR=null
$.pJ=null
$.pY=null
$.mP=null
$.n_=null
$.nQ=null
$.dg=null
$.ev=null
$.ew=null
$.nK=!1
$.B=B.i
$.cJ=A.a([],A.aR("D<c>"))
$.oN=null
$.oL=null
$.oM=null})();(function lazyInitializers(){var s=hunkHelpers.lazyFinal,r=hunkHelpers.lazy,q=hunkHelpers.lazyOld
s($,"xW","nW",()=>A.xa("_$dart_dartClosure"))
s($,"Bi","tu",()=>B.i.cZ(new A.nd()))
s($,"AH","tb",()=>A.bl(A.lu({
toString:function(){return"$receiver$"}})))
s($,"AI","tc",()=>A.bl(A.lu({$method$:null,
toString:function(){return"$receiver$"}})))
s($,"AJ","td",()=>A.bl(A.lu(null)))
s($,"AK","te",()=>A.bl(function(){var $argumentsExpr$="$arguments$"
try{null.$method$($argumentsExpr$)}catch(p){return p.message}}()))
s($,"AN","th",()=>A.bl(A.lu(void 0)))
s($,"AO","ti",()=>A.bl(function(){var $argumentsExpr$="$arguments$"
try{(void 0).$method$($argumentsExpr$)}catch(p){return p.message}}()))
s($,"AM","tg",()=>A.bl(A.p3(null)))
s($,"AL","tf",()=>A.bl(function(){try{null.$method$}catch(p){return p.message}}()))
s($,"AQ","tk",()=>A.bl(A.p3(void 0)))
s($,"AP","tj",()=>A.bl(function(){try{(void 0).$method$}catch(p){return p.message}}()))
s($,"AT","oj",()=>A.vg())
s($,"yt","h0",()=>t.U.a($.tu()))
s($,"AR","tl",()=>new A.lD().$0())
s($,"AS","tm",()=>new A.lC().$0())
s($,"AV","ok",()=>A.uR(A.w8(A.a([-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-1,-2,-2,-2,-2,-2,62,-2,62,-2,63,52,53,54,55,56,57,58,59,60,61,-2,-2,-2,-1,-2,-2,-2,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-2,-2,-2,-2,63,-2,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,-2,-2,-2,-2,-2],t.Z))))
r($,"AU","tn",()=>A.uS(0))
s($,"Bb","to",()=>A.fZ(B.ei))
s($,"Bf","ts",()=>A.w6())
q($,"xU","br",()=>A.nx("^([0-9]+)\\.([0-9]+)$"))
q($,"xV","q3",()=>A.nx("^([A-Z0-9]+)_[A-Za-z0-9_]+$"))
q($,"yi","ql",()=>A.G("BUFFER_BYTE_LENGTH_MISMATCH",new A.hL(),B.b))
q($,"yj","qm",()=>A.G("BUFFER_GLB_CHUNK_TOO_BIG",new A.hM(),B.e))
q($,"yb","o_",()=>A.G("ACCESSOR_MIN_MISMATCH",new A.hE(),B.b))
q($,"ya","nZ",()=>A.G("ACCESSOR_MAX_MISMATCH",new A.hD(),B.b))
q($,"y0","nY",()=>A.G("ACCESSOR_ELEMENT_OUT_OF_MIN_BOUND",new A.ht(),B.b))
q($,"y_","nX",()=>A.G("ACCESSOR_ELEMENT_OUT_OF_MAX_BOUND",new A.hs(),B.b))
q($,"yf","o0",()=>A.G("ACCESSOR_VECTOR3_NON_UNIT",new A.hI(),B.b))
q($,"y6","qc",()=>A.G("ACCESSOR_INVALID_SIGN",new A.hz(),B.b))
q($,"xZ","q6",()=>A.G("ACCESSOR_ANIMATION_SAMPLER_OUTPUT_NON_NORMALIZED_QUATERNION",new A.hr(),B.b))
q($,"yc","qg",()=>A.G("ACCESSOR_NON_CLAMPED",new A.hF(),B.b))
q($,"y4","qa",()=>A.G("ACCESSOR_INVALID_FLOAT",new A.hx(),B.b))
q($,"y1","q7",()=>A.G("ACCESSOR_INDEX_OOB",new A.hu(),B.b))
q($,"y3","q9",()=>A.G("ACCESSOR_INDEX_TRIANGLE_DEGENERATE",new A.hw(),B.h))
q($,"y2","q8",()=>A.G("ACCESSOR_INDEX_PRIMITIVE_RESTART",new A.hv(),B.b))
q($,"xX","q4",()=>A.G("ACCESSOR_ANIMATION_INPUT_NEGATIVE",new A.hp(),B.b))
q($,"xY","q5",()=>A.G("ACCESSOR_ANIMATION_INPUT_NON_INCREASING",new A.hq(),B.b))
q($,"ye","qi",()=>A.G("ACCESSOR_SPARSE_INDICES_NON_INCREASING",new A.hH(),B.b))
q($,"yd","qh",()=>A.G("ACCESSOR_SPARSE_INDEX_OOB",new A.hG(),B.b))
q($,"y5","qb",()=>A.G("ACCESSOR_INVALID_IBM",new A.hy(),B.b))
q($,"yl","qn",()=>A.G("IMAGE_DATA_INVALID",new A.hO(),B.b))
q($,"yn","qp",()=>A.G("IMAGE_MIME_TYPE_INVALID",new A.hQ(),B.b))
q($,"yq","qs",()=>A.G("IMAGE_UNEXPECTED_EOS",new A.hT(),B.b))
q($,"yr","qt",()=>A.G("IMAGE_UNRECOGNIZED_FORMAT",new A.hU(),B.e))
q($,"yo","qq",()=>A.G("IMAGE_NON_ENABLED_MIME_TYPE",new A.hR(),B.b))
q($,"yp","qr",()=>A.G("IMAGE_NPOT_DIMENSIONS",new A.hS(),B.h))
q($,"ym","qo",()=>A.G("IMAGE_FEATURES_UNSUPPORTED",new A.hP(),B.e))
q($,"ys","o2",()=>A.G("URI_GLB",new A.hV(),B.h))
q($,"yk","o1",()=>A.G("DATA_URI_GLB",new A.hN(),B.e))
q($,"y8","qe",()=>A.G("ACCESSOR_JOINTS_INDEX_OOB",new A.hB(),B.b))
q($,"y7","qd",()=>A.G("ACCESSOR_JOINTS_INDEX_DUPLICATE",new A.hA(),B.b))
q($,"yg","qj",()=>A.G("ACCESSOR_WEIGHTS_NEGATIVE",new A.hJ(),B.b))
q($,"yh","qk",()=>A.G("ACCESSOR_WEIGHTS_NON_NORMALIZED",new A.hK(),B.b))
q($,"y9","qf",()=>A.G("ACCESSOR_JOINTS_USED_ZERO_WEIGHT",new A.hC(),B.e))
q($,"yK","nh",()=>new A.iF(B.b,"IO_ERROR",new A.iG()))
q($,"zC","oc",()=>A.am("ARRAY_LENGTH_NOT_IN_LIST",new A.kh(),B.b))
q($,"zD","eC",()=>A.am("ARRAY_TYPE_MISMATCH",new A.ki(),B.b))
q($,"zB","ob",()=>A.am("DUPLICATE_ELEMENTS",new A.kg(),B.b))
q($,"zF","h2",()=>A.am("INVALID_INDEX",new A.kk(),B.b))
q($,"zG","h3",()=>A.am("INVALID_JSON",new A.kl(),B.b))
q($,"zH","od",()=>A.am("INVALID_URI",new A.km(),B.b))
q($,"zE","bX",()=>A.am("EMPTY_ENTITY",new A.kj(),B.b))
q($,"zI","oe",()=>A.am("ONE_OF_MISMATCH",new A.kn(),B.b))
q($,"zJ","rp",()=>A.am("PATTERN_MISMATCH",new A.ko(),B.b))
q($,"zK","a2",()=>A.am("TYPE_MISMATCH",new A.kp(),B.b))
q($,"zP","rs",()=>A.am("VALUE_NOT_IN_LIST",new A.ku(),B.e))
q($,"zQ","ni",()=>A.am("VALUE_NOT_IN_RANGE",new A.kv(),B.b))
q($,"zO","rr",()=>A.am("VALUE_MULTIPLE_OF",new A.kt(),B.b))
q($,"zL","bs",()=>A.am("UNDEFINED_PROPERTY",new A.kq(),B.b))
q($,"zM","rq",()=>A.am("UNEXPECTED_PROPERTY",new A.kr(),B.e))
q($,"zN","cO",()=>A.am("UNSATISFIED_DEPENDENCY",new A.ks(),B.b))
q($,"AD","t8",()=>A.r("UNKNOWN_ASSET_MAJOR_VERSION",new A.lj(),B.b))
q($,"AE","t9",()=>A.r("UNKNOWN_ASSET_MINOR_VERSION",new A.lk(),B.e))
q($,"Ao","rV",()=>A.r("ASSET_MIN_VERSION_GREATER_THAN_VERSION",new A.l4(),B.b))
q($,"A4","rC",()=>A.r("INVALID_GL_VALUE",new A.kL(),B.b))
q($,"zS","ru",()=>A.r("ACCESSOR_NORMALIZED_INVALID",new A.ky(),B.b))
q($,"zT","rv",()=>A.r("ACCESSOR_OFFSET_ALIGNMENT",new A.kz(),B.b))
q($,"zR","rt",()=>A.r("ACCESSOR_MATRIX_ALIGNMENT",new A.kx(),B.b))
q($,"zU","rw",()=>A.r("ACCESSOR_SPARSE_COUNT_OUT_OF_RANGE",new A.kA(),B.b))
q($,"zV","rx",()=>A.r("ANIMATION_CHANNEL_TARGET_NODE_SKIN",new A.kB(),B.e))
q($,"zW","ry",()=>A.r("BUFFER_DATA_URI_MIME_TYPE_INVALID",new A.kC(),B.b))
q($,"zY","rz",()=>A.r("BUFFER_VIEW_TOO_BIG_BYTE_STRIDE",new A.kE(),B.b))
q($,"zX","nj",()=>A.r("BUFFER_VIEW_INVALID_BYTE_STRIDE",new A.kD(),B.b))
q($,"zZ","of",()=>A.r("CAMERA_XMAG_YMAG_NEGATIVE",new A.kF(),B.e))
q($,"A_","og",()=>A.r("CAMERA_XMAG_YMAG_ZERO",new A.kG(),B.b))
q($,"A0","rA",()=>A.r("CAMERA_YFOV_GEQUAL_PI",new A.kH(),B.e))
q($,"A1","oh",()=>A.r("CAMERA_ZFAR_LEQUAL_ZNEAR",new A.kI(),B.b))
q($,"Ag","rO",()=>A.r("MATERIAL_ALPHA_CUTOFF_INVALID_MODE",new A.kX(),B.e))
q($,"Aj","nk",()=>A.r("MESH_PRIMITIVE_INVALID_ATTRIBUTE",new A.l_(),B.b))
q($,"An","rU",()=>A.r("MESH_PRIMITIVES_UNEQUAL_TARGETS_COUNT",new A.l3(),B.b))
q($,"Al","rS",()=>A.r("MESH_PRIMITIVE_NO_POSITION",new A.l1(),B.e))
q($,"Ai","rQ",()=>A.r("MESH_PRIMITIVE_INDEXED_SEMANTIC_CONTINUITY",new A.kZ(),B.b))
q($,"Am","rT",()=>A.r("MESH_PRIMITIVE_TANGENT_WITHOUT_NORMAL",new A.l2(),B.e))
q($,"Ak","rR",()=>A.r("MESH_PRIMITIVE_JOINTS_WEIGHTS_MISMATCH",new A.l0(),B.b))
q($,"Ah","rP",()=>A.r("MESH_INVALID_WEIGHTS_COUNT",new A.kY(),B.b))
q($,"As","rZ",()=>A.r("NODE_MATRIX_TRS",new A.l8(),B.b))
q($,"Aq","rX",()=>A.r("NODE_MATRIX_DEFAULT",new A.l6(),B.h))
q($,"At","t_",()=>A.r("NODE_MATRIX_NON_TRS",new A.l9(),B.b))
q($,"AA","t5",()=>A.r("ROTATION_NON_UNIT",new A.lg(),B.b))
q($,"AF","ta",()=>A.r("UNUSED_EXTENSION_REQUIRED",new A.ll(),B.b))
q($,"Az","t4",()=>A.r("NON_REQUIRED_EXTENSION",new A.lf(),B.b))
q($,"A3","rB",()=>A.r("INVALID_EXTENSION_NAME_FORMAT",new A.kK(),B.e))
q($,"Ar","rY",()=>A.r("NODE_EMPTY",new A.l7(),B.h))
q($,"Aw","t2",()=>A.r("NODE_SKINNED_MESH_NON_ROOT",new A.lc(),B.e))
q($,"Av","t1",()=>A.r("NODE_SKINNED_MESH_LOCAL_TRANSFORMS",new A.lb(),B.e))
q($,"Au","t0",()=>A.r("NODE_SKIN_NO_SCENE",new A.la(),B.b))
q($,"AB","t6",()=>A.r("SKIN_NO_COMMON_ROOT",new A.lh(),B.b))
q($,"AC","t7",()=>A.r("SKIN_SKELETON_INVALID",new A.li(),B.b))
q($,"Ay","t3",()=>A.r("NON_RELATIVE_URI",new A.le(),B.e))
q($,"Ap","rW",()=>A.r("MULTIPLE_EXTENSIONS",new A.l5(),B.e))
q($,"Ax","dk",()=>A.r("NON_OBJECT_EXTRAS",new A.ld(),B.h))
q($,"A2","oi",()=>A.r("EXTRA_PROPERTY",new A.kJ(),B.h))
q($,"A5","rD",()=>A.r("KHR_ANIMATION_POINTER_ANIMATION_CHANNEL_TARGET_NODE",new A.kM(),B.b))
q($,"A6","rE",()=>A.r("KHR_ANIMATION_POINTER_ANIMATION_CHANNEL_TARGET_PATH",new A.kN(),B.b))
q($,"A7","rF",()=>A.r("KHR_LIGHTS_PUNCTUAL_LIGHT_SPOT_ANGLES",new A.kO(),B.b))
q($,"A8","rG",()=>A.r("KHR_MATERIALS_ANISOTROPY_ANISOTROPY_TEXTURE_TEXCOORD",new A.kP(),B.e))
q($,"A9","rH",()=>A.r("KHR_MATERIALS_CLEARCOAT_CLEARCOAT_NORMAL_TEXTURE_TEXCOORD",new A.kQ(),B.e))
q($,"Aa","rI",()=>A.r("KHR_MATERIALS_DISPERSION_NO_VOLUME",new A.kR(),B.e))
q($,"Ab","rJ",()=>A.r("KHR_MATERIALS_EMISSIVE_STRENGTH_ZERO_FACTOR",new A.kS(),B.e))
q($,"Af","rN",()=>A.r("KHR_MATERIALS_VOLUME_NO_TRANSMISSION",new A.kW(),B.e))
q($,"Ae","rM",()=>A.r("KHR_MATERIALS_VOLUME_DOUBLE_SIDED",new A.kV(),B.e))
q($,"Ac","rK",()=>A.r("KHR_MATERIALS_IRIDESCENCE_THICKNESS_RANGE_WITHOUT_TEXTURE",new A.kT(),B.h))
q($,"Ad","rL",()=>A.r("KHR_MATERIALS_IRIDESCENCE_THICKNESS_TEXTURE_UNUSED",new A.kU(),B.h))
q($,"yO","qM",()=>A.v("ACCESSOR_TOTAL_OFFSET_ALIGNMENT",new A.j0(),B.b))
q($,"yM","qL",()=>A.v("ACCESSOR_SMALL_BYTESTRIDE",new A.iZ(),B.b))
q($,"yN","o3",()=>A.v("ACCESSOR_TOO_LONG",new A.j_(),B.b))
q($,"yP","qN",()=>A.v("ACCESSOR_USAGE_OVERRIDE",new A.j1(),B.b))
q($,"yS","qQ",()=>A.v("ANIMATION_DUPLICATE_TARGETS",new A.j4(),B.b))
q($,"yQ","qO",()=>A.v("ANIMATION_CHANNEL_TARGET_NODE_MATRIX",new A.j2(),B.b))
q($,"yR","qP",()=>A.v("ANIMATION_CHANNEL_TARGET_NODE_WEIGHTS_NO_MORPHS",new A.j3(),B.b))
q($,"yW","qT",()=>A.v("ANIMATION_SAMPLER_INPUT_ACCESSOR_WITHOUT_BOUNDS",new A.j8(),B.b))
q($,"yU","qR",()=>A.v("ANIMATION_SAMPLER_INPUT_ACCESSOR_INVALID_FORMAT",new A.j6(),B.b))
q($,"yY","qV",()=>A.v("ANIMATION_SAMPLER_OUTPUT_ACCESSOR_INVALID_FORMAT",new A.ja(),B.b))
q($,"yV","qS",()=>A.v("ANIMATION_SAMPLER_INPUT_ACCESSOR_TOO_FEW_ELEMENTS",new A.j7(),B.b))
q($,"yX","qU",()=>A.v("ANIMATION_SAMPLER_OUTPUT_ACCESSOR_INVALID_COUNT",new A.j9(),B.b))
q($,"yT","o4",()=>A.v("ANIMATION_SAMPLER_ACCESSOR_WITH_BYTESTRIDE",new A.j5(),B.b))
q($,"yZ","qW",()=>A.v("BUFFER_MISSING_GLB_DATA",new A.jb(),B.b))
q($,"z1","o5",()=>A.v("BUFFER_VIEW_TOO_LONG",new A.je(),B.b))
q($,"z0","qY",()=>A.v("BUFFER_VIEW_TARGET_OVERRIDE",new A.jd(),B.b))
q($,"z_","qX",()=>A.v("BUFFER_VIEW_TARGET_MISSING",new A.jc(),B.aB))
q($,"z2","qZ",()=>A.v("IMAGE_BUFFER_VIEW_WITH_BYTESTRIDE",new A.jf(),B.b))
q($,"z3","r_",()=>A.v("INCOMPLETE_EXTENSION_SUPPORT",new A.jg(),B.h))
q($,"z4","r0",()=>A.v("INVALID_IBM_ACCESSOR_COUNT",new A.jh(),B.b))
q($,"z8","o7",()=>A.v("MESH_PRIMITIVE_ATTRIBUTES_ACCESSOR_INVALID_FORMAT",new A.jl(),B.b))
q($,"z9","r3",()=>A.v("MESH_PRIMITIVE_ATTRIBUTES_ACCESSOR_UNSIGNED_INT",new A.jm(),B.b))
q($,"zh","o8",()=>A.v("MESH_PRIMITIVE_POSITION_ACCESSOR_WITHOUT_BOUNDS",new A.ju(),B.b))
q($,"z7","r2",()=>A.v("MESH_PRIMITIVE_ACCESSOR_WITHOUT_BYTESTRIDE",new A.jk(),B.b))
q($,"z6","o6",()=>A.v("MESH_PRIMITIVE_ACCESSOR_UNALIGNED",new A.jj(),B.b))
q($,"zd","r7",()=>A.v("MESH_PRIMITIVE_INDICES_ACCESSOR_WITH_BYTESTRIDE",new A.jq(),B.b))
q($,"zc","r6",()=>A.v("MESH_PRIMITIVE_INDICES_ACCESSOR_INVALID_FORMAT",new A.jp(),B.b))
q($,"zb","r5",()=>A.v("MESH_PRIMITIVE_INCOMPATIBLE_MODE",new A.jo(),B.e))
q($,"zi","o9",()=>A.v("MESH_PRIMITIVE_TOO_FEW_TEXCOORDS",new A.jv(),B.b))
q($,"zg","ra",()=>A.v("MESH_PRIMITIVE_NO_TANGENT_SPACE",new A.jt(),B.b))
q($,"za","r4",()=>A.v("MESH_PRIMITIVE_GENERATED_TANGENT_SPACE",new A.jn(),B.e))
q($,"zj","rb",()=>A.v("MESH_PRIMITIVE_UNEQUAL_ACCESSOR_COUNT",new A.jw(),B.b))
q($,"zf","r9",()=>A.v("MESH_PRIMITIVE_MORPH_TARGET_NO_BASE_ACCESSOR",new A.js(),B.b))
q($,"ze","r8",()=>A.v("MESH_PRIMITIVE_MORPH_TARGET_INVALID_ATTRIBUTE_COUNT",new A.jr(),B.b))
q($,"zk","rc",()=>A.v("NODE_LOOP",new A.jx(),B.b))
q($,"zl","rd",()=>A.v("NODE_PARENT_OVERRIDE",new A.jy(),B.b))
q($,"zo","rg",()=>A.v("NODE_WEIGHTS_INVALID",new A.jB(),B.b))
q($,"zm","re",()=>A.v("NODE_SKIN_WITH_NON_SKINNED_MESH",new A.jz(),B.b))
q($,"zn","rf",()=>A.v("NODE_SKINNED_MESH_WITHOUT_SKIN",new A.jA(),B.e))
q($,"zp","rh",()=>A.v("SCENE_NON_ROOT_NODE",new A.jC(),B.b))
q($,"zr","rj",()=>A.v("SKIN_IBM_INVALID_FORMAT",new A.jE(),B.b))
q($,"zq","ri",()=>A.v("SKIN_IBM_ACCESSOR_WITH_BYTESTRIDE",new A.jD(),B.b))
q($,"zs","oa",()=>A.v("TEXTURE_INVALID_IMAGE_MIME_TYPE",new A.jF(),B.b))
q($,"zt","rk",()=>A.v("UNDECLARED_EXTENSION",new A.jG(),B.b))
q($,"zu","rl",()=>A.v("UNEXPECTED_EXTENSION_OBJECT",new A.jH(),B.b))
q($,"zv","Q",()=>A.v("UNRESOLVED_REFERENCE",new A.jI(),B.b))
q($,"zw","rm",()=>A.v("UNSUPPORTED_EXTENSION",new A.jJ(),B.h))
q($,"zz","h1",()=>A.v("UNUSED_OBJECT",new A.jM(),B.h))
q($,"zy","ro",()=>A.v("UNUSED_MESH_WEIGHTS",new A.jL(),B.h))
q($,"zx","rn",()=>A.v("UNUSED_MESH_TANGENT",new A.jK(),B.h))
q($,"z5","r1",()=>A.v("KHR_MATERIALS_VARIANTS_NON_UNIQUE_VARIANT",new A.ji(),B.b))
q($,"yA","qA",()=>A.al("GLB_INVALID_MAGIC",new A.i5(),B.b))
q($,"yB","qB",()=>A.al("GLB_INVALID_VERSION",new A.i6(),B.b))
q($,"yD","qD",()=>A.al("GLB_LENGTH_TOO_SMALL",new A.i8(),B.b))
q($,"yu","qu",()=>A.al("GLB_CHUNK_LENGTH_UNALIGNED",new A.i_(),B.b))
q($,"yC","qC",()=>A.al("GLB_LENGTH_MISMATCH",new A.i7(),B.b))
q($,"yv","qv",()=>A.al("GLB_CHUNK_TOO_BIG",new A.i0(),B.b))
q($,"yy","qy",()=>A.al("GLB_EMPTY_CHUNK",new A.i3(),B.b))
q($,"yx","qx",()=>A.al("GLB_EMPTY_BIN_CHUNK",new A.i2(),B.h))
q($,"yw","qw",()=>A.al("GLB_DUPLICATE_CHUNK",new A.i1(),B.b))
q($,"yG","qG",()=>A.al("GLB_UNEXPECTED_END_OF_CHUNK_HEADER",new A.ib(),B.b))
q($,"yF","qF",()=>A.al("GLB_UNEXPECTED_END_OF_CHUNK_DATA",new A.ia(),B.b))
q($,"yH","qH",()=>A.al("GLB_UNEXPECTED_END_OF_HEADER",new A.ic(),B.b))
q($,"yI","qI",()=>A.al("GLB_UNEXPECTED_FIRST_CHUNK",new A.id(),B.b))
q($,"yE","qE",()=>A.al("GLB_UNEXPECTED_BIN_CHUNK",new A.i9(),B.b))
q($,"yJ","qJ",()=>A.al("GLB_UNKNOWN_CHUNK_TYPE",new A.ie(),B.e))
q($,"yz","qz",()=>A.al("GLB_EXTRA_DATA",new A.i4(),B.e))
q($,"yL","qK",()=>A.nx("^(?:\\/(?:[^/~]|~0|~1)*)*$"))
q($,"B9","ol",()=>A.uQ(1))
q($,"Bc","tp",()=>A.uM())
q($,"Bg","tt",()=>A.pa())
q($,"Bd","tq",()=>{var p=A.v3()
p.a[3]=1
return p})
q($,"Be","tr",()=>A.pa())})();(function nativeSupport(){!function(){var s=function(a){var m={}
m[a]=1
return Object.keys(hunkHelpers.convertToFastObject(m))[0]}
v.getIsolateTag=function(a){return s("___dart_"+a+v.isolateTag)}
var r="___dart_isolate_tags_"
var q=Object[r]||(Object[r]=Object.create(null))
var p="_ZxYxX"
for(var o=0;;o++){var n=s(p+"_"+o+"_")
if(!(n in q)){q[n]=1
v.isolateTag=n
break}}v.dispatchPropertyName=v.getIsolateTag("dispatch_record")}()
hunkHelpers.setOrUpdateInterceptorsByTag({ArrayBuffer:J.cV,DataView:A.dF,ArrayBufferView:A.dF,Float32Array:A.f8,Float64Array:A.f9,Int16Array:A.fa,Int32Array:A.fb,Int8Array:A.fc,Uint16Array:A.fd,Uint32Array:A.fe,Uint8ClampedArray:A.dG,CanvasPixelArray:A.dG,Uint8Array:A.cy})
hunkHelpers.setOrUpdateLeafTags({ArrayBuffer:true,DataView:true,ArrayBufferView:false,Float32Array:true,Float64Array:true,Int16Array:true,Int32Array:true,Int8Array:true,Uint16Array:true,Uint32Array:true,Uint8ClampedArray:true,CanvasPixelArray:true,Uint8Array:false})
A.d_.$nativeSuperclassTag="ArrayBufferView"
A.e7.$nativeSuperclassTag="ArrayBufferView"
A.e8.$nativeSuperclassTag="ArrayBufferView"
A.dE.$nativeSuperclassTag="ArrayBufferView"
A.e9.$nativeSuperclassTag="ArrayBufferView"
A.ea.$nativeSuperclassTag="ArrayBufferView"
A.aw.$nativeSuperclassTag="ArrayBufferView"})()
Function.prototype.$1=function(a){return this(a)}
Function.prototype.$0=function(){return this()}
Function.prototype.$2=function(a,b){return this(a,b)}
Function.prototype.$1$1=function(a){return this(a)}
Function.prototype.$1$0=function(){return this()}
Function.prototype.$3=function(a,b,c){return this(a,b,c)}
Function.prototype.$4=function(a,b,c,d){return this(a,b,c,d)}
Function.prototype.$1$2=function(a,b){return this(a,b)}
Function.prototype.$2$0=function(){return this()}
convertAllToFastObject(w)
convertToFastObject($);(function(a){if(typeof document==="undefined"){a(null)
return}if(typeof document.currentScript!="undefined"){a(document.currentScript)
return}var s=document.scripts
function onLoad(b){for(var q=0;q<s.length;++q)s[q].removeEventListener("load",onLoad,false)
a(b.target)}for(var r=0;r<s.length;++r)s[r].addEventListener("load",onLoad,false)})(function(a){v.currentScript=a
var s=A.xD
if(typeof dartMainRunner==="function")dartMainRunner(s,[])
else s([])})})()
}).call(this)}).call(this,require('_process'),require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/gltf-validator/gltf_validator.dart.js","/node_modules/gltf-validator")
},{"_process":4,"buffer":2,"timers":5}],8:[function(require,module,exports){
/*
 * # Copyright (c) 2016-2019 The Khronos Group Inc.
 * #
 * # Licensed under the Apache License, Version 2.0 (the "License");
 * # you may not use this file except in compliance with the License.
 * # You may obtain a copy of the License at
 * #
 * #     http://www.apache.org/licenses/LICENSE-2.0
 * #
 * # Unless required by applicable law or agreed to in writing, software
 * # distributed under the License is distributed on an "AS IS" BASIS,
 * # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * # See the License for the specific language governing permissions and
 * # limitations under the License.
 */

const validator = require('./gltf_validator.dart.js');

/**
 * Returns a version string.
 * @returns {string}
 */
exports.version = () => validator.version();

/**
 * Returns an array of supported extensions names.
 * @returns {string[]}
 */
exports.supportedExtensions = () => validator.supportedExtensions();

/**
 * Validates an asset from bytes.
 * @param {Uint8Array} data - Byte array containing glTF or GLB data.
 * @param {ValidationOptions} options - Object with validation options.
 * @returns {Promise} Promise with validation result in object form.
 */
exports.validateBytes = (data, options) => validator.validateBytes(data, options);

/**
 * Validates an asset from JSON string.
 * @param {string} json - String containing glTF JSON.
 * @param {ValidationOptions} options - Object with validation options.
 * @returns {Promise} Promise with validation result in object form.
 */
exports.validateString = (json, options) => validator.validateString(json, options);

/**
 @typedef {Object} ValidationOptions
 @property {string} uri - Absolute or relative asset URI that will be copied to validation report.
 @property {string} format - Set to `glb` or `gltf` to skip auto-detection of the asset format based on the first byte; any other value will be ignored. This option has no effect on `validateString`.
 @property {ExternalResourceFunction} externalResourceFunction - Function for loading external resources. If omitted, external resources are not validated.
 @property {boolean} writeTimestamp - Set to `false` to omit timestamp from the validation report. Default is `true`.
 @property {number} maxIssues - Max number of reported issues. Use `0` for unlimited output.
 @property {string[]} ignoredIssues - Array of ignored issue codes.
 @property {string[]} onlyIssues - Array of only issues to consider. Cannot be used along with ignoredIssues.
 @property {Object} severityOverrides - Object with overridden severities for issue codes.
 */

/**
 * @callback ExternalResourceFunction
 * @param {string} uri - Relative URI of the external resource.
 * @returns {Promise} - Promise with Uint8Array data.
 */

},{"./gltf_validator.dart.js":7}]},{},[6]);
