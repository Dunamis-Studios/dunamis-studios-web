---
title: "Troubleshooting"
description: "Common Atelier issues — startup failures, activation errors, SmartScreen, auto-update, database recovery, lost keys, device limits, and offline-grace lockdowns."
category: reference
order: 2
updated: "2026-05-08"
---

If you're hitting something not covered here, email **legal@dunamisstudios.com** with what you were trying to do and what happened. We respond.

## Atelier won't start

When you double-click the desktop or Start menu shortcut and nothing happens — or a window flashes briefly and disappears — try these in order:

1. **Run as administrator once.** Right-click the shortcut, choose **Run as administrator**, click Yes on the UAC prompt. If Atelier opens normally, the issue is filesystem permissions on your AppData directory. Close Atelier, then run it normally again — most users only need the elevated launch once for Windows to remember the directory permissions.
2. **Check antivirus quarantine.** Some heuristic-based antivirus tools occasionally quarantine the Atelier binary because it's not code-signed (see [install § SmartScreen](doc:install#smartscreen-warning)). Open your antivirus's quarantine list and restore `Atelier.exe` if it's there.
3. **Re-install over the top.** Run the installer again without uninstalling. Atelier's installer is idempotent — it replaces program files but leaves your data intact. This fixes the small percentage of cases where a partial update left a binary half-replaced.
4. **Check the event log.** Press Win+R, type `eventvwr`, look in **Windows Logs → Application** for entries from Atelier or `WebView2`. The error message is usually specific enough to act on; forward it to us if it isn't.

If all four fail, email us with your Windows build number (Settings → System → About) and the event log entry. We have not yet seen a "won't start at all" failure mode that wasn't one of the four above.

## License key won't activate

The License Entry view shows a structured error when activation fails. The error message points at the specific failure mode:

- **"License format is invalid."** The text in the textarea isn't a recognizable license string. It must start with `ATLR-` and be a single line of base64-style text. If you copied from your purchase email, you may have copied an extra line break or trailing whitespace. Re-copy the line cleanly.
- **"License signature is invalid."** The string was decoded but the cryptographic signature didn't verify. This usually means the key is genuinely tampered with or copied from a different product's keyspace. Re-copy from the original purchase email; if the issue persists, email us — we'll re-issue.
- **"License is for a different product."** You pasted a license for something other than Atelier. Atelier licenses have `"product": "atelier"` baked into the signed payload. Find the right key.
- **"License is for major version N; this build is major version M."** You bought a v1 license and you're running a v2 build, or vice versa. Either install the right major version of Atelier (see [install](doc:install)) or contact us to issue a license for the major you're running.

If you've lost the original purchase email entirely, see [I lost my license key](doc:troubleshooting#i-lost-my-license-key) below.

## Windows SmartScreen warning

