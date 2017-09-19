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
// $Date: 2007/11/28 15:33:39 $
// $Id: FREE_IMAGE_FILTER.cs,v 1.1 2007/11/28 15:33:39 cklein05 Exp $
// ==========================================================

namespace FreeImageAPI
{
	/// <summary>
	/// Upsampling / downsampling filters. Constants used in FreeImage_Rescale.
	/// </summary>
	public enum FREE_IMAGE_FILTER
	{
		/// <summary>
		/// Box, pulse, Fourier window, 1st order (constant) b-spline
		/// </summary>
		FILTER_BOX = 0,
		/// <summary>
		/// Mitchell and Netravali's two-param cubic filter
		/// </summary>
		FILTER_BICUBIC = 1,
		/// <summary>
		/// Bilinear filter
		/// </summary>
		FILTER_BILINEAR = 2,
		/// <summary>
		/// 4th order (cubic) b-spline
		/// </summary>
		FILTER_BSPLINE = 3,
		/// <summary>
		/// Catmull-Rom spline, Overhauser spline
		/// </summary>
		FILTER_CATMULLROM = 4,
		/// <summary>
		/// Lanczos3 filter
		/// </summary>
		FILTER_LANCZOS3 = 5
	}
}