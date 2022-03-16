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
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
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
(function (Buffer){
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
var customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol.for === 'function')
    ? Symbol.for('nodejs.util.inspect.custom')
    : null

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
    var proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
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
  Object.setPrototypeOf(buf, Buffer.prototype)
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
    throw new TypeError(
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
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

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
  Object.setPrototypeOf(buf, Buffer.prototype)

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
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
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
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
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
    out += hexSliceLookupTable[buf[i]]
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
  Object.setPrototypeOf(newBuf, Buffer.prototype)

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
  } else if (typeof val === 'boolean') {
    val = Number(val)
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

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
var hexSliceLookupTable = (function () {
  var alphabet = '0123456789abcdef'
  var table = new Array(256)
  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16
    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
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
(function (setImmediate,clearImmediate){
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
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":4,"timers":5}],6:[function(require,module,exports){
GLTFValidator = require('gltf-validator');
},{"gltf-validator":8}],7:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,setImmediate,__filename,__dirname){
var dartNodePreambleSelf="undefined"!=typeof global?global:window,self=Object.create(dartNodePreambleSelf);if(self.scheduleImmediate="undefined"!=typeof setImmediate?function(e){setImmediate(e)}:function(e){setTimeout(e,0)},self.exports=exports,"undefined"!=typeof process)self.process=process;if("undefined"!=typeof __dirname)self.__dirname=__dirname;if("undefined"!=typeof __filename)self.__filename=__filename;if("undefined"!=typeof Buffer)self.Buffer=Buffer;var dartNodeIsActuallyNode=!dartNodePreambleSelf.window;try{if("undefined"!=typeof WorkerGlobalScope&&dartNodePreambleSelf instanceof WorkerGlobalScope)dartNodeIsActuallyNode=!1;if("undefined"!=typeof process&&process.versions&&process.versions.hasOwnProperty("electron")&&process.versions.hasOwnProperty("node"))dartNodeIsActuallyNode=!0}catch(e){}if(dartNodeIsActuallyNode){var url=("undefined"!=typeof __webpack_require__?__non_webpack_require__:require)("url");Object.defineProperty(self,"location",{value:{get href(){if(url.pathToFileURL)return url.pathToFileURL(process.cwd()).href+"/";else return"file://"+function(){var e=process.cwd();if("win32"!=process.platform)return e;else return"/"+e.replace(/\\/g,"/")}()+"/"}}}),function(){function e(){try{throw new Error}catch(n){var e=n.stack,r=new RegExp("^ *at [^(]*\\((.*):[0-9]*:[0-9]*\\)$","mg"),o=null;do{var t=r.exec(e);if(null!=t)o=t}while(null!=t);return o[1]}}var r=null;Object.defineProperty(self,"document",{value:{get currentScript(){if(null==r)r={src:e()};return r}}})}(),self.dartDeferredLibraryLoader=function(e,r,o){try{load(e),r()}catch(e){o(e)}}}(function dartProgram(){function copyProperties(a,b){var s=Object.keys(a)
for(var r=0;r<s.length;r++){var q=s[r]
b[q]=a[q]}}function mixinProperties(a,b){var s=Object.keys(a)
for(var r=0;r<s.length;r++){var q=s[r]
if(!b.hasOwnProperty(q))b[q]=a[q]}}var z=function(){var s=function(){}
s.prototype={p:{}}
var r=new s()
if(!(r.__proto__&&r.__proto__.p===s.prototype.p))return false
try{if(typeof navigator!="undefined"&&typeof navigator.userAgent=="string"&&navigator.userAgent.indexOf("Chrome/")>=0)return true
if(typeof version=="function"&&version.length==0){var q=version()
if(/^\d+\.\d+\.\d+\.\d+$/.test(q))return true}}catch(p){}return false}()
function setFunctionNamesIfNecessary(a){function t(){};if(typeof t.name=="string")return
for(var s=0;s<a.length;s++){var r=a[s]
var q=Object.keys(r)
for(var p=0;p<q.length;p++){var o=q[p]
var n=r[o]
if(typeof n=="function")n.name=o}}}function inherit(a,b){a.prototype.constructor=a
a.prototype["$i"+a.name]=a
if(b!=null){if(z){a.prototype.__proto__=b.prototype
return}var s=Object.create(b.prototype)
copyProperties(a.prototype,s)
a.prototype=s}}function inheritMany(a,b){for(var s=0;s<b.length;s++)inherit(b[s],a)}function mixin(a,b){mixinProperties(b.prototype,a.prototype)
a.prototype.constructor=a}function lazyOld(a,b,c,d){var s=a
a[b]=s
a[c]=function(){a[c]=function(){H.wO(b)}
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
if(a[b]!==s)H.wP(b)
a[b]=r}a[c]=function(){return this[b]}
return a[b]}}function makeConstList(a){a.immutable$list=Array
a.fixed$length=Array
return a}function convertToFastObject(a){function t(){}t.prototype=a
new t()
return a}function convertAllToFastObject(a){for(var s=0;s<a.length;++s)convertToFastObject(a[s])}var y=0
function tearOffGetter(a,b,c,d,e){return e?new Function("funcs","applyTrampolineIndex","reflectionInfo","name","H","c","return function tearOff_"+d+y+++"(receiver) {"+"if (c === null) c = "+"H.nm"+"("+"this, funcs, applyTrampolineIndex, reflectionInfo, false, true, name);"+"return new c(this, funcs[0], receiver, name);"+"}")(a,b,c,d,H,null):new Function("funcs","applyTrampolineIndex","reflectionInfo","name","H","c","return function tearOff_"+d+y+++"() {"+"if (c === null) c = "+"H.nm"+"("+"this, funcs, applyTrampolineIndex, reflectionInfo, false, false, name);"+"return new c(this, funcs[0], null, name);"+"}")(a,b,c,d,H,null)}function tearOff(a,b,c,d,e,f){var s=null
return d?function(){if(s===null)s=H.nm(this,a,b,c,true,false,e).prototype
return s}:tearOffGetter(a,b,c,e,f)}var x=0
function installTearOff(a,b,c,d,e,f,g,h,i,j){var s=[]
for(var r=0;r<h.length;r++){var q=h[r]
if(typeof q=="string")q=a[q]
q.$callName=g[r]
s.push(q)}var q=s[0]
q.$R=e
q.$D=f
var p=i
if(typeof p=="number")p+=x
var o=h[0]
q.$stubName=o
var n=tearOff(s,j||0,p,c,o,d)
a[b]=n
if(c)q.$tearOff=n}function installStaticTearOff(a,b,c,d,e,f,g,h){return installTearOff(a,b,true,false,c,d,e,f,g,h)}function installInstanceTearOff(a,b,c,d,e,f,g,h,i){return installTearOff(a,b,false,c,d,e,f,g,h,i)}function setOrUpdateInterceptorsByTag(a){var s=v.interceptorsByTag
if(!s){v.interceptorsByTag=a
return}copyProperties(a,s)}function setOrUpdateLeafTags(a){var s=v.leafTags
if(!s){v.leafTags=a
return}copyProperties(a,s)}function updateTypes(a){var s=v.types
var r=s.length
s.push.apply(s,a)
return r}function updateHolder(a,b){copyProperties(b,a)
return a}var hunkHelpers=function(){var s=function(a,b,c,d,e){return function(f,g,h,i){return installInstanceTearOff(f,g,a,b,c,d,[h],i,e)}},r=function(a,b,c,d){return function(e,f,g,h){return installStaticTearOff(e,f,a,b,c,[g],h,d)}}
return{inherit:inherit,inheritMany:inheritMany,mixin:mixin,installStaticTearOff:installStaticTearOff,installInstanceTearOff:installInstanceTearOff,_instance_0u:s(0,0,null,["$0"],0),_instance_1u:s(0,1,null,["$1"],0),_instance_2u:s(0,2,null,["$2"],0),_instance_0i:s(1,0,null,["$0"],0),_instance_1i:s(1,1,null,["$1"],0),_instance_2i:s(1,2,null,["$2"],0),_static_0:r(0,null,["$0"],0),_static_1:r(1,null,["$1"],0),_static_2:r(2,null,["$2"],0),makeConstList:makeConstList,lazy:lazy,lazyFinal:lazyFinal,lazyOld:lazyOld,updateHolder:updateHolder,convertToFastObject:convertToFastObject,setFunctionNamesIfNecessary:setFunctionNamesIfNecessary,updateTypes:updateTypes,setOrUpdateInterceptorsByTag:setOrUpdateInterceptorsByTag,setOrUpdateLeafTags:setOrUpdateLeafTags}}()
function initializeDeferredHunk(a){x=v.types.length
a(hunkHelpers,v,w,$)}function getGlobalFromName(a){for(var s=0;s<w.length;s++){if(w[s]==C)continue
if(w[s][a])return w[s][a]}}var C={},H={n0:function n0(){},
h7:function(a,b,c){if(b.h("o<0>").b(a))return new H.dO(a,b.h("@<0>").G(c).h("dO<1,2>"))
return new H.c0(a,b.h("@<0>").G(c).h("c0<1,2>"))},
ob:function(a){return new H.dq("Field '"+a+"' has been assigned during initialization.")},
bx:function(a){return new H.fb(a)},
mv:function(a){var s,r=a^48
if(r<=9)return r
s=a|32
if(97<=s&&s<=102)return s-87
return-1},
pz:function(a,b){var s=H.mv(C.a.A(a,b)),r=H.mv(C.a.A(a,b+1))
return s*16+r-(r&256)},
da:function(a,b,c){if(a==null)throw H.d(new H.dA(b,c.h("dA<0>")))
return a},
dG:function(a,b,c,d){P.aV(b,"start")
if(c!=null){P.aV(c,"end")
if(b>c)H.a0(P.V(b,0,c,"start",null))}return new H.dF(a,b,c,d.h("dF<0>"))},
jy:function(a,b,c,d){if(t.O.b(a))return new H.c3(a,b,c.h("@<0>").G(d).h("c3<1,2>"))
return new H.bb(a,b,c.h("@<0>").G(d).h("bb<1,2>"))},
oA:function(a,b,c){var s="count"
if(t.O.b(a)){P.h0(b,s)
P.aV(b,s)
return new H.cG(a,b,c.h("cG<0>"))}P.h0(b,s)
P.aV(b,s)
return new H.be(a,b,c.h("be<0>"))},
mZ:function(){return new P.bC("No element")},
tL:function(){return new P.bC("Too few elements")},
bH:function bH(){},
dd:function dd(a,b){this.a=a
this.$ti=b},
c0:function c0(a,b){this.a=a
this.$ti=b},
dO:function dO(a,b){this.a=a
this.$ti=b},
dJ:function dJ(){},
b3:function b3(a,b){this.a=a
this.$ti=b},
c1:function c1(a,b){this.a=a
this.$ti=b},
h8:function h8(a,b){this.a=a
this.b=b},
dq:function dq(a){this.a=a},
fb:function fb(a){this.a=a},
cE:function cE(a){this.a=a},
mN:function mN(){},
dA:function dA(a,b){this.a=a
this.$ti=b},
o:function o(){},
af:function af(){},
dF:function dF(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.$ti=d},
a9:function a9(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
bb:function bb(a,b,c){this.a=a
this.b=b
this.$ti=c},
c3:function c3(a,b,c){this.a=a
this.b=b
this.$ti=c},
dv:function dv(a,b,c){var _=this
_.a=null
_.b=a
_.c=b
_.$ti=c},
aa:function aa(a,b,c){this.a=a
this.b=b
this.$ti=c},
ln:function ln(a,b,c){this.a=a
this.b=b
this.$ti=c},
cv:function cv(a,b,c){this.a=a
this.b=b
this.$ti=c},
be:function be(a,b,c){this.a=a
this.b=b
this.$ti=c},
cG:function cG(a,b,c){this.a=a
this.b=b
this.$ti=c},
dD:function dD(a,b,c){this.a=a
this.b=b
this.$ti=c},
b6:function b6(a){this.$ti=a},
dg:function dg(a){this.$ti=a},
di:function di(){},
fn:function fn(){},
cU:function cU(){},
cS:function cS(a){this.a=a},
eg:function eg(){},
tx:function(){throw H.d(P.ac("Cannot modify unmodifiable Map"))},
pH:function(a){var s,r=H.pG(a)
if(r!=null)return r
s="minified:"+a
return s},
pw:function(a,b){var s
if(b!=null){s=b.x
if(s!=null)return s}return t.aU.b(a)},
b:function(a){var s
if(typeof a=="string")return a
if(typeof a=="number"){if(a!==0)return""+a}else if(!0===a)return"true"
else if(!1===a)return"false"
else if(a==null)return"null"
s=J.ah(a)
if(typeof s!="string")throw H.d(H.bQ(a))
return s},
cr:function(a){var s=a.$identityHash
if(s==null){s=Math.random()*0x3fffffff|0
a.$identityHash=s}return s},
ow:function(a,b){var s,r,q,p,o,n,m=null
if(typeof a!="string")H.a0(H.bQ(a))
s=/^\s*[+-]?((0x[a-f0-9]+)|(\d+)|([a-z0-9]+))\s*$/i.exec(a)
if(s==null)return m
r=s[3]
if(b==null){if(r!=null)return parseInt(a,10)
if(s[2]!=null)return parseInt(a,16)
return m}if(b<2||b>36)throw H.d(P.V(b,2,36,"radix",m))
if(b===10&&r!=null)return parseInt(a,10)
if(b<10||r==null){q=b<=10?47+b:86+b
p=s[1]
for(o=p.length,n=0;n<o;++n)if((C.a.I(p,n)|32)>q)return m}return parseInt(a,b)},
jS:function(a){return H.uh(a)},
uh:function(a){var s,r,q
if(a instanceof P.e)return H.ay(H.ae(a),null)
if(J.cz(a)===C.bI||t.ak.b(a)){s=C.a1(a)
if(H.op(s))return s
r=a.constructor
if(typeof r=="function"){q=r.name
if(typeof q=="string"&&H.op(q))return q}}return H.ay(H.ae(a),null)},
op:function(a){var s=a!=="Object"&&a!==""
return s},
oo:function(a){var s,r,q,p,o=a.length
if(o<=500)return String.fromCharCode.apply(null,a)
for(s="",r=0;r<o;r=q){q=r+500
p=q<o?q:o
s+=String.fromCharCode.apply(null,a.slice(r,p))}return s},
uk:function(a){var s,r,q,p=H.a([],t.Z)
for(s=a.length,r=0;r<a.length;a.length===s||(0,H.cB)(a),++r){q=a[r]
if(!H.aO(q))throw H.d(H.bQ(q))
if(q<=65535)p.push(q)
else if(q<=1114111){p.push(55296+(C.c.ae(q-65536,10)&1023))
p.push(56320+(q&1023))}else throw H.d(H.bQ(q))}return H.oo(p)},
uj:function(a){var s,r,q
for(s=a.length,r=0;r<s;++r){q=a[r]
if(!H.aO(q))throw H.d(H.bQ(q))
if(q<0)throw H.d(H.bQ(q))
if(q>65535)return H.uk(a)}return H.oo(a)},
ul:function(a,b,c){var s,r,q,p
if(c<=500&&b===0&&c===a.length)return String.fromCharCode.apply(null,a)
for(s=b,r="";s<c;s=q){q=s+500
p=q<c?q:c
r+=String.fromCharCode.apply(null,a.subarray(s,p))}return r},
bc:function(a){var s
if(0<=a){if(a<=65535)return String.fromCharCode(a)
if(a<=1114111){s=a-65536
return String.fromCharCode((C.c.ae(s,10)|55296)>>>0,s&1023|56320)}}throw H.d(P.V(a,0,1114111,null,null))},
av:function(a){if(a.date===void 0)a.date=new Date(a.a)
return a.date},
f9:function(a){return a.b?H.av(a).getUTCFullYear()+0:H.av(a).getFullYear()+0},
ou:function(a){return a.b?H.av(a).getUTCMonth()+1:H.av(a).getMonth()+1},
oq:function(a){return a.b?H.av(a).getUTCDate()+0:H.av(a).getDate()+0},
or:function(a){return a.b?H.av(a).getUTCHours()+0:H.av(a).getHours()+0},
ot:function(a){return a.b?H.av(a).getUTCMinutes()+0:H.av(a).getMinutes()+0},
ov:function(a){return a.b?H.av(a).getUTCSeconds()+0:H.av(a).getSeconds()+0},
os:function(a){return a.b?H.av(a).getUTCMilliseconds()+0:H.av(a).getMilliseconds()+0},
bw:function(a,b,c){var s,r,q={}
q.a=0
s=[]
r=[]
q.a=b.length
C.d.H(s,b)
q.b=""
if(c!=null&&c.a!==0)c.K(0,new H.jR(q,r,s))
""+q.a
return J.t2(a,new H.iz(C.dr,0,s,r,0))},
ui:function(a,b,c){var s,r,q,p
if(b instanceof Array)s=c==null||c.a===0
else s=!1
if(s){r=b
q=r.length
if(q===0){if(!!a.$0)return a.$0()}else if(q===1){if(!!a.$1)return a.$1(r[0])}else if(q===2){if(!!a.$2)return a.$2(r[0],r[1])}else if(q===3){if(!!a.$3)return a.$3(r[0],r[1],r[2])}else if(q===4){if(!!a.$4)return a.$4(r[0],r[1],r[2],r[3])}else if(q===5)if(!!a.$5)return a.$5(r[0],r[1],r[2],r[3],r[4])
p=a[""+"$"+q]
if(p!=null)return p.apply(a,r)}return H.ug(a,b,c)},
ug:function(a,b,c){var s,r,q,p,o,n,m,l,k,j,i,h,g
if(b!=null)s=b instanceof Array?b:P.oe(b,t.z)
else s=[]
r=s.length
q=a.$R
if(r<q)return H.bw(a,s,c)
p=a.$D
o=p==null
n=!o?p():null
m=J.cz(a)
l=m.$C
if(typeof l=="string")l=m[l]
if(o){if(c!=null&&c.a!==0)return H.bw(a,s,c)
if(r===q)return l.apply(a,s)
return H.bw(a,s,c)}if(n instanceof Array){if(c!=null&&c.a!==0)return H.bw(a,s,c)
if(r>q+n.length)return H.bw(a,s,null)
C.d.H(s,n.slice(r-q))
return l.apply(a,s)}else{if(r>q)return H.bw(a,s,c)
k=Object.keys(n)
if(c==null)for(o=k.length,j=0;j<k.length;k.length===o||(0,H.cB)(k),++j){i=n[k[j]]
if(C.a6===i)return H.bw(a,s,c)
C.d.B(s,i)}else{for(o=k.length,h=0,j=0;j<k.length;k.length===o||(0,H.cB)(k),++j){g=k[j]
if(c.w(g)){++h
C.d.B(s,c.j(0,g))}else{i=n[g]
if(C.a6===i)return H.bw(a,s,c)
C.d.B(s,i)}}if(h!==c.a)return H.bw(a,s,c)}return l.apply(a,s)}},
et:function(a,b){var s,r="index"
if(!H.aO(b))return new P.ao(!0,b,r,null)
s=J.Z(a)
if(b<0||b>=s)return P.eM(b,a,r,null,s)
return P.jT(b,r)},
w7:function(a,b,c){if(a<0||a>c)return P.V(a,0,c,"start",null)
if(b!=null)if(b<a||b>c)return P.V(b,a,c,"end",null)
return new P.ao(!0,b,"end",null)},
bQ:function(a){return new P.ao(!0,a,null,null)},
d:function(a){var s,r
if(a==null)a=new P.f5()
s=new Error()
s.dartException=a
r=H.wQ
if("defineProperty" in Object){Object.defineProperty(s,"message",{get:r})
s.name=""}else s.toString=r
return s},
wQ:function(){return J.ah(this.dartException)},
a0:function(a){throw H.d(a)},
cB:function(a){throw H.d(P.a6(a))},
bf:function(a){var s,r,q,p,o,n
a=H.pC(a.replace(String({}),"$receiver$"))
s=a.match(/\\\$[a-zA-Z]+\\\$/g)
if(s==null)s=H.a([],t.s)
r=s.indexOf("\\$arguments\\$")
q=s.indexOf("\\$argumentsExpr\\$")
p=s.indexOf("\\$expr\\$")
o=s.indexOf("\\$method\\$")
n=s.indexOf("\\$receiver\\$")
return new H.l6(a.replace(new RegExp("\\\\\\$arguments\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$argumentsExpr\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$expr\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$method\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$receiver\\\\\\$","g"),"((?:x|[^x])*)"),r,q,p,o,n)},
l7:function(a){return function($expr$){var $argumentsExpr$="$arguments$"
try{$expr$.$method$($argumentsExpr$)}catch(s){return s.message}}(a)},
oD:function(a){return function($expr$){try{$expr$.$method$}catch(s){return s.message}}(a)},
on:function(a,b){return new H.f4(a,b==null?null:b.method)},
n1:function(a,b){var s=b==null,r=s?null:b.method
return new H.eQ(a,r,s?null:b.receiver)},
G:function(a){if(a==null)return new H.f6(a)
if(a instanceof H.dh)return H.bR(a,a.a)
if(typeof a!=="object")return a
if("dartException" in a)return H.bR(a,a.dartException)
return H.vP(a)},
bR:function(a,b){if(t.C.b(b))if(b.$thrownJsError==null)b.$thrownJsError=a
return b},
vP:function(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=null
if(!("message" in a))return a
s=a.message
if("number" in a&&typeof a.number=="number"){r=a.number
q=r&65535
if((C.c.ae(r,16)&8191)===10)switch(q){case 438:return H.bR(a,H.n1(H.b(s)+" (Error "+q+")",e))
case 445:case 5007:return H.bR(a,H.on(H.b(s)+" (Error "+q+")",e))}}if(a instanceof TypeError){p=$.rE()
o=$.rF()
n=$.rG()
m=$.rH()
l=$.rK()
k=$.rL()
j=$.rJ()
$.rI()
i=$.rN()
h=$.rM()
g=p.a7(s)
if(g!=null)return H.bR(a,H.n1(s,g))
else{g=o.a7(s)
if(g!=null){g.method="call"
return H.bR(a,H.n1(s,g))}else{g=n.a7(s)
if(g==null){g=m.a7(s)
if(g==null){g=l.a7(s)
if(g==null){g=k.a7(s)
if(g==null){g=j.a7(s)
if(g==null){g=m.a7(s)
if(g==null){g=i.a7(s)
if(g==null){g=h.a7(s)
f=g!=null}else f=!0}else f=!0}else f=!0}else f=!0}else f=!0}else f=!0}else f=!0
if(f)return H.bR(a,H.on(s,g))}}return H.bR(a,new H.fm(typeof s=="string"?s:""))}if(a instanceof RangeError){if(typeof s=="string"&&s.indexOf("call stack")!==-1)return new P.dE()
s=function(b){try{return String(b)}catch(d){}return null}(a)
return H.bR(a,new P.ao(!1,e,e,typeof s=="string"?s.replace(/^RangeError:\s*/,""):s))}if(typeof InternalError=="function"&&a instanceof InternalError)if(typeof s=="string"&&s==="too much recursion")return new P.dE()
return a},
aD:function(a){var s
if(a instanceof H.dh)return a.b
if(a==null)return new H.e3(a)
s=a.$cachedTrace
if(s!=null)return s
return a.$cachedTrace=new H.e3(a)},
py:function(a){if(a==null||typeof a!="object")return J.aF(a)
else return H.cr(a)},
po:function(a,b){var s,r,q,p=a.length
for(s=0;s<p;s=q){r=s+1
q=r+1
b.m(0,a[s],a[r])}return b},
wb:function(a,b){var s,r=a.length
for(s=0;s<r;++s)b.B(0,a[s])
return b},
wl:function(a,b,c,d,e,f){switch(b){case 0:return a.$0()
case 1:return a.$1(c)
case 2:return a.$2(c,d)
case 3:return a.$3(c,d,e)
case 4:return a.$4(c,d,e,f)}throw H.d(P.tC("Unsupported number of arguments for wrapped closure"))},
mm:function(a,b){var s
if(a==null)return null
s=a.$identity
if(!!s)return s
s=function(c,d,e){return function(f,g,h,i){return e(c,d,f,g,h,i)}}(a,b,H.wl)
a.$identity=s
return s},
tw:function(a,b,c,d,e,f,g){var s,r,q,p,o,n,m,l=b[0],k=l.$callName,j=e?Object.create(new H.ff().constructor.prototype):Object.create(new H.cD(null,null,null,"").constructor.prototype)
j.$initialize=j.constructor
if(e)s=function static_tear_off(){this.$initialize()}
else{r=$.b4
$.b4=r+1
r=new Function("a,b,c,d"+r,"this.$initialize(a,b,c,d"+r+")")
s=r}j.constructor=s
s.prototype=j
if(!e){q=H.o3(a,l,f)
q.$reflectionInfo=d}else{j.$static_name=g
q=l}j.$S=H.ts(d,e,f)
j[k]=q
for(p=q,o=1;o<b.length;++o){n=b[o]
m=n.$callName
if(m!=null){n=e?n:H.o3(a,n,f)
j[m]=n}if(o===c){n.$reflectionInfo=d
p=n}}j.$C=p
j.$R=l.$R
j.$D=l.$D
return s},
ts:function(a,b,c){var s
if(typeof a=="number")return function(d,e){return function(){return d(e)}}(H.pt,a)
if(typeof a=="string"){if(b)throw H.d("Cannot compute signature for static tearoff.")
s=c?H.tl:H.tk
return function(d,e){return function(){return e(this,d)}}(a,s)}throw H.d("Error in functionType of tearoff")},
tt:function(a,b,c,d){var s=H.o2
switch(b?-1:a){case 0:return function(e,f){return function(){return f(this)[e]()}}(c,s)
case 1:return function(e,f){return function(g){return f(this)[e](g)}}(c,s)
case 2:return function(e,f){return function(g,h){return f(this)[e](g,h)}}(c,s)
case 3:return function(e,f){return function(g,h,i){return f(this)[e](g,h,i)}}(c,s)
case 4:return function(e,f){return function(g,h,i,j){return f(this)[e](g,h,i,j)}}(c,s)
case 5:return function(e,f){return function(g,h,i,j,k){return f(this)[e](g,h,i,j,k)}}(c,s)
default:return function(e,f){return function(){return e.apply(f(this),arguments)}}(d,s)}},
o3:function(a,b,c){var s,r,q,p,o,n,m
if(c)return H.tv(a,b)
s=b.$stubName
r=b.length
q=a[s]
p=b==null?q==null:b===q
o=!p||r>=27
if(o)return H.tt(r,!p,s,b)
if(r===0){p=$.b4
$.b4=p+1
n="self"+H.b(p)
return new Function("return function(){var "+n+" = this."+H.b(H.mY())+";return "+n+"."+H.b(s)+"();}")()}m="abcdefghijklmnopqrstuvwxyz".split("").splice(0,r).join(",")
p=$.b4
$.b4=p+1
m+=H.b(p)
return new Function("return function("+m+"){return this."+H.b(H.mY())+"."+H.b(s)+"("+m+");}")()},
tu:function(a,b,c,d){var s=H.o2,r=H.tm
switch(b?-1:a){case 0:throw H.d(new H.fe("Intercepted function with no arguments."))
case 1:return function(e,f,g){return function(){return f(this)[e](g(this))}}(c,s,r)
case 2:return function(e,f,g){return function(h){return f(this)[e](g(this),h)}}(c,s,r)
case 3:return function(e,f,g){return function(h,i){return f(this)[e](g(this),h,i)}}(c,s,r)
case 4:return function(e,f,g){return function(h,i,j){return f(this)[e](g(this),h,i,j)}}(c,s,r)
case 5:return function(e,f,g){return function(h,i,j,k){return f(this)[e](g(this),h,i,j,k)}}(c,s,r)
case 6:return function(e,f,g){return function(h,i,j,k,l){return f(this)[e](g(this),h,i,j,k,l)}}(c,s,r)
default:return function(e,f,g,h){return function(){h=[g(this)]
Array.prototype.push.apply(h,arguments)
return e.apply(f(this),h)}}(d,s,r)}},
tv:function(a,b){var s,r,q,p,o,n,m=H.mY(),l=$.o0
if(l==null)l=$.o0=H.o_("receiver")
s=b.$stubName
r=b.length
q=a[s]
p=b==null?q==null:b===q
o=!p||r>=28
if(o)return H.tu(r,!p,s,b)
if(r===1){p="return function(){return this."+H.b(m)+"."+H.b(s)+"(this."+l+");"
o=$.b4
$.b4=o+1
return new Function(p+H.b(o)+"}")()}n="abcdefghijklmnopqrstuvwxyz".split("").splice(0,r-1).join(",")
p="return function("+n+"){return this."+H.b(m)+"."+H.b(s)+"(this."+l+", "+n+");"
o=$.b4
$.b4=o+1
return new Function(p+H.b(o)+"}")()},
nm:function(a,b,c,d,e,f,g){return H.tw(a,b,c,d,!!e,!!f,g)},
tk:function(a,b){return H.fM(v.typeUniverse,H.ae(a.a),b)},
tl:function(a,b){return H.fM(v.typeUniverse,H.ae(a.c),b)},
o2:function(a){return a.a},
tm:function(a){return a.c},
mY:function(){var s=$.o1
return s==null?$.o1=H.o_("self"):s},
o_:function(a){var s,r,q,p=new H.cD("self","target","receiver","name"),o=J.n_(Object.getOwnPropertyNames(p))
for(s=o.length,r=0;r<s;++r){q=o[r]
if(p[q]===a)return q}throw H.d(P.T("Field name "+a+" not found."))},
wO:function(a){throw H.d(new P.eG(a))},
wg:function(a){return v.getIsolateTag(a)},
wP:function(a){return H.a0(new H.dq(a))},
A_:function(a,b,c){Object.defineProperty(a,b,{value:c,enumerable:false,writable:true,configurable:true})},
wB:function(a){var s,r,q,p,o,n=$.ps.$1(a),m=$.mn[n]
if(m!=null){Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}s=$.mz[n]
if(s!=null)return s
r=v.interceptorsByTag[n]
if(r==null){q=$.pk.$2(a,n)
if(q!=null){m=$.mn[q]
if(m!=null){Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}s=$.mz[q]
if(s!=null)return s
r=v.interceptorsByTag[q]
n=q}}if(r==null)return null
s=r.prototype
p=n[0]
if(p==="!"){m=H.mM(s)
$.mn[n]=m
Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}if(p==="~"){$.mz[n]=s
return s}if(p==="-"){o=H.mM(s)
Object.defineProperty(Object.getPrototypeOf(a),v.dispatchPropertyName,{value:o,enumerable:false,writable:true,configurable:true})
return o.i}if(p==="+")return H.pA(a,s)
if(p==="*")throw H.d(P.oE(n))
if(v.leafTags[n]===true){o=H.mM(s)
Object.defineProperty(Object.getPrototypeOf(a),v.dispatchPropertyName,{value:o,enumerable:false,writable:true,configurable:true})
return o.i}else return H.pA(a,s)},
pA:function(a,b){var s=Object.getPrototypeOf(a)
Object.defineProperty(s,v.dispatchPropertyName,{value:J.nr(b,s,null,null),enumerable:false,writable:true,configurable:true})
return b},
mM:function(a){return J.nr(a,!1,null,!!a.$ias)},
wD:function(a,b,c){var s=b.prototype
if(v.leafTags[a]===true)return H.mM(s)
else return J.nr(s,c,null,null)},
wj:function(){if(!0===$.np)return
$.np=!0
H.wk()},
wk:function(){var s,r,q,p,o,n,m,l
$.mn=Object.create(null)
$.mz=Object.create(null)
H.wi()
s=v.interceptorsByTag
r=Object.getOwnPropertyNames(s)
if(typeof window!="undefined"){window
q=function(){}
for(p=0;p<r.length;++p){o=r[p]
n=$.pB.$1(o)
if(n!=null){m=H.wD(o,s[o],n)
if(m!=null){Object.defineProperty(n,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
q.prototype=n}}}}for(p=0;p<r.length;++p){o=r[p]
if(/^[A-Za-z_]/.test(o)){l=s[o]
s["!"+o]=l
s["~"+o]=l
s["-"+o]=l
s["+"+o]=l
s["*"+o]=l}}},
wi:function(){var s,r,q,p,o,n,m=C.b9()
m=H.d9(C.ba,H.d9(C.bb,H.d9(C.a2,H.d9(C.a2,H.d9(C.bc,H.d9(C.bd,H.d9(C.be(C.a1),m)))))))
if(typeof dartNativeDispatchHooksTransformer!="undefined"){s=dartNativeDispatchHooksTransformer
if(typeof s=="function")s=[s]
if(s.constructor==Array)for(r=0;r<s.length;++r){q=s[r]
if(typeof q=="function")m=q(m)||m}}p=m.getTag
o=m.getUnknownTag
n=m.prototypeForTag
$.ps=new H.mw(p)
$.pk=new H.mx(o)
$.pB=new H.my(n)},
d9:function(a,b){return a(b)||b},
tN:function(a,b,c,d,e,f){var s=b?"m":"",r=c?"":"i",q=d?"u":"",p=e?"s":"",o=f?"g":"",n=function(g,h){try{return new RegExp(g,h)}catch(m){return m}}(a,s+r+q+p+o)
if(n instanceof RegExp)return n
throw H.d(P.M("Illegal RegExp pattern ("+String(n)+")",a,null))},
w8:function(a){if(a.indexOf("$",0)>=0)return a.replace(/\$/g,"$$$$")
return a},
pC:function(a){if(/[[\]{}()*+?.\\^$|]/.test(a))return a.replace(/[[\]{}()*+?.\\^$|]/g,"\\$&")
return a},
pE:function(a,b,c){var s=H.wM(a,b,c)
return s},
wM:function(a,b,c){var s,r,q,p
if(b===""){if(a==="")return c
s=a.length
for(r=c,q=0;q<s;++q)r=r+a[q]+c
return r.charCodeAt(0)==0?r:r}p=a.indexOf(b,0)
if(p<0)return a
if(a.length<500||c.indexOf("$",0)>=0)return a.split(b).join(c)
return a.replace(new RegExp(H.pC(b),'g'),H.w8(c))},
de:function de(a,b){this.a=a
this.$ti=b},
cF:function cF(){},
ap:function ap(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.$ti=d},
dL:function dL(a,b){this.a=a
this.$ti=b},
a4:function a4(a,b){this.a=a
this.$ti=b},
iz:function iz(a,b,c,d,e){var _=this
_.a=a
_.c=b
_.d=c
_.e=d
_.f=e},
jR:function jR(a,b,c){this.a=a
this.b=b
this.c=c},
l6:function l6(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f},
f4:function f4(a,b){this.a=a
this.b=b},
eQ:function eQ(a,b,c){this.a=a
this.b=b
this.c=c},
fm:function fm(a){this.a=a},
f6:function f6(a){this.a=a},
dh:function dh(a,b){this.a=a
this.b=b},
e3:function e3(a){this.a=a
this.b=null},
c2:function c2(){},
fh:function fh(){},
ff:function ff(){},
cD:function cD(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
fe:function fe(a){this.a=a},
lX:function lX(){},
aK:function aK(a){var _=this
_.a=0
_.f=_.e=_.d=_.c=_.b=null
_.r=0
_.$ti=a},
iF:function iF(a){this.a=a},
jv:function jv(a,b){this.a=a
this.b=b
this.c=null},
at:function at(a,b){this.a=a
this.$ti=b},
dr:function dr(a,b,c){var _=this
_.a=a
_.b=b
_.d=_.c=null
_.$ti=c},
mw:function mw(a){this.a=a},
mx:function mx(a){this.a=a},
my:function my(a){this.a=a},
iA:function iA(a,b){var _=this
_.a=a
_.b=b
_.d=_.c=null},
lV:function lV(a){this.b=a},
d5:function(a,b,c){},
vk:function(a){return a},
jK:function(a,b,c){var s
H.d5(a,b,c)
s=new DataView(a,b)
return s},
u9:function(a){return new Float32Array(a)},
ua:function(a){return new Int8Array(a)},
ok:function(a,b,c){var s
H.d5(a,b,c)
s=new Uint16Array(a,b,c)
return s},
ol:function(a,b,c){var s
H.d5(a,b,c)
s=new Uint32Array(a,b,c)
return s},
ub:function(a){return new Uint8Array(a)},
n4:function(a,b,c){var s
H.d5(a,b,c)
s=new Uint8Array(a,b,c)
return s},
bh:function(a,b,c){if(a>>>0!==a||a>=c)throw H.d(H.et(b,a))},
bN:function(a,b,c){var s
if(!(a>>>0!==a))s=b>>>0!==b||a>b||b>c
else s=!0
if(s)throw H.d(H.w7(a,b,c))
return b},
dy:function dy(){},
cP:function cP(){},
dx:function dx(){},
au:function au(){},
dw:function dw(){},
eX:function eX(){},
eY:function eY(){},
eZ:function eZ(){},
f_:function f_(){},
f0:function f0(){},
f1:function f1(){},
dz:function dz(){},
cn:function cn(){},
e_:function e_(){},
e0:function e0(){},
e1:function e1(){},
e2:function e2(){},
uo:function(a,b){var s=b.c
return s==null?b.c=H.nd(a,b.z,!0):s},
oy:function(a,b){var s=b.c
return s==null?b.c=H.ea(a,"a3",[b.z]):s},
oz:function(a){var s=a.y
if(s===6||s===7||s===8)return H.oz(a.z)
return s===11||s===12},
un:function(a){return a.cy},
az:function(a){return H.fL(v.typeUniverse,a,!1)},
bP:function(a,b,a0,a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=b.y
switch(c){case 5:case 1:case 2:case 3:case 4:return b
case 6:s=b.z
r=H.bP(a,s,a0,a1)
if(r===s)return b
return H.oY(a,r,!0)
case 7:s=b.z
r=H.bP(a,s,a0,a1)
if(r===s)return b
return H.nd(a,r,!0)
case 8:s=b.z
r=H.bP(a,s,a0,a1)
if(r===s)return b
return H.oX(a,r,!0)
case 9:q=b.Q
p=H.er(a,q,a0,a1)
if(p===q)return b
return H.ea(a,b.z,p)
case 10:o=b.z
n=H.bP(a,o,a0,a1)
m=b.Q
l=H.er(a,m,a0,a1)
if(n===o&&l===m)return b
return H.nb(a,n,l)
case 11:k=b.z
j=H.bP(a,k,a0,a1)
i=b.Q
h=H.vM(a,i,a0,a1)
if(j===k&&h===i)return b
return H.oW(a,j,h)
case 12:g=b.Q
a1+=g.length
f=H.er(a,g,a0,a1)
o=b.z
n=H.bP(a,o,a0,a1)
if(f===g&&n===o)return b
return H.nc(a,n,f,!0)
case 13:e=b.z
if(e<a1)return b
d=a0[e-a1]
if(d==null)return b
return d
default:throw H.d(P.h1("Attempted to substitute unexpected RTI kind "+c))}},
er:function(a,b,c,d){var s,r,q,p,o=b.length,n=[]
for(s=!1,r=0;r<o;++r){q=b[r]
p=H.bP(a,q,c,d)
if(p!==q)s=!0
n.push(p)}return s?n:b},
vN:function(a,b,c,d){var s,r,q,p,o,n,m=b.length,l=[]
for(s=!1,r=0;r<m;r+=3){q=b[r]
p=b[r+1]
o=b[r+2]
n=H.bP(a,o,c,d)
if(n!==o)s=!0
l.push(q)
l.push(p)
l.push(n)}return s?l:b},
vM:function(a,b,c,d){var s,r=b.a,q=H.er(a,r,c,d),p=b.b,o=H.er(a,p,c,d),n=b.c,m=H.vN(a,n,c,d)
if(q===r&&o===p&&m===n)return b
s=new H.fA()
s.a=q
s.b=o
s.c=m
return s},
a:function(a,b){a[v.arrayRti]=b
return a},
w5:function(a){var s=a.$S
if(s!=null){if(typeof s=="number")return H.pt(s)
return a.$S()}return null},
pv:function(a,b){var s
if(H.oz(b))if(a instanceof H.c2){s=H.w5(a)
if(s!=null)return s}return H.ae(a)},
ae:function(a){var s
if(a instanceof P.e){s=a.$ti
return s!=null?s:H.ng(a)}if(Array.isArray(a))return H.X(a)
return H.ng(J.cz(a))},
X:function(a){var s=a[v.arrayRti],r=t.b
if(s==null)return r
if(s.constructor!==r.constructor)return r
return s},
A:function(a){var s=a.$ti
return s!=null?s:H.ng(a)},
ng:function(a){var s=a.constructor,r=s.$ccache
if(r!=null)return r
return H.vu(a,s)},
vu:function(a,b){var s=a instanceof H.c2?a.__proto__.__proto__.constructor:b,r=H.uV(v.typeUniverse,s.name)
b.$ccache=r
return r},
pt:function(a){var s,r=v.types,q=r[a]
if(typeof q=="string"){s=H.fL(v.typeUniverse,q,!1)
r[a]=s
return s}return q},
pm:function(a){var s,r,q,p=a.x
if(p!=null)return p
s=a.cy
r=s.replace(/\*/g,"")
if(r===s)return a.x=new H.e8(a)
q=H.fL(v.typeUniverse,r,!0)
p=q.x
return a.x=p==null?q.x=new H.e8(q):p},
u:function(a){return H.pm(H.fL(v.typeUniverse,a,!1))},
vt:function(a){var s,r,q=this,p=t.K
if(q===p)return H.em(q,a,H.vx)
if(!H.bk(q))if(!(q===t._))p=q===p
else p=!0
else p=!0
if(p)return H.em(q,a,H.vA)
p=q.y
s=p===6?q.z:q
if(s===t.S)r=H.aO
else if(s===t.gR||s===t.di)r=H.vw
else if(s===t.R)r=H.vy
else r=s===t.y?H.en:null
if(r!=null)return H.em(q,a,r)
if(s.y===9){p=s.z
if(s.Q.every(H.wm)){q.r="$i"+p
return H.em(q,a,H.vz)}}else if(p===7)return H.em(q,a,H.vn)
return H.em(q,a,H.vl)},
em:function(a,b,c){a.b=c
return a.b(b)},
vs:function(a){var s,r,q=this
if(!H.bk(q))if(!(q===t._))s=q===t.K
else s=!0
else s=!0
if(s)r=H.ve
else if(q===t.K)r=H.vd
else r=H.vm
q.a=r
return q.a(a)},
nj:function(a){var s,r=a.y
if(!H.bk(a))if(!(a===t._))if(!(a===t.A))if(r!==7)s=r===8&&H.nj(a.z)||a===t.P||a===t.T
else s=!0
else s=!0
else s=!0
else s=!0
return s},
vl:function(a){var s=this
if(a==null)return H.nj(s)
return H.a5(v.typeUniverse,H.pv(a,s),null,s,null)},
vn:function(a){if(a==null)return!0
return this.z.b(a)},
vz:function(a){var s,r=this
if(a==null)return H.nj(r)
s=r.r
if(a instanceof P.e)return!!a[s]
return!!J.cz(a)[s]},
zU:function(a){var s=this
if(a==null)return a
else if(s.b(a))return a
H.p8(a,s)},
vm:function(a){var s=this
if(a==null)return a
else if(s.b(a))return a
H.p8(a,s)},
p8:function(a,b){throw H.d(H.uL(H.oP(a,H.pv(a,b),H.ay(b,null))))},
oP:function(a,b,c){var s=P.cH(a),r=H.ay(b==null?H.ae(a):b,null)
return s+": type '"+H.b(r)+"' is not a subtype of type '"+H.b(c)+"'"},
uL:function(a){return new H.e9("TypeError: "+a)},
am:function(a,b){return new H.e9("TypeError: "+H.oP(a,null,b))},
vx:function(a){return a!=null},
vd:function(a){return a},
vA:function(a){return!0},
ve:function(a){return a},
en:function(a){return!0===a||!1===a},
zE:function(a){if(!0===a)return!0
if(!1===a)return!1
throw H.d(H.am(a,"bool"))},
zG:function(a){if(!0===a)return!0
if(!1===a)return!1
if(a==null)return a
throw H.d(H.am(a,"bool"))},
zF:function(a){if(!0===a)return!0
if(!1===a)return!1
if(a==null)return a
throw H.d(H.am(a,"bool?"))},
zH:function(a){if(typeof a=="number")return a
throw H.d(H.am(a,"double"))},
zJ:function(a){if(typeof a=="number")return a
if(a==null)return a
throw H.d(H.am(a,"double"))},
zI:function(a){if(typeof a=="number")return a
if(a==null)return a
throw H.d(H.am(a,"double?"))},
aO:function(a){return typeof a=="number"&&Math.floor(a)===a},
zK:function(a){if(typeof a=="number"&&Math.floor(a)===a)return a
throw H.d(H.am(a,"int"))},
zM:function(a){if(typeof a=="number"&&Math.floor(a)===a)return a
if(a==null)return a
throw H.d(H.am(a,"int"))},
zL:function(a){if(typeof a=="number"&&Math.floor(a)===a)return a
if(a==null)return a
throw H.d(H.am(a,"int?"))},
vw:function(a){return typeof a=="number"},
zN:function(a){if(typeof a=="number")return a
throw H.d(H.am(a,"num"))},
zP:function(a){if(typeof a=="number")return a
if(a==null)return a
throw H.d(H.am(a,"num"))},
zO:function(a){if(typeof a=="number")return a
if(a==null)return a
throw H.d(H.am(a,"num?"))},
vy:function(a){return typeof a=="string"},
zQ:function(a){if(typeof a=="string")return a
throw H.d(H.am(a,"String"))},
zS:function(a){if(typeof a=="string")return a
if(a==null)return a
throw H.d(H.am(a,"String"))},
zR:function(a){if(typeof a=="string")return a
if(a==null)return a
throw H.d(H.am(a,"String?"))},
vI:function(a,b){var s,r,q
for(s="",r="",q=0;q<a.length;++q,r=", ")s+=C.a.ai(r,H.ay(a[q],b))
return s},
pa:function(a4,a5,a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3=", "
if(a6!=null){s=a6.length
if(a5==null){a5=H.a([],t.s)
r=null}else r=a5.length
q=a5.length
for(p=s;p>0;--p)a5.push("T"+(q+p))
for(o=t.cK,n=t._,m=t.K,l="<",k="",p=0;p<s;++p,k=a3){l=C.a.ai(l+k,a5[a5.length-1-p])
j=a6[p]
i=j.y
if(!(i===2||i===3||i===4||i===5||j===o))if(!(j===n))h=j===m
else h=!0
else h=!0
if(!h)l+=C.a.ai(" extends ",H.ay(j,a5))}l+=">"}else{l=""
r=null}o=a4.z
g=a4.Q
f=g.a
e=f.length
d=g.b
c=d.length
b=g.c
a=b.length
a0=H.ay(o,a5)
for(a1="",a2="",p=0;p<e;++p,a2=a3)a1+=C.a.ai(a2,H.ay(f[p],a5))
if(c>0){a1+=a2+"["
for(a2="",p=0;p<c;++p,a2=a3)a1+=C.a.ai(a2,H.ay(d[p],a5))
a1+="]"}if(a>0){a1+=a2+"{"
for(a2="",p=0;p<a;p+=3,a2=a3){a1+=a2
if(b[p+1])a1+="required "
a1+=J.nR(H.ay(b[p+2],a5)," ")+b[p]}a1+="}"}if(r!=null){a5.toString
a5.length=r}return l+"("+a1+") => "+H.b(a0)},
ay:function(a,b){var s,r,q,p,o,n,m=a.y
if(m===5)return"erased"
if(m===2)return"dynamic"
if(m===3)return"void"
if(m===1)return"Never"
if(m===4)return"any"
if(m===6){s=H.ay(a.z,b)
return s}if(m===7){r=a.z
s=H.ay(r,b)
q=r.y
return J.nR(q===11||q===12?C.a.ai("(",s)+")":s,"?")}if(m===8)return"FutureOr<"+H.b(H.ay(a.z,b))+">"
if(m===9){p=H.vO(a.z)
o=a.Q
return o.length!==0?p+("<"+H.vI(o,b)+">"):p}if(m===11)return H.pa(a,b,null)
if(m===12)return H.pa(a.z,b,a.Q)
if(m===13){b.toString
n=a.z
return b[b.length-1-n]}return"?"},
vO:function(a){var s,r=H.pG(a)
if(r!=null)return r
s="minified:"+a
return s},
oZ:function(a,b){var s=a.tR[b]
for(;typeof s=="string";)s=a.tR[s]
return s},
uV:function(a,b){var s,r,q,p,o,n=a.eT,m=n[b]
if(m==null)return H.fL(a,b,!1)
else if(typeof m=="number"){s=m
r=H.eb(a,5,"#")
q=[]
for(p=0;p<s;++p)q.push(r)
o=H.ea(a,b,q)
n[b]=o
return o}else return m},
uT:function(a,b){return H.p6(a.tR,b)},
uS:function(a,b){return H.p6(a.eT,b)},
fL:function(a,b,c){var s,r=a.eC,q=r.get(b)
if(q!=null)return q
s=H.oV(H.oT(a,null,b,c))
r.set(b,s)
return s},
fM:function(a,b,c){var s,r,q=b.ch
if(q==null)q=b.ch=new Map()
s=q.get(c)
if(s!=null)return s
r=H.oV(H.oT(a,b,c,!0))
q.set(c,r)
return r},
uU:function(a,b,c){var s,r,q,p=b.cx
if(p==null)p=b.cx=new Map()
s=c.cy
r=p.get(s)
if(r!=null)return r
q=H.nb(a,b,c.y===10?c.Q:[c])
p.set(s,q)
return q},
bM:function(a,b){b.a=H.vs
b.b=H.vt
return b},
eb:function(a,b,c){var s,r,q=a.eC.get(c)
if(q!=null)return q
s=new H.aN(null,null)
s.y=b
s.cy=c
r=H.bM(a,s)
a.eC.set(c,r)
return r},
oY:function(a,b,c){var s,r=b.cy+"*",q=a.eC.get(r)
if(q!=null)return q
s=H.uQ(a,b,r,c)
a.eC.set(r,s)
return s},
uQ:function(a,b,c,d){var s,r,q
if(d){s=b.y
if(!H.bk(b))r=b===t.P||b===t.T||s===7||s===6
else r=!0
if(r)return b}q=new H.aN(null,null)
q.y=6
q.z=b
q.cy=c
return H.bM(a,q)},
nd:function(a,b,c){var s,r=b.cy+"?",q=a.eC.get(r)
if(q!=null)return q
s=H.uP(a,b,r,c)
a.eC.set(r,s)
return s},
uP:function(a,b,c,d){var s,r,q,p
if(d){s=b.y
if(!H.bk(b))if(!(b===t.P||b===t.T))if(s!==7)r=s===8&&H.mA(b.z)
else r=!0
else r=!0
else r=!0
if(r)return b
else if(s===1||b===t.A)return t.P
else if(s===6){q=b.z
if(q.y===8&&H.mA(q.z))return q
else return H.uo(a,b)}}p=new H.aN(null,null)
p.y=7
p.z=b
p.cy=c
return H.bM(a,p)},
oX:function(a,b,c){var s,r=b.cy+"/",q=a.eC.get(r)
if(q!=null)return q
s=H.uN(a,b,r,c)
a.eC.set(r,s)
return s},
uN:function(a,b,c,d){var s,r,q
if(d){s=b.y
if(!H.bk(b))if(!(b===t._))r=b===t.K
else r=!0
else r=!0
if(r||b===t.K)return b
else if(s===1)return H.ea(a,"a3",[b])
else if(b===t.P||b===t.T)return t.eH}q=new H.aN(null,null)
q.y=8
q.z=b
q.cy=c
return H.bM(a,q)},
uR:function(a,b){var s,r,q=""+b+"^",p=a.eC.get(q)
if(p!=null)return p
s=new H.aN(null,null)
s.y=13
s.z=b
s.cy=q
r=H.bM(a,s)
a.eC.set(q,r)
return r},
fK:function(a){var s,r,q,p=a.length
for(s="",r="",q=0;q<p;++q,r=",")s+=r+a[q].cy
return s},
uM:function(a){var s,r,q,p,o,n,m=a.length
for(s="",r="",q=0;q<m;q+=3,r=","){p=a[q]
o=a[q+1]?"!":":"
n=a[q+2].cy
s+=r+p+o+n}return s},
ea:function(a,b,c){var s,r,q,p=b
if(c.length!==0)p+="<"+H.fK(c)+">"
s=a.eC.get(p)
if(s!=null)return s
r=new H.aN(null,null)
r.y=9
r.z=b
r.Q=c
if(c.length>0)r.c=c[0]
r.cy=p
q=H.bM(a,r)
a.eC.set(p,q)
return q},
nb:function(a,b,c){var s,r,q,p,o,n
if(b.y===10){s=b.z
r=b.Q.concat(c)}else{r=c
s=b}q=s.cy+(";<"+H.fK(r)+">")
p=a.eC.get(q)
if(p!=null)return p
o=new H.aN(null,null)
o.y=10
o.z=s
o.Q=r
o.cy=q
n=H.bM(a,o)
a.eC.set(q,n)
return n},
oW:function(a,b,c){var s,r,q,p,o,n=b.cy,m=c.a,l=m.length,k=c.b,j=k.length,i=c.c,h=i.length,g="("+H.fK(m)
if(j>0){s=l>0?",":""
r=H.fK(k)
g+=s+"["+r+"]"}if(h>0){s=l>0?",":""
r=H.uM(i)
g+=s+"{"+r+"}"}q=n+(g+")")
p=a.eC.get(q)
if(p!=null)return p
o=new H.aN(null,null)
o.y=11
o.z=b
o.Q=c
o.cy=q
r=H.bM(a,o)
a.eC.set(q,r)
return r},
nc:function(a,b,c,d){var s,r=b.cy+("<"+H.fK(c)+">"),q=a.eC.get(r)
if(q!=null)return q
s=H.uO(a,b,c,r,d)
a.eC.set(r,s)
return s},
uO:function(a,b,c,d,e){var s,r,q,p,o,n,m,l
if(e){s=c.length
r=new Array(s)
for(q=0,p=0;p<s;++p){o=c[p]
if(o.y===1){r[p]=o;++q}}if(q>0){n=H.bP(a,b,r,0)
m=H.er(a,c,r,0)
return H.nc(a,n,m,c!==m)}}l=new H.aN(null,null)
l.y=12
l.z=b
l.Q=c
l.cy=d
return H.bM(a,l)},
oT:function(a,b,c,d){return{u:a,e:b,r:c,s:[],p:0,n:d}},
oV:function(a){var s,r,q,p,o,n,m,l,k,j,i,h,g=a.r,f=a.s
for(s=g.length,r=0;r<s;){q=g.charCodeAt(r)
if(q>=48&&q<=57)r=H.uG(r+1,q,g,f)
else if((((q|32)>>>0)-97&65535)<26||q===95||q===36)r=H.oU(a,r,g,f,!1)
else if(q===46)r=H.oU(a,r,g,f,!0)
else{++r
switch(q){case 44:break
case 58:f.push(!1)
break
case 33:f.push(!0)
break
case 59:f.push(H.bL(a.u,a.e,f.pop()))
break
case 94:f.push(H.uR(a.u,f.pop()))
break
case 35:f.push(H.eb(a.u,5,"#"))
break
case 64:f.push(H.eb(a.u,2,"@"))
break
case 126:f.push(H.eb(a.u,3,"~"))
break
case 60:f.push(a.p)
a.p=f.length
break
case 62:p=a.u
o=f.splice(a.p)
H.na(a.u,a.e,o)
a.p=f.pop()
n=f.pop()
if(typeof n=="string")f.push(H.ea(p,n,o))
else{m=H.bL(p,a.e,n)
switch(m.y){case 11:f.push(H.nc(p,m,o,a.n))
break
default:f.push(H.nb(p,m,o))
break}}break
case 38:H.uH(a,f)
break
case 42:l=a.u
f.push(H.oY(l,H.bL(l,a.e,f.pop()),a.n))
break
case 63:l=a.u
f.push(H.nd(l,H.bL(l,a.e,f.pop()),a.n))
break
case 47:l=a.u
f.push(H.oX(l,H.bL(l,a.e,f.pop()),a.n))
break
case 40:f.push(a.p)
a.p=f.length
break
case 41:p=a.u
k=new H.fA()
j=p.sEA
i=p.sEA
n=f.pop()
if(typeof n=="number")switch(n){case-1:j=f.pop()
break
case-2:i=f.pop()
break
default:f.push(n)
break}else f.push(n)
o=f.splice(a.p)
H.na(a.u,a.e,o)
a.p=f.pop()
k.a=o
k.b=j
k.c=i
f.push(H.oW(p,H.bL(p,a.e,f.pop()),k))
break
case 91:f.push(a.p)
a.p=f.length
break
case 93:o=f.splice(a.p)
H.na(a.u,a.e,o)
a.p=f.pop()
f.push(o)
f.push(-1)
break
case 123:f.push(a.p)
a.p=f.length
break
case 125:o=f.splice(a.p)
H.uJ(a.u,a.e,o)
a.p=f.pop()
f.push(o)
f.push(-2)
break
default:throw"Bad character "+q}}}h=f.pop()
return H.bL(a.u,a.e,h)},
uG:function(a,b,c,d){var s,r,q=b-48
for(s=c.length;a<s;++a){r=c.charCodeAt(a)
if(!(r>=48&&r<=57))break
q=q*10+(r-48)}d.push(q)
return a},
oU:function(a,b,c,d,e){var s,r,q,p,o,n,m=b+1
for(s=c.length;m<s;++m){r=c.charCodeAt(m)
if(r===46){if(e)break
e=!0}else{if(!((((r|32)>>>0)-97&65535)<26||r===95||r===36))q=r>=48&&r<=57
else q=!0
if(!q)break}}p=c.substring(b,m)
if(e){s=a.u
o=a.e
if(o.y===10)o=o.z
n=H.oZ(s,o.z)[p]
if(n==null)H.a0('No "'+p+'" in "'+H.un(o)+'"')
d.push(H.fM(s,o,n))}else d.push(p)
return m},
uH:function(a,b){var s=b.pop()
if(0===s){b.push(H.eb(a.u,1,"0&"))
return}if(1===s){b.push(H.eb(a.u,4,"1&"))
return}throw H.d(P.h1("Unexpected extended operation "+H.b(s)))},
bL:function(a,b,c){if(typeof c=="string")return H.ea(a,c,a.sEA)
else if(typeof c=="number")return H.uI(a,b,c)
else return c},
na:function(a,b,c){var s,r=c.length
for(s=0;s<r;++s)c[s]=H.bL(a,b,c[s])},
uJ:function(a,b,c){var s,r=c.length
for(s=2;s<r;s+=3)c[s]=H.bL(a,b,c[s])},
uI:function(a,b,c){var s,r,q=b.y
if(q===10){if(c===0)return b.z
s=b.Q
r=s.length
if(c<=r)return s[c-1]
c-=r
b=b.z
q=b.y}else if(c===0)return b
if(q!==9)throw H.d(P.h1("Indexed base must be an interface type"))
s=b.Q
if(c<=s.length)return s[c-1]
throw H.d(P.h1("Bad index "+c+" for "+b.k(0)))},
a5:function(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j
if(b===d)return!0
if(!H.bk(d))if(!(d===t._))s=d===t.K
else s=!0
else s=!0
if(s)return!0
r=b.y
if(r===4)return!0
if(H.bk(b))return!1
if(b.y!==1)s=b===t.P||b===t.T
else s=!0
if(s)return!0
q=r===13
if(q)if(H.a5(a,c[b.z],c,d,e))return!0
p=d.y
if(r===6)return H.a5(a,b.z,c,d,e)
if(p===6){s=d.z
return H.a5(a,b,c,s,e)}if(r===8){if(!H.a5(a,b.z,c,d,e))return!1
return H.a5(a,H.oy(a,b),c,d,e)}if(r===7){s=H.a5(a,b.z,c,d,e)
return s}if(p===8){if(H.a5(a,b,c,d.z,e))return!0
return H.a5(a,b,c,H.oy(a,d),e)}if(p===7){s=H.a5(a,b,c,d.z,e)
return s}if(q)return!1
s=r!==11
if((!s||r===12)&&d===t.b8)return!0
if(p===12){if(b===t.Q)return!0
if(r!==12)return!1
o=b.Q
n=d.Q
m=o.length
if(m!==n.length)return!1
c=c==null?o:o.concat(c)
e=e==null?n:n.concat(e)
for(l=0;l<m;++l){k=o[l]
j=n[l]
if(!H.a5(a,k,c,j,e)||!H.a5(a,j,e,k,c))return!1}return H.pc(a,b.z,c,d.z,e)}if(p===11){if(b===t.Q)return!0
if(s)return!1
return H.pc(a,b,c,d,e)}if(r===9){if(p!==9)return!1
return H.vv(a,b,c,d,e)}return!1},
pc:function(a2,a3,a4,a5,a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1
if(!H.a5(a2,a3.z,a4,a5.z,a6))return!1
s=a3.Q
r=a5.Q
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
if(!H.a5(a2,p[h],a6,g,a4))return!1}for(h=0;h<m;++h){g=l[h]
if(!H.a5(a2,p[o+h],a6,g,a4))return!1}for(h=0;h<i;++h){g=l[m+h]
if(!H.a5(a2,k[h],a6,g,a4))return!1}f=s.c
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
if(!H.a5(a2,e[a+2],a6,g,a4))return!1
break}}return!0},
vv:function(a,b,c,d,e){var s,r,q,p,o,n,m,l,k=b.z,j=d.z
if(k===j){s=b.Q
r=d.Q
q=s.length
for(p=0;p<q;++p){o=s[p]
n=r[p]
if(!H.a5(a,o,c,n,e))return!1}return!0}if(d===t.K)return!0
m=H.oZ(a,k)
if(m==null)return!1
l=m[j]
if(l==null)return!1
q=l.length
r=d.Q
for(p=0;p<q;++p)if(!H.a5(a,H.fM(a,b,l[p]),c,r[p],e))return!1
return!0},
mA:function(a){var s,r=a.y
if(!(a===t.P||a===t.T))if(!H.bk(a))if(r!==7)if(!(r===6&&H.mA(a.z)))s=r===8&&H.mA(a.z)
else s=!0
else s=!0
else s=!0
else s=!0
return s},
wm:function(a){var s
if(!H.bk(a))if(!(a===t._))s=a===t.K
else s=!0
else s=!0
return s},
bk:function(a){var s=a.y
return s===2||s===3||s===4||s===5||a===t.cK},
p6:function(a,b){var s,r,q=Object.keys(b),p=q.length
for(s=0;s<p;++s){r=q[s]
a[r]=b[r]}},
aN:function aN(a,b){var _=this
_.a=a
_.b=b
_.x=_.r=_.c=null
_.y=0
_.cy=_.cx=_.ch=_.Q=_.z=null},
fA:function fA(){this.c=this.b=this.a=null},
e8:function e8(a){this.a=a},
fz:function fz(){},
e9:function e9(a){this.a=a},
pG:function(a){return v.mangledGlobalNames[a]}},J={
nr:function(a,b,c,d){return{i:a,p:b,e:c,x:d}},
fS:function(a){var s,r,q,p,o=a[v.dispatchPropertyName]
if(o==null)if($.np==null){H.wj()
o=a[v.dispatchPropertyName]}if(o!=null){s=o.p
if(!1===s)return o.i
if(!0===s)return a
r=Object.getPrototypeOf(a)
if(s===r)return o.i
if(o.e===r)throw H.d(P.oE("Return interceptor for "+H.b(s(a,o))))}q=a.constructor
p=q==null?null:q[J.oa()]
if(p!=null)return p
p=H.wB(a)
if(p!=null)return p
if(typeof a=="function")return C.bP
s=Object.getPrototypeOf(a)
if(s==null)return C.ar
if(s===Object.prototype)return C.ar
if(typeof q=="function"){Object.defineProperty(q,J.oa(),{value:C.Q,enumerable:false,writable:true,configurable:true})
return C.Q}return C.Q},
oa:function(){var s=$.oS
return s==null?$.oS=v.getIsolateTag("_$dart_js"):s},
b7:function(a,b){if(a<0||a>4294967295)throw H.d(P.V(a,0,4294967295,"length",null))
return J.cL(new Array(a),b)},
o8:function(a,b){if(a>4294967295)throw H.d(P.V(a,0,4294967295,"length",null))
return J.cL(new Array(a),b)},
cL:function(a,b){return J.n_(H.a(a,b.h("B<0>")))},
n_:function(a){a.fixed$length=Array
return a},
tM:function(a){if(a<256)switch(a){case 9:case 10:case 11:case 12:case 13:case 32:case 133:case 160:return!0
default:return!1}switch(a){case 5760:case 8192:case 8193:case 8194:case 8195:case 8196:case 8197:case 8198:case 8199:case 8200:case 8201:case 8202:case 8232:case 8233:case 8239:case 8287:case 12288:case 65279:return!0
default:return!1}},
o9:function(a,b){var s,r
for(;b>0;b=s){s=b-1
r=C.a.A(a,s)
if(r!==32&&r!==13&&!J.tM(r))break}return b},
cz:function(a){if(typeof a=="number"){if(Math.floor(a)==a)return J.dp.prototype
return J.eP.prototype}if(typeof a=="string")return J.bt.prototype
if(a==null)return J.cM.prototype
if(typeof a=="boolean")return J.dn.prototype
if(a.constructor==Array)return J.B.prototype
if(typeof a!="object"){if(typeof a=="function")return J.aS.prototype
return a}if(a instanceof P.e)return a
return J.fS(a)},
we:function(a){if(typeof a=="number")return J.c9.prototype
if(typeof a=="string")return J.bt.prototype
if(a==null)return a
if(a.constructor==Array)return J.B.prototype
if(typeof a!="object"){if(typeof a=="function")return J.aS.prototype
return a}if(a instanceof P.e)return a
return J.fS(a)},
O:function(a){if(typeof a=="string")return J.bt.prototype
if(a==null)return a
if(a.constructor==Array)return J.B.prototype
if(typeof a!="object"){if(typeof a=="function")return J.aS.prototype
return a}if(a instanceof P.e)return a
return J.fS(a)},
bi:function(a){if(a==null)return a
if(a.constructor==Array)return J.B.prototype
if(typeof a!="object"){if(typeof a=="function")return J.aS.prototype
return a}if(a instanceof P.e)return a
return J.fS(a)},
wf:function(a){if(typeof a=="number")return J.c9.prototype
if(a==null)return a
if(!(a instanceof P.e))return J.ct.prototype
return a},
nn:function(a){if(typeof a=="string")return J.bt.prototype
if(a==null)return a
if(!(a instanceof P.e))return J.ct.prototype
return a},
bj:function(a){if(a==null)return a
if(typeof a!="object"){if(typeof a=="function")return J.aS.prototype
return a}if(a instanceof P.e)return a
return J.fS(a)},
nR:function(a,b){if(typeof a=="number"&&typeof b=="number")return a+b
return J.we(a).ai(a,b)},
aA:function(a,b){if(a==null)return b==null
if(typeof a!="object")return b!=null&&a===b
return J.cz(a).N(a,b)},
nS:function(a,b){if(typeof b==="number")if(a.constructor==Array||typeof a=="string"||H.pw(a,a[v.dispatchPropertyName]))if(b>>>0===b&&b<a.length)return a[b]
return J.O(a).j(a,b)},
rX:function(a,b,c){if(typeof b==="number")if((a.constructor==Array||H.pw(a,a[v.dispatchPropertyName]))&&!a.immutable$list&&b>>>0===b&&b<a.length)return a[b]=c
return J.bi(a).m(a,b,c)},
rY:function(a,b){return J.nn(a).I(a,b)},
mV:function(a,b){return J.bi(a).B(a,b)},
mW:function(a,b){return J.bi(a).af(a,b)},
nT:function(a,b){return J.bi(a).E(a,b)},
ew:function(a,b){return J.bi(a).S(a,b)},
aF:function(a){return J.cz(a).gF(a)},
nU:function(a){return J.O(a).gv(a)},
rZ:function(a){return J.O(a).ga6(a)},
an:function(a){return J.bi(a).gC(a)},
Z:function(a){return J.O(a).gi(a)},
t_:function(a){return J.bj(a).geq(a)},
t0:function(a){return J.bj(a).gc1(a)},
t1:function(a,b,c){return J.bi(a).aN(a,b,c)},
bn:function(a,b,c){return J.bi(a).ah(a,b,c)},
t2:function(a,b){return J.cz(a).bc(a,b)},
t3:function(a,b){return J.O(a).si(a,b)},
t4:function(a,b){return J.bj(a).sd7(a,b)},
t5:function(a,b){return J.bj(a).sez(a,b)},
t6:function(a,b){return J.bj(a).seB(a,b)},
t7:function(a,b){return J.bj(a).seC(a,b)},
nV:function(a,b){return J.bi(a).a4(a,b)},
t8:function(a,b){return J.nn(a).X(a,b)},
t9:function(a,b,c){return J.bj(a).cX(a,b,c)},
ta:function(a,b,c){return J.bj(a).er(a,b,c)},
tb:function(a){return J.wf(a).cY(a)},
fY:function(a,b){return J.bi(a).aM(a,b)},
ah:function(a){return J.cz(a).k(a)},
tc:function(a){return J.nn(a).ew(a)},
cJ:function cJ(){},
dn:function dn(){},
cM:function cM(){},
aJ:function aJ(){},
f8:function f8(){},
ct:function ct(){},
aS:function aS(){},
B:function B(a){this.$ti=a},
iB:function iB(a){this.$ti=a},
aG:function aG(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
c9:function c9(){},
dp:function dp(){},
eP:function eP(){},
bt:function bt(){}},P={
uz:function(){var s,r,q={}
if(self.scheduleImmediate!=null)return P.vX()
if(self.MutationObserver!=null&&self.document!=null){s=self.document.createElement("div")
r=self.document.createElement("span")
q.a=null
new self.MutationObserver(H.mm(new P.lz(q),1)).observe(s,{childList:true})
return new P.ly(q,s,r)}else if(self.setImmediate!=null)return P.vY()
return P.vZ()},
uA:function(a){self.scheduleImmediate(H.mm(new P.lA(a),0))},
uB:function(a){self.setImmediate(H.mm(new P.lB(a),0))},
uC:function(a){P.uK(0,a)},
uK:function(a,b){var s=new P.m2()
s.d8(a,b)
return s},
eq:function(a){return new P.ft(new P.C($.z,a.h("C<0>")),a.h("ft<0>"))},
el:function(a,b){a.$2(0,null)
b.b=!0
return b.a},
d4:function(a,b){P.vf(a,b)},
ek:function(a,b){b.T(a)},
ej:function(a,b){b.bE(H.G(a),H.aD(a))},
vf:function(a,b){var s,r,q=new P.m6(b),p=new P.m7(b)
if(a instanceof P.C)a.cw(q,p,t.z)
else{s=t.z
if(t.d.b(a))a.aq(0,q,p,s)
else{r=new P.C($.z,t.eI)
r.a=4
r.c=a
r.cw(q,p,s)}}},
es:function(a){var s=function(b,c){return function(d,e){while(true)try{b(d,e)
break}catch(r){e=r
d=c}}}(a,1)
return $.z.bW(new P.ml(s))},
lS:function(a){return new P.cY(a,1)},
bJ:function(){return C.dZ},
bK:function(a){return new P.cY(a,3)},
bO:function(a,b){return new P.e7(a,b.h("e7<0>"))},
h2:function(a,b){var s=H.da(a,"error",t.K)
return new P.ez(s,b==null?P.eA(a):b)},
eA:function(a){var s
if(t.C.b(a)){s=a.gaP()
if(s!=null)return s}return C.bh},
n7:function(a,b){var s,r
for(;s=a.a,s===2;)a=a.c
if(s>=4){r=b.b2()
b.a=a.a
b.c=a.c
P.cX(b,r)}else{r=b.c
b.a=2
b.c=a
a.cq(r)}},
cX:function(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=null,e={},d=e.a=a
for(s=t.d;!0;){r={}
q=d.a===8
if(b==null){if(q){s=d.c
P.d7(f,f,d.b,s.a,s.b)}return}r.a=b
p=b.a
for(d=b;p!=null;d=p,p=o){d.a=null
P.cX(e.a,d)
r.a=p
o=p.a}n=e.a
m=n.c
r.b=q
r.c=m
l=!q
if(l){k=d.c
k=(k&1)!==0||(k&15)===8}else k=!0
if(k){j=d.b.b
if(q){k=n.b===j
k=!(k||k)}else k=!1
if(k){P.d7(f,f,n.b,m.a,m.b)
return}i=$.z
if(i!==j)$.z=j
else i=f
d=d.c
if((d&15)===8)new P.lQ(r,e,q).$0()
else if(l){if((d&1)!==0)new P.lP(r,m).$0()}else if((d&2)!==0)new P.lO(e,r).$0()
if(i!=null)$.z=i
d=r.c
if(s.b(d)){n=r.a.$ti
n=n.h("a3<2>").b(d)||!n.Q[1].b(d)}else n=!1
if(n){h=r.a.b
if(d instanceof P.C)if(d.a>=4){g=h.c
h.c=null
b=h.b3(g)
h.a=d.a
h.c=d.c
e.a=d
continue}else P.n7(d,h)
else h.c9(d)
return}}h=r.a.b
g=h.c
h.c=null
b=h.b3(g)
d=r.b
n=r.c
if(!d){h.a=4
h.c=n}else{h.a=8
h.c=n}e.a=h
d=h}},
vH:function(a,b){if(t.r.b(a))return b.bW(a)
if(t.bI.b(a))return a
throw H.d(P.nY(a,"onError","Error handler must accept one Object or one Object and a StackTrace as arguments, and return a valid result"))},
vD:function(){var s,r
for(s=$.d6;s!=null;s=$.d6){$.ep=null
r=s.b
$.d6=r
if(r==null)$.eo=null
s.a.$0()}},
vK:function(){$.nh=!0
try{P.vD()}finally{$.ep=null
$.nh=!1
if($.d6!=null)$.nO().$1(P.pl())}},
pi:function(a){var s=new P.fu(a),r=$.eo
if(r==null){$.d6=$.eo=s
if(!$.nh)$.nO().$1(P.pl())}else $.eo=r.b=s},
vJ:function(a){var s,r,q,p=$.d6
if(p==null){P.pi(a)
$.ep=$.eo
return}s=new P.fu(a)
r=$.ep
if(r==null){s.b=p
$.d6=$.ep=s}else{q=r.b
s.b=q
$.ep=r.b=s
if(q==null)$.eo=s}},
pD:function(a){var s=null,r=$.z
if(C.f===r){P.d8(s,s,C.f,a)
return}P.d8(s,s,r,r.cA(a))},
us:function(a,b){var s=null,r=b.h("d2<0>"),q=new P.d2(s,s,s,s,r)
a.aq(0,new P.l_(q,b),new P.l0(q),t.P)
return new P.al(q,r.h("al<1>"))},
n5:function(a,b){return new P.dQ(new P.l1(a,b),b.h("dQ<0>"))},
zo:function(a){H.da(a,"stream",t.K)
return new P.fH()},
oB:function(a,b,c,d){return new P.bG(null,b,c,a,d.h("bG<0>"))},
nk:function(a){var s,r,q,p
if(a==null)return
try{a.$0()}catch(q){s=H.G(q)
r=H.aD(q)
p=$.z
P.d7(null,null,p,s,r)}},
oN:function(a,b,c,d){var s=$.z,r=d?1:0,q=P.oO(s,b)
return new P.cV(a,q,c,s,r)},
oO:function(a,b){if(b==null)b=P.w_()
if(t.k.b(b))return a.bW(b)
if(t.d5.b(b))return b
throw H.d(P.T("handleError callback must take either an Object (the error), or both an Object (the error) and a StackTrace."))},
vE:function(a,b){P.d7(null,null,$.z,a,b)},
d7:function(a,b,c,d,e){P.vJ(new P.mj(d,e))},
pe:function(a,b,c,d){var s,r=$.z
if(r===c)return d.$0()
$.z=c
s=r
try{r=d.$0()
return r}finally{$.z=s}},
pg:function(a,b,c,d,e){var s,r=$.z
if(r===c)return d.$1(e)
$.z=c
s=r
try{r=d.$1(e)
return r}finally{$.z=s}},
pf:function(a,b,c,d,e,f){var s,r=$.z
if(r===c)return d.$2(e,f)
$.z=c
s=r
try{r=d.$2(e,f)
return r}finally{$.z=s}},
d8:function(a,b,c,d){var s=C.f!==c
if(s)d=!(!s||!1)?c.cA(d):c.dS(d,t.H)
P.pi(d)},
lz:function lz(a){this.a=a},
ly:function ly(a,b,c){this.a=a
this.b=b
this.c=c},
lA:function lA(a){this.a=a},
lB:function lB(a){this.a=a},
m2:function m2(){},
m3:function m3(a,b){this.a=a
this.b=b},
ft:function ft(a,b){this.a=a
this.b=!1
this.$ti=b},
m6:function m6(a){this.a=a},
m7:function m7(a){this.a=a},
ml:function ml(a){this.a=a},
cY:function cY(a,b){this.a=a
this.b=b},
aC:function aC(a,b){var _=this
_.a=a
_.d=_.c=_.b=null
_.$ti=b},
e7:function e7(a,b){this.a=a
this.$ti=b},
ez:function ez(a,b){this.a=a
this.b=b},
fw:function fw(){},
aw:function aw(a,b){this.a=a
this.$ti=b},
bI:function bI(a,b,c,d,e){var _=this
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
lG:function lG(a,b){this.a=a
this.b=b},
lN:function lN(a,b){this.a=a
this.b=b},
lJ:function lJ(a){this.a=a},
lK:function lK(a){this.a=a},
lL:function lL(a,b,c){this.a=a
this.b=b
this.c=c},
lI:function lI(a,b){this.a=a
this.b=b},
lM:function lM(a,b){this.a=a
this.b=b},
lH:function lH(a,b,c){this.a=a
this.b=b
this.c=c},
lQ:function lQ(a,b,c){this.a=a
this.b=b
this.c=c},
lR:function lR(a){this.a=a},
lP:function lP(a,b){this.a=a
this.b=b},
lO:function lO(a,b){this.a=a
this.b=b},
fu:function fu(a){this.a=a
this.b=null},
aX:function aX(){},
l_:function l_(a,b){this.a=a
this.b=b},
l0:function l0(a){this.a=a},
l1:function l1(a,b){this.a=a
this.b=b},
l2:function l2(a,b){this.a=a
this.b=b},
l3:function l3(a,b){this.a=a
this.b=b},
fg:function fg(){},
d1:function d1(){},
m1:function m1(a){this.a=a},
m0:function m0(a){this.a=a},
fJ:function fJ(){},
fv:function fv(){},
bG:function bG(a,b,c,d,e){var _=this
_.a=null
_.b=0
_.c=null
_.d=a
_.e=b
_.f=c
_.r=d
_.$ti=e},
d2:function d2(a,b,c,d,e){var _=this
_.a=null
_.b=0
_.c=null
_.d=a
_.e=b
_.f=c
_.r=d
_.$ti=e},
al:function al(a,b){this.a=a
this.$ti=b},
dM:function dM(a,b,c,d,e,f){var _=this
_.x=a
_.a=b
_.b=c
_.c=d
_.d=e
_.e=f
_.r=_.f=null},
cV:function cV(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.r=_.f=null},
lE:function lE(a,b,c){this.a=a
this.b=b
this.c=c},
lD:function lD(a){this.a=a},
e4:function e4(){},
dQ:function dQ(a,b){this.a=a
this.b=!1
this.$ti=b},
dX:function dX(a){this.b=a
this.a=0},
fy:function fy(){},
cw:function cw(a){this.b=a
this.a=null},
dN:function dN(a,b){this.b=a
this.c=b
this.a=null},
lF:function lF(){},
fE:function fE(){},
lW:function lW(a,b){this.a=a
this.b=b},
e5:function e5(){this.c=this.b=null
this.a=0},
fH:function fH(){},
m5:function m5(){},
mj:function mj(a,b){this.a=a
this.b=b},
lY:function lY(){},
m_:function m_(a,b,c){this.a=a
this.b=b
this.c=c},
lZ:function lZ(a,b){this.a=a
this.b=b},
oQ:function(a,b){var s=a[b]
return s===a?null:s},
n8:function(a,b,c){if(c==null)a[b]=a
else a[b]=c},
oR:function(){var s=Object.create(null)
P.n8(s,"<non-identifier-key>",s)
delete s["<non-identifier-key>"]
return s},
n2:function(a,b,c){return H.po(a,new H.aK(b.h("@<0>").G(c).h("aK<1,2>")))},
a8:function(a,b){return new H.aK(a.h("@<0>").G(b).h("aK<1,2>"))},
oc:function(a){return new P.b_(a.h("b_<0>"))},
aM:function(a){return new P.b_(a.h("b_<0>"))},
ba:function(a,b){return H.wb(a,new P.b_(b.h("b_<0>")))},
n9:function(){var s=Object.create(null)
s["<non-identifier-key>"]=s
delete s["<non-identifier-key>"]
return s},
tK:function(a,b,c){var s,r
if(P.ni(a)){if(b==="("&&c===")")return"(...)"
return b+"..."+c}s=H.a([],t.s)
$.cx.push(a)
try{P.vB(a,s)}finally{$.cx.pop()}r=P.n6(b,s,", ")+c
return r.charCodeAt(0)==0?r:r},
iy:function(a,b,c){var s,r
if(P.ni(a))return b+"..."+c
s=new P.ab(b)
$.cx.push(a)
try{r=s
r.a=P.n6(r.a,a,", ")}finally{$.cx.pop()}s.a+=c
r=s.a
return r.charCodeAt(0)==0?r:r},
ni:function(a){var s,r
for(s=$.cx.length,r=0;r<s;++r)if(a===$.cx[r])return!0
return!1},
vB:function(a,b){var s,r,q,p,o,n,m,l=a.gC(a),k=0,j=0
while(!0){if(!(k<80||j<3))break
if(!l.n())return
s=H.b(l.gq())
b.push(s)
k+=s.length+2;++j}if(!l.n()){if(j<=5)return
r=b.pop()
q=b.pop()}else{p=l.gq();++j
if(!l.n()){if(j<=4){b.push(H.b(p))
return}r=H.b(p)
q=b.pop()
k+=r.length+2}else{o=l.gq();++j
for(;l.n();p=o,o=n){n=l.gq();++j
if(j>100){while(!0){if(!(k>75&&j>3))break
k-=b.pop().length+2;--j}b.push("...")
return}}q=H.b(p)
r=H.b(o)
k+=r.length+q.length+4}}if(j>b.length+2){k+=5
m="..."}else m=null
while(!0){if(!(k>80&&b.length>3))break
k-=b.pop().length+2
if(m==null){k+=5
m="..."}}if(m!=null)b.push(m)
b.push(q)
b.push(r)},
u3:function(a,b){var s,r,q=P.oc(b)
for(s=a.length,r=0;r<a.length;a.length===s||(0,H.cB)(a),++r)q.B(0,b.a(a[r]))
return q},
n3:function(a){var s,r={}
if(P.ni(a))return"{...}"
s=new P.ab("")
try{$.cx.push(a)
s.a+="{"
r.a=!0
a.K(0,new P.jw(r,s))
s.a+="}"}finally{$.cx.pop()}r=s.a
return r.charCodeAt(0)==0?r:r},
uW:function(){throw H.d(P.ac("Cannot change an unmodifiable set"))},
dS:function dS(){},
dV:function dV(a){var _=this
_.a=0
_.e=_.d=_.c=_.b=null
_.$ti=a},
dT:function dT(a,b){this.a=a
this.$ti=b},
dU:function dU(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
b_:function b_(a){var _=this
_.a=0
_.f=_.e=_.d=_.c=_.b=null
_.r=0
_.$ti=a},
lU:function lU(a){this.a=a
this.c=this.b=null},
dY:function dY(a,b,c){var _=this
_.a=a
_.b=b
_.d=_.c=null
_.$ti=c},
aY:function aY(a,b){this.a=a
this.$ti=b},
dm:function dm(){},
ds:function ds(){},
n:function n(){},
dt:function dt(){},
jw:function jw(a,b){this.a=a
this.b=b},
K:function K(){},
jx:function jx(a){this.a=a},
fN:function fN(){},
du:function du(){},
bg:function bg(a,b){this.a=a
this.$ti=b},
cQ:function cQ(){},
d_:function d_(){},
fO:function fO(){},
ed:function ed(a,b){this.a=a
this.$ti=b},
dZ:function dZ(){},
ec:function ec(){},
eh:function eh(){},
ei:function ei(){},
pd:function(a,b){var s,r,q,p=null
try{p=JSON.parse(a)}catch(r){s=H.G(r)
q=P.M(String(s),null,null)
throw H.d(q)}q=P.m9(p)
return q},
m9:function(a){var s
if(a==null)return null
if(typeof a!="object")return a
if(Object.getPrototypeOf(a)!==Array.prototype)return new P.fC(a,Object.create(null))
for(s=0;s<a.length;++s)a[s]=P.m9(a[s])
return a},
ux:function(a,b,c,d){var s,r
if(b instanceof Uint8Array){s=b
d=s.length
if(d-c<15)return null
r=P.uy(a,s,c,d)
if(r!=null&&a)if(r.indexOf("\ufffd")>=0)return null
return r}return null},
uy:function(a,b,c,d){var s=a?$.rP():$.rO()
if(s==null)return null
if(0===c&&d===b.length)return P.oI(s,b)
return P.oI(s,b.subarray(c,P.aW(c,d,b.length)))},
oI:function(a,b){var s,r
try{s=a.decode(b)
return s}catch(r){H.G(r)}return null},
nZ:function(a,b,c,d,e,f){if(C.c.bh(f,4)!==0)throw H.d(P.M("Invalid base64 padding, padded length must be multiple of four, is "+f,a,c))
if(d+e!==f)throw H.d(P.M("Invalid base64 padding, '=' not at the end",a,b))
if(e>2)throw H.d(P.M("Invalid base64 padding, more than two '=' characters",a,b))},
uF:function(a,b,c,d,e,f){var s,r,q,p,o,n,m="Invalid encoding before padding",l="Invalid character",k=C.c.ae(f,2),j=f&3,i=$.nP()
for(s=b,r=0;s<c;++s){q=C.a.A(a,s)
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
if(j===3){if((k&3)!==0)throw H.d(P.M(m,a,s))
d[e]=k>>>10
d[e+1]=k>>>2}else{if((k&15)!==0)throw H.d(P.M(m,a,s))
d[e]=k>>>4}n=(3-j)*3
if(q===37)n+=2
return P.oM(a,s+1,c,-n-1)}throw H.d(P.M(l,a,s))}if(r>=0&&r<=127)return(k<<2|j)>>>0
for(s=b;s<c;++s){q=C.a.A(a,s)
if(q>127)break}throw H.d(P.M(l,a,s))},
uD:function(a,b,c,d){var s=P.uE(a,b,c),r=(d&3)+(s-b),q=C.c.ae(r,2)*3,p=r&3
if(p!==0&&s<c)q+=p-1
if(q>0)return new Uint8Array(q)
return $.rQ()},
uE:function(a,b,c){var s,r=c,q=r,p=0
while(!0){if(!(q>b&&p<2))break
c$0:{--q
s=C.a.A(a,q)
if(s===61){++p
r=q
break c$0}if((s|32)===100){if(q===b)break;--q
s=C.a.A(a,q)}if(s===51){if(q===b)break;--q
s=C.a.A(a,q)}if(s===37){++p
r=q
break c$0}break}}return r},
oM:function(a,b,c,d){var s,r
if(b===c)return d
s=-d-1
for(;s>0;){r=C.a.A(a,b)
if(s===3){if(r===61){s-=3;++b
break}if(r===37){--s;++b
if(b===c)break
r=C.a.A(a,b)}else break}if((s>3?s-3:s)===2){if(r!==51)break;++b;--s
if(b===c)break
r=C.a.A(a,b)}if((r|32)!==100)break;++b;--s
if(b===c)break}if(b!==c)throw H.d(P.M("Invalid padding character",a,b))
return-s-1},
p5:function(a){switch(a){case 65:return"Missing extension byte"
case 67:return"Unexpected extension byte"
case 69:return"Invalid UTF-8 byte"
case 71:return"Overlong encoding"
case 73:return"Out of unicode range"
case 75:return"Encoded surrogate"
case 77:return"Unfinished UTF-8 octet sequence"
default:return""}},
vc:function(a,b,c){var s,r,q,p=c-b,o=new Uint8Array(p)
for(s=J.O(a),r=0;r<p;++r){q=s.j(a,b+r)
o[r]=(q&4294967040)>>>0!==0?255:q}return o},
fC:function fC(a,b){this.a=a
this.b=b
this.c=null},
fD:function fD(a){this.a=a},
lT:function lT(a,b,c){this.b=a
this.c=b
this.a=c},
lg:function lg(){},
lf:function lf(){},
h3:function h3(){},
h5:function h5(){},
h4:function h4(){},
lC:function lC(){this.a=0},
h6:function h6(){},
eB:function eB(){},
fF:function fF(a,b,c){this.a=a
this.b=b
this.$ti=c},
eD:function eD(){},
eF:function eF(){},
hP:function hP(){},
iG:function iG(){},
iH:function iH(a){this.a=a},
l4:function l4(){},
l5:function l5(){},
e6:function e6(){},
m4:function m4(a,b,c){this.a=a
this.b=b
this.c=c},
ld:function ld(){},
le:function le(a){this.a=a},
fP:function fP(a){this.a=a
this.b=16
this.c=0},
cA:function(a,b){var s=H.ow(a,b)
if(s!=null)return s
throw H.d(P.M(a,null,null))},
tB:function(a){if(a instanceof H.c2)return a.k(0)
return"Instance of '"+H.b(H.jS(a))+"'"},
P:function(a,b,c,d){var s,r=J.b7(a,d)
if(a!==0&&b!=null)for(s=0;s<a;++s)r[s]=b
return r},
oe:function(a,b){var s,r=H.a([],b.h("B<0>"))
for(s=J.an(a);s.n();)r.push(s.gq())
return r},
eR:function(a,b,c){var s
if(b)return P.od(a,c)
s=J.n_(P.od(a,c))
return s},
od:function(a,b){var s,r
if(Array.isArray(a))return H.a(a.slice(0),b.h("B<0>"))
s=H.a([],b.h("B<0>"))
for(r=J.an(a);r.n();)s.push(r.gq())
return s},
of:function(a,b,c,d){var s,r=J.b7(a,d)
for(s=0;s<a;++s)r[s]=b.$1(s)
return r},
oC:function(a,b,c){if(t.bm.b(a))return H.ul(a,b,P.aW(b,c,a.length))
return P.ut(a,b,c)},
ut:function(a,b,c){var s,r,q,p,o=null
if(b<0)throw H.d(P.V(b,0,a.length,o,o))
s=c==null
if(!s&&c<b)throw H.d(P.V(c,b,a.length,o,o))
r=new H.a9(a,a.length,H.ae(a).h("a9<n.E>"))
for(q=0;q<b;++q)if(!r.n())throw H.d(P.V(b,0,q,o,o))
p=[]
if(s)for(;r.n();)p.push(r.d)
else for(q=b;q<c;++q){if(!r.n())throw H.d(P.V(c,b,q,o,o))
p.push(r.d)}return H.uj(p)},
ox:function(a){return new H.iA(a,H.tN(a,!1,!0,!1,!1,!1))},
n6:function(a,b,c){var s=J.an(b)
if(!s.n())return a
if(c.length===0){do a+=H.b(s.gq())
while(s.n())}else{a+=H.b(s.gq())
for(;s.n();)a=a+c+H.b(s.gq())}return a},
om:function(a,b,c,d){return new P.f2(a,b,c,d)},
o4:function(a){var s=Math.abs(a),r=a<0?"-":""
if(s>=1000)return""+a
if(s>=100)return r+"0"+s
if(s>=10)return r+"00"+s
return r+"000"+s},
tA:function(a){var s=Math.abs(a),r=a<0?"-":"+"
if(s>=1e5)return r+s
return r+"0"+s},
o5:function(a){if(a>=100)return""+a
if(a>=10)return"0"+a
return"00"+a},
b5:function(a){if(a>=10)return""+a
return"0"+a},
cH:function(a){if(typeof a=="number"||H.en(a)||null==a)return J.ah(a)
if(typeof a=="string")return JSON.stringify(a)
return P.tB(a)},
h1:function(a){return new P.ey(a)},
T:function(a){return new P.ao(!1,null,null,a)},
nY:function(a,b,c){return new P.ao(!0,a,b,c)},
h0:function(a,b){return a},
jT:function(a,b){return new P.dC(null,null,!0,a,b,"Value not in range")},
V:function(a,b,c,d,e){return new P.dC(b,c,!0,a,d,"Invalid value")},
aW:function(a,b,c){if(0>a||a>c)throw H.d(P.V(a,0,c,"start",null))
if(b!=null){if(a>b||b>c)throw H.d(P.V(b,a,c,"end",null))
return b}return c},
aV:function(a,b){if(a<0)throw H.d(P.V(a,0,null,b,null))
return a},
eM:function(a,b,c,d,e){var s=e==null?J.Z(b):e
return new P.eL(s,!0,a,c,"Index out of range")},
ac:function(a){return new P.fo(a)},
oE:function(a){return new P.fj(a)},
cR:function(a){return new P.bC(a)},
a6:function(a){return new P.eE(a)},
tC:function(a){return new P.dP(a)},
M:function(a,b,c){return new P.aH(a,b,c)},
o7:function(a,b,c){if(a<=0)return new H.b6(c.h("b6<0>"))
return new P.dR(a,b,c.h("dR<0>"))},
og:function(a,b,c,d,e){return new H.c1(a,b.h("@<0>").G(c).G(d).G(e).h("c1<1,2,3,4>"))},
oG:function(a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4=null,a5=a6.length
if(a5>=5){s=P.pj(a6,0)
if(s===0){r=P.l9(a5<a5?C.a.u(a6,0,a5):a6,5,a4)
return r.gbe(r)}else if(s===32){r=P.l9(C.a.u(a6,5,a5),0,a4)
return r.gbe(r)}}q=P.P(8,0,!1,t.S)
q[0]=0
q[1]=-1
q[2]=-1
q[7]=-1
q[3]=0
q[4]=0
q[5]=a5
q[6]=a5
if(P.ph(a6,0,a5,0,q)>=14)q[7]=a5
p=q[1]
if(p>=0)if(P.ph(a6,0,p,20,q)===20)q[7]=p
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
j=!1}else{if(!(l<a5&&l===m+2&&C.a.U(a6,"..",m)))h=l>m+2&&C.a.U(a6,"/..",l-3)
else h=!0
if(h){i=a4
j=!1}else{if(p===4)if(C.a.U(a6,"file",0)){if(o<=0){if(!C.a.U(a6,"/",m)){g="file:///"
f=3}else{g="file://"
f=2}a6=g+C.a.u(a6,m,a5)
p-=0
r=f-0
l+=r
k+=r
a5=a6.length
o=7
n=7
m=7}else if(m===l){++k
e=l+1
a6=C.a.aC(a6,m,l,"/");++a5
l=e}i="file"}else if(C.a.U(a6,"http",0)){if(r&&n+3===m&&C.a.U(a6,"80",n+1)){k-=3
d=m-3
l-=3
a6=C.a.aC(a6,n,m,"")
a5-=3
m=d}i="http"}else i=a4
else if(p===5&&C.a.U(a6,"https",0)){if(r&&n+4===m&&C.a.U(a6,"443",n+1)){k-=4
d=m-4
l-=4
a6=C.a.aC(a6,n,m,"")
a5-=3
m=d}i="https"}else i=a4
j=!0}}}else i=a4
if(j){if(a5<a6.length){a6=C.a.u(a6,0,a5)
p-=0
o-=0
n-=0
m-=0
l-=0
k-=0}return new P.fG(a6,p,o,n,m,l,k,i)}if(i==null)if(p>0)i=P.v5(a6,0,p)
else{if(p===0){P.d3(a6,0,"Invalid empty scheme")
H.bx(u.g)}i=""}if(o>0){c=p+3
b=c<o?P.v6(a6,c,o-1):""
a=P.v1(a6,o,n,!1)
r=n+1
if(r<m){a0=H.ow(C.a.u(a6,r,m),a4)
a1=P.v3(a0==null?H.a0(P.M("Invalid port",a6,r)):a0,i)}else a1=a4}else{a1=a4
a=a1
b=""}a2=P.v2(a6,m,l,a4,i,a!=null)
a3=l<k?P.v4(a6,l+1,k,a4):a4
return P.uX(i,b,a,a1,a2,a3,k<a5?P.v0(a6,k+1,a5):a4)},
uw:function(a,b,c){var s,r,q,p,o,n,m="IPv4 address should contain exactly 4 parts",l="each part must be in the range 0..255",k=new P.la(a),j=new Uint8Array(4)
for(s=b,r=s,q=0;s<c;++s){p=C.a.A(a,s)
if(p!==46){if((p^48)>9)k.$2("invalid character",s)}else{if(q===3)k.$2(m,s)
o=P.cA(C.a.u(a,r,s),null)
if(o>255)k.$2(l,r)
n=q+1
j[q]=o
r=s+1
q=n}}if(q!==3)k.$2(m,c)
o=P.cA(C.a.u(a,r,c),null)
if(o>255)k.$2(l,r)
j[q]=o
return j},
oH:function(a,b,c){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=new P.lb(a),d=new P.lc(e,a)
if(a.length<2)e.$1("address is too short")
s=H.a([],t.Z)
for(r=b,q=r,p=!1,o=!1;r<c;++r){n=C.a.A(a,r)
if(n===58){if(r===b){++r
if(C.a.A(a,r)!==58)e.$2("invalid start colon.",r)
q=r}if(r===q){if(p)e.$2("only one wildcard `::` is allowed",r)
s.push(-1)
p=!0}else s.push(d.$2(q,r))
q=r+1}else if(n===46)o=!0}if(s.length===0)e.$1("too few parts")
m=q===c
l=C.d.gaI(s)
if(m&&l!==-1)e.$2("expected a part after last `:`",c)
if(!m)if(!o)s.push(d.$2(q,c))
else{k=P.uw(a,q,c)
s.push((k[0]<<8|k[1])>>>0)
s.push((k[2]<<8|k[3])>>>0)}if(p){if(s.length>7)e.$1("an address with a wildcard must have less than 7 parts")}else if(s.length!==8)e.$1("an address without a wildcard must contain exactly 8 parts")
j=new Uint8Array(16)
for(l=s.length,i=9-l,r=0,h=0;r<l;++r){g=s[r]
if(g===-1)for(f=0;f<i;++f){j[h]=0
j[h+1]=0
h+=2}else{j[h]=C.c.ae(g,8)
j[h+1]=g&255
h+=2}}return j},
uX:function(a,b,c,d,e,f,g){return new P.ee(a,b,c,d,e,f,g)},
p_:function(a){if(a==="http")return 80
if(a==="https")return 443
return 0},
d3:function(a,b,c){throw H.d(P.M(c,a,b))},
v3:function(a,b){var s=P.p_(b)
if(a===s)return null
return a},
v1:function(a,b,c,d){var s,r,q,p,o,n
if(b===c)return""
if(C.a.A(a,b)===91){s=c-1
if(C.a.A(a,s)!==93){P.d3(a,b,"Missing end `]` to match `[` in host")
H.bx(u.g)}r=b+1
q=P.uZ(a,r,s)
if(q<s){p=q+1
o=P.p4(a,C.a.U(a,"25",p)?q+3:p,s,"%25")}else o=""
P.oH(a,r,q)
return C.a.u(a,b,q).toLowerCase()+o+"]"}for(n=b;n<c;++n)if(C.a.A(a,n)===58){q=C.a.b8(a,"%",b)
q=q>=b&&q<c?q:c
if(q<c){p=q+1
o=P.p4(a,C.a.U(a,"25",p)?q+3:p,c,"%25")}else o=""
P.oH(a,b,q)
return"["+C.a.u(a,b,q)+o+"]"}return P.v8(a,b,c)},
uZ:function(a,b,c){var s=C.a.b8(a,"%",b)
return s>=b&&s<c?s:c},
p4:function(a,b,c,d){var s,r,q,p,o,n,m,l,k,j,i=d!==""?new P.ab(d):null
for(s=b,r=s,q=!0;s<c;){p=C.a.A(a,s)
if(p===37){o=P.nf(a,s,!0)
n=o==null
if(n&&q){s+=3
continue}if(i==null)i=new P.ab("")
m=i.a+=C.a.u(a,r,s)
if(n)o=C.a.u(a,s,s+3)
else if(o==="%"){P.d3(a,s,"ZoneID should not contain % anymore")
H.bx(u.g)}i.a=m+o
s+=3
r=s
q=!0}else if(p<127&&(C.al[p>>>4]&1<<(p&15))!==0){if(q&&65<=p&&90>=p){if(i==null)i=new P.ab("")
if(r<s){i.a+=C.a.u(a,r,s)
r=s}q=!1}++s}else{if((p&64512)===55296&&s+1<c){l=C.a.A(a,s+1)
if((l&64512)===56320){p=(p&1023)<<10|l&1023|65536
k=2}else k=1}else k=1
j=C.a.u(a,r,s)
if(i==null){i=new P.ab("")
n=i}else n=i
n.a+=j
n.a+=P.ne(p)
s+=k
r=s}}if(i==null)return C.a.u(a,b,c)
if(r<c)i.a+=C.a.u(a,r,c)
n=i.a
return n.charCodeAt(0)==0?n:n},
v8:function(a,b,c){var s,r,q,p,o,n,m,l,k,j,i
for(s=b,r=s,q=null,p=!0;s<c;){o=C.a.A(a,s)
if(o===37){n=P.nf(a,s,!0)
m=n==null
if(m&&p){s+=3
continue}if(q==null)q=new P.ab("")
l=C.a.u(a,r,s)
k=q.a+=!p?l.toLowerCase():l
if(m){n=C.a.u(a,s,s+3)
j=3}else if(n==="%"){n="%25"
j=1}else j=3
q.a=k+n
s+=j
r=s
p=!0}else if(o<127&&(C.cU[o>>>4]&1<<(o&15))!==0){if(p&&65<=o&&90>=o){if(q==null)q=new P.ab("")
if(r<s){q.a+=C.a.u(a,r,s)
r=s}p=!1}++s}else if(o<=93&&(C.ad[o>>>4]&1<<(o&15))!==0){P.d3(a,s,"Invalid character")
H.bx(u.g)}else{if((o&64512)===55296&&s+1<c){i=C.a.A(a,s+1)
if((i&64512)===56320){o=(o&1023)<<10|i&1023|65536
j=2}else j=1}else j=1
l=C.a.u(a,r,s)
if(!p)l=l.toLowerCase()
if(q==null){q=new P.ab("")
m=q}else m=q
m.a+=l
m.a+=P.ne(o)
s+=j
r=s}}if(q==null)return C.a.u(a,b,c)
if(r<c){l=C.a.u(a,r,c)
q.a+=!p?l.toLowerCase():l}m=q.a
return m.charCodeAt(0)==0?m:m},
v5:function(a,b,c){var s,r,q,p=u.g
if(b===c)return""
if(!P.p1(C.a.I(a,b))){P.d3(a,b,"Scheme not starting with alphabetic character")
H.bx(p)}for(s=b,r=!1;s<c;++s){q=C.a.I(a,s)
if(!(q<128&&(C.aj[q>>>4]&1<<(q&15))!==0)){P.d3(a,s,"Illegal scheme character")
H.bx(p)}if(65<=q&&q<=90)r=!0}a=C.a.u(a,b,c)
return P.uY(r?a.toLowerCase():a)},
uY:function(a){if(a==="http")return"http"
if(a==="file")return"file"
if(a==="https")return"https"
if(a==="package")return"package"
return a},
v6:function(a,b,c){return P.ef(a,b,c,C.cy,!1)},
v2:function(a,b,c,d,e,f){var s=e==="file",r=s||f,q=P.ef(a,b,c,C.an,!0)
if(q.length===0){if(s)return"/"}else if(r&&!C.a.X(q,"/"))q="/"+q
return P.v7(q,e,f)},
v7:function(a,b,c){var s=b.length===0
if(s&&!c&&!C.a.X(a,"/"))return P.v9(a,!s||c)
return P.va(a)},
v4:function(a,b,c,d){return P.ef(a,b,c,C.y,!0)},
v0:function(a,b,c){return P.ef(a,b,c,C.y,!0)},
nf:function(a,b,c){var s,r,q,p,o,n=b+2
if(n>=a.length)return"%"
s=C.a.A(a,b+1)
r=C.a.A(a,n)
q=H.mv(s)
p=H.mv(r)
if(q<0||p<0)return"%"
o=q*16+p
if(o<127&&(C.al[C.c.ae(o,4)]&1<<(o&15))!==0)return H.bc(c&&65<=o&&90>=o?(o|32)>>>0:o)
if(s>=97||r>=97)return C.a.u(a,b,b+3).toUpperCase()
return null},
ne:function(a){var s,r,q,p,o,n="0123456789ABCDEF"
if(a<128){s=new Uint8Array(3)
s[0]=37
s[1]=C.a.I(n,a>>>4)
s[2]=C.a.I(n,a&15)}else{if(a>2047)if(a>65535){r=240
q=4}else{r=224
q=3}else{r=192
q=2}s=new Uint8Array(3*q)
for(p=0;--q,q>=0;r=128){o=C.c.dN(a,6*q)&63|r
s[p]=37
s[p+1]=C.a.I(n,o>>>4)
s[p+2]=C.a.I(n,o&15)
p+=3}}return P.oC(s,0,null)},
ef:function(a,b,c,d,e){var s=P.p3(a,b,c,d,e)
return s==null?C.a.u(a,b,c):s},
p3:function(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j=null
for(s=!e,r=b,q=r,p=j;r<c;){o=C.a.A(a,r)
if(o<127&&(d[o>>>4]&1<<(o&15))!==0)++r
else{if(o===37){n=P.nf(a,r,!1)
if(n==null){r+=3
continue}if("%"===n){n="%25"
m=1}else m=3}else if(s&&o<=93&&(C.ad[o>>>4]&1<<(o&15))!==0){P.d3(a,r,"Invalid character")
H.bx(u.g)
m=j
n=m}else{if((o&64512)===55296){l=r+1
if(l<c){k=C.a.A(a,l)
if((k&64512)===56320){o=(o&1023)<<10|k&1023|65536
m=2}else m=1}else m=1}else m=1
n=P.ne(o)}if(p==null){p=new P.ab("")
l=p}else l=p
l.a+=C.a.u(a,q,r)
l.a+=H.b(n)
r+=m
q=r}}if(p==null)return j
if(q<c)p.a+=C.a.u(a,q,c)
s=p.a
return s.charCodeAt(0)==0?s:s},
p2:function(a){if(C.a.X(a,"."))return!0
return C.a.bL(a,"/.")!==-1},
va:function(a){var s,r,q,p,o,n
if(!P.p2(a))return a
s=H.a([],t.s)
for(r=a.split("/"),q=r.length,p=!1,o=0;o<q;++o){n=r[o]
if(J.aA(n,"..")){if(s.length!==0){s.pop()
if(s.length===0)s.push("")}p=!0}else if("."===n)p=!0
else{s.push(n)
p=!1}}if(p)s.push("")
return C.d.cN(s,"/")},
v9:function(a,b){var s,r,q,p,o,n
if(!P.p2(a))return!b?P.p0(a):a
s=H.a([],t.s)
for(r=a.split("/"),q=r.length,p=!1,o=0;o<q;++o){n=r[o]
if(".."===n)if(s.length!==0&&C.d.gaI(s)!==".."){s.pop()
p=!0}else{s.push("..")
p=!1}else if("."===n)p=!0
else{s.push(n)
p=!1}}r=s.length
if(r!==0)r=r===1&&s[0].length===0
else r=!0
if(r)return"./"
if(p||C.d.gaI(s)==="..")s.push("")
if(!b)s[0]=P.p0(s[0])
return C.d.cN(s,"/")},
p0:function(a){var s,r,q=a.length
if(q>=2&&P.p1(J.rY(a,0)))for(s=1;s<q;++s){r=C.a.I(a,s)
if(r===58)return C.a.u(a,0,s)+"%3A"+C.a.bk(a,s+1)
if(r>127||(C.aj[r>>>4]&1<<(r&15))===0)break}return a},
v_:function(a,b){var s,r,q
for(s=0,r=0;r<2;++r){q=C.a.A(a,b+r)
if(48<=q&&q<=57)s=s*16+q-48
else{q|=32
if(97<=q&&q<=102)s=s*16+q-87
else throw H.d(P.T("Invalid URL encoding"))}}return s},
vb:function(a,b,c,d,e){var s,r,q,p,o=b
while(!0){if(!(o<c)){s=!0
break}r=C.a.A(a,o)
if(r<=127)if(r!==37)q=!1
else q=!0
else q=!0
if(q){s=!1
break}++o}if(s){if(C.a5!==d)q=!1
else q=!0
if(q)return C.a.u(a,b,c)
else p=new H.cE(C.a.u(a,b,c))}else{p=H.a([],t.Z)
for(q=a.length,o=b;o<c;++o){r=C.a.A(a,o)
if(r>127)throw H.d(P.T("Illegal percent encoding in URI"))
if(r===37){if(o+3>q)throw H.d(P.T("Truncated URI"))
p.push(P.v_(a,o+1))
o+=2}else p.push(r)}}return C.dX.dV(p)},
p1:function(a){var s=a|32
return 97<=s&&s<=122},
oF:function(a){var s
if(a.length>=5){s=P.pj(a,0)
if(s===0)return P.l9(a,5,null)
if(s===32)return P.l9(C.a.bk(a,5),0,null)}throw H.d(P.M("Does not start with 'data:'",a,0))},
l9:function(a,b,c){var s,r,q,p,o,n,m,l,k="Invalid MIME type",j=H.a([b-1],t.Z)
for(s=a.length,r=b,q=-1,p=null;r<s;++r){p=C.a.I(a,r)
if(p===44||p===59)break
if(p===47){if(q<0){q=r
continue}throw H.d(P.M(k,a,r))}}if(q<0&&r>b)throw H.d(P.M(k,a,r))
for(;p!==44;){j.push(r);++r
for(o=-1;r<s;++r){p=C.a.I(a,r)
if(p===61){if(o<0)o=r}else if(p===59||p===44)break}if(o>=0)j.push(o)
else{n=C.d.gaI(j)
if(p!==44||r!==n+7||!C.a.U(a,"base64",n+1))throw H.d(P.M("Expecting '='",a,r))
break}}j.push(r)
m=r+1
if((j.length&1)===1)a=C.b6.ed(a,m,s)
else{l=P.p3(a,m,s,C.y,!0)
if(l!=null)a=C.a.aC(a,m,s,l)}return new P.l8(a,j,c)},
vj:function(){var s,r,q,p,o,n="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~!$&'()*+,;=",m=".",l=":",k="/",j="?",i="#",h=H.a(new Array(22),t.gN)
for(s=0;s<22;++s)h[s]=new Uint8Array(96)
r=new P.ma(h)
q=new P.mb()
p=new P.mc()
o=r.$2(0,225)
q.$3(o,n,1)
q.$3(o,m,14)
q.$3(o,l,34)
q.$3(o,k,3)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(14,225)
q.$3(o,n,1)
q.$3(o,m,15)
q.$3(o,l,34)
q.$3(o,k,234)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(15,225)
q.$3(o,n,1)
q.$3(o,"%",225)
q.$3(o,l,34)
q.$3(o,k,9)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(1,225)
q.$3(o,n,1)
q.$3(o,l,34)
q.$3(o,k,10)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(2,235)
q.$3(o,n,139)
q.$3(o,k,131)
q.$3(o,m,146)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(3,235)
q.$3(o,n,11)
q.$3(o,k,68)
q.$3(o,m,18)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(4,229)
q.$3(o,n,5)
p.$3(o,"AZ",229)
q.$3(o,l,102)
q.$3(o,"@",68)
q.$3(o,"[",232)
q.$3(o,k,138)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(5,229)
q.$3(o,n,5)
p.$3(o,"AZ",229)
q.$3(o,l,102)
q.$3(o,"@",68)
q.$3(o,k,138)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(6,231)
p.$3(o,"19",7)
q.$3(o,"@",68)
q.$3(o,k,138)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(7,231)
p.$3(o,"09",7)
q.$3(o,"@",68)
q.$3(o,k,138)
q.$3(o,j,172)
q.$3(o,i,205)
q.$3(r.$2(8,8),"]",5)
o=r.$2(9,235)
q.$3(o,n,11)
q.$3(o,m,16)
q.$3(o,k,234)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(16,235)
q.$3(o,n,11)
q.$3(o,m,17)
q.$3(o,k,234)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(17,235)
q.$3(o,n,11)
q.$3(o,k,9)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(10,235)
q.$3(o,n,11)
q.$3(o,m,18)
q.$3(o,k,234)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(18,235)
q.$3(o,n,11)
q.$3(o,m,19)
q.$3(o,k,234)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(19,235)
q.$3(o,n,11)
q.$3(o,k,234)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(11,235)
q.$3(o,n,11)
q.$3(o,k,10)
q.$3(o,j,172)
q.$3(o,i,205)
o=r.$2(12,236)
q.$3(o,n,12)
q.$3(o,j,12)
q.$3(o,i,205)
o=r.$2(13,237)
q.$3(o,n,13)
q.$3(o,j,13)
p.$3(r.$2(20,245),"az",21)
o=r.$2(21,245)
p.$3(o,"az",21)
p.$3(o,"09",21)
q.$3(o,"+-.",21)
return h},
ph:function(a,b,c,d,e){var s,r,q,p,o=$.rU()
for(s=b;s<c;++s){r=o[d]
q=C.a.I(a,s)^96
p=r[q>95?31:q]
d=p&31
e[p>>>5]=s}return d},
pj:function(a,b){return((C.a.I(a,b+4)^58)*3|C.a.I(a,b)^100|C.a.I(a,b+1)^97|C.a.I(a,b+2)^116|C.a.I(a,b+3)^97)>>>0},
jL:function jL(a,b){this.a=a
this.b=b},
df:function df(a,b){this.a=a
this.b=b},
F:function F(){},
ey:function ey(a){this.a=a},
fi:function fi(){},
f5:function f5(){},
ao:function ao(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
dC:function dC(a,b,c,d,e,f){var _=this
_.e=a
_.f=b
_.a=c
_.b=d
_.c=e
_.d=f},
eL:function eL(a,b,c,d,e){var _=this
_.f=a
_.a=b
_.b=c
_.c=d
_.d=e},
f2:function f2(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
fo:function fo(a){this.a=a},
fj:function fj(a){this.a=a},
bC:function bC(a){this.a=a},
eE:function eE(a){this.a=a},
f7:function f7(){},
dE:function dE(){},
eG:function eG(a){this.a=a},
dP:function dP(a){this.a=a},
aH:function aH(a,b,c){this.a=a
this.b=b
this.c=c},
j:function j(){},
dR:function dR(a,b,c){this.a=a
this.b=b
this.$ti=c},
J:function J(){},
cN:function cN(a,b,c){this.a=a
this.b=b
this.$ti=c},
k:function k(){},
e:function e(){},
fI:function fI(){},
ab:function ab(a){this.a=a},
la:function la(a){this.a=a},
lb:function lb(a){this.a=a},
lc:function lc(a,b){this.a=a
this.b=b},
ee:function ee(a,b,c,d,e,f,g){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.z=_.x=$},
l8:function l8(a,b,c){this.a=a
this.b=b
this.c=c},
ma:function ma(a){this.a=a},
mb:function mb(){},
mc:function mc(){},
fG:function fG(a,b,c,d,e,f,g,h){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.x=h
_.y=null},
fx:function fx(a,b,c,d,e,f,g){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.z=_.x=$},
nq:function(a){if(!t.I.b(a)&&!t.j.b(a))throw H.d(P.T("object must be a Map or Iterable"))
return P.vi(a)},
vi:function(a){var s=new P.m8(new P.dV(t.aH)).$1(a)
s.toString
return s},
m8:function m8(a){this.a=a},
vh:function(a){var s,r=a.$dart_jsFunction
if(r!=null)return r
s=function(b,c){return function(){return b(c,Array.prototype.slice.apply(arguments))}}(P.vg,a)
s[$.nu()]=a
a.$dart_jsFunction=s
return s},
vg:function(a,b){return H.ui(a,b,null)},
cy:function(a){if(typeof a=="function")return a
else return P.vh(a)}},M={
tg:function(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f="byteOffset",e=null,d="normalized"
F.t(a,C.cH,b)
s=F.R(a,"bufferView",b,!1)
if(s===-1){r=a.w(f)
if(r)b.l($.cC(),H.a(["bufferView"],t.M),f)
q=0}else q=F.Y(a,f,b,0,e,-1,0,!1)
p=F.Y(a,"componentType",b,-1,C.cf,-1,0,!0)
o=F.Y(a,"count",b,-1,e,-1,1,!0)
n=F.H(a,"type",b,e,C.m.gL(),e,!0)
m=F.pp(a,d,b)
if(n!=null&&p!==-1){l=C.m.j(0,n)
if(l!=null)if(p===5126){r=t.V
k=F.ad(a,"min",b,e,H.a([l],r),1/0,-1/0,!0)
j=F.ad(a,"max",b,e,H.a([l],r),1/0,-1/0,!0)}else{k=F.pq(a,"min",b,p,l)
j=F.pq(a,"max",b,p,l)}else{k=e
j=k}}else{k=e
j=k}i=F.S(a,"sparse",b,M.vS(),!1)
if(m)r=p===5126||p===5125
else r=!1
if(r)b.p($.r0(),d)
if((n==="MAT2"||n==="MAT3"||n==="MAT4")&&q!==-1&&(q&3)!==0)b.p($.r_(),f)
switch(p){case 5120:case 5121:case 5122:case 5123:case 5125:r=t.w
r.a(j)
r.a(k)
F.H(a,"name",b,e,e,e,!1)
r=F.q(a,C.M,b,e)
h=F.r(a,b)
g=new M.fs(s,q,p,o,n,m,j,k,i,Z.b0(p),r,h,!1)
if(k!=null){r=b.O()
h=t.e
b.Y(g,new M.eW(P.P(k.length,0,!1,h),P.P(k.length,0,!1,h),J.fY(k,!1),r))}if(j!=null){r=b.O()
h=t.e
b.Y(g,new M.eU(P.P(j.length,0,!1,h),P.P(j.length,0,!1,h),J.fY(j,!1),r))}break
default:r=t.fy
r.a(j)
r.a(k)
F.H(a,"name",b,e,e,e,!1)
r=F.q(a,C.M,b,e)
h=F.r(a,b)
g=new M.fr(s,q,p,o,n,m,j,k,i,Z.b0(p),r,h,!1)
b.Y(g,new M.eO(b.O()))
if(k!=null){r=b.O()
b.Y(g,new M.eV(P.P(k.length,0,!1,t.e),P.P(k.length,0,!1,t.F),J.fY(k,!1),r))}if(j!=null){r=b.O()
b.Y(g,new M.eT(P.P(j.length,0,!1,t.e),P.P(j.length,0,!1,t.F),J.fY(j,!1),r))}break}return g},
bo:function(a,b,c,d,e,f){var s,r,q="byteOffset"
if(a===-1)return!1
if(a%b!==0)if(f!=null)f.l($.r1(),H.a([a,b],t.M),q)
else return!1
s=d.y
if(s===-1)return!1
r=s+a
if(r%b!==0)if(f!=null)f.D($.qo(),H.a([r,b],t.M))
else return!1
s=d.z
if(a>s)if(f!=null)f.l($.nB(),H.a([a,c,e,s],t.M),q)
else return!1
else if(a+c>s)if(f!=null)f.D($.nB(),H.a([a,c,e,s],t.M))
else return!1
return!0},
mX:function(a,b,c,d){var s=b.byteLength,r=Z.b0(a)
if(s<c+r*d)return null
switch(a){case 5121:return H.n4(b,c,d)
case 5123:return H.ok(b,c,d)
case 5125:return H.ol(b,c,d)
default:return null}},
nW:function(a,b,c,d){var s=b.byteLength,r=Z.b0(a)
if(s<c+r*d)return null
switch(a){case 5126:H.d5(b,c,d)
s=new Float32Array(b,c,d)
return s
default:return null}},
nX:function(a,b,c,d){var s=b.byteLength,r=Z.b0(a)
if(s<c+r*d)return null
switch(a){case 5120:H.d5(b,c,d)
s=new Int8Array(b,c,d)
return s
case 5121:return H.n4(b,c,d)
case 5122:H.d5(b,c,d)
s=new Int16Array(b,c,d)
return s
case 5123:return H.ok(b,c,d)
case 5125:return H.ol(b,c,d)
default:return null}},
tf:function(a,b){var s,r,q
F.t(a,C.cr,b)
s=F.Y(a,"count",b,-1,null,-1,1,!0)
r=F.S(a,"indices",b,M.vQ(),!0)
q=F.S(a,"values",b,M.vR(),!0)
if(s===-1||r==null||q==null)return null
return new M.bT(s,r,q,F.q(a,C.du,b,null),F.r(a,b),!1)},
td:function(a,b){F.t(a,C.ck,b)
return new M.bU(F.R(a,"bufferView",b,!0),F.Y(a,"byteOffset",b,0,null,-1,0,!1),F.Y(a,"componentType",b,-1,C.c1,-1,0,!0),F.q(a,C.ds,b,null),F.r(a,b),!1)},
te:function(a,b){F.t(a,C.cn,b)
return new M.bV(F.R(a,"bufferView",b,!0),F.Y(a,"byteOffset",b,0,null,-1,0,!1),F.q(a,C.dt,b,null),F.r(a,b),!1)},
a2:function a2(){},
fs:function fs(a,b,c,d,e,f,g,h,i,j,k,l,m){var _=this
_.x=a
_.y=b
_.z=c
_.Q=d
_.ch=e
_.cx=f
_.cy=g
_.db=h
_.dx=i
_.dy=j
_.fr=null
_.fx=0
_.k2=_.k1=null
_.a=k
_.b=l
_.a$=m},
lu:function lu(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
lv:function lv(a){this.a=a},
lw:function lw(){},
lx:function lx(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
ls:function ls(a){this.a=a},
lt:function lt(a){this.a=a},
fr:function fr(a,b,c,d,e,f,g,h,i,j,k,l,m){var _=this
_.x=a
_.y=b
_.z=c
_.Q=d
_.ch=e
_.cx=f
_.cy=g
_.db=h
_.dx=i
_.dy=j
_.fr=null
_.fx=0
_.k2=_.k1=null
_.a=k
_.b=l
_.a$=m},
lo:function lo(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
lp:function lp(a){this.a=a},
lq:function lq(){},
lr:function lr(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
bT:function bT(a,b,c,d,e,f){var _=this
_.d=a
_.e=b
_.f=c
_.a=d
_.b=e
_.a$=f},
bU:function bU(a,b,c,d,e,f){var _=this
_.d=a
_.e=b
_.f=c
_.r=null
_.a=d
_.b=e
_.a$=f},
bV:function bV(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
eO:function eO(a){this.a=a},
eV:function eV(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
eT:function eT(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
eW:function eW(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
eU:function eU(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
oJ:function(a,b,c){var s=P.aM(t.X),r=b==null?0:b
if(a!=null)s.H(0,a)
return new M.lh(r,s,c)},
tz:function(){return new H.aa(C.ai,new M.ha(),t.gw)},
ty:function(a){var s,r,q,p,o=t.i,n=H.a([],o),m=t._,l=H.a([],t.d6),k=P.a8(t.al,t.f9),j=H.a([],o),i=H.a([],o),h=H.a([],t.fh),g=H.a([],t.a9)
o=H.a(["image/jpeg","image/png"],o)
s=t.aD
r=t.X
q=t.cn
p=P.n2(["POSITION",P.ba([C.l],s),"NORMAL",P.ba([C.l],s),"TANGENT",P.ba([C.u],s),"TEXCOORD",P.ba([C.aW,C.aR,C.aV],s),"COLOR",P.ba([C.l,C.T,C.V,C.u,C.E,C.F],s),"JOINTS",P.ba([C.aZ,C.b_],s),"WEIGHTS",P.ba([C.u,C.E,C.F],s)],r,q)
q=P.n2(["POSITION",P.ba([C.l],s),"NORMAL",P.ba([C.l],s),"TANGENT",P.ba([C.l],s)],r,q)
s=a==null?M.oJ(null,null,null):a
q=new M.i(s,n,P.a8(t.W,t.b7),P.a8(m,m),P.a8(t.f7,t.an),l,P.a8(t.v,t.gz),P.a8(t.b5,t.eG),k,j,i,h,P.aM(t.af),g,new P.ab(""),o,p,q)
p=t.em
q.dx=new P.aY(i,p)
q.cy=new P.aY(j,p)
q.ch=new P.bg(k,t.f8)
q.fr=new P.aY(h,t.go)
return q},
lh:function lh(a,b,c){this.a=a
this.b=b
this.c=c},
i:function i(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r){var _=this
_.b=a
_.c=b
_.d=c
_.e=d
_.f=e
_.r=f
_.x=g
_.y=h
_.z=!1
_.Q=i
_.ch=null
_.cx=j
_.cy=null
_.db=k
_.dx=null
_.dy=l
_.fr=null
_.fx=m
_.fy=n
_.go=o
_.id=!1
_.k1=p
_.k2=q
_.k3=r},
ha:function ha(){},
h9:function h9(){},
hb:function hb(){},
he:function he(a){this.a=a},
hf:function hf(a){this.a=a},
hc:function hc(a){this.a=a},
hd:function hd(){},
hg:function hg(a,b){this.a=a
this.b=b},
c8:function c8(){}},Z={
ti:function(a,b){var s,r,q,p,o,n,m,l,k,j=null,i="channels",h="samplers"
F.t(a,C.cp,b)
s=F.eu(a,i,b)
if(s!=null){r=s.gi(s)
q=P.P(r,j,!1,t.aA)
p=new F.D(q,r,i,t.eq)
r=b.c
r.push(i)
for(o=0;o<s.gi(s);++o){n=s.j(0,o)
r.push(C.c.k(o))
F.t(n,C.d_,b)
q[o]=new Z.b1(F.R(n,"sampler",b,!0),F.S(n,"target",b,Z.vU(),!0),F.q(n,C.dw,b,j),F.r(n,b),!1)
r.pop()}r.pop()}else p=j
m=F.eu(a,h,b)
if(m!=null){r=m.gi(m)
q=P.P(r,j,!1,t.gW)
l=new F.D(q,r,h,t.az)
r=b.c
r.push(h)
for(o=0;o<m.gi(m);++o){k=m.j(0,o)
r.push(C.c.k(o))
F.t(k,C.cE,b)
q[o]=new Z.b2(F.R(k,"input",b,!0),F.H(k,"interpolation",b,"LINEAR",C.cb,j,!1),F.R(k,"output",b,!0),F.q(k,C.dx,b,j),F.r(k,b),!1)
r.pop()}r.pop()}else l=j
F.H(a,"name",b,j,j,j,!1)
return new Z.bp(p,l,F.q(a,C.as,b,j),F.r(a,b),!1)},
th:function(a,b){F.t(a,C.cM,b)
return new Z.bX(F.R(a,"node",b,!1),F.H(a,"path",b,null,C.ao,null,!0),F.q(a,C.dv,b,null),F.r(a,b),!1)},
bp:function bp(a,b,c,d,e){var _=this
_.x=a
_.y=b
_.a=c
_.b=d
_.a$=e},
fZ:function fZ(a,b){this.a=a
this.b=b},
h_:function h_(a,b,c){this.a=a
this.b=b
this.c=c},
b1:function b1(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
bX:function bX(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
b2:function b2(a,b,c,d,e,f){var _=this
_.d=a
_.e=b
_.f=c
_.x=_.r=null
_.a=d
_.b=e
_.a$=f},
ex:function ex(a){this.a=0
this.b=a},
dB:function dB(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.e=_.d=0
_.$ti=d},
b0:function(a){switch(a){case 5120:case 5121:return 1
case 5122:case 5123:return 2
case 5124:case 5125:case 5126:return 4
default:return-1}},
wR:function(a){switch(a){case 5121:case 5123:case 5125:return 0
case 5120:return-128
case 5122:return-32768
case 5124:return-2147483648
default:throw H.d(P.T(null))}},
pF:function(a){switch(a){case 5120:return 127
case 5121:return 255
case 5122:return 32767
case 5123:return 65535
case 5124:return 2147483647
case 5125:return 4294967295
default:throw H.d(P.T(null))}}},T={
tj:function(a,b){var s,r,q,p,o=null,n="minVersion"
F.t(a,C.cm,b)
F.H(a,"copyright",b,o,o,o,!1)
s=F.H(a,"generator",b,o,o,o,!1)
r=$.bl()
q=F.H(a,"version",b,o,o,r,!0)
r=F.H(a,n,b,o,o,r,!1)
p=new T.bq(s,q,r,F.q(a,C.dy,b,o),F.r(a,b),!1)
s=r!=null&&q!=null
if(s){if(p.gcP()<=p.gb9())s=p.gcP()===p.gb9()&&p.gec()>p.gbP()
else s=!0
if(s)b.l($.rl(),H.a([r,q],t.M),n)}return p},
bq:function bq(a,b,c,d,e,f){var _=this
_.e=a
_.f=b
_.r=c
_.a=d
_.b=e
_.a$=f},
tJ:function(a,b){var s,r,q,p,o,n,m,l,k,j,i="bufferView",h=null
F.t(a,C.co,b)
p=F.R(a,i,b,!1)
o=b.k1
n=F.H(a,"mimeType",b,h,o,h,!1)
s=F.H(a,"uri",b,h,h,h,!1)
m=p===-1
l=!m
if(l&&n==null)b.l($.cC(),H.a(["mimeType"],t.M),i)
if(!(l&&s!=null))m=m&&s==null
else m=!0
if(m)b.D($.nK(),H.a(["bufferView","uri"],t.M))
r=null
if(s!=null){q=null
try{q=P.oF(s)}catch(k){if(H.G(k) instanceof P.aH)r=F.pu(s,b)
else throw k}if(q!=null){if(b.id)b.p($.nA(),"uri")
j=q.cD()
if(n==null){m=C.d.E(o,q.gaA())
if(!m)b.l($.nL(),H.a([q.gaA(),o],t.M),"uri")
n=q.gaA()}}else j=h}else j=h
o=r
F.H(a,"name",b,h,h,h,!1)
return new T.aQ(p,n,o,j,F.q(a,C.au,b,h),F.r(a,b),!1)},
aQ:function aQ(a,b,c,d,e,f,g){var _=this
_.x=a
_.y=b
_.z=c
_.Q=d
_.cx=_.ch=null
_.a=e
_.b=f
_.a$=g},
up:function(a,b){var s=null
F.t(a,C.cV,b)
F.Y(a,"magFilter",b,-1,C.c4,-1,0,!1)
F.Y(a,"minFilter",b,-1,C.c7,-1,0,!1)
F.Y(a,"wrapS",b,10497,C.ae,-1,0,!1)
F.Y(a,"wrapT",b,10497,C.ae,-1,0,!1)
F.H(a,"name",b,s,s,s,!1)
return new T.by(F.q(a,C.dV,b,s),F.r(a,b),!1)},
by:function by(a,b,c){this.a=a
this.b=b
this.a$=c},
u5:function(){return new T.cO(new Float32Array(16))},
um:function(){return new T.fa(new Float32Array(4))},
oL:function(a){var s=new Float32Array(3)
s[2]=a[2]
s[1]=a[1]
s[0]=a[0]
return new T.cu(s)},
oK:function(){return new T.cu(new Float32Array(3))},
eS:function eS(a){this.a=a},
cO:function cO(a){this.a=a},
fa:function fa(a){this.a=a},
cu:function cu(a){this.a=a},
fq:function fq(a){this.a=a}},Q={
to:function(a,b){var s,r,q,p,o,n,m,l,k,j="byteLength",i=null,h="uri"
F.t(a,C.d1,b)
p=F.Y(a,j,b,-1,i,-1,1,!0)
s=null
o=a.w(h)
if(o){r=F.H(a,h,b,i,i,i,!1)
if(r!=null){q=null
try{q=P.oF(r)}catch(n){if(H.G(n) instanceof P.aH)s=F.pu(r,b)
else throw n}if(q!=null){if(b.id)b.p($.nA(),h)
if(q.gaA()==="application/octet-stream"||q.gaA()==="application/gltf-buffer")m=q.cD()
else{b.l($.r4(),H.a([q.gaA()],t.M),h)
m=i}}else m=i
if(m!=null&&p!==-1&&m.length!==p){l=$.q_()
k=m.length
b.l(l,H.a([k,p],t.M),j)
p=k}}else m=i}else m=i
l=s
F.H(a,"name",b,i,i,i,!1)
return new Q.aP(l,p,o,m,F.q(a,C.dz,b,i),F.r(a,b),!1)},
aP:function aP(a,b,c,d,e,f,g){var _=this
_.x=a
_.y=b
_.z=c
_.Q=d
_.a=e
_.b=f
_.a$=g},
wC:function(){var s=new Q.mL()
J.t5(self.exports,P.cy(new Q.mH(s)))
J.t6(self.exports,P.cy(new Q.mI(s)))
J.t7(self.exports,P.cy(new Q.mJ()))
J.t4(self.exports,P.cy(new Q.mK()))},
fT:function(a,b){return Q.wT(a,b)},
wT:function(a,b){var s=0,r=P.eq(t.t),q,p=2,o,n=[],m,l,k,j,i,h
var $async$fT=P.es(function(c,d){if(c===1){o=d
s=p}while(true)switch(s){case 0:if(!t.a.b(a))throw H.d(P.T("data: Argument must be a Uint8Array."))
j=Q.p7(b)
m=Q.pb(j)
l=null
p=4
s=7
return P.d4(K.tG(P.n5(H.a([a],t.f),t.w),m),$async$fT)
case 7:k=d
s=8
return P.d4(k.bV(),$async$fT)
case 8:l=d
p=2
s=6
break
case 4:p=3
h=o
if(H.G(h) instanceof K.dl)throw h
else throw h
s=6
break
case 3:s=2
break
case 6:q=Q.fR(j,m,l)
s=1
break
case 1:return P.ek(q,r)
case 2:return P.ej(o,r)}})
return P.el($async$fT,r)},
nt:function(a,b){var s=0,r=P.eq(t.t),q,p,o
var $async$nt=P.es(function(c,d){if(c===1)return P.ej(d,r)
while(true)switch(s){case 0:if(typeof a!="string")throw H.d(P.T("json: Argument must be a string."))
p=Q.p7(b)
o=Q.pb(p)
q=Q.fR(p,o,K.tF(a,o))
s=1
break
case 1:return P.ek(q,r)}})
return P.el($async$nt,r)},
p7:function(a){var s
if(a!=null)s=typeof a=="number"||H.en(a)||typeof a=="string"||t.l.b(a)
else s=!1
if(s)throw H.d(P.T("options: Value must be an object."))
return t.bv.a(a)},
fR:function(a,b,c){var s=0,r=P.eq(t.t),q,p,o,n,m
var $async$fR=P.es(function(d,e){if(d===1)return P.ej(e,r)
while(true)switch(s){case 0:m=a==null
if(!m){p=J.bj(a)
o=Q.vp(p.gbe(a))
if(p.gbF(a)!=null&&!t.b1.b(p.gbF(a)))throw H.d(P.T("options.externalResourceFunction: Value must be a function."))
else n=p.gbF(a)
if(p.gc1(a)!=null&&!H.en(p.gc1(a)))throw H.d(P.T("options.writeTimestamp: Value must be a boolean."))}else{o=null
n=null}s=(c==null?null:c.b)!=null?3:4
break
case 3:s=5
return P.d4(Q.vo(b,c,n).aK(),$async$fR)
case 5:case 4:m=m?null:J.t0(a)
q=new A.li(o,b,c,m==null?!0:m).bd()
s=1
break
case 1:return P.ek(q,r)}})
return P.el($async$fR,r)},
vp:function(a){var s,r,q
if(a!=null)if(typeof a=="string")try{r=P.oG(a)
return r}catch(q){r=H.G(q)
if(r instanceof P.aH){s=r
throw H.d(P.T("options.uri: "+H.b(s)+"."))}else throw q}else throw H.d(P.T("options.uri: Value must be a string."))
return null},
pb:function(a){var s,r,q,p,o,n,m,l,k
if(a!=null){s=J.bj(a)
if(s.gba(a)!=null)r=!H.aO(s.gba(a))||s.gba(a)<0
else r=!1
if(r)throw H.d(P.T("options.maxIssues: Value must be a non-negative integer."))
if(s.gb7(a)!=null){if(!t.l.b(s.gb7(a)))throw H.d(P.T("options.ignoredIssues: Value must be an array."))
q=H.a([],t.i)
for(p=0;p<J.Z(s.gb7(a));++p){o=J.nS(s.gb7(a),p)
if(typeof o=="string"&&o.length!==0)q.push(o)
else throw H.d(P.T("options.ignoredIssues["+p+"]: Value must be a non-empty String."))}}else q=null
if(s.gaj(a)!=null){if(typeof s.gaj(a)=="number"||H.en(s.gaj(a))||typeof s.gaj(a)=="string"||t.l.b(s.gaj(a)))throw H.d(P.T("options.severityOverrides: Value must be an object."))
r=t.X
n=P.a8(r,t.dz)
for(r=J.mW(self.Object.keys(s.gaj(a)),r),r=new H.a9(r,r.gi(r),H.A(r).h("a9<n.E>"));r.n();){m=r.d
l=s.gaj(a)[m]
if(H.aO(l)&&l>=0&&l<=3)n.m(0,m,C.cT[l])
else throw H.d(P.T('options.severityOverrides["'+H.b(m)+'"]: Value must be one of [0, 1, 2, 3].'))}}else n=null
k=M.oJ(q,s.gba(a),n)}else k=null
return M.ty(k)},
vo:function(a,b,c){var s=new Q.mf(c),r=new P.dP("options.externalResourceFunction is required to load this resource.")
return new N.jU(b.b,a,new Q.md(a,b,c,s,r),new Q.me(c,s,r))},
bd:function bd(){},
hQ:function hQ(){},
cZ:function cZ(){},
mL:function mL(){},
mH:function mH(a){this.a=a},
mG:function mG(a,b,c){this.a=a
this.b=b
this.c=c},
mD:function mD(a){this.a=a},
mE:function mE(a,b){this.a=a
this.b=b},
mI:function mI(a){this.a=a},
mF:function mF(a,b,c){this.a=a
this.b=b
this.c=c},
mB:function mB(a){this.a=a},
mC:function mC(a,b){this.a=a
this.b=b},
mJ:function mJ(){},
mK:function mK(){},
mf:function mf(a){this.a=a},
mg:function mg(a){this.a=a},
mh:function mh(a){this.a=a},
md:function md(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
me:function me(a,b,c){this.a=a
this.b=b
this.c=c},
f3:function f3(a){this.a=a}},V={
tn:function(a,b){var s,r,q,p,o,n=null,m="byteStride"
F.t(a,C.ca,b)
s=F.Y(a,"byteLength",b,-1,n,-1,1,!0)
r=F.Y(a,m,b,-1,n,252,4,!1)
q=F.Y(a,"target",b,-1,C.bZ,-1,0,!1)
if(r!==-1){if(s!==-1&&r>s)b.l($.r5(),H.a([r,s],t.M),m)
if(r%4!==0)b.l($.qZ(),H.a([r,4],t.M),m)
if(q===34963)b.p($.mT(),m)}p=F.R(a,"buffer",b,!0)
o=F.Y(a,"byteOffset",b,0,n,-1,0,!1)
F.H(a,"name",b,n,n,n,!1)
return new V.br(p,o,s,r,q,F.q(a,C.at,b,n),F.r(a,b),!1)},
br:function br(a,b,c,d,e,f,g,h){var _=this
_.x=a
_.y=b
_.z=c
_.Q=d
_.ch=e
_.cy=_.cx=null
_.db=-1
_.a=f
_.b=g
_.a$=h},
o6:function(b9,c0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5="extensionsRequired",b6="extensionsUsed",b7=null,b8=new V.ik(c0)
b8.$0()
F.t(b9,C.d6,c0)
if(b9.w(b5)&&!b9.w(b6))c0.l($.cC(),H.a(["extensionsUsed"],t.M),b5)
s=F.pr(b9,b6,c0)
if(s==null)s=H.a([],t.i)
r=F.pr(b9,b5,c0)
if(r==null)r=H.a([],t.i)
c0.e6(s,r)
q=new V.il(b9,b8,c0)
p=new V.im(b8,b9,c0).$1$3$req("asset",T.vW(),!0,t.gP)
if((p==null?b7:p.f)==null)return b7
else if(p.gb9()!==2){o=$.rA()
n=p.gb9()
c0.l(o,H.a([n],t.M),"version")
return b7}else if(p.gbP()>0){o=$.rB()
n=p.gbP()
c0.l(o,H.a([n],t.M),"version")}m=q.$1$2("accessors",M.vT(),t.W)
l=q.$1$2("animations",Z.vV(),t.bj)
k=q.$1$2("buffers",Q.w0(),t.cT)
j=q.$1$2("bufferViews",V.w1(),t.v)
i=q.$1$2("cameras",G.w4(),t.h2)
h=q.$1$2("images",T.wh(),t.ec)
g=q.$1$2("materials",Y.wE(),t.fC)
f=q.$1$2("meshes",S.wH(),t.eM)
o=t.L
e=q.$1$2("nodes",V.wI(),o)
d=q.$1$2("samplers",T.wJ(),t.c2)
c=q.$1$2("scenes",B.wK(),t.bn)
b8.$0()
b=F.R(b9,"scene",c0,!1)
a=c.j(0,b)
n=b!==-1&&a==null
if(n)c0.l($.L(),H.a([b],t.M),"scene")
a0=q.$1$2("skins",O.wL(),t.aV)
a1=q.$1$2("textures",U.wN(),t.ai)
b8.$0()
a2=F.q(b9,C.N,c0,b7)
b8.$0()
a3=new V.dk(s,r,m,l,p,k,j,i,h,g,f,e,d,a,a0,a1,a2,F.r(b9,c0),!1)
a4=new V.ii(c0,a3)
a4.$2(j,C.at)
a4.$2(m,C.M)
a4.$2(h,C.au)
a4.$2(a1,C.P)
a4.$2(g,C.h)
a4.$2(f,C.aw)
a4.$2(e,C.O)
a4.$2(a0,C.aA)
a4.$2(l,C.as)
a4.$2(c,C.az)
if(a2.a!==0){n=c0.c
n.push("extensions")
a2.K(0,new V.ig(c0,a3))
n.pop()}n=c0.c
n.push("nodes")
e.a2(new V.ih(c0,P.aM(o)))
n.pop()
a5=[m,k,j,i,h,g,f,e,d,a0,a1]
for(a6=0;a6<11;++a6){a7=a5[a6]
if(a7.gi(a7)===0)continue
n.push(a7.c)
for(o=a7.b,a8=a7.a,a9=a8.length,b0=0;b0<o;++b0){b1=b0>=a9
b1=b1?b7:a8[b0]
if((b1==null?b7:b1.a$)===!1)c0.V($.fV(),b0)}n.pop()}o=c0.y
if(o.a!==0){for(a8=new H.at(o,H.A(o).h("at<1>")),a8=a8.gC(a8);a8.n();){a9=a8.d
if(a9.gi(a9)===0)continue
b2=o.j(0,a9)
C.d.si(n,0)
C.d.H(n,b2)
for(b1=a9.b,a9=a9.a,b3=a9.length,b0=0;b0<b1;++b0){b4=b0>=b3
b4=b4?b7:a9[b0]
if((b4==null?b7:b4.a$)===!1)c0.V($.fV(),b0)}}C.d.si(n,0)}return a3},
dk:function dk(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s){var _=this
_.d=a
_.e=b
_.f=c
_.r=d
_.x=e
_.y=f
_.z=g
_.Q=h
_.ch=i
_.cx=j
_.cy=k
_.db=l
_.dx=m
_.dy=n
_.fx=o
_.fy=p
_.a=q
_.b=r
_.a$=s},
ik:function ik(a){this.a=a},
il:function il(a,b,c){this.a=a
this.b=b
this.c=c},
im:function im(a,b,c){this.a=a
this.b=b
this.c=c},
ii:function ii(a,b){this.a=a
this.b=b},
ij:function ij(a,b){this.a=a
this.b=b},
ig:function ig(a,b){this.a=a
this.b=b},
ih:function ih(a,b){this.a=a
this.b=b},
id:function id(){},
ie:function ie(){},
io:function io(a,b){this.a=a
this.b=b},
ip:function ip(a,b){this.a=a
this.b=b},
fp:function fp(){},
l:function l(){},
eH:function eH(){},
fB:function fB(){},
dc:function(a){return new V.x(a.ch,a.z,a.cx)},
bY:function bY(a){this.a=a},
bW:function bW(a){this.a=a},
x:function x(a,b,c){this.a=a
this.b=b
this.c=c},
uc:function(b4,b5){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0=null,b1="matrix",b2="translation",b3="rotation"
F.t(b4,C.c6,b5)
if(b4.w(b1)){s=F.ad(b4,b1,b5,b0,C.bS,1/0,-1/0,!1)
if(s!=null){r=new Float32Array(16)
q=new T.cO(r)
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
if(b4.w(b2)){a=F.ad(b4,b2,b5,b0,C.k,1/0,-1/0,!1)
a0=a!=null?T.oL(a):b0}else a0=b0
if(b4.w(b3)){a1=F.ad(b4,b3,b5,b0,C.K,1,-1,!1)
if(a1!=null){r=a1[0]
p=a1[1]
o=a1[2]
n=a1[3]
m=new Float32Array(4)
a2=new T.fa(m)
m[0]=r
m[1]=p
m[2]=o
m[3]=n
r=Math.sqrt(a2.gaJ())
if(Math.abs(1-r)>0.00769)b5.p($.rx(),b3)}else a2=b0}else a2=b0
if(b4.w("scale")){a3=F.ad(b4,"scale",b5,b0,C.k,1/0,-1/0,!1)
a4=a3!=null?T.oL(a3):b0}else a4=b0
a5=F.R(b4,"camera",b5,!1)
a6=F.mp(b4,"children",b5,!1)
a7=F.R(b4,"mesh",b5,!1)
a8=F.R(b4,"skin",b5,!1)
a9=F.ad(b4,"weights",b5,b0,b0,1/0,-1/0,!1)
if(a7===-1){if(a8!==-1)b5.l($.cC(),H.a(["mesh"],t.M),"skin")
if(a9!=null)b5.l($.cC(),H.a(["mesh"],t.M),"weights")}if(q!=null){if(a0!=null||a2!=null||a4!=null)b5.p($.rp(),b1)
if(q.cM())b5.p($.rn(),b1)
else if(!F.wn(q))b5.p($.rq(),b1)}F.H(b4,"name",b5,b0,b0,b0,!1)
return new V.aj(a5,a6,a8,q,a7,a0,a2,a4,a9,P.aM(t.bn),F.q(b4,C.O,b5,b0),F.r(b4,b5),!1)},
aj:function aj(a,b,c,d,e,f,g,h,i,j,k,l,m){var _=this
_.x=a
_.y=b
_.z=c
_.Q=d
_.ch=e
_.cx=f
_.cy=g
_.db=h
_.dx=i
_.dy=j
_.id=_.go=_.fy=_.fx=_.fr=null
_.k1=!1
_.a=k
_.b=l
_.a$=m},
jM:function jM(){},
jN:function jN(){},
jO:function jO(a,b){this.a=a
this.b=b}},G={
tr:function(a,b){var s,r=null,q="orthographic",p="perspective"
F.t(a,C.d0,b)
s=a.w(q)&&a.w(p)
if(s)b.D($.nK(),C.am)
switch(F.H(a,"type",b,r,C.am,r,!0)){case"orthographic":F.S(a,q,b,G.w2(),!0)
break
case"perspective":F.S(a,p,b,G.w3(),!0)
break}F.H(a,"name",b,r,r,r,!1)
return new G.bs(F.q(a,C.dC,b,r),F.r(a,b),!1)},
tp:function(a,b){var s,r,q,p
F.t(a,C.d5,b)
s=F.N(a,"xmag",b,0/0,1/0,-1/0,1/0,-1/0,!0,0/0)
r=F.N(a,"ymag",b,0/0,1/0,-1/0,1/0,-1/0,!0,0/0)
q=F.N(a,"zfar",b,0/0,1/0,0,1/0,-1/0,!0,0/0)
p=F.N(a,"znear",b,0/0,1/0,-1/0,1/0,0,!0,0/0)
if(!isNaN(q)&&!isNaN(p)&&q<=p)b.R($.nM())
if(s===0||r===0)b.R($.r6())
return new G.bZ(F.q(a,C.dA,b,null),F.r(a,b),!1)},
tq:function(a,b){var s,r,q,p
F.t(a,C.cl,b)
s=F.N(a,"yfov",b,0/0,1/0,0,1/0,-1/0,!0,0/0)
r=!isNaN(s)&&s>=3.141592653589793
if(r)b.R($.r7())
q=F.N(a,"zfar",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
p=F.N(a,"znear",b,0/0,1/0,0,1/0,-1/0,!0,0/0)
r=!isNaN(q)&&!isNaN(p)&&q<=p
if(r)b.R($.nM())
F.N(a,"aspectRatio",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
return new G.c_(F.q(a,C.dB,b,null),F.r(a,b),!1)},
bs:function bs(a,b,c){this.a=a
this.b=b
this.a$=c},
bZ:function bZ(a,b,c){this.a=a
this.b=b
this.a$=c},
c_:function c_(a,b,c){this.a=a
this.b=b
this.a$=c}},Y={
u4:function(a,b){var s,r,q,p,o,n,m,l,k=null,j="alphaCutoff"
F.t(a,C.ce,b)
s=F.S(a,"pbrMetallicRoughness",b,Y.wG(),!1)
r=F.S(a,"normalTexture",b,Y.px(),!1)
q=F.S(a,"occlusionTexture",b,Y.wF(),!1)
p=F.S(a,"emissiveTexture",b,Y.aE(),!1)
F.ad(a,"emissiveFactor",b,C.aa,C.k,1,0,!1)
o=F.H(a,"alphaMode",b,"OPAQUE",C.cd,k,!1)
F.N(a,j,b,0.5,1/0,-1/0,1/0,0,!1,0/0)
n=o!=="MASK"&&a.w(j)
if(n)b.p($.rc(),j)
F.pp(a,"doubleSided",b)
m=F.q(a,C.h,b,k)
F.H(a,"name",b,k,k,k,!1)
l=new Y.aT(s,r,q,p,P.a8(t.X,t.e),m,F.r(a,b),!1)
n=H.a([s,r,q,p],t.M)
C.d.H(n,m.ga_())
b.W(l,n)
return l},
uf:function(a,b){var s,r,q,p,o
F.t(a,C.cq,b)
F.ad(a,"baseColorFactor",b,C.ab,C.K,1,0,!1)
s=F.S(a,"baseColorTexture",b,Y.aE(),!1)
F.N(a,"metallicFactor",b,1,1/0,-1/0,1,0,!1,0/0)
F.N(a,"roughnessFactor",b,1,1/0,-1/0,1,0,!1,0/0)
r=F.S(a,"metallicRoughnessTexture",b,Y.aE(),!1)
q=F.q(a,C.dU,b,null)
p=new Y.cq(s,r,q,F.r(a,b),!1)
o=H.a([s,r],t.M)
C.d.H(o,q.ga_())
b.W(p,o)
return p},
ue:function(a,b){var s,r,q,p
F.t(a,C.cC,b)
s=F.q(a,C.ay,b,C.h)
r=F.R(a,"index",b,!0)
q=F.Y(a,"texCoord",b,0,null,-1,0,!1)
F.N(a,"strength",b,1,1/0,-1/0,1,0,!1,0/0)
p=new Y.cp(r,q,s,F.r(a,b),!1)
b.W(p,s.ga_())
return p},
ud:function(a,b){var s,r,q,p
F.t(a,C.cB,b)
s=F.q(a,C.ax,b,C.h)
r=F.R(a,"index",b,!0)
q=F.Y(a,"texCoord",b,0,null,-1,0,!1)
F.N(a,"scale",b,1,1/0,-1/0,1/0,-1/0,!1,0/0)
p=new Y.co(r,q,s,F.r(a,b),!1)
b.W(p,s.ga_())
return p},
uu:function(a,b){var s,r
F.t(a,C.cA,b)
s=F.q(a,C.aB,b,C.h)
r=new Y.bE(F.R(a,"index",b,!0),F.Y(a,"texCoord",b,0,null,-1,0,!1),s,F.r(a,b),!1)
b.W(r,s.ga_())
return r},
aT:function aT(a,b,c,d,e,f,g,h){var _=this
_.x=a
_.y=b
_.z=c
_.Q=d
_.dx=e
_.a=f
_.b=g
_.a$=h},
jz:function jz(a,b){this.a=a
this.b=b},
cq:function cq(a,b,c,d,e){var _=this
_.e=a
_.x=b
_.a=c
_.b=d
_.a$=e},
cp:function cp(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
co:function co(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
bE:function bE(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
tI:function(a){var s,r,q={}
q.a=q.b=null
s=new P.C($.z,t.dD)
r=new P.aw(s,t.eP)
q.c=!1
q.a=a.bN(new Y.is(q,r),new Y.it(q),new Y.iu(q,r))
return s},
tH:function(a){var s=new Y.ir()
if(s.$2(a,C.bU))return C.aC
if(s.$2(a,C.bX))return C.aD
if(s.$2(a,C.c3))return C.aE
return null},
dW:function dW(a){this.b=a},
dK:function dK(a,b){this.a=a
this.b=b},
cW:function cW(a,b){this.a=a
this.b=b},
c6:function c6(a,b){this.a=a
this.b=b},
c7:function c7(a,b,c,d,e,f,g,h,i){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.x=h
_.y=i},
is:function is(a,b){this.a=a
this.b=b},
iu:function iu(a,b){this.a=a
this.b=b},
it:function it(a){this.a=a},
ir:function ir(){},
iq:function iq(){},
iC:function iC(a,b){var _=this
_.f=_.e=_.d=_.c=0
_.r=null
_.a=a
_.b=b},
iE:function iE(){},
iD:function iD(){},
jP:function jP(a,b,c,d,e,f){var _=this
_.y=_.x=_.r=_.f=_.e=_.d=_.c=0
_.Q=_.z=!1
_.ch=a
_.cx=b
_.cy=!1
_.db=c
_.dx=d
_.a=e
_.b=f},
jQ:function jQ(a){this.a=a},
lm:function lm(a,b,c){var _=this
_.c=a
_.d=0
_.a=b
_.b=c},
dI:function dI(){},
dH:function dH(){},
aR:function aR(a){this.a=a},
tU:function(a,b){b.toString
F.t(a,C.cF,b)
F.N(a,"ior",b,1.5,1/0,-1/0,1/0,1,!1,0)
return new Y.cd(F.q(a,C.dK,b,null),F.r(a,b),!1)},
cd:function cd(a,b,c){this.a=a
this.b=b
this.a$=c}},S={
u8:function(a,b){var s,r,q,p,o,n,m,l,k,j,i=null,h="primitives"
F.t(a,C.cS,b)
s=F.ad(a,"weights",b,i,i,1/0,-1/0,!1)
r=F.eu(a,h,b)
if(r!=null){q=r.gi(r)
p=P.P(q,i,!1,t.ft)
o=new F.D(p,q,h,t.b_)
q=b.c
q.push(h)
for(n=i,m=-1,l=0;l<r.gi(r);++l){q.push(C.c.k(l))
k=S.u7(r.j(0,l),b)
if(n==null){j=k.x
n=j==null?i:j.length}else{j=k.x
if(n!==(j==null?i:j.length))b.p($.rk(),"targets")}if(m===-1)m=k.cx
else if(m!==k.cx)b.p($.rj(),"attributes")
p[l]=k
q.pop()}q.pop()
q=n!=null&&s!=null&&n!==s.length
if(q)b.l($.rd(),H.a([s.length,n],t.M),"weights")}else o=i
F.H(a,"name",b,i,i,i,!1)
return new S.aU(o,F.q(a,C.aw,b,i),F.r(a,b),!1)},
u6:function(a,b,c,d,e,f,g,h,i,j,k,l,m,n){var s,r=J.o8(l,t.e)
for(s=0;s<l;++s)r[s]=s
return new S.aB(a,b,c,d,e,j,k,l,P.a8(t.X,t.W),r,m,n,!1)},
u7:function(a,b){var s,r,q,p,o,n,m,l="attributes",k={}
F.t(a,C.cG,b)
k.a=k.b=k.c=!1
k.d=0
k.e=-1
k.f=0
k.r=-1
k.x=0
k.y=-1
k.z=0
k.Q=-1
s=F.Y(a,"mode",b,4,null,6,0,!1)
r=F.wc(a,l,b,new S.jA(k,b))
if(r!=null){q=b.c
q.push(l)
if(!k.c)b.R($.rg())
if(!k.b&&k.a)b.p($.ri(),"TANGENT")
if(k.a&&s===0)b.p($.rh(),"TANGENT")
p=new S.jB(b)
k.d=p.$3(k.e,k.d,"COLOR")
k.f=p.$3(k.r,k.f,"JOINTS")
k.x=p.$3(k.y,k.x,"WEIGHTS")
k.z=p.$3(k.Q,k.z,"TEXCOORD")
p=k.f
o=k.x
if(p!==o){b.D($.rf(),H.a([p,o],t.M))
k.x=k.f=0}q.pop()}n=F.wd(a,"targets",b,new S.jC(b))
m=S.u6(r,F.R(a,"indices",b,!1),F.R(a,"material",b,!1),s,n,k.c,k.b,k.a,k.d,k.f,k.x,k.z,F.q(a,C.av,b,null),F.r(a,b))
b.W(m,m.a.ga_())
return m},
aU:function aU(a,b,c,d){var _=this
_.x=a
_.a=b
_.b=c
_.a$=d},
jJ:function jJ(a,b){this.a=a
this.b=b},
jI:function jI(a,b){this.a=a
this.b=b},
aB:function aB(a,b,c,d,e,f,g,h,i,j,k,l,m){var _=this
_.d=a
_.e=b
_.f=c
_.r=d
_.x=e
_.cx=f
_.cy=g
_.db=h
_.dx=i
_.fr=_.dy=-1
_.go=_.fy=_.fx=null
_.id=j
_.a=k
_.b=l
_.a$=m},
jA:function jA(a,b){this.a=a
this.b=b},
jB:function jB(a){this.a=a},
jC:function jC(a){this.a=a},
jE:function jE(a,b,c){this.a=a
this.b=b
this.c=c},
jF:function jF(a,b){this.a=a
this.b=b},
jG:function jG(){},
jH:function jH(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
jD:function jD(){},
eK:function eK(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.x=d
_.ch=_.Q=0
_.cx=e
_.cy=f},
tZ:function(a,b){b.toString
F.t(a,C.cu,b)
return new S.ci(F.q(a,C.dO,b,null),F.r(a,b),!1)},
ci:function ci(a,b,c){this.a=a
this.b=b
this.a$=c}},B={
uq:function(a,b){var s,r=null
F.t(a,C.cN,b)
s=F.mp(a,"nodes",b,!1)
F.H(a,"name",b,r,r,r,!1)
return new B.bz(s,F.q(a,C.az,b,r),F.r(a,b),!1)},
bz:function bz(a,b,c,d){var _=this
_.x=a
_.y=null
_.a=b
_.b=c
_.a$=d},
jX:function jX(a,b){this.a=a
this.b=b},
tT:function(a,b){var s,r,q,p,o,n
b.toString
F.t(a,C.bY,b)
F.N(a,"clearcoatFactor",b,0,1/0,-1/0,1,0,!1,0/0)
s=F.S(a,"clearcoatTexture",b,Y.aE(),!1)
F.N(a,"clearcoatRoughnessFactor",b,0,1/0,-1/0,1,0,!1,0/0)
r=F.S(a,"clearcoatRoughnessTexture",b,Y.aE(),!1)
q=F.S(a,"clearcoatNormalTexture",b,Y.px(),!1)
p=F.q(a,C.dJ,b,null)
o=new B.cc(s,r,q,p,F.r(a,b),!1)
n=H.a([s,r,q],t.M)
C.d.H(n,p.ga_())
b.W(o,n)
return o},
cc:function cc(a,b,c,d,e,f){var _=this
_.e=a
_.r=b
_.x=c
_.a=d
_.b=e
_.a$=f},
tY:function(a,b){var s,r,q,p
b.toString
F.t(a,C.c2,b)
F.N(a,"transmissionFactor",b,0,1/0,-1/0,1,0,!1,0/0)
s=F.S(a,"transmissionTexture",b,Y.aE(),!1)
r=F.q(a,C.dN,b,null)
q=new B.ch(s,r,F.r(a,b),!1)
p=H.a([s],t.M)
C.d.H(p,r.ga_())
b.W(q,p)
return q},
ch:function ch(a,b,c,d){var _=this
_.e=a
_.a=b
_.b=c
_.a$=d}},O={
ur:function(a,b){var s,r,q,p=null
F.t(a,C.cg,b)
s=F.R(a,"inverseBindMatrices",b,!1)
r=F.R(a,"skeleton",b,!1)
q=F.mp(a,"joints",b,!0)
F.H(a,"name",b,p,p,p,!1)
return new O.bB(s,r,q,P.aM(t.L),F.q(a,C.aA,b,p),F.r(a,b),!1)},
bB:function bB(a,b,c,d,e,f,g){var _=this
_.x=a
_.y=b
_.z=c
_.cx=_.ch=_.Q=null
_.cy=d
_.a=e
_.b=f
_.a$=g},
kZ:function kZ(a){this.a=a},
eJ:function eJ(a){this.a=a},
mi:function(a){if(a==null)return null
if(a.ch==null||a.z===-1||a.Q===-1)return null
if(a.fr==null&&a.dx==null)return null
return a},
wS:function(a0,a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a
a0.f.a2(new O.mO(a1))
O.vF(a1)
s=H.a([],t.b2)
r=H.a([],t.bd)
q=a1.c
C.d.si(q,0)
q.push("meshes")
for(p=a0.cy,o=p.b,n=a0.db,m=n.$ti.h("a9<n.E>"),l=a0.fx,p=p.a,k=p.length,j=0;j<o;++j){i={}
h=j>=k
g=h?null:p[j]
if((g==null?null:g.x)==null)continue
h=g.x
if(h.b5(h,new O.mP()))continue
i.a=i.b=-1
for(f=new H.a9(n,n.gi(n),m);f.n();){e=f.d
if(e.fy==g){d=e.id
d=(d==null?null:d.ch)!=null}else d=!1
if(d){e=e.id
c=e.ch.length
d=i.b
if(d===-1||c<d){i.b=c
i.a=l.bL(l,e)}}}if(i.b<1)continue
q.push(C.c.k(j))
q.push("primitives")
h.a2(new O.mQ(i,a1,s,r))
q.pop()
q.pop()}q.pop()
if(s.length===0)return
for(;O.vL(s);)for(q=r.length,b=0;b<r.length;r.length===q||(0,H.cB)(r),++b){a=r[b]
if(!a.x)a.dT(a1)}},
vL:function(a){var s,r
for(s=a.length,r=0;r<a.length;a.length===s||(0,H.cB)(a),++r)a[r].n()
if(!!a.fixed$length)H.a0(P.ac("removeWhere"))
C.d.dL(a,new O.mk(),!0)
return a.length!==0},
vF:function(a){var s,r,q,p,o,n,m,l,k,j,i,h
for(s=a.d.ge_(),s=s.gC(s),r=a.c;s.n();){q=s.gq()
p=O.mi(q.a)
if(p==null)continue
o=C.m.j(0,p.ch)
if(o==null)o=0
n=q.b
C.d.si(r,0)
for(q=p.ac(),q=new P.aC(q.a(),H.A(q).h("aC<1>")),m=J.O(n),l=0,k=0,j=!1;q.n();j=!0){i=q.gq()
for(h=0;h<m.gi(n);++h)if(!m.j(n,h).Z(a,l,k,i))continue;++k
if(k===o)k=0;++l}if(j)for(h=0;h<m.gi(n);++h)m.j(n,h).az(a)}},
mO:function mO(a){this.a=a},
mP:function mP(){},
mQ:function mQ(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
mk:function mk(){},
eN:function eN(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.r=_.f=0
_.x=!1
_.z=_.y=0
_.Q=f}},U={
uv:function(a,b){var s,r,q=null
F.t(a,C.cX,b)
s=F.R(a,"sampler",b,!1)
r=F.R(a,"source",b,!1)
F.H(a,"name",b,q,q,q,!1)
return new U.bD(s,r,F.q(a,C.P,b,q),F.r(a,b),!1)},
bD:function bD(a,b,c,d,e){var _=this
_.x=a
_.y=b
_.Q=_.z=null
_.a=c
_.b=d
_.a$=e},
tW:function(a,b){var s,r,q,p,o
b.toString
F.t(a,C.bW,b)
F.ad(a,"sheenColorFactor",b,C.aa,C.k,1,0,!1)
s=F.S(a,"sheenColorTexture",b,Y.aE(),!1)
F.N(a,"sheenRoughnessFactor",b,0,1/0,-1/0,1,0,!1,0/0)
r=F.S(a,"sheenRoughnessTexture",b,Y.aE(),!1)
q=F.q(a,C.dL,b,null)
p=new U.cf(s,r,q,F.r(a,b),!1)
o=H.a([s,r],t.M)
C.d.H(o,q.ga_())
b.W(p,o)
return p},
cf:function cf(a,b,c,d,e){var _=this
_.e=a
_.r=b
_.a=c
_.b=d
_.a$=e},
vr:function(a){var s="POSITION",r=a.k2
r.j(0,s).H(0,C.cZ)
r.j(0,"NORMAL").H(0,C.L)
r.j(0,"TANGENT").H(0,C.d7)
r.j(0,"TEXCOORD").H(0,C.c0)
r=a.k3
r.j(0,s).H(0,C.ch)
r.j(0,"NORMAL").H(0,C.L)
r.j(0,"TANGENT").H(0,C.L)}},N={d0:function d0(a,b){this.a=a
this.b=b},fc:function fc(a){var _=this
_.a=a
_.f=_.e=_.d=_.c=_.b=null},jU:function jU(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},jV:function jV(a,b,c){this.a=a
this.b=b
this.c=c},jW:function jW(a,b){this.a=a
this.b=b},
u1:function(a,b){var s,r,q,p
b.toString
F.t(a,C.d4,b)
F.ad(a,"attenuationColor",b,C.x,C.k,1,0,!1)
F.N(a,"attenuationDistance",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
F.N(a,"thicknessFactor",b,0,1/0,-1/0,1/0,0,!1,0/0)
s=F.S(a,"thicknessTexture",b,Y.aE(),!1)
r=F.q(a,C.dS,b,null)
q=new N.ck(s,r,F.r(a,b),!1)
p=H.a([s],t.M)
C.d.H(p,r.ga_())
b.W(q,p)
return q},
ck:function ck(a,b,c,d){var _=this
_.r=a
_.a=b
_.b=c
_.a$=d}},E={
E:function(a,b,c){return new E.hh(c,a,b)},
ai:function(a,b,c){return new E.jY(c,a,b)},
v:function(a,b,c){return new E.ke(c,a,b)},
w:function(a,b,c){return new E.iN(c,a,b)},
aq:function(a,b,c){return new E.hR(c,a,b)},
vG:function(a){return"'"+H.b(a)+"'"},
vC:function(a){return typeof a=="string"?"'"+a+"'":J.ah(a)},
bA:function bA(a,b){this.a=a
this.b=b},
ix:function ix(){},
hh:function hh(a,b,c){this.a=a
this.b=b
this.c=c},
hE:function hE(){},
hF:function hF(){},
hG:function hG(){},
hx:function hx(){},
hw:function hw(){},
hm:function hm(){},
hl:function hl(){},
hB:function hB(){},
hs:function hs(){},
hk:function hk(){},
hy:function hy(){},
hq:function hq(){},
hn:function hn(){},
hp:function hp(){},
ho:function ho(){},
hi:function hi(){},
hj:function hj(){},
hA:function hA(){},
hz:function hz(){},
hr:function hr(){},
hI:function hI(){},
hK:function hK(){},
hN:function hN(){},
hO:function hO(){},
hL:function hL(){},
hM:function hM(){},
hJ:function hJ(){},
hH:function hH(){},
hu:function hu(){},
ht:function ht(){},
hC:function hC(){},
hD:function hD(){},
hv:function hv(){},
iv:function iv(a,b,c){this.a=a
this.b=b
this.c=c},
iw:function iw(){},
jY:function jY(a,b,c){this.a=a
this.b=b
this.c=c},
k_:function k_(){},
k0:function k0(){},
jZ:function jZ(){},
k2:function k2(){},
k3:function k3(){},
k4:function k4(){},
k1:function k1(){},
k5:function k5(){},
k6:function k6(){},
k7:function k7(){},
kc:function kc(){},
kd:function kd(){},
kb:function kb(){},
k8:function k8(){},
k9:function k9(){},
ka:function ka(){},
ke:function ke(a,b,c){this.a=a
this.b=b
this.c=c},
kU:function kU(){},
kV:function kV(){},
kF:function kF(){},
kt:function kt(){},
kr:function kr(){},
kg:function kg(){},
kh:function kh(){},
kf:function kf(){},
ki:function ki(){},
kj:function kj(){},
kk:function kk(){},
km:function km(){},
kl:function kl(){},
kn:function kn(){},
ko:function ko(){},
kp:function kp(){},
kv:function kv(){},
ky:function ky(){},
kE:function kE(){},
kD:function kD(){},
kA:function kA(){},
kx:function kx(){},
kC:function kC(){},
kz:function kz(){},
kB:function kB(){},
kw:function kw(){},
kJ:function kJ(){},
kH:function kH(){},
kK:function kK(){},
kR:function kR(){},
kX:function kX(){},
kQ:function kQ(){},
kW:function kW(){},
ks:function ks(){},
kI:function kI(){},
kN:function kN(){},
kM:function kM(){},
kL:function kL(){},
kS:function kS(){},
kT:function kT(){},
kP:function kP(){},
kG:function kG(){},
kO:function kO(){},
kq:function kq(){},
ku:function ku(){},
iN:function iN(a,b,c){this.a=a
this.b=b
this.c=c},
iQ:function iQ(){},
iO:function iO(){},
iP:function iP(){},
iR:function iR(){},
iU:function iU(){},
iS:function iS(){},
iT:function iT(){},
iX:function iX(){},
iV:function iV(){},
iZ:function iZ(){},
iW:function iW(){},
iY:function iY(){},
j_:function j_(){},
j1:function j1(){},
j0:function j0(){},
j2:function j2(){},
j3:function j3(){},
j7:function j7(){},
j8:function j8(){},
je:function je(){},
j6:function j6(){},
j5:function j5(){},
jb:function jb(){},
ja:function ja(){},
j9:function j9(){},
jf:function jf(){},
jg:function jg(){},
jd:function jd(){},
jc:function jc(){},
jh:function jh(){},
ji:function ji(){},
jl:function jl(){},
jj:function jj(){},
jk:function jk(){},
jm:function jm(){},
jo:function jo(){},
jn:function jn(){},
jp:function jp(){},
jq:function jq(){},
jr:function jr(){},
js:function js(){},
jt:function jt(){},
ju:function ju(){},
j4:function j4(){},
hR:function hR(a,b,c){this.a=a
this.b=b
this.c=c},
hW:function hW(){},
hX:function hX(){},
hZ:function hZ(){},
hS:function hS(){},
hY:function hY(){},
hT:function hT(){},
hV:function hV(){},
hU:function hU(){},
i1:function i1(){},
i0:function i0(){},
i2:function i2(){},
i3:function i3(){},
i_:function i_(){},
i4:function i4(){},
cK:function cK(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e}},D={
vq:function(a){a.k1.push("image/webp")},
tD:function(a,b){b.toString
F.t(a,C.cY,b)
return new D.c4(F.R(a,"source",b,!1),F.q(a,C.dE,b,null),F.r(a,b),!1)},
c4:function c4(a,b,c,d){var _=this
_.d=a
_.e=null
_.a=b
_.b=c
_.a$=d},
Q:function Q(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
U:function U(a,b,c){this.a=a
this.b=b
this.c=c},
c5:function c5(a,b){this.a=a
this.b=b},
cm:function cm(a,b){this.a=a
this.b=b},
fd:function fd(a,b){this.a=a
this.b=b}},X={
tQ:function(a,b){var s,r,q,p,o,n,m,l,k,j=null,i="lights",h="spot"
b.toString
F.t(a,C.cJ,b)
s=F.eu(a,i,b)
r=t.cp
if(s!=null){q=s.gi(s)
r=P.P(q,j,!1,r)
p=new F.D(r,q,i,t.E)
q=b.c
q.push(i)
for(o=0;o<s.gi(s);++o){n=s.j(0,o)
q.push(C.c.k(o))
F.t(n,C.c9,b)
F.ad(n,"color",b,C.x,C.k,1,0,!1)
F.N(n,"intensity",b,1,1/0,-1/0,1/0,0,!1,0/0)
m=F.H(n,"type",b,j,C.ct,j,!0)
if(m==="spot")F.S(n,h,b,X.wp(),!0)
else{l=n.w(h)
if(l)b.p($.nN(),h)}k=F.N(n,"range",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
l=m==="directional"&&!isNaN(k)
if(l)b.p($.nN(),"range")
F.H(n,"name",b,j,j,j,!1)
r[o]=new X.b8(F.q(n,C.dH,b,j),F.r(n,b),!1)
q.pop()}q.pop()}else{r=J.b7(0,r)
p=new F.D(r,0,i,t.E)}return new X.bu(p,F.q(a,C.dF,b,j),F.r(a,b),!1)},
tR:function(a,b){var s,r,q,p="outerConeAngle"
F.t(a,C.cD,b)
s=F.N(a,"innerConeAngle",b,0,1.5707963267948966,-1/0,1/0,0,!1,0/0)
r=F.N(a,p,b,0.7853981633974483,1/0,0,1.5707963267948966,-1/0,!1,0/0)
q=!isNaN(r)&&!isNaN(s)&&r<=s
if(q)b.l($.rb(),H.a([s,r],t.M),p)
return new X.ca(F.q(a,C.dG,b,null),F.r(a,b),!1)},
tS:function(a,b){b.toString
F.t(a,C.cI,b)
return new X.cb(F.R(a,"light",b,!0),F.q(a,C.dI,b,null),F.r(a,b),!1)},
bu:function bu(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
iI:function iI(a,b){this.a=a
this.b=b},
b8:function b8(a,b,c){this.a=a
this.b=b
this.a$=c},
ca:function ca(a,b,c){this.a=a
this.b=b
this.a$=c},
cb:function cb(a,b,c,d){var _=this
_.d=a
_.e=null
_.a=b
_.b=c
_.a$=d}},A={
tV:function(a,b){var s,r,q,p,o
b.toString
F.t(a,C.cs,b)
F.ad(a,"diffuseFactor",b,C.ab,C.K,1,0,!1)
s=F.S(a,"diffuseTexture",b,Y.aE(),!1)
F.ad(a,"specularFactor",b,C.x,C.k,1,0,!1)
F.N(a,"glossinessFactor",b,1,1/0,-1/0,1,0,!1,0/0)
r=F.S(a,"specularGlossinessTexture",b,Y.aE(),!1)
q=F.q(a,C.dD,b,null)
p=new A.ce(s,r,q,F.r(a,b),!1)
o=H.a([s,r],t.M)
C.d.H(o,q.ga_())
b.W(p,o)
return p},
ce:function ce(a,b,c,d,e){var _=this
_.e=a
_.x=b
_.a=c
_.b=d
_.a$=e},
dj:function dj(a,b,c){var _=this
_.a=a
_.b=null
_.c=b
_.d=null
_.e=c
_.f=null
_.cx=_.ch=_.Q=_.z=_.y=_.x=_.r=0
_.cy=!1
_.dy=_.dx=_.db=null
_.fr=!1
_.fx=null},
i7:function i7(a){this.a=a},
i5:function i5(a){this.a=a},
i6:function i6(a){this.a=a},
li:function li(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
ll:function ll(a,b){this.a=a
this.b=b},
lk:function lk(){},
lj:function lj(){},
mt:function(a){var s=C.dn.e3(a,0,new A.mu()),r=s+((s&67108863)<<3)&536870911
r^=r>>>11
return r+((r&16383)<<15)&536870911},
mu:function mu(){},
fQ:function(a,b){var s=a+b&536870911
s=s+((s&524287)<<10)&536870911
return s^s>>>6},
p9:function(a){var s=a+((a&67108863)<<3)&536870911
s^=s>>>11
return s+((s&16383)<<15)&536870911}},K={
tX:function(a,b){var s,r,q,p,o
b.toString
F.t(a,C.c_,b)
F.N(a,"specularFactor",b,1,1/0,-1/0,1,0,!1,0/0)
s=F.S(a,"specularTexture",b,Y.aE(),!1)
F.ad(a,"specularColorFactor",b,C.x,C.k,1/0,0,!1)
r=F.S(a,"specularColorTexture",b,Y.aE(),!1)
q=F.q(a,C.dM,b,null)
p=new K.cg(s,r,q,F.r(a,b),!1)
o=H.a([s,r],t.M)
C.d.H(o,q.ga_())
b.W(p,o)
return p},
cg:function cg(a,b,c,d,e){var _=this
_.e=a
_.r=b
_.a=c
_.b=d
_.a$=e},
tG:function(a,b){var s,r={},q=new P.C($.z,t.eD)
r.a=!1
r.b=null
s=P.oB(new K.i9(r),new K.ia(r),new K.ib(r),t.w)
r.b=a.e9(new K.ic(r,s,new P.aw(q,t.a_),b),s.gdU())
return q},
tE:function(a,b){var s=new K.cI(a,new P.aw(new P.C($.z,t.g),t.G))
s.e=b
return s},
tF:function(a,b){var s,r,q,p,o=null,n=null
try{n=C.a3.dX(a)}catch(q){p=H.G(q)
if(p instanceof P.aH){s=p
b.ay($.fX(),H.a([s],t.M),!0)
return o}else throw q}if(t.t.b(n))try{r=V.o6(n,b)
return new K.ar("model/gltf+json",r,o)}catch(q){if(H.G(q) instanceof M.c8)return o
else throw q}else{b.ay($.a1(),H.a([n,"object"],t.M),!0)
return o}},
ar:function ar(a,b,c){this.a=a
this.b=b
this.c=c},
ia:function ia(a){this.a=a},
ib:function ib(a){this.a=a},
i9:function i9(a){this.a=a},
ic:function ic(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
cI:function cI(a,b){var _=this
_.a=a
_.b=null
_.c=b
_.e=_.d=null
_.f=!0},
i8:function i8(a){this.a=a},
dl:function dl(){}},F={
u_:function(a,b){var s,r,q,p,o,n,m=null,l="variants"
b.toString
F.t(a,C.d2,b)
s=F.eu(a,l,b)
r=t.J
if(s!=null){q=s.gi(s)
r=P.P(q,m,!1,r)
p=new F.D(r,q,l,t.u)
q=b.c
q.push(l)
for(o=0;o<s.gi(s);++o){n=s.j(0,o)
q.push(C.c.k(o))
F.t(n,C.cL,b)
F.H(n,"name",b,m,m,m,!0)
r[o]=new F.aL(F.q(n,C.dR,b,m),F.r(n,b),!1)
q.pop()}q.pop()}else{r=J.b7(0,r)
p=new F.D(r,0,l,t.u)}return new F.bv(p,F.q(a,C.dP,b,m),F.r(a,b),!1)},
u0:function(a,b){var s,r,q,p,o,n,m,l,k,j=null,i="mappings"
b.toString
F.t(a,C.cK,b)
s=F.eu(a,i,b)
r=t.aa
if(s!=null){q=s.gi(s)
r=P.P(q,j,!1,r)
p=new F.D(r,q,i,t.B)
q=b.c
q.push(i)
for(o=0;o<s.gi(s);++o){n=s.j(0,o)
q.push(C.c.k(o))
F.t(n,C.d3,b)
m=F.mp(n,"variants",b,!0)
l=F.R(n,"material",b,!0)
F.H(n,"name",b,j,j,j,!1)
r[o]=new F.b9(m,l,F.q(n,C.dQ,b,j),F.r(n,b),!1)
q.pop()}q.pop()}else{r=J.b7(0,r)
p=new F.D(r,0,i,t.B)}k=new F.cj(p,F.q(a,C.dW,b,j),F.r(a,b),!1)
b.W(k,P.eR(p,!0,t._))
return k},
bv:function bv(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
iJ:function iJ(a,b){this.a=a
this.b=b},
aL:function aL(a,b,c){this.a=a
this.b=b
this.a$=c},
cj:function cj(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
iM:function iM(a,b,c){this.a=a
this.b=b
this.c=c},
b9:function b9(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.r=null
_.a=c
_.b=d
_.a$=e},
iK:function iK(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
iL:function iL(a,b){this.a=a
this.b=b},
ax:function(a,b,c,d){var s=a.j(0,b)
if(s==null&&a.w(b))d.l($.a1(),H.a([null,c],t.M),b)
return s},
R:function(a,b,c,d){var s=F.ax(a,b,"integer",c)
if(H.aO(s)){if(s>=0)return s
c.p($.fW(),b)}else if(s==null){if(d)c.D($.bm(),H.a([b],t.M))}else c.l($.a1(),H.a([s,"integer"],t.M),b)
return-1},
pp:function(a,b,c){var s=F.ax(a,b,"boolean",c)
if(s==null)return!1
if(H.en(s))return s
c.l($.a1(),H.a([s,"boolean"],t.M),b)
return!1},
Y:function(a,b,c,d,e,f,g,h){var s,r=F.ax(a,b,"integer",c)
if(H.aO(r)){if(e!=null){if(!F.nl(b,r,e,c,!1))return-1}else{if(!(r<g))s=f!==-1&&r>f
else s=!0
if(s){c.l($.mS(),H.a([r],t.M),b)
return-1}}return r}else if(r==null){if(!h)return d
c.D($.bm(),H.a([b],t.M))}else c.l($.a1(),H.a([r,"integer"],t.M),b)
return-1},
N:function(a,b,c,d,e,f,g,h,i,j){var s,r=F.ax(a,b,"number",c)
if(typeof r=="number"){if(r!==j)s=r<h||r<=f||r>g||r>=e
else s=!1
if(s){c.l($.mS(),H.a([r],t.M),b)
return 0/0}return r}else if(r==null){if(!i)return d
c.D($.bm(),H.a([b],t.M))}else c.l($.a1(),H.a([r,"number"],t.M),b)
return 0/0},
H:function(a,b,c,d,e,f,g){var s,r=F.ax(a,b,"string",c)
if(typeof r=="string"){if(e!=null)F.nl(b,r,e,c,!1)
else{if(f==null)s=null
else{s=f.b
s=s.test(r)}if(s===!1){c.l($.qX(),H.a([r,f.a],t.M),b)
return null}}return r}else if(r==null){if(!g)return d
c.D($.bm(),H.a([b],t.M))}else c.l($.a1(),H.a([r,"string"],t.M),b)
return null},
pu:function(a,b){var s,r,q,p
try{s=P.oG(a)
q=s
if(q.gcK()||q.gbH()||q.gcJ()||q.gbJ()||q.gbI())b.l($.rv(),H.a([a],t.M),"uri")
return s}catch(p){q=H.G(p)
if(q instanceof P.aH){r=q
b.l($.qW(),H.a([a,r],t.M),"uri")
return null}else throw p}},
no:function(a,b,c,d){var s=F.ax(a,b,"object",c)
if(t.t.b(s))return s
else if(s==null){if(d){c.D($.bm(),H.a([b],t.M))
return null}}else{c.l($.a1(),H.a([s,"object"],t.M),b)
if(d)return null}return P.a8(t.X,t._)},
S:function(a,b,c,d,e){var s,r,q=F.ax(a,b,"object",c)
if(t.t.b(q)){s=c.c
s.push(b)
r=d.$2(q,c)
s.pop()
return r}else if(q==null){if(e)c.D($.bm(),H.a([b],t.M))}else c.l($.a1(),H.a([q,"object"],t.M),b)
return null},
mp:function(a,b,c,d){var s,r,q,p,o,n,m=F.ax(a,b,"array",c)
if(t.m.b(m)){s=J.O(m)
if(s.gv(m)){c.p($.bS(),b)
return null}r=c.c
r.push(b)
q=t.e
p=P.aM(q)
for(o=0;o<s.gi(m);++o){n=s.j(m,o)
if(H.aO(n)&&n>=0){if(!p.B(0,n))c.V($.nI(),o)}else{s.m(m,o,-1)
c.V($.fW(),o)}}r.pop()
return s.af(m,q)}else if(m==null){if(d)c.D($.bm(),H.a([b],t.M))}else c.l($.a1(),H.a([m,"array"],t.M),b)
return null},
wc:function(a,b,c,d){var s,r=F.ax(a,b,"object",c)
if(t.t.b(r)){if(r.gv(r)){c.p($.bS(),b)
return null}s=c.c
s.push(b)
r.K(0,new F.mq(d,r,c))
s.pop()
return r.ag(0,t.X,t.e)}else{s=t.M
if(r==null)c.D($.bm(),H.a([b],s))
else c.l($.a1(),H.a([r,"object"],s),b)}return null},
wd:function(a,b,c,d){var s,r,q,p,o,n,m,l=F.ax(a,b,"array",c)
if(t.m.b(l)){s=J.O(l)
if(s.gv(l)){c.p($.bS(),b)
return null}else{r=c.c
r.push(b)
for(q=t.M,p=t.t,o=!1,n=0;n<s.gi(l);++n){m=s.j(l,n)
if(p.b(m))if(m.gv(m)){c.V($.bS(),n)
o=!0}else{r.push(C.c.k(n))
m.K(0,new F.mr(d,m,c))
r.pop()}else{c.D($.ev(),H.a([m,"object"],q))
o=!0}}r.pop()
if(o)return null}s=J.mW(l,t.h)
r=H.A(s).h("aa<n.E,h<f*,c*>*>")
return P.eR(new H.aa(s,new F.ms(),r),!1,r.h("af.E"))}else if(l!=null)c.l($.a1(),H.a([l,"array"],t.M),b)
return null},
ad:function(a,b,c,d,e,f,g,h){var s,r,q,p,o,n,m,l,k=null,j=F.ax(a,b,"array",c)
if(t.m.b(j)){s=J.O(j)
if(s.gv(j)){c.p($.bS(),b)
return k}if(e!=null&&!F.nl(b,s.gi(j),e,c,!0))return k
r=P.P(s.gi(j),0,!1,t.F)
for(q=t.M,p=c.c,o=!1,n=0;n<s.gi(j);++n){m=s.j(j,n)
if(typeof m=="number"){l=m<g||m>f
if(l){p.push(b)
c.am($.mS(),H.a([m],q),n)
p.pop()
o=!0}if(h){l=$.nQ()
l[0]=m
r[n]=l[0]}else r[n]=m}else{c.l($.ev(),H.a([m,"number"],q),b)
o=!0}}if(o)return k
return r}else if(j==null){if(d==null)s=k
else s=J.cL(d.slice(0),H.X(d).c)
return s}else c.l($.a1(),H.a([j,"array"],t.M),b)
return k},
pq:function(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j=F.ax(a,b,"array",c)
if(t.m.b(j)){s=J.O(j)
if(s.gi(j)!==e){c.l($.nJ(),H.a([s.gi(j),H.a([e],t.V)],t.M),b)
return null}r=Z.wR(d)
q=Z.pF(d)
p=F.w6(d,e)
for(o=t.M,n=!1,m=0;m<s.gi(j);++m){l=s.j(j,m)
if(typeof l=="number"&&C.bO.cY(l)===l){if(!H.aO(l))c.l($.r8(),H.a([l],o),b)
k=l<r||l>q
if(k){c.l($.ra(),H.a([l,C.ap.j(0,d)],o),b)
n=!0}p[m]=J.tb(l)}else{c.l($.ev(),H.a([l,"integer"],o),b)
n=!0}}if(n)return null
return p}else if(j!=null)c.l($.a1(),H.a([j,"array"],t.M),b)
return null},
pr:function(a,b,c){var s,r,q,p,o,n,m,l,k=F.ax(a,b,"array",c)
if(t.m.b(k)){s=J.O(k)
if(s.gv(k)){c.p($.bS(),b)
return null}r=c.c
r.push(b)
q=t.X
p=P.aM(q)
for(o=t.M,n=!1,m=0;m<s.gi(k);++m){l=s.j(k,m)
if(typeof l=="string"){if(!p.B(0,l))c.V($.nI(),m)}else{c.am($.ev(),H.a([l,"string"],o),m)
n=!0}}r.pop()
if(n)return null
return s.af(k,q)}else if(k!=null)c.l($.a1(),H.a([k,"array"],t.M),b)
return null},
eu:function(a,b,c){var s,r,q,p,o,n,m=F.ax(a,b,"array",c)
if(t.m.b(m)){s=J.O(m)
if(s.gv(m)){c.p($.bS(),b)
return null}else{for(r=s.gC(m),q=t.t,p=t.M,o=!1;r.n();){n=r.gq()
if(!q.b(n)){c.l($.ev(),H.a([n,"object"],p),b)
o=!0}}if(o)return null}return s.af(m,q)}else{s=t.M
if(m==null)c.D($.bm(),H.a([b],s))
else c.l($.a1(),H.a([m,"array"],s),b)}return null},
q:function(a,b,c,d){var s,r,q,p,o,n,m,l,k,j,i,h,g="extensions",f=P.a8(t.X,t._),e=F.no(a,g,c,!1)
if(e.gv(e))return f
s=c.c
s.push(g)
for(r=e.gL(),r=r.gC(r),q=t.ax,p=t.c,o=d==null,n=c.f,m=c.r;r.n();){l=r.gq()
k=F.no(e,l,c,!1)
j=c.dx
if(!j.E(j,l)){j=c.cy
j=j.E(j,l)
if(!j)c.p($.qT(),l)
continue}i=c.ch.a.j(0,new D.c5(b,l))
if(i==null){c.p($.qU(),l)
continue}if(e.gi(e)>1&&i.b)c.p($.rm(),l)
if(k!=null){s.push(l)
h=i.a.$2(k,c)
f.m(0,l,h)
if(!i.c&&p.b(h)){l=o?b:d
l=n.bT(l,new F.mo())
j=H.a(s.slice(0),H.X(s))
j.fixed$length=Array
J.mV(l,new D.cm(h,j))}if(q.b(h)){l=H.a(s.slice(0),H.X(s))
l.fixed$length=Array
m.push(new D.fd(h,l))}s.pop()}}s.pop()
return f},
r:function(a,b){var s=a.j(0,"extras"),r=s!=null&&!t.h.b(s)
if(r)b.p($.ru(),"extras")
return s},
nl:function(a,b,c,d,e){var s
if(!J.nT(c,b)){s=e?$.nJ():$.nL()
d.l(s,H.a([b,c],t.M),a)
return!1}return!0},
t:function(a,b,c){var s,r,q
for(s=a.gL(),s=s.gC(s);s.n();){r=s.gq()
if(!C.d.E(b,r)){q=C.d.E(C.cx,r)
q=!q}else q=!1
if(q)c.p($.qY(),r)}},
ns:function(a,b,c,d,e,f){var s,r,q,p,o,n,m=e.c
m.push(d)
for(s=t.M,r=c.a,q=r.length,p=0;p<a.gi(a);++p){o=a.j(0,p)
if(o===-1)continue
n=o==null||o<0||o>=q?null:r[o]
if(n!=null){n.a$=!0
b[p]=n
f.$3(n,o,p)}else e.am($.L(),H.a([o],s),p)}m.pop()},
wn:function(b8){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6,b7=b8.a
if(b7[3]!==0||b7[7]!==0||b7[11]!==0||b7[15]!==1)return!1
if(b8.cG()===0)return!1
s=$.rV()
r=$.rS()
q=$.rT()
p=$.oj
if(p==null)p=$.oj=new T.cu(new Float32Array(3))
p.bj(b7[0],b7[1],b7[2])
o=Math.sqrt(p.gaJ())
p.bj(b7[4],b7[5],b7[6])
n=Math.sqrt(p.gaJ())
p.bj(b7[8],b7[9],b7[10])
m=Math.sqrt(p.gaJ())
if(b8.cG()<0)o=-o
s=s.a
s[0]=b7[12]
s[1]=b7[13]
s[2]=b7[14]
l=1/o
k=1/n
j=1/m
i=$.oh
if(i==null)i=$.oh=new T.cO(new Float32Array(16))
i.d1(b8)
b7=i.a
b7[0]=b7[0]*l
b7[1]=b7[1]*l
b7[2]=b7[2]*l
b7[4]=b7[4]*k
b7[5]=b7[5]*k
b7[6]=b7[6]*k
b7[8]=b7[8]*j
b7[9]=b7[9]*j
b7[10]=b7[10]*j
h=$.oi
if(h==null)h=$.oi=new T.eS(new Float32Array(9))
g=h.a
g[0]=b7[0]
g[1]=b7[1]
g[2]=b7[2]
g[3]=b7[4]
g[4]=b7[5]
g[5]=b7[6]
g[6]=b7[8]
g[7]=b7[9]
g[8]=b7[10]
r.toString
b7=g[0]
f=g[4]
e=g[8]
d=0+b7+f+e
if(d>0){c=Math.sqrt(d+1)
b7=r.a
b7[3]=c*0.5
c=0.5/c
b7[0]=(g[5]-g[7])*c
b7[1]=(g[6]-g[2])*c
b7[2]=(g[1]-g[3])*c}else{if(b7<f)b=f<e?2:1
else b=b7<e?2:0
a=(b+1)%3
a0=(b+2)%3
b7=b*3
f=a*3
e=a0*3
c=Math.sqrt(g[b7+b]-g[f+a]-g[e+a0]+1)
r=r.a
r[b]=c*0.5
c=0.5/c
r[3]=(g[f+a0]-g[e+a])*c
r[a]=(g[b7+a]+g[f+b])*c
r[a0]=(g[b7+a0]+g[e+b])*c
b7=r}q=q.a
q[0]=o
q[1]=n
q[2]=m
r=$.rR()
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
w6:function(a,b){switch(a){case 5120:return new Int8Array(b)
case 5121:return new Uint8Array(b)
case 5122:return new Int16Array(b)
case 5123:return new Uint16Array(b)
case 5124:return new Int32Array(b)
case 5125:return new Uint32Array(b)
default:throw H.d(P.T(null))}},
mq:function mq(a,b,c){this.a=a
this.b=b
this.c=c},
mr:function mr(a,b,c){this.a=a
this.b=b
this.c=c},
ms:function ms(){},
mo:function mo(){},
D:function D(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.$ti=d},
a_:function a_(){},
fk:function fk(a,b){this.a=0
this.b=a
this.c=b},
fl:function fl(a,b){this.a=0
this.b=a
this.c=b},
eC:function eC(a){this.a=a}},L={
u2:function(a,b){b.toString
F.t(a,C.cR,b)
F.ad(a,"offset",b,C.bR,C.ac,1/0,-1/0,!1)
F.N(a,"rotation",b,0,1/0,-1/0,1/0,-1/0,!1,0/0)
F.ad(a,"scale",b,C.bT,C.ac,1/0,-1/0,!1)
return new L.cl(F.Y(a,"texCoord",b,-1,null,-1,0,!1),F.q(a,C.dT,b,null),F.r(a,b),!1)},
cl:function cl(a,b,c,d){var _=this
_.r=a
_.a=b
_.b=c
_.a$=d}}
var w=[C,H,J,P,M,Z,T,Q,V,G,Y,S,B,O,U,N,E,D,X,A,K,F,L]
hunkHelpers.setFunctionNamesIfNecessary(w)
var $={}
H.n0.prototype={}
J.cJ.prototype={
N:function(a,b){return a===b},
gF:function(a){return H.cr(a)},
k:function(a){return"Instance of '"+H.b(H.jS(a))+"'"},
bc:function(a,b){throw H.d(P.om(a,b.gcQ(),b.gcU(),b.gcR()))}}
J.dn.prototype={
k:function(a){return String(a)},
gF:function(a){return a?519018:218159},
$iW:1}
J.cM.prototype={
N:function(a,b){return null==b},
k:function(a){return"null"},
gF:function(a){return 0},
bc:function(a,b){return this.d3(a,b)},
$ik:1}
J.aJ.prototype={
gF:function(a){return 0},
k:function(a){return String(a)},
$ibd:1,
$icZ:1,
geq:function(a){return a.then},
cX:function(a,b){return a.then(b)},
er:function(a,b,c){return a.then(b,c)},
sez:function(a,b){return a.validateBytes=b},
seB:function(a,b){return a.validateString=b},
seC:function(a,b){return a.version=b},
sd7:function(a,b){return a.supportedExtensions=b},
gbe:function(a){return a.uri},
gbF:function(a){return a.externalResourceFunction},
gc1:function(a){return a.writeTimestamp},
gba:function(a){return a.maxIssues},
gb7:function(a){return a.ignoredIssues},
gaj:function(a){return a.severityOverrides}}
J.f8.prototype={}
J.ct.prototype={}
J.aS.prototype={
k:function(a){var s=a[$.nu()]
if(s==null)return this.d4(a)
return"JavaScript function for "+H.b(J.ah(s))},
$iaI:1}
J.B.prototype={
af:function(a,b){return new H.b3(a,H.X(a).h("@<1>").G(b).h("b3<1,2>"))},
B:function(a,b){if(!!a.fixed$length)H.a0(P.ac("add"))
a.push(b)},
dL:function(a,b,c){var s,r,q,p=[],o=a.length
for(s=0;s<o;++s){r=a[s]
if(!b.$1(r))p.push(r)
if(a.length!==o)throw H.d(P.a6(a))}q=p.length
if(q===o)return
this.si(a,q)
for(s=0;s<p.length;++s)a[s]=p[s]},
H:function(a,b){var s
if(!!a.fixed$length)H.a0(P.ac("addAll"))
if(Array.isArray(b)){this.da(a,b)
return}for(s=J.an(b);s.n();)a.push(s.gq())},
da:function(a,b){var s,r=b.length
if(r===0)return
if(a===b)throw H.d(P.a6(a))
for(s=0;s<r;++s)a.push(b[s])},
ah:function(a,b,c){return new H.aa(a,b,H.X(a).h("@<1>").G(c).h("aa<1,2>"))},
cN:function(a,b){var s,r=P.P(a.length,"",!1,t.R)
for(s=0;s<a.length;++s)r[s]=H.b(a[s])
return r.join(b)},
a4:function(a,b){return H.dG(a,b,null,H.X(a).c)},
b6:function(a,b,c){var s,r,q=a.length
for(s=0;s<q;++s){r=a[s]
if(b.$1(r))return r
if(a.length!==q)throw H.d(P.a6(a))}return c.$0()},
S:function(a,b){return a[b]},
a0:function(a,b,c){if(b<0||b>a.length)throw H.d(P.V(b,0,a.length,"start",null))
if(c<b||c>a.length)throw H.d(P.V(c,b,a.length,"end",null))
if(b===c)return H.a([],H.X(a))
return H.a(a.slice(b,c),H.X(a))},
aN:function(a,b,c){P.aW(b,c,a.length)
return H.dG(a,b,c,H.X(a).c)},
gaI:function(a){var s=a.length
if(s>0)return a[s-1]
throw H.d(H.mZ())},
E:function(a,b){var s
for(s=0;s<a.length;++s)if(J.aA(a[s],b))return!0
return!1},
gv:function(a){return a.length===0},
ga6:function(a){return a.length!==0},
k:function(a){return P.iy(a,"[","]")},
aM:function(a,b){var s=J.cL(a.slice(0),H.X(a).c)
return s},
bZ:function(a){return P.u3(a,H.X(a).c)},
gC:function(a){return new J.aG(a,a.length,H.X(a).h("aG<1>"))},
gF:function(a){return H.cr(a)},
gi:function(a){return a.length},
si:function(a,b){if(!!a.fixed$length)H.a0(P.ac("set length"))
if(b<0)throw H.d(P.V(b,0,null,"newLength",null))
a.length=b},
j:function(a,b){if(b>=a.length||b<0)throw H.d(H.et(a,b))
return a[b]},
m:function(a,b,c){if(!!a.immutable$list)H.a0(P.ac("indexed set"))
if(b>=a.length||b<0)throw H.d(H.et(a,b))
a[b]=c},
$io:1,
$ij:1,
$im:1}
J.iB.prototype={}
J.aG.prototype={
gq:function(){return this.d},
n:function(){var s,r=this,q=r.a,p=q.length
if(r.b!==p)throw H.d(H.cB(q))
s=r.c
if(s>=p){r.d=null
return!1}r.d=q[s]
r.c=s+1
return!0},
$iJ:1}
J.c9.prototype={
cY:function(a){var s
if(a>=-2147483648&&a<=2147483647)return a|0
if(isFinite(a)){s=a<0?Math.ceil(a):Math.floor(a)
return s+0}throw H.d(P.ac(""+a+".toInt()"))},
ar:function(a,b){var s,r,q,p
if(b<2||b>36)throw H.d(P.V(b,2,36,"radix",null))
s=a.toString(b)
if(C.a.A(s,s.length-1)!==41)return s
r=/^([\da-z]+)(?:\.([\da-z]+))?\(e\+(\d+)\)$/.exec(s)
if(r==null)H.a0(P.ac("Unexpected toString result: "+s))
s=r[1]
q=+r[3]
p=r[2]
if(p!=null){s+=p
q-=p.length}return s+C.a.bi("0",q)},
k:function(a){if(a===0&&1/a<0)return"-0.0"
else return""+a},
gF:function(a){var s,r,q,p,o=a|0
if(a===o)return o&536870911
s=Math.abs(a)
r=Math.log(s)/0.6931471805599453|0
q=Math.pow(2,r)
p=s<1?s/q:q/s
return((p*9007199254740992|0)+(p*3542243181176521|0))*599197+r*1259&536870911},
bh:function(a,b){var s=a%b
if(s===0)return 0
if(s>0)return s
if(b<0)return s-b
else return s+b},
as:function(a,b){if((a|0)===a)if(b>=1||b<-1)return a/b|0
return this.cu(a,b)},
bB:function(a,b){return(a|0)===a?a/b|0:this.cu(a,b)},
cu:function(a,b){var s=a/b
if(s>=-2147483648&&s<=2147483647)return s|0
if(s>0){if(s!==1/0)return Math.floor(s)}else if(s>-1/0)return Math.ceil(s)
throw H.d(P.ac("Result of truncating division is "+H.b(s)+": "+H.b(a)+" ~/ "+b))},
aD:function(a,b){if(b<0)throw H.d(H.bQ(b))
return b>31?0:a<<b>>>0},
ae:function(a,b){var s
if(a>0)s=this.ct(a,b)
else{s=b>31?31:b
s=a>>s>>>0}return s},
dN:function(a,b){if(b<0)throw H.d(H.bQ(b))
return this.ct(a,b)},
ct:function(a,b){return b>31?0:a>>>b},
$iy:1,
$iI:1}
J.dp.prototype={$ic:1}
J.eP.prototype={}
J.bt.prototype={
A:function(a,b){if(b<0)throw H.d(H.et(a,b))
if(b>=a.length)H.a0(H.et(a,b))
return a.charCodeAt(b)},
I:function(a,b){if(b>=a.length)throw H.d(H.et(a,b))
return a.charCodeAt(b)},
ai:function(a,b){if(typeof b!="string")throw H.d(P.nY(b,null,null))
return a+b},
aC:function(a,b,c,d){var s=P.aW(b,c,a.length),r=a.substring(0,b),q=a.substring(s)
return r+d+q},
U:function(a,b,c){var s
if(c<0||c>a.length)throw H.d(P.V(c,0,a.length,null,null))
s=c+b.length
if(s>a.length)return!1
return b===a.substring(c,s)},
X:function(a,b){return this.U(a,b,0)},
u:function(a,b,c){if(c==null)c=a.length
if(b<0)throw H.d(P.jT(b,null))
if(b>c)throw H.d(P.jT(b,null))
if(c>a.length)throw H.d(P.jT(c,null))
return a.substring(b,c)},
bk:function(a,b){return this.u(a,b,null)},
ew:function(a){var s,r,q
if(typeof a.trimRight!="undefined"){s=a.trimRight()
r=s.length
if(r===0)return s
q=r-1
if(this.A(s,q)===133)r=J.o9(s,q)}else{r=J.o9(a,a.length)
s=a}if(r===s.length)return s
if(r===0)return""
return s.substring(0,r)},
bi:function(a,b){var s,r
if(0>=b)return""
if(b===1||a.length===0)return a
if(b!==b>>>0)throw H.d(C.bf)
for(s=a,r="";!0;){if((b&1)===1)r=s+r
b=b>>>1
if(b===0)break
s+=s}return r},
ao:function(a,b,c){var s=b-a.length
if(s<=0)return a
return this.bi(c,s)+a},
b8:function(a,b,c){var s
if(c<0||c>a.length)throw H.d(P.V(c,0,a.length,null,null))
s=a.indexOf(b,c)
return s},
bL:function(a,b){return this.b8(a,b,0)},
k:function(a){return a},
gF:function(a){var s,r,q
for(s=a.length,r=0,q=0;q<s;++q){r=r+a.charCodeAt(q)&536870911
r=r+((r&524287)<<10)&536870911
r^=r>>6}r=r+((r&67108863)<<3)&536870911
r^=r>>11
return r+((r&16383)<<15)&536870911},
gi:function(a){return a.length},
$if:1}
H.bH.prototype={
gC:function(a){var s=H.A(this)
return new H.dd(J.an(this.ga8()),s.h("@<1>").G(s.Q[1]).h("dd<1,2>"))},
gi:function(a){return J.Z(this.ga8())},
gv:function(a){return J.nU(this.ga8())},
ga6:function(a){return J.rZ(this.ga8())},
a4:function(a,b){var s=H.A(this)
return H.h7(J.nV(this.ga8(),b),s.c,s.Q[1])},
S:function(a,b){return H.A(this).Q[1].a(J.ew(this.ga8(),b))},
E:function(a,b){return J.nT(this.ga8(),b)},
k:function(a){return J.ah(this.ga8())}}
H.dd.prototype={
n:function(){return this.a.n()},
gq:function(){return this.$ti.Q[1].a(this.a.gq())},
$iJ:1}
H.c0.prototype={
ga8:function(){return this.a}}
H.dO.prototype={$io:1}
H.dJ.prototype={
j:function(a,b){return this.$ti.Q[1].a(J.nS(this.a,b))},
m:function(a,b,c){J.rX(this.a,b,this.$ti.c.a(c))},
si:function(a,b){J.t3(this.a,b)},
B:function(a,b){J.mV(this.a,this.$ti.c.a(b))},
aN:function(a,b,c){var s=this.$ti
return H.h7(J.t1(this.a,b,c),s.c,s.Q[1])},
$io:1,
$im:1}
H.b3.prototype={
af:function(a,b){return new H.b3(this.a,this.$ti.h("@<1>").G(b).h("b3<1,2>"))},
ga8:function(){return this.a}}
H.c1.prototype={
ag:function(a,b,c){var s=this.$ti
return new H.c1(this.a,s.h("@<1>").G(s.Q[1]).G(b).G(c).h("c1<1,2,3,4>"))},
w:function(a){return this.a.w(a)},
j:function(a,b){return this.$ti.h("4?").a(this.a.j(0,b))},
m:function(a,b,c){var s=this.$ti
this.a.m(0,s.c.a(b),s.Q[1].a(c))},
K:function(a,b){this.a.K(0,new H.h8(this,b))},
gL:function(){var s=this.$ti
return H.h7(this.a.gL(),s.c,s.Q[2])},
gi:function(a){var s=this.a
return s.gi(s)},
gv:function(a){var s=this.a
return s.gv(s)}}
H.h8.prototype={
$2:function(a,b){var s=this.a.$ti
this.b.$2(s.Q[2].a(a),s.Q[3].a(b))},
$S:function(){return this.a.$ti.h("~(1,2)")}}
H.dq.prototype={
k:function(a){var s=this.a
return s!=null?"LateInitializationError: "+s:"LateInitializationError"}}
H.fb.prototype={
k:function(a){var s="ReachabilityError: "+this.a
return s}}
H.cE.prototype={
gi:function(a){return this.a.length},
j:function(a,b){return C.a.A(this.a,b)}}
H.mN.prototype={
$0:function(){var s=new P.C($.z,t.U)
s.aT(null)
return s},
$S:45}
H.dA.prototype={
k:function(a){return"Null is not a valid value for the parameter '"+this.a+"' of type '"+H.pm(this.$ti.c).k(0)+"'"}}
H.o.prototype={}
H.af.prototype={
gC:function(a){var s=this
return new H.a9(s,s.gi(s),H.A(s).h("a9<af.E>"))},
gv:function(a){return this.gi(this)===0},
E:function(a,b){var s,r=this,q=r.gi(r)
for(s=0;s<q;++s){if(J.aA(r.S(0,s),b))return!0
if(q!==r.gi(r))throw H.d(P.a6(r))}return!1},
ah:function(a,b,c){return new H.aa(this,b,H.A(this).h("@<af.E>").G(c).h("aa<1,2>"))},
a4:function(a,b){return H.dG(this,b,null,H.A(this).h("af.E"))}}
H.dF.prototype={
gdm:function(){var s=J.Z(this.a),r=this.c
if(r==null||r>s)return s
return r},
gdO:function(){var s=J.Z(this.a),r=this.b
if(r>s)return s
return r},
gi:function(a){var s,r=J.Z(this.a),q=this.b
if(q>=r)return 0
s=this.c
if(s==null||s>=r)return r-q
return s-q},
S:function(a,b){var s=this,r=s.gdO()+b
if(b<0||r>=s.gdm())throw H.d(P.eM(b,s,"index",null,null))
return J.ew(s.a,r)},
a4:function(a,b){var s,r,q=this
P.aV(b,"count")
s=q.b+b
r=q.c
if(r!=null&&s>=r)return new H.b6(q.$ti.h("b6<1>"))
return H.dG(q.a,s,r,q.$ti.c)},
aM:function(a,b){var s,r,q,p=this,o=p.b,n=p.a,m=J.O(n),l=m.gi(n),k=p.c
if(k!=null&&k<l)l=k
s=l-o
if(s<=0){n=J.b7(0,p.$ti.c)
return n}r=P.P(s,m.S(n,o),!1,p.$ti.c)
for(q=1;q<s;++q){r[q]=m.S(n,o+q)
if(m.gi(n)<l)throw H.d(P.a6(p))}return r}}
H.a9.prototype={
gq:function(){return this.d},
n:function(){var s,r=this,q=r.a,p=J.O(q),o=p.gi(q)
if(r.b!==o)throw H.d(P.a6(q))
s=r.c
if(s>=o){r.d=null
return!1}r.d=p.S(q,s);++r.c
return!0},
$iJ:1}
H.bb.prototype={
gC:function(a){var s=H.A(this)
return new H.dv(J.an(this.a),this.b,s.h("@<1>").G(s.Q[1]).h("dv<1,2>"))},
gi:function(a){return J.Z(this.a)},
gv:function(a){return J.nU(this.a)},
S:function(a,b){return this.b.$1(J.ew(this.a,b))}}
H.c3.prototype={$io:1}
H.dv.prototype={
n:function(){var s=this,r=s.b
if(r.n()){s.a=s.c.$1(r.gq())
return!0}s.a=null
return!1},
gq:function(){return this.a}}
H.aa.prototype={
gi:function(a){return J.Z(this.a)},
S:function(a,b){return this.b.$1(J.ew(this.a,b))}}
H.ln.prototype={
gC:function(a){return new H.cv(J.an(this.a),this.b,this.$ti.h("cv<1>"))},
ah:function(a,b,c){return new H.bb(this,b,this.$ti.h("@<1>").G(c).h("bb<1,2>"))}}
H.cv.prototype={
n:function(){var s,r
for(s=this.a,r=this.b;s.n();)if(r.$1(s.gq()))return!0
return!1},
gq:function(){return this.a.gq()}}
H.be.prototype={
a4:function(a,b){P.h0(b,"count")
P.aV(b,"count")
return new H.be(this.a,this.b+b,H.A(this).h("be<1>"))},
gC:function(a){return new H.dD(J.an(this.a),this.b,H.A(this).h("dD<1>"))}}
H.cG.prototype={
gi:function(a){var s=J.Z(this.a)-this.b
if(s>=0)return s
return 0},
a4:function(a,b){P.h0(b,"count")
P.aV(b,"count")
return new H.cG(this.a,this.b+b,this.$ti)},
$io:1}
H.dD.prototype={
n:function(){var s,r
for(s=this.a,r=0;r<this.b;++r)s.n()
this.b=0
return s.n()},
gq:function(){return this.a.gq()}}
H.b6.prototype={
gC:function(a){return C.a_},
gv:function(a){return!0},
gi:function(a){return 0},
S:function(a,b){throw H.d(P.V(b,0,0,"index",null))},
E:function(a,b){return!1},
ah:function(a,b,c){return new H.b6(c.h("b6<0>"))},
a4:function(a,b){P.aV(b,"count")
return this}}
H.dg.prototype={
n:function(){return!1},
gq:function(){throw H.d(H.mZ())},
$iJ:1}
H.di.prototype={
si:function(a,b){throw H.d(P.ac("Cannot change the length of a fixed-length list"))},
B:function(a,b){throw H.d(P.ac("Cannot add to a fixed-length list"))}}
H.fn.prototype={
m:function(a,b,c){throw H.d(P.ac("Cannot modify an unmodifiable list"))},
si:function(a,b){throw H.d(P.ac("Cannot change the length of an unmodifiable list"))},
B:function(a,b){throw H.d(P.ac("Cannot add to an unmodifiable list"))}}
H.cU.prototype={}
H.cS.prototype={
gF:function(a){var s=this._hashCode
if(s!=null)return s
s=664597*J.aF(this.a)&536870911
this._hashCode=s
return s},
k:function(a){return'Symbol("'+H.b(this.a)+'")'},
N:function(a,b){if(b==null)return!1
return b instanceof H.cS&&this.a==b.a},
$icT:1}
H.eg.prototype={}
H.de.prototype={}
H.cF.prototype={
ag:function(a,b,c){var s=H.A(this)
return P.og(this,s.c,s.Q[1],b,c)},
gv:function(a){return this.gi(this)===0},
k:function(a){return P.n3(this)},
m:function(a,b,c){H.tx()
H.bx(u.g)},
$ih:1}
H.ap.prototype={
gi:function(a){return this.a},
w:function(a){if(typeof a!="string")return!1
if("__proto__"===a)return!1
return this.b.hasOwnProperty(a)},
j:function(a,b){if(!this.w(b))return null
return this.cg(b)},
cg:function(a){return this.b[a]},
K:function(a,b){var s,r,q,p=this.c
for(s=p.length,r=0;r<s;++r){q=p[r]
b.$2(q,this.cg(q))}},
gL:function(){return new H.dL(this,H.A(this).h("dL<1>"))}}
H.dL.prototype={
gC:function(a){var s=this.a.c
return new J.aG(s,s.length,H.X(s).h("aG<1>"))},
gi:function(a){return this.a.c.length}}
H.a4.prototype={
aF:function(){var s,r=this,q=r.$map
if(q==null){s=r.$ti
q=new H.aK(s.h("@<1>").G(s.Q[1]).h("aK<1,2>"))
H.po(r.a,q)
r.$map=q}return q},
w:function(a){return this.aF().w(a)},
j:function(a,b){return this.aF().j(0,b)},
K:function(a,b){this.aF().K(0,b)},
gL:function(){var s=this.aF()
return new H.at(s,H.A(s).h("at<1>"))},
gi:function(a){return this.aF().a}}
H.iz.prototype={
gcQ:function(){var s=this.a
return s},
gcU:function(){var s,r,q,p,o=this
if(o.c===1)return C.ak
s=o.d
r=s.length-o.e.length-o.f
if(r===0)return C.ak
q=[]
for(p=0;p<r;++p)q.push(s[p])
q.fixed$length=Array
q.immutable$list=Array
return q},
gcR:function(){var s,r,q,p,o,n,m=this
if(m.c!==0)return C.aq
s=m.e
r=s.length
q=m.d
p=q.length-r-m.f
if(r===0)return C.aq
o=new H.aK(t.eo)
for(n=0;n<r;++n)o.m(0,new H.cS(s[n]),q[p+n])
return new H.de(o,t.gF)}}
H.jR.prototype={
$2:function(a,b){var s=this.a
s.b=s.b+"$"+H.b(a)
this.b.push(a)
this.c.push(b);++s.a},
$S:68}
H.l6.prototype={
a7:function(a){var s,r,q=this,p=new RegExp(q.a).exec(a)
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
H.f4.prototype={
k:function(a){var s=this.b
if(s==null)return"NoSuchMethodError: "+H.b(this.a)
return"NoSuchMethodError: method not found: '"+s+"' on null"}}
H.eQ.prototype={
k:function(a){var s,r=this,q="NoSuchMethodError: method not found: '",p=r.b
if(p==null)return"NoSuchMethodError: "+H.b(r.a)
s=r.c
if(s==null)return q+p+"' ("+H.b(r.a)+")"
return q+p+"' on '"+s+"' ("+H.b(r.a)+")"}}
H.fm.prototype={
k:function(a){var s=this.a
return s.length===0?"Error":"Error: "+s}}
H.f6.prototype={
k:function(a){return"Throw of null ('"+(this.a===null?"null":"undefined")+"' from JavaScript)"},
$ia7:1}
H.dh.prototype={}
H.e3.prototype={
k:function(a){var s,r=this.b
if(r!=null)return r
r=this.a
s=r!==null&&typeof r==="object"?r.stack:null
return this.b=s==null?"":s},
$iak:1}
H.c2.prototype={
k:function(a){var s=this.constructor,r=s==null?null:s.name
return"Closure '"+H.pH(r==null?"unknown":r)+"'"},
$iaI:1,
geD:function(){return this},
$C:"$1",
$R:1,
$D:null}
H.fh.prototype={}
H.ff.prototype={
k:function(a){var s=this.$static_name
if(s==null)return"Closure of unknown static method"
return"Closure '"+H.pH(s)+"'"}}
H.cD.prototype={
N:function(a,b){var s=this
if(b==null)return!1
if(s===b)return!0
if(!(b instanceof H.cD))return!1
return s.a===b.a&&s.b===b.b&&s.c===b.c},
gF:function(a){var s,r=this.c
if(r==null)s=H.cr(this.a)
else s=typeof r!=="object"?J.aF(r):H.cr(r)
return(s^H.cr(this.b))>>>0},
k:function(a){var s=this.c
if(s==null)s=this.a
return"Closure '"+H.b(this.d)+"' of "+("Instance of '"+H.b(H.jS(s))+"'")}}
H.fe.prototype={
k:function(a){return"RuntimeError: "+this.a}}
H.lX.prototype={}
H.aK.prototype={
gi:function(a){return this.a},
gv:function(a){return this.a===0},
gL:function(){return new H.at(this,H.A(this).h("at<1>"))},
ga_:function(){var s=H.A(this)
return H.jy(new H.at(this,s.h("at<1>")),new H.iF(this),s.c,s.Q[1])},
w:function(a){var s,r,q=this
if(typeof a=="string"){s=q.b
if(s==null)return!1
return q.ce(s,a)}else if(typeof a=="number"&&(a&0x3ffffff)===a){r=q.c
if(r==null)return!1
return q.ce(r,a)}else return q.e7(a)},
e7:function(a){var s=this.d
if(s==null)return!1
return this.bM(this.bv(s,J.aF(a)&0x3ffffff),a)>=0},
j:function(a,b){var s,r,q,p,o=this,n=null
if(typeof b=="string"){s=o.b
if(s==null)return n
r=o.aX(s,b)
q=r==null?n:r.b
return q}else if(typeof b=="number"&&(b&0x3ffffff)===b){p=o.c
if(p==null)return n
r=o.aX(p,b)
q=r==null?n:r.b
return q}else return o.e8(b)},
e8:function(a){var s,r,q=this.d
if(q==null)return null
s=this.bv(q,J.aF(a)&0x3ffffff)
r=this.bM(s,a)
if(r<0)return null
return s[r].b},
m:function(a,b,c){var s,r,q,p,o,n,m=this
if(typeof b=="string"){s=m.b
m.c5(s==null?m.b=m.by():s,b,c)}else if(typeof b=="number"&&(b&0x3ffffff)===b){r=m.c
m.c5(r==null?m.c=m.by():r,b,c)}else{q=m.d
if(q==null)q=m.d=m.by()
p=J.aF(b)&0x3ffffff
o=m.bv(q,p)
if(o==null)m.bA(q,p,[m.bz(b,c)])
else{n=m.bM(o,b)
if(n>=0)o[n].b=c
else o.push(m.bz(b,c))}}},
bT:function(a,b){var s
if(this.w(a))return this.j(0,a)
s=b.$0()
this.m(0,a,s)
return s},
K:function(a,b){var s=this,r=s.e,q=s.r
for(;r!=null;){b.$2(r.a,r.b)
if(q!==s.r)throw H.d(P.a6(s))
r=r.c}},
c5:function(a,b,c){var s=this.aX(a,b)
if(s==null)this.bA(a,b,this.bz(b,c))
else s.b=c},
bz:function(a,b){var s=this,r=new H.jv(a,b)
if(s.e==null)s.e=s.f=r
else s.f=s.f.c=r;++s.a
s.r=s.r+1&67108863
return r},
bM:function(a,b){var s,r
if(a==null)return-1
s=a.length
for(r=0;r<s;++r)if(J.aA(a[r].a,b))return r
return-1},
k:function(a){return P.n3(this)},
aX:function(a,b){return a[b]},
bv:function(a,b){return a[b]},
bA:function(a,b,c){a[b]=c},
dl:function(a,b){delete a[b]},
ce:function(a,b){return this.aX(a,b)!=null},
by:function(){var s="<non-identifier-key>",r=Object.create(null)
this.bA(r,s,r)
this.dl(r,s)
return r}}
H.iF.prototype={
$1:function(a){return this.a.j(0,a)},
$S:function(){return H.A(this.a).h("2(1)")}}
H.jv.prototype={}
H.at.prototype={
gi:function(a){return this.a.a},
gv:function(a){return this.a.a===0},
gC:function(a){var s=this.a,r=new H.dr(s,s.r,this.$ti.h("dr<1>"))
r.c=s.e
return r},
E:function(a,b){return this.a.w(b)}}
H.dr.prototype={
gq:function(){return this.d},
n:function(){var s,r=this,q=r.a
if(r.b!==q.r)throw H.d(P.a6(q))
s=r.c
if(s==null){r.d=null
return!1}else{r.d=s.a
r.c=s.c
return!0}},
$iJ:1}
H.mw.prototype={
$1:function(a){return this.a(a)},
$S:29}
H.mx.prototype={
$2:function(a,b){return this.a(a,b)},
$S:32}
H.my.prototype={
$1:function(a){return this.a(a)},
$S:48}
H.iA.prototype={
k:function(a){return"RegExp/"+this.a+"/"+this.b.flags},
aH:function(a){var s
if(typeof a!="string")H.a0(H.bQ(a))
s=this.b.exec(a)
if(s==null)return null
return new H.lV(s)}}
H.lV.prototype={}
H.dy.prototype={
dA:function(a,b,c,d){var s=P.V(b,0,c,d,null)
throw H.d(s)},
cc:function(a,b,c,d){if(b>>>0!==b||b>c)this.dA(a,b,c,d)}}
H.cP.prototype={
gi:function(a){return a.length},
dM:function(a,b,c,d,e){var s,r,q=a.length
this.cc(a,b,q,"start")
this.cc(a,c,q,"end")
if(b>c)throw H.d(P.V(b,0,c,null,null))
s=c-b
if(e<0)throw H.d(P.T(e))
r=d.length
if(r-e<s)throw H.d(P.cR("Not enough elements"))
if(e!==0||r!==s)d=d.subarray(e,e+s)
a.set(d,b)},
$ias:1}
H.dx.prototype={
j:function(a,b){H.bh(b,a,a.length)
return a[b]},
m:function(a,b,c){H.bh(b,a,a.length)
a[b]=c},
$io:1,
$ij:1,
$im:1}
H.au.prototype={
m:function(a,b,c){H.bh(b,a,a.length)
a[b]=c},
a3:function(a,b,c,d,e){if(t.eB.b(d)){this.dM(a,b,c,d,e)
return}this.d5(a,b,c,d,e)},
d2:function(a,b,c,d){return this.a3(a,b,c,d,0)},
$io:1,
$ij:1,
$im:1}
H.dw.prototype={
a0:function(a,b,c){return new Float32Array(a.subarray(b,H.bN(b,c,a.length)))}}
H.eX.prototype={
a0:function(a,b,c){return new Float64Array(a.subarray(b,H.bN(b,c,a.length)))}}
H.eY.prototype={
j:function(a,b){H.bh(b,a,a.length)
return a[b]},
a0:function(a,b,c){return new Int16Array(a.subarray(b,H.bN(b,c,a.length)))}}
H.eZ.prototype={
j:function(a,b){H.bh(b,a,a.length)
return a[b]},
a0:function(a,b,c){return new Int32Array(a.subarray(b,H.bN(b,c,a.length)))}}
H.f_.prototype={
j:function(a,b){H.bh(b,a,a.length)
return a[b]},
a0:function(a,b,c){return new Int8Array(a.subarray(b,H.bN(b,c,a.length)))}}
H.f0.prototype={
j:function(a,b){H.bh(b,a,a.length)
return a[b]},
a0:function(a,b,c){return new Uint16Array(a.subarray(b,H.bN(b,c,a.length)))}}
H.f1.prototype={
j:function(a,b){H.bh(b,a,a.length)
return a[b]},
a0:function(a,b,c){return new Uint32Array(a.subarray(b,H.bN(b,c,a.length)))}}
H.dz.prototype={
gi:function(a){return a.length},
j:function(a,b){H.bh(b,a,a.length)
return a[b]},
a0:function(a,b,c){return new Uint8ClampedArray(a.subarray(b,H.bN(b,c,a.length)))}}
H.cn.prototype={
gi:function(a){return a.length},
j:function(a,b){H.bh(b,a,a.length)
return a[b]},
a0:function(a,b,c){return new Uint8Array(a.subarray(b,H.bN(b,c,a.length)))},
$icn:1,
$iag:1}
H.e_.prototype={}
H.e0.prototype={}
H.e1.prototype={}
H.e2.prototype={}
H.aN.prototype={
h:function(a){return H.fM(v.typeUniverse,this,a)},
G:function(a){return H.uU(v.typeUniverse,this,a)}}
H.fA.prototype={}
H.e8.prototype={
k:function(a){return H.ay(this.a,null)},
$ibF:1}
H.fz.prototype={
k:function(a){return this.a}}
H.e9.prototype={}
P.lz.prototype={
$1:function(a){var s=this.a,r=s.a
s.a=null
r.$0()},
$S:13}
P.ly.prototype={
$1:function(a){var s,r
this.a.a=a
s=this.b
r=this.c
s.firstChild?s.removeChild(r):s.appendChild(r)},
$S:94}
P.lA.prototype={
$0:function(){this.a.$0()},
$C:"$0",
$R:0,
$S:2}
P.lB.prototype={
$0:function(){this.a.$0()},
$C:"$0",
$R:0,
$S:2}
P.m2.prototype={
d8:function(a,b){if(self.setTimeout!=null)self.setTimeout(H.mm(new P.m3(this,b),0),a)
else throw H.d(P.ac("`setTimeout()` not found."))}}
P.m3.prototype={
$0:function(){this.b.$0()},
$C:"$0",
$R:0,
$S:1}
P.ft.prototype={
T:function(a){var s,r=this
if(!r.b)r.a.aT(a)
else{s=r.a
if(r.$ti.h("a3<1>").b(a))s.ca(a)
else s.bp(a)}},
bE:function(a,b){var s
if(b==null)b=P.eA(a)
s=this.a
if(this.b)s.au(a,b)
else s.aU(a,b)}}
P.m6.prototype={
$1:function(a){return this.a.$2(0,a)},
$S:33}
P.m7.prototype={
$2:function(a,b){this.a.$2(1,new H.dh(a,b))},
$C:"$2",
$R:2,
$S:41}
P.ml.prototype={
$2:function(a,b){this.a(a,b)},
$S:47}
P.cY.prototype={
k:function(a){return"IterationMarker("+this.b+", "+H.b(this.a)+")"}}
P.aC.prototype={
gq:function(){var s=this.c
if(s==null)return this.b
return s.gq()},
n:function(){var s,r,q,p,o,n=this
for(;!0;){s=n.c
if(s!=null)if(s.n())return!0
else n.c=null
r=function(a,b,c){var m,l=b
while(true)try{return a(l,m)}catch(k){m=k
l=c}}(n.a,0,1)
if(r instanceof P.cY){q=r.b
if(q===2){p=n.d
if(p==null||p.length===0){n.b=null
return!1}n.a=p.pop()
continue}else{s=r.a
if(q===3)throw s
else{o=J.an(s)
if(o instanceof P.aC){s=n.d
if(s==null)s=n.d=[]
s.push(n.a)
n.a=o.a
continue}else{n.c=o
continue}}}}else{n.b=r
return!0}}return!1},
$iJ:1}
P.e7.prototype={
gC:function(a){return new P.aC(this.a(),this.$ti.h("aC<1>"))}}
P.ez.prototype={
k:function(a){return H.b(this.a)},
$iF:1,
gaP:function(){return this.b}}
P.fw.prototype={
bE:function(a,b){var s
H.da(a,"error",t.K)
s=this.a
if(s.a!==0)throw H.d(P.cR("Future already completed"))
if(b==null)b=P.eA(a)
s.aU(a,b)},
M:function(a){return this.bE(a,null)}}
P.aw.prototype={
T:function(a){var s=this.a
if(s.a!==0)throw H.d(P.cR("Future already completed"))
s.aT(a)},
b4:function(){return this.T(null)}}
P.bI.prototype={
eb:function(a){if((this.c&15)!==6)return!0
return this.b.b.bY(this.d,a.a)},
e4:function(a){var s=this.e,r=this.b.b
if(t.r.b(s))return r.ek(s,a.a,a.b)
else return r.bY(s,a.a)}}
P.C.prototype={
aq:function(a,b,c,d){var s,r,q=$.z
if(q!==C.f)c=c!=null?P.vH(c,q):c
s=new P.C(q,d.h("C<0>"))
r=c==null?1:3
this.aR(new P.bI(s,r,b,c,this.$ti.h("@<1>").G(d).h("bI<1,2>")))
return s},
cX:function(a,b,c){return this.aq(a,b,null,c)},
cw:function(a,b,c){var s=new P.C($.z,c.h("C<0>"))
this.aR(new P.bI(s,19,a,b,this.$ti.h("@<1>").G(c).h("bI<1,2>")))
return s},
bf:function(a){var s=this.$ti,r=new P.C($.z,s)
this.aR(new P.bI(r,8,a,null,s.h("@<1>").G(s.c).h("bI<1,2>")))
return r},
aR:function(a){var s,r=this,q=r.a
if(q<=1){a.a=r.c
r.c=a}else{if(q===2){q=r.c
s=q.a
if(s<4){q.aR(a)
return}r.a=s
r.c=q.c}P.d8(null,null,r.b,new P.lG(r,a))}},
cq:function(a){var s,r,q,p,o,n,m=this,l={}
l.a=a
if(a==null)return
s=m.a
if(s<=1){r=m.c
m.c=a
if(r!=null){q=a.a
for(p=a;q!=null;p=q,q=o)o=q.a
p.a=r}}else{if(s===2){s=m.c
n=s.a
if(n<4){s.cq(a)
return}m.a=n
m.c=s.c}l.a=m.b3(a)
P.d8(null,null,m.b,new P.lN(l,m))}},
b2:function(){var s=this.c
this.c=null
return this.b3(s)},
b3:function(a){var s,r,q
for(s=a,r=null;s!=null;r=s,s=q){q=s.a
s.a=r}return r},
c9:function(a){var s,r,q,p=this
p.a=1
try{a.aq(0,new P.lJ(p),new P.lK(p),t.P)}catch(q){s=H.G(q)
r=H.aD(q)
P.pD(new P.lL(p,s,r))}},
bp:function(a){var s=this,r=s.b2()
s.a=4
s.c=a
P.cX(s,r)},
au:function(a,b){var s=this,r=s.b2(),q=P.h2(a,b)
s.a=8
s.c=q
P.cX(s,r)},
aT:function(a){if(this.$ti.h("a3<1>").b(a)){this.ca(a)
return}this.dd(a)},
dd:function(a){this.a=1
P.d8(null,null,this.b,new P.lI(this,a))},
ca:function(a){var s=this
if(s.$ti.b(a)){if(a.a===8){s.a=1
P.d8(null,null,s.b,new P.lM(s,a))}else P.n7(a,s)
return}s.c9(a)},
aU:function(a,b){this.a=1
P.d8(null,null,this.b,new P.lH(this,a,b))},
$ia3:1}
P.lG.prototype={
$0:function(){P.cX(this.a,this.b)},
$S:1}
P.lN.prototype={
$0:function(){P.cX(this.b,this.a.a)},
$S:1}
P.lJ.prototype={
$1:function(a){var s,r,q,p=this.a
p.a=0
try{p.bp(p.$ti.c.a(a))}catch(q){s=H.G(q)
r=H.aD(q)
p.au(s,r)}},
$S:13}
P.lK.prototype={
$2:function(a,b){this.a.au(a,b)},
$C:"$2",
$R:2,
$S:50}
P.lL.prototype={
$0:function(){this.a.au(this.b,this.c)},
$S:1}
P.lI.prototype={
$0:function(){this.a.bp(this.b)},
$S:1}
P.lM.prototype={
$0:function(){P.n7(this.b,this.a)},
$S:1}
P.lH.prototype={
$0:function(){this.a.au(this.b,this.c)},
$S:1}
P.lQ.prototype={
$0:function(){var s,r,q,p,o,n,m=this,l=null
try{q=m.a.a
l=q.b.b.bX(q.d)}catch(p){s=H.G(p)
r=H.aD(p)
if(m.c){q=m.b.a.c.a
o=s
o=q==null?o==null:q===o
q=o}else q=!1
o=m.a
if(q)o.c=m.b.a.c
else o.c=P.h2(s,r)
o.b=!0
return}if(l instanceof P.C&&l.a>=4){if(l.a===8){q=m.a
q.c=l.c
q.b=!0}return}if(t.d.b(l)){n=m.b.a
q=m.a
q.c=J.t9(l,new P.lR(n),t.z)
q.b=!1}},
$S:1}
P.lR.prototype={
$1:function(a){return this.a},
$S:51}
P.lP.prototype={
$0:function(){var s,r,q,p,o
try{q=this.a
p=q.a
q.c=p.b.b.bY(p.d,this.b)}catch(o){s=H.G(o)
r=H.aD(o)
q=this.a
q.c=P.h2(s,r)
q.b=!0}},
$S:1}
P.lO.prototype={
$0:function(){var s,r,q,p,o,n,m,l,k=this
try{s=k.a.a.c
p=k.b
if(p.a.eb(s)&&p.a.e!=null){p.c=p.a.e4(s)
p.b=!1}}catch(o){r=H.G(o)
q=H.aD(o)
p=k.a.a.c
n=p.a
m=r
l=k.b
if(n==null?m==null:n===m)l.c=p
else l.c=P.h2(r,q)
l.b=!0}},
$S:1}
P.fu.prototype={}
P.aX.prototype={
gi:function(a){var s={},r=new P.C($.z,t.fJ)
s.a=0
this.bO(new P.l2(s,this),!0,new P.l3(s,r),r.gdh())
return r}}
P.l_.prototype={
$1:function(a){var s=this.a
s.aS(a)
s.aV()},
$S:function(){return this.b.h("k(0)")}}
P.l0.prototype={
$2:function(a,b){var s=this.a
s.aQ(a,b)
s.aV()},
$C:"$2",
$R:2,
$S:53}
P.l1.prototype={
$0:function(){var s=this.a
return new P.dX(new J.aG(s,1,H.X(s).h("aG<1>")))},
$S:function(){return this.b.h("dX<0>()")}}
P.l2.prototype={
$1:function(a){++this.a.a},
$S:function(){return H.A(this.b).h("~(1)")}}
P.l3.prototype={
$0:function(){var s=this.b,r=this.a.a,q=s.b2()
s.a=4
s.c=r
P.cX(s,q)},
$C:"$0",
$R:0,
$S:1}
P.fg.prototype={}
P.d1.prototype={
gdH:function(){if((this.b&8)===0)return this.a
return this.a.gc0()},
aW:function(){var s,r=this
if((r.b&8)===0){s=r.a
return s==null?r.a=new P.e5():s}s=r.a.gc0()
return s},
gax:function(){var s=this.a
return(this.b&8)!==0?s.gc0():s},
bl:function(){if((this.b&4)!==0)return new P.bC("Cannot add event after closing")
return new P.bC("Cannot add event while adding a stream")},
cf:function(){var s=this.c
if(s==null)s=this.c=(this.b&2)!==0?$.fU():new P.C($.z,t.D)
return s},
B:function(a,b){if(this.b>=4)throw H.d(this.bl())
this.aS(b)},
a5:function(){var s=this,r=s.b
if((r&4)!==0)return s.cf()
if(r>=4)throw H.d(s.bl())
s.aV()
return s.cf()},
aV:function(){var s=this.b|=4
if((s&1)!==0)this.av()
else if((s&3)===0)this.aW().B(0,C.H)},
aS:function(a){var s=this.b
if((s&1)!==0)this.al(a)
else if((s&3)===0)this.aW().B(0,new P.cw(a))},
aQ:function(a,b){var s=this.b
if((s&1)!==0)this.aw(a,b)
else if((s&3)===0)this.aW().B(0,new P.dN(a,b))},
dP:function(a,b,c,d){var s,r,q,p,o,n,m=this
if((m.b&3)!==0)throw H.d(P.cR("Stream has already been listened to."))
s=$.z
r=d?1:0
q=P.oO(s,b)
p=new P.dM(m,a,q,c,s,r)
o=m.gdH()
s=m.b|=1
if((s&8)!==0){n=m.a
n.sc0(p)
n.ap()}else m.a=p
p.cs(o)
p.bw(new P.m1(m))
return p},
dJ:function(a){var s,r,q,p,o,n,m,l=this,k=null
if((l.b&8)!==0)k=l.a.J()
l.a=null
l.b=l.b&4294967286|2
s=l.r
if(s!=null)if(k==null)try{r=s.$0()
if(t.bq.b(r))k=r}catch(o){q=H.G(o)
p=H.aD(o)
n=new P.C($.z,t.D)
n.aU(q,p)
k=n}else k=k.bf(s)
m=new P.m0(l)
if(k!=null)k=k.bf(m)
else m.$0()
return k}}
P.m1.prototype={
$0:function(){P.nk(this.a.d)},
$S:1}
P.m0.prototype={
$0:function(){var s=this.a.c
if(s!=null&&s.a===0)s.aT(null)},
$S:1}
P.fJ.prototype={
al:function(a){this.gax().aS(a)},
aw:function(a,b){this.gax().aQ(a,b)},
av:function(){this.gax().dg()}}
P.fv.prototype={
al:function(a){this.gax().at(new P.cw(a))},
aw:function(a,b){this.gax().at(new P.dN(a,b))},
av:function(){this.gax().at(C.H)}}
P.bG.prototype={}
P.d2.prototype={}
P.al.prototype={
bs:function(a,b,c,d){return this.a.dP(a,b,c,d)},
gF:function(a){return(H.cr(this.a)^892482866)>>>0},
N:function(a,b){if(b==null)return!1
if(this===b)return!0
return b instanceof P.al&&b.a===this.a}}
P.dM.prototype={
cn:function(){return this.x.dJ(this)},
b0:function(){var s=this.x
if((s.b&8)!==0)s.a.aL()
P.nk(s.e)},
b1:function(){var s=this.x
if((s.b&8)!==0)s.a.ap()
P.nk(s.f)}}
P.cV.prototype={
cs:function(a){var s=this
if(a==null)return
s.r=a
if(!a.gv(a)){s.e=(s.e|64)>>>0
a.aO(s)}},
cT:function(a){var s,r,q=this,p=q.e
if((p&8)!==0)return
s=(p+128|4)>>>0
q.e=s
if(p<128){r=q.r
if(r!=null)if(r.a===1)r.a=3}if((p&4)===0&&(s&32)===0)q.bw(q.gco())},
aL:function(){return this.cT(null)},
ap:function(){var s=this,r=s.e
if((r&8)!==0)return
if(r>=128){r=s.e=r-128
if(r<128){if((r&64)!==0){r=s.r
r=!r.gv(r)}else r=!1
if(r)s.r.aO(s)
else{r=(s.e&4294967291)>>>0
s.e=r
if((r&32)===0)s.bw(s.gcp())}}}},
J:function(){var s=this,r=(s.e&4294967279)>>>0
s.e=r
if((r&8)===0)s.bm()
r=s.f
return r==null?$.fU():r},
bm:function(){var s,r=this,q=r.e=(r.e|8)>>>0
if((q&64)!==0){s=r.r
if(s.a===1)s.a=3}if((q&32)===0)r.r=null
r.f=r.cn()},
aS:function(a){var s=this.e
if((s&8)!==0)return
if(s<32)this.al(a)
else this.at(new P.cw(a))},
aQ:function(a,b){var s=this.e
if((s&8)!==0)return
if(s<32)this.aw(a,b)
else this.at(new P.dN(a,b))},
dg:function(){var s=this,r=s.e
if((r&8)!==0)return
r=(r|2)>>>0
s.e=r
if(r<32)s.av()
else s.at(C.H)},
b0:function(){},
b1:function(){},
cn:function(){return null},
at:function(a){var s,r=this,q=r.r
if(q==null)q=new P.e5()
r.r=q
q.B(0,a)
s=r.e
if((s&64)===0){s=(s|64)>>>0
r.e=s
if(s<128)q.aO(r)}},
al:function(a){var s=this,r=s.e
s.e=(r|32)>>>0
s.d.cW(s.a,a)
s.e=(s.e&4294967263)>>>0
s.bn((r&4)!==0)},
aw:function(a,b){var s,r=this,q=r.e,p=new P.lE(r,a,b)
if((q&1)!==0){r.e=(q|16)>>>0
r.bm()
s=r.f
if(s!=null&&s!==$.fU())s.bf(p)
else p.$0()}else{p.$0()
r.bn((q&4)!==0)}},
av:function(){var s,r=this,q=new P.lD(r)
r.bm()
r.e=(r.e|16)>>>0
s=r.f
if(s!=null&&s!==$.fU())s.bf(q)
else q.$0()},
bw:function(a){var s=this,r=s.e
s.e=(r|32)>>>0
a.$0()
s.e=(s.e&4294967263)>>>0
s.bn((r&4)!==0)},
bn:function(a){var s,r,q=this
if((q.e&64)!==0){s=q.r
s=s.gv(s)}else s=!1
if(s){s=q.e=(q.e&4294967231)>>>0
if((s&4)!==0)if(s<128){s=q.r
s=s==null?null:s.gv(s)
s=s!==!1}else s=!1
else s=!1
if(s)q.e=(q.e&4294967291)>>>0}for(;!0;a=r){s=q.e
if((s&8)!==0){q.r=null
return}r=(s&4)!==0
if(a===r)break
q.e=(s^32)>>>0
if(r)q.b0()
else q.b1()
q.e=(q.e&4294967263)>>>0}s=q.e
if((s&64)!==0&&s<128)q.r.aO(q)}}
P.lE.prototype={
$0:function(){var s,r,q=this.a,p=q.e
if((p&8)!==0&&(p&16)===0)return
q.e=(p|32)>>>0
s=q.b
p=this.b
r=q.d
if(t.k.b(s))r.en(s,p,this.c)
else r.cW(s,p)
q.e=(q.e&4294967263)>>>0},
$S:1}
P.lD.prototype={
$0:function(){var s=this.a,r=s.e
if((r&16)===0)return
s.e=(r|42)>>>0
s.d.cV(s.c)
s.e=(s.e&4294967263)>>>0},
$S:1}
P.e4.prototype={
bO:function(a,b,c,d){return this.bs(a,d,c,b===!0)},
bN:function(a,b,c){return this.bO(a,null,b,c)},
e9:function(a,b){return this.bO(a,null,b,null)},
bs:function(a,b,c,d){return P.oN(a,b,c,d)}}
P.dQ.prototype={
bs:function(a,b,c,d){var s
if(this.b)throw H.d(P.cR("Stream has already been listened to."))
this.b=!0
s=P.oN(a,b,c,d)
s.cs(this.a.$0())
return s}}
P.dX.prototype={
gv:function(a){return this.b==null},
cI:function(a){var s,r,q,p,o=this.b
if(o==null)throw H.d(P.cR("No events pending."))
s=!1
try{if(o.n()){s=!0
a.al(o.gq())}else{this.b=null
a.av()}}catch(p){r=H.G(p)
q=H.aD(p)
if(!s)this.b=C.a_
a.aw(r,q)}}}
P.fy.prototype={
gaB:function(){return this.a},
saB:function(a){return this.a=a}}
P.cw.prototype={
bR:function(a){a.al(this.b)}}
P.dN.prototype={
bR:function(a){a.aw(this.b,this.c)}}
P.lF.prototype={
bR:function(a){a.av()},
gaB:function(){return null},
saB:function(a){throw H.d(P.cR("No events after a done."))}}
P.fE.prototype={
aO:function(a){var s=this,r=s.a
if(r===1)return
if(r>=1){s.a=1
return}P.pD(new P.lW(s,a))
s.a=1}}
P.lW.prototype={
$0:function(){var s=this.a,r=s.a
s.a=0
if(r===3)return
s.cI(this.b)},
$S:1}
P.e5.prototype={
gv:function(a){return this.c==null},
B:function(a,b){var s=this,r=s.c
if(r==null)s.b=s.c=b
else{r.saB(b)
s.c=b}},
cI:function(a){var s=this.b,r=s.gaB()
this.b=r
if(r==null)this.c=null
s.bR(a)}}
P.fH.prototype={}
P.m5.prototype={}
P.mj.prototype={
$0:function(){var s=H.d(this.a)
s.stack=J.ah(this.b)
throw s},
$S:1}
P.lY.prototype={
cV:function(a){var s,r,q,p=null
try{if(C.f===$.z){a.$0()
return}P.pe(p,p,this,a)}catch(q){s=H.G(q)
r=H.aD(q)
P.d7(p,p,this,s,r)}},
ep:function(a,b){var s,r,q,p=null
try{if(C.f===$.z){a.$1(b)
return}P.pg(p,p,this,a,b)}catch(q){s=H.G(q)
r=H.aD(q)
P.d7(p,p,this,s,r)}},
cW:function(a,b){return this.ep(a,b,t.z)},
em:function(a,b,c){var s,r,q,p=null
try{if(C.f===$.z){a.$2(b,c)
return}P.pf(p,p,this,a,b,c)}catch(q){s=H.G(q)
r=H.aD(q)
P.d7(p,p,this,s,r)}},
en:function(a,b,c){return this.em(a,b,c,t.z,t.z)},
dS:function(a,b){return new P.m_(this,a,b)},
cA:function(a){return new P.lZ(this,a)},
ej:function(a){if($.z===C.f)return a.$0()
return P.pe(null,null,this,a)},
bX:function(a){return this.ej(a,t.z)},
eo:function(a,b){if($.z===C.f)return a.$1(b)
return P.pg(null,null,this,a,b)},
bY:function(a,b){return this.eo(a,b,t.z,t.z)},
el:function(a,b,c){if($.z===C.f)return a.$2(b,c)
return P.pf(null,null,this,a,b,c)},
ek:function(a,b,c){return this.el(a,b,c,t.z,t.z,t.z)},
eg:function(a){return a},
bW:function(a){return this.eg(a,t.z,t.z,t.z)}}
P.m_.prototype={
$0:function(){return this.a.bX(this.b)},
$S:function(){return this.c.h("0()")}}
P.lZ.prototype={
$0:function(){return this.a.cV(this.b)},
$S:1}
P.dS.prototype={
gi:function(a){return this.a},
gv:function(a){return this.a===0},
gL:function(){return new P.dT(this,this.$ti.h("dT<1>"))},
w:function(a){var s,r
if(typeof a=="string"&&a!=="__proto__"){s=this.b
return s==null?!1:s[a]!=null}else if(typeof a=="number"&&(a&1073741823)===a){r=this.c
return r==null?!1:r[a]!=null}else return this.dk(a)},
dk:function(a){var s=this.d
if(s==null)return!1
return this.ak(this.ci(s,a),a)>=0},
j:function(a,b){var s,r,q
if(typeof b=="string"&&b!=="__proto__"){s=this.b
r=s==null?null:P.oQ(s,b)
return r}else if(typeof b=="number"&&(b&1073741823)===b){q=this.c
r=q==null?null:P.oQ(q,b)
return r}else return this.dq(b)},
dq:function(a){var s,r,q=this.d
if(q==null)return null
s=this.ci(q,a)
r=this.ak(s,a)
return r<0?null:s[r+1]},
m:function(a,b,c){var s,r,q,p,o,n=this
if(typeof b=="string"&&b!=="__proto__"){s=n.b
n.dc(s==null?n.b=P.oR():s,b,c)}else{r=n.d
if(r==null)r=n.d=P.oR()
q=H.py(b)&1073741823
p=r[q]
if(p==null){P.n8(r,q,[b,c]);++n.a
n.e=null}else{o=n.ak(p,b)
if(o>=0)p[o+1]=c
else{p.push(b,c);++n.a
n.e=null}}}},
K:function(a,b){var s,r,q,p=this,o=p.cd()
for(s=o.length,r=0;r<s;++r){q=o[r]
b.$2(q,p.j(0,q))
if(o!==p.e)throw H.d(P.a6(p))}},
cd:function(){var s,r,q,p,o,n,m,l,k,j,i=this,h=i.e
if(h!=null)return h
h=P.P(i.a,null,!1,t.z)
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
dc:function(a,b,c){if(a[b]==null){++this.a
this.e=null}P.n8(a,b,c)},
ci:function(a,b){return a[H.py(b)&1073741823]}}
P.dV.prototype={
ak:function(a,b){var s,r,q
if(a==null)return-1
s=a.length
for(r=0;r<s;r+=2){q=a[r]
if(q==null?b==null:q===b)return r}return-1}}
P.dT.prototype={
gi:function(a){return this.a.a},
gv:function(a){return this.a.a===0},
gC:function(a){var s=this.a
return new P.dU(s,s.cd(),this.$ti.h("dU<1>"))},
E:function(a,b){return this.a.w(b)}}
P.dU.prototype={
gq:function(){return this.d},
n:function(){var s=this,r=s.b,q=s.c,p=s.a
if(r!==p.e)throw H.d(P.a6(p))
else if(q>=r.length){s.d=null
return!1}else{s.d=r[q]
s.c=q+1
return!0}},
$iJ:1}
P.b_.prototype={
gC:function(a){var s=this,r=new P.dY(s,s.r,H.A(s).h("dY<1>"))
r.c=s.e
return r},
gi:function(a){return this.a},
gv:function(a){return this.a===0},
ga6:function(a){return this.a!==0},
E:function(a,b){var s,r
if(typeof b=="string"&&b!=="__proto__"){s=this.b
if(s==null)return!1
return s[b]!=null}else if(typeof b=="number"&&(b&1073741823)===b){r=this.c
if(r==null)return!1
return r[b]!=null}else return this.dj(b)},
dj:function(a){var s=this.d
if(s==null)return!1
return this.ak(s[this.bq(a)],a)>=0},
B:function(a,b){var s,r,q=this
if(typeof b=="string"&&b!=="__proto__"){s=q.b
return q.c7(s==null?q.b=P.n9():s,b)}else if(typeof b=="number"&&(b&1073741823)===b){r=q.c
return q.c7(r==null?q.c=P.n9():r,b)}else return q.d9(b)},
d9:function(a){var s,r,q=this,p=q.d
if(p==null)p=q.d=P.n9()
s=q.bq(a)
r=p[s]
if(r==null)p[s]=[q.bo(a)]
else{if(q.ak(r,a)>=0)return!1
r.push(q.bo(a))}return!0},
eh:function(a,b){var s=this
if(typeof b=="string"&&b!=="__proto__")return s.cr(s.b,b)
else if(typeof b=="number"&&(b&1073741823)===b)return s.cr(s.c,b)
else return s.dK(b)},
dK:function(a){var s,r,q,p,o=this,n=o.d
if(n==null)return!1
s=o.bq(a)
r=n[s]
q=o.ak(r,a)
if(q<0)return!1
p=r.splice(q,1)[0]
if(0===r.length)delete n[s]
o.cz(p)
return!0},
dn:function(a,b){var s,r,q,p,o=this,n=o.e
for(;n!=null;n=r){s=n.a
r=n.b
q=o.r
p=a.$1(s)
if(q!==o.r)throw H.d(P.a6(o))
if(!1===p)o.eh(0,s)}},
cB:function(a){var s=this
if(s.a>0){s.b=s.c=s.d=s.e=s.f=null
s.a=0
s.bx()}},
c7:function(a,b){if(a[b]!=null)return!1
a[b]=this.bo(b)
return!0},
cr:function(a,b){var s
if(a==null)return!1
s=a[b]
if(s==null)return!1
this.cz(s)
delete a[b]
return!0},
bx:function(){this.r=this.r+1&1073741823},
bo:function(a){var s,r=this,q=new P.lU(a)
if(r.e==null)r.e=r.f=q
else{s=r.f
s.toString
q.c=s
r.f=s.b=q}++r.a
r.bx()
return q},
cz:function(a){var s=this,r=a.c,q=a.b
if(r==null)s.e=q
else r.b=q
if(q==null)s.f=r
else q.c=r;--s.a
s.bx()},
bq:function(a){return J.aF(a)&1073741823},
ak:function(a,b){var s,r
if(a==null)return-1
s=a.length
for(r=0;r<s;++r)if(J.aA(a[r].a,b))return r
return-1}}
P.lU.prototype={}
P.dY.prototype={
gq:function(){return this.d},
n:function(){var s=this,r=s.c,q=s.a
if(s.b!==q.r)throw H.d(P.a6(q))
else if(r==null){s.d=null
return!1}else{s.d=r.a
s.c=r.b
return!0}},
$iJ:1}
P.aY.prototype={
af:function(a,b){return new P.aY(J.mW(this.a,b),b.h("aY<0>"))},
gi:function(a){return J.Z(this.a)},
j:function(a,b){return J.ew(this.a,b)}}
P.dm.prototype={}
P.ds.prototype={$io:1,$ij:1,$im:1}
P.n.prototype={
gC:function(a){return new H.a9(a,this.gi(a),H.ae(a).h("a9<n.E>"))},
S:function(a,b){return this.j(a,b)},
gv:function(a){return this.gi(a)===0},
ga6:function(a){return!this.gv(a)},
gcH:function(a){if(this.gi(a)===0)throw H.d(H.mZ())
return this.j(a,0)},
E:function(a,b){var s,r=this.gi(a)
for(s=0;s<r;++s){if(J.aA(this.j(a,s),b))return!0
if(r!==this.gi(a))throw H.d(P.a6(a))}return!1},
b5:function(a,b){var s,r=this.gi(a)
for(s=0;s<r;++s){if(!b.$1(this.j(a,s)))return!1
if(r!==this.gi(a))throw H.d(P.a6(a))}return!0},
bD:function(a,b){var s,r=this.gi(a)
for(s=0;s<r;++s){if(b.$1(this.j(a,s)))return!0
if(r!==this.gi(a))throw H.d(P.a6(a))}return!1},
ah:function(a,b,c){return new H.aa(a,b,H.ae(a).h("@<n.E>").G(c).h("aa<1,2>"))},
e2:function(a,b,c){var s,r,q=this.gi(a)
for(s=b,r=0;r<q;++r){s=c.$2(s,this.j(a,r))
if(q!==this.gi(a))throw H.d(P.a6(a))}return s},
e3:function(a,b,c){return this.e2(a,b,c,t.z)},
a4:function(a,b){return H.dG(a,b,null,H.ae(a).h("n.E"))},
aM:function(a,b){var s,r,q,p,o=this
if(o.gv(a)){s=J.b7(0,H.ae(a).h("n.E"))
return s}r=o.j(a,0)
q=P.P(o.gi(a),r,!1,H.ae(a).h("n.E"))
for(p=1;p<o.gi(a);++p)q[p]=o.j(a,p)
return q},
bZ:function(a){var s,r=P.oc(H.ae(a).h("n.E"))
for(s=0;s<this.gi(a);++s)r.B(0,this.j(a,s))
return r},
B:function(a,b){var s=this.gi(a)
this.si(a,s+1)
this.m(a,s,b)},
af:function(a,b){return new H.b3(a,H.ae(a).h("@<n.E>").G(b).h("b3<1,2>"))},
a0:function(a,b,c){var s=this.gi(a)
P.aW(b,c,s)
return P.oe(this.aN(a,b,c),H.ae(a).h("n.E"))},
aN:function(a,b,c){P.aW(b,c,this.gi(a))
return H.dG(a,b,c,H.ae(a).h("n.E"))},
e0:function(a,b,c,d){var s
P.aW(b,c,this.gi(a))
for(s=b;s<c;++s)this.m(a,s,d)},
a3:function(a,b,c,d,e){var s,r,q,p,o
P.aW(b,c,this.gi(a))
s=c-b
if(s===0)return
P.aV(e,"skipCount")
if(H.ae(a).h("m<n.E>").b(d)){r=e
q=d}else{q=J.nV(d,e).aM(0,!1)
r=0}p=J.O(q)
if(r+s>p.gi(q))throw H.d(H.tL())
if(r<b)for(o=s-1;o>=0;--o)this.m(a,b+o,p.j(q,r+o))
else for(o=0;o<s;++o)this.m(a,b+o,p.j(q,r+o))},
bL:function(a,b){var s
for(s=0;s<this.gi(a);++s)if(J.aA(this.j(a,s),b))return s
return-1},
k:function(a){return P.iy(a,"[","]")}}
P.dt.prototype={}
P.jw.prototype={
$2:function(a,b){var s,r=this.a
if(!r.a)this.b.a+=", "
r.a=!1
r=this.b
s=r.a+=H.b(a)
r.a=s+": "
r.a+=H.b(b)},
$S:62}
P.K.prototype={
ag:function(a,b,c){var s=H.A(this)
return P.og(this,s.h("K.K"),s.h("K.V"),b,c)},
K:function(a,b){var s,r
for(s=this.gL(),s=s.gC(s);s.n();){r=s.gq()
b.$2(r,this.j(0,r))}},
ge_:function(){return this.gL().ah(0,new P.jx(this),H.A(this).h("cN<K.K,K.V>"))},
w:function(a){return this.gL().E(0,a)},
gi:function(a){var s=this.gL()
return s.gi(s)},
gv:function(a){var s=this.gL()
return s.gv(s)},
k:function(a){return P.n3(this)},
$ih:1}
P.jx.prototype={
$1:function(a){var s=this.a,r=H.A(s)
return new P.cN(a,s.j(0,a),r.h("@<K.K>").G(r.h("K.V")).h("cN<1,2>"))},
$S:function(){return H.A(this.a).h("cN<K.K,K.V>(K.K)")}}
P.fN.prototype={
m:function(a,b,c){throw H.d(P.ac("Cannot modify unmodifiable map"))}}
P.du.prototype={
ag:function(a,b,c){return this.a.ag(0,b,c)},
j:function(a,b){return this.a.j(0,b)},
m:function(a,b,c){this.a.m(0,b,c)},
w:function(a){return this.a.w(a)},
K:function(a,b){this.a.K(0,b)},
gv:function(a){var s=this.a
return s.gv(s)},
gi:function(a){var s=this.a
return s.gi(s)},
gL:function(){return this.a.gL()},
k:function(a){return this.a.k(0)},
$ih:1}
P.bg.prototype={
ag:function(a,b,c){return new P.bg(this.a.ag(0,b,c),b.h("@<0>").G(c).h("bg<1,2>"))}}
P.cQ.prototype={
gv:function(a){return this.gi(this)===0},
ga6:function(a){return this.gi(this)!==0},
H:function(a,b){var s
for(s=J.an(b);s.n();)this.B(0,s.gq())},
ah:function(a,b,c){return new H.c3(this,b,H.A(this).h("@<1>").G(c).h("c3<1,2>"))},
k:function(a){return P.iy(this,"{","}")},
b5:function(a,b){var s
for(s=this.gC(this);s.n();)if(!b.$1(s.gq()))return!1
return!0},
a4:function(a,b){return H.oA(this,b,H.A(this).c)},
b6:function(a,b,c){var s,r
for(s=this.gC(this);s.n();){r=s.gq()
if(b.$1(r))return r}return c.$0()},
S:function(a,b){var s,r,q,p="index"
H.da(b,p,t.S)
P.aV(b,p)
for(s=this.gC(this),r=0;s.n();){q=s.gq()
if(b===r)return q;++r}throw H.d(P.eM(b,this,p,null,r))}}
P.d_.prototype={$io:1,$ij:1}
P.fO.prototype={
B:function(a,b){P.uW()
return H.bx(u.g)}}
P.ed.prototype={
E:function(a,b){return this.a.w(b)},
gC:function(a){var s=this.a.gL()
return s.gC(s)},
gi:function(a){var s=this.a
return s.gi(s)}}
P.dZ.prototype={}
P.ec.prototype={}
P.eh.prototype={}
P.ei.prototype={}
P.fC.prototype={
j:function(a,b){var s,r=this.b
if(r==null)return this.c.j(0,b)
else if(typeof b!="string")return null
else{s=r[b]
return typeof s=="undefined"?this.dI(b):s}},
gi:function(a){return this.b==null?this.c.a:this.aE().length},
gv:function(a){return this.gi(this)===0},
gL:function(){if(this.b==null){var s=this.c
return new H.at(s,H.A(s).h("at<1>"))}return new P.fD(this)},
m:function(a,b,c){var s,r,q=this
if(q.b==null)q.c.m(0,b,c)
else if(q.w(b)){s=q.b
s[b]=c
r=q.a
if(r==null?s!=null:r!==s)r[b]=null}else q.dQ().m(0,b,c)},
w:function(a){if(this.b==null)return this.c.w(a)
if(typeof a!="string")return!1
return Object.prototype.hasOwnProperty.call(this.a,a)},
K:function(a,b){var s,r,q,p,o=this
if(o.b==null)return o.c.K(0,b)
s=o.aE()
for(r=0;r<s.length;++r){q=s[r]
p=o.b[q]
if(typeof p=="undefined"){p=P.m9(o.a[q])
o.b[q]=p}b.$2(q,p)
if(s!==o.c)throw H.d(P.a6(o))}},
aE:function(){var s=this.c
if(s==null)s=this.c=H.a(Object.keys(this.a),t.s)
return s},
dQ:function(){var s,r,q,p,o,n=this
if(n.b==null)return n.c
s=P.a8(t.R,t.z)
r=n.aE()
for(q=0;p=r.length,q<p;++q){o=r[q]
s.m(0,o,n.j(0,o))}if(p===0)r.push("")
else C.d.si(r,0)
n.a=n.b=null
return n.c=s},
dI:function(a){var s
if(!Object.prototype.hasOwnProperty.call(this.a,a))return null
s=P.m9(this.a[a])
return this.b[a]=s}}
P.fD.prototype={
gi:function(a){var s=this.a
return s.gi(s)},
S:function(a,b){var s=this.a
return s.b==null?s.gL().S(0,b):s.aE()[b]},
gC:function(a){var s=this.a
if(s.b==null){s=s.gL()
s=s.gC(s)}else{s=s.aE()
s=new J.aG(s,s.length,H.X(s).h("aG<1>"))}return s},
E:function(a,b){return this.a.w(b)}}
P.lT.prototype={
a5:function(){var s,r,q,p=this
p.d6()
s=p.a
r=s.a
s.a=""
s=p.c
q=s.b
q.push(P.pd(r.charCodeAt(0)==0?r:r,p.b))
s.a.$1(q)}}
P.lg.prototype={
$0:function(){var s,r
try{s=new TextDecoder("utf-8",{fatal:true})
return s}catch(r){H.G(r)}return null},
$S:6}
P.lf.prototype={
$0:function(){var s,r
try{s=new TextDecoder("utf-8",{fatal:false})
return s}catch(r){H.G(r)}return null},
$S:6}
P.h3.prototype={
ed:function(a,b,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c="Invalid base64 encoding length "
a0=P.aW(b,a0,a.length)
s=$.nP()
for(r=b,q=r,p=null,o=-1,n=-1,m=0;r<a0;r=l){l=r+1
k=C.a.I(a,r)
if(k===37){j=l+2
if(j<=a0){i=H.pz(a,l)
if(i===37)i=-1
l=j}else i=-1}else i=k
if(0<=i&&i<=127){h=s[i]
if(h>=0){i=C.a.A("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",h)
if(i===k)continue
k=i}else{if(h===-1){if(o<0){g=p==null?null:p.a.length
if(g==null)g=0
o=g+(r-q)
n=r}++m
if(k===61)continue}k=i}if(h!==-2){if(p==null){p=new P.ab("")
g=p}else g=p
g.a+=C.a.u(a,q,r)
g.a+=H.bc(k)
q=l
continue}}throw H.d(P.M("Invalid base64 data",a,r))}if(p!=null){g=p.a+=C.a.u(a,q,a0)
f=g.length
if(o>=0)P.nZ(a,n,a0,o,m,f)
else{e=C.c.bh(f-1,4)+1
if(e===1)throw H.d(P.M(c,a,a0))
for(;e<4;){g+="="
p.a=g;++e}}g=p.a
return C.a.aC(a,b,a0,g.charCodeAt(0)==0?g:g)}d=a0-b
if(o>=0)P.nZ(a,n,a0,o,m,d)
else{e=C.c.bh(d,4)
if(e===1)throw H.d(P.M(c,a,a0))
if(e>1)a=C.a.aC(a,a0,a0,e===2?"==":"=")}return a}}
P.h5.prototype={}
P.h4.prototype={
dW:function(a,b){var s,r,q,p=P.aW(b,null,a.length)
if(b===p)return new Uint8Array(0)
s=new P.lC()
r=s.dY(a,b,p)
r.toString
q=s.a
if(q<-1)H.a0(P.M("Missing padding character",a,p))
if(q>0)H.a0(P.M("Invalid length, must be multiple of four",a,p))
s.a=-1
return r}}
P.lC.prototype={
dY:function(a,b,c){var s,r=this,q=r.a
if(q<0){r.a=P.oM(a,b,c,q)
return null}if(b===c)return new Uint8Array(0)
s=P.uD(a,b,c,q)
r.a=P.uF(a,b,c,s,0,r.a)
return s}}
P.h6.prototype={}
P.eB.prototype={}
P.fF.prototype={}
P.eD.prototype={}
P.eF.prototype={}
P.hP.prototype={}
P.iG.prototype={
dX:function(a){var s=P.pd(a,this.gcF().a)
return s},
gcF:function(){return C.bQ}}
P.iH.prototype={}
P.l4.prototype={}
P.l5.prototype={}
P.e6.prototype={
a5:function(){}}
P.m4.prototype={
a5:function(){this.a.e1(this.c)
this.b.a5()},
dR:function(a,b,c,d){this.c.a+=this.a.cE(a,b,c,!1)}}
P.ld.prototype={}
P.le.prototype={
dV:function(a){var s=this.a,r=P.ux(s,a,0,null)
if(r!=null)return r
return new P.fP(s).cE(a,0,null,!0)}}
P.fP.prototype={
cE:function(a,b,c,d){var s,r,q,p,o,n=this,m=P.aW(b,c,J.Z(a))
if(b===m)return""
if(t.gc.b(a)){s=a
r=0}else{s=P.vc(a,b,m)
m-=b
r=b
b=0}q=n.br(s,b,m,d)
p=n.b
if((p&1)!==0){o=P.p5(p)
n.b=0
throw H.d(P.M(o,a,r+n.c))}return q},
br:function(a,b,c,d){var s,r,q=this
if(c-b>1000){s=C.c.bB(b+c,2)
r=q.br(a,b,s,!1)
if((q.b&1)!==0)return r
return r+q.br(a,s,c,d)}return q.dZ(a,b,c,d)},
e1:function(a){var s=this.b
this.b=0
if(s<=32)return
if(this.a)a.a+=H.bc(65533)
else throw H.d(P.M(P.p5(77),null,null))},
dZ:function(a,b,c,d){var s,r,q,p,o,n,m,l=this,k=65533,j=l.b,i=l.c,h=new P.ab(""),g=b+1,f=a[b]
$label0$0:for(s=l.a;!0;){for(;!0;g=p){r=C.a.I("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFFFFFFFFFFFFFFFFGGGGGGGGGGGGGGGGHHHHHHHHHHHHHHHHHHHHHHHHHHHIHHHJEEBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBKCCCCCCCCCCCCDCLONNNMEEEEEEEEEEE",f)&31
i=j<=32?f&61694>>>r:(f&63|i<<6)>>>0
j=C.a.I(" \x000:XECCCCCN:lDb \x000:XECCCCCNvlDb \x000:XECCCCCN:lDb AAAAA\x00\x00\x00\x00\x00AAAAA00000AAAAA:::::AAAAAGG000AAAAA00KKKAAAAAG::::AAAAA:IIIIAAAAA000\x800AAAAA\x00\x00\x00\x00 AAAAA",j+r)
if(j===0){h.a+=H.bc(i)
if(g===c)break $label0$0
break}else if((j&1)!==0){if(s)switch(j){case 69:case 67:h.a+=H.bc(k)
break
case 65:h.a+=H.bc(k);--g
break
default:q=h.a+=H.bc(k)
h.a=q+H.bc(k)
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
break}p=n}if(o-g<20)for(m=g;m<o;++m)h.a+=H.bc(a[m])
else h.a+=P.oC(a,g,o)
if(o===c)break $label0$0
g=p}else g=p}if(d&&j>32)if(s)h.a+=H.bc(k)
else{l.b=77
l.c=c
return""}l.b=j
l.c=i
s=h.a
return s.charCodeAt(0)==0?s:s}}
P.jL.prototype={
$2:function(a,b){var s,r=this.b,q=this.a
r.a+=q.a
s=r.a+=H.b(a.a)
r.a=s+": "
r.a+=P.cH(b)
q.a=", "},
$S:73}
P.df.prototype={
N:function(a,b){if(b==null)return!1
return b instanceof P.df&&this.a===b.a&&this.b===b.b},
gF:function(a){var s=this.a
return(s^C.c.ae(s,30))&1073741823},
eu:function(){var s,r
if(this.b)return this
s=this.a
if(Math.abs(s)<=864e13)r=!1
else r=!0
if(r)H.a0(P.T("DateTime is outside valid range: "+s))
H.da(!0,"isUtc",t.y)
return new P.df(s,!0)},
k:function(a){var s=this,r=P.o4(H.f9(s)),q=P.b5(H.ou(s)),p=P.b5(H.oq(s)),o=P.b5(H.or(s)),n=P.b5(H.ot(s)),m=P.b5(H.ov(s)),l=P.o5(H.os(s))
if(s.b)return r+"-"+q+"-"+p+" "+o+":"+n+":"+m+"."+l+"Z"
else return r+"-"+q+"-"+p+" "+o+":"+n+":"+m+"."+l},
es:function(){var s=this,r=H.f9(s)>=-9999&&H.f9(s)<=9999?P.o4(H.f9(s)):P.tA(H.f9(s)),q=P.b5(H.ou(s)),p=P.b5(H.oq(s)),o=P.b5(H.or(s)),n=P.b5(H.ot(s)),m=P.b5(H.ov(s)),l=P.o5(H.os(s))
if(s.b)return r+"-"+q+"-"+p+"T"+o+":"+n+":"+m+"."+l+"Z"
else return r+"-"+q+"-"+p+"T"+o+":"+n+":"+m+"."+l}}
P.F.prototype={
gaP:function(){return H.aD(this.$thrownJsError)}}
P.ey.prototype={
k:function(a){var s=this.a
if(s!=null)return"Assertion failed: "+P.cH(s)
return"Assertion failed"}}
P.fi.prototype={}
P.f5.prototype={
k:function(a){return"Throw of null."}}
P.ao.prototype={
gbu:function(){return"Invalid argument"+(!this.a?"(s)":"")},
gbt:function(){return""},
k:function(a){var s,r,q=this,p=q.c,o=p==null?"":" ("+p+")",n=q.d,m=n==null?"":": "+H.b(n),l=q.gbu()+o+m
if(!q.a)return l
s=q.gbt()
r=P.cH(q.b)
return l+s+": "+r}}
P.dC.prototype={
gbu:function(){return"RangeError"},
gbt:function(){var s,r=this.e,q=this.f
if(r==null)s=q!=null?": Not less than or equal to "+H.b(q):""
else if(q==null)s=": Not greater than or equal to "+H.b(r)
else if(q>r)s=": Not in inclusive range "+H.b(r)+".."+H.b(q)
else s=q<r?": Valid value range is empty":": Only valid value is "+H.b(r)
return s}}
P.eL.prototype={
gbu:function(){return"RangeError"},
gbt:function(){if(this.b<0)return": index must not be negative"
var s=this.f
if(s===0)return": no indices are valid"
return": index should be less than "+s},
gi:function(a){return this.f}}
P.f2.prototype={
k:function(a){var s,r,q,p,o,n,m,l,k=this,j={},i=new P.ab("")
j.a=""
s=k.c
for(r=s.length,q=0,p="",o="";q<r;++q,o=", "){n=s[q]
i.a=p+o
p=i.a+=P.cH(n)
j.a=", "}k.d.K(0,new P.jL(j,i))
m=P.cH(k.a)
l=i.k(0)
r="NoSuchMethodError: method not found: '"+H.b(k.b.a)+"'\nReceiver: "+m+"\nArguments: ["+l+"]"
return r}}
P.fo.prototype={
k:function(a){return"Unsupported operation: "+this.a}}
P.fj.prototype={
k:function(a){var s=this.a
return s!=null?"UnimplementedError: "+s:"UnimplementedError"}}
P.bC.prototype={
k:function(a){return"Bad state: "+this.a}}
P.eE.prototype={
k:function(a){var s=this.a
if(s==null)return"Concurrent modification during iteration."
return"Concurrent modification during iteration: "+P.cH(s)+"."}}
P.f7.prototype={
k:function(a){return"Out of Memory"},
gaP:function(){return null},
$iF:1}
P.dE.prototype={
k:function(a){return"Stack Overflow"},
gaP:function(){return null},
$iF:1}
P.eG.prototype={
k:function(a){var s=this.a
return s==null?"Reading static variable during its initialization":"Reading static variable '"+s+"' during its initialization"}}
P.dP.prototype={
k:function(a){return"Exception: "+this.a},
$ia7:1}
P.aH.prototype={
k:function(a){var s,r,q,p,o,n,m,l,k,j,i,h,g=this.a,f=g!=null&&""!==g?"FormatException: "+H.b(g):"FormatException",e=this.c,d=this.b
if(typeof d=="string"){if(e!=null)s=e<0||e>d.length
else s=!1
if(s)e=null
if(e==null){if(d.length>78)d=C.a.u(d,0,75)+"..."
return f+"\n"+d}for(r=1,q=0,p=!1,o=0;o<e;++o){n=C.a.I(d,o)
if(n===10){if(q!==o||!p)++r
q=o+1
p=!1}else if(n===13){++r
q=o+1
p=!0}}f=r>1?f+(" (at line "+r+", character "+(e-q+1)+")\n"):f+(" (at character "+(e+1)+")\n")
m=d.length
for(o=e;o<m;++o){n=C.a.A(d,o)
if(n===10||n===13){m=o
break}}if(m-q>78)if(e-q<75){l=q+75
k=q
j=""
i="..."}else{if(m-e<75){k=m-75
l=m
i=""}else{k=e-36
l=e+36
i="..."}j="..."}else{l=m
k=q
j=""
i=""}h=C.a.u(d,k,l)
return f+j+h+i+"\n"+C.a.bi(" ",e-k+j.length)+"^\n"}else return e!=null?f+(" (at offset "+H.b(e)+")"):f},
$ia7:1}
P.j.prototype={
af:function(a,b){return H.h7(this,H.A(this).h("j.E"),b)},
ah:function(a,b,c){return H.jy(this,b,H.A(this).h("j.E"),c)},
E:function(a,b){var s
for(s=this.gC(this);s.n();)if(J.aA(s.gq(),b))return!0
return!1},
aM:function(a,b){return P.eR(this,!1,H.A(this).h("j.E"))},
gi:function(a){var s,r=this.gC(this)
for(s=0;r.n();)++s
return s},
gv:function(a){return!this.gC(this).n()},
ga6:function(a){return!this.gv(this)},
a4:function(a,b){return H.oA(this,b,H.A(this).h("j.E"))},
S:function(a,b){var s,r,q
P.aV(b,"index")
for(s=this.gC(this),r=0;s.n();){q=s.gq()
if(b===r)return q;++r}throw H.d(P.eM(b,this,"index",null,r))},
k:function(a){return P.tK(this,"(",")")}}
P.dR.prototype={
S:function(a,b){var s=this.a
if(0>b||b>=s)H.a0(P.eM(b,this,"index",null,s))
return this.b.$1(b)},
gi:function(a){return this.a}}
P.J.prototype={}
P.cN.prototype={
k:function(a){return"MapEntry("+H.b(J.ah(this.a))+": "+H.b(J.ah(this.b))+")"}}
P.k.prototype={
gF:function(a){return P.e.prototype.gF.call(C.bN,this)},
k:function(a){return"null"}}
P.e.prototype={constructor:P.e,$ie:1,
N:function(a,b){return this===b},
gF:function(a){return H.cr(this)},
k:function(a){return"Instance of '"+H.b(H.jS(this))+"'"},
bc:function(a,b){throw H.d(P.om(this,b.gcQ(),b.gcU(),b.gcR()))},
toString:function(){return this.k(this)}}
P.fI.prototype={
k:function(a){return""},
$iak:1}
P.ab.prototype={
gi:function(a){return this.a.length},
k:function(a){var s=this.a
return s.charCodeAt(0)==0?s:s}}
P.la.prototype={
$2:function(a,b){throw H.d(P.M("Illegal IPv4 address, "+a,this.a,b))},
$S:74}
P.lb.prototype={
$2:function(a,b){throw H.d(P.M("Illegal IPv6 address, "+a,this.a,b))},
$1:function(a){return this.$2(a,null)},
$S:86}
P.lc.prototype={
$2:function(a,b){var s
if(b-a>4)this.a.$2("an IPv6 part can only contain a maximum of 4 hex digits",a)
s=P.cA(C.a.u(this.b,a,b),16)
if(s<0||s>65535)this.a.$2("each part must be in the range of `0x0..0xFFFF`",a)
return s},
$S:87}
P.ee.prototype={
gcv:function(){var s,r,q,p=this,o=p.x
if(o===$){o=p.a
s=o.length!==0?o+":":""
r=p.c
q=r==null
if(!q||o==="file"){o=s+"//"
s=p.b
if(s.length!==0)o=o+s+"@"
if(!q)o+=r
s=p.d
if(s!=null)o=o+":"+H.b(s)}else o=s
o+=p.e
s=p.f
if(s!=null)o=o+"?"+s
s=p.r
if(s!=null)o=o+"#"+s
o=o.charCodeAt(0)==0?o:o
if(p.x===$)p.x=o
else o=H.a0(H.ob("_text"))}return o},
gF:function(a){var s=this,r=s.z
if(r===$){r=J.aF(s.gcv())
if(s.z===$)s.z=r
else r=H.a0(H.ob("hashCode"))}return r},
gcZ:function(){return this.b},
gbK:function(){var s=this.c
if(s==null)return""
if(C.a.X(s,"["))return C.a.u(s,1,s.length-1)
return s},
gbS:function(){var s=this.d
return s==null?P.p_(this.a):s},
gbU:function(){var s=this.f
return s==null?"":s},
gbG:function(){var s=this.r
return s==null?"":s},
gcK:function(){return this.a.length!==0},
gbH:function(){return this.c!=null},
gbJ:function(){return this.f!=null},
gbI:function(){return this.r!=null},
gcJ:function(){return C.a.X(this.e,"/")},
k:function(a){return this.gcv()},
N:function(a,b){var s=this
if(b==null)return!1
if(s===b)return!0
return t.n.b(b)&&s.a===b.gc3()&&s.c!=null===b.gbH()&&s.b===b.gcZ()&&s.gbK()===b.gbK()&&s.gbS()===b.gbS()&&s.e===b.gcS()&&s.f!=null===b.gbJ()&&s.gbU()===b.gbU()&&s.r!=null===b.gbI()&&s.gbG()===b.gbG()},
$iaZ:1,
gc3:function(){return this.a},
gcS:function(){return this.e}}
P.l8.prototype={
gbe:function(a){var s,r,q,p,o=this,n=null,m=o.c
if(m==null){m=o.a
s=o.b[0]+1
r=C.a.b8(m,"?",s)
q=m.length
if(r>=0){p=P.ef(m,r+1,q,C.y,!1)
q=r}else p=n
m=o.c=new P.fx("data","",n,n,P.ef(m,s,q,C.an,!1),p,n)}return m},
gaA:function(){var s=this.b,r=s[0]+1,q=s[1]
if(r===q)return"text/plain"
return P.vb(this.a,r,q,C.a5,!1)},
cD:function(){var s,r,q,p,o,n,m,l,k=this.a,j=this.b,i=C.d.gaI(j)+1
if((j.length&1)===1)return C.b7.dW(k,i)
j=k.length
s=j-i
for(r=i;r<j;++r)if(C.a.A(k,r)===37){r+=2
s-=2}q=new Uint8Array(s)
if(s===j){C.j.a3(q,0,s,new H.cE(k),i)
return q}for(r=i,p=0;r<j;++r){o=C.a.A(k,r)
if(o!==37){n=p+1
q[p]=o}else{m=r+2
if(m<j){l=H.pz(k,r+1)
if(l>=0){n=p+1
q[p]=l
r=m
p=n
continue}}throw H.d(P.M("Invalid percent escape",k,r))}p=n}return q},
k:function(a){var s=this.a
return this.b[0]===-1?"data:"+s:s}}
P.ma.prototype={
$2:function(a,b){var s=this.a[a]
C.j.e0(s,0,96,b)
return s},
$S:88}
P.mb.prototype={
$3:function(a,b,c){var s,r
for(s=b.length,r=0;r<s;++r)a[C.a.I(b,r)^96]=c},
$S:15}
P.mc.prototype={
$3:function(a,b,c){var s,r
for(s=C.a.I(b,0),r=C.a.I(b,1);s<=r;++s)a[(s^96)>>>0]=c},
$S:15}
P.fG.prototype={
gcK:function(){return this.b>0},
gbH:function(){return this.c>0},
gbJ:function(){return this.f<this.r},
gbI:function(){return this.r<this.a.length},
gck:function(){return this.b===4&&C.a.X(this.a,"http")},
gcl:function(){return this.b===5&&C.a.X(this.a,"https")},
gcJ:function(){return C.a.U(this.a,"/",this.e)},
gc3:function(){var s=this.x
return s==null?this.x=this.di():s},
di:function(){var s=this,r=s.b
if(r<=0)return""
if(s.gck())return"http"
if(s.gcl())return"https"
if(r===4&&C.a.X(s.a,"file"))return"file"
if(r===7&&C.a.X(s.a,"package"))return"package"
return C.a.u(s.a,0,r)},
gcZ:function(){var s=this.c,r=this.b+3
return s>r?C.a.u(this.a,r,s-1):""},
gbK:function(){var s=this.c
return s>0?C.a.u(this.a,s,this.d):""},
gbS:function(){var s=this
if(s.c>0&&s.d+1<s.e)return P.cA(C.a.u(s.a,s.d+1,s.e),null)
if(s.gck())return 80
if(s.gcl())return 443
return 0},
gcS:function(){return C.a.u(this.a,this.e,this.f)},
gbU:function(){var s=this.f,r=this.r
return s<r?C.a.u(this.a,s+1,r):""},
gbG:function(){var s=this.r,r=this.a
return s<r.length?C.a.bk(r,s+1):""},
gF:function(a){var s=this.y
return s==null?this.y=C.a.gF(this.a):s},
N:function(a,b){if(b==null)return!1
if(this===b)return!0
return t.n.b(b)&&this.a===b.k(0)},
k:function(a){return this.a},
$iaZ:1}
P.fx.prototype={}
P.m8.prototype={
$1:function(a){var s,r,q,p=this.a
if(p.w(a))return p.j(0,a)
if(t.I.b(a)){s={}
p.m(0,a,s)
for(p=a.gL(),p=p.gC(p);p.n();){r=p.gq()
s[r]=this.$1(a.j(0,r))}return s}else if(t.j.b(a)){q=[]
p.m(0,a,q)
C.d.H(q,J.bn(a,this,t.z))
return q}else return a},
$S:119}
M.a2.prototype={
gcm:function(){var s,r=this.z
if(r===5121||r===5120){s=this.ch
s=s==="MAT2"||s==="MAT3"}else s=!1
if(!s)r=(r===5123||r===5122)&&this.ch==="MAT3"
else r=!0
return r},
gaa:function(){var s=C.m.j(0,this.ch)
return s==null?0:s},
gab:function(){var s=this,r=s.z
if(r===5121||r===5120){r=s.ch
if(r==="MAT2")return 6
else if(r==="MAT3")return 11
return s.gaa()}else if(r===5123||r===5122){if(s.ch==="MAT3")return 22
return 2*s.gaa()}return 4*s.gaa()},
gan:function(){var s=this,r=s.fx
if(r!==0)return r
r=s.z
if(r===5121||r===5120){r=s.ch
if(r==="MAT2")return 8
else if(r==="MAT3")return 12
return s.gaa()}else if(r===5123||r===5122){if(s.ch==="MAT3")return 24
return 2*s.gaa()}return 4*s.gaa()},
gaG:function(){return this.gan()*(this.Q-1)+this.gab()},
t:function(a,b){var s,r,q,p=this,o="bufferView",n=a.z,m=p.x,l=p.fr=n.j(0,m),k=l==null
if(!k&&l.Q!==-1)p.fx=l.Q
if(p.z===-1||p.Q===-1||p.ch==null)return
if(m!==-1)if(k)b.l($.L(),H.a([m],t.M),o)
else{l.a$=!0
l=l.Q
if(l!==-1&&l<p.gab())b.D($.qn(),H.a([p.fr.Q,p.gab()],t.M))
M.bo(p.y,p.dy,p.gaG(),p.fr,m,b)}m=p.dx
if(m!=null){l=m.d
if(l!==-1)k=!1
else k=!0
if(k)return
k=b.c
k.push("sparse")
s=p.Q
if(l>s)b.l($.r2(),H.a([l,s],t.M),"count")
s=m.f
r=s.d
s.f=n.j(0,r)
k.push("indices")
q=m.e
m=q.d
if(m!==-1){n=q.r=n.j(0,m)
if(n==null)b.l($.L(),H.a([m],t.M),o)
else{n.P(C.v,o,b)
if(q.r.Q!==-1)b.p($.mT(),o)
n=q.f
if(n!==-1)M.bo(q.e,Z.b0(n),Z.b0(n)*l,q.r,m,b)}}k.pop()
k.push("values")
if(r!==-1){n=s.f
if(n==null)b.l($.L(),H.a([r],t.M),o)
else{n.P(C.v,o,b)
if(s.f.Q!==-1)b.p($.mT(),o)
n=p.dy
m=C.m.j(0,p.ch)
if(m==null)m=0
M.bo(s.e,n,n*m*l,s.f,r,b)}}k.pop()
k.pop()}},
P:function(a,b,c){var s
this.a$=!0
s=this.k2
if(s==null)this.k2=a
else if(s!==a)c.l($.qp(),H.a([s,a],t.M),b)},
ey:function(a){var s=this.k1
if(s==null)this.k1=a
else if(s!==a)return!1
return!0},
ee:function(a){var s,r,q=this
if(!q.cx||5126===q.z){a.toString
return a}s=q.dy*8
r=q.z
if(r===5120||r===5122||r===5124)return Math.max(a/(C.c.aD(1,s-1)-1),-1)
else return a/(C.c.aD(1,s)-1)}}
M.fs.prototype={
ac:function(){var s=this
return P.bO(function(){var r=0,q=2,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0
return function $async$ac(a1,a2){if(a1===1){p=a2
r=q}while(true)switch(r){case 0:a0=s.z
if(a0===-1||s.Q===-1||s.ch==null){r=1
break}o=s.gaa()
n=s.Q
m=s.fr
if(m!=null){m=m.cx
if((m==null?null:m.Q)==null){r=1
break}if(s.gan()<s.gab()){r=1
break}m=s.y
l=s.dy
if(!M.bo(m,l,s.gaG(),s.fr,null,null)){r=1
break}k=s.fr
j=M.nX(a0,k.cx.Q.buffer,k.y+m,C.c.as(s.gaG(),l))
if(j==null){r=1
break}i=j.length
if(s.gcm()){m=C.c.as(s.gan(),l)
l=s.ch==="MAT2"
k=l?8:12
h=l?2:3
g=new M.lu(i,j,h,h,m-k).$0()}else g=new M.lv(j).$3(i,o,C.c.as(s.gan(),l)-o)}else g=P.o7(n*o,new M.lw(),t.e)
m=s.dx
if(m!=null){l=m.f
k=l.e
if(k!==-1){f=l.f
if(f!=null)if(f.z!==-1)if(f.y!==-1){f=f.cx
if((f==null?null:f.Q)!=null){f=m.e
if(f.f!==-1)if(f.e!==-1){f=f.r
if(f!=null)if(f.z!==-1)if(f.y!==-1){f=f.cx
f=(f==null?null:f.Q)==null}else f=!0
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
if(M.bo(m,Z.b0(e),Z.b0(e)*f,n.r,null,null)){d=s.dy
c=C.m.j(0,s.ch)
if(c==null)c=0
c=!M.bo(k,d,d*c*f,l.f,null,null)
d=c}else d=!0
if(d){r=1
break}n=n.r
b=M.mX(e,n.cx.Q.buffer,n.y+m,f)
l=l.f
a=M.nX(a0,l.cx.Q.buffer,l.y+k,f*o)
if(b==null||a==null){r=1
break}g=new M.lx(s,b,g,o,a).$0()}r=3
return P.lS(g)
case 3:case 1:return P.bJ()
case 2:return P.bK(p)}}},t.e)},
bg:function(){var s=this
return P.bO(function(){var r=0,q=1,p,o,n,m,l
return function $async$bg(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:m=s.dy*8
l=s.z
l=l===5120||l===5122||l===5124
o=t.F
r=l?2:4
break
case 2:l=C.c.aD(1,m-1)
n=s.ac()
n.toString
r=5
return P.lS(H.jy(n,new M.ls(1/(l-1)),n.$ti.h("j.E"),o))
case 5:r=3
break
case 4:l=C.c.aD(1,m)
n=s.ac()
n.toString
r=6
return P.lS(H.jy(n,new M.lt(1/(l-1)),n.$ti.h("j.E"),o))
case 6:case 3:return P.bJ()
case 1:return P.bK(p)}}},t.F)}}
M.lu.prototype={
$0:function(){var s=this
return P.bO(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h
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
case 3:return P.bJ()
case 1:return P.bK(p)}}},t.e)},
$S:16}
M.lv.prototype={
$3:function(a,b,c){return this.d0(a,b,c)},
d0:function(a,b,c){var s=this
return P.bO(function(){var r=a,q=b,p=c
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
case 3:return P.bJ()
case 1:return P.bK(m)}}},t.e)},
$S:30}
M.lw.prototype={
$1:function(a){return 0},
$S:31}
M.lx.prototype={
$0:function(){var s=this
return P.bO(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h,g,f
return function $async$$0(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:g=s.b
f=g[0]
o=J.an(s.c),n=s.d,m=s.a.dx,l=s.e,k=0,j=0,i=0
case 2:if(!o.n()){r=3
break}h=o.gq()
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
case 3:return P.bJ()
case 1:return P.bK(p)}}},t.e)},
$S:16}
M.ls.prototype={
$1:function(a){return Math.max(a*this.a,-1)},
$S:7}
M.lt.prototype={
$1:function(a){return a*this.a},
$S:7}
M.fr.prototype={
ac:function(){var s=this
return P.bO(function(){var r=0,q=2,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0
return function $async$ac(a1,a2){if(a1===1){p=a2
r=q}while(true)switch(r){case 0:a0=s.z
if(a0===-1||s.Q===-1||s.ch==null){r=1
break}o=s.gaa()
n=s.Q
m=s.fr
if(m!=null){m=m.cx
if((m==null?null:m.Q)==null){r=1
break}if(s.gan()<s.gab()){r=1
break}m=s.y
l=s.dy
if(!M.bo(m,l,s.gaG(),s.fr,null,null)){r=1
break}k=s.fr
j=M.nW(a0,k.cx.Q.buffer,k.y+m,C.c.as(s.gaG(),l))
if(j==null){r=1
break}i=j.length
if(s.gcm()){m=C.c.as(s.gan(),l)
l=s.ch==="MAT2"
k=l?8:12
h=l?2:3
g=new M.lo(i,j,h,h,m-k).$0()}else g=new M.lp(j).$3(i,o,C.c.as(s.gan(),l)-o)}else g=P.o7(n*o,new M.lq(),t.F)
m=s.dx
if(m!=null){l=m.f
k=l.e
if(k!==-1){f=l.f
if(f!=null)if(f.z!==-1)if(f.y!==-1){f=f.cx
if((f==null?null:f.Q)!=null){f=m.e
if(f.f!==-1)if(f.e!==-1){f=f.r
if(f!=null)if(f.z!==-1)if(f.y!==-1){f=f.cx
f=(f==null?null:f.Q)==null}else f=!0
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
if(M.bo(m,Z.b0(e),Z.b0(e)*f,n.r,null,null)){d=s.dy
c=C.m.j(0,s.ch)
if(c==null)c=0
c=!M.bo(k,d,d*c*f,l.f,null,null)
d=c}else d=!0
if(d){r=1
break}n=n.r
b=M.mX(e,n.cx.Q.buffer,n.y+m,f)
l=l.f
a=M.nW(a0,l.cx.Q.buffer,l.y+k,f*o)
if(b==null||a==null){r=1
break}g=new M.lr(s,b,g,o,a).$0()}r=3
return P.lS(g)
case 3:case 1:return P.bJ()
case 2:return P.bK(p)}}},t.F)},
bg:function(){return this.ac()}}
M.lo.prototype={
$0:function(){var s=this
return P.bO(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h
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
case 3:return P.bJ()
case 1:return P.bK(p)}}},t.F)},
$S:17}
M.lp.prototype={
$3:function(a,b,c){return this.d_(a,b,c)},
d_:function(a,b,c){var s=this
return P.bO(function(){var r=a,q=b,p=c
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
case 3:return P.bJ()
case 1:return P.bK(m)}}},t.F)},
$S:34}
M.lq.prototype={
$1:function(a){return 0},
$S:7}
M.lr.prototype={
$0:function(){var s=this
return P.bO(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h,g,f
return function $async$$0(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:g=s.b
f=g[0]
o=J.an(s.c),n=s.d,m=s.a.dx,l=s.e,k=0,j=0,i=0
case 2:if(!o.n()){r=3
break}h=o.gq()
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
case 3:return P.bJ()
case 1:return P.bK(p)}}},t.F)},
$S:17}
M.bT.prototype={
ge5:function(){var s=this.e,r=s.r,q=r==null?null:r.cx
if((q==null?null:q.Q)==null)return null
return M.mX(s.f,r.cx.Q.buffer,r.y+s.e,this.d)}}
M.bU.prototype={
t:function(a,b){this.r=a.z.j(0,this.d)}}
M.bV.prototype={
t:function(a,b){this.f=a.z.j(0,this.d)}}
M.eO.prototype={
Z:function(a,b,c,d){d.toString
if(d==1/0||d==-1/0||isNaN(d)){a.l($.pP(),H.a([b,d],t.M),this.a)
return!1}return!0}}
M.eV.prototype={
Z:function(a,b,c,d){var s,r=this
if(b===c||r.b[c]>d)r.b[c]=d
if(d<r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
az:function(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d,n=t.M,m=0;m<r;++m)if(!J.aA(q[m],s[m])){l=$.ny()
k=o+"/min/"+m
a.l(l,H.a([q[m],s[m]],n),k)
if(p[m]>0){l=$.nw()
k=o+"/min/"+m
a.l(l,H.a([p[m],q[m]],n),k)}}return!0}}
M.eT.prototype={
Z:function(a,b,c,d){var s,r=this
if(b===c||r.b[c]<d)r.b[c]=d
if(d>r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
az:function(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d,n=t.M,m=0;m<r;++m)if(!J.aA(q[m],s[m])){l=$.nx()
k=o+"/max/"+m
a.l(l,H.a([q[m],s[m]],n),k)
if(p[m]>0){l=$.nv()
k=o+"/max/"+m
a.l(l,H.a([p[m],q[m]],n),k)}}return!0}}
M.eW.prototype={
Z:function(a,b,c,d){var s,r=this
if(b===c||r.b[c]>d)r.b[c]=d
if(d<r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
az:function(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d,n=t.M,m=0;m<r;++m)if(!J.aA(q[m],s[m])){l=$.ny()
k=o+"/min/"+m
a.l(l,H.a([q[m],s[m]],n),k)
if(p[m]>0){l=$.nw()
k=o+"/min/"+m
a.l(l,H.a([p[m],q[m]],n),k)}}return!0}}
M.eU.prototype={
Z:function(a,b,c,d){var s,r=this
if(b===c||r.b[c]<d)r.b[c]=d
if(d>r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
az:function(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d,n=t.M,m=0;m<r;++m)if(!J.aA(q[m],s[m])){l=$.nx()
k=o+"/max/"+m
a.l(l,H.a([q[m],s[m]],n),k)
if(p[m]>0){l=$.nv()
k=o+"/max/"+m
a.l(l,H.a([p[m],q[m]],n),k)}}return!0}}
Z.bp.prototype={
t:function(a,b){var s,r,q,p,o,n=this,m="samplers",l=n.y
if(l==null||n.x==null)return
s=b.c
s.push(m)
l.a2(new Z.fZ(b,a))
s.pop()
s.push("channels")
n.x.a2(new Z.h_(n,b,a))
s.pop()
s.push(m)
for(r=l.b,l=l.a,q=l.length,p=0;p<r;++p){o=p>=q
if(!(o?null:l[p]).a$)b.V($.fV(),p)}s.pop()}}
Z.fZ.prototype={
$2:function(a,b){var s,r,q,p,o="input",n="output",m=this.a,l=m.c
l.push(C.c.k(a))
s=this.b.f
r=b.d
b.r=s.j(0,r)
q=b.f
b.x=s.j(0,q)
if(r!==-1){s=b.r
if(s==null)m.l($.L(),H.a([r],t.M),o)
else{s.P(C.b0,o,m)
s=b.r.fr
if(s!=null)s.P(C.v,o,m)
l.push(o)
p=V.dc(b.r)
if(!p.N(0,C.B))m.D($.qt(),H.a([p,H.a([C.B],t.p)],t.M))
else m.Y(b.r,new Z.ex(m.O()))
s=b.r
if(s.db==null||s.cy==null)m.R($.qv())
if(b.e==="CUBICSPLINE"&&b.r.Q<2)m.D($.qu(),H.a(["CUBICSPLINE",2,b.r.Q],t.M))
l.pop()}}if(q!==-1){s=b.x
if(s==null)m.l($.L(),H.a([q],t.M),n)
else{s.P(C.b1,n,m)
s=b.x.fr
if(s!=null)s.P(C.v,n,m)
b.x.ey("CUBICSPLINE"===b.e)}}l.pop()},
$S:35}
Z.h_.prototype={
$2:function(a,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=null,d="sampler",c=this.b,b=c.c
b.push(C.c.k(a))
s=this.a
r=a0.d
a0.f=s.y.j(0,r)
q=a0.e
p=q!=null
if(p){o=q.d
q.f=this.c.db.j(0,o)
if(o!==-1){b.push("target")
n=q.f
if(n==null)c.l($.L(),H.a([o],t.M),"node")
else{n.a$=!0
switch(q.e){case"translation":case"rotation":case"scale":if(n.Q!=null)c.R($.qq())
if(q.f.id!=null)c.p($.r3(),"path")
break
case"weights":o=n.fy
o=o==null?e:o.x
o=o==null?e:o.gcH(o)
if((o==null?e:o.fx)==null)c.R($.qr())
break}}b.pop()}}if(r!==-1){o=a0.f
if(o==null)c.l($.L(),H.a([r],t.M),d)
else{o.a$=!0
if(p&&o.x!=null){r=q.e
if(r==="rotation"){m=o.x
if(m.gaa()===4){b.push(d)
o=c.O()
n=5126===m.z?e:m.gbQ()
c.Y(m,new Z.dB("CUBICSPLINE"===a0.f.e,n,o,t.ed))
b.pop()}o=a0.f
o.x.toString}l=V.dc(o.x)
k=C.d8.j(0,r)
if((k==null?e:C.d.E(k,l))===!1)c.l($.qx(),H.a([l,k,r],t.M),d)
o=a0.f
n=o.r
if(n!=null&&n.Q!==-1&&o.x.Q!==-1&&o.e!=null){j=n.Q
if(o.e==="CUBICSPLINE")j*=3
if(r==="weights"){r=q.f
r=r==null?e:r.fy
r=r==null?e:r.x
r=r==null?e:r.gcH(r)
r=r==null?e:r.fx
i=r==null?e:r.length
j*=i==null?0:i}if(j!==0&&j!==a0.f.x.Q)c.l($.qw(),H.a([j,a0.f.x.Q],t.M),d)}}}for(h=a+1,s=s.x,r=s.b,o=t.M,s=s.a,n=s.length;h<r;++h){if(p){g=h>=n
f=(g?e:s[h]).e
g=f!=null&&q.d===f.d&&q.e==f.e}else g=!1
if(g)c.l($.qs(),H.a([h],o),"target")}b.pop()}},
$S:36}
Z.b1.prototype={}
Z.bX.prototype={}
Z.b2.prototype={}
Z.ex.prototype={
Z:function(a,b,c,d){var s=this
if(d<0)a.l($.pJ(),H.a([b,d],t.M),s.b)
else{if(b!==0&&d<=s.a)a.l($.pK(),H.a([b,d,s.a],t.M),s.b)
s.a=d}return!0}}
Z.dB.prototype={
Z:function(a,b,c,d){var s,r,q=this
if(!q.a||4===(q.d&4)){s=q.b
r=s!=null?s.$1(d):d
s=q.e+r*r
q.e=s
if(3===c){if(Math.abs(Math.sqrt(s)-1)>0.00769)a.l($.pL(),H.a([b-3,b,Math.sqrt(q.e)],t.M),q.c)
q.e=0}}if(++q.d===12)q.d=0
return!0}}
T.bq.prototype={
gb9:function(){var s,r=this.f
if(r!=null){s=$.bl().b
s=!s.test(r)}else s=!0
if(s)return 0
return P.cA($.bl().aH(r).b[1],null)},
gbP:function(){var s,r=this.f
if(r!=null){s=$.bl().b
s=!s.test(r)}else s=!0
if(s)return 0
return P.cA($.bl().aH(r).b[2],null)},
gcP:function(){var s,r=this.r
if(r!=null){s=$.bl().b
s=!s.test(r)}else s=!0
if(s)return 2
return P.cA($.bl().aH(r).b[1],null)},
gec:function(){var s,r=this.r
if(r!=null){s=$.bl().b
s=!s.test(r)}else s=!0
if(s)return 0
return P.cA($.bl().aH(r).b[2],null)}}
Q.aP.prototype={}
V.br.prototype={
P:function(a,b,c){var s
this.a$=!0
s=this.cy
if(s==null)this.cy=a
else if(s!==a)c.l($.qz(),H.a([s,a],t.M),b)},
t:function(a,b){var s,r=this,q=r.x,p=r.cx=a.y.j(0,q)
r.db=r.Q
s=r.ch
if(s===34962)r.cy=C.G
else if(s===34963)r.cy=C.Z
if(q!==-1)if(p==null)b.l($.L(),H.a([q],t.M),"buffer")
else{p.a$=!0
p=p.y
if(p!==-1){s=r.y
if(s>=p)b.l($.nC(),H.a([q,p],t.M),"byteOffset")
else if(s+r.z>p)b.l($.nC(),H.a([q,p],t.M),"byteLength")}}}}
G.bs.prototype={}
G.bZ.prototype={}
G.c_.prototype={}
V.dk.prototype={
eA:function(a){var s,r,q,p,o
new V.io(this,a).$1(this.fy)
s=a.r
for(r=s.length,q=a.c,p=0;p<s.length;s.length===r||(0,H.cB)(s),++p){o=s[p]
C.d.si(q,0)
C.d.H(q,o.b)
o.a.c_(this,a)}C.d.si(q,0)}}
V.ik.prototype={
$0:function(){C.d.si(this.a.c,0)
return null},
$S:1}
V.il.prototype={
$1$2:function(a,b,c){var s,r,q,p,o,n,m,l,k,j=this,i=j.a
if(!i.w(a)){i=J.b7(0,c.h("0*"))
return new F.D(i,0,a,c.h("D<0*>"))}j.b.$0()
s=i.j(0,a)
if(t.m.b(s)){i=J.O(s)
r=j.c
q=c.h("0*")
if(i.ga6(s)){p=i.gi(s)
q=P.P(p,null,!1,q)
o=r.c
o.push(a)
for(n=t.M,m=t.t,l=0;l<i.gi(s);++l){k=i.j(s,l)
if(m.b(k)){o.push(C.c.k(l))
q[l]=b.$2(k,r)
o.pop()}else r.am($.a1(),H.a([k,"object"],n),l)}return new F.D(q,p,a,c.h("D<0*>"))}else{r.p($.bS(),a)
i=J.b7(0,q)
return new F.D(i,0,a,c.h("D<0*>"))}}else{j.c.l($.a1(),H.a([s,"array"],t.M),a)
i=J.b7(0,c.h("0*"))
return new F.D(i,0,a,c.h("D<0*>"))}},
$2:function(a,b){return this.$1$2(a,b,t.z)},
$S:37}
V.im.prototype={
$1$3$req:function(a,b,c,d){var s,r
this.a.$0()
s=this.c
r=F.no(this.b,a,s,!0)
if(r==null)return null
s.c.push(a)
return b.$2(r,s)},
$2:function(a,b){return this.$1$3$req(a,b,!1,t.z)},
$1$2:function(a,b,c){return this.$1$3$req(a,b,!1,c)},
$S:38}
V.ii.prototype={
$2:function(a,b){var s,r,q,p,o,n=this.a,m=n.c
m.push(a.c)
s=this.b
a.a2(new V.ij(n,s))
r=n.f.j(0,b)
if(r!=null){q=J.cL(m.slice(0),H.X(m).c)
for(p=J.an(r);p.n();){o=p.gq()
C.d.si(m,0)
C.d.H(m,o.b)
o.a.t(s,n)}C.d.si(m,0)
C.d.H(m,q)}m.pop()},
$S:39}
V.ij.prototype={
$2:function(a,b){var s=this.a,r=s.c
r.push(C.c.k(a))
b.t(this.b,s)
r.pop()},
$S:40}
V.ig.prototype={
$2:function(a,b){var s,r
if(t.c.b(b)){s=this.a
r=s.c
r.push(a)
b.t(this.b,s)
r.pop()}},
$S:3}
V.ih.prototype={
$2:function(a,b){var s,r,q,p=this
if(!b.k1&&b.fx==null&&b.fy==null&&b.fr==null&&b.a.a===0&&b.b==null)p.a.V($.ro(),a)
if(b.go!=null){s=p.b
s.cB(0)
for(r=b;r.go!=null;)if(s.B(0,r))r=r.go
else{if(r===b)p.a.V($.qL(),a)
break}}if(b.id!=null){if(b.go!=null)p.a.V($.rt(),a)
s=b.Q
if(s==null||s.cM()){s=b.cx
if(s!=null){s=s.a
s=s[0]===0&&s[1]===0&&s[2]===0}else s=!0
if(s){s=b.cy
if(s!=null){s=s.a
s=s[0]===0&&s[1]===0&&s[2]===0&&s[3]===1}else s=!0
if(s){s=b.db
if(s!=null){s=s.a
s=s[0]===1&&s[1]===1&&s[2]===1}else s=!0}else s=!1}else s=!1}else s=!1
if(!s)p.a.V($.rs(),a)
q=b.id.cy.b6(0,new V.id(),new V.ie())
if(q!=null){s=q.dy
s=!b.dy.b5(0,s.gcC(s))}else s=!1
if(s)p.a.V($.rr(),a)}},
$S:42}
V.id.prototype={
$1:function(a){return a.go==null},
$S:43}
V.ie.prototype={
$0:function(){return null},
$S:2}
V.io.prototype={
$1:function(a){var s=this.b,r=s.c
C.d.si(r,0)
r.push(a.c)
a.a2(new V.ip(this.a,s))
r.pop()},
$S:44}
V.ip.prototype={
$2:function(a,b){var s=this.b,r=s.c
r.push(C.c.k(a))
b.c_(this.a,s)
r.pop()},
$S:28}
V.fp.prototype={}
V.l.prototype={
t:function(a,b){},
$ip:1}
V.eH.prototype={}
V.fB.prototype={}
T.aQ.prototype={
t:function(a,b){var s,r="bufferView",q=this.x
if(q!==-1){s=this.ch=a.z.j(0,q)
if(s==null)b.l($.L(),H.a([q],t.M),r)
else{s.P(C.b5,r,b)
if(this.ch.Q!==-1)b.p($.qA(),r)}}},
ex:function(){var s,r=this.ch,q=r==null?null:r.cx
if((q==null?null:q.Q)!=null)try{this.Q=H.n4(r.cx.Q.buffer,r.y,r.z)}catch(s){if(!(H.G(s) instanceof P.ao))throw s}}}
Y.aT.prototype={
t:function(a,b){var s=this,r=new Y.jz(b,a)
r.$2(s.x,"pbrMetallicRoughness")
r.$2(s.y,"normalTexture")
r.$2(s.z,"occlusionTexture")
r.$2(s.Q,"emissiveTexture")}}
Y.jz.prototype={
$2:function(a,b){var s,r
if(a!=null){s=this.a
r=s.c
r.push(b)
a.t(this.b,s)
r.pop()}},
$S:46}
Y.cq.prototype={
t:function(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("baseColorTexture")
r.t(a,b)
s.pop()}r=this.x
if(r!=null){s=b.c
s.push("metallicRoughnessTexture")
r.t(a,b)
s.pop()}}}
Y.cp.prototype={}
Y.co.prototype={}
Y.bE.prototype={
t:function(a,b){var s,r=this,q=r.d,p=r.f=a.fy.j(0,q)
if(q!==-1)if(p==null)b.l($.L(),H.a([q],t.M),"index")
else p.a$=!0
for(q=b.e,s=r;s!=null;){s=q.j(0,s)
if(s instanceof Y.aT){s.dx.m(0,b.O(),r.e)
break}}}}
V.bY.prototype={
k:function(a){return this.a}}
V.bW.prototype={
k:function(a){return this.a}}
V.x.prototype={
k:function(a){var s="{"+H.b(this.a)+", "+H.b(C.ap.j(0,this.b))
return s+(this.c?" normalized":"")+"}"},
N:function(a,b){if(b==null)return!1
return b instanceof V.x&&b.a==this.a&&b.b===this.b&&b.c===this.c},
gF:function(a){return A.p9(A.fQ(A.fQ(A.fQ(0,J.aF(this.a)),C.c.gF(this.b)),C.bM.gF(this.c)))}}
S.aU.prototype={
t:function(a,b){var s,r=b.c
r.push("primitives")
s=this.x
if(s!=null)s.a2(new S.jJ(b,a))
r.pop()}}
S.jJ.prototype={
$2:function(a,b){var s,r=this.a,q=r.c
q.push(C.c.k(a))
q.push("extensions")
s=this.b
b.a.K(0,new S.jI(r,s))
q.pop()
b.t(s,r)
q.pop()},
$S:18}
S.jI.prototype={
$2:function(a,b){var s,r
if(t.c.b(b)){s=this.a
r=s.c
r.push(a)
b.t(this.b,s)
r.pop()}},
$S:3}
S.aB.prototype={
gev:function(){switch(this.r){case 4:return C.c.bB(this.dy,3)
case 5:case 6:var s=this.dy
return s>2?s-2:0
default:return 0}},
t:function(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=this,e="attributes",d="indices",c=f.d
if(c!=null){s=b.c
s.push(e)
c.K(0,new S.jE(f,a,b))
s.pop()}c=f.e
if(c!==-1){s=f.fy=a.f.j(0,c)
if(s==null)b.l($.L(),H.a([c],t.M),d)
else{f.dy=s.Q
s.P(C.b3,d,b)
c=f.fy.fr
if(c!=null)c.P(C.Z,d,b)
c=b.c
c.push(d)
s=f.fy.fr
if(s!=null&&s.Q!==-1)b.R($.qH())
r=V.dc(f.fy)
if(!C.d.E(C.ag,r))b.D($.qG(),H.a([r,C.ag],t.M))
else{s=f.fr
q=s!==-1?s-1:-1
s=f.r
p=s!==-1?C.c.aD(1,s):-1
if(p!==0&&q>=-1){s=f.fy
o=b.O()
n=C.c.bB(f.dy,3)
m=f.fy.z
l=new Uint32Array(3)
b.Y(s,new S.eK(q,n,Z.pF(m),16===(p&16),l,o))}}c.pop()}}c=f.dy
if(c!==-1){s=f.r
if(!(s===1&&c%2!==0))if(!((s===2||s===3)&&c<2))if(!(s===4&&c%3!==0))c=(s===5||s===6)&&c<3
else c=!0
else c=!0
else c=!0}else c=!1
if(c)b.D($.qF(),H.a([f.dy,C.cj[f.r]],t.M))
c=f.f
s=f.go=a.cx.j(0,c)
if(c!==-1)if(s==null)b.l($.L(),H.a([c],t.M),"material")
else{s.a$=!0
s.dx.K(0,new S.jF(f,b))}for(c=f.id,s=C.d.gC(c),c=new H.cv(s,new S.jG(),H.X(c).h("cv<1>")),o=b.c;c.n();){n=s.gq()
o.push(e)
b.p($.fV(),"TEXCOORD_"+H.b(n))
o.pop()}c=f.x
if(c!=null){s=b.c
s.push("targets")
k=c.length
j=J.o8(k,t.gj)
for(o=t.X,n=t.W,i=0;i<k;++i)j[i]=P.a8(o,n)
f.fx=j
for(h=0;h<c.length;++h){g=c[h]
s.push(C.c.k(h))
g.K(0,new S.jH(f,a,b,h))
s.pop()}s.pop()}},
cb:function(a,b,c){var s,r=a.fr
if(r.Q===-1){s=c.x.bT(r,new S.jD())
if(s.B(0,a)&&s.gi(s)>1)c.p($.qD(),b)}}}
S.jA.prototype={
$1:function(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this
if(a.length!==0&&C.a.I(a,0)===95)return
switch(a){case"POSITION":e.a.c=!0
break
case"NORMAL":e.a.b=!0
break
case"TANGENT":e.a.a=!0
break
default:s=a.split("_")
r=s[0]
if(!C.d.E(C.c8,r)||s.length!==2){e.b.p($.mU(),a)
break}q=s[1]
q.toString
p=new H.cE(q)
if(p.gi(p)===0){o=0
n=!1}else{m=q.length
if(m===1){o=C.a.I(q,0)-48
n=!(o<0||o>9)||!1}else{o=0
l=0
while(!0){if(!(l<m)){n=!0
break}k=C.a.I(q,l)-48
if(k<=9)if(k>=0)j=l===0&&k===0
else j=!0
else j=!0
if(j){n=!1
break}o=10*o+k;++l}}}if(n)switch(r){case"COLOR":q=e.a;++q.d
i=q.e
q.e=o>i?o:i
break
case"JOINTS":q=e.a;++q.f
h=q.r
q.r=o>h?o:h
break
case"TEXCOORD":q=e.a;++q.z
g=q.Q
q.Q=o>g?o:g
break
case"WEIGHTS":q=e.a;++q.x
f=q.y
q.y=o>f?o:f
break}else e.b.p($.mU(),a)}},
$S:19}
S.jB.prototype={
$3:function(a,b,c){var s=a+1
if(s!==b){this.a.D($.re(),H.a([c,s,b],t.M))
return 0}return b},
$S:49}
S.jC.prototype={
$1:function(a){var s=this.a
if(!s.k3.w(a)&&!J.t8(a,"_"))s.p($.mU(),a)},
$S:19}
S.jE.prototype={
$2:function(a,b){var s,r,q,p,o,n,m,l=this
if(b===-1)return
s=l.b.f.j(0,b)
if(s==null){l.c.l($.L(),H.a([b],t.M),a)
return}r=l.a
r.dx.m(0,a,s)
q=l.c
s.P(C.Y,a,q)
p=s.fr
if(p!=null)p.P(C.G,a,q)
if(a==="POSITION")p=s.db==null||s.cy==null
else p=!1
if(p)q.p($.nF(),"POSITION")
o=V.dc(s)
n=q.k2.j(0,H.a(a.split("_"),t.s)[0])
if(n!=null){if(!n.E(0,o))q.l($.nE(),H.a([o,n],t.M),a)
else if(a==="NORMAL"){p=q.c
p.push("NORMAL")
m=q.O()
q.Y(s,new F.fk(m,5126===s.z?null:s.gbQ()))
p.pop()}else if(a==="TANGENT"){p=q.c
p.push("TANGENT")
m=q.O()
q.Y(s,new F.fl(m,5126===s.z?null:s.gbQ()))
p.pop()}else if(C.a.X(a,"COLOR_")&&5126===s.z){p=q.c
p.push(a)
q.Y(s,new F.eC(q.O()))
p.pop()}}else if(s.z===5125)q.p($.qE(),a)
p=s.y
if(!(p!==-1&&p%4!==0))if(s.gab()%4!==0){p=s.fr
p=p!=null&&p.Q===-1}else p=!1
else p=!0
if(p)q.p($.nD(),a)
p=r.fr
if(p===-1)r.dy=r.fr=s.Q
else if(p!==s.Q)q.p($.qK(),a)
p=s.fr
if(p!=null&&p.Q===-1){if(p.db===-1)p.db=s.gab()
r.cb(s,a,q)}},
$S:4}
S.jF.prototype={
$2:function(a,b){var s
if(b!==-1){s=this.a
if(b+1>s.db)this.b.l($.nG(),H.a([a,b],t.M),"material")
else s.id[b]=-1}},
$S:4}
S.jG.prototype={
$1:function(a){return a!==-1},
$S:8}
S.jH.prototype={
$2:function(a,b){var s,r,q,p,o,n,m=this
if(b===-1)return
s=m.b.f.j(0,b)
if(s==null)m.c.l($.L(),H.a([b],t.M),a)
else{r=m.c
s.P(C.Y,a,r)
q=s.fr
if(q!=null)q.P(C.G,a,r)
p=m.a.dx.j(0,a)
if(p==null)r.p($.qJ(),a)
else if(p.Q!==s.Q)r.p($.qI(),a)
if(a==="POSITION")q=s.db==null||s.cy==null
else q=!1
if(q)r.p($.nF(),"POSITION")
o=V.dc(s)
n=r.k3.j(0,a)
if(n!=null&&!n.E(0,o))r.l($.nE(),H.a([o,n],t.M),a)
q=s.y
if(!(q!==-1&&q%4!==0))if(s.gab()%4!==0){q=s.fr
q=q!=null&&q.Q===-1}else q=!1
else q=!0
if(q)r.p($.nD(),a)
q=s.fr
if(q!=null&&q.Q===-1){if(q.db===-1)q.db=s.gab()
m.a.cb(s,a,r)}}m.a.fx[m.d].m(0,a,s)},
$S:4}
S.jD.prototype={
$0:function(){return P.aM(t.W)},
$S:52}
S.eK.prototype={
Z:function(a,b,c,d){var s,r,q=this,p=q.a
if(d>p)a.l($.pM(),H.a([b,d,p],t.M),q.cy)
if(d===q.c)a.l($.pN(),H.a([d,b],t.M),q.cy)
if(q.x){p=q.cx
s=q.Q
p[s]=d;++s
q.Q=s
if(s===3){q.Q=0
s=p[0]
r=p[1]
if(s!==r){p=p[2]
p=r===p||p===s}else p=!0
if(p)++q.ch}}return!0},
az:function(a){var s=this.ch
if(s>0)a.l($.pO(),H.a([s,this.b],t.M),this.cy)
return!0}}
V.aj.prototype={
t:function(a,b){var s,r,q,p=this,o=p.x
p.fr=a.Q.j(0,o)
s=p.z
p.id=a.fx.j(0,s)
r=p.ch
p.fy=a.cy.j(0,r)
if(o!==-1){q=p.fr
if(q==null)b.l($.L(),H.a([o],t.M),"camera")
else q.a$=!0}if(s!==-1){o=p.id
if(o==null)b.l($.L(),H.a([s],t.M),"skin")
else o.a$=!0}if(r!==-1){o=p.fy
if(o==null)b.l($.L(),H.a([r],t.M),"mesh")
else{o.a$=!0
o=o.x
if(o!=null){s=p.dx
if(s!=null){o=o.j(0,0).fx
o=o==null?null:o.length
o=o!==s.length}else o=!1
if(o){o=$.qP()
s=s.length
r=p.fy.x.j(0,0).fx
b.l(o,H.a([s,r==null?null:r.length],t.M),"weights")}if(p.id!=null){o=p.fy.x
if(o.b5(o,new V.jM()))b.R($.qN())}else{o=p.fy.x
if(o.bD(o,new V.jN()))b.R($.qO())}}}}o=p.y
if(o!=null){s=P.P(o.gi(o),null,!1,t.L)
p.fx=s
F.ns(o,s,a.db,"children",b,new V.jO(p,b))}},
c8:function(a,b){var s,r,q,p,o=this
o.dy.B(0,a)
if(o.fx==null||!b.B(0,o))return
for(s=o.fx,r=s.length,q=0;q<r;++q){p=s[q]
if(p!=null)p.c8(a,b)}}}
V.jM.prototype={
$1:function(a){return a.cx===0},
$S:5}
V.jN.prototype={
$1:function(a){return a.cx!==0},
$S:5}
V.jO.prototype={
$3:function(a,b,c){if(a.go!=null)this.b.am($.qM(),H.a([b],t.M),c)
a.go=this.a},
$S:9}
T.by.prototype={}
B.bz.prototype={
t:function(a,b){var s,r=this.x
if(r==null)return
s=P.P(r.gi(r),null,!1,t.L)
this.y=s
F.ns(r,s,a.db,"nodes",b,new B.jX(this,b))}}
B.jX.prototype={
$3:function(a,b,c){if(a.go!=null)this.b.am($.qQ(),H.a([b],t.M),c)
a.c8(this.a,P.aM(t.L))},
$S:9}
O.bB.prototype={
t:function(a,b){var s,r,q,p,o,n=this,m="inverseBindMatrices",l="skeleton",k=n.x
n.Q=a.f.j(0,k)
s=a.db
r=n.y
n.cx=s.j(0,r)
q=n.z
if(q!=null){p=P.P(q.gi(q),null,!1,t.L)
n.ch=p
F.ns(q,p,s,"joints",b,new O.kZ(n))
if(n.cy.a===0)b.p($.ry(),"joints")}if(k!==-1){s=n.Q
if(s==null)b.l($.L(),H.a([k],t.M),m)
else{s.P(C.b2,m,b)
k=n.Q.fr
if(k!=null)k.P(C.b4,m,b)
k=b.c
k.push(m)
s=n.Q.fr
if(s!=null&&s.Q!==-1)b.R($.qR())
o=V.dc(n.Q)
if(!o.N(0,C.R))b.D($.qS(),H.a([o,H.a([C.R],t.p)],t.M))
else b.Y(n.Q,new O.eJ(b.O()))
s=n.ch
if(s!=null&&n.Q.Q!==s.length)b.D($.qB(),H.a([s.length,n.Q.Q],t.M))
k.pop()}}if(r!==-1){k=n.cx
if(k==null)b.l($.L(),H.a([r],t.M),l)
else if(!n.cy.E(0,k))b.p($.rz(),l)}}}
O.kZ.prototype={
$3:function(a,b,c){var s,r,q
a.k1=!0
s=P.aM(t.L)
r=a
while(!0){if(!(r!=null&&s.B(0,r)))break
r=r.go}q=this.a.cy
if(q.a===0)q.H(0,s)
else q.dn(s.gcC(s),!1)},
$S:9}
O.eJ.prototype={
Z:function(a,b,c,d){var s
if(!(3===c&&0!==d))if(!(7===c&&0!==d))if(!(11===c&&0!==d))s=15===c&&1!==d
else s=!0
else s=!0
else s=!0
if(s)a.l($.pQ(),H.a([b,c,d],t.M),this.a)
return!0}}
U.bD.prototype={
t:function(a,b){var s,r,q=this,p=q.y
q.Q=a.ch.j(0,p)
s=q.x
q.z=a.dx.j(0,s)
if(p!==-1){r=q.Q
if(r==null)b.l($.L(),H.a([p],t.M),"source")
else r.a$=!0}if(s!==-1){p=q.z
if(p==null)b.l($.L(),H.a([s],t.M),"sampler")
else p.a$=!0}},
c_:function(a,b){var s,r=this.Q
r=r==null?null:r.cx
s=r==null?null:r.a
if(s!=null&&!C.d.E(C.af,s))b.l($.nH(),H.a([s,C.af],t.M),"source")},
$ics:1}
M.lh.prototype={}
M.i.prototype={
Y:function(a,b){J.mV(this.d.bT(a,new M.h9()),b)},
W:function(a,b){var s,r,q
for(s=J.an(b),r=this.e;s.n();){q=s.gq()
if(q!=null)r.m(0,q,a)}},
c2:function(a){var s,r,q,p=this.c
if(p.length===0&&a!=null&&C.a.X(a,"/"))return a
s=a!=null
if(s)p.push(a)
r=this.go
q=r.a+="/"
r.a=P.n6(q,new H.aa(p,new M.hb(),H.X(p).h("aa<1,f*>")),"/")
if(s)p.pop()
p=r.a
r.a=""
return p.charCodeAt(0)==0?p:p},
O:function(){return this.c2(null)},
e6:function(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=this,e="/extensionsUsed/"
C.d.H(f.cx,a)
for(s=J.O(a),r=f.db,q=f.fx,p=C.dp.a,o=t.M,n=J.O(b),m=0;m<s.gi(a);++m){l=s.j(a,m)
k=$.pI().aH(l)
j=k==null?null:k.b[1]
if(j==null)f.p($.r9(),e+m)
else if(!p.w(j)){k=$.rC()
i=e+m
f.l(k,H.a([j],o),i)}h=q.b6(0,new M.he(l),new M.hf(l))
if(h==null){k=$.qV()
i=e+m
f.l(k,H.a([l],o),i)
continue}h.b.K(0,new M.hg(f,h))
k=h.c
if(k!=null)k.$1(f)
k=h.d&&!n.E(b,l)
if(k){k=$.rw()
i=e+m
f.l(k,H.a([l],o),i)}r.push(l)}for(m=0;m<n.gi(b);++m){g=n.j(b,m)
if(!s.E(a,g)){r=$.rD()
q="/extensionsRequired/"+m
f.l(r,H.a([g],o),q)}}},
a9:function(a,b,c,d,e,f){var s,r,q,p=this,o=p.b,n=a.b
if(o.b.E(0,n))return
s=o.a
if(s>0&&p.fy.length===s){p.z=!0
throw H.d(C.b8)}o=o.c
r=o!=null?o.j(0,n):null
if(f!=null)p.fy.push(new E.cK(a,r,null,f,b))
else{q=c!=null?C.c.k(c):d
o=e?"":p.c2(q)
p.fy.push(new E.cK(a,r,o,null,b))}},
p:function(a,b){return this.a9(a,null,null,b,!1,null)},
D:function(a,b){return this.a9(a,b,null,null,!1,null)},
l:function(a,b,c){return this.a9(a,b,null,c,!1,null)},
am:function(a,b,c){return this.a9(a,b,c,null,!1,null)},
V:function(a,b){return this.a9(a,null,b,null,!1,null)},
R:function(a){return this.a9(a,null,null,null,!1,null)},
ay:function(a,b,c){return this.a9(a,b,null,null,c,null)},
bC:function(a,b){return this.a9(a,null,null,null,!1,b)},
a1:function(a,b,c){return this.a9(a,b,null,null,!1,c)}}
M.ha.prototype={
$1:function(a){return a.a},
$S:55}
M.h9.prototype={
$0:function(){return H.a([],t.gd)},
$S:56}
M.hb.prototype={
$1:function(a){var s
a.toString
s=H.pE(a,"~","~0")
return H.pE(s,"/","~1")},
$S:57}
M.he.prototype={
$1:function(a){return a.a===this.a},
$S:20}
M.hf.prototype={
$0:function(){return C.d.b6(C.ai,new M.hc(this.a),new M.hd())},
$S:59}
M.hc.prototype={
$1:function(a){return a.a===this.a},
$S:20}
M.hd.prototype={
$0:function(){return null},
$S:2}
M.hg.prototype={
$2:function(a,b){this.a.Q.m(0,new D.c5(a,this.b.a),b)},
$S:60}
M.c8.prototype={$ia7:1}
Y.dW.prototype={
k:function(a){return this.b}}
Y.dK.prototype={
k:function(a){return this.b}}
Y.cW.prototype={
k:function(a){return this.b}}
Y.c6.prototype={
k:function(a){return this.b}}
Y.c7.prototype={}
Y.is.prototype={
$1:function(a){var s,r,q,p=this.a
if(!p.c)if(J.Z(a)<9){p.a.J()
this.b.M(C.a4)
return}else{s=Y.tH(a)
r=p.a
q=this.b
switch(s){case C.aC:p.b=new Y.iC(q,r)
break
case C.aD:s=new Uint8Array(13)
p.b=new Y.jP(C.r,C.p,s,new Uint8Array(32),q,r)
break
case C.aE:p.b=new Y.lm(new Uint8Array(30),q,r)
break
default:r.J()
q.M(C.bg)
return}p.c=!0}p.b.B(0,a)},
$S:21}
Y.iu.prototype={
$1:function(a){this.a.a.J()
this.b.M(a)},
$S:22}
Y.it.prototype={
$0:function(){var s=this.a.b
s.b.J()
s=s.a
if(s.a.a===0)s.M(C.a4)},
$C:"$0",
$R:0,
$S:2}
Y.ir.prototype={
$2:function(a,b){var s,r,q
for(s=b.length,r=J.O(a),q=0;q<s;++q)if(!J.aA(r.j(a,q),b[q]))return!1
return!0},
$S:63}
Y.iq.prototype={}
Y.iC.prototype={
B:function(a,b){var s,r,q
try{this.dz(b)}catch(r){q=H.G(r)
if(q instanceof Y.aR){s=q
this.b.J()
this.a.M(s)}else throw r}},
dz:function(a){var s,r,q,p,o,n,m,l,k,j,i=this,h=new Y.iE(),g=new Y.iD()
for(s=J.O(a),r=0,q=0;r!==s.gi(a);){p=s.j(a,r)
switch(i.c){case 0:if(255===p)i.c=255
else throw H.d(C.bL)
break
case 255:if(g.$1(p)){i.c=1
i.d=p
i.e=i.f=0}break
case 1:i.e=p<<8>>>0
i.c=2
break
case 2:o=i.e+p
i.e=o
if(o<2)throw H.d(C.bK)
if(h.$1(i.d)){o=i.e
i.r=new Uint8Array(o-2)}i.c=3
break
case 3:q=Math.min(s.gi(a)-r,i.e-i.f-2)
o=h.$1(i.d)
n=i.f
m=n+q
if(o){o=i.r
i.f=m;(o&&C.j).a3(o,n,m,a,r)
if(i.f===i.e-2){i.b.J()
a=i.r
l=a[0]
s=a[1]
o=a[2]
n=a[3]
m=a[4]
k=a[5]
if(k===3)j=C.n
else j=k===1?C.a7:C.J
i.a.T(new Y.c7("image/jpeg",l,j,(n<<8|m)>>>0,(s<<8|o)>>>0,C.p,C.r,!1,!1))
return}}else{i.f=m
if(m===i.e-2)i.c=255}r+=q
continue}++r}}}
Y.iE.prototype={
$1:function(a){return(a&240)===192&&a!==196&&a!==200&&a!==204||a===222},
$S:8}
Y.iD.prototype={
$1:function(a){return!(a===1||(a&248)===208||a===216||a===217||a===255)},
$S:8}
Y.jP.prototype={
B:function(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this,d=new Y.jQ(e)
for(s=J.O(b),r=e.dx,q=e.db,p=0,o=0;p!==s.gi(b);){n=s.j(b,p)
switch(e.y){case 0:p+=8
e.y=1
continue
case 1:e.c=(e.c<<8|n)>>>0
if(++e.d===4)e.y=2
break
case 2:m=(e.e<<8|n)>>>0
e.e=m
if(++e.f===4){switch(m){case 1229472850:if(e.c!==13){e.b.J()
s=e.a
if(s.a.a===0)s.M(C.o)
return}e.z=!0
break
case 1951551059:e.Q=!0
break
case 1665684045:if(e.c!==32){e.b.J()
s=e.a
if(s.a.a===0)s.M(C.o)
return}break
case 1934772034:if(e.c!==1){e.b.J()
s=e.a
if(s.a.a===0)s.M(C.o)
return}break
case 1883789683:if(e.c!==9){e.b.J()
s=e.a
if(s.a.a===0)s.M(C.o)
return}break
case 1732332865:if(e.c!==4){e.b.J()
s=e.a
if(s.a.a===0)s.M(C.o)
return}break
case 1766015824:e.ch=C.A
e.cx=C.z
break
case 1229209940:e.b.J()
if(!e.z)e.a.M(C.bJ)
s=q.buffer
b=new DataView(s,0)
l=b.getUint32(0,!1)
k=b.getUint32(4,!1)
j=b.getUint8(8)
switch(b.getUint8(9)){case 0:i=e.Q?C.a8:C.a7
break
case 2:case 3:i=e.Q?C.w:C.n
break
case 4:i=C.a8
break
case 6:i=C.w
break
default:i=C.J}s=e.cx
if(s===C.p)s=e.cx=C.q
r=e.ch
if(r===C.r)r=e.ch=C.t
e.a.T(new Y.c7("image/png",j,i,l,k,s,r,e.cy,!1))
return}if(e.c===0)e.y=4
else e.y=3}break
case 3:m=s.gi(b)
h=e.c
g=e.x
o=Math.min(m-p,h-g)
switch(e.e){case 1229472850:m=g+o
e.x=m
C.j.a3(q,g,m,b,p)
break
case 1665684045:case 1732332865:case 1883789683:m=g+o
e.x=m
C.j.a3(r,g,m,b,p)
break
case 1934772034:e.ch=C.t
e.cx=C.q
e.x=g+1
break
default:e.x=g+o}if(e.x===e.c){switch(e.e){case 1665684045:if(e.cx===C.p)e.de()
break
case 1732332865:if(e.ch===C.r)e.df()
break
case 1883789683:m=r.buffer
f=new DataView(m,0)
if(f.getUint32(0,!1)!==f.getUint32(4,!1))e.cy=!0
break}e.y=4}p+=o
continue
case 4:if(++e.r===4){d.$0()
e.y=1}break}++p}},
df:function(){var s=this
if(s.ch===C.t)return
switch(H.jK(s.dx.buffer,0,null).getUint32(0,!1)){case 45455:s.ch=C.t
break
case 1e5:s.ch=C.dY
break
default:s.ch=C.A}},
de:function(){var s,r=this
if(r.cx===C.q)return
s=H.jK(r.dx.buffer,0,null)
if(s.getUint32(0,!1)===31270&&s.getUint32(4,!1)===32900&&s.getUint32(8,!1)===64e3&&s.getUint32(12,!1)===33e3&&s.getUint32(16,!1)===3e4&&s.getUint32(20,!1)===6e4&&s.getUint32(24,!1)===15e3&&s.getUint32(28,!1)===6000)r.cx=C.q
else r.cx=C.z}}
Y.jQ.prototype={
$0:function(){var s=this.a
s.r=s.x=s.f=s.e=s.d=s.c=0},
$S:1}
Y.lm.prototype={
B:function(a,b){var s,r,q,p,o,n,m,l=this,k=J.Z(b),j=l.d,i=l.c
k=j+Math.min(k,30-j)
l.d=k
C.j.d2(i,j,k,b)
k=l.d
if(k>=25)k=k<30&&i[15]!==76
else k=!0
if(k)return
l.b.J()
s=H.jK(i.buffer,0,null)
if(s.getUint32(0,!1)!==1380533830||s.getUint32(8,!1)!==1464156752){l.c6(C.a9)
return}switch(s.getUint32(12,!1)){case 1448097824:r=s.getUint16(26,!0)&16383
q=s.getUint16(28,!0)&16383
p=C.n
o=!1
n=!1
break
case 1448097868:k=i[21]
j=i[22]
r=1+((k|(j&63)<<8)>>>0)
k=i[23]
i=i[24]
q=1+((j>>>6|k<<2|(i&15)<<10)>>>0)
p=(i&16)===16?C.w:C.n
o=!1
n=!1
break
case 1448097880:m=i[20]
n=(m&2)===2
o=(m&32)===32
p=(m&16)===16?C.w:C.n
r=((i[24]|i[25]<<8|i[26]<<16)>>>0)+1
q=((i[27]|i[28]<<8|i[29]<<16)>>>0)+1
break
default:l.c6(C.a9)
return}k=o?C.A:C.t
j=o?C.z:C.q
l.a.T(new Y.c7("image/webp",8,p,r,q,j,k,!1,n))},
c6:function(a){var s
this.b.J()
s=this.a
if(s.a.a===0)s.M(a)}}
Y.dI.prototype={$ia7:1}
Y.dH.prototype={$ia7:1}
Y.aR.prototype={
k:function(a){return this.a},
$ia7:1}
N.d0.prototype={
k:function(a){return this.b}}
N.fc.prototype={
bd:function(){var s,r=this,q=t.X,p=t._,o=P.a8(q,p)
o.m(0,"pointer",r.a)
s=r.b
if(s!=null)o.m(0,"mimeType",s)
s=r.c
if(s!=null)o.m(0,"storage",C.ci[s.a])
s=r.e
if(s!=null)o.m(0,"uri",s)
s=r.d
if(s!=null)o.m(0,"byteLength",s)
s=r.f
if(s==null)q=null
else{q=P.a8(q,p)
q.m(0,"width",s.d)
q.m(0,"height",s.e)
p=s.c
if(p!==C.J)q.m(0,"format",C.cW[p.a])
p=s.f
if(p!==C.p)q.m(0,"primaries",C.cP[p.a])
p=s.r
if(p!==C.r)q.m(0,"transfer",C.cO[p.a])
p=s.b
if(p>0)q.m(0,"bits",p)}if(q!=null)o.m(0,"image",q)
return o}}
N.jU.prototype={
aK:function(){var s=!0
return this.ea()},
ea:function(){var s=0,r=P.eq(t.H),q,p=2,o,n=[],m=this,l,k,j
var $async$aK=P.es(function(a,b){if(a===1){o=b
s=p}while(true)switch(s){case 0:k=!0
p=4
s=7
return P.d4(m.aZ(),$async$aK)
case 7:s=8
return P.d4(m.b_(),$async$aK)
case 8:if(k)O.wS(m.a,m.b)
m.a.eA(m.b)
p=2
s=6
break
case 4:p=3
j=o
if(H.G(j) instanceof M.c8){s=1
break}else throw j
s=6
break
case 3:s=2
break
case 6:case 1:return P.ek(q,r)
case 2:return P.ej(o,r)}})
return P.el($async$aK,r)},
aZ:function(){var s=0,r=P.eq(t.H),q=1,p,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6
var $async$aZ=P.es(function(a7,a8){if(a7===1){p=a8
s=q}while(true)switch(s){case 0:a3=n.b
a4=a3.c
C.d.si(a4,0)
a4.push("buffers")
i=n.a.y,h=i.b,g=a3.dy,f=t.M,e=t.x,d=t.a,i=i.a,c=i.length,b=0
case 2:if(!(b<h)){s=4
break}a=b>=c
m=a?null:i[b]
if(m==null){s=3
break}a4.push(C.c.k(b))
a0=new N.fc(a3.O())
a0.b="application/gltf-buffer"
l=new N.jV(n,a0,b)
k=null
q=6
a6=d
s=9
return P.d4(l.$1(m),$async$aZ)
case 9:k=a6.a(a8)
q=1
s=8
break
case 6:q=5
a5=p
a=H.G(a5)
if(e.b(a)){j=a
a3.l($.mR(),H.a([j],f),"uri")}else throw a5
s=8
break
case 5:s=1
break
case 8:if(k!=null){a0.d=J.Z(k)
if(J.Z(k)<m.y)a3.D($.q0(),H.a([J.Z(k),m.y],f))
else{if(a3.id&&b===0&&!m.z){a=m.y
a2=a+(4-(a&3)&3)
if(J.Z(k)>a2)a3.D($.q1(),H.a([J.Z(k)-a2],f))}a=m
if(a.Q==null)a.Q=k}}g.push(a0.bd())
a4.pop()
case 3:++b
s=2
break
case 4:return P.ek(null,r)
case 1:return P.ej(p,r)}})
return P.el($async$aZ,r)},
b_:function(){var s=0,r=P.eq(t.H),q=1,p,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7
var $async$b_=P.es(function(a9,b0){if(a9===1){p=b0
s=q}while(true)switch(s){case 0:a5=n.b
a6=a5.c
C.d.si(a6,0)
a6.push("images")
f=n.a.ch,e=f.b,d=a5.dy,c=t.M,b=t.x,a=a5.k1,f=f.a,a0=f.length,a1=0
case 2:if(!(a1<e)){s=4
break}a2=a1>=a0
m=a2?null:f[a1]
if(m==null){s=3
break}a6.push(C.c.k(a1))
a3=new N.fc(a5.O())
l=new N.jW(n,a3)
k=null
try{k=l.$1(m)}catch(a8){a2=H.G(a8)
if(b.b(a2)){j=a2
a5.l($.mR(),H.a([j],c),"uri")}else throw a8}i=null
s=k!=null?5:6
break
case 5:q=8
s=11
return P.d4(Y.tI(k),$async$b_)
case 11:i=b0
a2=i
if(!C.d.E(a,a2.a))a5.D($.q5(),H.a([i.a],c))
q=1
s=10
break
case 8:q=7
a7=p
a2=H.G(a7)
if(a2 instanceof Y.dI)a5.R($.q8())
else if(a2 instanceof Y.dH)a5.R($.q7())
else if(a2 instanceof Y.aR){h=a2
a5.D($.q2(),H.a([h],c))}else if(b.b(a2)){g=a2
a5.l($.mR(),H.a([g],c),"uri")}else throw a7
s=10
break
case 7:s=1
break
case 10:if(i!=null){a3.b=i.a
if(m.y!=null&&m.y!==i.a)a5.D($.q4(),H.a([i.a,m.y],c))
a2=i.d
if(a2!==0&&(a2&a2-1)>>>0===0){a2=i.e
a2=!(a2!==0&&(a2&a2-1)>>>0===0)}else a2=!0
if(a2)a5.D($.q6(),H.a([i.d,i.e],c))
a2=i
if(a2.f===C.z||a2.r===C.A||i.y||i.x)a5.R($.q3())
m.cx=i
a3.f=i}case 6:d.push(a3.bd())
a6.pop()
case 3:++a1
s=2
break
case 4:return P.ek(null,r)
case 1:return P.ej(p,r)}})
return P.el($async$b_,r)}}
N.jV.prototype={
$1:function(a){var s,r,q,p=this
if(a.a.a===0){s=a.x
if(s!=null){r=p.b
r.c=C.aG
r.e=s.k(0)
return p.a.c.$1(s)}else{s=a.Q
if(s!=null){p.b.c=C.aF
return s}else{s=p.a
r=s.b
if(r.id&&p.c===0&&!a.z){p.b.c=C.e0
q=s.c.$0()
if(q==null)r.R($.qy())
return q}}}}return null},
$S:64}
N.jW.prototype={
$1:function(a){var s,r,q=this
if(a.a.a===0){s=a.z
if(s!=null){r=q.b
r.c=C.aG
r.e=s.k(0)
return q.a.d.$1(s)}else{s=a.Q
if(s!=null&&a.y!=null){q.b.c=C.aF
return P.n5(H.a([s],t.f),t.w)}else if(a.ch!=null){q.b.c=C.e_
a.ex()
s=a.Q
if(s!=null)return P.n5(H.a([s],t.f),t.w)}}}return null},
$S:65}
O.mO.prototype={
$2:function(a,b){var s,r,q,p,o,n,m,l,k=O.mi(b)
if((k==null?null:k.dx)!=null){k=this.a
s=k.c
C.d.si(s,0)
s.push("accessors")
s.push(C.c.k(a))
r=b.dx.ge5()
if(r!=null)for(s=r.length,q=b.Q,p=t.M,o=0,n=-1,m=0;m<s;++m,n=l){l=r[m]
if(n!==-1&&l<=n)k.l($.pX(),H.a([o,l,n],p),"sparse")
if(l>=q)k.l($.pW(),H.a([o,l,q],p),"sparse");++o}}},
$S:66}
O.mP.prototype={
$1:function(a){return a.cx===0},
$S:5}
O.mQ.prototype={
$2:function(a,b){var s,r,q,p,o=this,n=null,m=b.fr,l=b.cx,k=P.P(l,n,!1,t.bF),j=P.P(l,n,!1,t.ga),i=t.hc,h=b.dx,g=0
while(!0){if(!(g<l)){s=!1
break}r=O.mi(h.j(0,"JOINTS_"+g))
q=O.mi(h.j(0,"WEIGHTS_"+g))
if((r==null?n:r.Q)===m)p=(q==null?n:q.Q)!==m
else p=!0
if(p){s=!0
break}p=i.a(r).ac()
k[g]=new P.aC(p.a(),H.A(p).h("aC<1>"))
p=q.bg()
j[g]=new P.aC(p.a(),H.A(p).h("aC<1>"));++g}if(s)return
l=o.b
i=l.c
i.push(C.c.k(a))
i.push("attributes")
h=o.c
C.d.H(h,k)
C.d.H(h,j)
l=l.O()
h=o.a
o.d.push(new O.eN(k,j,h.b-1,h.a,l,P.aM(t.e)))
i.pop()
i.pop()},
$S:18}
O.mk.prototype={
$1:function(a){return a.gq()==null},
$S:67}
O.eN.prototype={
dT:function(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this
for(s=e.a,r=s.length,q=e.b,p=e.c,o=e.e,n=t.M,m=e.Q,l=e.d,k=0;k<r;++k){j=s[k].gq()
if(j==null){e.x=!0
return}if(j>p){i=$.pT()
h=o+"/JOINTS_"+k
a.l(i,H.a([e.f,e.r,j,p,l],n),h)
continue}g=q[k].gq()
if(g!==0){if(!m.B(0,j)){i=$.pS()
h=o+"/JOINTS_"+k
a.l(i,H.a([e.f,e.r,j],n),h)
f=!1}else f=!0
if(g<0){i=$.pY()
h=o+"/WEIGHTS_"+k
a.l(i,H.a([e.f,e.r,g],n),h)}else if(f){i=e.y
h=$.nQ()
h[0]=i+g
e.y=h[0]
e.z+=2e-7}}else if(j!==0){i=$.pU()
h=o+"/JOINTS_"+k
a.l(i,H.a([e.f,e.r,j],n),h)}}if(4===++e.r){if(Math.abs(e.y-1)>e.z)for(k=0;k<r;++k){s=$.pZ()
q=o+"/WEIGHTS_"+k
p=e.f
a.l(s,H.a([p-3,p,e.y],n),q)}m.cB(0)
e.y=e.z=e.r=0}++e.f}}
E.bA.prototype={
k:function(a){return this.b}}
E.ix.prototype={}
E.hh.prototype={}
E.hE.prototype={
$1:function(a){return"Actual Data URI encoded data length "+H.b(a[0])+" is not equal to the declared buffer byteLength "+H.b(a[1])+"."},
$S:0}
E.hF.prototype={
$1:function(a){return"Actual data length "+H.b(a[0])+" is less than the declared buffer byteLength "+H.b(a[1])+"."},
$S:0}
E.hG.prototype={
$1:function(a){return"GLB-stored BIN chunk contains "+H.b(a[0])+" extra padding byte(s)."},
$S:0}
E.hx.prototype={
$1:function(a){return"Declared minimum value for this component ("+H.b(a[0])+") does not match actual minimum ("+H.b(a[1])+")."},
$S:0}
E.hw.prototype={
$1:function(a){return"Declared maximum value for this component ("+H.b(a[0])+") does not match actual maximum ("+H.b(a[1])+")."},
$S:0}
E.hm.prototype={
$1:function(a){return"Accessor contains "+H.b(a[0])+" element(s) less than declared minimum value "+H.b(a[1])+"."},
$S:0}
E.hl.prototype={
$1:function(a){return"Accessor contains "+H.b(a[0])+" element(s) greater than declared maximum value "+H.b(a[1])+"."},
$S:0}
E.hB.prototype={
$1:function(a){return"Vector3 at accessor indices "+H.b(a[0])+".."+H.b(a[1])+" is not of unit length: "+H.b(a[2])+"."},
$S:0}
E.hs.prototype={
$1:function(a){return"Vector3 with sign at accessor indices "+H.b(a[0])+".."+H.b(a[1])+" has invalid w component: "+H.b(a[2])+". Must be 1.0 or -1.0."},
$S:0}
E.hk.prototype={
$1:function(a){return"Animation sampler output accessor element at indices "+H.b(a[0])+".."+H.b(a[1])+" is not of unit length: "+H.b(a[2])+"."},
$S:0}
E.hy.prototype={
$1:function(a){return"Accessor element at index "+H.b(a[0])+" is not clamped to 0..1 range: "+H.b(a[1])+"."},
$S:0}
E.hq.prototype={
$1:function(a){return"Accessor element at index "+H.b(a[0])+" is "+H.b(a[1])+"."},
$S:0}
E.hn.prototype={
$1:function(a){return"Indices accessor element at index "+H.b(a[0])+" has value "+H.b(a[1])+" that is greater than the maximum vertex index available ("+H.b(a[2])+")."},
$S:0}
E.hp.prototype={
$1:function(a){return"Indices accessor contains "+H.b(a[0])+" degenerate triangles (out of "+H.b(a[1])+")."},
$S:0}
E.ho.prototype={
$1:function(a){return"Indices accessor contains primitive restart value ("+H.b(a[0])+") at index "+H.b(a[1])+"."},
$S:0}
E.hi.prototype={
$1:function(a){return u.m+H.b(a[0])+" is negative: "+H.b(a[1])+"."},
$S:0}
E.hj.prototype={
$1:function(a){return u.m+H.b(a[0])+" is less than or equal to previous: "+H.b(a[1])+" <= "+H.b(a[2])+"."},
$S:0}
E.hA.prototype={
$1:function(a){return u.c+H.b(a[0])+" is less than or equal to previous: "+H.b(a[1])+" <= "+H.b(a[2])+"."},
$S:0}
E.hz.prototype={
$1:function(a){return u.c+H.b(a[0])+" is greater than or equal to the number of accessor elements: "+H.b(a[1])+" >= "+H.b(a[2])+"."},
$S:0}
E.hr.prototype={
$1:function(a){return"Matrix element at index "+H.b(a[0])+" (component index "+H.b(a[1])+") contains invalid value: "+H.b(a[2])+"."},
$S:0}
E.hI.prototype={
$1:function(a){return"Image data is invalid. "+H.b(a[0])},
$S:0}
E.hK.prototype={
$1:function(a){return"Recognized image format "+("'"+H.b(a[0])+"'")+" does not match declared image format "+("'"+H.b(a[1])+"'")+"."},
$S:0}
E.hN.prototype={
$1:function(a){return"Unexpected end of image stream."},
$S:0}
E.hO.prototype={
$1:function(a){return"Image format not recognized."},
$S:0}
E.hL.prototype={
$1:function(a){return"'"+H.b(a[0])+"' MIME type requires an extension."},
$S:0}
E.hM.prototype={
$1:function(a){return"Image has non-power-of-two dimensions: "+H.b(a[0])+"x"+H.b(a[1])+"."},
$S:0}
E.hJ.prototype={
$1:function(a){return"Image contains unsupported features like non-default colorspace information, non-square pixels, or animation."},
$S:0}
E.hH.prototype={
$1:function(a){return"Data URI is used in GLB container."},
$S:0}
E.hu.prototype={
$1:function(a){return"Joints accessor element at index "+H.b(a[0])+" (component index "+H.b(a[1])+") has value "+H.b(a[2])+" that is greater than the maximum joint index ("+H.b(a[3])+") set by skin "+H.b(a[4])+"."},
$S:0}
E.ht.prototype={
$1:function(a){return"Joints accessor element at index "+H.b(a[0])+" (component index "+H.b(a[1])+") has value "+H.b(a[2])+" that is already in use for the vertex."},
$S:0}
E.hC.prototype={
$1:function(a){return"Weights accessor element at index "+H.b(a[0])+" (component index "+H.b(a[1])+") has negative value "+H.b(a[2])+"."},
$S:0}
E.hD.prototype={
$1:function(a){return"Weights accessor elements (at indices "+H.b(a[0])+".."+H.b(a[1])+") have non-normalized sum: "+H.b(a[2])+"."},
$S:0}
E.hv.prototype={
$1:function(a){return"Joints accessor element at index "+H.b(a[0])+" (component index "+H.b(a[1])+") is used with zero weight but has non-zero value ("+H.b(a[2])+")."},
$S:0}
E.iv.prototype={}
E.iw.prototype={
$1:function(a){return J.ah(a[0])},
$S:0}
E.jY.prototype={}
E.k_.prototype={
$1:function(a){return"Invalid array length "+H.b(a[0])+". Valid lengths are: "+J.bn(t.Y.a(a[1]),E.pn(),t.X).k(0)+"."},
$S:0}
E.k0.prototype={
$1:function(a){var s=a[0]
return"Type mismatch. Array element "+H.b(typeof s=="string"?"'"+s+"'":J.ah(s))+" is not a "+("'"+H.b(a[1])+"'")+"."},
$S:0}
E.jZ.prototype={
$1:function(a){return"Duplicate element."},
$S:0}
E.k2.prototype={
$1:function(a){return"Index must be a non-negative integer."},
$S:0}
E.k3.prototype={
$1:function(a){return"Invalid JSON data. Parser output: "+H.b(a[0])},
$S:0}
E.k4.prototype={
$1:function(a){return"Invalid URI "+("'"+H.b(a[0])+"'")+". Parser output:\n"+H.b(a[1])},
$S:0}
E.k1.prototype={
$1:function(a){return"Entity cannot be empty."},
$S:0}
E.k5.prototype={
$1:function(a){a.toString
return"Exactly one of "+new H.aa(a,E.db(),H.X(a).h("aa<1,f*>")).k(0)+" properties must be defined."},
$S:0}
E.k6.prototype={
$1:function(a){return"Value "+("'"+H.b(a[0])+"'")+" does not match regexp pattern "+("'"+H.b(a[1])+"'")+"."},
$S:0}
E.k7.prototype={
$1:function(a){var s=a[0]
return"Type mismatch. Property value "+H.b(typeof s=="string"?"'"+s+"'":J.ah(s))+" is not a "+("'"+H.b(a[1])+"'")+"."},
$S:0}
E.kc.prototype={
$1:function(a){var s=a[0]
return"Invalid value "+H.b(typeof s=="string"?"'"+s+"'":J.ah(s))+". Valid values are "+J.bn(t.Y.a(a[1]),E.pn(),t.X).k(0)+"."},
$S:0}
E.kd.prototype={
$1:function(a){return"Value "+H.b(a[0])+" is out of range."},
$S:0}
E.kb.prototype={
$1:function(a){return"Value "+H.b(a[0])+" is not a multiple of "+H.b(a[1])+"."},
$S:0}
E.k8.prototype={
$1:function(a){return"Property "+("'"+H.b(a[0])+"'")+" must be defined."},
$S:0}
E.k9.prototype={
$1:function(a){return"Unexpected property."},
$S:0}
E.ka.prototype={
$1:function(a){return"Dependency failed. "+("'"+H.b(a[0])+"'")+" must be defined."},
$S:0}
E.ke.prototype={}
E.kU.prototype={
$1:function(a){return"Unknown glTF major asset version: "+H.b(a[0])+"."},
$S:0}
E.kV.prototype={
$1:function(a){return"Unknown glTF minor asset version: "+H.b(a[0])+"."},
$S:0}
E.kF.prototype={
$1:function(a){return"Asset minVersion "+("'"+H.b(a[0])+"'")+" is greater than version "+("'"+H.b(a[1])+"'")+"."},
$S:0}
E.kt.prototype={
$1:function(a){return"Invalid value "+H.b(a[0])+" for GL type "+("'"+H.b(a[1])+"'")+"."},
$S:0}
E.kr.prototype={
$1:function(a){return"Integer value is written with fractional part: "+H.b(a[0])+"."},
$S:0}
E.kg.prototype={
$1:function(a){return"Only (u)byte and (u)short accessors can be normalized."},
$S:0}
E.kh.prototype={
$1:function(a){return"Offset "+H.b(a[0])+" is not a multiple of componentType length "+H.b(a[1])+"."},
$S:0}
E.kf.prototype={
$1:function(a){return"Matrix accessors must be aligned to 4-byte boundaries."},
$S:0}
E.ki.prototype={
$1:function(a){return"Sparse accessor overrides more elements ("+H.b(a[0])+") than the base accessor contains ("+H.b(a[1])+")."},
$S:0}
E.kj.prototype={
$1:function(a){return"Animated TRS properties will not affect a skinned mesh."},
$S:0}
E.kk.prototype={
$1:function(a){return"Buffer's Data URI MIME-Type must be 'application/octet-stream' or 'application/gltf-buffer'. Found "+("'"+H.b(a[0])+"'")+" instead."},
$S:0}
E.km.prototype={
$1:function(a){return"Buffer view's byteStride ("+H.b(a[0])+") is greater than byteLength ("+H.b(a[1])+")."},
$S:0}
E.kl.prototype={
$1:function(a){return"Only buffer views with raw vertex data can have byteStride."},
$S:0}
E.kn.prototype={
$1:function(a){return"xmag and ymag must not be zero."},
$S:0}
E.ko.prototype={
$1:function(a){return"yfov should be less than Pi."},
$S:0}
E.kp.prototype={
$1:function(a){return"zfar must be greater than znear."},
$S:0}
E.kv.prototype={
$1:function(a){return"Alpha cutoff is supported only for 'MASK' alpha mode."},
$S:0}
E.ky.prototype={
$1:function(a){return"Invalid attribute name."},
$S:0}
E.kE.prototype={
$1:function(a){return"All primitives must have the same number of morph targets."},
$S:0}
E.kD.prototype={
$1:function(a){return"All primitives should contain the same number of 'JOINTS' and 'WEIGHTS' attribute sets."},
$S:0}
E.kA.prototype={
$1:function(a){return"No POSITION attribute found."},
$S:0}
E.kx.prototype={
$1:function(a){return"Indices for indexed attribute semantic "+("'"+H.b(a[0])+"'")+" must start with 0 and be continuous. Total expected indices: "+H.b(a[1])+", total provided indices: "+H.b(a[2])+"."},
$S:0}
E.kC.prototype={
$1:function(a){return"TANGENT attribute without NORMAL found."},
$S:0}
E.kz.prototype={
$1:function(a){return"Number of JOINTS attribute semantics ("+H.b(a[0])+") does not match the number of WEIGHTS ("+H.b(a[1])+")."},
$S:0}
E.kB.prototype={
$1:function(a){return"TANGENT attribute defined for POINTS rendering mode."},
$S:0}
E.kw.prototype={
$1:function(a){return"The length of weights array ("+H.b(a[0])+u.p+H.b(a[1])+")."},
$S:0}
E.kJ.prototype={
$1:function(a){return"A node can have either a matrix or any combination of translation/rotation/scale (TRS) properties."},
$S:0}
E.kH.prototype={
$1:function(a){return"Do not specify default transform matrix."},
$S:0}
E.kK.prototype={
$1:function(a){return"Matrix must be decomposable to TRS."},
$S:0}
E.kR.prototype={
$1:function(a){return"Rotation quaternion must be normalized."},
$S:0}
E.kX.prototype={
$1:function(a){return"Unused extension "+("'"+H.b(a[0])+"'")+" cannot be required."},
$S:0}
E.kQ.prototype={
$1:function(a){return"Extension "+("'"+H.b(a[0])+"'")+" cannot be optional."},
$S:0}
E.kW.prototype={
$1:function(a){return"Extension uses unreserved extension prefix "+("'"+H.b(a[0])+"'")+"."},
$S:0}
E.ks.prototype={
$1:function(a){return"Extension name has invalid format."},
$S:0}
E.kI.prototype={
$1:function(a){return"Empty node encountered."},
$S:0}
E.kN.prototype={
$1:function(a){return"Node with a skinned mesh is not root. Parent transforms will not affect a skinned mesh."},
$S:0}
E.kM.prototype={
$1:function(a){return"Local transforms will not affect a skinned mesh."},
$S:0}
E.kL.prototype={
$1:function(a){return"A node with a skinned mesh is used in a scene that does not contain joint nodes."},
$S:0}
E.kS.prototype={
$1:function(a){return"Joints do not have a common root."},
$S:0}
E.kT.prototype={
$1:function(a){return"Skeleton node is not a common root."},
$S:0}
E.kP.prototype={
$1:function(a){return"Non-relative URI found: "+("'"+H.b(a[0])+"'")+"."},
$S:0}
E.kG.prototype={
$1:function(a){return"This extension may be incompatible with other extensions for the object."},
$S:0}
E.kO.prototype={
$1:function(a){return"Prefer JSON Objects for extras."},
$S:0}
E.kq.prototype={
$1:function(a){return"This property should not be defined as it will not be used."},
$S:0}
E.ku.prototype={
$1:function(a){return"outerConeAngle ("+H.b(a[1])+") is less than or equal to innerConeAngle ("+H.b(a[0])+")."},
$S:0}
E.iN.prototype={}
E.iQ.prototype={
$1:function(a){return"Accessor's total byteOffset "+H.b(a[0])+" isn't a multiple of componentType length "+H.b(a[1])+"."},
$S:0}
E.iO.prototype={
$1:function(a){return"Referenced bufferView's byteStride value "+H.b(a[0])+" is less than accessor element's length "+H.b(a[1])+"."},
$S:0}
E.iP.prototype={
$1:function(a){return"Accessor (offset: "+H.b(a[0])+", length: "+H.b(a[1])+") does not fit referenced bufferView ["+H.b(a[2])+"] length "+H.b(a[3])+"."},
$S:0}
E.iR.prototype={
$1:function(a){return"Override of previously set accessor usage. Initial: "+("'"+H.b(a[0])+"'")+", new: "+("'"+H.b(a[1])+"'")+"."},
$S:0}
E.iU.prototype={
$1:function(a){return"Animation channel has the same target as channel "+H.b(a[0])+"."},
$S:0}
E.iS.prototype={
$1:function(a){return"Animation channel cannot target TRS properties of a node with defined matrix."},
$S:0}
E.iT.prototype={
$1:function(a){return"Animation channel cannot target WEIGHTS when mesh does not have morph targets."},
$S:0}
E.iX.prototype={
$1:function(a){return"accessor.min and accessor.max must be defined for animation input accessor."},
$S:0}
E.iV.prototype={
$1:function(a){return"Invalid Animation sampler input accessor format "+("'"+H.b(a[0])+"'")+". Must be one of "+J.bn(t.Y.a(a[1]),E.db(),t.X).k(0)+"."},
$S:0}
E.iZ.prototype={
$1:function(a){return"Invalid animation sampler output accessor format "+("'"+H.b(a[0])+"'")+" for path "+("'"+H.b(a[2])+"'")+". Must be one of "+J.bn(t.Y.a(a[1]),E.db(),t.X).k(0)+"."},
$S:0}
E.iW.prototype={
$1:function(a){return"Animation sampler output accessor with "+("'"+H.b(a[0])+"'")+" interpolation must have at least "+H.b(a[1])+" elements. Got "+H.b(a[2])+"."},
$S:0}
E.iY.prototype={
$1:function(a){return"Animation sampler output accessor of count "+H.b(a[0])+" expected. Found "+H.b(a[1])+"."},
$S:0}
E.j_.prototype={
$1:function(a){return"Buffer refers to an unresolved GLB binary chunk."},
$S:0}
E.j1.prototype={
$1:function(a){return"BufferView does not fit buffer ("+H.b(a[0])+") byteLength ("+H.b(a[1])+")."},
$S:0}
E.j0.prototype={
$1:function(a){return"Override of previously set bufferView target or usage. Initial: "+("'"+H.b(a[0])+"'")+", new: "+("'"+H.b(a[1])+"'")+"."},
$S:0}
E.j2.prototype={
$1:function(a){return"bufferView.byteStride must not be defined for buffer views containing image data."},
$S:0}
E.j3.prototype={
$1:function(a){return"Accessor of count "+H.b(a[0])+" expected. Found "+H.b(a[1])+"."},
$S:0}
E.j7.prototype={
$1:function(a){return"Invalid accessor format "+("'"+H.b(a[0])+"'")+" for this attribute semantic. Must be one of "+J.bn(t.Y.a(a[1]),E.db(),t.X).k(0)+"."},
$S:0}
E.j8.prototype={
$1:function(a){return"Mesh attributes cannot use UNSIGNED_INT component type."},
$S:0}
E.je.prototype={
$1:function(a){return"accessor.min and accessor.max must be defined for POSITION attribute accessor."},
$S:0}
E.j6.prototype={
$1:function(a){return"bufferView.byteStride must be defined when two or more accessors use the same buffer view."},
$S:0}
E.j5.prototype={
$1:function(a){return"Vertex attribute data must be aligned to 4-byte boundaries."},
$S:0}
E.jb.prototype={
$1:function(a){return"bufferView.byteStride must not be defined for indices accessor."},
$S:0}
E.ja.prototype={
$1:function(a){return"Invalid indices accessor format "+("'"+H.b(a[0])+"'")+". Must be one of "+J.bn(t.Y.a(a[1]),E.db(),t.X).k(0)+". "},
$S:0}
E.j9.prototype={
$1:function(a){return"Number of vertices or indices ("+H.b(a[0])+") is not compatible with used drawing mode ("+("'"+H.b(a[1])+"'")+")."},
$S:0}
E.jf.prototype={
$1:function(a){return"Material is incompatible with mesh primitive: Texture binding "+("'"+H.b(a[0])+"'")+" needs 'TEXCOORD_"+H.b(a[1])+"' attribute."},
$S:0}
E.jg.prototype={
$1:function(a){return"All accessors of the same primitive must have the same count."},
$S:0}
E.jd.prototype={
$1:function(a){return"No base accessor for this attribute semantic."},
$S:0}
E.jc.prototype={
$1:function(a){return"Base accessor has different count."},
$S:0}
E.jh.prototype={
$1:function(a){return"Node is a part of a node loop."},
$S:0}
E.ji.prototype={
$1:function(a){return"Value overrides parent of node "+H.b(a[0])+"."},
$S:0}
E.jl.prototype={
$1:function(a){var s="The length of weights array ("+H.b(a[0])+u.p,r=a[1]
return s+H.b(r==null?0:r)+")."},
$S:0}
E.jj.prototype={
$1:function(a){return"Node has skin defined, but mesh has no joints data."},
$S:0}
E.jk.prototype={
$1:function(a){return"Node uses skinned mesh, but has no skin defined."},
$S:0}
E.jm.prototype={
$1:function(a){return"Node "+H.b(a[0])+" is not a root node."},
$S:0}
E.jo.prototype={
$1:function(a){return"Invalid IBM accessor format "+("'"+H.b(a[0])+"'")+". Must be one of "+J.bn(t.Y.a(a[1]),E.db(),t.X).k(0)+". "},
$S:0}
E.jn.prototype={
$1:function(a){return"bufferView.byteStride must not be defined for buffer views used by inverse bind matrices accessors."},
$S:0}
E.jp.prototype={
$1:function(a){return"Invalid MIME type "+("'"+H.b(a[0])+"'")+" for the texture source. Valid MIME types are "+J.bn(t.Y.a(a[1]),E.db(),t.X).k(0)+"."},
$S:0}
E.jq.prototype={
$1:function(a){return"Extension is not declared in extensionsUsed."},
$S:0}
E.jr.prototype={
$1:function(a){return"Unexpected location for this extension."},
$S:0}
E.js.prototype={
$1:function(a){return"Unresolved reference: "+H.b(a[0])+"."},
$S:0}
E.jt.prototype={
$1:function(a){return"Cannot validate an extension as it is not supported by the validator: "+("'"+H.b(a[0])+"'")+"."},
$S:0}
E.ju.prototype={
$1:function(a){return"This object may be unused."},
$S:0}
E.j4.prototype={
$1:function(a){return"This variant is used more than once for this mesh primitive."},
$S:0}
E.hR.prototype={}
E.hW.prototype={
$1:function(a){return"Invalid GLB magic value ("+H.b(a[0])+")."},
$S:0}
E.hX.prototype={
$1:function(a){return"Invalid GLB version value "+H.b(a[0])+"."},
$S:0}
E.hZ.prototype={
$1:function(a){return"Declared GLB length ("+H.b(a[0])+") is too small."},
$S:0}
E.hS.prototype={
$1:function(a){return"Length of "+H.b(a[0])+" chunk is not aligned to 4-byte boundaries."},
$S:0}
E.hY.prototype={
$1:function(a){return"Declared length ("+H.b(a[0])+") does not match GLB length ("+H.b(a[1])+")."},
$S:0}
E.hT.prototype={
$1:function(a){return"Chunk ("+H.b(a[0])+") length ("+H.b(a[1])+") does not fit total GLB length."},
$S:0}
E.hV.prototype={
$1:function(a){return"Chunk ("+H.b(a[0])+") cannot have zero length."},
$S:0}
E.hU.prototype={
$1:function(a){return"Chunk of type "+H.b(a[0])+" has already been used."},
$S:0}
E.i1.prototype={
$1:function(a){return"Unexpected end of chunk header."},
$S:0}
E.i0.prototype={
$1:function(a){return"Unexpected end of chunk data."},
$S:0}
E.i2.prototype={
$1:function(a){return"Unexpected end of header."},
$S:0}
E.i3.prototype={
$1:function(a){return"First chunk must be of JSON type. Found "+H.b(a[0])+" instead."},
$S:0}
E.i_.prototype={
$1:function(a){return"BIN chunk must be the second chunk."},
$S:0}
E.i4.prototype={
$1:function(a){return"Unknown GLB chunk type: "+H.b(a[0])+"."},
$S:0}
E.cK.prototype={
gbb:function(){var s=J.tc(this.a.c.$1(this.e))
return s},
gc4:function(){var s=this.b
return s==null?this.a.a:s},
gF:function(a){return C.a.gF(this.k(0))},
N:function(a,b){if(b==null)return!1
return b instanceof E.cK&&b.k(0)===this.k(0)},
k:function(a){var s=this,r=s.c
if(r!=null&&r.length!==0)return H.b(r)+": "+s.gbb()
r=s.d
if(r!=null)return"@"+H.b(r)+": "+s.gbb()
return s.gbb()}}
D.c4.prototype={
t:function(a,b){var s=this.d,r=this.e=a.ch.j(0,s)
if(s!==-1)if(r==null)b.l($.L(),H.a([s],t.M),"source")
else r.a$=!0},
c_:function(a,b){var s,r=this.e
r=r==null?null:r.cx
s=r==null?null:r.a
if(s!=null&&s!=="image/webp")b.l($.nH(),H.a([s,C.cQ],t.M),"source")},
$ics:1}
X.bu.prototype={
t:function(a,b){var s,r,q=b.c
q.push("lights")
s=this.d
r=J.cL(q.slice(0),H.X(q).c)
b.y.m(0,s,r)
s.a2(new X.iI(b,a))
q.pop()}}
X.iI.prototype={
$2:function(a,b){var s=this.a.c
s.push(C.c.k(a))
s.pop()},
$S:69}
X.b8.prototype={}
X.ca.prototype={}
X.cb.prototype={
t:function(a,b){var s,r,q=a.a.j(0,"KHR_lights_punctual")
if(q instanceof X.bu){s=this.d
r=this.e=q.d.j(0,s)
if(s!==-1)if(r==null)b.l($.L(),H.a([s],t.M),"light")
else r.a$=!0}else b.D($.cC(),H.a(["/extensions/KHR_lights_punctual"],t.M))}}
B.cc.prototype={
t:function(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("clearcoatTexture")
r.t(a,b)
s.pop()}r=this.r
if(r!=null){s=b.c
s.push("clearcoatRoughnessTexture")
r.t(a,b)
s.pop()}r=this.x
if(r!=null){s=b.c
s.push("clearcoatNormalTexture")
r.t(a,b)
s.pop()}}}
Y.cd.prototype={}
A.ce.prototype={
t:function(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("diffuseTexture")
r.t(a,b)
s.pop()}r=this.x
if(r!=null){s=b.c
s.push("specularGlossinessTexture")
r.t(a,b)
s.pop()}}}
U.cf.prototype={
t:function(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("sheenColorTexture")
r.t(a,b)
s.pop()}r=this.r
if(r!=null){s=b.c
s.push("sheenRoughnessTexture")
r.t(a,b)
s.pop()}}}
K.cg.prototype={
t:function(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("specularTexture")
r.t(a,b)
s.pop()}r=this.r
if(r!=null){s=b.c
s.push("specularColorTexture")
r.t(a,b)
s.pop()}}}
B.ch.prototype={
t:function(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("transmissionTexture")
r.t(a,b)
s.pop()}}}
S.ci.prototype={}
F.bv.prototype={
t:function(a,b){var s,r,q=b.c
q.push("variants")
s=this.d
r=J.cL(q.slice(0),H.X(q).c)
b.y.m(0,s,r)
s.a2(new F.iJ(b,a))
q.pop()}}
F.iJ.prototype={
$2:function(a,b){var s=this.a.c
s.push(C.c.k(a))
s.pop()},
$S:70}
F.aL.prototype={}
F.cj.prototype={
t:function(a,b){var s=b.c
s.push("mappings")
this.d.a2(new F.iM(b,a,P.aM(t.e)))
s.pop()}}
F.iM.prototype={
$2:function(a,b){var s=this.a,r=s.c
r.push(C.c.k(a))
b.cO(this.b,s,this.c)
r.pop()},
$S:71}
F.b9.prototype={
cO:function(a,b,c){var s,r,q,p=this,o=a.a.j(0,"KHR_materials_variants")
if(o instanceof F.bv){s=p.d
if(s!=null){r=b.c
r.push("variants")
P.of(s.gi(s),new F.iK(p,o,b,c),!1,t.J)
r.pop()}s=p.e
r=p.r=a.cx.j(0,s)
if(s!==-1)if(r==null)b.l($.L(),H.a([s],t.M),"material")
else{r.a$=!0
for(s=b.e,q=p;q!=null;){q=s.j(0,q)
if(q instanceof S.aB){p.r.dx.K(0,new F.iL(q,b))
break}}}}else b.D($.cC(),H.a(["/extensions/KHR_materials_variants"],t.M))},
t:function(a,b){return this.cO(a,b,null)}}
F.iK.prototype={
$1:function(a){var s=this,r=s.a.d.j(0,a),q=s.b.d.j(0,r)
if(r!==-1){if(!s.d.B(0,r))s.c.V($.qC(),a)
if(q==null)s.c.am($.L(),H.a([r],t.M),a)
else q.a$=!0}return q},
$S:72}
F.iL.prototype={
$2:function(a,b){var s
if(b!==-1){s=this.a
if(b+1>s.db)this.b.l($.nG(),H.a([a,b],t.M),"material")
else s.id[b]=-1}},
$S:4}
N.ck.prototype={
t:function(a,b){var s,r=this.r
if(r!=null){s=b.c
s.push("thicknessTexture")
r.t(a,b)
s.pop()}}}
L.cl.prototype={
t:function(a,b){var s,r
for(s=b.e,r=this;r!=null;){r=s.j(0,r)
if(r instanceof Y.aT){r.dx.m(0,b.O(),this.r)
break}}}}
D.Q.prototype={}
D.U.prototype={}
D.c5.prototype={
gF:function(a){var s=J.aF(this.a),r=J.aF(this.b)
return A.p9(A.fQ(A.fQ(0,C.c.gF(s)),C.c.gF(r)))},
N:function(a,b){if(b==null)return!1
return b instanceof D.c5&&this.b==b.b&&this.a==b.a}}
D.cm.prototype={}
D.fd.prototype={}
A.dj.prototype={
bV:function(){var s=this,r=s.d=s.c.bN(s.gds(),s.gdu(),s.gcj()),q=s.dy
q.e=r.gef()
q.f=r.gei()
q.r=new A.i7(s)
return s.e.a},
aY:function(){this.d.J()
var s=this.e
if(s.a.a===0)s.T(new K.ar("model/gltf-binary",null,this.fx))},
dt:function(a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=this,b="model/gltf-binary",a="0"
c.d.aL()
for(s=J.O(a0),r=t.g,q=t.G,p=t.M,o=c.a,n=0,m=0;n!==s.gi(a0);)switch(c.r){case 0:l=s.gi(a0)
k=c.x
m=Math.min(l-n,12-k)
l=k+m
c.x=l
C.j.a3(o,k,l,a0,n)
n+=m
c.y=m
if(c.x!==12)break
j=c.b.getUint32(0,!0)
if(j!==1179937895){c.f.a1($.qd(),H.a([j],p),0)
c.d.J()
s=c.e
if(s.a.a===0)s.T(new K.ar(b,null,c.fx))
return}i=c.b.getUint32(4,!0)
if(i!==2){c.f.a1($.qe(),H.a([i],p),4)
c.d.J()
s=c.e
if(s.a.a===0)s.T(new K.ar(b,null,c.fx))
return}l=c.z=c.b.getUint32(8,!0)
if(l<=c.y)c.f.a1($.qg(),H.a([l],p),8)
c.r=1
c.x=0
break
case 1:l=s.gi(a0)
k=c.x
m=Math.min(l-n,8-k)
l=k+m
c.x=l
C.j.a3(o,k,l,a0,n)
n+=m
c.y+=m
if(c.x!==8)break
c.ch=c.b.getUint32(0,!0)
l=c.b.getUint32(4,!0)
c.cx=l
if((c.ch&3)!==0){k=c.f
h=$.q9()
g=c.y
k.a1(h,H.a(["0x"+C.a.ao(C.c.ar(l,16),8,a)],p),g-8)}if(c.y+c.ch>c.z)c.f.a1($.qa(),H.a(["0x"+C.a.ao(C.c.ar(c.cx,16),8,a),c.ch],p),c.y-8)
if(c.Q===0&&c.cx!==1313821514)c.f.a1($.ql(),H.a(["0x"+C.a.ao(C.c.ar(c.cx,16),8,a)],p),c.y-8)
l=c.cx
if(l===5130562&&c.Q>1&&!c.fr)c.f.a1($.qh(),H.a(["0x"+C.a.ao(C.c.ar(l,16),8,a)],p),c.y-8)
f=new A.i5(c)
l=c.cx
switch(l){case 1313821514:if(c.ch===0){k=c.f
h=$.qc()
g=c.y
k.a1(h,H.a(["0x"+C.a.ao(C.c.ar(l,16),8,a)],p),g-8)}f.$1$seen(c.cy)
c.cy=!0
break
case 5130562:f.$1$seen(c.fr)
c.fr=!0
break
default:c.f.a1($.qm(),H.a(["0x"+C.a.ao(C.c.ar(l,16),8,a)],p),c.y-8)
c.r=4294967295}++c.Q
c.x=0
break
case 1313821514:m=Math.min(s.gi(a0)-n,c.ch-c.x)
if(c.db==null){l=c.dy
k=c.f
l=new K.cI(new P.al(l,H.A(l).h("al<1>")),new P.aw(new P.C($.z,r),q))
l.e=k
c.db=l
c.dx=l.bV()}l=c.dy
e=n+m
k=s.a0(a0,n,e)
if(l.b>=4)H.a0(l.bl())
h=l.b
if((h&1)!==0)l.al(k)
else if((h&3)===0){l=l.aW()
k=new P.cw(k)
d=l.c
if(d==null)l.b=l.c=k
else{d.saB(k)
l.c=k}}l=c.x+=m
c.y+=m
if(l===c.ch){c.dy.a5()
c.r=1
c.x=0}n=e
break
case 5130562:l=s.gi(a0)
k=c.ch
h=c.x
m=Math.min(l-n,k-h)
l=c.fx
if(l==null)l=c.fx=new Uint8Array(k)
k=h+m
c.x=k
C.j.a3(l,h,k,a0,n)
n+=m
c.y+=m
if(c.x===c.ch){c.r=1
c.x=0}break
case 4294967295:l=s.gi(a0)
k=c.ch
h=c.x
m=Math.min(l-n,k-h)
h+=m
c.x=h
n+=m
c.y+=m
if(h===k){c.r=1
c.x=0}break}c.d.ap()},
dv:function(){var s,r,q=this
switch(q.r){case 0:q.f.bC($.qk(),q.y)
q.aY()
break
case 1:if(q.x!==0){q.f.bC($.qj(),q.y)
q.aY()}else{s=q.z
r=q.y
if(s!==r)q.f.a1($.qf(),H.a([s,r],t.M),q.y)
s=q.dx
if(s!=null)s.aq(0,new A.i6(q),q.gcj(),t.P)
else q.e.T(new K.ar("model/gltf-binary",null,q.fx))}break
default:if(q.ch>0)q.f.bC($.qi(),q.y)
q.aY()}},
dw:function(a){var s
this.d.J()
s=this.e
if(s.a.a===0)s.M(a)},
$ieI:1}
A.i7.prototype={
$0:function(){var s=this.a
if((s.dy.b&4)!==0)s.d.ap()
else s.aY()},
$S:2}
A.i5.prototype={
$1$seen:function(a){var s=this.a
if(a){s.f.a1($.qb(),H.a(["0x"+C.a.ao(C.c.ar(s.cx,16),8,"0")],t.M),s.y-8)
s.r=4294967295}else s.r=s.cx},
$0:function(){return this.$1$seen(null)},
$S:75}
A.i6.prototype={
$1:function(a){var s=this.a,r=a==null?null:a.b
s.e.T(new K.ar("model/gltf-binary",r,s.fx))},
$S:76}
K.ar.prototype={}
K.ia.prototype={
$0:function(){return this.a.b.aL()},
$S:1}
K.ib.prototype={
$0:function(){return this.a.b.ap()},
$S:1}
K.i9.prototype={
$0:function(){return this.a.b.J()},
$S:77}
K.ic.prototype={
$1:function(a){var s,r,q,p,o=this,n=null,m=o.a
if(!m.a){s=J.O(a)
if(s.gv(a)){m.b.J()
o.b.a5()
o.c.M(C.a0)
return}r=s.j(a,0)
if(103===r){s=o.b
q=o.d
p=new Uint8Array(12)
s=new A.dj(p,new P.al(s,H.A(s).h("al<1>")),new P.aw(new P.C($.z,t.g),t.G))
q.id=!0
s.f=q
s.b=H.jK(p.buffer,0,n)
s.dy=P.oB(n,n,n,t.w)
o.c.T(s)
m.a=!0}else{s=123===r||9===r||32===r||10===r||13===r||239===r
q=o.c
p=o.b
if(s){q.T(K.tE(new P.al(p,H.A(p).h("al<1>")),o.d))
m.a=!0}else{m.b.J()
p.a5()
q.M(C.a0)
return}}}o.b.B(0,a)},
$S:21}
K.cI.prototype={
bV:function(){var s=this,r=H.a([],t.M),q=new P.ab("")
s.d=new P.m4(new P.fP(!1),new P.lT(C.a3.gcF().a,new P.fF(new K.i8(s),r,t.cy),q),q)
s.b=s.a.bN(s.gdB(),s.gdD(),s.gdF())
return s.c.a},
dC:function(a){var s,r,q,p=this
p.b.aL()
if(p.f){r=J.O(a)
if(r.ga6(a)&&239===r.j(a,0))p.e.ay($.fX(),H.a(["BOM found at the beginning of UTF-8 stream."],t.M),!0)
p.f=!1}try{p.d.dR(a,0,J.Z(a),!1)
p.b.ap()}catch(q){r=H.G(q)
if(r instanceof P.aH){s=r
p.e.ay($.fX(),H.a([s],t.M),!0)
p.b.J()
p.c.b4()}else throw q}},
dG:function(a){var s
this.b.J()
s=this.c
if(s.a.a===0)s.M(a)},
dE:function(){var s,r,q,p=this
try{p.d.a5()}catch(r){q=H.G(r)
if(q instanceof P.aH){s=q
p.e.ay($.fX(),H.a([s],t.M),!0)
p.b.J()
p.c.b4()}else throw r}},
$ieI:1}
K.i8.prototype={
$1:function(a){var s,r,q,p=a[0]
if(t.t.b(p))try{r=this.a
s=V.o6(p,r.e)
r.c.T(new K.ar("model/gltf+json",s,null))}catch(q){if(H.G(q) instanceof M.c8){r=this.a
r.b.J()
r.c.b4()}else throw q}else{r=this.a
r.e.ay($.a1(),H.a([p,"object"],t.M),!0)
r.b.J()
r.c.b4()}},
$S:78}
K.dl.prototype={
k:function(a){return"Invalid data: could not detect glTF format."},
$ia7:1}
F.mq.prototype={
$2:function(a,b){this.a.$1(a)
if(!(H.aO(b)&&b>=0)){this.b.m(0,a,-1)
this.c.p($.fW(),a)}},
$S:3}
F.mr.prototype={
$2:function(a,b){this.a.$1(a)
if(!(H.aO(b)&&b>=0)){this.b.m(0,a,-1)
this.c.p($.fW(),a)}},
$S:3}
F.ms.prototype={
$1:function(a){return a.ag(0,t.X,t.e)},
$S:79}
F.mo.prototype={
$0:function(){return H.a([],t.bH)},
$S:80}
F.D.prototype={
j:function(a,b){return b==null||b<0||b>=this.a.length?null:this.a[b]},
m:function(a,b,c){this.a[b]=c},
gi:function(a){return this.b},
si:function(a,b){throw H.d(P.ac("Changing length is not supported"))},
k:function(a){return P.iy(this.a,"[","]")},
a2:function(a){var s,r,q,p
for(s=this.b,r=this.a,q=0;q<s;++q){p=r[q]
if(p==null)continue
a.$2(q,p)}}}
F.a_.prototype={
az:function(a){return!0}}
F.fk.prototype={
Z:function(a,b,c,d){var s=this,r=s.c,q=r!=null?r.$1(d):d
r=s.a+q*q
s.a=r
if(2===c){if(Math.abs(Math.sqrt(r)-1)>0.00674)a.l($.nz(),H.a([b-2,b,Math.sqrt(s.a)],t.M),s.b)
s.a=0}return!0}}
F.fl.prototype={
Z:function(a,b,c,d){var s=this,r=s.c,q=r!=null?r.$1(d):d
if(3===c){if(1!==q&&-1!==q)a.l($.pR(),H.a([b-3,b,q],t.M),s.b)}else{r=s.a+q*q
s.a=r
if(2===c){if(Math.abs(Math.sqrt(r)-1)>0.00674)a.l($.nz(),H.a([b-2,b,Math.sqrt(s.a)],t.M),s.b)
s.a=0}}return!0}}
F.eC.prototype={
Z:function(a,b,c,d){if(1<d||0>d)a.l($.pV(),H.a([b,d],t.M),this.a)
return!0}}
A.li.prototype={
bd:function(){var s,r,q,p,o,n=this,m=t.X,l=t._,k=P.a8(m,l),j=n.a
if(j!=null)k.m(0,"uri",j.k(0))
j=n.c
s=j==null
if((s?null:j.a)!=null)k.m(0,"mimeType",s?null:j.a)
k.m(0,"validatorVersion","2.0.0-dev.3.5")
if(n.d)k.m(0,"validatedAt",new P.df(Date.now(),!1).eu().es())
j=n.b
r=j.fy
q=P.a8(m,l)
p=H.a([0,0,0,0],t.V)
o=P.of(r.length,new A.ll(r,p),!1,t.t)
q.m(0,"numErrors",p[0])
q.m(0,"numWarnings",p[1])
q.m(0,"numInfos",p[2])
q.m(0,"numHints",p[3])
q.m(0,"messages",o)
q.m(0,"truncated",j.z)
k.m(0,"issues",q)
j=n.dr()
if(j!=null)k.m(0,"info",j)
return k},
dr:function(){var s,r,q,p,o,n,m,l,k,j,i=null,h=this.c,g=h==null?i:h.b
h=g==null?i:g.x
if((h==null?i:h.f)==null)return i
s=P.a8(t.X,t._)
h=g.x
s.m(0,"version",h.f)
r=h.r
if(r!=null)s.m(0,"minVersion",r)
h=h.e
if(h!=null)s.m(0,"generator",h)
h=g.d
r=J.O(h)
if(r.ga6(h)){h=r.bZ(h)
s.m(0,"extensionsUsed",P.eR(h,!1,H.A(h).c))}h=g.e
r=J.O(h)
if(r.ga6(h)){h=r.bZ(h)
s.m(0,"extensionsRequired",P.eR(h,!1,H.A(h).c))}h=this.b
r=h.fr
if(!r.gv(r))s.m(0,"resources",h.fr)
s.m(0,"animationCount",g.r.b)
s.m(0,"materialCount",g.cx.b)
h=g.cy
s.m(0,"hasMorphTargets",h.bD(h,new A.lk()))
r=g.fx
s.m(0,"hasSkins",!r.gv(r))
r=g.fy
s.m(0,"hasTextures",!r.gv(r))
s.m(0,"hasDefaultScene",g.dy!=null)
for(h=new H.a9(h,h.gi(h),h.$ti.h("a9<n.E>")),q=0,p=0,o=0,n=0,m=0,l=0;h.n();){r=h.d.x
if(r!=null){q+=r.b
for(r=new H.a9(r,r.gi(r),r.$ti.h("a9<n.E>"));r.n();){k=r.d
j=k.fr
if(j!==-1)m+=j
l+=k.gev()
p=Math.max(p,k.dx.a)
o=Math.max(o,k.db)
n=Math.max(n,k.cx*4)}}}s.m(0,"drawCallCount",q)
s.m(0,"totalVertexCount",m)
s.m(0,"totalTriangleCount",l)
s.m(0,"maxUVs",o)
s.m(0,"maxInfluences",n)
s.m(0,"maxAttributes",p)
return s}}
A.ll.prototype={
$1:function(a){var s,r=this.a[a],q=r.gc4().a,p=this.b
p[q]=p[q]+1
s=P.n2(["code",r.a.b,"message",r.gbb(),"severity",r.gc4().a],t.X,t._)
q=r.c
if(q!=null)s.m(0,"pointer",q)
else{q=r.d
if(q!=null)s.m(0,"offset",q)}return s},
$S:81}
A.lk.prototype={
$1:function(a){var s=a.x
return s!=null&&s.bD(s,new A.lj())},
$S:82}
A.lj.prototype={
$1:function(a){return a.fx!=null},
$S:5}
A.mu.prototype={
$2:function(a,b){var s=a+J.aF(b)&536870911
s=s+((s&524287)<<10)&536870911
return s^s>>>6},
$S:83}
T.eS.prototype={
k:function(a){return"[0] "+this.ad(0).k(0)+"\n[1] "+this.ad(1).k(0)+"\n[2] "+this.ad(2).k(0)+"\n"},
N:function(a,b){var s,r,q
if(b==null)return!1
if(b instanceof T.eS){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]&&s[3]===q[3]&&s[4]===q[4]&&s[5]===q[5]&&s[6]===q[6]&&s[7]===q[7]&&s[8]===q[8]}else s=!1
return s},
gF:function(a){return A.mt(this.a)},
ad:function(a){var s=new Float32Array(3),r=this.a
s[0]=r[a]
s[1]=r[3+a]
s[2]=r[6+a]
return new T.cu(s)}}
T.cO.prototype={
d1:function(a){var s=a.a,r=this.a
r[15]=s[15]
r[14]=s[14]
r[13]=s[13]
r[12]=s[12]
r[11]=s[11]
r[10]=s[10]
r[9]=s[9]
r[8]=s[8]
r[7]=s[7]
r[6]=s[6]
r[5]=s[5]
r[4]=s[4]
r[3]=s[3]
r[2]=s[2]
r[1]=s[1]
r[0]=s[0]},
k:function(a){var s=this
return"[0] "+s.ad(0).k(0)+"\n[1] "+s.ad(1).k(0)+"\n[2] "+s.ad(2).k(0)+"\n[3] "+s.ad(3).k(0)+"\n"},
N:function(a,b){var s,r,q
if(b==null)return!1
if(b instanceof T.cO){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]&&s[3]===q[3]&&s[4]===q[4]&&s[5]===q[5]&&s[6]===q[6]&&s[7]===q[7]&&s[8]===q[8]&&s[9]===q[9]&&s[10]===q[10]&&s[11]===q[11]&&s[12]===q[12]&&s[13]===q[13]&&s[14]===q[14]&&s[15]===q[15]}else s=!1
return s},
gF:function(a){return A.mt(this.a)},
ad:function(a){var s=new Float32Array(4),r=this.a
s[0]=r[a]
s[1]=r[4+a]
s[2]=r[8+a]
s[3]=r[12+a]
return new T.fq(s)},
cG:function(){var s=this.a,r=s[0],q=s[5],p=s[1],o=s[4],n=r*q-p*o,m=s[6],l=s[2],k=r*m-l*o,j=s[7],i=s[3],h=r*j-i*o,g=p*m-l*q,f=p*j-i*q,e=l*j-i*m
m=s[8]
i=s[9]
j=s[10]
l=s[11]
return-(i*e-j*f+l*g)*s[12]+(m*e-j*h+l*k)*s[13]-(m*f-i*h+l*n)*s[14]+(m*g-i*k+j*n)*s[15]},
cL:function(){var s=this.a,r=0+Math.abs(s[0])+Math.abs(s[1])+Math.abs(s[2])+Math.abs(s[3]),q=r>0?r:0
r=0+Math.abs(s[4])+Math.abs(s[5])+Math.abs(s[6])+Math.abs(s[7])
if(r>q)q=r
r=0+Math.abs(s[8])+Math.abs(s[9])+Math.abs(s[10])+Math.abs(s[11])
if(r>q)q=r
r=0+Math.abs(s[12])+Math.abs(s[13])+Math.abs(s[14])+Math.abs(s[15])
return r>q?r:q},
cM:function(){var s=this.a
return s[0]===1&&s[1]===0&&s[2]===0&&s[3]===0&&s[4]===0&&s[5]===1&&s[6]===0&&s[7]===0&&s[8]===0&&s[9]===0&&s[10]===1&&s[11]===0&&s[12]===0&&s[13]===0&&s[14]===0&&s[15]===1}}
T.fa.prototype={
gaJ:function(){var s=this.a,r=s[0],q=s[1],p=s[2],o=s[3]
return r*r+q*q+p*p+o*o},
gi:function(a){var s=this.a,r=s[0],q=s[1],p=s[2],o=s[3]
return Math.sqrt(r*r+q*q+p*p+o*o)},
k:function(a){var s=this.a
return H.b(s[0])+", "+H.b(s[1])+", "+H.b(s[2])+" @ "+H.b(s[3])}}
T.cu.prototype={
bj:function(a,b,c){var s=this.a
s[0]=a
s[1]=b
s[2]=c},
k:function(a){var s=this.a
return"["+H.b(s[0])+","+H.b(s[1])+","+H.b(s[2])+"]"},
N:function(a,b){var s,r,q
if(b==null)return!1
if(b instanceof T.cu){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]}else s=!1
return s},
gF:function(a){return A.mt(this.a)},
gi:function(a){var s=this.a,r=s[0],q=s[1]
s=s[2]
return Math.sqrt(r*r+q*q+s*s)},
gaJ:function(){var s=this.a,r=s[0],q=s[1]
s=s[2]
return r*r+q*q+s*s}}
T.fq.prototype={
k:function(a){var s=this.a
return H.b(s[0])+","+H.b(s[1])+","+H.b(s[2])+","+H.b(s[3])},
N:function(a,b){var s,r,q
if(b==null)return!1
if(b instanceof T.fq){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]&&s[3]===q[3]}else s=!1
return s},
gF:function(a){return A.mt(this.a)},
gi:function(a){var s=this.a,r=s[0],q=s[1],p=s[2]
s=s[3]
return Math.sqrt(r*r+q*q+p*p+s*s)}}
Q.bd.prototype={}
Q.hQ.prototype={}
Q.cZ.prototype={}
Q.mL.prototype={
$3:function(a,b,c){var s=c.$1(J.ah(a))
return s},
$S:84}
Q.mH.prototype={
$2:function(a,b){return new self.Promise(P.cy(new Q.mG(a,b,this.a)),t._)},
$C:"$2",
$R:2,
$S:85}
Q.mG.prototype={
$2:function(a,b){Q.fT(this.a,this.b).aq(0,new Q.mD(a),new Q.mE(this.c,b),t.P)},
$C:"$2",
$R:2,
$S:24}
Q.mD.prototype={
$1:function(a){this.a.$1(P.nq(a))},
$S:25}
Q.mE.prototype={
$2:function(a,b){return this.a.$3(a,b,this.b)},
$C:"$2",
$R:2,
$S:26}
Q.mI.prototype={
$2:function(a,b){return new self.Promise(P.cy(new Q.mF(a,b,this.a)),t._)},
$C:"$2",
$R:2,
$S:135}
Q.mF.prototype={
$2:function(a,b){Q.nt(this.a,this.b).aq(0,new Q.mB(a),new Q.mC(this.c,b),t.P)},
$C:"$2",
$R:2,
$S:24}
Q.mB.prototype={
$1:function(a){this.a.$1(P.nq(a))},
$S:25}
Q.mC.prototype={
$2:function(a,b){return this.a.$3(a,b,this.b)},
$C:"$2",
$R:2,
$S:26}
Q.mJ.prototype={
$0:function(){return"2.0.0-dev.3.5"},
$C:"$0",
$R:0,
$S:90}
Q.mK.prototype={
$0:function(){return P.nq(M.tz())},
$C:"$0",
$R:0,
$S:6}
Q.mf.prototype={
$1:function(a){var s=new P.C($.z,t.q),r=new P.aw(s,t.as),q=this.a.$1(J.ah(a))
if((q==null?null:J.t_(q))==null)r.M(new P.ao(!1,null,null,"options.externalResourceFunction: Function must return a Promise."))
else J.ta(q,P.cy(new Q.mg(r)),P.cy(new Q.mh(r)))
return s},
$S:91}
Q.mg.prototype={
$1:function(a){var s=this.a
if(t.a.b(a))s.T(a)
else s.M(new P.ao(!1,null,null,"options.externalResourceFunction: Promise must be fulfilled with Uint8Array or rejected."))},
$S:22}
Q.mh.prototype={
$1:function(a){return this.a.M(new Q.f3(J.ah(a)))},
$S:10}
Q.md.prototype={
$1:function(a){var s,r,q,p=this
if(p.a.id&&a==null)return p.b.c
if(p.c!=null)s=p.d.$1(a)
else{r=p.e
H.da(r,"error",t.K)
$.z!==C.f
q=P.eA(r)
s=new P.C($.z,t.q)
s.aU(r,q)}return s},
$0:function(){return this.$1(null)},
$C:"$1",
$R:0,
$D:function(){return[null]},
$S:92}
Q.me.prototype={
$1:function(a){var s,r,q,p,o=null
if(this.a!=null){s=this.b.$1(a)
s=P.us(s,H.ae(s).c)}else{s=this.c
H.da(s,"error",t.K)
r=t.f1
q=new P.bG(o,o,o,o,r)
p=P.eA(s)
q.aQ(s,p)
q.aV()
s=new P.al(q,r.h("al<1>"))}return s},
$S:93}
Q.f3.prototype={
k:function(a){return"Node Exception: "+H.b(this.a)},
$ia7:1};(function aliases(){var s=J.cJ.prototype
s.d3=s.bc
s=J.aJ.prototype
s.d4=s.k
s=P.n.prototype
s.d5=s.a3
s=P.e6.prototype
s.d6=s.a5})();(function installTearOffs(){var s=hunkHelpers._static_1,r=hunkHelpers._static_0,q=hunkHelpers._static_2,p=hunkHelpers._instance_2u,o=hunkHelpers._instance_0u,n=hunkHelpers.installInstanceTearOff,m=hunkHelpers._instance_1i,l=hunkHelpers._instance_1u
s(P,"vX","uA",11)
s(P,"vY","uB",11)
s(P,"vZ","uC",11)
r(P,"pl","vK",1)
q(P,"w_","vE",14)
p(P.C.prototype,"gdh","au",14)
o(P.d1.prototype,"gdU","a5",54)
var k
o(k=P.dM.prototype,"gco","b0",1)
o(k,"gcp","b1",1)
n(k=P.cV.prototype,"gef",0,0,null,["$1","$0"],["cT","aL"],58,0)
o(k,"gei","ap",1)
o(k,"gco","b0",1)
o(k,"gcp","b1",1)
m(P.b_.prototype,"gcC","E",61)
q(M,"vT","tg",95)
q(M,"vS","tf",96)
q(M,"vQ","td",97)
q(M,"vR","te",98)
l(M.a2.prototype,"gbQ","ee",120)
q(Z,"vV","ti",99)
q(Z,"vU","th",100)
q(T,"vW","tj",101)
q(Q,"w0","to",102)
q(V,"w1","tn",103)
q(G,"w4","tr",104)
q(G,"w2","tp",105)
q(G,"w3","tq",106)
q(T,"wh","tJ",107)
q(Y,"wE","u4",108)
q(Y,"wG","uf",109)
q(Y,"wF","ue",110)
q(Y,"px","ud",111)
q(Y,"aE","uu",112)
q(S,"wH","u8",113)
q(V,"wI","uc",114)
q(T,"wJ","up",115)
q(B,"wK","uq",116)
q(O,"wL","ur",117)
q(U,"wN","uv",118)
s(E,"db","vG",27)
s(E,"pn","vC",27)
s(D,"wa","vq",12)
q(D,"w9","tD",121)
q(X,"wo","tQ",122)
q(X,"wp","tR",123)
q(X,"wq","tS",124)
q(B,"wr","tT",125)
q(Y,"ws","tU",126)
q(A,"wt","tV",127)
q(U,"wu","tW",128)
q(K,"wv","tX",129)
q(B,"ww","tY",130)
q(S,"wx","tZ",131)
q(F,"tO","u_",132)
q(F,"tP","u0",133)
q(N,"wy","u1",134)
q(L,"wA","u2",89)
l(k=A.dj.prototype,"gds","dt",23)
o(k,"gdu","dv",1)
l(k,"gcj","dw",10)
l(k=K.cI.prototype,"gdB","dC",23)
l(k,"gdF","dG",10)
o(k,"gdD","dE",1)
s(U,"wz","vr",12)})();(function inheritance(){var s=hunkHelpers.mixin,r=hunkHelpers.inherit,q=hunkHelpers.inheritMany
r(P.e,null)
q(P.e,[H.n0,J.cJ,J.aG,P.j,H.dd,P.K,H.c2,P.F,P.dZ,H.a9,P.J,H.dg,H.di,H.fn,H.cS,P.du,H.cF,H.iz,H.l6,H.f6,H.dh,H.e3,H.lX,H.jv,H.dr,H.iA,H.lV,H.aN,H.fA,H.e8,P.m2,P.ft,P.cY,P.aC,P.ez,P.fw,P.bI,P.C,P.fu,P.aX,P.fg,P.d1,P.fJ,P.fv,P.cV,P.fE,P.fy,P.lF,P.fH,P.m5,P.dU,P.eh,P.lU,P.dY,P.n,P.fN,P.cQ,P.fO,P.l5,P.eD,P.lC,P.eB,P.fP,P.df,P.f7,P.dE,P.dP,P.aH,P.cN,P.k,P.fI,P.ab,P.ee,P.l8,P.fG,V.fB,F.a_,V.fp,V.bY,V.bW,V.x,M.lh,M.i,M.c8,Y.dW,Y.dK,Y.cW,Y.c6,Y.c7,Y.iq,Y.dI,Y.dH,Y.aR,N.d0,N.fc,N.jU,O.eN,E.bA,E.ix,E.cK,D.Q,D.U,D.c5,D.cm,D.fd,A.dj,K.ar,K.cI,K.dl,A.li,T.eS,T.cO,T.fa,T.cu,T.fq,Q.f3])
q(J.cJ,[J.dn,J.cM,J.aJ,J.B,J.c9,J.bt,H.dy])
q(J.aJ,[J.f8,J.ct,J.aS,Q.bd,Q.hQ,Q.cZ])
r(J.iB,J.B)
q(J.c9,[J.dp,J.eP])
q(P.j,[H.bH,H.o,H.bb,H.ln,H.be,H.dL,P.dm])
q(H.bH,[H.c0,H.eg])
r(H.dO,H.c0)
r(H.dJ,H.eg)
r(H.b3,H.dJ)
r(P.dt,P.K)
q(P.dt,[H.c1,H.aK,P.dS,P.fC])
q(H.c2,[H.h8,H.mN,H.jR,H.fh,H.iF,H.mw,H.mx,H.my,P.lz,P.ly,P.lA,P.lB,P.m3,P.m6,P.m7,P.ml,P.lG,P.lN,P.lJ,P.lK,P.lL,P.lI,P.lM,P.lH,P.lQ,P.lR,P.lP,P.lO,P.l_,P.l0,P.l1,P.l2,P.l3,P.m1,P.m0,P.lE,P.lD,P.lW,P.mj,P.m_,P.lZ,P.jw,P.jx,P.lg,P.lf,P.jL,P.la,P.lb,P.lc,P.ma,P.mb,P.mc,P.m8,M.lu,M.lv,M.lw,M.lx,M.ls,M.lt,M.lo,M.lp,M.lq,M.lr,Z.fZ,Z.h_,V.ik,V.il,V.im,V.ii,V.ij,V.ig,V.ih,V.id,V.ie,V.io,V.ip,Y.jz,S.jJ,S.jI,S.jA,S.jB,S.jC,S.jE,S.jF,S.jG,S.jH,S.jD,V.jM,V.jN,V.jO,B.jX,O.kZ,M.ha,M.h9,M.hb,M.he,M.hf,M.hc,M.hd,M.hg,Y.is,Y.iu,Y.it,Y.ir,Y.iE,Y.iD,Y.jQ,N.jV,N.jW,O.mO,O.mP,O.mQ,O.mk,E.hE,E.hF,E.hG,E.hx,E.hw,E.hm,E.hl,E.hB,E.hs,E.hk,E.hy,E.hq,E.hn,E.hp,E.ho,E.hi,E.hj,E.hA,E.hz,E.hr,E.hI,E.hK,E.hN,E.hO,E.hL,E.hM,E.hJ,E.hH,E.hu,E.ht,E.hC,E.hD,E.hv,E.iw,E.k_,E.k0,E.jZ,E.k2,E.k3,E.k4,E.k1,E.k5,E.k6,E.k7,E.kc,E.kd,E.kb,E.k8,E.k9,E.ka,E.kU,E.kV,E.kF,E.kt,E.kr,E.kg,E.kh,E.kf,E.ki,E.kj,E.kk,E.km,E.kl,E.kn,E.ko,E.kp,E.kv,E.ky,E.kE,E.kD,E.kA,E.kx,E.kC,E.kz,E.kB,E.kw,E.kJ,E.kH,E.kK,E.kR,E.kX,E.kQ,E.kW,E.ks,E.kI,E.kN,E.kM,E.kL,E.kS,E.kT,E.kP,E.kG,E.kO,E.kq,E.ku,E.iQ,E.iO,E.iP,E.iR,E.iU,E.iS,E.iT,E.iX,E.iV,E.iZ,E.iW,E.iY,E.j_,E.j1,E.j0,E.j2,E.j3,E.j7,E.j8,E.je,E.j6,E.j5,E.jb,E.ja,E.j9,E.jf,E.jg,E.jd,E.jc,E.jh,E.ji,E.jl,E.jj,E.jk,E.jm,E.jo,E.jn,E.jp,E.jq,E.jr,E.js,E.jt,E.ju,E.j4,E.hW,E.hX,E.hZ,E.hS,E.hY,E.hT,E.hV,E.hU,E.i1,E.i0,E.i2,E.i3,E.i_,E.i4,X.iI,F.iJ,F.iM,F.iK,F.iL,A.i7,A.i5,A.i6,K.ia,K.ib,K.i9,K.ic,K.i8,F.mq,F.mr,F.ms,F.mo,A.ll,A.lk,A.lj,A.mu,Q.mL,Q.mH,Q.mG,Q.mD,Q.mE,Q.mI,Q.mF,Q.mB,Q.mC,Q.mJ,Q.mK,Q.mf,Q.mg,Q.mh,Q.md,Q.me])
q(P.F,[H.dq,H.fb,H.dA,P.fi,H.eQ,H.fm,H.fe,H.fz,P.ey,P.f5,P.ao,P.f2,P.fo,P.fj,P.bC,P.eE,P.eG])
r(P.ds,P.dZ)
q(P.ds,[H.cU,F.D])
q(H.cU,[H.cE,P.aY])
q(H.o,[H.af,H.b6,H.at,P.dT])
q(H.af,[H.dF,H.aa,P.fD,P.dR])
r(H.c3,H.bb)
q(P.J,[H.dv,H.cv,H.dD])
r(H.cG,H.be)
r(P.ec,P.du)
r(P.bg,P.ec)
r(H.de,P.bg)
q(H.cF,[H.ap,H.a4])
r(H.f4,P.fi)
q(H.fh,[H.ff,H.cD])
r(H.cP,H.dy)
q(H.cP,[H.e_,H.e1])
r(H.e0,H.e_)
r(H.dx,H.e0)
r(H.e2,H.e1)
r(H.au,H.e2)
q(H.dx,[H.dw,H.eX])
q(H.au,[H.eY,H.eZ,H.f_,H.f0,H.f1,H.dz,H.cn])
r(H.e9,H.fz)
r(P.e7,P.dm)
r(P.aw,P.fw)
q(P.d1,[P.bG,P.d2])
r(P.e4,P.aX)
q(P.e4,[P.al,P.dQ])
r(P.dM,P.cV)
q(P.fE,[P.dX,P.e5])
q(P.fy,[P.cw,P.dN])
r(P.lY,P.m5)
r(P.dV,P.dS)
r(P.d_,P.eh)
q(P.d_,[P.b_,P.ei])
r(P.ed,P.ei)
r(P.l4,P.l5)
r(P.e6,P.l4)
r(P.lT,P.e6)
q(P.eD,[P.h3,P.hP,P.iG])
r(P.eF,P.fg)
q(P.eF,[P.h5,P.h4,P.iH,P.le])
q(P.eB,[P.h6,P.fF])
r(P.m4,P.h6)
r(P.ld,P.hP)
q(P.ao,[P.dC,P.eL])
r(P.fx,P.ee)
r(V.l,V.fB)
q(V.l,[V.eH,M.bT,M.bU,M.bV,Z.b1,Z.bX,Z.b2,T.bq,G.bZ,G.c_,V.dk,Y.cq,Y.bE,S.aB,D.c4,X.bu,X.ca,X.cb,B.cc,Y.cd,A.ce,U.cf,K.cg,B.ch,S.ci,F.bv,F.cj,F.b9,N.ck,L.cl])
q(V.eH,[M.a2,Z.bp,Q.aP,V.br,G.bs,T.aQ,Y.aT,S.aU,V.aj,T.by,B.bz,O.bB,U.bD,X.b8,F.aL])
q(M.a2,[M.fs,M.fr])
q(F.a_,[M.eO,M.eV,M.eT,M.eW,M.eU,Z.ex,Z.dB,S.eK,O.eJ,F.fk,F.fl,F.eC])
q(Y.bE,[Y.cp,Y.co])
q(Y.iq,[Y.iC,Y.jP,Y.lm])
q(E.ix,[E.hh,E.iv,E.jY,E.ke,E.iN,E.hR])
s(H.cU,H.fn)
s(H.eg,P.n)
s(H.e_,P.n)
s(H.e0,H.di)
s(H.e1,P.n)
s(H.e2,H.di)
s(P.bG,P.fv)
s(P.d2,P.fJ)
s(P.dZ,P.n)
s(P.ec,P.fN)
s(P.eh,P.cQ)
s(P.ei,P.fO)
s(V.fB,V.fp)})()
var v={typeUniverse:{eC:new Map(),tR:{},eT:{},tPV:{},sEA:[]},mangledGlobalNames:{c:"int",y:"double",I:"num",f:"String",W:"bool",k:"Null",m:"List"},mangledNames:{},getTypeFromName:getGlobalFromName,metadata:[],types:["f*(m<@>*)","~()","k()","k(f*,e*)","k(f*,c*)","W*(aB*)","@()","y*(c*)","W*(c*)","k(aj*,c*,c*)","~(e*)","~(~())","~(i*)","k(@)","~(e,ak)","~(ag,f,c)","j<c*>*()","j<y*>*()","k(c*,aB*)","~(f*)","W*(Q*)","k(m<c*>*)","k(e*)","~(m<c*>*)","k(~(e*)*,aI*)","k(h<f*,e*>*)","~(e*,ak*)","f*(e*)","k(c*,cs*)","@(@)","j<c*>*(c*,c*,c*)","c*(c*)","@(@,f)","~(@)","j<y*>*(c*,c*,c*)","k(c*,b2*)","k(c*,b1*)","D<0^*>*(f*,0^*(h<f*,e*>*,i*)*)<e*>","0^*(f*,0^*(h<f*,e*>*,i*)*{req:W*})<e*>","~(D<l*>*,bF*)","k(c*,l*)","k(@,ak)","k(c*,aj*)","W*(aj*)","~(D<cs*>*)","a3<k>()","~(l*,f*)","~(c,@)","@(f)","c*(c*,c*,f*)","k(e,ak)","C<@>(@)","kY<a2<I*>*>*()","k(@,@)","a3<@>()","f*(Q*)","m<a_<I*>*>*()","f*(f*)","~([a3<~>?])","Q*()","k(bF*,U*)","W(e?)","~(e?,e?)","W*(m<c*>*,m<c*>*)","m<c*>*/*(aP*)","aX<m<c*>*>*(aQ*)","k(c*,a2<I*>*)","W*(J<I*>*)","~(f,@)","k(c*,b8*)","k(c*,aL*)","k(c*,b9*)","aL*(c*)","~(cT,@)","~(f,c)","~({seen:W*})","k(ar*)","a3<~>*()","k(m<e*>*)","h<f*,c*>*(h<@,@>*)","m<cm*>*()","h<f*,e*>*(c*)","W*(aU*)","c(c,e)","~(e*,ak*,aI*)","bd<1&>*(ag*,e*)","~(f[@])","c(c,c)","ag(@,@)","cl*(h<f*,e*>*,i*)","f*()","a3<ag*>*(aZ*)","ag*/*([aZ*])","aX<m<c*>*>*(aZ*)","k(~())","a2<I*>*(h<f*,e*>*,i*)","bT*(h<f*,e*>*,i*)","bU*(h<f*,e*>*,i*)","bV*(h<f*,e*>*,i*)","bp*(h<f*,e*>*,i*)","bX*(h<f*,e*>*,i*)","bq*(h<f*,e*>*,i*)","aP*(h<f*,e*>*,i*)","br*(h<f*,e*>*,i*)","bs*(h<f*,e*>*,i*)","bZ*(h<f*,e*>*,i*)","c_*(h<f*,e*>*,i*)","aQ*(h<f*,e*>*,i*)","aT*(h<f*,e*>*,i*)","cq*(h<f*,e*>*,i*)","cp*(h<f*,e*>*,i*)","co*(h<f*,e*>*,i*)","bE*(h<f*,e*>*,i*)","aU*(h<f*,e*>*,i*)","aj*(h<f*,e*>*,i*)","by*(h<f*,e*>*,i*)","bz*(h<f*,e*>*,i*)","bB*(h<f*,e*>*,i*)","bD*(h<f*,e*>*,i*)","e?(e?)","y*(I*)","c4*(h<f*,e*>*,i*)","bu*(h<f*,e*>*,i*)","ca*(h<f*,e*>*,i*)","cb*(h<f*,e*>*,i*)","cc*(h<f*,e*>*,i*)","cd*(h<f*,e*>*,i*)","ce*(h<f*,e*>*,i*)","cf*(h<f*,e*>*,i*)","cg*(h<f*,e*>*,i*)","ch*(h<f*,e*>*,i*)","ci*(h<f*,e*>*,i*)","bv*(h<f*,e*>*,i*)","cj*(h<f*,e*>*,i*)","ck*(h<f*,e*>*,i*)","bd<1&>*(f*,e*)"],interceptorsByTag:null,leafTags:null,arrayRti:typeof Symbol=="function"&&typeof Symbol()=="symbol"?Symbol("$ti"):"$ti"}
H.uT(v.typeUniverse,JSON.parse('{"bd":"aJ","hQ":"aJ","cZ":"aJ","f8":"aJ","ct":"aJ","aS":"aJ","dn":{"W":[]},"cM":{"k":[]},"aJ":{"aI":[],"bd":["1&"],"cZ":[]},"B":{"m":["1"],"o":["1"],"j":["1"]},"iB":{"B":["1"],"m":["1"],"o":["1"],"j":["1"]},"aG":{"J":["1"]},"c9":{"y":[],"I":[]},"dp":{"y":[],"c":[],"I":[]},"eP":{"y":[],"I":[]},"bt":{"f":[]},"bH":{"j":["2"]},"dd":{"J":["2"]},"c0":{"bH":["1","2"],"j":["2"],"j.E":"2"},"dO":{"c0":["1","2"],"bH":["1","2"],"o":["2"],"j":["2"],"j.E":"2"},"dJ":{"n":["2"],"m":["2"],"bH":["1","2"],"o":["2"],"j":["2"]},"b3":{"dJ":["1","2"],"n":["2"],"m":["2"],"bH":["1","2"],"o":["2"],"j":["2"],"n.E":"2","j.E":"2"},"c1":{"K":["3","4"],"h":["3","4"],"K.K":"3","K.V":"4"},"dq":{"F":[]},"fb":{"F":[]},"cE":{"n":["c"],"m":["c"],"o":["c"],"j":["c"],"n.E":"c"},"dA":{"F":[]},"o":{"j":["1"]},"af":{"o":["1"],"j":["1"]},"dF":{"af":["1"],"o":["1"],"j":["1"],"j.E":"1","af.E":"1"},"a9":{"J":["1"]},"bb":{"j":["2"],"j.E":"2"},"c3":{"bb":["1","2"],"o":["2"],"j":["2"],"j.E":"2"},"dv":{"J":["2"]},"aa":{"af":["2"],"o":["2"],"j":["2"],"j.E":"2","af.E":"2"},"ln":{"j":["1"],"j.E":"1"},"cv":{"J":["1"]},"be":{"j":["1"],"j.E":"1"},"cG":{"be":["1"],"o":["1"],"j":["1"],"j.E":"1"},"dD":{"J":["1"]},"b6":{"o":["1"],"j":["1"],"j.E":"1"},"dg":{"J":["1"]},"cU":{"n":["1"],"m":["1"],"o":["1"],"j":["1"]},"cS":{"cT":[]},"de":{"bg":["1","2"],"h":["1","2"]},"cF":{"h":["1","2"]},"ap":{"cF":["1","2"],"h":["1","2"]},"dL":{"j":["1"],"j.E":"1"},"a4":{"cF":["1","2"],"h":["1","2"]},"f4":{"F":[]},"eQ":{"F":[]},"fm":{"F":[]},"f6":{"a7":[]},"e3":{"ak":[]},"c2":{"aI":[]},"fh":{"aI":[]},"ff":{"aI":[]},"cD":{"aI":[]},"fe":{"F":[]},"aK":{"K":["1","2"],"h":["1","2"],"K.K":"1","K.V":"2"},"at":{"o":["1"],"j":["1"],"j.E":"1"},"dr":{"J":["1"]},"cP":{"as":["1"]},"dx":{"n":["y"],"as":["y"],"m":["y"],"o":["y"],"j":["y"]},"au":{"n":["c"],"as":["c"],"m":["c"],"o":["c"],"j":["c"]},"dw":{"n":["y"],"as":["y"],"m":["y"],"o":["y"],"j":["y"],"n.E":"y"},"eX":{"n":["y"],"as":["y"],"m":["y"],"o":["y"],"j":["y"],"n.E":"y"},"eY":{"au":[],"n":["c"],"as":["c"],"m":["c"],"o":["c"],"j":["c"],"n.E":"c"},"eZ":{"au":[],"n":["c"],"as":["c"],"m":["c"],"o":["c"],"j":["c"],"n.E":"c"},"f_":{"au":[],"n":["c"],"as":["c"],"m":["c"],"o":["c"],"j":["c"],"n.E":"c"},"f0":{"au":[],"n":["c"],"as":["c"],"m":["c"],"o":["c"],"j":["c"],"n.E":"c"},"f1":{"au":[],"n":["c"],"as":["c"],"m":["c"],"o":["c"],"j":["c"],"n.E":"c"},"dz":{"au":[],"n":["c"],"as":["c"],"m":["c"],"o":["c"],"j":["c"],"n.E":"c"},"cn":{"au":[],"n":["c"],"ag":[],"as":["c"],"m":["c"],"o":["c"],"j":["c"],"n.E":"c"},"e8":{"bF":[]},"fz":{"F":[]},"e9":{"F":[]},"aC":{"J":["1"]},"e7":{"j":["1"],"j.E":"1"},"ez":{"F":[]},"aw":{"fw":["1"]},"C":{"a3":["1"]},"bG":{"d1":["1"]},"d2":{"d1":["1"]},"al":{"aX":["1"]},"e4":{"aX":["1"]},"dQ":{"aX":["1"]},"dS":{"K":["1","2"],"h":["1","2"]},"dV":{"dS":["1","2"],"K":["1","2"],"h":["1","2"],"K.K":"1","K.V":"2"},"dT":{"o":["1"],"j":["1"],"j.E":"1"},"dU":{"J":["1"]},"b_":{"d_":["1"],"cQ":["1"],"o":["1"],"j":["1"]},"dY":{"J":["1"]},"aY":{"n":["1"],"m":["1"],"o":["1"],"j":["1"],"n.E":"1"},"dm":{"j":["1"]},"ds":{"n":["1"],"m":["1"],"o":["1"],"j":["1"]},"dt":{"K":["1","2"],"h":["1","2"]},"K":{"h":["1","2"]},"du":{"h":["1","2"]},"bg":{"h":["1","2"]},"d_":{"cQ":["1"],"o":["1"],"j":["1"]},"ed":{"d_":["1"],"cQ":["1"],"o":["1"],"j":["1"]},"fC":{"K":["f","@"],"h":["f","@"],"K.K":"f","K.V":"@"},"fD":{"af":["f"],"o":["f"],"j":["f"],"j.E":"f","af.E":"f"},"y":{"I":[]},"c":{"I":[]},"m":{"o":["1"],"j":["1"]},"kY":{"o":["1"],"j":["1"]},"ey":{"F":[]},"fi":{"F":[]},"f5":{"F":[]},"ao":{"F":[]},"dC":{"F":[]},"eL":{"F":[]},"f2":{"F":[]},"fo":{"F":[]},"fj":{"F":[]},"bC":{"F":[]},"eE":{"F":[]},"f7":{"F":[]},"dE":{"F":[]},"eG":{"F":[]},"dP":{"a7":[]},"aH":{"a7":[]},"dR":{"af":["1"],"o":["1"],"j":["1"],"j.E":"1","af.E":"1"},"fI":{"ak":[]},"ee":{"aZ":[]},"fG":{"aZ":[]},"fx":{"aZ":[]},"a2":{"l":[],"p":[]},"fs":{"a2":["c*"],"l":[],"p":[]},"fr":{"a2":["y*"],"l":[],"p":[]},"bT":{"l":[],"p":[]},"bU":{"l":[],"p":[]},"bV":{"l":[],"p":[]},"eO":{"a_":["y*"]},"eV":{"a_":["y*"]},"eT":{"a_":["y*"]},"eW":{"a_":["c*"]},"eU":{"a_":["c*"]},"bp":{"l":[],"p":[]},"b1":{"l":[],"p":[]},"bX":{"l":[],"p":[]},"b2":{"l":[],"p":[]},"ex":{"a_":["y*"]},"dB":{"a_":["1*"]},"bq":{"l":[],"p":[]},"aP":{"l":[],"p":[]},"br":{"l":[],"p":[]},"bs":{"l":[],"p":[]},"bZ":{"l":[],"p":[]},"c_":{"l":[],"p":[]},"dk":{"l":[],"p":[]},"l":{"p":[]},"eH":{"l":[],"p":[]},"aQ":{"l":[],"p":[]},"aT":{"l":[],"p":[]},"cq":{"l":[],"p":[]},"cp":{"l":[],"p":[]},"co":{"l":[],"p":[]},"bE":{"l":[],"p":[]},"aU":{"l":[],"p":[]},"aB":{"l":[],"p":[]},"eK":{"a_":["c*"]},"aj":{"l":[],"p":[]},"by":{"l":[],"p":[]},"bz":{"l":[],"p":[]},"bB":{"l":[],"p":[]},"eJ":{"a_":["y*"]},"bD":{"l":[],"p":[],"cs":[]},"c8":{"a7":[]},"dI":{"a7":[]},"dH":{"a7":[]},"aR":{"a7":[]},"c4":{"l":[],"p":[],"cs":[]},"bu":{"l":[],"p":[]},"b8":{"l":[],"p":[]},"ca":{"l":[],"p":[]},"cb":{"l":[],"p":[]},"cc":{"l":[],"p":[]},"cd":{"l":[],"p":[]},"ce":{"l":[],"p":[]},"cf":{"l":[],"p":[]},"cg":{"l":[],"p":[]},"ch":{"l":[],"p":[]},"ci":{"l":[],"p":[]},"bv":{"l":[],"p":[]},"aL":{"l":[],"p":[]},"cj":{"l":[],"p":[]},"b9":{"l":[],"p":[]},"ck":{"l":[],"p":[]},"cl":{"l":[],"p":[]},"dj":{"eI":[]},"cI":{"eI":[]},"dl":{"a7":[]},"D":{"n":["1*"],"m":["1*"],"o":["1*"],"j":["1*"],"n.E":"1*"},"fk":{"a_":["I*"]},"fl":{"a_":["I*"]},"eC":{"a_":["y*"]},"f3":{"a7":[]},"ag":{"m":["c"],"o":["c"],"j":["c"]}}'))
H.uS(v.typeUniverse,JSON.parse('{"di":1,"fn":1,"cU":1,"eg":2,"cP":1,"fg":2,"fJ":1,"fv":1,"dM":1,"cV":1,"e4":1,"dX":1,"fy":1,"cw":1,"fE":1,"e5":1,"fH":1,"dm":1,"ds":1,"dt":2,"fN":2,"du":2,"fO":1,"dZ":1,"ec":2,"eh":1,"ei":1,"eB":1,"eD":2,"eF":2,"e6":1}'))
var u={p:") does not match the number of morph targets (",c:"Accessor sparse indices element at index ",m:"Animation input accessor element at index ",g:"`null` encountered as the result from expression with type `Never`."}
var t=(function rtii(){var s=H.az
return{gF:s("de<cT,@>"),O:s("o<@>"),C:s("F"),b8:s("aI"),d:s("a3<@>"),bq:s("a3<~>"),N:s("a4<bF*,U*>"),j:s("j<@>"),s:s("B<f>"),gN:s("B<ag>"),b:s("B<@>"),Z:s("B<c>"),p:s("B<x*>"),gd:s("B<a_<I*>*>"),bd:s("B<eN*>"),a9:s("B<cK*>"),b2:s("B<J<I*>*>"),bH:s("B<cm*>"),f:s("B<m<c*>*>"),fh:s("B<h<f*,e*>*>"),M:s("B<e*>"),d6:s("B<fd*>"),i:s("B<f*>"),o:s("B<y*>"),V:s("B<c*>"),T:s("cM"),Q:s("aS"),aU:s("as<@>"),eo:s("aK<cT,@>"),I:s("h<@,@>"),gw:s("aa<Q*,f*>"),eB:s("au"),bm:s("cn"),P:s("k"),K:s("e"),ed:s("dB<I*>"),eq:s("D<b1*>"),az:s("D<b2*>"),E:s("D<b8*>"),B:s("D<b9*>"),u:s("D<aL*>"),b_:s("D<aB*>"),R:s("f"),gc:s("ag"),ak:s("ct"),go:s("aY<h<f*,e*>*>"),em:s("aY<f*>"),f8:s("bg<c5*,U*>"),n:s("aZ"),a_:s("aw<eI*>"),G:s("aw<ar*>"),eP:s("aw<c7*>"),as:s("aw<ag*>"),f1:s("bG<m<c*>*>"),U:s("C<k>"),eI:s("C<@>"),fJ:s("C<c>"),eD:s("C<eI*>"),g:s("C<ar*>"),dD:s("C<c7*>"),q:s("C<ag*>"),D:s("C<~>"),aH:s("dV<@,@>"),cy:s("fF<e*>"),y:s("W"),gR:s("y"),z:s("@"),bI:s("@(e)"),r:s("@(e,ak)"),S:s("c"),aD:s("x*"),hc:s("a2<c*>*"),W:s("a2<I*>*"),bj:s("bp*"),aA:s("b1*"),gW:s("b2*"),gP:s("bq*"),cT:s("aP*"),v:s("br*"),h2:s("bs*"),x:s("a7*"),af:s("Q*"),f9:s("U*"),al:s("c5*"),b1:s("aI*"),ec:s("aQ*"),Y:s("j<@>*"),ga:s("J<y*>*"),bF:s("J<c*>*"),cp:s("b8*"),aa:s("b9*"),J:s("aL*"),c:s("p*"),l:s("m<@>*"),b7:s("m<a_<I*>*>*"),an:s("m<cm*>*"),m:s("m<e*>*"),eG:s("m<f*>*"),fy:s("m<y*>*"),w:s("m<c*>*"),h:s("h<@,@>*"),gj:s("h<f*,a2<I*>*>*"),t:s("h<f*,e*>*"),fC:s("aT*"),eM:s("aU*"),ft:s("aB*"),A:s("0&*"),L:s("aj*"),_:s("e*"),ax:s("cs*"),b5:s("D<fp*>*"),c2:s("by*"),bn:s("bz*"),cn:s("kY<x*>*"),gz:s("kY<a2<I*>*>*"),dz:s("bA*"),aV:s("bB*"),X:s("f*"),ai:s("bD*"),f7:s("bF*"),a:s("ag*"),bv:s("cZ*"),F:s("y*"),e:s("c*"),eH:s("a3<k>?"),cK:s("e?"),di:s("I"),H:s("~"),d5:s("~(e)"),k:s("~(e,ak)")}})();(function constants(){var s=hunkHelpers.makeConstList
C.bI=J.cJ.prototype
C.d=J.B.prototype
C.bM=J.dn.prototype
C.c=J.dp.prototype
C.bN=J.cM.prototype
C.bO=J.c9.prototype
C.a=J.bt.prototype
C.bP=J.aS.prototype
C.dn=H.dw.prototype
C.j=H.cn.prototype
C.ar=J.f8.prototype
C.Q=J.ct.prototype
C.R=new V.x("MAT4",5126,!1)
C.B=new V.x("SCALAR",5126,!1)
C.aR=new V.x("VEC2",5121,!0)
C.aV=new V.x("VEC2",5123,!0)
C.aW=new V.x("VEC2",5126,!1)
C.T=new V.x("VEC3",5121,!0)
C.V=new V.x("VEC3",5123,!0)
C.l=new V.x("VEC3",5126,!1)
C.aZ=new V.x("VEC4",5121,!1)
C.E=new V.x("VEC4",5121,!0)
C.b_=new V.x("VEC4",5123,!1)
C.F=new V.x("VEC4",5123,!0)
C.u=new V.x("VEC4",5126,!1)
C.b0=new V.bW("AnimationInput")
C.b1=new V.bW("AnimationOutput")
C.b2=new V.bW("IBM")
C.b3=new V.bW("PrimitiveIndices")
C.Y=new V.bW("VertexAttribute")
C.b4=new V.bY("IBM")
C.b5=new V.bY("Image")
C.Z=new V.bY("IndexBuffer")
C.v=new V.bY("Other")
C.G=new V.bY("VertexBuffer")
C.e1=new P.h5()
C.b6=new P.h3()
C.b7=new P.h4()
C.a_=new H.dg(H.az("dg<0&*>"))
C.a0=new K.dl()
C.b8=new M.c8()
C.a1=function getTagFallback(o) {
  var s = Object.prototype.toString.call(o);
  return s.substring(8, s.length - 1);
}
C.b9=function() {
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
C.be=function(getTagFallback) {
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
C.ba=function(hooks) {
  if (typeof dartExperimentalFixupGetTag != "function") return hooks;
  hooks.getTag = dartExperimentalFixupGetTag(hooks.getTag);
}
C.bb=function(hooks) {
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
C.bd=function(hooks) {
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
C.bc=function(hooks) {
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
C.a2=function(hooks) { return hooks; }

C.a3=new P.iG()
C.bf=new P.f7()
C.a4=new Y.dH()
C.bg=new Y.dI()
C.a5=new P.ld()
C.H=new P.lF()
C.a6=new H.lX()
C.f=new P.lY()
C.bh=new P.fI()
C.J=new Y.c6(0,"Format.Unknown")
C.n=new Y.c6(1,"Format.RGB")
C.w=new Y.c6(2,"Format.RGBA")
C.a7=new Y.c6(3,"Format.Luminance")
C.a8=new Y.c6(4,"Format.LuminanceAlpha")
C.a9=new Y.aR("Wrong WebP header.")
C.bJ=new Y.aR("PNG header not found.")
C.bK=new Y.aR("Invalid JPEG marker segment length.")
C.o=new Y.aR("Wrong chunk length.")
C.bL=new Y.aR("Invalid start of file.")
C.bQ=new P.iH(null)
C.bR=H.a(s([0,0]),t.o)
C.aa=H.a(s([0,0,0]),t.o)
C.bS=H.a(s([16]),t.V)
C.bT=H.a(s([1,1]),t.o)
C.x=H.a(s([1,1,1]),t.o)
C.ab=H.a(s([1,1,1,1]),t.o)
C.ac=H.a(s([2]),t.V)
C.bU=H.a(s([255,216]),t.V)
C.bW=H.a(s(["sheenColorFactor","sheenColorTexture","sheenRoughnessFactor","sheenRoughnessTexture"]),t.i)
C.ad=H.a(s([0,0,32776,33792,1,10240,0,0]),t.V)
C.bX=H.a(s([137,80,78,71,13,10,26,10]),t.V)
C.bY=H.a(s(["clearcoatFactor","clearcoatTexture","clearcoatRoughnessFactor","clearcoatRoughnessTexture","clearcoatNormalTexture"]),t.i)
C.k=H.a(s([3]),t.V)
C.ae=H.a(s([33071,33648,10497]),t.V)
C.bZ=H.a(s([34962,34963]),t.V)
C.c_=H.a(s(["specularFactor","specularTexture","specularColorFactor","specularColorTexture"]),t.i)
C.K=H.a(s([4]),t.V)
C.aO=new V.x("VEC2",5120,!1)
C.aP=new V.x("VEC2",5120,!0)
C.aQ=new V.x("VEC2",5121,!1)
C.aS=new V.x("VEC2",5122,!1)
C.aT=new V.x("VEC2",5122,!0)
C.aU=new V.x("VEC2",5123,!1)
C.c0=H.a(s([C.aO,C.aP,C.aQ,C.aS,C.aT,C.aU]),t.p)
C.c1=H.a(s([5121,5123,5125]),t.V)
C.af=H.a(s(["image/jpeg","image/png"]),t.i)
C.c2=H.a(s(["transmissionFactor","transmissionTexture"]),t.i)
C.c3=H.a(s([82,73,70,70]),t.V)
C.c4=H.a(s([9728,9729]),t.V)
C.aI=new V.x("SCALAR",5121,!1)
C.aL=new V.x("SCALAR",5123,!1)
C.aN=new V.x("SCALAR",5125,!1)
C.ag=H.a(s([C.aI,C.aL,C.aN]),t.p)
C.c6=H.a(s(["camera","children","skin","matrix","mesh","rotation","scale","translation","weights","name"]),t.i)
C.c7=H.a(s([9728,9729,9984,9985,9986,9987]),t.V)
C.c8=H.a(s(["COLOR","JOINTS","TEXCOORD","WEIGHTS"]),t.i)
C.y=H.a(s([0,0,65490,45055,65535,34815,65534,18431]),t.V)
C.P=H.u("bD")
C.bi=new D.U(D.w9(),!1,!1)
C.dl=new H.a4([C.P,C.bi],t.N)
C.bx=new D.Q("EXT_texture_webp",C.dl,D.wa(),!1)
C.N=H.u("dk")
C.O=H.u("aj")
C.bj=new D.U(X.wo(),!1,!1)
C.bk=new D.U(X.wq(),!1,!1)
C.di=new H.a4([C.N,C.bj,C.O,C.bk],t.N)
C.bE=new D.Q("KHR_lights_punctual",C.di,null,!1)
C.h=H.u("aT")
C.bl=new D.U(B.wr(),!1,!1)
C.d9=new H.a4([C.h,C.bl],t.N)
C.bB=new D.Q("KHR_materials_clearcoat",C.d9,null,!1)
C.bm=new D.U(Y.ws(),!1,!1)
C.da=new H.a4([C.h,C.bm],t.N)
C.bF=new D.Q("KHR_materials_ior",C.da,null,!1)
C.bt=new D.U(A.wt(),!0,!1)
C.db=new H.a4([C.h,C.bt],t.N)
C.bz=new D.Q("KHR_materials_pbrSpecularGlossiness",C.db,null,!1)
C.bn=new D.U(U.wu(),!1,!1)
C.dc=new H.a4([C.h,C.bn],t.N)
C.bw=new D.Q("KHR_materials_sheen",C.dc,null,!1)
C.bo=new D.U(K.wv(),!1,!1)
C.dd=new H.a4([C.h,C.bo],t.N)
C.bD=new D.Q("KHR_materials_specular",C.dd,null,!1)
C.bp=new D.U(B.ww(),!1,!1)
C.de=new H.a4([C.h,C.bp],t.N)
C.bC=new D.Q("KHR_materials_transmission",C.de,null,!1)
C.bu=new D.U(S.wx(),!0,!1)
C.df=new H.a4([C.h,C.bu],t.N)
C.bv=new D.Q("KHR_materials_unlit",C.df,null,!1)
C.av=H.u("aB")
C.bq=new D.U(F.tO(),!1,!1)
C.bs=new D.U(F.tP(),!1,!0)
C.dh=new H.a4([C.N,C.bq,C.av,C.bs],t.N)
C.bA=new D.Q("KHR_materials_variants",C.dh,null,!1)
C.br=new D.U(N.wy(),!1,!1)
C.dg=new H.a4([C.h,C.br],t.N)
C.bG=new D.Q("KHR_materials_volume",C.dg,null,!1)
C.cv=H.a(s([]),H.az("B<bF*>"))
C.dm=new H.ap(0,{},C.cv,H.az("ap<bF*,U*>"))
C.bH=new D.Q("KHR_mesh_quantization",C.dm,U.wz(),!0)
C.aB=H.u("bE")
C.ax=H.u("co")
C.ay=H.u("cp")
C.I=new D.U(L.wA(),!1,!1)
C.dk=new H.a4([C.aB,C.I,C.ax,C.I,C.ay,C.I],t.N)
C.by=new D.Q("KHR_texture_transform",C.dk,null,!1)
C.ai=H.a(s([C.bx,C.bE,C.bB,C.bF,C.bz,C.bw,C.bD,C.bC,C.bv,C.bA,C.bG,C.bH,C.by]),H.az("B<Q*>"))
C.c9=H.a(s(["color","intensity","spot","type","range","name"]),t.i)
C.ca=H.a(s(["buffer","byteOffset","byteLength","byteStride","target","name"]),t.i)
C.aj=H.a(s([0,0,26624,1023,65534,2047,65534,2047]),t.V)
C.cb=H.a(s(["LINEAR","STEP","CUBICSPLINE"]),t.i)
C.cd=H.a(s(["OPAQUE","MASK","BLEND"]),t.i)
C.ce=H.a(s(["pbrMetallicRoughness","normalTexture","occlusionTexture","emissiveTexture","emissiveFactor","alphaMode","alphaCutoff","doubleSided","name"]),t.i)
C.cf=H.a(s([5120,5121,5122,5123,5125,5126]),t.V)
C.cg=H.a(s(["inverseBindMatrices","skeleton","joints","name"]),t.i)
C.S=new V.x("VEC3",5120,!1)
C.C=new V.x("VEC3",5120,!0)
C.U=new V.x("VEC3",5122,!1)
C.D=new V.x("VEC3",5122,!0)
C.ch=H.a(s([C.S,C.C,C.U,C.D]),t.p)
C.ci=H.a(s(["data-uri","buffer-view","glb","external"]),t.i)
C.cj=H.a(s(["POINTS","LINES","LINE_LOOP","LINE_STRIP","TRIANGLES","TRIANGLE_STRIP","TRIANGLE_FAN"]),t.i)
C.ck=H.a(s(["bufferView","byteOffset","componentType"]),t.i)
C.L=H.a(s([C.C,C.D]),t.p)
C.cl=H.a(s(["aspectRatio","yfov","zfar","znear"]),t.i)
C.cm=H.a(s(["copyright","generator","version","minVersion"]),t.i)
C.cn=H.a(s(["bufferView","byteOffset"]),t.i)
C.co=H.a(s(["bufferView","mimeType","uri","name"]),t.i)
C.cp=H.a(s(["channels","samplers","name"]),t.i)
C.cq=H.a(s(["baseColorFactor","baseColorTexture","metallicFactor","roughnessFactor","metallicRoughnessTexture"]),t.i)
C.cr=H.a(s(["count","indices","values"]),t.i)
C.cs=H.a(s(["diffuseFactor","diffuseTexture","specularFactor","glossinessFactor","specularGlossinessTexture"]),t.i)
C.ct=H.a(s(["directional","point","spot"]),t.i)
C.ak=H.a(s([]),t.b)
C.cu=H.a(s([]),t.i)
C.cx=H.a(s(["extensions","extras"]),t.i)
C.cy=H.a(s([0,0,32722,12287,65534,34815,65534,18431]),t.V)
C.cA=H.a(s(["index","texCoord"]),t.i)
C.cB=H.a(s(["index","texCoord","scale"]),t.i)
C.cC=H.a(s(["index","texCoord","strength"]),t.i)
C.cD=H.a(s(["innerConeAngle","outerConeAngle"]),t.i)
C.cE=H.a(s(["input","interpolation","output"]),t.i)
C.cF=H.a(s(["ior"]),t.i)
C.cG=H.a(s(["attributes","indices","material","mode","targets"]),t.i)
C.cH=H.a(s(["bufferView","byteOffset","componentType","count","type","normalized","max","min","sparse","name"]),t.i)
C.cI=H.a(s(["light"]),t.i)
C.cJ=H.a(s(["lights"]),t.i)
C.cK=H.a(s(["mappings"]),t.i)
C.cL=H.a(s(["name"]),t.i)
C.cM=H.a(s(["node","path"]),t.i)
C.cN=H.a(s(["nodes","name"]),t.i)
C.cO=H.a(s([null,"linear","srgb","custom"]),t.i)
C.cP=H.a(s([null,"srgb","custom"]),t.i)
C.al=H.a(s([0,0,24576,1023,65534,34815,65534,18431]),t.V)
C.cQ=H.a(s(["image/webp"]),t.i)
C.cR=H.a(s(["offset","rotation","scale","texCoord"]),t.i)
C.am=H.a(s(["orthographic","perspective"]),t.i)
C.cS=H.a(s(["primitives","weights","name"]),t.i)
C.b=new E.bA(0,"Severity.Error")
C.e=new E.bA(1,"Severity.Warning")
C.i=new E.bA(2,"Severity.Information")
C.dq=new E.bA(3,"Severity.Hint")
C.cT=H.a(s([C.b,C.e,C.i,C.dq]),H.az("B<bA*>"))
C.cU=H.a(s([0,0,32754,11263,65534,34815,65534,18431]),t.V)
C.cV=H.a(s(["magFilter","minFilter","wrapS","wrapT","name"]),t.i)
C.cW=H.a(s([null,"rgb","rgba","luminance","luminance-alpha"]),t.i)
C.an=H.a(s([0,0,65490,12287,65535,34815,65534,18431]),t.V)
C.cX=H.a(s(["sampler","source","name"]),t.i)
C.cY=H.a(s(["source"]),t.i)
C.aX=new V.x("VEC3",5121,!1)
C.aY=new V.x("VEC3",5123,!1)
C.cZ=H.a(s([C.S,C.C,C.aX,C.T,C.U,C.D,C.aY,C.V]),t.p)
C.d_=H.a(s(["target","sampler"]),t.i)
C.ao=H.a(s(["translation","rotation","scale","weights"]),t.i)
C.d0=H.a(s(["type","orthographic","perspective","name"]),t.i)
C.d1=H.a(s(["uri","byteLength","name"]),t.i)
C.d2=H.a(s(["variants"]),t.i)
C.d3=H.a(s(["variants","material","name"]),t.i)
C.d4=H.a(s(["attenuationColor","attenuationDistance","thicknessFactor","thicknessTexture"]),t.i)
C.d5=H.a(s(["xmag","ymag","zfar","znear"]),t.i)
C.d6=H.a(s(["extensionsUsed","extensionsRequired","accessors","animations","asset","buffers","bufferViews","cameras","images","materials","meshes","nodes","samplers","scene","scenes","skins","textures"]),t.i)
C.W=new V.x("VEC4",5120,!0)
C.X=new V.x("VEC4",5122,!0)
C.d7=H.a(s([C.W,C.X]),t.p)
C.ah=H.a(s([C.l]),t.p)
C.bV=H.a(s([C.u,C.E,C.W,C.F,C.X]),t.p)
C.aJ=new V.x("SCALAR",5121,!0)
C.aH=new V.x("SCALAR",5120,!0)
C.aM=new V.x("SCALAR",5123,!0)
C.aK=new V.x("SCALAR",5122,!0)
C.cz=H.a(s([C.B,C.aJ,C.aH,C.aM,C.aK]),t.p)
C.d8=new H.ap(4,{translation:C.ah,rotation:C.bV,scale:C.ah,weights:C.cz},C.ao,H.az("ap<f*,m<x*>*>"))
C.c5=H.a(s(["SCALAR","VEC2","VEC3","VEC4","MAT2","MAT3","MAT4"]),t.i)
C.m=new H.ap(7,{SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},C.c5,H.az("ap<f*,c*>"))
C.ap=new H.a4([5120,"BYTE",5121,"UNSIGNED_BYTE",5122,"SHORT",5123,"UNSIGNED_SHORT",5124,"INT",5125,"UNSIGNED_INT",5126,"FLOAT",35664,"FLOAT_VEC2",35665,"FLOAT_VEC3",35666,"FLOAT_VEC4",35667,"INT_VEC2",35668,"INT_VEC3",35669,"INT_VEC4",35670,"BOOL",35671,"BOOL_VEC2",35672,"BOOL_VEC3",35673,"BOOL_VEC4",35674,"FLOAT_MAT2",35675,"FLOAT_MAT3",35676,"FLOAT_MAT4",35678,"SAMPLER_2D"],H.az("a4<c*,f*>"))
C.cw=H.a(s([]),H.az("B<cT*>"))
C.aq=new H.ap(0,{},C.cw,H.az("ap<cT*,@>"))
C.cc=H.a(s(["KHR","EXT","ADOBE","AGI","AGT","ALCM","ALI","AMZN","ANIMECH","ASOBO","AVR","BLENDER","CAPTURE","CESIUM","CITRUS","CLO","CVTOOLS","EPIC","FB","FOXIT","GOOGLE","GRIFFEL","KDAB","LLQ","MAXAR","MESHOPT","MOZ","MPEG","MSFT","NV","OFT","OWLII","PANDA3D","POLUTROPON","PTC","S8S","SEIN","SI","SKFB","SKYLINE","SPECTRUM","TRYON","UX3D","VRMC","WEB3D"]),t.i)
C.dj=new H.ap(45,{KHR:null,EXT:null,ADOBE:null,AGI:null,AGT:null,ALCM:null,ALI:null,AMZN:null,ANIMECH:null,ASOBO:null,AVR:null,BLENDER:null,CAPTURE:null,CESIUM:null,CITRUS:null,CLO:null,CVTOOLS:null,EPIC:null,FB:null,FOXIT:null,GOOGLE:null,GRIFFEL:null,KDAB:null,LLQ:null,MAXAR:null,MESHOPT:null,MOZ:null,MPEG:null,MSFT:null,NV:null,OFT:null,OWLII:null,PANDA3D:null,POLUTROPON:null,PTC:null,S8S:null,SEIN:null,SI:null,SKFB:null,SKYLINE:null,SPECTRUM:null,TRYON:null,UX3D:null,VRMC:null,WEB3D:null},C.cc,H.az("ap<f*,k>"))
C.dp=new P.ed(C.dj,H.az("ed<f*>"))
C.dr=new H.cS("call")
C.ds=H.u("bU")
C.dt=H.u("bV")
C.du=H.u("bT")
C.M=H.u("a2<I>")
C.dv=H.u("bX")
C.dw=H.u("b1")
C.dx=H.u("b2")
C.as=H.u("bp")
C.dy=H.u("bq")
C.at=H.u("br")
C.dz=H.u("aP")
C.dA=H.u("bZ")
C.dB=H.u("c_")
C.dC=H.u("bs")
C.dD=H.u("ce")
C.dE=H.u("c4")
C.au=H.u("aQ")
C.dF=H.u("bu")
C.dG=H.u("ca")
C.dH=H.u("b8")
C.dI=H.u("cb")
C.dJ=H.u("cc")
C.dK=H.u("cd")
C.dL=H.u("cf")
C.dM=H.u("cg")
C.dN=H.u("ch")
C.dO=H.u("ci")
C.dP=H.u("bv")
C.dQ=H.u("b9")
C.dR=H.u("aL")
C.dS=H.u("ck")
C.dT=H.u("cl")
C.aw=H.u("aU")
C.dU=H.u("cq")
C.dV=H.u("by")
C.az=H.u("bz")
C.aA=H.u("bB")
C.dW=H.u("cj")
C.dX=new P.le(!1)
C.p=new Y.dK(0,"_ColorPrimaries.Unknown")
C.q=new Y.dK(1,"_ColorPrimaries.sRGB")
C.z=new Y.dK(2,"_ColorPrimaries.Custom")
C.r=new Y.cW(0,"_ColorTransfer.Unknown")
C.dY=new Y.cW(1,"_ColorTransfer.Linear")
C.t=new Y.cW(2,"_ColorTransfer.sRGB")
C.A=new Y.cW(3,"_ColorTransfer.Custom")
C.aC=new Y.dW("_ImageCodec.JPEG")
C.aD=new Y.dW("_ImageCodec.PNG")
C.aE=new Y.dW("_ImageCodec.WebP")
C.dZ=new P.cY(null,2)
C.aF=new N.d0(0,"_Storage.DataUri")
C.e_=new N.d0(1,"_Storage.BufferView")
C.e0=new N.d0(2,"_Storage.GLB")
C.aG=new N.d0(3,"_Storage.External")})();(function staticFields(){$.oS=null
$.b4=0
$.o1=null
$.o0=null
$.ps=null
$.pk=null
$.pB=null
$.mn=null
$.mz=null
$.np=null
$.d6=null
$.eo=null
$.ep=null
$.nh=!1
$.z=C.f
$.cx=H.a([],H.az("B<e>"))
$.oj=null
$.oh=null
$.oi=null})();(function lazyInitializers(){var s=hunkHelpers.lazyFinal,r=hunkHelpers.lazy,q=hunkHelpers.lazyOld
s($,"wW","nu",function(){return H.wg("_$dart_dartClosure")})
s($,"A0","rW",function(){return C.f.bX(new H.mN())})
s($,"zp","rE",function(){return H.bf(H.l7({
toString:function(){return"$receiver$"}}))})
s($,"zq","rF",function(){return H.bf(H.l7({$method$:null,
toString:function(){return"$receiver$"}}))})
s($,"zr","rG",function(){return H.bf(H.l7(null))})
s($,"zs","rH",function(){return H.bf(function(){var $argumentsExpr$="$arguments$"
try{null.$method$($argumentsExpr$)}catch(p){return p.message}}())})
s($,"zv","rK",function(){return H.bf(H.l7(void 0))})
s($,"zw","rL",function(){return H.bf(function(){var $argumentsExpr$="$arguments$"
try{(void 0).$method$($argumentsExpr$)}catch(p){return p.message}}())})
s($,"zu","rJ",function(){return H.bf(H.oD(null))})
s($,"zt","rI",function(){return H.bf(function(){try{null.$method$}catch(p){return p.message}}())})
s($,"zy","rN",function(){return H.bf(H.oD(void 0))})
s($,"zx","rM",function(){return H.bf(function(){try{(void 0).$method$}catch(p){return p.message}}())})
s($,"zB","nO",function(){return P.uz()})
s($,"xt","fU",function(){return t.U.a($.rW())})
s($,"zz","rO",function(){return new P.lg().$0()})
s($,"zA","rP",function(){return new P.lf().$0()})
s($,"zD","nP",function(){return H.ua(H.vk(H.a([-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-1,-2,-2,-2,-2,-2,62,-2,62,-2,63,52,53,54,55,56,57,58,59,60,61,-2,-2,-2,-1,-2,-2,-2,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-2,-2,-2,-2,63,-2,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,-2,-2,-2,-2,-2],t.Z)))})
r($,"zC","rQ",function(){return H.ub(0)})
s($,"zY","rU",function(){return P.vj()})
q($,"wU","bl",function(){return P.ox("^([0-9]+)\\.([0-9]+)$")})
q($,"wV","pI",function(){return P.ox("^([A-Z0-9]+)_[A-Za-z0-9_]+$")})
q($,"xi","q_",function(){return E.E("BUFFER_EMBEDDED_BYTELENGTH_MISMATCH",new E.hE(),C.b)})
q($,"xj","q0",function(){return E.E("BUFFER_EXTERNAL_BYTELENGTH_MISMATCH",new E.hF(),C.b)})
q($,"xk","q1",function(){return E.E("BUFFER_GLB_CHUNK_TOO_BIG",new E.hG(),C.e)})
q($,"xb","ny",function(){return E.E("ACCESSOR_MIN_MISMATCH",new E.hx(),C.b)})
q($,"xa","nx",function(){return E.E("ACCESSOR_MAX_MISMATCH",new E.hw(),C.b)})
q($,"x0","nw",function(){return E.E("ACCESSOR_ELEMENT_OUT_OF_MIN_BOUND",new E.hm(),C.b)})
q($,"x_","nv",function(){return E.E("ACCESSOR_ELEMENT_OUT_OF_MAX_BOUND",new E.hl(),C.b)})
q($,"xf","nz",function(){return E.E("ACCESSOR_VECTOR3_NON_UNIT",new E.hB(),C.b)})
q($,"x6","pR",function(){return E.E("ACCESSOR_INVALID_SIGN",new E.hs(),C.b)})
q($,"wZ","pL",function(){return E.E("ACCESSOR_ANIMATION_SAMPLER_OUTPUT_NON_NORMALIZED_QUATERNION",new E.hk(),C.b)})
q($,"xc","pV",function(){return E.E("ACCESSOR_NON_CLAMPED",new E.hy(),C.b)})
q($,"x4","pP",function(){return E.E("ACCESSOR_INVALID_FLOAT",new E.hq(),C.b)})
q($,"x1","pM",function(){return E.E("ACCESSOR_INDEX_OOB",new E.hn(),C.b)})
q($,"x3","pO",function(){return E.E("ACCESSOR_INDEX_TRIANGLE_DEGENERATE",new E.hp(),C.i)})
q($,"x2","pN",function(){return E.E("ACCESSOR_INDEX_PRIMITIVE_RESTART",new E.ho(),C.b)})
q($,"wX","pJ",function(){return E.E("ACCESSOR_ANIMATION_INPUT_NEGATIVE",new E.hi(),C.b)})
q($,"wY","pK",function(){return E.E("ACCESSOR_ANIMATION_INPUT_NON_INCREASING",new E.hj(),C.b)})
q($,"xe","pX",function(){return E.E("ACCESSOR_SPARSE_INDICES_NON_INCREASING",new E.hA(),C.b)})
q($,"xd","pW",function(){return E.E("ACCESSOR_SPARSE_INDEX_OOB",new E.hz(),C.b)})
q($,"x5","pQ",function(){return E.E("ACCESSOR_INVALID_IBM",new E.hr(),C.b)})
q($,"xm","q2",function(){return E.E("IMAGE_DATA_INVALID",new E.hI(),C.b)})
q($,"xo","q4",function(){return E.E("IMAGE_MIME_TYPE_INVALID",new E.hK(),C.b)})
q($,"xr","q7",function(){return E.E("IMAGE_UNEXPECTED_EOS",new E.hN(),C.b)})
q($,"xs","q8",function(){return E.E("IMAGE_UNRECOGNIZED_FORMAT",new E.hO(),C.e)})
q($,"xp","q5",function(){return E.E("IMAGE_NON_ENABLED_MIME_TYPE",new E.hL(),C.b)})
q($,"xq","q6",function(){return E.E("IMAGE_NPOT_DIMENSIONS",new E.hM(),C.i)})
q($,"xn","q3",function(){return E.E("IMAGE_FEATURES_UNSUPPORTED",new E.hJ(),C.e)})
q($,"xl","nA",function(){return E.E("DATA_URI_GLB",new E.hH(),C.i)})
q($,"x8","pT",function(){return E.E("ACCESSOR_JOINTS_INDEX_OOB",new E.hu(),C.b)})
q($,"x7","pS",function(){return E.E("ACCESSOR_JOINTS_INDEX_DUPLICATE",new E.ht(),C.b)})
q($,"xg","pY",function(){return E.E("ACCESSOR_WEIGHTS_NEGATIVE",new E.hC(),C.b)})
q($,"xh","pZ",function(){return E.E("ACCESSOR_WEIGHTS_NON_NORMALIZED",new E.hD(),C.b)})
q($,"x9","pU",function(){return E.E("ACCESSOR_JOINTS_USED_ZERO_WEIGHT",new E.hv(),C.e)})
q($,"xI","mR",function(){return new E.iv(C.b,"IO_ERROR",new E.iw())})
q($,"yr","nJ",function(){return E.ai("ARRAY_LENGTH_NOT_IN_LIST",new E.k_(),C.b)})
q($,"ys","ev",function(){return E.ai("ARRAY_TYPE_MISMATCH",new E.k0(),C.b)})
q($,"yq","nI",function(){return E.ai("DUPLICATE_ELEMENTS",new E.jZ(),C.b)})
q($,"yu","fW",function(){return E.ai("INVALID_INDEX",new E.k2(),C.b)})
q($,"yv","fX",function(){return E.ai("INVALID_JSON",new E.k3(),C.b)})
q($,"yw","qW",function(){return E.ai("INVALID_URI",new E.k4(),C.b)})
q($,"yt","bS",function(){return E.ai("EMPTY_ENTITY",new E.k1(),C.b)})
q($,"yx","nK",function(){return E.ai("ONE_OF_MISMATCH",new E.k5(),C.b)})
q($,"yy","qX",function(){return E.ai("PATTERN_MISMATCH",new E.k6(),C.b)})
q($,"yz","a1",function(){return E.ai("TYPE_MISMATCH",new E.k7(),C.b)})
q($,"yE","nL",function(){return E.ai("VALUE_NOT_IN_LIST",new E.kc(),C.e)})
q($,"yF","mS",function(){return E.ai("VALUE_NOT_IN_RANGE",new E.kd(),C.b)})
q($,"yD","qZ",function(){return E.ai("VALUE_MULTIPLE_OF",new E.kb(),C.b)})
q($,"yA","bm",function(){return E.ai("UNDEFINED_PROPERTY",new E.k8(),C.b)})
q($,"yB","qY",function(){return E.ai("UNEXPECTED_PROPERTY",new E.k9(),C.e)})
q($,"yC","cC",function(){return E.ai("UNSATISFIED_DEPENDENCY",new E.ka(),C.b)})
q($,"zk","rA",function(){return E.v("UNKNOWN_ASSET_MAJOR_VERSION",new E.kU(),C.b)})
q($,"zl","rB",function(){return E.v("UNKNOWN_ASSET_MINOR_VERSION",new E.kV(),C.e)})
q($,"z5","rl",function(){return E.v("ASSET_MIN_VERSION_GREATER_THAN_VERSION",new E.kF(),C.e)})
q($,"yU","ra",function(){return E.v("INVALID_GL_VALUE",new E.kt(),C.b)})
q($,"yS","r8",function(){return E.v("INTEGER_WRITTEN_AS_FLOAT",new E.kr(),C.e)})
q($,"yH","r0",function(){return E.v("ACCESSOR_NORMALIZED_INVALID",new E.kg(),C.b)})
q($,"yI","r1",function(){return E.v("ACCESSOR_OFFSET_ALIGNMENT",new E.kh(),C.b)})
q($,"yG","r_",function(){return E.v("ACCESSOR_MATRIX_ALIGNMENT",new E.kf(),C.b)})
q($,"yJ","r2",function(){return E.v("ACCESSOR_SPARSE_COUNT_OUT_OF_RANGE",new E.ki(),C.b)})
q($,"yK","r3",function(){return E.v("ANIMATION_CHANNEL_TARGET_NODE_SKIN",new E.kj(),C.e)})
q($,"yL","r4",function(){return E.v("BUFFER_DATA_URI_MIME_TYPE_INVALID",new E.kk(),C.b)})
q($,"yN","r5",function(){return E.v("BUFFER_VIEW_TOO_BIG_BYTE_STRIDE",new E.km(),C.b)})
q($,"yM","mT",function(){return E.v("BUFFER_VIEW_INVALID_BYTE_STRIDE",new E.kl(),C.b)})
q($,"yO","r6",function(){return E.v("CAMERA_XMAG_YMAG_ZERO",new E.kn(),C.e)})
q($,"yP","r7",function(){return E.v("CAMERA_YFOV_GEQUAL_PI",new E.ko(),C.e)})
q($,"yQ","nM",function(){return E.v("CAMERA_ZFAR_LEQUAL_ZNEAR",new E.kp(),C.b)})
q($,"yW","rc",function(){return E.v("MATERIAL_ALPHA_CUTOFF_INVALID_MODE",new E.kv(),C.e)})
q($,"yZ","mU",function(){return E.v("MESH_PRIMITIVE_INVALID_ATTRIBUTE",new E.ky(),C.b)})
q($,"z4","rk",function(){return E.v("MESH_PRIMITIVES_UNEQUAL_TARGETS_COUNT",new E.kE(),C.b)})
q($,"z3","rj",function(){return E.v("MESH_PRIMITIVES_UNEQUAL_JOINTS_COUNT",new E.kD(),C.e)})
q($,"z0","rg",function(){return E.v("MESH_PRIMITIVE_NO_POSITION",new E.kA(),C.e)})
q($,"yY","re",function(){return E.v("MESH_PRIMITIVE_INDEXED_SEMANTIC_CONTINUITY",new E.kx(),C.b)})
q($,"z2","ri",function(){return E.v("MESH_PRIMITIVE_TANGENT_WITHOUT_NORMAL",new E.kC(),C.e)})
q($,"z_","rf",function(){return E.v("MESH_PRIMITIVE_JOINTS_WEIGHTS_MISMATCH",new E.kz(),C.b)})
q($,"z1","rh",function(){return E.v("MESH_PRIMITIVE_TANGENT_POINTS",new E.kB(),C.e)})
q($,"yX","rd",function(){return E.v("MESH_INVALID_WEIGHTS_COUNT",new E.kw(),C.b)})
q($,"z9","rp",function(){return E.v("NODE_MATRIX_TRS",new E.kJ(),C.b)})
q($,"z7","rn",function(){return E.v("NODE_MATRIX_DEFAULT",new E.kH(),C.i)})
q($,"za","rq",function(){return E.v("NODE_MATRIX_NON_TRS",new E.kK(),C.b)})
q($,"zh","rx",function(){return E.v("ROTATION_NON_UNIT",new E.kR(),C.b)})
q($,"zn","rD",function(){return E.v("UNUSED_EXTENSION_REQUIRED",new E.kX(),C.b)})
q($,"zg","rw",function(){return E.v("NON_REQUIRED_EXTENSION",new E.kQ(),C.b)})
q($,"zm","rC",function(){return E.v("UNRESERVED_EXTENSION_PREFIX",new E.kW(),C.e)})
q($,"yT","r9",function(){return E.v("INVALID_EXTENSION_NAME_FORMAT",new E.ks(),C.e)})
q($,"z8","ro",function(){return E.v("NODE_EMPTY",new E.kI(),C.i)})
q($,"zd","rt",function(){return E.v("NODE_SKINNED_MESH_NON_ROOT",new E.kN(),C.e)})
q($,"zc","rs",function(){return E.v("NODE_SKINNED_MESH_LOCAL_TRANSFORMS",new E.kM(),C.e)})
q($,"zb","rr",function(){return E.v("NODE_SKIN_NO_SCENE",new E.kL(),C.b)})
q($,"zi","ry",function(){return E.v("SKIN_NO_COMMON_ROOT",new E.kS(),C.b)})
q($,"zj","rz",function(){return E.v("SKIN_SKELETON_INVALID",new E.kT(),C.b)})
q($,"zf","rv",function(){return E.v("NON_RELATIVE_URI",new E.kP(),C.e)})
q($,"z6","rm",function(){return E.v("MULTIPLE_EXTENSIONS",new E.kG(),C.e)})
q($,"ze","ru",function(){return E.v("NON_OBJECT_EXTRAS",new E.kO(),C.i)})
q($,"yR","nN",function(){return E.v("EXTRA_PROPERTY",new E.kq(),C.i)})
q($,"yV","rb",function(){return E.v("KHR_LIGHTS_PUNCTUAL_LIGHT_SPOT_ANGLES",new E.ku(),C.b)})
q($,"xL","qo",function(){return E.w("ACCESSOR_TOTAL_OFFSET_ALIGNMENT",new E.iQ(),C.b)})
q($,"xJ","qn",function(){return E.w("ACCESSOR_SMALL_BYTESTRIDE",new E.iO(),C.b)})
q($,"xK","nB",function(){return E.w("ACCESSOR_TOO_LONG",new E.iP(),C.b)})
q($,"xM","qp",function(){return E.w("ACCESSOR_USAGE_OVERRIDE",new E.iR(),C.b)})
q($,"xP","qs",function(){return E.w("ANIMATION_DUPLICATE_TARGETS",new E.iU(),C.b)})
q($,"xN","qq",function(){return E.w("ANIMATION_CHANNEL_TARGET_NODE_MATRIX",new E.iS(),C.b)})
q($,"xO","qr",function(){return E.w("ANIMATION_CHANNEL_TARGET_NODE_WEIGHTS_NO_MORPHS",new E.iT(),C.b)})
q($,"xS","qv",function(){return E.w("ANIMATION_SAMPLER_INPUT_ACCESSOR_WITHOUT_BOUNDS",new E.iX(),C.b)})
q($,"xQ","qt",function(){return E.w("ANIMATION_SAMPLER_INPUT_ACCESSOR_INVALID_FORMAT",new E.iV(),C.b)})
q($,"xU","qx",function(){return E.w("ANIMATION_SAMPLER_OUTPUT_ACCESSOR_INVALID_FORMAT",new E.iZ(),C.b)})
q($,"xR","qu",function(){return E.w("ANIMATION_SAMPLER_INPUT_ACCESSOR_TOO_FEW_ELEMENTS",new E.iW(),C.b)})
q($,"xT","qw",function(){return E.w("ANIMATION_SAMPLER_OUTPUT_ACCESSOR_INVALID_COUNT",new E.iY(),C.b)})
q($,"xV","qy",function(){return E.w("BUFFER_MISSING_GLB_DATA",new E.j_(),C.b)})
q($,"xX","nC",function(){return E.w("BUFFER_VIEW_TOO_LONG",new E.j1(),C.b)})
q($,"xW","qz",function(){return E.w("BUFFER_VIEW_TARGET_OVERRIDE",new E.j0(),C.b)})
q($,"xY","qA",function(){return E.w("IMAGE_BUFFER_VIEW_WITH_BYTESTRIDE",new E.j2(),C.b)})
q($,"xZ","qB",function(){return E.w("INVALID_IBM_ACCESSOR_COUNT",new E.j3(),C.b)})
q($,"y2","nE",function(){return E.w("MESH_PRIMITIVE_ATTRIBUTES_ACCESSOR_INVALID_FORMAT",new E.j7(),C.b)})
q($,"y3","qE",function(){return E.w("MESH_PRIMITIVE_ATTRIBUTES_ACCESSOR_UNSIGNED_INT",new E.j8(),C.b)})
q($,"y9","nF",function(){return E.w("MESH_PRIMITIVE_POSITION_ACCESSOR_WITHOUT_BOUNDS",new E.je(),C.b)})
q($,"y1","qD",function(){return E.w("MESH_PRIMITIVE_ACCESSOR_WITHOUT_BYTESTRIDE",new E.j6(),C.b)})
q($,"y0","nD",function(){return E.w("MESH_PRIMITIVE_ACCESSOR_UNALIGNED",new E.j5(),C.b)})
q($,"y6","qH",function(){return E.w("MESH_PRIMITIVE_INDICES_ACCESSOR_WITH_BYTESTRIDE",new E.jb(),C.b)})
q($,"y5","qG",function(){return E.w("MESH_PRIMITIVE_INDICES_ACCESSOR_INVALID_FORMAT",new E.ja(),C.b)})
q($,"y4","qF",function(){return E.w("MESH_PRIMITIVE_INCOMPATIBLE_MODE",new E.j9(),C.e)})
q($,"ya","nG",function(){return E.w("MESH_PRIMITIVE_TOO_FEW_TEXCOORDS",new E.jf(),C.b)})
q($,"yb","qK",function(){return E.w("MESH_PRIMITIVE_UNEQUAL_ACCESSOR_COUNT",new E.jg(),C.b)})
q($,"y8","qJ",function(){return E.w("MESH_PRIMITIVE_MORPH_TARGET_NO_BASE_ACCESSOR",new E.jd(),C.b)})
q($,"y7","qI",function(){return E.w("MESH_PRIMITIVE_MORPH_TARGET_INVALID_ATTRIBUTE_COUNT",new E.jc(),C.b)})
q($,"yc","qL",function(){return E.w("NODE_LOOP",new E.jh(),C.b)})
q($,"yd","qM",function(){return E.w("NODE_PARENT_OVERRIDE",new E.ji(),C.b)})
q($,"yg","qP",function(){return E.w("NODE_WEIGHTS_INVALID",new E.jl(),C.b)})
q($,"ye","qN",function(){return E.w("NODE_SKIN_WITH_NON_SKINNED_MESH",new E.jj(),C.b)})
q($,"yf","qO",function(){return E.w("NODE_SKINNED_MESH_WITHOUT_SKIN",new E.jk(),C.e)})
q($,"yh","qQ",function(){return E.w("SCENE_NON_ROOT_NODE",new E.jm(),C.b)})
q($,"yj","qS",function(){return E.w("SKIN_IBM_INVALID_FORMAT",new E.jo(),C.b)})
q($,"yi","qR",function(){return E.w("SKIN_IBM_ACCESSOR_WITH_BYTESTRIDE",new E.jn(),C.b)})
q($,"yk","nH",function(){return E.w("TEXTURE_INVALID_IMAGE_MIME_TYPE",new E.jp(),C.b)})
q($,"yl","qT",function(){return E.w("UNDECLARED_EXTENSION",new E.jq(),C.b)})
q($,"ym","qU",function(){return E.w("UNEXPECTED_EXTENSION_OBJECT",new E.jr(),C.b)})
q($,"yn","L",function(){return E.w("UNRESOLVED_REFERENCE",new E.js(),C.b)})
q($,"yo","qV",function(){return E.w("UNSUPPORTED_EXTENSION",new E.jt(),C.i)})
q($,"yp","fV",function(){return E.w("UNUSED_OBJECT",new E.ju(),C.i)})
q($,"y_","qC",function(){return E.w("KHR_MATERIALS_VARIANTS_NON_UNIQUE_VARIANT",new E.j4(),C.b)})
q($,"xy","qd",function(){return E.aq("GLB_INVALID_MAGIC",new E.hW(),C.b)})
q($,"xz","qe",function(){return E.aq("GLB_INVALID_VERSION",new E.hX(),C.b)})
q($,"xB","qg",function(){return E.aq("GLB_LENGTH_TOO_SMALL",new E.hZ(),C.b)})
q($,"xu","q9",function(){return E.aq("GLB_CHUNK_LENGTH_UNALIGNED",new E.hS(),C.b)})
q($,"xA","qf",function(){return E.aq("GLB_LENGTH_MISMATCH",new E.hY(),C.b)})
q($,"xv","qa",function(){return E.aq("GLB_CHUNK_TOO_BIG",new E.hT(),C.b)})
q($,"xx","qc",function(){return E.aq("GLB_EMPTY_CHUNK",new E.hV(),C.b)})
q($,"xw","qb",function(){return E.aq("GLB_DUPLICATE_CHUNK",new E.hU(),C.b)})
q($,"xE","qj",function(){return E.aq("GLB_UNEXPECTED_END_OF_CHUNK_HEADER",new E.i1(),C.b)})
q($,"xD","qi",function(){return E.aq("GLB_UNEXPECTED_END_OF_CHUNK_DATA",new E.i0(),C.b)})
q($,"xF","qk",function(){return E.aq("GLB_UNEXPECTED_END_OF_HEADER",new E.i2(),C.b)})
q($,"xG","ql",function(){return E.aq("GLB_UNEXPECTED_FIRST_CHUNK",new E.i3(),C.b)})
q($,"xC","qh",function(){return E.aq("GLB_UNEXPECTED_BIN_CHUNK",new E.i_(),C.b)})
q($,"xH","qm",function(){return E.aq("GLB_UNKNOWN_CHUNK_TYPE",new E.i4(),C.e)})
q($,"zT","nQ",function(){return H.u9(1)})
q($,"zV","rR",function(){return T.u5()})
q($,"zZ","rV",function(){return T.oK()})
q($,"zW","rS",function(){var p=T.um()
p.a[3]=1
return p})
q($,"zX","rT",function(){return T.oK()})})();(function nativeSupport(){!function(){var s=function(a){var m={}
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
hunkHelpers.setOrUpdateInterceptorsByTag({ArrayBuffer:J.cJ,DataView:H.dy,ArrayBufferView:H.dy,Float32Array:H.dw,Float64Array:H.eX,Int16Array:H.eY,Int32Array:H.eZ,Int8Array:H.f_,Uint16Array:H.f0,Uint32Array:H.f1,Uint8ClampedArray:H.dz,CanvasPixelArray:H.dz,Uint8Array:H.cn})
hunkHelpers.setOrUpdateLeafTags({ArrayBuffer:true,DataView:true,ArrayBufferView:false,Float32Array:true,Float64Array:true,Int16Array:true,Int32Array:true,Int8Array:true,Uint16Array:true,Uint32Array:true,Uint8ClampedArray:true,CanvasPixelArray:true,Uint8Array:false})
H.cP.$nativeSuperclassTag="ArrayBufferView"
H.e_.$nativeSuperclassTag="ArrayBufferView"
H.e0.$nativeSuperclassTag="ArrayBufferView"
H.dx.$nativeSuperclassTag="ArrayBufferView"
H.e1.$nativeSuperclassTag="ArrayBufferView"
H.e2.$nativeSuperclassTag="ArrayBufferView"
H.au.$nativeSuperclassTag="ArrayBufferView"})()
Function.prototype.$1=function(a){return this(a)}
Function.prototype.$0=function(){return this()}
Function.prototype.$2=function(a,b){return this(a,b)}
Function.prototype.$1$1=function(a){return this(a)}
Function.prototype.$3=function(a,b,c){return this(a,b,c)}
Function.prototype.$1$0=function(){return this()}
Function.prototype.$4=function(a,b,c,d){return this(a,b,c,d)}
Function.prototype.$1$2=function(a,b){return this(a,b)}
Function.prototype.$2$0=function(){return this()}
convertAllToFastObject(w)
convertToFastObject($);(function(a){if(typeof document==="undefined"){a(null)
return}if(typeof document.currentScript!="undefined"){a(document.currentScript)
return}var s=document.scripts
function onLoad(b){for(var q=0;q<s.length;++q)s[q].removeEventListener("load",onLoad,false)
a(b.target)}for(var r=0;r<s.length;++r)s[r].addEventListener("load",onLoad,false)})(function(a){v.currentScript=a
var s=Q.wC
if(typeof dartMainRunner==="function")dartMainRunner(s,[])
else s([])})})()
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").setImmediate,"/node_modules/gltf-validator/gltf_validator.dart.js","/node_modules/gltf-validator")
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
 @property {ExternalResourceFunction} externalResourceFunction - Function for loading external resources. If omitted, external resources are not validated.
 @property {boolean} writeTimestamp - Set to `false` to omit timestamp from the validation report. Default is `true`.
 @property {number} maxIssues - Max number of reported issues. Use `0` for unlimited output.
 @property {string[]} ignoredIssues - Array of ignored issue codes.
 @property {Object} severityOverrides - Object with overridden severities for issue codes.
 */

/**
 * @callback ExternalResourceFunction
 * @param {string} uri - Relative URI of the external resource.
 * @returns {Promise} - Promise with Uint8Array data.
 */

},{"./gltf_validator.dart.js":7}]},{},[6]);