Expected. Atelier is not code-signed in v1 — see the explanation in the [install guide](doc:install#smartscreen-warning) for why. Click **More info** → **Run anyway** to proceed.

If you want to be extra cautious, verify the binary's SHA-256 against the checksum published at the download page before running. Right-click the installer, choose Properties, and use the Get-FileHash PowerShell command to compute the hash:

```powershell
Get-FileHash -Algorithm SHA256 .\Atelier-Setup-1.0.0.exe
```

The output should match the SHA-256 published next to the download link.

## Auto-update failed

The auto-updater can fail for a few reasons:

- **No internet at update time.** Atelier needs to reach `releases.github.com` to check for updates. If you're offline, the check is skipped and you'll see "Could not check for updates" in **Settings → Software Updates**. Re-try when you're back online.
- **Disk full.** The update downloads the new build into a temp directory before swapping it in. If your disk is at capacity, the download fails. Free up space and retry.
- **Locked binary.** If Atelier was open when the swap happened, the binary may be locked by a still-running process. Close every Atelier window (check the system tray for hidden instances) and re-try the update.
- **Signature verification failed.** The downloaded build's minisign signature didn't verify against the embedded public key. This is rare and points at a corrupted download or, in the worst case, a tampered release. The updater refuses to install in this case and you'll see an error toast. Email us — we'll investigate.

You can always download the latest installer manually from [https://dunamisstudios.net/atelier/download](https://dunamisstudios.net/atelier/download) and run it over your existing install if the auto-updater is misbehaving. Manual installs are equivalent to auto-updates — same binary, same outcome.

## My SQLite database seems corrupted

If Atelier reports a database error on launch, or if data appears to be missing or wrong, the SQLite file may have been damaged — usually by an OS-level event like power loss during a write or a sync provider truncating the file mid-update.

Steps to recover:

1. **Stop Atelier.** Force-close if needed.
2. **Make a copy.** Before doing anything else, copy `%APPDATA%\studios.dunamis.atelier\atelier.sqlite` to a backup location. You want a snapshot of the broken state in case recovery makes things worse.
3. **Try the SQLite recovery command.** Install the `sqlite3` command-line tool (download from [sqlite.org](https://www.sqlite.org/download.html) — it's a single-file binary, no installer needed) and run:

```powershell
sqlite3 atelier.sqlite ".recover" | sqlite3 atelier-recovered.sqlite
```

This produces `atelier-recovered.sqlite` containing what SQLite was able to recover. Copy it back into the AppData directory as `atelier.sqlite` (after backing up the broken one) and re-launch Atelier.

4. **Restore from backup.** If recovery doesn't produce a usable file, restore from your most recent backup (see [first-run § backing up](doc:first-run)). Atelier will pick up the restored database on next launch.
5. **Email us.** If you don't have a backup and recovery didn't work, email legal@dunamisstudios.com with the backup of the broken database attached. We can sometimes extract more than the SQLite recovery tool, depending on the corruption pattern.

## I lost my license key

Email **legal@dunamisstudios.com** from the same email address you used to purchase. We re-issue the original license key from our issuance database — the key is the same one you originally received, not a new one. There's no fee for re-issuance for the legitimate licensee.

If you can't email from the original purchase address (different job, lost access to the old account, etc.), include enough information to verify ownership: approximate purchase date, payment method, business name, or a partial copy of the original receipt. We'll re-issue once we can confirm.

A self-service version of this lookup is available at [/atelier/lost-license](https://dunamisstudios.net/atelier/lost-license) — enter your email and we'll send your active licenses to that address. The endpoint always reports success regardless of whether the email is in our database (anti-enumeration), so you'll know within a few minutes whether you got the right address.

## How do I get a refund

See the [refund policy](doc:refund-policy) for the canonical statement. The short version:

- Within 30 days of purchase: no questions asked. Email us, we issue the refund manually.
- After 30 days: at our discretion. We've been generous with edge cases (your business closed, you bought twice by mistake, etc.) but we don't owe you a refund after the window closes.

## How do I export all my data

Atelier ships with the data in a single SQLite file. Two ways to extract it:

- **Copy the file.** `%APPDATA%\studios.dunamis.atelier\atelier.sqlite` is yours. Open it with any SQLite browser to see every table. The schema is documented in the [API reference](doc:api-reference).
- **Use the REST API.** With the local API enabled in Settings, every endpoint serves JSON. A short script can dump every wedding, every vendor, every payment to JSON files. See [integration examples](doc:integration-examples) for a working example.

There is no formal "Export" button in v1 because the file-copy approach is simpler and more complete than anything an exporter could do — you have the entire database, in a standard format, that any tool can read.

## I'm at the 3-device limit and need to use a 4th

Each Atelier license activates on up to 3 devices. The 4th device's License Entry screen will show an inline list of all 3 active devices, each with a **Deactivate this one** button.

Click **Deactivate** on whichever device you no longer need. That device's Atelier will lock within 24 hours of its next heartbeat (or immediately if it's currently running and connected). The deactivation frees the slot, your 4th device finishes activating, and you're up.

If you can't tell which device is which from the labels alone, the customer portal at [dunamisstudios.net/account/atelier-licenses](https://dunamisstudios.net/account/atelier-licenses) shows the same list with last-seen dates and Atelier versions — usually enough to identify "the one I haven't touched in months."

## Atelier locked because I was offline too long

Atelier checks in with the activation server about once per day after first activation, and it works offline for up to 30 days between successful check-ins. Past 30 days, the next launch shows a **"Reconnect to verify your license"** lockdown screen.

Your wedding data is safe. The lockdown blocks app access, not data — the SQLite database is untouched.

To recover: connect to the internet (any network that can reach `dunamisstudios.net`), then click **Try to reconnect now** on the lockdown screen. Atelier sends a heartbeat. On success, the app unlocks and you're back where you were.

If the lockdown persists after a successful internet connection, two likely causes:

- **Antivirus or firewall blocking outbound HTTPS to dunamisstudios.net.** Check your firewall logs; whitelist the domain if needed.
- **License has been revoked.** If the license is in revoked-immediate mode (rare, set by Dunamis Studios for explicit support reasons), reconnecting won't help — the lockdown screen will switch to a "License revoked" message instead. Email legal@dunamisstudios.com.

## I lost a device and can't deactivate it remotely

A laptop got stolen. Or a hard drive died. Or you sold a machine without deactivating Atelier first. Your license is now stuck with one of its three slots tied to a device you can't reach.

Two paths:

1. **Customer portal remote deactivation.** Sign in at [dunamisstudios.net/account/atelier-licenses](https://dunamisstudios.net/account/atelier-licenses), find the missing device in the list, click **Deactivate**. The slot frees immediately. The next time the missing device tries to heartbeat (which it can't, because it's gone), it would lock — but that's already happened in your case, so this is purely housekeeping.
2. **Email us.** If you don't have customer-portal access set up yet, email legal@dunamisstudios.com from the address tied to your license. We deactivate the slot manually, same effect.

Either path takes a few minutes. You don't need a police report, a serial number, or any other proof of loss — the license is yours, the slots are yours.

## License activation failed — what now

Activation can fail for a few specific reasons, and each one shows a structured error in the License Entry view:

- **"License signature is invalid."** The license string was tampered with or copied wrong. Re-paste from the original purchase email; if the issue persists, email us — we'll re-issue.
- **"License is for a different product."** You pasted a key for something other than Atelier. Find the right key.
- **"License is for major version N; this build is major version M."** You bought a v1 license and you're running a v2 build (or vice versa). Install the matching major version, or email us to have us issue a license for the major you're running.
- **"License is already activated on 3 devices."** See [I'm at the 3-device limit](doc:troubleshooting#im-at-the-3-device-limit-and-need-to-use-a-4th) above.
- **"Could not reach activation server."** Atelier couldn't connect to `dunamisstudios.net`. Check your internet connection. If you're confident the connection is fine, antivirus or firewall software may be blocking the request — whitelist `dunamisstudios.net` and retry. As a fallback, Atelier grants a 7-day provisional grace period for first-launch internet failures, so you can keep working while you sort the network issue out.
- **"License has been revoked."** The license has been marked revoked in our records — usually due to a refund or breach. Email legal@dunamisstudios.com.

If none of the above describes what you're seeing, copy the exact error text and email it to us. We respond.
