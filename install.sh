#!/bin/sh
# Install the thakol.io AI-assistant integration agent for one platform into your project.
#
#   ./install.sh [platform] [target-dir]
#
# platform : claude | copilot | codex | cursor | windsurf | gemini  (prompted if omitted)
# target   : project to install into (default: current directory)
#
# Works from a local clone (copies files) or standalone over the network:
#   curl -fsSL https://raw.githubusercontent.com/thakol/thakol-ai-agents/main/install.sh | sh -s -- claude
set -eu

REPO_RAW="https://raw.githubusercontent.com/thakol/thakol-ai-agents/main"
PLATFORMS="claude copilot codex cursor windsurf gemini"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" 2>/dev/null && pwd || echo "")

# Files each platform installs, as paths relative to the target project root.
files_for() {
  case "$1" in
    claude)   echo ".claude/skills/thakol-auth/SKILL.md .claude/agents/thakol-auth-integrator.md" ;;
    copilot)  echo ".github/copilot-instructions.md .github/prompts/thakol-auth.prompt.md" ;;
    codex)    echo "AGENTS.md" ;;
    cursor)   echo ".cursor/rules/thakol-auth.mdc" ;;
    windsurf) echo ".windsurf/rules/thakol-auth.md" ;;
    gemini)   echo "GEMINI.md" ;;
    *)        return 1 ;;
  esac
}

platform="${1:-}"
target="${2:-.}"

if [ -z "$platform" ]; then
  echo "Which AI platform? Options: $PLATFORMS"
  printf "platform: "
  read -r platform < /dev/tty
fi

if ! files_for "$platform" > /dev/null 2>&1; then
  echo "Unknown platform '$platform'. Choose one of: $PLATFORMS" >&2
  exit 1
fi

mkdir -p "$target"
echo "Installing thakol-auth agent for '$platform' into '$target' ..."

for rel in $(files_for "$platform"); do
  dest="$target/$rel"
  mkdir -p "$(dirname "$dest")"
  src="$SCRIPT_DIR/$platform/$rel"
  if [ -n "$SCRIPT_DIR" ] && [ -f "$src" ]; then
    cp "$src" "$dest"                                   # local clone
  else
    curl -fsSL "$REPO_RAW/$platform/$rel" -o "$dest"    # standalone
  fi
  echo "  + $rel"
done

echo "Done. Restart your AI assistant so it picks up the new files."
echo "Next: get your issuer, client ID, secret (if confidential) and redirect URI from https://thakol.io"
