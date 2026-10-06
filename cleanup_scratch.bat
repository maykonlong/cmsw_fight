@echo off
setlocal
cd /d "c:\Users\MaykonSilva\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\Área de Trabalho\Arquivos Gerais\Automações\cmsw_figth"

echo Deleting diagnostic/scratch files...
if exist "game\inspect_rolldown.js"       del /q "game\inspect_rolldown.js"
if exist "game\inspect_rolldown.cjs"      del /q "game\inspect_rolldown.cjs"
if exist "game\versions.cjs"               del /q "game\versions.cjs"
if exist "game\test_pngjs.cjs"             del /q "game\test_pngjs.cjs"
if exist "game\make_p2_base_images.cjs"   del /q "game\make_p2_base_images.cjs"
if exist "game\clean_scratch.ps1"          del /q "game\clean_scratch.ps1"
if exist "game\chk.txt"                    del /q "game\chk.txt"
if exist "list_md.ps1"                     del /q "list_md.ps1"
if exist "read_pms.ps1"                    del /q "read_pms.ps1"
if exist "check_assets.ps1"                del /q "check_assets.ps1"
if exist "check_files.ps1"                 del /q "check_files.ps1"

echo Done.
