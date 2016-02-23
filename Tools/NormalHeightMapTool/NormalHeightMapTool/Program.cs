using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using ImageProcessor;

namespace NormalHeightMapTool
{
	class Program
	{
		private static List<Tuple<string, string>> _switches;

		static void Main(string[] args)
		{
			// Display Help
			if (args.Length == 0 || args.Any(a => string.Compare(a, "-h", StringComparison.InvariantCultureIgnoreCase) == 0))
			{
				DisplayUsage();
				return;
			}

			// Construct a switch list, items1 of tuple is lowercast switch value without the dash, item2 is the value (if any)
			if (BuildSwitches(args) == false)
			{
				DisplayUsage();
				return;
			}

			// Check for pack operation
			if (_switches[0].Item1 == "pack")
			{
				Pack();
			}

			// Check for invert operation
			else if (_switches[0].Item1 == "invert")
			{
				Invert();
			}

			// Not either one of them, display usage and quit
			else
			{
				DisplayUsage();
				return;
			}
		}

		private static bool BuildSwitches(string[] args)
		{
			_switches = new List<Tuple<string, string>>();
			foreach (var a in args)
			{
				if (string.IsNullOrWhiteSpace(a) || a[0] != '-')
				{
					return false;
				}

				var sep = a.IndexOf(":", StringComparison.Ordinal);
				if (sep == -1)
				{
					_switches.Add(new Tuple<string, string>(a.Substring(1).ToLowerInvariant(), null));
				}
				else
				{
					_switches.Add(new Tuple<string, string>(a.Substring(1, sep - 1).ToLowerInvariant(), a.Substring(sep + 1)));
				}
			}
			return true;
		}

