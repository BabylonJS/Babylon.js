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
// $Revision: 1.3 $
// $Date: 2009/02/20 07:41:08 $
// $Id: FI16RGB565.cs,v 1.3 2009/02/20 07:41:08 cklein05 Exp $
// ==========================================================

using System;
using System.Drawing;
using System.Runtime.InteropServices;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>FI16RGB565</b> structure describes a color consisting of relative
	/// intensities of red, green, blue and alpha value. Each single color
	/// component consumes 5 bits and so, takes values in the range from 0 to 31.
	/// </summary>
	/// <remarks>
	/// <para>For easy integration of the underlying structure into the .NET framework,
	/// the <b>FI16RGB565</b> structure implements implicit conversion operators to 
	/// convert the represented color to and from the <see cref="System.Drawing.Color"/>
	/// type. This makes the <see cref="System.Drawing.Color"/> type a real replacement
	/// for the <b>FI16RGB565</b> structure and my be used in all situations which require
	/// an <b>FI16RGB565</b> type.
	/// </para>
	/// </remarks>
	/// <example>
	/// The following code example demonstrates the various conversions between the
	/// <b>FI16RGB565</b> structure and the <see cref="System.Drawing.Color"/> structure.
	/// <code>
	/// FI16RGB565 fi16rgb;
	/// // Initialize the structure using a native .NET Color structure.
	///	fi16rgb = new FI16RGB565(Color.Indigo);
	/// // Initialize the structure using the implicit operator.
	///	fi16rgb = Color.DarkSeaGreen;
	/// // Convert the FI16RGB565 instance into a native .NET Color
	/// // using its implicit operator.
	///	Color color = fi16rgb;
	/// // Using the structure's Color property for converting it
	/// // into a native .NET Color.
	///	Color another = fi16rgb.Color;
	/// </code>
	/// </example>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct FI16RGB565 : IComparable, IComparable<FI16RGB565>, IEquatable<FI16RGB565>
	{
		/// <summary>
		/// The value of the color.
		/// </summary>
		private ushort value;

		/// <summary>
		/// Initializes a new instance based on the specified <see cref="System.Drawing.Color"/>.
		/// </summary>
		/// <param name="color"><see cref="System.Drawing.Color"/> to initialize with.</param>
		public FI16RGB565(Color color)
		{
			value = (ushort)(
				(((color.R * 31) / 255) << FreeImage.FI16_565_RED_SHIFT) +
				(((color.G * 63) / 255) << FreeImage.FI16_565_GREEN_SHIFT) +
				(((color.B * 31) / 255) << FreeImage.FI16_565_BLUE_SHIFT));
		}

		/// <summary>
		/// Tests whether two specified <see cref="FI16RGB565"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="FI16RGB565"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="FI16RGB565"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="FI16RGB565"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(FI16RGB565 left, FI16RGB565 right)
		{
			return (left.value == right.value);
		}

		/// <summary>
		/// Tests whether two specified <see cref="FI16RGB565"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="FI16RGB565"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="FI16RGB565"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="FI16RGB565"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(FI16RGB565 left, FI16RGB565 right)
		{
			return (!(left == right));
		}

		/// <summary>
		/// Converts the value of a <see cref="System.Drawing.Color"/> structure to a <see cref="FI16RGB565"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="System.Drawing.Color"/> structure.</param>
		/// <returns>A new instance of <see cref="FI16RGB565"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FI16RGB565(Color value)
		{
			return new FI16RGB565(value);
		}

		/// <summary>
		/// Converts the value of a <see cref="FI16RGB565"/> structure to a <see cref="System.Drawing.Color"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FI16RGB565"/> structure.</param>
		/// <returns>A new instance of <see cref="System.Drawing.Color"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator Color(FI16RGB565 value)
		{
			return value.Color;
		}

		/// <summary>
		/// Gets or sets the <see cref="System.Drawing.Color"/> of the structure.
		/// </summary>
		public Color Color
		{
			get
			{
				return Color.FromArgb(
					((value & FreeImage.FI16_565_RED_MASK) >> FreeImage.FI16_565_RED_SHIFT) * 255 / 31,
					((value & FreeImage.FI16_565_GREEN_MASK) >> FreeImage.FI16_565_GREEN_SHIFT) * 255 / 63,
					((value & FreeImage.FI16_565_BLUE_MASK) >> FreeImage.FI16_565_BLUE_SHIFT) * 255 / 31);
			}
			set
			{
				this.value = (ushort)(
					(((value.R * 31) / 255) << FreeImage.FI16_565_RED_SHIFT) +
					(((value.G * 63) / 255) << FreeImage.FI16_565_GREEN_SHIFT) +
					(((value.B * 31) / 255) << FreeImage.FI16_565_BLUE_SHIFT));
			}
		}

		/// <summary>
		/// Gets or sets the red color component.
		/// </summary>
		public byte Red
		{
			get
			{
				return (byte)(((value & FreeImage.FI16_565_RED_MASK) >> FreeImage.FI16_565_RED_SHIFT) * 255 / 31);
			}
			set
			{
				this.value = (ushort)((this.value & (~FreeImage.FI16_565_RED_MASK)) | (((value * 31) / 255) << FreeImage.FI16_565_RED_SHIFT));
			}
		}

		/// <summary>
		/// Gets or sets the green color component.
		/// </summary>
		public byte Green
		{
			get
			{
				return (byte)(((value & FreeImage.FI16_565_GREEN_MASK) >> FreeImage.FI16_565_GREEN_SHIFT) * 255 / 63);
			}
			set
			{
				this.value = (ushort)((this.value & (~FreeImage.FI16_565_GREEN_MASK)) | (((value * 63) / 255) << FreeImage.FI16_565_GREEN_SHIFT));
			}
		}

		/// <summary>
		/// Gets or sets the blue color component.
		/// </summary>
		public byte Blue
		{
			get
			{
				return (byte)(((value & FreeImage.FI16_565_BLUE_MASK) >> FreeImage.FI16_565_BLUE_SHIFT) * 255 / 31);
			}
			set
			{
				this.value = (ushort)((this.value & (~FreeImage.FI16_565_BLUE_MASK)) | (((value * 31) / 255) << FreeImage.FI16_565_BLUE_SHIFT));
			}
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">An object to compare with this instance.</param>
		/// <returns>A 32-bit signed integer indicating the lexical relationship between the two comparands.</returns>
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="FI16RGB565"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is FI16RGB565))
			{
				throw new ArgumentException("obj");
			}
			return CompareTo((FI16RGB565)obj);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="FI16RGB565"/> object.
		/// </summary>
		/// <param name="other">A <see cref="FI16RGB565"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(FI16RGB565 other)
		{
			return this.Color.ToArgb().CompareTo(other.Color.ToArgb());
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="FI16RGB565"/> structure
		/// and is equivalent to this <see cref="FI16RGB565"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FI16RGB565"/> structure
		/// equivalent to this <see cref="FI16RGB565"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return base.Equals(obj);
		}

		/// <summary>
		/// Tests whether the specified <see cref="FI16RGB565"/> structure is equivalent to this <see cref="FI16RGB565"/> structure.
		/// </summary>
		/// <param name="other">A <see cref="FI16RGB565"/> structure to compare to this instance.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FI16RGB565"/> structure
		/// equivalent to this <see cref="FI16RGB565"/> structure; otherwise, <b>false</b>.</returns>
		public bool Equals(FI16RGB565 other)
		{
			return (this == other);
		}

		/// <summary>
		/// Returns a hash code for this <see cref="FI16RGB565"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="FI16RGB565"/>.</returns>
		public override int GetHashCode()
		{
			return base.GetHashCode();
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="FI16RGB565"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return FreeImage.ColorToString(Color);
		}
	}
}