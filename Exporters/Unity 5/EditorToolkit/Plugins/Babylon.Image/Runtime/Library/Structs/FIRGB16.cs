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
// $Id: FIRGB16.cs,v 1.3 2009/02/20 07:41:08 cklein05 Exp $
// ==========================================================

using System;
using System.Drawing;
using System.Runtime.InteropServices;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>FIRGB16</b> structure describes a color consisting of relative
	/// intensities of red, green, blue and alpha value. Each single color
	/// component consumes 16 bits and so, takes values in the range from 0 to 65535.
	/// </summary>
	/// <remarks>
	/// <para>
	/// The <b>FIRGB16</b> structure provides access to an underlying FreeImage <b>FIRGB16</b>
	/// structure. To determine the red, green or blue component of a color,
	/// use the red, green or blue fields, respectively.
	/// </para>
	/// <para>For easy integration of the underlying structure into the .NET framework,
	/// the <b>FIRGB16</b> structure implements implicit conversion operators to 
	/// convert the represented color to and from the <see cref="System.Drawing.Color"/>
	/// type. This makes the <see cref="System.Drawing.Color"/> type a real replacement
	/// for the <b>FIRGB16</b> structure and my be used in all situations which require
	/// an <b>FIRGB16</b> type.
	/// </para>
	/// <para>
	/// Each color component red, green or blue of <b>FIRGB16</b> is translated into
	/// it's corresponding color component R, G or B of
	/// <see cref="System.Drawing.Color"/> by right shifting 8 bits and shifting left 8 bits for the reverse conversion.
	/// When converting from <see cref="System.Drawing.Color"/> into <b>FIRGB16</b>, the
	/// color's alpha value is ignored and assumed to be 255 when converting from
	/// <b>FIRGB16</b> into <see cref="System.Drawing.Color"/>, creating a fully
	/// opaque color.
	/// </para>
	/// <para>
	/// <b>Conversion from System.Drawing.Color to FIRGB16</b>
	/// </para>
	/// <c>FIRGB16.component = Color.component &lt;&lt; 8</c>
	/// <para>
	/// <b>Conversion from FIRGB16 to System.Drawing.Color</b>
	/// </para>
	/// <c>Color.component = FIRGB16.component &gt;&gt; 8</c>
	/// <para>
	/// The same conversion is also applied when the <see cref="FreeImageAPI.FIRGB16.Color"/>
	/// property or the <see cref="FreeImageAPI.FIRGB16(System.Drawing.Color)"/> constructor
	/// is invoked.
	/// </para>
	/// </remarks>
	/// <example>
	/// The following code example demonstrates the various conversions between the
	/// <b>FIRGB16</b> structure and the <see cref="System.Drawing.Color"/> structure.
	/// <code>
	/// FIRGB16 firgb16;
	/// // Initialize the structure using a native .NET Color structure.
	///	firgb16 = new FIRGBA16(Color.Indigo);
	/// // Initialize the structure using the implicit operator.
	///	firgb16 = Color.DarkSeaGreen;
	/// // Convert the FIRGB16 instance into a native .NET Color
	/// // using its implicit operator.
	///	Color color = firgb16;
	/// // Using the structure's Color property for converting it
	/// // into a native .NET Color.
	///	Color another = firgb16.Color;
	/// </code>
	/// </example>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct FIRGB16 : IComparable, IComparable<FIRGB16>, IEquatable<FIRGB16>
	{
		/// <summary>
		/// The red color component.
		/// </summary>
		public ushort red;

		/// <summary>
		/// The green color component.
		/// </summary>
		public ushort green;

		/// <summary>
		/// The blue color component.
		/// </summary>
		public ushort blue;

		/// <summary>
		/// Initializes a new instance based on the specified <see cref="System.Drawing.Color"/>.
		/// </summary>
		/// <param name="color"><see cref="System.Drawing.Color"/> to initialize with.</param>
		public FIRGB16(Color color)
		{
			red = (ushort)(color.R << 8);
			green = (ushort)(color.G << 8);
			blue = (ushort)(color.B << 8);
		}

		/// <summary>
		/// Tests whether two specified <see cref="FIRGB16"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="FIRGB16"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="FIRGB16"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="FIRGB16"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(FIRGB16 left, FIRGB16 right)
		{
			return
				((left.blue == right.blue) &&
				(left.green == right.green) &&
				(left.red == right.red));
		}

		/// <summary>
		/// Tests whether two specified <see cref="FIRGB16"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="FIRGB16"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="FIRGB16"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="FIRGB16"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(FIRGB16 left, FIRGB16 right)
		{
			return !(left == right);
		}

		/// <summary>
		/// Converts the value of a <see cref="System.Drawing.Color"/> structure to a <see cref="FIRGB16"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="System.Drawing.Color"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRGB16"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIRGB16(Color value)
		{
			return new FIRGB16(value);
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRGB16"/> structure to a <see cref="System.Drawing.Color"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRGB16"/> structure.</param>
		/// <returns>A new instance of <see cref="System.Drawing.Color"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator Color(FIRGB16 value)
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
				return Color.FromArgb((red >> 8), (green >> 8), (blue >> 8));
			}
			set
			{
				red = (ushort)(value.R << 8);
				green = (ushort)(value.G << 8);
				blue = (ushort)(value.B << 8);
			}
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">An object to compare with this instance.</param>
		/// <returns>A 32-bit signed integer indicating the lexical relationship between the two comparands.</returns>
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="FIRGB16"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is FIRGB16))
			{
				throw new ArgumentException("obj");
			}
			return CompareTo((FIRGB16)obj);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="FIRGB16"/> object.
		/// </summary>
		/// <param name="other">A <see cref="FIRGB16"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(FIRGB16 other)
		{
			return this.Color.ToArgb().CompareTo(other.Color.ToArgb());
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="FIRGB16"/> structure
		/// and is equivalent to this <see cref="FIRGB16"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FIRGB16"/> structure
		/// equivalent to this <see cref="FIRGB16"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is FIRGB16) && (this == ((FIRGB16)obj)));
		}

		/// <summary>
		/// Tests whether the specified <see cref="FIRGB16"/> structure is equivalent to this <see cref="FIRGB16"/> structure.
		/// </summary>
		/// <param name="other">A <see cref="FIRGB16"/> structure to compare to this instance.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FIRGB16"/> structure
		/// equivalent to this <see cref="FIRGB16"/> structure; otherwise, <b>false</b>.</returns>
		public bool Equals(FIRGB16 other)
		{
			return (this == other);
		}

		/// <summary>
		/// Returns a hash code for this <see cref="FIRGB16"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="FIRGB16"/>.</returns>
		public override int GetHashCode()
		{
			return base.GetHashCode();
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="FIRGB16"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return FreeImage.ColorToString(Color);
		}
	}
}