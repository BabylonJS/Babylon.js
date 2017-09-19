// ==========================================================
// FreeImage 3 .NET wrapper
// Original FreeImage 3 functions and .NET compatible derived functions
//
// Design and implementation by
// - Jean-Philippe Goerke (jpgoerke@users.sourceforge.net)
// - Carsten Klein (cklein05@users.sourceforge.net)
//
// Contributors:
// - David Boland (davidboland@vodafone.ie)
//
// Main reference : MSDN Knowlede Base
//
// This file is part of FreeImage 3
//
// COVERED CODE IS PROVIDED UNDER THIS LICENSE ON AN "AS IS" BASIS, WITHOUT WARRANTY
// OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, WITHOUT LIMITATION, WARRANTIES
// THAT THE COVERED CODE IS FREE OF DEFECTS, MERCHANTABLE, FIT FOR A PARTICULAR PURPOSE
// OR NON-INFRINGING. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE COVERED
// CODE IS WITH YOU. SHOULD ANY COVERED CODE PROVE DEFECTIVE IN ANY RESPECT, YOU (NOT
// THE INITIAL DEVELOPER OR ANY OTHER CONTRIBUTOR) ASSUME THE COST OF ANY NECESSARY
// SERVICING, REPAIR OR CORRECTION. THIS DISCLAIMER OF WARRANTY CONSTITUTES AN ESSENTIAL
// PART OF THIS LICENSE. NO USE OF ANY COVERED CODE IS AUTHORIZED HEREUNDER EXCEPT UNDER
// THIS DISCLAIMER.
//
// Use at your own risk!
// ==========================================================

// ==========================================================
// CVS
// $Revision: 1.7 $
// $Date: 2009/02/20 07:41:08 $
// $Id: fi_handle.cs,v 1.7 2009/02/20 07:41:08 cklein05 Exp $
// ==========================================================

using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace FreeImageAPI.IO
{
	/// <summary>
	/// Wrapper for a custom handle.
	/// </summary>
	/// <remarks>
	/// The <b>fi_handle</b> of FreeImage in C++ is a simple pointer, but in .NET
	/// it's not that simple. This wrapper uses fi_handle in two different ways.
	///
	/// We implement a new plugin and FreeImage gives us a handle (pointer) that
	/// we can simply pass through to the given functions in a 'FreeImageIO'
	/// structure.
	/// But when we want to use LoadFromhandle or SaveToHandle we need
	/// a fi_handle (that we receive again in our own functions).
	/// This handle is for example a stream (see LoadFromStream / SaveToStream)
	/// that we want to work with. To know which stream a read/write is meant for
	/// we could use a hash value that the wrapper itself handles or we can
	/// go the unmanaged way of using a handle.
	/// Therefor we use a <see cref="GCHandle"/> to receive a unique pointer that we can
	/// convert back into a .NET object.
	/// When the <b>fi_handle</b> instance is no longer needed the instance must be disposed
	/// by the creater manually! It is recommended to use the <c>using</c> statement to
	/// be sure the instance is always disposed:
	/// 
	/// <code>
	/// using (fi_handle handle = new fi_handle(object))
	/// {
	///     callSomeFunctions(handle);
	/// }
	/// </code>
	/// 
	/// What does that mean?
	/// If we get a <b>fi_handle</b> from unmanaged code we get a pointer to unmanaged
	/// memory that we do not have to care about, and just pass ist back to FreeImage.
	/// If we have to create a handle our own we use the standard constructur
	/// that fills the <see cref="IntPtr"/> with an pointer that represents the given object.
	/// With calling <see cref="GetObject"/> the <see cref="IntPtr"/> is used to retrieve the original
	/// object we passed through the constructor.
	///
	/// This way we can implement a <b>fi_handle</b> that works with managed an unmanaged
	/// code.
	/// </remarks>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct fi_handle : IComparable, IComparable<fi_handle>, IEquatable<fi_handle>, IDisposable
	{
		/// <summary>
		/// The handle to wrap.
		/// </summary>
		public IntPtr handle;

		/// <summary>
		/// Initializes a new instance wrapping a managed object.
		/// </summary>
		/// <param name="obj">The object to wrap.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="obj"/> is null.</exception>
		public fi_handle(object obj)
		{
			if (obj == null)
			{
				throw new ArgumentNullException("obj");
			}
			GCHandle gch = GCHandle.Alloc(obj, GCHandleType.Normal);
			handle = GCHandle.ToIntPtr(gch);
		}

		/// <summary>
		/// Tests whether two specified <see cref="fi_handle"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="fi_handle"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="fi_handle"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="fi_handle"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(fi_handle left, fi_handle right)
		{
			return (left.handle == right.handle);
		}

		/// <summary>
		/// Tests whether two specified <see cref="fi_handle"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="fi_handle"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="fi_handle"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="fi_handle"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(fi_handle left, fi_handle right)
		{
			return (left.handle != right.handle);
		}

		/// <summary>
		/// Gets whether the pointer is a null pointer.
		/// </summary>
		public bool IsNull
		{
			get
			{
				return (handle == IntPtr.Zero);
			}
		}

		/// <summary>
		/// Returns the object assigned to the handle in case this instance
		/// was created by managed code.
		/// </summary>
		/// <returns><see cref="Object"/> assigned to this handle or null on failure.</returns>
		internal object GetObject()
		{
			object result = null;
			if (handle != IntPtr.Zero)
			{
				try
				{
					result = GCHandle.FromIntPtr(handle).Target;
				}
				catch
				{
				}
			}
			return result;
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="fi_handle"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return handle.ToString();
		}

		/// <summary>
		/// Returns a hash code for this <see cref="fi_handle"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="fi_handle"/>.</returns>
		public override int GetHashCode()
		{
			return handle.GetHashCode();
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="fi_handle"/> structure
		/// and is equivalent to this <see cref="fi_handle"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="fi_handle"/> structure
		/// equivalent to this <see cref="fi_handle"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is fi_handle) && (this == ((fi_handle)obj)));
		}

		/// <summary>
		/// Indicates whether the current object is equal to another object of the same type.
		/// </summary>
		/// <param name="other">An object to compare with this object.</param>
		/// <returns>True if the current object is equal to the other parameter; otherwise, <b>false</b>.</returns>
		public bool Equals(fi_handle other)
		{
			return (this == other);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">An object to compare with this instance.</param>
		/// <returns>A 32-bit signed integer indicating the lexical relationship between the two comparands.</returns>
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="fi_handle"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is fi_handle))
			{
				throw new ArgumentException("obj");
			}
			return CompareTo((fi_handle)obj);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="fi_handle"/> object.
		/// </summary>
		/// <param name="other">A <see cref="fi_handle"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(fi_handle other)
		{
			return handle.ToInt64().CompareTo(other.handle.ToInt64());
		}

		/// <summary>
		/// Releases all resources used by the instance.
		/// </summary>
		public void Dispose()
		{
			if (this.handle != IntPtr.Zero)
			{
				try
				{
					GCHandle.FromIntPtr(handle).Free();
				}
				catch
				{
				}
				finally
				{
					this.handle = IntPtr.Zero;
				}
			}
		}
	}
}