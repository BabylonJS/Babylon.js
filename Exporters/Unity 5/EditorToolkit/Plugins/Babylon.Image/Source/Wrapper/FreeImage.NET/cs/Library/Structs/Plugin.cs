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
// $Date: 2008/06/17 13:48:22 $
// $Id: Plugin.cs,v 1.3 2008/06/17 13:48:22 cklein05 Exp $
// ==========================================================

using System;
using System.Runtime.InteropServices;
using FreeImageAPI.Plugins;

namespace FreeImageAPI.Plugins
{
	/// <summary>
	/// The structure contains functionpointers that make up a FreeImage plugin.
	/// </summary>
	[Serializable, StructLayout(LayoutKind.Sequential)]
	public struct Plugin
	{
		/// <summary>
		/// Delegate to a function that returns a string which describes
		/// the plugins format.
		/// </summary>
		public FormatProc formatProc;

		/// <summary>
		/// Delegate to a function that returns a string which contains
		/// a more detailed description.
		/// </summary>
		public DescriptionProc descriptionProc;

		/// <summary>
		/// Delegate to a function that returns a comma seperated list
		/// of file extensions the plugin can read or write.
		/// </summary>
		public ExtensionListProc extensionListProc;

		/// <summary>
		/// Delegate to a function that returns a regular expression that
		/// can be used to idientify whether a file can be handled by the plugin.
		/// </summary>
		public RegExprProc regExprProc;

		/// <summary>
		/// Delegate to a function that opens a file.
		/// </summary>
		public OpenProc openProc;

		/// <summary>
		/// Delegate to a function that closes a previosly opened file.
		/// </summary>
		public CloseProc closeProc;

		/// <summary>
		/// Delegate to a function that returns the number of pages of a multipage
		/// bitmap if the plugin is capable of handling multipage bitmaps.
		/// </summary>
		public PageCountProc pageCountProc;

		/// <summary>
		/// UNKNOWN
		/// </summary>
		public PageCapabilityProc pageCapabilityProc;

		/// <summary>
		/// Delegate to a function that loads and decodes a bitmap into memory.
		/// </summary>
		public LoadProc loadProc;

		/// <summary>
		///  Delegate to a function that saves a bitmap.
		/// </summary>
		public SaveProc saveProc;

		/// <summary>
		/// Delegate to a function that determines whether the source is a valid image.
		/// </summary>
		public ValidateProc validateProc;

		/// <summary>
		/// Delegate to a function that returns a string which contains
		/// the plugin's mime type.
		/// </summary>
		public MimeProc mimeProc;

		/// <summary>
		/// Delegate to a function that returns whether the plugin can handle the
		/// specified color depth.
		/// </summary>
		public SupportsExportBPPProc supportsExportBPPProc;

		/// <summary>
		/// Delegate to a function that returns whether the plugin can handle the
		/// specified image type.
		/// </summary>
		public SupportsExportTypeProc supportsExportTypeProc;

		/// <summary>
		/// Delegate to a function that returns whether the plugin can handle
		/// ICC-Profiles.
		/// </summary>
		public SupportsICCProfilesProc supportsICCProfilesProc;
	}
}