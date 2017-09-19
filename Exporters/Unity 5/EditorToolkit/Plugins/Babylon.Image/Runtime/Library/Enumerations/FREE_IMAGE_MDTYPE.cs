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
// $Id: FREE_IMAGE_MDTYPE.cs,v 1.1 2007/11/28 15:33:39 cklein05 Exp $
// ==========================================================

namespace FreeImageAPI
{
	/// <summary>
	/// Tag data type information (based on TIFF specifications)
	/// Note: RATIONALs are the ratio of two 32-bit integer values.
	/// </summary>
	public enum FREE_IMAGE_MDTYPE
	{
		/// <summary>
		/// placeholder
		/// </summary>
		FIDT_NOTYPE = 0,
		/// <summary>
		/// 8-bit unsigned integer
		/// </summary>
		FIDT_BYTE = 1,
		/// <summary>
		/// 8-bit bytes w/ last byte null
		/// </summary>
		FIDT_ASCII = 2,
		/// <summary>
		/// 16-bit unsigned integer
		/// </summary>
		FIDT_SHORT = 3,
		/// <summary>
		/// 32-bit unsigned integer
		/// </summary>
		FIDT_LONG = 4,
		/// <summary>
		/// 64-bit unsigned fraction
		/// </summary>
		FIDT_RATIONAL = 5,
		/// <summary>
		/// 8-bit signed integer
		/// </summary>
		FIDT_SBYTE = 6,
		/// <summary>
		/// 8-bit untyped data
		/// </summary>
		FIDT_UNDEFINED = 7,
		/// <summary>
		/// 16-bit signed integer
		/// </summary>
		FIDT_SSHORT = 8,
		/// <summary>
		/// 32-bit signed integer
		/// </summary>
		FIDT_SLONG = 9,
		/// <summary>
		/// 64-bit signed fraction
		/// </summary>
		FIDT_SRATIONAL = 10,
		/// <summary>
		/// 32-bit IEEE floating point
		/// </summary>
		FIDT_FLOAT = 11,
		/// <summary>
		/// 64-bit IEEE floating point
		/// </summary>
		FIDT_DOUBLE = 12,
		/// <summary>
		/// 32-bit unsigned integer (offset)
		/// </summary>
		FIDT_IFD = 13,
		/// <summary>
		/// 32-bit RGBQUAD
		/// </summary>
		FIDT_PALETTE = 14
	}
}