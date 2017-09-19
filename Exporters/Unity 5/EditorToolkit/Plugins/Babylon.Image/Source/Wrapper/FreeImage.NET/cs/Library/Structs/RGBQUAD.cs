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
// $Revision: 1.4 $
// $Date: 2009/02/20 07:40:53 $
// $Id: RGBQUAD.cs,v 1.4 2009/02/20 07:40:53 cklein05 Exp $
// ==========================================================

using System;
using System.Drawing;
using System.Runtime.InteropServices;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>RGBQUAD</b> structure describes a color consisting of relative
	/// intensities of red, green, blue and alpha value. Each single color
	/// component consumes 8 bits and so, takes values in the range from 0 to 255.
	/// </summary>
	/// <remarks>
	/// <para>
	/// The <b>RGBQUAD</b> structure provides access to an underlying Win32 <b>RGBQUAD</b>
	/// structure. To determine the alpha, red, green or blue component of a color,
	/// use the rgbReserved, rgbRed, rgbGreen or rgbBlue fields, respectively.
	/// </para>
	/// <para>For easy integration of the underlying structure into the .NET framework,
	/// the <b>RGBQUAD</b> structure implements implicit conversion operators to 
	/// convert the represented color to and from the <see cref="System.Drawing.Color"/>
	/// type. This makes the <see cref="System.Drawing.Color"/> type a real replacement
	/// for the <b>RGBQUAD</b> structure and my be used in all situations which require
	/// an <b>RGBQUAD</b> type.
	/// </para>
	/// <para>
	/// Each color component rgbReserved, rgbRed, rgbGreen or rgbBlue of <b>RGBQUAD</b>
	/// is translated into it's corresponding color component A, R, G or B of
	/// <see cref="System.Drawing.Color"/> by an one-to-one manner and vice versa.
	/// </para>
	/// <para>
	/// <b>Conversion from System.Drawing.Color to RGBQUAD</b>
	/// </para>
	/// <c>RGBQUAD.component = Color.component</c>
	/// <para>
	/// <b>Conversion from RGBQUAD to System.Drawing.Color</b>
	/// </para>
	/// <c>Color.component = RGBQUAD.component</c>
	/// <para>
	/// The same conversion is also applied when the <see cref="FreeImageAPI.RGBQUAD.Color"/>
	/// property or the <see cref="FreeImageAPI.RGBQUAD(System.Drawing.Color)"/> constructor
	/// is invoked.
	/// </para>
	/// </remarks>
	/// <example>
	/// The following code example demonstrates the various conversions between the
	/// <b>RGBQUAD</b> structure and the <see cref="System.Drawing.Color"/> structure.
	/// <code>
	/// RGBQUAD rgbq;
	/// // Initialize the structure using a native .NET Color structure.
	///	rgbq = new RGBQUAD(Color.Indigo);
	/// // Initialize the structure using the implicit operator.
	///	rgbq = Color.DarkSeaGreen;
	/// // Convert the RGBQUAD instance into a native .NET Color
	/// // using its implicit operator.
	///	Color color = rgbq;
	/// // Using the structure's Color property for converting it
	/// // into a native .NET Color.
	///	Color another = rgbq.Color;
	/// </code>
	/// </example>
	[Serializable, StructLayout(LayoutKind.Explicit)]
	public struct RGBQUAD : IComparable, IComparable<RGBQUAD>, IEquatable<RGBQUAD>
	{
		/// <summary>
		/// The blue color component.
		/// </summary>
		[FieldOffset(0)]
		public byte rgbBlue;

		/// <summary>
		/// The green color component.
		/// </summary>
		[FieldOffset(1)]
		public byte rgbGreen;

		/// <summary>
		/// The red color component.
		/// </summary>
		[FieldOffset(2)]
		public byte rgbRed;

		/// <summary>
		/// The alpha color component.
		/// </summary>
		[FieldOffset(3)]
		public byte rgbReserved;

		/// <summary>
		/// The color's value.
		/// </summary>
		[FieldOffset(0)]
		public uint uintValue;

		/// <summary>
		/// Initializes a new instance based on the specified <see cref="System.Drawing.Color"/>.
		/// </summary>
		/// <param name="color"><see cref="System.Drawing.Color"/> to initialize with.</param>
		public RGBQUAD(Color color)
		{
			uintValue = 0u;
			rgbBlue = color.B;
			rgbGreen = color.G;
			rgbRed = color.R;
			rgbReserved = color.A;
		}

		/// <summary>
		/// Tests whether two specified <see cref="RGBQUAD"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="RGBQUAD"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="RGBQUAD"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="RGBQUAD"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(RGBQUAD left, RGBQUAD right)
		{
			return (left.uintValue == right.uintValue);
		}

		/// <summary>
		/// Tests whether two specified <see cref="RGBQUAD"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="RGBQUAD"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="RGBQUAD"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="RGBQUAD"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(RGBQUAD left, RGBQUAD right)
		{
			return (left.uintValue != right.uintValue);
		}

		/// <summary>
		/// Converts the value of a <see cref="System.Drawing.Color"/> structure to a <see cref="RGBQUAD"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="System.Drawing.Color"/> structure.</param>
		/// <returns>A new instance of <see cref="RGBQUAD"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator RGBQUAD(Color value)
		{
			return new RGBQUAD(value);
		}

		/// <summary>
		/// Converts the value of a <see cref="RGBQUAD"/> structure to a Color structure.
		/// </summary>
		/// <param name="value">A <see cref="RGBQUAD"/> structure.</param>
		/// <returns>A new instance of <see cref="System.Drawing.Color"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator Color(RGBQUAD value)
		{
			return value.Color;
		}

		/// <summary>
		/// Converts the value of an <see cref="UInt32"/> structure to a <see cref="RGBQUAD"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="UInt32"/> structure.</param>
		/// <returns>A new instance of <see cref="RGBQUAD"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator RGBQUAD(uint value)
		{
			RGBQUAD result = new RGBQUAD();
			result.uintValue = value;
			return result;
		}

		/// <summary>
		/// Converts the value of a <see cref="RGBQUAD"/> structure to an <see cref="UInt32"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="RGBQUAD"/> structure.</param>
		/// <returns>A new instance of <see cref="RGBQUAD"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator uint(RGBQUAD value)
		{
			return value.uintValue;
		}

		/// <summary>
		/// Gets or sets the <see cref="System.Drawing.Color"/> of the structure.
		/// </summary>
		public Color Color
		{
			get
			{
				return Color.FromArgb(
					rgbReserved,
					rgbRed,
					rgbGreen,
					rgbBlue);
			}
			set
			{
				rgbRed = value.R;
				rgbGreen = value.G;
				rgbBlue = value.B;
				rgbReserved = value.A;
			}
		}

		/// <summary>
		/// Converts an array of <see cref="Color"/> into an array of
		/// <see cref="RGBQUAD"/>.
		/// </summary>
		/// <param name="array">The array to convert.</param>
		/// <returns>An array of <see cref="RGBQUAD"/>.</returns>
		public static RGBQUAD[] ToRGBQUAD(Color[] array)
		{
			if (array == null)
				return null;

			RGBQUAD[] result = new RGBQUAD[array.Length];
			for (int i = 0; i < array.Length; i++)
			{
				result[i] = array[i];
			}
			return result;
		}

		/// <summary>
		/// Converts an array of <see cref="RGBQUAD"/> into an array of
		/// <see cref="Color"/>.
		/// </summary>
		/// <param name="array">The array to convert.</param>
		/// <returns>An array of <see cref="RGBQUAD"/>.</returns>
		public static Color[] ToColor(RGBQUAD[] array)
		{
			if (array == null)
				return null;

			Color[] result = new Color[array.Length];
			for (int i = 0; i < array.Length; i++)
			{
				result[i] = array[i].Color;
			}
			return result;
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">An object to compare with this instance.</param>
		/// <returns>A 32-bit signed integer indicating the lexical relationship between the two comparands.</returns>
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="RGBQUAD"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is RGBQUAD))
			{
				throw new ArgumentException("obj");
			}
			return CompareTo((RGBQUAD)obj);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="RGBQUAD"/> object.
		/// </summary>
		/// <param name="other">A <see cref="RGBQUAD"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(RGBQUAD other)
		{
			return this.Color.ToArgb().CompareTo(other.Color.ToArgb());
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="RGBQUAD"/> structure
		/// and is equivalent to this <see cref="RGBQUAD"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="RGBQUAD"/> structure
		/// equivalent to this <see cref="RGBQUAD"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is RGBQUAD) && (this == ((RGBQUAD)obj)));
		}

		/// <summary>
		/// Tests whether the specified <see cref="RGBQUAD"/> structure is equivalent to this <see cref="RGBQUAD"/> structure.
		/// </summary>
		/// <param name="other">A <see cref="RGBQUAD"/> structure to compare to this instance.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="RGBQUAD"/> structure
		/// equivalent to this <see cref="RGBQUAD"/> structure; otherwise, <b>false</b>.</returns>
		public bool Equals(RGBQUAD other)
		{
			return (this == other);
		}

		/// <summary>
		/// Returns a hash code for this <see cref="RGBQUAD"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="RGBQUAD"/>.</returns>
		public override int GetHashCode()
		{
			return base.GetHashCode();
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="RGBQUAD"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return FreeImage.ColorToString(Color);
		}
	}
}