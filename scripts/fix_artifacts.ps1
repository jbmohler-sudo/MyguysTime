Set-Location 'C:\Umbrella\MyGuysTime'
# These are tsc -b emitted artifacts of vite.config.ts — should never be tracked
git rm --cached -q vite.config.js vite.config.d.ts scripts/_commit4.ps1 2>$null
Remove-Item -Force 'vite.config.js','vite.config.d.ts' -ErrorAction SilentlyContinue
Remove-Item -Force 'scripts\_commit4.ps1' -ErrorAction SilentlyContinue
# add ignore rules
Add-Content -Path '.gitignore' -Value 'vite.config.js'
Add-Content -Path '.gitignore' -Value 'vite.config.d.ts'
Add-Content -Path '.gitignore' -Value 'scripts/_*.ps1'
git add -A
Write-Output '=== staged ==='
git status -s
git commit -q -m "chore: untrack vite.config build artifacts and temp scripts, gitignore them"
Write-Output ('COMMIT_EXIT=' + $LASTEXITCODE)
git push -q
Write-Output ('PUSH_EXIT=' + $LASTEXITCODE)
git log --oneline -2
