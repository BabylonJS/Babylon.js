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
// $Id: FREE_IMAGE_DITHER.cs,v 1.1 2007/11/28 15:33:40 cklein05 Exp $
// ==========================================================

namespace FreeImageAPI
{
	/// <summary>
	/// Dithering algorithms.
	/// Constants used in FreeImage_Dither.
	/// </summary>
	public enum FREE_IMAGE_DITHER
	{
		/// <summary>
		/// Floyd and Steinberg error diffusion
		/// </summary>
		FID_FS = 0,
		/// <summary>
		/// Bayer ordered dispersed dot dithering (order 2 dithering matrix)
		/// </summary>
		FID_BAYER4x4 = 1,
		/// <summary>
		/// Bayer ordered dispersed dot dithering (order 3 dithering matrix)
		/// </summary>
		FID_BAYER8x8 = 2,
		/// <summary>
		/// Ordered clustered dot dithering (order 3 - 6x6 matrix)
		/// </summary>
		FID_CLUSTER6x6 = 3,
		/// <summary>
		/// Ordered clustered dot dithering (order 4 - 8x8 matrix)
		/// </summary>
		FID_CLUSTER8x8 = 4,
		/// <summary>
		/// Ordered clustered dot dithering (order 8 - 16x16 matrix)
		/// </summary>
		FID_CLUSTER16x16 = 5,
		/// <summary>
		/// Bayer ordered dispersed dot dithering (order 4 dithering matrix)
		/// </summary>
		FID_BAYER16x16 = 6
	}
}