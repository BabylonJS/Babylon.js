//-------------------------------------------------------------------------------------
// DirectXTexDDS.cpp
//  
// DirectX Texture Library - Microsoft DirectDraw Surface (DDS) file format reader/writer
//
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// http://go.microsoft.com/fwlink/?LinkId=248926
//-------------------------------------------------------------------------------------

#include "directxtexp.h"

#include "dds.h"

namespace DirectX
{

//-------------------------------------------------------------------------------------
// Legacy format mapping table (used for DDS files without 'DX10' extended header)
//-------------------------------------------------------------------------------------
enum CONVERSION_FLAGS
{
    CONV_FLAGS_NONE     = 0x0,
    CONV_FLAGS_EXPAND   = 0x1,      // Conversion requires expanded pixel size
    CONV_FLAGS_NOALPHA  = 0x2,      // Conversion requires setting alpha to known value
    CONV_FLAGS_SWIZZLE  = 0x4,      // BGR/RGB order swizzling required
    CONV_FLAGS_PAL8     = 0x8,      // Has an 8-bit palette
    CONV_FLAGS_888      = 0x10,     // Source is an 8:8:8 (24bpp) format
    CONV_FLAGS_565      = 0x20,     // Source is a 5:6:5 (16bpp) format
    CONV_FLAGS_5551     = 0x40,     // Source is a 5:5:5:1 (16bpp) format
    CONV_FLAGS_4444     = 0x80,     // Source is a 4:4:4:4 (16bpp) format
    CONV_FLAGS_44       = 0x100,    // Source is a 4:4 (8bpp) format
    CONV_FLAGS_332      = 0x200,    // Source is a 3:3:2 (8bpp) format
    CONV_FLAGS_8332     = 0x400,    // Source is a 8:3:3:2 (16bpp) format
    CONV_FLAGS_A8P8     = 0x800,    // Has an 8-bit palette with an alpha channel
    CONV_FLAGS_DX10     = 0x10000,  // Has the 'DX10' extension header
    CONV_FLAGS_PMALPHA  = 0x20000,  // Contains premultiplied alpha data
    CONV_FLAGS_L8       = 0x40000,  // Source is a 8 luminance format 
    CONV_FLAGS_L16      = 0x80000,  // Source is a 16 luminance format 
    CONV_FLAGS_A8L8     = 0x100000, // Source is a 8:8 luminance format 
};

struct LegacyDDS
{
    DXGI_FORMAT     format;
    DWORD           convFlags;
    DDS_PIXELFORMAT ddpf;
};

const LegacyDDS g_LegacyDDSMap[] = 
{
    { DXGI_FORMAT_BC1_UNORM,          CONV_FLAGS_NONE,        DDSPF_DXT1 }, // D3DFMT_DXT1
    { DXGI_FORMAT_BC2_UNORM,          CONV_FLAGS_NONE,        DDSPF_DXT3 }, // D3DFMT_DXT3
    { DXGI_FORMAT_BC3_UNORM,          CONV_FLAGS_NONE,        DDSPF_DXT5 }, // D3DFMT_DXT5

    { DXGI_FORMAT_BC2_UNORM,          CONV_FLAGS_PMALPHA,     DDSPF_DXT2 }, // D3DFMT_DXT2
    { DXGI_FORMAT_BC3_UNORM,          CONV_FLAGS_PMALPHA,     DDSPF_DXT4 }, // D3DFMT_DXT4

    { DXGI_FORMAT_BC4_UNORM,          CONV_FLAGS_NONE,        DDSPF_BC4_UNORM },
    { DXGI_FORMAT_BC4_SNORM,          CONV_FLAGS_NONE,        DDSPF_BC4_SNORM },
    { DXGI_FORMAT_BC5_UNORM,          CONV_FLAGS_NONE,        DDSPF_BC5_UNORM },
    { DXGI_FORMAT_BC5_SNORM,          CONV_FLAGS_NONE,        DDSPF_BC5_SNORM },

    { DXGI_FORMAT_BC4_UNORM,          CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_FOURCC, MAKEFOURCC( 'A', 'T', 'I', '1' ), 0, 0, 0, 0, 0 } },
    { DXGI_FORMAT_BC5_UNORM,          CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_FOURCC, MAKEFOURCC( 'A', 'T', 'I', '2' ), 0, 0, 0, 0, 0 } },

    { DXGI_FORMAT_R8G8_B8G8_UNORM,    CONV_FLAGS_NONE,        DDSPF_R8G8_B8G8 }, // D3DFMT_R8G8_B8G8
    { DXGI_FORMAT_G8R8_G8B8_UNORM,    CONV_FLAGS_NONE,        DDSPF_G8R8_G8B8 }, // D3DFMT_G8R8_G8B8

    { DXGI_FORMAT_B8G8R8A8_UNORM,     CONV_FLAGS_NONE,        DDSPF_A8R8G8B8 }, // D3DFMT_A8R8G8B8 (uses DXGI 1.1 format)
    { DXGI_FORMAT_B8G8R8X8_UNORM,     CONV_FLAGS_NONE,        DDSPF_X8R8G8B8 }, // D3DFMT_X8R8G8B8 (uses DXGI 1.1 format)
    { DXGI_FORMAT_R8G8B8A8_UNORM,     CONV_FLAGS_NONE,        DDSPF_A8B8G8R8 }, // D3DFMT_A8B8G8R8
    { DXGI_FORMAT_R8G8B8A8_UNORM,     CONV_FLAGS_NOALPHA,     DDSPF_X8B8G8R8 }, // D3DFMT_X8B8G8R8
    { DXGI_FORMAT_R16G16_UNORM,       CONV_FLAGS_NONE,        DDSPF_G16R16   }, // D3DFMT_G16R16

    { DXGI_FORMAT_R10G10B10A2_UNORM,  CONV_FLAGS_SWIZZLE,     { sizeof(DDS_PIXELFORMAT), DDS_RGB,       0, 32, 0x000003ff, 0x000ffc00, 0x3ff00000, 0xc0000000 } }, // D3DFMT_A2R10G10B10 (D3DX reversal issue workaround)
    { DXGI_FORMAT_R10G10B10A2_UNORM,  CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_RGB,       0, 32, 0x3ff00000, 0x000ffc00, 0x000003ff, 0xc0000000 } }, // D3DFMT_A2B10G10R10 (D3DX reversal issue workaround)

    { DXGI_FORMAT_R8G8B8A8_UNORM,     CONV_FLAGS_EXPAND
                                      | CONV_FLAGS_NOALPHA
                                      | CONV_FLAGS_888,       DDSPF_R8G8B8 }, // D3DFMT_R8G8B8

    { DXGI_FORMAT_B5G6R5_UNORM,       CONV_FLAGS_565,         DDSPF_R5G6B5 }, // D3DFMT_R5G6B5
    { DXGI_FORMAT_B5G5R5A1_UNORM,     CONV_FLAGS_5551,        DDSPF_A1R5G5B5 }, // D3DFMT_A1R5G5B5
    { DXGI_FORMAT_B5G5R5A1_UNORM,     CONV_FLAGS_5551
                                      | CONV_FLAGS_NOALPHA,   { sizeof(DDS_PIXELFORMAT), DDS_RGB,       0, 16, 0x7c00,     0x03e0,     0x001f,     0x0000     } }, // D3DFMT_X1R5G5B5
     
    { DXGI_FORMAT_R8G8B8A8_UNORM,     CONV_FLAGS_EXPAND
                                      | CONV_FLAGS_8332,      { sizeof(DDS_PIXELFORMAT), DDS_RGB,       0, 16, 0x00e0,     0x001c,     0x0003,     0xff00     } }, // D3DFMT_A8R3G3B2
    { DXGI_FORMAT_B5G6R5_UNORM,       CONV_FLAGS_EXPAND
                                      | CONV_FLAGS_332,       { sizeof(DDS_PIXELFORMAT), DDS_RGB,       0,  8, 0xe0,       0x1c,       0x03,       0x00       } }, // D3DFMT_R3G3B2
  
    { DXGI_FORMAT_R8_UNORM,           CONV_FLAGS_NONE,        DDSPF_L8   }, // D3DFMT_L8
    { DXGI_FORMAT_R16_UNORM,          CONV_FLAGS_NONE,        DDSPF_L16  }, // D3DFMT_L16
    { DXGI_FORMAT_R8G8_UNORM,         CONV_FLAGS_NONE,        DDSPF_A8L8 }, // D3DFMT_A8L8

    { DXGI_FORMAT_A8_UNORM,           CONV_FLAGS_NONE,        DDSPF_A8   }, // D3DFMT_A8

    { DXGI_FORMAT_R16G16B16A16_UNORM, CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_FOURCC,   36,  0, 0,          0,          0,          0          } }, // D3DFMT_A16B16G16R16
    { DXGI_FORMAT_R16G16B16A16_SNORM, CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_FOURCC,  110,  0, 0,          0,          0,          0          } }, // D3DFMT_Q16W16V16U16
    { DXGI_FORMAT_R16_FLOAT,          CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_FOURCC,  111,  0, 0,          0,          0,          0          } }, // D3DFMT_R16F
    { DXGI_FORMAT_R16G16_FLOAT,       CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_FOURCC,  112,  0, 0,          0,          0,          0          } }, // D3DFMT_G16R16F
    { DXGI_FORMAT_R16G16B16A16_FLOAT, CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_FOURCC,  113,  0, 0,          0,          0,          0          } }, // D3DFMT_A16B16G16R16F
    { DXGI_FORMAT_R32_FLOAT,          CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_FOURCC,  114,  0, 0,          0,          0,          0          } }, // D3DFMT_R32F
    { DXGI_FORMAT_R32G32_FLOAT,       CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_FOURCC,  115,  0, 0,          0,          0,          0          } }, // D3DFMT_G32R32F
    { DXGI_FORMAT_R32G32B32A32_FLOAT, CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_FOURCC,  116,  0, 0,          0,          0,          0          } }, // D3DFMT_A32B32G32R32F

    { DXGI_FORMAT_R32_FLOAT,          CONV_FLAGS_NONE,        { sizeof(DDS_PIXELFORMAT), DDS_RGB,       0, 32, 0xffffffff, 0x00000000, 0x00000000, 0x00000000 } }, // D3DFMT_R32F (D3DX uses FourCC 114 instead)

    { DXGI_FORMAT_R8G8B8A8_UNORM,     CONV_FLAGS_EXPAND
                                      | CONV_FLAGS_PAL8
                                      | CONV_FLAGS_A8P8,      { sizeof(DDS_PIXELFORMAT), DDS_PAL8,      0, 16, 0,          0,          0,          0         } }, // D3DFMT_A8P8
    { DXGI_FORMAT_R8G8B8A8_UNORM,     CONV_FLAGS_EXPAND
                                      | CONV_FLAGS_PAL8,      { sizeof(DDS_PIXELFORMAT), DDS_PAL8,      0,  8, 0,          0,          0,          0         } }, // D3DFMT_P8

    { DXGI_FORMAT_B4G4R4A4_UNORM,     CONV_FLAGS_4444,        DDSPF_A4R4G4B4 }, // D3DFMT_A4R4G4B4 (uses DXGI 1.2 format)
    { DXGI_FORMAT_B4G4R4A4_UNORM,     CONV_FLAGS_NOALPHA
                                      | CONV_FLAGS_4444,      { sizeof(DDS_PIXELFORMAT), DDS_RGB,       0, 16, 0x0f00,     0x00f0,     0x000f,     0x0000     } }, // D3DFMT_X4R4G4B4 (uses DXGI 1.2 format)
    { DXGI_FORMAT_B4G4R4A4_UNORM,     CONV_FLAGS_EXPAND
                                      | CONV_FLAGS_44,        { sizeof(DDS_PIXELFORMAT), DDS_LUMINANCE, 0,  8, 0x0f,       0x00,       0x00,       0xf0       } }, // D3DFMT_A4L4 (uses DXGI 1.2 format)

    { DXGI_FORMAT_YUY2,               CONV_FLAGS_NONE,        DDSPF_YUY2 }, // D3DFMT_YUY2 (uses DXGI 1.2 format)
    { DXGI_FORMAT_YUY2,               CONV_FLAGS_SWIZZLE,     { sizeof(DDS_PIXELFORMAT), DDS_FOURCC,    MAKEFOURCC('U','Y','V','Y'), 0, 0, 0, 0, 0            } }, // D3DFMT_UYVY (uses DXGI 1.2 format)
};

