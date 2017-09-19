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
// $Date: 2007/11/28 15:33:38 $
// $Id: FREE_IMAGE_JPEG_OPERATION.cs,v 1.1 2007/11/28 15:33:38 cklein05 Exp $
// ==========================================================

namespace FreeImageAPI
{
	/// <summary>
	/// Lossless JPEG transformations constants used in FreeImage_JPEGTransform.
	/// </summary>
	public enum FREE_IMAGE_JPEG_OPERATION
	{
		/// <summary>
		/// no transformation
		/// </summary>
		FIJPEG_OP_NONE = 0,
		/// <summary>
		/// horizontal flip
		/// </summary>
		FIJPEG_OP_FLIP_H = 1,
		/// <summary>
		/// vertical flip
		/// </summary>
		FIJPEG_OP_FLIP_V = 2,
		/// <summary>
		/// transpose across UL-to-LR axis
		/// </summary>
		FIJPEG_OP_TRANSPOSE = 3,
		/// <summary>
		/// transpose across UR-to-LL axis
		/// </summary>
		FIJPEG_OP_TRANSVERSE = 4,
		/// <summary>
		/// 90-degree clockwise rotation
		/// </summary>
		FIJPEG_OP_ROTATE_90 = 5,
		/// <summary>
		/// 180-degree rotation
		/// </summary>
		FIJPEG_OP_ROTATE_180 = 6,
		/// <summary>
		/// 270-degree clockwise (or 90 ccw)
		/// </summary>
		FIJPEG_OP_ROTATE_270 = 7
	}
}