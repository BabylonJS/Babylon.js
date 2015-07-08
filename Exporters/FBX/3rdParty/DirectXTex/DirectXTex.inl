//-------------------------------------------------------------------------------------
// DirectXTex.inl
//  
// DirectX Texture Library
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

#if defined(_MSC_VER) && (_MSC_VER > 1000)
#pragma once
#endif

//=====================================================================================
// DXGI Format Utilities
//=====================================================================================

_Use_decl_annotations_
inline bool IsValid( DXGI_FORMAT fmt )
{
    return ( static_cast<size_t>(fmt) >= 1 && static_cast<size_t>(fmt) <= 120 );
}

_Use_decl_annotations_
inline bool IsCompressed( DXGI_FORMAT fmt )
{
    switch ( fmt )
    {
    case DXGI_FORMAT_BC1_TYPELESS:
    case DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT_BC1_UNORM_SRGB:
    case DXGI_FORMAT_BC2_TYPELESS:
    case DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT_BC2_UNORM_SRGB:
    case DXGI_FORMAT_BC3_TYPELESS:
    case DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT_BC3_UNORM_SRGB:
    case DXGI_FORMAT_BC4_TYPELESS:
    case DXGI_FORMAT_BC4_UNORM:
    case DXGI_FORMAT_BC4_SNORM:
    case DXGI_FORMAT_BC5_TYPELESS:
    case DXGI_FORMAT_BC5_UNORM:
    case DXGI_FORMAT_BC5_SNORM:
    case DXGI_FORMAT_BC6H_TYPELESS:
    case DXGI_FORMAT_BC6H_UF16:
    case DXGI_FORMAT_BC6H_SF16:
    case DXGI_FORMAT_BC7_TYPELESS:
    case DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
        return true;

    default:
        return false;
    }
}

_Use_decl_annotations_
inline bool IsPacked( DXGI_FORMAT fmt )
{
    switch( fmt )
    {
    case DXGI_FORMAT_R8G8_B8G8_UNORM:
    case DXGI_FORMAT_G8R8_G8B8_UNORM:
    case DXGI_FORMAT_YUY2: // 4:2:2 8-bit
    case DXGI_FORMAT_Y210: // 4:2:2 10-bit
    case DXGI_FORMAT_Y216: // 4:2:2 16-bit
        return true;

    default:
        return false;
    }
}

_Use_decl_annotations_
inline bool IsPlanar( DXGI_FORMAT fmt )
{
    switch ( static_cast<int>(fmt) )
    {
    case DXGI_FORMAT_NV12:      // 4:2:0 8-bit
    case DXGI_FORMAT_P010:      // 4:2:0 10-bit
    case DXGI_FORMAT_P016:      // 4:2:0 16-bit
    case DXGI_FORMAT_420_OPAQUE:// 4:2:0 8-bit
    case DXGI_FORMAT_NV11:      // 4:1:1 8-bit
        return true;

    case 118 /* DXGI_FORMAT_D16_UNORM_S8_UINT */:
    case 119 /* DXGI_FORMAT_R16_UNORM_X8_TYPELESS */:
    case 120 /* DXGI_FORMAT_X16_TYPELESS_G8_UINT */:
        // These are Xbox One platform specific types
        return true;

    default:
        return false;
    }
}

_Use_decl_annotations_
inline bool IsPalettized( DXGI_FORMAT fmt )
{
    switch( fmt )
    {
    case DXGI_FORMAT_AI44:
    case DXGI_FORMAT_IA44:
    case DXGI_FORMAT_P8:
    case DXGI_FORMAT_A8P8:
        return true;

    default:
        return false;
    }
}

_Use_decl_annotations_
inline bool IsVideo( DXGI_FORMAT fmt )
{
    switch ( fmt )
    {
    case DXGI_FORMAT_AYUV:
    case DXGI_FORMAT_Y410:
    case DXGI_FORMAT_Y416:
    case DXGI_FORMAT_NV12:
    case DXGI_FORMAT_P010:
    case DXGI_FORMAT_P016:
    case DXGI_FORMAT_YUY2:
    case DXGI_FORMAT_Y210:
    case DXGI_FORMAT_Y216:
    case DXGI_FORMAT_NV11:
        // These video formats can be used with the 3D pipeline through special view mappings

    case DXGI_FORMAT_420_OPAQUE:
    case DXGI_FORMAT_AI44:
    case DXGI_FORMAT_IA44:
    case DXGI_FORMAT_P8:
    case DXGI_FORMAT_A8P8:
        // These are limited use video formats not usable in any way by the 3D pipeline
        return true;

    default:
        return false;
    }
}

