using System;
using System.Runtime.InteropServices;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;

namespace FreeImageAPI
{
	/// <summary>
	/// Represents unmanaged memory, containing an array of a given structure.
	/// </summary>
	/// <typeparam name="T">Structuretype represented by the instance.</typeparam>
	/// <remarks>
	/// <see cref="System.Boolean"/> and <see cref="System.Char"/> can not be marshalled.
	/// <para/>
	/// Use <see cref="System.Int32"/> instead of <see cref="System.Boolean"/> and
	/// <see cref="System.Byte"/> instead of <see cref="System.Char"/>.
	/// </remarks>
	public unsafe class MemoryArray<T> : IDisposable, ICloneable, ICollection, IEnumerable<T>, IEquatable<MemoryArray<T>> where T : struct
	{
		/// <summary>
		/// Baseaddress of the wrapped memory.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected byte* baseAddress;

		/// <summary>
		/// Number of elements being wrapped.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected int length;

		/// <summary>
		/// Size, in bytes, of each element.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private static readonly int size;

		/// <summary>
		/// Array of <b>T</b> containing a single element.
		/// The array is used as a workaround, because there are no pointer for generic types.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected T[] buffer;

		/// <summary>
		/// Pointer to the element of <b>buffer</b>.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected byte* ptr;

		/// <summary>
		/// Handle for pinning <b>buffer</b>.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected GCHandle handle;

		/// <summary>
		/// Indicates whether the wrapped memory is handled like a bitfield.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected readonly bool isOneBit;

		/// <summary>
		/// Indicates whther the wrapped memory is handles like 4-bit blocks.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected readonly bool isFourBit;

		/// <summary>
		/// An object that can be used to synchronize access to the <see cref="MemoryArray&lt;T&gt;"/>.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected object syncRoot = null;

		static MemoryArray()
		{
			T[] dummy = new T[2];
			long marshalledSize = Marshal.SizeOf(typeof(T));
			long structureSize =
				Marshal.UnsafeAddrOfPinnedArrayElement(dummy, 1).ToInt64() -
				Marshal.UnsafeAddrOfPinnedArrayElement(dummy, 0).ToInt64();
			if (marshalledSize != structureSize)
			{
				throw new NotSupportedException(
					"The desired type can not be handled, " +
					"because its managed and unmanaged size in bytes are different.");
			}

			size = (int)marshalledSize;
		}

		/// <summary>
		/// Initializes a new instance.
		/// </summary>
		protected MemoryArray()
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="MemoryArray&lt;T&gt;"/> class. 
		/// </summary>
		/// <param name="baseAddress">Address of the memory block.</param>
		/// <param name="length">Length of the array.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="baseAddress"/> is null.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="length"/> is less or equal zero.</exception>
		/// <exception cref="NotSupportedException">
		/// The type is not supported.</exception>
		public MemoryArray(IntPtr baseAddress, int length)
			: this(baseAddress.ToPointer(), length)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="MemoryArray&lt;T&gt;"/> class. 
		/// </summary>
		/// <param name="baseAddress">Address of the memory block.</param>
		/// <param name="length">Length of the array.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="baseAddress"/> is null.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="length"/> is less or equal zero.</exception>
		/// <exception cref="NotSupportedException">
		/// The type is not supported.</exception>
		public MemoryArray(void* baseAddress, int length)
		{
			if (typeof(T) == typeof(FI1BIT))
			{
				isOneBit = true;
			}
			else if (typeof(T) == typeof(FI4BIT))
			{
				isFourBit = true;
			}

			if (baseAddress == null)
			{
				throw new ArgumentNullException("baseAddress");
			}
			if (length < 1)
			{
				throw new ArgumentOutOfRangeException("length");
			}

			this.baseAddress = (byte*)baseAddress;
			this.length = (int)length;

			if (!isOneBit && !isFourBit)
			{
				// Create an array containing a single element.
				// Due to the fact, that it's not possible to create pointers
				// of generic types, an array is used to obtain the memory
				// address of an element of T.
				this.buffer = new T[1];
				// The array is pinned immediately to prevent the GC from
				// moving it to a different position in memory.
				this.handle = GCHandle.Alloc(buffer, GCHandleType.Pinned);
				// The array and its content have beed pinned, so that its address
				// can be safely requested and stored for the whole lifetime
				// of the instace.
				this.ptr = (byte*)handle.AddrOfPinnedObject();
			}
		}

