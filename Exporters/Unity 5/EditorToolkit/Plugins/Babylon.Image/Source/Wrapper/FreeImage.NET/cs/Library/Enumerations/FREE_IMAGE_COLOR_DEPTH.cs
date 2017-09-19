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
// $Id: FREE_IMAGE_COLOR_DEPTH.cs,v 1.1 2007/11/28 15:33:39 cklein05 Exp $
// ==========================================================

namespace FreeImageAPI
{
	/// <summary>
	/// Enumeration used for color conversions.
	/// FREE_IMAGE_COLOR_DEPTH contains several colors to convert to.
	/// The default value 'FICD_AUTO'.
	/// </summary>
	[System.Flags]
	public enum FREE_IMAGE_COLOR_DEPTH
	{
		/// <summary>
		/// Unknown.
		/// </summary>
		FICD_UNKNOWN = 0,
		/// <summary>
		/// Auto selected by the used algorithm.
		/// </summary>
		FICD_AUTO = FICD_UNKNOWN,
		/// <summary>
		/// 1-bit.
		/// </summary>
		FICD_01_BPP = 1,
		/// <summary>
		/// 1-bit using dithering.
		/// </summary>
		FICD_01_BPP_DITHER = FICD_01_BPP,
		/// <summary>
		/// 1-bit using threshold.
		/// </summary>
		FICD_01_BPP_THRESHOLD = FICD_01_BPP | 2,
		/// <summary>
		/// 4-bit.
		/// </summary>
		FICD_04_BPP = 4,
		/// <summary>
		/// 8-bit.
		/// </summary>
		FICD_08_BPP = 8,
		/// <summary>
		/// 16-bit 555 (1 bit remains unused).
		/// </summary>
		FICD_16_BPP_555 = FICD_16_BPP | 2,
		/// <summary>
		/// 16-bit 565 (all bits are used).
		/// </summary>
		FICD_16_BPP = 16,
		/// <summary>
		/// 24-bit.
		/// </summary>
		FICD_24_BPP = 24,
		/// <summary>
		/// 32-bit.
		/// </summary>
		FICD_32_BPP = 32,
		/// <summary>
		/// Reorder palette (make it linear). Only affects 1-, 4- and 8-bit images.
		/// <para>The palette is only reordered in case the image is greyscale
		/// (all palette entries have the same red, green and blue value).</para>
		/// </summary>
		FICD_REORDER_PALETTE = 1024,
		/// <summary>
		/// Converts the image to greyscale.
		/// </summary>
		FICD_FORCE_GREYSCALE = 2048,
		/// <summary>
		/// Flag to mask out all non color depth flags.
		/// </summary>
		FICD_COLOR_MASK = FICD_01_BPP | FICD_04_BPP | FICD_08_BPP | FICD_16_BPP | FICD_24_BPP | FICD_32_BPP
	}
}