# Definir o caminho para o arquivo index.html
$indexPath = ".\index.html"

# Verificar se o arquivo index.html existe
if (-not (Test-Path $indexPath)) {
    Write-Host "Erro: O arquivo 'index.html' não foi encontrado na pasta atual. Certifique-se de que o script esteja sendo executado na mesma pasta do arquivo." -ForegroundColor Red
    exit
}

# Ler o conteúdo do arquivo index.html
$content = Get-Content $indexPath -Raw

# 1. Remover a tag <script type="importmap">...</script> e TODO o seu conteúdo
# A flag '(s)' no regex significa que o '.' inclui novas linhas, garantindo que o conteúdo entre as tags seja pego.
Write-Host "Removendo a tag <script type=`"importmap`"> e todo o seu conteúdo..." -ForegroundColor Yellow
$content = $content -replace '(?s)<script type="importmap">.*?</script>', ''

# 2. Remover a linha <script type="module" src="/index.tsx"></script>
# A flag '(m)' no regex permite que '^' e '$' correspondam ao início/fim de cada linha.
Write-Host "Removendo a linha <script type=`"module`" src=`"/index.tsx`"></script>..." -ForegroundColor Yellow
$content = $content -replace '(?m)^\s*<script type="module" src="/index.tsx"></script>\s*$', ''

# Salvar as alterações no arquivo index.html
Write-Host "Salvando as alterações em '$indexPath'..." -ForegroundColor Green
Set-Content $indexPath $content

Write-Host "Modificações no arquivo 'index.html' concluídas com sucesso!" -ForegroundColor Green

# Perguntar ao usuário sobre o ambiente de deploy
Write-Host ""
Write-Host "Para qual ambiente você deseja realizar o deploy?"
Write-Host "  [T]este"
Write-Host "  [P]rodução"
Write-Host "  [A]mbos (Teste e Produção)"

$deployOption = Read-Host "Digite T, P ou A"
$deployOption = $deployOption.ToUpper()

switch ($deployOption) {
    "T" {
        Write-Host "Iniciando deploy para TESTE..." -ForegroundColor Cyan
        npm run deploy:test
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Erro durante o deploy para TESTE. Código de saída: $LASTEXITCODE" -ForegroundColor Red
        } else {
            Write-Host "Deploy para TESTE concluído com sucesso!" -ForegroundColor Green
        }
    }
    "P" {
        Write-Host "Iniciando deploy para PRODUÇÃO..." -ForegroundColor Cyan
        npm run deploy:prod
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Erro durante o deploy para PRODUÇÃO. Código de saída: $LASTEXITCODE" -ForegroundColor Red
        } else {
            Write-Host "Deploy para PRODUÇÃO concluído com sucesso!" -ForegroundColor Green
        }
    }
    "A" {
        Write-Host "Iniciando deploy para TESTE..." -ForegroundColor Cyan
        npm run deploy:test
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Erro durante o deploy para TESTE. O deploy para PRODUÇÃO não será executado. Código de saída: $LASTEXITCODE" -ForegroundColor Red
        } else {
            Write-Host "Deploy para TESTE concluído com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Iniciando deploy para PRODUÇÃO..." -ForegroundColor Cyan
            npm run deploy:prod
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Erro durante o deploy para PRODUÇÃO. Código de saída: $LASTEXITCODE" -ForegroundColor Red
            } else {
                Write-Host "Deploy para PRODUÇÃO concluído com sucesso!" -ForegroundColor Green
            }
        }
    }
    default {
        Write-Host "Opção inválida. Nenhuma ação de deploy será executada." -ForegroundColor Red
    }
}

Write-Host "`nScript finalizado. Tenha um ótimo dia!" -ForegroundColor DarkGray