		/// <summary>
		/// Frees the allocated <see cref="System.Runtime.InteropServices.GCHandle"/>.
		/// </summary>
		~MemoryArray()
		{
			Dispose(false);
		}

		/// <summary>
		/// Tests whether two specified <see cref="MemoryArray&lt;T&gt;"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="MemoryArray&lt;T&gt;"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="MemoryArray&lt;T&gt;"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="MemoryArray&lt;T&gt;"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(MemoryArray<T> left, MemoryArray<T> right)
		{
			if (object.ReferenceEquals(left, right))
			{
				return true;
			}
			if (object.ReferenceEquals(right, null) ||
				object.ReferenceEquals(left, null) ||
				(left.length != right.length))
			{
				return false;
			}
			if (left.baseAddress == right.baseAddress)
			{
				return true;
			}
			return FreeImage.CompareMemory(left.baseAddress, right.baseAddress, (uint)left.length);
		}

		/// <summary>
		/// Tests whether two specified <see cref="MemoryArray&lt;T&gt;"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="MemoryArray&lt;T&gt;"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="MemoryArray&lt;T&gt;"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="MemoryArray&lt;T&gt;"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(MemoryArray<T> left, MemoryArray<T> right)
		{
			return (!(left == right));
		}

		/// <summary>
		/// Gets the value at the specified position.
		/// </summary>
		/// <param name="index">A 32-bit integer that represents the position
		/// of the array element to get.</param>
		/// <returns>The value at the specified position.</returns>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="index"/> is outside the range of valid indexes
		/// for the unmanaged array.</exception>
		public T GetValue(int index)
		{
			if ((index >= this.length) || (index < 0))
			{
				throw new ArgumentOutOfRangeException("index");
			}

			return GetValueInternal(index);
		}

		private T GetValueInternal(int index)
		{
			EnsureNotDisposed();
			if (isOneBit)
			{
				return (T)(object)(FI1BIT)(((baseAddress[index / 8] & ((1 << (7 - (index % 8))))) == 0) ? 0 : 1);
			}
			else if (isFourBit)
			{
				return (T)(object)(FI4BIT)(((index % 2) == 0) ? (baseAddress[index / 2] >> 4) : (baseAddress[index / 2] & 0x0F));
			}
			else
			{
				CopyMemory(ptr, baseAddress + (index * size), size);
				return buffer[0];
			}
		}

		/// <summary>
		/// Sets a value to the element at the specified position.
		/// </summary>
		/// <param name="value">The new value for the specified element.</param>
		/// <param name="index">A 32-bit integer that represents the
		/// position of the array element to set.</param>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="index"/> is outside the range of valid indexes
		/// for the unmanaged array.</exception>
		public void SetValue(T value, int index)
		{
			if ((index >= this.length) || (index < 0))
			{
				throw new ArgumentOutOfRangeException("index");
			}
			SetValueInternal(value, index);
		}

		private void SetValueInternal(T value, int index)
		{
			EnsureNotDisposed();
			if (isOneBit)
			{
				if ((FI1BIT)(object)value != 0)
				{
					baseAddress[index / 8] |= (byte)(1 << (7 - (index % 8)));
				}
				else
				{
					baseAddress[index / 8] &= (byte)(~(1 << (7 - (index % 8))));
				}
			}
			else if (isFourBit)
			{
				if ((index % 2) == 0)
				{
					baseAddress[index / 2] = (byte)((baseAddress[index / 2] & 0x0F) | ((FI4BIT)(object)value << 4));
				}
				else
				{
					baseAddress[index / 2] = (byte)((baseAddress[index / 2] & 0xF0) | ((FI4BIT)(object)value & 0x0F));
				}
			}
			else
			{
				buffer[0] = value;
				CopyMemory(baseAddress + (index * size), ptr, size);
			}
		}

