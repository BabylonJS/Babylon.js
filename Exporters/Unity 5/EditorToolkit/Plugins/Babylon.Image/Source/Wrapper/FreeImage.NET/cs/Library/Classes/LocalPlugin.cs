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
// $Revision: 1.9 $
// $Date: 2009/09/15 11:47:46 $
// $Id: LocalPlugin.cs,v 1.9 2009/09/15 11:47:46 cklein05 Exp $
// ==========================================================

using System;
using System.IO;
using System.Runtime.InteropServices;
using FreeImageAPI.IO;
using System.Diagnostics;

namespace FreeImageAPI.Plugins
{
	/// <summary>
	/// Class representing own FreeImage-Plugins.
	/// </summary>
	/// <remarks>
	/// FreeImages itself is plugin based. Each supported format is integrated by a seperat plugin,
	/// that handles loading, saving, descriptions, identifing ect.
	/// And of course the user can create own plugins and use them in FreeImage.
	/// To do that the above mentioned predefined methodes need to be implemented.
	/// <para/>
	/// The class below handles the creation of such a plugin. The class itself is abstract
	/// as well as some core functions that need to be implemented.
	/// The class can be used to enable or disable the plugin in FreeImage after regististration or
	/// retrieve the formatid, assigned by FreeImage.
	/// The class handles the callback functions, garbage collector and pointer operation to make
	/// the implementation as user friendly as possible.
	/// <para/>
	/// How to:
	/// There are two functions that need to be implemented:
	/// <see cref="FreeImageAPI.Plugins.LocalPlugin.GetImplementedMethods"/> and
	/// <see cref="FreeImageAPI.Plugins.LocalPlugin.FormatProc"/>.
	/// <see cref="FreeImageAPI.Plugins.LocalPlugin.GetImplementedMethods"/> is used by the constructor
	/// of the abstract class. FreeImage wants a list of the implemented functions. Each function is
	/// represented by a function pointer (a .NET <see cref="System.Delegate"/>). In case a function
	/// is not implemented FreeImage receives an empty <b>delegate</b>). To tell the constructor
	/// which functions have been implemented the information is represented by a disjunction of
	/// <see cref="FreeImageAPI.Plugins.LocalPlugin.MethodFlags"/>.
	/// <para/>
	/// For example:
	///		return MethodFlags.LoadProc | MethodFlags.SaveProc;
	/// <para/>
	/// The above statement means that LoadProc and SaveProc have been implemented by the user.
	/// Keep in mind, that each function has a standard implementation that has static return
	/// values that may cause errors if listed in
	/// <see cref="FreeImageAPI.Plugins.LocalPlugin.GetImplementedMethods"/> without a real implementation.
	/// <para/>
	/// <see cref="FreeImageAPI.Plugins.LocalPlugin.FormatProc"/> is used by some checks of FreeImage and
	/// must be implemented. <see cref="FreeImageAPI.Plugins.LocalPlugin.LoadProc"/> for example can be
	/// implemented if the plugin supports reading, but it doesn't have to, the plugin could only
	/// be used to save an already loaded bitmap in a special format.
	/// </remarks>
	public abstract class LocalPlugin
	{
		/// <summary>
		/// Struct containing function pointers.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private Plugin plugin;

		/// <summary>
		/// Delegate for register callback by FreeImage.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private InitProc initProc;

		/// <summary>
		/// The format id assiged to the plugin.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected FREE_IMAGE_FORMAT format = FREE_IMAGE_FORMAT.FIF_UNKNOWN;

		/// <summary>
		/// When true the plugin was registered successfully else false.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected readonly bool registered = false;

		/// <summary>
		/// A copy of the functions used to register.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected readonly MethodFlags implementedMethods;

		/// <summary>
		/// MethodFlags defines values to fill a bitfield telling which
		/// functions have been implemented by a plugin.
		/// </summary>
		[Flags]
		protected enum MethodFlags
		{
			/// <summary>
			/// No mothods implemented.
			/// </summary>
			None = 0x0,

			/// <summary>
			/// DescriptionProc has been implemented.
			/// </summary>
			DescriptionProc = 0x1,

			/// <summary>
			/// ExtensionListProc has been implemented.
			/// </summary>
			ExtensionListProc = 0x2,

			/// <summary>
			/// RegExprProc has been implemented.
			/// </summary>
			RegExprProc = 0x4,

			/// <summary>
			/// OpenProc has been implemented.
			/// </summary>
			OpenProc = 0x8,

			/// <summary>
			/// CloseProc has been implemented.
			/// </summary>
			CloseProc = 0x10,

