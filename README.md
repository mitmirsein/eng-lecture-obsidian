# Mosaic Eng Lecture Obsidian

Obsidian-native packaging track for the Mosaic Curriculum Pipeline.

This project intentionally starts smaller than `projects/eng-lecture`.
The dashboard, Antigravity delegation, Pandoc PDF rendering, and Node child
process runner stay in the original project. This plugin track focuses on:

- reading the active note or selected text from an Obsidian vault
- letting the user configure their own API key and model
- generating student/teacher Markdown assets inside the vault
- preserving the Korean academic tone and forensic teaching standard

## MVP Scope

1. Select text in a note, or place the cursor inside a passage note.
2. Run `Mosaic: Generate MASTER/TEACHER`.
3. The plugin calls the configured LLM provider.
4. The plugin writes:
   - `Mosaic/outputs/<slug>/source.md`
   - `Mosaic/outputs/<slug>/[MASTER]_<slug>.md`
   - `Mosaic/outputs/<slug>/[TEACHER]_<slug>.md`
   - `Mosaic/outputs/<slug>/run-log.json`

## Not In MVP

- Antigravity orchestration
- Pandoc/PDF generation
- local Node `core/run.js`
- batch mode
- external filesystem writes outside the vault

Those can be added after the Vault-native workflow is proven.

## Security Note

The API key is stored with Obsidian `app.secretStorage`.
Normal plugin settings in `data.json` only store non-secret values such as
endpoint, model, output folder, and defaults.

## Build

```bash
npm install
npm run build
```

Build output:

- `main.js`
- `manifest.json`
- `versions.json`

For local testing, copy or symlink this folder into:

```text
<Vault>/.obsidian/plugins/mosaic-eng-lecture/
```

## BRAT Install

BRAT expects the plugin repository to include the built runtime files at the
repository root. This repo commits:

- `manifest.json`
- `main.js`
- `styles.css`

After the private GitHub repository is available:

1. Install and enable the Obsidian BRAT plugin.
2. Open BRAT settings.
3. Choose `Add Beta plugin`.
4. Enter the GitHub repository path, for example `owner/mosaic-eng-lecture-obsidian`.
5. Enable `Mosaic Eng Lecture` in Community plugins.

For a private repository, BRAT/GitHub access must be configured on the user's
machine. If BRAT cannot read the private repo, use a temporary private-to-public
test repo or install from a local symlink during development.
