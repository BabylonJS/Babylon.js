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
a[c]=function(){a[c]=function(){A.xn(b)}
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
if(a[b]!==s)A.xo(b)
a[b]=r}var q=a[b]
a[c]=function(){return q}
return q}}function makeConstList(a){a.immutable$list=Array
a.fixed$length=Array
return a}function convertToFastObject(a){function t(){}t.prototype=a
new t()
return a}function convertAllToFastObject(a){for(var s=0;s<a.length;++s)convertToFastObject(a[s])}var y=0
function instanceTearOffGetter(a,b){var s=null
return a?function(c){if(s===null)s=A.nF(b)
return new s(c,this)}:function(){if(s===null)s=A.nF(b)
return new s(this,null)}}function staticTearOffGetter(a){var s=null
return function(){if(s===null)s=A.nF(a).prototype
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
a(hunkHelpers,v,w,$)}var A={nk:function nk(){},
hd(a,b,c){if(b.h("p<0>").b(a))return new A.dV(a,b.h("@<0>").I(c).h("dV<1,2>"))
return new A.c4(a,b.h("@<0>").I(c).h("c4<1,2>"))},
ow(a){return new A.eY("Field '"+A.b(a)+"' has been assigned during initialization.")},
aW(a){return new A.fj(a)},
mP(a){var s,r=a^48
if(r<=9)return r
s=a|32
if(97<=s&&s<=102)return s-87
return-1},
pP(a,b){var s=A.mP(B.a.B(a,b)),r=A.mP(B.a.B(a,b+1))
return s*16+r-(r&256)},
bS(a,b,c){if(a==null)throw A.d(new A.dF(b,c.h("dF<0>")))
return a},
dM(a,b,c,d){A.aV(b,"start")
if(c!=null){A.aV(c,"end")
if(b>c)A.a0(A.X(b,0,c,"start",null))}return new A.dL(a,b,c,d.h("dL<0>"))},
jM(a,b,c,d){if(t.O.b(a))return new A.c7(a,b,c.h("@<0>").I(d).h("c7<1,2>"))
return new A.bc(a,b,c.h("@<0>").I(d).h("bc<1,2>"))},
oT(a,b,c){var s="count"
if(t.O.b(a)){A.h6(b,s)
A.aV(b,s)
return new A.cN(a,b,c.h("cN<0>"))}A.h6(b,s)
A.aV(b,s)
return new A.bf(a,b,c.h("bf<0>"))},
ni(){return new A.bG("No element")},
u5(){return new A.bG("Too few elements")},
bJ:function bJ(){},
dk:function dk(a,b){this.a=a
this.$ti=b},
c4:function c4(a,b){this.a=a
this.$ti=b},
dV:function dV(a,b){this.a=a
this.$ti=b},
dQ:function dQ(){},
b5:function b5(a,b){this.a=a
this.$ti=b},
c5:function c5(a,b){this.a=a
this.$ti=b},
he:function he(a,b){this.a=a
this.b=b},
eY:function eY(a){this.a=a},
fj:function fj(a){this.a=a},
cL:function cL(a){this.a=a},
n6:function n6(){},
dF:function dF(a,b){this.a=a
this.$ti=b},
p:function p(){},
ag:function ag(){},
dL:function dL(a,b,c,d){var _=this
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
bc:function bc(a,b,c){this.a=a
this.b=b
this.$ti=c},
c7:function c7(a,b,c){this.a=a
this.b=b
this.$ti=c},
dB:function dB(a,b,c){var _=this
_.a=null
_.b=a
_.c=b
_.$ti=c},
aa:function aa(a,b,c){this.a=a
this.b=b
this.$ti=c},
lC:function lC(a,b,c){this.a=a
this.b=b
this.$ti=c},
cC:function cC(a,b,c){this.a=a
this.b=b
this.$ti=c},
bf:function bf(a,b,c){this.a=a
this.b=b
this.$ti=c},
cN:function cN(a,b,c){this.a=a
this.b=b
this.$ti=c},
dJ:function dJ(a,b,c){this.a=a
this.b=b
this.$ti=c},
b7:function b7(a){this.$ti=a},
dn:function dn(a){this.$ti=a},
dq:function dq(){},
fu:function fu(){},
d0:function d0(){},
d_:function d_(a){this.a=a},
el:function el(){},
tP(){throw A.d(A.ac("Cannot modify unmodifiable Map"))},
tY(a){if(typeof a=="number")return B.bV.gE(a)
if(t.fo.b(a))return a.gE(a)
if(t.dd.b(a))return A.cX(a)
return A.fX(a)},
tZ(a){return new A.hX(a)},
pW(a){var s=v.mangledGlobalNames[a]
if(s!=null)return s
return"minified:"+a},
pN(a,b){var s
if(b!=null){s=b.x
if(s!=null)return s}return t.aU.b(a)},
b(a){var s
if(typeof a=="string")return a
if(typeof a=="number"){if(a!==0)return""+a}else if(!0===a)return"true"
else if(!1===a)return"false"
else if(a==null)return"null"
s=J.aq(a)
if(typeof s!="string")throw A.d(A.h5(a,"object","toString method returned 'null'"))
return s},
cX(a){var s,r=$.oI
if(r==null)r=$.oI=Symbol("identityHashCode")
s=a[r]
if(s==null){s=Math.random()*0x3fffffff|0
a[r]=s}return s},
oP(a,b){var s,r,q,p,o,n,m=null
if(typeof a!="string")A.a0(A.cG(a))
s=/^\s*[+-]?((0x[a-f0-9]+)|(\d+)|([a-z0-9]+))\s*$/i.exec(a)
if(s==null)return m
r=s[3]
if(b==null){if(r!=null)return parseInt(a,10)
if(s[2]!=null)return parseInt(a,16)
return m}if(b<2||b>36)throw A.d(A.X(b,2,36,"radix",m))
if(b===10&&r!=null)return parseInt(a,10)
if(b<10||r==null){q=b<=10?47+b:86+b
p=s[1]
for(o=p.length,n=0;n<o;++n)if((B.a.J(p,n)|32)>q)return m}return parseInt(a,b)},
k5(a){return A.uH(a)},
uH(a){var s,r,q,p,o
if(a instanceof A.c)return A.aA(A.ai(a),null)
s=J.bT(a)
if(s===B.bP||s===B.bX||t.ak.b(a)){r=B.a8(a)
q=r!=="Object"&&r!==""
if(q)return r
p=a.constructor
if(typeof p=="function"){o=p.name
if(typeof o=="string")q=o!=="Object"&&o!==""
else q=!1
if(q)return o}}return A.aA(A.ai(a),null)},
oH(a){var s,r,q,p,o=a.length
if(o<=500)return String.fromCharCode.apply(null,a)
for(s="",r=0;r<o;r=q){q=r+500
p=q<o?q:o
s+=String.fromCharCode.apply(null,a.slice(r,p))}return s},
uK(a){var s,r,q,p=A.a([],t.Z)
for(s=a.length,r=0;r<a.length;a.length===s||(0,A.cI)(a),++r){q=a[r]
if(!A.aH(q))throw A.d(A.cG(q))
if(q<=65535)p.push(q)
else if(q<=1114111){p.push(55296+(B.c.ag(q-65536,10)&1023))
p.push(56320+(q&1023))}else throw A.d(A.cG(q))}return A.oH(p)},
uJ(a){var s,r,q
for(s=a.length,r=0;r<s;++r){q=a[r]
if(!A.aH(q))throw A.d(A.cG(q))
if(q<0)throw A.d(A.cG(q))
if(q>65535)return A.uK(a)}return A.oH(a)},
uL(a,b,c){var s,r,q,p
if(c<=500&&b===0&&c===a.length)return String.fromCharCode.apply(null,a)
for(s=b,r="";s<c;s=q){q=s+500
p=q<c?q:c
r+=String.fromCharCode.apply(null,a.subarray(s,p))}return r},
bd(a){var s
if(0<=a){if(a<=65535)return String.fromCharCode(a)
if(a<=1114111){s=a-65536
return String.fromCharCode((B.c.ag(s,10)|55296)>>>0,s&1023|56320)}}throw A.d(A.X(a,0,1114111,null,null))},
ax(a){if(a.date===void 0)a.date=new Date(a.a)
return a.date},
fh(a){return a.b?A.ax(a).getUTCFullYear()+0:A.ax(a).getFullYear()+0},
oN(a){return a.b?A.ax(a).getUTCMonth()+1:A.ax(a).getMonth()+1},
oJ(a){return a.b?A.ax(a).getUTCDate()+0:A.ax(a).getDate()+0},
oK(a){return a.b?A.ax(a).getUTCHours()+0:A.ax(a).getHours()+0},
oM(a){return a.b?A.ax(a).getUTCMinutes()+0:A.ax(a).getMinutes()+0},
oO(a){return a.b?A.ax(a).getUTCSeconds()+0:A.ax(a).getSeconds()+0},
oL(a){return a.b?A.ax(a).getUTCMilliseconds()+0:A.ax(a).getMilliseconds()+0},
bB(a,b,c){var s,r,q={}
q.a=0
s=[]
r=[]
q.a=b.length
B.d.F(s,b)
q.b=""
if(c!=null&&c.a!==0)c.L(0,new A.k4(q,r,s))
return J.tm(a,new A.iI(B.dA,0,s,r,0))},
uI(a,b,c){var s,r,q
if(Array.isArray(b))s=c==null||c.a===0
else s=!1
if(s){r=b.length
if(r===0){if(!!a.$0)return a.$0()}else if(r===1){if(!!a.$1)return a.$1(b[0])}else if(r===2){if(!!a.$2)return a.$2(b[0],b[1])}else if(r===3){if(!!a.$3)return a.$3(b[0],b[1],b[2])}else if(r===4){if(!!a.$4)return a.$4(b[0],b[1],b[2],b[3])}else if(r===5)if(!!a.$5)return a.$5(b[0],b[1],b[2],b[3],b[4])
q=a[""+"$"+r]
if(q!=null)return q.apply(a,b)}return A.uG(a,b,c)},
uG(a,b,c){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e
if(b!=null)s=Array.isArray(b)?b:A.ct(b,!0,t.z)
else s=[]
r=s.length
q=a.$R
if(r<q)return A.bB(a,s,c)
p=a.$D
o=p==null
n=!o?p():null
m=J.bT(a)
l=m.$C
if(typeof l=="string")l=m[l]
if(o){if(c!=null&&c.a!==0)return A.bB(a,s,c)
if(r===q)return l.apply(a,s)
return A.bB(a,s,c)}if(Array.isArray(n)){if(c!=null&&c.a!==0)return A.bB(a,s,c)
k=q+n.length
if(r>k)return A.bB(a,s,null)
if(r<k){j=n.slice(r-q)
if(s===b)s=A.ct(s,!0,t.z)
B.d.F(s,j)}return l.apply(a,s)}else{if(r>q)return A.bB(a,s,c)
if(s===b)s=A.ct(s,!0,t.z)
i=Object.keys(n)
if(c==null)for(o=i.length,h=0;h<i.length;i.length===o||(0,A.cI)(i),++h){g=n[i[h]]
if(B.ac===g)return A.bB(a,s,c)
B.d.C(s,g)}else{for(o=i.length,f=0,h=0;h<i.length;i.length===o||(0,A.cI)(i),++h){e=i[h]
if(c.v(e)){++f
B.d.C(s,c.j(0,e))}else{g=n[e]
if(B.ac===g)return A.bB(a,s,c)
B.d.C(s,g)}}if(f!==c.a)return A.bB(a,s,c)}return l.apply(a,s)}},
ex(a,b){var s,r="index",q=null
if(!A.aH(b))return new A.ar(!0,b,r,q)
s=J.a3(a)
if(b<0||b>=s)return A.eS(b,a,r,q,s)
return new A.dI(q,q,!0,b,r,"Value not in range")},
wE(a,b,c){if(a<0||a>c)return A.X(a,0,c,"start",null)
if(b!=null)if(b<a||b>c)return A.X(b,a,c,"end",null)
return new A.ar(!0,b,"end",null)},
cG(a){return new A.ar(!0,a,null,null)},
d(a){var s,r
if(a==null)a=new A.fd()
s=new Error()
s.dartException=a
r=A.xp
if("defineProperty" in Object){Object.defineProperty(s,"message",{get:r})
s.name=""}else s.toString=r
return s},
xp(){return J.aq(this.dartException)},
a0(a){throw A.d(a)},
cI(a){throw A.d(A.af(a))},
bj(a){var s,r,q,p,o,n
a=A.pS(a.replace(String({}),"$receiver$"))
s=a.match(/\\\$[a-zA-Z]+\\\$/g)
if(s==null)s=A.a([],t.s)
r=s.indexOf("\\$arguments\\$")
q=s.indexOf("\\$argumentsExpr\\$")
p=s.indexOf("\\$expr\\$")
o=s.indexOf("\\$method\\$")
n=s.indexOf("\\$receiver\\$")
return new A.ll(a.replace(new RegExp("\\\\\\$arguments\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$argumentsExpr\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$expr\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$method\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$receiver\\\\\\$","g"),"((?:x|[^x])*)"),r,q,p,o,n)},
lm(a){return function($expr$){var $argumentsExpr$="$arguments$"
try{$expr$.$method$($argumentsExpr$)}catch(s){return s.message}}(a)},
oW(a){return function($expr$){try{$expr$.$method$}catch(s){return s.message}}(a)},
nl(a,b){var s=b==null,r=s?null:b.method
return new A.eX(a,r,s?null:b.receiver)},
K(a){if(a==null)return new A.fe(a)
if(a instanceof A.dp)return A.bU(a,a.a)
if(typeof a!=="object")return a
if("dartException" in a)return A.bU(a,a.dartException)
return A.wk(a)},
bU(a,b){if(t.Q.b(b))if(b.$thrownJsError==null)b.$thrownJsError=a
return b},
wk(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=null
if(!("message" in a))return a
s=a.message
if("number" in a&&typeof a.number=="number"){r=a.number
q=r&65535
if((B.c.ag(r,16)&8191)===10)switch(q){case 438:return A.bU(a,A.nl(A.b(s)+" (Error "+q+")",e))
case 445:case 5007:p=A.b(s)
return A.bU(a,new A.dG(p+" (Error "+q+")",e))}}if(a instanceof TypeError){o=$.rY()
n=$.rZ()
m=$.t_()
l=$.t0()
k=$.t3()
j=$.t4()
i=$.t2()
$.t1()
h=$.t6()
g=$.t5()
f=o.a8(s)
if(f!=null)return A.bU(a,A.nl(s,f))
else{f=n.a8(s)
if(f!=null){f.method="call"
return A.bU(a,A.nl(s,f))}else{f=m.a8(s)
if(f==null){f=l.a8(s)
if(f==null){f=k.a8(s)
if(f==null){f=j.a8(s)
if(f==null){f=i.a8(s)
if(f==null){f=l.a8(s)
if(f==null){f=h.a8(s)
if(f==null){f=g.a8(s)
p=f!=null}else p=!0}else p=!0}else p=!0}else p=!0}else p=!0}else p=!0}else p=!0
if(p)return A.bU(a,new A.dG(s,f==null?e:f.method))}}return A.bU(a,new A.ft(typeof s=="string"?s:""))}if(a instanceof RangeError){if(typeof s=="string"&&s.indexOf("call stack")!==-1)return new A.dK()
s=function(b){try{return String(b)}catch(d){}return null}(a)
return A.bU(a,new A.ar(!1,e,e,typeof s=="string"?s.replace(/^RangeError:\s*/,""):s))}if(typeof InternalError=="function"&&a instanceof InternalError)if(typeof s=="string"&&s==="too much recursion")return new A.dK()
return a},
aR(a){var s
if(a instanceof A.dp)return a.b
if(a==null)return new A.e8(a)
s=a.$cachedTrace
if(s!=null)return s
return a.$cachedTrace=new A.e8(a)},
fX(a){if(a==null||typeof a!="object")return J.bW(a)
else return A.cX(a)},
pF(a,b){var s,r,q,p=a.length
for(s=0;s<p;s=q){r=s+1
q=r+1
b.m(0,a[s],a[r])}return b},
wI(a,b){var s,r=a.length
for(s=0;s<r;++s)b.C(0,a[s])
return b},
wT(a,b,c,d,e,f){switch(b){case 0:return a.$0()
case 1:return a.$1(c)
case 2:return a.$2(c,d)
case 3:return a.$3(c,d,e)
case 4:return a.$4(c,d,e,f)}throw A.d(A.tW("Unsupported number of arguments for wrapped closure"))},
mH(a,b){var s
if(a==null)return null
s=a.$identity
if(!!s)return s
s=function(c,d,e){return function(f,g,h,i){return e(c,d,f,g,h,i)}}(a,b,A.wT)
a.$identity=s
return s},
tO(a2){var s,r,q,p,o,n,m,l,k,j,i=a2.co,h=a2.iS,g=a2.iI,f=a2.nDA,e=a2.aI,d=a2.fs,c=a2.cs,b=d[0],a=c[0],a0=i[b],a1=a2.fT
a1.toString
s=h?Object.create(new A.fn().constructor.prototype):Object.create(new A.cK(null,null).constructor.prototype)
s.$initialize=s.constructor
if(h)r=function static_tear_off(){this.$initialize()}
else r=function tear_off(a3,a4){this.$initialize(a3,a4)}
s.constructor=r
r.prototype=s
s.$_name=b
s.$_target=a0
q=!h
if(q)p=A.oo(b,a0,g,f)
else{s.$static_name=b
p=a0}s.$S=A.tK(a1,h,g)
s[a]=p
for(o=p,n=1;n<d.length;++n){m=d[n]
if(typeof m=="string"){l=i[m]
k=m
m=l}else k=""
j=c[n]
if(j!=null){if(q)m=A.oo(k,m,g,f)
s[j]=m}if(n===e)o=m}s.$C=o
s.$R=a2.rC
s.$D=a2.dV
return r},
tK(a,b,c){if(typeof a=="number")return a
if(typeof a=="string"){if(b)throw A.d("Cannot compute signature for static tearoff.")
return function(d,e){return function(){return e(this,d)}}(a,A.tD)}throw A.d("Error in functionType of tearoff")},
tL(a,b,c,d){var s=A.on
switch(b?-1:a){case 0:return function(e,f){return function(){return f(this)[e]()}}(c,s)
case 1:return function(e,f){return function(g){return f(this)[e](g)}}(c,s)
case 2:return function(e,f){return function(g,h){return f(this)[e](g,h)}}(c,s)
case 3:return function(e,f){return function(g,h,i){return f(this)[e](g,h,i)}}(c,s)
case 4:return function(e,f){return function(g,h,i,j){return f(this)[e](g,h,i,j)}}(c,s)
case 5:return function(e,f){return function(g,h,i,j,k){return f(this)[e](g,h,i,j,k)}}(c,s)
default:return function(e,f){return function(){return e.apply(f(this),arguments)}}(d,s)}},
oo(a,b,c,d){var s,r
if(c)return A.tN(a,b,d)
s=b.length
r=A.tL(s,d,a,b)
return r},
tM(a,b,c,d){var s=A.on,r=A.tE
switch(b?-1:a){case 0:throw A.d(new A.fm("Intercepted function with no arguments."))
case 1:return function(e,f,g){return function(){return f(this)[e](g(this))}}(c,r,s)
case 2:return function(e,f,g){return function(h){return f(this)[e](g(this),h)}}(c,r,s)
case 3:return function(e,f,g){return function(h,i){return f(this)[e](g(this),h,i)}}(c,r,s)
case 4:return function(e,f,g){return function(h,i,j){return f(this)[e](g(this),h,i,j)}}(c,r,s)
case 5:return function(e,f,g){return function(h,i,j,k){return f(this)[e](g(this),h,i,j,k)}}(c,r,s)
case 6:return function(e,f,g){return function(h,i,j,k,l){return f(this)[e](g(this),h,i,j,k,l)}}(c,r,s)
default:return function(e,f,g){return function(){var q=[g(this)]
Array.prototype.push.apply(q,arguments)
return e.apply(f(this),q)}}(d,r,s)}},
tN(a,b,c){var s,r
if($.ol==null)$.ol=A.ok("interceptor")
if($.om==null)$.om=A.ok("receiver")
s=b.length
r=A.tM(s,c,a,b)
return r},
nF(a){return A.tO(a)},
tD(a,b){return A.ml(v.typeUniverse,A.ai(a.a),b)},
on(a){return a.a},
tE(a){return a.b},
ok(a){var s,r,q,p=new A.cK("receiver","interceptor"),o=J.nj(Object.getOwnPropertyNames(p))
for(s=o.length,r=0;r<s;++r){q=o[r]
if(p[q]===a)return q}throw A.d(A.R("Field name "+a+" not found.",null))},
xn(a){throw A.d(new A.eM(a))},
wN(a){return v.getIsolateTag(a)},
uq(a,b,c){var s=new A.cs(a,b,c.h("cs<0>"))
s.c=a.e
return s},
AK(a,b,c){Object.defineProperty(a,b,{value:c,enumerable:false,writable:true,configurable:true})},
xa(a){var s,r,q,p,o,n=$.pK.$1(a),m=$.mI[n]
if(m!=null){Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}s=$.mT[n]
if(s!=null)return s
r=v.interceptorsByTag[n]
if(r==null){q=$.pB.$2(a,n)
if(q!=null){m=$.mI[q]
if(m!=null){Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}s=$.mT[q]
if(s!=null)return s
r=v.interceptorsByTag[q]
n=q}}if(r==null)return null
s=r.prototype
p=n[0]
if(p==="!"){m=A.n5(s)
$.mI[n]=m
Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}if(p==="~"){$.mT[n]=s
return s}if(p==="-"){o=A.n5(s)
Object.defineProperty(Object.getPrototypeOf(a),v.dispatchPropertyName,{value:o,enumerable:false,writable:true,configurable:true})
return o.i}if(p==="+")return A.pQ(a,s)
if(p==="*")throw A.d(A.oX(n))
if(v.leafTags[n]===true){o=A.n5(s)
Object.defineProperty(Object.getPrototypeOf(a),v.dispatchPropertyName,{value:o,enumerable:false,writable:true,configurable:true})
return o.i}else return A.pQ(a,s)},
pQ(a,b){var s=Object.getPrototypeOf(a)
Object.defineProperty(s,v.dispatchPropertyName,{value:J.nJ(b,s,null,null),enumerable:false,writable:true,configurable:true})
return b},
n5(a){return J.nJ(a,!1,null,!!a.$iau)},
xc(a,b,c){var s=b.prototype
if(v.leafTags[a]===true)return A.n5(s)
else return J.nJ(s,c,null,null)},
wR(){if(!0===$.nH)return
$.nH=!0
A.wS()},
wS(){var s,r,q,p,o,n,m,l
$.mI=Object.create(null)
$.mT=Object.create(null)
A.wQ()
s=v.interceptorsByTag
r=Object.getOwnPropertyNames(s)
if(typeof window!="undefined"){window
q=function(){}
for(p=0;p<r.length;++p){o=r[p]
n=$.pR.$1(o)
if(n!=null){m=A.xc(o,s[o],n)
if(m!=null){Object.defineProperty(n,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
q.prototype=n}}}}for(p=0;p<r.length;++p){o=r[p]
if(/^[A-Za-z_]/.test(o)){l=s[o]
s["!"+o]=l
s["~"+o]=l
s["-"+o]=l
s["+"+o]=l
s["*"+o]=l}}},
wQ(){var s,r,q,p,o,n,m=B.ba()
m=A.dg(B.bb,A.dg(B.bc,A.dg(B.a9,A.dg(B.a9,A.dg(B.bd,A.dg(B.be,A.dg(B.bf(B.a8),m)))))))
if(typeof dartNativeDispatchHooksTransformer!="undefined"){s=dartNativeDispatchHooksTransformer
if(typeof s=="function")s=[s]
if(s.constructor==Array)for(r=0;r<s.length;++r){q=s[r]
if(typeof q=="function")m=q(m)||m}}p=m.getTag
o=m.getUnknownTag
n=m.prototypeForTag
$.pK=new A.mQ(p)
$.pB=new A.mR(o)
$.pR=new A.mS(n)},
dg(a,b){return a(b)||b},
u7(a,b,c,d,e,f){var s=b?"m":"",r=c?"":"i",q=d?"u":"",p=e?"s":"",o=f?"g":"",n=function(g,h){try{return new RegExp(g,h)}catch(m){return m}}(a,s+r+q+p+o)
if(n instanceof RegExp)return n
throw A.d(A.P("Illegal RegExp pattern ("+String(n)+")",a,null))},
wF(a){if(a.indexOf("$",0)>=0)return a.replace(/\$/g,"$$$$")
return a},
pS(a){if(/[[\]{}()*+?.\\^$|]/.test(a))return a.replace(/[[\]{}()*+?.\\^$|]/g,"\\$&")
return a},
pU(a,b,c){var s=A.xl(a,b,c)
return s},
xl(a,b,c){var s,r,q,p
if(b===""){if(a==="")return c
s=a.length
for(r=c,q=0;q<s;++q)r=r+a[q]+c
return r.charCodeAt(0)==0?r:r}p=a.indexOf(b,0)
if(p<0)return a
if(a.length<500||c.indexOf("$",0)>=0)return a.split(b).join(c)
return a.replace(new RegExp(A.pS(b),"g"),A.wF(c))},
dl:function dl(a,b){this.a=a
this.$ti=b},
cM:function cM(){},
as:function as(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.$ti=d},
dS:function dS(a,b){this.a=a
this.$ti=b},
Y:function Y(a,b){this.a=a
this.$ti=b},
hX:function hX(a){this.a=a},
iI:function iI(a,b,c,d,e){var _=this
_.a=a
_.c=b
_.d=c
_.e=d
_.f=e},
k4:function k4(a,b,c){this.a=a
this.b=b
this.c=c},
ll:function ll(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f},
dG:function dG(a,b){this.a=a
this.b=b},
eX:function eX(a,b,c){this.a=a
this.b=b
this.c=c},
ft:function ft(a){this.a=a},
fe:function fe(a){this.a=a},
dp:function dp(a,b){this.a=a
this.b=b},
e8:function e8(a){this.a=a
this.b=null},
c6:function c6(){},
eH:function eH(){},
eI:function eI(){},
fp:function fp(){},
fn:function fn(){},
cK:function cK(a,b){this.a=a
this.b=b},
fm:function fm(a){this.a=a},
me:function me(){},
aE:function aE(a){var _=this
_.a=0
_.f=_.e=_.d=_.c=_.b=null
_.r=0
_.$ti=a},
iO:function iO(a){this.a=a},
jJ:function jJ(a,b){this.a=a
this.b=b
this.c=null},
aM:function aM(a,b){this.a=a
this.$ti=b},
cs:function cs(a,b,c){var _=this
_.a=a
_.b=b
_.d=_.c=null
_.$ti=c},
mQ:function mQ(a){this.a=a},
mR:function mR(a){this.a=a},
mS:function mS(a){this.a=a},
iJ:function iJ(a,b){var _=this
_.a=a
_.b=b
_.d=_.c=null},
mc:function mc(a){this.b=a},
db(a,b,c){if(!A.aH(b))throw A.d(A.R("Invalid view offsetInBytes "+A.b(b),null))},
vO(a){return a},
f3(a,b,c){A.db(a,b,c)
return c==null?new DataView(a,b):new DataView(a,b,c)},
uz(a){return new Float32Array(a)},
uA(a){return new Int8Array(a)},
oE(a,b,c){A.db(a,b,c)
return new Uint16Array(a,b,c)},
oF(a,b,c){A.db(a,b,c)
return new Uint32Array(a,b,c)},
uB(a){return new Uint8Array(a)},
no(a,b,c){var s
A.db(a,b,c)
s=new Uint8Array(a,b,c)
return s},
bl(a,b,c){if(a>>>0!==a||a>=c)throw A.d(A.ex(b,a))},
bP(a,b,c){var s
if(!(a>>>0!==a))s=b>>>0!==b||a>b||b>c
else s=!0
if(s)throw A.d(A.wE(a,b,c))
return b},
dD:function dD(){},
cW:function cW(){},
dC:function dC(){},
aw:function aw(){},
f4:function f4(){},
f5:function f5(){},
f6:function f6(){},
f7:function f7(){},
f8:function f8(){},
f9:function f9(){},
fa:function fa(){},
dE:function dE(){},
cu:function cu(){},
e4:function e4(){},
e5:function e5(){},
e6:function e6(){},
e7:function e7(){},
uO(a,b){var s=b.c
return s==null?b.c=A.nx(a,b.y,!0):s},
oR(a,b){var s=b.c
return s==null?b.c=A.ef(a,"a5",[b.y]):s},
oS(a){var s=a.x
if(s===6||s===7||s===8)return A.oS(a.y)
return s===11||s===12},
uN(a){return a.at},
aB(a){return A.fR(v.typeUniverse,a,!1)},
bR(a,b,a0,a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=b.x
switch(c){case 5:case 1:case 2:case 3:case 4:return b
case 6:s=b.y
r=A.bR(a,s,a0,a1)
if(r===s)return b
return A.pd(a,r,!0)
case 7:s=b.y
r=A.bR(a,s,a0,a1)
if(r===s)return b
return A.nx(a,r,!0)
case 8:s=b.y
r=A.bR(a,s,a0,a1)
if(r===s)return b
return A.pc(a,r,!0)
case 9:q=b.z
p=A.ev(a,q,a0,a1)
if(p===q)return b
return A.ef(a,b.y,p)
case 10:o=b.y
n=A.bR(a,o,a0,a1)
m=b.z
l=A.ev(a,m,a0,a1)
if(n===o&&l===m)return b
return A.nv(a,n,l)
case 11:k=b.y
j=A.bR(a,k,a0,a1)
i=b.z
h=A.wh(a,i,a0,a1)
if(j===k&&h===i)return b
return A.pb(a,j,h)
case 12:g=b.z
a1+=g.length
f=A.ev(a,g,a0,a1)
o=b.y
n=A.bR(a,o,a0,a1)
if(f===g&&n===o)return b
return A.nw(a,n,f,!0)
case 13:e=b.y
if(e<a1)return b
d=a0[e-a1]
if(d==null)return b
return d
default:throw A.d(A.h7("Attempted to substitute unexpected RTI kind "+c))}},
ev(a,b,c,d){var s,r,q,p,o=b.length,n=A.mn(o)
for(s=!1,r=0;r<o;++r){q=b[r]
p=A.bR(a,q,c,d)
if(p!==q)s=!0
n[r]=p}return s?n:b},
wi(a,b,c,d){var s,r,q,p,o,n,m=b.length,l=A.mn(m)
for(s=!1,r=0;r<m;r+=3){q=b[r]
p=b[r+1]
o=b[r+2]
n=A.bR(a,o,c,d)
if(n!==o)s=!0
l.splice(r,3,q,p,n)}return s?l:b},
wh(a,b,c,d){var s,r=b.a,q=A.ev(a,r,c,d),p=b.b,o=A.ev(a,p,c,d),n=b.c,m=A.wi(a,n,c,d)
if(q===r&&o===p&&m===n)return b
s=new A.fG()
s.a=q
s.b=o
s.c=m
return s},
a(a,b){a[v.arrayRti]=b
return a},
wB(a){var s=a.$S
if(s!=null){if(typeof s=="number")return A.wO(s)
return a.$S()}return null},
pM(a,b){var s
if(A.oS(b))if(a instanceof A.c6){s=A.wB(a)
if(s!=null)return s}return A.ai(a)},
ai(a){var s
if(a instanceof A.c){s=a.$ti
return s!=null?s:A.nA(a)}if(Array.isArray(a))return A.Z(a)
return A.nA(J.bT(a))},
Z(a){var s=a[v.arrayRti],r=t.b
if(s==null)return r
if(s.constructor!==r.constructor)return r
return s},
C(a){var s=a.$ti
return s!=null?s:A.nA(a)},
nA(a){var s=a.constructor,r=s.$ccache
if(r!=null)return r
return A.vY(a,s)},
vY(a,b){var s=a instanceof A.c6?a.__proto__.__proto__.constructor:b,r=A.vm(v.typeUniverse,s.name)
b.$ccache=r
return r},
wO(a){var s,r=v.types,q=r[a]
if(typeof q=="string"){s=A.fR(v.typeUniverse,q,!1)
r[a]=s
return s}return q},
pD(a){var s,r,q,p=a.w
if(p!=null)return p
s=a.at
r=s.replace(/\*/g,"")
if(r===s)return a.w=new A.ed(a)
q=A.fR(v.typeUniverse,r,!0)
p=q.w
return a.w=p==null?q.w=new A.ed(q):p},
u(a){return A.pD(A.fR(v.typeUniverse,a,!1))},
vX(a){var s,r,q,p=this,o=t.K
if(p===o)return A.dc(p,a,A.w1)
if(!A.bo(p))if(!(p===t._))o=p===o
else o=!0
else o=!0
if(o)return A.dc(p,a,A.w4)
o=p.x
s=o===6?p.y:p
if(s===t.S)r=A.aH
else if(s===t.gR||s===t.di)r=A.w0
else if(s===t.R)r=A.w2
else r=s===t.y?A.er:null
if(r!=null)return A.dc(p,a,r)
if(s.x===9){q=s.y
if(s.z.every(A.wU)){p.r="$i"+q
if(q==="o")return A.dc(p,a,A.w_)
return A.dc(p,a,A.w3)}}else if(o===7)return A.dc(p,a,A.vR)
return A.dc(p,a,A.vP)},
dc(a,b,c){a.b=c
return a.b(b)},
vW(a){var s,r,q=this
if(!A.bo(q))if(!(q===t._))s=q===t.K
else s=!0
else s=!0
if(s)r=A.vH
else if(q===t.K)r=A.vG
else r=A.vQ
q.a=r
return q.a(a)},
mC(a){var s,r=a.x
if(!A.bo(a))if(!(a===t._))if(!(a===t.A))if(r!==7)s=r===8&&A.mC(a.y)||a===t.P||a===t.T
else s=!0
else s=!0
else s=!0
else s=!0
return s},
vP(a){var s=this
if(a==null)return A.mC(s)
return A.ad(v.typeUniverse,A.pM(a,s),null,s,null)},
vR(a){if(a==null)return!0
return this.y.b(a)},
w3(a){var s,r=this
if(a==null)return A.mC(r)
s=r.r
if(a instanceof A.c)return!!a[s]
return!!J.bT(a)[s]},
w_(a){var s,r=this
if(a==null)return A.mC(r)
if(typeof a!="object")return!1
if(Array.isArray(a))return!0
s=r.r
if(a instanceof A.c)return!!a[s]
return!!J.bT(a)[s]},
AD(a){var s=this
if(a==null)return a
else if(s.b(a))return a
A.po(a,s)},
vQ(a){var s=this
if(a==null)return a
else if(s.b(a))return a
A.po(a,s)},
po(a,b){throw A.d(A.vc(A.p5(a,A.pM(a,b),A.aA(b,null))))},
p5(a,b,c){var s=A.cO(a)
return s+": type '"+A.b(A.aA(b==null?A.ai(a):b,null))+"' is not a subtype of type '"+A.b(c)+"'"},
vc(a){return new A.ee("TypeError: "+a)},
ao(a,b){return new A.ee("TypeError: "+A.p5(a,null,b))},
w1(a){return a!=null},
vG(a){return a},
w4(a){return!0},
vH(a){return a},
er(a){return!0===a||!1===a},
An(a){if(!0===a)return!0
if(!1===a)return!1
throw A.d(A.ao(a,"bool"))},
Ap(a){if(!0===a)return!0
if(!1===a)return!1
if(a==null)return a
throw A.d(A.ao(a,"bool"))},
Ao(a){if(!0===a)return!0
if(!1===a)return!1
if(a==null)return a
throw A.d(A.ao(a,"bool?"))},
Aq(a){if(typeof a=="number")return a
throw A.d(A.ao(a,"double"))},
As(a){if(typeof a=="number")return a
if(a==null)return a
throw A.d(A.ao(a,"double"))},
Ar(a){if(typeof a=="number")return a
if(a==null)return a
throw A.d(A.ao(a,"double?"))},
aH(a){return typeof a=="number"&&Math.floor(a)===a},
At(a){if(typeof a=="number"&&Math.floor(a)===a)return a
throw A.d(A.ao(a,"int"))},
Av(a){if(typeof a=="number"&&Math.floor(a)===a)return a
if(a==null)return a
throw A.d(A.ao(a,"int"))},
Au(a){if(typeof a=="number"&&Math.floor(a)===a)return a
if(a==null)return a
throw A.d(A.ao(a,"int?"))},
w0(a){return typeof a=="number"},
Aw(a){if(typeof a=="number")return a
throw A.d(A.ao(a,"num"))},
Ay(a){if(typeof a=="number")return a
if(a==null)return a
throw A.d(A.ao(a,"num"))},
Ax(a){if(typeof a=="number")return a
if(a==null)return a
throw A.d(A.ao(a,"num?"))},
w2(a){return typeof a=="string"},
Az(a){if(typeof a=="string")return a
throw A.d(A.ao(a,"String"))},
AB(a){if(typeof a=="string")return a
if(a==null)return a
throw A.d(A.ao(a,"String"))},
AA(a){if(typeof a=="string")return a
if(a==null)return a
throw A.d(A.ao(a,"String?"))},
wd(a,b){var s,r,q
for(s="",r="",q=0;q<a.length;++q,r=", ")s+=B.a.ak(r,A.aA(a[q],b))
return s},
pq(a4,a5,a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3=", "
if(a6!=null){s=a6.length
if(a5==null){a5=A.a([],t.s)
r=null}else r=a5.length
q=a5.length
for(p=s;p>0;--p)a5.push("T"+(q+p))
for(o=t.cK,n=t._,m=t.K,l="<",k="",p=0;p<s;++p,k=a3){l=B.a.ak(l+k,a5[a5.length-1-p])
j=a6[p]
i=j.x
if(!(i===2||i===3||i===4||i===5||j===o))if(!(j===n))h=j===m
else h=!0
else h=!0
if(!h)l+=B.a.ak(" extends ",A.aA(j,a5))}l+=">"}else{l=""
r=null}o=a4.y
g=a4.z
f=g.a
e=f.length
d=g.b
c=d.length
b=g.c
a=b.length
a0=A.aA(o,a5)
for(a1="",a2="",p=0;p<e;++p,a2=a3)a1+=B.a.ak(a2,A.aA(f[p],a5))
if(c>0){a1+=a2+"["
for(a2="",p=0;p<c;++p,a2=a3)a1+=B.a.ak(a2,A.aA(d[p],a5))
a1+="]"}if(a>0){a1+=a2+"{"
for(a2="",p=0;p<a;p+=3,a2=a3){a1+=a2
if(b[p+1])a1+="required "
a1+=J.oc(A.aA(b[p+2],a5)," ")+b[p]}a1+="}"}if(r!=null){a5.toString
a5.length=r}return l+"("+a1+") => "+A.b(a0)},
aA(a,b){var s,r,q,p,o,n,m=a.x
if(m===5)return"erased"
if(m===2)return"dynamic"
if(m===3)return"void"
if(m===1)return"Never"
if(m===4)return"any"
if(m===6){s=A.aA(a.y,b)
return s}if(m===7){r=a.y
s=A.aA(r,b)
q=r.x
return J.oc(q===11||q===12?B.a.ak("(",s)+")":s,"?")}if(m===8)return"FutureOr<"+A.b(A.aA(a.y,b))+">"
if(m===9){p=A.wj(a.y)
o=a.z
return o.length>0?p+("<"+A.wd(o,b)+">"):p}if(m===11)return A.pq(a,b,null)
if(m===12)return A.pq(a.y,b,a.z)
if(m===13){b.toString
n=a.y
return b[b.length-1-n]}return"?"},
wj(a){var s=v.mangledGlobalNames[a]
if(s!=null)return s
return"minified:"+a},
vn(a,b){var s=a.tR[b]
for(;typeof s=="string";)s=a.tR[s]
return s},
vm(a,b){var s,r,q,p,o,n=a.eT,m=n[b]
if(m==null)return A.fR(a,b,!1)
else if(typeof m=="number"){s=m
r=A.eg(a,5,"#")
q=A.mn(s)
for(p=0;p<s;++p)q[p]=r
o=A.ef(a,b,q)
n[b]=o
return o}else return m},
vk(a,b){return A.pl(a.tR,b)},
vj(a,b){return A.pl(a.eT,b)},
fR(a,b,c){var s,r=a.eC,q=r.get(b)
if(q!=null)return q
s=A.pa(A.p8(a,null,b,c))
r.set(b,s)
return s},
ml(a,b,c){var s,r,q=b.Q
if(q==null)q=b.Q=new Map()
s=q.get(c)
if(s!=null)return s
r=A.pa(A.p8(a,b,c,!0))
q.set(c,r)
return r},
vl(a,b,c){var s,r,q,p=b.as
if(p==null)p=b.as=new Map()
s=c.at
r=p.get(s)
if(r!=null)return r
q=A.nv(a,b,c.x===10?c.z:[c])
p.set(s,q)
return q},
bO(a,b){b.a=A.vW
b.b=A.vX
return b},
eg(a,b,c){var s,r,q=a.eC.get(c)
if(q!=null)return q
s=new A.aQ(null,null)
s.x=b
s.at=c
r=A.bO(a,s)
a.eC.set(c,r)
return r},
pd(a,b,c){var s,r=b.at+"*",q=a.eC.get(r)
if(q!=null)return q
s=A.vh(a,b,r,c)
a.eC.set(r,s)
return s},
vh(a,b,c,d){var s,r,q
if(d){s=b.x
if(!A.bo(b))r=b===t.P||b===t.T||s===7||s===6
else r=!0
if(r)return b}q=new A.aQ(null,null)
q.x=6
q.y=b
q.at=c
return A.bO(a,q)},
nx(a,b,c){var s,r=b.at+"?",q=a.eC.get(r)
if(q!=null)return q
s=A.vg(a,b,r,c)
a.eC.set(r,s)
return s},
vg(a,b,c,d){var s,r,q,p
if(d){s=b.x
if(!A.bo(b))if(!(b===t.P||b===t.T))if(s!==7)r=s===8&&A.mU(b.y)
else r=!0
else r=!0
else r=!0
if(r)return b
else if(s===1||b===t.A)return t.P
else if(s===6){q=b.y
if(q.x===8&&A.mU(q.y))return q
else return A.uO(a,b)}}p=new A.aQ(null,null)
p.x=7
p.y=b
p.at=c
return A.bO(a,p)},
pc(a,b,c){var s,r=b.at+"/",q=a.eC.get(r)
if(q!=null)return q
s=A.ve(a,b,r,c)
a.eC.set(r,s)
return s},
ve(a,b,c,d){var s,r,q
if(d){s=b.x
if(!A.bo(b))if(!(b===t._))r=b===t.K
else r=!0
else r=!0
if(r||b===t.K)return b
else if(s===1)return A.ef(a,"a5",[b])
else if(b===t.P||b===t.T)return t.eH}q=new A.aQ(null,null)
q.x=8
q.y=b
q.at=c
return A.bO(a,q)},
vi(a,b){var s,r,q=""+b+"^",p=a.eC.get(q)
if(p!=null)return p
s=new A.aQ(null,null)
s.x=13
s.y=b
s.at=q
r=A.bO(a,s)
a.eC.set(q,r)
return r},
fQ(a){var s,r,q,p=a.length
for(s="",r="",q=0;q<p;++q,r=",")s+=r+a[q].at
return s},
vd(a){var s,r,q,p,o,n=a.length
for(s="",r="",q=0;q<n;q+=3,r=","){p=a[q]
o=a[q+1]?"!":":"
s+=r+p+o+a[q+2].at}return s},
ef(a,b,c){var s,r,q,p=b
if(c.length>0)p+="<"+A.fQ(c)+">"
s=a.eC.get(p)
if(s!=null)return s
r=new A.aQ(null,null)
r.x=9
r.y=b
r.z=c
if(c.length>0)r.c=c[0]
r.at=p
q=A.bO(a,r)
a.eC.set(p,q)
return q},
nv(a,b,c){var s,r,q,p,o,n
if(b.x===10){s=b.y
r=b.z.concat(c)}else{r=c
s=b}q=s.at+(";<"+A.fQ(r)+">")
p=a.eC.get(q)
if(p!=null)return p
o=new A.aQ(null,null)
o.x=10
o.y=s
o.z=r
o.at=q
n=A.bO(a,o)
a.eC.set(q,n)
return n},
pb(a,b,c){var s,r,q,p,o,n=b.at,m=c.a,l=m.length,k=c.b,j=k.length,i=c.c,h=i.length,g="("+A.fQ(m)
if(j>0){s=l>0?",":""
g+=s+"["+A.fQ(k)+"]"}if(h>0){s=l>0?",":""
g+=s+"{"+A.vd(i)+"}"}r=n+(g+")")
q=a.eC.get(r)
if(q!=null)return q
p=new A.aQ(null,null)
p.x=11
p.y=b
p.z=c
p.at=r
o=A.bO(a,p)
a.eC.set(r,o)
return o},
nw(a,b,c,d){var s,r=b.at+("<"+A.fQ(c)+">"),q=a.eC.get(r)
if(q!=null)return q
s=A.vf(a,b,c,r,d)
a.eC.set(r,s)
return s},
vf(a,b,c,d,e){var s,r,q,p,o,n,m,l
if(e){s=c.length
r=A.mn(s)
for(q=0,p=0;p<s;++p){o=c[p]
if(o.x===1){r[p]=o;++q}}if(q>0){n=A.bR(a,b,r,0)
m=A.ev(a,c,r,0)
return A.nw(a,n,m,c!==m)}}l=new A.aQ(null,null)
l.x=12
l.y=b
l.z=c
l.at=d
return A.bO(a,l)},
p8(a,b,c,d){return{u:a,e:b,r:c,s:[],p:0,n:d}},
pa(a){var s,r,q,p,o,n,m,l,k,j,i,h,g=a.r,f=a.s
for(s=g.length,r=0;r<s;){q=g.charCodeAt(r)
if(q>=48&&q<=57)r=A.v7(r+1,q,g,f)
else if((((q|32)>>>0)-97&65535)<26||q===95||q===36)r=A.p9(a,r,g,f,!1)
else if(q===46)r=A.p9(a,r,g,f,!0)
else{++r
switch(q){case 44:break
case 58:f.push(!1)
break
case 33:f.push(!0)
break
case 59:f.push(A.bN(a.u,a.e,f.pop()))
break
case 94:f.push(A.vi(a.u,f.pop()))
break
case 35:f.push(A.eg(a.u,5,"#"))
break
case 64:f.push(A.eg(a.u,2,"@"))
break
case 126:f.push(A.eg(a.u,3,"~"))
break
case 60:f.push(a.p)
a.p=f.length
break
case 62:p=a.u
o=f.splice(a.p)
A.nu(a.u,a.e,o)
a.p=f.pop()
n=f.pop()
if(typeof n=="string")f.push(A.ef(p,n,o))
else{m=A.bN(p,a.e,n)
switch(m.x){case 11:f.push(A.nw(p,m,o,a.n))
break
default:f.push(A.nv(p,m,o))
break}}break
case 38:A.v8(a,f)
break
case 42:l=a.u
f.push(A.pd(l,A.bN(l,a.e,f.pop()),a.n))
break
case 63:l=a.u
f.push(A.nx(l,A.bN(l,a.e,f.pop()),a.n))
break
case 47:l=a.u
f.push(A.pc(l,A.bN(l,a.e,f.pop()),a.n))
break
case 40:f.push(a.p)
a.p=f.length
break
case 41:p=a.u
k=new A.fG()
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
A.nu(a.u,a.e,o)
a.p=f.pop()
k.a=o
k.b=j
k.c=i
f.push(A.pb(p,A.bN(p,a.e,f.pop()),k))
break
case 91:f.push(a.p)
a.p=f.length
break
case 93:o=f.splice(a.p)
A.nu(a.u,a.e,o)
a.p=f.pop()
f.push(o)
f.push(-1)
break
case 123:f.push(a.p)
a.p=f.length
break
case 125:o=f.splice(a.p)
A.va(a.u,a.e,o)
a.p=f.pop()
f.push(o)
f.push(-2)
break
default:throw"Bad character "+q}}}h=f.pop()
return A.bN(a.u,a.e,h)},
v7(a,b,c,d){var s,r,q=b-48
for(s=c.length;a<s;++a){r=c.charCodeAt(a)
if(!(r>=48&&r<=57))break
q=q*10+(r-48)}d.push(q)
return a},
p9(a,b,c,d,e){var s,r,q,p,o,n,m=b+1
for(s=c.length;m<s;++m){r=c.charCodeAt(m)
if(r===46){if(e)break
e=!0}else{if(!((((r|32)>>>0)-97&65535)<26||r===95||r===36))q=r>=48&&r<=57
else q=!0
if(!q)break}}p=c.substring(b,m)
if(e){s=a.u
o=a.e
if(o.x===10)o=o.y
n=A.vn(s,o.y)[p]
if(n==null)A.a0('No "'+p+'" in "'+A.uN(o)+'"')
d.push(A.ml(s,o,n))}else d.push(p)
return m},
v8(a,b){var s=b.pop()
if(0===s){b.push(A.eg(a.u,1,"0&"))
return}if(1===s){b.push(A.eg(a.u,4,"1&"))
return}throw A.d(A.h7("Unexpected extended operation "+A.b(s)))},
bN(a,b,c){if(typeof c=="string")return A.ef(a,c,a.sEA)
else if(typeof c=="number")return A.v9(a,b,c)
else return c},
nu(a,b,c){var s,r=c.length
for(s=0;s<r;++s)c[s]=A.bN(a,b,c[s])},
va(a,b,c){var s,r=c.length
for(s=2;s<r;s+=3)c[s]=A.bN(a,b,c[s])},
v9(a,b,c){var s,r,q=b.x
if(q===10){if(c===0)return b.y
s=b.z
r=s.length
if(c<=r)return s[c-1]
c-=r
b=b.y
q=b.x}else if(c===0)return b
if(q!==9)throw A.d(A.h7("Indexed base must be an interface type"))
s=b.z
if(c<=s.length)return s[c-1]
throw A.d(A.h7("Bad index "+c+" for "+b.k(0)))},
ad(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j
if(b===d)return!0
if(!A.bo(d))if(!(d===t._))s=d===t.K
else s=!0
else s=!0
if(s)return!0
r=b.x
if(r===4)return!0
if(A.bo(b))return!1
if(b.x!==1)s=b===t.P||b===t.T
else s=!0
if(s)return!0
q=r===13
if(q)if(A.ad(a,c[b.y],c,d,e))return!0
p=d.x
if(r===6)return A.ad(a,b.y,c,d,e)
if(p===6){s=d.y
return A.ad(a,b,c,s,e)}if(r===8){if(!A.ad(a,b.y,c,d,e))return!1
return A.ad(a,A.oR(a,b),c,d,e)}if(r===7){s=A.ad(a,b.y,c,d,e)
return s}if(p===8){if(A.ad(a,b,c,d.y,e))return!0
return A.ad(a,b,c,A.oR(a,d),e)}if(p===7){s=A.ad(a,b,c,d.y,e)
return s}if(q)return!1
s=r!==11
if((!s||r===12)&&d===t.b8)return!0
if(p===12){if(b===t.g)return!0
if(r!==12)return!1
o=b.z
n=d.z
m=o.length
if(m!==n.length)return!1
c=c==null?o:o.concat(c)
e=e==null?n:n.concat(e)
for(l=0;l<m;++l){k=o[l]
j=n[l]
if(!A.ad(a,k,c,j,e)||!A.ad(a,j,e,k,c))return!1}return A.ps(a,b.y,c,d.y,e)}if(p===11){if(b===t.g)return!0
if(s)return!1
return A.ps(a,b,c,d,e)}if(r===9){if(p!==9)return!1
return A.vZ(a,b,c,d,e)}return!1},
ps(a2,a3,a4,a5,a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1
if(!A.ad(a2,a3.y,a4,a5.y,a6))return!1
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
if(!A.ad(a2,p[h],a6,g,a4))return!1}for(h=0;h<m;++h){g=l[h]
if(!A.ad(a2,p[o+h],a6,g,a4))return!1}for(h=0;h<i;++h){g=l[m+h]
if(!A.ad(a2,k[h],a6,g,a4))return!1}f=s.c
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
if(!A.ad(a2,e[a+2],a6,g,a4))return!1
break}}return!0},
vZ(a,b,c,d,e){var s,r,q,p,o,n,m,l=b.y,k=d.y
for(;l!==k;){s=a.tR[l]
if(s==null)return!1
if(typeof s=="string"){l=s
continue}r=s[k]
if(r==null)return!1
q=r.length
p=q>0?new Array(q):v.typeUniverse.sEA
for(o=0;o<q;++o)p[o]=A.ml(a,b,r[o])
return A.pm(a,p,null,c,d.z,e)}n=b.z
m=d.z
return A.pm(a,n,null,c,m,e)},
pm(a,b,c,d,e,f){var s,r,q,p=b.length
for(s=0;s<p;++s){r=b[s]
q=e[s]
if(!A.ad(a,r,d,q,f))return!1}return!0},
mU(a){var s,r=a.x
if(!(a===t.P||a===t.T))if(!A.bo(a))if(r!==7)if(!(r===6&&A.mU(a.y)))s=r===8&&A.mU(a.y)
else s=!0
else s=!0
else s=!0
else s=!0
return s},
wU(a){var s
if(!A.bo(a))if(!(a===t._))s=a===t.K
else s=!0
else s=!0
return s},
bo(a){var s=a.x
return s===2||s===3||s===4||s===5||a===t.cK},
pl(a,b){var s,r,q=Object.keys(b),p=q.length
for(s=0;s<p;++s){r=q[s]
a[r]=b[r]}},
mn(a){return a>0?new Array(a):v.typeUniverse.sEA},
aQ:function aQ(a,b){var _=this
_.a=a
_.b=b
_.w=_.r=_.c=null
_.x=0
_.at=_.as=_.Q=_.z=_.y=null},
fG:function fG(){this.c=this.b=this.a=null},
ed:function ed(a){this.a=a},
fF:function fF(){},
ee:function ee(a){this.a=a},
uZ(){var s,r,q={}
if(self.scheduleImmediate!=null)return A.ws()
if(self.MutationObserver!=null&&self.document!=null){s=self.document.createElement("div")
r=self.document.createElement("span")
q.a=null
new self.MutationObserver(A.mH(new A.lO(q),1)).observe(s,{childList:true})
return new A.lN(q,s,r)}else if(self.setImmediate!=null)return A.wt()
return A.wu()},
v_(a){self.scheduleImmediate(A.mH(new A.lP(a),0))},
v0(a){self.setImmediate(A.mH(new A.lQ(a),0))},
v1(a){A.vb(0,a)},
vb(a,b){var s=new A.mj()
s.dc(a,b)
return s},
eu(a){return new A.fz(new A.B($.A,a.h("B<0>")),a.h("fz<0>"))},
eq(a,b){a.$2(0,null)
b.b=!0
return b.a},
da(a,b){A.vI(a,b)},
ep(a,b){b.a2(a)},
eo(a,b){b.bH(A.K(a),A.aR(a))},
vI(a,b){var s,r,q=new A.mp(b),p=new A.mq(b)
if(a instanceof A.B)a.cs(q,p,t.z)
else{s=t.z
if(t.d.b(a))a.ar(0,q,p,s)
else{r=new A.B($.A,t.eI)
r.a=8
r.c=a
r.cs(q,p,s)}}},
ew(a){var s=function(b,c){return function(d,e){while(true)try{b(d,e)
break}catch(r){e=r
d=c}}}(a,1)
return $.A.bX(new A.mG(s))},
m7(a){return new A.d3(a,1)},
bL(){return B.ea},
bM(a){return new A.d3(a,3)},
bQ(a,b){return new A.ec(a,b.h("ec<0>"))},
h8(a,b){var s=A.bS(a,"error",t.K)
return new A.eD(s,b==null?A.eE(a):b)},
eE(a){var s
if(t.Q.b(a)){s=a.gaZ()
if(s!=null)return s}return B.bj},
nr(a,b){var s,r
for(;s=a.a,(s&4)!==0;)a=a.c
if((s&24)!==0){r=b.b7()
b.bv(a)
A.d2(b,r)}else{r=b.c
b.a=b.a&1|4
b.c=a
a.cn(r)}},
d2(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f={},e=f.a=a
for(s=t.d;!0;){r={}
q=e.a
p=(q&16)===0
o=!p
if(b==null){if(o&&(q&1)===0){e=e.c
A.de(e.a,e.b)}return}r.a=b
n=b.a
for(e=b;n!=null;e=n,n=m){e.a=null
A.d2(f.a,e)
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
if(q){A.de(l.a,l.b)
return}i=$.A
if(i!==j)$.A=j
else i=null
e=e.c
if((e&15)===8)new A.m5(r,f,o).$0()
else if(p){if((e&1)!==0)new A.m4(r,l).$0()}else if((e&2)!==0)new A.m3(f,r).$0()
if(i!=null)$.A=i
e=r.c
if(s.b(e)){q=r.a.$ti
q=q.h("a5<2>").b(e)||!q.z[1].b(e)}else q=!1
if(q){h=r.a.b
if(e instanceof A.B)if((e.a&24)!==0){g=h.c
h.c=null
b=h.b8(g)
h.a=e.a&30|h.a&1
h.c=e.c
f.a=e
continue}else A.nr(e,h)
else h.c9(e)
return}}h=r.a.b
g=h.c
h.c=null
b=h.b8(g)
e=r.b
q=r.c
if(!e){h.a=8
h.c=q}else{h.a=h.a&1|16
h.c=q}f.a=h
e=h}},
wc(a,b){if(t.C.b(a))return b.bX(a)
if(t.v.b(a))return a
throw A.d(A.h5(a,"onError",u.c))},
w8(){var s,r
for(s=$.dd;s!=null;s=$.dd){$.et=null
r=s.b
$.dd=r
if(r==null)$.es=null
s.a.$0()}},
wf(){$.nB=!0
try{A.w8()}finally{$.et=null
$.nB=!1
if($.dd!=null)$.o9().$1(A.pC())}},
pz(a){var s=new A.fA(a),r=$.es
if(r==null){$.dd=$.es=s
if(!$.nB)$.o9().$1(A.pC())}else $.es=r.b=s},
we(a){var s,r,q,p=$.dd
if(p==null){A.pz(a)
$.et=$.es
return}s=new A.fA(a)
r=$.et
if(r==null){s.b=p
$.dd=$.et=s}else{q=r.b
s.b=q
$.et=r.b=s
if(q==null)$.es=s}},
pT(a){var s=null,r=$.A
if(B.i===r){A.df(s,s,B.i,a)
return}A.df(s,s,r,r.cu(a))},
np(a,b){var s=null,r=b.h("b_<0>"),q=new A.b_(s,s,s,s,r)
q.aH(a)
q.aI()
return new A.ah(q,r.h("ah<1>"))},
uS(a,b){var s=null,r=b.h("d8<0>"),q=new A.d8(s,s,s,s,r)
a.ar(0,new A.lf(q,b),new A.lg(q),t.P)
return new A.ah(q,r.h("ah<1>"))},
A7(a){A.bS(a,"stream",t.K)
return new A.fN()},
oU(a,b,c,d){return new A.b_(null,b,c,a,d.h("b_<0>"))},
nD(a){var s,r,q
if(a==null)return
try{a.$0()}catch(q){s=A.K(q)
r=A.aR(q)
A.de(s,r)}},
v5(a,b){if(b==null)b=A.wv()
if(t.k.b(b))return a.bX(b)
if(t.d5.b(b))return b
throw A.d(A.R("handleError callback must take either an Object (the error), or both an Object (the error) and a StackTrace.",null))},
w9(a,b){A.de(a,b)},
de(a,b){A.we(new A.mD(a,b))},
pv(a,b,c,d){var s,r=$.A
if(r===c)return d.$0()
$.A=c
s=r
try{r=d.$0()
return r}finally{$.A=s}},
px(a,b,c,d,e){var s,r=$.A
if(r===c)return d.$1(e)
$.A=c
s=r
try{r=d.$1(e)
return r}finally{$.A=s}},
pw(a,b,c,d,e,f){var s,r=$.A
if(r===c)return d.$2(e,f)
$.A=c
s=r
try{r=d.$2(e,f)
return r}finally{$.A=s}},
df(a,b,c,d){if(B.i!==c)d=c.cu(d)
A.pz(d)},
lO:function lO(a){this.a=a},
lN:function lN(a,b,c){this.a=a
this.b=b
this.c=c},
lP:function lP(a){this.a=a},
lQ:function lQ(a){this.a=a},
mj:function mj(){},
mk:function mk(a,b){this.a=a
this.b=b},
fz:function fz(a,b){this.a=a
this.b=!1
this.$ti=b},
mp:function mp(a){this.a=a},
mq:function mq(a){this.a=a},
mG:function mG(a){this.a=a},
d3:function d3(a,b){this.a=a
this.b=b},
aG:function aG(a,b){var _=this
_.a=a
_.d=_.c=_.b=null
_.$ti=b},
ec:function ec(a,b){this.a=a
this.$ti=b},
eD:function eD(a,b){this.a=a
this.b=b},
fC:function fC(){},
ay:function ay(a,b){this.a=a
this.$ti=b},
bK:function bK(a,b,c,d,e){var _=this
_.a=null
_.b=a
_.c=b
_.d=c
_.e=d
_.$ti=e},
B:function B(a,b){var _=this
_.a=0
_.b=a
_.c=null
_.$ti=b},
lW:function lW(a,b){this.a=a
this.b=b},
m2:function m2(a,b){this.a=a
this.b=b},
lZ:function lZ(a){this.a=a},
m_:function m_(a){this.a=a},
m0:function m0(a,b,c){this.a=a
this.b=b
this.c=c},
lY:function lY(a,b){this.a=a
this.b=b},
m1:function m1(a,b){this.a=a
this.b=b},
lX:function lX(a,b,c){this.a=a
this.b=b
this.c=c},
m5:function m5(a,b,c){this.a=a
this.b=b
this.c=c},
m6:function m6(a){this.a=a},
m4:function m4(a,b){this.a=a
this.b=b},
m3:function m3(a,b){this.a=a
this.b=b},
fA:function fA(a){this.a=a
this.b=null},
bg:function bg(){},
lf:function lf(a,b){this.a=a
this.b=b},
lg:function lg(a){this.a=a},
lh:function lh(a,b){this.a=a
this.b=b},
li:function li(a,b){this.a=a
this.b=b},
fo:function fo(){},
d7:function d7(){},
mi:function mi(a){this.a=a},
mh:function mh(a){this.a=a},
fP:function fP(){},
fB:function fB(){},
b_:function b_(a,b,c,d,e){var _=this
_.a=null
_.b=0
_.c=null
_.d=a
_.e=b
_.f=c
_.r=d
_.$ti=e},
d8:function d8(a,b,c,d,e){var _=this
_.a=null
_.b=0
_.c=null
_.d=a
_.e=b
_.f=c
_.r=d
_.$ti=e},
ah:function ah(a,b){this.a=a
this.$ti=b},
dT:function dT(a,b,c,d,e,f){var _=this
_.w=a
_.a=b
_.b=c
_.c=d
_.d=e
_.e=f
_.r=_.f=null},
dP:function dP(){},
lT:function lT(a,b,c){this.a=a
this.b=b
this.c=c},
lS:function lS(a){this.a=a},
e9:function e9(){},
fE:function fE(){},
cD:function cD(a){this.b=a
this.a=null},
dU:function dU(a,b){this.b=a
this.c=b
this.a=null},
lU:function lU(){},
fK:function fK(){},
md:function md(a,b){this.a=a
this.b=b},
ea:function ea(){this.c=this.b=null
this.a=0},
fN:function fN(){},
mo:function mo(){},
mD:function mD(a,b){this.a=a
this.b=b},
mf:function mf(){},
mg:function mg(a,b){this.a=a
this.b=b},
p6(a,b){var s=a[b]
return s===a?null:s},
ns(a,b,c){if(c==null)a[b]=a
else a[b]=c},
p7(){var s=Object.create(null)
A.ns(s,"<non-identifier-key>",s)
delete s["<non-identifier-key>"]
return s},
ur(a,b,c,d){return A.v6(A.wC(),a,b,c,d)},
nm(a,b,c){return A.pF(a,new A.aE(b.h("@<0>").I(c).h("aE<1,2>")))},
a8(a,b){return new A.aE(a.h("@<0>").I(b).h("aE<1,2>"))},
v6(a,b,c,d,e){var s=c!=null?c:new A.ma(d)
return new A.e1(a,b,s,d.h("@<0>").I(e).h("e1<1,2>"))},
ox(a){return new A.b0(a.h("b0<0>"))},
aN(a){return new A.b0(a.h("b0<0>"))},
aO(a,b){return A.wI(a,new A.b0(b.h("b0<0>")))},
nt(){var s=Object.create(null)
s["<non-identifier-key>"]=s
delete s["<non-identifier-key>"]
return s},
vN(a,b){return J.aj(a,b)},
u4(a,b,c){var s,r
if(A.nC(a)){if(b==="("&&c===")")return"(...)"
return b+"..."+c}s=A.a([],t.s)
$.cE.push(a)
try{A.w5(a,s)}finally{$.cE.pop()}r=A.nq(b,s,", ")+c
return r.charCodeAt(0)==0?r:r},
iH(a,b,c){var s,r
if(A.nC(a))return b+"..."+c
s=new A.ab(b)
$.cE.push(a)
try{r=s
r.a=A.nq(r.a,a,", ")}finally{$.cE.pop()}s.a+=c
r=s.a
return r.charCodeAt(0)==0?r:r},
nC(a){var s,r
for(s=$.cE.length,r=0;r<s;++r)if(a===$.cE[r])return!0
return!1},
w5(a,b){var s,r,q,p,o,n,m,l=a.gD(a),k=0,j=0
while(!0){if(!(k<80||j<3))break
if(!l.p())return
s=A.b(l.gt())
b.push(s)
k+=s.length+2;++j}if(!l.p()){if(j<=5)return
r=b.pop()
q=b.pop()}else{p=l.gt();++j
if(!l.p()){if(j<=4){b.push(A.b(p))
return}r=A.b(p)
q=b.pop()
k+=r.length+2}else{o=l.gt();++j
for(;l.p();p=o,o=n){n=l.gt();++j
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
us(a,b){var s,r,q=A.ox(b)
for(s=a.length,r=0;r<a.length;a.length===s||(0,A.cI)(a),++r)q.C(0,b.a(a[r]))
return q},
nn(a){var s,r={}
if(A.nC(a))return"{...}"
s=new A.ab("")
try{$.cE.push(a)
s.a+="{"
r.a=!0
a.L(0,new A.jK(r,s))
s.a+="}"}finally{$.cE.pop()}r=s.a
return r.charCodeAt(0)==0?r:r},
vo(){throw A.d(A.ac("Cannot change an unmodifiable set"))},
dY:function dY(){},
e0:function e0(a){var _=this
_.a=0
_.e=_.d=_.c=_.b=null
_.$ti=a},
dZ:function dZ(a,b){this.a=a
this.$ti=b},
e_:function e_(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
e1:function e1(a,b,c,d){var _=this
_.w=a
_.x=b
_.y=c
_.a=0
_.f=_.e=_.d=_.c=_.b=null
_.r=0
_.$ti=d},
ma:function ma(a){this.a=a},
b0:function b0(a){var _=this
_.a=0
_.f=_.e=_.d=_.c=_.b=null
_.r=0
_.$ti=a},
mb:function mb(a){this.a=a
this.c=this.b=null},
e2:function e2(a,b,c){var _=this
_.a=a
_.b=b
_.d=_.c=null
_.$ti=c},
aY:function aY(a,b){this.a=a
this.$ti=b},
du:function du(){},
dy:function dy(){},
n:function n(){},
dz:function dz(){},
jK:function jK(a,b){this.a=a
this.b=b},
I:function I(){},
jL:function jL(a){this.a=a},
fS:function fS(){},
dA:function dA(){},
bk:function bk(a,b){this.a=a
this.$ti=b},
cY:function cY(){},
d5:function d5(){},
fT:function fT(){},
ei:function ei(a,b){this.a=a
this.$ti=b},
e3:function e3(){},
eh:function eh(){},
em:function em(){},
en:function en(){},
pu(a,b){var s,r,q,p=null
try{p=JSON.parse(a)}catch(r){s=A.K(r)
q=A.P(String(s),null,null)
throw A.d(q)}q=A.ms(p)
return q},
ms(a){var s
if(a==null)return null
if(typeof a!="object")return a
if(Object.getPrototypeOf(a)!==Array.prototype)return new A.fI(a,Object.create(null))
for(s=0;s<a.length;++s)a[s]=A.ms(a[s])
return a},
uX(a,b,c,d){var s,r
if(b instanceof Uint8Array){s=b
d=s.length
if(d-c<15)return null
r=A.uY(a,s,c,d)
if(r!=null&&a)if(r.indexOf("\ufffd")>=0)return null
return r}return null},
uY(a,b,c,d){var s=a?$.t8():$.t7()
if(s==null)return null
if(0===c&&d===b.length)return A.p0(s,b)
return A.p0(s,b.subarray(c,A.aP(c,d,b.length)))},
p0(a,b){var s,r
try{s=a.decode(b)
return s}catch(r){}return null},
oj(a,b,c,d,e,f){if(B.c.bo(f,4)!==0)throw A.d(A.P("Invalid base64 padding, padded length must be multiple of four, is "+f,a,c))
if(d+e!==f)throw A.d(A.P("Invalid base64 padding, '=' not at the end",a,b))
if(e>2)throw A.d(A.P("Invalid base64 padding, more than two '=' characters",a,b))},
v4(a,b,c,d,e,f){var s,r,q,p,o,n,m="Invalid encoding before padding",l="Invalid character",k=B.c.ag(f,2),j=f&3,i=$.oa()
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
if(j===3){if((k&3)!==0)throw A.d(A.P(m,a,s))
d[e]=k>>>10
d[e+1]=k>>>2}else{if((k&15)!==0)throw A.d(A.P(m,a,s))
d[e]=k>>>4}n=(3-j)*3
if(q===37)n+=2
return A.p4(a,s+1,c,-n-1)}throw A.d(A.P(l,a,s))}if(r>=0&&r<=127)return(k<<2|j)>>>0
for(s=b;s<c;++s){q=B.a.B(a,s)
if(q>127)break}throw A.d(A.P(l,a,s))},
v2(a,b,c,d){var s=A.v3(a,b,c),r=(d&3)+(s-b),q=B.c.ag(r,2)*3,p=r&3
if(p!==0&&s<c)q+=p-1
if(q>0)return new Uint8Array(q)
return $.t9()},
v3(a,b,c){var s,r=c,q=r,p=0
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
p4(a,b,c,d){var s,r
if(b===c)return d
s=-d-1
for(;s>0;){r=B.a.B(a,b)
if(s===3){if(r===61){s-=3;++b
break}if(r===37){--s;++b
if(b===c)break
r=B.a.B(a,b)}else break}if((s>3?s-3:s)===2){if(r!==51)break;++b;--s
if(b===c)break
r=B.a.B(a,b)}if((r|32)!==100)break;++b;--s
if(b===c)break}if(b!==c)throw A.d(A.P("Invalid padding character",a,b))
return-s-1},
pk(a){switch(a){case 65:return"Missing extension byte"
case 67:return"Unexpected extension byte"
case 69:return"Invalid UTF-8 byte"
case 71:return"Overlong encoding"
case 73:return"Out of unicode range"
case 75:return"Encoded surrogate"
case 77:return"Unfinished UTF-8 octet sequence"
default:return""}},
vF(a,b,c){var s,r,q,p=c-b,o=new Uint8Array(p)
for(s=J.T(a),r=0;r<p;++r){q=s.j(a,b+r)
o[r]=(q&4294967040)>>>0!==0?255:q}return o},
fI:function fI(a,b){this.a=a
this.b=b
this.c=null},
fJ:function fJ(a){this.a=a},
m9:function m9(a,b,c){this.b=a
this.c=b
this.a=c},
lv:function lv(){},
lu:function lu(){},
h9:function h9(){},
hb:function hb(){},
ha:function ha(){},
lR:function lR(){this.a=0},
hc:function hc(){},
eF:function eF(){},
fL:function fL(a,b,c){this.a=a
this.b=b
this.$ti=c},
eJ:function eJ(){},
eL:function eL(){},
hV:function hV(){},
iP:function iP(){},
iQ:function iQ(a){this.a=a},
lj:function lj(){},
lk:function lk(){},
eb:function eb(){},
mm:function mm(a,b,c){this.a=a
this.b=b
this.c=c},
ls:function ls(){},
lt:function lt(a){this.a=a},
fU:function fU(a){this.a=a
this.b=16
this.c=0},
cH(a,b){var s=A.oP(a,b)
if(s!=null)return s
throw A.d(A.P(a,null,null))},
tT(a){if(a instanceof A.c6)return a.k(0)
return"Instance of '"+A.b(A.k5(a))+"'"},
tU(a,b){a=A.d(a)
a.stack=J.aq(b)
throw a
throw A.d("unreachable")},
S(a,b,c,d){var s,r=J.b8(a,d)
if(a!==0&&b!=null)for(s=0;s<a;++s)r[s]=b
return r},
ut(a,b){var s,r=A.a([],b.h("D<0>"))
for(s=a.gD(a);s.p();)r.push(s.gt())
return r},
ct(a,b,c){var s
if(b)return A.oy(a,c)
s=J.nj(A.oy(a,c))
return s},
oy(a,b){var s,r
if(Array.isArray(a))return A.a(a.slice(0),b.h("D<0>"))
s=A.a([],b.h("D<0>"))
for(r=J.aC(a);r.p();)s.push(r.gt())
return s},
oz(a,b,c,d){var s,r=J.b8(a,d)
for(s=0;s<a;++s)r[s]=b.$1(s)
return r},
oV(a,b,c){if(t.bm.b(a))return A.uL(a,b,A.aP(b,c,a.length))
return A.uT(a,b,c)},
uT(a,b,c){var s,r,q,p,o=null
if(b<0)throw A.d(A.X(b,0,a.length,o,o))
s=c==null
if(!s&&c<b)throw A.d(A.X(c,b,a.length,o,o))
r=new A.a9(a,a.length,A.ai(a).h("a9<n.E>"))
for(q=0;q<b;++q)if(!r.p())throw A.d(A.X(b,0,q,o,o))
p=[]
if(s)for(;r.p();)p.push(r.d)
else for(q=b;q<c;++q){if(!r.p())throw A.d(A.X(c,b,q,o,o))
p.push(r.d)}return A.uJ(p)},
oQ(a){return new A.iJ(a,A.u7(a,!1,!0,!1,!1,!1))},
nq(a,b,c){var s=J.aC(b)
if(!s.p())return a
if(c.length===0){do a+=A.b(s.gt())
while(s.p())}else{a+=A.b(s.gt())
for(;s.p();)a=a+c+A.b(s.gt())}return a},
oG(a,b,c,d){return new A.fb(a,b,c,d)},
op(a){var s=Math.abs(a),r=a<0?"-":""
if(s>=1000)return""+a
if(s>=100)return r+"0"+s
if(s>=10)return r+"00"+s
return r+"000"+s},
tS(a){var s=Math.abs(a),r=a<0?"-":"+"
if(s>=1e5)return r+s
return r+"0"+s},
oq(a){if(a>=100)return""+a
if(a>=10)return"0"+a
return"00"+a},
b6(a){if(a>=10)return""+a
return"0"+a},
cO(a){if(typeof a=="number"||A.er(a)||a==null)return J.aq(a)
if(typeof a=="string")return JSON.stringify(a)
return A.tT(a)},
tV(a,b){A.bS(a,"error",t.K)
A.bS(b,"stackTrace",t.gm)
A.tU(a,b)
A.aW(u.g)},
h7(a){return new A.eC(a)},
R(a,b){return new A.ar(!1,null,b,a)},
h5(a,b,c){return new A.ar(!0,a,b,c)},
h6(a,b){return a},
X(a,b,c,d,e){return new A.dI(b,c,!0,a,d,"Invalid value")},
aP(a,b,c){if(0>a||a>c)throw A.d(A.X(a,0,c,"start",null))
if(b!=null){if(a>b||b>c)throw A.d(A.X(b,a,c,"end",null))
return b}return c},
aV(a,b){if(a<0)throw A.d(A.X(a,0,null,b,null))
return a},
eS(a,b,c,d,e){var s=e==null?J.a3(b):e
return new A.eR(s,!0,a,c,"Index out of range")},
ac(a){return new A.fv(a)},
oX(a){return new A.fq(a)},
cZ(a){return new A.bG(a)},
af(a){return new A.eK(a)},
tW(a){return new A.dW(a)},
P(a,b,c){return new A.aI(a,b,c)},
ot(a,b,c){if(a<=0)return new A.b7(c.h("b7<0>"))
return new A.dX(a,b,c.h("dX<0>"))},
oA(a,b,c,d,e){return new A.c5(a,b.h("@<0>").I(c).I(d).I(e).h("c5<1,2,3,4>"))},
k1(a){var s,r,q=$.ta()
for(s=a.length,r=0;r<s;++r){q=q+J.bW(a[r])&536870911
q=q+((q&524287)<<10)&536870911
q^=q>>>6}q=q+((q&67108863)<<3)&536870911
q^=q>>>11
return q+((q&16383)<<15)&536870911},
oZ(a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4=null,a5=a6.length
if(a5>=5){s=A.pA(a6,0)
if(s===0){r=A.lo(a5<a5?B.a.u(a6,0,a5):a6,5,a4)
return r.gbl(r)}else if(s===32){r=A.lo(B.a.u(a6,5,a5),0,a4)
return r.gbl(r)}}q=A.S(8,0,!1,t.S)
q[0]=0
q[1]=-1
q[2]=-1
q[7]=-1
q[3]=0
q[4]=0
q[5]=a5
q[6]=a5
if(A.py(a6,0,a5,0,q)>=14)q[7]=a5
p=q[1]
if(p>=0)if(A.py(a6,0,p,20,q)===20)q[7]=p
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
j=!1}else{if(!(l<a5&&l===m+2&&B.a.X(a6,"..",m)))h=l>m+2&&B.a.X(a6,"/..",l-3)
else h=!0
if(h){i=a4
j=!1}else{if(p===4)if(B.a.X(a6,"file",0)){if(o<=0){if(!B.a.X(a6,"/",m)){g="file:///"
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
a6=B.a.aF(a6,m,l,"/");++a5
l=e}i="file"}else if(B.a.X(a6,"http",0)){if(r&&n+3===m&&B.a.X(a6,"80",n+1)){k-=3
d=m-3
l-=3
a6=B.a.aF(a6,n,m,"")
a5-=3
m=d}i="http"}else i=a4
else if(p===5&&B.a.X(a6,"https",0)){if(r&&n+4===m&&B.a.X(a6,"443",n+1)){k-=4
d=m-4
l-=4
a6=B.a.aF(a6,n,m,"")
a5-=3
m=d}i="https"}else i=a4
j=!0}}}else i=a4
if(j){if(a5<a6.length){a6=B.a.u(a6,0,a5)
p-=0
o-=0
n-=0
m-=0
l-=0
k-=0}return new A.fM(a6,p,o,n,m,l,k,i)}if(i==null)if(p>0)i=A.vy(a6,0,p)
else{if(p===0){A.d9(a6,0,"Invalid empty scheme")
A.aW(u.g)}i=""}if(o>0){c=p+3
b=c<o?A.vz(a6,c,o-1):""
a=A.vu(a6,o,n,!1)
r=n+1
if(r<m){a0=A.oP(B.a.u(a6,r,m),a4)
a1=A.vw(a0==null?A.a0(A.P("Invalid port",a6,r)):a0,i)}else a1=a4}else{a1=a4
a=a1
b=""}a2=A.vv(a6,m,l,a4,i,a!=null)
a3=l<k?A.vx(a6,l+1,k,a4):a4
return A.vp(i,b,a,a1,a2,a3,k<a5?A.vt(a6,k+1,a5):a4)},
uW(a,b,c){var s,r,q,p,o,n,m="IPv4 address should contain exactly 4 parts",l="each part must be in the range 0..255",k=new A.lp(a),j=new Uint8Array(4)
for(s=b,r=s,q=0;s<c;++s){p=B.a.B(a,s)
if(p!==46){if((p^48)>9)k.$2("invalid character",s)}else{if(q===3)k.$2(m,s)
o=A.cH(B.a.u(a,r,s),null)
if(o>255)k.$2(l,r)
n=q+1
j[q]=o
r=s+1
q=n}}if(q!==3)k.$2(m,c)
o=A.cH(B.a.u(a,r,c),null)
if(o>255)k.$2(l,r)
j[q]=o
return j},
p_(a,b,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=null,d=new A.lq(a),c=new A.lr(d,a)
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
l=B.d.gaS(s)
if(m&&l!==-1)d.$2("expected a part after last `:`",a0)
if(!m)if(!o)s.push(c.$2(q,a0))
else{k=A.uW(a,q,a0)
s.push((k[0]<<8|k[1])>>>0)
s.push((k[2]<<8|k[3])>>>0)}if(p){if(s.length>7)d.$2("an address with a wildcard must have less than 7 parts",e)}else if(s.length!==8)d.$2("an address without a wildcard must contain exactly 8 parts",e)
j=new Uint8Array(16)
for(l=s.length,i=9-l,r=0,h=0;r<l;++r){g=s[r]
if(g===-1)for(f=0;f<i;++f){j[h]=0
j[h+1]=0
h+=2}else{j[h]=B.c.ag(g,8)
j[h+1]=g&255
h+=2}}return j},
vp(a,b,c,d,e,f,g){return new A.ej(a,b,c,d,e,f,g)},
pe(a){if(a==="http")return 80
if(a==="https")return 443
return 0},
d9(a,b,c){throw A.d(A.P(c,a,b))},
vw(a,b){var s=A.pe(b)
if(a===s)return null
return a},
vu(a,b,c,d){var s,r,q,p,o,n
if(b===c)return""
if(B.a.B(a,b)===91){s=c-1
if(B.a.B(a,s)!==93){A.d9(a,b,"Missing end `]` to match `[` in host")
A.aW(u.g)}r=b+1
q=A.vr(a,r,s)
if(q<s){p=q+1
o=A.pj(a,B.a.X(a,"25",p)?q+3:p,s,"%25")}else o=""
A.p_(a,r,q)
return B.a.u(a,b,q).toLowerCase()+o+"]"}for(n=b;n<c;++n)if(B.a.B(a,n)===58){q=B.a.bd(a,"%",b)
q=q>=b&&q<c?q:c
if(q<c){p=q+1
o=A.pj(a,B.a.X(a,"25",p)?q+3:p,c,"%25")}else o=""
A.p_(a,b,q)
return"["+B.a.u(a,b,q)+o+"]"}return A.vB(a,b,c)},
vr(a,b,c){var s=B.a.bd(a,"%",b)
return s>=b&&s<c?s:c},
pj(a,b,c,d){var s,r,q,p,o,n,m,l,k,j,i=d!==""?new A.ab(d):null
for(s=b,r=s,q=!0;s<c;){p=B.a.B(a,s)
if(p===37){o=A.nz(a,s,!0)
n=o==null
if(n&&q){s+=3
continue}if(i==null)i=new A.ab("")
m=i.a+=B.a.u(a,r,s)
if(n)o=B.a.u(a,s,s+3)
else if(o==="%"){A.d9(a,s,"ZoneID should not contain % anymore")
A.aW(u.g)}i.a=m+o
s+=3
r=s
q=!0}else if(p<127&&(B.au[p>>>4]&1<<(p&15))!==0){if(q&&65<=p&&90>=p){if(i==null)i=new A.ab("")
if(r<s){i.a+=B.a.u(a,r,s)
r=s}q=!1}++s}else{if((p&64512)===55296&&s+1<c){l=B.a.B(a,s+1)
if((l&64512)===56320){p=(p&1023)<<10|l&1023|65536
k=2}else k=1}else k=1
j=B.a.u(a,r,s)
if(i==null){i=new A.ab("")
n=i}else n=i
n.a+=j
n.a+=A.ny(p)
s+=k
r=s}}if(i==null)return B.a.u(a,b,c)
if(r<c)i.a+=B.a.u(a,r,c)
n=i.a
return n.charCodeAt(0)==0?n:n},
vB(a,b,c){var s,r,q,p,o,n,m,l,k,j,i
for(s=b,r=s,q=null,p=!0;s<c;){o=B.a.B(a,s)
if(o===37){n=A.nz(a,s,!0)
m=n==null
if(m&&p){s+=3
continue}if(q==null)q=new A.ab("")
l=B.a.u(a,r,s)
k=q.a+=!p?l.toLowerCase():l
if(m){n=B.a.u(a,s,s+3)
j=3}else if(n==="%"){n="%25"
j=1}else j=3
q.a=k+n
s+=j
r=s
p=!0}else if(o<127&&(B.d_[o>>>4]&1<<(o&15))!==0){if(p&&65<=o&&90>=o){if(q==null)q=new A.ab("")
if(r<s){q.a+=B.a.u(a,r,s)
r=s}p=!1}++s}else if(o<=93&&(B.am[o>>>4]&1<<(o&15))!==0){A.d9(a,s,"Invalid character")
A.aW(u.g)}else{if((o&64512)===55296&&s+1<c){i=B.a.B(a,s+1)
if((i&64512)===56320){o=(o&1023)<<10|i&1023|65536
j=2}else j=1}else j=1
l=B.a.u(a,r,s)
if(!p)l=l.toLowerCase()
if(q==null){q=new A.ab("")
m=q}else m=q
m.a+=l
m.a+=A.ny(o)
s+=j
r=s}}if(q==null)return B.a.u(a,b,c)
if(r<c){l=B.a.u(a,r,c)
q.a+=!p?l.toLowerCase():l}m=q.a
return m.charCodeAt(0)==0?m:m},
vy(a,b,c){var s,r,q,p=u.g
if(b===c)return""
if(!A.pg(B.a.J(a,b))){A.d9(a,b,"Scheme not starting with alphabetic character")
A.aW(p)}for(s=b,r=!1;s<c;++s){q=B.a.J(a,s)
if(!(q<128&&(B.ar[q>>>4]&1<<(q&15))!==0)){A.d9(a,s,"Illegal scheme character")
A.aW(p)}if(65<=q&&q<=90)r=!0}a=B.a.u(a,b,c)
return A.vq(r?a.toLowerCase():a)},
vq(a){if(a==="http")return"http"
if(a==="file")return"file"
if(a==="https")return"https"
if(a==="package")return"package"
return a},
vz(a,b,c){return A.ek(a,b,c,B.cF,!1)},
vv(a,b,c,d,e,f){var s=e==="file",r=s||f,q=A.ek(a,b,c,B.aw,!0)
if(q.length===0){if(s)return"/"}else if(r&&!B.a.W(q,"/"))q="/"+q
return A.vA(q,e,f)},
vA(a,b,c){var s=b.length===0
if(s&&!c&&!B.a.W(a,"/"))return A.vC(a,!s||c)
return A.vD(a)},
vx(a,b,c,d){return A.ek(a,b,c,B.D,!0)},
vt(a,b,c){return A.ek(a,b,c,B.D,!0)},
nz(a,b,c){var s,r,q,p,o,n=b+2
if(n>=a.length)return"%"
s=B.a.B(a,b+1)
r=B.a.B(a,n)
q=A.mP(s)
p=A.mP(r)
if(q<0||p<0)return"%"
o=q*16+p
if(o<127&&(B.au[B.c.ag(o,4)]&1<<(o&15))!==0)return A.bd(c&&65<=o&&90>=o?(o|32)>>>0:o)
if(s>=97||r>=97)return B.a.u(a,b,b+3).toUpperCase()
return null},
ny(a){var s,r,q,p,o,n="0123456789ABCDEF"
if(a<128){s=new Uint8Array(3)
s[0]=37
s[1]=B.a.J(n,a>>>4)
s[2]=B.a.J(n,a&15)}else{if(a>2047)if(a>65535){r=240
q=4}else{r=224
q=3}else{r=192
q=2}s=new Uint8Array(3*q)
for(p=0;--q,q>=0;r=128){o=B.c.dP(a,6*q)&63|r
s[p]=37
s[p+1]=B.a.J(n,o>>>4)
s[p+2]=B.a.J(n,o&15)
p+=3}}return A.oV(s,0,null)},
ek(a,b,c,d,e){var s=A.pi(a,b,c,d,e)
return s==null?B.a.u(a,b,c):s},
pi(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j,i=null
for(s=!e,r=b,q=r,p=i;r<c;){o=B.a.B(a,r)
if(o<127&&(d[o>>>4]&1<<(o&15))!==0)++r
else{if(o===37){n=A.nz(a,r,!1)
if(n==null){r+=3
continue}if("%"===n){n="%25"
m=1}else m=3}else if(s&&o<=93&&(B.am[o>>>4]&1<<(o&15))!==0){A.d9(a,r,"Invalid character")
A.aW(u.g)
m=i
n=m}else{if((o&64512)===55296){l=r+1
if(l<c){k=B.a.B(a,l)
if((k&64512)===56320){o=(o&1023)<<10|k&1023|65536
m=2}else m=1}else m=1}else m=1
n=A.ny(o)}if(p==null){p=new A.ab("")
l=p}else l=p
j=l.a+=B.a.u(a,q,r)
l.a=j+A.b(n)
r+=m
q=r}}if(p==null)return i
if(q<c)p.a+=B.a.u(a,q,c)
s=p.a
return s.charCodeAt(0)==0?s:s},
ph(a){if(B.a.W(a,"."))return!0
return B.a.bN(a,"/.")!==-1},
vD(a){var s,r,q,p,o,n
if(!A.ph(a))return a
s=A.a([],t.s)
for(r=a.split("/"),q=r.length,p=!1,o=0;o<q;++o){n=r[o]
if(J.aj(n,"..")){if(s.length!==0){s.pop()
if(s.length===0)s.push("")}p=!0}else if("."===n)p=!0
else{s.push(n)
p=!1}}if(p)s.push("")
return B.d.cM(s,"/")},
vC(a,b){var s,r,q,p,o,n
if(!A.ph(a))return!b?A.pf(a):a
s=A.a([],t.s)
for(r=a.split("/"),q=r.length,p=!1,o=0;o<q;++o){n=r[o]
if(".."===n)if(s.length!==0&&B.d.gaS(s)!==".."){s.pop()
p=!0}else{s.push("..")
p=!1}else if("."===n)p=!0
else{s.push(n)
p=!1}}r=s.length
if(r!==0)r=r===1&&s[0].length===0
else r=!0
if(r)return"./"
if(p||B.d.gaS(s)==="..")s.push("")
if(!b)s[0]=A.pf(s[0])
return B.d.cM(s,"/")},
pf(a){var s,r,q=a.length
if(q>=2&&A.pg(B.a.J(a,0)))for(s=1;s<q;++s){r=B.a.J(a,s)
if(r===58)return B.a.u(a,0,s)+"%3A"+B.a.br(a,s+1)
if(r>127||(B.ar[r>>>4]&1<<(r&15))===0)break}return a},
vs(a,b){var s,r,q
for(s=0,r=0;r<2;++r){q=B.a.B(a,b+r)
if(48<=q&&q<=57)s=s*16+q-48
else{q|=32
if(97<=q&&q<=102)s=s*16+q-87
else throw A.d(A.R("Invalid URL encoding",null))}}return s},
vE(a,b,c,d,e){var s,r,q,p,o=b
while(!0){if(!(o<c)){s=!0
break}r=B.a.B(a,o)
if(r<=127)if(r!==37)q=!1
else q=!0
else q=!0
if(q){s=!1
break}++o}if(s){if(B.ab!==d)q=!1
else q=!0
if(q)return B.a.u(a,b,c)
else p=new A.cL(B.a.u(a,b,c))}else{p=A.a([],t.Z)
for(q=a.length,o=b;o<c;++o){r=B.a.B(a,o)
if(r>127)throw A.d(A.R("Illegal percent encoding in URI",null))
if(r===37){if(o+3>q)throw A.d(A.R("Truncated URI",null))
p.push(A.vs(a,o+1))
o+=2}else p.push(r)}}return B.e8.dW(p)},
pg(a){var s=a|32
return 97<=s&&s<=122},
oY(a){var s
if(a.length>=5){s=A.pA(a,0)
if(s===0)return A.lo(a,5,null)
if(s===32)return A.lo(B.a.br(a,5),0,null)}throw A.d(A.P("Does not start with 'data:'",a,0))},
lo(a,b,c){var s,r,q,p,o,n,m,l,k="Invalid MIME type",j=A.a([b-1],t.Z)
for(s=a.length,r=b,q=-1,p=null;r<s;++r){p=B.a.J(a,r)
if(p===44||p===59)break
if(p===47){if(q<0){q=r
continue}throw A.d(A.P(k,a,r))}}if(q<0&&r>b)throw A.d(A.P(k,a,r))
for(;p!==44;){j.push(r);++r
for(o=-1;r<s;++r){p=B.a.J(a,r)
if(p===61){if(o<0)o=r}else if(p===59||p===44)break}if(o>=0)j.push(o)
else{n=B.d.gaS(j)
if(p!==44||r!==n+7||!B.a.X(a,"base64",n+1))throw A.d(A.P("Expecting '='",a,r))
break}}j.push(r)
m=r+1
if((j.length&1)===1)a=B.b6.ea(a,m,s)
else{l=A.pi(a,m,s,B.D,!0)
if(l!=null)a=B.a.aF(a,m,s,l)}return new A.ln(a,j,c)},
vM(){var s,r,q,p,o,n="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~!$&'()*+,;=",m=".",l=":",k="/",j="?",i="#",h=A.a(new Array(22),t.gN)
for(s=0;s<22;++s)h[s]=new Uint8Array(96)
r=new A.mt(h)
q=new A.mu()
p=new A.mv()
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
py(a,b,c,d,e){var s,r,q,p,o=$.te()
for(s=b;s<c;++s){r=o[d]
q=B.a.J(a,s)^96
p=r[q>95?31:q]
d=p&31
e[p>>>5]=s}return d},
pA(a,b){return((B.a.J(a,b+4)^58)*3|B.a.J(a,b)^100|B.a.J(a,b+1)^97|B.a.J(a,b+2)^116|B.a.J(a,b+3)^97)>>>0},
jY:function jY(a,b){this.a=a
this.b=b},
dm:function dm(a,b){this.a=a
this.b=b},
lV:function lV(){},
G:function G(){},
eC:function eC(a){this.a=a},
aX:function aX(){},
fd:function fd(){},
ar:function ar(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
dI:function dI(a,b,c,d,e,f){var _=this
_.e=a
_.f=b
_.a=c
_.b=d
_.c=e
_.d=f},
eR:function eR(a,b,c,d,e){var _=this
_.f=a
_.a=b
_.b=c
_.c=d
_.d=e},
fb:function fb(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
fv:function fv(a){this.a=a},
fq:function fq(a){this.a=a},
bG:function bG(a){this.a=a},
eK:function eK(a){this.a=a},
ff:function ff(){},
dK:function dK(){},
eM:function eM(a){this.a=a},
dW:function dW(a){this.a=a},
aI:function aI(a,b,c){this.a=a
this.b=b
this.c=c},
j:function j(){},
dX:function dX(a,b,c){this.a=a
this.b=b
this.$ti=c},
M:function M(){},
cU:function cU(a,b,c){this.a=a
this.b=b
this.$ti=c},
k:function k(){},
c:function c(){},
fO:function fO(){},
ab:function ab(a){this.a=a},
lp:function lp(a){this.a=a},
lq:function lq(a){this.a=a},
lr:function lr(a,b){this.a=a
this.b=b},
ej:function ej(a,b,c,d,e,f,g){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.y=_.w=$},
ln:function ln(a,b,c){this.a=a
this.b=b
this.c=c},
mt:function mt(a){this.a=a},
mu:function mu(){},
mv:function mv(){},
fM:function fM(a,b,c,d,e,f,g,h){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.w=h
_.x=null},
fD:function fD(a,b,c,d,e,f,g){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.y=_.w=$},
nI(a){if(!t.I.b(a)&&!t.j.b(a))throw A.d(A.R("object must be a Map or Iterable",null))
return A.vL(a)},
vL(a){var s=new A.mr(new A.e0(t.aH)).$1(a)
s.toString
return s},
mr:function mr(a){this.a=a},
tz(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f="byteOffset",e=null,d="normalized"
A.w(a,B.cO,b)
s=A.W(a,"bufferView",b,!1)
if(s===-1){r=a.v(f)
if(r)b.l($.cJ(),A.a(["bufferView"],t.M),f)
q=0}else q=A.a_(a,f,b,0,e,-1,0,!1)
p=A.a_(a,"componentType",b,-1,B.cl,-1,0,!0)
o=A.a_(a,"count",b,-1,e,-1,1,!0)
n=A.J(a,"type",b,e,B.m.gM(),e,!0)
m=A.pG(a,d,b)
if(n!=null&&p!==-1){l=B.m.j(0,n)
if(l!=null)if(p===5126){r=t.V
k=A.ae(a,"min",b,e,A.a([l],r),1/0,-1/0,!0)
j=A.ae(a,"max",b,e,A.a([l],r),1/0,-1/0,!0)}else{k=A.pH(a,"min",b,p,l)
j=A.pH(a,"max",b,p,l)}else{k=e
j=k}}else{k=e
j=k}i=A.U(a,"sparse",b,A.wn(),!1)
if(m)r=p===5126||p===5125
else r=!1
if(r)b.n($.rj(),d)
if((n==="MAT2"||n==="MAT3"||n==="MAT4")&&q!==-1&&(q&3)!==0)b.n($.ri(),f)
switch(p){case 5120:case 5121:case 5122:case 5123:case 5125:r=t.w
r.a(j)
r.a(k)
A.J(a,"name",b,e,e,e,!1)
r=A.t(a,B.S,b,e)
h=A.x(a,b)
g=new A.fy(s,q,p,o,n,m,j,k,i,A.b1(p),r,h,!1)
if(k!=null){r=b.R()
h=t.e
b.Z(g,new A.f2(A.S(k.length,0,!1,h),A.S(k.length,0,!1,h),J.h2(k,!1),r))}if(j!=null){r=b.R()
h=t.e
b.Z(g,new A.f0(A.S(j.length,0,!1,h),A.S(j.length,0,!1,h),J.h2(j,!1),r))}break
default:r=t.fy
r.a(j)
r.a(k)
A.J(a,"name",b,e,e,e,!1)
r=A.t(a,B.S,b,e)
h=A.x(a,b)
g=new A.fx(s,q,p,o,n,m,j,k,i,A.b1(p),r,h,!1)
b.Z(g,new A.eU(b.R()))
if(k!=null){r=b.R()
b.Z(g,new A.f1(A.S(k.length,0,!1,t.e),A.S(k.length,0,!1,t.F),J.h2(k,!1),r))}if(j!=null){r=b.R()
b.Z(g,new A.f_(A.S(j.length,0,!1,t.e),A.S(j.length,0,!1,t.F),J.h2(j,!1),r))}break}return g},
bs(a,b,c,d,e,f){var s,r,q="byteOffset"
if(a===-1)return!1
if(a%b!==0)if(f!=null)f.l($.rk(),A.a([a,b],t.M),q)
else return!1
s=d.x
if(s===-1)return!1
r=s+a
if(r%b!==0)if(f!=null)f.G($.qE(),A.a([r,b],t.M))
else return!1
s=d.y
if(a>s)if(f!=null)f.l($.nU(),A.a([a,c,e,s],t.M),q)
else return!1
else if(a+c>s)if(f!=null)f.G($.nU(),A.a([a,c,e,s],t.M))
else return!1
return!0},
nh(a,b,c,d){var s=b.byteLength,r=A.b1(a)
if(s<c+r*d)return null
switch(a){case 5121:return A.no(b,c,d)
case 5123:return A.oE(b,c,d)
case 5125:return A.oF(b,c,d)
default:return null}},
oh(a,b,c,d){var s=b.byteLength,r=A.b1(a)
if(s<c+r*d)return null
switch(a){case 5126:A.db(b,c,d)
return new Float32Array(b,c,d)
default:return null}},
oi(a,b,c,d){var s=b.byteLength,r=A.b1(a)
if(s<c+r*d)return null
switch(a){case 5120:A.db(b,c,d)
s=new Int8Array(b,c,d)
return s
case 5121:return A.no(b,c,d)
case 5122:A.db(b,c,d)
return new Int16Array(b,c,d)
case 5123:return A.oE(b,c,d)
case 5125:return A.oF(b,c,d)
default:return null}},
ty(a,b){var s,r,q
A.w(a,B.cx,b)
s=A.a_(a,"count",b,-1,null,-1,1,!0)
r=A.U(a,"indices",b,A.wl(),!0)
q=A.U(a,"values",b,A.wm(),!0)
if(s===-1||r==null||q==null)return null
return new A.bX(s,r,q,A.t(a,B.dD,b,null),A.x(a,b),!1)},
tw(a,b){A.w(a,B.cq,b)
return new A.bY(A.W(a,"bufferView",b,!0),A.a_(a,"byteOffset",b,0,null,-1,0,!1),A.a_(a,"componentType",b,-1,B.c7,-1,0,!0),A.t(a,B.dB,b,null),A.x(a,b),!1)},
tx(a,b){A.w(a,B.ct,b)
return new A.bZ(A.W(a,"bufferView",b,!0),A.a_(a,"byteOffset",b,0,null,-1,0,!1),A.t(a,B.dC,b,null),A.x(a,b),!1)},
a4:function a4(){},
fy:function fy(a,b,c,d,e,f,g,h,i,j,k,l,m){var _=this
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
lJ:function lJ(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
lK:function lK(a){this.a=a},
lL:function lL(){},
lM:function lM(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
lH:function lH(a){this.a=a},
lI:function lI(a){this.a=a},
fx:function fx(a,b,c,d,e,f,g,h,i,j,k,l,m){var _=this
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
lD:function lD(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
lE:function lE(a){this.a=a},
lF:function lF(){},
lG:function lG(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
bX:function bX(a,b,c,d,e,f){var _=this
_.d=a
_.e=b
_.f=c
_.a=d
_.b=e
_.a$=f},
bY:function bY(a,b,c,d,e,f){var _=this
_.d=a
_.e=b
_.f=c
_.r=null
_.a=d
_.b=e
_.a$=f},
bZ:function bZ(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
eU:function eU(a){this.a=a},
f1:function f1(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
f_:function f_(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
f2:function f2(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
f0:function f0(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
tB(a1,a2){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=null,b="channels",a="extras",a0="samplers"
A.w(a1,B.cv,a2)
s=A.ey(a1,b,a2)
if(s!=null){r=s.gi(s)
q=A.S(r,c,!1,t.aA)
p=new A.E(q,r,b,t.eq)
r=a2.c
r.push(b)
for(o=t.h,n=0;n<s.gi(s);++n){m=s.j(0,n)
r.push(B.c.k(n))
A.w(m,B.d7,a2)
l=A.W(m,"sampler",a2,!0)
k=A.U(m,"target",a2,A.wp(),!0)
j=A.t(m,B.dF,a2,c)
i=m.j(0,a)
h=i!=null&&!o.b(i)
if(h)a2.n($.di(),a)
q[n]=new A.b2(l,k,j,i,!1)
r.pop()}r.pop()}else p=c
g=A.ey(a1,a0,a2)
if(g!=null){r=g.gi(g)
q=A.S(r,c,!1,t.gW)
f=new A.E(q,r,a0,t.az)
r=a2.c
r.push(a0)
for(o=t.h,n=0;n<g.gi(g);++n){e=g.j(0,n)
r.push(B.c.k(n))
A.w(e,B.cL,a2)
l=A.W(e,"input",a2,!0)
k=A.J(e,"interpolation",a2,"LINEAR",B.ci,c,!1)
j=A.W(e,"output",a2,!0)
h=A.t(e,B.dG,a2,c)
i=e.j(0,a)
d=i!=null&&!o.b(i)
if(d)a2.n($.di(),a)
q[n]=new A.b3(l,k,j,h,i,!1)
r.pop()}r.pop()}else f=c
A.J(a1,"name",a2,c,c,c,!1)
return new A.bt(p,f,A.t(a1,B.aB,a2,c),A.x(a1,a2),!1)},
tA(a,b){A.w(a,B.cT,b)
return new A.c0(A.W(a,"node",b,!1),A.J(a,"path",b,null,B.R,null,!0),A.t(a,B.dE,b,null),A.x(a,b),!1)},
bt:function bt(a,b,c,d,e){var _=this
_.w=a
_.x=b
_.a=c
_.b=d
_.a$=e},
h3:function h3(a,b){this.a=a
this.b=b},
h4:function h4(a,b,c){this.a=a
this.b=b
this.c=c},
b2:function b2(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
c0:function c0(a,b,c,d,e){var _=this
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
eB:function eB(a){this.a=0
this.b=a},
dH:function dH(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.e=_.d=0
_.$ti=d},
tC(a,b){var s,r,q,p,o=null,n="minVersion"
A.w(a,B.cs,b)
A.J(a,"copyright",b,o,o,o,!1)
s=A.J(a,"generator",b,o,o,o,!1)
r=$.bp()
q=A.J(a,"version",b,o,o,r,!0)
r=A.J(a,n,b,o,o,r,!1)
p=new A.bu(s,q,r,A.t(a,B.dH,b,o),A.x(a,b),!1)
s=r!=null&&q!=null
if(s){if(p.gcO()<=p.gbg())s=p.gcO()===p.gbg()&&p.ge9()>p.gbR()
else s=!0
if(s)b.l($.rG(),A.a([r,q],t.M),n)}return p},
bu:function bu(a,b,c,d,e,f){var _=this
_.e=a
_.f=b
_.r=c
_.a=d
_.b=e
_.a$=f},
tG(a,b){var s,r,q,p,o,n,m,l,k=null,j="uri"
A.w(a,B.d9,b)
p=A.a_(a,"byteLength",b,-1,k,-1,1,!0)
s=null
o=a.v(j)
if(o){r=A.J(a,j,b,k,k,k,!1)
if(r!=null){if(b.dx)b.n($.nT(),j)
q=null
try{q=A.oY(r)}catch(n){if(A.K(n) instanceof A.aI)s=A.pL(r,b)
else throw n}if(q!=null){if(b.dx)b.n($.nS(),j)
switch(q.gbQ().toLowerCase()){case"application/gltf-buffer":case"application/octet-stream":m=q.cz()
break
default:b.l($.rn(),A.a([q.gbQ()],t.M),j)
m=k
break}}else m=k}else m=k
o=!0}else m=k
l=s
A.J(a,"name",b,k,k,k,!1)
return new A.aS(l,p,o,m,A.t(a,B.dI,b,k),A.x(a,b),!1)},
aS:function aS(a,b,c,d,e,f,g){var _=this
_.w=a
_.x=b
_.y=c
_.z=d
_.a=e
_.b=f
_.a$=g},
tF(a,b){var s,r,q,p,o,n=null,m="byteStride"
A.w(a,B.ch,b)
s=A.a_(a,"byteLength",b,-1,n,-1,1,!0)
r=A.a_(a,m,b,-1,n,252,4,!1)
q=A.a_(a,"target",b,-1,B.c4,-1,0,!1)
if(r!==-1){if(s!==-1&&r>s)b.l($.ro(),A.a([r,s],t.M),m)
if(r%4!==0)b.l($.rg(),A.a([r,4],t.M),m)
if(q===34963)b.n($.nc(),m)}p=A.W(a,"buffer",b,!0)
o=A.a_(a,"byteOffset",b,0,n,-1,0,!1)
A.J(a,"name",b,n,n,n,!1)
return new A.bv(p,o,s,r,q,A.t(a,B.aC,b,n),A.x(a,b),!1)},
bv:function bv(a,b,c,d,e,f,g,h){var _=this
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
tJ(a,b){var s,r=null,q="orthographic",p="perspective"
A.w(a,B.d8,b)
s=a.v(q)&&a.v(p)
if(s)b.G($.o4(),B.av)
switch(A.J(a,"type",b,r,B.av,r,!0)){case"orthographic":A.U(a,q,b,A.wy(),!0)
break
case"perspective":A.U(a,p,b,A.wz(),!0)
break}A.J(a,"name",b,r,r,r,!1)
return new A.bw(A.t(a,B.dL,b,r),A.x(a,b),!1)},
tH(a,b){var s,r,q,p,o="xmag",n="ymag"
A.w(a,B.de,b)
s=A.H(a,o,b,0/0,1/0,-1/0,1/0,-1/0,!0,0/0)
r=A.H(a,n,b,0/0,1/0,-1/0,1/0,-1/0,!0,0/0)
q=A.H(a,"zfar",b,0/0,1/0,0,1/0,-1/0,!0,0/0)
p=A.H(a,"znear",b,0/0,1/0,-1/0,1/0,0,!0,0/0)
if(q<=p)b.O($.o7())
if(s===0)b.n($.o6(),o)
else if(s<0)b.n($.o5(),o)
if(r===0)b.n($.o6(),n)
else if(r<0)b.n($.o5(),n)
return new A.c2(A.t(a,B.dJ,b,null),A.x(a,b),!1)},
tI(a,b){var s,r,q
A.w(a,B.cr,b)
s=A.H(a,"yfov",b,0/0,1/0,0,1/0,-1/0,!0,0/0)
if(s>=3.141592653589793)b.O($.rp())
r=A.H(a,"zfar",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
q=A.H(a,"znear",b,0/0,1/0,0,1/0,-1/0,!0,0/0)
if(r<=q)b.O($.o7())
A.H(a,"aspectRatio",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
return new A.c3(A.t(a,B.dK,b,null),A.x(a,b),!1)},
bw:function bw(a,b,c){this.a=a
this.b=b
this.a$=c},
c2:function c2(a,b,c){this.a=a
this.b=b
this.a$=c},
c3:function c3(a,b,c){this.a=a
this.b=b
this.a$=c},
or(c0,c1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6="extensionsRequired",b7="extensionsUsed",b8=null,b9=new A.iv(c1)
b9.$0()
A.w(c0,B.df,c1)
if(c0.v(b6)&&!c0.v(b7))c1.l($.cJ(),A.a(["extensionsUsed"],t.M),b6)
s=A.pJ(c0,b7,c1)
if(s==null)s=A.a([],t.i)
r=A.pJ(c0,b6,c1)
if(r==null)r=A.a([],t.i)
c1.e5(s,r)
q=new A.iw(c0,b9,c1)
p=new A.ix(b9,c0,c1).$1$3$req("asset",A.wr(),!0,t.gP)
if((p==null?b8:p.f)==null)return b8
else if(p.gbg()!==2){o=$.rU()
n=p.gbg()
c1.l(o,A.a([n],t.M),"version")
return b8}else if(p.gbR()>0){o=$.rV()
n=p.gbR()
c1.l(o,A.a([n],t.M),"version")}m=q.$1$2("accessors",A.wo(),t.W)
l=q.$1$2("animations",A.wq(),t.bj)
k=q.$1$2("buffers",A.ww(),t.cT)
j=q.$1$2("bufferViews",A.wx(),t.r)
i=q.$1$2("cameras",A.wA(),t.h2)
h=q.$1$2("images",A.wP(),t.ec)
g=q.$1$2("materials",A.xd(),t.fC)
f=q.$1$2("meshes",A.xg(),t.eM)
o=t.L
e=q.$1$2("nodes",A.xh(),o)
d=q.$1$2("samplers",A.xi(),t.c2)
c=q.$1$2("scenes",A.xj(),t.bn)
b9.$0()
b=A.W(c0,"scene",c1,!1)
a=c.j(0,b)
n=b!==-1&&a==null
if(n)c1.l($.N(),A.a([b],t.M),"scene")
a0=q.$1$2("skins",A.xk(),t.aV)
a1=q.$1$2("textures",A.xm(),t.ai)
b9.$0()
a2=A.t(c0,B.T,c1,b8)
b9.$0()
a3=new A.ds(s,r,m,l,p,k,j,i,h,g,f,e,d,a,a0,a1,a2,A.x(c0,c1),!1)
a4=new A.it(c1,a3)
a4.$2(j,B.aC)
a4.$2(m,B.S)
a4.$2(h,B.aD)
a4.$2(a1,B.V)
a4.$2(g,B.h)
a4.$2(f,B.aF)
a4.$2(e,B.U)
a4.$2(a0,B.aJ)
a4.$2(l,B.aB)
a4.$2(c,B.aI)
if(a2.a!==0){n=c1.c
n.push("extensions")
a2.L(0,new A.ir(c1,a3))
n.pop()}n=c1.c
n.push("nodes")
e.a3(new A.is(c1,A.aN(o)))
n.pop()
a5=[m,k,j,i,h,g,f,e,d,a0,a1]
for(a6=0;a6<11;++a6){a7=a5[a6]
if(a7.gi(a7)===0)continue
n.push(a7.c)
for(o=a7.b,a8=a7.a,a9=a8.length,b0=0;b0<o;++b0){b1=b0>=a9
b1=b1?b8:a8[b0]
if((b1==null?b8:b1.a$)===!1)c1.Y($.h_(),b0)}n.pop()}o=c1.x
if(o.a!==0){for(a8=A.uq(o,o.r,A.C(o).c);a8.p();){a9=a8.d
if(a9.gi(a9)===0)continue
b2=o.j(0,a9)
B.d.si(n,0)
B.d.F(n,b2)
for(b1=a9.b,a9=a9.a,b3=a9.length,b0=0;b0<b1;++b0){b4=b0>=b3
b4=b4?b8:a9[b0]
if((b4==null?b8:b4.a$)===!1)c1.Y($.h_(),b0)}}B.d.si(n,0)}n.push("meshes")
for(o=f.b,a8=f.a,a9=a8.length,b0=0;b0<o;++b0){b1=b0>=a9
b5=b1?b8:a8[b0]
if((b5==null?b8:b5.x)!=null&&b5.a$&&!b5.y){n.push(B.c.k(b0))
c1.n($.rd(),"weights")
n.pop()}}B.d.si(n,0)
return a3},
ds:function ds(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s){var _=this
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
iv:function iv(a){this.a=a},
iw:function iw(a,b,c){this.a=a
this.b=b
this.c=c},
ix:function ix(a,b,c){this.a=a
this.b=b
this.c=c},
it:function it(a,b){this.a=a
this.b=b},
iu:function iu(a,b){this.a=a
this.b=b},
ir:function ir(a,b){this.a=a
this.b=b},
is:function is(a,b){this.a=a
this.b=b},
ip:function ip(){},
iq:function iq(){},
iy:function iy(a,b){this.a=a
this.b=b},
iz:function iz(a,b){this.a=a
this.b=b},
m:function m(){},
l:function l(){},
eN:function eN(){},
fH:function fH(){},
u3(a,b){var s,r,q,p,o,n,m,l,k,j="bufferView",i=null,h="uri"
A.w(a,B.cu,b)
p=A.W(a,j,b,!1)
o=A.J(a,"mimeType",b,i,b.dy,i,!1)
s=A.J(a,h,b,i,i,i,!1)
n=p===-1
m=!n
if(m&&o==null)b.l($.cJ(),A.a(["mimeType"],t.M),j)
if(!(m&&s!=null))n=n&&s==null
else n=!0
if(n)b.G($.o4(),A.a(["bufferView","uri"],t.M))
r=null
if(s!=null){if(b.dx)b.n($.nT(),h)
q=null
try{q=A.oY(s)}catch(l){if(A.K(l) instanceof A.aI)r=A.pL(s,b)
else throw l}if(q!=null){if(b.dx)b.n($.nS(),h)
k=q.cz()
n=A.os(k)
n=n==null?i:B.cb[n.a]
n=n!==q.gbQ().toLowerCase()
if(n){b.l($.o3(),A.a([s,"The declared mediatype does not match the embedded content."],t.M),h)
k=i}}else k=i}else k=i
n=r
A.J(a,"name",b,i,i,i,!1)
return new A.aT(p,o,n,k,A.t(a,B.aD,b,i),A.x(a,b),!1)},
aT:function aT(a,b,c,d,e,f,g){var _=this
_.w=a
_.x=b
_.y=c
_.z=d
_.as=_.Q=null
_.a=e
_.b=f
_.a$=g},
uu(a,b){var s,r,q,p,o,n,m,l,k,j,i=null,h="alphaCutoff"
A.w(a,B.ck,b)
s=A.U(a,"pbrMetallicRoughness",b,A.xf(),!1)
r=A.U(a,"normalTexture",b,A.pO(),!1)
q=A.U(a,"occlusionTexture",b,A.xe(),!1)
p=A.U(a,"emissiveTexture",b,A.ap(),!1)
o=A.ae(a,"emissiveFactor",b,B.aj,B.l,1,0,!1)
n=A.J(a,"alphaMode",b,"OPAQUE",B.cj,i,!1)
A.H(a,h,b,0.5,1/0,-1/0,1/0,0,!1,0/0)
m=n!=="MASK"&&a.v(h)
if(m)b.n($.rz(),h)
l=A.pG(a,"doubleSided",b)
k=A.t(a,B.h,b,i)
A.J(a,"name",b,i,i,i,!1)
j=new A.av(s,r,q,p,o,l,A.a8(t.X,t.e),k,A.x(a,b),!1)
m=A.a([s,r,q,p],t.M)
B.d.F(m,k.gV())
b.U(j,m)
return j},
uF(a,b){var s,r,q,p,o
A.w(a,B.cw,b)
A.ae(a,"baseColorFactor",b,B.ak,B.P,1,0,!1)
s=A.U(a,"baseColorTexture",b,A.ap(),!1)
A.H(a,"metallicFactor",b,1,1/0,-1/0,1,0,!1,0/0)
A.H(a,"roughnessFactor",b,1,1/0,-1/0,1,0,!1,0/0)
r=A.U(a,"metallicRoughnessTexture",b,A.ap(),!1)
q=A.t(a,B.e5,b,null)
p=new A.cx(s,r,q,A.x(a,b),!1)
o=A.a([s,r],t.M)
B.d.F(o,q.gV())
b.U(p,o)
return p},
uE(a,b){var s,r,q,p
A.w(a,B.cJ,b)
s=A.t(a,B.aH,b,B.h)
r=A.W(a,"index",b,!0)
q=A.a_(a,"texCoord",b,0,null,-1,0,!1)
A.H(a,"strength",b,1,1/0,-1/0,1,0,!1,0/0)
p=new A.cw(r,q,s,A.x(a,b),!1)
b.U(p,s.gV())
return p},
uD(a,b){var s,r,q,p
A.w(a,B.cI,b)
s=A.t(a,B.aG,b,B.h)
r=A.W(a,"index",b,!0)
q=A.a_(a,"texCoord",b,0,null,-1,0,!1)
A.H(a,"scale",b,1,1/0,-1/0,1/0,-1/0,!1,0/0)
p=new A.cv(r,q,s,A.x(a,b),!1)
b.U(p,s.gV())
return p},
uU(a,b){var s,r
A.w(a,B.cH,b)
s=A.t(a,B.aK,b,B.h)
r=new A.bh(A.W(a,"index",b,!0),A.a_(a,"texCoord",b,0,null,-1,0,!1),s,A.x(a,b),!1)
b.U(r,s.gV())
return r},
av:function av(a,b,c,d,e,f,g,h,i,j){var _=this
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
jN:function jN(a,b){this.a=a
this.b=b},
cx:function cx(a,b,c,d,e){var _=this
_.e=a
_.w=b
_.a=c
_.b=d
_.a$=e},
cw:function cw(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
cv:function cv(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
bh:function bh(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.f=null
_.a=c
_.b=d
_.a$=e},
dj(a){return new A.y(a.Q,a.y,a.as)},
c1:function c1(a){this.a=a},
c_:function c_(a){this.a=a},
y:function y(a,b,c){this.a=a
this.b=b
this.c=c},
uy(a,b){var s,r,q,p,o,n,m,l,k,j,i=null,h="primitives"
A.w(a,B.cZ,b)
s=A.ae(a,"weights",b,i,i,1/0,-1/0,!1)
r=A.ey(a,h,b)
if(r!=null){q=r.gi(r)
p=A.S(q,i,!1,t.ft)
o=new A.E(p,q,h,t.b_)
q=b.c
q.push(h)
for(n=0,m=0;m<r.gi(r);++m){q.push(B.c.k(m))
l=A.ux(r.j(0,m),b)
k=l.w
j=k==null?i:k.length
if(j==null)j=0
if(m===0)n=j
else if(n!==j){k=$.rF()
b.n(k,j>0?"targets":i)}p[m]=l
q.pop()}q.pop()
q=s!=null&&n!==s.length
if(q)b.l($.rA(),A.a([s.length,n],t.M),"weights")}else o=i
A.J(a,"name",b,i,i,i,!1)
return new A.aU(o,s,A.t(a,B.aF,b,i),A.x(a,b),!1)},
uw(a,b,c,d,e,f,g,h,i,j,k,l,m,n){var s,r=J.ou(l,t.e)
for(s=0;s<l;++s)r[s]=s
return new A.aF(a,b,c,d,e,h,j,k,l,A.a8(t.X,t.W),r,m,n,!1)},
ux(a,b){var s,r,q,p,o,n,m,l="attributes",k={}
A.w(a,B.cN,b)
k.a=k.b=k.c=!1
k.d=0
k.e=-1
k.f=0
k.r=-1
k.w=0
k.x=-1
k.y=0
k.z=-1
s=A.a_(a,"mode",b,4,null,6,0,!1)
r=A.wJ(a,l,b,new A.jO(k,b))
if(r!=null){q=b.c
q.push(l)
if(!k.c)b.O($.rD())
if(!k.b&&k.a)b.n($.rE(),"TANGENT")
p=new A.jP(b)
k.d=p.$3(k.e,k.d,"COLOR")
k.f=p.$3(k.r,k.f,"JOINTS")
k.w=p.$3(k.x,k.w,"WEIGHTS")
k.y=p.$3(k.z,k.y,"TEXCOORD")
p=k.f
o=k.w
if(p!==o){b.G($.rC(),A.a([p,o],t.M))
k.w=k.f=0}q.pop()}n=A.wK(a,"targets",b,new A.jQ(b))
m=A.uw(r,A.W(a,"indices",b,!1),A.W(a,"material",b,!1),s,n,k.c,k.b,k.a,k.d,k.f,k.w,k.y,A.t(a,B.aE,b,null),A.x(a,b))
b.U(m,m.a.gV())
return m},
aU:function aU(a,b,c,d,e){var _=this
_.w=a
_.x=b
_.y=!1
_.a=c
_.b=d
_.a$=e},
jX:function jX(a,b){this.a=a
this.b=b},
jW:function jW(a,b){this.a=a
this.b=b},
aF:function aF(a,b,c,d,e,f,g,h,i,j,k,l,m,n){var _=this
_.d=a
_.e=b
_.f=c
_.r=d
_.w=e
_.z=f
_.as=g
_.at=h
_.ax=i
_.ay=j
_.CW=_.ch=-1
_.db=_.cy=_.cx=null
_.dx=k
_.a=l
_.b=m
_.a$=n},
jO:function jO(a,b){this.a=a
this.b=b},
jP:function jP(a){this.a=a},
jQ:function jQ(a){this.a=a},
jS:function jS(a,b,c){this.a=a
this.b=b
this.c=c},
jT:function jT(a,b){this.a=a
this.b=b},
jU:function jU(){},
jV:function jV(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
jR:function jR(){},
eQ:function eQ(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.w=d
_.Q=_.z=0
_.as=e
_.at=f},
uC(b4,b5){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0=null,b1="matrix",b2="translation",b3="rotation"
A.w(b4,B.cc,b5)
if(b4.v(b1)){s=A.ae(b4,b1,b5,b0,B.c_,1/0,-1/0,!1)
if(s!=null){r=new Float32Array(16)
q=new A.cV(r)
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
a0=a!=null?A.p3(a):b0}else a0=b0
if(b4.v(b3)){a1=A.ae(b4,b3,b5,b0,B.P,1,-1,!1)
if(a1!=null){r=a1[0]
p=a1[1]
o=a1[2]
n=a1[3]
m=new Float32Array(4)
a2=new A.fi(m)
m[0]=r
m[1]=p
m[2]=o
m[3]=n
r=Math.sqrt(a2.gaT())
if(Math.abs(1-r)>0.00769)b5.n($.rR(),b3)}else a2=b0}else a2=b0
if(b4.v("scale")){a3=A.ae(b4,"scale",b5,b0,B.l,1/0,-1/0,!1)
a4=a3!=null?A.p3(a3):b0}else a4=b0
a5=A.W(b4,"camera",b5,!1)
a6=A.mK(b4,"children",b5,!1)
a7=A.W(b4,"mesh",b5,!1)
a8=A.W(b4,"skin",b5,!1)
a9=A.ae(b4,"weights",b5,b0,b0,1/0,-1/0,!1)
if(a7===-1){if(a8!==-1)b5.l($.cJ(),A.a(["mesh"],t.M),"skin")
if(a9!=null)b5.l($.cJ(),A.a(["mesh"],t.M),"weights")}if(q!=null){if(a0!=null||a2!=null||a4!=null)b5.n($.rK(),b1)
if(q.cL())b5.n($.rI(),b1)
else if(!A.wV(q))b5.n($.rL(),b1)}A.J(b4,"name",b5,b0,b0,b0,!1)
return new A.an(a5,a6,a8,q,a7,a0,a2,a4,a9,A.aN(t.bn),A.t(b4,B.U,b5,b0),A.x(b4,b5),!1)},
an:function an(a,b,c,d,e,f,g,h,i,j,k,l,m){var _=this
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
jZ:function jZ(){},
k_:function k_(){},
k0:function k0(a,b){this.a=a
this.b=b},
uP(a,b){var s=null
A.w(a,B.d0,b)
A.a_(a,"magFilter",b,-1,B.c9,-1,0,!1)
A.a_(a,"minFilter",b,-1,B.cd,-1,0,!1)
A.a_(a,"wrapS",b,10497,B.an,-1,0,!1)
A.a_(a,"wrapT",b,10497,B.an,-1,0,!1)
A.J(a,"name",b,s,s,s,!1)
return new A.bC(A.t(a,B.e6,b,s),A.x(a,b),!1)},
bC:function bC(a,b,c){this.a=a
this.b=b
this.a$=c},
uQ(a,b){var s,r=null
A.w(a,B.cU,b)
s=A.mK(a,"nodes",b,!1)
A.J(a,"name",b,r,r,r,!1)
return new A.bD(s,A.t(a,B.aI,b,r),A.x(a,b),!1)},
bD:function bD(a,b,c,d){var _=this
_.w=a
_.x=null
_.a=b
_.b=c
_.a$=d},
k9:function k9(a,b){this.a=a
this.b=b},
uR(a,b){var s,r,q,p=null
A.w(a,B.cm,b)
s=A.W(a,"inverseBindMatrices",b,!1)
r=A.W(a,"skeleton",b,!1)
q=A.mK(a,"joints",b,!0)
A.J(a,"name",b,p,p,p,!1)
return new A.bF(s,r,q,A.aN(t.L),A.t(a,B.aJ,b,p),A.x(a,b),!1)},
bF:function bF(a,b,c,d,e,f,g){var _=this
_.w=a
_.x=b
_.y=c
_.as=_.Q=_.z=null
_.at=d
_.a=e
_.b=f
_.a$=g},
le:function le(a){this.a=a},
eP:function eP(a){this.a=a},
uV(a,b){var s,r,q=null
A.w(a,B.d3,b)
s=A.W(a,"sampler",b,!1)
r=A.W(a,"source",b,!1)
A.J(a,"name",b,q,q,q,!1)
return new A.bH(s,r,A.t(a,B.V,b,q),A.x(a,b),!1)},
bH:function bH(a,b,c,d,e){var _=this
_.w=a
_.x=b
_.z=_.y=null
_.a=c
_.b=d
_.a$=e},
p1(a,b,c){var s=A.aN(t.X),r=b==null?0:b
if(a!=null)s.F(0,a)
return new A.lw(r,s,c)},
tR(){return new A.aa(B.as,new A.hg(),t.gw)},
tQ(a){var s,r,q,p,o=t.i,n=A.a([],o),m=t._,l=A.a([],t.d6),k=A.a8(t.al,t.f9),j=A.a([],o),i=A.a([],o),h=A.a([],t.fh),g=A.a([],t.a9)
o=A.a(["image/jpeg","image/png"],o)
s=t.aD
r=t.X
q=t.cn
p=A.nm(["POSITION",A.aO([B.k],s),"NORMAL",A.aO([B.k],s),"TANGENT",A.aO([B.n],s),"TEXCOORD",A.aO([B.a3,B.a_,B.a2],s),"COLOR",A.aO([B.k,B.H,B.I,B.n,B.y,B.z],s),"JOINTS",A.aO([B.aZ,B.b_],s),"WEIGHTS",A.aO([B.n,B.y,B.z],s)],r,q)
q=A.nm(["POSITION",A.aO([B.k],s),"NORMAL",A.aO([B.k],s),"TANGENT",A.aO([B.k],s),"TEXCOORD",A.aO([B.a3,B.Z,B.a_,B.a1,B.a2],s),"COLOR",A.aO([B.k,B.w,B.H,B.x,B.I,B.n,B.J,B.y,B.K,B.z],s)],r,q)
s=a==null?A.p1(null,null,null):a
q=new A.i(s,n,A.a8(t.W,t.b7),A.a8(m,m),A.a8(t.f7,t.an),l,A.a8(t.r,t.gz),A.a8(t.b5,t.eG),k,j,i,h,A.aN(t.af),g,new A.ab(""),o,p,q)
p=t.em
q.ay=new A.aY(i,p)
q.at=new A.aY(j,p)
q.Q=new A.bk(k,t.f8)
q.CW=new A.aY(h,t.go)
return q},
lw:function lw(a,b,c){this.a=a
this.b=b
this.c=c},
i:function i(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r){var _=this
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
_.fx=r},
hg:function hg(){},
hf:function hf(){},
hh:function hh(){},
hk:function hk(a){this.a=a},
hl:function hl(a){this.a=a},
hi:function hi(a){this.a=a},
hj:function hj(){},
hm:function hm(a,b){this.a=a
this.b=b},
bx:function bx(){},
u2(a){var s,r,q={}
q.a=q.b=null
s=new A.B($.A,t.dD)
r=new A.ay(s,t.eP)
q.c=!1
q.a=a.bO(new A.iB(q,r),new A.iC(q),new A.iD(q,r))
return s},
os(a){var s,r
if(a.length<14)return null
s=A.f3(a.buffer,a.byteOffset,14)
r=s.getUint32(0,!0)
if((r&16777215)===16767231)return B.af
if(r===1196314761&&s.getUint32(4,!0)===169478669)return B.ag
if(r===1179011410&&s.getUint32(8,!0)===1346520407&&s.getUint16(12,!0)===20566)return B.ah
if(r===1481919403&&s.getUint32(4,!0)===3140497952&&s.getUint32(8,!0)===169478669)return B.bO
return null},
cQ:function cQ(a,b){this.a=a
this.b=b},
dR:function dR(a,b){this.a=a
this.b=b},
d1:function d1(a,b){this.a=a
this.b=b},
ca:function ca(a,b){this.a=a
this.b=b},
cb:function cb(a,b,c,d,e,f,g,h,i){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f
_.r=g
_.w=h
_.x=i},
iB:function iB(a,b){this.a=a
this.b=b},
iD:function iD(a,b){this.a=a
this.b=b},
iC:function iC(a){this.a=a},
iA:function iA(){},
iL:function iL(a,b){var _=this
_.f=_.e=_.d=_.c=0
_.r=null
_.a=a
_.b=b},
iN:function iN(){},
iM:function iM(){},
k2:function k2(a,b,c,d,e,f){var _=this
_.x=_.w=_.r=_.f=_.e=_.d=_.c=0
_.z=_.y=!1
_.Q=a
_.as=b
_.at=!1
_.ax=c
_.ay=d
_.a=e
_.b=f},
k3:function k3(a){this.a=a},
lB:function lB(a,b,c){var _=this
_.c=a
_.d=0
_.a=b
_.b=c},
dO:function dO(){},
dN:function dN(){},
aJ:function aJ(a){this.a=a},
d6:function d6(a,b){this.a=a
this.b=b},
fk:function fk(a){var _=this
_.a=a
_.f=_.e=_.d=_.c=_.b=null},
k6:function k6(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
k7:function k7(a,b,c){this.a=a
this.b=b
this.c=c},
k8:function k8(a,b){this.a=a
this.b=b},
mB(a){if(a==null)return null
if(a.Q==null||a.y===-1||a.z===-1)return null
if(a.CW==null&&a.ay==null)return null
return a},
xr(a0,a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a
a0.f.a3(new A.n7(a1))
A.wa(a1)
s=A.a([],t.b2)
r=A.a([],t.bd)
q=a1.c
B.d.si(q,0)
q.push("meshes")
for(p=a0.at,o=p.b,n=a0.ax,m=n.$ti.h("a9<n.E>"),l=a0.cx,p=p.a,k=p.length,j=0;j<o;++j){i={}
h=j>=k
g=h?null:p[j]
if((g==null?null:g.w)==null)continue
h=g.w
if(h.ba(h,new A.n8()))continue
i.a=i.b=-1
for(f=new A.a9(n,n.gi(n),m);f.p();){e=f.d
if(e.cy==g){d=e.dx
d=(d==null?null:d.Q)!=null}else d=!1
if(d){e=e.dx
c=e.Q.length
d=i.b
if(d===-1||c<d){i.b=c
i.a=l.bN(l,e)}}}if(i.b<1)continue
q.push(B.c.k(j))
q.push("primitives")
h.a3(new A.n9(i,a1,s,r))
q.pop()
q.pop()}q.pop()
if(s.length===0)return
for(;A.wg(s);)for(q=r.length,b=0;b<r.length;r.length===q||(0,A.cI)(r),++b){a=r[b]
if(!a.w)a.dU(a1)}},
wg(a){var s,r
for(s=a.length,r=0;r<a.length;a.length===s||(0,A.cI)(a),++r)a[r].p()
if(!!a.fixed$length)A.a0(A.ac("removeWhere"))
B.d.dL(a,new A.mE(),!0)
return a.length!==0},
wa(a){var s,r,q,p,o,n,m,l,k,j,i,h
for(s=a.d.ge0(),s=s.gD(s),r=a.c;s.p();){q=s.gt()
p=A.mB(q.a)
if(p==null)continue
o=B.m.j(0,p.Q)
if(o==null)o=0
n=q.b
B.d.si(r,0)
for(q=p.ad(),q=new A.aG(q.a(),A.C(q).h("aG<1>")),m=J.T(n),l=0,k=0,j=!1;q.p();j=!0){i=q.gt()
for(h=0;h<m.gi(n);++h)if(!m.j(n,h).a_(a,l,k,i))continue;++k
if(k===o)k=0;++l}if(j)for(h=0;h<m.gi(n);++h)m.j(n,h).aD(a)}},
n7:function n7(a){this.a=a},
n8:function n8(){},
n9:function n9(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
mE:function mE(){},
eT:function eT(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.r=_.f=0
_.w=!1
_.y=_.x=0
_.z=f},
F(a,b,c){return new A.hn(c,a,b)},
al(a,b,c){return new A.ka(c,a,b)},
r(a,b,c){return new A.kr(c,a,b)},
v(a,b,c){return new A.iX(c,a,b)},
ak(a,b,c){return new A.hY(c,a,b)},
wb(a){return"'"+A.b(a)+"'"},
w7(a){return typeof a=="string"?"'"+a+"'":J.aq(a)},
bE:function bE(a,b){this.a=a
this.b=b},
iG:function iG(){},
hn:function hn(a,b,c){this.a=a
this.b=b
this.c=c},
hK:function hK(){},
hL:function hL(){},
hD:function hD(){},
hC:function hC(){},
hs:function hs(){},
hr:function hr(){},
hH:function hH(){},
hy:function hy(){},
hq:function hq(){},
hE:function hE(){},
hw:function hw(){},
ht:function ht(){},
hv:function hv(){},
hu:function hu(){},
ho:function ho(){},
hp:function hp(){},
hG:function hG(){},
hF:function hF(){},
hx:function hx(){},
hN:function hN(){},
hP:function hP(){},
hS:function hS(){},
hT:function hT(){},
hQ:function hQ(){},
hR:function hR(){},
hO:function hO(){},
hU:function hU(){},
hM:function hM(){},
hA:function hA(){},
hz:function hz(){},
hI:function hI(){},
hJ:function hJ(){},
hB:function hB(){},
iE:function iE(a,b,c){this.a=a
this.b=b
this.c=c},
iF:function iF(){},
ka:function ka(a,b,c){this.a=a
this.b=b
this.c=c},
kc:function kc(){},
kd:function kd(){},
kb:function kb(){},
kf:function kf(){},
kg:function kg(){},
kh:function kh(){},
ke:function ke(){},
ki:function ki(){},
kj:function kj(){},
kk:function kk(){},
kp:function kp(){},
kq:function kq(){},
ko:function ko(){},
kl:function kl(){},
km:function km(){},
kn:function kn(){},
kr:function kr(a,b,c){this.a=a
this.b=b
this.c=c},
la:function la(){},
lb:function lb(){},
kW:function kW(){},
kG:function kG(){},
kt:function kt(){},
ku:function ku(){},
ks:function ks(){},
kv:function kv(){},
kw:function kw(){},
kx:function kx(){},
kz:function kz(){},
ky:function ky(){},
kA:function kA(){},
kB:function kB(){},
kC:function kC(){},
kD:function kD(){},
kO:function kO(){},
kR:function kR(){},
kV:function kV(){},
kT:function kT(){},
kQ:function kQ(){},
kU:function kU(){},
kS:function kS(){},
kP:function kP(){},
l_:function l_(){},
kY:function kY(){},
l0:function l0(){},
l7:function l7(){},
ld:function ld(){},
l6:function l6(){},
lc:function lc(){},
kF:function kF(){},
kZ:function kZ(){},
l3:function l3(){},
l2:function l2(){},
l1:function l1(){},
l8:function l8(){},
l9:function l9(){},
l5:function l5(){},
kX:function kX(){},
l4:function l4(){},
kE:function kE(){},
kH:function kH(){},
kI:function kI(){},
kN:function kN(){},
kM:function kM(){},
kK:function kK(){},
kJ:function kJ(){},
kL:function kL(){},
iX:function iX(a,b,c){this.a=a
this.b=b
this.c=c},
j_:function j_(){},
iY:function iY(){},
iZ:function iZ(){},
j0:function j0(){},
j3:function j3(){},
j1:function j1(){},
j2:function j2(){},
j7:function j7(){},
j5:function j5(){},
j9:function j9(){},
j6:function j6(){},
j8:function j8(){},
j4:function j4(){},
ja:function ja(){},
jd:function jd(){},
jc:function jc(){},
jb:function jb(){},
je:function je(){},
jf:function jf(){},
jj:function jj(){},
jk:function jk(){},
jq:function jq(){},
ji:function ji(){},
jh:function jh(){},
jn:function jn(){},
jm:function jm(){},
jl:function jl(){},
jr:function jr(){},
js:function js(){},
jp:function jp(){},
jo:function jo(){},
jt:function jt(){},
ju:function ju(){},
jx:function jx(){},
jv:function jv(){},
jw:function jw(){},
jy:function jy(){},
jA:function jA(){},
jz:function jz(){},
jB:function jB(){},
jC:function jC(){},
jD:function jD(){},
jE:function jE(){},
jF:function jF(){},
jI:function jI(){},
jH:function jH(){},
jG:function jG(){},
jg:function jg(){},
hY:function hY(a,b,c){this.a=a
this.b=b
this.c=c},
i4:function i4(){},
i5:function i5(){},
i7:function i7(){},
hZ:function hZ(){},
i6:function i6(){},
i_:function i_(){},
i2:function i2(){},
i1:function i1(){},
i0:function i0(){},
ia:function ia(){},
i9:function i9(){},
ib:function ib(){},
ic:function ic(){},
i8:function i8(){},
id:function id(){},
i3:function i3(){},
cS:function cS(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
vU(a){a.dy.push("image/webp")},
tX(a,b){b.toString
A.w(a,B.d4,b)
return new A.c8(A.W(a,"source",b,!1),A.t(a,B.dN,b,null),A.x(a,b),!1)},
c8:function c8(a,b,c,d){var _=this
_.d=a
_.e=null
_.a=b
_.b=c
_.a$=d},
ua(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g=null,f="lights",e="spot"
b.toString
A.w(a,B.cQ,b)
s=A.ey(a,f,b)
r=t.cp
if(s!=null){q=s.gi(s)
r=A.S(q,g,!1,r)
p=new A.E(r,q,f,t.E)
q=b.c
q.push(f)
for(o=t.h,n=0;n<s.gi(s);++n){m=s.j(0,n)
q.push(B.c.k(n))
A.w(m,B.cg,b)
A.ae(m,"color",b,B.C,B.l,1,0,!1)
A.H(m,"intensity",b,1,1/0,-1/0,1/0,0,!1,0/0)
l=A.J(m,"type",b,g,B.cz,g,!0)
if(l==="spot")A.U(m,e,b,A.wX(),!0)
else{k=m.v(e)
if(k)b.n($.o8(),e)}j=A.H(m,"range",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
k=l==="directional"&&!isNaN(j)
if(k)b.n($.o8(),"range")
A.J(m,"name",b,g,g,g,!1)
k=A.t(m,B.dQ,b,g)
i=m.j(0,"extras")
h=i!=null&&!o.b(i)
if(h)b.n($.di(),"extras")
r[n]=new A.ba(k,i,!1)
q.pop()}q.pop()}else{r=J.b8(0,r)
p=new A.E(r,0,f,t.E)}return new A.bz(p,A.t(a,B.dO,b,g),A.x(a,b),!1)},
ub(a,b){var s,r,q="outerConeAngle"
A.w(a,B.cK,b)
s=A.H(a,"innerConeAngle",b,0,1.5707963267948966,-1/0,1/0,0,!1,0/0)
r=A.H(a,q,b,0.7853981633974483,1/0,0,1.5707963267948966,-1/0,!1,0/0)
if(r<=s)b.l($.rs(),A.a([s,r],t.M),q)
return new A.cd(A.t(a,B.dP,b,null),A.x(a,b),!1)},
uc(a,b){b.toString
A.w(a,B.cP,b)
return new A.ce(A.W(a,"light",b,!0),A.t(a,B.dR,b,null),A.x(a,b),!1)},
bz:function bz(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
iR:function iR(a,b){this.a=a
this.b=b},
ba:function ba(a,b,c){this.a=a
this.b=b
this.a$=c},
cd:function cd(a,b,c){this.a=a
this.b=b
this.a$=c},
ce:function ce(a,b,c,d){var _=this
_.d=a
_.e=null
_.a=b
_.b=c
_.a$=d},
ud(a,b){var s,r,q,p,o,n
b.toString
A.w(a,B.c3,b)
A.H(a,"clearcoatFactor",b,0,1/0,-1/0,1,0,!1,0/0)
s=A.U(a,"clearcoatTexture",b,A.ap(),!1)
A.H(a,"clearcoatRoughnessFactor",b,0,1/0,-1/0,1,0,!1,0/0)
r=A.U(a,"clearcoatRoughnessTexture",b,A.ap(),!1)
q=A.U(a,"clearcoatNormalTexture",b,A.pO(),!1)
p=A.t(a,B.dS,b,null)
o=new A.cf(s,r,q,p,A.x(a,b),!1)
n=A.a([s,r,q],t.M)
B.d.F(n,p.gV())
b.U(o,n)
return o},
cf:function cf(a,b,c,d,e,f){var _=this
_.e=a
_.r=b
_.w=c
_.a=d
_.b=e
_.a$=f},
ue(a,b){b.toString
A.w(a,B.cA,b)
return new A.cg(A.H(a,"emissiveStrength",b,1,1/0,-1/0,1/0,0,!1,0/0),A.t(a,B.dT,b,null),A.x(a,b),!1)},
cg:function cg(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
uf(a,b){b.toString
A.w(a,B.cM,b)
A.H(a,"ior",b,1.5,1/0,-1/0,1/0,1,!1,0)
return new A.ch(A.t(a,B.dU,b,null),A.x(a,b),!1)},
ch:function ch(a,b,c){this.a=a
this.b=b
this.a$=c},
ug(a,b){var s,r,q,p,o,n,m,l="iridescenceThicknessMinimum",k="iridescenceThicknessMaximum",j="iridescenceThicknessTexture"
b.toString
A.w(a,B.d5,b)
A.H(a,"iridescenceFactor",b,0,1/0,-1/0,1,0,!1,0/0)
s=A.U(a,"iridescenceTexture",b,A.ap(),!1)
A.H(a,"iridescenceIor",b,1.3,1/0,-1/0,1/0,1,!1,0/0)
r=A.H(a,l,b,100,1/0,-1/0,1/0,0,!1,0/0)
q=A.H(a,k,b,400,1/0,-1/0,1/0,0,!1,0/0)
p=A.U(a,j,b,A.ap(),!1)
if(r>q){o=$.ru()
b.n(o,a.v(l)?l:k)}if(p!=null){if(r===q)b.n($.rw(),j)}else if(!isNaN(r)&&a.v(l))b.n($.rv(),l)
n=A.t(a,B.dV,b,null)
m=new A.ci(s,p,n,A.x(a,b),!1)
o=A.a([s,p],t.M)
B.d.F(o,n.gV())
b.U(m,o)
return m},
ci:function ci(a,b,c,d,e){var _=this
_.e=a
_.x=b
_.a=c
_.b=d
_.a$=e},
uh(a,b){var s,r,q,p,o
b.toString
A.w(a,B.cy,b)
A.ae(a,"diffuseFactor",b,B.ak,B.P,1,0,!1)
s=A.U(a,"diffuseTexture",b,A.ap(),!1)
A.ae(a,"specularFactor",b,B.C,B.l,1,0,!1)
A.H(a,"glossinessFactor",b,1,1/0,-1/0,1,0,!1,0/0)
r=A.U(a,"specularGlossinessTexture",b,A.ap(),!1)
q=A.t(a,B.dM,b,null)
p=new A.cj(s,r,q,A.x(a,b),!1)
o=A.a([s,r],t.M)
B.d.F(o,q.gV())
b.U(p,o)
return p},
cj:function cj(a,b,c,d,e){var _=this
_.e=a
_.w=b
_.a=c
_.b=d
_.a$=e},
ui(a,b){var s,r,q,p,o
b.toString
A.w(a,B.c2,b)
A.ae(a,"sheenColorFactor",b,B.aj,B.l,1,0,!1)
s=A.U(a,"sheenColorTexture",b,A.ap(),!1)
A.H(a,"sheenRoughnessFactor",b,0,1/0,-1/0,1,0,!1,0/0)
r=A.U(a,"sheenRoughnessTexture",b,A.ap(),!1)
q=A.t(a,B.dW,b,null)
p=new A.ck(s,r,q,A.x(a,b),!1)
o=A.a([s,r],t.M)
B.d.F(o,q.gV())
b.U(p,o)
return p},
ck:function ck(a,b,c,d,e){var _=this
_.e=a
_.r=b
_.a=c
_.b=d
_.a$=e},
uj(a,b){var s,r,q,p,o
b.toString
A.w(a,B.c5,b)
A.H(a,"specularFactor",b,1,1/0,-1/0,1,0,!1,0/0)
s=A.U(a,"specularTexture",b,A.ap(),!1)
A.ae(a,"specularColorFactor",b,B.C,B.l,1/0,0,!1)
r=A.U(a,"specularColorTexture",b,A.ap(),!1)
q=A.t(a,B.dX,b,null)
p=new A.cl(s,r,q,A.x(a,b),!1)
o=A.a([s,r],t.M)
B.d.F(o,q.gV())
b.U(p,o)
return p},
cl:function cl(a,b,c,d,e){var _=this
_.e=a
_.r=b
_.a=c
_.b=d
_.a$=e},
uk(a,b){var s,r,q,p
b.toString
A.w(a,B.c8,b)
A.H(a,"transmissionFactor",b,0,1/0,-1/0,1,0,!1,0/0)
s=A.U(a,"transmissionTexture",b,A.ap(),!1)
r=A.t(a,B.dY,b,null)
q=new A.cm(s,r,A.x(a,b),!1)
p=A.a([s],t.M)
B.d.F(p,r.gV())
b.U(q,p)
return q},
cm:function cm(a,b,c,d){var _=this
_.e=a
_.a=b
_.b=c
_.a$=d},
ul(a,b){b.toString
A.w(a,B.cB,b)
return new A.cn(A.t(a,B.dZ,b,null),A.x(a,b),!1)},
cn:function cn(a,b,c){this.a=a
this.b=b
this.a$=c},
um(a,b){var s,r,q,p,o,n,m,l,k,j,i=null,h="variants"
b.toString
A.w(a,B.da,b)
s=A.ey(a,h,b)
r=t.J
if(s!=null){q=s.gi(s)
r=A.S(q,i,!1,r)
p=new A.E(r,q,h,t.u)
q=b.c
q.push(h)
for(o=t.h,n=0;n<s.gi(s);++n){m=s.j(0,n)
q.push(B.c.k(n))
A.w(m,B.cS,b)
A.J(m,"name",b,i,i,i,!0)
l=A.t(m,B.e1,b,i)
k=m.j(0,"extras")
j=k!=null&&!o.b(k)
if(j)b.n($.di(),"extras")
r[n]=new A.aK(l,k,!1)
q.pop()}q.pop()}else{r=J.b8(0,r)
p=new A.E(r,0,h,t.u)}return new A.bA(p,A.t(a,B.e_,b,i),A.x(a,b),!1)},
un(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=null,e="mappings"
b.toString
A.w(a,B.cR,b)
s=A.ey(a,e,b)
r=t.aa
if(s!=null){q=s.gi(s)
r=A.S(q,f,!1,r)
p=new A.E(r,q,e,t.B)
q=b.c
q.push(e)
for(o=t.h,n=0;n<s.gi(s);++n){m=s.j(0,n)
q.push(B.c.k(n))
A.w(m,B.db,b)
l=A.mK(m,"variants",b,!0)
k=A.W(m,"material",b,!0)
A.J(m,"name",b,f,f,f,!1)
j=A.t(m,B.e0,b,f)
i=m.j(0,"extras")
h=i!=null&&!o.b(i)
if(h)b.n($.di(),"extras")
r[n]=new A.bb(l,k,j,i,!1)
q.pop()}q.pop()}else{r=J.b8(0,r)
p=new A.E(r,0,e,t.B)}g=new A.co(p,A.t(a,B.e7,b,f),A.x(a,b),!1)
b.U(g,A.ct(p,!0,t._))
return g},
bA:function bA(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
iS:function iS(a,b){this.a=a
this.b=b},
aK:function aK(a,b,c){this.a=a
this.b=b
this.a$=c},
co:function co(a,b,c,d){var _=this
_.d=a
_.a=b
_.b=c
_.a$=d},
iV:function iV(a,b,c){this.a=a
this.b=b
this.c=c},
bb:function bb(a,b,c,d,e){var _=this
_.d=a
_.e=b
_.r=null
_.a=c
_.b=d
_.a$=e},
iT:function iT(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
iU:function iU(a,b){this.a=a
this.b=b},
uo(a,b){var s,r,q,p,o
b.toString
A.w(a,B.dd,b)
A.ae(a,"attenuationColor",b,B.C,B.l,1,0,!1)
A.H(a,"attenuationDistance",b,0/0,1/0,0,1/0,-1/0,!1,0/0)
s=A.H(a,"thicknessFactor",b,0,1/0,-1/0,1/0,0,!1,0/0)
r=A.U(a,"thicknessTexture",b,A.ap(),!1)
q=A.t(a,B.e2,b,null)
p=new A.cp(s,r,q,A.x(a,b),!1)
o=A.a([r],t.M)
B.d.F(o,q.gV())
b.U(p,o)
return p},
cp:function cp(a,b,c,d,e){var _=this
_.f=a
_.r=b
_.a=c
_.b=d
_.a$=e},
iW:function iW(){},
up(a,b){b.toString
A.w(a,B.cY,b)
A.ae(a,"offset",b,B.bZ,B.al,1/0,-1/0,!1)
A.H(a,"rotation",b,0,1/0,-1/0,1/0,-1/0,!1,0/0)
A.ae(a,"scale",b,B.c0,B.al,1/0,-1/0,!1)
return new A.cq(A.a_(a,"texCoord",b,-1,null,-1,0,!1),A.t(a,B.e3,b,null),A.x(a,b),!1)},
cq:function cq(a,b,c,d){var _=this
_.r=a
_.a=b
_.b=c
_.a$=d},
O:function O(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
V:function V(a,b,c){this.a=a
this.b=b
this.c=c},
c9:function c9(a,b){this.a=a
this.b=b},
cr:function cr(a,b){this.a=a
this.b=b},
fl:function fl(a,b){this.a=a
this.b=b},
dr:function dr(a,b,c){var _=this
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
ih:function ih(a){this.a=a},
ii:function ii(a){this.a=a},
ie:function ie(a){this.a=a},
ig:function ig(a){this.a=a},
u1(a,b){var s,r={},q=new A.B($.A,t.eD)
r.a=!1
r.b=null
s=A.oU(new A.ik(r),new A.il(r),new A.im(r),t.w)
r.b=a.e6(new A.io(r,s,new A.ay(q,t.a_),b),s.gdV())
return q},
u_(a,b){var s=new A.cP(a,new A.ay(new A.B($.A,t.f),t.G))
s.e=b
return s},
u0(a,b){var s,r,q,p,o=null,n=null
try{n=B.aa.dY(a)}catch(q){p=A.K(q)
if(p instanceof A.aI){s=p
b.aC($.h1(),A.a([s],t.M),!0)
return o}else throw q}if(t.t.b(n))try{r=A.or(n,b)
return new A.at("model/gltf+json",r,o)}catch(q){if(A.K(q) instanceof A.bx)return o
else throw q}else{b.aC($.a2(),A.a([n,"object"],t.M),!0)
return o}},
at:function at(a,b,c){this.a=a
this.b=b
this.c=c},
il:function il(a){this.a=a},
im:function im(a){this.a=a},
ik:function ik(a){this.a=a},
io:function io(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
cP:function cP(a,b){var _=this
_.a=a
_.b=null
_.c=b
_.e=_.d=null
_.f=!0},
ij:function ij(a){this.a=a},
dt:function dt(){},
az(a,b,c,d){var s=a.j(0,b)
if(s==null&&a.v(b))d.l($.a2(),A.a([null,c],t.M),b)
return s},
mF(a){return typeof a=="number"&&Math.floor(a)===a?J.ng(a):a},
W(a,b,c,d){var s=A.mF(A.az(a,b,"integer",c))
if(A.aH(s)){if(s>=0)return s
c.n($.h0(),b)}else if(s==null){if(d)c.G($.bq(),A.a([b],t.M))}else c.l($.a2(),A.a([s,"integer"],t.M),b)
return-1},
pG(a,b,c){var s=A.az(a,b,"boolean",c)
if(s==null)return!1
if(A.er(s))return s
c.l($.a2(),A.a([s,"boolean"],t.M),b)
return!1},
a_(a,b,c,d,e,f,g,h){var s,r=A.mF(A.az(a,b,"integer",c))
if(A.aH(r)){if(e!=null){if(!A.nE(b,r,e,c,!1))return-1}else{if(!(r<g))s=f!==-1&&r>f
else s=!0
if(s){c.l($.nb(),A.a([r],t.M),b)
return-1}}return r}else if(r==null){if(!h)return d
c.G($.bq(),A.a([b],t.M))}else c.l($.a2(),A.a([r,"integer"],t.M),b)
return-1},
H(a,b,c,d,e,f,g,h,i,j){var s,r=A.az(a,b,"number",c)
if(typeof r=="number"){if(r!==j)s=r<h||r<=f||r>g||r>=e
else s=!1
if(s){c.l($.nb(),A.a([r],t.M),b)
return 0/0}return r}else if(r==null){if(!i)return d
c.G($.bq(),A.a([b],t.M))}else c.l($.a2(),A.a([r,"number"],t.M),b)
return 0/0},
J(a,b,c,d,e,f,g){var s,r=A.az(a,b,"string",c)
if(typeof r=="string"){if(e!=null)A.nE(b,r,e,c,!1)
else{if(f==null)s=null
else{s=f.b
s=s.test(r)}if(s===!1){c.l($.re(),A.a([r,f.a],t.M),b)
return null}}return r}else if(r==null){if(!g)return d
c.G($.bq(),A.a([b],t.M))}else c.l($.a2(),A.a([r,"string"],t.M),b)
return null},
pL(a,b){var s,r,q,p
try{s=A.oZ(a)
q=s
if(q.gcG()||q.gbJ()||q.gcF()||q.gbL()||q.gbK())b.l($.rP(),A.a([a],t.M),"uri")
return s}catch(p){q=A.K(p)
if(q instanceof A.aI){r=q
b.l($.o3(),A.a([a,r],t.M),"uri")
return null}else throw p}},
nG(a,b,c,d){var s=A.az(a,b,"object",c)
if(t.t.b(s))return s
else if(s==null){if(d){c.G($.bq(),A.a([b],t.M))
return null}}else{c.l($.a2(),A.a([s,"object"],t.M),b)
if(d)return null}return A.a8(t.X,t._)},
U(a,b,c,d,e){var s,r,q=A.az(a,b,"object",c)
if(t.t.b(q)){s=c.c
s.push(b)
r=d.$2(q,c)
s.pop()
return r}else if(q==null){if(e)c.G($.bq(),A.a([b],t.M))}else c.l($.a2(),A.a([q,"object"],t.M),b)
return null},
mK(a,b,c,d){var s,r,q,p,o,n,m=A.az(a,b,"array",c)
if(t.m.b(m)){s=J.T(m)
if(s.gA(m)){c.n($.bV(),b)
return null}r=c.c
r.push(b)
q=t.e
p=A.aN(q)
for(o=0;o<s.gi(m);++o){n=s.j(m,o)
if(typeof n=="number"&&Math.floor(n)===n)n=J.ng(n)
if(A.aH(n)&&n>=0){if(!p.C(0,n))c.Y($.o1(),o)
s.m(m,o,n)}else{s.m(m,o,-1)
c.Y($.h0(),o)}}r.pop()
return s.ah(m,q)}else if(m==null){if(d)c.G($.bq(),A.a([b],t.M))}else c.l($.a2(),A.a([m,"array"],t.M),b)
return null},
wJ(a,b,c,d){var s,r=A.az(a,b,"object",c)
if(t.t.b(r)){if(r.gA(r)){c.n($.bV(),b)
return null}s=c.c
s.push(b)
r.L(0,new A.mL(d,r,c))
s.pop()
return r.ai(0,t.X,t.e)}else{s=t.M
if(r==null)c.G($.bq(),A.a([b],s))
else c.l($.a2(),A.a([r,"object"],s),b)}return null},
wK(a,b,c,d){var s,r,q,p,o,n,m,l=A.az(a,b,"array",c)
if(t.m.b(l)){s=J.T(l)
if(s.gA(l)){c.n($.bV(),b)
return null}else{r=c.c
r.push(b)
for(q=t.M,p=t.t,o=!1,n=0;n<s.gi(l);++n){m=s.j(l,n)
if(p.b(m))if(m.gA(m)){c.Y($.bV(),n)
o=!0}else{r.push(B.c.k(n))
m.L(0,new A.mM(d,m,c))
r.pop()}else{c.G($.ez(),A.a([m,"object"],q))
o=!0}}r.pop()
if(o)return null}s=J.nf(l,t.h)
r=A.C(s).h("aa<n.E,h<e*,f*>*>")
return A.ct(new A.aa(s,new A.mN(),r),!1,r.h("ag.E"))}else if(l!=null)c.l($.a2(),A.a([l,"array"],t.M),b)
return null},
ae(a,b,c,d,e,f,g,h){var s,r,q,p,o,n,m,l,k=null,j=A.az(a,b,"array",c)
if(t.m.b(j)){s=J.T(j)
if(s.gA(j)){c.n($.bV(),b)
return k}if(e!=null&&!A.nE(b,s.gi(j),e,c,!0))return k
r=A.S(s.gi(j),0,!1,t.F)
for(q=t.M,p=c.c,o=!1,n=0;n<s.gi(j);++n){m=s.j(j,n)
if(typeof m=="number"){l=m==1/0||m==-1/0||m<g||m>f
if(l){p.push(b)
c.an($.nb(),A.a([m],q),n)
p.pop()
o=!0}if(h){l=$.ob()
l[0]=m
r[n]=l[0]}else r[n]=m}else{c.l($.ez(),A.a([m,"number"],q),b)
o=!0}}if(o)return k
return r}else if(j==null){if(d==null)s=k
else s=J.cT(d.slice(0),A.Z(d).c)
return s}else c.l($.a2(),A.a([j,"array"],t.M),b)
return k},
pH(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j=A.az(a,b,"array",c)
if(t.m.b(j)){s=J.T(j)
if(s.gi(j)!==e){c.l($.o2(),A.a([s.gi(j),A.a([e],t.V)],t.M),b)
return null}r=A.xq(d)
q=A.pV(d)
p=A.wD(d,e)
for(o=t.M,n=!1,m=0;m<s.gi(j);++m){l=s.j(j,m)
if(typeof l=="number"&&Math.floor(l)===l)l=J.ng(l)
if(A.aH(l)){k=l<r||l>q
if(k){c.l($.rr(),A.a([l,B.ax.j(0,d)],o),b)
n=!0}p[m]=l}else{c.l($.ez(),A.a([l,"integer"],o),b)
n=!0}}if(n)return null
return p}else if(j!=null)c.l($.a2(),A.a([j,"array"],t.M),b)
return null},
pJ(a,b,c){var s,r,q,p,o,n,m,l,k=A.az(a,b,"array",c)
if(t.m.b(k)){s=J.T(k)
if(s.gA(k)){c.n($.bV(),b)
return null}r=c.c
r.push(b)
q=t.X
p=A.aN(q)
for(o=t.M,n=!1,m=0;m<s.gi(k);++m){l=s.j(k,m)
if(typeof l=="string"){if(!p.C(0,l))c.Y($.o1(),m)}else{c.an($.ez(),A.a([l,"string"],o),m)
n=!0}}r.pop()
if(n)return null
return s.ah(k,q)}else if(k!=null)c.l($.a2(),A.a([k,"array"],t.M),b)
return null},
ey(a,b,c){var s,r,q,p,o,n,m=A.az(a,b,"array",c)
if(t.m.b(m)){s=J.T(m)
if(s.gA(m)){c.n($.bV(),b)
return null}else{for(r=s.gD(m),q=t.t,p=t.M,o=!1;r.p();){n=r.gt()
if(!q.b(n)){c.l($.ez(),A.a([n,"object"],p),b)
o=!0}}if(o)return null}return s.ah(m,q)}else{s=t.M
if(m==null)c.G($.bq(),A.a([b],s))
else c.l($.a2(),A.a([m,"array"],s),b)}return null},
t(a,b,c,d){var s,r,q,p,o,n,m,l,k,j,i,h,g="extensions",f=A.a8(t.X,t._),e=A.nG(a,g,c,!1)
if(e.gA(e))return f
s=c.c
s.push(g)
for(r=e.gM(),r=r.gD(r),q=t.ax,p=t.c,o=d==null,n=c.f,m=c.r;r.p();){l=r.gt()
k=A.nG(e,l,c,!1)
j=c.ay
if(!j.H(j,l)){j=c.at
j=j.H(j,l)
if(!j)c.n($.r9(),l)
f.m(0,l,k)
continue}i=c.Q.a.j(0,new A.c9(b,l))
if(i==null){c.n($.ra(),l)
continue}if(e.gi(e)>1&&i.b)c.n($.rH(),l)
if(k!=null){s.push(l)
h=i.a.$2(k,c)
f.m(0,l,h)
if(!i.c&&p.b(h)){l=o?b:d
l=n.bV(l,new A.mJ())
j=A.a(s.slice(0),A.Z(s))
j.fixed$length=Array
J.ne(l,new A.cr(h,j))}if(q.b(h)){l=A.a(s.slice(0),A.Z(s))
l.fixed$length=Array
m.push(new A.fl(h,l))}s.pop()}}s.pop()
return f},
x(a,b){var s=a.j(0,"extras"),r=s!=null&&!t.h.b(s)
if(r)b.n($.di(),"extras")
return s},
nE(a,b,c,d,e){var s
if(!J.oe(c,b)){s=e?$.o2():$.rh()
d.l(s,A.a([b,c],t.M),a)
return!1}return!0},
w(a,b,c){var s,r,q
for(s=a.gM(),s=s.gD(s);s.p();){r=s.gt()
if(!B.d.H(b,r)){q=B.d.H(B.cE,r)
q=!q}else q=!1
if(q)c.n($.rf(),r)}},
nK(a,b,c,d,e,f){var s,r,q,p,o,n,m=e.c
m.push(d)
for(s=t.M,r=c.a,q=r.length,p=0;p<a.gi(a);++p){o=a.j(0,p)
if(o===-1)continue
n=o==null||o<0||o>=q?null:r[o]
if(n!=null){n.a$=!0
b[p]=n
f.$3(n,o,p)}else e.an($.N(),A.a([o],s),p)}m.pop()},
wV(b8){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6,b7=b8.a
if(b7[3]!==0||b7[7]!==0||b7[11]!==0||b7[15]!==1)return!1
if(b8.cC()===0)return!1
s=$.tf()
r=$.tc()
q=$.td()
p=$.oD
if(p==null)p=$.oD=new A.cB(new Float32Array(3))
p.bq(b7[0],b7[1],b7[2])
o=Math.sqrt(p.gaT())
p.bq(b7[4],b7[5],b7[6])
n=Math.sqrt(p.gaT())
p.bq(b7[8],b7[9],b7[10])
m=Math.sqrt(p.gaT())
if(b8.cC()<0)o=-o
s=s.a
s[0]=b7[12]
s[1]=b7[13]
s[2]=b7[14]
l=1/o
k=1/n
j=1/m
i=$.oB
if(i==null)i=$.oB=new A.cV(new Float32Array(16))
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
g=$.oC
if(g==null)g=$.oC=new A.eZ(new Float32Array(9))
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
r=$.tb()
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
return Math.abs(r.cH()-b8.cH())<0.00005},
wD(a,b){switch(a){case 5120:return new Int8Array(b)
case 5121:return new Uint8Array(b)
case 5122:return new Int16Array(b)
case 5123:return new Uint16Array(b)
case 5124:return new Int32Array(b)
case 5125:return new Uint32Array(b)
default:throw A.d(A.R(null,null))}},
mL:function mL(a,b,c){this.a=a
this.b=b
this.c=c},
mM:function mM(a,b,c){this.a=a
this.b=b
this.c=c},
mN:function mN(){},
mJ:function mJ(){},
E:function E(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.$ti=d},
a1:function a1(){},
fr:function fr(a,b){this.a=0
this.b=a
this.c=b},
fs:function fs(a,b){this.a=0
this.b=a
this.c=b},
eG:function eG(a){this.a=a},
lx:function lx(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
lA:function lA(a,b){this.a=a
this.b=b},
lz:function lz(){},
ly:function ly(){},
uv(){return new A.cV(new Float32Array(16))},
uM(){return new A.fi(new Float32Array(4))},
p3(a){var s=new Float32Array(3)
s[2]=a[2]
s[1]=a[1]
s[0]=a[0]
return new A.cB(s)},
p2(){return new A.cB(new Float32Array(3))},
eZ:function eZ(a){this.a=a},
cV:function cV(a){this.a=a},
fi:function fi(a){this.a=a},
cB:function cB(a){this.a=a},
fw:function fw(a){this.a=a},
xb(){var s=new A.n4()
J.tp(self.exports,A.cF(new A.n0(s)))
J.tq(self.exports,A.cF(new A.n1(s)))
J.tr(self.exports,A.cF(new A.n2()))
J.to(self.exports,A.cF(new A.n3()))},
fY(a,b){return A.xs(a,b)},
xs(a,b){var s=0,r=A.eu(t.t),q,p=2,o,n=[],m,l,k,j,i,h
var $async$fY=A.ew(function(c,d){if(c===1){o=d
s=p}while(true)switch(s){case 0:if(!t.a.b(a))throw A.d(A.R("data: Argument must be a Uint8Array.",null))
j=A.pn(b)
m=A.pr(j)
l=null
p=4
s=7
return A.da(A.u1(A.np(a,t.w),m),$async$fY)
case 7:k=d
s=8
return A.da(k.bW(),$async$fY)
case 8:l=d
p=2
s=6
break
case 4:p=3
h=o
if(A.K(h) instanceof A.dt)throw h
else throw h
s=6
break
case 3:s=2
break
case 6:q=A.fW(j,m,l)
s=1
break
case 1:return A.ep(q,r)
case 2:return A.eo(o,r)}})
return A.eq($async$fY,r)},
nL(a,b){var s=0,r=A.eu(t.t),q,p,o
var $async$nL=A.ew(function(c,d){if(c===1)return A.eo(d,r)
while(true)switch(s){case 0:if(typeof a!="string")throw A.d(A.R("json: Argument must be a string.",null))
p=A.pn(b)
o=A.pr(p)
q=A.fW(p,o,A.u0(a,o))
s=1
break
case 1:return A.ep(q,r)}})
return A.eq($async$nL,r)},
pn(a){var s
if(a!=null)s=typeof a=="number"||A.er(a)||typeof a=="string"||t.l.b(a)
else s=!1
if(s)throw A.d(A.R("options: Value must be an object.",null))
return t.bv.a(a)},
fW(a,b,c){var s=0,r=A.eu(t.t),q,p,o,n,m
var $async$fW=A.ew(function(d,e){if(d===1)return A.eo(e,r)
while(true)switch(s){case 0:m=a==null
if(!m){p=J.bn(a)
o=A.vT(p.gbl(a))
if(p.gbI(a)!=null&&!t.b1.b(p.gbI(a)))throw A.d(A.R("options.externalResourceFunction: Value must be a function.",null))
else n=p.gbI(a)
if(p.gc1(a)!=null&&!A.er(p.gc1(a)))throw A.d(A.R("options.writeTimestamp: Value must be a boolean.",null))}else{o=null
n=null}s=(c==null?null:c.b)!=null?3:4
break
case 3:s=5
return A.da(A.vS(b,c,n).aU(),$async$fW)
case 5:case 4:m=m?null:J.tk(a)
q=new A.lx(o,b,c,m==null?!0:m).bk()
s=1
break
case 1:return A.ep(q,r)}})
return A.eq($async$fW,r)},
vT(a){var s,r,q
if(a!=null)if(typeof a=="string")try{r=A.oZ(a)
return r}catch(q){r=A.K(q)
if(r instanceof A.aI){s=r
throw A.d(A.R("options.uri: "+A.b(s)+".",null))}else throw q}else throw A.d(A.R("options.uri: Value must be a string.",null))
return null},
pr(a){var s,r,q,p,o,n,m,l,k,j=null
if(a!=null){s=J.bn(a)
if(s.gbh(a)!=null)r=!A.aH(s.gbh(a))||s.gbh(a)<0
else r=!1
if(r)throw A.d(A.R("options.maxIssues: Value must be a non-negative integer.",j))
if(s.gbc(a)!=null){if(!t.l.b(s.gbc(a)))throw A.d(A.R("options.ignoredIssues: Value must be an array.",j))
q=A.a([],t.i)
for(p=0;p<J.a3(s.gbc(a));++p){o=J.od(s.gbc(a),p)
if(typeof o=="string"&&o.length!==0)q.push(o)
else throw A.d(A.R("options.ignoredIssues["+p+"]: Value must be a non-empty String.",j))}}else q=j
if(s.gal(a)!=null){if(typeof s.gal(a)=="number"||A.er(s.gal(a))||typeof s.gal(a)=="string"||t.l.b(s.gal(a)))throw A.d(A.R("options.severityOverrides: Value must be an object.",j))
r=t.X
n=A.a8(r,t.dz)
for(r=J.nf(self.Object.keys(s.gal(a)),r),r=new A.a9(r,r.gi(r),A.C(r).h("a9<n.E>"));r.p();){m=r.d
l=s.gal(a)[m]
if(A.aH(l)&&l>=0&&l<=3)n.m(0,m,B.cf[l])
else throw A.d(A.R('options.severityOverrides["'+A.b(m)+'"]: Value must be one of [0, 1, 2, 3].',j))}}else n=j
k=A.p1(q,s.gbh(a),n)}else k=j
return A.tQ(k)},
vS(a,b,c){var s=new A.my(c),r=new A.dW("options.externalResourceFunction is required to load this resource.")
return new A.k6(b.b,a,new A.mw(a,b,c,s,r),new A.mx(c,s,r))},
be:function be(){},
hW:function hW(){},
d4:function d4(){},
n4:function n4(){},
n0:function n0(a){this.a=a},
n_:function n_(a,b,c){this.a=a
this.b=b
this.c=c},
mX:function mX(a){this.a=a},
mY:function mY(a,b){this.a=a
this.b=b},
n1:function n1(a){this.a=a},
mZ:function mZ(a,b,c){this.a=a
this.b=b
this.c=c},
mV:function mV(a){this.a=a},
mW:function mW(a,b){this.a=a
this.b=b},
n2:function n2(){},
n3:function n3(){},
my:function my(a){this.a=a},
mz:function mz(a){this.a=a},
mA:function mA(a){this.a=a},
mw:function mw(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
mx:function mx(a,b,c){this.a=a
this.b=b
this.c=c},
fc:function fc(a){this.a=a},
xo(a){return A.a0(A.ow(a))},
pt(a,b){if(a!==$)throw A.d(A.ow(b))},
vK(a){var s,r=a.$dart_jsFunction
if(r!=null)return r
s=function(b,c){return function(){return b(c,Array.prototype.slice.apply(arguments))}}(A.vJ,a)
s[$.nM()]=a
a.$dart_jsFunction=s
return s},
vJ(a,b){return A.uI(a,b,null)},
cF(a){if(typeof a=="function")return a
else return A.vK(a)},
vV(a){var s="POSITION",r="TEXCOORD",q=a.fr
q.j(0,s).F(0,B.d6)
q.j(0,"NORMAL").F(0,B.Q)
q.j(0,"TANGENT").F(0,B.dg)
q.j(0,r).F(0,B.c6)
q=a.fx
q.j(0,s).F(0,B.cn)
q.j(0,"NORMAL").F(0,B.Q)
q.j(0,"TANGENT").F(0,B.Q)
q.j(0,r).F(0,B.dc)},
b1(a){switch(a){case 5120:case 5121:return 1
case 5122:case 5123:return 2
case 5124:case 5125:case 5126:return 4
default:return-1}},
xq(a){switch(a){case 5121:case 5123:case 5125:return 0
case 5120:return-128
case 5122:return-32768
case 5124:return-2147483648
default:throw A.d(A.R(null,null))}},
pV(a){switch(a){case 5120:return 127
case 5121:return 255
case 5122:return 32767
case 5123:return 65535
case 5124:return 2147483647
case 5125:return 4294967295
default:throw A.d(A.R(null,null))}},
fV(a,b){var s=a+b&536870911
s=s+((s&524287)<<10)&536870911
return s^s>>>6},
pp(a){var s=a+((a&67108863)<<3)&536870911
s^=s>>>11
return s+((s&16383)<<15)&536870911}},J={
nJ(a,b,c,d){return{i:a,p:b,e:c,x:d}},
mO(a){var s,r,q,p,o,n=a[v.dispatchPropertyName]
if(n==null)if($.nH==null){A.wR()
n=a[v.dispatchPropertyName]}if(n!=null){s=n.p
if(!1===s)return n.i
if(!0===s)return a
r=Object.getPrototypeOf(a)
if(s===r)return n.i
if(n.e===r)throw A.d(A.oX("Return interceptor for "+A.b(s(a,n))))}q=a.constructor
if(q==null)p=null
else{o=$.m8
if(o==null)o=$.m8=v.getIsolateTag("_$dart_js")
p=q[o]}if(p!=null)return p
p=A.xa(a)
if(p!=null)return p
if(typeof a=="function")return B.bW
s=Object.getPrototypeOf(a)
if(s==null)return B.az
if(s===Object.prototype)return B.az
if(typeof q=="function"){o=$.m8
if(o==null)o=$.m8=v.getIsolateTag("_$dart_js")
Object.defineProperty(q,o,{value:B.W,enumerable:false,writable:true,configurable:true})
return B.W}return B.W},
b8(a,b){if(a<0||a>4294967295)throw A.d(A.X(a,0,4294967295,"length",null))
return J.cT(new Array(a),b)},
ou(a,b){if(a>4294967295)throw A.d(A.X(a,0,4294967295,"length",null))
return J.cT(new Array(a),b)},
cT(a,b){return J.nj(A.a(a,b.h("D<0>")))},
nj(a){a.fixed$length=Array
return a},
u6(a){if(a<256)switch(a){case 9:case 10:case 11:case 12:case 13:case 32:case 133:case 160:return!0
default:return!1}switch(a){case 5760:case 8192:case 8193:case 8194:case 8195:case 8196:case 8197:case 8198:case 8199:case 8200:case 8201:case 8202:case 8232:case 8233:case 8239:case 8287:case 12288:case 65279:return!0
default:return!1}},
ov(a,b){var s,r
for(;b>0;b=s){s=b-1
r=B.a.B(a,s)
if(r!==32&&r!==13&&!J.u6(r))break}return b},
bT(a){if(typeof a=="number"){if(Math.floor(a)==a)return J.dw.prototype
return J.eV.prototype}if(typeof a=="string")return J.by.prototype
if(a==null)return J.dx.prototype
if(typeof a=="boolean")return J.dv.prototype
if(a.constructor==Array)return J.D.prototype
if(typeof a!="object"){if(typeof a=="function")return J.b9.prototype
return a}if(a instanceof A.c)return a
return J.mO(a)},
T(a){if(typeof a=="string")return J.by.prototype
if(a==null)return a
if(a.constructor==Array)return J.D.prototype
if(typeof a!="object"){if(typeof a=="function")return J.b9.prototype
return a}if(a instanceof A.c)return a
return J.mO(a)},
bm(a){if(a==null)return a
if(a.constructor==Array)return J.D.prototype
if(typeof a!="object"){if(typeof a=="function")return J.b9.prototype
return a}if(a instanceof A.c)return a
return J.mO(a)},
wL(a){if(typeof a=="number")return J.cc.prototype
if(a==null)return a
if(!(a instanceof A.c))return J.bI.prototype
return a},
wM(a){if(typeof a=="number")return J.cc.prototype
if(typeof a=="string")return J.by.prototype
if(a==null)return a
if(!(a instanceof A.c))return J.bI.prototype
return a},
pI(a){if(typeof a=="string")return J.by.prototype
if(a==null)return a
if(!(a instanceof A.c))return J.bI.prototype
return a},
bn(a){if(a==null)return a
if(typeof a!="object"){if(typeof a=="function")return J.b9.prototype
return a}if(a instanceof A.c)return a
return J.mO(a)},
oc(a,b){if(typeof a=="number"&&typeof b=="number")return a+b
return J.wM(a).ak(a,b)},
aj(a,b){if(a==null)return b==null
if(typeof a!="object")return b!=null&&a===b
return J.bT(a).N(a,b)},
od(a,b){if(typeof b==="number")if(a.constructor==Array||typeof a=="string"||A.pN(a,a[v.dispatchPropertyName]))if(b>>>0===b&&b<a.length)return a[b]
return J.T(a).j(a,b)},
th(a,b,c){if(typeof b==="number")if((a.constructor==Array||A.pN(a,a[v.dispatchPropertyName]))&&!a.immutable$list&&b>>>0===b&&b<a.length)return a[b]=c
return J.bm(a).m(a,b,c)},
ne(a,b){return J.bm(a).C(a,b)},
nf(a,b){return J.bm(a).ah(a,b)},
oe(a,b){return J.bm(a).H(a,b)},
eA(a,b){return J.bm(a).T(a,b)},
bW(a){return J.bT(a).gE(a)},
of(a){return J.T(a).gA(a)},
ti(a){return J.T(a).ga7(a)},
aC(a){return J.bm(a).gD(a)},
a3(a){return J.T(a).gi(a)},
tj(a){return J.bn(a).gen(a)},
tk(a){return J.bn(a).gc1(a)},
tl(a,b,c){return J.bm(a).aX(a,b,c)},
br(a,b,c){return J.bm(a).aj(a,b,c)},
tm(a,b){return J.bT(a).bj(a,b)},
tn(a,b){return J.T(a).si(a,b)},
to(a,b){return J.bn(a).sda(a,b)},
tp(a,b){return J.bn(a).sex(a,b)},
tq(a,b){return J.bn(a).sez(a,b)},
tr(a,b){return J.bn(a).seA(a,b)},
og(a,b){return J.bm(a).a5(a,b)},
ts(a,b){return J.pI(a).W(a,b)},
tt(a,b,c){return J.bn(a).cY(a,b,c)},
tu(a,b,c){return J.bn(a).eo(a,b,c)},
ng(a){return J.wL(a).ep(a)},
h2(a,b){return J.bm(a).aW(a,b)},
aq(a){return J.bT(a).k(a)},
tv(a){return J.pI(a).eu(a)},
cR:function cR(){},
dv:function dv(){},
dx:function dx(){},
eW:function eW(){},
aL:function aL(){},
fg:function fg(){},
bI:function bI(){},
b9:function b9(){},
D:function D(a){this.$ti=a},
iK:function iK(a){this.$ti=a},
b4:function b4(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
cc:function cc(){},
dw:function dw(){},
eV:function eV(){},
by:function by(){}},B={}
var w=[A,J,B]
var $={}
A.nk.prototype={}
J.cR.prototype={
N(a,b){return a===b},
gE(a){return A.cX(a)},
k(a){return"Instance of '"+A.b(A.k5(a))+"'"},
bj(a,b){throw A.d(A.oG(a,b.gcP(),b.gcT(),b.gcQ()))}}
J.dv.prototype={
k(a){return String(a)},
gE(a){return a?519018:218159},
$iQ:1}
J.dx.prototype={
N(a,b){return null==b},
k(a){return"null"},
gE(a){return 0},
bj(a,b){return this.d2(a,b)},
$ik:1}
J.eW.prototype={}
J.aL.prototype={
gE(a){return 0},
k(a){return String(a)},
$ibe:1,
$id4:1,
gen(a){return a.then},
cY(a,b){return a.then(b)},
eo(a,b,c){return a.then(b,c)},
sex(a,b){return a.validateBytes=b},
sez(a,b){return a.validateString=b},
seA(a,b){return a.version=b},
sda(a,b){return a.supportedExtensions=b},
gbl(a){return a.uri},
gbI(a){return a.externalResourceFunction},
gc1(a){return a.writeTimestamp},
gbh(a){return a.maxIssues},
gbc(a){return a.ignoredIssues},
gal(a){return a.severityOverrides}}
J.fg.prototype={}
J.bI.prototype={}
J.b9.prototype={
k(a){var s=a[$.nM()]
if(s==null)return this.d6(a)
return"JavaScript function for "+A.b(J.aq(s))},
$iaD:1}
J.D.prototype={
ah(a,b){return new A.b5(a,A.Z(a).h("@<1>").I(b).h("b5<1,2>"))},
C(a,b){if(!!a.fixed$length)A.a0(A.ac("add"))
a.push(b)},
dL(a,b,c){var s,r,q,p=[],o=a.length
for(s=0;s<o;++s){r=a[s]
if(!b.$1(r))p.push(r)
if(a.length!==o)throw A.d(A.af(a))}q=p.length
if(q===o)return
this.si(a,q)
for(s=0;s<p.length;++s)a[s]=p[s]},
F(a,b){var s
if(!!a.fixed$length)A.a0(A.ac("addAll"))
if(Array.isArray(b)){this.de(a,b)
return}for(s=J.aC(b);s.p();)a.push(s.gt())},
de(a,b){var s,r=b.length
if(r===0)return
if(a===b)throw A.d(A.af(a))
for(s=0;s<r;++s)a.push(b[s])},
aj(a,b,c){return new A.aa(a,b,A.Z(a).h("@<1>").I(c).h("aa<1,2>"))},
cM(a,b){var s,r=A.S(a.length,"",!1,t.R)
for(s=0;s<a.length;++s)r[s]=A.b(a[s])
return r.join(b)},
a5(a,b){return A.dM(a,b,null,A.Z(a).c)},
bb(a,b,c){var s,r,q=a.length
for(s=0;s<q;++s){r=a[s]
if(b.$1(r))return r
if(a.length!==q)throw A.d(A.af(a))}return c.$0()},
T(a,b){return a[b]},
a0(a,b,c){if(b<0||b>a.length)throw A.d(A.X(b,0,a.length,"start",null))
if(c<b||c>a.length)throw A.d(A.X(c,b,a.length,"end",null))
if(b===c)return A.a([],A.Z(a))
return A.a(a.slice(b,c),A.Z(a))},
aX(a,b,c){A.aP(b,c,a.length)
return A.dM(a,b,c,A.Z(a).c)},
gaS(a){var s=a.length
if(s>0)return a[s-1]
throw A.d(A.ni())},
H(a,b){var s
for(s=0;s<a.length;++s)if(J.aj(a[s],b))return!0
return!1},
gA(a){return a.length===0},
ga7(a){return a.length!==0},
k(a){return A.iH(a,"[","]")},
aW(a,b){var s=J.cT(a.slice(0),A.Z(a).c)
return s},
bZ(a){return A.us(a,A.Z(a).c)},
gD(a){return new J.b4(a,a.length,A.Z(a).h("b4<1>"))},
gE(a){return A.cX(a)},
gi(a){return a.length},
si(a,b){if(!!a.fixed$length)A.a0(A.ac("set length"))
if(b<0)throw A.d(A.X(b,0,null,"newLength",null))
a.length=b},
j(a,b){if(!(b>=0&&b<a.length))throw A.d(A.ex(a,b))
return a[b]},
m(a,b,c){if(!!a.immutable$list)A.a0(A.ac("indexed set"))
if(!(b>=0&&b<a.length))throw A.d(A.ex(a,b))
a[b]=c},
$ip:1,
$ij:1,
$io:1}
J.iK.prototype={}
J.b4.prototype={
gt(){return this.d},
p(){var s,r=this,q=r.a,p=q.length
if(r.b!==p)throw A.d(A.cI(q))
s=r.c
if(s>=p){r.d=null
return!1}r.d=q[s]
r.c=s+1
return!0},
$iM:1}
J.cc.prototype={
ep(a){var s
if(a>=-2147483648&&a<=2147483647)return a|0
if(isFinite(a)){s=a<0?Math.ceil(a):Math.floor(a)
return s+0}throw A.d(A.ac(""+a+".toInt()"))},
au(a,b){var s,r,q,p
if(b<2||b>36)throw A.d(A.X(b,2,36,"radix",null))
s=a.toString(b)
if(B.a.B(s,s.length-1)!==41)return s
r=/^([\da-z]+)(?:\.([\da-z]+))?\(e\+(\d+)\)$/.exec(s)
if(r==null)A.a0(A.ac("Unexpected toString result: "+s))
s=r[1]
q=+r[3]
p=r[2]
if(p!=null){s+=p
q-=p.length}return s+B.a.bp("0",q)},
k(a){if(a===0&&1/a<0)return"-0.0"
else return""+a},
gE(a){var s,r,q,p,o=a|0
if(a===o)return o&536870911
s=Math.abs(a)
r=Math.log(s)/0.6931471805599453|0
q=Math.pow(2,r)
p=s<1?s/q:q/s
return((p*9007199254740992|0)+(p*3542243181176521|0))*599197+r*1259&536870911},
bo(a,b){var s=a%b
if(s===0)return 0
if(s>0)return s
return s+b},
av(a,b){if((a|0)===a)if(b>=1||b<-1)return a/b|0
return this.cq(a,b)},
bG(a,b){return(a|0)===a?a/b|0:this.cq(a,b)},
cq(a,b){var s=a/b
if(s>=-2147483648&&s<=2147483647)return s|0
if(s>0){if(s!==1/0)return Math.floor(s)}else if(s>-1/0)return Math.ceil(s)
throw A.d(A.ac("Result of truncating division is "+A.b(s)+": "+A.b(a)+" ~/ "+b))},
aG(a,b){if(b<0)throw A.d(A.cG(b))
return b>31?0:a<<b>>>0},
ag(a,b){var s
if(a>0)s=this.cp(a,b)
else{s=b>31?31:b
s=a>>s>>>0}return s},
dP(a,b){if(0>b)throw A.d(A.cG(b))
return this.cp(a,b)},
cp(a,b){return b>31?0:a>>>b},
$iz:1,
$iL:1}
J.dw.prototype={$if:1}
J.eV.prototype={}
J.by.prototype={
B(a,b){if(b<0)throw A.d(A.ex(a,b))
if(b>=a.length)A.a0(A.ex(a,b))
return a.charCodeAt(b)},
J(a,b){if(b>=a.length)throw A.d(A.ex(a,b))
return a.charCodeAt(b)},
ak(a,b){if(typeof b!="string")throw A.d(A.h5(b,null,null))
return a+b},
aF(a,b,c,d){var s=A.aP(b,c,a.length)
return a.substring(0,b)+d+a.substring(s)},
X(a,b,c){var s
if(c<0||c>a.length)throw A.d(A.X(c,0,a.length,null,null))
s=c+b.length
if(s>a.length)return!1
return b===a.substring(c,s)},
W(a,b){return this.X(a,b,0)},
u(a,b,c){return a.substring(b,A.aP(b,c,a.length))},
br(a,b){return this.u(a,b,null)},
eu(a){var s,r,q
if(typeof a.trimRight!="undefined"){s=a.trimRight()
r=s.length
if(r===0)return s
q=r-1
if(this.B(s,q)===133)r=J.ov(s,q)}else{r=J.ov(a,a.length)
s=a}if(r===s.length)return s
if(r===0)return""
return s.substring(0,r)},
bp(a,b){var s,r
if(0>=b)return""
if(b===1||a.length===0)return a
if(b!==b>>>0)throw A.d(B.bg)
for(s=a,r="";!0;){if((b&1)===1)r=s+r
b=b>>>1
if(b===0)break
s+=s}return r},
ap(a,b,c){var s=b-a.length
if(s<=0)return a
return this.bp(c,s)+a},
bd(a,b,c){var s
if(c<0||c>a.length)throw A.d(A.X(c,0,a.length,null,null))
s=a.indexOf(b,c)
return s},
bN(a,b){return this.bd(a,b,0)},
k(a){return a},
gE(a){var s,r,q
for(s=a.length,r=0,q=0;q<s;++q){r=r+a.charCodeAt(q)&536870911
r=r+((r&524287)<<10)&536870911
r^=r>>6}r=r+((r&67108863)<<3)&536870911
r^=r>>11
return r+((r&16383)<<15)&536870911},
gi(a){return a.length},
$ie:1}
A.bJ.prototype={
gD(a){var s=A.C(this)
return new A.dk(J.aC(this.ga9()),s.h("@<1>").I(s.z[1]).h("dk<1,2>"))},
gi(a){return J.a3(this.ga9())},
gA(a){return J.of(this.ga9())},
ga7(a){return J.ti(this.ga9())},
a5(a,b){var s=A.C(this)
return A.hd(J.og(this.ga9(),b),s.c,s.z[1])},
T(a,b){return A.C(this).z[1].a(J.eA(this.ga9(),b))},
H(a,b){return J.oe(this.ga9(),b)},
k(a){return J.aq(this.ga9())}}
A.dk.prototype={
p(){return this.a.p()},
gt(){return this.$ti.z[1].a(this.a.gt())},
$iM:1}
A.c4.prototype={
ga9(){return this.a}}
A.dV.prototype={$ip:1}
A.dQ.prototype={
j(a,b){return this.$ti.z[1].a(J.od(this.a,b))},
m(a,b,c){J.th(this.a,b,this.$ti.c.a(c))},
si(a,b){J.tn(this.a,b)},
C(a,b){J.ne(this.a,this.$ti.c.a(b))},
aX(a,b,c){var s=this.$ti
return A.hd(J.tl(this.a,b,c),s.c,s.z[1])},
$ip:1,
$io:1}
A.b5.prototype={
ah(a,b){return new A.b5(this.a,this.$ti.h("@<1>").I(b).h("b5<1,2>"))},
ga9(){return this.a}}
A.c5.prototype={
ai(a,b,c){var s=this.$ti
return new A.c5(this.a,s.h("@<1>").I(s.z[1]).I(b).I(c).h("c5<1,2,3,4>"))},
v(a){return this.a.v(a)},
j(a,b){return this.$ti.h("4?").a(this.a.j(0,b))},
m(a,b,c){var s=this.$ti
this.a.m(0,s.c.a(b),s.z[1].a(c))},
L(a,b){this.a.L(0,new A.he(this,b))},
gM(){var s=this.$ti
return A.hd(this.a.gM(),s.c,s.z[2])},
gi(a){var s=this.a
return s.gi(s)},
gA(a){var s=this.a
return s.gA(s)}}
A.he.prototype={
$2(a,b){var s=this.a.$ti
this.b.$2(s.z[2].a(a),s.z[3].a(b))},
$S(){return this.a.$ti.h("~(1,2)")}}
A.eY.prototype={
k(a){return"LateInitializationError: "+this.a}}
A.fj.prototype={
k(a){return"ReachabilityError: "+this.a}}
A.cL.prototype={
gi(a){return this.a.length},
j(a,b){return B.a.B(this.a,b)}}
A.n6.prototype={
$0(){var s=new A.B($.A,t.U)
s.af(null)
return s},
$S:46}
A.dF.prototype={
k(a){return"Null is not a valid value for '"+this.a+"' of type '"+A.pD(this.$ti.c).k(0)+"'"},
$iaX:1}
A.p.prototype={}
A.ag.prototype={
gD(a){var s=this
return new A.a9(s,s.gi(s),A.C(s).h("a9<ag.E>"))},
gA(a){return this.gi(this)===0},
H(a,b){var s,r=this,q=r.gi(r)
for(s=0;s<q;++s){if(J.aj(r.T(0,s),b))return!0
if(q!==r.gi(r))throw A.d(A.af(r))}return!1},
aj(a,b,c){return new A.aa(this,b,A.C(this).h("@<ag.E>").I(c).h("aa<1,2>"))},
a5(a,b){return A.dM(this,b,null,A.C(this).h("ag.E"))}}
A.dL.prototype={
gdq(){var s=J.a3(this.a),r=this.c
if(r==null||r>s)return s
return r},
gdQ(){var s=J.a3(this.a),r=this.b
if(r>s)return s
return r},
gi(a){var s,r=J.a3(this.a),q=this.b
if(q>=r)return 0
s=this.c
if(s==null||s>=r)return r-q
return s-q},
T(a,b){var s=this,r=s.gdQ()+b
if(b<0||r>=s.gdq())throw A.d(A.eS(b,s,"index",null,null))
return J.eA(s.a,r)},
a5(a,b){var s,r,q=this
A.aV(b,"count")
s=q.b+b
r=q.c
if(r!=null&&s>=r)return new A.b7(q.$ti.h("b7<1>"))
return A.dM(q.a,s,r,q.$ti.c)},
aW(a,b){var s,r,q,p=this,o=p.b,n=p.a,m=J.T(n),l=m.gi(n),k=p.c
if(k!=null&&k<l)l=k
s=l-o
if(s<=0){n=J.b8(0,p.$ti.c)
return n}r=A.S(s,m.T(n,o),!1,p.$ti.c)
for(q=1;q<s;++q){r[q]=m.T(n,o+q)
if(m.gi(n)<l)throw A.d(A.af(p))}return r}}
A.a9.prototype={
gt(){return this.d},
p(){var s,r=this,q=r.a,p=J.T(q),o=p.gi(q)
if(r.b!==o)throw A.d(A.af(q))
s=r.c
if(s>=o){r.d=null
return!1}r.d=p.T(q,s);++r.c
return!0},
$iM:1}
A.bc.prototype={
gD(a){var s=A.C(this)
return new A.dB(J.aC(this.a),this.b,s.h("@<1>").I(s.z[1]).h("dB<1,2>"))},
gi(a){return J.a3(this.a)},
gA(a){return J.of(this.a)},
T(a,b){return this.b.$1(J.eA(this.a,b))}}
A.c7.prototype={$ip:1}
A.dB.prototype={
p(){var s=this,r=s.b
if(r.p()){s.a=s.c.$1(r.gt())
return!0}s.a=null
return!1},
gt(){return this.a}}
A.aa.prototype={
gi(a){return J.a3(this.a)},
T(a,b){return this.b.$1(J.eA(this.a,b))}}
A.lC.prototype={
gD(a){return new A.cC(J.aC(this.a),this.b,this.$ti.h("cC<1>"))},
aj(a,b,c){return new A.bc(this,b,this.$ti.h("@<1>").I(c).h("bc<1,2>"))}}
A.cC.prototype={
p(){var s,r
for(s=this.a,r=this.b;s.p();)if(r.$1(s.gt()))return!0
return!1},
gt(){return this.a.gt()}}
A.bf.prototype={
a5(a,b){A.h6(b,"count")
A.aV(b,"count")
return new A.bf(this.a,this.b+b,A.C(this).h("bf<1>"))},
gD(a){return new A.dJ(J.aC(this.a),this.b,A.C(this).h("dJ<1>"))}}
A.cN.prototype={
gi(a){var s=J.a3(this.a)-this.b
if(s>=0)return s
return 0},
a5(a,b){A.h6(b,"count")
A.aV(b,"count")
return new A.cN(this.a,this.b+b,this.$ti)},
$ip:1}
A.dJ.prototype={
p(){var s,r
for(s=this.a,r=0;r<this.b;++r)s.p()
this.b=0
return s.p()},
gt(){return this.a.gt()}}
A.b7.prototype={
gD(a){return B.b8},
gA(a){return!0},
gi(a){return 0},
T(a,b){throw A.d(A.X(b,0,0,"index",null))},
H(a,b){return!1},
aj(a,b,c){return new A.b7(c.h("b7<0>"))},
a5(a,b){A.aV(b,"count")
return this}}
A.dn.prototype={
p(){return!1},
gt(){throw A.d(A.ni())},
$iM:1}
A.dq.prototype={
si(a,b){throw A.d(A.ac("Cannot change the length of a fixed-length list"))},
C(a,b){throw A.d(A.ac("Cannot add to a fixed-length list"))}}
A.fu.prototype={
m(a,b,c){throw A.d(A.ac("Cannot modify an unmodifiable list"))},
si(a,b){throw A.d(A.ac("Cannot change the length of an unmodifiable list"))},
C(a,b){throw A.d(A.ac("Cannot add to an unmodifiable list"))}}
A.d0.prototype={}
A.d_.prototype={
gE(a){var s=this._hashCode
if(s!=null)return s
s=664597*J.bW(this.a)&536870911
this._hashCode=s
return s},
k(a){return'Symbol("'+A.b(this.a)+'")'},
N(a,b){if(b==null)return!1
return b instanceof A.d_&&this.a==b.a},
$icA:1}
A.el.prototype={}
A.dl.prototype={}
A.cM.prototype={
ai(a,b,c){var s=A.C(this)
return A.oA(this,s.c,s.z[1],b,c)},
gA(a){return this.gi(this)===0},
k(a){return A.nn(this)},
m(a,b,c){A.tP()
A.aW(u.g)},
$ih:1}
A.as.prototype={
gi(a){return this.a},
v(a){if(typeof a!="string")return!1
if("__proto__"===a)return!1
return this.b.hasOwnProperty(a)},
j(a,b){if(!this.v(b))return null
return this.b[b]},
L(a,b){var s,r,q,p,o=this.c
for(s=o.length,r=this.b,q=0;q<s;++q){p=o[q]
b.$2(p,r[p])}},
gM(){return new A.dS(this,this.$ti.h("dS<1>"))}}
A.dS.prototype={
gD(a){var s=this.a.c
return new J.b4(s,s.length,A.Z(s).h("b4<1>"))},
gi(a){return this.a.c.length}}
A.Y.prototype={
aK(){var s,r,q=this,p=q.$map
if(p==null){s=q.$ti
r=A.tZ(s.h("1?"))
p=A.ur(A.w6(),r,s.c,s.z[1])
A.pF(q.a,p)
q.$map=p}return p},
v(a){return this.aK().v(a)},
j(a,b){return this.aK().j(0,b)},
L(a,b){this.aK().L(0,b)},
gM(){var s=this.aK()
return new A.aM(s,A.C(s).h("aM<1>"))},
gi(a){return this.aK().a}}
A.hX.prototype={
$1(a){return this.a.b(a)},
$S:14}
A.iI.prototype={
gcP(){var s=this.a
return s},
gcT(){var s,r,q,p,o=this
if(o.c===1)return B.at
s=o.d
r=s.length-o.e.length-o.f
if(r===0)return B.at
q=[]
for(p=0;p<r;++p)q.push(s[p])
q.fixed$length=Array
q.immutable$list=Array
return q},
gcQ(){var s,r,q,p,o,n,m=this
if(m.c!==0)return B.ay
s=m.e
r=s.length
q=m.d
p=q.length-r-m.f
if(r===0)return B.ay
o=new A.aE(t.eo)
for(n=0;n<r;++n)o.m(0,new A.d_(s[n]),q[p+n])
return new A.dl(o,t.gF)}}
A.k4.prototype={
$2(a,b){var s=this.a
s.b=s.b+"$"+A.b(a)
this.b.push(a)
this.c.push(b);++s.a},
$S:68}
A.ll.prototype={
a8(a){var s,r,q=this,p=new RegExp(q.a).exec(a)
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
A.dG.prototype={
k(a){var s=this.b
if(s==null)return"NoSuchMethodError: "+A.b(this.a)
return"NoSuchMethodError: method not found: '"+s+"' on null"}}
A.eX.prototype={
k(a){var s,r=this,q="NoSuchMethodError: method not found: '",p=r.b
if(p==null)return"NoSuchMethodError: "+A.b(r.a)
s=r.c
if(s==null)return q+p+"' ("+A.b(r.a)+")"
return q+p+"' on '"+s+"' ("+A.b(r.a)+")"}}
A.ft.prototype={
k(a){var s=this.a
return s.length===0?"Error":"Error: "+s}}
A.fe.prototype={
k(a){return"Throw of null ('"+(this.a===null?"null":"undefined")+"' from JavaScript)"},
$ia7:1}
A.dp.prototype={}
A.e8.prototype={
k(a){var s,r=this.b
if(r!=null)return r
r=this.a
s=r!==null&&typeof r==="object"?r.stack:null
return this.b=s==null?"":s},
$iam:1}
A.c6.prototype={
k(a){var s=this.constructor,r=s==null?null:s.name
return"Closure '"+A.pW(r==null?"unknown":r)+"'"},
$iaD:1,
geB(){return this},
$C:"$1",
$R:1,
$D:null}
A.eH.prototype={$C:"$0",$R:0}
A.eI.prototype={$C:"$2",$R:2}
A.fp.prototype={}
A.fn.prototype={
k(a){var s=this.$static_name
if(s==null)return"Closure of unknown static method"
return"Closure '"+A.pW(s)+"'"}}
A.cK.prototype={
N(a,b){if(b==null)return!1
if(this===b)return!0
if(!(b instanceof A.cK))return!1
return this.$_target===b.$_target&&this.a===b.a},
gE(a){return(A.fX(this.a)^A.cX(this.$_target))>>>0},
k(a){return"Closure '"+A.b(this.$_name)+"' of "+("Instance of '"+A.b(A.k5(this.a))+"'")}}
A.fm.prototype={
k(a){return"RuntimeError: "+this.a}}
A.me.prototype={}
A.aE.prototype={
gi(a){return this.a},
gA(a){return this.a===0},
gM(){return new A.aM(this,A.C(this).h("aM<1>"))},
gV(){var s=A.C(this)
return A.jM(new A.aM(this,s.h("aM<1>")),new A.iO(this),s.c,s.z[1])},
v(a){var s,r
if(typeof a=="string"){s=this.b
if(s==null)return!1
return s[a]!=null}else if(typeof a=="number"&&(a&0x3fffffff)===a){r=this.c
if(r==null)return!1
return r[a]!=null}else return this.cI(a)},
cI(a){var s=this.d
if(s==null)return!1
return this.bf(s[this.be(a)],a)>=0},
j(a,b){var s,r,q,p,o=null
if(typeof b=="string"){s=this.b
if(s==null)return o
r=s[b]
q=r==null?o:r.b
return q}else if(typeof b=="number"&&(b&0x3fffffff)===b){p=this.c
if(p==null)return o
r=p[b]
q=r==null?o:r.b
return q}else return this.cJ(b)},
cJ(a){var s,r,q=this.d
if(q==null)return null
s=q[this.be(a)]
r=this.bf(s,a)
if(r<0)return null
return s[r].b},
m(a,b,c){var s,r,q=this
if(typeof b=="string"){s=q.b
q.c5(s==null?q.b=q.bE():s,b,c)}else if(typeof b=="number"&&(b&0x3fffffff)===b){r=q.c
q.c5(r==null?q.c=q.bE():r,b,c)}else q.cK(b,c)},
cK(a,b){var s,r,q,p=this,o=p.d
if(o==null)o=p.d=p.bE()
s=p.be(a)
r=o[s]
if(r==null)o[s]=[p.bF(a,b)]
else{q=p.bf(r,a)
if(q>=0)r[q].b=b
else r.push(p.bF(a,b))}},
bV(a,b){var s
if(this.v(a))return this.j(0,a)
s=b.$0()
this.m(0,a,s)
return s},
L(a,b){var s=this,r=s.e,q=s.r
for(;r!=null;){b.$2(r.a,r.b)
if(q!==s.r)throw A.d(A.af(s))
r=r.c}},
c5(a,b,c){var s=a[b]
if(s==null)a[b]=this.bF(b,c)
else s.b=c},
bF(a,b){var s=this,r=new A.jJ(a,b)
if(s.e==null)s.e=s.f=r
else s.f=s.f.c=r;++s.a
s.r=s.r+1&1073741823
return r},
be(a){return J.bW(a)&0x3fffffff},
bf(a,b){var s,r
if(a==null)return-1
s=a.length
for(r=0;r<s;++r)if(J.aj(a[r].a,b))return r
return-1},
k(a){return A.nn(this)},
bE(){var s=Object.create(null)
s["<non-identifier-key>"]=s
delete s["<non-identifier-key>"]
return s}}
A.iO.prototype={
$1(a){return this.a.j(0,a)},
$S(){return A.C(this.a).h("2(1)")}}
A.jJ.prototype={}
A.aM.prototype={
gi(a){return this.a.a},
gA(a){return this.a.a===0},
gD(a){var s=this.a,r=new A.cs(s,s.r,this.$ti.h("cs<1>"))
r.c=s.e
return r},
H(a,b){return this.a.v(b)}}
A.cs.prototype={
gt(){return this.d},
p(){var s,r=this,q=r.a
if(r.b!==q.r)throw A.d(A.af(q))
s=r.c
if(s==null){r.d=null
return!1}else{r.d=s.a
r.c=s.c
return!0}},
$iM:1}
A.mQ.prototype={
$1(a){return this.a(a)},
$S:30}
A.mR.prototype={
$2(a,b){return this.a(a,b)},
$S:33}
A.mS.prototype={
$1(a){return this.a(a)},
$S:49}
A.iJ.prototype={
k(a){return"RegExp/"+this.a+"/"+this.b.flags},
aR(a){var s
if(typeof a!="string")A.a0(A.cG(a))
s=this.b.exec(a)
if(s==null)return null
return new A.mc(s)}}
A.mc.prototype={}
A.dD.prototype={
dA(a,b,c,d){var s=A.X(b,0,c,d,null)
throw A.d(s)},
cc(a,b,c,d){if(b>>>0!==b||b>c)this.dA(a,b,c,d)}}
A.cW.prototype={
gi(a){return a.length},
dO(a,b,c,d,e){var s,r,q=a.length
this.cc(a,b,q,"start")
this.cc(a,c,q,"end")
if(b>c)throw A.d(A.X(b,0,c,null,null))
s=c-b
if(e<0)throw A.d(A.R(e,null))
r=d.length
if(r-e<s)throw A.d(A.cZ("Not enough elements"))
if(e!==0||r!==s)d=d.subarray(e,e+s)
a.set(d,b)},
$iau:1}
A.dC.prototype={
j(a,b){A.bl(b,a,a.length)
return a[b]},
m(a,b,c){A.bl(b,a,a.length)
a[b]=c},
$ip:1,
$ij:1,
$io:1}
A.aw.prototype={
m(a,b,c){A.bl(b,a,a.length)
a[b]=c},
a4(a,b,c,d,e){if(t.eB.b(d)){this.dO(a,b,c,d,e)
return}this.d7(a,b,c,d,e)},
d1(a,b,c,d){return this.a4(a,b,c,d,0)},
$ip:1,
$ij:1,
$io:1}
A.f4.prototype={
a0(a,b,c){return new Float32Array(a.subarray(b,A.bP(b,c,a.length)))}}
A.f5.prototype={
a0(a,b,c){return new Float64Array(a.subarray(b,A.bP(b,c,a.length)))}}
A.f6.prototype={
j(a,b){A.bl(b,a,a.length)
return a[b]},
a0(a,b,c){return new Int16Array(a.subarray(b,A.bP(b,c,a.length)))}}
A.f7.prototype={
j(a,b){A.bl(b,a,a.length)
return a[b]},
a0(a,b,c){return new Int32Array(a.subarray(b,A.bP(b,c,a.length)))}}
A.f8.prototype={
j(a,b){A.bl(b,a,a.length)
return a[b]},
a0(a,b,c){return new Int8Array(a.subarray(b,A.bP(b,c,a.length)))}}
A.f9.prototype={
j(a,b){A.bl(b,a,a.length)
return a[b]},
a0(a,b,c){return new Uint16Array(a.subarray(b,A.bP(b,c,a.length)))}}
A.fa.prototype={
j(a,b){A.bl(b,a,a.length)
return a[b]},
a0(a,b,c){return new Uint32Array(a.subarray(b,A.bP(b,c,a.length)))}}
A.dE.prototype={
gi(a){return a.length},
j(a,b){A.bl(b,a,a.length)
return a[b]},
a0(a,b,c){return new Uint8ClampedArray(a.subarray(b,A.bP(b,c,a.length)))}}
A.cu.prototype={
gi(a){return a.length},
j(a,b){A.bl(b,a,a.length)
return a[b]},
a0(a,b,c){return new Uint8Array(a.subarray(b,A.bP(b,c,a.length)))},
$icu:1,
$ia6:1}
A.e4.prototype={}
A.e5.prototype={}
A.e6.prototype={}
A.e7.prototype={}
A.aQ.prototype={
h(a){return A.ml(v.typeUniverse,this,a)},
I(a){return A.vl(v.typeUniverse,this,a)}}
A.fG.prototype={}
A.ed.prototype={
k(a){return A.aA(this.a,null)},
$ibi:1}
A.fF.prototype={
k(a){return this.a}}
A.ee.prototype={$iaX:1}
A.lO.prototype={
$1(a){var s=this.a,r=s.a
s.a=null
r.$0()},
$S:15}
A.lN.prototype={
$1(a){var s,r
this.a.a=a
s=this.b
r=this.c
s.firstChild?s.removeChild(r):s.appendChild(r)},
$S:121}
A.lP.prototype={
$0(){this.a.$0()},
$S:2}
A.lQ.prototype={
$0(){this.a.$0()},
$S:2}
A.mj.prototype={
dc(a,b){if(self.setTimeout!=null)self.setTimeout(A.mH(new A.mk(this,b),0),a)
else throw A.d(A.ac("`setTimeout()` not found."))}}
A.mk.prototype={
$0(){this.b.$0()},
$S:1}
A.fz.prototype={
a2(a){var s,r=this
if(!r.b)r.a.af(a)
else{s=r.a
if(r.$ti.h("a5<1>").b(a))s.ca(a)
else s.bx(a)}},
bH(a,b){var s
if(b==null)b=A.eE(a)
s=this.a
if(this.b)s.az(a,b)
else s.b1(a,b)}}
A.mp.prototype={
$1(a){return this.a.$2(0,a)},
$S:34}
A.mq.prototype={
$2(a,b){this.a.$2(1,new A.dp(a,b))},
$S:42}
A.mG.prototype={
$2(a,b){this.a(a,b)},
$S:48}
A.d3.prototype={
k(a){return"IterationMarker("+this.b+", "+A.b(this.a)+")"}}
A.aG.prototype={
gt(){var s=this.c
if(s==null)return this.b
return s.gt()},
p(){var s,r,q,p,o,n=this
for(;!0;){s=n.c
if(s!=null)if(s.p())return!0
else n.c=null
r=function(a,b,c){var m,l=b
while(true)try{return a(l,m)}catch(k){m=k
l=c}}(n.a,0,1)
if(r instanceof A.d3){q=r.b
if(q===2){p=n.d
if(p==null||p.length===0){n.b=null
return!1}n.a=p.pop()
continue}else{s=r.a
if(q===3)throw s
else{o=J.aC(s)
if(o instanceof A.aG){s=n.d
if(s==null)s=n.d=[]
s.push(n.a)
n.a=o.a
continue}else{n.c=o
continue}}}}else{n.b=r
return!0}}return!1},
$iM:1}
A.ec.prototype={
gD(a){return new A.aG(this.a(),this.$ti.h("aG<1>"))}}
A.eD.prototype={
k(a){return A.b(this.a)},
$iG:1,
gaZ(){return this.b}}
A.fC.prototype={
bH(a,b){var s
A.bS(a,"error",t.K)
s=this.a
if((s.a&30)!==0)throw A.d(A.cZ("Future already completed"))
if(b==null)b=A.eE(a)
s.b1(a,b)},
P(a){return this.bH(a,null)}}
A.ay.prototype={
a2(a){var s=this.a
if((s.a&30)!==0)throw A.d(A.cZ("Future already completed"))
s.af(a)},
b9(){return this.a2(null)}}
A.bK.prototype={
e8(a){if((this.c&15)!==6)return!0
return this.b.b.bY(this.d,a.a)},
e3(a){var s,r=this.e,q=null,p=this.b.b
if(t.C.b(r))q=p.eh(r,a.a,a.b)
else q=p.bY(r,a.a)
try{p=q
return p}catch(s){if(t.eK.b(A.K(s))){if((this.c&1)!==0)throw A.d(A.R("The error handler of Future.then must return a value of the returned future's type","onError"))
throw A.d(A.R("The error handler of Future.catchError must return a value of the future's type","onError"))}else throw s}}}
A.B.prototype={
ar(a,b,c,d){var s,r,q=$.A
if(q===B.i){if(c!=null&&!t.C.b(c)&&!t.v.b(c))throw A.d(A.h5(c,"onError",u.c))}else if(c!=null)c=A.wc(c,q)
s=new A.B(q,d.h("B<0>"))
r=c==null?1:3
this.b0(new A.bK(s,r,b,c,this.$ti.h("@<1>").I(d).h("bK<1,2>")))
return s},
cY(a,b,c){return this.ar(a,b,null,c)},
cs(a,b,c){var s=new A.B($.A,c.h("B<0>"))
this.b0(new A.bK(s,3,a,b,this.$ti.h("@<1>").I(c).h("bK<1,2>")))
return s},
bm(a){var s=this.$ti,r=new A.B($.A,s)
this.b0(new A.bK(r,8,a,null,s.h("@<1>").I(s.c).h("bK<1,2>")))
return r},
dM(a){this.a=this.a&1|16
this.c=a},
bv(a){this.a=a.a&30|this.a&1
this.c=a.c},
b0(a){var s=this,r=s.a
if(r<=3){a.a=s.c
s.c=a}else{if((r&4)!==0){r=s.c
if((r.a&24)===0){r.b0(a)
return}s.bv(r)}A.df(null,null,s.b,new A.lW(s,a))}},
cn(a){var s,r,q,p,o,n=this,m={}
m.a=a
if(a==null)return
s=n.a
if(s<=3){r=n.c
n.c=a
if(r!=null){q=a.a
for(p=a;q!=null;p=q,q=o)o=q.a
p.a=r}}else{if((s&4)!==0){s=n.c
if((s.a&24)===0){s.cn(a)
return}n.bv(s)}m.a=n.b8(a)
A.df(null,null,n.b,new A.m2(m,n))}},
b7(){var s=this.c
this.c=null
return this.b8(s)},
b8(a){var s,r,q
for(s=a,r=null;s!=null;r=s,s=q){q=s.a
s.a=r}return r},
c9(a){var s,r,q,p=this
p.a^=2
try{a.ar(0,new A.lZ(p),new A.m_(p),t.P)}catch(q){s=A.K(q)
r=A.aR(q)
A.pT(new A.m0(p,s,r))}},
bx(a){var s=this,r=s.b7()
s.a=8
s.c=a
A.d2(s,r)},
az(a,b){var s=this.b7()
this.dM(A.h8(a,b))
A.d2(this,s)},
af(a){if(this.$ti.h("a5<1>").b(a)){this.ca(a)
return}this.dg(a)},
dg(a){this.a^=2
A.df(null,null,this.b,new A.lY(this,a))},
ca(a){var s=this
if(s.$ti.b(a)){if((a.a&16)!==0){s.a^=2
A.df(null,null,s.b,new A.m1(s,a))}else A.nr(a,s)
return}s.c9(a)},
b1(a,b){this.a^=2
A.df(null,null,this.b,new A.lX(this,a,b))},
$ia5:1}
A.lW.prototype={
$0(){A.d2(this.a,this.b)},
$S:1}
A.m2.prototype={
$0(){A.d2(this.b,this.a.a)},
$S:1}
A.lZ.prototype={
$1(a){var s,r,q,p=this.a
p.a^=2
try{p.bx(p.$ti.c.a(a))}catch(q){s=A.K(q)
r=A.aR(q)
p.az(s,r)}},
$S:15}
A.m_.prototype={
$2(a,b){this.a.az(a,b)},
$S:51}
A.m0.prototype={
$0(){this.a.az(this.b,this.c)},
$S:1}
A.lY.prototype={
$0(){this.a.bx(this.b)},
$S:1}
A.m1.prototype={
$0(){A.nr(this.b,this.a)},
$S:1}
A.lX.prototype={
$0(){this.a.az(this.b,this.c)},
$S:1}
A.m5.prototype={
$0(){var s,r,q,p,o,n,m=this,l=null
try{q=m.a.a
l=q.b.b.cV(q.d)}catch(p){s=A.K(p)
r=A.aR(p)
if(m.c){q=m.b.a.c.a
o=s
o=q==null?o==null:q===o
q=o}else q=!1
o=m.a
if(q)o.c=m.b.a.c
else o.c=A.h8(s,r)
o.b=!0
return}if(l instanceof A.B&&(l.a&24)!==0){if((l.a&16)!==0){q=m.a
q.c=l.c
q.b=!0}return}if(t.d.b(l)){n=m.b.a
q=m.a
q.c=J.tt(l,new A.m6(n),t.z)
q.b=!1}},
$S:1}
A.m6.prototype={
$1(a){return this.a},
$S:52}
A.m4.prototype={
$0(){var s,r,q,p,o
try{q=this.a
p=q.a
q.c=p.b.b.bY(p.d,this.b)}catch(o){s=A.K(o)
r=A.aR(o)
q=this.a
q.c=A.h8(s,r)
q.b=!0}},
$S:1}
A.m3.prototype={
$0(){var s,r,q,p,o,n,m,l,k=this
try{s=k.a.a.c
p=k.b
if(p.a.e8(s)&&p.a.e!=null){p.c=p.a.e3(s)
p.b=!1}}catch(o){r=A.K(o)
q=A.aR(o)
p=k.a.a.c
n=p.a
m=r
l=k.b
if(n==null?m==null:n===m)l.c=p
else l.c=A.h8(r,q)
l.b=!0}},
$S:1}
A.fA.prototype={}
A.bg.prototype={
gi(a){var s={},r=new A.B($.A,t.fJ)
s.a=0
this.bP(new A.lh(s,this),!0,new A.li(s,r),r.gdk())
return r}}
A.lf.prototype={
$1(a){var s=this.a
s.aH(a)
s.aI()},
$S(){return this.b.h("k(0)")}}
A.lg.prototype={
$2(a,b){var s=this.a
s.b_(a,b)
s.aI()},
$S:54}
A.lh.prototype={
$1(a){++this.a.a},
$S(){return this.b.$ti.h("~(1)")}}
A.li.prototype={
$0(){var s=this.b,r=this.a.a,q=s.b7()
s.a=8
s.c=r
A.d2(s,q)},
$S:1}
A.fo.prototype={}
A.d7.prototype={
gdH(){if((this.b&8)===0)return this.a
return this.a.gc0()},
b2(){var s,r=this
if((r.b&8)===0){s=r.a
return s==null?r.a=new A.ea():s}s=r.a.gc0()
return s},
gaB(){var s=this.a
return(this.b&8)!==0?s.gc0():s},
bs(){if((this.b&4)!==0)return new A.bG("Cannot add event after closing")
return new A.bG("Cannot add event while adding a stream")},
ce(){var s=this.c
if(s==null)s=this.c=(this.b&2)!==0?$.fZ():new A.B($.A,t.D)
return s},
C(a,b){if(this.b>=4)throw A.d(this.bs())
this.aH(b)},
a6(){var s=this,r=s.b
if((r&4)!==0)return s.ce()
if(r>=4)throw A.d(s.bs())
s.aI()
return s.ce()},
aI(){var s=this.b|=4
if((s&1)!==0)this.aM()
else if((s&3)===0)this.b2().C(0,B.M)},
aH(a){var s=this.b
if((s&1)!==0)this.aA(a)
else if((s&3)===0)this.b2().C(0,new A.cD(a))},
b_(a,b){var s=this.b
if((s&1)!==0)this.aN(a,b)
else if((s&3)===0)this.b2().C(0,new A.dU(a,b))},
dR(a,b,c,d){var s,r,q,p,o,n,m=this
if((m.b&3)!==0)throw A.d(A.cZ("Stream has already been listened to."))
s=$.A
r=d?1:0
q=A.v5(s,b)
p=new A.dT(m,a,q,c,s,r)
o=m.gdH()
s=m.b|=1
if((s&8)!==0){n=m.a
n.sc0(p)
n.aq()}else m.a=p
p.dN(o)
p.bC(new A.mi(m))
return p},
dJ(a){var s,r,q,p,o,n,m,l=this,k=null
if((l.b&8)!==0)k=l.a.K()
l.a=null
l.b=l.b&4294967286|2
s=l.r
if(s!=null)if(k==null)try{r=s.$0()
if(t.bq.b(r))k=r}catch(o){q=A.K(o)
p=A.aR(o)
n=new A.B($.A,t.D)
n.b1(q,p)
k=n}else k=k.bm(s)
m=new A.mh(l)
if(k!=null)k=k.bm(m)
else m.$0()
return k}}
A.mi.prototype={
$0(){A.nD(this.a.d)},
$S:1}
A.mh.prototype={
$0(){var s=this.a.c
if(s!=null&&(s.a&30)===0)s.af(null)},
$S:1}
A.fP.prototype={
aA(a){this.gaB().aH(a)},
aN(a,b){this.gaB().b_(a,b)},
aM(){this.gaB().dj()}}
A.fB.prototype={
aA(a){this.gaB().aw(new A.cD(a))},
aN(a,b){this.gaB().aw(new A.dU(a,b))},
aM(){this.gaB().aw(B.M)}}
A.b_.prototype={}
A.d8.prototype={}
A.ah.prototype={
gE(a){return(A.cX(this.a)^892482866)>>>0},
N(a,b){if(b==null)return!1
if(this===b)return!0
return b instanceof A.ah&&b.a===this.a}}
A.dT.prototype={
ck(){return this.w.dJ(this)},
b5(){var s=this.w
if((s.b&8)!==0)s.a.aV()
A.nD(s.e)},
b6(){var s=this.w
if((s.b&8)!==0)s.a.aq()
A.nD(s.f)}}
A.dP.prototype={
dN(a){var s=this
if(a==null)return
s.r=a
if(a.c!=null){s.e=(s.e|64)>>>0
a.aY(s)}},
cS(a){var s,r,q=this,p=q.e
if((p&8)!==0)return
s=(p+128|4)>>>0
q.e=s
if(p<128){r=q.r
if(r!=null)if(r.a===1)r.a=3}if((p&4)===0&&(s&32)===0)q.bC(q.gcl())},
aV(){return this.cS(null)},
aq(){var s=this,r=s.e
if((r&8)!==0)return
if(r>=128){r=s.e=r-128
if(r<128)if((r&64)!==0&&s.r.c!=null)s.r.aY(s)
else{r=(r&4294967291)>>>0
s.e=r
if((r&32)===0)s.bC(s.gcm())}}},
K(){var s=this,r=(s.e&4294967279)>>>0
s.e=r
if((r&8)===0)s.bt()
r=s.f
return r==null?$.fZ():r},
bt(){var s,r=this,q=r.e=(r.e|8)>>>0
if((q&64)!==0){s=r.r
if(s.a===1)s.a=3}if((q&32)===0)r.r=null
r.f=r.ck()},
aH(a){var s=this.e
if((s&8)!==0)return
if(s<32)this.aA(a)
else this.aw(new A.cD(a))},
b_(a,b){var s=this.e
if((s&8)!==0)return
if(s<32)this.aN(a,b)
else this.aw(new A.dU(a,b))},
dj(){var s=this,r=s.e
if((r&8)!==0)return
r=(r|2)>>>0
s.e=r
if(r<32)s.aM()
else s.aw(B.M)},
b5(){},
b6(){},
ck(){return null},
aw(a){var s,r=this,q=r.r
if(q==null)q=new A.ea()
r.r=q
q.C(0,a)
s=r.e
if((s&64)===0){s=(s|64)>>>0
r.e=s
if(s<128)q.aY(r)}},
aA(a){var s=this,r=s.e
s.e=(r|32)>>>0
s.d.cX(s.a,a)
s.e=(s.e&4294967263)>>>0
s.bu((r&4)!==0)},
aN(a,b){var s,r=this,q=r.e,p=new A.lT(r,a,b)
if((q&1)!==0){r.e=(q|16)>>>0
r.bt()
s=r.f
if(s!=null&&s!==$.fZ())s.bm(p)
else p.$0()}else{p.$0()
r.bu((q&4)!==0)}},
aM(){var s,r=this,q=new A.lS(r)
r.bt()
r.e=(r.e|16)>>>0
s=r.f
if(s!=null&&s!==$.fZ())s.bm(q)
else q.$0()},
bC(a){var s=this,r=s.e
s.e=(r|32)>>>0
a.$0()
s.e=(s.e&4294967263)>>>0
s.bu((r&4)!==0)},
bu(a){var s,r,q=this,p=q.e
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
if(r)q.b5()
else q.b6()
p=(q.e&4294967263)>>>0
q.e=p}if((p&64)!==0&&p<128)q.r.aY(q)}}
A.lT.prototype={
$0(){var s,r,q=this.a,p=q.e
if((p&8)!==0&&(p&16)===0)return
q.e=(p|32)>>>0
s=q.b
p=this.b
r=q.d
if(t.k.b(s))r.ek(s,p,this.c)
else r.cX(s,p)
q.e=(q.e&4294967263)>>>0},
$S:1}
A.lS.prototype={
$0(){var s=this.a,r=s.e
if((r&16)===0)return
s.e=(r|42)>>>0
s.d.cW(s.c)
s.e=(s.e&4294967263)>>>0},
$S:1}
A.e9.prototype={
bP(a,b,c,d){return this.a.dR(a,d,c,b===!0)},
bO(a,b,c){return this.bP(a,null,b,c)},
e6(a,b){return this.bP(a,null,b,null)}}
A.fE.prototype={
gaE(){return this.a},
saE(a){return this.a=a}}
A.cD.prototype={
bT(a){a.aA(this.b)}}
A.dU.prototype={
bT(a){a.aN(this.b,this.c)}}
A.lU.prototype={
bT(a){a.aM()},
gaE(){return null},
saE(a){throw A.d(A.cZ("No events after a done."))}}
A.fK.prototype={
aY(a){var s=this,r=s.a
if(r===1)return
if(r>=1){s.a=1
return}A.pT(new A.md(s,a))
s.a=1}}
A.md.prototype={
$0(){var s,r,q=this.a,p=q.a
q.a=0
if(p===3)return
s=q.b
r=s.gaE()
q.b=r
if(r==null)q.c=null
s.bT(this.b)},
$S:1}
A.ea.prototype={
C(a,b){var s=this,r=s.c
if(r==null)s.b=s.c=b
else{r.saE(b)
s.c=b}}}
A.fN.prototype={}
A.mo.prototype={}
A.mD.prototype={
$0(){A.tV(this.a,this.b)
A.aW(u.g)},
$S:1}
A.mf.prototype={
cW(a){var s,r,q
try{if(B.i===$.A){a.$0()
return}A.pv(null,null,this,a)}catch(q){s=A.K(q)
r=A.aR(q)
A.de(s,r)}},
em(a,b){var s,r,q
try{if(B.i===$.A){a.$1(b)
return}A.px(null,null,this,a,b)}catch(q){s=A.K(q)
r=A.aR(q)
A.de(s,r)}},
cX(a,b){return this.em(a,b,t.z)},
ej(a,b,c){var s,r,q
try{if(B.i===$.A){a.$2(b,c)
return}A.pw(null,null,this,a,b,c)}catch(q){s=A.K(q)
r=A.aR(q)
A.de(s,r)}},
ek(a,b,c){return this.ej(a,b,c,t.z,t.z)},
cu(a){return new A.mg(this,a)},
eg(a){if($.A===B.i)return a.$0()
return A.pv(null,null,this,a)},
cV(a){return this.eg(a,t.z)},
el(a,b){if($.A===B.i)return a.$1(b)
return A.px(null,null,this,a,b)},
bY(a,b){return this.el(a,b,t.z,t.z)},
ei(a,b,c){if($.A===B.i)return a.$2(b,c)
return A.pw(null,null,this,a,b,c)},
eh(a,b,c){return this.ei(a,b,c,t.z,t.z,t.z)},
ed(a){return a},
bX(a){return this.ed(a,t.z,t.z,t.z)}}
A.mg.prototype={
$0(){return this.a.cW(this.b)},
$S:1}
A.dY.prototype={
gi(a){return this.a},
gA(a){return this.a===0},
gM(){return new A.dZ(this,this.$ti.h("dZ<1>"))},
v(a){var s,r
if(typeof a=="string"&&a!=="__proto__"){s=this.b
return s==null?!1:s[a]!=null}else if(typeof a=="number"&&(a&1073741823)===a){r=this.c
return r==null?!1:r[a]!=null}else return this.dn(a)},
dn(a){var s=this.d
if(s==null)return!1
return this.am(this.cf(s,a),a)>=0},
j(a,b){var s,r,q
if(typeof b=="string"&&b!=="__proto__"){s=this.b
r=s==null?null:A.p6(s,b)
return r}else if(typeof b=="number"&&(b&1073741823)===b){q=this.c
r=q==null?null:A.p6(q,b)
return r}else return this.ds(b)},
ds(a){var s,r,q=this.d
if(q==null)return null
s=this.cf(q,a)
r=this.am(s,a)
return r<0?null:s[r+1]},
m(a,b,c){var s,r,q,p,o,n=this
if(typeof b=="string"&&b!=="__proto__"){s=n.b
n.df(s==null?n.b=A.p7():s,b,c)}else{r=n.d
if(r==null)r=n.d=A.p7()
q=A.fX(b)&1073741823
p=r[q]
if(p==null){A.ns(r,q,[b,c]);++n.a
n.e=null}else{o=n.am(p,b)
if(o>=0)p[o+1]=c
else{p.push(b,c);++n.a
n.e=null}}}},
L(a,b){var s,r,q,p=this,o=p.cd()
for(s=o.length,r=0;r<s;++r){q=o[r]
b.$2(q,p.j(0,q))
if(o!==p.e)throw A.d(A.af(p))}},
cd(){var s,r,q,p,o,n,m,l,k,j,i=this,h=i.e
if(h!=null)return h
h=A.S(i.a,null,!1,t.z)
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
df(a,b,c){if(a[b]==null){++this.a
this.e=null}A.ns(a,b,c)},
cf(a,b){return a[A.fX(b)&1073741823]}}
A.e0.prototype={
am(a,b){var s,r,q
if(a==null)return-1
s=a.length
for(r=0;r<s;r+=2){q=a[r]
if(q==null?b==null:q===b)return r}return-1}}
A.dZ.prototype={
gi(a){return this.a.a},
gA(a){return this.a.a===0},
gD(a){var s=this.a
return new A.e_(s,s.cd(),this.$ti.h("e_<1>"))},
H(a,b){return this.a.v(b)}}
A.e_.prototype={
gt(){return this.d},
p(){var s=this,r=s.b,q=s.c,p=s.a
if(r!==p.e)throw A.d(A.af(p))
else if(q>=r.length){s.d=null
return!1}else{s.d=r[q]
s.c=q+1
return!0}},
$iM:1}
A.e1.prototype={
j(a,b){if(!this.y.$1(b))return null
return this.d4(b)},
m(a,b,c){this.d5(b,c)},
v(a){if(!this.y.$1(a))return!1
return this.d3(a)},
be(a){return this.x.$1(a)&1073741823},
bf(a,b){var s,r,q
if(a==null)return-1
s=a.length
for(r=this.w,q=0;q<s;++q)if(r.$2(a[q].a,b))return q
return-1}}
A.ma.prototype={
$1(a){return this.a.b(a)},
$S:62}
A.b0.prototype={
gD(a){var s=this,r=new A.e2(s,s.r,A.C(s).h("e2<1>"))
r.c=s.e
return r},
gi(a){return this.a},
gA(a){return this.a===0},
ga7(a){return this.a!==0},
H(a,b){var s,r
if(typeof b=="string"&&b!=="__proto__"){s=this.b
if(s==null)return!1
return s[b]!=null}else if(typeof b=="number"&&(b&1073741823)===b){r=this.c
if(r==null)return!1
return r[b]!=null}else return this.dm(b)},
dm(a){var s=this.d
if(s==null)return!1
return this.am(s[this.by(a)],a)>=0},
C(a,b){var s,r,q=this
if(typeof b=="string"&&b!=="__proto__"){s=q.b
return q.c7(s==null?q.b=A.nt():s,b)}else if(typeof b=="number"&&(b&1073741823)===b){r=q.c
return q.c7(r==null?q.c=A.nt():r,b)}else return q.dd(b)},
dd(a){var s,r,q=this,p=q.d
if(p==null)p=q.d=A.nt()
s=q.by(a)
r=p[s]
if(r==null)p[s]=[q.bw(a)]
else{if(q.am(r,a)>=0)return!1
r.push(q.bw(a))}return!0},
ee(a,b){var s=this
if(typeof b=="string"&&b!=="__proto__")return s.co(s.b,b)
else if(typeof b=="number"&&(b&1073741823)===b)return s.co(s.c,b)
else return s.dK(b)},
dK(a){var s,r,q,p,o=this,n=o.d
if(n==null)return!1
s=o.by(a)
r=n[s]
q=o.am(r,a)
if(q<0)return!1
p=r.splice(q,1)[0]
if(0===r.length)delete n[s]
o.ct(p)
return!0},
dr(a,b){var s,r,q,p,o=this,n=o.e
for(;n!=null;n=r){s=n.a
r=n.b
q=o.r
p=a.$1(s)
if(q!==o.r)throw A.d(A.af(o))
if(!1===p)o.ee(0,s)}},
cv(a){var s=this
if(s.a>0){s.b=s.c=s.d=s.e=s.f=null
s.a=0
s.bD()}},
c7(a,b){if(a[b]!=null)return!1
a[b]=this.bw(b)
return!0},
co(a,b){var s
if(a==null)return!1
s=a[b]
if(s==null)return!1
this.ct(s)
delete a[b]
return!0},
bD(){this.r=this.r+1&1073741823},
bw(a){var s,r=this,q=new A.mb(a)
if(r.e==null)r.e=r.f=q
else{s=r.f
s.toString
q.c=s
r.f=s.b=q}++r.a
r.bD()
return q},
ct(a){var s=this,r=a.c,q=a.b
if(r==null)s.e=q
else r.b=q
if(q==null)s.f=r
else q.c=r;--s.a
s.bD()},
by(a){return J.bW(a)&1073741823},
am(a,b){var s,r
if(a==null)return-1
s=a.length
for(r=0;r<s;++r)if(J.aj(a[r].a,b))return r
return-1}}
A.mb.prototype={}
A.e2.prototype={
gt(){return this.d},
p(){var s=this,r=s.c,q=s.a
if(s.b!==q.r)throw A.d(A.af(q))
else if(r==null){s.d=null
return!1}else{s.d=r.a
s.c=r.b
return!0}},
$iM:1}
A.aY.prototype={
ah(a,b){return new A.aY(J.nf(this.a,b),b.h("aY<0>"))},
gi(a){return J.a3(this.a)},
j(a,b){return J.eA(this.a,b)}}
A.du.prototype={}
A.dy.prototype={$ip:1,$ij:1,$io:1}
A.n.prototype={
gD(a){return new A.a9(a,this.gi(a),A.ai(a).h("a9<n.E>"))},
T(a,b){return this.j(a,b)},
gA(a){return this.gi(a)===0},
ga7(a){return!this.gA(a)},
gcD(a){if(this.gi(a)===0)throw A.d(A.ni())
return this.j(a,0)},
H(a,b){var s,r=this.gi(a)
for(s=0;s<r;++s){if(J.aj(this.j(a,s),b))return!0
if(r!==this.gi(a))throw A.d(A.af(a))}return!1},
ba(a,b){var s,r=this.gi(a)
for(s=0;s<r;++s){if(!b.$1(this.j(a,s)))return!1
if(r!==this.gi(a))throw A.d(A.af(a))}return!0},
aP(a,b){var s,r=this.gi(a)
for(s=0;s<r;++s){if(b.$1(this.j(a,s)))return!0
if(r!==this.gi(a))throw A.d(A.af(a))}return!1},
aj(a,b,c){return new A.aa(a,b,A.ai(a).h("@<n.E>").I(c).h("aa<1,2>"))},
a5(a,b){return A.dM(a,b,null,A.ai(a).h("n.E"))},
aW(a,b){var s,r,q,p,o=this
if(o.gA(a)){s=J.b8(0,A.ai(a).h("n.E"))
return s}r=o.j(a,0)
q=A.S(o.gi(a),r,!1,A.ai(a).h("n.E"))
for(p=1;p<o.gi(a);++p)q[p]=o.j(a,p)
return q},
bZ(a){var s,r=A.ox(A.ai(a).h("n.E"))
for(s=0;s<this.gi(a);++s)r.C(0,this.j(a,s))
return r},
C(a,b){var s=this.gi(a)
this.si(a,s+1)
this.m(a,s,b)},
ah(a,b){return new A.b5(a,A.ai(a).h("@<n.E>").I(b).h("b5<1,2>"))},
a0(a,b,c){var s=this.gi(a)
A.aP(b,c,s)
return A.ut(this.aX(a,b,c),A.ai(a).h("n.E"))},
aX(a,b,c){A.aP(b,c,this.gi(a))
return A.dM(a,b,c,A.ai(a).h("n.E"))},
e1(a,b,c,d){var s
A.aP(b,c,this.gi(a))
for(s=b;s<c;++s)this.m(a,s,d)},
a4(a,b,c,d,e){var s,r,q,p,o
A.aP(b,c,this.gi(a))
s=c-b
if(s===0)return
A.aV(e,"skipCount")
if(A.ai(a).h("o<n.E>").b(d)){r=e
q=d}else{q=J.og(d,e).aW(0,!1)
r=0}p=J.T(q)
if(r+s>p.gi(q))throw A.d(A.u5())
if(r<b)for(o=s-1;o>=0;--o)this.m(a,b+o,p.j(q,r+o))
else for(o=0;o<s;++o)this.m(a,b+o,p.j(q,r+o))},
bN(a,b){var s
for(s=0;s<this.gi(a);++s)if(J.aj(this.j(a,s),b))return s
return-1},
k(a){return A.iH(a,"[","]")}}
A.dz.prototype={}
A.jK.prototype={
$2(a,b){var s,r=this.a
if(!r.a)this.b.a+=", "
r.a=!1
r=this.b
s=r.a+=A.b(a)
r.a=s+": "
r.a+=A.b(b)},
$S:63}
A.I.prototype={
ai(a,b,c){var s=A.C(this)
return A.oA(this,s.h("I.K"),s.h("I.V"),b,c)},
L(a,b){var s,r
for(s=this.gM(),s=s.gD(s);s.p();){r=s.gt()
b.$2(r,this.j(0,r))}},
ge0(){return this.gM().aj(0,new A.jL(this),A.C(this).h("cU<I.K,I.V>"))},
v(a){return this.gM().H(0,a)},
gi(a){var s=this.gM()
return s.gi(s)},
gA(a){var s=this.gM()
return s.gA(s)},
k(a){return A.nn(this)},
$ih:1}
A.jL.prototype={
$1(a){var s=this.a,r=A.C(s)
return new A.cU(a,s.j(0,a),r.h("@<I.K>").I(r.h("I.V")).h("cU<1,2>"))},
$S(){return A.C(this.a).h("cU<I.K,I.V>(I.K)")}}
A.fS.prototype={
m(a,b,c){throw A.d(A.ac("Cannot modify unmodifiable map"))}}
A.dA.prototype={
ai(a,b,c){return this.a.ai(0,b,c)},
j(a,b){return this.a.j(0,b)},
m(a,b,c){this.a.m(0,b,c)},
v(a){return this.a.v(a)},
L(a,b){this.a.L(0,b)},
gA(a){var s=this.a
return s.gA(s)},
gi(a){var s=this.a
return s.gi(s)},
gM(){return this.a.gM()},
k(a){return this.a.k(0)},
$ih:1}
A.bk.prototype={
ai(a,b,c){return new A.bk(this.a.ai(0,b,c),b.h("@<0>").I(c).h("bk<1,2>"))}}
A.cY.prototype={
gA(a){return this.gi(this)===0},
ga7(a){return this.gi(this)!==0},
F(a,b){var s
for(s=J.aC(b);s.p();)this.C(0,s.gt())},
aj(a,b,c){return new A.c7(this,b,A.C(this).h("@<1>").I(c).h("c7<1,2>"))},
k(a){return A.iH(this,"{","}")},
ba(a,b){var s
for(s=this.gD(this);s.p();)if(!b.$1(s.gt()))return!1
return!0},
a5(a,b){return A.oT(this,b,A.C(this).c)},
bb(a,b,c){var s,r
for(s=this.gD(this);s.p();){r=s.gt()
if(b.$1(r))return r}return c.$0()},
T(a,b){var s,r,q,p="index"
A.bS(b,p,t.S)
A.aV(b,p)
for(s=this.gD(this),r=0;s.p();){q=s.gt()
if(b===r)return q;++r}throw A.d(A.eS(b,this,p,null,r))}}
A.d5.prototype={$ip:1,$ij:1,$icz:1}
A.fT.prototype={
C(a,b){A.vo()
return A.aW(u.g)}}
A.ei.prototype={
H(a,b){return this.a.v(b)},
gD(a){var s=this.a.gM()
return s.gD(s)},
gi(a){var s=this.a
return s.gi(s)}}
A.e3.prototype={}
A.eh.prototype={}
A.em.prototype={}
A.en.prototype={}
A.fI.prototype={
j(a,b){var s,r=this.b
if(r==null)return this.c.j(0,b)
else if(typeof b!="string")return null
else{s=r[b]
return typeof s=="undefined"?this.dI(b):s}},
gi(a){return this.b==null?this.c.a:this.aJ().length},
gA(a){return this.gi(this)===0},
gM(){if(this.b==null){var s=this.c
return new A.aM(s,A.C(s).h("aM<1>"))}return new A.fJ(this)},
m(a,b,c){var s,r,q=this
if(q.b==null)q.c.m(0,b,c)
else if(q.v(b)){s=q.b
s[b]=c
r=q.a
if(r==null?s!=null:r!==s)r[b]=null}else q.dS().m(0,b,c)},
v(a){if(this.b==null)return this.c.v(a)
if(typeof a!="string")return!1
return Object.prototype.hasOwnProperty.call(this.a,a)},
L(a,b){var s,r,q,p,o=this
if(o.b==null)return o.c.L(0,b)
s=o.aJ()
for(r=0;r<s.length;++r){q=s[r]
p=o.b[q]
if(typeof p=="undefined"){p=A.ms(o.a[q])
o.b[q]=p}b.$2(q,p)
if(s!==o.c)throw A.d(A.af(o))}},
aJ(){var s=this.c
if(s==null)s=this.c=A.a(Object.keys(this.a),t.s)
return s},
dS(){var s,r,q,p,o,n=this
if(n.b==null)return n.c
s=A.a8(t.R,t.z)
r=n.aJ()
for(q=0;p=r.length,q<p;++q){o=r[q]
s.m(0,o,n.j(0,o))}if(p===0)r.push("")
else B.d.si(r,0)
n.a=n.b=null
return n.c=s},
dI(a){var s
if(!Object.prototype.hasOwnProperty.call(this.a,a))return null
s=A.ms(this.a[a])
return this.b[a]=s}}
A.fJ.prototype={
gi(a){var s=this.a
return s.gi(s)},
T(a,b){var s=this.a
return s.b==null?s.gM().T(0,b):s.aJ()[b]},
gD(a){var s=this.a
if(s.b==null){s=s.gM()
s=s.gD(s)}else{s=s.aJ()
s=new J.b4(s,s.length,A.Z(s).h("b4<1>"))}return s},
H(a,b){return this.a.v(b)}}
A.m9.prototype={
a6(){var s,r,q,p=this
p.d9()
s=p.a
r=s.a
s.a=""
s=p.c
q=s.b
q.push(A.pu(r.charCodeAt(0)==0?r:r,p.b))
s.a.$1(q)}}
A.lv.prototype={
$0(){var s,r
try{s=new TextDecoder("utf-8",{fatal:true})
return s}catch(r){}return null},
$S:6}
A.lu.prototype={
$0(){var s,r
try{s=new TextDecoder("utf-8",{fatal:false})
return s}catch(r){}return null},
$S:6}
A.h9.prototype={
ea(a,b,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c="Invalid base64 encoding length "
a0=A.aP(b,a0,a.length)
s=$.oa()
for(r=b,q=r,p=null,o=-1,n=-1,m=0;r<a0;r=l){l=r+1
k=B.a.J(a,r)
if(k===37){j=l+2
if(j<=a0){i=A.pP(a,l)
if(i===37)i=-1
l=j}else i=-1}else i=k
if(0<=i&&i<=127){h=s[i]
if(h>=0){i=B.a.B("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",h)
if(i===k)continue
k=i}else{if(h===-1){if(o<0){g=p==null?null:p.a.length
if(g==null)g=0
o=g+(r-q)
n=r}++m
if(k===61)continue}k=i}if(h!==-2){if(p==null){p=new A.ab("")
g=p}else g=p
f=g.a+=B.a.u(a,q,r)
g.a=f+A.bd(k)
q=l
continue}}throw A.d(A.P("Invalid base64 data",a,r))}if(p!=null){g=p.a+=B.a.u(a,q,a0)
f=g.length
if(o>=0)A.oj(a,n,a0,o,m,f)
else{e=B.c.bo(f-1,4)+1
if(e===1)throw A.d(A.P(c,a,a0))
for(;e<4;){g+="="
p.a=g;++e}}g=p.a
return B.a.aF(a,b,a0,g.charCodeAt(0)==0?g:g)}d=a0-b
if(o>=0)A.oj(a,n,a0,o,m,d)
else{e=B.c.bo(d,4)
if(e===1)throw A.d(A.P(c,a,a0))
if(e>1)a=B.a.aF(a,a0,a0,e===2?"==":"=")}return a}}
A.hb.prototype={}
A.ha.prototype={
dX(a,b){var s,r,q,p=A.aP(b,null,a.length)
if(b===p)return new Uint8Array(0)
s=new A.lR()
r=s.dZ(a,b,p)
r.toString
q=s.a
if(q<-1)A.a0(A.P("Missing padding character",a,p))
if(q>0)A.a0(A.P("Invalid length, must be multiple of four",a,p))
s.a=-1
return r}}
A.lR.prototype={
dZ(a,b,c){var s,r=this,q=r.a
if(q<0){r.a=A.p4(a,b,c,q)
return null}if(b===c)return new Uint8Array(0)
s=A.v2(a,b,c,q)
r.a=A.v4(a,b,c,s,0,r.a)
return s}}
A.hc.prototype={}
A.eF.prototype={}
A.fL.prototype={}
A.eJ.prototype={}
A.eL.prototype={}
A.hV.prototype={}
A.iP.prototype={
dY(a){var s=A.pu(a,this.gcB().a)
return s},
gcB(){return B.bY}}
A.iQ.prototype={}
A.lj.prototype={}
A.lk.prototype={}
A.eb.prototype={
a6(){}}
A.mm.prototype={
a6(){this.a.e2(this.c)
this.b.a6()},
dT(a,b,c,d){this.c.a+=this.a.cA(a,b,c,!1)}}
A.ls.prototype={}
A.lt.prototype={
dW(a){var s=this.a,r=A.uX(s,a,0,null)
if(r!=null)return r
return new A.fU(s).cA(a,0,null,!0)}}
A.fU.prototype={
cA(a,b,c,d){var s,r,q,p,o,n=this,m=A.aP(b,c,J.a3(a))
if(b===m)return""
if(t.gc.b(a)){s=a
r=0}else{s=A.vF(a,b,m)
m-=b
r=b
b=0}q=n.bz(s,b,m,d)
p=n.b
if((p&1)!==0){o=A.pk(p)
n.b=0
throw A.d(A.P(o,a,r+n.c))}return q},
bz(a,b,c,d){var s,r,q=this
if(c-b>1000){s=B.c.bG(b+c,2)
r=q.bz(a,b,s,!1)
if((q.b&1)!==0)return r
return r+q.bz(a,s,c,d)}return q.e_(a,b,c,d)},
e2(a){var s=this.b
this.b=0
if(s<=32)return
if(this.a)a.a+=A.bd(65533)
else throw A.d(A.P(A.pk(77),null,null))},
e_(a,b,c,d){var s,r,q,p,o,n,m,l=this,k=65533,j=l.b,i=l.c,h=new A.ab(""),g=b+1,f=a[b]
$label0$0:for(s=l.a;!0;){for(;!0;g=p){r=B.a.J("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFFFFFFFFFFFFFFFFGGGGGGGGGGGGGGGGHHHHHHHHHHHHHHHHHHHHHHHHHHHIHHHJEEBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBKCCCCCCCCCCCCDCLONNNMEEEEEEEEEEE",f)&31
i=j<=32?f&61694>>>r:(f&63|i<<6)>>>0
j=B.a.J(" \x000:XECCCCCN:lDb \x000:XECCCCCNvlDb \x000:XECCCCCN:lDb AAAAA\x00\x00\x00\x00\x00AAAAA00000AAAAA:::::AAAAAGG000AAAAA00KKKAAAAAG::::AAAAA:IIIIAAAAA000\x800AAAAA\x00\x00\x00\x00 AAAAA",j+r)
if(j===0){h.a+=A.bd(i)
if(g===c)break $label0$0
break}else if((j&1)!==0){if(s)switch(j){case 69:case 67:h.a+=A.bd(k)
break
case 65:h.a+=A.bd(k);--g
break
default:q=h.a+=A.bd(k)
h.a=q+A.bd(k)
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
break}p=n}if(o-g<20)for(m=g;m<o;++m)h.a+=A.bd(a[m])
else h.a+=A.oV(a,g,o)
if(o===c)break $label0$0
g=p}else g=p}if(d&&j>32)if(s)h.a+=A.bd(k)
else{l.b=77
l.c=c
return""}l.b=j
l.c=i
s=h.a
return s.charCodeAt(0)==0?s:s}}
A.jY.prototype={
$2(a,b){var s=this.b,r=this.a,q=s.a+=r.a
q+=A.b(a.a)
s.a=q
s.a=q+": "
s.a+=A.cO(b)
r.a=", "},
$S:74}
A.dm.prototype={
N(a,b){if(b==null)return!1
return b instanceof A.dm&&this.a===b.a&&this.b===b.b},
gE(a){var s=this.a
return(s^B.c.ag(s,30))&1073741823},
er(){var s,r
if(this.b)return this
s=this.a
if(Math.abs(s)<=864e13)r=!1
else r=!0
if(r)A.a0(A.R("DateTime is outside valid range: "+s,null))
A.bS(!0,"isUtc",t.y)
return new A.dm(s,!0)},
k(a){var s=this,r=A.op(A.fh(s)),q=A.b6(A.oN(s)),p=A.b6(A.oJ(s)),o=A.b6(A.oK(s)),n=A.b6(A.oM(s)),m=A.b6(A.oO(s)),l=A.oq(A.oL(s)),k=r+"-"+q
if(s.b)return k+"-"+p+" "+o+":"+n+":"+m+"."+l+"Z"
else return k+"-"+p+" "+o+":"+n+":"+m+"."+l},
eq(){var s=this,r=A.fh(s)>=-9999&&A.fh(s)<=9999?A.op(A.fh(s)):A.tS(A.fh(s)),q=A.b6(A.oN(s)),p=A.b6(A.oJ(s)),o=A.b6(A.oK(s)),n=A.b6(A.oM(s)),m=A.b6(A.oO(s)),l=A.oq(A.oL(s)),k=r+"-"+q
if(s.b)return k+"-"+p+"T"+o+":"+n+":"+m+"."+l+"Z"
else return k+"-"+p+"T"+o+":"+n+":"+m+"."+l}}
A.lV.prototype={}
A.G.prototype={
gaZ(){return A.aR(this.$thrownJsError)}}
A.eC.prototype={
k(a){var s=this.a
if(s!=null)return"Assertion failed: "+A.cO(s)
return"Assertion failed"}}
A.aX.prototype={}
A.fd.prototype={
k(a){return"Throw of null."}}
A.ar.prototype={
gbB(){return"Invalid argument"+(!this.a?"(s)":"")},
gbA(){return""},
k(a){var s=this,r=s.c,q=r==null?"":" ("+r+")",p=s.d,o=p==null?"":": "+A.b(p),n=s.gbB()+q+o
if(!s.a)return n
return n+s.gbA()+": "+A.cO(s.b)}}
A.dI.prototype={
gbB(){return"RangeError"},
gbA(){var s,r=this.e,q=this.f
if(r==null)s=q!=null?": Not less than or equal to "+A.b(q):""
else if(q==null)s=": Not greater than or equal to "+A.b(r)
else if(q>r)s=": Not in inclusive range "+A.b(r)+".."+A.b(q)
else s=q<r?": Valid value range is empty":": Only valid value is "+A.b(r)
return s}}
A.eR.prototype={
gbB(){return"RangeError"},
gbA(){if(this.b<0)return": index must not be negative"
var s=this.f
if(s===0)return": no indices are valid"
return": index should be less than "+s},
gi(a){return this.f}}
A.fb.prototype={
k(a){var s,r,q,p,o,n,m,l,k=this,j={},i=new A.ab("")
j.a=""
s=k.c
for(r=s.length,q=0,p="",o="";q<r;++q,o=", "){n=s[q]
i.a=p+o
p=i.a+=A.cO(n)
j.a=", "}k.d.L(0,new A.jY(j,i))
m=A.cO(k.a)
l=i.k(0)
return"NoSuchMethodError: method not found: '"+A.b(k.b.a)+"'\nReceiver: "+m+"\nArguments: ["+l+"]"}}
A.fv.prototype={
k(a){return"Unsupported operation: "+this.a}}
A.fq.prototype={
k(a){var s=this.a
return s!=null?"UnimplementedError: "+s:"UnimplementedError"}}
A.bG.prototype={
k(a){return"Bad state: "+this.a}}
A.eK.prototype={
k(a){var s=this.a
if(s==null)return"Concurrent modification during iteration."
return"Concurrent modification during iteration: "+A.cO(s)+"."}}
A.ff.prototype={
k(a){return"Out of Memory"},
gaZ(){return null},
$iG:1}
A.dK.prototype={
k(a){return"Stack Overflow"},
gaZ(){return null},
$iG:1}
A.eM.prototype={
k(a){var s=this.a
return s==null?"Reading static variable during its initialization":"Reading static variable '"+s+"' during its initialization"}}
A.dW.prototype={
k(a){return"Exception: "+this.a},
$ia7:1}
A.aI.prototype={
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
i=""}return g+j+B.a.u(e,k,l)+i+"\n"+B.a.bp(" ",f-k+j.length)+"^\n"}else return f!=null?g+(" (at offset "+A.b(f)+")"):g},
$ia7:1}
A.j.prototype={
ah(a,b){return A.hd(this,A.C(this).h("j.E"),b)},
aj(a,b,c){return A.jM(this,b,A.C(this).h("j.E"),c)},
H(a,b){var s
for(s=this.gD(this);s.p();)if(J.aj(s.gt(),b))return!0
return!1},
aP(a,b){var s
for(s=this.gD(this);s.p();)if(b.$1(s.gt()))return!0
return!1},
aW(a,b){return A.ct(this,!1,A.C(this).h("j.E"))},
gi(a){var s,r=this.gD(this)
for(s=0;r.p();)++s
return s},
gA(a){return!this.gD(this).p()},
ga7(a){return!this.gA(this)},
a5(a,b){return A.oT(this,b,A.C(this).h("j.E"))},
T(a,b){var s,r,q
A.aV(b,"index")
for(s=this.gD(this),r=0;s.p();){q=s.gt()
if(b===r)return q;++r}throw A.d(A.eS(b,this,"index",null,r))},
k(a){return A.u4(this,"(",")")}}
A.dX.prototype={
T(a,b){var s=this.a
if(0>b||b>=s)A.a0(A.eS(b,this,"index",null,s))
return this.b.$1(b)},
gi(a){return this.a}}
A.M.prototype={}
A.cU.prototype={
k(a){return"MapEntry("+A.b(this.a)+": "+A.b(this.b)+")"}}
A.k.prototype={
gE(a){return A.c.prototype.gE.call(this,this)},
k(a){return"null"}}
A.c.prototype={$ic:1,
N(a,b){return this===b},
gE(a){return A.cX(this)},
k(a){return"Instance of '"+A.b(A.k5(this))+"'"},
bj(a,b){throw A.d(A.oG(this,b.gcP(),b.gcT(),b.gcQ()))},
toString(){return this.k(this)}}
A.fO.prototype={
k(a){return""},
$iam:1}
A.ab.prototype={
gi(a){return this.a.length},
k(a){var s=this.a
return s.charCodeAt(0)==0?s:s}}
A.lp.prototype={
$2(a,b){throw A.d(A.P("Illegal IPv4 address, "+a,this.a,b))},
$S:86}
A.lq.prototype={
$2(a,b){throw A.d(A.P("Illegal IPv6 address, "+a,this.a,b))},
$S:87}
A.lr.prototype={
$2(a,b){var s
if(b-a>4)this.a.$2("an IPv6 part can only contain a maximum of 4 hex digits",a)
s=A.cH(B.a.u(this.b,a,b),16)
if(s<0||s>65535)this.a.$2("each part must be in the range of `0x0..0xFFFF`",a)
return s},
$S:88}
A.ej.prototype={
gcr(){var s,r,q,p,o=this,n=o.w
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
A.pt(n,"_text")
n=o.w=s.charCodeAt(0)==0?s:s}return n},
gE(a){var s,r=this,q=r.y
if(q===$){s=B.a.gE(r.gcr())
A.pt(r.y,"hashCode")
r.y=s
q=s}return q},
gcZ(){return this.b},
gbM(){var s=this.c
if(s==null)return""
if(B.a.W(s,"["))return B.a.u(s,1,s.length-1)
return s},
gbU(){var s=this.d
return s==null?A.pe(this.a):s},
gcU(){var s=this.f
return s==null?"":s},
gcE(){var s=this.r
return s==null?"":s},
gcG(){return this.a.length!==0},
gbJ(){return this.c!=null},
gbL(){return this.f!=null},
gbK(){return this.r!=null},
gcF(){return B.a.W(this.e,"/")},
k(a){return this.gcr()},
N(a,b){var s,r,q=this
if(b==null)return!1
if(q===b)return!0
if(t.n.b(b))if(q.a===b.gc3())if(q.c!=null===b.gbJ())if(q.b===b.gcZ())if(q.gbM()===b.gbM())if(q.gbU()===b.gbU())if(q.e===b.gcR()){s=q.f
r=s==null
if(!r===b.gbL()){if(r)s=""
if(s===b.gcU()){s=q.r
r=s==null
if(!r===b.gbK()){if(r)s=""
s=s===b.gcE()}else s=!1}else s=!1}else s=!1}else s=!1
else s=!1
else s=!1
else s=!1
else s=!1
else s=!1
else s=!1
return s},
$iaZ:1,
gc3(){return this.a},
gcR(){return this.e}}
A.ln.prototype={
gbl(a){var s,r,q,p,o=this,n=null,m=o.c
if(m==null){m=o.a
s=o.b[0]+1
r=B.a.bd(m,"?",s)
q=m.length
if(r>=0){p=A.ek(m,r+1,q,B.D,!1)
q=r}else p=n
m=o.c=new A.fD("data","",n,n,A.ek(m,s,q,B.aw,!1),p,n)}return m},
gbQ(){var s=this.b,r=s[0]+1,q=s[1]
if(r===q)return"text/plain"
return A.vE(this.a,r,q,B.ab,!1)},
cz(){var s,r,q,p,o,n,m,l,k=this.a,j=this.b,i=B.d.gaS(j)+1
if((j.length&1)===1)return B.b7.dX(k,i)
j=k.length
s=j-i
for(r=i;r<j;++r)if(B.a.B(k,r)===37){r+=2
s-=2}q=new Uint8Array(s)
if(s===j){B.j.a4(q,0,s,new A.cL(k),i)
return q}for(r=i,p=0;r<j;++r){o=B.a.B(k,r)
if(o!==37){n=p+1
q[p]=o}else{m=r+2
if(m<j){l=A.pP(k,r+1)
if(l>=0){n=p+1
q[p]=l
r=m
p=n
continue}}throw A.d(A.P("Invalid percent escape",k,r))}p=n}return q},
k(a){var s=this.a
return this.b[0]===-1?"data:"+s:s}}
A.mt.prototype={
$2(a,b){var s=this.a[a]
B.j.e1(s,0,96,b)
return s},
$S:95}
A.mu.prototype={
$3(a,b,c){var s,r
for(s=b.length,r=0;r<s;++r)a[B.a.J(b,r)^96]=c},
$S:17}
A.mv.prototype={
$3(a,b,c){var s,r
for(s=B.a.J(b,0),r=B.a.J(b,1);s<=r;++s)a[(s^96)>>>0]=c},
$S:17}
A.fM.prototype={
gcG(){return this.b>0},
gbJ(){return this.c>0},
gbL(){return this.f<this.r},
gbK(){return this.r<this.a.length},
gcF(){return B.a.X(this.a,"/",this.e)},
gc3(){var s=this.w
return s==null?this.w=this.dl():s},
dl(){var s,r=this,q=r.b
if(q<=0)return""
s=q===4
if(s&&B.a.W(r.a,"http"))return"http"
if(q===5&&B.a.W(r.a,"https"))return"https"
if(s&&B.a.W(r.a,"file"))return"file"
if(q===7&&B.a.W(r.a,"package"))return"package"
return B.a.u(r.a,0,q)},
gcZ(){var s=this.c,r=this.b+3
return s>r?B.a.u(this.a,r,s-1):""},
gbM(){var s=this.c
return s>0?B.a.u(this.a,s,this.d):""},
gbU(){var s,r=this
if(r.c>0&&r.d+1<r.e)return A.cH(B.a.u(r.a,r.d+1,r.e),null)
s=r.b
if(s===4&&B.a.W(r.a,"http"))return 80
if(s===5&&B.a.W(r.a,"https"))return 443
return 0},
gcR(){return B.a.u(this.a,this.e,this.f)},
gcU(){var s=this.f,r=this.r
return s<r?B.a.u(this.a,s+1,r):""},
gcE(){var s=this.r,r=this.a
return s<r.length?B.a.br(r,s+1):""},
gE(a){var s=this.x
return s==null?this.x=B.a.gE(this.a):s},
N(a,b){if(b==null)return!1
if(this===b)return!0
return t.n.b(b)&&this.a===b.k(0)},
k(a){return this.a},
$iaZ:1}
A.fD.prototype={}
A.mr.prototype={
$1(a){var s,r,q,p=this.a
if(p.v(a))return p.j(0,a)
if(t.I.b(a)){s={}
p.m(0,a,s)
for(p=a.gM(),p=p.gD(p);p.p();){r=p.gt()
s[r]=this.$1(a.j(0,r))}return s}else if(t.j.b(a)){q=[]
p.m(0,a,q)
B.d.F(q,J.br(a,this,t.z))
return q}else return a},
$S:122}
A.a4.prototype={
gcj(){var s,r=this.y
if(r===5121||r===5120){s=this.Q
s=s==="MAT2"||s==="MAT3"}else s=!1
if(!s)r=(r===5123||r===5122)&&this.Q==="MAT3"
else r=!0
return r},
gab(){var s=B.m.j(0,this.Q)
return s==null?0:s},
gac(){var s=this,r=s.y
if(r===5121||r===5120){r=s.Q
if(r==="MAT2")return 6
else if(r==="MAT3")return 11
return s.gab()}else if(r===5123||r===5122){if(s.Q==="MAT3")return 22
return 2*s.gab()}return 4*s.gab()},
gao(){var s=this,r=s.cx
if(r!==0)return r
r=s.y
if(r===5121||r===5120){r=s.Q
if(r==="MAT2")return 8
else if(r==="MAT3")return 12
return s.gab()}else if(r===5123||r===5122){if(s.Q==="MAT3")return 24
return 2*s.gab()}return 4*s.gab()},
gaQ(){return this.gao()*(this.z-1)+this.gac()},
q(a,b){var s,r,q,p=this,o="bufferView",n=a.y,m=p.w,l=p.CW=n.j(0,m),k=l==null
if(!k&&l.z!==-1)p.cx=l.z
if(p.y===-1||p.z===-1||p.Q==null)return
if(m!==-1)if(k)b.l($.N(),A.a([m],t.M),o)
else{l.a$=!0
l=l.z
if(l!==-1&&l<p.gac())b.G($.qD(),A.a([p.CW.z,p.gac()],t.M))
A.bs(p.x,p.ch,p.gaQ(),p.CW,m,b)}m=p.ay
if(m!=null){l=m.d
if(l!==-1)k=!1
else k=!0
if(k)return
k=b.c
k.push("sparse")
s=p.z
if(l>s)b.l($.rl(),A.a([l,s],t.M),"count")
s=m.f
r=s.d
s.f=n.j(0,r)
k.push("indices")
q=m.e
m=q.d
if(m!==-1){n=q.r=n.j(0,m)
if(n==null)b.l($.N(),A.a([m],t.M),o)
else{n.S(B.o,o,b)
if(q.r.z!==-1)b.n($.nc(),o)
n=q.f
if(n!==-1)A.bs(q.e,A.b1(n),A.b1(n)*l,q.r,m,b)}}k.pop()
k.push("values")
if(r!==-1){n=s.f
if(n==null)b.l($.N(),A.a([r],t.M),o)
else{n.S(B.o,o,b)
if(s.f.z!==-1)b.n($.nc(),o)
n=p.ch
m=B.m.j(0,p.Q)
if(m==null)m=0
A.bs(s.e,n,n*m*l,s.f,r,b)}}k.pop()
k.pop()}},
S(a,b,c){var s
this.a$=!0
s=this.fr
if(s==null)this.fr=a
else if(s!==a)c.l($.qF(),A.a([s,a],t.M),b)},
ew(a){var s=this.dy
if(s==null)this.dy=a
else if(s!==a)return!1
return!0},
eb(a){var s,r,q=this
if(!q.as||5126===q.y){a.toString
return a}s=q.ch*8
r=q.y
if(r===5120||r===5122||r===5124)return Math.max(a/(B.c.aG(1,s-1)-1),-1)
else return a/(B.c.aG(1,s)-1)}}
A.fy.prototype={
ad(){var s=this
return A.bQ(function(){var r=0,q=2,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0
return function $async$ad(a1,a2){if(a1===1){p=a2
r=q}while(true)switch(r){case 0:a0=s.y
if(a0===-1||s.z===-1||s.Q==null){r=1
break}o=s.gab()
n=s.z
m=s.CW
if(m!=null){m=m.as
if((m==null?null:m.z)==null){r=1
break}if(s.gao()<s.gac()){r=1
break}m=s.x
l=s.ch
if(!A.bs(m,l,s.gaQ(),s.CW,null,null)){r=1
break}k=s.CW
j=A.oi(a0,k.as.z.buffer,k.x+m,B.c.av(s.gaQ(),l))
if(j==null){r=1
break}i=j.length
if(s.gcj()){m=B.c.av(s.gao(),l)
l=s.Q==="MAT2"
k=l?8:12
h=l?2:3
g=new A.lJ(i,j,h,h,m-k).$0()}else g=new A.lK(j).$3(i,o,B.c.av(s.gao(),l)-o)}else g=A.ot(n*o,new A.lL(),t.e)
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
if(A.bs(m,A.b1(e),A.b1(e)*f,n.r,null,null)){d=s.ch
c=B.m.j(0,s.Q)
if(c==null)c=0
c=!A.bs(k,d,d*c*f,l.f,null,null)
d=c}else d=!0
if(d){r=1
break}n=n.r
b=A.nh(e,n.as.z.buffer,n.x+m,f)
l=l.f
a=A.oi(a0,l.as.z.buffer,l.x+k,f*o)
if(b==null||a==null){r=1
break}g=new A.lM(s,b,g,o,a).$0()}r=3
return A.m7(g)
case 3:case 1:return A.bL()
case 2:return A.bM(p)}}},t.e)},
bn(){var s=this
return A.bQ(function(){var r=0,q=1,p,o,n,m,l
return function $async$bn(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:m=s.ch*8
l=s.y
l=l===5120||l===5122||l===5124
o=t.F
r=l?2:4
break
case 2:l=B.c.aG(1,m-1)
n=s.ad()
n.toString
r=5
return A.m7(A.jM(n,new A.lH(1/(l-1)),n.$ti.h("j.E"),o))
case 5:r=3
break
case 4:l=B.c.aG(1,m)
n=s.ad()
n.toString
r=6
return A.m7(A.jM(n,new A.lI(1/(l-1)),n.$ti.h("j.E"),o))
case 6:case 3:return A.bL()
case 1:return A.bM(p)}}},t.F)}}
A.lJ.prototype={
$0(){var s=this
return A.bQ(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h
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
case 3:return A.bL()
case 1:return A.bM(p)}}},t.e)},
$S:18}
A.lK.prototype={
$3(a,b,c){return this.d0(a,b,c)},
d0(a,b,c){var s=this
return A.bQ(function(){var r=a,q=b,p=c
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
case 3:return A.bL()
case 1:return A.bM(m)}}},t.e)},
$S:31}
A.lL.prototype={
$1(a){return 0},
$S:32}
A.lM.prototype={
$0(){var s=this
return A.bQ(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h,g,f
return function $async$$0(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:g=s.b
f=g[0]
o=J.aC(s.c),n=s.d,m=s.a.ay,l=s.e,k=0,j=0,i=0
case 2:if(!o.p()){r=3
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
case 3:return A.bL()
case 1:return A.bM(p)}}},t.e)},
$S:18}
A.lH.prototype={
$1(a){return Math.max(a*this.a,-1)},
$S:7}
A.lI.prototype={
$1(a){return a*this.a},
$S:7}
A.fx.prototype={
ad(){var s=this
return A.bQ(function(){var r=0,q=2,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0
return function $async$ad(a1,a2){if(a1===1){p=a2
r=q}while(true)switch(r){case 0:a0=s.y
if(a0===-1||s.z===-1||s.Q==null){r=1
break}o=s.gab()
n=s.z
m=s.CW
if(m!=null){m=m.as
if((m==null?null:m.z)==null){r=1
break}if(s.gao()<s.gac()){r=1
break}m=s.x
l=s.ch
if(!A.bs(m,l,s.gaQ(),s.CW,null,null)){r=1
break}k=s.CW
j=A.oh(a0,k.as.z.buffer,k.x+m,B.c.av(s.gaQ(),l))
if(j==null){r=1
break}i=j.length
if(s.gcj()){m=B.c.av(s.gao(),l)
l=s.Q==="MAT2"
k=l?8:12
h=l?2:3
g=new A.lD(i,j,h,h,m-k).$0()}else g=new A.lE(j).$3(i,o,B.c.av(s.gao(),l)-o)}else g=A.ot(n*o,new A.lF(),t.F)
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
if(A.bs(m,A.b1(e),A.b1(e)*f,n.r,null,null)){d=s.ch
c=B.m.j(0,s.Q)
if(c==null)c=0
c=!A.bs(k,d,d*c*f,l.f,null,null)
d=c}else d=!0
if(d){r=1
break}n=n.r
b=A.nh(e,n.as.z.buffer,n.x+m,f)
l=l.f
a=A.oh(a0,l.as.z.buffer,l.x+k,f*o)
if(b==null||a==null){r=1
break}g=new A.lG(s,b,g,o,a).$0()}r=3
return A.m7(g)
case 3:case 1:return A.bL()
case 2:return A.bM(p)}}},t.F)},
bn(){return this.ad()}}
A.lD.prototype={
$0(){var s=this
return A.bQ(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h
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
case 3:return A.bL()
case 1:return A.bM(p)}}},t.F)},
$S:19}
A.lE.prototype={
$3(a,b,c){return this.d_(a,b,c)},
d_(a,b,c){var s=this
return A.bQ(function(){var r=a,q=b,p=c
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
case 3:return A.bL()
case 1:return A.bM(m)}}},t.F)},
$S:35}
A.lF.prototype={
$1(a){return 0},
$S:7}
A.lG.prototype={
$0(){var s=this
return A.bQ(function(){var r=0,q=1,p,o,n,m,l,k,j,i,h,g,f
return function $async$$0(a,b){if(a===1){p=b
r=q}while(true)switch(r){case 0:g=s.b
f=g[0]
o=J.aC(s.c),n=s.d,m=s.a.ay,l=s.e,k=0,j=0,i=0
case 2:if(!o.p()){r=3
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
case 3:return A.bL()
case 1:return A.bM(p)}}},t.F)},
$S:19}
A.bX.prototype={
ge4(){var s=this.e,r=s.r,q=r==null?null:r.as
if((q==null?null:q.z)==null)return null
return A.nh(s.f,r.as.z.buffer,r.x+s.e,this.d)}}
A.bY.prototype={
q(a,b){this.r=a.y.j(0,this.d)}}
A.bZ.prototype={
q(a,b){this.f=a.y.j(0,this.d)}}
A.eU.prototype={
a_(a,b,c,d){d.toString
if(d==1/0||d==-1/0||isNaN(d)){a.l($.q3(),A.a([b,d],t.M),this.a)
return!1}return!0}}
A.f1.prototype={
a_(a,b,c,d){var s,r=this
if(b===c||r.b[c]>d)r.b[c]=d
if(d<r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
aD(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d+"/min/",n=t.M,m=0;m<r;++m)if(!J.aj(q[m],s[m])){l=o+m
a.l($.nQ(),A.a([q[m],s[m]],n),l)
k=p[m]
if(k>0)a.l($.nO(),A.a([k,q[m]],n),l)}return!0}}
A.f_.prototype={
a_(a,b,c,d){var s,r=this
if(b===c||r.b[c]<d)r.b[c]=d
if(d>r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
aD(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d+"/max/",n=t.M,m=0;m<r;++m)if(!J.aj(q[m],s[m])){l=o+m
a.l($.nP(),A.a([q[m],s[m]],n),l)
k=p[m]
if(k>0)a.l($.nN(),A.a([k,q[m]],n),l)}return!0}}
A.f2.prototype={
a_(a,b,c,d){var s,r=this
if(b===c||r.b[c]>d)r.b[c]=d
if(d<r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
aD(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d+"/min/",n=t.M,m=0;m<r;++m)if(!J.aj(q[m],s[m])){l=o+m
a.l($.nQ(),A.a([q[m],s[m]],n),l)
k=p[m]
if(k>0)a.l($.nO(),A.a([k,q[m]],n),l)}return!0}}
A.f0.prototype={
a_(a,b,c,d){var s,r=this
if(b===c||r.b[c]<d)r.b[c]=d
if(d>r.c[c]){s=r.a
s[c]=s[c]+1}return!0},
aD(a){var s,r,q,p,o,n,m,l,k,j=this
for(s=j.b,r=s.length,q=j.c,p=j.a,o=j.d+"/max/",n=t.M,m=0;m<r;++m)if(!J.aj(q[m],s[m])){l=o+m
a.l($.nP(),A.a([q[m],s[m]],n),l)
k=p[m]
if(k>0)a.l($.nN(),A.a([k,q[m]],n),l)}return!0}}
A.bt.prototype={
q(a,b){var s,r,q,p,o,n=this,m="samplers",l=n.x
if(l==null||n.w==null)return
s=b.c
s.push(m)
l.a3(new A.h3(b,a))
s.pop()
s.push("channels")
n.w.a3(new A.h4(n,b,a))
s.pop()
s.push(m)
for(r=l.b,l=l.a,q=l.length,p=0;p<r;++p){o=p>=q
if(!(o?null:l[p]).a$)b.Y($.h_(),p)}s.pop()}}
A.h3.prototype={
$2(a,b){var s,r,q,p,o,n,m="input",l="output",k=this.a,j=k.c
j.push(B.c.k(a))
s=this.b.f
r=b.d
b.r=s.j(0,r)
q=b.f
b.w=s.j(0,q)
if(r!==-1){s=b.r
if(s==null)k.l($.N(),A.a([r],t.M),m)
else{s.S(B.b0,m,k)
p=b.r.CW
if(p!=null){p.S(B.o,m,k)
s=p.z
if(s!==-1)k.n($.nV(),m)}j.push(m)
o=A.dj(b.r)
if(!o.N(0,B.G))k.G($.qJ(),A.a([o,A.a([B.G],t.p)],t.M))
else k.Z(b.r,new A.eB(k.R()))
s=b.r
if(s.ax==null||s.at==null)k.O($.qL())
if(b.e==="CUBICSPLINE"&&b.r.z<2)k.G($.qK(),A.a(["CUBICSPLINE",2,b.r.z],t.M))
j.pop()}}if(q!==-1){s=b.w
if(s==null)k.l($.N(),A.a([q],t.M),l)
else{s.S(B.b1,l,k)
n=b.w.CW
if(n!=null){n.S(B.o,l,k)
s=n.z
if(s!==-1)k.n($.nV(),l)}s=b.w.CW
if(s!=null)s.S(B.o,l,k)
b.w.ew("CUBICSPLINE"===b.e)}}j.pop()},
$S:36}
A.h4.prototype={
$2(a,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=null,d="sampler",c=this.b,b=c.c
b.push(B.c.k(a))
s=this.a
r=a0.d
a0.f=s.x.j(0,r)
q=a0.e
p=q!=null
if(p){o=q.d
q.f=this.c.ax.j(0,o)
if(o!==-1){b.push("target")
n=q.f
if(n==null)c.l($.N(),A.a([o],t.M),"node")
else{n.a$=!0
switch(q.e){case"translation":case"rotation":case"scale":if(n.z!=null)c.O($.qG())
if(q.f.dx!=null)c.n($.rm(),"path")
break
case"weights":o=n.cy
o=o==null?e:o.w
o=o==null?e:o.gcD(o)
if((o==null?e:o.cx)==null)c.O($.qH())
break}}b.pop()}}if(r!==-1){o=a0.f
if(o==null)c.l($.N(),A.a([r],t.M),d)
else{o.a$=!0
if(p&&o.w!=null){r=q.e
if(r==="rotation"){m=o.w
if(m.gab()===4){b.push(d)
o=c.R()
n=5126===m.y?e:m.gbS()
c.Z(m,new A.dH("CUBICSPLINE"===a0.f.e,n,o,t.ed))
b.pop()}o=a0.f
o.w.toString}l=A.dj(o.w)
k=B.dh.j(0,r)
if((k==null?e:B.d.H(k,l))===!1)c.l($.qN(),A.a([l,k,r],t.M),d)
o=a0.f
n=o.r
if(n!=null&&n.z!==-1&&o.w.z!==-1&&o.e!=null){j=n.z
if(o.e==="CUBICSPLINE")j*=3
if(r==="weights"){r=q.f
r=r==null?e:r.cy
r=r==null?e:r.w
r=r==null?e:r.gcD(r)
r=r==null?e:r.cx
i=r==null?e:r.length
j*=i==null?0:i}else if(!B.d.H(B.R,r))j=0
if(j!==0&&j!==a0.f.w.z)c.l($.qM(),A.a([j,a0.f.w.z],t.M),d)}}}for(h=a+1,s=s.w,r=s.b,o=t.M,s=s.a,n=s.length;h<r;++h){if(p){g=h>=n
f=(g?e:s[h]).e
if(f!=null){g=q.d
g=g!==-1&&g===f.d&&q.e==f.e}else g=!1}else g=!1
if(g)c.l($.qI(),A.a([h],o),"target")}b.pop()}},
$S:37}
A.b2.prototype={}
A.c0.prototype={}
A.b3.prototype={}
A.eB.prototype={
a_(a,b,c,d){var s=this
if(d<0)a.l($.pY(),A.a([b,d],t.M),s.b)
else{if(b!==0&&d<=s.a)a.l($.pZ(),A.a([b,d,s.a],t.M),s.b)
s.a=d}return!0}}
A.dH.prototype={
a_(a,b,c,d){var s,r,q=this
if(!q.a||4===(q.d&4)){s=q.b
r=s!=null?s.$1(d):d
s=q.e+r*r
q.e=s
if(3===c){if(Math.abs(Math.sqrt(s)-1)>0.00769)a.l($.q_(),A.a([b-3,b,Math.sqrt(q.e)],t.M),q.c)
q.e=0}}if(++q.d===12)q.d=0
return!0}}
A.bu.prototype={
gbg(){var s,r=this.f
if(r!=null){s=$.bp().b
s=!s.test(r)}else s=!0
if(s)return 0
return A.cH($.bp().aR(r).b[1],null)},
gbR(){var s,r=this.f
if(r!=null){s=$.bp().b
s=!s.test(r)}else s=!0
if(s)return 0
return A.cH($.bp().aR(r).b[2],null)},
gcO(){var s,r=this.r
if(r!=null){s=$.bp().b
s=!s.test(r)}else s=!0
if(s)return 2
return A.cH($.bp().aR(r).b[1],null)},
ge9(){var s,r=this.r
if(r!=null){s=$.bp().b
s=!s.test(r)}else s=!0
if(s)return 0
return A.cH($.bp().aR(r).b[2],null)}}
A.aS.prototype={}
A.bv.prototype={
S(a,b,c){var s
this.a$=!0
s=this.at
if(s==null){this.at=a
if(a===B.L||a===B.A)c.n($.qP(),b)}else if(s!==a)c.l($.qQ(),A.a([s,a],t.M),b)},
q(a,b){var s,r=this,q=r.w,p=r.as=a.x.j(0,q)
r.ax=r.z
s=r.Q
if(s===34962)r.at=B.A
else if(s===34963)r.at=B.L
if(q!==-1)if(p==null)b.l($.N(),A.a([q],t.M),"buffer")
else{p.a$=!0
p=p.x
if(p!==-1){s=r.x
if(s>=p)b.l($.nW(),A.a([q,p],t.M),"byteOffset")
else if(s+r.y>p)b.l($.nW(),A.a([q,p],t.M),"byteLength")}}}}
A.bw.prototype={}
A.c2.prototype={}
A.c3.prototype={}
A.ds.prototype={
ey(a){var s,r,q,p,o
new A.iy(this,a).$1(this.cy)
s=a.r
for(r=s.length,q=a.c,p=0;p<s.length;s.length===r||(0,A.cI)(s),++p){o=s[p]
B.d.si(q,0)
B.d.F(q,o.b)
o.a.c_(this,a)}B.d.si(q,0)}}
A.iv.prototype={
$0(){B.d.si(this.a.c,0)
return null},
$S:1}
A.iw.prototype={
$1$2(a,b,c){var s,r,q,p,o,n,m,l,k,j=this,i=j.a
if(!i.v(a)){i=J.b8(0,c.h("0*"))
return new A.E(i,0,a,c.h("E<0*>"))}j.b.$0()
s=i.j(0,a)
if(t.m.b(s)){i=J.T(s)
r=j.c
q=c.h("0*")
if(i.ga7(s)){p=i.gi(s)
q=A.S(p,null,!1,q)
o=r.c
o.push(a)
for(n=t.M,m=t.t,l=0;l<i.gi(s);++l){k=i.j(s,l)
if(m.b(k)){o.push(B.c.k(l))
q[l]=b.$2(k,r)
o.pop()}else r.an($.a2(),A.a([k,"object"],n),l)}return new A.E(q,p,a,c.h("E<0*>"))}else{r.n($.bV(),a)
i=J.b8(0,q)
return new A.E(i,0,a,c.h("E<0*>"))}}else{j.c.l($.a2(),A.a([s,"array"],t.M),a)
i=J.b8(0,c.h("0*"))
return new A.E(i,0,a,c.h("E<0*>"))}},
$2(a,b){return this.$1$2(a,b,t.z)},
$S:38}
A.ix.prototype={
$1$3$req(a,b,c,d){var s,r
this.a.$0()
s=this.c
r=A.nG(this.b,a,s,!0)
if(r==null)return null
s.c.push(a)
return b.$2(r,s)},
$2(a,b){return this.$1$3$req(a,b,!1,t.z)},
$1$2(a,b,c){return this.$1$3$req(a,b,!1,c)},
$S:39}
A.it.prototype={
$2(a,b){var s,r,q,p,o,n=this.a,m=n.c
m.push(a.c)
s=this.b
a.a3(new A.iu(n,s))
r=n.f.j(0,b)
if(r!=null){q=J.cT(m.slice(0),A.Z(m).c)
for(p=J.aC(r);p.p();){o=p.gt()
B.d.si(m,0)
B.d.F(m,o.b)
o.a.q(s,n)}B.d.si(m,0)
B.d.F(m,q)}m.pop()},
$S:40}
A.iu.prototype={
$2(a,b){var s=this.a,r=s.c
r.push(B.c.k(a))
b.q(this.b,s)
r.pop()},
$S:41}
A.ir.prototype={
$2(a,b){var s,r
if(t.c.b(b)){s=this.a
r=s.c
r.push(a)
b.q(this.b,s)
r.pop()}},
$S:3}
A.is.prototype={
$2(a,b){var s,r,q,p=this
if(!b.dy&&b.cx==null&&b.cy==null&&b.CW==null&&b.a.a===0&&b.b==null)p.a.Y($.rJ(),a)
if(b.db!=null){s=p.b
s.cv(0)
for(r=b;r.db!=null;)if(s.C(0,r))r=r.db
else{if(r===b)p.a.Y($.r1(),a)
break}}if(b.dx!=null){if(b.db!=null)p.a.Y($.rO(),a)
s=b.z
if(s==null||s.cL()){s=b.as
if(s!=null){s=s.a
s=s[0]===0&&s[1]===0&&s[2]===0}else s=!0
if(s){s=b.at
if(s!=null){s=s.a
s=s[0]===0&&s[1]===0&&s[2]===0&&s[3]===1}else s=!0
if(s){s=b.ax
if(s!=null){s=s.a
s=s[0]===1&&s[1]===1&&s[2]===1}else s=!0}else s=!1}else s=!1}else s=!1
if(!s)p.a.Y($.rN(),a)
q=b.dx.at.bb(0,new A.ip(),new A.iq())
if(q!=null){s=q.ch
s=!b.ch.ba(0,s.gcw(s))}else s=!1
if(s)p.a.Y($.rM(),a)}},
$S:43}
A.ip.prototype={
$1(a){return a.db==null},
$S:44}
A.iq.prototype={
$0(){return null},
$S:2}
A.iy.prototype={
$1(a){var s=this.b,r=s.c
B.d.si(r,0)
r.push(a.c)
a.a3(new A.iz(this.a,s))
r.pop()},
$S:45}
A.iz.prototype={
$2(a,b){var s=this.b,r=s.c
r.push(B.c.k(a))
b.c_(this.a,s)
r.pop()},
$S:28}
A.m.prototype={}
A.l.prototype={
q(a,b){},
$iq:1}
A.eN.prototype={}
A.fH.prototype={}
A.aT.prototype={
q(a,b){var s,r="bufferView",q=this.w
if(q!==-1){s=this.Q=a.y.j(0,q)
if(s==null)b.l($.N(),A.a([q],t.M),r)
else{s.S(B.b5,r,b)
if(this.Q.z!==-1)b.n($.qR(),r)}}},
ev(){var s,r=this.Q,q=r==null?null:r.as
if((q==null?null:q.z)!=null)try{this.z=A.no(r.as.z.buffer,r.x,r.y)}catch(s){if(!(A.K(s) instanceof A.ar))throw s}}}
A.av.prototype={
q(a,b){var s=this,r=new A.jN(b,a)
r.$2(s.w,"pbrMetallicRoughness")
r.$2(s.x,"normalTexture")
r.$2(s.y,"occlusionTexture")
r.$2(s.z,"emissiveTexture")}}
A.jN.prototype={
$2(a,b){var s,r
if(a!=null){s=this.a
r=s.c
r.push(b)
a.q(this.b,s)
r.pop()}},
$S:47}
A.cx.prototype={
q(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("baseColorTexture")
r.q(a,b)
s.pop()}r=this.w
if(r!=null){s=b.c
s.push("metallicRoughnessTexture")
r.q(a,b)
s.pop()}}}
A.cw.prototype={}
A.cv.prototype={
q(a,b){var s,r
this.d8(a,b)
for(s=b.e,r=this;r!=null;){r=s.j(0,r)
if(r instanceof A.av){r.ay=!0
break}}}}
A.bh.prototype={
q(a,b){var s,r=this,q=r.d,p=r.f=a.cy.j(0,q)
if(q!==-1)if(p==null)b.l($.N(),A.a([q],t.M),"index")
else p.a$=!0
for(q=b.e,s=r;s!=null;){s=q.j(0,s)
if(s instanceof A.av){s.ch.m(0,b.R(),r.e)
break}}}}
A.c1.prototype={
k(a){return this.a}}
A.c_.prototype={
k(a){return this.a}}
A.y.prototype={
k(a){var s=B.ax.j(0,this.b),r=this.c?" normalized":""
return"{"+A.b(this.a)+", "+A.b(s)+r+"}"},
N(a,b){if(b==null)return!1
return b instanceof A.y&&b.a==this.a&&b.b===this.b&&b.c===this.c},
gE(a){return A.pp(A.fV(A.fV(A.fV(0,J.bW(this.a)),B.c.gE(this.b)),B.bU.gE(this.c)))}}
A.aU.prototype={
q(a,b){var s,r=b.c
r.push("primitives")
s=this.w
if(s!=null)s.a3(new A.jX(b,a))
r.pop()}}
A.jX.prototype={
$2(a,b){var s,r=this.a,q=r.c
q.push(B.c.k(a))
q.push("extensions")
s=this.b
b.a.L(0,new A.jW(r,s))
q.pop()
b.q(s,r)
q.pop()},
$S:20}
A.jW.prototype={
$2(a,b){var s,r
if(t.c.b(b)){s=this.a
r=s.c
r.push(a)
b.q(this.b,s)
r.pop()}},
$S:3}
A.aF.prototype={
ges(){switch(this.r){case 4:return B.c.bG(this.ch,3)
case 5:case 6:var s=this.ch
return s>2?s-2:0
default:return 0}},
q(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=this,e="attributes",d="indices",c=f.d
if(c!=null){s=b.c
s.push(e)
c.L(0,new A.jS(f,a,b))
s.pop()}c=f.e
if(c!==-1){s=f.cy=a.f.j(0,c)
if(s==null)b.l($.N(),A.a([c],t.M),d)
else{f.ch=s.z
s.S(B.b3,d,b)
c=f.cy.CW
if(c!=null)c.S(B.L,d,b)
c=b.c
c.push(d)
s=f.cy.CW
if(s!=null&&s.z!==-1)b.O($.qY())
r=A.dj(f.cy)
if(!B.d.H(B.ap,r))b.G($.qX(),A.a([r,B.ap],t.M))
else{s=f.CW
q=s!==-1?s-1:-1
s=f.r
p=s!==-1?B.c.aG(1,s):-1
if(p!==0&&q>=-1){s=f.cy
o=b.R()
n=B.c.bG(f.ch,3)
m=f.cy.y
l=new Uint32Array(3)
b.Z(s,new A.eQ(q,n,A.pV(m),16===(p&16),l,o))}}c.pop()}}c=f.ch
if(c!==-1){s=f.r
if(!(s===1&&c%2!==0))if(!((s===2||s===3)&&c<2))if(!(s===4&&c%3!==0))c=(s===5||s===6)&&c<3
else c=!0
else c=!0
else c=!0}else c=!1
if(c)b.G($.qW(),A.a([f.ch,B.cp[f.r]],t.M))
c=f.f
s=f.db=a.as.j(0,c)
if(c!==-1)if(s==null)b.l($.N(),A.a([c],t.M),"material")
else{s.a$=!0
s.ch.L(0,new A.jT(f,b))}if(f.z){c=f.db
c=c==null||!c.ay}else c=!1
if(c){c=b.c
c.push(e)
b.n($.rc(),"TANGENT")
c.pop()}for(c=f.dx,s=B.d.gD(c),c=new A.cC(s,new A.jU(),A.Z(c).h("cC<1>")),o=b.c;c.p();){n=s.gt()
o.push(e)
b.n($.h_(),"TEXCOORD_"+A.b(n))
o.pop()}c=f.w
if(c!=null){s=b.c
s.push("targets")
k=c.length
j=J.ou(k,t.gj)
for(o=t.X,n=t.W,i=0;i<k;++i)j[i]=A.a8(o,n)
f.cx=j
for(h=0;h<c.length;++h){g=c[h]
s.push(B.c.k(h))
g.L(0,new A.jV(f,a,b,h))
s.pop()}s.pop()}},
cb(a,b,c){var s,r=a.CW
if(r.z===-1){s=c.w.bV(r,new A.jR())
if(s.C(0,a)&&s.gi(s)>1)c.n($.qU(),b)}}}
A.jO.prototype={
$1(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this
if(a.length!==0&&B.a.J(a,0)===95)return
switch(a){case"POSITION":e.a.c=!0
break
case"NORMAL":e.a.b=!0
break
case"TANGENT":e.a.a=!0
break
default:s=a.split("_")
r=s[0]
if(!B.d.H(B.ce,r)||s.length!==2){e.b.n($.nd(),a)
break}q=s[1]
q.toString
p=new A.cL(q)
if(p.gi(p)===0){o=0
n=!1}else{m=q.length
if(m===1){o=B.a.J(q,0)-48
n=!(o<0||o>9)||!1}else{o=0
l=0
while(!0){if(!(l<m)){n=!0
break}k=B.a.J(q,l)-48
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
case"TEXCOORD":q=e.a;++q.y
g=q.z
q.z=o>g?o:g
break
case"WEIGHTS":q=e.a;++q.w
f=q.x
q.x=o>f?o:f
break}else e.b.n($.nd(),a)}},
$S:21}
A.jP.prototype={
$3(a,b,c){var s=a+1
if(s!==b){this.a.G($.rB(),A.a([c,s,b],t.M))
return 0}return b},
$S:50}
A.jQ.prototype={
$1(a){var s=this.a
if(!s.fx.v(a)&&!J.ts(a,"_"))s.n($.nd(),a)},
$S:21}
A.jS.prototype={
$2(a,b){var s,r,q,p,o,n,m,l=this
if(b===-1)return
s=l.b.f.j(0,b)
if(s==null){l.c.l($.N(),A.a([b],t.M),a)
return}r=l.a
r.ay.m(0,a,s)
q=l.c
s.S(B.a6,a,q)
p=s.CW
if(p!=null)p.S(B.A,a,q)
if(a==="POSITION")p=s.ax==null||s.at==null
else p=!1
if(p)q.n($.nZ(),"POSITION")
o=A.dj(s)
n=q.fr.j(0,A.a(a.split("_"),t.s)[0])
if(n!=null){if(!n.H(0,o))q.l($.nY(),A.a([o,n],t.M),a)
else if(a==="NORMAL"){p=q.c
p.push("NORMAL")
m=q.R()
q.Z(s,new A.fr(m,5126===s.y?null:s.gbS()))
p.pop()}else if(a==="TANGENT"){p=q.c
p.push("TANGENT")
m=q.R()
q.Z(s,new A.fs(m,5126===s.y?null:s.gbS()))
p.pop()}else if(a==="COLOR_0"&&5126===s.y){p=q.c
p.push(a)
q.Z(s,new A.eG(q.R()))
p.pop()}}else if(s.y===5125)q.n($.qV(),a)
p=s.x
if(!(p!==-1&&p%4!==0))if(s.gac()%4!==0){p=s.CW
p=p!=null&&p.z===-1}else p=!1
else p=!0
if(p)q.n($.nX(),a)
p=r.CW
if(p===-1)r.ch=r.CW=s.z
else if(p!==s.z)q.n($.r0(),a)
p=s.CW
if(p!=null&&p.z===-1){if(p.ax===-1)p.ax=s.gac()
r.cb(s,a,q)}},
$S:4}
A.jT.prototype={
$2(a,b){var s
if(b!==-1){s=this.a
if(b+1>s.ax)this.b.l($.o_(),A.a([a,b],t.M),"material")
else s.dx[b]=-1}},
$S:4}
A.jU.prototype={
$1(a){return a!==-1},
$S:8}
A.jV.prototype={
$2(a,b){var s,r,q,p,o,n,m=this
if(b===-1)return
s=m.b.f.j(0,b)
if(s==null)m.c.l($.N(),A.a([b],t.M),a)
else{r=m.c
s.S(B.a6,a,r)
q=s.CW
if(q!=null)q.S(B.A,a,r)
p=m.a.ay.j(0,a)
if(p==null)r.n($.r_(),a)
else if(p.z!==s.z)r.n($.qZ(),a)
if(a==="POSITION")q=s.ax==null||s.at==null
else q=!1
if(q)r.n($.nZ(),"POSITION")
o=A.dj(s)
n=r.fx.j(0,a)
if(n!=null&&!n.H(0,o))r.l($.nY(),A.a([o,n],t.M),a)
q=s.x
if(!(q!==-1&&q%4!==0))if(s.gac()%4!==0){q=s.CW
q=q!=null&&q.z===-1}else q=!1
else q=!0
if(q)r.n($.nX(),a)
q=s.CW
if(q!=null&&q.z===-1){if(q.ax===-1)q.ax=s.gac()
m.a.cb(s,a,r)}}m.a.cx[m.d].m(0,a,s)},
$S:4}
A.jR.prototype={
$0(){return A.aN(t.W)},
$S:53}
A.eQ.prototype={
a_(a,b,c,d){var s,r,q=this,p=q.a
if(d>p)a.l($.q0(),A.a([b,d,p],t.M),q.at)
if(d===q.c)a.l($.q1(),A.a([d,b],t.M),q.at)
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
aD(a){var s=this.Q
if(s>0)a.l($.q2(),A.a([s,this.b],t.M),this.at)
return!0}}
A.an.prototype={
q(a,b){var s,r,q,p=this,o=p.w
p.CW=a.z.j(0,o)
s=p.y
p.dx=a.cx.j(0,s)
r=p.Q
p.cy=a.at.j(0,r)
if(o!==-1){q=p.CW
if(q==null)b.l($.N(),A.a([o],t.M),"camera")
else q.a$=!0}if(s!==-1){o=p.dx
if(o==null)b.l($.N(),A.a([s],t.M),"skin")
else o.a$=!0}if(r!==-1){o=p.cy
if(o==null)b.l($.N(),A.a([r],t.M),"mesh")
else{o.a$=!0
o=o.w
if(o!=null){s=p.ay
r=s==null
if(!r){o=o.j(0,0).cx
o=o==null?null:o.length
o=o!==s.length}else o=!1
if(o){o=$.r5()
s=s.length
q=p.cy.w.j(0,0).cx
b.l(o,A.a([s,q==null?null:q.length],t.M),"weights")}if(r&&p.cy.x!=null)p.cy.y=!0
if(p.dx!=null){o=p.cy.w
if(o.ba(o,new A.jZ()))b.O($.r3())}else{o=p.cy.w
if(o.aP(o,new A.k_()))b.O($.r4())}}}}o=p.x
if(o!=null){s=A.S(o.gi(o),null,!1,t.L)
p.cx=s
A.nK(o,s,a.ax,"children",b,new A.k0(p,b))}},
c8(a,b){var s,r,q,p,o=this
o.ch.C(0,a)
if(o.cx==null||!b.C(0,o))return
for(s=o.cx,r=s.length,q=0;q<r;++q){p=s[q]
if(p!=null)p.c8(a,b)}}}
A.jZ.prototype={
$1(a){return a.as===0},
$S:5}
A.k_.prototype={
$1(a){return a.as!==0},
$S:5}
A.k0.prototype={
$3(a,b,c){if(a.db!=null)this.b.an($.r2(),A.a([b],t.M),c)
a.db=this.a},
$S:9}
A.bC.prototype={}
A.bD.prototype={
q(a,b){var s,r=this.w
if(r==null)return
s=A.S(r.gi(r),null,!1,t.L)
this.x=s
A.nK(r,s,a.ax,"nodes",b,new A.k9(this,b))}}
A.k9.prototype={
$3(a,b,c){if(a.db!=null)this.b.an($.r6(),A.a([b],t.M),c)
a.c8(this.a,A.aN(t.L))},
$S:9}
A.bF.prototype={
q(a,b){var s,r,q,p,o,n=this,m="inverseBindMatrices",l="skeleton",k=n.w
n.z=a.f.j(0,k)
s=a.ax
r=n.x
n.as=s.j(0,r)
q=n.y
if(q!=null){p=A.S(q.gi(q),null,!1,t.L)
n.Q=p
A.nK(q,p,s,"joints",b,new A.le(n))
if(n.at.a===0)b.n($.rS(),"joints")}if(k!==-1){s=n.z
if(s==null)b.l($.N(),A.a([k],t.M),m)
else{s.S(B.b2,m,b)
k=n.z.CW
if(k!=null)k.S(B.b4,m,b)
k=b.c
k.push(m)
s=n.z.CW
if(s!=null&&s.z!==-1)b.O($.r7())
o=A.dj(n.z)
if(!o.N(0,B.X))b.G($.r8(),A.a([o,A.a([B.X],t.p)],t.M))
else b.Z(n.z,new A.eP(b.R()))
s=n.Q
if(s!=null&&n.z.z<s.length)b.G($.qS(),A.a([s.length,n.z.z],t.M))
k.pop()}}if(r!==-1){k=n.as
if(k==null)b.l($.N(),A.a([r],t.M),l)
else if(!n.at.H(0,k))b.n($.rT(),l)}}}
A.le.prototype={
$3(a,b,c){var s,r,q
a.dy=!0
s=A.aN(t.L)
r=a
while(!0){if(!(r!=null&&s.C(0,r)))break
r=r.db}q=this.a.at
if(q.a===0)q.F(0,s)
else q.dr(s.gcw(s),!1)},
$S:9}
A.eP.prototype={
a_(a,b,c,d){var s
if(!(3===c&&0!==d))if(!(7===c&&0!==d))if(!(11===c&&0!==d))s=15===c&&1!==d
else s=!0
else s=!0
else s=!0
if(s)a.l($.q4(),A.a([b,c,d],t.M),this.a)
return!0}}
A.bH.prototype={
q(a,b){var s,r,q=this,p=q.x
q.z=a.Q.j(0,p)
s=q.w
q.y=a.ay.j(0,s)
if(p!==-1){r=q.z
if(r==null)b.l($.N(),A.a([p],t.M),"source")
else r.a$=!0}if(s!==-1){p=q.y
if(p==null)b.l($.N(),A.a([s],t.M),"sampler")
else p.a$=!0}},
c_(a,b){var s=this.z,r=s==null,q=r?null:s.x
if(q==null){s=r?null:s.as
q=s==null?null:s.a}if(q!=null&&!B.d.H(B.ao,q))b.l($.o0(),A.a([q,B.ao],t.M),"source")},
$icy:1}
A.lw.prototype={}
A.i.prototype={
Z(a,b){J.ne(this.d.bV(a,new A.hf()),b)},
U(a,b){var s,r,q
for(s=J.aC(b),r=this.e;s.p();){q=s.gt()
if(q!=null)r.m(0,q,a)}},
c2(a){var s,r,q,p=this.c
if(p.length===0&&a!=null&&B.a.W(a,"/"))return a
s=a!=null
if(s)p.push(a)
r=this.db
q=r.a+="/"
r.a=A.nq(q,new A.aa(p,new A.hh(),A.Z(p).h("aa<1,e*>")),"/")
if(s)p.pop()
p=r.a
r.a=""
return p.charCodeAt(0)==0?p:p},
R(){return this.c2(null)},
e5(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g=this,f="/extensionsUsed/"
B.d.F(g.as,a)
for(s=J.T(a),r=g.ax,q=g.cx,p=B.dz.a,o=t.M,n=J.T(b),m=0;m<s.gi(a);++m){l=s.j(a,m)
k=$.pX().aR(l)
j=k==null?null:k.b[1]
if(j==null)g.n($.rq(),f+m)
else if(!p.v(j))g.l($.rW(),A.a([j],o),f+m)
i=q.bb(0,new A.hk(l),new A.hl(l))
if(i==null){g.l($.rb(),A.a([l],o),f+m)
continue}i.b.L(0,new A.hm(g,i))
k=i.c
if(k!=null)k.$1(g)
k=i.d&&!n.H(b,l)
if(k)g.l($.rQ(),A.a([l],o),f+m)
r.push(l)}for(m=0;m<n.gi(b);++m){h=n.j(b,m)
if(!s.H(a,h))g.l($.rX(),A.a([h],o),"/extensionsRequired/"+m)}},
aa(a,b,c,d,e,f){var s,r,q,p=this,o=p.b,n=a.b
if(o.b.H(0,n))return
s=o.a
if(s>0&&p.cy.length===s){p.y=!0
throw A.d(B.b9)}o=o.c
r=o!=null?o.j(0,n):null
if(f!=null)p.cy.push(new A.cS(a,r,null,f,b))
else{q=c!=null?B.c.k(c):d
o=e?"":p.c2(q)
p.cy.push(new A.cS(a,r,o,null,b))}},
n(a,b){return this.aa(a,null,null,b,!1,null)},
G(a,b){return this.aa(a,b,null,null,!1,null)},
l(a,b,c){return this.aa(a,b,null,c,!1,null)},
an(a,b,c){return this.aa(a,b,c,null,!1,null)},
Y(a,b){return this.aa(a,null,b,null,!1,null)},
O(a){return this.aa(a,null,null,null,!1,null)},
aC(a,b,c){return this.aa(a,b,null,null,c,null)},
aO(a,b){return this.aa(a,null,null,null,!1,b)},
a1(a,b,c){return this.aa(a,b,null,null,!1,c)}}
A.hg.prototype={
$1(a){return a.a},
$S:56}
A.hf.prototype={
$0(){return A.a([],t.gd)},
$S:57}
A.hh.prototype={
$1(a){var s
a.toString
s=A.pU(a,"~","~0")
return A.pU(s,"/","~1")},
$S:58}
A.hk.prototype={
$1(a){return a.a===this.a},
$S:22}
A.hl.prototype={
$0(){return B.d.bb(B.as,new A.hi(this.a),new A.hj())},
$S:60}
A.hi.prototype={
$1(a){return a.a===this.a},
$S:22}
A.hj.prototype={
$0(){return null},
$S:2}
A.hm.prototype={
$2(a,b){this.a.z.m(0,new A.c9(a,this.b.a),b)},
$S:61}
A.bx.prototype={$ia7:1}
A.cQ.prototype={
k(a){return"ImageCodec."+this.b}}
A.dR.prototype={
k(a){return"_ColorPrimaries."+this.b}}
A.d1.prototype={
k(a){return"_ColorTransfer."+this.b}}
A.ca.prototype={
k(a){return"Format."+this.b}}
A.cb.prototype={}
A.iB.prototype={
$1(a){var s,r,q,p=this.a
if(!p.c){s=A.os(t.a.a(a))
r=p.a
q=this.b
switch(s){case B.af:p.b=new A.iL(q,r)
break
case B.ag:s=new Uint8Array(13)
p.b=new A.k2(B.u,B.r,s,new Uint8Array(32),q,r)
break
case B.ah:p.b=new A.lB(new Uint8Array(30),q,r)
break
default:r.K()
q.P(B.bi)
return}p.c=!0}p.b.C(0,a)},
$S:10}
A.iD.prototype={
$1(a){this.a.a.K()
this.b.P(a)},
$S:23}
A.iC.prototype={
$0(){var s=this.a.b
s.b.K()
s=s.a
if((s.a.a&30)===0)s.P(B.bh)},
$S:2}
A.iA.prototype={
c6(a){var s
this.b.K()
s=this.a
if((s.a.a&30)===0)s.P(a)}}
A.iL.prototype={
C(a,b){var s,r,q
try{this.dz(b)}catch(r){q=A.K(r)
if(q instanceof A.aJ){s=q
this.b.K()
this.a.P(s)}else throw r}},
dz(a){var s,r,q,p,o,n,m,l,k,j,i=this,h=new A.iN(),g=new A.iM()
for(s=J.T(a),r=0;r!==s.gi(a);){q=s.j(a,r)
switch(i.c){case 0:if(255===q)i.c=255
else throw A.d(B.bT)
break
case 255:if(g.$1(q)){i.c=1
i.d=q
i.e=i.f=0}break
case 1:i.e=q<<8>>>0
i.c=2
break
case 2:p=i.e+q
i.e=p
if(p<2)throw A.d(B.bR)
if(h.$1(i.d)){p=i.e
i.r=new Uint8Array(p-2)}i.c=3
break
case 3:o=Math.min(s.gi(a)-r,i.e-i.f-2)
p=h.$1(i.d)
n=i.f
m=n+o
if(p){p=i.r
i.f=m;(p&&B.j).a4(p,n,m,a,r)
if(i.f===i.e-2){i.b.K()
a=i.r
l=a[0]
s=a[1]
p=a[2]
n=a[3]
m=a[4]
k=a[5]
if(k===3)j=B.p
else if(k===1)j=B.ad
else{A.a0(B.bS)
j=B.O}k=i.a.a
if((k.a&30)!==0)A.a0(A.cZ("Future already completed"))
k.af(new A.cb("image/jpeg",l,j,(n<<8|m)>>>0,(s<<8|p)>>>0,B.r,B.u,!1,!1))
return}}else{i.f=m
if(m===i.e-2)i.c=255}r+=o
continue}++r}}}
A.iN.prototype={
$1(a){return(a&240)===192&&a!==196&&a!==200&&a!==204||a===222},
$S:8}
A.iM.prototype={
$1(a){return!(a===1||(a&248)===208||a===216||a===217||a===255)},
$S:8}
A.k2.prototype={
C(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this,d=new A.k3(e)
for(s=J.T(b),r=e.ay,q=e.ax,p=0;p!==s.gi(b);){o=s.j(b,p)
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
if((s.a.a&30)===0)s.P(B.q)
return}e.y=!0
break
case 1951551059:e.z=!0
break
case 1665684045:if(e.c!==32){e.b.K()
s=e.a
if((s.a.a&30)===0)s.P(B.q)
return}break
case 1934772034:if(e.c!==1){e.b.K()
s=e.a
if((s.a.a&30)===0)s.P(B.q)
return}break
case 1883789683:if(e.c!==9){e.b.K()
s=e.a
if((s.a.a&30)===0)s.P(B.q)
return}break
case 1732332865:if(e.c!==4){e.b.K()
s=e.a
if((s.a.a&30)===0)s.P(B.q)
return}break
case 1766015824:e.Q=B.F
e.as=B.E
break
case 1229209940:e.b.K()
if(!e.y)e.a.P(B.bQ)
s=q.buffer
b=new DataView(s,0)
m=b.getUint32(0,!1)
l=b.getUint32(4,!1)
k=b.getUint8(8)
switch(b.getUint8(9)){case 0:j=e.z?B.ae:B.ad
break
case 2:case 3:j=e.z?B.B:B.p
break
case 4:j=B.ae
break
case 6:j=B.B
break
default:j=B.O}s=e.as
if(s===B.r)s=e.as=B.t
r=e.Q
if(r===B.u)r=e.Q=B.v
q=e.at
n=e.a.a
if((n.a&30)!==0)A.a0(A.cZ("Future already completed"))
n.af(new A.cb("image/png",k,j,m,l,s,r,q,!1))
return}if(e.c===0)e.x=4
else e.x=3}break
case 3:n=s.gi(b)
i=e.c
h=e.w
g=Math.min(n-p,i-h)
switch(e.e){case 1229472850:n=h+g
e.w=n
B.j.a4(q,h,n,b,p)
break
case 1665684045:case 1732332865:case 1883789683:n=h+g
e.w=n
B.j.a4(r,h,n,b,p)
break
case 1934772034:e.Q=B.v
e.as=B.t
e.w=h+1
break
default:e.w=h+g}if(e.w===e.c){switch(e.e){case 1665684045:if(e.as===B.r)e.dh()
break
case 1732332865:if(e.Q===B.u)e.di()
break
case 1883789683:n=r.buffer
f=new DataView(n,0)
if(f.getUint32(0,!1)!==f.getUint32(4,!1))e.at=!0
break}e.x=4}p+=g
continue
case 4:if(++e.r===4){d.$0()
e.x=1}break}++p}},
di(){var s=this
if(s.Q===B.v)return
switch(A.f3(s.ay.buffer,0,null).getUint32(0,!1)){case 45455:s.Q=B.v
break
case 1e5:s.Q=B.e9
break
default:s.Q=B.F}},
dh(){var s,r=this
if(r.as===B.t)return
s=A.f3(r.ay.buffer,0,null)
if(s.getUint32(0,!1)===31270&&s.getUint32(4,!1)===32900&&s.getUint32(8,!1)===64e3&&s.getUint32(12,!1)===33e3&&s.getUint32(16,!1)===3e4&&s.getUint32(20,!1)===6e4&&s.getUint32(24,!1)===15e3&&s.getUint32(28,!1)===6000)r.as=B.t
else r.as=B.E}}
A.k3.prototype={
$0(){var s=this.a
s.r=s.w=s.f=s.e=s.d=s.c=0},
$S:1}
A.lB.prototype={
C(a,b){var s,r,q,p,o,n,m,l=this,k=J.a3(b),j=l.d,i=l.c
k=j+Math.min(k,30-j)
l.d=k
B.j.d1(i,j,k,b)
k=l.d
if(k>=25)k=k<30&&i[15]!==76
else k=!0
if(k)return
l.b.K()
s=A.f3(i.buffer,0,null)
if(s.getUint32(0,!1)!==1380533830||s.getUint32(8,!1)!==1464156752){l.c6(B.ai)
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
default:l.c6(B.ai)
return}k=o?B.F:B.v
j=o?B.E:B.t
l.a.a2(new A.cb("image/webp",8,p,r,q,j,k,!1,n))}}
A.dO.prototype={$ia7:1}
A.dN.prototype={$ia7:1}
A.aJ.prototype={
k(a){return this.a},
$ia7:1}
A.d6.prototype={
k(a){return"_Storage."+this.b}}
A.fk.prototype={
bk(){var s,r=this,q=t.X,p=t._,o=A.a8(q,p)
o.m(0,"pointer",r.a)
s=r.b
if(s!=null)o.m(0,"mimeType",s)
s=r.c
if(s!=null)o.m(0,"storage",B.co[s.a])
s=r.e
if(s!=null)o.m(0,"uri",s)
s=r.d
if(s!=null)o.m(0,"byteLength",s)
s=r.f
if(s!=null){q=A.a8(q,p)
q.m(0,"width",s.d)
q.m(0,"height",s.e)
p=s.c
if(p!==B.O)q.m(0,"format",B.d1[p.a])
p=s.f
if(p!==B.r)q.m(0,"primaries",B.cW[p.a])
p=s.r
if(p!==B.u)q.m(0,"transfer",B.cV[p.a])
p=s.b
if(p>0)q.m(0,"bits",p)
o.m(0,"image",q)}return o}}
A.k6.prototype={
aU(){var s=!0
return this.e7()},
e7(){var s=0,r=A.eu(t.H),q,p=2,o,n=[],m=this,l,k,j
var $async$aU=A.ew(function(a,b){if(a===1){o=b
s=p}while(true)switch(s){case 0:k=!0
p=4
s=7
return A.da(m.b3(),$async$aU)
case 7:s=8
return A.da(m.b4(),$async$aU)
case 8:if(k)A.xr(m.a,m.b)
m.a.ey(m.b)
p=2
s=6
break
case 4:p=3
j=o
if(A.K(j) instanceof A.bx){s=1
break}else throw j
s=6
break
case 3:s=2
break
case 6:case 1:return A.ep(q,r)
case 2:return A.eo(o,r)}})
return A.eq($async$aU,r)},
b3(){var s=0,r=A.eu(t.H),q=1,p,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4
var $async$b3=A.ew(function(a5,a6){if(a5===1){p=a6
s=q}while(true)switch(s){case 0:a2=n.b
a3=a2.c
B.d.si(a3,0)
a3.push("buffers")
i=n.a.x,h=i.b,g=a2.ch,f=t.M,e=t.x,i=i.a,d=i.length,c=0
case 2:if(!(c<h)){s=4
break}b=c>=d
m=b?null:i[c]
if(m==null){s=3
break}a3.push(B.c.k(c))
a=new A.fk(a2.R())
a.b="application/gltf-buffer"
l=new A.k7(n,a,c)
k=null
q=6
s=9
return A.da(l.$1(m),$async$b3)
case 9:k=a6
q=1
s=8
break
case 6:q=5
a4=p
b=A.K(a4)
if(e.b(b)){j=b
a2.l($.na(),A.a([j],f),"uri")}else throw a4
s=8
break
case 5:s=1
break
case 8:if(k!=null){a.d=J.a3(k)
if(J.a3(k)<m.x)a2.G($.qe(),A.a([J.a3(k),m.x],f))
else{if(a2.dx&&c===0&&!m.y){b=m.x
a1=b+(-b&3)
if(J.a3(k)>a1)a2.G($.qf(),A.a([J.a3(k)-a1],f))}b=m
if(b.z==null)b.z=k}}g.push(a.bk())
a3.pop()
case 3:++c
s=2
break
case 4:return A.ep(null,r)
case 1:return A.eo(p,r)}})
return A.eq($async$b3,r)},
b4(){var s=0,r=A.eu(t.H),q=1,p,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8
var $async$b4=A.ew(function(b0,b1){if(b0===1){p=b1
s=q}while(true)switch(s){case 0:a6=n.b
a7=a6.c
B.d.si(a7,0)
a7.push("images")
f=n.a.Q,e=f.b,d=a6.ch,c=t.M,b=t.x,a=a6.dy,f=f.a,a0=f.length,a1=0
case 2:if(!(a1<e)){s=4
break}a2=a1>=a0
m=a2?null:f[a1]
if(m==null){s=3
break}a7.push(B.c.k(a1))
a3=new A.fk(a6.R())
l=new A.k8(n,a3)
k=null
try{k=l.$1(m)}catch(a9){a2=A.K(a9)
if(b.b(a2)){j=a2
a6.l($.na(),A.a([j],c),"uri")}else throw a9}i=null
s=k!=null?5:6
break
case 5:q=8
s=11
return A.da(A.u2(k),$async$b4)
case 11:i=b1
a2=B.d.H(a,i.a)
if(!a2)a6.G($.qj(),A.a([i.a],c))
q=1
s=10
break
case 8:q=7
a8=p
a2=A.K(a8)
if(a2 instanceof A.dO)a6.O($.qm())
else if(a2 instanceof A.dN)a6.O($.ql())
else if(a2 instanceof A.aJ){h=a2
a6.G($.qg(),A.a([h],c))}else if(b.b(a2)){g=a2
a6.l($.na(),A.a([g],c),"uri")}else throw a8
s=10
break
case 7:s=1
break
case 10:if(i!=null){a3.b=i.a
if(m.x!=null&&m.x!==i.a){a2=$.qi()
a5=A.a([i.a,m.x],c)
a6.l(a2,a5,a3.c===B.aM?"bufferView":"uri")}a2=i.d
if(a2!==0&&(a2&a2-1)>>>0===0){a2=i.e
a2=!(a2!==0&&(a2&a2-1)>>>0===0)}else a2=!0
if(a2)a6.G($.qk(),A.a([i.d,i.e],c))
a2=i
if(a2.f===B.E||a2.r===B.F||i.x||i.w)a6.O($.qh())
m.as=i
a3.f=i}case 6:d.push(a3.bk())
a7.pop()
case 3:++a1
s=2
break
case 4:return A.ep(null,r)
case 1:return A.eo(p,r)}})
return A.eq($async$b4,r)}}
A.k7.prototype={
$1(a){var s,r,q,p=this
if(a.x===-1)return null
s=a.w
if(s!=null){r=p.b
r.c=B.aN
r.e=s.k(0)
return p.a.c.$1(s)}else{s=a.z
if(s!=null){p.b.c=B.aL
return s}else{s=p.a
r=s.b
if(r.dx&&p.c===0&&!a.y){p.b.c=B.eb
q=s.c.$0()
if(q==null)r.O($.qO())
return q}}}return null},
$S:64}
A.k8.prototype={
$1(a){var s,r,q=this
if(a.a.a===0){s=a.y
if(s!=null){r=q.b
r.c=B.aN
r.e=s.k(0)
return q.a.d.$1(s)}else{s=a.z
if(s!=null){q.b.c=B.aL
return A.np(s,t.w)}else if(a.Q!=null){q.b.c=B.aM
a.ev()
s=a.z
if(s!=null)return A.np(s,t.w)}}}return null},
$S:65}
A.n7.prototype={
$2(a,b){var s,r,q,p,o,n,m,l,k=A.mB(b)
if((k==null?null:k.ay)!=null){k=this.a
s=k.c
B.d.si(s,0)
s.push("accessors")
s.push(B.c.k(a))
r=b.ay.ge4()
if(r!=null)for(s=r.length,q=b.z,p=t.M,o=0,n=-1,m=0;m<s;++m,n=l){l=r[m]
if(n!==-1&&l<=n)k.l($.qb(),A.a([o,l,n],p),"sparse")
if(l>=q)k.l($.qa(),A.a([o,l,q],p),"sparse");++o}}},
$S:66}
A.n8.prototype={
$1(a){return a.as===0},
$S:5}
A.n9.prototype={
$2(a,b){var s,r,q,p,o=this,n=null,m=b.CW,l=b.as,k=A.S(l,n,!1,t.bF),j=A.S(l,n,!1,t.ga),i=t.hc,h=b.ay,g=0
while(!0){if(!(g<l)){s=!1
break}r=""+g
q=A.mB(h.j(0,"JOINTS_"+r))
p=A.mB(h.j(0,"WEIGHTS_"+r))
if((q==null?n:q.z)===m)r=(p==null?n:p.z)!==m
else r=!0
if(r){s=!0
break}r=i.a(q).ad()
k[g]=new A.aG(r.a(),A.C(r).h("aG<1>"))
r=p.bn()
j[g]=new A.aG(r.a(),A.C(r).h("aG<1>"));++g}if(s)return
l=o.b
i=l.c
i.push(B.c.k(a))
i.push("attributes")
h=o.c
B.d.F(h,k)
B.d.F(h,j)
l=l.R()
h=o.a
o.d.push(new A.eT(k,j,h.b-1,h.a,l,A.aN(t.e)))
i.pop()
i.pop()},
$S:20}
A.mE.prototype={
$1(a){return a.gt()==null},
$S:67}
A.eT.prototype={
dU(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d=this
for(s=d.a,r=s.length,q=d.b,p=d.c,o=d.e,n=o+"/JOINTS_",m=t.M,l=d.z,o+="/WEIGHTS_",k=d.d,j=0;j<r;++j){i=s[j].gt()
if(i==null){d.w=!0
return}if(i>p){a.l($.q7(),A.a([d.f,d.r,i,p,k],m),n+j)
continue}h=q[j].gt()
if(h!==0){if(!l.C(0,i)){a.l($.q6(),A.a([d.f,d.r,i],m),n+j)
g=!1}else g=!0
if(h<0)a.l($.qc(),A.a([d.f,d.r,h],m),o+j)
else if(g){f=d.x
e=$.ob()
e[0]=f+h
d.x=e[0]
d.y+=2e-7}}else if(i!==0)a.l($.q8(),A.a([d.f,d.r,i],m),n+j)}if(4===++d.r){if(Math.abs(d.x-1)>d.y)for(j=0;j<r;++j){s=$.qd()
q=d.f
a.l(s,A.a([q-3,q,d.x],m),o+j)}l.cv(0)
d.x=d.y=d.r=0}++d.f}}
A.bE.prototype={
k(a){return"Severity."+this.b}}
A.iG.prototype={}
A.hn.prototype={}
A.hK.prototype={
$1(a){return"Actual data byte length ("+A.b(a[0])+") is less than the declared buffer byte length ("+A.b(a[1])+")."},
$S:0}
A.hL.prototype={
$1(a){return"GLB-stored BIN chunk contains "+A.b(a[0])+" extra padding byte(s)."},
$S:0}
A.hD.prototype={
$1(a){return"Declared minimum value for this component ("+A.b(a[0])+") does not match actual minimum ("+A.b(a[1])+")."},
$S:0}
A.hC.prototype={
$1(a){return"Declared maximum value for this component ("+A.b(a[0])+") does not match actual maximum ("+A.b(a[1])+")."},
$S:0}
A.hs.prototype={
$1(a){return"Accessor contains "+A.b(a[0])+" element(s) less than declared minimum value "+A.b(a[1])+"."},
$S:0}
A.hr.prototype={
$1(a){return"Accessor contains "+A.b(a[0])+" element(s) greater than declared maximum value "+A.b(a[1])+"."},
$S:0}
A.hH.prototype={
$1(a){return"Vector3 at accessor indices "+A.b(a[0])+".."+A.b(a[1])+" is not of unit length: "+A.b(a[2])+"."},
$S:0}
A.hy.prototype={
$1(a){return"Vector3 with sign at accessor indices "+A.b(a[0])+".."+A.b(a[1])+" has invalid w component: "+A.b(a[2])+". Must be 1.0 or -1.0."},
$S:0}
A.hq.prototype={
$1(a){return"Animation sampler output accessor element at indices "+A.b(a[0])+".."+A.b(a[1])+" is not of unit length: "+A.b(a[2])+"."},
$S:0}
A.hE.prototype={
$1(a){return"Accessor element at index "+A.b(a[0])+" is not clamped to 0..1 range: "+A.b(a[1])+"."},
$S:0}
A.hw.prototype={
$1(a){return"Accessor element at index "+A.b(a[0])+" is "+A.b(a[1])+"."},
$S:0}
A.ht.prototype={
$1(a){return"Indices accessor element at index "+A.b(a[0])+" has value "+A.b(a[1])+" that is greater than the maximum vertex index available ("+A.b(a[2])+")."},
$S:0}
A.hv.prototype={
$1(a){return"Indices accessor contains "+A.b(a[0])+" degenerate triangles (out of "+A.b(a[1])+")."},
$S:0}
A.hu.prototype={
$1(a){return"Indices accessor contains primitive restart value ("+A.b(a[0])+") at index "+A.b(a[1])+"."},
$S:0}
A.ho.prototype={
$1(a){return u.m+A.b(a[0])+" is negative: "+A.b(a[1])+"."},
$S:0}
A.hp.prototype={
$1(a){return u.m+A.b(a[0])+" is less than or equal to previous: "+A.b(a[1])+" <= "+A.b(a[2])+"."},
$S:0}
A.hG.prototype={
$1(a){return u.d+A.b(a[0])+" is less than or equal to previous: "+A.b(a[1])+" <= "+A.b(a[2])+"."},
$S:0}
A.hF.prototype={
$1(a){return u.d+A.b(a[0])+" is greater than or equal to the number of accessor elements: "+A.b(a[1])+" >= "+A.b(a[2])+"."},
$S:0}
A.hx.prototype={
$1(a){return"Matrix element at index "+A.b(a[0])+" (component index "+A.b(a[1])+") contains invalid value: "+A.b(a[2])+"."},
$S:0}
A.hN.prototype={
$1(a){return"Image data is invalid. "+A.b(a[0])},
$S:0}
A.hP.prototype={
$1(a){return"Recognized image format "+("'"+A.b(a[0])+"'")+" does not match declared image format "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.hS.prototype={
$1(a){return"Unexpected end of image stream."},
$S:0}
A.hT.prototype={
$1(a){return"Image format not recognized."},
$S:0}
A.hQ.prototype={
$1(a){return"'"+A.b(a[0])+"' MIME type requires an extension."},
$S:0}
A.hR.prototype={
$1(a){return"Image has non-power-of-two dimensions: "+A.b(a[0])+"x"+A.b(a[1])+"."},
$S:0}
A.hO.prototype={
$1(a){return"Image contains unsupported features like non-default colorspace information, non-square pixels, or animation."},
$S:0}
A.hU.prototype={
$1(a){return"URI is used in GLB container."},
$S:0}
A.hM.prototype={
$1(a){return"Data URI is used in GLB container."},
$S:0}
A.hA.prototype={
$1(a){return"Joints accessor element at index "+A.b(a[0])+" (component index "+A.b(a[1])+") has value "+A.b(a[2])+" that is greater than the maximum joint index ("+A.b(a[3])+") set by skin "+A.b(a[4])+"."},
$S:0}
A.hz.prototype={
$1(a){return"Joints accessor element at index "+A.b(a[0])+" (component index "+A.b(a[1])+") has value "+A.b(a[2])+" that is already in use for the vertex."},
$S:0}
A.hI.prototype={
$1(a){return"Weights accessor element at index "+A.b(a[0])+" (component index "+A.b(a[1])+") has negative value "+A.b(a[2])+"."},
$S:0}
A.hJ.prototype={
$1(a){return"Weights accessor elements (at indices "+A.b(a[0])+".."+A.b(a[1])+") have non-normalized sum: "+A.b(a[2])+"."},
$S:0}
A.hB.prototype={
$1(a){return"Joints accessor element at index "+A.b(a[0])+" (component index "+A.b(a[1])+") is used with zero weight but has non-zero value ("+A.b(a[2])+")."},
$S:0}
A.iE.prototype={}
A.iF.prototype={
$1(a){return J.aq(a[0])},
$S:0}
A.ka.prototype={}
A.kc.prototype={
$1(a){return"Invalid array length "+A.b(a[0])+". Valid lengths are: "+J.br(t.Y.a(a[1]),A.pE(),t.X).k(0)+"."},
$S:0}
A.kd.prototype={
$1(a){var s=a[0]
s=typeof s=="string"?"'"+s+"'":J.aq(s)
return"Type mismatch. Array element "+A.b(s)+" is not a "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.kb.prototype={
$1(a){return"Duplicate element."},
$S:0}
A.kf.prototype={
$1(a){return"Index must be a non-negative integer."},
$S:0}
A.kg.prototype={
$1(a){return"Invalid JSON data. Parser output: "+A.b(a[0])},
$S:0}
A.kh.prototype={
$1(a){return"Invalid URI "+("'"+A.b(a[0])+"'")+". Parser output:\n"+A.b(a[1])},
$S:0}
A.ke.prototype={
$1(a){return"Entity cannot be empty."},
$S:0}
A.ki.prototype={
$1(a){a.toString
return"Exactly one of "+new A.aa(a,A.dh(),A.Z(a).h("aa<1,e*>")).k(0)+" properties must be defined."},
$S:0}
A.kj.prototype={
$1(a){return"Value "+("'"+A.b(a[0])+"'")+" does not match regexp pattern "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.kk.prototype={
$1(a){var s=a[0]
s=typeof s=="string"?"'"+s+"'":J.aq(s)
return"Type mismatch. Property value "+A.b(s)+" is not a "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.kp.prototype={
$1(a){var s=a[0]
s=typeof s=="string"?"'"+s+"'":J.aq(s)
return"Invalid value "+A.b(s)+". Valid values are "+J.br(t.Y.a(a[1]),A.pE(),t.X).k(0)+"."},
$S:0}
A.kq.prototype={
$1(a){return"Value "+A.b(a[0])+" is out of range."},
$S:0}
A.ko.prototype={
$1(a){return"Value "+A.b(a[0])+" is not a multiple of "+A.b(a[1])+"."},
$S:0}
A.kl.prototype={
$1(a){return"Property "+("'"+A.b(a[0])+"'")+" must be defined."},
$S:0}
A.km.prototype={
$1(a){return"Unexpected property."},
$S:0}
A.kn.prototype={
$1(a){return"Dependency failed. "+("'"+A.b(a[0])+"'")+" must be defined."},
$S:0}
A.kr.prototype={}
A.la.prototype={
$1(a){return"Unknown glTF major asset version: "+A.b(a[0])+"."},
$S:0}
A.lb.prototype={
$1(a){return"Unknown glTF minor asset version: "+A.b(a[0])+"."},
$S:0}
A.kW.prototype={
$1(a){return"Asset minVersion "+("'"+A.b(a[0])+"'")+" is greater than version "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.kG.prototype={
$1(a){return"Invalid value "+A.b(a[0])+" for GL type "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.kt.prototype={
$1(a){return"Only (u)byte and (u)short accessors can be normalized."},
$S:0}
A.ku.prototype={
$1(a){return"Offset "+A.b(a[0])+" is not a multiple of componentType length "+A.b(a[1])+"."},
$S:0}
A.ks.prototype={
$1(a){return"Matrix accessors must be aligned to 4-byte boundaries."},
$S:0}
A.kv.prototype={
$1(a){return"Sparse accessor overrides more elements ("+A.b(a[0])+") than the base accessor contains ("+A.b(a[1])+")."},
$S:0}
A.kw.prototype={
$1(a){return"Animated TRS properties will not affect a skinned mesh."},
$S:0}
A.kx.prototype={
$1(a){return"Data URI media type must be 'application/octet-stream' or 'application/gltf-buffer'. Found "+("'"+A.b(a[0])+"'")+" instead."},
$S:0}
A.kz.prototype={
$1(a){return"Buffer view's byteStride ("+A.b(a[0])+") is greater than byteLength ("+A.b(a[1])+")."},
$S:0}
A.ky.prototype={
$1(a){return"Only buffer views with raw vertex data can have byteStride."},
$S:0}
A.kA.prototype={
$1(a){return"xmag and ymag should not be negative."},
$S:0}
A.kB.prototype={
$1(a){return"xmag and ymag must not be zero."},
$S:0}
A.kC.prototype={
$1(a){return"yfov should be less than Pi."},
$S:0}
A.kD.prototype={
$1(a){return"zfar must be greater than znear."},
$S:0}
A.kO.prototype={
$1(a){return"Alpha cutoff is supported only for 'MASK' alpha mode."},
$S:0}
A.kR.prototype={
$1(a){return"Invalid attribute name."},
$S:0}
A.kV.prototype={
$1(a){return"All primitives must have the same number of morph targets."},
$S:0}
A.kT.prototype={
$1(a){return"No POSITION attribute found."},
$S:0}
A.kQ.prototype={
$1(a){return"Indices for indexed attribute semantic "+("'"+A.b(a[0])+"'")+" must start with 0 and be continuous. Total expected indices: "+A.b(a[1])+", total provided indices: "+A.b(a[2])+"."},
$S:0}
A.kU.prototype={
$1(a){return"TANGENT attribute without NORMAL found."},
$S:0}
A.kS.prototype={
$1(a){return"Number of JOINTS attribute semantics ("+A.b(a[0])+") does not match the number of WEIGHTS ("+A.b(a[1])+")."},
$S:0}
A.kP.prototype={
$1(a){return"The length of weights array ("+A.b(a[0])+u.p+A.b(a[1])+")."},
$S:0}
A.l_.prototype={
$1(a){return"A node can have either a matrix or any combination of translation/rotation/scale (TRS) properties."},
$S:0}
A.kY.prototype={
$1(a){return"Do not specify default transform matrix."},
$S:0}
A.l0.prototype={
$1(a){return"Matrix must be decomposable to TRS."},
$S:0}
A.l7.prototype={
$1(a){return"Rotation quaternion must be normalized."},
$S:0}
A.ld.prototype={
$1(a){return"Unused extension "+("'"+A.b(a[0])+"'")+" cannot be required."},
$S:0}
A.l6.prototype={
$1(a){return"Extension "+("'"+A.b(a[0])+"'")+" cannot be optional."},
$S:0}
A.lc.prototype={
$1(a){return"Extension uses unreserved extension prefix "+("'"+A.b(a[0])+"'")+"."},
$S:0}
A.kF.prototype={
$1(a){return"Extension name has invalid format."},
$S:0}
A.kZ.prototype={
$1(a){return"Empty node encountered."},
$S:0}
A.l3.prototype={
$1(a){return"Node with a skinned mesh is not root. Parent transforms will not affect a skinned mesh."},
$S:0}
A.l2.prototype={
$1(a){return"Local transforms will not affect a skinned mesh."},
$S:0}
A.l1.prototype={
$1(a){return"A node with a skinned mesh is used in a scene that does not contain joint nodes."},
$S:0}
A.l8.prototype={
$1(a){return"Joints do not have a common root."},
$S:0}
A.l9.prototype={
$1(a){return"Skeleton node is not a common root."},
$S:0}
A.l5.prototype={
$1(a){return"Non-relative URI found: "+("'"+A.b(a[0])+"'")+"."},
$S:0}
A.kX.prototype={
$1(a){return"This extension may be incompatible with other extensions for the object."},
$S:0}
A.l4.prototype={
$1(a){return"Prefer JSON Objects for extras."},
$S:0}
A.kE.prototype={
$1(a){return"This property should not be defined as it will not be used."},
$S:0}
A.kH.prototype={
$1(a){return"outerConeAngle ("+A.b(a[1])+") is less than or equal to innerConeAngle ("+A.b(a[0])+")."},
$S:0}
A.kI.prototype={
$1(a){return"Emissive strength has no effect when the emissive factor is zero or undefined."},
$S:0}
A.kN.prototype={
$1(a){return"The volume extension needs to be combined with an extension that allows light to transmit through the surface."},
$S:0}
A.kM.prototype={
$1(a){return"The volume extension should not be used with double-sided materials."},
$S:0}
A.kK.prototype={
$1(a){return"Thickness minimum has no effect when a thickness texture is not defined."},
$S:0}
A.kJ.prototype={
$1(a){return"Thickness maximum must be greater than or equal to the thickness minimum."},
$S:0}
A.kL.prototype={
$1(a){return"Thickness texture has no effect when the thickness minimum is equal to the thickness maximum."},
$S:0}
A.iX.prototype={}
A.j_.prototype={
$1(a){return"Accessor's total byteOffset "+A.b(a[0])+" isn't a multiple of componentType length "+A.b(a[1])+"."},
$S:0}
A.iY.prototype={
$1(a){return"Referenced bufferView's byteStride value "+A.b(a[0])+" is less than accessor element's length "+A.b(a[1])+"."},
$S:0}
A.iZ.prototype={
$1(a){return"Accessor (offset: "+A.b(a[0])+", length: "+A.b(a[1])+") does not fit referenced bufferView ["+A.b(a[2])+"] length "+A.b(a[3])+"."},
$S:0}
A.j0.prototype={
$1(a){return"Override of previously set accessor usage. Initial: "+("'"+A.b(a[0])+"'")+", new: "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.j3.prototype={
$1(a){return"Animation channel has the same target as channel "+A.b(a[0])+"."},
$S:0}
A.j1.prototype={
$1(a){return"Animation channel cannot target TRS properties of a node with defined matrix."},
$S:0}
A.j2.prototype={
$1(a){return"Animation channel cannot target WEIGHTS when mesh does not have morph targets."},
$S:0}
A.j7.prototype={
$1(a){return"accessor.min and accessor.max must be defined for animation input accessor."},
$S:0}
A.j5.prototype={
$1(a){return"Invalid Animation sampler input accessor format "+("'"+A.b(a[0])+"'")+". Must be one of "+J.br(t.Y.a(a[1]),A.dh(),t.X).k(0)+"."},
$S:0}
A.j9.prototype={
$1(a){return"Invalid animation sampler output accessor format "+("'"+A.b(a[0])+"'")+" for path "+("'"+A.b(a[2])+"'")+". Must be one of "+J.br(t.Y.a(a[1]),A.dh(),t.X).k(0)+"."},
$S:0}
A.j6.prototype={
$1(a){return"Animation sampler output accessor with "+("'"+A.b(a[0])+"'")+" interpolation must have at least "+A.b(a[1])+" elements. Got "+A.b(a[2])+"."},
$S:0}
A.j8.prototype={
$1(a){return"Animation sampler output accessor of count "+A.b(a[0])+" expected. Found "+A.b(a[1])+"."},
$S:0}
A.j4.prototype={
$1(a){return"bufferView.byteStride must not be defined for buffer views used by animation sampler accessors."},
$S:0}
A.ja.prototype={
$1(a){return"Buffer refers to an unresolved GLB binary chunk."},
$S:0}
A.jd.prototype={
$1(a){return"BufferView does not fit buffer ("+A.b(a[0])+") byteLength ("+A.b(a[1])+")."},
$S:0}
A.jc.prototype={
$1(a){return"Override of previously set bufferView target or usage. Initial: "+("'"+A.b(a[0])+"'")+", new: "+("'"+A.b(a[1])+"'")+"."},
$S:0}
A.jb.prototype={
$1(a){return"bufferView.target should be set for vertex or index data."},
$S:0}
A.je.prototype={
$1(a){return"bufferView.byteStride must not be defined for buffer views containing image data."},
$S:0}
A.jf.prototype={
$1(a){return"IBM accessor must have at least "+A.b(a[0])+" elements. Found "+A.b(a[1])+"."},
$S:0}
A.jj.prototype={
$1(a){return"Invalid accessor format "+("'"+A.b(a[0])+"'")+" for this attribute semantic. Must be one of "+J.br(t.Y.a(a[1]),A.dh(),t.X).k(0)+"."},
$S:0}
A.jk.prototype={
$1(a){return"Mesh attributes cannot use UNSIGNED_INT component type."},
$S:0}
A.jq.prototype={
$1(a){return"accessor.min and accessor.max must be defined for POSITION attribute accessor."},
$S:0}
A.ji.prototype={
$1(a){return"bufferView.byteStride must be defined when two or more accessors use the same buffer view."},
$S:0}
A.jh.prototype={
$1(a){return"Vertex attribute data must be aligned to 4-byte boundaries."},
$S:0}
A.jn.prototype={
$1(a){return"bufferView.byteStride must not be defined for indices accessor."},
$S:0}
A.jm.prototype={
$1(a){return"Invalid indices accessor format "+("'"+A.b(a[0])+"'")+". Must be one of "+J.br(t.Y.a(a[1]),A.dh(),t.X).k(0)+". "},
$S:0}
A.jl.prototype={
$1(a){return"Number of vertices or indices ("+A.b(a[0])+") is not compatible with used drawing mode ("+("'"+A.b(a[1])+"'")+")."},
$S:0}
A.jr.prototype={
$1(a){return"Material is incompatible with mesh primitive: Texture binding "+("'"+A.b(a[0])+"'")+" needs 'TEXCOORD_"+A.b(a[1])+"' attribute."},
$S:0}
A.js.prototype={
$1(a){return"All accessors of the same primitive must have the same count."},
$S:0}
A.jp.prototype={
$1(a){return"The mesh primitive does not define this attribute semantic."},
$S:0}
A.jo.prototype={
$1(a){return"Base accessor has different count."},
$S:0}
A.jt.prototype={
$1(a){return"Node is a part of a node loop."},
$S:0}
A.ju.prototype={
$1(a){return"Value overrides parent of node "+A.b(a[0])+"."},
$S:0}
A.jx.prototype={
$1(a){var s=A.b(a[0]),r=a[1]
return"The length of weights array ("+s+u.p+A.b(r==null?0:r)+")."},
$S:0}
A.jv.prototype={
$1(a){return"Node has skin defined, but mesh has no joints data."},
$S:0}
A.jw.prototype={
$1(a){return"Node uses skinned mesh, but has no skin defined."},
$S:0}
A.jy.prototype={
$1(a){return"Node "+A.b(a[0])+" is not a root node."},
$S:0}
A.jA.prototype={
$1(a){return"Invalid IBM accessor format "+("'"+A.b(a[0])+"'")+". Must be one of "+J.br(t.Y.a(a[1]),A.dh(),t.X).k(0)+". "},
$S:0}
A.jz.prototype={
$1(a){return"bufferView.byteStride must not be defined for buffer views used by inverse bind matrices accessors."},
$S:0}
A.jB.prototype={
$1(a){return"Invalid MIME type "+("'"+A.b(a[0])+"'")+" for the texture source. Valid MIME types are "+J.br(t.Y.a(a[1]),A.dh(),t.X).k(0)+"."},
$S:0}
A.jC.prototype={
$1(a){return"Extension is not declared in extensionsUsed."},
$S:0}
A.jD.prototype={
$1(a){return"Unexpected location for this extension."},
$S:0}
A.jE.prototype={
$1(a){return"Unresolved reference: "+A.b(a[0])+"."},
$S:0}
A.jF.prototype={
$1(a){return"Cannot validate an extension as it is not supported by the validator: "+("'"+A.b(a[0])+"'")+"."},
$S:0}
A.jI.prototype={
$1(a){return"This object may be unused."},
$S:0}
A.jH.prototype={
$1(a){return"The static morph target weights are always overridden."},
$S:0}
A.jG.prototype={
$1(a){return"Tangents are not used because the material has no normal texture."},
$S:0}
A.jg.prototype={
$1(a){return"This variant is used more than once for this mesh primitive."},
$S:0}
A.hY.prototype={}
A.i4.prototype={
$1(a){return"Invalid GLB magic value ("+A.b(a[0])+")."},
$S:0}
A.i5.prototype={
$1(a){return"Invalid GLB version value "+A.b(a[0])+"."},
$S:0}
A.i7.prototype={
$1(a){return"Declared GLB length ("+A.b(a[0])+") is too small."},
$S:0}
A.hZ.prototype={
$1(a){return"Length of "+A.b(a[0])+" chunk is not aligned to 4-byte boundaries."},
$S:0}
A.i6.prototype={
$1(a){return"Declared length ("+A.b(a[0])+") does not match GLB length ("+A.b(a[1])+")."},
$S:0}
A.i_.prototype={
$1(a){return"Chunk ("+A.b(a[0])+") length ("+A.b(a[1])+") does not fit total GLB length."},
$S:0}
A.i2.prototype={
$1(a){return"Chunk ("+A.b(a[0])+") cannot have zero length."},
$S:0}
A.i1.prototype={
$1(a){return"Empty BIN chunk should be omitted."},
$S:0}
A.i0.prototype={
$1(a){return"Chunk of type "+A.b(a[0])+" has already been used."},
$S:0}
A.ia.prototype={
$1(a){return"Unexpected end of chunk header."},
$S:0}
A.i9.prototype={
$1(a){return"Unexpected end of chunk data."},
$S:0}
A.ib.prototype={
$1(a){return"Unexpected end of header."},
$S:0}
A.ic.prototype={
$1(a){return"First chunk must be of JSON type. Found "+A.b(a[0])+" instead."},
$S:0}
A.i8.prototype={
$1(a){return"BIN chunk must be the second chunk."},
$S:0}
A.id.prototype={
$1(a){return"Unknown GLB chunk type: "+A.b(a[0])+"."},
$S:0}
A.i3.prototype={
$1(a){return"Extra data after the end of GLB stream."},
$S:0}
A.cS.prototype={
gbi(){var s=J.tv(this.a.c.$1(this.e))
return s},
gc4(){var s=this.b
return s==null?this.a.a:s},
gE(a){return B.a.gE(this.k(0))},
N(a,b){if(b==null)return!1
return b instanceof A.cS&&b.k(0)===this.k(0)},
k(a){var s=this,r=s.c
if(r!=null&&r.length!==0)return A.b(r)+": "+s.gbi()
r=s.d
if(r!=null)return"@"+A.b(r)+": "+s.gbi()
return s.gbi()}}
A.c8.prototype={
q(a,b){var s=this.d,r=this.e=a.Q.j(0,s)
if(s!==-1)if(r==null)b.l($.N(),A.a([s],t.M),"source")
else r.a$=!0},
c_(a,b){var s=this.e,r=s==null,q=r?null:s.x
if(q==null){s=r?null:s.as
q=s==null?null:s.a}if(q!=null&&q!=="image/webp")b.l($.o0(),A.a([q,B.cX],t.M),"source")},
$icy:1}
A.bz.prototype={
q(a,b){var s,r,q=b.c
q.push("lights")
s=this.d
r=J.cT(q.slice(0),A.Z(q).c)
b.x.m(0,s,r)
s.a3(new A.iR(b,a))
q.pop()}}
A.iR.prototype={
$2(a,b){var s=this.a.c
s.push(B.c.k(a))
s.pop()},
$S:69}
A.ba.prototype={}
A.cd.prototype={}
A.ce.prototype={
q(a,b){var s,r,q=a.a.j(0,"KHR_lights_punctual")
if(q instanceof A.bz){s=this.d
r=this.e=q.d.j(0,s)
if(s!==-1)if(r==null)b.l($.N(),A.a([s],t.M),"light")
else r.a$=!0}else b.G($.cJ(),A.a(["/extensions/KHR_lights_punctual"],t.M))}}
A.cf.prototype={
q(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("clearcoatTexture")
r.q(a,b)
s.pop()}r=this.r
if(r!=null){s=b.c
s.push("clearcoatRoughnessTexture")
r.q(a,b)
s.pop()}r=this.w
if(r!=null){s=b.c
s.push("clearcoatNormalTexture")
r.q(a,b)
s.pop()}}}
A.cg.prototype={
q(a,b){var s,r,q=this.d
q=isNaN(q)||q===1
if(q)return
for(q=b.e,s=this;s!=null;){s=q.j(0,s)
if(s instanceof A.av){r=s.Q
if(r!=null&&J.aj(r[0],0)&&J.aj(r[1],0)&&J.aj(r[2],0))b.O($.rt())
break}}}}
A.ch.prototype={}
A.ci.prototype={
q(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("iridescenceTexture")
r.q(a,b)
s.pop()}r=this.x
if(r!=null){s=b.c
s.push("iridescenceThicknessTexture")
r.q(a,b)
s.pop()}}}
A.cj.prototype={
q(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("diffuseTexture")
r.q(a,b)
s.pop()}r=this.w
if(r!=null){s=b.c
s.push("specularGlossinessTexture")
r.q(a,b)
s.pop()}}}
A.ck.prototype={
q(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("sheenColorTexture")
r.q(a,b)
s.pop()}r=this.r
if(r!=null){s=b.c
s.push("sheenRoughnessTexture")
r.q(a,b)
s.pop()}}}
A.cl.prototype={
q(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("specularTexture")
r.q(a,b)
s.pop()}r=this.r
if(r!=null){s=b.c
s.push("specularColorTexture")
r.q(a,b)
s.pop()}}}
A.cm.prototype={
q(a,b){var s,r=this.e
if(r!=null){s=b.c
s.push("transmissionTexture")
r.q(a,b)
s.pop()}}}
A.cn.prototype={}
A.bA.prototype={
q(a,b){var s,r,q=b.c
q.push("variants")
s=this.d
r=J.cT(q.slice(0),A.Z(q).c)
b.x.m(0,s,r)
s.a3(new A.iS(b,a))
q.pop()}}
A.iS.prototype={
$2(a,b){var s=this.a.c
s.push(B.c.k(a))
s.pop()},
$S:70}
A.aK.prototype={}
A.co.prototype={
q(a,b){var s=b.c
s.push("mappings")
this.d.a3(new A.iV(b,a,A.aN(t.e)))
s.pop()}}
A.iV.prototype={
$2(a,b){var s=this.a,r=s.c
r.push(B.c.k(a))
b.cN(this.b,s,this.c)
r.pop()},
$S:71}
A.bb.prototype={
cN(a,b,c){var s,r,q,p=this,o=a.a.j(0,"KHR_materials_variants")
if(o instanceof A.bA){s=p.d
if(s!=null){r=b.c
r.push("variants")
A.oz(s.gi(s),new A.iT(p,o,b,c),!1,t.J)
r.pop()}s=p.e
r=p.r=a.as.j(0,s)
if(s!==-1)if(r==null)b.l($.N(),A.a([s],t.M),"material")
else{r.a$=!0
for(s=b.e,q=p;q!=null;){q=s.j(0,q)
if(q instanceof A.aF){p.r.ch.L(0,new A.iU(q,b))
break}}}}else b.G($.cJ(),A.a(["/extensions/KHR_materials_variants"],t.M))},
q(a,b){return this.cN(a,b,null)}}
A.iT.prototype={
$1(a){var s=this,r=s.a.d.j(0,a),q=s.b.d.j(0,r)
if(r!==-1){if(!s.d.C(0,r))s.c.Y($.qT(),a)
if(q==null)s.c.an($.N(),A.a([r],t.M),a)
else q.a$=!0}return q},
$S:72}
A.iU.prototype={
$2(a,b){var s
if(b!==-1){s=this.a
if(b+1>s.ax)this.b.l($.o_(),A.a([a,b],t.M),"material")
else s.dx[b]=-1}},
$S:4}
A.cp.prototype={
q(a,b){var s,r,q=this.r
if(q!=null){s=b.c
s.push("thicknessTexture")
q.q(a,b)
s.pop()}for(q=b.e,r=this;r!=null;){r=q.j(0,r)
if(r instanceof A.av){q=r.a
if(!q.v("KHR_materials_transmission")&&!q.gV().aP(0,new A.iW()))b.O($.ry())
if(r.ax&&this.f>0)b.O($.rx())
break}}}}
A.iW.prototype={
$1(a){return t.h.b(a)},
$S:73}
A.cq.prototype={
q(a,b){var s,r
for(s=b.e,r=this;r!=null;){r=s.j(0,r)
if(r instanceof A.av){r.ch.m(0,b.R(),this.r)
break}}}}
A.O.prototype={}
A.V.prototype={}
A.c9.prototype={
gE(a){var s=J.bW(this.a),r=J.bW(this.b)
return A.pp(A.fV(A.fV(0,B.c.gE(s)),B.c.gE(r)))},
N(a,b){if(b==null)return!1
return b instanceof A.c9&&this.b==b.b&&this.a==b.a}}
A.cr.prototype={}
A.fl.prototype={}
A.dr.prototype={
bW(){var s=this,r=s.d=s.c.bO(new A.ih(s),s.gdv(),s.gci()),q=s.ch
q.e=r.gec()
q.f=r.gef()
q.r=new A.ii(s)
return s.e.a},
aL(){this.d.K()
var s=this.e
if((s.a.a&30)===0)s.a2(new A.at("model/gltf-binary",null,this.cx))},
du(a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=this,b="model/gltf-binary",a="0"
c.d.aV()
for(s=J.T(a0),r=t.f,q=t.G,p=t.M,o=c.a,n=0;n!==s.gi(a0);)switch(c.r){case 0:m=s.gi(a0)
l=c.w
k=Math.min(m-n,12-l)
m=l+k
c.w=m
B.j.a4(o,l,m,a0,n)
n+=k
c.x=k
if(c.w!==12)break
j=c.b.getUint32(0,!0)
if(j!==1179937895){c.f.a1($.qt(),A.a([j],p),0)
c.d.K()
s=c.e.a
if((s.a&30)===0){r=c.cx
s.af(new A.at(b,null,r))}return}i=c.b.getUint32(4,!0)
if(i!==2){c.f.a1($.qu(),A.a([i],p),4)
c.d.K()
s=c.e.a
if((s.a&30)===0){r=c.cx
s.af(new A.at(b,null,r))}return}m=c.y=c.b.getUint32(8,!0)
if(m<=c.x)c.f.a1($.qw(),A.a([m],p),8)
c.r=1
c.w=0
break
case 1:m=c.x
if(m===c.y){c.f.aO($.qs(),m)
c.d.K()
c.cg()
return}m=s.gi(a0)
l=c.w
k=Math.min(m-n,8-l)
m=l+k
c.w=m
B.j.a4(o,l,m,a0,n)
n+=k
c.x+=k
if(c.w!==8)break
c.Q=c.b.getUint32(0,!0)
m=c.b.getUint32(4,!0)
c.as=m
if((c.Q&3)!==0){l=c.f
h=$.qn()
g=c.x
l.a1(h,A.a(["0x"+B.a.ap(B.c.au(m,16),8,a)],p),g-8)}if(c.x+c.Q>c.y)c.f.a1($.qo(),A.a(["0x"+B.a.ap(B.c.au(c.as,16),8,a),c.Q],p),c.x-8)
if(c.z===0&&c.as!==1313821514)c.f.a1($.qB(),A.a(["0x"+B.a.ap(B.c.au(c.as,16),8,a)],p),c.x-8)
m=c.as
if(m===5130562&&c.z>1&&!c.CW)c.f.a1($.qx(),A.a(["0x"+B.a.ap(B.c.au(m,16),8,a)],p),c.x-8)
f=new A.ie(c)
m=c.as
switch(m){case 1313821514:if(c.Q===0){l=c.f
h=$.qr()
g=c.x
l.a1(h,A.a(["0x"+B.a.ap(B.c.au(m,16),8,a)],p),g-8)}f.$1$seen(c.at)
c.at=!0
break
case 5130562:if(c.Q===0)c.f.aO($.qq(),c.x-8)
f.$1$seen(c.CW)
c.CW=!0
break
default:c.f.a1($.qC(),A.a(["0x"+B.a.ap(B.c.au(m,16),8,a)],p),c.x-8)
c.r=4294967295}++c.z
c.w=0
break
case 1313821514:k=Math.min(s.gi(a0)-n,c.Q-c.w)
if(c.ax==null){m=c.ch
l=c.f
m=new A.cP(new A.ah(m,A.C(m).h("ah<1>")),new A.ay(new A.B($.A,r),q))
m.e=l
c.ax=m
c.ay=m.bW()}m=c.ch
e=n+k
l=s.a0(a0,n,e)
h=m.b
if(h>=4)A.a0(m.bs())
if((h&1)!==0)m.aA(l)
else if((h&3)===0){m=m.b2()
l=new A.cD(l)
d=m.c
if(d==null)m.b=m.c=l
else{d.saE(l)
m.c=l}}m=c.w+=k
c.x+=k
if(m===c.Q){c.ch.a6()
c.r=1
c.w=0}n=e
break
case 5130562:m=s.gi(a0)
l=c.Q
h=c.w
k=Math.min(m-n,l-h)
m=c.cx
if(m==null)m=c.cx=new Uint8Array(l)
l=h+k
c.w=l
B.j.a4(m,h,l,a0,n)
n+=k
c.x+=k
if(c.w===c.Q){c.r=1
c.w=0}break
case 4294967295:m=s.gi(a0)
l=c.Q
h=c.w
k=Math.min(m-n,l-h)
h+=k
c.w=h
n+=k
c.x+=k
if(h===l){c.r=1
c.w=0}break}c.d.aq()},
cg(){var s,r,q=this
switch(q.r){case 0:q.f.aO($.qA(),q.x)
q.aL()
break
case 1:if(q.w!==0){q.f.aO($.qz(),q.x)
q.aL()}else{s=q.y
r=q.x
if(s!==r)q.f.a1($.qv(),A.a([s,r],t.M),q.x)
s=q.ay
if(s!=null)s.ar(0,new A.ig(q),q.gci(),t.P)
else q.e.a2(new A.at("model/gltf-binary",null,q.cx))}break
default:if(q.Q>0)q.f.aO($.qy(),q.x)
q.aL()}},
dw(a){var s
this.d.K()
s=this.e
if((s.a.a&30)===0)s.P(a)},
$ieO:1}
A.ih.prototype={
$1(a){var s
try{this.a.du(a)}catch(s){if(A.K(s) instanceof A.bx)this.a.aL()
else throw s}},
$S:10}
A.ii.prototype={
$0(){var s=this.a
if((s.ch.b&4)!==0)s.d.aq()
else s.aL()},
$S:2}
A.ie.prototype={
$1$seen(a){var s=this.a
if(a){s.f.a1($.qp(),A.a(["0x"+B.a.ap(B.c.au(s.as,16),8,"0")],t.M),s.x-8)
s.r=4294967295}else s.r=s.as},
$0(){return this.$1$seen(null)},
$S:75}
A.ig.prototype={
$1(a){var s=this.a,r=a==null?null:a.b
s.e.a2(new A.at("model/gltf-binary",r,s.cx))},
$S:76}
A.at.prototype={}
A.il.prototype={
$0(){return this.a.b.aV()},
$S:1}
A.im.prototype={
$0(){return this.a.b.aq()},
$S:1}
A.ik.prototype={
$0(){return this.a.b.K()},
$S:77}
A.io.prototype={
$1(a){var s,r,q,p,o=this,n=null,m=o.a
if(!m.a){s=J.T(a)
if(s.gA(a)){m.b.K()
o.b.a6()
o.c.P(B.a7)
return}r=s.j(a,0)
if(103===r){s=o.b
q=o.d
p=new Uint8Array(12)
s=new A.dr(p,new A.ah(s,A.C(s).h("ah<1>")),new A.ay(new A.B($.A,t.f),t.G))
q.dx=!0
s.f=q
s.b=A.f3(p.buffer,0,n)
s.ch=A.oU(n,n,n,t.w)
o.c.a2(s)
m.a=!0}else{s=123===r||9===r||32===r||10===r||13===r||239===r
q=o.c
p=o.b
if(s){q.a2(A.u_(new A.ah(p,A.C(p).h("ah<1>")),o.d))
m.a=!0}else{m.b.K()
p.a6()
q.P(B.a7)
return}}}o.b.C(0,a)},
$S:10}
A.cP.prototype={
bW(){var s=this,r=A.a([],t.M),q=new A.ab("")
s.d=new A.mm(new A.fU(!1),new A.m9(B.aa.gcB().a,new A.fL(new A.ij(s),r,t.cy),q),q)
s.b=s.a.bO(s.gdB(),s.gdD(),s.gdF())
return s.c.a},
dC(a){var s,r,q,p=this
p.b.aV()
if(p.f){r=J.T(a)
if(r.ga7(a)&&239===r.j(a,0))p.e.aC($.h1(),A.a(["BOM found at the beginning of UTF-8 stream."],t.M),!0)
p.f=!1}try{p.d.dT(a,0,J.a3(a),!1)
p.b.aq()}catch(q){r=A.K(q)
if(r instanceof A.aI){s=r
p.e.aC($.h1(),A.a([s],t.M),!0)
p.b.K()
p.c.b9()}else throw q}},
dG(a){var s
this.b.K()
s=this.c
if((s.a.a&30)===0)s.P(a)},
dE(){var s,r,q,p=this
try{p.d.a6()}catch(r){q=A.K(r)
if(q instanceof A.aI){s=q
p.e.aC($.h1(),A.a([s],t.M),!0)
p.b.K()
p.c.b9()}else throw r}},
$ieO:1}
A.ij.prototype={
$1(a){var s,r,q,p=a[0]
if(t.t.b(p))try{r=this.a
s=A.or(p,r.e)
r.c.a2(new A.at("model/gltf+json",s,null))}catch(q){if(A.K(q) instanceof A.bx){r=this.a
r.b.K()
r.c.b9()}else throw q}else{r=this.a
r.e.aC($.a2(),A.a([p,"object"],t.M),!0)
r.b.K()
r.c.b9()}},
$S:79}
A.dt.prototype={
k(a){return"Invalid data: could not detect glTF format."},
$ia7:1}
A.mL.prototype={
$2(a,b){var s,r
this.a.$1(a)
b=A.mF(b)
s=A.aH(b)&&b>=0
r=this.b
if(s)r.m(0,a,b)
else{r.m(0,a,-1)
this.c.n($.h0(),a)}},
$S:3}
A.mM.prototype={
$2(a,b){var s,r
this.a.$1(a)
b=A.mF(b)
s=A.aH(b)&&b>=0
r=this.b
if(s)r.m(0,a,b)
else{r.m(0,a,-1)
this.c.n($.h0(),a)}},
$S:3}
A.mN.prototype={
$1(a){return a.ai(0,t.X,t.e)},
$S:80}
A.mJ.prototype={
$0(){return A.a([],t.bH)},
$S:81}
A.E.prototype={
j(a,b){return b==null||b<0||b>=this.a.length?null:this.a[b]},
m(a,b,c){this.a[b]=c},
gi(a){return this.b},
si(a,b){throw A.d(A.ac("Changing length is not supported"))},
k(a){return A.iH(this.a,"[","]")},
a3(a){var s,r,q,p
for(s=this.b,r=this.a,q=0;q<s;++q){p=r[q]
if(p==null)continue
a.$2(q,p)}}}
A.a1.prototype={
aD(a){return!0}}
A.fr.prototype={
a_(a,b,c,d){var s=this,r=s.c,q=r!=null?r.$1(d):d
r=s.a+q*q
s.a=r
if(2===c){if(Math.abs(Math.sqrt(r)-1)>0.00674)a.l($.nR(),A.a([b-2,b,Math.sqrt(s.a)],t.M),s.b)
s.a=0}return!0}}
A.fs.prototype={
a_(a,b,c,d){var s=this,r=s.c,q=r!=null?r.$1(d):d
if(3===c){if(1!==q&&-1!==q)a.l($.q5(),A.a([b-3,b,q],t.M),s.b)}else{r=s.a+q*q
s.a=r
if(2===c){if(Math.abs(Math.sqrt(r)-1)>0.00674)a.l($.nR(),A.a([b-2,b,Math.sqrt(s.a)],t.M),s.b)
s.a=0}}return!0}}
A.eG.prototype={
a_(a,b,c,d){if(1<d||0>d)a.l($.q9(),A.a([b,d],t.M),this.a)
return!0}}
A.lx.prototype={
bk(){var s,r,q,p,o,n=this,m=t.X,l=t._,k=A.a8(m,l),j=n.a
if(j!=null)k.m(0,"uri",j.k(0))
j=n.c
s=j==null
if((s?null:j.a)!=null)k.m(0,"mimeType",s?null:j.a)
k.m(0,"validatorVersion","2.0.0-dev.3.9")
if(n.d)k.m(0,"validatedAt",new A.dm(Date.now(),!1).er().eq())
j=n.b
r=j.cy
q=A.a8(m,l)
p=A.a([0,0,0,0],t.V)
o=A.oz(r.length,new A.lA(r,p),!1,t.t)
q.m(0,"numErrors",p[0])
q.m(0,"numWarnings",p[1])
q.m(0,"numInfos",p[2])
q.m(0,"numHints",p[3])
q.m(0,"messages",o)
q.m(0,"truncated",j.y)
k.m(0,"issues",q)
j=n.dt()
if(j!=null)k.m(0,"info",j)
return k},
dt(){var s,r,q,p,o,n,m,l,k,j,i=null,h=this.c,g=h==null?i:h.b
h=g==null?i:g.w
if((h==null?i:h.f)==null)return i
s=A.a8(t.X,t._)
h=g.w
s.m(0,"version",h.f)
r=h.r
if(r!=null)s.m(0,"minVersion",r)
h=h.e
if(h!=null)s.m(0,"generator",h)
h=g.d
r=J.T(h)
if(r.ga7(h)){h=r.bZ(h)
s.m(0,"extensionsUsed",A.ct(h,!1,A.C(h).c))}h=g.e
r=J.T(h)
if(r.ga7(h)){h=r.bZ(h)
s.m(0,"extensionsRequired",A.ct(h,!1,A.C(h).c))}h=this.b
r=h.CW
if(!r.gA(r))s.m(0,"resources",h.CW)
s.m(0,"animationCount",g.r.b)
s.m(0,"materialCount",g.as.b)
h=g.at
s.m(0,"hasMorphTargets",h.aP(h,new A.lz()))
r=g.cx
s.m(0,"hasSkins",!r.gA(r))
r=g.cy
s.m(0,"hasTextures",!r.gA(r))
s.m(0,"hasDefaultScene",g.ch!=null)
for(h=new A.a9(h,h.gi(h),h.$ti.h("a9<n.E>")),q=0,p=0,o=0,n=0,m=0,l=0;h.p();){r=h.d.w
if(r!=null){q+=r.b
for(r=new A.a9(r,r.gi(r),r.$ti.h("a9<n.E>"));r.p();){k=r.d
j=k.CW
if(j!==-1)m+=j
l+=k.ges()
p=Math.max(p,k.ay.a)
o=Math.max(o,k.ax)
n=Math.max(n,k.as*4)}}}s.m(0,"drawCallCount",q)
s.m(0,"totalVertexCount",m)
s.m(0,"totalTriangleCount",l)
s.m(0,"maxUVs",o)
s.m(0,"maxInfluences",n)
s.m(0,"maxAttributes",p)
return s}}
A.lA.prototype={
$1(a){var s,r=this.a[a],q=r.gc4().a,p=this.b
p[q]=p[q]+1
s=A.nm(["code",r.a.b,"message",r.gbi(),"severity",r.gc4().a],t.X,t._)
q=r.c
if(q!=null)s.m(0,"pointer",q)
else{q=r.d
if(q!=null)s.m(0,"offset",q)}return s},
$S:82}
A.lz.prototype={
$1(a){var s=a.w
return s!=null&&s.aP(s,new A.ly())},
$S:83}
A.ly.prototype={
$1(a){return a.cx!=null},
$S:5}
A.eZ.prototype={
k(a){return"[0] "+this.ae(0).k(0)+"\n[1] "+this.ae(1).k(0)+"\n[2] "+this.ae(2).k(0)+"\n"},
N(a,b){var s,r,q
if(b==null)return!1
if(b instanceof A.eZ){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]&&s[3]===q[3]&&s[4]===q[4]&&s[5]===q[5]&&s[6]===q[6]&&s[7]===q[7]&&s[8]===q[8]}else s=!1
return s},
gE(a){return A.k1(this.a)},
ae(a){var s=new Float32Array(3),r=this.a
s[0]=r[a]
s[1]=r[3+a]
s[2]=r[6+a]
return new A.cB(s)}}
A.cV.prototype={
k(a){var s=this
return"[0] "+s.ae(0).k(0)+"\n[1] "+s.ae(1).k(0)+"\n[2] "+s.ae(2).k(0)+"\n[3] "+s.ae(3).k(0)+"\n"},
N(a,b){var s,r,q
if(b==null)return!1
if(b instanceof A.cV){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]&&s[3]===q[3]&&s[4]===q[4]&&s[5]===q[5]&&s[6]===q[6]&&s[7]===q[7]&&s[8]===q[8]&&s[9]===q[9]&&s[10]===q[10]&&s[11]===q[11]&&s[12]===q[12]&&s[13]===q[13]&&s[14]===q[14]&&s[15]===q[15]}else s=!1
return s},
gE(a){return A.k1(this.a)},
ae(a){var s=new Float32Array(4),r=this.a
s[0]=r[a]
s[1]=r[4+a]
s[2]=r[8+a]
s[3]=r[12+a]
return new A.fw(s)},
cC(){var s=this.a,r=s[0],q=s[5],p=s[1],o=s[4],n=r*q-p*o,m=s[6],l=s[2],k=r*m-l*o,j=s[7],i=s[3],h=r*j-i*o,g=p*m-l*q,f=p*j-i*q,e=l*j-i*m
m=s[8]
i=s[9]
j=s[10]
l=s[11]
return-(i*e-j*f+l*g)*s[12]+(m*e-j*h+l*k)*s[13]-(m*f-i*h+l*n)*s[14]+(m*g-i*k+j*n)*s[15]},
cH(){var s=this.a,r=0+Math.abs(s[0])+Math.abs(s[1])+Math.abs(s[2])+Math.abs(s[3]),q=r>0?r:0
r=0+Math.abs(s[4])+Math.abs(s[5])+Math.abs(s[6])+Math.abs(s[7])
if(r>q)q=r
r=0+Math.abs(s[8])+Math.abs(s[9])+Math.abs(s[10])+Math.abs(s[11])
if(r>q)q=r
r=0+Math.abs(s[12])+Math.abs(s[13])+Math.abs(s[14])+Math.abs(s[15])
return r>q?r:q},
cL(){var s=this.a
return s[0]===1&&s[1]===0&&s[2]===0&&s[3]===0&&s[4]===0&&s[5]===1&&s[6]===0&&s[7]===0&&s[8]===0&&s[9]===0&&s[10]===1&&s[11]===0&&s[12]===0&&s[13]===0&&s[14]===0&&s[15]===1}}
A.fi.prototype={
gaT(){var s=this.a,r=s[0],q=s[1],p=s[2],o=s[3]
return r*r+q*q+p*p+o*o},
gi(a){var s=this.a,r=s[0],q=s[1],p=s[2],o=s[3]
return Math.sqrt(r*r+q*q+p*p+o*o)},
k(a){var s=this.a
return A.b(s[0])+", "+A.b(s[1])+", "+A.b(s[2])+" @ "+A.b(s[3])}}
A.cB.prototype={
bq(a,b,c){var s=this.a
s[0]=a
s[1]=b
s[2]=c},
k(a){var s=this.a
return"["+A.b(s[0])+","+A.b(s[1])+","+A.b(s[2])+"]"},
N(a,b){var s,r,q
if(b==null)return!1
if(b instanceof A.cB){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]}else s=!1
return s},
gE(a){return A.k1(this.a)},
gi(a){var s=this.a,r=s[0],q=s[1]
s=s[2]
return Math.sqrt(r*r+q*q+s*s)},
gaT(){var s=this.a,r=s[0],q=s[1]
s=s[2]
return r*r+q*q+s*s}}
A.fw.prototype={
k(a){var s=this.a
return A.b(s[0])+","+A.b(s[1])+","+A.b(s[2])+","+A.b(s[3])},
N(a,b){var s,r,q
if(b==null)return!1
if(b instanceof A.fw){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]&&s[3]===q[3]}else s=!1
return s},
gE(a){return A.k1(this.a)},
gi(a){var s=this.a,r=s[0],q=s[1],p=s[2]
s=s[3]
return Math.sqrt(r*r+q*q+p*p+s*s)}}
A.be.prototype={}
A.hW.prototype={}
A.d4.prototype={}
A.n4.prototype={
$3(a,b,c){var s=c.$1(J.aq(a))
return s},
$S:84}
A.n0.prototype={
$2(a,b){return new self.Promise(A.cF(new A.n_(a,b,this.a)),t._)},
$S:85}
A.n_.prototype={
$2(a,b){A.fY(this.a,this.b).ar(0,new A.mX(a),new A.mY(this.c,b),t.P)},
$S:24}
A.mX.prototype={
$1(a){this.a.$1(A.nI(a))},
$S:25}
A.mY.prototype={
$2(a,b){return this.a.$3(a,b,this.b)},
$S:26}
A.n1.prototype={
$2(a,b){return new self.Promise(A.cF(new A.mZ(a,b,this.a)),t._)},
$S:89}
A.mZ.prototype={
$2(a,b){A.nL(this.a,this.b).ar(0,new A.mV(a),new A.mW(this.c,b),t.P)},
$S:24}
A.mV.prototype={
$1(a){this.a.$1(A.nI(a))},
$S:25}
A.mW.prototype={
$2(a,b){return this.a.$3(a,b,this.b)},
$S:26}
A.n2.prototype={
$0(){return"2.0.0-dev.3.9"},
$S:90}
A.n3.prototype={
$0(){return A.nI(A.tR())},
$S:6}
A.my.prototype={
$1(a){var s=new A.B($.A,t.q),r=new A.ay(s,t.as),q=this.a.$1(J.aq(a))
if((q==null?null:J.tj(q))==null)r.P(new A.ar(!1,null,null,"options.externalResourceFunction: Function must return a Promise."))
else J.tu(q,A.cF(new A.mz(r)),A.cF(new A.mA(r)))
return s},
$S:91}
A.mz.prototype={
$1(a){var s=this.a
if(t.a.b(a))s.a2(a)
else s.P(new A.ar(!1,null,null,"options.externalResourceFunction: Promise must be fulfilled with Uint8Array or rejected."))},
$S:23}
A.mA.prototype={
$1(a){return this.a.P(new A.fc(J.aq(a)))},
$S:11}
A.mw.prototype={
$1(a){var s,r,q,p=this
if(p.a.dx&&a==null)return p.b.c
if(p.c!=null)s=p.d.$1(a)
else{r=p.e
A.bS(r,"error",t.K)
$.A!==B.i
q=A.eE(r)
s=new A.B($.A,t.q)
s.b1(r,q)}return s},
$0(){return this.$1(null)},
$C:"$1",
$R:0,
$D(){return[null]},
$S:139}
A.mx.prototype={
$1(a){var s,r,q,p,o=null
if(this.a!=null){s=this.b.$1(a)
s=A.uS(s,A.ai(s).c)}else{s=this.c
A.bS(s,"error",t.K)
r=t.f1
q=new A.b_(o,o,o,o,r)
p=A.eE(s)
q.b_(s,p)
q.aI()
s=new A.ah(q,r.h("ah<1>"))}return s},
$S:93}
A.fc.prototype={
k(a){return"Node Exception: "+A.b(this.a)},
$ia7:1};(function aliases(){var s=J.cR.prototype
s.d2=s.bj
s=J.aL.prototype
s.d6=s.k
s=A.aE.prototype
s.d3=s.cI
s.d4=s.cJ
s.d5=s.cK
s=A.n.prototype
s.d7=s.a4
s=A.eb.prototype
s.d9=s.a6
s=A.bh.prototype
s.d8=s.q})();(function installTearOffs(){var s=hunkHelpers._static_1,r=hunkHelpers._static_0,q=hunkHelpers._static_2,p=hunkHelpers._instance_2u,o=hunkHelpers._instance_0u,n=hunkHelpers.installInstanceTearOff,m=hunkHelpers._instance_1i,l=hunkHelpers._instance_1u
s(A,"w6","tY",94)
s(A,"ws","v_",12)
s(A,"wt","v0",12)
s(A,"wu","v1",12)
r(A,"pC","wf",1)
q(A,"wv","w9",16)
p(A.B.prototype,"gdk","az",16)
o(A.d7.prototype,"gdV","a6",55)
var k
o(k=A.dT.prototype,"gcl","b5",1)
o(k,"gcm","b6",1)
n(k=A.dP.prototype,"gec",0,0,null,["$1","$0"],["cS","aV"],59,0,0)
o(k,"gef","aq",1)
o(k,"gcl","b5",1)
o(k,"gcm","b6",1)
q(A,"wC","vN",96)
m(A.b0.prototype,"gcw","H",14)
q(A,"wo","tz",97)
q(A,"wn","ty",98)
q(A,"wl","tw",99)
q(A,"wm","tx",100)
l(A.a4.prototype,"gbS","eb",29)
q(A,"wq","tB",101)
q(A,"wp","tA",102)
q(A,"wr","tC",103)
q(A,"ww","tG",104)
q(A,"wx","tF",105)
q(A,"wA","tJ",106)
q(A,"wy","tH",107)
q(A,"wz","tI",108)
q(A,"wP","u3",109)
q(A,"xd","uu",110)
q(A,"xf","uF",111)
q(A,"xe","uE",112)
q(A,"pO","uD",113)
q(A,"ap","uU",114)
q(A,"xg","uy",115)
q(A,"xh","uC",116)
q(A,"xi","uP",117)
q(A,"xj","uQ",118)
q(A,"xk","uR",119)
q(A,"xm","uV",120)
s(A,"dh","wb",27)
s(A,"pE","w7",27)
s(A,"wH","vU",13)
q(A,"wG","tX",123)
q(A,"wW","ua",124)
q(A,"wX","ub",125)
q(A,"wY","uc",126)
q(A,"wZ","ud",127)
q(A,"x_","ue",128)
q(A,"x0","uf",129)
q(A,"x1","ug",130)
q(A,"x2","uh",131)
q(A,"x3","ui",132)
q(A,"x4","uj",133)
q(A,"x5","uk",134)
q(A,"x6","ul",135)
q(A,"u8","um",136)
q(A,"u9","un",137)
q(A,"x7","uo",138)
q(A,"x9","up",92)
o(k=A.dr.prototype,"gdv","cg",1)
l(k,"gci","dw",11)
l(k=A.cP.prototype,"gdB","dC",78)
l(k,"gdF","dG",11)
o(k,"gdD","dE",1)
s(A,"x8","vV",13)})();(function inheritance(){var s=hunkHelpers.mixin,r=hunkHelpers.inherit,q=hunkHelpers.inheritMany
r(A.c,null)
q(A.c,[A.nk,J.cR,J.b4,A.j,A.dk,A.I,A.c6,A.G,A.e3,A.a9,A.M,A.dn,A.dq,A.fu,A.d_,A.dA,A.cM,A.iI,A.ll,A.fe,A.dp,A.e8,A.me,A.jJ,A.cs,A.iJ,A.mc,A.aQ,A.fG,A.ed,A.mj,A.fz,A.d3,A.aG,A.eD,A.fC,A.bK,A.B,A.fA,A.bg,A.fo,A.d7,A.fP,A.fB,A.dP,A.fE,A.lU,A.fK,A.fN,A.mo,A.e_,A.em,A.mb,A.e2,A.n,A.fS,A.cY,A.fT,A.lk,A.eJ,A.lR,A.eF,A.fU,A.dm,A.lV,A.ff,A.dK,A.dW,A.aI,A.cU,A.k,A.fO,A.ab,A.ej,A.ln,A.fM,A.fH,A.a1,A.m,A.c1,A.c_,A.y,A.lw,A.i,A.bx,A.cb,A.iA,A.dO,A.dN,A.aJ,A.fk,A.k6,A.eT,A.iG,A.cS,A.O,A.V,A.c9,A.cr,A.fl,A.dr,A.at,A.cP,A.dt,A.lx,A.eZ,A.cV,A.fi,A.cB,A.fw,A.fc])
q(J.cR,[J.dv,J.dx,J.eW,J.D,J.cc,J.by,A.dD])
r(J.aL,J.eW)
q(J.aL,[J.fg,J.bI,J.b9,A.be,A.hW,A.d4])
r(J.iK,J.D)
q(J.cc,[J.dw,J.eV])
q(A.j,[A.bJ,A.p,A.bc,A.lC,A.bf,A.dS,A.du])
q(A.bJ,[A.c4,A.el])
r(A.dV,A.c4)
r(A.dQ,A.el)
r(A.b5,A.dQ)
r(A.dz,A.I)
q(A.dz,[A.c5,A.aE,A.dY,A.fI])
q(A.c6,[A.eI,A.eH,A.hX,A.fp,A.iO,A.mQ,A.mS,A.lO,A.lN,A.mp,A.lZ,A.m6,A.lf,A.lh,A.ma,A.jL,A.mu,A.mv,A.mr,A.lK,A.lL,A.lH,A.lI,A.lE,A.lF,A.iw,A.ix,A.ip,A.iy,A.jO,A.jP,A.jQ,A.jU,A.jZ,A.k_,A.k0,A.k9,A.le,A.hg,A.hh,A.hk,A.hi,A.iB,A.iD,A.iN,A.iM,A.k7,A.k8,A.n8,A.mE,A.hK,A.hL,A.hD,A.hC,A.hs,A.hr,A.hH,A.hy,A.hq,A.hE,A.hw,A.ht,A.hv,A.hu,A.ho,A.hp,A.hG,A.hF,A.hx,A.hN,A.hP,A.hS,A.hT,A.hQ,A.hR,A.hO,A.hU,A.hM,A.hA,A.hz,A.hI,A.hJ,A.hB,A.iF,A.kc,A.kd,A.kb,A.kf,A.kg,A.kh,A.ke,A.ki,A.kj,A.kk,A.kp,A.kq,A.ko,A.kl,A.km,A.kn,A.la,A.lb,A.kW,A.kG,A.kt,A.ku,A.ks,A.kv,A.kw,A.kx,A.kz,A.ky,A.kA,A.kB,A.kC,A.kD,A.kO,A.kR,A.kV,A.kT,A.kQ,A.kU,A.kS,A.kP,A.l_,A.kY,A.l0,A.l7,A.ld,A.l6,A.lc,A.kF,A.kZ,A.l3,A.l2,A.l1,A.l8,A.l9,A.l5,A.kX,A.l4,A.kE,A.kH,A.kI,A.kN,A.kM,A.kK,A.kJ,A.kL,A.j_,A.iY,A.iZ,A.j0,A.j3,A.j1,A.j2,A.j7,A.j5,A.j9,A.j6,A.j8,A.j4,A.ja,A.jd,A.jc,A.jb,A.je,A.jf,A.jj,A.jk,A.jq,A.ji,A.jh,A.jn,A.jm,A.jl,A.jr,A.js,A.jp,A.jo,A.jt,A.ju,A.jx,A.jv,A.jw,A.jy,A.jA,A.jz,A.jB,A.jC,A.jD,A.jE,A.jF,A.jI,A.jH,A.jG,A.jg,A.i4,A.i5,A.i7,A.hZ,A.i6,A.i_,A.i2,A.i1,A.i0,A.ia,A.i9,A.ib,A.ic,A.i8,A.id,A.i3,A.iT,A.iW,A.ih,A.ie,A.ig,A.io,A.ij,A.mN,A.lA,A.lz,A.ly,A.n4,A.mX,A.mV,A.my,A.mz,A.mA,A.mw,A.mx])
q(A.eI,[A.he,A.k4,A.mR,A.mq,A.mG,A.m_,A.lg,A.jK,A.jY,A.lp,A.lq,A.lr,A.mt,A.h3,A.h4,A.it,A.iu,A.ir,A.is,A.iz,A.jN,A.jX,A.jW,A.jS,A.jT,A.jV,A.hm,A.n7,A.n9,A.iR,A.iS,A.iV,A.iU,A.mL,A.mM,A.n0,A.n_,A.mY,A.n1,A.mZ,A.mW])
q(A.G,[A.eY,A.fj,A.dF,A.aX,A.eX,A.ft,A.fm,A.fF,A.eC,A.fd,A.ar,A.fb,A.fv,A.fq,A.bG,A.eK,A.eM])
r(A.dy,A.e3)
q(A.dy,[A.d0,A.E])
q(A.d0,[A.cL,A.aY])
q(A.eH,[A.n6,A.lP,A.lQ,A.mk,A.lW,A.m2,A.m0,A.lY,A.m1,A.lX,A.m5,A.m4,A.m3,A.li,A.mi,A.mh,A.lT,A.lS,A.md,A.mD,A.mg,A.lv,A.lu,A.lJ,A.lM,A.lD,A.lG,A.iv,A.iq,A.jR,A.hf,A.hl,A.hj,A.iC,A.k3,A.ii,A.il,A.im,A.ik,A.mJ,A.n2,A.n3])
q(A.p,[A.ag,A.b7,A.aM,A.dZ])
q(A.ag,[A.dL,A.aa,A.fJ,A.dX])
r(A.c7,A.bc)
q(A.M,[A.dB,A.cC,A.dJ])
r(A.cN,A.bf)
r(A.eh,A.dA)
r(A.bk,A.eh)
r(A.dl,A.bk)
q(A.cM,[A.as,A.Y])
r(A.dG,A.aX)
q(A.fp,[A.fn,A.cK])
r(A.cW,A.dD)
q(A.cW,[A.e4,A.e6])
r(A.e5,A.e4)
r(A.dC,A.e5)
r(A.e7,A.e6)
r(A.aw,A.e7)
q(A.dC,[A.f4,A.f5])
q(A.aw,[A.f6,A.f7,A.f8,A.f9,A.fa,A.dE,A.cu])
r(A.ee,A.fF)
r(A.ec,A.du)
r(A.ay,A.fC)
q(A.d7,[A.b_,A.d8])
r(A.e9,A.bg)
r(A.ah,A.e9)
r(A.dT,A.dP)
q(A.fE,[A.cD,A.dU])
r(A.ea,A.fK)
r(A.mf,A.mo)
r(A.e0,A.dY)
r(A.e1,A.aE)
r(A.d5,A.em)
q(A.d5,[A.b0,A.en])
r(A.ei,A.en)
r(A.lj,A.lk)
r(A.eb,A.lj)
r(A.m9,A.eb)
q(A.eJ,[A.h9,A.hV,A.iP])
r(A.eL,A.fo)
q(A.eL,[A.hb,A.ha,A.iQ,A.lt])
q(A.eF,[A.hc,A.fL])
r(A.mm,A.hc)
r(A.ls,A.hV)
q(A.ar,[A.dI,A.eR])
r(A.fD,A.ej)
r(A.l,A.fH)
q(A.l,[A.eN,A.bX,A.bY,A.bZ,A.b2,A.c0,A.b3,A.bu,A.c2,A.c3,A.ds,A.cx,A.bh,A.aF,A.c8,A.bz,A.cd,A.ce,A.cf,A.cg,A.ch,A.ci,A.cj,A.ck,A.cl,A.cm,A.cn,A.bA,A.co,A.bb,A.cp,A.cq])
q(A.eN,[A.a4,A.bt,A.aS,A.bv,A.bw,A.aT,A.av,A.aU,A.an,A.bC,A.bD,A.bF,A.bH,A.ba,A.aK])
q(A.a4,[A.fy,A.fx])
q(A.a1,[A.eU,A.f1,A.f_,A.f2,A.f0,A.eB,A.dH,A.eQ,A.eP,A.fr,A.fs,A.eG])
q(A.bh,[A.cw,A.cv])
q(A.lV,[A.cQ,A.dR,A.d1,A.ca,A.d6,A.bE])
q(A.iA,[A.iL,A.k2,A.lB])
q(A.iG,[A.hn,A.iE,A.ka,A.kr,A.iX,A.hY])
s(A.d0,A.fu)
s(A.el,A.n)
s(A.e4,A.n)
s(A.e5,A.dq)
s(A.e6,A.n)
s(A.e7,A.dq)
s(A.b_,A.fB)
s(A.d8,A.fP)
s(A.e3,A.n)
s(A.eh,A.fS)
s(A.em,A.cY)
s(A.en,A.fT)
s(A.fH,A.m)})()
var v={typeUniverse:{eC:new Map(),tR:{},eT:{},tPV:{},sEA:[]},mangledGlobalNames:{f:"int",z:"double",L:"num",e:"String",Q:"bool",k:"Null",o:"List"},mangledNames:{},types:["e*(o<@>*)","~()","k()","k(e*,c*)","k(e*,f*)","Q*(aF*)","@()","z*(f*)","Q*(f*)","k(an*,f*,f*)","k(o<f*>*)","~(c*)","~(~())","~(i*)","Q(c?)","k(@)","~(c,am)","~(a6,e,f)","j<f*>*()","j<z*>*()","k(f*,aF*)","~(e*)","Q*(O*)","k(c*)","k(~(c*)*,aD*)","k(h<e*,c*>*)","~(c*,am*)","e*(c*)","k(f*,cy*)","z*(L*)","@(@)","j<f*>*(f*,f*,f*)","f*(f*)","@(@,e)","~(@)","j<z*>*(f*,f*,f*)","k(f*,b3*)","k(f*,b2*)","E<0^*>*(e*,0^*(h<e*,c*>*,i*)*)<c*>","0^*(e*,0^*(h<e*,c*>*,i*)*{req:Q*})<c*>","~(E<l*>*,bi*)","k(f*,l*)","k(@,am)","k(f*,an*)","Q*(an*)","~(E<cy*>*)","a5<k>()","~(l*,e*)","~(f,@)","@(e)","f*(f*,f*,e*)","k(c,am)","B<@>(@)","cz<a4<L*>*>*()","k(@,@)","a5<@>()","e*(O*)","o<a1<L*>*>*()","e*(e*)","~([a5<~>?])","O*()","k(bi*,V*)","Q(@)","~(c?,c?)","a6*/*(aS*)","bg<o<f*>*>*(aT*)","k(f*,a4<L*>*)","Q*(M<L*>*)","~(e,@)","k(f*,ba*)","k(f*,aK*)","k(f*,bb*)","aK*(f*)","Q*(c*)","~(cA,@)","~({seen:Q*})","k(at*)","a5<~>*()","~(o<f*>*)","k(o<c*>*)","h<e*,f*>*(h<@,@>*)","o<cr*>*()","h<e*,c*>*(f*)","Q*(aU*)","~(c*,am*,aD*)","be<1&>*(a6*,c*)","~(e,f)","~(e,f?)","f(f,f)","be<1&>*(e*,c*)","e*()","a5<a6*>*(aZ*)","cq*(h<e*,c*>*,i*)","bg<o<f*>*>*(aZ*)","f(c?)","a6(@,@)","Q(c?,c?)","a4<L*>*(h<e*,c*>*,i*)","bX*(h<e*,c*>*,i*)","bY*(h<e*,c*>*,i*)","bZ*(h<e*,c*>*,i*)","bt*(h<e*,c*>*,i*)","c0*(h<e*,c*>*,i*)","bu*(h<e*,c*>*,i*)","aS*(h<e*,c*>*,i*)","bv*(h<e*,c*>*,i*)","bw*(h<e*,c*>*,i*)","c2*(h<e*,c*>*,i*)","c3*(h<e*,c*>*,i*)","aT*(h<e*,c*>*,i*)","av*(h<e*,c*>*,i*)","cx*(h<e*,c*>*,i*)","cw*(h<e*,c*>*,i*)","cv*(h<e*,c*>*,i*)","bh*(h<e*,c*>*,i*)","aU*(h<e*,c*>*,i*)","an*(h<e*,c*>*,i*)","bC*(h<e*,c*>*,i*)","bD*(h<e*,c*>*,i*)","bF*(h<e*,c*>*,i*)","bH*(h<e*,c*>*,i*)","k(~())","c?(c?)","c8*(h<e*,c*>*,i*)","bz*(h<e*,c*>*,i*)","cd*(h<e*,c*>*,i*)","ce*(h<e*,c*>*,i*)","cf*(h<e*,c*>*,i*)","cg*(h<e*,c*>*,i*)","ch*(h<e*,c*>*,i*)","ci*(h<e*,c*>*,i*)","cj*(h<e*,c*>*,i*)","ck*(h<e*,c*>*,i*)","cl*(h<e*,c*>*,i*)","cm*(h<e*,c*>*,i*)","cn*(h<e*,c*>*,i*)","bA*(h<e*,c*>*,i*)","co*(h<e*,c*>*,i*)","cp*(h<e*,c*>*,i*)","a6*/*([aZ*])"],interceptorsByTag:null,leafTags:null,arrayRti:Symbol("$ti")}
A.vk(v.typeUniverse,JSON.parse('{"fg":"aL","bI":"aL","b9":"aL","be":"aL","hW":"aL","d4":"aL","dv":{"Q":[]},"dx":{"k":[]},"aL":{"be":["1&"],"d4":[]},"D":{"o":["1"],"p":["1"],"j":["1"]},"iK":{"D":["1"],"o":["1"],"p":["1"],"j":["1"]},"b4":{"M":["1"]},"cc":{"z":[],"L":[]},"dw":{"z":[],"f":[],"L":[]},"eV":{"z":[],"L":[]},"by":{"e":[]},"bJ":{"j":["2"]},"dk":{"M":["2"]},"c4":{"bJ":["1","2"],"j":["2"],"j.E":"2"},"dV":{"c4":["1","2"],"bJ":["1","2"],"p":["2"],"j":["2"],"j.E":"2"},"dQ":{"n":["2"],"o":["2"],"bJ":["1","2"],"p":["2"],"j":["2"]},"b5":{"dQ":["1","2"],"n":["2"],"o":["2"],"bJ":["1","2"],"p":["2"],"j":["2"],"n.E":"2","j.E":"2"},"c5":{"I":["3","4"],"h":["3","4"],"I.K":"3","I.V":"4"},"eY":{"G":[]},"fj":{"G":[]},"cL":{"n":["f"],"o":["f"],"p":["f"],"j":["f"],"n.E":"f"},"dF":{"aX":[],"G":[]},"p":{"j":["1"]},"ag":{"p":["1"],"j":["1"]},"dL":{"ag":["1"],"p":["1"],"j":["1"],"j.E":"1","ag.E":"1"},"a9":{"M":["1"]},"bc":{"j":["2"],"j.E":"2"},"c7":{"bc":["1","2"],"p":["2"],"j":["2"],"j.E":"2"},"dB":{"M":["2"]},"aa":{"ag":["2"],"p":["2"],"j":["2"],"j.E":"2","ag.E":"2"},"lC":{"j":["1"],"j.E":"1"},"cC":{"M":["1"]},"bf":{"j":["1"],"j.E":"1"},"cN":{"bf":["1"],"p":["1"],"j":["1"],"j.E":"1"},"dJ":{"M":["1"]},"b7":{"p":["1"],"j":["1"],"j.E":"1"},"dn":{"M":["1"]},"d0":{"n":["1"],"o":["1"],"p":["1"],"j":["1"]},"d_":{"cA":[]},"dl":{"bk":["1","2"],"h":["1","2"]},"cM":{"h":["1","2"]},"as":{"cM":["1","2"],"h":["1","2"]},"dS":{"j":["1"],"j.E":"1"},"Y":{"cM":["1","2"],"h":["1","2"]},"dG":{"aX":[],"G":[]},"eX":{"G":[]},"ft":{"G":[]},"fe":{"a7":[]},"e8":{"am":[]},"c6":{"aD":[]},"eH":{"aD":[]},"eI":{"aD":[]},"fp":{"aD":[]},"fn":{"aD":[]},"cK":{"aD":[]},"fm":{"G":[]},"aE":{"I":["1","2"],"h":["1","2"],"I.K":"1","I.V":"2"},"aM":{"p":["1"],"j":["1"],"j.E":"1"},"cs":{"M":["1"]},"cW":{"au":["1"]},"dC":{"n":["z"],"au":["z"],"o":["z"],"p":["z"],"j":["z"]},"aw":{"n":["f"],"au":["f"],"o":["f"],"p":["f"],"j":["f"]},"f4":{"n":["z"],"au":["z"],"o":["z"],"p":["z"],"j":["z"],"n.E":"z"},"f5":{"n":["z"],"au":["z"],"o":["z"],"p":["z"],"j":["z"],"n.E":"z"},"f6":{"aw":[],"n":["f"],"au":["f"],"o":["f"],"p":["f"],"j":["f"],"n.E":"f"},"f7":{"aw":[],"n":["f"],"au":["f"],"o":["f"],"p":["f"],"j":["f"],"n.E":"f"},"f8":{"aw":[],"n":["f"],"au":["f"],"o":["f"],"p":["f"],"j":["f"],"n.E":"f"},"f9":{"aw":[],"n":["f"],"au":["f"],"o":["f"],"p":["f"],"j":["f"],"n.E":"f"},"fa":{"aw":[],"n":["f"],"au":["f"],"o":["f"],"p":["f"],"j":["f"],"n.E":"f"},"dE":{"aw":[],"n":["f"],"au":["f"],"o":["f"],"p":["f"],"j":["f"],"n.E":"f"},"cu":{"aw":[],"n":["f"],"a6":[],"au":["f"],"o":["f"],"p":["f"],"j":["f"],"n.E":"f"},"ed":{"bi":[]},"fF":{"G":[]},"ee":{"aX":[],"G":[]},"B":{"a5":["1"]},"aG":{"M":["1"]},"ec":{"j":["1"],"j.E":"1"},"eD":{"G":[]},"ay":{"fC":["1"]},"b_":{"d7":["1"]},"d8":{"d7":["1"]},"ah":{"bg":["1"]},"e9":{"bg":["1"]},"dY":{"I":["1","2"],"h":["1","2"]},"e0":{"dY":["1","2"],"I":["1","2"],"h":["1","2"],"I.K":"1","I.V":"2"},"dZ":{"p":["1"],"j":["1"],"j.E":"1"},"e_":{"M":["1"]},"e1":{"aE":["1","2"],"I":["1","2"],"h":["1","2"],"I.K":"1","I.V":"2"},"b0":{"d5":["1"],"cY":["1"],"cz":["1"],"p":["1"],"j":["1"]},"e2":{"M":["1"]},"aY":{"n":["1"],"o":["1"],"p":["1"],"j":["1"],"n.E":"1"},"du":{"j":["1"]},"dy":{"n":["1"],"o":["1"],"p":["1"],"j":["1"]},"dz":{"I":["1","2"],"h":["1","2"]},"I":{"h":["1","2"]},"dA":{"h":["1","2"]},"bk":{"h":["1","2"]},"d5":{"cY":["1"],"cz":["1"],"p":["1"],"j":["1"]},"ei":{"d5":["1"],"cY":["1"],"cz":["1"],"p":["1"],"j":["1"]},"fI":{"I":["e","@"],"h":["e","@"],"I.K":"e","I.V":"@"},"fJ":{"ag":["e"],"p":["e"],"j":["e"],"j.E":"e","ag.E":"e"},"z":{"L":[]},"f":{"L":[]},"o":{"p":["1"],"j":["1"]},"cz":{"p":["1"],"j":["1"]},"eC":{"G":[]},"aX":{"G":[]},"fd":{"G":[]},"ar":{"G":[]},"dI":{"G":[]},"eR":{"G":[]},"fb":{"G":[]},"fv":{"G":[]},"fq":{"G":[]},"bG":{"G":[]},"eK":{"G":[]},"ff":{"G":[]},"dK":{"G":[]},"eM":{"G":[]},"dW":{"a7":[]},"aI":{"a7":[]},"dX":{"ag":["1"],"p":["1"],"j":["1"],"j.E":"1","ag.E":"1"},"fO":{"am":[]},"ej":{"aZ":[]},"fM":{"aZ":[]},"fD":{"aZ":[]},"a4":{"l":[],"m":[],"q":[]},"bX":{"l":[],"m":[],"q":[]},"bY":{"l":[],"m":[],"q":[]},"bZ":{"l":[],"m":[],"q":[]},"fy":{"a4":["f*"],"l":[],"m":[],"q":[]},"fx":{"a4":["z*"],"l":[],"m":[],"q":[]},"eU":{"a1":["z*"]},"f1":{"a1":["z*"]},"f_":{"a1":["z*"]},"f2":{"a1":["f*"]},"f0":{"a1":["f*"]},"bt":{"l":[],"m":[],"q":[]},"b2":{"l":[],"m":[],"q":[]},"c0":{"l":[],"m":[],"q":[]},"b3":{"l":[],"m":[],"q":[]},"eB":{"a1":["z*"]},"dH":{"a1":["1*"]},"bu":{"l":[],"m":[],"q":[]},"aS":{"l":[],"m":[],"q":[]},"bv":{"l":[],"m":[],"q":[]},"bw":{"l":[],"m":[],"q":[]},"c2":{"l":[],"m":[],"q":[]},"c3":{"l":[],"m":[],"q":[]},"ds":{"l":[],"m":[],"q":[]},"l":{"m":[],"q":[]},"eN":{"l":[],"m":[],"q":[]},"aT":{"l":[],"m":[],"q":[]},"av":{"l":[],"m":[],"q":[]},"cx":{"l":[],"m":[],"q":[]},"cw":{"l":[],"m":[],"q":[]},"cv":{"l":[],"m":[],"q":[]},"bh":{"l":[],"m":[],"q":[]},"aU":{"l":[],"m":[],"q":[]},"aF":{"l":[],"m":[],"q":[]},"eQ":{"a1":["f*"]},"an":{"l":[],"m":[],"q":[]},"bC":{"l":[],"m":[],"q":[]},"bD":{"l":[],"m":[],"q":[]},"bF":{"l":[],"m":[],"q":[]},"eP":{"a1":["z*"]},"bH":{"l":[],"m":[],"q":[],"cy":[]},"bx":{"a7":[]},"dO":{"a7":[]},"dN":{"a7":[]},"aJ":{"a7":[]},"c8":{"l":[],"m":[],"q":[],"cy":[]},"bz":{"l":[],"m":[],"q":[]},"ba":{"l":[],"m":[],"q":[]},"cd":{"l":[],"m":[],"q":[]},"ce":{"l":[],"m":[],"q":[]},"cf":{"l":[],"m":[],"q":[]},"cg":{"l":[],"m":[],"q":[]},"ch":{"l":[],"m":[],"q":[]},"ci":{"l":[],"m":[],"q":[]},"cj":{"l":[],"m":[],"q":[]},"ck":{"l":[],"m":[],"q":[]},"cl":{"l":[],"m":[],"q":[]},"cm":{"l":[],"m":[],"q":[]},"cn":{"l":[],"m":[],"q":[]},"bA":{"l":[],"m":[],"q":[]},"aK":{"l":[],"m":[],"q":[]},"co":{"l":[],"m":[],"q":[]},"bb":{"l":[],"m":[],"q":[]},"cp":{"l":[],"m":[],"q":[]},"cq":{"l":[],"m":[],"q":[]},"dr":{"eO":[]},"cP":{"eO":[]},"dt":{"a7":[]},"E":{"n":["1*"],"o":["1*"],"p":["1*"],"j":["1*"],"n.E":"1*"},"fr":{"a1":["L*"]},"fs":{"a1":["L*"]},"eG":{"a1":["z*"]},"fc":{"a7":[]},"a6":{"o":["f"],"p":["f"],"j":["f"]}}'))
A.vj(v.typeUniverse,JSON.parse('{"dq":1,"fu":1,"d0":1,"el":2,"cW":1,"fo":2,"fP":1,"fB":1,"dT":1,"dP":1,"e9":1,"fE":1,"cD":1,"fK":1,"ea":1,"fN":1,"du":1,"dy":1,"dz":2,"fS":2,"dA":2,"fT":1,"e3":1,"eh":2,"em":1,"en":1,"eF":1,"eJ":2,"eL":2,"eb":1}'))
var u={p:") does not match the number of morph targets (",d:"Accessor sparse indices element at index ",m:"Animation input accessor element at index ",c:"Error handler must accept one Object or one Object and a StackTrace as arguments, and return a value of the returned future's type",g:"`null` encountered as the result from expression with type `Never`."}
var t=(function rtii(){var s=A.aB
return{gF:s("dl<cA,@>"),O:s("p<@>"),Q:s("G"),b8:s("aD"),d:s("a5<@>"),bq:s("a5<~>"),N:s("Y<bi*,V*>"),j:s("j<@>"),s:s("D<e>"),gN:s("D<a6>"),b:s("D<@>"),Z:s("D<f>"),p:s("D<y*>"),gd:s("D<a1<L*>*>"),bd:s("D<eT*>"),a9:s("D<cS*>"),b2:s("D<M<L*>*>"),bH:s("D<cr*>"),fh:s("D<h<e*,c*>*>"),M:s("D<c*>"),d6:s("D<fl*>"),i:s("D<e*>"),o:s("D<z*>"),V:s("D<f*>"),T:s("dx"),g:s("b9"),aU:s("au<@>"),eo:s("aE<cA,@>"),I:s("h<@,@>"),gw:s("aa<O*,e*>"),eB:s("aw"),bm:s("cu"),P:s("k"),K:s("c"),ed:s("dH<L*>"),eq:s("E<b2*>"),az:s("E<b3*>"),E:s("E<ba*>"),B:s("E<bb*>"),u:s("E<aK*>"),b_:s("E<aF*>"),gm:s("am"),R:s("e"),fo:s("cA"),dd:s("bi"),eK:s("aX"),gc:s("a6"),ak:s("bI"),go:s("aY<h<e*,c*>*>"),em:s("aY<e*>"),f8:s("bk<c9*,V*>"),n:s("aZ"),a_:s("ay<eO*>"),G:s("ay<at*>"),eP:s("ay<cb*>"),as:s("ay<a6*>"),f1:s("b_<o<f*>*>"),U:s("B<k>"),eI:s("B<@>"),fJ:s("B<f>"),eD:s("B<eO*>"),f:s("B<at*>"),dD:s("B<cb*>"),q:s("B<a6*>"),D:s("B<~>"),aH:s("e0<@,@>"),cy:s("fL<c*>"),y:s("Q"),gR:s("z"),z:s("@"),v:s("@(c)"),C:s("@(c,am)"),S:s("f"),aD:s("y*"),hc:s("a4<f*>*"),W:s("a4<L*>*"),bj:s("bt*"),aA:s("b2*"),gW:s("b3*"),gP:s("bu*"),cT:s("aS*"),r:s("bv*"),h2:s("bw*"),x:s("a7*"),af:s("O*"),f9:s("V*"),al:s("c9*"),b1:s("aD*"),ec:s("aT*"),Y:s("j<@>*"),ga:s("M<z*>*"),bF:s("M<f*>*"),cp:s("ba*"),aa:s("bb*"),J:s("aK*"),c:s("q*"),l:s("o<@>*"),b7:s("o<a1<L*>*>*"),an:s("o<cr*>*"),m:s("o<c*>*"),eG:s("o<e*>*"),fy:s("o<z*>*"),w:s("o<f*>*"),h:s("h<@,@>*"),gj:s("h<e*,a4<L*>*>*"),t:s("h<e*,c*>*"),fC:s("av*"),eM:s("aU*"),ft:s("aF*"),A:s("0&*"),L:s("an*"),_:s("c*"),ax:s("cy*"),b5:s("E<m*>*"),c2:s("bC*"),bn:s("bD*"),cn:s("cz<y*>*"),gz:s("cz<a4<L*>*>*"),dz:s("bE*"),aV:s("bF*"),X:s("e*"),ai:s("bH*"),f7:s("bi*"),a:s("a6*"),bv:s("d4*"),F:s("z*"),e:s("f*"),eH:s("a5<k>?"),cK:s("c?"),di:s("L"),H:s("~"),d5:s("~(c)"),k:s("~(c,am)")}})();(function constants(){var s=hunkHelpers.makeConstList
B.bP=J.cR.prototype
B.d=J.D.prototype
B.bU=J.dv.prototype
B.c=J.dw.prototype
B.bV=J.cc.prototype
B.a=J.by.prototype
B.bW=J.b9.prototype
B.bX=J.eW.prototype
B.j=A.cu.prototype
B.az=J.fg.prototype
B.W=J.bI.prototype
B.X=new A.y("MAT4",5126,!1)
B.G=new A.y("SCALAR",5126,!1)
B.Z=new A.y("VEC2",5120,!0)
B.a_=new A.y("VEC2",5121,!0)
B.a1=new A.y("VEC2",5122,!0)
B.a2=new A.y("VEC2",5123,!0)
B.a3=new A.y("VEC2",5126,!1)
B.w=new A.y("VEC3",5120,!0)
B.H=new A.y("VEC3",5121,!0)
B.x=new A.y("VEC3",5122,!0)
B.I=new A.y("VEC3",5123,!0)
B.k=new A.y("VEC3",5126,!1)
B.J=new A.y("VEC4",5120,!0)
B.aZ=new A.y("VEC4",5121,!1)
B.y=new A.y("VEC4",5121,!0)
B.K=new A.y("VEC4",5122,!0)
B.b_=new A.y("VEC4",5123,!1)
B.z=new A.y("VEC4",5123,!0)
B.n=new A.y("VEC4",5126,!1)
B.b0=new A.c_("AnimationInput")
B.b1=new A.c_("AnimationOutput")
B.b2=new A.c_("IBM")
B.b3=new A.c_("PrimitiveIndices")
B.a6=new A.c_("VertexAttribute")
B.b4=new A.c1("IBM")
B.b5=new A.c1("Image")
B.L=new A.c1("IndexBuffer")
B.o=new A.c1("Other")
B.A=new A.c1("VertexBuffer")
B.ec=new A.hb()
B.b6=new A.h9()
B.b7=new A.ha()
B.b8=new A.dn(A.aB("dn<0&*>"))
B.a7=new A.dt()
B.b9=new A.bx()
B.a8=function getTagFallback(o) {
  var s = Object.prototype.toString.call(o);
  return s.substring(8, s.length - 1);
}
B.ba=function() {
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
B.bf=function(getTagFallback) {
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
B.bb=function(hooks) {
  if (typeof dartExperimentalFixupGetTag != "function") return hooks;
  hooks.getTag = dartExperimentalFixupGetTag(hooks.getTag);
}
B.bc=function(hooks) {
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
B.be=function(hooks) {
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
B.bd=function(hooks) {
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
B.a9=function(hooks) { return hooks; }

B.aa=new A.iP()
B.bg=new A.ff()
B.bh=new A.dN()
B.bi=new A.dO()
B.ab=new A.ls()
B.M=new A.lU()
B.ac=new A.me()
B.i=new A.mf()
B.bj=new A.fO()
B.O=new A.ca(0,"Unknown")
B.p=new A.ca(1,"RGB")
B.B=new A.ca(2,"RGBA")
B.ad=new A.ca(3,"Luminance")
B.ae=new A.ca(4,"LuminanceAlpha")
B.af=new A.cQ(0,"JPEG")
B.ag=new A.cQ(1,"PNG")
B.ah=new A.cQ(2,"WebP")
B.bO=new A.cQ(3,"KTX2")
B.ai=new A.aJ("Wrong WebP header.")
B.bQ=new A.aJ("PNG header not found.")
B.bR=new A.aJ("Invalid JPEG marker segment length.")
B.q=new A.aJ("Wrong chunk length.")
B.bS=new A.aJ("Invalid number of JPEG color channels.")
B.bT=new A.aJ("Invalid start of file.")
B.bY=new A.iQ(null)
B.bZ=A.a(s([0,0]),t.o)
B.aj=A.a(s([0,0,0]),t.o)
B.c_=A.a(s([16]),t.V)
B.c0=A.a(s([1,1]),t.o)
B.C=A.a(s([1,1,1]),t.o)
B.ak=A.a(s([1,1,1,1]),t.o)
B.al=A.a(s([2]),t.V)
B.c2=A.a(s(["sheenColorFactor","sheenColorTexture","sheenRoughnessFactor","sheenRoughnessTexture"]),t.i)
B.am=A.a(s([0,0,32776,33792,1,10240,0,0]),t.V)
B.c3=A.a(s(["clearcoatFactor","clearcoatTexture","clearcoatRoughnessFactor","clearcoatRoughnessTexture","clearcoatNormalTexture"]),t.i)
B.l=A.a(s([3]),t.V)
B.an=A.a(s([33071,33648,10497]),t.V)
B.c4=A.a(s([34962,34963]),t.V)
B.c5=A.a(s(["specularFactor","specularTexture","specularColorFactor","specularColorTexture"]),t.i)
B.P=A.a(s([4]),t.V)
B.Y=new A.y("VEC2",5120,!1)
B.aV=new A.y("VEC2",5121,!1)
B.a0=new A.y("VEC2",5122,!1)
B.aW=new A.y("VEC2",5123,!1)
B.c6=A.a(s([B.Y,B.Z,B.aV,B.a0,B.a1,B.aW]),t.p)
B.c7=A.a(s([5121,5123,5125]),t.V)
B.ao=A.a(s(["image/jpeg","image/png"]),t.i)
B.c8=A.a(s(["transmissionFactor","transmissionTexture"]),t.i)
B.c9=A.a(s([9728,9729]),t.V)
B.aP=new A.y("SCALAR",5121,!1)
B.aS=new A.y("SCALAR",5123,!1)
B.aU=new A.y("SCALAR",5125,!1)
B.ap=A.a(s([B.aP,B.aS,B.aU]),t.p)
B.cb=A.a(s(["image/jpeg","image/png","image/webp","image/ktx2"]),t.i)
B.cc=A.a(s(["camera","children","skin","matrix","mesh","rotation","scale","translation","weights","name"]),t.i)
B.cd=A.a(s([9728,9729,9984,9985,9986,9987]),t.V)
B.ce=A.a(s(["COLOR","JOINTS","TEXCOORD","WEIGHTS"]),t.i)
B.D=A.a(s([0,0,65490,45055,65535,34815,65534,18431]),t.V)
B.b=new A.bE(0,"Error")
B.e=new A.bE(1,"Warning")
B.f=new A.bE(2,"Information")
B.aA=new A.bE(3,"Hint")
B.cf=A.a(s([B.b,B.e,B.f,B.aA]),A.aB("D<bE*>"))
B.cg=A.a(s(["color","intensity","spot","type","range","name"]),t.i)
B.ch=A.a(s(["buffer","byteOffset","byteLength","byteStride","target","name"]),t.i)
B.ar=A.a(s([0,0,26624,1023,65534,2047,65534,2047]),t.V)
B.ci=A.a(s(["LINEAR","STEP","CUBICSPLINE"]),t.i)
B.V=A.u("bH")
B.bk=new A.V(A.wG(),!1,!1)
B.dw=new A.Y([B.V,B.bk],t.N)
B.bB=new A.O("EXT_texture_webp",B.dw,A.wH(),!1)
B.T=A.u("ds")
B.U=A.u("an")
B.bl=new A.V(A.wW(),!1,!1)
B.bm=new A.V(A.wY(),!1,!1)
B.du=new A.Y([B.T,B.bl,B.U,B.bm],t.N)
B.bJ=new A.O("KHR_lights_punctual",B.du,null,!1)
B.h=A.u("av")
B.bo=new A.V(A.wZ(),!1,!1)
B.di=new A.Y([B.h,B.bo],t.N)
B.bG=new A.O("KHR_materials_clearcoat",B.di,null,!1)
B.bp=new A.V(A.x_(),!1,!1)
B.dj=new A.Y([B.h,B.bp],t.N)
B.bM=new A.O("KHR_materials_emissive_strength",B.dj,null,!1)
B.bq=new A.V(A.x0(),!1,!1)
B.dk=new A.Y([B.h,B.bq],t.N)
B.bK=new A.O("KHR_materials_ior",B.dk,null,!1)
B.br=new A.V(A.x1(),!1,!1)
B.dl=new A.Y([B.h,B.br],t.N)
B.bF=new A.O("KHR_materials_iridescence",B.dl,null,!1)
B.bx=new A.V(A.x2(),!0,!1)
B.dm=new A.Y([B.h,B.bx],t.N)
B.bD=new A.O("KHR_materials_pbrSpecularGlossiness",B.dm,null,!1)
B.bs=new A.V(A.x3(),!1,!1)
B.dn=new A.Y([B.h,B.bs],t.N)
B.bA=new A.O("KHR_materials_sheen",B.dn,null,!1)
B.bt=new A.V(A.x4(),!1,!1)
B.dp=new A.Y([B.h,B.bt],t.N)
B.bI=new A.O("KHR_materials_specular",B.dp,null,!1)
B.bu=new A.V(A.x5(),!1,!1)
B.dq=new A.Y([B.h,B.bu],t.N)
B.bH=new A.O("KHR_materials_transmission",B.dq,null,!1)
B.by=new A.V(A.x6(),!0,!1)
B.dr=new A.Y([B.h,B.by],t.N)
B.bz=new A.O("KHR_materials_unlit",B.dr,null,!1)
B.aE=A.u("aF")
B.bv=new A.V(A.u8(),!1,!1)
B.bw=new A.V(A.u9(),!1,!0)
B.dt=new A.Y([B.T,B.bv,B.aE,B.bw],t.N)
B.bE=new A.O("KHR_materials_variants",B.dt,null,!1)
B.bn=new A.V(A.x7(),!1,!1)
B.ds=new A.Y([B.h,B.bn],t.N)
B.bL=new A.O("KHR_materials_volume",B.ds,null,!1)
B.cC=A.a(s([]),A.aB("D<bi*>"))
B.dx=new A.as(0,{},B.cC,A.aB("as<bi*,V*>"))
B.bN=new A.O("KHR_mesh_quantization",B.dx,A.x8(),!0)
B.aK=A.u("bh")
B.aG=A.u("cv")
B.aH=A.u("cw")
B.N=new A.V(A.x9(),!1,!1)
B.dv=new A.Y([B.aK,B.N,B.aG,B.N,B.aH,B.N],t.N)
B.bC=new A.O("KHR_texture_transform",B.dv,null,!1)
B.as=A.a(s([B.bB,B.bJ,B.bG,B.bM,B.bK,B.bF,B.bD,B.bA,B.bI,B.bH,B.bz,B.bE,B.bL,B.bN,B.bC]),A.aB("D<O*>"))
B.cj=A.a(s(["OPAQUE","MASK","BLEND"]),t.i)
B.ck=A.a(s(["pbrMetallicRoughness","normalTexture","occlusionTexture","emissiveTexture","emissiveFactor","alphaMode","alphaCutoff","doubleSided","name"]),t.i)
B.cl=A.a(s([5120,5121,5122,5123,5125,5126]),t.V)
B.cm=A.a(s(["inverseBindMatrices","skeleton","joints","name"]),t.i)
B.a4=new A.y("VEC3",5120,!1)
B.a5=new A.y("VEC3",5122,!1)
B.cn=A.a(s([B.a4,B.w,B.a5,B.x]),t.p)
B.co=A.a(s(["data-uri","buffer-view","glb","external"]),t.i)
B.cp=A.a(s(["POINTS","LINES","LINE_LOOP","LINE_STRIP","TRIANGLES","TRIANGLE_STRIP","TRIANGLE_FAN"]),t.i)
B.cq=A.a(s(["bufferView","byteOffset","componentType"]),t.i)
B.Q=A.a(s([B.w,B.x]),t.p)
B.cr=A.a(s(["aspectRatio","yfov","zfar","znear"]),t.i)
B.cs=A.a(s(["copyright","generator","version","minVersion"]),t.i)
B.ct=A.a(s(["bufferView","byteOffset"]),t.i)
B.cu=A.a(s(["bufferView","mimeType","uri","name"]),t.i)
B.cv=A.a(s(["channels","samplers","name"]),t.i)
B.cw=A.a(s(["baseColorFactor","baseColorTexture","metallicFactor","roughnessFactor","metallicRoughnessTexture"]),t.i)
B.cx=A.a(s(["count","indices","values"]),t.i)
B.cy=A.a(s(["diffuseFactor","diffuseTexture","specularFactor","glossinessFactor","specularGlossinessTexture"]),t.i)
B.cz=A.a(s(["directional","point","spot"]),t.i)
B.cA=A.a(s(["emissiveStrength"]),t.i)
B.at=A.a(s([]),t.b)
B.cB=A.a(s([]),t.i)
B.cE=A.a(s(["extensions","extras"]),t.i)
B.cF=A.a(s([0,0,32722,12287,65534,34815,65534,18431]),t.V)
B.cH=A.a(s(["index","texCoord"]),t.i)
B.cI=A.a(s(["index","texCoord","scale"]),t.i)
B.cJ=A.a(s(["index","texCoord","strength"]),t.i)
B.cK=A.a(s(["innerConeAngle","outerConeAngle"]),t.i)
B.cL=A.a(s(["input","interpolation","output"]),t.i)
B.cM=A.a(s(["ior"]),t.i)
B.cN=A.a(s(["attributes","indices","material","mode","targets"]),t.i)
B.cO=A.a(s(["bufferView","byteOffset","componentType","count","type","normalized","max","min","sparse","name"]),t.i)
B.cP=A.a(s(["light"]),t.i)
B.cQ=A.a(s(["lights"]),t.i)
B.cR=A.a(s(["mappings"]),t.i)
B.cS=A.a(s(["name"]),t.i)
B.cT=A.a(s(["node","path"]),t.i)
B.cU=A.a(s(["nodes","name"]),t.i)
B.cV=A.a(s([null,"linear","srgb","custom"]),t.i)
B.cW=A.a(s([null,"srgb","custom"]),t.i)
B.au=A.a(s([0,0,24576,1023,65534,34815,65534,18431]),t.V)
B.cX=A.a(s(["image/webp"]),t.i)
B.cY=A.a(s(["offset","rotation","scale","texCoord"]),t.i)
B.av=A.a(s(["orthographic","perspective"]),t.i)
B.cZ=A.a(s(["primitives","weights","name"]),t.i)
B.d_=A.a(s([0,0,32754,11263,65534,34815,65534,18431]),t.V)
B.d0=A.a(s(["magFilter","minFilter","wrapS","wrapT","name"]),t.i)
B.d1=A.a(s([null,"rgb","rgba","luminance","luminance-alpha"]),t.i)
B.aw=A.a(s([0,0,65490,12287,65535,34815,65534,18431]),t.V)
B.d3=A.a(s(["sampler","source","name"]),t.i)
B.d4=A.a(s(["source"]),t.i)
B.d5=A.a(s(["iridescenceFactor","iridescenceTexture","iridescenceIor","iridescenceThicknessMinimum","iridescenceThicknessMaximum","iridescenceThicknessTexture"]),t.i)
B.aX=new A.y("VEC3",5121,!1)
B.aY=new A.y("VEC3",5123,!1)
B.d6=A.a(s([B.a4,B.w,B.aX,B.H,B.a5,B.x,B.aY,B.I]),t.p)
B.d7=A.a(s(["target","sampler"]),t.i)
B.R=A.a(s(["translation","rotation","scale","weights"]),t.i)
B.d8=A.a(s(["type","orthographic","perspective","name"]),t.i)
B.d9=A.a(s(["uri","byteLength","name"]),t.i)
B.da=A.a(s(["variants"]),t.i)
B.db=A.a(s(["variants","material","name"]),t.i)
B.dc=A.a(s([B.Y,B.a0]),t.p)
B.dd=A.a(s(["attenuationColor","attenuationDistance","thicknessFactor","thicknessTexture"]),t.i)
B.de=A.a(s(["xmag","ymag","zfar","znear"]),t.i)
B.df=A.a(s(["extensionsUsed","extensionsRequired","accessors","animations","asset","buffers","bufferViews","cameras","images","materials","meshes","nodes","samplers","scene","scenes","skins","textures"]),t.i)
B.dg=A.a(s([B.J,B.K]),t.p)
B.aq=A.a(s([B.k]),t.p)
B.c1=A.a(s([B.n,B.y,B.J,B.z,B.K]),t.p)
B.aQ=new A.y("SCALAR",5121,!0)
B.aO=new A.y("SCALAR",5120,!0)
B.aT=new A.y("SCALAR",5123,!0)
B.aR=new A.y("SCALAR",5122,!0)
B.cG=A.a(s([B.G,B.aQ,B.aO,B.aT,B.aR]),t.p)
B.dh=new A.as(4,{translation:B.aq,rotation:B.c1,scale:B.aq,weights:B.cG},B.R,A.aB("as<e*,o<y*>*>"))
B.ca=A.a(s(["SCALAR","VEC2","VEC3","VEC4","MAT2","MAT3","MAT4"]),t.i)
B.m=new A.as(7,{SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},B.ca,A.aB("as<e*,f*>"))
B.ax=new A.Y([5120,"BYTE",5121,"UNSIGNED_BYTE",5122,"SHORT",5123,"UNSIGNED_SHORT",5124,"INT",5125,"UNSIGNED_INT",5126,"FLOAT",35664,"FLOAT_VEC2",35665,"FLOAT_VEC3",35666,"FLOAT_VEC4",35667,"INT_VEC2",35668,"INT_VEC3",35669,"INT_VEC4",35670,"BOOL",35671,"BOOL_VEC2",35672,"BOOL_VEC3",35673,"BOOL_VEC4",35674,"FLOAT_MAT2",35675,"FLOAT_MAT3",35676,"FLOAT_MAT4",35678,"SAMPLER_2D"],A.aB("Y<f*,e*>"))
B.cD=A.a(s([]),A.aB("D<cA*>"))
B.ay=new A.as(0,{},B.cD,A.aB("as<cA*,@>"))
B.d2=A.a(s(["KHR","EXT","ADOBE","AGI","AGT","ALCM","ALI","AMZN","ANIMECH","ASOBO","AVR","BLENDER","CAPTURE","CESIUM","CITRUS","CLO","CVTOOLS","EMBARK","EPIC","F8","FB","FOXIT","GOOGLE","GRIFFEL","INTEL","KDAB","LLQ","MAXAR","MESHOPT","MOZ","MPEG","MSFT","MTTR","MX","NEEDLE","NV","OFT","OMI","OTOY","OWLII","PANDA3D","POLUTROPON","PTC","S8S","SE","SEIN","SHAPEDIVER","SI","SKFB","SKYLINE","SNAP","SPECTRUM","TENCENT","TRYON","USSF","UX3D","VRMC","WEB3D"]),t.i)
B.dy=new A.as(58,{KHR:null,EXT:null,ADOBE:null,AGI:null,AGT:null,ALCM:null,ALI:null,AMZN:null,ANIMECH:null,ASOBO:null,AVR:null,BLENDER:null,CAPTURE:null,CESIUM:null,CITRUS:null,CLO:null,CVTOOLS:null,EMBARK:null,EPIC:null,F8:null,FB:null,FOXIT:null,GOOGLE:null,GRIFFEL:null,INTEL:null,KDAB:null,LLQ:null,MAXAR:null,MESHOPT:null,MOZ:null,MPEG:null,MSFT:null,MTTR:null,MX:null,NEEDLE:null,NV:null,OFT:null,OMI:null,OTOY:null,OWLII:null,PANDA3D:null,POLUTROPON:null,PTC:null,S8S:null,SE:null,SEIN:null,SHAPEDIVER:null,SI:null,SKFB:null,SKYLINE:null,SNAP:null,SPECTRUM:null,TENCENT:null,TRYON:null,USSF:null,UX3D:null,VRMC:null,WEB3D:null},B.d2,A.aB("as<e*,k>"))
B.dz=new A.ei(B.dy,A.aB("ei<e*>"))
B.dA=new A.d_("call")
B.dB=A.u("bY")
B.dC=A.u("bZ")
B.dD=A.u("bX")
B.S=A.u("a4<L>")
B.dE=A.u("c0")
B.dF=A.u("b2")
B.dG=A.u("b3")
B.aB=A.u("bt")
B.dH=A.u("bu")
B.aC=A.u("bv")
B.dI=A.u("aS")
B.dJ=A.u("c2")
B.dK=A.u("c3")
B.dL=A.u("bw")
B.dM=A.u("cj")
B.dN=A.u("c8")
B.aD=A.u("aT")
B.dO=A.u("bz")
B.dP=A.u("cd")
B.dQ=A.u("ba")
B.dR=A.u("ce")
B.dS=A.u("cf")
B.dT=A.u("cg")
B.dU=A.u("ch")
B.dV=A.u("ci")
B.dW=A.u("ck")
B.dX=A.u("cl")
B.dY=A.u("cm")
B.dZ=A.u("cn")
B.e_=A.u("bA")
B.e0=A.u("bb")
B.e1=A.u("aK")
B.e2=A.u("cp")
B.e3=A.u("cq")
B.aF=A.u("aU")
B.e4=A.u("c")
B.e5=A.u("cx")
B.e6=A.u("bC")
B.aI=A.u("bD")
B.aJ=A.u("bF")
B.e7=A.u("co")
B.e8=new A.lt(!1)
B.r=new A.dR(0,"Unknown")
B.t=new A.dR(1,"sRGB")
B.E=new A.dR(2,"Custom")
B.u=new A.d1(0,"Unknown")
B.e9=new A.d1(1,"Linear")
B.v=new A.d1(2,"sRGB")
B.F=new A.d1(3,"Custom")
B.ea=new A.d3(null,2)
B.aL=new A.d6(0,"DataUri")
B.aM=new A.d6(1,"BufferView")
B.eb=new A.d6(2,"GLB")
B.aN=new A.d6(3,"External")})();(function staticFields(){$.m8=null
$.oI=null
$.om=null
$.ol=null
$.pK=null
$.pB=null
$.pR=null
$.mI=null
$.mT=null
$.nH=null
$.dd=null
$.es=null
$.et=null
$.nB=!1
$.A=B.i
$.cE=A.a([],A.aB("D<c>"))
$.oD=null
$.oB=null
$.oC=null})();(function lazyInitializers(){var s=hunkHelpers.lazyFinal,r=hunkHelpers.lazy,q=hunkHelpers.lazyOld
s($,"xv","nM",()=>A.wN("_$dart_dartClosure"))
s($,"AL","tg",()=>B.i.cV(new A.n6()))
s($,"A8","rY",()=>A.bj(A.lm({
toString:function(){return"$receiver$"}})))
s($,"A9","rZ",()=>A.bj(A.lm({$method$:null,
toString:function(){return"$receiver$"}})))
s($,"Aa","t_",()=>A.bj(A.lm(null)))
s($,"Ab","t0",()=>A.bj(function(){var $argumentsExpr$="$arguments$"
try{null.$method$($argumentsExpr$)}catch(p){return p.message}}()))
s($,"Ae","t3",()=>A.bj(A.lm(void 0)))
s($,"Af","t4",()=>A.bj(function(){var $argumentsExpr$="$arguments$"
try{(void 0).$method$($argumentsExpr$)}catch(p){return p.message}}()))
s($,"Ad","t2",()=>A.bj(A.oW(null)))
s($,"Ac","t1",()=>A.bj(function(){try{null.$method$}catch(p){return p.message}}()))
s($,"Ah","t6",()=>A.bj(A.oW(void 0)))
s($,"Ag","t5",()=>A.bj(function(){try{(void 0).$method$}catch(p){return p.message}}()))
s($,"Ak","o9",()=>A.uZ())
s($,"y2","fZ",()=>t.U.a($.tg()))
s($,"Ai","t7",()=>new A.lv().$0())
s($,"Aj","t8",()=>new A.lu().$0())
s($,"Am","oa",()=>A.uA(A.vO(A.a([-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-1,-2,-2,-2,-2,-2,62,-2,62,-2,63,52,53,54,55,56,57,58,59,60,61,-2,-2,-2,-1,-2,-2,-2,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-2,-2,-2,-2,63,-2,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,-2,-2,-2,-2,-2],t.Z))))
r($,"Al","t9",()=>A.uB(0))
s($,"AE","ta",()=>A.fX(B.e4))
s($,"AI","te",()=>A.vM())
q($,"xt","bp",()=>A.oQ("^([0-9]+)\\.([0-9]+)$"))
q($,"xu","pX",()=>A.oQ("^([A-Z0-9]+)_[A-Za-z0-9_]+$"))
q($,"xS","qe",()=>A.F("BUFFER_BYTE_LENGTH_MISMATCH",new A.hK(),B.b))
q($,"xT","qf",()=>A.F("BUFFER_GLB_CHUNK_TOO_BIG",new A.hL(),B.e))
q($,"xL","nQ",()=>A.F("ACCESSOR_MIN_MISMATCH",new A.hD(),B.b))
q($,"xK","nP",()=>A.F("ACCESSOR_MAX_MISMATCH",new A.hC(),B.b))
q($,"xA","nO",()=>A.F("ACCESSOR_ELEMENT_OUT_OF_MIN_BOUND",new A.hs(),B.b))
q($,"xz","nN",()=>A.F("ACCESSOR_ELEMENT_OUT_OF_MAX_BOUND",new A.hr(),B.b))
q($,"xP","nR",()=>A.F("ACCESSOR_VECTOR3_NON_UNIT",new A.hH(),B.b))
q($,"xG","q5",()=>A.F("ACCESSOR_INVALID_SIGN",new A.hy(),B.b))
q($,"xy","q_",()=>A.F("ACCESSOR_ANIMATION_SAMPLER_OUTPUT_NON_NORMALIZED_QUATERNION",new A.hq(),B.b))
q($,"xM","q9",()=>A.F("ACCESSOR_NON_CLAMPED",new A.hE(),B.b))
q($,"xE","q3",()=>A.F("ACCESSOR_INVALID_FLOAT",new A.hw(),B.b))
q($,"xB","q0",()=>A.F("ACCESSOR_INDEX_OOB",new A.ht(),B.b))
q($,"xD","q2",()=>A.F("ACCESSOR_INDEX_TRIANGLE_DEGENERATE",new A.hv(),B.f))
q($,"xC","q1",()=>A.F("ACCESSOR_INDEX_PRIMITIVE_RESTART",new A.hu(),B.b))
q($,"xw","pY",()=>A.F("ACCESSOR_ANIMATION_INPUT_NEGATIVE",new A.ho(),B.b))
q($,"xx","pZ",()=>A.F("ACCESSOR_ANIMATION_INPUT_NON_INCREASING",new A.hp(),B.b))
q($,"xO","qb",()=>A.F("ACCESSOR_SPARSE_INDICES_NON_INCREASING",new A.hG(),B.b))
q($,"xN","qa",()=>A.F("ACCESSOR_SPARSE_INDEX_OOB",new A.hF(),B.b))
q($,"xF","q4",()=>A.F("ACCESSOR_INVALID_IBM",new A.hx(),B.b))
q($,"xV","qg",()=>A.F("IMAGE_DATA_INVALID",new A.hN(),B.b))
q($,"xX","qi",()=>A.F("IMAGE_MIME_TYPE_INVALID",new A.hP(),B.b))
q($,"y_","ql",()=>A.F("IMAGE_UNEXPECTED_EOS",new A.hS(),B.b))
q($,"y0","qm",()=>A.F("IMAGE_UNRECOGNIZED_FORMAT",new A.hT(),B.e))
q($,"xY","qj",()=>A.F("IMAGE_NON_ENABLED_MIME_TYPE",new A.hQ(),B.b))
q($,"xZ","qk",()=>A.F("IMAGE_NPOT_DIMENSIONS",new A.hR(),B.f))
q($,"xW","qh",()=>A.F("IMAGE_FEATURES_UNSUPPORTED",new A.hO(),B.e))
q($,"y1","nT",()=>A.F("URI_GLB",new A.hU(),B.f))
q($,"xU","nS",()=>A.F("DATA_URI_GLB",new A.hM(),B.e))
q($,"xI","q7",()=>A.F("ACCESSOR_JOINTS_INDEX_OOB",new A.hA(),B.b))
q($,"xH","q6",()=>A.F("ACCESSOR_JOINTS_INDEX_DUPLICATE",new A.hz(),B.b))
q($,"xQ","qc",()=>A.F("ACCESSOR_WEIGHTS_NEGATIVE",new A.hI(),B.b))
q($,"xR","qd",()=>A.F("ACCESSOR_WEIGHTS_NON_NORMALIZED",new A.hJ(),B.b))
q($,"xJ","q8",()=>A.F("ACCESSOR_JOINTS_USED_ZERO_WEIGHT",new A.hB(),B.e))
q($,"yj","na",()=>new A.iE(B.b,"IO_ERROR",new A.iF()))
q($,"z6","o2",()=>A.al("ARRAY_LENGTH_NOT_IN_LIST",new A.kc(),B.b))
q($,"z7","ez",()=>A.al("ARRAY_TYPE_MISMATCH",new A.kd(),B.b))
q($,"z5","o1",()=>A.al("DUPLICATE_ELEMENTS",new A.kb(),B.b))
q($,"z9","h0",()=>A.al("INVALID_INDEX",new A.kf(),B.b))
q($,"za","h1",()=>A.al("INVALID_JSON",new A.kg(),B.b))
q($,"zb","o3",()=>A.al("INVALID_URI",new A.kh(),B.b))
q($,"z8","bV",()=>A.al("EMPTY_ENTITY",new A.ke(),B.b))
q($,"zc","o4",()=>A.al("ONE_OF_MISMATCH",new A.ki(),B.b))
q($,"zd","re",()=>A.al("PATTERN_MISMATCH",new A.kj(),B.b))
q($,"ze","a2",()=>A.al("TYPE_MISMATCH",new A.kk(),B.b))
q($,"zj","rh",()=>A.al("VALUE_NOT_IN_LIST",new A.kp(),B.e))
q($,"zk","nb",()=>A.al("VALUE_NOT_IN_RANGE",new A.kq(),B.b))
q($,"zi","rg",()=>A.al("VALUE_MULTIPLE_OF",new A.ko(),B.b))
q($,"zf","bq",()=>A.al("UNDEFINED_PROPERTY",new A.kl(),B.b))
q($,"zg","rf",()=>A.al("UNEXPECTED_PROPERTY",new A.km(),B.e))
q($,"zh","cJ",()=>A.al("UNSATISFIED_DEPENDENCY",new A.kn(),B.b))
q($,"A3","rU",()=>A.r("UNKNOWN_ASSET_MAJOR_VERSION",new A.la(),B.b))
q($,"A4","rV",()=>A.r("UNKNOWN_ASSET_MINOR_VERSION",new A.lb(),B.e))
q($,"zP","rG",()=>A.r("ASSET_MIN_VERSION_GREATER_THAN_VERSION",new A.kW(),B.b))
q($,"zz","rr",()=>A.r("INVALID_GL_VALUE",new A.kG(),B.b))
q($,"zm","rj",()=>A.r("ACCESSOR_NORMALIZED_INVALID",new A.kt(),B.b))
q($,"zn","rk",()=>A.r("ACCESSOR_OFFSET_ALIGNMENT",new A.ku(),B.b))
q($,"zl","ri",()=>A.r("ACCESSOR_MATRIX_ALIGNMENT",new A.ks(),B.b))
q($,"zo","rl",()=>A.r("ACCESSOR_SPARSE_COUNT_OUT_OF_RANGE",new A.kv(),B.b))
q($,"zp","rm",()=>A.r("ANIMATION_CHANNEL_TARGET_NODE_SKIN",new A.kw(),B.e))
q($,"zq","rn",()=>A.r("BUFFER_DATA_URI_MIME_TYPE_INVALID",new A.kx(),B.b))
q($,"zs","ro",()=>A.r("BUFFER_VIEW_TOO_BIG_BYTE_STRIDE",new A.kz(),B.b))
q($,"zr","nc",()=>A.r("BUFFER_VIEW_INVALID_BYTE_STRIDE",new A.ky(),B.b))
q($,"zt","o5",()=>A.r("CAMERA_XMAG_YMAG_NEGATIVE",new A.kA(),B.e))
q($,"zu","o6",()=>A.r("CAMERA_XMAG_YMAG_ZERO",new A.kB(),B.b))
q($,"zv","rp",()=>A.r("CAMERA_YFOV_GEQUAL_PI",new A.kC(),B.e))
q($,"zw","o7",()=>A.r("CAMERA_ZFAR_LEQUAL_ZNEAR",new A.kD(),B.b))
q($,"zH","rz",()=>A.r("MATERIAL_ALPHA_CUTOFF_INVALID_MODE",new A.kO(),B.e))
q($,"zK","nd",()=>A.r("MESH_PRIMITIVE_INVALID_ATTRIBUTE",new A.kR(),B.b))
q($,"zO","rF",()=>A.r("MESH_PRIMITIVES_UNEQUAL_TARGETS_COUNT",new A.kV(),B.b))
q($,"zM","rD",()=>A.r("MESH_PRIMITIVE_NO_POSITION",new A.kT(),B.e))
q($,"zJ","rB",()=>A.r("MESH_PRIMITIVE_INDEXED_SEMANTIC_CONTINUITY",new A.kQ(),B.b))
q($,"zN","rE",()=>A.r("MESH_PRIMITIVE_TANGENT_WITHOUT_NORMAL",new A.kU(),B.e))
q($,"zL","rC",()=>A.r("MESH_PRIMITIVE_JOINTS_WEIGHTS_MISMATCH",new A.kS(),B.b))
q($,"zI","rA",()=>A.r("MESH_INVALID_WEIGHTS_COUNT",new A.kP(),B.b))
q($,"zT","rK",()=>A.r("NODE_MATRIX_TRS",new A.l_(),B.b))
q($,"zR","rI",()=>A.r("NODE_MATRIX_DEFAULT",new A.kY(),B.f))
q($,"zU","rL",()=>A.r("NODE_MATRIX_NON_TRS",new A.l0(),B.b))
q($,"A0","rR",()=>A.r("ROTATION_NON_UNIT",new A.l7(),B.b))
q($,"A6","rX",()=>A.r("UNUSED_EXTENSION_REQUIRED",new A.ld(),B.b))
q($,"A_","rQ",()=>A.r("NON_REQUIRED_EXTENSION",new A.l6(),B.b))
q($,"A5","rW",()=>A.r("UNRESERVED_EXTENSION_PREFIX",new A.lc(),B.e))
q($,"zy","rq",()=>A.r("INVALID_EXTENSION_NAME_FORMAT",new A.kF(),B.e))
q($,"zS","rJ",()=>A.r("NODE_EMPTY",new A.kZ(),B.f))
q($,"zX","rO",()=>A.r("NODE_SKINNED_MESH_NON_ROOT",new A.l3(),B.e))
q($,"zW","rN",()=>A.r("NODE_SKINNED_MESH_LOCAL_TRANSFORMS",new A.l2(),B.e))
q($,"zV","rM",()=>A.r("NODE_SKIN_NO_SCENE",new A.l1(),B.b))
q($,"A1","rS",()=>A.r("SKIN_NO_COMMON_ROOT",new A.l8(),B.b))
q($,"A2","rT",()=>A.r("SKIN_SKELETON_INVALID",new A.l9(),B.b))
q($,"zZ","rP",()=>A.r("NON_RELATIVE_URI",new A.l5(),B.e))
q($,"zQ","rH",()=>A.r("MULTIPLE_EXTENSIONS",new A.kX(),B.e))
q($,"zY","di",()=>A.r("NON_OBJECT_EXTRAS",new A.l4(),B.f))
q($,"zx","o8",()=>A.r("EXTRA_PROPERTY",new A.kE(),B.f))
q($,"zA","rs",()=>A.r("KHR_LIGHTS_PUNCTUAL_LIGHT_SPOT_ANGLES",new A.kH(),B.b))
q($,"zB","rt",()=>A.r("KHR_MATERIALS_EMISSIVE_STRENGTH_ZERO_FACTOR",new A.kI(),B.e))
q($,"zG","ry",()=>A.r("KHR_MATERIALS_VOLUME_NO_TRANSMISSION",new A.kN(),B.e))
q($,"zF","rx",()=>A.r("KHR_MATERIALS_VOLUME_DOUBLE_SIDED",new A.kM(),B.e))
q($,"zD","rv",()=>A.r("KHR_MATERIALS_IRIDESCENCE_THICKNESS_RANGE_WITHOUT_TEXTURE",new A.kK(),B.f))
q($,"zC","ru",()=>A.r("KHR_MATERIALS_IRIDESCENCE_THICKNESS_RANGE_INVALID",new A.kJ(),B.b))
q($,"zE","rw",()=>A.r("KHR_MATERIALS_IRIDESCENCE_THICKNESS_TEXTURE_UNUSED",new A.kL(),B.f))
q($,"ym","qE",()=>A.v("ACCESSOR_TOTAL_OFFSET_ALIGNMENT",new A.j_(),B.b))
q($,"yk","qD",()=>A.v("ACCESSOR_SMALL_BYTESTRIDE",new A.iY(),B.b))
q($,"yl","nU",()=>A.v("ACCESSOR_TOO_LONG",new A.iZ(),B.b))
q($,"yn","qF",()=>A.v("ACCESSOR_USAGE_OVERRIDE",new A.j0(),B.b))
q($,"yq","qI",()=>A.v("ANIMATION_DUPLICATE_TARGETS",new A.j3(),B.b))
q($,"yo","qG",()=>A.v("ANIMATION_CHANNEL_TARGET_NODE_MATRIX",new A.j1(),B.b))
q($,"yp","qH",()=>A.v("ANIMATION_CHANNEL_TARGET_NODE_WEIGHTS_NO_MORPHS",new A.j2(),B.b))
q($,"yu","qL",()=>A.v("ANIMATION_SAMPLER_INPUT_ACCESSOR_WITHOUT_BOUNDS",new A.j7(),B.b))
q($,"ys","qJ",()=>A.v("ANIMATION_SAMPLER_INPUT_ACCESSOR_INVALID_FORMAT",new A.j5(),B.b))
q($,"yw","qN",()=>A.v("ANIMATION_SAMPLER_OUTPUT_ACCESSOR_INVALID_FORMAT",new A.j9(),B.b))
q($,"yt","qK",()=>A.v("ANIMATION_SAMPLER_INPUT_ACCESSOR_TOO_FEW_ELEMENTS",new A.j6(),B.b))
q($,"yv","qM",()=>A.v("ANIMATION_SAMPLER_OUTPUT_ACCESSOR_INVALID_COUNT",new A.j8(),B.b))
q($,"yr","nV",()=>A.v("ANIMATION_SAMPLER_ACCESSOR_WITH_BYTESTRIDE",new A.j4(),B.b))
q($,"yx","qO",()=>A.v("BUFFER_MISSING_GLB_DATA",new A.ja(),B.b))
q($,"yA","nW",()=>A.v("BUFFER_VIEW_TOO_LONG",new A.jd(),B.b))
q($,"yz","qQ",()=>A.v("BUFFER_VIEW_TARGET_OVERRIDE",new A.jc(),B.b))
q($,"yy","qP",()=>A.v("BUFFER_VIEW_TARGET_MISSING",new A.jb(),B.aA))
q($,"yB","qR",()=>A.v("IMAGE_BUFFER_VIEW_WITH_BYTESTRIDE",new A.je(),B.b))
q($,"yC","qS",()=>A.v("INVALID_IBM_ACCESSOR_COUNT",new A.jf(),B.b))
q($,"yG","nY",()=>A.v("MESH_PRIMITIVE_ATTRIBUTES_ACCESSOR_INVALID_FORMAT",new A.jj(),B.b))
q($,"yH","qV",()=>A.v("MESH_PRIMITIVE_ATTRIBUTES_ACCESSOR_UNSIGNED_INT",new A.jk(),B.b))
q($,"yN","nZ",()=>A.v("MESH_PRIMITIVE_POSITION_ACCESSOR_WITHOUT_BOUNDS",new A.jq(),B.b))
q($,"yF","qU",()=>A.v("MESH_PRIMITIVE_ACCESSOR_WITHOUT_BYTESTRIDE",new A.ji(),B.b))
q($,"yE","nX",()=>A.v("MESH_PRIMITIVE_ACCESSOR_UNALIGNED",new A.jh(),B.b))
q($,"yK","qY",()=>A.v("MESH_PRIMITIVE_INDICES_ACCESSOR_WITH_BYTESTRIDE",new A.jn(),B.b))
q($,"yJ","qX",()=>A.v("MESH_PRIMITIVE_INDICES_ACCESSOR_INVALID_FORMAT",new A.jm(),B.b))
q($,"yI","qW",()=>A.v("MESH_PRIMITIVE_INCOMPATIBLE_MODE",new A.jl(),B.e))
q($,"yO","o_",()=>A.v("MESH_PRIMITIVE_TOO_FEW_TEXCOORDS",new A.jr(),B.b))
q($,"yP","r0",()=>A.v("MESH_PRIMITIVE_UNEQUAL_ACCESSOR_COUNT",new A.js(),B.b))
q($,"yM","r_",()=>A.v("MESH_PRIMITIVE_MORPH_TARGET_NO_BASE_ACCESSOR",new A.jp(),B.b))
q($,"yL","qZ",()=>A.v("MESH_PRIMITIVE_MORPH_TARGET_INVALID_ATTRIBUTE_COUNT",new A.jo(),B.b))
q($,"yQ","r1",()=>A.v("NODE_LOOP",new A.jt(),B.b))
q($,"yR","r2",()=>A.v("NODE_PARENT_OVERRIDE",new A.ju(),B.b))
q($,"yU","r5",()=>A.v("NODE_WEIGHTS_INVALID",new A.jx(),B.b))
q($,"yS","r3",()=>A.v("NODE_SKIN_WITH_NON_SKINNED_MESH",new A.jv(),B.b))
q($,"yT","r4",()=>A.v("NODE_SKINNED_MESH_WITHOUT_SKIN",new A.jw(),B.e))
q($,"yV","r6",()=>A.v("SCENE_NON_ROOT_NODE",new A.jy(),B.b))
q($,"yX","r8",()=>A.v("SKIN_IBM_INVALID_FORMAT",new A.jA(),B.b))
q($,"yW","r7",()=>A.v("SKIN_IBM_ACCESSOR_WITH_BYTESTRIDE",new A.jz(),B.b))
q($,"yY","o0",()=>A.v("TEXTURE_INVALID_IMAGE_MIME_TYPE",new A.jB(),B.b))
q($,"yZ","r9",()=>A.v("UNDECLARED_EXTENSION",new A.jC(),B.b))
q($,"z_","ra",()=>A.v("UNEXPECTED_EXTENSION_OBJECT",new A.jD(),B.b))
q($,"z0","N",()=>A.v("UNRESOLVED_REFERENCE",new A.jE(),B.b))
q($,"z1","rb",()=>A.v("UNSUPPORTED_EXTENSION",new A.jF(),B.f))
q($,"z4","h_",()=>A.v("UNUSED_OBJECT",new A.jI(),B.f))
q($,"z3","rd",()=>A.v("UNUSED_MESH_WEIGHTS",new A.jH(),B.f))
q($,"z2","rc",()=>A.v("UNUSED_MESH_TANGENT",new A.jG(),B.f))
q($,"yD","qT",()=>A.v("KHR_MATERIALS_VARIANTS_NON_UNIQUE_VARIANT",new A.jg(),B.b))
q($,"y9","qt",()=>A.ak("GLB_INVALID_MAGIC",new A.i4(),B.b))
q($,"ya","qu",()=>A.ak("GLB_INVALID_VERSION",new A.i5(),B.b))
q($,"yc","qw",()=>A.ak("GLB_LENGTH_TOO_SMALL",new A.i7(),B.b))
q($,"y3","qn",()=>A.ak("GLB_CHUNK_LENGTH_UNALIGNED",new A.hZ(),B.b))
q($,"yb","qv",()=>A.ak("GLB_LENGTH_MISMATCH",new A.i6(),B.b))
q($,"y4","qo",()=>A.ak("GLB_CHUNK_TOO_BIG",new A.i_(),B.b))
q($,"y7","qr",()=>A.ak("GLB_EMPTY_CHUNK",new A.i2(),B.b))
q($,"y6","qq",()=>A.ak("GLB_EMPTY_BIN_CHUNK",new A.i1(),B.f))
q($,"y5","qp",()=>A.ak("GLB_DUPLICATE_CHUNK",new A.i0(),B.b))
q($,"yf","qz",()=>A.ak("GLB_UNEXPECTED_END_OF_CHUNK_HEADER",new A.ia(),B.b))
q($,"ye","qy",()=>A.ak("GLB_UNEXPECTED_END_OF_CHUNK_DATA",new A.i9(),B.b))
q($,"yg","qA",()=>A.ak("GLB_UNEXPECTED_END_OF_HEADER",new A.ib(),B.b))
q($,"yh","qB",()=>A.ak("GLB_UNEXPECTED_FIRST_CHUNK",new A.ic(),B.b))
q($,"yd","qx",()=>A.ak("GLB_UNEXPECTED_BIN_CHUNK",new A.i8(),B.b))
q($,"yi","qC",()=>A.ak("GLB_UNKNOWN_CHUNK_TYPE",new A.id(),B.e))
q($,"y8","qs",()=>A.ak("GLB_EXTRA_DATA",new A.i3(),B.e))
q($,"AC","ob",()=>A.uz(1))
q($,"AF","tb",()=>A.uv())
q($,"AJ","tf",()=>A.p2())
q($,"AG","tc",()=>{var p=A.uM()
p.a[3]=1
return p})
q($,"AH","td",()=>A.p2())})();(function nativeSupport(){!function(){var s=function(a){var m={}
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
hunkHelpers.setOrUpdateInterceptorsByTag({ArrayBuffer:J.cR,DataView:A.dD,ArrayBufferView:A.dD,Float32Array:A.f4,Float64Array:A.f5,Int16Array:A.f6,Int32Array:A.f7,Int8Array:A.f8,Uint16Array:A.f9,Uint32Array:A.fa,Uint8ClampedArray:A.dE,CanvasPixelArray:A.dE,Uint8Array:A.cu})
hunkHelpers.setOrUpdateLeafTags({ArrayBuffer:true,DataView:true,ArrayBufferView:false,Float32Array:true,Float64Array:true,Int16Array:true,Int32Array:true,Int8Array:true,Uint16Array:true,Uint32Array:true,Uint8ClampedArray:true,CanvasPixelArray:true,Uint8Array:false})
A.cW.$nativeSuperclassTag="ArrayBufferView"
A.e4.$nativeSuperclassTag="ArrayBufferView"
A.e5.$nativeSuperclassTag="ArrayBufferView"
A.dC.$nativeSuperclassTag="ArrayBufferView"
A.e6.$nativeSuperclassTag="ArrayBufferView"
A.e7.$nativeSuperclassTag="ArrayBufferView"
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
var s=A.xb
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
