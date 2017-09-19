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
// $Id: RGBTRIPLE.cs,v 1.3 2009/02/20 07:41:08 cklein05 Exp $
// ==========================================================

using System;
using System.Drawing;
using System.Runtime.InteropServices;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>RGBTRIPLE</b> structure describes a color consisting of relative
	/// intensities of red, green and blue value. Each single color component
	/// consumes 8 bits and so, takes values in the range from 0 to 255.
	/// </summary>
	/// <remarks>
	/// <para>
	/// The <b>RGBTRIPLE</b> structure provides access to an underlying Win32 <b>RGBTRIPLE</b>
	/// structure. To determine the red, green or blue component of a color, use the
	/// rgbtRed, rgbtGreen or rgbtBlue fields, respectively.
	/// </para>
	/// <para>For easy integration of the underlying structure into the .NET framework,
	/// the <b>RGBTRIPLE</b> structure implements implicit conversion operators to 
	/// convert the represented color to and from the <see cref="System.Drawing.Color"/>
	/// type. This makes the <see cref="System.Drawing.Color"/> type a real replacement
	/// for the <b>RGBTRIPLE</b> structure and my be used in all situations which require
	/// an <b>RGBTRIPLE</b> type.
	/// </para>
	/// <para>
	/// Each of the color components rgbtRed, rgbtGreen or rgbtBlue of <b>RGBTRIPLE</b> is
	/// translated into it's corresponding color component R, G or B of
	/// <see cref="System.Drawing.Color"/> by an one-to-one manner and vice versa.
	/// When converting from <see cref="System.Drawing.Color"/> into <b>RGBTRIPLE</b>, the
	/// color's alpha value is ignored and assumed to be 255 when converting from
	/// <b>RGBTRIPLE</b> into <see cref="System.Drawing.Color"/>, creating a fully
	/// opaque color.
	/// </para>
	/// <para>
	/// <b>Conversion from System.Drawing.Color to RGBTRIPLE</b>
	/// </para>
	/// <c>RGBTRIPLE.component = Color.component</c>
	/// <para>
	/// <b>Conversion from RGBTRIPLE to System.Drawing.Color</b>
	/// </para>
	/// <c>Color.component = RGBTRIPLE.component</c>
	/// <para>
	/// The same conversion is also applied when the <see cref="FreeImageAPI.RGBTRIPLE.Color"/>
	/// property or the <see cref="FreeImageAPI.RGBTRIPLE(System.Drawing.Color)"/> constructor
	/// is invoked.
	/// </para>
	/// </remarks>
	/// <example>
	/// The following code example demonstrates the various conversions between the
	/// <b>RGBTRIPLE</b> structure and the <see cref="System.Drawing.Color"/> structure.
	/// <code>
	/// RGBTRIPLE rgbt;
	/// // Initialize the structure using a native .NET Color structure.
	///	rgbt = new RGBTRIPLE(Color.Indigo);
	/// // Initialize the structure using the implicit operator.
	///	rgbt = Color.DarkSeaGreen;
	/// // Convert the RGBTRIPLE instance into a native .NET Color
	/// // using its implicit operator.
	///	Color color = rgbt;
	/// // Using the structure's Color property for converting it
	/// // into a native .NET Color.
	///	Color another = rgbt.Color;
	/// </code>
	/// </example>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct RGBTRIPLE : IComparable, IComparable<RGBTRIPLE>, IEquatable<RGBTRIPLE>
	{
		/// <summary>
		/// The blue color component.
		/// </summary>
		public byte rgbtBlue;

		/// <summary>
		/// The green color component.
		/// </summary>
		public byte rgbtGreen;

		/// <summary>
		/// The red color component.
		/// </summary>
		public byte rgbtRed;

		/// <summary>
		/// Initializes a new instance based on the specified <see cref="System.Drawing.Color"/>.
		/// </summary>
		/// <param name="color"><see cref="System.Drawing.Color"/> to initialize with.</param>
		public RGBTRIPLE(Color color)
		{
			rgbtBlue = color.B;
			rgbtGreen = color.G;
			rgbtRed = color.R;
		}

		/// <summary>
		/// Tests whether two specified <see cref="RGBTRIPLE"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="RGBTRIPLE"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="RGBTRIPLE"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="RGBTRIPLE"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(RGBTRIPLE left, RGBTRIPLE right)
		{
			return
				left.rgbtBlue == right.rgbtBlue &&
				left.rgbtGreen == right.rgbtGreen &&
				left.rgbtRed == right.rgbtRed;
		}

		/// <summary>
		/// Tests whether two specified <see cref="RGBTRIPLE"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="RGBTRIPLE"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="RGBTRIPLE"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="RGBTRIPLE"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(RGBTRIPLE left, RGBTRIPLE right)
		{
			return !(left == right);
		}

		/// <summary>
		/// Converts the value of a <see cref="System.Drawing.Color"/> structure to a <see cref="RGBTRIPLE"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="System.Drawing.Color"/> structure.</param>
		/// <returns>A new instance of <see cref="RGBTRIPLE"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator RGBTRIPLE(Color value)
		{
			return new RGBTRIPLE(value);
		}

		/// <summary>
		/// Converts the value of a <see cref="RGBTRIPLE"/> structure to a <see cref="System.Drawing.Color"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="RGBTRIPLE"/> structure.</param>
		/// <returns>A new instance of <see cref="System.Drawing.Color"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator Color(RGBTRIPLE value)
		{
			return value.Color;
		}

		/// <summary>
		/// Converts the value of an <see cref="UInt32"/> structure to a <see cref="RGBTRIPLE"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="UInt32"/> structure.</param>
		/// <returns>A new instance of <see cref="RGBTRIPLE"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator RGBTRIPLE(uint value)
		{
			RGBTRIPLE result = new RGBTRIPLE();
			result.rgbtBlue = (byte)(value & 0xFF);
			result.rgbtGreen = (byte)((value >> 8) & 0xFF);
			result.rgbtRed = (byte)((value >> 16) & 0xFF);
			return result;
		}

		/// <summary>
		/// Converts the value of a <see cref="RGBTRIPLE"/> structure to an <see cref="UInt32"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="RGBTRIPLE"/> structure.</param>
		/// <returns>A new instance of <see cref="RGBTRIPLE"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator uint(RGBTRIPLE value)
		{
			return (uint)((value.rgbtRed << 16) | (value.rgbtGreen << 8) | (value.rgbtBlue));
		}

		/// <summary>
		/// Gets or sets the <see cref="System.Drawing.Color"/> of the structure.
		/// </summary>
		public Color Color
		{
			get
			{
				return Color.FromArgb(
					rgbtRed,
					rgbtGreen,
					rgbtBlue);
			}
			set
			{
				rgbtBlue = value.B;
				rgbtGreen = value.G;
				rgbtRed = value.R;
			}
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">An object to compare with this instance.</param>
		/// <returns>A 32-bit signed integer indicating the lexical relationship between the two comparands.</returns>
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="RGBTRIPLE"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is RGBTRIPLE))
			{
				throw new ArgumentException("obj");
			}
			return CompareTo((RGBTRIPLE)obj);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="RGBTRIPLE"/> object.
		/// </summary>
		/// <param name="other">A <see cref="RGBTRIPLE"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(RGBTRIPLE other)
		{
			return this.Color.ToArgb().CompareTo(other.Color.ToArgb());
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="RGBTRIPLE"/> structure
		/// and is equivalent to this <see cref="RGBTRIPLE"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="RGBTRIPLE"/> structure
		/// equivalent to this <see cref="RGBTRIPLE"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is RGBTRIPLE) && (this == ((RGBTRIPLE)obj)));
		}

		/// <summary>
		/// Tests whether the specified <see cref="RGBTRIPLE"/> structure is equivalent to this
		/// <see cref="RGBTRIPLE"/> structure.
		/// </summary>
		/// <param name="other">A <see cref="RGBTRIPLE"/> structure to compare to this instance.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="RGBTRIPLE"/> structure
		/// equivalent to this <see cref="RGBTRIPLE"/> structure; otherwise, <b>false</b>.</returns>
		public bool Equals(RGBTRIPLE other)
		{
			return (this == other);
		}

		/// <summary>
		/// Returns a hash code for this <see cref="RGBTRIPLE"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="RGBTRIPLE"/>.</returns>
		public override int GetHashCode()
		{
			return base.GetHashCode();
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="RGBTRIPLE"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return FreeImage.ColorToString(Color);
		}
	}
}