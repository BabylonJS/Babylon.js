unit FreeUtils;

// ==========================================================
//
// Delphi wrapper for FreeImage 3
//
// Design and implementation by
// - Anatoliy Pulyaevskiy (xvel84@rambler.ru)
//
// Contributors:
// - Enzo Costantini (enzocostantini@libero.it)
// - Armindo (tech1.yxendis@wanadoo.fr)
// - Lorenzo Monti (LM)  lomo74@gmail.com
//
// Revision history
// When        Who   What
// ----------- ----- -----------------------------------------------------------
// 2010-07-14  LM    made RAD2010 compliant (unicode)
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

{$I 'Version.inc'}

uses
  {$IFDEF DELPHI2010}AnsiStrings,{$ENDIF} SysUtils, Classes, FreeImage;

function FIU_GetFIFType(filename: AnsiString): FREE_IMAGE_FORMAT;

// returns FIF (plugin) description string
function FIU_GetFIFDescription(fif: FREE_IMAGE_FORMAT): AnsiString;

procedure FIU_GetAllDescriptions(var Descriptions: TStringList);

// returns file extentions for FIF (e.g. '*.tif;*.tiff)
function FIU_GetFIFExtList(fif: FREE_IMAGE_FORMAT): AnsiString;

// returns file extentions for all plugins
function FIU_GetFullExtList: AnsiString;

// returns "Description + | + ExtList" for specified FIF
function FIU_GetFIFFilter(fif: FREE_IMAGE_FORMAT): AnsiString;

// All supported formats + Full filter list for FIFs
function FIU_GetAllFilters: AnsiString;

//Filter for OpenDialogs
function FIU_GetAllOpenFilters: AnsiString;

//Filter for SaveDialogs
function FIU_GetAllSaveFilters: AnsiString;

implementation

const
  FIF_START = FIF_UNKNOWN;
  FIF_END = FIF_XPM;

function FIU_GetFIFType(filename: AnsiString): FREE_IMAGE_FORMAT;
begin
  Result := FreeImage_GetFileType(PAnsiChar(filename), 0);
end;

function FIU_GetFIFDescription(fif: FREE_IMAGE_FORMAT): AnsiString;
begin
  Result := FreeImage_GetFIFDescription(fif)
end;

procedure FIU_GetAllDescriptions(var Descriptions: TStringList);
var
  fif: FREE_IMAGE_FORMAT;
begin
  Descriptions.Clear;
  for fif := FIF_START to FIF_END do
    Descriptions.Add(string(FreeImage_GetFIFDescription(fif)) + ' (' +
                     string(FIu_GetFIFExtList(fif)) + ')');
end;

function FIU_GetFIFExtList(fif: FREE_IMAGE_FORMAT): AnsiString;
var
  ExtList: AnsiString;
  I: Smallint;
  C: AnsiChar;
begin
  Result := '*.';
  ExtList := FreeImage_GetFIFExtensionList(fif);
  for I := 1 to Length(ExtList) do
  begin
    C := ExtList[i];
    if C <> ',' then
      Result := Result + C
    else
      Result := Result + ';*.';
  end
end;

function FIU_GetFullExtList: AnsiString;
var
  fif: FREE_IMAGE_FORMAT;
begin
  Result := FIU_GetFIFExtList(FIF_START);
  for fif := FIF_START to FIF_END do
    Result := Result + ';' + FIU_GetFIFExtList(fif)
end;

function FIU_GetFIFFilter(fif: FREE_IMAGE_FORMAT): AnsiString;
var
  Text, ExtList: AnsiString;
begin
  Result := '';
  if fif <> FIF_UNKNOWN then
  begin
    Text := {$IFDEF DELPHI2010}AnsiStrings.{$ENDIF}Trim(FreeImage_GetFIFDescription(fif));
    ExtList := FIU_GetFIFExtList(fif);
    Result := Text + '(' + ExtList + ')' + '|' + ExtList
  end
end;

function FIU_GetAllFilters: AnsiString;
var
  fif: FREE_IMAGE_FORMAT;
begin
  Result := 'All supported formats|' + FIU_GetFullExtList;
  for fif := FIF_START to FIF_END do
  begin
    Result := Result + '|' + FIU_GetFIFFilter(fif)
  end;
end;

function FIU_GetAllOpenFilters: AnsiString;
var
  fif: FREE_IMAGE_FORMAT;
begin
  Result := 'All supported formats|' + FIU_GetFullExtList;
  for fif := FIF_START to FIF_END do
    if FreeImage_FIFSupportsReading(fif) then
      begin
        Result := Result + '|' + FIU_GetFIFFilter(fif)
      end;
end;

function FIU_GetAllSaveFilters: AnsiString;
var
  ExtList: AnsiString;
  I: Smallint;
  C: AnsiChar;
  fif: FREE_IMAGE_FORMAT;
  s: AnsiString;
begin
  result := '';
  for fif := FIF_START to FIF_END do
    if FreeImage_FIFSupportsWriting(fif) then
      begin
        ExtList := FreeImage_GetFIFExtensionList(fif);
        s := '';
        for I := 1 to Length(ExtList) do
          begin
            C := ExtList[i];
            if C <> ',' then
              S := S + C
            else
              begin
                result := Result + FreeImage_GetFIFDescription(fif) + ' (' + UpperCase(s) + ')|*.' + s + '|';
                s := '';
              end;
          end;
        result := Result + FreeImage_GetFIFDescription(fif) + ' (' + UpperCase(s) + ')|*.' + s + '|';
      end;
end;

end.