// Note that many common DDS reader/writers (including D3DX) swap the
// the RED/BLUE masks for 10:10:10:2 formats. We assumme
// below that the 'backwards' header mask is being used since it is most
// likely written by D3DX. The more robust solution is to use the 'DX10'
// header extension and specify the DXGI_FORMAT_R10G10B10A2_UNORM format directly

// We do not support the following legacy Direct3D 9 formats:
//      BumpDuDv D3DFMT_V8U8, D3DFMT_Q8W8V8U8, D3DFMT_V16U16, D3DFMT_A2W10V10U10
//      BumpLuminance D3DFMT_L6V5U5, D3DFMT_X8L8V8U8
//      FourCC 117 D3DFMT_CxV8U8
//      ZBuffer D3DFMT_D16_LOCKABLE
//      FourCC 82 D3DFMT_D32F_LOCKABLE

static DXGI_FORMAT _GetDXGIFormat( const DDS_PIXELFORMAT& ddpf, DWORD flags, _Inout_ DWORD& convFlags )
{
    const size_t MAP_SIZE = sizeof(g_LegacyDDSMap) / sizeof(LegacyDDS);
    size_t index = 0;
    for( index = 0; index < MAP_SIZE; ++index )
    {
        const LegacyDDS* entry = &g_LegacyDDSMap[index];

        if ( ddpf.dwFlags & entry->ddpf.dwFlags )
        {
            if ( entry->ddpf.dwFlags & DDS_FOURCC )
            {
                if ( ddpf.dwFourCC == entry->ddpf.dwFourCC )
                    break;
            }
            else if ( entry->ddpf.dwFlags & DDS_PAL8 )
            {
                if (  ddpf.dwRGBBitCount == entry->ddpf.dwRGBBitCount )
                    break;
            }
            else if ( ddpf.dwRGBBitCount == entry->ddpf.dwRGBBitCount )
            {
                // RGB, RGBA, ALPHA, LUMINANCE
                if ( ddpf.dwRBitMask == entry->ddpf.dwRBitMask
                     && ddpf.dwGBitMask == entry->ddpf.dwGBitMask
                     && ddpf.dwBBitMask == entry->ddpf.dwBBitMask
                     && ddpf.dwABitMask == entry->ddpf.dwABitMask )
                    break;
            }
        }
    }

    if ( index >= MAP_SIZE )
        return DXGI_FORMAT_UNKNOWN;

    DWORD cflags = g_LegacyDDSMap[index].convFlags;
    DXGI_FORMAT format = g_LegacyDDSMap[index].format;

    if ( (cflags & CONV_FLAGS_EXPAND) && (flags & DDS_FLAGS_NO_LEGACY_EXPANSION) )
        return DXGI_FORMAT_UNKNOWN;

    if ( (format == DXGI_FORMAT_R10G10B10A2_UNORM) && (flags & DDS_FLAGS_NO_R10B10G10A2_FIXUP) )
    {
        cflags ^= CONV_FLAGS_SWIZZLE;
    }

    convFlags = cflags;

    return format;
}