			/// <summary>
			/// PageCountProc has been implemented.
			/// </summary>
			PageCountProc = 0x20,

			/// <summary>
			/// PageCapabilityProc has been implemented.
			/// </summary>
			PageCapabilityProc = 0x40,

			/// <summary>
			/// LoadProc has been implemented.
			/// </summary>
			LoadProc = 0x80,

			/// <summary>
			/// SaveProc has been implemented.
			/// </summary>
			SaveProc = 0x100,

			/// <summary>
			/// ValidateProc has been implemented.
			/// </summary>
			ValidateProc = 0x200,

			/// <summary>
			/// MimeProc has been implemented.
			/// </summary>
			MimeProc = 0x400,

			/// <summary>
			/// SupportsExportBPPProc has been implemented.
			/// </summary>
			SupportsExportBPPProc = 0x800,

			/// <summary>
			/// SupportsExportTypeProc has been implemented.
			/// </summary>
			SupportsExportTypeProc = 0x1000,

			/// <summary>
			/// SupportsICCProfilesProc has been implemented.
			/// </summary>
			SupportsICCProfilesProc = 0x2000
		}

		// Functions that must be implemented.

		/// <summary>
		/// Function that returns a bitfield containing the
		/// implemented methods.
		/// </summary>
		/// <returns>Bitfield of the implemented methods.</returns>
		protected abstract MethodFlags GetImplementedMethods();

		/// <summary>
		/// Implementation of <b>FormatProc</b>
		/// </summary>
		/// <returns>A string containing the plugins format.</returns>
		protected abstract string FormatProc();

