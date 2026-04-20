---
title: Install Debrief from the HubSpot marketplace
description: The step-by-step install flow, from discovery in the marketplace to your first handoff.
category: getting-started
product: debrief
access: public
order: 3
updated: 2026-04-20
draft: false
tags:
  - install
  - getting-started
---

Debrief is installed through the HubSpot App Marketplace. The flow takes about two minutes from click to first brief.

## Before you install

- You need Super Admin or App Marketplace Access permission in the HubSpot portal.
- Debrief uses HubSpot CRM UI extension cards. HubSpot will confirm your portal is eligible for these at install time.

## Install flow

1. Find Debrief in the HubSpot App Marketplace. Search for "Debrief" or navigate to the Dunamis Studios publisher page.
2. Click **Install app**.
3. Pick the portal you want to install into. If you manage multiple portals, Debrief bills per portal, so pick intentionally.
4. Approve the OAuth scopes Debrief requests (see [What Debrief reads from HubSpot, and what it doesn't](/help/security/data-and-permissions)).
5. HubSpot redirects you to Dunamis Studios to finalize the install.

## Finalizing at Dunamis Studios

After HubSpot approves the install, you land on a Dunamis Studios claim page.

- **If you already have a Dunamis Studios account** with the same email: sign in. The entitlement links automatically.
- **If you do not**: create an account on the spot. The entitlement attaches the moment you verify your email.

The Dunamis Studios account is separate from your HubSpot account. One Dunamis account can hold entitlements for multiple portals and multiple products.

## Add the Debrief card to your record layouts

Once the entitlement is linked, return to HubSpot. Installing the app registers the Debrief card with your portal, but HubSpot does not automatically place CRM cards onto record pages. You pick which object types show the card and where on the layout it sits. Do this for each object type Debrief should appear on (Deals, Contacts, Companies, Tickets, custom objects).

### Add it to the Deals record page

Deals is the most common first-use surface. Repeat this flow for every other object type you want Debrief on.

1. Click the **Settings** gear icon in the top-right nav.
2. In the left sidebar, go to **Data Management → Objects → Deals**.
3. Click the **Record customization** tab at the top of the Deals settings.
4. Pick the record view you want to edit — either the default view for all users or a team-specific view. You can also create a new view for a specific team.
5. In the layout editor, click **+ Add a tab** to create a new tab, or select an existing tab to modify.
6. In the target section, click **+ Add cards**.
7. In the card picker, find **Debrief** (cards from installed apps appear in this list).
8. Add the card and drag it into the position you want.
9. Click **Save** at the top of the layout editor.

The card now appears on every Deal record that uses this layout.

### The same flow works for every object type

Repeat the steps above under **Data Management → Objects → [Contacts | Companies | Tickets | your custom object]**. Each object type has its own record customization tab; card placements are not shared across types.

## Two gates: enabled in Debrief, added in HubSpot

Before the card actually renders on a record, both conditions must be true:

1. The object type is **enabled in Debrief** — Connected Apps → Debrief → Settings → **Enabled object types**. Standard types (Deal, Contact, Company, Ticket) are enabled by default; custom objects need explicit opt-in.
2. The Debrief card has been **added to the record layout** for that object type (the flow above).

If the card isn't showing up, check both gates.

## Your first handoff

Open any record that now has the Debrief card and click **Draft Brief**. You'll see a preview generated against the real record's data. From the preview you can confirm, adjust context, or run Handoff to atomically reassign ownership.
