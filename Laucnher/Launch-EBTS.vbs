Option Explicit
Dim shell, scriptPath
Set shell = CreateObject("WScript.Shell")
scriptPath = Replace(WScript.ScriptFullName, "Launch-EBTS.vbs", "Launch-EBTS.ps1")
shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & scriptPath & """", 0, False
Set shell = Nothing
