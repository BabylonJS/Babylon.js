program MultiBitmap;

uses
  Forms,
  mbMainForm in 'mbMainForm.pas' {MainForm};

{$R *.res}

begin
  Application.Initialize;
  Application.CreateForm(TMainForm, MainForm);
  Application.Run;
end.
