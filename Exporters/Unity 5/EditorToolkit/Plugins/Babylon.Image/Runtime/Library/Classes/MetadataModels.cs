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
// $Revision: 1.6 $
// $Date: 2009/09/15 11:49:24 $
// $Id: MetadataModels.cs,v 1.6 2009/09/15 11:49:24 cklein05 Exp $
// ==========================================================

using System;
using System.Xml;
using System.IO;
using System.Text;

namespace FreeImageAPI.Metadata
{
    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_ANIMATION"/>.
    /// </summary>
    public class MDM_ANIMATION : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_ANIMATION(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_ANIMATION; }
        }

        /// <summary>
        /// Gets or sets the width of the entire canvas area, that each page is displayed in.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? LogicalWidth
        {
            get
            {
                return GetTagValue<ushort>("LogicalWidth");
            }
            set
            {
                SetTagValue("LogicalWidth", value);
            }
        }

        /// <summary>
        /// Gets or sets the height of the entire canvas area, that each page is displayed in.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? LogicalHeight
        {
            get
            {
                return GetTagValue<ushort>("LogicalHeight");
            }
            set
            {
                SetTagValue("LogicalHeight", value);
            }
        }

        /// <summary>
        /// Gets or sets the global palette of the GIF image.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public Palette GlobalPalette
        {
            get
            {
                MetadataTag mdtag = GetTag("GlobalPalette");
                return (mdtag == null) ? null : new Palette(mdtag);
            }
            set
            {
                SetTagValue("GlobalPalette", (value != null) ? null : value.Data);
            }
        }

        /// <summary>
        /// Gets or sets the number of replays for the animation.
        /// Use 0 (zero) to specify an infinte number of replays.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public uint? LoopCount
        {
            get
            {
                return GetTagValue<uint>("Loop");
            }
            set
            {
                SetTagValue("Loop", value);
            }
        }

        /// <summary>
        /// Gets or sets the horizontal offset within the logical canvas area, this frame is to be displayed at.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? FrameLeft
        {
            get
            {
                return GetTagValue<ushort>("FrameLeft");
            }
            set
            {
                SetTagValue("FrameLeft", value);
            }
        }

        /// <summary>
        /// Gets or sets the vertical offset within the logical canvas area, this frame is to be displayed at.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? FrameTop
        {
            get
            {
                return GetTagValue<ushort>("FrameTop");
            }
            set
            {
                SetTagValue("FrameTop", value);
            }
        }

        /// <summary>
        /// Gets or sets a flag to supress saving the dib's attached palette
        /// (making it use the global palette). The local palette is the palette used by a page.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public bool? NoLocalPalette
        {
            get
            {
                byte? useGlobalPalette = GetTagValue<byte>("NoLocalPalette");
                return useGlobalPalette.HasValue ? (useGlobalPalette.Value != 0) : default(bool?);
            }
            set
            {
                byte? val = null;
                if (value.HasValue)
                {
                    val = (byte)(value.Value ? 1 : 0);
                }
                SetTagValue("NoLocalPalette", val);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the image is interlaced.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public bool? Interlaced
        {
            get
            {
                byte? useGlobalPalette = GetTagValue<byte>("Interlaced");
                return useGlobalPalette.HasValue ? (useGlobalPalette.Value != 0) : default(bool?);
            }
            set
            {
                byte? val = null;
                if (value.HasValue)
                {
                    val = (byte)(value.Value ? 1 : 0);
                }
                SetTagValue("Interlaced", val);
            }
        }

        /// <summary>
        /// Gets or sets the amout of time in milliseconds this frame is to be displayed.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public uint? FrameTime
        {
            get
            {
                return GetTagValue<uint>("FrameTime");
            }
            set
            {
                SetTagValue("FrameTime", value);
            }
        }

        /// <summary>
        /// Gets or sets this frame's disposal method. Generally, this method defines, how to
        /// remove or replace a frame when the next frame has to be drawn.<para/>
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public DisposalMethodType? DisposalMethod
        {
            get
            {
                return GetTagValue<DisposalMethodType>("DisposalMethod");
            }
            set
            {
                SetTagValue("DisposalMethod", value);
            }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_COMMENTS"/>.
    /// </summary>
    public class MDM_COMMENTS : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_COMMENTS(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_COMMENTS; }
        }

        /// <summary>
        /// Gets or sets the comment of the image.
        /// Supported formats are JPEG, PNG and GIF.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Comment
        {
            get
            {
                return GetTagText("Comment");
            }
            set
            {
                SetTagValue("Comment", value);
            }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_CUSTOM"/>.
    /// </summary>
    public class MDM_CUSTOM : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_CUSTOM(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_CUSTOM; }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_EXIF_EXIF"/>.
    /// </summary>
    public class MDM_EXIF_EXIF : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_EXIF_EXIF(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_EXIF_EXIF; }
        }

        /// <summary>
        /// Gets or sets the version of this standard supported.
        /// Constant length or 4.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] ExifVersion
        {
            get
            {
                return GetTagArray<byte>("ExifVersion");
            }
            set
            {
                FreeImage.Resize(ref value, 4);
                SetTagValueUndefined("ExifVersion", value);
            }
        }

        /// <summary>
        /// Gets or sets the Flashpix format version supported by a FPXR file.
        /// Constant length or 4.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] FlashpixVersion
        {
            get
            {
                return GetTagArray<byte>("FlashpixVersion");
            }
            set
            {
                FreeImage.Resize(ref value, 4);
                SetTagValueUndefined("FlashpixVersion", value);
            }
        }

        /// <summary>
        /// Gets or sets the color space information tag.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are defined:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>1</term>
        ///			<description>sRGB (default)</description>
        ///		</item>
        ///		<item>
        ///			<term>0xFFFF</term>
        ///			<description>uncalibrated</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? ColorSpace
        {
            get
            {
                return GetTagValue<ushort>("ColorSpace");
            }
            set
            {
                SetTagValue("ColorSpace", value);
            }
        }

        /// <summary>
        /// Gets or sets the valid width of a compressed image.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public uint? PixelXDimension
        {
            get
            {
                return GetUInt32Value("PixelXDimension");
            }
            set
            {
                RemoveTag("PixelXDimension");
                if (value.HasValue)
                {
                    SetTagValue("PixelXDimension", value.Value);
                }
            }
        }

        /// <summary>
        /// Gets or sets the valid height of a compressed image.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public uint? PixelYDimension
        {
            get
            {
                return GetUInt32Value("PixelYDimension");
            }
            set
            {
                RemoveTag("PixelYDimension");
                if (value.HasValue)
                {
                    SetTagValue("PixelYDimension", value.Value);
                }
            }
        }

        /// <summary>
        /// Gets or sets components configuration. See remarks for further information.
        /// Constant length of 4.
        /// </summary>
        /// <remarks>
        /// The channels of each component are arranged in order from the 1st component to the 4th.
        /// For uncompressed data the data arrangement is given in the PhotometricInterpretation tag.
        /// However, since PhotometricInterpretation can only express the order of Y,Cb and Cr,
        /// this tag is provided for cases when compressed data uses components other than Y, Cb,
        /// and Cr and to enable support of other sequences.<para/>
        /// Default = 4 5 6 0 (if RGB uncompressed)<para/>
        /// The following values are defined:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>does not exist</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>Y</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>Cb</description>
        ///		</item>
        ///		<item>
        ///			<term>3</term>
        ///			<description>Cr</description>
        ///		</item>
        ///		<item>
        ///			<term>4</term>
        ///			<description>R</description>
        ///		</item>
        ///		<item>
        ///			<term>5</term>
        ///			<description>R</description>
        ///		</item>
        ///		<item>
        ///			<term>6</term>
        ///			<description>R</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] ComponentsConfiguration
        {
            get
            {
                return GetTagArray<byte>("ComponentsConfiguration");
            }
            set
            {
                FreeImage.Resize(ref value, 4);
                SetTagValueUndefined("ComponentsConfiguration", value);
            }
        }

        /// <summary>
        /// Gets or sets compression mode used for a compressed image is indicated
        /// in unit bits per pixel.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? CompressedBitsPerPixel
        {
            get
            {
                return GetTagValue<FIURational>("CompressedBitsPerPixel");
            }
            set
            {
                SetTagValue("CompressedBitsPerPixel", value);
            }
        }

        /// <summary>
        /// Gets or sets a tag for manufacturers of Exif writers to record any desired information.
        /// The contents are up to the manufacturer, but this tag should not be used for any other
        /// than its intended purpose.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] MakerNote
        {
            get
            {
                return GetTagArray<byte>("FlashpixVersion");
            }
            set
            {
                SetTagValueUndefined("FlashpixVersion", value);
            }
        }

        /// <summary>
        /// Gets or sets a tag for Exif users to write keywords or comments on the image besides
        /// those in ImageDescription, and without the character code limitations of the ImageDescription tag.
        /// Minimum length of 8. See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The character code used in the UserComment tag is identified based on an ID code in a fixed 8-byte
        /// area at the start of the tag data area. The unused portion of the area is padded with NULL.
        /// The ID code for the UserComment area may be a Defined code such as JIS or ASCII, or may be Undefined.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] UserComment
        {
            get
            {
                return GetTagArray<byte>("UserComment");
            }
            set
            {
                FreeImage.Resize(ref value, 8, int.MaxValue);
                SetTagValueUndefined("UserComment", value);
            }
        }

        /// <summary>
        /// Gets or sets the name of an audio file related to the image data.
        /// The format is 8.3.
        /// Constant length of 12
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string RelatedSoundFile
        {
            get
            {
                string text = GetTagText("RelatedSoundFile");
                if (!string.IsNullOrEmpty(text))
                {
                    text = text.Substring(0, text.Length - 1);
                }
                return text;
            }
            set
            {
                if (value != null)
                {
                    FreeImage.Resize(ref value, 12);
                    value += '\0';
                }
                SetTagValue("RelatedSoundFile", value);
            }
        }

        /// <summary>
        /// Gets or sets the date and time when the original image data was generated.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public DateTime? DateTimeOriginal
        {
            get
            {
                DateTime? result = null;
                string text = GetTagText("DateTimeOriginal");
                if (text != null)
                {
                    try
                    {
                        result = System.DateTime.ParseExact(text, "yyyy:MM:dd HH:mm:ss\0", null);
                    }
                    catch
                    {
                    }
                }
                return result;
            }
            set
            {
                string val = null;
                if (value.HasValue)
                {
                    try
                    {
                        val = value.Value.ToString("yyyy:MM:dd HH:mm:ss\0");
                    }
                    catch
                    {
                    }
                }
                SetTagValue("DateTimeOriginal", val);
            }
        }

        /// <summary>
        /// Gets or sets the date and time when the image was stored as digital data.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public DateTime? DateTimeDigitized
        {
            get
            {
                DateTime? result = null;
                string text = GetTagText("DateTimeDigitized");
                if (text != null)
                {
                    try
                    {
                        result = System.DateTime.ParseExact(text, "yyyy:MM:dd HH:mm:ss\0", null);
                    }
                    catch
                    {
                    }
                }
                return result;
            }
            set
            {
                string val = null;
                if (value.HasValue)
                {
                    try
                    {
                        val = value.Value.ToString("yyyy:MM:dd HH:mm:ss\0");
                    }
                    catch
                    {
                    }
                }
                SetTagValue("DateTimeDigitized", val);
            }
        }

        /// <summary>
        /// Gets or sets a tag used to record fractions of seconds for the DateTime tag.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string SubsecTime
        {
            get
            {
                string text = GetTagText("SubsecTime");
                if (!string.IsNullOrEmpty(text))
                {
                    text = text.Substring(0, text.Length - 1);
                }
                return text;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("SubsecTime", value);
            }
        }

        /// <summary>
        /// Gets or sets a tag used to record fractions of seconds for the DateTimeOriginal tag.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string SubsecTimeOriginal
        {
            get
            {
                string text = GetTagText("SubsecTimeOriginal");
                if (!string.IsNullOrEmpty(text))
                {
                    text = text.Substring(0, text.Length - 1);
                }
                return text;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("SubsecTimeOriginal", value);
            }
        }

        /// <summary>
        /// Gets or sets a tag used to record fractions of seconds for the DateTimeDigitized tag.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string SubsecTimeDigitized
        {
            get
            {
                string text = GetTagText("SubsecTimeDigitized");
                if (!string.IsNullOrEmpty(text))
                {
                    text = text.Substring(0, text.Length - 1);
                }
                return text;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("SubsecTimeDigitized", value);
            }
        }

        /// <summary>
        /// Gets or the exposure time, given in seconds (sec).
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? ExposureTime
        {
            get
            {
                return GetTagValue<FIURational>("ExposureTime");
            }
            set
            {
                SetTagValue("ExposureTime", value);
            }
        }

        /// <summary>
        /// Gets or the F number.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? FNumber
        {
            get
            {
                return GetTagValue<FIURational>("FNumber");
            }
            set
            {
                SetTagValue("FNumber", value);
            }
        }

        /// <summary>
        /// Gets or sets the class of the program used by the camera to set exposure when the
        /// picture is taken.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are defined:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>not defined</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>manual</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>normal program</description>
        ///		</item>
        ///		<item>
        ///			<term>3</term>
        ///			<description>aperture priority</description>
        ///		</item>
        ///		<item>
        ///			<term>4</term>
        ///			<description>shutter priority</description>
        ///		</item>
        ///		<item>
        ///			<term>5</term>
        ///			<description>create program</description>
        ///		</item>
        ///		<item>
        ///			<term>6</term>
        ///			<description>action program</description>
        ///		</item>
        ///		<item>
        ///			<term>7</term>
        ///			<description>portrait mode</description>
        ///		</item>
        ///		<item>
        ///			<term>8</term>
        ///			<description>landscape mode</description>
        ///		</item>
        ///		<item>
        ///			<term>others</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? ExposureProgram
        {
            get
            {
                return GetTagValue<ushort>("ExposureProgram");
            }
            set
            {
                SetTagValue("ExposureProgram", value);
            }
        }

        /// <summary>
        /// Gets or sets the spectral sensitivity of each channel of the camera used.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string SpectralSensitivity
        {
            get
            {
                string text = GetTagText("SpectralSensitivity");
                if (!string.IsNullOrEmpty(text))
                {
                    text = text.Substring(0, text.Length - 1);
                }
                return text;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("SpectralSensitivity", value);
            }
        }

        /// <summary>
        /// Gets or sets the the ISO Speed and ISO Latitude of the camera or input device as
        /// specified in ISO 12232.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort[] ISOSpeedRatings
        {
            get
            {
                return GetTagArray<ushort>("ISOSpeedRatings");
            }
            set
            {
                SetTagValue("ISOSpeedRatings", value);
            }
        }

        /// <summary>
        /// Gets or sets the Opto-Electric Conversion Function (OECF) specified in ISO 14524.
        /// OECF is the relationship between the camera optical input and the image values.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] OECF
        {
            get
            {
                return GetTagArray<byte>("OECF");
            }
            set
            {
                SetTagValueUndefined("OECF", value);
            }
        }

        /// <summary>
        /// Gets or sets the shutter speed. The unit is the APEX (Additive System of Photographic Exposure).
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIRational? ShutterSpeedValue
        {
            get
            {
                return GetTagValue<FIRational>("ShutterSpeedValue");
            }
            set
            {
                SetTagValue("ShutterSpeedValue", value);
            }
        }

        /// <summary>
        /// Gets or sets the lens aperture. The unit is the APEX value.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? ApertureValue
        {
            get
            {
                return GetTagValue<FIURational>("ApertureValue");
            }
            set
            {
                SetTagValue("ApertureValue", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of brightness. The unit is the APEX value.
        /// Ordinarily it is given in the range of -99.99 to 99.99.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIRational? BrightnessValue
        {
            get
            {
                return GetTagValue<FIRational>("BrightnessValue");
            }
            set
            {
                SetTagValue("BrightnessValue", value);
            }
        }

        /// <summary>
        /// Gets or sets the exposure bias. The unit is the APEX value.
        /// Ordinarily it is given in the range of –99.99 to 99.99.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIRational? ExposureBiasValue
        {
            get
            {
                return GetTagValue<FIRational>("ExposureBiasValue");
            }
            set
            {
                SetTagValue("ExposureBiasValue", value);
            }
        }

        /// <summary>
        /// Gets or sets the smallest F number of the lens. The unit is the APEX value.
        /// Ordinarily it is given in the range of 00.00 to 99.99,
        /// but it is not limited to this range.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? MaxApertureValue
        {
            get
            {
                return GetTagValue<FIURational>("MaxApertureValue");
            }
            set
            {
                SetTagValue("MaxApertureValue", value);
            }
        }

        /// <summary>
        /// Gets or sets distance to the subject, given in meters.
        /// Note that if the numerator of the recorded value is FFFFFFFF, infinity shall be indicated;
        /// and if the numerator is 0, distance unknown shall be indicated.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? SubjectDistance
        {
            get
            {
                return GetTagValue<FIURational>("SubjectDistance");
            }
            set
            {
                SetTagValue("SubjectDistance", value);
            }
        }

        /// <summary>
        /// Gets or sets the metering mode. See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are defined:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>unknown</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>average</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>center-weighted-average</description>
        ///		</item>
        ///		<item>
        ///			<term>3</term>
        ///			<description>spot</description>
        ///		</item>
        ///		<item>
        ///			<term>4</term>
        ///			<description>multi-spot</description>
        ///		</item>
        ///		<item>
        ///			<term>5</term>
        ///			<description>pattern</description>
        ///		</item>
        ///		<item>
        ///			<term>6</term>
        ///			<description>partial</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        ///		<item>
        ///			<term>255</term>
        ///			<description>other</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? MeteringMode
        {
            get
            {
                return GetTagValue<ushort>("MeteringMode");
            }
            set
            {
                SetTagValue("MeteringMode", value);
            }
        }

        /// <summary>
        /// Gets or sets the kind of light source.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are defined:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>unknown</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>daylight</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>fluorescent</description>
        ///		</item>
        ///		<item>
        ///			<term>3</term>
        ///			<description>tungsten</description>
        ///		</item>
        ///		<item>
        ///			<term>4</term>
        ///			<description>flash</description>
        ///		</item>
        ///		<item>
        ///			<term>9</term>
        ///			<description>fine weather</description>
        ///		</item>
        ///		<item>
        ///			<term>10</term>
        ///			<description>cloudy weather</description>
        ///		</item>
        ///		<item>
        ///			<term>11</term>
        ///			<description>shade</description>
        ///		</item>
        ///		<item>
        ///			<term>12</term>
        ///			<description>daylight fluorecent (D 5700 - 7100K)</description>
        ///		</item>
        ///		<item>
        ///			<term>13</term>
        ///			<description>day white fluorescent (N 4600 - 5400K)</description>
        ///		</item>
        ///		<item>
        ///			<term>14</term>
        ///			<description>cool white fluorescent (W 3900 - 4500K)</description>
        ///		</item>
        ///		<item>
        ///			<term>15</term>
        ///			<description>white fluorescent (WW 3200 - 3700K)</description>
        ///		</item>
        ///		<item>
        ///			<term>17</term>
        ///			<description>standard light A</description>
        ///		</item>
        ///		<item>
        ///			<term>18</term>
        ///			<description>standard light B</description>
        ///		</item>
        ///		<item>
        ///			<term>19</term>
        ///			<description>standard light C</description>
        ///		</item>
        ///		<item>
        ///			<term>20</term>
        ///			<description>D55</description>
        ///		</item>
        ///		<item>
        ///			<term>21</term>
        ///			<description>D65</description>
        ///		</item>
        ///		<item>
        ///			<term>22</term>
        ///			<description>D75</description>
        ///		</item>
        ///		<item>
        ///			<term>23</term>
        ///			<description>D50</description>
        ///		</item>
        ///		<item>
        ///			<term>24</term>
        ///			<description>ISO studio tungsten</description>
        ///		</item>
        ///		<item>
        ///			<term>255</term>
        ///			<description>other light source</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? LightSource
        {
            get
            {
                return GetTagValue<ushort>("LightSource");
            }
            set
            {
                SetTagValue("LightSource", value);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating the status of flash when the image was shot.
        /// Bit 0 indicates the flash firing status, bits 1 and 2 indicate the flash return
        /// status, bits 3 and 4 indicate the flash mode, bit 5 indicates whether the flash
        /// function is present, and bit 6 indicates "red eye" mode.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? Flash
        {
            get
            {
                return GetTagValue<ushort>("Flash");
            }
            set
            {
                SetTagValue("Flash", value);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating the location and area of the main subject in
        /// the overall scene. Variable length between 2 and 4.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort[] SubjectArea
        {
            get
            {
                return GetTagArray<ushort>("SubjectArea");
            }
            set
            {
                FreeImage.Resize(ref value, 2, 4);
                SetTagValue("SubjectArea", value);
            }
        }

        /// <summary>
        /// Gets or sets the actual focal length of the lens, in mm.
        /// Conversion is not made to the focal length of a 35 mm film camera.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? FocalLength
        {
            get
            {
                return GetTagValue<FIURational>("FocalLength");
            }
            set
            {
                SetTagValue("FocalLength", value);
            }
        }

        /// <summary>
        /// Gets or sets the strobe energy at the time the image is captured,
        /// as measured in Beam Candle Power Seconds (BCPS).
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? FlashEnergy
        {
            get
            {
                return GetTagValue<FIURational>("FlashEnergy");
            }
            set
            {
                SetTagValue("FlashEnergy", value);
            }
        }

        /// <summary>
        /// Gets or sets the camera or input device spatial frequency table and SFR values
        /// in the direction of image width, image height, and diagonal direction,
        /// as specified in ISO 12233.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] SpatialFrequencyResponse
        {
            get
            {
                return GetTagArray<byte>("SpatialFrequencyResponse");
            }
            set
            {
                SetTagValueUndefined("SpatialFrequencyResponse", value);
            }
        }

        /// <summary>
        /// Gets or sets the number of pixels in the image width (X) direction per
        /// FocalPlaneResolutionUnit on the camera focal plane.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? FocalPlaneXResolution
        {
            get
            {
                return GetTagValue<FIURational>("FocalPlaneXResolution");
            }
            set
            {
                SetTagValue("FocalPlaneXResolution", value);
            }
        }

        /// <summary>
        /// Gets or sets the number of pixels in the image height (Y) direction per
        /// FocalPlaneResolutionUnit on the camera focal plane.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? FocalPlaneYResolution
        {
            get
            {
                return GetTagValue<FIURational>("FocalPlaneYResolution");
            }
            set
            {
                SetTagValue("FocalPlaneYResolution", value);
            }
        }

        /// <summary>
        /// Gets or sets the unit for measuring FocalPlaneXResolution and FocalPlaneYResolution.
        /// This value is the same as the ResolutionUnit.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? FocalPlaneResolutionUnit
        {
            get
            {
                return GetTagValue<ushort>("FocalPlaneResolutionUnit");
            }
            set
            {
                SetTagValue("FocalPlaneResolutionUnit", value);
            }
        }

        /// <summary>
        /// Gets or sets the location of the main subject in the scene.
        /// The value of this tag represents the pixel at the center of the main subject
        /// relative to the left edge, prior to rotation processing as per the Rotation tag.
        /// The first value indicates the X column number and second indicates the Y row number.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? SubjectLocation
        {
            get
            {
                return GetTagValue<ushort>("SubjectLocation");
            }
            set
            {
                SetTagValue("SubjectLocation", value);
            }
        }

        /// <summary>
        /// Gets or sets the exposure index selected on the camera or input device at the
        /// time the image was captured.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? ExposureIndex
        {
            get
            {
                return GetTagValue<FIURational>("ExposureIndex");
            }
            set
            {
                SetTagValue("ExposureIndex", value);
            }
        }

        /// <summary>
        /// Gets or sets the image sensor type on the camera or input device.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are defined:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>1</term>
        ///			<description>not defined</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>one-chip color area sensor</description>
        ///		</item>
        ///		<item>
        ///			<term>3</term>
        ///			<description>two-chip color area sensor</description>
        ///		</item>
        ///		<item>
        ///			<term>4</term>
        ///			<description>three-chip color area sensor</description>
        ///		</item>
        ///		<item>
        ///			<term>5</term>
        ///			<description>color sequential area sensor</description>
        ///		</item>
        ///		<item>
        ///			<term>7</term>
        ///			<description>trilinear sensor</description>
        ///		</item>
        ///		<item>
        ///			<term>8</term>
        ///			<description>color sequential linear sensor</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? SensingMethod
        {
            get
            {
                return GetTagValue<ushort>("SensingMethod");
            }
            set
            {
                SetTagValue("SensingMethod", value);
            }
        }

        /// <summary>
        /// Gets or sets the image source. If a DSC recorded the image, this tag value of this
        /// tag always be set to 3, indicating that the image was recorded on a DSC.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte? FileSource
        {
            get
            {
                return GetTagValue<byte>("FileSource");
            }
            set
            {
                SetTagValueUndefined("FileSource", value.HasValue ? new byte[] { value.Value } : null);
            }
        }

        /// <summary>
        /// Gets or sets the type of scene. If a DSC recorded the image, this tag value shall
        /// always be set to 1, indicating that the image was directly photographed.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte? SceneType
        {
            get
            {
                return GetTagValue<byte>("SceneType");
            }
            set
            {
                SetTagValueUndefined("SceneType", value.HasValue ? new byte[] { value.Value } : null);
            }
        }

        /// <summary>
        /// Gets or sets the color filter array (CFA) geometric pattern of the image sensor
        /// when a one-chip color area sensor is used. It does not apply to all sensing methods.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] CFAPattern
        {
            get
            {
                return GetTagArray<byte>("CFAPattern");
            }
            set
            {
                SetTagValueUndefined("CFAPattern", value);
            }
        }

        /// <summary>
        /// Gets or sets the use of special processing on image data, such as rendering geared to output.
        /// When special processing is performed, the reader is expected to disable or minimize any
        /// further processing. See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>normal process</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>custom process</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? CustomRendered
        {
            get
            {
                return GetTagValue<ushort>("CustomRendered");
            }
            set
            {
                SetTagValue("CustomRendered", value);
            }
        }

        /// <summary>
        /// Gets or sets the exposure mode set when the image was shot.
        /// In auto-bracketing mode, the camera shoots a series of frames of the same scene
        /// at different exposure settings. See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>auto exposure</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>manual exposure</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>auto bracket</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? ExposureMode
        {
            get
            {
                return GetTagValue<ushort>("ExposureMode");
            }
            set
            {
                SetTagValue("ExposureMode", value);
            }
        }

        /// <summary>
        /// Gets or sets the white balance mode set when the image was shot.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>auto white balance</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>manual white balance</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? WhiteBalance
        {
            get
            {
                return GetTagValue<ushort>("WhiteBalance");
            }
            set
            {
                SetTagValue("WhiteBalance", value);
            }
        }

        /// <summary>
        /// Gets or sets the digital zoom ratio when the image was shot.
        /// If the numerator of the recorded value is 0, this indicates that digital zoom was not used.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? DigitalZoomRatio
        {
            get
            {
                return GetTagValue<FIURational>("DigitalZoomRatio");
            }
            set
            {
                SetTagValue("DigitalZoomRatio", value);
            }
        }

        /// <summary>
        /// Gets or sets the equivalent focal length assuming a 35mm film camera, in mm.
        /// A value of 0 means the focal length is unknown. Note that this tag differs
        /// from the FocalLength tag.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? FocalLengthIn35mmFilm
        {
            get
            {
                return GetTagValue<ushort>("DigitalZoomRatio");
            }
            set
            {
                SetTagValue("DigitalZoomRatio", value);
            }
        }

        /// <summary>
        /// Gets or sets the type of scene that was shot.
        /// It can also be used to record the mode in which the image was shot.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>standard</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>landscape</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>portrait</description>
        ///		</item>
        ///		<item>
        ///			<term>3</term>
        ///			<description>night scene</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? SceneCaptureType
        {
            get
            {
                return GetTagValue<ushort>("SceneCaptureType");
            }
            set
            {
                SetTagValue("SceneCaptureType", value);
            }
        }

        /// <summary>
        /// Gets or sets the degree of overall image gain adjustment.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>none</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>low gain up</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>high gain up</description>
        ///		</item>
        ///		<item>
        ///			<term>3</term>
        ///			<description>low gain down</description>
        ///		</item>
        ///		<item>
        ///			<term>4</term>
        ///			<description>high gain down</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? GainControl
        {
            get
            {
                return GetTagValue<ushort>("GainControl");
            }
            set
            {
                SetTagValue("GainControl", value);
            }
        }

        /// <summary>
        /// Gets or sets the direction of contrast processing applied by the camera
        /// when the image was shot.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>normal</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>soft</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>hard</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? Contrast
        {
            get
            {
                return GetTagValue<ushort>("Contrast");
            }
            set
            {
                SetTagValue("Contrast", value);
            }
        }

        /// <summary>
        /// Gets or sets the direction of saturation processing applied by the camera
        /// when the image was shot.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>normal</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>low saturation</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>high saturation</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? Saturation
        {
            get
            {
                return GetTagValue<ushort>("Saturation");
            }
            set
            {
                SetTagValue("Saturation", value);
            }
        }

        /// <summary>
        /// Gets or sets the direction of sharpness processing applied by the camera
        /// when the image was shot.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>normal</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>soft</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>hard</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? Sharpness
        {
            get
            {
                return GetTagValue<ushort>("Sharpness");
            }
            set
            {
                SetTagValue("Sharpness", value);
            }
        }

        /// <summary>
        /// Gets or sets information on the picture-taking conditions of a particular camera model.
        /// The tag is used only to indicate the picture-taking conditions in the reader.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] DeviceSettingDescription
        {
            get
            {
                return GetTagArray<byte>("DeviceSettingDescription");
            }
            set
            {
                SetTagValueUndefined("DeviceSettingDescription", value);
            }
        }

        /// <summary>
        /// Gets or sets the distance to the subject.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>0</term>
        ///			<description>unknown</description>
        ///		</item>
        ///		<item>
        ///			<term>1</term>
        ///			<description>macro</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>close view</description>
        ///		</item>
        ///		<item>
        ///			<term>3</term>
        ///			<description>distant view</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? SubjectDistanceRange
        {
            get
            {
                return GetTagValue<ushort>("SubjectDistanceRange");
            }
            set
            {
                SetTagValue("SubjectDistanceRange", value);
            }
        }

        /// <summary>
        /// Gets or sets an identifier assigned uniquely to each image.
        /// It is recorded as an ASCII string equivalent to hexadecimal notation and 128-bit fixed length.
        /// Constant length of 32.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ImageUniqueID
        {
            get
            {
                string text = GetTagText("ImageUniqueID");
                if (!string.IsNullOrEmpty(text))
                {
                    text = text.Substring(0, text.Length - 1);
                }
                return text;
            }
            set
            {
                if (value != null)
                {
                    FreeImage.Resize(ref value, 32);
                    value += '\0';
                }
                SetTagValue("ImageUniqueID", value);
            }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_EXIF_GPS"/>.
    /// </summary>
    public class MDM_EXIF_GPS : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_EXIF_GPS(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_EXIF_GPS; }
        }

        /// <summary>
        /// Gets or sets the GPS version ID. Constant length of 4.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] VersionID
        {
            get
            {
                return GetTagArray<byte>("GPSVersionID");
            }
            set
            {
                FreeImage.Resize(ref value, 4);
                SetTagValue("GPSVersionID", value);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the <see cref="Latitude"/>
        /// is north or south latitude.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public LatitudeType? LatitudeDirection
        {
            get
            {
                return ToLatitudeType(GetTagText("GPSLatitudeRef"));
            }
            set
            {
                SetTagValue("GPSLatitudeRef", ToString(value) + '\0');
            }
        }

        /// <summary>
        /// Gets or sets the latitude of the image. The latitude is expressed as three rational
        /// values giving the degrees, minutes, and seconds, respectively. Constant length of 3.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="LatitudeDirection"/>
        public FIURational[] Latitude
        {
            get
            {
                return GetTagArray<FIURational>("GPSLatitude");
            }
            set
            {
                FreeImage.Resize(ref value, 3);
                SetTagValue("GPSLatitude", value);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether <see cref="Longitude"/>
        /// is east or west longitude.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public LongitudeType? LongitudeDirection
        {
            get
            {
                return ToLongitudeType(GetTagText("GPSLongitudeRef"));
            }
            set
            {
                SetTagValue("GPSLongitudeRef", ToString(value) + '\0');
            }
        }

        /// <summary>
        /// Gets or sets the longitude of the image. The longitude is expressed as three rational
        /// values giving the degrees, minutes, and seconds, respectively. Constant length of 3.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="LongitudeDirection"/>
        public FIURational[] Longitude
        {
            get
            {
                return GetTagArray<FIURational>("GPSLongitude");
            }
            set
            {
                FreeImage.Resize(ref value, 3);
                SetTagValue("GPSLongitude", value);
            }
        }

        /// <summary>
        /// Gets a value indicating whether <see cref="Altitude"/> is sea level and the altitude
        /// is above sea level. If the altitude is below sea level <see cref="Altitude"/> is
        /// indicated as an absolute value.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public AltitudeType? AltitudeDirection
        {
            get
            {
                byte? flag = GetTagValue<byte>("GPSAltitudeRef");
                if (flag.HasValue)
                {
                    switch (flag.Value)
                    {
                        case 0:
                            return AltitudeType.AboveSeaLevel;
                        case 1:
                            return AltitudeType.BelowSeaLevel;
                        default:
                            return AltitudeType.Undefined;
                    }
                }
                return null;
            }
            set
            {
                byte? val = null;
                if (value.HasValue)
                {
                    switch (value.Value)
                    {
                        case AltitudeType.AboveSeaLevel:
                            val = 0;
                            break;

                        case AltitudeType.BelowSeaLevel:
                            val = 1;
                            break;

                        default:
                            val = 2;
                            break;
                    }
                }
                SetTagValue("GPSAltitudeRef", val);
            }
        }

        /// <summary>
        /// Gets or sets the altitude based on the reference in <see cref="AltitudeDirection"/>.
        /// Altitude is expressed as one rational value. The reference unit is meters.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? Altitude
        {
            get
            {
                return GetTagValue<FIURational>("GPSAltitude");
            }
            set
            {
                SetTagValue("GPSAltitude", value);
            }
        }

        /// <summary>
        /// Gets or sets the sign of the <see cref="SignedAltitude"/>.
        /// </summary>
        /// <remarks>
        /// This is a derived property. There is no metadata tag directly associated
        /// with this property value.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public int? AltitudeSign
        {
            get
            {
                AltitudeType? seaLevel = AltitudeDirection;
                if (seaLevel.HasValue)
                {
                    return (seaLevel.Value == AltitudeType.BelowSeaLevel) ? -1 : 1;
                }
                return null;
            }
            set
            {
                if (value.HasValue)
                {
                    AltitudeDirection = value.Value >= 0 ? AltitudeType.AboveSeaLevel : AltitudeType.BelowSeaLevel;
                }
                else
                {
                    AltitudeDirection = null;
                }
            }
        }

        /// <summary>
        /// Gets or sets the signed altitude.
        /// Altitude is expressed as one rational value. The reference unit is meters.
        /// </summary>
        /// <exception cref="OverflowException">
        /// Altitude is too large to fit into a FIRational.
        /// </exception>
        /// <remarks>
        /// This is a derived property. There is no metadata tag directly associated
        /// with this property value.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIRational? SignedAltitude
        {
            get
            {
                FIRational? result = null;
                FIURational? altitude = Altitude;
                if (altitude.HasValue)
                {
                    int sign = AltitudeSign ?? 1;
                    if (((int)altitude.Value.Numerator < 0) || ((int)altitude.Value.Denominator < 0))
                        throw new OverflowException();
                    result = new FIRational((int)altitude.Value.Numerator * sign, (int)altitude.Value.Denominator);
                }
                return result;
            }
            set
            {
                FIURational? val = null;
                if (value.HasValue)
                {
                    if (value.Value < 0)
                    {
                        AltitudeSign = -1;
                        value = -value.Value;
                    }
                    else
                    {
                        AltitudeSign = 1;
                    }
                    val = new FIURational((uint)value.Value.Numerator, (uint)value.Value.Denominator);
                }
                Altitude = val;
            }
        }


        /// <summary>
        /// Gets or sets the time as UTC (Coordinated Universal Time). Constant length of 3.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public TimeSpan? TimeStamp
        {
            get
            {
                FIURational[] stamp = GetTagArray<FIURational>("GPSTimeStamp");
                if ((stamp == null) || stamp.Length != 3)
                {
                    return null;
                }
                else
                {
                    return new TimeSpan((int)stamp[0], (int)stamp[1], (int)stamp[2]);
                }
            }
            set
            {
                FIURational[] stamp = null;
                if (value.HasValue)
                {
                    TimeSpan span = value.Value;
                    stamp = new FIURational[3];
                    stamp[0] = span.Hours;
                    stamp[1] = span.Minutes;
                    stamp[2] = span.Seconds;
                }
                SetTagValue("GPSTimeStamp", stamp);
            }
        }

        /// <summary>
        /// Gets or sets the GPS satellites used for measurements. This tag can be used to describe
        /// the number of satellites, their ID number, angle of elevation, azimuth, SNR and other
        /// information in ASCII notation. The format is not specified.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Satellites
        {
            get
            {
                string result = GetTagText("GPSSatellites");
                if (!string.IsNullOrEmpty(result))
                {
                    result = result.Substring(0, result.Length - 1);
                }
                return result;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("GPSTimeStamp", value);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating the status of the GPS receiver when the image was recorded.
        /// <b>true</b> indicates measurement was in progress;
        /// <b>false</b> indicates measurement was Interoperability.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public bool? Status
        {
            get
            {
                string text = GetTagText("GPSStatus");
                return string.IsNullOrEmpty(text) ? default(bool?) : text[0] == 'A';
            }
            set
            {
                SetTagValue("GPSStatus", value.HasValue ? (value.Value ? "A\0" : "V\0") : null);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating the GPS measurement mode.
        /// <b>true</b> indicates three-dimensional measurement;
        /// <b>false</b> indicated two-dimensional measurement was in progress.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public bool? MeasureMode3D
        {
            get
            {
                string text = GetTagText("GPSMeasureMode");
                return string.IsNullOrEmpty(text) ? default(bool?) : text[0] == '3';
            }
            set
            {
                SetTagValue("GPSMeasureMode", value.HasValue ? (value.Value ? "3\0" : "2\0") : null);
            }
        }

        /// <summary>
        /// Gets or sets the GPS DOP (data degree of precision). An HDOP value is written during
        /// two-dimensional measurement, and PDOP during three-dimensional measurement.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? DOP
        {
            get
            {
                return GetTagValue<FIURational>("GPSDOP");
            }
            set
            {
                SetTagValue("GPSDOP", value);
            }
        }

        /// <summary>
        /// Gets or sets the unit used to express the GPS receiver <see cref="Speed"/> of movement.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="Speed"/>
        public VelocityUnit? SpeedUnit
        {
            get
            {
                return ToUnitType(GetTagText("GPSSpeedRef"));
            }
            set
            {
                SetTagValue("GPSSpeedRef", ToString(value) + '\0');
            }
        }

        /// <summary>
        /// Gets or sets the speed of GPS receiver movement.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="SpeedUnit"/>
        public FIURational? Speed
        {
            get
            {
                return GetTagValue<FIURational>("GPSSpeed");
            }
            set
            {
                SetTagValue("GPSSpeed", value);
            }
        }

        /// <summary>
        /// Gets or sets the reference for giving the direction of GPS receiver movement.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="Track"/>
        public DirectionReference? TrackDirectionReference
        {
            get
            {
                return ToDirectionType(GetTagText("GPSTrackRef"));
            }
            set
            {
                SetTagValue("GPSTrackRef", ToString(value) + '\0');
            }
        }

        /// <summary>
        /// Gets or sets the direction of GPS receiver movement.
        /// The range of values is from 0.00 to 359.99.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="TrackDirectionReference"/>
        public FIURational? Track
        {
            get
            {
                return GetTagValue<FIURational>("GPSTrack");
            }
            set
            {
                SetTagValue("GPSTrack", value);
            }
        }

        /// <summary>
        /// Gets or sets the reference for giving the direction of GPS receiver movement.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="ImageDirection"/>
        public DirectionReference? ImageDirectionReference
        {
            get
            {
                return ToDirectionType(GetTagText("GPSImgDirectionRef"));
            }
            set
            {
                SetTagValue("GPSImgDirectionRef", ToString(value) + '\0');
            }
        }

        /// <summary>
        /// Gets or sets the direction of the image when it was captured.
        /// The range of values is from 0.00 to 359.99.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="ImageDirectionReference"/>
        public FIURational? ImageDirection
        {
            get
            {
                return GetTagValue<FIURational>("GPSImgDirection");
            }
            set
            {
                SetTagValue("GPSImgDirection", value);
            }
        }

        /// <summary>
        /// Gets or sets the geodetic survey data used by the GPS receiver. If the survey data
        /// is restricted to Japan, the value of this tag is 'TOKYO' or 'WGS-84'.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string MapDatum
        {
            get
            {
                string result = GetTagText("GPSMapDatum");
                if (!string.IsNullOrEmpty(result))
                {
                    result = result.Substring(0, result.Length - 1);
                }
                return result;
            }
            set
            {
                SetTagValue("GPSMapDatum", value + '\0');
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the destination point
        /// is north or south latitude.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="Latitude"/>
        public LatitudeType? DestinationLatitudeDirection
        {
            get
            {
                return ToLatitudeType(GetTagText("GPSDestLatitudeRef"));
            }
            set
            {
                SetTagValue("GPSDestLatitudeRef", ToString(value) + '\0');
            }
        }

        /// <summary>
        /// Gets or sets the latitude of the destination point. The latitude is expressed as three rational
        /// values giving the degrees, minutes, and seconds, respectively. Constant length of 3.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="DestinationLatitudeDirection"/>
        public FIURational[] DestinationLatitude
        {
            get
            {
                return GetTagArray<FIURational>("GPSDestLatitude");
            }
            set
            {
                FreeImage.Resize(ref value, 3);
                SetTagValue("GPSDestLatitude", value);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the destination point
        /// is east or west longitude.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="Latitude"/>
        public LongitudeType? DestinationLongitudeDirection
        {
            get
            {
                return ToLongitudeType(GetTagText("GPSDestLongitudeRef"));
            }
            set
            {
                SetTagValue("GPSDestLongitudeRef", ToString(value) + '\0');
            }
        }

        /// <summary>
        /// Gets or sets the longitude of the destination point. The longitude is expressed as three rational
        /// values giving the degrees, minutes, and seconds, respectively. Constant length of 3.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational[] DestinationLongitude
        {
            get
            {
                return GetTagArray<FIURational>("GPSDestLongitude");
            }
            set
            {
                FreeImage.Resize(ref value, 3);
                SetTagValue("GPSDestLongitude", value);
            }
        }

        /// <summary>
        /// Gets or sets the reference used for giving the bearing to the destination point.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="DestinationBearing"/>
        public DirectionReference? DestinationDirectionReference
        {
            get
            {
                return ToDirectionType(GetTagText("GPSDestBearingRef"));
            }
            set
            {
                SetTagValue("GPSDestBearingRef", ToString(value) + '\0');
            }
        }

        /// <summary>
        /// Gets or sets the bearing to the destination point.
        /// The range of values is from 0.00 to 359.99.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="DestinationDirectionReference"/>
        public FIURational? DestinationBearing
        {
            get
            {
                return GetTagValue<FIURational>("GPSDestBearing");
            }
            set
            {
                SetTagValue("GPSDestBearing", value);
            }
        }

        /// <summary>
        /// Gets or sets the unit used to express the distance to the destination point.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="DestinationBearing"/>
        public VelocityUnit? DestinationUnit
        {
            get
            {
                return ToUnitType(GetTagText("GPSDestDistanceRef"));
            }
            set
            {
                SetTagValue("GPSDestDistanceRef", ToString(value) + '\0');
            }
        }

        /// <summary>
        /// Gets or sets a character string recording the name of the method used
        /// for location finding. The first byte indicates the character code used,
        /// and this is followed by the name of the method. Since the Type is not ASCII,
        /// NULL termination is not necessary.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] ProcessingMethod
        {
            get
            {
                return GetTagArray<byte>("GPSProcessingMethod");
            }
            set
            {
                SetTagValue("GPSProcessingMethod", value);
            }
        }

        /// <summary>
        /// Gets or sets a character string recording the name of the GPS area.
        /// The first byte indicates the character code used, and this is followed by
        /// the name of the GPS area. Since the Type is not ASCII, NULL termination is
        /// not necessary. 
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public byte[] AreaInformation
        {
            get
            {
                return GetTagArray<byte>("GPSAreaInformation");
            }
            set
            {
                SetTagValue("GPSAreaInformation", value);
            }
        }

        /// <summary>
        /// Gets or sets date and time information relative to UTC (Coordinated Universal Time). 
        /// </summary>
        /// <remarks>
        /// This is a derived property. There is no metadata tag directly associated
        /// with this property value.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public DateTime? DateTimeStamp
        {
            get
            {
                DateTime? date = DateStamp;
                TimeSpan? time = TimeStamp;
                if ((date == null) && (time == null))
                {
                    return null;
                }
                else
                {
                    if (date == null)
                    {
                        date = DateTime.MinValue;
                    }
                    if (time == null)
                    {
                        time = TimeSpan.MinValue;
                    }
                    return date.Value.Add(time.Value);
                }
            }
            set
            {
                if (value.HasValue)
                {
                    DateStamp = value.Value.Date;
                    TimeStamp = value.Value.TimeOfDay;
                }
                else
                {
                    DateStamp = null;
                    TimeStamp = null;
                }
            }
        }

        /// <summary>
        /// Gets or sets date information relative to UTC (Coordinated Universal Time).
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public DateTime? DateStamp
        {
            get
            {
                string stamp = GetTagText("GPSDateStamp");
                if (stamp != null)
                {
                    try
                    {
                        return DateTime.ParseExact(stamp, "yyyy:MM:dd\0", null);
                    }
                    catch
                    {
                    }
                }
                return null;
            }
            set
            {
                string val = null;
                if (value.HasValue)
                {
                    try
                    {
                        val = value.Value.ToString("yyyy:MM:dd\0");
                    }
                    catch
                    {
                    }
                }
                SetTagValue("GPSDateStamp", val);
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether differential correction was applied to
        /// the GPS receiver. 
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public bool? IsDifferential
        {
            get
            {
                ushort? value = GetTagValue<ushort>("GPSDifferential");
                return value.HasValue ? (value != 0) : (default(bool?));
            }
            set
            {
                SetTagValue("GPSDifferential", value.HasValue ? (object)(value.Value ? (ushort)1 : (ushort)0) : (null));
            }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_EXIF_INTEROP"/>.
    /// </summary>
    public class MDM_INTEROP : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_INTEROP(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_EXIF_INTEROP; }
        }

        /// <summary>
        /// Gets or sets the identification of the Interoperability rule.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public InteroperabilityMode? Identification
        {
            get
            {
                return ToInteroperabilityType(GetTagText("InteroperabilityIndex"));
            }
            set
            {
                SetTagValue("InteroperabilityIndex", ToString(value) + '\0');
            }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_EXIF_MAIN"/>.
    /// <para/>
    /// <b>This class is obsolete. Use class <see cref="MDM_EXIF_MAIN"/> instead.</b>
    /// </summary>
    [Obsolete("To be removed in future releases. Use MDM_EXIF_MAIN instead.")]
    public class MDM_MAIN : MDM_EXIF_MAIN
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_MAIN(FIBITMAP dib) : base(dib) { }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_EXIF_MAIN"/>.
    /// </summary>
    public class MDM_EXIF_MAIN : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_EXIF_MAIN(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_EXIF_MAIN; }
        }

        /// <summary>
        /// Gets or sets the number of columns of image data, equal to the number
        /// of pixels per row. In JPEG compressed data a JPEG marker is used
        /// instead of this tag.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public uint? ImageWidth
        {
            get
            {
                return GetUInt32Value("ImageWidth");
            }
            set
            {
                RemoveTag("ImageWidth");
                if (value.HasValue)
                {
                    SetTagValue("ImageWidth", value);
                }
            }
        }

        /// <summary>
        /// Gets or sets number of rows of image data. In JPEG compressed data a JPEG marker
        /// is used instead of this tag.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public uint? ImageHeight
        {
            get
            {
                return GetUInt32Value("ImageLength");
            }
            set
            {
                RemoveTag("ImageLength");
                if (value.HasValue)
                {
                    SetTagValue("ImageLength", value);
                }
            }
        }

        /// <summary>
        /// Gets or sets number of bits per image component. In this standard
        /// each component of the image is 8 bits, so the value for this tag is 8.
        /// Constant length of 3.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort[] BitsPerSample
        {
            get
            {
                return GetTagArray<ushort>("BitsPerSample");
            }
            set
            {
                FreeImage.Resize(ref value, 3);
                SetTagValue("BitsPerSample", value);
            }
        }

        /// <summary>
        /// Gets or sets compression scheme used for the image data. When a primary image
        /// is JPEG compressed, this designation is not necessary and is omitted.
        /// When thumbnails use JPEG compression, this tag value is set to 6.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? Compression
        {
            get
            {
                return GetTagValue<ushort>("Compression");
            }
            set
            {
                SetTagValue("Compression", value);
            }
        }

        /// <summary>
        /// Gets or sets pixel composition. In JPEG compressed data a JPEG marker is
        /// used instead of this tag. See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>2</term>
        ///			<description>RGB</description>
        ///		</item>
        ///		<item>
        ///			<term>6</term>
        ///			<description>YCbCr</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? PhotometricInterpretation
        {
            get
            {
                return GetTagValue<ushort>("PhotometricInterpretation");
            }
            set
            {
                SetTagValue("PhotometricInterpretation", value);
            }
        }

        /// <summary>
        /// Gets or sets the image orientation viewed in terms of rows and columns.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ExifImageOrientation? Orientation
        {
            get
            {
                return (ExifImageOrientation?)GetTagValue<ushort>("Orientation");
            }
            set
            {
                SetTagValue("Orientation", (ushort?)value);
            }
        }

        /// <summary>
        /// Gets or sets the number of components per pixel. Since this standard applies
        /// to RGB and YCbCr images, the value set for this tag is 3. In JPEG compressed
        /// data a JPEG marker is used instead of this tag.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? SamplesPerPixel
        {
            get
            {
                return GetTagValue<ushort>("SamplesPerPixel");
            }
            set
            {
                SetTagValue("SamplesPerPixel", value);
            }
        }

        /// <summary>
        /// Gets or sets a value that indicates whether pixel components are recorded in
        /// chunky or planar format. In JPEG compressed files a JPEG marker is used instead
        /// of this tag. If this field does not exist, the TIFF default of 1 (chunky) is assumed.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>1</term>
        ///			<description>chunky format</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>planar format</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? PlanarConfiguration
        {
            get
            {
                return GetTagValue<ushort>("PlanarConfiguration");
            }
            set
            {
                SetTagValue("PlanarConfiguration", value);
            }
        }

        /// <summary>
        /// Gets or sets the sampling ratio of chrominance components in relation to
        /// the luminance component. In JPEG compressed dat a JPEG marker is used
        /// instead of this tag.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>[2,1]</term>
        ///			<description>YCbCr4:2:2</description>
        ///		</item>
        ///		<item>
        ///			<term>[2,2]</term>
        ///			<description>YCbCr4:2:0</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort[] YCbCrSubSampling
        {
            get
            {
                return GetTagArray<ushort>("YCbCrSubSampling");
            }
            set
            {
                FreeImage.Resize(ref value, 2);
                SetTagValue("YCbCrSubSampling", value);
            }
        }

        /// <summary>
        /// Gets or sets position of chrominance components in relation to the luminance component.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// This field is designated only for JPEG compressed data or uncompressed YCbCr data.
        /// The TIFF default is 1 (centered); but when Y:Cb:Cr = 4:2:2 it is recommended in
        /// this standard that 2 (co-sited) be used to record data, in order to improve the
        /// image quality when viewed on TV systems.
        /// <para/>
        /// When this field does not exist, the reader shall assume the TIFF default.
        /// In the case of Y:Cb:Cr = 4:2:0, the TIFF default (centered) is recommended.
        /// If the reader does not have the capability of supporting both kinds of YCbCrPositioning,
        /// it shall follow the TIFF default regardless of the value in this field.
        /// It is preferable that readers be able to support both centered and co-sited positioning.
        /// <para/>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>1</term>
        ///			<description>centered</description>
        ///		</item>
        ///		<item>
        ///			<term>2</term>
        ///			<description>co-sited</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>reserved</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? YCbCrPositioning
        {
            get
            {
                return GetTagValue<ushort>("YCbCrPositioning");
            }
            set
            {
                SetTagValue("YCbCrPositioning", value);
            }
        }

        /// <summary>
        /// Gets or sets the number of pixels per <see cref="ResolutionUnit"/>
        /// in the <see cref="ImageWidth"/> direction. When the image resolution is unknown,
        /// 72 [dpi] is designated.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? XResolution
        {
            get
            {
                return GetTagValue<FIURational>("XResolution");
            }
            set
            {
                SetTagValue("XResolution", value);
            }
        }

        /// <summary>
        /// Gets or sets the number of pixels per <see cref="ResolutionUnit"/>
        /// in the <see cref="ImageHeight"/> direction. When the image resolution is unknown,
        /// 72 [dpi] is designated.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational? YResolution
        {
            get
            {
                return GetTagValue<FIURational>("YResolution");
            }
            set
            {
                SetTagValue("YResolution", value);
            }
        }

        /// <summary>
        /// Gets or sets the unit for measuring <see cref="XResolution"/> and <see cref="YResolution"/>.
        /// The same unit is used for both <see cref="XResolution"/> and <see cref="YResolution"/>.
        /// If the image resolution in unknown, 2 (inches) is designated.
        /// See remarks for further information.
        /// </summary>
        /// <remarks>
        /// The following values are definied:<para/>
        /// <list type="table">
        ///		<listheader>
        ///			<term>ID</term>
        ///			<description>Description</description>
        ///		</listheader>
        ///		<item>
        ///			<term>2</term>
        ///			<description>inches</description>
        ///		</item>
        ///		<item>
        ///			<term>3</term>
        ///			<description>YCbCr4:2:0</description>
        ///		</item>
        ///		<item>
        ///			<term>other</term>
        ///			<description>centimeters</description>
        ///		</item>
        /// </list>
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort? ResolutionUnit
        {
            get
            {
                return GetTagValue<ushort>("ResolutionUnit");
            }
            set
            {
                SetTagValue("ResolutionUnit", value);
            }
        }

        /// <summary>
        /// Gets or sets the byte offset of that strip.
        /// It is recommended that this be selected so the number of strip bytes
        /// does not exceed 64 Kbytes.
        /// With JPEG compressed data this designation is not needed and is omitted.
        /// Constant length of <see cref="SamplesPerPixel"/> * StripsPerImage.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="RowsPerStrip"/>
        /// <see cref="StripByteCounts"/>
        public uint[] StripOffsets
        {
            get
            {
                return GetUInt32Array("StripOffsets");
            }
            set
            {
                RemoveTag("StripOffsets");
                if (value != null)
                {
                    SetTagValue("StripOffsets", value);
                }
            }
        }

        /// <summary>
        /// Gets or sets number of rows per strip. This is the number of rows in the image of
        /// one strip when an image is divided into strips. With JPEG compressed data this
        /// designation is not needed and is omitted.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        /// <seealso cref="StripByteCounts"/>
        public uint? RowsPerStrip
        {
            get
            {
                return GetUInt32Value("RowsPerStrip");
            }
            set
            {
                RemoveTag("RowsPerStrip");
                if (value.HasValue)
                {
                    SetTagValue("RowsPerStrip", value);
                }
            }
        }

        /// <summary>
        /// Gets or sets the total number of bytes in each strip.
        /// With JPEG compressed data this designation is not needed and is omitted.
        /// Constant length of <see cref="SamplesPerPixel"/> * StripsPerImage.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public uint[] StripByteCounts
        {
            get
            {
                return GetUInt32Array("StripByteCounts");
            }
            set
            {
                RemoveTag("StripByteCounts");
                if (value != null)
                {
                    SetTagValue("StripByteCounts", value);
                }
            }
        }

        /// <summary>
        /// Gets or sets the offset to the start byte (SOI) of JPEG compressed thumbnail data.
        /// This is not used for primary image JPEG data.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public uint? JPEGInterchangeFormat
        {
            get
            {
                return GetTagValue<uint>("JPEGInterchangeFormat");
            }
            set
            {
                SetTagValue("JPEGInterchangeFormat", value);
            }
        }

        /// <summary>
        /// Gets or sets the number of bytes of JPEG compressed thumbnail data.
        /// </summary>
        /// <remarks>
        /// This is not used for primary image JPEG data.
        /// JPEG thumbnails are not divided but are recorded as a continuous
        /// JPEG bitstream from SOI to EOI. APPn and COM markers should not be recorded.
        /// Compressed thumbnails shall be recorded in no more than 64 Kbytes,
        /// including all other data to be recorded in APP1.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public uint? JPEGInterchangeFormatLength
        {
            get
            {
                return GetTagValue<uint>("JPEGInterchangeFormatLength");
            }
            set
            {
                SetTagValue("JPEGInterchangeFormatLength", value);
            }
        }

        /// <summary>
        /// Gets or sets a transfer function for the image, described in tabular style.
        /// Constant length of 3 * 256.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort[] TransferFunction
        {
            get
            {
                return GetTagArray<ushort>("TransferFunction");
            }
            set
            {
                FreeImage.Resize(ref value, 3 * 256);
                SetTagValue("TransferFunction", value);
            }
        }

        /// <summary>
        /// Gets or sets the chromaticity of the white point of the image.
        /// Constant length of 2.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational[] WhitePoint
        {
            get
            {
                return GetTagArray<FIURational>("WhitePoint");
            }
            set
            {
                FreeImage.Resize(ref value, 2);
                SetTagValue("WhitePoint", value);
            }
        }

        /// <summary>
        /// Gets or sets the chromaticity of the three primary colors of the image.
        /// Constant length of 6.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational[] PrimaryChromaticities
        {
            get
            {
                return GetTagArray<FIURational>("PrimaryChromaticities");
            }
            set
            {
                FreeImage.Resize(ref value, 6);
                SetTagValue("PrimaryChromaticities", value);
            }
        }

        /// <summary>
        /// Gets or sets the matrix coefficients for transformation from RGB to YCbCr image data.
        /// Constant length of 3.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational[] YCbCrCoefficients
        {
            get
            {
                return GetTagArray<FIURational>("YCbCrCoefficients");
            }
            set
            {
                FreeImage.Resize(ref value, 3);
                SetTagValue("PrimaryChromaticities", value);
            }
        }

        /// <summary>
        /// Gets or sets the reference black point value and reference white point value.
        /// Constant length of 6.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public FIURational[] ReferenceBlackWhite
        {
            get
            {
                return GetTagArray<FIURational>("ReferenceBlackWhite");
            }
            set
            {
                FreeImage.Resize(ref value, 6);
                SetTagValue("ReferenceBlackWhite", value);
            }
        }

        /// <summary>
        /// Gets or sets the date and time of image creation.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public DateTime? DateTime
        {
            get
            {
                DateTime? result = null;
                string text = GetTagText("DateTime");
                if (text != null)
                {
                    try
                    {
                        result = System.DateTime.ParseExact(text, "yyyy:MM:dd HH:mm:ss\0", null);
                    }
                    catch
                    {
                    }
                }
                return result;
            }
            set
            {
                string val = null;
                if (value.HasValue)
                {
                    try
                    {
                        val = value.Value.ToString("yyyy:MM:dd HH:mm:ss\0");
                    }
                    catch
                    {
                    }
                }
                SetTagValue("DateTime", val);
            }
        }

        /// <summary>
        /// Gets or sets a string giving the title of the image.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ImageDescription
        {
            get
            {
                string result = GetTagText("ImageDescription");
                if (!string.IsNullOrEmpty(result))
                {
                    result = result.Substring(0, result.Length - 1);
                }
                return result;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("ImageDescription", value);
            }
        }

        /// <summary>
        /// Gets or sets the manufacturer of the recording equipment.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Make
        {
            get
            {
                string result = GetTagText("Make");
                if (!string.IsNullOrEmpty(result))
                {
                    result = result.Substring(0, result.Length - 1);
                }
                return result;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("Make", value);
            }
        }

        /// <summary>
        /// Gets or sets the model name or model number of the equipment.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string EquipmentModel
        {
            get
            {
                string result = GetTagText("Model");
                if (!string.IsNullOrEmpty(result))
                {
                    result = result.Substring(0, result.Length - 1);
                }
                return result;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("Model", value);
            }
        }

        /// <summary>
        /// Gets or sets the name and version of the software or firmware of the camera
        /// or image input device used to generate the image.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Software
        {
            get
            {
                string result = GetTagText("Software");
                if (!string.IsNullOrEmpty(result))
                {
                    result = result.Substring(0, result.Length - 1);
                }
                return result;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("Software", value);
            }
        }

        /// <summary>
        /// Gets or sets the name of the camera owner, photographer or image creator.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Artist
        {
            get
            {
                string result = GetTagText("Artist");
                if (!string.IsNullOrEmpty(result))
                {
                    result = result.Substring(0, result.Length - 1);
                }
                return result;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("Artist", value);
            }
        }

        /// <summary>
        /// Gets or sets the photographer and editor copyrights.
        /// Constant length of 1-2.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string[] Copyright
        {
            get
            {
                string[] result = null;
                string text = GetTagText("Copyright");
                if (!string.IsNullOrEmpty(text))
                {
                    result = text.Split(new char[] { '\0' }, StringSplitOptions.RemoveEmptyEntries);
                }
                return result;
            }
            set
            {
                string val = null;
                if (value != null)
                {
                    if (value.Length == 1)
                    {
                        if (value[0] != null)
                        {
                            val = value[0] + '\0';
                        }
                    }
                    else if (value.Length == 2)
                    {
                        if ((value[0] != null) && (value[1] != null))
                        {
                            val = value[0] + '\0' + value[1] + '\0';
                        }
                    }
                }
                SetTagValue("Copyright", val);
            }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_EXIF_MAKERNOTE"/>.
    /// </summary>
    public class MDM_MAKERNOTE : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_MAKERNOTE(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_EXIF_MAKERNOTE; }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_GEOTIFF"/>.
    /// </summary>
    public class MDM_GEOTIFF : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_GEOTIFF(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_GEOTIFF; }
        }

        /// <summary>
        /// Gets or sets the value of the GeoTIFF GeoASCIIParamsTag.
        /// </summary>
        /// <remarks>
        /// The GeoASCIIParamsTag is used to store all of the <see cref="String"/> valued
        /// GeoKeys, referenced by the <see cref="GeoKeyDirectory"/> property. Since keys
        /// defined in the GeoKeyDirectoryTag use offsets into this tag, any special
        /// comments may be placed at the beginning of this tag.
        /// For the most part, the only keys that are <see cref="String"/> valued are
        /// <i>Citation</i> keys, giving documentation and references for obscure
        /// projections, datums, etc.
        /// <para/>
        /// Special handling is required for <see cref="String"/>-valued keys. While it
        /// is true that TIFF 6.0 permits multiple NULL-delimited strings within a single
        /// ASCII tag, the secondary strings might not appear in the output of naive
        /// <i>tiffdump</i> programs. For this reason, the NULL delimiter of each ASCII key
        /// value shall be converted to a "|" (pipe) character before being installed
        /// back into the <see cref="String"/> holding tag, so that a dump of the tag
        /// will look like this.
        /// <para/>
        /// AsciiTag="first_value|second_value|etc...last_value|"
        /// <para/>
        /// A baseline GeoTIFF-reader must check for and convert the final "|" pipe 
        /// character of a key back into a NULL before returning it to the client 
        /// software.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string GeoASCIIParams
        {
            get
            {
                string text = GetTagText("GeoASCIIParams");
                if (!string.IsNullOrEmpty(text))
                {
                    text = text.Substring(0, text.Length - 1);
                }
                return text;
            }
            set
            {
                if (value != null)
                {
                    value += '\0';
                }
                SetTagValue("GeoASCIIParams", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the GeoTIFF GeoDoubleParamsTag.
        /// </summary>
        /// <remarks>
        /// The GeoDoubleParamsTag is used to store all of the <see cref="Double"/> valued
        /// GeoKeys, referenced by the <see cref="GeoKeyDirectory"/> property. The meaning of
        /// any value of this double array is determined from the GeoKeyDirectoryTag reference
        /// pointing to it. <see cref="Single"/> values should first be converted to
        /// <see cref="Double"/> and stored here.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public double[] GeoDoubleParams
        {
            get
            {
                return GetTagArray<double>("GeoDoubleParams");
            }
            set
            {
                SetTagValue("GeoDoubleParams", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the GeoTIFF GeoKeyDirectoryTag.
        /// </summary>
        /// <remarks>
        /// The GeoKeyDirectoryTag may be used to store the GeoKey Directory, which defines and
        /// references the <i>GeoKeys</i>.
        /// <para/>
        /// The tag is an array of unsigned <see cref="UInt16"/> values, which are primarily
        /// grouped into blocks of 4. The first 4 values are special, and contain GeoKey directory
        /// header information. The header values consist of the following information, in order:
        /// <para/>
        /// Header={KeyDirectoryVersion, KeyRevision, MinorRevision, NumberOfKeys}
        /// <para/>
        /// where
        /// <para/>
        /// <i>KeyDirectoryVersion</i> indicates the current version of Key implementation, and will
        /// only change if this Tag's Key structure is changed. (Similar to the TIFFVersion (42)).
        /// The current DirectoryVersion number is 1. This value will most likely never change,
        /// and may be used to ensure that this is a valid Key-implementation.
        /// <para/>
        /// <i>KeyRevision</i> indicates what revision of Key-Sets are used.
        /// <para/>
        /// <i>MinorRevision</i> indicates what set of Key-Codes are used. The complete revision number
        /// is denoted &lt;KeyRevision&gt;.&lt;MinorRevision&gt;.
        /// <para/>
        /// <i>NumberOfKeys</i> indicates how many Keys are defined by the rest of this Tag.
        /// <para/>
        /// This header is immediately followed by a collection of &lt;NumberOfKeys&gt; KeyEntry
        /// sets, each of which is also 4-<see cref="UInt16"/> long. Each KeyEntry is modeled on the
        /// <i>TIFFEntry</i> format of the TIFF directory header, and is of the form:
        /// <para/>
        /// KeyEntry = { KeyID, TIFFTagLocation, Count, Value_Offset }
        /// <para/>
        /// where
        /// <para/>
        /// <i>KeyID</i> gives the Key-ID value of the Key (identical in function to TIFF tag ID,
        /// but completely independent of TIFF tag-space),
        /// <para/>
        /// <i>TIFFTagLocation</i> indicates which TIFF tag contains the value(s) of the Key: if
        /// TIFFTagLocation is 0, then the value is <see cref="UInt16"/>, and is contained in the
        /// <i>Value_Offset</i> entry. Otherwise, the type (format) of the value is implied by the
        /// TIFF-Type of the tag containing the value.
        /// <para/>
        /// <i>Count</i> indicates the number of values in this key.
        /// <para/>
        /// <i>Value_Offset</i> Value_Offset indicates the index-offset into the TagArray indicated
        /// by TIFFTagLocation, if it is nonzero. If TIFFTagLocation is 0 (zero) , then Value_Offset 
        /// contains the actual (<see cref="UInt16"/>) value of the Key, and Count=1 is implied.
        /// Note that the offset is not a byte-offset, but rather an index based on the natural data
        /// type of the specified tag array.
        /// <para/>
        /// Following the KeyEntry definitions, the KeyDirectory tag may also contain additional
        /// values. For example, if a key requires multiple <see cref="UInt16"/> values, they shall
        /// be placed at the end of this tag, and the KeyEntry will set
        /// TIFFTagLocation=GeoKeyDirectoryTag, with the Value_Offset pointing to the location of the
        /// value(s).
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public ushort[] GeoKeyDirectory
        {
            get
            {
                return GetTagArray<ushort>("GeoKeyDirectory");
            }
            set
            {
                SetTagValue("GeoKeyDirectory", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the GeoTIFF ModelPixelScaleTag.
        /// </summary>
        /// <remarks>
        /// The ModelPixelScaleTag tag may be used to specify the size of raster pixel spacing
        /// in the model space units, when the raster space can be embedded in the model space
        /// coordinate system without rotation, and consists of the following 3 values:
        /// <para/>
        /// ModelPixelScaleTag = (ScaleX, ScaleY, ScaleZ)
        /// <para/>
        /// where <i>ScaleX</i> and <i>ScaleY</i> give the horizontal and vertical spacing of
        /// raster pixels. The <i>ScaleZ</i> is primarily used to map the pixel value of a
        /// digital elevation model into the correct Z-scale, and so for most other purposes
        /// this value should be zero (since most model spaces are 2-D, with Z=0).
        /// <para/>
        /// A single tiepoint in the <see cref="ModelTiePoints"/> tag, together with this tag,
        /// completely determine the relationship between raster and model space; thus they
        /// comprise the two tags which Baseline GeoTIFF files most often will use to place a
        /// raster image into a "standard position" in model space.
        /// <para/>
        /// Like the <see cref="ModelTiePoints"/> tag, this tag information is independent of the
        /// XPosition, YPosition, Resolution and Orientation tags of the standard TIFF 6.0 spec.
        /// However, simple reversals of orientation between raster and model space
        /// (e.g. horizontal or vertical flips) may be indicated by reversal of sign in the
        /// corresponding component of the ModelPixelScaleTag. GeoTIFF compliant readers must
        /// honor this signreversal convention.
        /// <para/>
        /// This tag must not be used if the raster image requires rotation or shearing to place
        /// it into the standard model space. In such cases the transformation shall be defined
        /// with the more general <see cref="ModelTransformationMatrix"/>.
        /// <para/>
        /// <br/><b>Naming differences</b><para/>
        /// In the native FreeImage library and thus, in the FreeImage API documentation, this
        /// property's key is named <i>GeoPixelScale</i>. Since the GeoTIFF specification
        /// as well as Java's <c>EXIFTIFFTagSet</c> class call this tag
        /// <see cref="ModelPixelScale"/>, this property was renamed accordingly.
        /// However, when accessing this property's tag by its <see cref="MetadataTag"/> object,
        /// the native FreeImage tag key <i>GeoPixelScale</i> must be used.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public double[] ModelPixelScale
        {
            get
            {
                return GetTagArray<double>("GeoPixelScale");
            }
            set
            {
                SetTagValue("GeoPixelScale", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the GeoTIFF GeoTiePointsTag.
        /// </summary>
        /// <remarks>
        /// The GeoTiePointsTag stores raster -> model tiepoint pairs in the order
        /// <para/>
        /// ModelTiePoints = (...,I,J,K, X,Y,Z...),
        /// <para/>
        /// where <i>(I,J,K)</i> is the point at location <i>(I,J)</i> in raster space with 
        /// pixel-value <i>K</i>, and <i>(X,Y,Z)</i> is a vector in model space. In most cases
        /// the model space is only two-dimensional, in which case both K and Z should be set
        /// to zero; this third dimension is provided in anticipation of future support for 3D
        /// digital elevation models and vertical coordinate systems.
        /// <para/>
        /// A raster image may be georeferenced simply by specifying its location, size and
        /// orientation in the model coordinate space M. This may be done by specifying the
        /// location of three of the four bounding corner points. However, tiepoints are only
        /// to be considered exact at the points specified; thus defining such a set of
        /// bounding tiepoints does not imply that the model space locations of the interior
        /// of the image may be exactly computed by a linear interpolation of these tiepoints.
        /// <para/>
        /// However, since the relationship between the Raster space and the model space will
        /// often be an exact, affine transformation, this relationship can be defined using
        /// one set of tiepoints and the <see cref="ModelPixelScale"/>, described below, which
        /// gives the vertical and horizontal raster grid cell size, specified in model units.
        /// <para/>
        /// If possible, the first tiepoint placed in this tag shall be the one establishing
        /// the location of the point (0,0) in raster space. However, if this is not possible
        /// (for example, if (0,0) is goes to a part of model space in which the projection is
        /// ill-defined), then there is no particular order in which the tiepoints need be
        /// listed.
        /// <para/>
        /// For orthorectification or mosaicking applications a large number of tiepoints may
        /// be specified on a mesh over the raster image. However, the definition of associated
        /// grid interpolation methods is not in the scope of the current GeoTIFF spec.
        /// <para/>
        /// <br/><b>Naming differences</b><para/>
        /// In the native FreeImage library and thus, in the FreeImage API documentation, this
        /// property's key is named <i>GeoTiePoints</i>. Since the GeoTIFF specification
        /// as well as Java's <c>EXIFTIFFTagSet</c> class call this tag
        /// <see cref="ModelTiePoints"/>, this property was renamed accordingly.
        /// However, when accessing this property's tag by its <see cref="MetadataTag"/> object,
        /// the native FreeImage tag key <i>GeoTiePoints</i> must be used.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public double[] ModelTiePoints
        {
            get
            {
                return GetTagArray<double>("GeoTiePoints");
            }
            set
            {
                SetTagValue("GeoTiePoints", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the GeoTIFF ModelTransformationMatrixTag.
        /// </summary>
        /// <remarks>
        /// This tag may be used to specify the transformation matrix between the raster space
        /// (and its dependent pixel-value space) and the (possibly 3D) model space.
        /// <para/>
        /// <br/><b>Naming differences</b><para/>
        /// In the native FreeImage library and thus, in the FreeImage API documentation, this
        /// property's key is named <i>GeoTransformationMatrix</i>. Since the GeoTIFF specification
        /// as well as Java's <c>EXIFTIFFTagSet</c> class call this tag
        /// <see cref="ModelTransformationMatrix"/>, this property was renamed accordingly.
        /// However, when accessing this property's tag by its <see cref="MetadataTag"/> object,
        /// the native FreeImage tag key <i>GeoTransformationMatrix</i> must be used.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public double[] ModelTransformationMatrix
        {
            get
            {
                return GetTagArray<double>("GeoTransformationMatrix");
            }
            set
            {
                SetTagValue("GeoTransformationMatrix", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the GeoTIFF IntergraphTransformationMatrixTag.
        /// </summary>
        /// <remarks>
        /// The IntergraphTransformationMatrixTag conflicts with an internal software implementation
        /// at Intergraph, and so its use is no longer encouraged. A GeoTIFF reader should look first
        /// for the new tag, and only if it is not found should it check for this older tag. If found,
        /// it should only consider it to be contain valid GeoTIFF matrix information if the tag-count
        /// is 16; the Intergraph version uses 17 values.
        /// <para/>
        /// <br/><b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public double[] IntergraphTransformationMatrix
        {
            get
            {
                return GetTagArray<double>("Intergraph TransformationMatrix");
            }
            set
            {
                SetTagValue("Intergraph TransformationMatrix", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the GeoTIFF JPLCartoIFDOffsetTag.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public uint? JPLCartoIFDOffset
        {
            get
            {
                return GetTagValue<uint>("JPL Carto IFD offset");
            }
            set
            {
                SetTagValue("JPL Carto IFD offset", value);
            }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_IPTC"/>.
    /// </summary>
    public class MDM_IPTC : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_IPTC(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_IPTC; }
        }

        /// <summary>
        /// Gets the Application Record Version.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public short? ApplicationRecordVersion
        {
            get
            {
                return GetTagValue<short>("ApplicationRecordVersion");
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Object Type Reference.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ObjectTypeReference
        {
            get
            {
                return GetTagText("ObjectTypeReference");
            }
            set
            {
                SetTagValue("ObjectTypeReference", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Object Attribute Reference.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ObjectAttributeReference
        {
            get
            {
                return GetTagText("ObjectAttributeReference");
            }
            set
            {
                SetTagValue("ObjectAttributeReference", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Object Name.
        /// This is also referred to as Title.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ObjectName
        {
            get
            {
                return GetTagText("ObjectName");
            }
            set
            {
                SetTagValue("ObjectName", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Edit Status.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string EditStatus
        {
            get
            {
                return GetTagText("EditStatus");
            }
            set
            {
                SetTagValue("EditStatus", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Editorial Update.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string EditorialUpdate
        {
            get
            {
                return GetTagText("EditorialUpdate");
            }
            set
            {
                SetTagValue("EditorialUpdate", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Urgency.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Urgency
        {
            get
            {
                return GetTagText("Urgency");
            }
            set
            {
                SetTagValue("Urgency", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Subject Reference.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string SubjectReference
        {
            get
            {
                return GetTagText("SubjectReference");
            }
            set
            {
                SetTagValue("SubjectReference", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Category.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Category
        {
            get
            {
                return GetTagText("Category");
            }
            set
            {
                SetTagValue("Category", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Supplemental Categories.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string SupplementalCategories
        {
            get
            {
                return GetTagText("SupplementalCategories");
            }
            set
            {
                SetTagValue("SupplementalCategories", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Fixture Identifier.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string FixtureIdentifier
        {
            get
            {
                return GetTagText("FixtureIdentifier");
            }
            set
            {
                SetTagValue("FixtureIdentifier", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Keywords.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Keywords
        {
            get
            {
                return GetTagText("Keywords");
            }
            set
            {
                SetTagValue("Keywords", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Content Location Code.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ContentLocationCode
        {
            get
            {
                return GetTagText("ContentLocationCode");
            }
            set
            {
                SetTagValue("ContentLocationCode", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Content Location Name.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ContentLocationName
        {
            get
            {
                return GetTagText("ContentLocationName");
            }
            set
            {
                SetTagValue("ContentLocationName", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Release Date.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ReleaseDate
        {
            get
            {
                return GetTagText("ReleaseDate");
            }
            set
            {
                SetTagValue("ReleaseDate", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Release Time.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ReleaseTime
        {
            get
            {
                return GetTagText("ReleaseTime");
            }
            set
            {
                SetTagValue("ReleaseTime", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Expiration Date.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ExpirationDate
        {
            get
            {
                return GetTagText("ExpirationDate");
            }
            set
            {
                SetTagValue("ExpirationDate", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Expiration Time.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ExpirationTime
        {
            get
            {
                return GetTagText("ExpirationTime");
            }
            set
            {
                SetTagValue("ExpirationTime", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Special Instructions.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string SpecialInstructions
        {
            get
            {
                return GetTagText("SpecialInstructions");
            }
            set
            {
                SetTagValue("SpecialInstructions", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Action Advised.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ActionAdvised
        {
            get
            {
                return GetTagText("ActionAdvised");
            }
            set
            {
                SetTagValue("ActionAdvised", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Reference Service.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ReferenceService
        {
            get
            {
                return GetTagText("ReferenceService");
            }
            set
            {
                SetTagValue("ReferenceService", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Reference Date.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ReferenceDate
        {
            get
            {
                return GetTagText("ReferenceDate");
            }
            set
            {
                SetTagValue("ReferenceDate", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Reference Number.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ReferenceNumber
        {
            get
            {
                return GetTagText("ReferenceNumber");
            }
            set
            {
                SetTagValue("ReferenceNumber", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Date Created.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string DateCreated
        {
            get
            {
                return GetTagText("DateCreated");
            }
            set
            {
                SetTagValue("DateCreated", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Time Created.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string TimeCreated
        {
            get
            {
                return GetTagText("TimeCreated");
            }
            set
            {
                SetTagValue("TimeCreated", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Digital Creation Date.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string DigitalCreationDate
        {
            get
            {
                return GetTagText("DigitalCreationDate");
            }
            set
            {
                SetTagValue("DigitalCreationDate", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Digital Creation Time.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string DigitalCreationTime
        {
            get
            {
                return GetTagText("DigitalCreationTime");
            }
            set
            {
                SetTagValue("DigitalCreationTime", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Originating Program.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string OriginatingProgram
        {
            get
            {
                return GetTagText("OriginatingProgram");
            }
            set
            {
                SetTagValue("OriginatingProgram", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Program Version.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ProgramVersion
        {
            get
            {
                return GetTagText("ProgramVersion");
            }
            set
            {
                SetTagValue("ProgramVersion", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Object Cycle.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ObjectCycle
        {
            get
            {
                return GetTagText("ObjectCycle");
            }
            set
            {
                SetTagValue("ObjectCycle", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag By Line.
        /// This is the author's name.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ByLine
        {
            get
            {
                return GetTagText("By-line");
            }
            set
            {
                SetTagValue("By-line", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag By Line Title.
        /// This is the author's position.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ByLineTitle
        {
            get
            {
                return GetTagText("By-lineTitle");
            }
            set
            {
                SetTagValue("By-lineTitle", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag City.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string City
        {
            get
            {
                return GetTagText("City");
            }
            set
            {
                SetTagValue("City", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Sub Location.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string SubLocation
        {
            get
            {
                return GetTagText("SubLocation");
            }
            set
            {
                SetTagValue("SubLocation", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Province State.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ProvinceState
        {
            get
            {
                return GetTagText("ProvinceState");
            }
            set
            {
                SetTagValue("ProvinceState", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Country Primary Location Code.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string CountryPrimaryLocationCode
        {
            get
            {
                return GetTagText("Country-PrimaryLocationCode");
            }
            set
            {
                SetTagValue("Country-PrimaryLocationCode", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Country Primary Location Name.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string CountryPrimaryLocationName
        {
            get
            {
                return GetTagText("Country-PrimaryLocationName");
            }
            set
            {
                SetTagValue("Country-PrimaryLocationName", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Original Transmission Reference.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string OriginalTransmissionReference
        {
            get
            {
                return GetTagText("OriginalTransmissionReference");
            }
            set
            {
                SetTagValue("OriginalTransmissionReference", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Headline.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Headline
        {
            get
            {
                return GetTagText("Headline");
            }
            set
            {
                SetTagValue("Headline", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Credit.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Credit
        {
            get
            {
                return GetTagText("Credit");
            }
            set
            {
                SetTagValue("Credit", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Source.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Source
        {
            get
            {
                return GetTagText("Source");
            }
            set
            {
                SetTagValue("Source", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Copyright Notice.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string CopyrightNotice
        {
            get
            {
                return GetTagText("CopyrightNotice");
            }
            set
            {
                SetTagValue("CopyrightNotice", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Contact.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Contact
        {
            get
            {
                return GetTagText("Contact");
            }
            set
            {
                SetTagValue("Contact", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Caption Abstract.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string CaptionAbstract
        {
            get
            {
                return GetTagText("CaptionAbstract");
            }
            set
            {
                SetTagValue("CaptionAbstract", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Writer Editor.
        /// This is also referred to as Caption Writer.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string WriterEditor
        {
            get
            {
                return GetTagText("WriterEditor");
            }
            set
            {
                SetTagValue("WriterEditor", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Rasterized Caption.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string RasterizedCaption
        {
            get
            {
                return GetTagText("RasterizedCaption");
            }
            set
            {
                SetTagValue("RasterizedCaption", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Image Type.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ImageType
        {
            get
            {
                return GetTagText("ImageType");
            }
            set
            {
                SetTagValue("ImageType", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Image Orientation.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ImageOrientation
        {
            get
            {
                return GetTagText("ImageOrientation");
            }
            set
            {
                SetTagValue("ImageOrientation", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Language Identifier.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string LanguageIdentifier
        {
            get
            {
                return GetTagText("LanguageIdentifier");
            }
            set
            {
                SetTagValue("LanguageIdentifier", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Audio Type.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string AudioType
        {
            get
            {
                return GetTagText("AudioType");
            }
            set
            {
                SetTagValue("AudioType", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Audio Sampling Rate.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string AudioSamplingRate
        {
            get
            {
                return GetTagText("AudioSamplingRate");
            }
            set
            {
                SetTagValue("AudioSamplingRate", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Audio Sampling Resolution.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string AudioSamplingResolution
        {
            get
            {
                return GetTagText("AudioSamplingResolution");
            }
            set
            {
                SetTagValue("AudioSamplingResolution", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Audio Duration.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string AudioDuration
        {
            get
            {
                return GetTagText("AudioDuration");
            }
            set
            {
                SetTagValue("AudioDuration", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Audio Outcue.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string AudioOutcue
        {
            get
            {
                return GetTagText("AudioOutcue");
            }
            set
            {
                SetTagValue("AudioOutcue", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Job I D.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string JobID
        {
            get
            {
                return GetTagText("JobID");
            }
            set
            {
                SetTagValue("JobID", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Master Document I D.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string MasterDocumentID
        {
            get
            {
                return GetTagText("MasterDocumentID");
            }
            set
            {
                SetTagValue("MasterDocumentID", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Short Document I D.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ShortDocumentID
        {
            get
            {
                return GetTagText("ShortDocumentID");
            }
            set
            {
                SetTagValue("ShortDocumentID", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Unique Document I D.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string UniqueDocumentID
        {
            get
            {
                return GetTagText("UniqueDocumentID");
            }
            set
            {
                SetTagValue("UniqueDocumentID", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Owner I D.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string OwnerID
        {
            get
            {
                return GetTagText("OwnerID");
            }
            set
            {
                SetTagValue("OwnerID", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Object Preview File Format.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ObjectPreviewFileFormat
        {
            get
            {
                return GetTagText("ObjectPreviewFileFormat");
            }
            set
            {
                SetTagValue("ObjectPreviewFileFormat", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Object Preview File Version.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ObjectPreviewFileVersion
        {
            get
            {
                return GetTagText("ObjectPreviewFileVersion");
            }
            set
            {
                SetTagValue("ObjectPreviewFileVersion", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Object Preview Data.
        /// This is also referred to as Audio Outcue.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ObjectPreviewData
        {
            get
            {
                return GetTagText("ObjectPreviewData");
            }
            set
            {
                SetTagValue("ObjectPreviewData", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Prefs.
        /// This is also referred to as photo-mechanic preferences.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Prefs
        {
            get
            {
                return GetTagText("Prefs");
            }
            set
            {
                SetTagValue("Prefs", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Classify State.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ClassifyState
        {
            get
            {
                return GetTagText("ClassifyState");
            }
            set
            {
                SetTagValue("ClassifyState", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Similarity Index.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string SimilarityIndex
        {
            get
            {
                return GetTagText("SimilarityIndex");
            }
            set
            {
                SetTagValue("SimilarityIndex", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Document Notes.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string DocumentNotes
        {
            get
            {
                return GetTagText("DocumentNotes");
            }
            set
            {
                SetTagValue("DocumentNotes", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Document History.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string DocumentHistory
        {
            get
            {
                return GetTagText("DocumentHistory");
            }
            set
            {
                SetTagValue("DocumentHistory", value);
            }
        }

        /// <summary>
        /// Gets or sets the value of the IPTC/NAA tag Exif Camera Info.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string ExifCameraInfo
        {
            get
            {
                return GetTagText("ExifCameraInfo");
            }
            set
            {
                SetTagValue("ExifCameraInfo", value);
            }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_NODATA"/>.
    /// </summary>
    public class MDM_NODATA : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_NODATA(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_NODATA; }
        }
    }

    /// <summary>
    /// Represents a collection of all tags contained in the metadata model
    /// <see cref="FREE_IMAGE_MDMODEL.FIMD_XMP"/>.
    /// </summary>
    public class MDM_XMP : MetadataModel
    {
        /// <summary>
        /// Initializes a new instance of this class.
        /// </summary>
        /// <param name="dib">Handle to a FreeImage bitmap.</param>
        public MDM_XMP(FIBITMAP dib) : base(dib) { }

        /// <summary>
        /// Retrieves the datamodel that this instance represents.
        /// </summary>
        public override FREE_IMAGE_MDMODEL Model
        {
            get { return FREE_IMAGE_MDMODEL.FIMD_XMP; }
        }

        /// <summary>
        /// Gets or sets the XMP XML content.
        /// </summary>
        /// <remarks>
        /// <b>Handling of null values</b><para/>
        /// A null value indicates, that the corresponding metadata tag is not
        /// present in the metadata model.
        /// Setting this property's value to a non-null reference creates the
        /// metadata tag if necessary.
        /// Setting this property's value to a null reference deletes the
        /// metadata tag from the metadata model.
        /// </remarks>
        public string Xml
        {
            get
            {
                return GetTagText("XMLPacket");
            }
            set
            {
                SetTagValue("XMLPacket", value);
            }
        }

        /// <summary>
        /// Gets an <see cref="XmlReader"/> initialized to read the XMP XML content.
        /// Returns null, if the metadata tag <i>XMLPacket</i> is not present in
        /// this model.
        /// </summary>
        public XmlReader XmlReader
        {
            get
            {
                string xmlString = Xml;
                if (xmlString == null)
                {
                    return null;
                }
                else
                {
                    MemoryStream stream = new MemoryStream();
                    StreamWriter writer = new StreamWriter(stream);
                    writer.Write(xmlString);
                    return XmlReader.Create(stream);
                }
            }
        }
    }
}