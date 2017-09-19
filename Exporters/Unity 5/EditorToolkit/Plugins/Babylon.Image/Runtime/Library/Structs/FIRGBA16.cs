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
// $Id: FIRGBA16.cs,v 1.3 2009/02/20 07:41:08 cklein05 Exp $
// ==========================================================

using System;
using System.Drawing;
using System.Runtime.InteropServices;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>FIRGBA16</b> structure describes a color consisting of relative
	/// intensities of red, green, blue and alpha value. Each single color
	/// component consumes 16 bits and so, takes values in the range from 0 to 65535.
	/// </summary>
	/// <remarks>
	/// <para>
	/// The <b>FIRGBA16</b> structure provides access to an underlying FreeImage <b>FIRGBA16</b>
	/// structure. To determine the alpha, red, green or blue component of a color,
	/// use the alpha, red, green or blue fields, respectively.
	/// </para>
	/// <para>For easy integration of the underlying structure into the .NET framework,
	/// the <b>FIRGBA16</b> structure implements implicit conversion operators to 
	/// convert the represented color to and from the <see cref="System.Drawing.Color"/>
	/// type. This makes the <see cref="System.Drawing.Color"/> type a real replacement
	/// for the <b>FIRGBA16</b> structure and my be used in all situations which require
	/// an <b>FIRGBA16</b> type.
	/// </para>
	/// <para>
	/// Each color component alpha, red, green or blue of <b>FIRGBA16</b>
	/// is translated into it's corresponding color component A, R, G or B of
	/// <see cref="System.Drawing.Color"/> by an 8 bit right shift and vice versa.
	/// </para>
	/// <para>
	/// <b>Conversion from System.Drawing.Color to FIRGBA16</b>
	/// </para>
	/// <c>FIRGBA16.component = Color.component &lt;&lt; 8</c>
	/// <para>
	/// <b>Conversion from FIRGBA16 to System.Drawing.Color</b>
	/// </para>
	/// <c>Color.component = FIRGBA16.component &gt;&gt; 8</c>
	/// <para>
	/// The same conversion is also applied when the <see cref="FreeImageAPI.FIRGBA16.Color"/>
	/// property or the <see cref="FreeImageAPI.FIRGBA16(System.Drawing.Color)"/> constructor
	/// is invoked.
	/// </para>
	/// </remarks>
	/// <example>
	/// The following code example demonstrates the various conversions between the
	/// <b>FIRGBA16</b> structure and the <see cref="System.Drawing.Color"/> structure.
	/// <code>
	/// FIRGBA16 firgba16;
	/// // Initialize the structure using a native .NET Color structure.
	///	firgba16 = new FIRGBA16(Color.Indigo);
	/// // Initialize the structure using the implicit operator.
	///	firgba16 = Color.DarkSeaGreen;
	/// // Convert the FIRGBA16 instance into a native .NET Color
	/// // using its implicit operator.
	///	Color color = firgba16;
	/// // Using the structure's Color property for converting it
	/// // into a native .NET Color.
	///	Color another = firgba16.Color;
	/// </code>
	/// </example>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct FIRGBA16 : IComparable, IComparable<FIRGBA16>, IEquatable<FIRGBA16>
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
		/// The alpha color component.
		/// </summary>
		public ushort alpha;

		/// <summary>
		/// Initializes a new instance based on the specified <see cref="System.Drawing.Color"/>.
		/// </summary>
		/// <param name="color"><see cref="System.Drawing.Color"/> to initialize with.</param>
		public FIRGBA16(Color color)
		{
			red = (ushort)(color.R << 8);
			green = (ushort)(color.G << 8);
			blue = (ushort)(color.B << 8);
			alpha = (ushort)(color.A << 8);
		}

		/// <summary>
		/// Tests whether two specified <see cref="FIRGBA16"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="FIRGBA16"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="FIRGBA16"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="FIRGBA16"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(FIRGBA16 left, FIRGBA16 right)
		{
			return
				((left.alpha == right.alpha) &&
				(left.blue == right.blue) &&
				(left.green == right.green) &&
				(left.red == right.red));
		}

		/// <summary>
		/// Tests whether two specified <see cref="FIRGBA16"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="FIRGBA16"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="FIRGBA16"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="FIRGBA16"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(FIRGBA16 left, FIRGBA16 right)
		{
			return !(left == right);
		}

		/// <summary>
		/// Converts the value of a <see cref="System.Drawing.Color"/> structure to a <see cref="FIRGBA16"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="System.Drawing.Color"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRGBA16"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIRGBA16(Color value)
		{
			return new FIRGBA16(value);
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRGBA16"/> structure to a <see cref="System.Drawing.Color"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRGBA16"/> structure.</param>
		/// <returns>A new instance of <see cref="System.Drawing.Color"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator Color(FIRGBA16 value)
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
				return Color.FromArgb((alpha >> 8), (red >> 8), (green >> 8), (blue >> 8));
			}
			set
			{
				red = (ushort)(value.R << 8);
				green = (ushort)(value.G << 8);
				blue = (ushort)(value.B << 8);
				alpha = (ushort)(value.A << 8);
			}
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">An object to compare with this instance.</param>
		/// <returns>A 32-bit signed integer indicating the lexical relationship between the two comparands.</returns>
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="FIRGBA16"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is FIRGBA16))
			{
				throw new ArgumentException("obj");
			}
			return CompareTo((FIRGBA16)obj);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="FIRGBA16"/> object.
		/// </summary>
		/// <param name="other">A <see cref="FIRGBA16"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(FIRGBA16 other)
		{
			return this.Color.ToArgb().CompareTo(other.Color.ToArgb());
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="FIRGBA16"/> structure
		/// and is equivalent to this <see cref="FIRGBA16"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FIRGBA16"/> structure
		/// equivalent to this <see cref="FIRGBA16"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is FIRGBA16) && (this == ((FIRGBA16)obj)));
		}

		/// <summary>
		/// Tests whether the specified <see cref="FIRGBA16"/> structure is equivalent to this <see cref="FIRGBA16"/> structure.
		/// </summary>
		/// <param name="other">A <see cref="FIRGBA16"/> structure to compare to this instance.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FIRGBA16"/> structure
		/// equivalent to this <see cref="FIRGBA16"/> structure; otherwise, <b>false</b>.</returns>
		public bool Equals(FIRGBA16 other)
		{
			return (this == other);
		}

		/// <summary>
		/// Returns a hash code for this <see cref="FIRGBA16"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="FIRGBA16"/>.</returns>
		public override int GetHashCode()
		{
			return base.GetHashCode();
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="FIRGBA16"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return FreeImage.ColorToString(Color);
		}
	}
}