		/// <summary>
		/// Gets the values at the specified position and length.
		/// </summary>
		/// <param name="index">A 32-bit integer that represents the position
		/// of the array elements to get.</param>
		/// <param name="length"> A 32-bit integer that represents the length
		/// of the array elements to get.</param>
		/// <returns>The values at the specified position and length.</returns>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="index"/> is outside the range of valid indexes
		/// for the unmanaged array or <paramref name="length"/> is greater than the number of elements
		/// from <paramref name="index"/> to the end of the unmanaged array.</exception>
		public T[] GetValues(int index, int length)
		{
			EnsureNotDisposed();
			if ((index >= this.length) || (index < 0))
			{
				throw new ArgumentOutOfRangeException("index");
			}
			if (((index + length) > this.length) || (length < 1))
			{
				throw new ArgumentOutOfRangeException("length");
			}

			T[] data = new T[length];
			if (isOneBit || isFourBit)
			{
				for (int i = 0; i < length; i++)
				{
					data[i] = GetValueInternal(i);
				}
			}
			else
			{
				GCHandle handle = GCHandle.Alloc(data, GCHandleType.Pinned);
				byte* dst = (byte*)Marshal.UnsafeAddrOfPinnedArrayElement(data, 0);
				CopyMemory(dst, baseAddress + (size * index), size * length);
				handle.Free();
			}
			return data;
		}

		/// <summary>
		/// Sets the values at the specified position.
		/// </summary>
		/// <param name="values">An array containing the new values for the specified elements.</param>
		/// <param name="index">A 32-bit integer that represents the position
		/// of the array elements to set.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="values"/> is a null reference (Nothing in Visual Basic).</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="index"/> is outside the range of valid indexes
		/// for the unmanaged array or <paramref name="values.Length"/> is greater than the number of elements
		/// from <paramref name="index"/> to the end of the array.</exception>
		public void SetValues(T[] values, int index)
		{
			EnsureNotDisposed();
			if (values == null)
			{
				throw new ArgumentNullException("values");
			}
			if ((index >= this.length) || (index < 0))
			{
				throw new ArgumentOutOfRangeException("index");
			}
			if ((index + values.Length) > this.length)
			{
				throw new ArgumentOutOfRangeException("values.Length");
			}

			if (isOneBit || isFourBit)
			{
				for (int i = 0; i != values.Length; )
				{
					SetValueInternal(values[i++], index++);
				}
			}
			else
			{
				GCHandle handle = GCHandle.Alloc(values, GCHandleType.Pinned);
				byte* src = (byte*)Marshal.UnsafeAddrOfPinnedArrayElement(values, 0);
				CopyMemory(baseAddress + (index * size), src, size * length);
				handle.Free();
			}
		}

		/// <summary>
		/// Copies the entire array to a compatible one-dimensional <see cref="System.Array"/>,
		/// starting at the specified index of the target array.
		/// </summary>
		/// <param name="array">The one-dimensional <see cref="System.Array"/> that is the destination
		/// of the elements copied from <see cref="MemoryArray&lt;T&gt;"/>.
		/// The <see cref="System.Array"/> must have zero-based indexing.</param>
		/// <param name="index">The zero-based index in <paramref name="array"/>
		/// at which copying begins.</param>
		public void CopyTo(Array array, int index)
		{
			EnsureNotDisposed();
			if (!(array is T[]))
			{
				throw new InvalidCastException("array");
			}
			try
			{
				CopyTo((T[])array, 0, index, length);
			}
			catch (ArgumentOutOfRangeException ex)
			{
				throw new ArgumentException(ex.Message, ex);
			}
		}

