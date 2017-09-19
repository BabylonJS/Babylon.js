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
// $Date: 2008/06/17 13:49:23 $
// $Id: FreeImageIO.cs,v 1.3 2008/06/17 13:49:23 cklein05 Exp $
// ==========================================================

using System.Runtime.InteropServices;

namespace FreeImageAPI.IO
{
	/// <summary>
	/// Structure for implementing access to custom handles.
	/// </summary>
	[StructLayout(LayoutKind.Sequential)]
	public struct FreeImageIO
	{
		/// <summary>
		/// Delegate to the C++ function <b>fread</b>.
		/// </summary>
		public ReadProc readProc;

		/// <summary>
		/// Delegate to the C++ function <b>fwrite</b>.
		/// </summary>
		public WriteProc writeProc;

		/// <summary>
		/// Delegate to the C++ function <b>fseek</b>.
		/// </summary>
		public SeekProc seekProc;

		/// <summary>
		/// Delegate to the C++ function <b>ftell</b>.
		/// </summary>
		public TellProc tellProc;
	}
}