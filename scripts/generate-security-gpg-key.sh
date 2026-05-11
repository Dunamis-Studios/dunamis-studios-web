#!/usr/bin/env bash
# Generate the Dunamis Studios security@ GPG keypair.
#
# Idempotent: if a key for security@dunamisstudios.com already exists in
# the local gpg keyring, this script lists the existing key fingerprints
# and exits without overwriting. Re-run to add additional keys (e.g., for
# key rotation) is a deliberate gpg operation, not this script's job.
#
# This script writes the PUBLIC key to public/.well-known/security.txt.asc
# (committable). The PRIVATE key stays in the local gpg keyring at
# ~/.gnupg/ and is the developer's responsibility to back up to a password
# manager. The private key never touches the repo.
#
# Prereqs: gpg (GnuPG 2.x). On Windows, install Gpg4win and run from
# Git Bash / WSL. On macOS, `brew install gnupg`. On Linux, the system
# package manager.
#
# Usage:
#   bash scripts/generate-security-gpg-key.sh
#
# The script prompts for a passphrase interactively. Pick a strong one and
# store it in 1Password (or your password manager) alongside the private
# key export. Without the passphrase, the private key cannot decrypt
# vulnerability reports later.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WELL_KNOWN_DIR="$REPO_ROOT/public/.well-known"
PUBLIC_KEY_FILE="$WELL_KNOWN_DIR/security.txt.asc"
KEY_NAME="Dunamis Studios Security"
KEY_EMAIL="security@dunamisstudios.com"

if ! command -v gpg >/dev/null 2>&1; then
  echo "error: gpg (GnuPG) not found in PATH. Install Gpg4win (Windows), brew install gnupg (macOS), or system package (Linux)." >&2
  exit 1
fi

mkdir -p "$WELL_KNOWN_DIR"

# Check for existing key on this email.
existing_fingerprints=$(gpg --list-keys --with-colons "$KEY_EMAIL" 2>/dev/null | awk -F: '/^fpr:/ {print $10}' || true)

if [ -n "$existing_fingerprints" ]; then
  echo "A key for $KEY_EMAIL already exists in your gpg keyring:"
  echo "$existing_fingerprints"
  echo
  echo "This script will NOT overwrite. To rotate the key, manually revoke the existing one with:"
  echo "  gpg --delete-secret-keys $KEY_EMAIL"
  echo "  gpg --delete-keys $KEY_EMAIL"
  echo "then re-run this script."
  echo
  echo "Re-exporting the existing public key to $PUBLIC_KEY_FILE so the .well-known file stays in sync:"
  gpg --armor --export "$KEY_EMAIL" > "$PUBLIC_KEY_FILE"
  echo "Done. Commit $PUBLIC_KEY_FILE if it changed."
  exit 0
fi

# Build the gpg batch config in a temp file (passphrase prompted at runtime,
# never written to disk).
tmp_config=$(mktemp)
trap "rm -f $tmp_config" EXIT

cat > "$tmp_config" <<EOF
%echo Generating Dunamis Studios security key (RSA 4096, 2-year expiry)
Key-Type: RSA
Key-Length: 4096
Key-Usage: sign,cert
Subkey-Type: RSA
Subkey-Length: 4096
Subkey-Usage: encrypt
Name-Real: $KEY_NAME
Name-Email: $KEY_EMAIL
Expire-Date: 2y
%ask-passphrase
%commit
%echo Key generation complete
EOF

echo "About to generate a new RSA 4096-bit GPG keypair for $KEY_EMAIL."
echo "gpg will prompt for a passphrase. Pick a strong one and store it in your password manager"
echo "alongside an export of the private key for backup."
echo

gpg --batch --generate-key "$tmp_config"

# Export the public key to the .well-known location for security.txt.
gpg --armor --export "$KEY_EMAIL" > "$PUBLIC_KEY_FILE"

# Print the fingerprint for the security.txt Encryption directive and the
# /security page.
fingerprint=$(gpg --list-keys --with-colons "$KEY_EMAIL" | awk -F: '/^fpr:/ {print $10; exit}')

echo
echo "============================================================"
echo "GPG key generation complete."
echo
echo "Public key exported to: $PUBLIC_KEY_FILE"
echo "Fingerprint (40 hex chars): $fingerprint"
echo
echo "Next steps:"
echo "  1. Update public/.well-known/security.txt with the Expires date"
echo "     (one year from today) and the fingerprint above."
echo "  2. Update src/app/(marketing)/security/page.tsx with the fingerprint"
echo "     in the 'Reporting a vulnerability' section."
echo "  3. Back up the private key to 1Password:"
echo "       gpg --armor --export-secret-keys $KEY_EMAIL"
echo "     copy the output into a secure note."
echo "  4. Commit $PUBLIC_KEY_FILE (the public part is safe to publish)."
echo "  5. Calendar reminder for 22 months from today to rotate the key"
echo "     before its 24-month expiry."
echo "============================================================"
