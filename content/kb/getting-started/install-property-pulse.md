---
title: Install Property Pulse from the HubSpot marketplace
description: The step-by-step install flow, from marketplace discovery to your first visible property-change event.
category: getting-started
product: property-pulse
access: public
order: 3
updated: 2026-04-21
draft: false
tags:
  - install
  - getting-started
---

Property Pulse is installed through the HubSpot App Marketplace. The flow takes about two minutes from click to first tracked change.

## Before you install

- You need Super Admin or App Marketplace Access permission in the HubSpot portal.
- Property Pulse uses HubSpot CRM UI extension cards. HubSpot will confirm your portal is eligible for these at install time.

## Install flow

1. Find Property Pulse in the HubSpot App Marketplace. Search for "Property Pulse" or navigate to the Dunamis Studios publisher page.
2. Click **Install app**.
3. Pick the portal you want to install into. If you manage multiple portals, Property Pulse bills per portal, so pick intentionally.
4. Approve the OAuth scopes Property Pulse requests. Scopes cover read and write on contacts, companies, deals, tickets, and custom objects (writes only fire when you edit a property from the card), plus HubDB for configuration storage and automation for resolving workflow names in the change log.
5. HubSpot redirects you to Dunamis Studios to finalize the install.

## Finalizing at Dunamis Studios

After HubSpot approves the install, you land on a Dunamis Studios claim page.

- **If you already have a Dunamis Studios account** with the same email: sign in. The entitlement links automatically.
- **If you do not**: create an account on the spot. The entitlement attaches the moment you verify your email.

The Dunamis Studios account is separate from your HubSpot account. One Dunamis account can hold entitlements for multiple portals and multiple products.

## Add the Property Pulse card to your record layouts

Once the entitlement is linked, return to HubSpot. Installing the app registers the Property Pulse card with your portal, but HubSpot does not automatically place CRM cards onto record pages. You pick which object types show the card and where on the layout it sits. Do this for each object type Property Pulse should appear on (Contacts, Companies, Deals, Tickets, custom objects).

### Add it to the Deals record page

Deals is a common first-use surface. Repeat this flow for every other object type you want Property Pulse on.

1. Click the **Settings** gear icon in the top-right nav.
2. In the left sidebar, go to **Data Management → Objects → Deals**.
3. Click the **Record customization** tab at the top of the Deals settings.
4. Pick the record view you want to edit, either the default view for all users or a team-specific view. You can also create a new view for a specific team.
5. In the layout editor, click **+ Add a tab** to create a new tab, or select an existing tab to modify.
6. In the target section, click **+ Add cards**.
7. In the card picker, find **Property Pulse** (cards from installed apps appear in this list).
8. Add the card and drag it into the position you want.
9. Click **Save** at the top of the layout editor.

The card now appears on every Deal record that uses this layout.

### The same flow works for every object type

Repeat the steps above under **Data Management → Objects → [Contacts | Companies | Tickets | your custom object]**. Each object type has its own record customization tab; card placements are not shared across types.

## Two gates: tracked in Property Pulse, added in HubSpot

Before the card shows useful data on a record, both conditions must be true:

1. **Tracked properties are configured in Property Pulse**, in Connected Apps → Property Pulse → **Settings**. The page header reads **Property Pulse · Tracked Properties**. Each object type has its own accordion labeled **{Object name} · {N} tracked** (for example, *Contacts · 4 tracked*). Expand an accordion to pick which properties to track for that object type. Inside each accordion is an **Allow users to add their own properties** toggle. Flip it on to let individual users add properties of their own on top of the admin set for that object type.
2. The Property Pulse card has been **added to the record layout** for that object type (the flow above).

If the card renders but shows no entries, check gate one. If the card doesn't render at all, check gate two.

At the top of the Settings page, the **Week start day** selector tunes how the card's recency badges bucket recent activity. Set it to match your team's reporting week.

## Your first change log

Open any record that now has the Property Pulse card. The card shows the recent change history for every tracked property on that record: who changed it, when, from what value to what value, and the source (HubSpot UI edit, workflow, API, import, or an inline edit made from the card itself).

Use the filter controls on the card to narrow by property, user, or time window, then export the filtered view to CSV for audit or review.

Edit a tracked property inline from the card. When your portal permits writes on that field, the new value is written to HubSpot and recorded in the log, with you as the source.
