Set-Location 'C:\Umbrella\MyGuysTime'
# clean up all temp helper scripts
Get-ChildItem 'scripts' -Filter '_*.ps1' | Where-Object { $_.Name -ne '_commit4.ps1' } | Remove-Item -Force
git add -A
Write-Output '=== staged changes ==='
git status -s
git commit -q -m "refactor: remove payroll surface from UI (exports, YTD, adjustments); office view now hours+rate+notes only"
Write-Output ('COMMIT_EXIT=' + $LASTEXITCODE)
git push -q
Write-Output ('PUSH_EXIT=' + $LASTEXITCODE)
git log --oneline -4