		// Functions that can be implemented.

		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual string DescriptionProc() { return ""; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual string ExtensionListProc() { return ""; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual string RegExprProc() { return ""; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual IntPtr OpenProc(ref FreeImageIO io, fi_handle handle, bool read) { return IntPtr.Zero; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual void CloseProc(ref FreeImageIO io, fi_handle handle, IntPtr data) { }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual int PageCountProc(ref FreeImageIO io, fi_handle handle, IntPtr data) { return 0; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual int PageCapabilityProc(ref FreeImageIO io, fi_handle handle, IntPtr data) { return 0; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual FIBITMAP LoadProc(ref FreeImageIO io, fi_handle handle, int page, int flags, IntPtr data) { return FIBITMAP.Zero; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual bool SaveProc(ref FreeImageIO io, FIBITMAP dib, fi_handle handle, int page, int flags, IntPtr data) { return false; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual bool ValidateProc(ref FreeImageIO io, fi_handle handle) { return false; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual string MimeProc() { return ""; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual bool SupportsExportBPPProc(int bpp) { return false; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual bool SupportsExportTypeProc(FREE_IMAGE_TYPE type) { return false; }
		/// <summary>
		/// Function that can be implemented.
		/// </summary>
		protected virtual bool SupportsICCProfilesProc() { return false; }

		/// <summary>
		/// The constructor automatically registeres the plugin in FreeImage.
		/// To do this it prepares a FreeImage defined structure with function pointers
		/// to the implemented functions or null if not implemented.
		/// Before registing the functions they are pinned in memory so the garbage collector
		/// can't move them around in memory after we passed there addresses to FreeImage.
		/// </summary>
		public LocalPlugin()
		{
			implementedMethods = GetImplementedMethods();

			if ((implementedMethods & MethodFlags.DescriptionProc) != 0)
			{
				plugin.descriptionProc = new DescriptionProc(DescriptionProc);
			}
			if ((implementedMethods & MethodFlags.ExtensionListProc) != 0)
			{
				plugin.extensionListProc = new ExtensionListProc(ExtensionListProc);
			}
			if ((implementedMethods & MethodFlags.RegExprProc) != 0)
			{
				plugin.regExprProc = new RegExprProc(RegExprProc);
			}
			if ((implementedMethods & MethodFlags.OpenProc) != 0)
			{
				plugin.openProc = new OpenProc(OpenProc);
			}
			if ((implementedMethods & MethodFlags.CloseProc) != 0)
			{
				plugin.closeProc = new CloseProc(CloseProc);
			}
			if ((implementedMethods & MethodFlags.PageCountProc) != 0)
			{
				plugin.pageCountProc = new PageCountProc(PageCountProc);
			}
			if ((implementedMethods & MethodFlags.PageCapabilityProc) != 0)
			{
				plugin.pageCapabilityProc = new PageCapabilityProc(PageCapabilityProc);
			}
			if ((implementedMethods & MethodFlags.LoadProc) != 0)
			{
				plugin.loadProc = new LoadProc(LoadProc);
			}
			if ((implementedMethods & MethodFlags.SaveProc) != 0)
			{
				plugin.saveProc = new SaveProc(SaveProc);
			}
			if ((implementedMethods & MethodFlags.ValidateProc) != 0)
			{
				plugin.validateProc = new ValidateProc(ValidateProc);
			}
			if ((implementedMethods & MethodFlags.MimeProc) != 0)
			{
				plugin.mimeProc = new MimeProc(MimeProc);
			}
			if ((implementedMethods & MethodFlags.SupportsExportBPPProc) != 0)
			{
				plugin.supportsExportBPPProc = new SupportsExportBPPProc(SupportsExportBPPProc);
			}
			if ((implementedMethods & MethodFlags.SupportsExportTypeProc) != 0)
			{
				plugin.supportsExportTypeProc = new SupportsExportTypeProc(SupportsExportTypeProc);
			}
			if ((implementedMethods & MethodFlags.SupportsICCProfilesProc) != 0)
			{
				plugin.supportsICCProfilesProc = new SupportsICCProfilesProc(SupportsICCProfilesProc);
			}

			// FormatProc is always implemented
			plugin.formatProc = new FormatProc(FormatProc);

			// InitProc is the register call back.
			initProc = new InitProc(RegisterProc);

			// Register the plugin. The result will be saved and can be accessed later.
			registered = FreeImage.RegisterLocalPlugin(initProc, null, null, null, null) != FREE_IMAGE_FORMAT.FIF_UNKNOWN;
			if (registered)
			{
				PluginRepository.RegisterLocalPlugin(this);
			}
		}

		private void RegisterProc(ref Plugin plugin, int format_id)
		{
			// Copy the function pointers
			plugin = this.plugin;
			// Retrieve the format if assigned to this plugin by FreeImage.
			format = (FREE_IMAGE_FORMAT)format_id;
		}

		/// <summary>
		/// Gets or sets if the plugin is enabled.
		/// </summary>
		public bool Enabled
		{
			get
			{
				if (registered)
				{
					return (FreeImage.IsPluginEnabled(format) > 0);
				}
				else
				{
					throw new ObjectDisposedException("plugin not registered");
				}
			}
			set
			{
				if (registered)
				{
					FreeImage.SetPluginEnabled(format, value);
				}
				else
				{
					throw new ObjectDisposedException("plugin not registered");
				}
			}
		}

		/// <summary>
		/// Gets if the plugin was registered successfully.
		/// </summary>
		public bool Registered
		{
			get { return registered; }
		}

		/// <summary>
		/// Gets the <see cref="FREE_IMAGE_FORMAT"/> FreeImage assigned to this plugin.
		/// </summary>
		public FREE_IMAGE_FORMAT Format
		{
			get
			{
				return format;
			}
		}

		/// <summary>
		/// Reads from an unmanaged stream.
		/// </summary>
		protected unsafe int Read(FreeImageIO io, fi_handle handle, uint size, uint count, ref byte[] buffer)
		{
			fixed (byte* ptr = buffer)
			{
				return (int)io.readProc(new IntPtr(ptr), size, count, handle);
			}
		}

		/// <summary>
		/// Reads a single byte from an unmanaged stream.
		/// </summary>
		protected unsafe int ReadByte(FreeImageIO io, fi_handle handle)
		{
			byte buffer = 0;
			return (int)io.readProc(new IntPtr(&buffer), 1, 1, handle) > 0 ? buffer : -1;
		}

		/// <summary>
		/// Writes to an unmanaged stream.
		/// </summary>
		protected unsafe int Write(FreeImageIO io, fi_handle handle, uint size, uint count, ref byte[] buffer)
		{
			fixed (byte* ptr = buffer)
			{
				return (int)io.writeProc(new IntPtr(ptr), size, count, handle);
			}
		}

		/// <summary>
		/// Writes a single byte to an unmanaged stream.
		/// </summary>
		protected unsafe int WriteByte(FreeImageIO io, fi_handle handle, byte value)
		{
			return (int)io.writeProc(new IntPtr(&value), 1, 1, handle);
		}

		/// <summary>
		/// Seeks in an unmanaged stream.
		/// </summary>
		protected int Seek(FreeImageIO io, fi_handle handle, int offset, SeekOrigin origin)
		{
			return io.seekProc(handle, offset, origin);
		}

		/// <summary>
		/// Retrieves the position of an unmanaged stream.
		/// </summary>
		protected int Tell(FreeImageIO io, fi_handle handle)
		{
			return io.tellProc(handle);
		}
	}
}