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
// $Id: FIRGBF.cs,v 1.3 2009/02/20 07:41:08 cklein05 Exp $
// ==========================================================

using System;
using System.Drawing;
using System.Runtime.InteropServices;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>FIRGBF</b> structure describes a color consisting of relative
	/// intensities of red, green, blue and alpha value. Each single color
	/// component consumes 32 bits and takes values in the range from 0 to 1.
	/// </summary>
	/// <remarks>
	/// <para>
	/// The <b>FIRGBF</b> structure provides access to an underlying FreeImage <b>FIRGBF</b>
	/// structure. To determine the red, green or blue component of a color, use the
	/// red, green or blue fields, respectively.
	/// </para>
	/// <para>For easy integration of the underlying structure into the .NET framework,
	/// the <b>FIRGBF</b> structure implements implicit conversion operators to 
	/// convert the represented color to and from the <see cref="System.Drawing.Color"/>
	/// type. This makes the <see cref="System.Drawing.Color"/> type a real replacement
	/// for the <b>FIRGBF</b> structure and my be used in all situations which require
	/// an <b>FIRGBF</b> type.
	/// </para>
	/// <para>
	/// Each color component alpha, red, green or blue of <b>FIRGBF</b> is translated
	/// into it's corresponding color component A, R, G or B of
	/// <see cref="System.Drawing.Color"/> by linearly mapping the values of one range
	/// into the other range and vice versa.
	/// When converting from <see cref="System.Drawing.Color"/> into <b>FIRGBF</b>, the
	/// color's alpha value is ignored and assumed to be 255 when converting from
	/// <b>FIRGBF</b> into <see cref="System.Drawing.Color"/>, creating a fully
	/// opaque color.
	/// </para>
	/// <para>
	/// <b>Conversion from System.Drawing.Color to FIRGBF</b>
	/// </para>
	/// <c>FIRGBF.component = (float)Color.component / 255f</c>
	/// <para>
	/// <b>Conversion from FIRGBF to System.Drawing.Color</b>
	/// </para>
	/// <c>Color.component = (int)(FIRGBF.component * 255f)</c>
	/// <para>
	/// The same conversion is also applied when the <see cref="FreeImageAPI.FIRGBF.Color"/>
	/// property or the <see cref="FreeImageAPI.FIRGBF(System.Drawing.Color)"/> constructor
	/// is invoked.
	/// </para>
	/// </remarks>
	/// <example>
	/// The following code example demonstrates the various conversions between the
	/// <b>FIRGBF</b> structure and the <see cref="System.Drawing.Color"/> structure.
	/// <code>
	/// FIRGBF firgbf;
	/// // Initialize the structure using a native .NET Color structure.
	///	firgbf = new FIRGBF(Color.Indigo);
	/// // Initialize the structure using the implicit operator.
	///	firgbf = Color.DarkSeaGreen;
	/// // Convert the FIRGBF instance into a native .NET Color
	/// // using its implicit operator.
	///	Color color = firgbf;
	/// // Using the structure's Color property for converting it
	/// // into a native .NET Color.
	///	Color another = firgbf.Color;
	/// </code>
	/// </example>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct FIRGBF : IComparable, IComparable<FIRGBF>, IEquatable<FIRGBF>
	{
		/// <summary>
		/// The red color component.
		/// </summary>
		public float red;

		/// <summary>
		/// The green color component.
		/// </summary>
		public float green;

		/// <summary>
		/// The blue color component.
		/// </summary>
		public float blue;

		/// <summary>
		/// Initializes a new instance based on the specified <see cref="System.Drawing.Color"/>.
		/// </summary>
		/// <param name="color"><see cref="System.Drawing.Color"/> to initialize with.</param>
		public FIRGBF(Color color)
		{
			red = (float)color.R / 255f;
			green = (float)color.G / 255f;
			blue = (float)color.B / 255f;
		}

		/// <summary>
		/// Tests whether two specified <see cref="FIRGBF"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="FIRGBF"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="FIRGBF"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="FIRGBF"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(FIRGBF left, FIRGBF right)
		{
			return
				((left.blue == right.blue) &&
				(left.green == right.green) &&
				(left.red == right.red));
		}

		/// <summary>
		/// Tests whether two specified <see cref="FIRGBF"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="FIRGBF"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="FIRGBF"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="FIRGBF"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(FIRGBF left, FIRGBF right)
		{
			return !(left == right);
		}

		/// <summary>
		/// Converts the value of a <see cref="System.Drawing.Color"/> structure to a <see cref="FIRGBF"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="System.Drawing.Color"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRGBF"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIRGBF(Color value)
		{
			return new FIRGBF(value);
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRGBF"/> structure to a <see cref="System.Drawing.Color"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRGBF"/> structure.</param>
		/// <returns>A new instance of <see cref="System.Drawing.Color"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator Color(FIRGBF value)
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
					(int)(red * 255f),
					(int)(green * 255f),
					(int)(blue * 255f));
			}
			set
			{
				red = (float)value.R / 255f;
				green = (float)value.G / 255f;
				blue = (float)value.B / 255f;
			}
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">An object to compare with this instance.</param>
		/// <returns>A 32-bit signed integer indicating the lexical relationship between the two comparands.</returns>
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="FIRGBF"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is FIRGBF))
			{
				throw new ArgumentException("obj");
			}
			return CompareTo((FIRGBF)obj);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="FIRGBF"/> object.
		/// </summary>
		/// <param name="other">A <see cref="FIRGBF"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(FIRGBF other)
		{
			return this.Color.ToArgb().CompareTo(other.Color.ToArgb());
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="FIRGBF"/> structure
		/// and is equivalent to this <see cref="FIRGBF"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FIRGBF"/> structure
		/// equivalent to this <see cref="FIRGBF"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is FIRGBF) && (this == ((FIRGBF)obj)));
		}

		/// <summary>
		/// Tests whether the specified <see cref="FIRGBF"/> structure is equivalent to this <see cref="FIRGBF"/> structure.
		/// </summary>
		/// <param name="other">A <see cref="FIRGBF"/> structure to compare to this instance.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FIRGBF"/> structure
		/// equivalent to this <see cref="FIRGBF"/> structure; otherwise, <b>false</b>.</returns>
		public bool Equals(FIRGBF other)
		{
			return (this == other);
		}

		/// <summary>
		/// Returns a hash code for this <see cref="FIRGBF"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="FIRGBF"/>.</returns>
		public override int GetHashCode()
		{
			return base.GetHashCode();
		}


		/// <summary>
		/// Converts the numeric value of the <see cref="FIRGBF"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return FreeImage.ColorToString(Color);
		}
	}
}