		/// <summary>
		/// Copies a range of elements from the unmanaged array starting at the specified
		/// <typeparamref name="sourceIndex"/> and pastes them to <paramref name="array"/>
		/// starting at the specified <paramref name="destinationIndex"/>.
		/// The length and the indexes are specified as 32-bit integers.
		/// </summary>
		/// <param name="array">The array that receives the data.</param>
		/// <param name="sourceIndex">A 32-bit integer that represents the index
		/// in the unmanaged array at which copying begins.</param>
		/// <param name="destinationIndex">A 32-bit integer that represents the index in
		/// the destination array at which storing begins.</param>
		/// <param name="length">A 32-bit integer that represents the number of elements to copy.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="array"/> is a null reference (Nothing in Visual Basic).</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="sourceIndex"/> is outside the range of valid indexes
		/// for the unmanaged array or <paramref name="length"/> is greater than the number of elements
		/// from <paramref name="index"/> to the end of the unmanaged array
		/// <para>-or-</para>
		/// <paramref name="destinationIndex"/> is outside the range of valid indexes
		/// for the array or <paramref name="length"/> is greater than the number of elements
		/// from <paramref name="index"/> to the end of the array.
		/// </exception>
		public void CopyTo(T[] array, int sourceIndex, int destinationIndex, int length)
		{
			EnsureNotDisposed();
			if (array == null)
			{
				throw new ArgumentNullException("array");
			}
			if ((sourceIndex >= this.length) || (sourceIndex < 0))
			{
				throw new ArgumentOutOfRangeException("sourceIndex");
			}
			if ((destinationIndex >= array.Length) || (destinationIndex < 0))
			{
				throw new ArgumentOutOfRangeException("destinationIndex");
			}
			if ((sourceIndex + length > this.length) ||
				(destinationIndex + length > array.Length) ||
				(length < 1))
			{
				throw new ArgumentOutOfRangeException("length");
			}

			if (isOneBit || isFourBit)
			{
				for (int i = 0; i != length; i++)
				{
					array[destinationIndex++] = GetValueInternal(sourceIndex++);
				}
			}
			else
			{
				GCHandle handle = GCHandle.Alloc(array, GCHandleType.Pinned);
				byte* dst = (byte*)Marshal.UnsafeAddrOfPinnedArrayElement(array, destinationIndex);
				CopyMemory(dst, baseAddress + (size * sourceIndex), size * length);
				handle.Free();
			}
		}

		/// <summary>
		/// Copies a range of elements from the array starting at the specified
		/// <typeparamref name="sourceIndex"/> and pastes them to the unmanaged array
		/// starting at the specified <paramref name="destinationIndex"/>.
		/// The length and the indexes are specified as 32-bit integers.
		/// </summary>
		/// <param name="array">The array that holds the data.</param>
		/// <param name="sourceIndex">A 32-bit integer that represents the index
		/// in the array at which copying begins.</param>
		/// <param name="destinationIndex">A 32-bit integer that represents the index in
		/// the unmanaged array at which storing begins.</param>
		/// <param name="length">A 32-bit integer that represents the number of elements to copy.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="array"/> is a null reference (Nothing in Visual Basic).</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="sourceIndex"/> is outside the range of valid indexes
		/// for the array or <paramref name="length"/> is greater than the number of elements
		/// from <paramref name="index"/> to the end of the array
		/// <para>-or-</para>
		/// <paramref name="destinationIndex"/> is outside the range of valid indexes
		/// for the unmanaged array or <paramref name="length"/> is greater than the number of elements
		/// from <paramref name="index"/> to the end of the unmanaged array.
		/// </exception>
		public void CopyFrom(T[] array, int sourceIndex, int destinationIndex, int length)
		{
			EnsureNotDisposed();
			if (array == null)
			{
				throw new ArgumentNullException("array");
			}
			if ((destinationIndex >= this.length) || (destinationIndex < 0))
			{
				throw new ArgumentOutOfRangeException("destinationIndex");
			}
			if ((sourceIndex >= array.Length) || (sourceIndex < 0))
			{
				throw new ArgumentOutOfRangeException("sourceIndex");
			}
			if ((destinationIndex + length > this.length) ||
				(sourceIndex + length > array.Length) ||
				(length < 1))
			{
				throw new ArgumentOutOfRangeException("length");
			}

			if (isOneBit || isFourBit)
			{
				for (int i = 0; i != length; i++)
				{
					SetValueInternal(array[sourceIndex++], destinationIndex++);
				}
			}
			else
			{
				GCHandle handle = GCHandle.Alloc(array, GCHandleType.Pinned);
				byte* src = (byte*)Marshal.UnsafeAddrOfPinnedArrayElement(array, sourceIndex);
				CopyMemory(baseAddress + (size * destinationIndex), src, size * length);
				handle.Free();
			}
		}