//-------------------------------------------------------------------------------------
// Decodes DDS header including optional DX10 extended header
//-------------------------------------------------------------------------------------
static HRESULT _DecodeDDSHeader( _In_reads_bytes_(size) LPCVOID pSource, size_t size, DWORD flags, _Out_ TexMetadata& metadata,
                                 _Inout_ DWORD& convFlags )
{
    if ( !pSource )
        return E_INVALIDARG;

    memset( &metadata, 0, sizeof(TexMetadata) );

    if ( size < (sizeof(DDS_HEADER) + sizeof(uint32_t)) )
    {
        return HRESULT_FROM_WIN32( ERROR_INVALID_DATA );
    }

    // DDS files always start with the same magic number ("DDS ")
    uint32_t dwMagicNumber = *reinterpret_cast<const uint32_t*>(pSource);
    if ( dwMagicNumber != DDS_MAGIC )
    {
        return E_FAIL;
    }

    auto pHeader = reinterpret_cast<const DDS_HEADER*>( (const uint8_t*)pSource + sizeof( uint32_t ) );

    // Verify header to validate DDS file
    if ( pHeader->dwSize != sizeof(DDS_HEADER)
         || pHeader->ddspf.dwSize != sizeof(DDS_PIXELFORMAT) )
    {
        return E_FAIL;
    }

    metadata.mipLevels = pHeader->dwMipMapCount;
    if ( metadata.mipLevels == 0 )
        metadata.mipLevels = 1;

    // Check for DX10 extension
    if ( (pHeader->ddspf.dwFlags & DDS_FOURCC)
         && (MAKEFOURCC( 'D', 'X', '1', '0' ) == pHeader->ddspf.dwFourCC) )
    {
        // Buffer must be big enough for both headers and magic value
        if ( size < ( sizeof(DDS_HEADER) + sizeof(uint32_t) + sizeof(DDS_HEADER_DXT10) ) )
        {
            return E_FAIL;
        }

        auto d3d10ext = reinterpret_cast<const DDS_HEADER_DXT10*>( (const uint8_t*)pSource + sizeof( uint32_t ) + sizeof(DDS_HEADER) );
        convFlags |= CONV_FLAGS_DX10;

        metadata.arraySize = d3d10ext->arraySize;
        if ( metadata.arraySize == 0 )
        {
            return HRESULT_FROM_WIN32( ERROR_INVALID_DATA );
        }

        metadata.format = d3d10ext->dxgiFormat;
        if ( !IsValid( metadata.format ) || IsPalettized( metadata.format ) )
        {
            return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
        }

        static_assert( TEX_MISC_TEXTURECUBE == DDS_RESOURCE_MISC_TEXTURECUBE, "DDS header mismatch");

        metadata.miscFlags = d3d10ext->miscFlag & ~TEX_MISC_TEXTURECUBE;

        switch ( d3d10ext->resourceDimension )
        {
        case DDS_DIMENSION_TEXTURE1D:

            // D3DX writes 1D textures with a fixed Height of 1
            if ( (pHeader->dwFlags & DDS_HEIGHT) && pHeader->dwHeight != 1 )
            {
                return HRESULT_FROM_WIN32( ERROR_INVALID_DATA );
            }

            metadata.width = pHeader->dwWidth;
            metadata.height = 1;
            metadata.depth = 1;
            metadata.dimension = TEX_DIMENSION_TEXTURE1D;
            break;

        case DDS_DIMENSION_TEXTURE2D:
            if ( d3d10ext->miscFlag & DDS_RESOURCE_MISC_TEXTURECUBE )
            {
                metadata.miscFlags |= TEX_MISC_TEXTURECUBE;
                metadata.arraySize *= 6;
            }

            metadata.width = pHeader->dwWidth;
            metadata.height = pHeader->dwHeight;
            metadata.depth = 1;
            metadata.dimension = TEX_DIMENSION_TEXTURE2D;
            break;

        case DDS_DIMENSION_TEXTURE3D:
            if ( !(pHeader->dwFlags & DDS_HEADER_FLAGS_VOLUME) )
            {
                return HRESULT_FROM_WIN32( ERROR_INVALID_DATA );
            }

            if ( metadata.arraySize > 1 )
                return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

            metadata.width = pHeader->dwWidth;
            metadata.height = pHeader->dwHeight;
            metadata.depth = pHeader->dwDepth;
            metadata.dimension = TEX_DIMENSION_TEXTURE3D;
            break;

        default:
            return HRESULT_FROM_WIN32( ERROR_INVALID_DATA );
        }

        static_assert( TEX_MISC2_ALPHA_MODE_MASK == DDS_MISC_FLAGS2_ALPHA_MODE_MASK, "DDS header mismatch");

        static_assert( TEX_ALPHA_MODE_UNKNOWN == DDS_ALPHA_MODE_UNKNOWN, "DDS header mismatch");
        static_assert( TEX_ALPHA_MODE_STRAIGHT == DDS_ALPHA_MODE_STRAIGHT, "DDS header mismatch");
        static_assert( TEX_ALPHA_MODE_PREMULTIPLIED == DDS_ALPHA_MODE_PREMULTIPLIED, "DDS header mismatch");
        static_assert( TEX_ALPHA_MODE_OPAQUE == DDS_ALPHA_MODE_OPAQUE, "DDS header mismatch");
        static_assert( TEX_ALPHA_MODE_CUSTOM == DDS_ALPHA_MODE_CUSTOM, "DDS header mismatch");

        metadata.miscFlags2 = d3d10ext->miscFlags2;
    }
    else
    {
        metadata.arraySize = 1;

        if ( pHeader->dwFlags & DDS_HEADER_FLAGS_VOLUME )
        {
            metadata.width = pHeader->dwWidth;
            metadata.height = pHeader->dwHeight;
            metadata.depth = pHeader->dwDepth;
            metadata.dimension = TEX_DIMENSION_TEXTURE3D;
        }
        else 
        {
            if ( pHeader->dwCaps2 & DDS_CUBEMAP )
            {
               // We require all six faces to be defined
               if ( (pHeader->dwCaps2 & DDS_CUBEMAP_ALLFACES ) != DDS_CUBEMAP_ALLFACES )
                   return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

                metadata.arraySize = 6;
                metadata.miscFlags |= TEX_MISC_TEXTURECUBE;
            }

            metadata.width = pHeader->dwWidth;
            metadata.height = pHeader->dwHeight;
            metadata.depth = 1;
            metadata.dimension = TEX_DIMENSION_TEXTURE2D;

            // Note there's no way for a legacy Direct3D 9 DDS to express a '1D' texture
        }

        metadata.format = _GetDXGIFormat( pHeader->ddspf, flags, convFlags );

        if ( metadata.format == DXGI_FORMAT_UNKNOWN )
            return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

        if ( convFlags & CONV_FLAGS_PMALPHA )
            metadata.miscFlags2 |= TEX_ALPHA_MODE_PREMULTIPLIED;

        // Special flag for handling LUMINANCE legacy formats
        if ( flags & DDS_FLAGS_EXPAND_LUMINANCE )
        {
            switch ( metadata.format )
            {
            case DXGI_FORMAT_R8_UNORM:
                metadata.format = DXGI_FORMAT_R8G8B8A8_UNORM;
                convFlags |= CONV_FLAGS_L8 | CONV_FLAGS_EXPAND;
                break;

            case DXGI_FORMAT_R8G8_UNORM:
                metadata.format = DXGI_FORMAT_R8G8B8A8_UNORM;
                convFlags |= CONV_FLAGS_A8L8 | CONV_FLAGS_EXPAND;
                break;

            case DXGI_FORMAT_R16_UNORM:
                metadata.format = DXGI_FORMAT_R16G16B16A16_UNORM;
                convFlags |= CONV_FLAGS_L16 | CONV_FLAGS_EXPAND;
                break;
            }
        }
    }

    // Special flag for handling BGR DXGI 1.1 formats
    if (flags & DDS_FLAGS_FORCE_RGB)
    {
        switch ( metadata.format )
        {
        case DXGI_FORMAT_B8G8R8A8_UNORM:
            metadata.format = DXGI_FORMAT_R8G8B8A8_UNORM;
            convFlags |= CONV_FLAGS_SWIZZLE;
            break;

        case DXGI_FORMAT_B8G8R8X8_UNORM:
            metadata.format = DXGI_FORMAT_R8G8B8A8_UNORM;
            convFlags |= CONV_FLAGS_SWIZZLE | CONV_FLAGS_NOALPHA;
            break;

        case DXGI_FORMAT_B8G8R8A8_TYPELESS:
            metadata.format = DXGI_FORMAT_R8G8B8A8_TYPELESS;
            convFlags |= CONV_FLAGS_SWIZZLE;
            break;

        case DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
            metadata.format = DXGI_FORMAT_R8G8B8A8_UNORM_SRGB;
            convFlags |= CONV_FLAGS_SWIZZLE;
            break;

        case DXGI_FORMAT_B8G8R8X8_TYPELESS:
            metadata.format = DXGI_FORMAT_R8G8B8A8_TYPELESS;
            convFlags |= CONV_FLAGS_SWIZZLE | CONV_FLAGS_NOALPHA;
            break;

        case DXGI_FORMAT_B8G8R8X8_UNORM_SRGB:
            metadata.format = DXGI_FORMAT_R8G8B8A8_UNORM_SRGB;
            convFlags |= CONV_FLAGS_SWIZZLE | CONV_FLAGS_NOALPHA;
            break;
        }
    }

    // Special flag for handling 16bpp formats
    if (flags & DDS_FLAGS_NO_16BPP)
    {
        switch ( metadata.format )
        {
        case DXGI_FORMAT_B5G6R5_UNORM:
        case DXGI_FORMAT_B5G5R5A1_UNORM:
        case DXGI_FORMAT_B4G4R4A4_UNORM:
            metadata.format = DXGI_FORMAT_R8G8B8A8_UNORM;
            convFlags |= CONV_FLAGS_EXPAND;
            if ( metadata.format == DXGI_FORMAT_B5G6R5_UNORM )
                convFlags |= CONV_FLAGS_NOALPHA;
        }
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Encodes DDS file header (magic value, header, optional DX10 extended header)
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT _EncodeDDSHeader( const TexMetadata& metadata, DWORD flags, 
                          LPVOID pDestination, size_t maxsize, size_t& required )
{
    if ( !IsValid( metadata.format ) )
        return E_INVALIDARG;

    if ( IsPalettized( metadata.format ) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    if ( metadata.arraySize > 1 )
    {
        if ( (metadata.arraySize != 6) || (metadata.dimension != TEX_DIMENSION_TEXTURE2D) || !(metadata.IsCubemap()) )
        {
            // Texture1D arrays, Texture2D arrays, and Cubemap arrays must be stored using 'DX10' extended header
            flags |= DDS_FLAGS_FORCE_DX10_EXT;
        }
    }

    if ( flags & DDS_FLAGS_FORCE_DX10_EXT_MISC2 )
    {
        flags |= DDS_FLAGS_FORCE_DX10_EXT;
    }

    DDS_PIXELFORMAT ddpf = { 0 };
    if ( !(flags & DDS_FLAGS_FORCE_DX10_EXT) )
    {
        switch( metadata.format )
        {
        case DXGI_FORMAT_R8G8B8A8_UNORM:        memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_A8B8G8R8, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_R16G16_UNORM:          memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_G16R16, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_R8G8_UNORM:            memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_A8L8, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_R16_UNORM:             memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_L16, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_R8_UNORM:              memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_L8, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_A8_UNORM:              memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_A8, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_R8G8_B8G8_UNORM:       memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_R8G8_B8G8, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_G8R8_G8B8_UNORM:       memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_G8R8_G8B8, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_BC1_UNORM:             memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_DXT1, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_BC2_UNORM:             memcpy_s( &ddpf, sizeof(ddpf), metadata.IsPMAlpha() ? (&DDSPF_DXT2) : (&DDSPF_DXT3), sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_BC3_UNORM:             memcpy_s( &ddpf, sizeof(ddpf), metadata.IsPMAlpha() ? (&DDSPF_DXT4) : (&DDSPF_DXT5), sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_BC4_UNORM:             memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_BC4_UNORM, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_BC4_SNORM:             memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_BC4_SNORM, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_BC5_UNORM:             memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_BC5_UNORM, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_BC5_SNORM:             memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_BC5_SNORM, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_B5G6R5_UNORM:          memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_R5G6B5, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_B5G5R5A1_UNORM:        memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_A1R5G5B5, sizeof(DDS_PIXELFORMAT) ); break;
        case DXGI_FORMAT_B8G8R8A8_UNORM:        memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_A8R8G8B8, sizeof(DDS_PIXELFORMAT) ); break; // DXGI 1.1
        case DXGI_FORMAT_B8G8R8X8_UNORM:        memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_X8R8G8B8, sizeof(DDS_PIXELFORMAT) ); break; // DXGI 1.1
        case DXGI_FORMAT_B4G4R4A4_UNORM:        memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_A4R4G4B4, sizeof(DDS_PIXELFORMAT) ); break; // DXGI 1.2
        case DXGI_FORMAT_YUY2:                  memcpy_s( &ddpf, sizeof(ddpf), &DDSPF_YUY2, sizeof(DDS_PIXELFORMAT) ); break; // DXGI 1.2

        // Legacy D3DX formats using D3DFMT enum value as FourCC
        case DXGI_FORMAT_R32G32B32A32_FLOAT:
            ddpf.dwSize = sizeof(DDS_PIXELFORMAT); ddpf.dwFlags = DDS_FOURCC; ddpf.dwFourCC = 116;  // D3DFMT_A32B32G32R32F
            break;
        case DXGI_FORMAT_R16G16B16A16_FLOAT:
            ddpf.dwSize = sizeof(DDS_PIXELFORMAT); ddpf.dwFlags = DDS_FOURCC; ddpf.dwFourCC = 113;  // D3DFMT_A16B16G16R16F
            break;
        case DXGI_FORMAT_R16G16B16A16_UNORM:
            ddpf.dwSize = sizeof(DDS_PIXELFORMAT); ddpf.dwFlags = DDS_FOURCC; ddpf.dwFourCC = 36;  // D3DFMT_A16B16G16R16
            break;
        case DXGI_FORMAT_R16G16B16A16_SNORM:
            ddpf.dwSize = sizeof(DDS_PIXELFORMAT); ddpf.dwFlags = DDS_FOURCC; ddpf.dwFourCC = 110;  // D3DFMT_Q16W16V16U16
            break;
        case DXGI_FORMAT_R32G32_FLOAT:
            ddpf.dwSize = sizeof(DDS_PIXELFORMAT); ddpf.dwFlags = DDS_FOURCC; ddpf.dwFourCC = 115;  // D3DFMT_G32R32F
            break;
       case DXGI_FORMAT_R16G16_FLOAT:
            ddpf.dwSize = sizeof(DDS_PIXELFORMAT); ddpf.dwFlags = DDS_FOURCC; ddpf.dwFourCC = 112;  // D3DFMT_G16R16F
            break;
        case DXGI_FORMAT_R32_FLOAT:
            ddpf.dwSize = sizeof(DDS_PIXELFORMAT); ddpf.dwFlags = DDS_FOURCC; ddpf.dwFourCC = 114;  // D3DFMT_R32F
            break;
        case DXGI_FORMAT_R16_FLOAT:
            ddpf.dwSize = sizeof(DDS_PIXELFORMAT); ddpf.dwFlags = DDS_FOURCC; ddpf.dwFourCC = 111;  // D3DFMT_R16F
            break;
        }
    }

    required = sizeof(uint32_t) + sizeof(DDS_HEADER);

    if ( ddpf.dwSize == 0 )
        required += sizeof(DDS_HEADER_DXT10);

    if ( !pDestination )
        return S_OK;

    if ( maxsize < required )
        return E_NOT_SUFFICIENT_BUFFER;

    *reinterpret_cast<uint32_t*>(pDestination) = DDS_MAGIC;

    auto header = reinterpret_cast<DDS_HEADER*>( reinterpret_cast<uint8_t*>(pDestination) + sizeof(uint32_t) );
    assert( header );

    memset( header, 0, sizeof(DDS_HEADER ) );
    header->dwSize = sizeof( DDS_HEADER );
    header->dwFlags = DDS_HEADER_FLAGS_TEXTURE;
    header->dwCaps = DDS_SURFACE_FLAGS_TEXTURE;

    if (metadata.mipLevels > 0)
    {
        header->dwFlags |= DDS_HEADER_FLAGS_MIPMAP;

#ifdef _M_X64
        if ( metadata.mipLevels > 0xFFFFFFFF )
            return E_INVALIDARG;
#endif

        header->dwMipMapCount = static_cast<uint32_t>( metadata.mipLevels );

        if ( header->dwMipMapCount > 1 )
            header->dwCaps |= DDS_SURFACE_FLAGS_MIPMAP;
    }

    switch( metadata.dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
#ifdef _M_X64
        if ( metadata.width > 0xFFFFFFFF )
            return E_INVALIDARG;
#endif

        header->dwWidth = static_cast<uint32_t>( metadata.width ); 
        header->dwHeight = header->dwDepth = 1;
        break;

    case TEX_DIMENSION_TEXTURE2D:
#ifdef _M_X64
        if ( metadata.height > 0xFFFFFFFF
             || metadata.width > 0xFFFFFFFF)
            return E_INVALIDARG;
#endif

        header->dwHeight = static_cast<uint32_t>( metadata.height ); 
        header->dwWidth = static_cast<uint32_t>( metadata.width );
        header->dwDepth = 1;

        if ( metadata.IsCubemap() )
        {
            header->dwCaps |= DDS_SURFACE_FLAGS_CUBEMAP;
            header->dwCaps2 |= DDS_CUBEMAP_ALLFACES;
        }
        break;

    case TEX_DIMENSION_TEXTURE3D:
#ifdef _M_X64
        if ( metadata.height > 0xFFFFFFFF
             || metadata.width > 0xFFFFFFFF
             || metadata.depth > 0xFFFFFFFF )
            return E_INVALIDARG;
#endif

        header->dwFlags |= DDS_HEADER_FLAGS_VOLUME;
        header->dwCaps2 |= DDS_FLAGS_VOLUME;
        header->dwHeight = static_cast<uint32_t>( metadata.height ); 
        header->dwWidth = static_cast<uint32_t>( metadata.width );
        header->dwDepth = static_cast<uint32_t>( metadata.depth );
        break;

    default:
        return E_FAIL;
    }

    size_t rowPitch, slicePitch;
    ComputePitch( metadata.format, metadata.width, metadata.height, rowPitch, slicePitch, CP_FLAGS_NONE );

#ifdef _M_X64
    if ( slicePitch > 0xFFFFFFFF
         || rowPitch > 0xFFFFFFFF )
        return E_FAIL;
#endif

    if ( IsCompressed( metadata.format ) )
    {
        header->dwFlags |= DDS_HEADER_FLAGS_LINEARSIZE;
        header->dwPitchOrLinearSize = static_cast<uint32_t>( slicePitch );
    }
    else
    {
        header->dwFlags |= DDS_HEADER_FLAGS_PITCH;
        header->dwPitchOrLinearSize = static_cast<uint32_t>( rowPitch );
    }

    if ( ddpf.dwSize == 0 )
    {
        memcpy_s( &header->ddspf, sizeof(header->ddspf), &DDSPF_DX10, sizeof(DDS_PIXELFORMAT) );

        auto ext = reinterpret_cast<DDS_HEADER_DXT10*>( reinterpret_cast<uint8_t*>(header) + sizeof(DDS_HEADER) );
        assert( ext );

        memset( ext, 0, sizeof(DDS_HEADER_DXT10) );
        ext->dxgiFormat = metadata.format;
        ext->resourceDimension = metadata.dimension;

#ifdef _M_X64
        if ( metadata.arraySize > 0xFFFFFFFF )
            return E_INVALIDARG;
#endif

        static_assert( TEX_MISC_TEXTURECUBE == DDS_RESOURCE_MISC_TEXTURECUBE, "DDS header mismatch");
        
        ext->miscFlag = metadata.miscFlags & ~TEX_MISC_TEXTURECUBE;

        if ( metadata.miscFlags & TEX_MISC_TEXTURECUBE )
        {
            ext->miscFlag |= TEX_MISC_TEXTURECUBE;
            assert( (metadata.arraySize % 6) == 0 );
            ext->arraySize = static_cast<UINT>( metadata.arraySize / 6 );
        }
        else
        {
            ext->arraySize = static_cast<UINT>( metadata.arraySize );
        }

        static_assert( TEX_MISC2_ALPHA_MODE_MASK == DDS_MISC_FLAGS2_ALPHA_MODE_MASK, "DDS header mismatch");

        static_assert( TEX_ALPHA_MODE_UNKNOWN == DDS_ALPHA_MODE_UNKNOWN, "DDS header mismatch");
        static_assert( TEX_ALPHA_MODE_STRAIGHT == DDS_ALPHA_MODE_STRAIGHT, "DDS header mismatch");
        static_assert( TEX_ALPHA_MODE_PREMULTIPLIED == DDS_ALPHA_MODE_PREMULTIPLIED, "DDS header mismatch");
        static_assert( TEX_ALPHA_MODE_OPAQUE == DDS_ALPHA_MODE_OPAQUE, "DDS header mismatch");
        static_assert( TEX_ALPHA_MODE_CUSTOM == DDS_ALPHA_MODE_CUSTOM, "DDS header mismatch");

        if ( flags & DDS_FLAGS_FORCE_DX10_EXT_MISC2 )
        {
            // This was formerly 'reserved'. D3DX10 and D3DX11 will fail if this value is anything other than 0
            ext->miscFlags2 = metadata.miscFlags2;
        }
    }
    else
    {
        memcpy_s( &header->ddspf, sizeof(header->ddspf), &ddpf, sizeof(ddpf) );
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Converts an image row with optional clearing of alpha value to 1.0
// Returns true if supported, false if expansion case not supported
//-------------------------------------------------------------------------------------
enum TEXP_LEGACY_FORMAT
{
    TEXP_LEGACY_UNKNOWN     = 0,
    TEXP_LEGACY_R8G8B8,
    TEXP_LEGACY_R3G3B2,
    TEXP_LEGACY_A8R3G3B2,
    TEXP_LEGACY_P8,
    TEXP_LEGACY_A8P8,
    TEXP_LEGACY_A4L4,
    TEXP_LEGACY_B4G4R4A4,
    TEXP_LEGACY_L8,
    TEXP_LEGACY_L16,
    TEXP_LEGACY_A8L8
};

inline static TEXP_LEGACY_FORMAT _FindLegacyFormat( DWORD flags )
{
    TEXP_LEGACY_FORMAT lformat = TEXP_LEGACY_UNKNOWN;

    if ( flags & CONV_FLAGS_PAL8 )
    {
        lformat = ( flags & CONV_FLAGS_A8P8 ) ? TEXP_LEGACY_A8P8 : TEXP_LEGACY_P8;
    }
    else if ( flags & CONV_FLAGS_888 )
        lformat = TEXP_LEGACY_R8G8B8;
    else if ( flags & CONV_FLAGS_332 )
        lformat = TEXP_LEGACY_R3G3B2;
    else if ( flags & CONV_FLAGS_8332 )
        lformat = TEXP_LEGACY_A8R3G3B2;
    else if ( flags & CONV_FLAGS_44 )
        lformat = TEXP_LEGACY_A4L4;
    else if ( flags & CONV_FLAGS_4444 )
        lformat = TEXP_LEGACY_B4G4R4A4;
    else if ( flags & CONV_FLAGS_L8 )
        lformat = TEXP_LEGACY_L8;
    else if ( flags & CONV_FLAGS_L16 )
        lformat = TEXP_LEGACY_L16;
    else if ( flags & CONV_FLAGS_A8L8 )
        lformat = TEXP_LEGACY_A8L8;

    return lformat;
}

_Success_(return != false)
static bool _LegacyExpandScanline( _Out_writes_bytes_(outSize) LPVOID pDestination, size_t outSize, _In_ DXGI_FORMAT outFormat, 
                                   _In_reads_bytes_(inSize) LPCVOID pSource, size_t inSize, _In_ TEXP_LEGACY_FORMAT inFormat,
                                   _In_reads_opt_(256) const uint32_t* pal8, _In_ DWORD flags )
{
    assert( pDestination && outSize > 0 );
    assert( pSource && inSize > 0 );
    assert( IsValid(outFormat) && !IsPlanar(outFormat) && !IsPalettized(outFormat) );

    switch( inFormat )
    {
    case TEXP_LEGACY_R8G8B8:
        if ( outFormat != DXGI_FORMAT_R8G8B8A8_UNORM )
            return false;

        // D3DFMT_R8G8B8 -> DXGI_FORMAT_R8G8B8A8_UNORM
        if ( inSize >= 3 && outSize >= 4 )
        {
            const uint8_t * __restrict sPtr = reinterpret_cast<const uint8_t*>(pSource);
            uint32_t * __restrict dPtr = reinterpret_cast<uint32_t*>(pDestination);

            for( size_t ocount = 0, icount = 0; ( ( icount < ( inSize - 2 ) ) && ( ocount < ( outSize - 3 ) ) ); icount += 3, ocount += 4 )
            {
                // 24bpp Direct3D 9 files are actually BGR, so need to swizzle as well
                uint32_t t1 = ( *(sPtr) << 16 );
                uint32_t t2 = ( *(sPtr+1) << 8 ); 
                uint32_t t3 = *(sPtr+2);

                *(dPtr++) = t1 | t2 | t3 | 0xff000000;
                sPtr += 3;
            }
            return true;
        }
        return false;

    case TEXP_LEGACY_R3G3B2:
        switch( outFormat )
        {
        case DXGI_FORMAT_R8G8B8A8_UNORM:
            // D3DFMT_R3G3B2 -> DXGI_FORMAT_R8G8B8A8_UNORM
            if ( inSize >= 1 && outSize >= 4 )
            {
                const uint8_t* __restrict sPtr = reinterpret_cast<const uint8_t*>(pSource);
                uint32_t * __restrict dPtr = reinterpret_cast<uint32_t*>(pDestination);

                for( size_t ocount = 0, icount = 0; ( ( icount < inSize ) && ( ocount < ( outSize - 3 ) ) ); ++icount, ocount += 4 )
                {
                    uint8_t t = *(sPtr++);

                    uint32_t t1 = (t & 0xe0) | ((t & 0xe0) >> 3) | ((t & 0xc0) >> 6);
                    uint32_t t2 = ((t & 0x1c) << 11) | ((t & 0x1c) << 8) | ((t & 0x18) << 5);
                    uint32_t t3 = ((t & 0x03) << 22) | ((t & 0x03) << 20) | ((t & 0x03) << 18) | ((t & 0x03) << 16);

                    *(dPtr++) = t1 | t2 | t3 | 0xff000000;
                }
                return true;
            }
            return false;

        case DXGI_FORMAT_B5G6R5_UNORM:
            // D3DFMT_R3G3B2 -> DXGI_FORMAT_B5G6R5_UNORM
            if ( inSize >= 1 && outSize >= 2 )
            {
                const uint8_t* __restrict sPtr = reinterpret_cast<const uint8_t*>(pSource);
                uint16_t * __restrict dPtr = reinterpret_cast<uint16_t*>(pDestination);

                for( size_t ocount = 0, icount = 0; ( ( icount < inSize ) && ( ocount < ( outSize - 1 ) ) ); ++icount, ocount += 2 )
                {
                    uint8_t t = *(sPtr++);

                    uint16_t t1 = ((t & 0xe0) << 8) | ((t & 0xc0) << 5);
                    uint16_t t2 = ((t & 0x1c) << 6) | ((t & 0x1c) << 3);
                    uint16_t t3 = ((t & 0x03) << 3) | ((t & 0x03) << 1) | ((t & 0x02) >> 1);

                    *(dPtr++) = t1 | t2 | t3;
                }
                return true;
            }
            return false;
        }
        break;

    case TEXP_LEGACY_A8R3G3B2:
        if ( outFormat != DXGI_FORMAT_R8G8B8A8_UNORM )
            return false;

        // D3DFMT_A8R3G3B2 -> DXGI_FORMAT_R8G8B8A8_UNORM
        if ( inSize >= 2 && outSize >= 4 )
        {
            const uint16_t* __restrict sPtr = reinterpret_cast<const uint16_t*>(pSource);
            uint32_t * __restrict dPtr = reinterpret_cast<uint32_t*>(pDestination);

            for( size_t ocount = 0, icount = 0; ( ( icount < ( inSize - 1 ) ) && ( ocount < ( outSize - 3 ) ) ); icount += 2, ocount += 4 )
            {
                uint16_t t = *(sPtr++);

                uint32_t t1 = (t & 0x00e0) | ((t & 0x00e0) >> 3) | ((t & 0x00c0) >> 6);
                uint32_t t2 = ((t & 0x001c) << 11) | ((t & 0x001c) << 8) | ((t & 0x0018) << 5);
                uint32_t t3 = ((t & 0x0003) << 22) | ((t & 0x0003) << 20) | ((t & 0x0003) << 18) | ((t & 0x0003) << 16);
                uint32_t ta = ( flags & TEXP_SCANLINE_SETALPHA ) ? 0xff000000 : ((t & 0xff00) << 16);

                *(dPtr++) = t1 | t2 | t3 | ta;
            }
            return true;
        }
        return false;

    case TEXP_LEGACY_P8:
        if ( (outFormat != DXGI_FORMAT_R8G8B8A8_UNORM) || !pal8 )
            return false;

        // D3DFMT_P8 -> DXGI_FORMAT_R8G8B8A8_UNORM
        if ( inSize >= 1 && outSize >= 4 )
        {
            const uint8_t* __restrict sPtr = reinterpret_cast<const uint8_t*>(pSource);
            uint32_t * __restrict dPtr = reinterpret_cast<uint32_t*>(pDestination);

            for( size_t ocount = 0, icount = 0; ( ( icount < inSize ) && ( ocount < ( outSize - 3 ) ) ); ++icount, ocount += 4 )
            {
                uint8_t t = *(sPtr++);

                *(dPtr++) = pal8[ t ];
            }
            return true;
        }
        return false;

    case TEXP_LEGACY_A8P8:
        if ( (outFormat != DXGI_FORMAT_R8G8B8A8_UNORM) || !pal8 )
            return false;

        // D3DFMT_A8P8 -> DXGI_FORMAT_R8G8B8A8_UNORM
        if ( inSize >= 2 && outSize >= 4 )
        {
            const uint16_t* __restrict sPtr = reinterpret_cast<const uint16_t*>(pSource);
            uint32_t * __restrict dPtr = reinterpret_cast<uint32_t*>(pDestination);

            for( size_t ocount = 0, icount = 0; ( ( icount < ( inSize - 1 ) ) && ( ocount < ( outSize - 3 ) ) ); icount += 2, ocount += 4 )
            {
                uint16_t t = *(sPtr++);

                uint32_t t1 = pal8[ t & 0xff ];
                uint32_t ta = ( flags & TEXP_SCANLINE_SETALPHA ) ? 0xff000000 : ((t & 0xff00) << 16);

                *(dPtr++) = t1 | ta;
            }
            return true;
        }
        return false;

    case TEXP_LEGACY_A4L4:
        switch( outFormat )
        {
        case DXGI_FORMAT_B4G4R4A4_UNORM :
            // D3DFMT_A4L4 -> DXGI_FORMAT_B4G4R4A4_UNORM 
            if ( inSize >= 1 && outSize >= 2 )
            {
                const uint8_t * __restrict sPtr = reinterpret_cast<const uint8_t*>(pSource);
                uint16_t * __restrict dPtr = reinterpret_cast<uint16_t*>(pDestination);

                for( size_t ocount = 0, icount = 0; ( ( icount < inSize ) && ( ocount < ( outSize - 1 ) ) ); ++icount, ocount += 2 )
                {
                    uint8_t t = *(sPtr++);

                    uint16_t t1 = (t & 0x0f);
                    uint16_t ta = ( flags & TEXP_SCANLINE_SETALPHA ) ? 0xf000 : ((t & 0xf0) << 8);

                    *(dPtr++) = t1 | (t1 << 4) | (t1 << 8) | ta;
                }
                return true;
            }
            return false;

        case DXGI_FORMAT_R8G8B8A8_UNORM:
            // D3DFMT_A4L4 -> DXGI_FORMAT_R8G8B8A8_UNORM
            if ( inSize >= 1 && outSize >= 4 )
            {
                const uint8_t * __restrict sPtr = reinterpret_cast<const uint8_t*>(pSource);
                uint32_t * __restrict dPtr = reinterpret_cast<uint32_t*>(pDestination);

                for( size_t ocount = 0, icount = 0; ( ( icount < inSize ) && ( ocount < ( outSize - 3 ) ) ); ++icount, ocount += 4 )
                {
                    uint8_t t = *(sPtr++);

                    uint32_t t1 = ((t & 0x0f) << 4) | (t & 0x0f);
                    uint32_t ta = ( flags & TEXP_SCANLINE_SETALPHA ) ? 0xff000000 : (((t & 0xf0) << 24) | ((t & 0xf0) << 20));

                    *(dPtr++) = t1 | (t1 << 8) | (t1 << 16) | ta;
                }
                return true;
            }
            return false;
        }
        break;

    case TEXP_LEGACY_B4G4R4A4:
        if (outFormat != DXGI_FORMAT_R8G8B8A8_UNORM)
            return false;

        // D3DFMT_A4R4G4B4 -> DXGI_FORMAT_R8G8B8A8_UNORM
        if ( inSize >= 2 && outSize >= 4 )
        {
            const uint16_t * __restrict sPtr = reinterpret_cast<const uint16_t*>(pSource);
            uint32_t * __restrict dPtr = reinterpret_cast<uint32_t*>(pDestination);

            for( size_t ocount = 0, icount = 0; ( ( icount < ( inSize - 1 ) ) && ( ocount < ( outSize - 3 ) ) ); icount += 2, ocount += 4 )
            {
                uint16_t t = *(sPtr++);

                uint32_t t1 = ((t & 0x0f00) >> 4) | ((t & 0x0f00) >> 8);
                uint32_t t2 = ((t & 0x00f0) << 8) | ((t & 0x00f0) << 4);
                uint32_t t3 = ((t & 0x000f) << 20) | ((t & 0x000f) << 16);
                uint32_t ta = ( flags & TEXP_SCANLINE_SETALPHA ) ? 0xff000000 : (((t & 0xf000) << 16) | ((t & 0xf000) << 12));

                *(dPtr++) = t1 | t2 | t3 | ta;
            }
            return true;
        }
        return false;

    case TEXP_LEGACY_L8:
        if (outFormat != DXGI_FORMAT_R8G8B8A8_UNORM)
            return false;

        // D3DFMT_L8 -> DXGI_FORMAT_R8G8B8A8_UNORM
        if ( inSize >= 1 && outSize >= 4 )
        {
            const uint8_t * __restrict sPtr = reinterpret_cast<const uint8_t*>(pSource);
            uint32_t * __restrict dPtr = reinterpret_cast<uint32_t*>(pDestination);

            for( size_t ocount = 0, icount = 0; ( ( icount < inSize ) && ( ocount < ( outSize - 3 ) ) ); ++icount, ocount += 4 )
            {
                uint32_t t1 = *(sPtr++);
                uint32_t t2 = (t1 << 8);
                uint32_t t3 = (t1 << 16);

                *(dPtr++) = t1 | t2 | t3 | 0xff000000;
            }
            return true;
        }
        return false;

    case TEXP_LEGACY_L16:
        if (outFormat != DXGI_FORMAT_R16G16B16A16_UNORM)
            return false;

        // D3DFMT_L16 -> DXGI_FORMAT_R16G16B16A16_UNORM
        if ( inSize >= 2 && outSize >= 8 )
        {
            const uint16_t* __restrict sPtr = reinterpret_cast<const uint16_t*>(pSource);
            uint64_t * __restrict dPtr = reinterpret_cast<uint64_t*>(pDestination);

            for( size_t ocount = 0, icount = 0; ( ( icount < ( inSize - 1 ) ) && ( ocount < ( outSize - 7 ) ) ); icount += 2, ocount += 8 )
            {
                uint16_t t = *(sPtr++);

                uint64_t t1 = t;
                uint64_t t2 = (t1 << 16);
                uint64_t t3 = (t1 << 32);

                *(dPtr++) = t1 | t2 | t3 | 0xffff000000000000;
            }
            return true;
        }
        return false;

    case TEXP_LEGACY_A8L8:
        if (outFormat != DXGI_FORMAT_R8G8B8A8_UNORM)
            return false;

        // D3DFMT_A8L8 -> DXGI_FORMAT_R8G8B8A8_UNORM
        if ( inSize >= 2 && outSize >= 4 )
        {
            const uint16_t* __restrict sPtr = reinterpret_cast<const uint16_t*>(pSource);
            uint32_t * __restrict dPtr = reinterpret_cast<uint32_t*>(pDestination);

            for( size_t ocount = 0, icount = 0; ( ( icount < ( inSize - 1 ) ) && ( ocount < ( outSize - 3 ) ) ); icount += 2, ocount += 4 )
            {
                uint16_t t = *(sPtr++);

                uint32_t t1 = (t & 0xff);
                uint32_t t2 = (t1 << 8);
                uint32_t t3 = (t1 << 16);
                uint32_t ta = ( flags & TEXP_SCANLINE_SETALPHA ) ? 0xff000000 : ((t & 0xff00) << 16);

                *(dPtr++) = t1 | t2 | t3 | ta;
            }
            return true;
        }
        return false;
    }

    return false;
}


//-------------------------------------------------------------------------------------
// Converts or copies image data from pPixels into scratch image data
//-------------------------------------------------------------------------------------
static HRESULT _CopyImage( _In_reads_bytes_(size) const void* pPixels, _In_ size_t size, 
                           _In_ const TexMetadata& metadata, _In_ DWORD cpFlags, _In_ DWORD convFlags, _In_reads_opt_(256) const uint32_t *pal8, _In_ const ScratchImage& image )
{
    assert( pPixels );
    assert( image.GetPixels() );

    if ( !size )
        return E_FAIL;
     
    if ( convFlags & CONV_FLAGS_EXPAND )
    {
        if ( convFlags & CONV_FLAGS_888 )
            cpFlags |= CP_FLAGS_24BPP;
        else if ( convFlags & (CONV_FLAGS_565 | CONV_FLAGS_5551 | CONV_FLAGS_4444 | CONV_FLAGS_8332 | CONV_FLAGS_A8P8 | CONV_FLAGS_L16 | CONV_FLAGS_A8L8) )
            cpFlags |= CP_FLAGS_16BPP;
        else if ( convFlags & (CONV_FLAGS_44 | CONV_FLAGS_332 | CONV_FLAGS_PAL8 | CONV_FLAGS_L8) )
            cpFlags |= CP_FLAGS_8BPP;
    }

    size_t pixelSize, nimages;
    _DetermineImageArray( metadata, cpFlags, nimages, pixelSize );
    if ( (nimages == 0) || (nimages != image.GetImageCount()) )
    {
        return E_FAIL;
    }

    assert( pixelSize <= size );

    std::unique_ptr<Image[]> timages( new (std::nothrow) Image[nimages] );
    if ( !timages )
    {
        return E_OUTOFMEMORY;
    }

    if ( !_SetupImageArray( (uint8_t*)pPixels, size, metadata, cpFlags, timages.get(), nimages ) )
    {
        return E_FAIL;
    }

    if ( nimages != image.GetImageCount() )
    {
        return E_FAIL;
    }

    const Image* images = image.GetImages();
    if ( !images )
    {
        return E_FAIL;
    }

    DWORD tflags = (convFlags & CONV_FLAGS_NOALPHA) ? TEXP_SCANLINE_SETALPHA : 0;
    if ( convFlags & CONV_FLAGS_SWIZZLE )
        tflags |= TEXP_SCANLINE_LEGACY;

    switch (metadata.dimension)
    {
    case TEX_DIMENSION_TEXTURE1D:
    case TEX_DIMENSION_TEXTURE2D:
        {
            size_t index = 0;
            for( size_t item = 0; item < metadata.arraySize; ++item )
            {
                for( size_t level = 0; level < metadata.mipLevels; ++level, ++index )
                {
                    if ( index >= nimages )
                        return E_FAIL;

                    if ( images[ index ].height != timages[ index ].height )
                        return E_FAIL;

                    size_t dpitch = images[ index ].rowPitch;
                    size_t spitch = timages[ index ].rowPitch;

                    const uint8_t *pSrc = const_cast<const uint8_t*>( timages[ index ].pixels );
                    if ( !pSrc )
                        return E_POINTER;

                    uint8_t *pDest = images[ index ].pixels;
                    if ( !pDest )
                        return E_POINTER;

                    if ( IsCompressed( metadata.format ) )
                    {
                        size_t csize = std::min<size_t>( images[ index ].slicePitch, timages[ index ].slicePitch );
                        memcpy_s( pDest, images[ index ].slicePitch, pSrc, csize );
                    }
                    else if ( IsPlanar( metadata.format ) )
                    {
                        size_t count = ComputeScanlines( metadata.format, images[ index ].height );
                        if ( !count )
                            return E_UNEXPECTED;

                        size_t csize = std::min<size_t>( dpitch, spitch );
                        for( size_t h = 0; h < count; ++h )
                        {
                            memcpy_s( pDest, dpitch, pSrc, csize );
                            pSrc += spitch;
                            pDest += dpitch;
                        }
                    }
                    else
                    {
                        for( size_t h = 0; h < images[ index ].height; ++h )
                        {
                            if ( convFlags & CONV_FLAGS_EXPAND )
                            {
                                if ( convFlags & (CONV_FLAGS_565|CONV_FLAGS_5551|CONV_FLAGS_4444) )
                                {
                                    if ( !_ExpandScanline( pDest, dpitch, DXGI_FORMAT_R8G8B8A8_UNORM,
                                                           pSrc, spitch,
                                                           (convFlags & CONV_FLAGS_565) ? DXGI_FORMAT_B5G6R5_UNORM : DXGI_FORMAT_B5G5R5A1_UNORM,
                                                           tflags ) )
                                        return E_FAIL;
                                }
                                else
                                {
                                    TEXP_LEGACY_FORMAT lformat = _FindLegacyFormat( convFlags );
                                    if ( !_LegacyExpandScanline( pDest, dpitch, metadata.format,
                                                                 pSrc, spitch, lformat, pal8,
                                                                 tflags ) )
                                        return E_FAIL;
                                }
                            }
                            else if ( convFlags & CONV_FLAGS_SWIZZLE )
                            {
                                _SwizzleScanline( pDest, dpitch, pSrc, spitch,
                                                  metadata.format, tflags );
                            }
                            else
                            {
                                _CopyScanline( pDest, dpitch, pSrc, spitch,
                                               metadata.format, tflags );
                            }

                            pSrc += spitch;
                            pDest += dpitch;
                        }
                    }
                }
            }
        }
        break;

    case TEX_DIMENSION_TEXTURE3D:
        {
            size_t index = 0;
            size_t d = metadata.depth;

            for( size_t level = 0; level < metadata.mipLevels; ++level )
            {
                for( size_t slice = 0; slice < d; ++slice, ++index )
                {
                    if ( index >= nimages )
                        return E_FAIL;

                    if ( images[ index ].height != timages[ index ].height )
                        return E_FAIL;

                    size_t dpitch = images[ index ].rowPitch;
                    size_t spitch = timages[ index ].rowPitch;

                    const uint8_t *pSrc = const_cast<const uint8_t*>( timages[ index ].pixels );
                    if ( !pSrc )
                        return E_POINTER;

                    uint8_t *pDest = images[ index ].pixels;
                    if ( !pDest )
                        return E_POINTER;

                    if ( IsCompressed( metadata.format ) )
                    {
                        size_t csize = std::min<size_t>( images[ index ].slicePitch, timages[ index ].slicePitch );
                        memcpy_s( pDest, images[ index ].slicePitch, pSrc, csize );
                    }
                    else if ( IsPlanar( metadata.format ) )
                    {
                        // Direct3D does not support any planar formats for Texture3D
                        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
                    }
                    else
                    {
                        for( size_t h = 0; h < images[ index ].height; ++h )
                        {
                            if ( convFlags & CONV_FLAGS_EXPAND )
                            {
                                if ( convFlags & (CONV_FLAGS_565|CONV_FLAGS_5551|CONV_FLAGS_4444) )
                                {
                                    if ( !_ExpandScanline( pDest, dpitch, DXGI_FORMAT_R8G8B8A8_UNORM,
                                                           pSrc, spitch,
                                                           (convFlags & CONV_FLAGS_565) ? DXGI_FORMAT_B5G6R5_UNORM : DXGI_FORMAT_B5G5R5A1_UNORM,
                                                           tflags ) )
                                        return E_FAIL;
                                }
                                else
                                {
                                    TEXP_LEGACY_FORMAT lformat = _FindLegacyFormat( convFlags );
                                    if ( !_LegacyExpandScanline( pDest, dpitch, metadata.format,
                                                                 pSrc, spitch, lformat, pal8,
                                                                 tflags ) )
                                        return E_FAIL;
                                }
                            }
                            else if ( convFlags & CONV_FLAGS_SWIZZLE )
                            {
                                _SwizzleScanline( pDest, dpitch, pSrc, spitch, metadata.format, tflags );
                            }
                            else
                            {
                                _CopyScanline( pDest, dpitch, pSrc, spitch, metadata.format, tflags );
                            }

                            pSrc += spitch;
                            pDest += dpitch;
                        }
                    }
                }

                if ( d > 1 )
                    d >>= 1;
            }
        }
        break;

    default:
        return E_FAIL;
    }

    return S_OK;
}

static HRESULT _CopyImageInPlace( DWORD convFlags, _In_ const ScratchImage& image )
{
    if ( !image.GetPixels() )
        return E_FAIL;

    const Image* images = image.GetImages();
    if ( !images )
        return E_FAIL;

    const TexMetadata& metadata = image.GetMetadata();

    if ( IsPlanar( metadata.format ) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    DWORD tflags = (convFlags & CONV_FLAGS_NOALPHA) ? TEXP_SCANLINE_SETALPHA : 0;
    if ( convFlags & CONV_FLAGS_SWIZZLE )
        tflags |= TEXP_SCANLINE_LEGACY;

    for( size_t i = 0; i < image.GetImageCount(); ++i )
    {
        const Image* img = &images[ i ];
        uint8_t *pPixels = img->pixels;
        if ( !pPixels )
            return E_POINTER;

        size_t rowPitch = img->rowPitch;

        for( size_t h = 0; h < img->height; ++h )
        {
            if ( convFlags & CONV_FLAGS_SWIZZLE )
            {
                _SwizzleScanline( pPixels, rowPitch, pPixels, rowPitch, metadata.format, tflags );
            }
            else
            {
                _CopyScanline( pPixels, rowPitch, pPixels, rowPitch, metadata.format, tflags );
            }

            pPixels += rowPitch;
        }
    }

    return S_OK;
}


//=====================================================================================
// Entry-points
//=====================================================================================

//-------------------------------------------------------------------------------------
// Obtain metadata from DDS file in memory/on disk
//-------------------------------------------------------------------------------------

_Use_decl_annotations_
HRESULT GetMetadataFromDDSMemory( LPCVOID pSource, size_t size, DWORD flags, TexMetadata& metadata )
{
    if ( !pSource || size == 0 )
        return E_INVALIDARG;

    DWORD convFlags = 0;
    return _DecodeDDSHeader( pSource, size, flags, metadata, convFlags );
}

_Use_decl_annotations_
HRESULT GetMetadataFromDDSFile( LPCWSTR szFile, DWORD flags, TexMetadata& metadata )
{
    if ( !szFile )
        return E_INVALIDARG;

#if (_WIN32_WINNT >= _WIN32_WINNT_WIN8)
    ScopedHandle hFile( safe_handle( CreateFile2( szFile, GENERIC_READ, FILE_SHARE_READ, OPEN_EXISTING, 0 ) ) );
#else
    ScopedHandle hFile( safe_handle( CreateFileW( szFile, GENERIC_READ, FILE_SHARE_READ, 0, OPEN_EXISTING,
                                                  FILE_FLAG_SEQUENTIAL_SCAN, 0 ) ) );
#endif
    if ( !hFile )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    // Get the file size
    LARGE_INTEGER fileSize = {0};

#if (_WIN32_WINNT >= _WIN32_WINNT_VISTA)
    FILE_STANDARD_INFO fileInfo;
    if ( !GetFileInformationByHandleEx( hFile.get(), FileStandardInfo, &fileInfo, sizeof(fileInfo) ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }
    fileSize = fileInfo.EndOfFile;
#else
    if ( !GetFileSizeEx( hFile.get(), &fileSize ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }
#endif

    // File is too big for 32-bit allocation, so reject read (4 GB should be plenty large enough for a valid DDS file)
    if ( fileSize.HighPart > 0 )
    {
        return HRESULT_FROM_WIN32( ERROR_FILE_TOO_LARGE );
    }

    // Need at least enough data to fill the standard header and magic number to be a valid DDS
    if ( fileSize.LowPart < ( sizeof(DDS_HEADER) + sizeof(uint32_t) ) )
    {
        return E_FAIL;
    }

    // Read the header in (including extended header if present)
    const size_t MAX_HEADER_SIZE = sizeof(uint32_t) + sizeof(DDS_HEADER) + sizeof(DDS_HEADER_DXT10);
    uint8_t header[MAX_HEADER_SIZE];

    DWORD bytesRead = 0;
    if ( !ReadFile( hFile.get(), header, MAX_HEADER_SIZE, &bytesRead, 0 ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    DWORD convFlags = 0;
    return _DecodeDDSHeader( header, bytesRead, flags, metadata, convFlags );
}


//-------------------------------------------------------------------------------------
// Load a DDS file in memory
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT LoadFromDDSMemory( LPCVOID pSource, size_t size, DWORD flags, TexMetadata* metadata, ScratchImage& image )
{
    if ( !pSource || size == 0 )
        return E_INVALIDARG;

    image.Release();

    DWORD convFlags = 0;
    TexMetadata mdata;
    HRESULT hr = _DecodeDDSHeader( pSource, size, flags, mdata, convFlags );  
    if ( FAILED(hr) )
        return hr;

    size_t offset = sizeof(uint32_t) + sizeof(DDS_HEADER);
    if ( convFlags & CONV_FLAGS_DX10 )
        offset += sizeof(DDS_HEADER_DXT10);

    assert( offset <= size );

    const uint32_t *pal8 = nullptr;
    if ( convFlags & CONV_FLAGS_PAL8 )
    {
        pal8 = reinterpret_cast<const uint32_t*>( reinterpret_cast<const uint8_t*>(pSource) + offset );
        assert( pal8 );
        offset += ( 256 * sizeof(uint32_t) );
        if ( size < offset )
            return E_FAIL;
    }

    hr = image.Initialize( mdata );
    if ( FAILED(hr) )
        return hr;

    auto pPixels = reinterpret_cast<LPCVOID>( reinterpret_cast<const uint8_t*>(pSource) + offset );
    assert( pPixels );
    hr = _CopyImage( pPixels, size - offset, mdata,
                     (flags & DDS_FLAGS_LEGACY_DWORD) ? CP_FLAGS_LEGACY_DWORD : CP_FLAGS_NONE, convFlags, pal8, image );
    if ( FAILED(hr) )
    {
        image.Release();
        return hr;
    }
    if ( metadata )
        memcpy( metadata, &mdata, sizeof(TexMetadata) );

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Load a DDS file from disk
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT LoadFromDDSFile( LPCWSTR szFile, DWORD flags, TexMetadata* metadata, ScratchImage& image )
{
    if ( !szFile )
        return E_INVALIDARG;

    image.Release();

#if (_WIN32_WINNT >= _WIN32_WINNT_WIN8)
    ScopedHandle hFile( safe_handle ( CreateFile2( szFile, GENERIC_READ, FILE_SHARE_READ, OPEN_EXISTING, 0 ) ) );
#else
    ScopedHandle hFile( safe_handle ( CreateFileW( szFile, GENERIC_READ, FILE_SHARE_READ, 0, OPEN_EXISTING,
                                                   FILE_FLAG_SEQUENTIAL_SCAN, 0 ) ) );
#endif

    if ( !hFile )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    // Get the file size
    LARGE_INTEGER fileSize = {0};

#if (_WIN32_WINNT >= _WIN32_WINNT_VISTA)
    FILE_STANDARD_INFO fileInfo;
    if ( !GetFileInformationByHandleEx( hFile.get(), FileStandardInfo, &fileInfo, sizeof(fileInfo) ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }
    fileSize = fileInfo.EndOfFile;
#else
    if ( !GetFileSizeEx( hFile.get(), &fileSize ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }
#endif

    // File is too big for 32-bit allocation, so reject read (4 GB should be plenty large enough for a valid DDS file)
    if ( fileSize.HighPart > 0 )
    {
        return HRESULT_FROM_WIN32( ERROR_FILE_TOO_LARGE );
    }

    // Need at least enough data to fill the standard header and magic number to be a valid DDS
    if ( fileSize.LowPart < ( sizeof(DDS_HEADER) + sizeof(uint32_t) ) )
    {
        return E_FAIL;
    }

    // Read the header in (including extended header if present)
    const size_t MAX_HEADER_SIZE = sizeof(uint32_t) + sizeof(DDS_HEADER) + sizeof(DDS_HEADER_DXT10);
    uint8_t header[MAX_HEADER_SIZE];

    DWORD bytesRead = 0;
    if ( !ReadFile( hFile.get(), header, MAX_HEADER_SIZE, &bytesRead, 0 ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    DWORD convFlags = 0;
    TexMetadata mdata;
    HRESULT hr = _DecodeDDSHeader( header, bytesRead, flags, mdata, convFlags );
    if ( FAILED(hr) )
        return hr;

    DWORD offset = MAX_HEADER_SIZE;

    if ( !(convFlags & CONV_FLAGS_DX10) )
    {
        // Must reset file position since we read more than the standard header above
        LARGE_INTEGER filePos = { sizeof(uint32_t) + sizeof(DDS_HEADER), 0};
        if ( !SetFilePointerEx( hFile.get(), filePos, 0, FILE_BEGIN ) )
        {
            return HRESULT_FROM_WIN32( GetLastError() );
        }

        offset = sizeof(uint32_t) + sizeof(DDS_HEADER);
    }

    std::unique_ptr<uint32_t[]> pal8;
    if ( convFlags & CONV_FLAGS_PAL8 )
    {
        pal8.reset( new (std::nothrow) uint32_t[256] );
        if ( !pal8 )
        {
            return E_OUTOFMEMORY;
        }

        if ( !ReadFile( hFile.get(), pal8.get(), 256 * sizeof(uint32_t), &bytesRead, 0 ) )
        {
            return HRESULT_FROM_WIN32( GetLastError() );
        }

        if ( bytesRead != (256 * sizeof(uint32_t)) )
        {
            return E_FAIL;
        }

        offset += ( 256 * sizeof(uint32_t) );
    }

    DWORD remaining = fileSize.LowPart - offset;
    if ( remaining == 0 )
        return E_FAIL;

    hr = image.Initialize( mdata );
    if ( FAILED(hr) )
        return hr;

    if ( (convFlags & CONV_FLAGS_EXPAND) || (flags & DDS_FLAGS_LEGACY_DWORD) )
    {
        std::unique_ptr<uint8_t[]> temp( new (std::nothrow) uint8_t[ remaining ] );
        if ( !temp )
        {
            image.Release();
            return E_OUTOFMEMORY;
        }

        if ( !ReadFile( hFile.get(), temp.get(), remaining, &bytesRead, 0 ) )
        {
            image.Release();
            return HRESULT_FROM_WIN32( GetLastError() );
        }

        if ( bytesRead != remaining )
        {
            image.Release();
            return E_FAIL;
        }

        hr = _CopyImage( temp.get(), remaining, mdata,
                         (flags & DDS_FLAGS_LEGACY_DWORD) ? CP_FLAGS_LEGACY_DWORD : CP_FLAGS_NONE,
                         convFlags, pal8.get(), image );
        if ( FAILED(hr) )
        {
            image.Release();
            return hr;
        }
    }
    else
    {
        if ( remaining > image.GetPixelsSize() )
        {
            image.Release();
            return E_FAIL;
        }

        if ( !ReadFile( hFile.get(), image.GetPixels(), static_cast<DWORD>( image.GetPixelsSize() ), &bytesRead, 0 ) )
        {
            image.Release();
            return HRESULT_FROM_WIN32( GetLastError() );
        }

        if ( convFlags & (CONV_FLAGS_SWIZZLE|CONV_FLAGS_NOALPHA) )
        {
            // Swizzle/copy image in place
            hr = _CopyImageInPlace( convFlags, image );
            if ( FAILED(hr) )
            {
                image.Release();
                return hr;
            }
        }
    }

    if ( metadata )
        memcpy( metadata, &mdata, sizeof(TexMetadata) );

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Save a DDS file to memory
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT SaveToDDSMemory( const Image* images, size_t nimages, const TexMetadata& metadata, DWORD flags, Blob& blob )
{
    if ( !images || (nimages == 0) )
        return E_INVALIDARG;

    // Determine memory required
    size_t required = 0;
    HRESULT hr = _EncodeDDSHeader( metadata, flags, 0, 0, required );
    if ( FAILED(hr) )
        return hr;

    bool fastpath = true;

    for( size_t i = 0; i < nimages; ++i )
    {
        if ( !images[ i ].pixels )
            return E_POINTER;

        if ( images[ i ].format != metadata.format )
            return E_FAIL;

        size_t ddsRowPitch, ddsSlicePitch;
        ComputePitch( metadata.format, images[ i ].width, images[ i ].height, ddsRowPitch, ddsSlicePitch, CP_FLAGS_NONE );

        assert( images[ i ].rowPitch > 0 );
        assert( images[ i ].slicePitch > 0 );

        if ( ( images[ i ].rowPitch != ddsRowPitch ) || ( images[ i ].slicePitch != ddsSlicePitch ) )
        {
            fastpath = false;
        }

        required += ddsSlicePitch;
    }

    assert( required > 0 );

    blob.Release();

    hr = blob.Initialize( required );
    if ( FAILED(hr) )
        return hr;

    auto pDestination = reinterpret_cast<uint8_t*>( blob.GetBufferPointer() );
    assert( pDestination );

    hr = _EncodeDDSHeader( metadata, flags, pDestination, blob.GetBufferSize(), required );
    if ( FAILED(hr) )
    {
        blob.Release();
        return hr;
    }

    size_t remaining = blob.GetBufferSize() - required;
    pDestination += required;

    if ( !remaining )
    {
        blob.Release();
        return E_FAIL;
    }

    switch( metadata.dimension )
    {
    case DDS_DIMENSION_TEXTURE1D:
    case DDS_DIMENSION_TEXTURE2D:
        {
            size_t index = 0;
            for( size_t item = 0; item < metadata.arraySize; ++item )
            {
                for( size_t level = 0; level < metadata.mipLevels; ++level )
                {
                    if ( index >= nimages )
                    {
                        blob.Release();
                        return E_FAIL;
                    }

                    if ( fastpath )
                    {
                        size_t pixsize = images[ index ].slicePitch;
                        if ( memcpy_s( pDestination, remaining, images[ index ].pixels, pixsize ) )
                        {
                            blob.Release();
                            return E_FAIL;
                        }

                        pDestination += pixsize;
                        remaining -= pixsize;
                    }
                    else
                    {
                        size_t ddsRowPitch, ddsSlicePitch;
                        ComputePitch( metadata.format, images[ index ].width, images[ index ].height, ddsRowPitch, ddsSlicePitch, CP_FLAGS_NONE );

                        size_t rowPitch = images[ index ].rowPitch;

                        const uint8_t * __restrict sPtr = reinterpret_cast<const uint8_t*>(images[ index ].pixels);
                        uint8_t * __restrict dPtr = reinterpret_cast<uint8_t*>(pDestination);

                        size_t lines = ComputeScanlines( metadata.format, images[ index ].height );
                        size_t csize = std::min<size_t>( rowPitch, ddsRowPitch );
                        size_t tremaining = remaining;
                        for( size_t j = 0; j < lines; ++j )
                        {
                            if ( memcpy_s( dPtr, tremaining, sPtr, csize ) )
                            {
                                blob.Release();
                                return E_FAIL;
                            }

                            sPtr += rowPitch;
                            dPtr += ddsRowPitch;
                            tremaining -= ddsRowPitch;
                        }

                        pDestination += ddsSlicePitch;
                        remaining -= ddsSlicePitch;
                    }

                    ++index;
                }
            }
        }
        break;

    case DDS_DIMENSION_TEXTURE3D:
        {
            if ( metadata.arraySize != 1 )
            {
                blob.Release();
                return E_FAIL;
            }

            size_t d = metadata.depth;

            size_t index = 0;
            for( size_t level = 0; level < metadata.mipLevels; ++level )
            {
                for( size_t slice = 0; slice < d; ++slice )
                {
                    if ( index >= nimages )
                    {
                        blob.Release();
                        return E_FAIL;
                    }

                    if ( fastpath )
                    {
                        size_t pixsize = images[ index ].slicePitch;
                        if ( memcpy_s( pDestination, remaining, images[ index ].pixels, pixsize ) )
                        {
                            blob.Release();
                            return E_FAIL;
                        }

                        pDestination += pixsize;
                        remaining -= pixsize;
                    }
                    else
                    {
                        size_t ddsRowPitch, ddsSlicePitch;
                        ComputePitch( metadata.format, images[ index ].width, images[ index ].height, ddsRowPitch, ddsSlicePitch, CP_FLAGS_NONE );

                        size_t rowPitch = images[ index ].rowPitch;

                        const uint8_t * __restrict sPtr = reinterpret_cast<const uint8_t*>(images[ index ].pixels);
                        uint8_t * __restrict dPtr = reinterpret_cast<uint8_t*>(pDestination);

                        size_t lines = ComputeScanlines( metadata.format, images[ index ].height );
                        size_t csize = std::min<size_t>( rowPitch, ddsRowPitch );
                        size_t tremaining = remaining;
                        for( size_t j = 0; j < lines; ++j )
                        {
                            if ( memcpy_s( dPtr, tremaining, sPtr, csize ) )
                            {
                                blob.Release();
                                return E_FAIL;
                            }

                            sPtr += rowPitch;
                            dPtr += ddsRowPitch;
                            tremaining -= ddsRowPitch;
                        }

                        pDestination += ddsSlicePitch;
                        remaining -= ddsSlicePitch;
                    }

                    ++index;
                }

                if ( d > 1 )
                    d >>= 1;
            }
        }
        break;

    default:
        blob.Release();
        return E_FAIL;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Save a DDS file to disk
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT SaveToDDSFile( const Image* images, size_t nimages, const TexMetadata& metadata, DWORD flags, LPCWSTR szFile )
{
    if ( !szFile )
        return E_INVALIDARG;

    // Create DDS Header
    const size_t MAX_HEADER_SIZE = sizeof(uint32_t) + sizeof(DDS_HEADER) + sizeof(DDS_HEADER_DXT10);
    uint8_t header[MAX_HEADER_SIZE];
    size_t required;
    HRESULT hr = _EncodeDDSHeader( metadata, flags, header, MAX_HEADER_SIZE, required );
    if ( FAILED(hr) )
        return hr;

    // Create file and write header
#if (_WIN32_WINNT >= _WIN32_WINNT_WIN8)
    ScopedHandle hFile( safe_handle( CreateFile2( szFile, GENERIC_WRITE, 0, CREATE_ALWAYS, 0 ) ) );
#else
    ScopedHandle hFile( safe_handle( CreateFileW( szFile, GENERIC_WRITE, 0, 0, CREATE_ALWAYS, 0, 0 ) ) );
#endif
    if ( !hFile )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    DWORD bytesWritten;
    if ( !WriteFile( hFile.get(), header, static_cast<DWORD>( required ), &bytesWritten, 0 ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    if ( bytesWritten != required )
    {
        return E_FAIL;
    }

    // Write images
    switch( metadata.dimension )
    {
    case DDS_DIMENSION_TEXTURE1D:
    case DDS_DIMENSION_TEXTURE2D:
        {
            size_t index = 0;
            for( size_t item = 0; item < metadata.arraySize; ++item )
            {
                for( size_t level = 0; level < metadata.mipLevels; ++level, ++index )
                {
                    if ( index >= nimages )
                        return E_FAIL;

                    if ( !images[ index ].pixels )
                        return E_POINTER;

                    assert( images[ index ].rowPitch > 0 );
                    assert( images[ index ].slicePitch > 0 );

                    size_t ddsRowPitch, ddsSlicePitch;
                    ComputePitch( metadata.format, images[ index ].width, images[ index ].height, ddsRowPitch, ddsSlicePitch, CP_FLAGS_NONE );

                    if ( images[ index ].slicePitch == ddsSlicePitch )
                    {
                        if ( !WriteFile( hFile.get(), images[ index ].pixels, static_cast<DWORD>( ddsSlicePitch ), &bytesWritten, 0 ) )
                        {
                            return HRESULT_FROM_WIN32( GetLastError() );
                        }

                        if ( bytesWritten != ddsSlicePitch )
                        {
                            return E_FAIL;
                        }
                    }
                    else
                    {
                        size_t rowPitch = images[ index ].rowPitch;
                        if ( rowPitch < ddsRowPitch )
                        {
                            // DDS uses 1-byte alignment, so if this is happening then the input pitch isn't actually a full line of data
                            return E_FAIL;
                        }

                        const uint8_t * __restrict sPtr = reinterpret_cast<const uint8_t*>(images[ index ].pixels);

                        size_t lines = ComputeScanlines( metadata.format, images[ index ].height );
                        for( size_t j = 0; j < lines; ++j )
                        {
                            if ( !WriteFile( hFile.get(), sPtr, static_cast<DWORD>( ddsRowPitch ), &bytesWritten, 0 ) )
                            {
                                return HRESULT_FROM_WIN32( GetLastError() );
                            }

                            if ( bytesWritten != ddsRowPitch )
                            {
                                return E_FAIL;
                            }

                            sPtr += rowPitch;
                        }
                    }
                }
            }
        }
        break;

    case DDS_DIMENSION_TEXTURE3D:
        {
            if ( metadata.arraySize != 1 )
                return E_FAIL;

            size_t d = metadata.depth;

            size_t index = 0;
            for( size_t level = 0; level < metadata.mipLevels; ++level )
            {
                for( size_t slice = 0; slice < d; ++slice, ++index )
                {
                    if ( index >= nimages )
                        return E_FAIL;

                    if ( !images[ index ].pixels )
                        return E_POINTER;

                    assert( images[ index ].rowPitch > 0 );
                    assert( images[ index ].slicePitch > 0 );

                    size_t ddsRowPitch, ddsSlicePitch;
                    ComputePitch( metadata.format, images[ index ].width, images[ index ].height, ddsRowPitch, ddsSlicePitch, CP_FLAGS_NONE );

                    if ( images[ index ].slicePitch == ddsSlicePitch )
                    {
                        if ( !WriteFile( hFile.get(), images[ index ].pixels, static_cast<DWORD>( ddsSlicePitch ), &bytesWritten, 0 ) )
                        {
                            return HRESULT_FROM_WIN32( GetLastError() );
                        }

                        if ( bytesWritten != ddsSlicePitch )
                        {
                            return E_FAIL;
                        }
                    }
                    else
                    {
                        size_t rowPitch = images[ index ].rowPitch;
                        if ( rowPitch < ddsRowPitch )
                        {
                            // DDS uses 1-byte alignment, so if this is happening then the input pitch isn't actually a full line of data
                            return E_FAIL;
                        }

                        const uint8_t * __restrict sPtr = reinterpret_cast<const uint8_t*>(images[ index ].pixels);

                        size_t lines = ComputeScanlines( metadata.format, images[ index ].height );
                        for( size_t j = 0; j < lines; ++j )
                        {
                            if ( !WriteFile( hFile.get(), sPtr, static_cast<DWORD>( ddsRowPitch ), &bytesWritten, 0 ) )
                            {
                                return HRESULT_FROM_WIN32( GetLastError() );
                            }

                            if ( bytesWritten != ddsRowPitch )
                            {
                                return E_FAIL;
                            }

                            sPtr += rowPitch;
                        }
                    }
                }

                if ( d > 1 )
                    d >>= 1;
            }
        }
        break;

    default:
        return E_FAIL;
    }

    return S_OK;
}

}; // namespace
