$files = Get-ChildItem -Path "c:\Users\PC\afrigari\frontend\src" -Recurse -Include "*.tsx","*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content

    # Pattern: catch (error) { ... console.error("some text"); }
    # Replace console.error("text"); with console.error("text", error);
    # We do multiple passes for different variable names

    foreach ($varName in @("error", "err", "e")) {
        # Match catch blocks and fix console.error inside them
        # Simple approach: replace console.error("..."); that is NOT already followed by a variable
        # with console.error("...", varName);
        
        # This regex finds: console.error("anything"); NOT followed by , varName
        $pattern = '(console\.error\("([^"]+)"\))(\s*;)'
        $replacement = "console.error(`"`$2`", $varName);"
        
        # Only apply if file contains catch ($varName)
        if ($content -match "catch\s*\(\s*$varName\s*\)") {
            # We need to be smarter - only fix lines inside catch blocks with this var
            # For now, do a targeted replacement for single-arg console.error
            $content = [regex]::Replace($content, 
                '(} catch \(' + $varName + '\) \{[^}]*)(console\.error\("([^"]+)"\);)',
                { param($m)
                    $prefix = $m.Groups[1].Value
                    $msg = $m.Groups[3].Value
                    "$prefix`console.error(`"$msg`", $varName);"
                },
                [System.Text.RegularExpressions.RegexOptions]::Singleline)
        }
    }

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Done!"