_Use_decl_annotations_
inline bool IsDepthStencil( DXGI_FORMAT fmt )
{
    switch( static_cast<int>(fmt) )
    {
    case DXGI_FORMAT_D32_FLOAT_S8X24_UINT:
    case DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS:
    case DXGI_FORMAT_X32_TYPELESS_G8X24_UINT:
    case DXGI_FORMAT_D32_FLOAT:
    case DXGI_FORMAT_D24_UNORM_S8_UINT:
    case DXGI_FORMAT_R24_UNORM_X8_TYPELESS:
    case DXGI_FORMAT_X24_TYPELESS_G8_UINT:
    case DXGI_FORMAT_D16_UNORM:
    case 118 /* DXGI_FORMAT_D16_UNORM_S8_UINT */:
    case 119 /* DXGI_FORMAT_R16_UNORM_X8_TYPELESS */:
    case 120 /* DXGI_FORMAT_X16_TYPELESS_G8_UINT */:
        return true;

    default:
        return false;
    }
}

_Use_decl_annotations_
inline bool IsSRGB( DXGI_FORMAT fmt )
{
    switch( fmt )
    {
    case DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
    case DXGI_FORMAT_BC1_UNORM_SRGB:
    case DXGI_FORMAT_BC2_UNORM_SRGB:
    case DXGI_FORMAT_BC3_UNORM_SRGB:
    case DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
    case DXGI_FORMAT_B8G8R8X8_UNORM_SRGB:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
        return true;

    default:
        return false;
    }
}

_Use_decl_annotations_
inline bool IsTypeless( DXGI_FORMAT fmt, bool partialTypeless )
{
    switch( static_cast<int>(fmt) )
    {
    case DXGI_FORMAT_R32G32B32A32_TYPELESS:
    case DXGI_FORMAT_R32G32B32_TYPELESS:
    case DXGI_FORMAT_R16G16B16A16_TYPELESS:
    case DXGI_FORMAT_R32G32_TYPELESS:
    case DXGI_FORMAT_R32G8X24_TYPELESS:
    case DXGI_FORMAT_R10G10B10A2_TYPELESS:
    case DXGI_FORMAT_R8G8B8A8_TYPELESS:
    case DXGI_FORMAT_R16G16_TYPELESS:
    case DXGI_FORMAT_R32_TYPELESS:
    case DXGI_FORMAT_R24G8_TYPELESS:
    case DXGI_FORMAT_R8G8_TYPELESS:
    case DXGI_FORMAT_R16_TYPELESS:
    case DXGI_FORMAT_R8_TYPELESS:
    case DXGI_FORMAT_BC1_TYPELESS:
    case DXGI_FORMAT_BC2_TYPELESS:
    case DXGI_FORMAT_BC3_TYPELESS:
    case DXGI_FORMAT_BC4_TYPELESS:
    case DXGI_FORMAT_BC5_TYPELESS:
    case DXGI_FORMAT_B8G8R8A8_TYPELESS:
    case DXGI_FORMAT_B8G8R8X8_TYPELESS:
    case DXGI_FORMAT_BC6H_TYPELESS:
    case DXGI_FORMAT_BC7_TYPELESS:
        return true;

    case DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS:
    case DXGI_FORMAT_X32_TYPELESS_G8X24_UINT:
    case DXGI_FORMAT_R24_UNORM_X8_TYPELESS:
    case DXGI_FORMAT_X24_TYPELESS_G8_UINT:
        return partialTypeless;

    case 119 /* DXGI_FORMAT_R16_UNORM_X8_TYPELESS */:
    case 120 /* DXGI_FORMAT_X16_TYPELESS_G8_UINT */:
        // These are Xbox One platform specific types
        return partialTypeless;

    default:
        return false;
    }
}

