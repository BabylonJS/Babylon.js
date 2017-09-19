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
// $Date: 2009/09/15 11:44:42 $
// $Id: FREE_IMAGE_FORMAT.cs,v 1.2 2009/09/15 11:44:42 cklein05 Exp $
// ==========================================================

namespace FreeImageAPI
{
	/// <summary>
	/// I/O image format identifiers.
	/// </summary>
	public enum FREE_IMAGE_FORMAT
	{
		/// <summary>
		/// Unknown format (returned value only, never use it as input value)
		/// </summary>
		FIF_UNKNOWN = -1,
		/// <summary>
		/// Windows or OS/2 Bitmap File (*.BMP)
		/// </summary>
		FIF_BMP = 0,
		/// <summary>
		/// Windows Icon (*.ICO)
		/// </summary>
		FIF_ICO = 1,
		/// <summary>
		/// Independent JPEG Group (*.JPG, *.JIF, *.JPEG, *.JPE)
		/// </summary>
		FIF_JPEG = 2,
		/// <summary>
		/// JPEG Network Graphics (*.JNG)
		/// </summary>
		FIF_JNG = 3,
		/// <summary>
		/// Commodore 64 Koala format (*.KOA)
		/// </summary>
		FIF_KOALA = 4,
		/// <summary>
		/// Amiga IFF (*.IFF, *.LBM)
		/// </summary>
		FIF_LBM = 5,
		/// <summary>
		/// Amiga IFF (*.IFF, *.LBM)
		/// </summary>
		FIF_IFF = 5,
		/// <summary>
		/// Multiple Network Graphics (*.MNG)
		/// </summary>
		FIF_MNG = 6,
		/// <summary>
		/// Portable Bitmap (ASCII) (*.PBM)
		/// </summary>
		FIF_PBM = 7,
		/// <summary>
		/// Portable Bitmap (BINARY) (*.PBM)
		/// </summary>
		FIF_PBMRAW = 8,
		/// <summary>
		/// Kodak PhotoCD (*.PCD)
		/// </summary>
		FIF_PCD = 9,
		/// <summary>
		/// Zsoft Paintbrush PCX bitmap format (*.PCX)
		/// </summary>
		FIF_PCX = 10,
		/// <summary>
		/// Portable Graymap (ASCII) (*.PGM)
		/// </summary>
		FIF_PGM = 11,
		/// <summary>
		/// Portable Graymap (BINARY) (*.PGM)
		/// </summary>
		FIF_PGMRAW = 12,
		/// <summary>
		/// Portable Network Graphics (*.PNG)
		/// </summary>
		FIF_PNG = 13,
		/// <summary>
		/// Portable Pixelmap (ASCII) (*.PPM)
		/// </summary>
		FIF_PPM = 14,
		/// <summary>
		/// Portable Pixelmap (BINARY) (*.PPM)
		/// </summary>
		FIF_PPMRAW = 15,
		/// <summary>
		/// Sun Rasterfile (*.RAS)
		/// </summary>
		FIF_RAS = 16,
		/// <summary>
		/// truevision Targa files (*.TGA, *.TARGA)
		/// </summary>
		FIF_TARGA = 17,
		/// <summary>
		/// Tagged Image File Format (*.TIF, *.TIFF)
		/// </summary>
		FIF_TIFF = 18,
		/// <summary>
		/// Wireless Bitmap (*.WBMP)
		/// </summary>
		FIF_WBMP = 19,
		/// <summary>
		/// Adobe Photoshop (*.PSD)
		/// </summary>
		FIF_PSD = 20,
		/// <summary>
		/// Dr. Halo (*.CUT)
		/// </summary>
		FIF_CUT = 21,
		/// <summary>
		/// X11 Bitmap Format (*.XBM)
		/// </summary>
		FIF_XBM = 22,
		/// <summary>
		/// X11 Pixmap Format (*.XPM)
		/// </summary>
		FIF_XPM = 23,
		/// <summary>
		/// DirectDraw Surface (*.DDS)
		/// </summary>
		FIF_DDS = 24,
		/// <summary>
		/// Graphics Interchange Format (*.GIF)
		/// </summary>
		FIF_GIF = 25,
		/// <summary>
		/// High Dynamic Range (*.HDR)
		/// </summary>
		FIF_HDR = 26,
		/// <summary>
		/// Raw Fax format CCITT G3 (*.G3)
		/// </summary>
		FIF_FAXG3 = 27,
		/// <summary>
		/// Silicon Graphics SGI image format (*.SGI)
		/// </summary>
		FIF_SGI = 28,
		/// <summary>
		/// OpenEXR format (*.EXR)
		/// </summary>
		FIF_EXR = 29,
		/// <summary>
		/// JPEG-2000 format (*.J2K, *.J2C)
		/// </summary>
		FIF_J2K = 30,
		/// <summary>
		/// JPEG-2000 format (*.JP2)
		/// </summary>
		FIF_JP2 = 31,
		/// <summary>
		/// Portable FloatMap (*.PFM)
		/// </summary>
		FIF_PFM = 32,
		/// <summary>
		/// Macintosh PICT (*.PICT)
		/// </summary>
		FIF_PICT = 33,
		/// <summary>
		/// RAW camera image (*.*)
		/// </summary>
		FIF_RAW = 34,
	}
}