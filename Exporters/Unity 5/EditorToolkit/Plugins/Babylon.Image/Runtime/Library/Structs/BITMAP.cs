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
// $Revision: 1.2 $
// $Date: 2008/06/16 15:15:36 $
// $Id: BITMAP.cs,v 1.2 2008/06/16 15:15:36 cklein05 Exp $
// ==========================================================

using System;
using System.Runtime.InteropServices;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>BITMAP</b> structure defines the type, width, height, color format, and bit values of a bitmap.
	/// </summary>
	/// <remarks>
	/// The bitmap formats currently used are monochrome and color. The monochrome bitmap uses a one-bit,
	/// one-plane format. Each scan is a multiple of 32 bits.
	/// <para/>
	/// Scans are organized as follows for a monochrome bitmap of height n:
	/// <para/>
	/// <code>
	/// Scan 0
	/// Scan 1
	/// .
	/// .
	/// .
	/// Scan n-2
	/// Scan n-1
	/// </code>
	/// <para/>
	/// The pixels on a monochrome device are either black or white. If the corresponding bit in the
	/// bitmap is 1, the pixel is set to the foreground color; if the corresponding bit in the bitmap
	/// is zero, the pixel is set to the background color.
	/// <para/>
	/// All devices that have the RC_BITBLT device capability support bitmaps. For more information,
	/// see <b>GetDeviceCaps</b>.
	/// <para/>
	/// Each device has a unique color format. To transfer a bitmap from one device to another,
	/// use the <b>GetDIBits</b> and <b>SetDIBits</b> functions.
	/// </remarks>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct BITMAP
	{
		/// <summary>
		/// Specifies the bitmap type. This member must be zero.
		/// </summary>
		public int bmType;
		/// <summary>
		/// Specifies the width, in pixels, of the bitmap. The width must be greater than zero.
		/// </summary>
		public int bmWidth;
		/// <summary>
		/// Specifies the height, in pixels, of the bitmap. The height must be greater than zero.
		/// </summary>
		public int bmHeight;
		/// <summary>
		/// Specifies the number of bytes in each scan line. This value must be divisible by 2,
		/// because the system assumes that the bit values of a bitmap form an array that is word aligned.
		/// </summary>
		public int bmWidthBytes;
		/// <summary>
		/// Specifies the count of color planes.
		/// </summary>
		public ushort bmPlanes;
		/// <summary>
		/// Specifies the number of bits required to indicate the color of a pixel.
		/// </summary>
		public ushort bmBitsPixel;
		/// <summary>
		/// Pointer to the location of the bit values for the bitmap.
		/// The <b>bmBits</b> member must be a long pointer to an array of character (1-byte) values.
		/// </summary>
		public IntPtr bmBits;
	}
}