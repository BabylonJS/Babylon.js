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
// $Date: 2011/12/22 14:53:28 $
// $Id: FREE_IMAGE_SAVE_FLAGS.cs,v 1.3 2011/12/22 14:53:28 drolon Exp $
// ==========================================================

namespace FreeImageAPI
{
	/// <summary>
	/// Flags used in save functions.
	/// </summary>
	[System.Flags]
	public enum FREE_IMAGE_SAVE_FLAGS
	{
		/// <summary>
		/// Default option for all types.
		/// </summary>
		DEFAULT = 0,
		/// <summary>
		/// Save with run length encoding.
		/// </summary>
		BMP_SAVE_RLE = 1,
		/// <summary>
		/// Save data as float instead of as half (not recommended).
		/// </summary>
		EXR_FLOAT = 0x0001,
		/// <summary>
		/// Save with no compression.
		/// </summary>
		EXR_NONE = 0x0002,
		/// <summary>
		/// Save with zlib compression, in blocks of 16 scan lines.
		/// </summary>
		EXR_ZIP = 0x0004,
		/// <summary>
		/// Save with piz-based wavelet compression.
		/// </summary>
		EXR_PIZ = 0x0008,
		/// <summary>
		/// Save with lossy 24-bit float compression.
		/// </summary>
		EXR_PXR24 = 0x0010,
		/// <summary>
		/// Save with lossy 44% float compression - goes to 22% when combined with EXR_LC.
		/// </summary>
		EXR_B44 = 0x0020,
		/// <summary>
		/// Save images with one luminance and two chroma channels, rather than as RGB (lossy compression).
		/// </summary>
		EXR_LC = 0x0040,
		/// <summary>
		/// Save with superb quality (100:1).
		/// </summary>
		JPEG_QUALITYSUPERB = 0x80,
		/// <summary>
		/// Save with good quality (75:1).
		/// </summary>
		JPEG_QUALITYGOOD = 0x0100,
		/// <summary>
		/// Save with normal quality (50:1).
		/// </summary>
		JPEG_QUALITYNORMAL = 0x0200,
		/// <summary>
		/// Save with average quality (25:1).
		/// </summary>
		JPEG_QUALITYAVERAGE = 0x0400,
		/// <summary>
		/// Save with bad quality (10:1).
		/// </summary>
		JPEG_QUALITYBAD = 0x0800,
		/// <summary>
		/// Save as a progressive-JPEG (use | to combine with other save flags).
		/// </summary>
		JPEG_PROGRESSIVE = 0x2000,
		/// <summary>
		/// Save with high 4x1 chroma subsampling (4:1:1).
		/// </summary>
		JPEG_SUBSAMPLING_411 = 0x1000,
		/// <summary>
		/// Save with medium 2x2 medium chroma (4:2:0).
		/// </summary>
		JPEG_SUBSAMPLING_420 = 0x4000,
		/// <summary>
		/// Save with low 2x1 chroma subsampling (4:2:2).
		/// </summary>
		JPEG_SUBSAMPLING_422 = 0x8000,
		/// <summary>
		/// Save with no chroma subsampling (4:4:4).
		/// </summary>
		JPEG_SUBSAMPLING_444 = 0x10000,
        /// <summary>
        /// On saving, compute optimal Huffman coding tables (can reduce a few percent of file size).
        /// </summary>
        JPEG_OPTIMIZE = 0x20000,
        /// <summary>
        /// save basic JPEG, without metadata or any markers.
        /// </summary>
        JPEG_BASELINE = 0x40000,
		/// <summary>
		/// Save using ZLib level 1 compression flag
		/// (default value is <see cref="PNG_Z_DEFAULT_COMPRESSION"/>).
		/// </summary>
		PNG_Z_BEST_SPEED = 0x0001,
		/// <summary>
		/// Save using ZLib level 6 compression flag (default recommended value).
		/// </summary>
		PNG_Z_DEFAULT_COMPRESSION = 0x0006,
		/// <summary>
		/// save using ZLib level 9 compression flag
		/// (default value is <see cref="PNG_Z_DEFAULT_COMPRESSION"/>).
		/// </summary>
		PNG_Z_BEST_COMPRESSION = 0x0009,
		/// <summary>
		/// Save without ZLib compression.
		/// </summary>
		PNG_Z_NO_COMPRESSION = 0x0100,
		/// <summary>
		/// Save using Adam7 interlacing (use | to combine with other save flags).
		/// </summary>
		PNG_INTERLACED = 0x0200,
		/// <summary>
		/// If set the writer saves in ASCII format (i.e. P1, P2 or P3).
		/// </summary>
		PNM_SAVE_ASCII = 1,
		/// <summary>
		/// Stores tags for separated CMYK (use | to combine with compression flags).
		/// </summary>
		TIFF_CMYK = 0x0001,
		/// <summary>
		/// Save using PACKBITS compression.
		/// </summary>
		TIFF_PACKBITS = 0x0100,
		/// <summary>
		/// Save using DEFLATE compression (a.k.a. ZLIB compression).
		/// </summary>
		TIFF_DEFLATE = 0x0200,
		/// <summary>
		/// Save using ADOBE DEFLATE compression.
		/// </summary>
		TIFF_ADOBE_DEFLATE = 0x0400,
		/// <summary>
		/// Save without any compression.
		/// </summary>
		TIFF_NONE = 0x0800,
		/// <summary>
		/// Save using CCITT Group 3 fax encoding.
		/// </summary>
		TIFF_CCITTFAX3 = 0x1000,
		/// <summary>
		/// Save using CCITT Group 4 fax encoding.
		/// </summary>
		TIFF_CCITTFAX4 = 0x2000,
		/// <summary>
		/// Save using LZW compression.
		/// </summary>
		TIFF_LZW = 0x4000,
		/// <summary>
		/// Save using JPEG compression.
		/// </summary>
		TIFF_JPEG = 0x8000
	}
}