		/// <summary>
		/// Returns the represented block of memory as an array of <see cref="Byte"/>.
		/// </summary>
		/// <returns>The represented block of memory.</returns>
		public byte[] ToByteArray()
		{
			EnsureNotDisposed();
			byte[] result;
			if (isOneBit)
			{
				result = new byte[(length + 7) / 8];
			}
			else if (isFourBit)
			{
				result = new byte[(length + 3) / 4];
			}
			else
			{
				result = new byte[size * length];
			}
			fixed (byte* dst = result)
			{
				CopyMemory(dst, baseAddress, result.Length);
			}
			return result;
		}

		/// <summary>
		/// Gets or sets the value at the specified position in the array.
		/// </summary>
		/// <param name="index">A 32-bit integer that represents the position
		/// of the array element to get.</param>
		/// <returns>The value at the specified position in the array.</returns>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="index"/> is outside the range of valid indexes
		/// for the unmanaged array.</exception>
		public T this[int index]
		{
			get
			{
				return GetValue(index);
			}
			set
			{
				SetValue(value, index);
			}
		}

		/// <summary>
		/// Gets or sets the values of the unmanaged array.
		/// </summary>
		public T[] Data
		{
			get
			{
				return GetValues(0, length);
			}
			set
			{
				if (value == null)
				{
					throw new ArgumentNullException("value");
				}
				if (value.Length != length)
				{
					throw new ArgumentOutOfRangeException("value.Lengt");
				}
				SetValues(value, 0);
			}
		}

		/// <summary>
		/// Gets the length of the unmanaged array.
		/// </summary>
		public int Length
		{
			get
			{
				EnsureNotDisposed();
				return length;
			}
		}

		/// <summary>
		/// Gets the base address of the represented memory block.
		/// </summary>
		public IntPtr BaseAddress
		{
			get
			{
				EnsureNotDisposed();
				return new IntPtr(baseAddress);
			}
		}

		/// <summary>
		/// Creates a shallow copy of the <see cref="MemoryArray&lt;T&gt;"/>.
		/// </summary>
		/// <returns>A shallow copy of the <see cref="MemoryArray&lt;T&gt;"/>.</returns>
		public object Clone()
		{
			EnsureNotDisposed();
			return new MemoryArray<T>(baseAddress, length);
		}

		/// <summary>
		/// Gets a 32-bit integer that represents the total number of elements
		/// in the <see cref="MemoryArray&lt;T&gt;"/>.
		/// </summary>
		public int Count
		{
			get { EnsureNotDisposed(); return length; }
		}

		/// <summary>
		/// Gets a value indicating whether access to the <see cref="MemoryArray&lt;T&gt;"/>
		/// is synchronized (thread safe).
		/// </summary>
		public bool IsSynchronized
		{
			get { EnsureNotDisposed(); return false; }
		}

		/// <summary>
		/// Gets an object that can be used to synchronize access to the <see cref="MemoryArray&lt;T&gt;"/>.
		/// </summary>
		public object SyncRoot
		{
			get
			{
				EnsureNotDisposed();
				if (syncRoot == null)
				{
					System.Threading.Interlocked.CompareExchange(ref syncRoot, new object(), null);
				}
				return syncRoot;
			}
		}

		/// <summary>
		/// Retrieves an object that can iterate through the individual
		/// elements in this <see cref="MemoryArray&lt;T&gt;"/>.
		/// </summary>
		/// <returns>An <see cref="IEnumerator"/> for the <see cref="MemoryArray&lt;T&gt;"/>.</returns>
		public IEnumerator GetEnumerator()
		{
			EnsureNotDisposed();
			T[] values = GetValues(0, length);
			for (int i = 0; i != values.Length; i++)
			{
				yield return values[i];
			}
		}

