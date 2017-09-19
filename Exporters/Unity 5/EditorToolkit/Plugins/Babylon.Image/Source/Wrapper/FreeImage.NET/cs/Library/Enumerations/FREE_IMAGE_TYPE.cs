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
// $Revision: 1.1 $
// $Date: 2007/11/28 15:33:40 $
// $Id: FREE_IMAGE_TYPE.cs,v 1.1 2007/11/28 15:33:40 cklein05 Exp $
// ==========================================================

namespace FreeImageAPI
{
	/// <summary>
	/// Image types used in FreeImage.
	/// </summary>
	public enum FREE_IMAGE_TYPE
	{
		/// <summary>
		/// unknown type
		/// </summary>
		FIT_UNKNOWN = 0,
		/// <summary>
		/// standard image : 1-, 4-, 8-, 16-, 24-, 32-bit
		/// </summary>
		FIT_BITMAP = 1,
		/// <summary>
		/// array of unsigned short : unsigned 16-bit
		/// </summary>
		FIT_UINT16 = 2,
		/// <summary>
		/// array of short : signed 16-bit
		/// </summary>
		FIT_INT16 = 3,
		/// <summary>
		/// array of unsigned long : unsigned 32-bit
		/// </summary>
		FIT_UINT32 = 4,
		/// <summary>
		/// array of long : signed 32-bit
		/// </summary>
		FIT_INT32 = 5,
		/// <summary>
		/// array of float : 32-bit IEEE floating point
		/// </summary>
		FIT_FLOAT = 6,
		/// <summary>
		/// array of double : 64-bit IEEE floating point
		/// </summary>
		FIT_DOUBLE = 7,
		/// <summary>
		/// array of FICOMPLEX : 2 x 64-bit IEEE floating point
		/// </summary>
		FIT_COMPLEX = 8,
		/// <summary>
		/// 48-bit RGB image : 3 x 16-bit
		/// </summary>
		FIT_RGB16 = 9,
		/// <summary>
		/// 64-bit RGBA image : 4 x 16-bit
		/// </summary>
		FIT_RGBA16 = 10,
		/// <summary>
		/// 96-bit RGB float image : 3 x 32-bit IEEE floating point
		/// </summary>
		FIT_RGBF = 11,
		/// <summary>
		/// 128-bit RGBA float image : 4 x 32-bit IEEE floating point
		/// </summary>
		FIT_RGBAF = 12
	}
}