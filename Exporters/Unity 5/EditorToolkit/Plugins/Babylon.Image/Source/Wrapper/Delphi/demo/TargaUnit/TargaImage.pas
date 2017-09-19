unit TargaImage;

// ==========================================================
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
//
// ==========================================================

interface

uses
  Windows,
  Classes,
  FreeImage,
  Graphics,
  Types;

type
  TTargaImage = class(TGraphic)
  private
    fImage: PFIBITMAP;
    fWidth: Integer;
    fHeight: Integer;
  protected
    procedure Draw(ACanvas: TCanvas; const ARect: TRect); override;
    function GetEmpty: Boolean; override;
    function GetHeight: Integer; override;
    function GetWidth: Integer; override;
    procedure SetHeight(Value: Integer); override;
    procedure SetWidth(Value: Integer); override;
  public
    constructor Create; override;
    destructor Destroy; override;
    procedure Assign(Source: TPersistent); override;
    procedure LoadFromClipboardFormat(AFormat: Word; AData: THandle; APalette: HPALETTE); override;
    procedure LoadFromStream(Stream: TStream); override;
    procedure SaveToClipboardFormat(var AFormat: Word; var AData: THandle; var APalette: HPALETTE); override;
    procedure SaveToStream(Stream: TStream); override;
  end;

  procedure Register;

implementation

{ Design-time registration }

procedure Register;
begin
  TPicture.RegisterFileFormat('tga', 'TARGA Files', TTargaImage);
end;

{ IO functions }

function FI_ReadProc(buffer : pointer; size : Cardinal; count : Cardinal; handle : fi_handle) : UInt; stdcall;
var
  stream: TStream;
  bytesToRead: Cardinal;
begin
  stream := TStream(handle);
  bytesToRead := size*count;
  Result := stream.Read(buffer^, bytesToRead);
end;

function FI_WriteProc(buffer : pointer; size, count : Cardinal; handle : fi_handle) : UInt; stdcall;
var
  stream: TStream;
  bytesToWrite: Cardinal;
begin
  stream := TStream(handle);
  bytesToWrite := size*count;
  Result := stream.Write(buffer^, bytesToWrite);
end;

function FI_SeekProc(handle : fi_handle; offset : longint; origin : integer) : Integer; stdcall;
begin
  TStream(handle).Seek(offset, origin);
  Result := 0;
end;

function FI_TellProc(handle : fi_handle) : LongInt; stdcall;
begin
  Result := TStream(handle).Position;
end;

{ TTargaImage }

constructor TTargaImage.Create;
begin
  fImage := nil;
  fWidth := 0;
  fHeight := 0;
  inherited;
end;

destructor TTargaImage.Destroy;
begin
  if Assigned(fImage) then
    FreeImage_Unload(fImage);
  inherited;
end;

procedure TTargaImage.Assign(Source: TPersistent);
begin
  if Source is TTargaImage then begin
    fImage := FreeImage_Clone(TTargaImage(Source).fImage);
    fWidth := FreeImage_GetWidth(fImage);
    fHeight := FreeImage_GetHeight(fImage);
    Changed(Self);
  end else
    inherited;
end;

procedure TTargaImage.Draw(ACanvas: TCanvas; const ARect: TRect);
var
  pbi: PBitmapInfo;
begin
  if Assigned(fImage) then begin
    pbi := FreeImage_GetInfo(fImage);
    SetStretchBltMode(ACanvas.Handle, COLORONCOLOR);
    StretchDIBits(ACanvas.Handle, ARect.left, ARect.top,
	    ARect.right-ARect.left, ARect.bottom-ARect.top,
	    0, 0, fWidth, fHeight,
  	  FreeImage_GetBits(fImage), pbi^, DIB_RGB_COLORS, SRCCOPY);
  end;
end;

function TTargaImage.GetEmpty: Boolean;
begin
  Result := Assigned(fImage);
end;

function TTargaImage.GetHeight: Integer;
begin
  Result := fHeight;
end;

function TTargaImage.GetWidth: Integer;
begin
  Result := fWidth;
end;

procedure TTargaImage.LoadFromClipboardFormat(AFormat: Word; AData: THandle; APalette: HPALETTE);
begin
  if Assigned(fImage) then begin
  end;
end;

procedure TTargaImage.LoadFromStream(Stream: TStream);
var
  io: FreeImageIO;
begin
  with io do begin
    read_proc := FI_ReadProc;
    write_proc := FI_WriteProc;
    seek_proc := FI_SeekProc;
    tell_proc := FI_TellProc;
  end;
  fImage := FreeImage_LoadFromHandle(FIF_TARGA, @io, Stream);
  if Assigned(fImage) then begin
    fWidth := FreeImage_GetWidth(fImage);
    fHeight := FreeImage_GetHeight(fImage);
  end;
end;

procedure TTargaImage.SaveToClipboardFormat(var AFormat: Word; var AData: THandle; var APalette: HPALETTE);
begin
end;

procedure TTargaImage.SaveToStream(Stream: TStream);
var
  io: FreeImageIO;
begin
  with io do begin
    read_proc := FI_ReadProc;
    write_proc := FI_WriteProc;
    seek_proc := FI_SeekProc;
    tell_proc := FI_TellProc;
  end;
  FreeImage_SaveToHandle(FIF_TARGA, fImage, @io, Stream);
end;

procedure TTargaImage.SetHeight(Value: Integer);
begin
  if Assigned(fImage) then begin
    fHeight := Value;
    FreeImage_Rescale(fImage, fWidth, fHeight, FILTER_BICUBIC);
  end;
end;

procedure TTargaImage.SetWidth(Value: Integer);
begin
  if Assigned(fImage) then begin
    fWidth := Value;
    FreeImage_Rescale(fImage, fWidth, fHeight, FILTER_BICUBIC);
  end;
end;

initialization
  TPicture.RegisterFileFormat('tga', 'TARGA Files', TTargaImage);
end.