		/// <summary>
		/// Retrieves an object that can iterate through the individual
		/// elements in this <see cref="MemoryArray&lt;T&gt;"/>.
		/// </summary>
		/// <returns>An <see cref="IEnumerator&lt;T&gt;"/> for the <see cref="MemoryArray&lt;T&gt;"/>.</returns>
		IEnumerator<T> IEnumerable<T>.GetEnumerator()
		{
			EnsureNotDisposed();
			T[] values = GetValues(0, length);
			for (int i = 0; i != values.Length; i++)
			{
				yield return values[i];
			}
		}

		/// <summary>
		/// Releases all ressources.
		/// </summary>
		public void Dispose()
		{
			Dispose(true);
			GC.SuppressFinalize(this);
		}

		/// <summary>
		/// Releases allocated handles associated with this instance.
		/// </summary>
		/// <param name="disposing"><b>true</b> to release managed resources.</param>
		protected virtual void Dispose(bool disposing)
		{
			if (baseAddress != null)
			{
				if (handle.IsAllocated)
					handle.Free();
				baseAddress = null;
				buffer = null;
				length = 0;
				syncRoot = null;
			}
		}

		/// <summary>
		/// Throws an <see cref="ObjectDisposedException"/> if
		/// this instance is disposed.
		/// </summary>
		protected virtual void EnsureNotDisposed()
		{
			if (baseAddress == null)
				throw new ObjectDisposedException("This instance is disposed.");
		}

		/// <summary>
		/// Tests whether the specified <see cref="MemoryArray&lt;T&gt;"/> structure is equivalent to this
		/// <see cref="MemoryArray&lt;T&gt;"/> structure.
		/// </summary>
		/// <param name="obj">The structure to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="MemoryArray&lt;T&gt;"/>
		/// instance equivalent to this <see cref="MemoryArray&lt;T&gt;"/> structure; otherwise,
		/// <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			EnsureNotDisposed();
			return ((obj is MemoryArray<T>) && Equals((MemoryArray<T>)obj));
		}

		/// <summary>
		/// Tests whether the specified <see cref="MemoryArray&lt;T&gt;"/> structure is equivalent to this
		/// <see cref="MemoryArray&lt;T&gt;"/> structure.
		/// </summary>
		/// <param name="other">The structure to test.</param>
		/// <returns><b>true</b> if <paramref name="other"/> is equivalent to this
		/// <see cref="MemoryArray&lt;T&gt;"/> structure; otherwise,
		/// <b>false</b>.</returns>
		public bool Equals(MemoryArray<T> other)
		{
			EnsureNotDisposed();
			return ((this.baseAddress == other.baseAddress) && (this.length == other.length));
		}

		/// <summary>
		/// Serves as a hash function for a particular type.
		/// </summary>
		/// <returns>A hash code for the current <see cref="MemoryArray&lt;T&gt;"/>.</returns>
		public override int GetHashCode()
		{
			EnsureNotDisposed();
			return (int)baseAddress ^ length;
		}

		/// <summary>
		/// Copies a block of memory from one location to another.
		/// </summary>
		/// <param name="dest">Pointer to the starting address of the copy destination.</param>
		/// <param name="src">Pointer to the starting address of the block of memory to be copied.</param>
		/// <param name="len">Size of the block of memory to copy, in bytes.</param>
		protected static unsafe void CopyMemory(byte* dest, byte* src, int len)
		{
			if (len >= 0x10)
			{
				do
				{
					*((int*)dest) = *((int*)src);
					*((int*)(dest + 4)) = *((int*)(src + 4));
					*((int*)(dest + 8)) = *((int*)(src + 8));
					*((int*)(dest + 12)) = *((int*)(src + 12));
					dest += 0x10;
					src += 0x10;
				}
				while ((len -= 0x10) >= 0x10);
			}
			if (len > 0)
			{
				if ((len & 8) != 0)
				{
					*((int*)dest) = *((int*)src);
					*((int*)(dest + 4)) = *((int*)(src + 4));
					dest += 8;
					src += 8;
				}
				if ((len & 4) != 0)
				{
					*((int*)dest) = *((int*)src);
					dest += 4;
					src += 4;
				}
				if ((len & 2) != 0)
				{
					*((short*)dest) = *((short*)src);
					dest += 2;
					src += 2;
				}
				if ((len & 1) != 0)
				{
					*dest = *src;
				}
			}
		}
	}
}