_Use_decl_annotations_
inline bool HasAlpha( DXGI_FORMAT fmt )
{
    switch( static_cast<int>(fmt) )
    {
    case DXGI_FORMAT_R32G32B32A32_TYPELESS:
    case DXGI_FORMAT_R32G32B32A32_FLOAT:
    case DXGI_FORMAT_R32G32B32A32_UINT:
    case DXGI_FORMAT_R32G32B32A32_SINT:
    case DXGI_FORMAT_R16G16B16A16_TYPELESS:
    case DXGI_FORMAT_R16G16B16A16_FLOAT:
    case DXGI_FORMAT_R16G16B16A16_UNORM:
    case DXGI_FORMAT_R16G16B16A16_UINT:
    case DXGI_FORMAT_R16G16B16A16_SNORM:
    case DXGI_FORMAT_R16G16B16A16_SINT:
    case DXGI_FORMAT_R10G10B10A2_TYPELESS:
    case DXGI_FORMAT_R10G10B10A2_UNORM:
    case DXGI_FORMAT_R10G10B10A2_UINT:
    case DXGI_FORMAT_R8G8B8A8_TYPELESS:
    case DXGI_FORMAT_R8G8B8A8_UNORM:
    case DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
    case DXGI_FORMAT_R8G8B8A8_UINT:
    case DXGI_FORMAT_R8G8B8A8_SNORM:
    case DXGI_FORMAT_R8G8B8A8_SINT:
    case DXGI_FORMAT_A8_UNORM:
    case DXGI_FORMAT_BC1_TYPELESS:
    case DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT_BC1_UNORM_SRGB:
    case DXGI_FORMAT_BC2_TYPELESS:
    case DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT_BC2_UNORM_SRGB:
    case DXGI_FORMAT_BC3_TYPELESS:
    case DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT_BC3_UNORM_SRGB:
    case DXGI_FORMAT_B5G5R5A1_UNORM:
    case DXGI_FORMAT_B8G8R8A8_UNORM:
    case DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM:
    case DXGI_FORMAT_B8G8R8A8_TYPELESS:
    case DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
    case DXGI_FORMAT_BC7_TYPELESS:
    case DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
    case DXGI_FORMAT_AYUV:
    case DXGI_FORMAT_Y410:
    case DXGI_FORMAT_Y416:
    case DXGI_FORMAT_AI44:
    case DXGI_FORMAT_IA44:
    case DXGI_FORMAT_A8P8:
    case DXGI_FORMAT_B4G4R4A4_UNORM:
        return true;

    case 116 /* DXGI_FORMAT_R10G10B10_7E3_A2_FLOAT */:
    case 117 /* DXGI_FORMAT_R10G10B10_6E4_A2_FLOAT */:
        // These are Xbox One platform specific types
        return true;

    default:
        return false;
    }
}

_Use_decl_annotations_
inline size_t ComputeScanlines( DXGI_FORMAT fmt, size_t height )
{
    if ( IsCompressed(fmt) )
    {
        return std::max<size_t>( 1, (height + 3) / 4 );
    }
    else if ( fmt == DXGI_FORMAT_NV11 )
    {
        // Direct3D makes this simplifying assumption, although it is larger than the 4:1:1 data
        return height * 2;
    }
    else if ( IsPlanar(fmt) )
    {
        return height + ( ( height + 1 ) >> 1 );
    }
    else
    {
        return height;
    }
}

//=====================================================================================
// Image I/O
//=====================================================================================
_Use_decl_annotations_
inline HRESULT SaveToDDSMemory( const Image& image, DWORD flags, Blob& blob )
{
    TexMetadata mdata;
    memset( &mdata, 0, sizeof(mdata) );
    mdata.width = image.width;
    mdata.height = image.height;
    mdata.depth = 1;
    mdata.arraySize = 1;
    mdata.mipLevels = 1;
    mdata.format = image.format;
    mdata.dimension = TEX_DIMENSION_TEXTURE2D;

    return SaveToDDSMemory( &image, 1, mdata, flags, blob );
}

_Use_decl_annotations_
inline HRESULT SaveToDDSFile( const Image& image, DWORD flags, LPCWSTR szFile )
{
    TexMetadata mdata;
    memset( &mdata, 0, sizeof(mdata) );
    mdata.width = image.width;
    mdata.height = image.height;
    mdata.depth = 1;
    mdata.arraySize = 1;
    mdata.mipLevels = 1;
    mdata.format = image.format;
    mdata.dimension = TEX_DIMENSION_TEXTURE2D;

    return SaveToDDSFile( &image, 1, mdata, flags, szFile );
}
