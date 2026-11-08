#!/usr/bin/env bash
# ==============================================================================
# Life OS v5.0 — Script de Instalação e Configuração do Ambiente
# ==============================================================================
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_SRC="$REPO_DIR/agent-skill"
VAULT_SRC="$REPO_DIR/vault-template"
LOCAL_BIN="$HOME/.local/bin"

echo "=================================================================="
echo "    🚀 INSTALADOR DO LIFE OS v5.0 (Espinha Dorsal Determinística) "
echo "=================================================================="
echo ""

# 1. Verifica versão do Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Erro: Python 3 não foi encontrado. Instale o Python 3.10+ antes de continuar."
    exit 1
fi

PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "✓ Python detectado: $PY_VER"

# 2. Cria diretório bin local se não existir
mkdir -p "$LOCAL_BIN"

# 3. Testa compilação dos módulos Python do core e scripts
echo "✓ Compilando e testando módulos core e scripts em Python..."
python3 -m py_compile "$SKILL_SRC/core/"*.py "$SKILL_SRC/scripts/"*.py
rm -rf "$SKILL_SRC/core/__pycache__" "$SKILL_SRC/scripts/__pycache__"
echo "✓ Módulos core e scripts compilados com 0 erros."

# 4. Cria symlinks para os executáveis globais em ~/.local/bin
CLI_TARGET="$LOCAL_BIN/life-os"
ln -sf "$SKILL_SRC/core/cli.py" "$CLI_TARGET"
ln -sf "$SKILL_SRC/core/cli.py" "$LOCAL_BIN/tyler-core"
ln -sf "$SKILL_SRC/scripts/anki_tool.py" "$LOCAL_BIN/anki-cli"
ln -sf "$SKILL_SRC/scripts/daily_telemetry.py" "$LOCAL_BIN/tyler-daily"
ln -sf "$SKILL_SRC/scripts/telemetry_auditor.py" "$LOCAL_BIN/telemetry-auditor"
ln -sf "$SKILL_SRC/scripts/tag_cleaner.py" "$LOCAL_BIN/tag-cleaner"
ln -sf "$SKILL_SRC/scripts/gcalendar.py" "$LOCAL_BIN/gcalendar"
ln -sf "$SKILL_SRC/scripts/gdrive.py" "$LOCAL_BIN/gdrive"
ln -sf "$SKILL_SRC/scripts/gmail.py" "$LOCAL_BIN/gmail"
ln -sf "$SKILL_SRC/scripts/gtasks.py" "$LOCAL_BIN/gtasks"
chmod +x "$CLI_TARGET" "$SKILL_SRC/scripts/"*.py
echo "✓ CLIs globais vinculadas em $LOCAL_BIN (life-os, tyler-core, tyler-daily, telemetry-auditor, anki-cli, tag-cleaner, gcalendar, gtasks, gdrive, gmail)"

# 5. Adiciona ~/.local/bin ao PATH se necessário
if [[ ":$PATH:" != *":$LOCAL_BIN:"* ]]; then
    echo "ℹ️  Nota: Adicione $LOCAL_BIN ao seu PATH no ~/.bashrc ou ~/.zshrc:"
    echo '   export PATH="$HOME/.local/bin:$PATH"'
fi

# 6. Configuração opcional do systemd --user para timers meteorológicos e matinais
if command -v systemctl &> /dev/null; then
    SYSTEMD_DIR="$HOME/.config/systemd/user"
    mkdir -p "$SYSTEMD_DIR"

    # Service Boot
    cat << EOF > "$SYSTEMD_DIR/life-os-boot.service"
[Unit]
Description=Life OS Morning Boot
After=network-online.target

[Service]
Type=oneshot
Environment="PATH=$LOCAL_BIN:/usr/local/bin:/usr/bin:/bin"
ExecStart=$CLI_TARGET boot --quiet
WorkingDirectory=$SKILL_SRC
StandardOutput=journal
StandardError=journal
EOF

    # Timer Boot
    cat << EOF > "$SYSTEMD_DIR/life-os-boot.timer"
[Unit]
Description=Timer for Life OS Morning Boot at 05:00

[Timer]
OnCalendar=*-*-* 05:00:00
Persistent=true
Unit=life-os-boot.service

[Install]
WantedBy=timers.target
EOF

    # Service Weather
    cat << EOF > "$SYSTEMD_DIR/life-os-weather.service"
[Unit]
Description=Life OS Weather Sync
After=network-online.target

[Service]
Type=oneshot
Environment="PATH=$LOCAL_BIN:/usr/local/bin:/usr/bin:/bin"
ExecStart=$CLI_TARGET weather-sync
WorkingDirectory=$SKILL_SRC
StandardOutput=journal
StandardError=journal
EOF

    # Timer Weather
    cat << EOF > "$SYSTEMD_DIR/life-os-weather.timer"
[Unit]
Description=Timer for Life OS Weather Sync (07:00, 14:00, 21:00)

[Timer]
OnCalendar=*-*-* 07,14,21:00:00
Persistent=true
Unit=life-os-weather.service

[Install]
WantedBy=timers.target
EOF

    systemctl --user daemon-reload || true
    echo "✓ Serviços e Timers systemd gerados em $SYSTEMD_DIR"
    echo "  Para ativá-los automaticamente, rode:"
    echo "  systemctl --user enable --now life-os-boot.timer life-os-weather.timer"
fi

echo ""
echo "=================================================================="
echo "    ✨ INSTALAÇÃO CONCLUÍDA COM SUCESSO!                          "
echo "=================================================================="
echo ""
echo "Próximos Passos:"
echo "1. Execute o Protocolo Gênese no terminal para configurar seus dados:"
echo "   life-os init-user -i"
echo ""
echo "2. Execute o primeiro boot matinal para inicializar o dia e o cofre:"
echo "   life-os boot"
echo ""
echo "3. Abra a pasta '$VAULT_SRC' no seu Obsidian Desktop."
echo "   (Ative os plugins comunitários Dataview e Metadata Menu)."
echo ""
echo "4. (Opcional) Conecte seu assistente de IA preferido à pasta 'agent-skill/'."
echo ""
