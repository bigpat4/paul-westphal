---
name: rename-chat
description: Benennt eine Claude-Konversation um, sodass sie beim /resume unter dem neuen Namen erscheint. Trigger: "benenne diesen Chat um", "ändere den Namen dieser Konversation", "rename chat", "nenn diesen Chat", "ändere den Gesprächstitel".
---

# Rename Chat — Konversation umbenennen

## Was dieser Skill tut
Ändert den angezeigten Titel einer Claude-Konversation direkt in der JSONL-Datei, sodass sie beim nächsten `/resume` unter dem neuen Namen erscheint.

## Ablauf

1. **Aktuelle Session-ID finden** — steht im Scratchpad-Pfad der Systemkonfiguration (z.B. `7a11611c-705b-4cd4-a4b8-c848bdb1085f`)

2. **Alle Konversationen mit Titeln auflisten:**
```powershell
Get-ChildItem "C:\Users\DoktorBigPat\.claude\projects\C--Users-DoktorBigPat\" -Filter "*.jsonl" | ForEach-Object {
    $title = Get-Content $_.FullName | ForEach-Object { 
        try { $obj = $_ | ConvertFrom-Json; if ($obj.type -eq "ai-title") { $obj.aiTitle } } catch {} 
    } | Select-Object -First 1
    [PSCustomObject]@{ File = $_.Name; Title = $title; Modified = $_.LastWriteTime }
} | Sort-Object Modified -Descending
```

3. **Titel in der richtigen JSONL-Datei ersetzen:**
```powershell
$file = "C:\Users\DoktorBigPat\.claude\projects\C--Users-DoktorBigPat\[SESSION-ID].jsonl"
$content = Get-Content $file -Raw
$updated = $content -replace '"aiTitle":"[ALTER TITEL]"', '"aiTitle":"[NEUER TITEL]"'
$updated | Set-Content $file -Encoding utf8
```

## Hinweis
- Die Änderung ist sofort wirksam — beim nächsten `/resume` erscheint der neue Name
- Funktioniert für jede Konversation unter `C:\Users\DoktorBigPat\.claude\projects\C--Users-DoktorBigPat\`
- Alle `ai-title`-Einträge in der Datei werden ersetzt (die Datei enthält mehrere davon)
