using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;

namespace FreeImageAPI.Plugins
{
	/// <summary>
	/// Class representing all registered <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/> in FreeImage.
	/// </summary>
	public static class PluginRepository
	{
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private static readonly List<FreeImagePlugin> plugins = null;
		
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private static readonly List<FreeImagePlugin> localPlugins = null;

		static PluginRepository()
		{
			plugins = new List<FreeImagePlugin>(FreeImage.GetFIFCount());
			localPlugins = new List<FreeImagePlugin>(0);
			for (int i = 0; i < plugins.Capacity; i++)
			{
				plugins.Add(new FreeImagePlugin((FREE_IMAGE_FORMAT)i));
			}
		}

		/// <summary>
		/// Adds local plugin to this class.
		/// </summary>
		/// <param name="localPlugin">The registered plugin.</param>
		internal static void RegisterLocalPlugin(LocalPlugin localPlugin)
		{
			FreeImagePlugin plugin = new FreeImagePlugin(localPlugin.Format);
			plugins.Add(plugin);
			localPlugins.Add(plugin);
		}

		/// <summary>
		/// Returns an instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/>, representing the given format.
		/// </summary>
		/// <param name="fif">The representing format.</param>
		/// <returns>An instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/>.</returns>
		public static FreeImagePlugin Plugin(FREE_IMAGE_FORMAT fif)
		{
			return Plugin((int)fif);
		}

		/// <summary>
		/// Returns an instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/>,
		/// representing the format at the given index.
		/// </summary>
		/// <param name="index">The index of the representing format.</param>
		/// <returns>An instance of <see cref="FreeImagePlugin"/>.</returns>
		public static FreeImagePlugin Plugin(int index)
		{
			return (index >= 0) ? plugins[index] : null;
		}

		/// <summary>
		/// Returns an instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/>.
		/// <typeparamref name="expression"/> is searched in:
		/// <c>Format</c>, <c>RegExpr</c>,
		/// <c>ValidExtension</c> and <c>ValidFilename</c>.
		/// </summary>
		/// <param name="expression">The expression to search for.</param>
		/// <returns>An instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/>.</returns>
		public static FreeImagePlugin Plugin(string expression)
		{
			FreeImagePlugin result = null;
			expression = expression.ToLower();

			foreach (FreeImagePlugin plugin in plugins)
			{
				if (plugin.Format.ToLower().Contains(expression) ||
					plugin.RegExpr.ToLower().Contains(expression) ||
					plugin.ValidExtension(expression, StringComparison.CurrentCultureIgnoreCase) ||
					plugin.ValidFilename(expression, StringComparison.CurrentCultureIgnoreCase))
				{
					result = plugin;
					break;
				}
			}

			return result;
		}

		/// <summary>
		/// Returns an instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/> for the given format.
		/// </summary>
		/// <param name="format">The format of the Plugin.</param>
		/// <returns>An instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/>.</returns>
		public static FreeImagePlugin PluginFromFormat(string format)
		{
			return Plugin(FreeImage.GetFIFFromFormat(format));
		}

		/// <summary>
		/// Returns an instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/> for the given filename.
		/// </summary>
		/// <param name="filename">The valid filename for the plugin.</param>
		/// <returns>An instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/>.</returns>
		public static FreeImagePlugin PluginFromFilename(string filename)
		{
			return Plugin(FreeImage.GetFIFFromFilename(filename));
		}

		/// <summary>
		/// Returns an instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/> for the given mime.
		/// </summary>
		/// <param name="mime">The valid mime for the plugin.</param>
		/// <returns>An instance of <see cref="FreeImageAPI.Plugins.FreeImagePlugin"/>.</returns>
		public static FreeImagePlugin PluginFromMime(string mime)
		{
			return Plugin(FreeImage.GetFIFFromMime(mime));
		}

		/// <summary>
		/// Gets the number of registered plugins.
		/// </summary>
		public static int FIFCount
		{
			get
			{
				return FreeImage.GetFIFCount();
			}
		}

		/// <summary>
		/// Gets a readonly collection of all plugins.
		/// </summary>
		public static ReadOnlyCollection<FreeImagePlugin> PluginList
		{
			get
			{
				return plugins.AsReadOnly();
			}
		}

