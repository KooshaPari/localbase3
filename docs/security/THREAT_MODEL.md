---
title: "Threat Model"
version: 0.1.0
lastUpdated: 2026-06-16
---

# Threat Model

> **Source of truth:** localbase3 (localbase3 — Localhost development environment bootstrap)
> **Scope:** Localhost bootstrap scripts, dotfile templates, package manifests, CLI config, shared dev environment

## Assets

1. **Bootstrap scripts (`bootstrap.sh`, `Makefile`)** — Run on developer machines and CI runners. If mutable, an attacker can ship a script that exfiltrates env vars or installs a backdoor.
2. **Dotfile templates (`dotfiles/`)** — Symlinked into `$HOME` on bootstrap. If mutable, an attacker can drop a `.bashrc` that runs on every shell.
3. **Package manifests (`Brewfile`, `apt.txt`, `Cargo.toml`)** — Lists of packages to install. If mutable, an attacker can add a malicious package to the install set.
4. **CLI config files** — `.config/`, `.omniroute/`, `.forge/` directories. If mutable, an attacker can redirect local CLI traffic to a malicious proxy.
5. **Local dev environment secrets** — `.env`, `~/.aws/credentials`, `~/.config/gcloud/`. The bootstrap script may read these to verify auth, but should never log or exfiltrate.

## Threats (STRIDE)

| Category | Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **Spoofing** | An adversary publishes a malicious `localbase3` fork under a similar name and a developer clones the wrong repo. | Low | Critical | The repo URL is `KooshaPari/localbase3` and is documented in the org governance. Bootstrap prints the expected URL before any destructive action. |
| **Tampering** | A bootstrap script is modified to exfiltrate `.env` or `~/.aws/credentials` before the legitimate setup runs. | Low | Critical | The bootstrap script uses `set -euo pipefail` and runs each step in a subshell. `gitleaks` pre-commit hook scans for known secret patterns. The README documents the canonical source-of-truth commit hash. |
| **Repudiation** | A contributor pushes a bootstrap change and later denies it. | Low | Medium | All commits are signed (gitsign, keyless). Releases are tagged. The git history is the audit trail. |
| **Information Disclosure** | A bootstrap step runs a command whose stdout/stderr spills a secret (e.g., `echo $AWS_SECRET_ACCESS_KEY` for debugging). | Medium | Medium | The bootstrap script has a `redact-output` filter that masks known secret patterns (`*_KEY`, `*_SECRET`, `*_TOKEN`). The `set -x` debug mode is opt-in only. |
| **Denial of Service** | A bootstrap step runs an infinite loop or a long-running package install (e.g., `brew install --cask firefox` hangs). | Medium | Low | Each bootstrap step has a `STEP_TIMEOUT=300s` env override. Failed steps are non-fatal (logged, not aborted) so the developer can investigate. |
| **Elevation of Privilege** | A bootstrap step runs `sudo` with a password prompt, or installs a package with a preinstall script that gains root. | Low | Critical | The bootstrap script never runs `sudo` automatically. Packages with preinstall scripts are listed in a `PREINSTALL_ALLOWLIST` and verified manually before adding. |

## Residual Risk and Revision Cadence

The most material residual risk is **bootstrap script compromise** — a malicious or careless change to `bootstrap.sh` can affect every developer machine and CI runner at once. The strongest available mitigation is the `gitleaks` pre-commit hook + commit signing, but these do not catch a deliberately obfuscated payload that doesn't match a known pattern. The next highest residual is **dotfile template compromise** — symlinks in `$HOME` are persistent; a malicious `.bashrc` is loaded on every shell session. This threat model should be revised quarterly (February, May, August, November) or whenever a new bootstrap step is added, a new package is added to `Brewfile`, or the dotfile templates are extended. The revision trigger is any PR that adds a new bootstrap step, a new package, a new dotfile template, or a new `sudo` call.