		private static void Invert()
		{
			var pfn = _switches[0].Item2;
			if (File.Exists(pfn) == false)
			{
				Console.WriteLine("Can't find file: " + pfn + "\r\nSorry...");
				return;
			}

			var saveSwitch = _switches.FirstOrDefault(s => s.Item1 == "save");
			if (saveSwitch == null || string.IsNullOrWhiteSpace(saveSwitch.Item2))
			{
				Console.WriteLine("Must contain a -save:<targetfilepathname> to save the file.Sorry...");
				return;
			}

			try
			{
				var invertR = _switches.Any(s => s.Item1=="r");
				var invertG = _switches.Any(s => s.Item1=="g");

				var fileData = File.ReadAllBytes(pfn);
				using (var stream = new MemoryStream(fileData))
				{
					using (var factory = new ImageFactory())
					{
						factory.Load(stream);
						var img = (Bitmap)factory.Image;
						if (img == null)
						{
							Console.WriteLine("Unsupported file format or corrupted. Sorry...");
							return;
						}

						Console.WriteLine("Working...");
						for (int y = 0; y < img.Height; y++)
						{
							for (int x = 0; x < img.Width; x++)
							{
								var p = img.GetPixel(x, y);

								var r = (invertR) ? (255 - p.R) : p.R;		// This is the invert operation on R
								var g = (invertG) ? (255 - p.G) : p.G;		//  and G...
								
								var np = Color.FromArgb(p.A, r, g, p.B);

								img.SetPixel(x, y, np);

							}
						}

						Console.WriteLine("Saving to: " + saveSwitch.Item2);
						var spfn = saveSwitch.Item2;
						if (string.IsNullOrWhiteSpace(Path.GetDirectoryName(spfn)))
						{
							spfn = Path.Combine(Directory.GetCurrentDirectory(), spfn);
						}
						factory.Save(spfn);
						Console.WriteLine("Job's done! Bye...");
					}
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine("OOOOOOOPS\r\n\r\n" + ex.ToString());
				return;
			}
		}

		private static void Pack()
		{
			var nswitch = _switches.FirstOrDefault(s => s.Item1=="normalmap");
			if (nswitch == null || string.IsNullOrWhiteSpace(nswitch.Item2) || File.Exists(nswitch.Item2) == false)
			{
				Console.WriteLine("You have to specify a valid file for -normalmap. Sorry...");
				return;
			}

			var hswitch = _switches.FirstOrDefault(s => s.Item1=="heightmap");
			if (hswitch == null || string.IsNullOrWhiteSpace(hswitch.Item2) || File.Exists(hswitch.Item2) == false)
			{
				Console.WriteLine("You have to specify a valid file for -heightmap. Sorry...");
				return;
			}

			var saveSwitch = _switches.FirstOrDefault(s => s.Item1 == "save");
			if (saveSwitch == null || string.IsNullOrWhiteSpace(saveSwitch.Item2))
			{
				Console.WriteLine("Must contain a -save:<targetfilepathname> to save the file.Sorry...");
				return;
			}

			var cswitch = _switches.FirstOrDefault(s => s.Item1=="heightmapchannel");
			var channel = "r";
			if (cswitch != null)
			{
				channel = cswitch.Item2.ToLowerInvariant();
				switch (channel)
				{
					case "a":
					case "r":
					case "g":
					case "b":
						break;
					default:
						Console.WriteLine("You didn't specify a valid channel, only A, R, G, B are valid. Sorry...");
						return;
				}
			}

			var normalFileData = File.ReadAllBytes(nswitch.Item2);
			var heightFileData = File.ReadAllBytes(hswitch.Item2);

			using (var normalStream = new MemoryStream(normalFileData))
			using (var heightStream = new MemoryStream(heightFileData))
			{
				using (var normalFactory = new ImageFactory()) 
				using (var heightFactory = new ImageFactory()) 
				{
					normalFactory.Load(normalStream);
					heightFactory.Load(heightStream);

					var normalImg = (Bitmap)normalFactory.Image;
					var heightImg = (Bitmap)heightFactory.Image;

					if (normalImg.PixelFormat != PixelFormat.Format32bppArgb && normalImg.PixelFormat != PixelFormat.Format32bppPArgb)
					{
						Console.WriteLine("The normalmap source file must be argb, sorry lazy me doesn't suport rgb only...");
						return;
					}

					try
					{
						Console.WriteLine("Working...");
						for (int y = 0; y < normalImg.Height; y++)
						{
							for (int x = 0; x < normalImg.Width; x++)
							{
								var normalPix = normalImg.GetPixel(x, y);
								var heightPix = heightImg.GetPixel(x, y);

								int alpha;
								switch (channel)
								{
									case "a":
										alpha = heightPix.A;
										break;
									case "r":
										alpha = heightPix.R;
										break;
									case "g":
										alpha = heightPix.G;
										break;
									case "b":
										alpha = heightPix.B;
										break;
									default:
										alpha = heightPix.R;
										break;
								}

								var newPixel = Color.FromArgb(alpha<<24 | (normalPix.ToArgb()&0XFFFFFF));
								normalImg.SetPixel(x, y, newPixel);
							}
						}
						Console.WriteLine("Saving to: " + saveSwitch.Item2);

						var spfn = saveSwitch.Item2;
						if (string.IsNullOrWhiteSpace(Path.GetDirectoryName(spfn)))
						{
							spfn = Path.Combine(Directory.GetCurrentDirectory(), spfn);
						}
						normalFactory.Save(spfn);
						Console.WriteLine("Job's done! Bye...");
					}
					catch (Exception ex)
					{
						Console.WriteLine("OOOOOOOPS\r\n\r\n" + ex.ToString());
						return;
					}
				}
			}
		}

		public static void DisplayUsage()
		{
				var helpMessage = 
@"
Normal/HeightMap Tool
=====================

Usage:
 To pack a normal map file and a height map file in one single file (height map will be stored in alpha channel and the value will be taken in the Red component of the source heightmap if -heightmapchannel is not specified):
 -pack -normalmap:<filepathname> -heightmap:<filepathname> [-heightmapchannel:R|G|B|A] -save:<targetfilepathname>

 To invert the R &| G component of a normal map:
 -invert:<normalmapfilepathname> [-R] [-G] -save:<targetfilepathname>

";
			Console.WriteLine(helpMessage);		
		}
	}
}