		/// <summary>
		/// Gets a list of plugins that are only able to
		/// read but not to write.
		/// </summary>
		public static List<FreeImagePlugin> ReadOnlyPlugins
		{
			get
			{
				List<FreeImagePlugin> list = new List<FreeImagePlugin>();
				foreach (FreeImagePlugin p in plugins)
				{
					if (p.SupportsReading && !p.SupportsWriting) 
					{
						list.Add(p); 
					}
				}
				return list;
			}
		}

		/// <summary>
		/// Gets a list of plugins that are only able to
		/// write but not to read.
		/// </summary>
		public static List<FreeImagePlugin> WriteOnlyPlugins
		{
			get
			{
				List<FreeImagePlugin> list = new List<FreeImagePlugin>();
				foreach (FreeImagePlugin p in plugins)
				{
					if (!p.SupportsReading && p.SupportsWriting)
					{
						list.Add(p);
					}
				}
				return list;
			}
		}

		/// <summary>
		/// Gets a list of plugins that are not able to
		/// read or write.
		/// </summary>
		public static List<FreeImagePlugin> StupidPlugins
		{
			get
			{
				List<FreeImagePlugin> list = new List<FreeImagePlugin>();
				foreach (FreeImagePlugin p in plugins)
				{
					if (!p.SupportsReading && !p.SupportsWriting)
					{
						list.Add(p);
					}
				}
				return list;
			}
		}

		/// <summary>
		/// Gets a list of plugins that are able to read.
		/// </summary>
		public static List<FreeImagePlugin> ReadablePlugins
		{
			get
			{
				List<FreeImagePlugin> list = new List<FreeImagePlugin>();
				foreach (FreeImagePlugin p in plugins)
				{
					if (p.SupportsReading)
					{
						list.Add(p);
					}
				}
				return list;
			}
		}

		/// <summary>
		/// Gets a list of plugins that are able to write.
		/// </summary>
		public static List<FreeImagePlugin> WriteablePlugins
		{
			get
			{
				List<FreeImagePlugin> list = new List<FreeImagePlugin>();
				foreach (FreeImagePlugin p in plugins)
				{
					if (p.SupportsWriting)
					{
						list.Add(p);
					}
				}
				return list;
			}
		}

		/// <summary>
		/// Gets a list of local plugins.
		/// </summary>
		public static ReadOnlyCollection<FreeImagePlugin> LocalPlugins
		{
			get
			{
				return localPlugins.AsReadOnly();  
			}
		}

		/// <summary>
		/// Gets a list of built-in plugins.
		/// </summary>
		public static List<FreeImagePlugin> BuiltInPlugins
		{
			get
			{
				List<FreeImagePlugin> list = new List<FreeImagePlugin>();
				foreach (FreeImagePlugin p in plugins)
				{
					if (!localPlugins.Contains(p))
					{
						list.Add(p);
					}
				}
				return list;
			}
		}
		
		/// <summary>
		/// Windows or OS/2 Bitmap File (*.BMP)
		/// </summary>
		public static FreeImagePlugin BMP { get { return plugins[0]; } }

		/// <summary>
		/// Independent JPEG Group (*.JPG, *.JIF, *.JPEG, *.JPE)
		/// </summary>
		public static FreeImagePlugin ICO { get { return plugins[1]; } }

		/// <summary>
		/// Independent JPEG Group (*.JPG, *.JIF, *.JPEG, *.JPE)
		/// </summary>
		public static FreeImagePlugin JPEG { get { return plugins[2]; } }

		/// <summary>
		/// JPEG Network Graphics (*.JNG)
		/// </summary>
		public static FreeImagePlugin JNG { get { return plugins[3]; } }

		/// <summary>
		/// Commodore 64 Koala format (*.KOA)
		/// </summary>
		public static FreeImagePlugin KOALA { get { return plugins[4]; } }

		/// <summary>
		/// Amiga IFF (*.IFF, *.LBM)
		/// </summary>
		public static FreeImagePlugin LBM { get { return plugins[5]; } }

		/// <summary>
		/// Amiga IFF (*.IFF, *.LBM)
		/// </summary>
		public static FreeImagePlugin IFF { get { return plugins[5]; } }

		/// <summary>
		/// Multiple Network Graphics (*.MNG)
		/// </summary>
		public static FreeImagePlugin MNG { get { return plugins[6]; } }

		/// <summary>
		/// Portable Bitmap (ASCII) (*.PBM)
		/// </summary>
		public static FreeImagePlugin PBM { get { return plugins[7]; } }

		/// <summary>
		/// Portable Bitmap (BINARY) (*.PBM)
		/// </summary>
		public static FreeImagePlugin PBMRAW { get { return plugins[8]; } }

