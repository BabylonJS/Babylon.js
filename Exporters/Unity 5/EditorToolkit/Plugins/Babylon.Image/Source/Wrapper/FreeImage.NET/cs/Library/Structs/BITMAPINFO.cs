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
// $Date: 2008/06/16 15:16:07 $
// $Id: BITMAPINFO.cs,v 1.3 2008/06/16 15:16:07 cklein05 Exp $
// ==========================================================

using System;
using System.Runtime.InteropServices;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>BITMAPINFO</b> structure defines the dimensions and color information for a DIB.
	/// </summary>
	/// <remarks>
	/// A DIB consists of two distinct parts: a <b>BITMAPINFO</b> structure describing the dimensions
	/// and colors of the bitmap, and an array of bytes defining the pixels of the bitmap. The bits in
	/// the array are packed together, but each scan line must be padded with zeroes to end on a
	/// <b>LONG</b> data-type boundary. If the height of the bitmap is positive, the bitmap is a
	/// bottom-up DIB and its origin is the lower-left corner. If the height is negative, the bitmap is
	/// a top-down DIB and its origin is the upper left corner.
	/// <para/>
	/// A bitmap is packed when the bitmap array immediately follows the <b>BITMAPINFO</b> header.
	/// Packed bitmaps are referenced by a single pointer. For packed bitmaps, the <b>biClrUsed</b>
	/// member must be set to an even number when using the DIB_PAL_COLORS mode so that the DIB bitmap
	/// array starts on a <b>DWORD</b> boundary.
	/// <para/>
	/// <b>Note</b>  The <b>bmiColors</b> member should not contain palette indexes if the bitmap is to
	/// be stored in a file or transferred to another application.
	/// <para/>
	/// Unless the application has exclusive use and control of the bitmap, the bitmap color table
	/// should contain explicit RGB values.
	/// </remarks>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct BITMAPINFO : IEquatable<BITMAPINFO>
	{
		/// <summary>
		/// Specifies a <see cref="FreeImageAPI.BITMAPINFOHEADER"/> structure that contains information
		/// about the dimensions of color format.
		/// </summary>
		public BITMAPINFOHEADER bmiHeader;
		/// <summary>
		/// The <b>bmiColors</b> member contains one of the following:
		/// <list type="bullets">
		/// 
		/// <item>
		/// <term>
		/// An array of <see cref="FreeImageAPI.RGBQUAD"/>. The elements of the array that make up the
		/// color table.
		/// </term>
		/// </item>
		/// 
		/// <item>
		/// <term>
		/// An array of 16-bit unsigned integers that specifies indexes into the currently realized
		/// logical palette. This use of <b>bmiColors</b> is allowed for functions that use DIBs.
		/// When <b>bmiColors</b> elements contain indexes to a realized logical palette, they must
		/// also call the following bitmap functions:
		/// </term>
		/// </item>
		/// 
		/// </list>
		/// <b>CreateDIBitmap</b>
		/// <para/>
		/// <b>CreateDIBPatternBrush</b>
		/// <para/>
		/// <b>CreateDIBSection</b>
		/// <para/>
		/// The <i>iUsage</i> parameter of CreateDIBSection must be set to DIB_PAL_COLORS.
		/// <para/>
		/// The number of entries in the array depends on the values of the <b>biBitCount</b> and
		/// <b>biClrUsed</b> members of the <see cref="FreeImageAPI.BITMAPINFOHEADER"/> structure.
		/// <para/>
		/// The colors in the <b>bmiColors</b> table appear in order of importance. For more information,
		/// see the Remarks section.
		/// </summary>
		public RGBQUAD[] bmiColors;

		/// <summary>
		/// Tests whether two specified <see cref="BITMAPINFO"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="BITMAPINFO"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="BITMAPINFO"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="BITMAPINFO"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(BITMAPINFO left, BITMAPINFO right)
		{
			if (left.bmiHeader != right.bmiHeader)
			{
				return false;
			}
			if ((left.bmiColors == null) && (right.bmiColors == null))
			{
				return true;
			}
			if ((left.bmiColors == null) || (right.bmiColors == null))
			{
				return false;
			}
			if (left.bmiColors.Length != right.bmiColors.Length)
			{
				return false;
			}
			for (int i = 0; i < left.bmiColors.Length; i++)
			{
				if (left.bmiColors[i] != right.bmiColors[i])
				{
					return false;
				}
			}
			return true;
		}

		/// <summary>
		/// Tests whether two specified <see cref="BITMAPINFO"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="BITMAPINFO"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="BITMAPINFO"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="BITMAPINFO"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(BITMAPINFO left, BITMAPINFO right)
		{
			return !(left == right);
		}

		/// <summary>
		/// Tests whether the specified <see cref="BITMAPINFO"/> structure is equivalent to this <see cref="BITMAPINFO"/> structure.
		/// </summary>
		/// <param name="other">A <see cref="BITMAPINFO"/> structure to compare to this instance.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="BITMAPINFO"/> structure
		/// equivalent to this <see cref="BITMAPINFO"/> structure; otherwise, <b>false</b>.</returns>
		public bool Equals(BITMAPINFO other)
		{
			return (this == other);
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="BITMAPINFO"/> structure
		/// and is equivalent to this <see cref="BITMAPINFO"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="BITMAPINFO"/> structure
		/// equivalent to this <see cref="BITMAPINFO"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is BITMAPINFO) && (this == ((BITMAPINFO)obj)));
		}

		/// <summary>
		/// Returns a hash code for this <see cref="BITMAPINFO"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="BITMAPINFO"/>.</returns>
		public override int GetHashCode()
		{
			int hash = bmiHeader.GetHashCode();
			if (bmiColors != null)
			{
				for (int c = 0; c < bmiColors.Length; c++)
				{
					hash ^= bmiColors[c].GetHashCode();
					hash <<= 1;
				}
				hash <<= 1;
			}
			else
			{
				hash >>= 1;
			}
			return hash;
		}
	}
}