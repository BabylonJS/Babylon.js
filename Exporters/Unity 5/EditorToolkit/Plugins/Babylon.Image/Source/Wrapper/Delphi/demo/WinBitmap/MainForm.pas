unit MainForm;

interface

uses
  Windows, Messages, SysUtils, Variants, Classes, Graphics, Controls, Forms,
  Dialogs, Menus, FreeBitmap, ComCtrls, ImgList, ToolWin;

type
  TfwbMainForm = class(TForm)
    MainMenu: TMainMenu;
    mnuFile: TMenuItem;
    mnuFileOpen: TMenuItem;
    mnuExit: TMenuItem;
    OD: TOpenDialog;
    StatusBar: TStatusBar;
    mnuImage: TMenuItem;
    mnuImageFlip: TMenuItem;
    mnuFlipHorz: TMenuItem;
    mnuFlipVert: TMenuItem;
    mnuConvert: TMenuItem;
    mnuTo8Bits: TMenuItem;
    mnuTo16Bits555: TMenuItem;
    mnuTo16Bits565: TMenuItem;
    mnuTo24Bits: TMenuItem;
    mnuTo32Bits: TMenuItem;
    mnuDither: TMenuItem;
    mnuQuantize: TMenuItem;
    mnuGrayScale: TMenuItem;
    mnuRotate: TMenuItem;
    mnuClockwise: TMenuItem;
    mnuAntiClockwise: TMenuItem;
    mnuInvert: TMenuItem;
    mnuClear: TMenuItem;
    mnuTo4Bits: TMenuItem;
    tbTools: TToolBar;
    btnCopy: TToolButton;
    ImageList1: TImageList;
    ToolButton1: TToolButton;
    btnPaste: TToolButton;
    btnClear: TToolButton;
    btnOpen: TToolButton;
    ToolButton3: TToolButton;
    ToolButton4: TToolButton;
    procedure FormDestroy(Sender: TObject);
    procedure FormPaint(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure mnuExitClick(Sender: TObject);
    procedure mnuFileOpenClick(Sender: TObject);
    procedure FormResize(Sender: TObject);
    procedure mnuFlipHorzClick(Sender: TObject);
    procedure btnCopyClick(Sender: TObject);
    procedure btnClearClick(Sender: TObject);
    procedure btnPasteClick(Sender: TObject);
  private
    FBitmap: TFreeWinBitmap;
    procedure WMEraseBkgnd(var Message: TMessage); message WM_ERASEBKGND;
  public
    { Public declarations }
  end;

var
  fwbMainForm: TfwbMainForm;

implementation

{$R *.dfm}

uses
  FreeUtils, FreeImage, Math;

procedure TfwbMainForm.FormDestroy(Sender: TObject);
begin
  if Assigned(FBitmap) then
    FBitmap.Free;
end;

procedure TfwbMainForm.FormPaint(Sender: TObject);
var
  dx, dy, w, h: Integer;
  r1, r2: Double;
  R: TRect;
begin
  if FBitmap.IsValid then // draw the bitmap
  begin
    // determine paint rect
    r1 := FBitmap.GetWidth / FBitmap.GetHeight;
    r2 := ClientWidth / ClientHeight;
    if r1 > r2 then // fit by width
    begin
      w := ClientWidth;
      h := Floor(w / r1);
      dx := 0;
      dy := (ClientHeight - h) div 2;
    end
    else // fit by height
    begin
      h := ClientHeight;
      w := Floor(h * r1);
      dy := 0;
      dx := (ClientWidth - w) div 2;
    end;
    with ClientRect do
      R := Bounds(Left + dx, Top + dy, w, h);
    FBitmap.Draw(Canvas.Handle, R);

    // erase area around the image
    Canvas.Brush.Color := Color;
    if dx > 0 then
    begin
      with ClientRect do
        R := Bounds(Left, Top, dx, ClientHeight);
      Canvas.FillRect(R);
      with ClientRect do
        R := Bounds(Right - dx, Top, dx, ClientHeight);
      Canvas.FillRect(R);
    end else
    if dy > 0 then
    begin
      with ClientRect do
        R := Bounds(Left, Top, ClientWidth, dy);
      Canvas.FillRect(R);
      with ClientRect do
        R := Bounds(Left, Bottom - dy, ClientWidth, dy);
      Canvas.FillRect(R);
    end
  end
  else // clear
  begin
    Canvas.Brush.Color := Color;
    Canvas.FillRect(ClientRect);
  end
end;

procedure TfwbMainForm.FormCreate(Sender: TObject);
begin
  FBitmap := TFreeWinBitmap.Create;

  mnuImage.Enabled := FBitmap.IsValid;
  OD.Filter := FIU_GetAllFilters;
end;

procedure TfwbMainForm.mnuExitClick(Sender: TObject);
begin
  Close;
end;

procedure TfwbMainForm.mnuFileOpenClick(Sender: TObject);
var
  t: Cardinal;
begin
  if OD.Execute then
  begin
    t := GetTickCount;
    FBitmap.Load(OD.FileName);
    t := GetTickCount - t;
    mnuImage.Enabled := FBitmap.IsValid;
    StatusBar.Panels[0].Text := 'Loaded in ' + IntToStr(t) + ' msec.';
    StatusBar.Panels[1].Text := Format('%dx%d', [FBitmap.GetWidth, FBitmap.GetHeight]);
    Invalidate;
  end;
end;

procedure TfwbMainForm.FormResize(Sender: TObject);
begin
  Invalidate
end;

procedure TfwbMainForm.WMEraseBkgnd(var Message: TMessage);
begin
  Message.Result := 1;
end;

procedure TfwbMainForm.mnuFlipHorzClick(Sender: TObject);
begin
  with FBitmap do
  if Sender = mnuFlipHorz then
    FLipHorizontal else
  if Sender = mnuFlipVert then
    FlipVertical else
  if Sender = mnuTo4Bits then
    ConvertTo4Bits else
  if Sender = mnuTo8Bits then
    ConvertTo8Bits else
  if Sender = mnuTo16Bits555 then
    ConvertTo16Bits555 else
  if Sender = mnuTo16Bits565 then
    ConvertTo16Bits565 else
  if Sender = mnuTo24Bits then
    ConvertTo24Bits else
  if Sender = mnuTo32Bits then
    ConvertTo32Bits else
  if Sender = mnuDither then
    Dither(FID_FS) else
  if Sender = mnuQuantize then
    ColorQuantize(FIQ_WUQUANT) else
  if Sender = mnuGrayScale then
    ConvertToGrayscale else
  if Sender = mnuClockwise then
    Rotate(-90) else
  if Sender = mnuAntiClockwise then
    Rotate(90) else
  if Sender = mnuInvert then
    Invert else
  if Sender = mnuClear then
    Clear;
  Invalidate;
end;

procedure TfwbMainForm.btnCopyClick(Sender: TObject);
begin
  if FBitmap.IsValid then FBitmap.CopyToClipBoard(Handle);
end;

procedure TfwbMainForm.btnClearClick(Sender: TObject);
begin
  FBitmap.Clear;
  Invalidate;
end;

procedure TfwbMainForm.btnPasteClick(Sender: TObject);
begin
  FBitmap.PasteFromClipBoard;
  Invalidate;
end;

end.
