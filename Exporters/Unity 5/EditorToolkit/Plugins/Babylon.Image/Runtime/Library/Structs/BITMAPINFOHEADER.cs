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
// $Date: 2008/06/16 15:17:37 $
// $Id: BITMAPINFOHEADER.cs,v 1.4 2008/06/16 15:17:37 cklein05 Exp $
// ==========================================================

using System;
using System.Runtime.InteropServices;

namespace FreeImageAPI
{
	/// <summary>
	/// This structure contains information about the dimensions and color format
	/// of a device-independent bitmap (DIB).
	/// </summary>
	/// <remarks>
	/// The <see cref="FreeImageAPI.BITMAPINFO"/> structure combines the
	/// <b>BITMAPINFOHEADER</b> structure and a color table to provide a complete
	/// definition of the dimensions and colors of a DIB.
	/// </remarks>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct BITMAPINFOHEADER : IEquatable<BITMAPINFOHEADER>
	{
		/// <summary>
		/// Specifies the size of the structure, in bytes.
		/// </summary>
		public uint biSize;
		/// <summary>
		/// Specifies the width of the bitmap, in pixels.
		/// <para/>
		/// <b>Windows 98/Me, Windows 2000/XP:</b> If <b>biCompression</b> is BI_JPEG or BI_PNG,
		/// the <b>biWidth</b> member specifies the width of the decompressed JPEG or PNG image file,
		/// respectively.
		/// </summary>
		public int biWidth;
		/// <summary>
		/// Specifies the height of the bitmap, in pixels. If <b>biHeight</b> is positive, the bitmap
		/// is a bottom-up DIB and its origin is the lower-left corner. If <b>biHeight</b> is negative,
		/// the bitmap is a top-down DIB and its origin is the upper-left corner. 
		/// <para/>
		/// If <b>biHeight</b> is negative, indicating a top-down DIB, <b>biCompression</b> must be
		/// either BI_RGB or BI_BITFIELDS. Top-down DIBs cannot be compressed.
		/// <para/>
		/// <b>Windows 98/Me, Windows 2000/XP:</b> If <b>biCompression</b> is BI_JPEG or BI_PNG,
		/// the <b>biHeight</b> member specifies the height of the decompressed JPEG or PNG image file,
		/// respectively.
		/// </summary>
		public int biHeight;
		/// <summary>
		/// Specifies the number of planes for the target device. This value must be set to 1.
		/// </summary>
		public ushort biPlanes;
		/// <summary>
		/// Specifies the number of bits per pixel.The biBitCount member of the <b>BITMAPINFOHEADER</b>
		/// structure determines the number of bits that define each pixel and the maximum number of
		/// colors in the bitmap. This member must be one of the following values.
		/// <para/>
		/// 
		/// <list type="table">
		/// <listheader>
		/// <term>Value</term>
		/// <description>Meaning</description>
		/// </listheader>
		/// 
		/// <item>
		/// <term>0</term>
		/// <description>
		/// <b>Windows 98/Me, Windows 2000/XP:</b> The number of bits-per-pixel is specified
		/// or is implied by the JPEG or PNG format.
		/// </description>
		/// </item>
		/// 
		/// <item>
		/// <term>1</term>
		/// <description>
		/// The bitmap is monochrome, and the bmiColors member of <see cref="FreeImageAPI.BITMAPINFO"/>
		/// contains two entries. Each bit in the bitmap array represents a pixel. If the bit is clear,
		/// the pixel is displayed with the color of the first entry in the bmiColors table; if the bit
		/// is set, the pixel has the color of the second entry in the table.
		/// </description>
		/// </item>
		/// 
		/// <item>
		/// <term>4</term>
		/// <description>
		/// The bitmap has a maximum of 16 colors, and the <b>bmiColors</b> member of <b>BITMAPINFO</b>
		/// contains up to 16 entries. Each pixel in the bitmap is represented by a 4-bit index into the
		/// color table. For example, if the first byte in the bitmap is 0x1F, the byte represents two
		/// pixels. The first pixel contains the color in the second table entry, and the second pixel
		/// contains the color in the sixteenth table entry.</description>
		/// </item>
		/// 
		/// <item>
		/// <term>8</term>
		/// <description>
		/// The bitmap has a maximum of 256 colors, and the <b>bmiColors</b> member of <b>BITMAPINFO</b>
		/// contains up to 256 entries. In this case, each byte in the array represents a single pixel.
		/// </description>
		/// </item>
		/// 
		/// <item>
		/// <term>16</term>
		/// <description>
		/// The bitmap has a maximum of 2^16 colors. If the <b>biCompression</b> member of the
		/// <b>BITMAPINFOHEADER</b> is BI_RGB, the <b>bmiColors</b> member of <b>BITMAPINFO</b> is NULL.
		/// Each <b>WORD</b> in the bitmap array represents a single pixel. The relative intensities
		/// of red, green, and blue are represented with five bits for each color component.
		/// The value for blue is in the least significant five bits, followed by five bits each for
		/// green and red. The most significant bit is not used. The <b>bmiColors</b> color table is used
		/// for optimizing colors used on palette-based devices, and must contain the number of entries
		/// specified by the <b>biClrUsed</b> member of the <b>BITMAPINFOHEADER</b>.
		/// <para/>
		/// If the <b>biCompression</b> member of the <b>BITMAPINFOHEADER</b> is BI_BITFIELDS, the
		/// <b>bmiColors</b> member contains three <b>DWORD</b> color masks that specify the red, green,
		/// and blue components, respectively, of each pixel. Each <b>WORD</b> in the bitmap array represents
		/// a single pixel.
		/// <para/>
		/// <b>Windows NT/Windows 2000/XP:</b> When the <b>biCompression</b> member is BI_BITFIELDS,
		/// bits set in each <b>DWORD</b> mask must be contiguous and should not overlap the bits
		/// of another mask. All the bits in the pixel do not have to be used.
		/// <para/>
		/// <b>Windows 95/98/Me:</b> When the <b>biCompression</b> member is BI_BITFIELDS, the system
		/// supports only the following 16bpp color masks: A 5-5-5 16-bit image, where the blue mask is
		/// 0x001F, the green mask is 0x03E0, and the red mask is 0x7C00; and a 5-6-5 16-bit image,
		/// where the blue mask is 0x001F, the green mask is 0x07E0, and the red mask is 0xF800.
		/// </description>
		/// </item>
		/// 
		/// <item>
		/// <term>24</term>
		/// <description>
		/// The bitmap has a maximum of 2^24 colors, and the <b>bmiColors</b> member of <b>BITMAPINFO</b>
		/// is NULL. Each 3-byte triplet in the bitmap array represents the relative intensities of blue,
		/// green, and red, respectively, for a pixel. The <b>bmiColors</b> color table is used for
		/// optimizing colors used on palette-based devices, and must contain the number of entries
		/// specified by the <b>biClrUsed</b> member of the <b>BITMAPINFOHEADER</b>.
		/// </description>
		/// </item>
		/// 
		/// <item>
		/// <term>32</term>
		/// <description>
		/// The bitmap has a maximum of 2^32 colors. If the <b>biCompression</b> member of the
		/// <b>BITMAPINFOHEADER</b> is BI_RGB, the <b>bmiColors</b> member of <b>BITMAPINFO</b> is NULL.
		/// Each <b>DWORD</b> in the bitmap array represents the relative intensities of blue, green, and red,
		/// respectively, for a pixel. The high byte in each <b>DWORD</b> is not used. The <b>bmiColors</b>
		/// color table is used for optimizing colors used on palette-based devices, and must contain the 
		/// number of entries specified by the <b>biClrUsed</b> member of the <b>BITMAPINFOHEADER</b>.
		/// <para/>
		/// If the <b>biCompression</b> member of the <b>BITMAPINFOHEADER</b> is BI_BITFIELDS,
		/// the <b>bmiColors</b> member contains three <b>DWORD</b> color masks that specify the red, green,
		/// and blue components, respectively, of each pixel. Each <b>DWORD</b> in the bitmap array represents
		/// a single pixel.
		/// <para/>
		/// <b>Windows NT/ 2000:</b> When the <b>biCompression</b> member is BI_BITFIELDS, bits set in each
		/// <b>DWORD</b> mask must be contiguous and should not overlap the bits of another mask. All the
		/// bits in the pixel do not need to be used.
		/// <para/>
		/// <b>Windows 95/98/Me:</b> When the <b>biCompression</b> member is BI_BITFIELDS, the system
		/// supports only the following 32-bpp color mask: The blue mask is 0x000000FF, the green mask is
		/// 0x0000FF00, and the red mask is 0x00FF0000.
		/// </description>
		/// </item>
		/// </list>
		/// </summary>
		public ushort biBitCount;
		/// <summary>
		/// Specifies the type of compression for a compressed bottom-up bitmap (top-down DIBs cannot be
		/// compressed).
		/// <list type="table">
		/// <listheader>
		/// <term>Value</term>
		/// <description>Meaning</description>
		/// </listheader>
		/// 
		/// <item>
		/// <term>BI_RGB</term>
		/// <description>An uncompressed format.</description>
		/// </item>
		/// 
		/// <item>
		/// <term>BI_RLE8</term>
		/// <description>A run-length encoded (RLE) format for bitmaps with 8 bpp. The compression format
		/// is a 2-byte format consisting of a count byte followed by a byte containing a color index.
		/// </description>
		/// </item>
		/// 
		/// <item>
		/// <term>BI_RLE4</term>
		/// <description>An RLE format for bitmaps with 4 bpp. The compression format is a 2-byte format
		/// consisting of a count byte followed by two word-length color indexes.</description>
		/// </item>
		/// 
		/// <item>
		/// <term>BI_BITFIELDS</term>
		/// <description>Specifies that the bitmap is not compressed and that the color table consists
		/// of three <b>DWORD</b> color masks that specify the red, green, and blue components, respectively,
		/// of each pixel. This is valid when used with 16- and 32-bpp bitmaps.</description>
		/// </item>
		/// 
		/// <item>
		/// <term>BI_JPEG</term>
		/// <description><b>Windows 98/Me, Windows 2000/XP:</b> Indicates that the image is a JPEG image.
		/// </description>
		/// </item>
		/// 
		/// <item>
		/// <term>BI_PNG</term>
		/// <description><b>Windows 98/Me, Windows 2000/XP:</b> Indicates that the image is a PNG image.
		/// </description>
		/// </item>
		/// 
		/// </list>
		/// </summary>
		public uint biCompression;
		/// <summary>
		/// Specifies the size, in bytes, of the image. This may be set to zero for BI_RGB bitmaps.
		/// <para/>
		/// <b>Windows 98/Me, Windows 2000/XP:</b> If <b>biCompression</b> is BI_JPEG or BI_PNG,
		/// <b>biSizeImage</b> indicates the size of the JPEG or PNG image buffer, respectively.
		/// </summary>
		public uint biSizeImage;
		/// <summary>
		/// Specifies the horizontal resolution, in pixels-per-meter, of the target device for the bitmap.
		/// An application can use this value to select a bitmap from a resource group that best matches
		/// the characteristics of the current device.
		/// </summary>
		public int biXPelsPerMeter;
		/// <summary>
		/// Specifies the vertical resolution, in pixels-per-meter, of the target device for the bitmap.
		/// </summary>
		public int biYPelsPerMeter;
		/// <summary>
		/// Specifies the number of color indexes in the color table that are actually used by the bitmap.
		/// If this value is zero, the bitmap uses the maximum number of colors corresponding to the value
		/// of the biBitCount member for the compression mode specified by <b>biCompression</b>.
		/// <para/>
		/// If <b>iClrUsed</b> is nonzero and the <b>biBitCount</b> member is less than 16, the <b>biClrUsed</b>
		/// member specifies the actual number of colors the graphics engine or device driver accesses.
		/// If <b>biBitCount</b> is 16 or greater, the <b>biClrUsed</b> member specifies the size of the color
		/// table used to optimize performance of the system color palettes. If <b>biBitCount</b> equals 16 or 32,
		/// the optimal color palette starts immediately following the three <b>DWORD</b> masks.
		/// <para/>
		/// When the bitmap array immediately follows the <see cref="BITMAPINFO"/> structure, it is a packed bitmap.
		/// Packed bitmaps are referenced by a single pointer. Packed bitmaps require that the
		/// <b>biClrUsed</b> member must be either zero or the actual size of the color table.
		/// </summary>
		public uint biClrUsed;
		/// <summary>
		/// Specifies the number of color indexes that are required for displaying the bitmap. If this value
		/// is zero, all colors are required.
		/// </summary>
		public uint biClrImportant;

		/// <summary>
		/// Tests whether two specified <see cref="BITMAPINFOHEADER"/> structures are equivalent.
		/// </summary>
		/// <param name="left">The <see cref="BITMAPINFOHEADER"/> that is to the left of the equality operator.</param>
		/// <param name="right">The <see cref="BITMAPINFOHEADER"/> that is to the right of the equality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="BITMAPINFOHEADER"/> structures are equal; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(BITMAPINFOHEADER left, BITMAPINFOHEADER right)
		{
			return ((left.biSize == right.biSize) &&
					(left.biWidth == right.biWidth) &&
					(left.biHeight == right.biHeight) &&
					(left.biPlanes == right.biPlanes) &&
					(left.biBitCount == right.biBitCount) &&
					(left.biCompression == right.biCompression) &&
					(left.biSizeImage == right.biSizeImage) &&
					(left.biXPelsPerMeter == right.biXPelsPerMeter) &&
					(left.biYPelsPerMeter == right.biYPelsPerMeter) &&
					(left.biClrUsed == right.biClrUsed) &&
					(left.biClrImportant == right.biClrImportant));
		}

		/// <summary>
		/// Tests whether two specified <see cref="BITMAPINFOHEADER"/> structures are different.
		/// </summary>
		/// <param name="left">The <see cref="BITMAPINFOHEADER"/> that is to the left of the inequality operator.</param>
		/// <param name="right">The <see cref="BITMAPINFOHEADER"/> that is to the right of the inequality operator.</param>
		/// <returns>
		/// <b>true</b> if the two <see cref="BITMAPINFOHEADER"/> structures are different; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(BITMAPINFOHEADER left, BITMAPINFOHEADER right)
		{
			return !(left == right);
		}

		/// <summary>
		/// Tests whether the specified <see cref="BITMAPINFOHEADER"/> structure is equivalent to this <see cref="BITMAPINFOHEADER"/> structure.
		/// </summary>
		/// <param name="other">A <see cref="BITMAPINFOHEADER"/> structure to compare to this instance.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="BITMAPINFOHEADER"/> structure
		/// equivalent to this <see cref="BITMAPINFOHEADER"/> structure; otherwise, <b>false</b>.</returns>
		public bool Equals(BITMAPINFOHEADER other)
		{
			return (this == other);
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="BITMAPINFOHEADER"/> structure
		/// and is equivalent to this <see cref="BITMAPINFOHEADER"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="BITMAPINFOHEADER"/> structure
		/// equivalent to this <see cref="BITMAPINFOHEADER"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is BITMAPINFOHEADER) && (this == (BITMAPINFOHEADER)obj));
		}

		/// <summary>
		/// Returns a hash code for this <see cref="BITMAPINFOHEADER"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="BITMAPINFOHEADER"/>.</returns>
		public override int GetHashCode()
		{
			return base.GetHashCode();
		}
	}
}