		/// <summary>
		/// Kodak PhotoCD (*.PCD)
		/// </summary>
		public static FreeImagePlugin PCD { get { return plugins[9]; } }

		/// <summary>
		/// Zsoft Paintbrush PCX bitmap format (*.PCX)
		/// </summary>
		public static FreeImagePlugin PCX { get { return plugins[10]; } }

		/// <summary>
		/// Portable Graymap (ASCII) (*.PGM)
		/// </summary>
		public static FreeImagePlugin PGM { get { return plugins[11]; } }

		/// <summary>
		/// Portable Graymap (BINARY) (*.PGM)
		/// </summary>
		public static FreeImagePlugin PGMRAW { get { return plugins[12]; } }

		/// <summary>
		/// Portable Network Graphics (*.PNG)
		/// </summary>
		public static FreeImagePlugin PNG { get { return plugins[13]; } }

		/// <summary>
		/// Portable Pixelmap (ASCII) (*.PPM)
		/// </summary>
		public static FreeImagePlugin PPM { get { return plugins[14]; } }

		/// <summary>
		/// Portable Pixelmap (BINARY) (*.PPM)
		/// </summary>
		public static FreeImagePlugin PPMRAW { get { return plugins[15]; } }

		/// <summary>
		/// Sun Rasterfile (*.RAS)
		/// </summary>
		public static FreeImagePlugin RAS { get { return plugins[16]; } }

		/// <summary>
		/// truevision Targa files (*.TGA, *.TARGA)
		/// </summary>
		public static FreeImagePlugin TARGA { get { return plugins[17]; } }

		/// <summary>
		/// Tagged Image File Format (*.TIF, *.TIFF)
		/// </summary>
		public static FreeImagePlugin TIFF { get { return plugins[18]; } }

		/// <summary>
		/// Wireless Bitmap (*.WBMP)
		/// </summary>
		public static FreeImagePlugin WBMP { get { return plugins[19]; } }

		/// <summary>
		/// Adobe Photoshop (*.PSD)
		/// </summary>
		public static FreeImagePlugin PSD { get { return plugins[20]; } }

		/// <summary>
		/// Dr. Halo (*.CUT)
		/// </summary>
		public static FreeImagePlugin CUT { get { return plugins[21]; } }

		/// <summary>
		/// X11 Bitmap Format (*.XBM)
		/// </summary>
		public static FreeImagePlugin XBM { get { return plugins[22]; } }

		/// <summary>
		/// X11 Pixmap Format (*.XPM)
		/// </summary>
		public static FreeImagePlugin XPM { get { return plugins[23]; } }

		/// <summary>
		/// DirectDraw Surface (*.DDS)
		/// </summary>
		public static FreeImagePlugin DDS { get { return plugins[24]; } }

		/// <summary>
		/// Graphics Interchange Format (*.GIF)
		/// </summary>
		public static FreeImagePlugin GIF { get { return plugins[25]; } }

		/// <summary>
		/// High Dynamic Range (*.HDR)
		/// </summary>
		public static FreeImagePlugin HDR { get { return plugins[26]; } }

		/// <summary>
		/// Raw Fax format CCITT G3 (*.G3)
		/// </summary>
		public static FreeImagePlugin FAXG3 { get { return plugins[27]; } }

		/// <summary>
		/// Silicon Graphics SGI image format (*.SGI)
		/// </summary>
		public static FreeImagePlugin SGI { get { return plugins[28]; } }

		/// <summary>
		/// OpenEXR format (*.EXR)
		/// </summary>
		public static FreeImagePlugin EXR { get { return plugins[29]; } }

		/// <summary>
		/// JPEG-2000 format (*.J2K, *.J2C)
		/// </summary>
		public static FreeImagePlugin J2K { get { return plugins[30]; } }

		/// <summary>
		/// JPEG-2000 format (*.JP2)
		/// </summary>
		public static FreeImagePlugin JP2 { get { return plugins[31]; } }

		/// <summary>
		/// Portable FloatMap (*.PFM)
		/// </summary>
		public static FreeImagePlugin PFM { get { return plugins[32]; } }

		/// <summary>
		/// Macintosh PICT (*.PICT)
		/// </summary>
		public static FreeImagePlugin PICT { get { return plugins[33]; } }

		/// <summary>
		/// RAW camera image (*.*)
		/// </summary>
		public static FreeImagePlugin RAW { get { return plugins[34]; } }
	}
}