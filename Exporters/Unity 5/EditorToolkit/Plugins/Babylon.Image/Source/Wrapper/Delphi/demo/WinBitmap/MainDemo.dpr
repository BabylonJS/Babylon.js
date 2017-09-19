program MainDemo;

uses
  Forms,
  MainForm in 'MainForm.pas' {fwbMainForm};

{$R *.res}

begin
  Application.Initialize;
  Application.CreateForm(TfwbMainForm, fwbMainForm);
  Application.Run;
end.
