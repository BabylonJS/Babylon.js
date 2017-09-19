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
// $Revision: 1.5 $
// $Date: 2009/02/20 07:41:08 $
// $Id: FIMULTIBITMAP.cs,v 1.5 2009/02/20 07:41:08 cklein05 Exp $
// ==========================================================

using System;
using System.Runtime.InteropServices;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>FIMULTIBITMAP</b> structure is a handle to a FreeImage multipaged bimtap.
	/// </summary>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct FIMULTIBITMAP : IComparable, IComparable<FIMULTIBITMAP>, IEquatable<FIMULTIBITMAP>
	{
		private IntPtr data;

		/// <summary>
		/// A read-only field that represents a handle that has been initialized to zero.
		/// </summary>
		public static readonly FIMULTIBITMAP Zero;

		/// <summary>
		/// Tests whether two specified <see cref="FIMULTIBITMAP"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="FIMULTIBITMAP"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="FIMULTIBITMAP"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="FIMULTIBITMAP"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(FIMULTIBITMAP left, FIMULTIBITMAP right)
		{
			return (left.data == right.data);
		}

		/// <summary>
		/// Tests whether two specified <see cref="FIMULTIBITMAP"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="FIMULTIBITMAP"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="FIMULTIBITMAP"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="FIMULTIBITMAP"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(FIMULTIBITMAP left, FIMULTIBITMAP right)
		{
			return (left.data != right.data);
		}

		/// <summary>
		/// Gets whether the handle is a null or not.
		/// </summary>
		/// <value><b>true</b> if this <see cref="FIMULTIBITMAP"/> handle is a null;
		/// otherwise, <b>false</b>.</value>		
		public bool IsNull
		{
			get
			{
				return (data == IntPtr.Zero);
			}
		}

		/// <summary>
		/// Sets the handle to <i>null</i>.
		/// </summary>
		public void SetNull()
		{
			data = IntPtr.Zero;
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="FIMULTIBITMAP"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return data.ToString();
		}

		/// <summary>
		/// Returns a hash code for this <see cref="FIMULTIBITMAP"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="FIMULTIBITMAP"/>.</returns>
		public override int GetHashCode()
		{
			return data.GetHashCode();
		}

		/// <summary>
		/// Determines whether the specified <see cref="Object"/> is equal to the current <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">The <see cref="Object"/> to compare with the current <see cref="Object"/>.</param>
		/// <returns><b>true</b> if the specified <see cref="Object"/> is equal to the current <see cref="Object"/>; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is FIMULTIBITMAP) && (this == ((FIMULTIBITMAP)obj)));
		}

		/// <summary>
		/// Indicates whether the current object is equal to another object of the same type.
		/// </summary>
		/// <param name="other">An object to compare with this object.</param>
		/// <returns><b>true</b> if the current object is equal to the other parameter; otherwise, <b>false</b>.</returns>
		public bool Equals(FIMULTIBITMAP other)
		{
			return (this == other);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">An object to compare with this instance.</param>
		/// <returns>A 32-bit signed integer indicating the lexical relationship between the two comparands.</returns>
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="FIMULTIBITMAP"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is FIMULTIBITMAP))
			{
				throw new ArgumentException("obj");
			}
			return CompareTo((FIMULTIBITMAP)obj);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="FIMULTIBITMAP"/> object.
		/// </summary>
		/// <param name="other">A <see cref="FIMULTIBITMAP"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(FIMULTIBITMAP other)
		{
			return this.data.ToInt64().CompareTo(other.data.ToInt64());
		}
	}
}