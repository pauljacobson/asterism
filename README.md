# Asterism

A mobile-first reader theme for the [Friends](https://wordpress.org/plugins/friends/)
plugin — the self-hosted social reader for WordPress.

Friends turns your site into a feed reader for the people you follow over ActivityPub and
RSS, and renders them at `/friends/`. Asterism makes that page pleasant to read on a
phone: it restores the feed header, meets WCAG AA contrast, makes the collapse controls
work, and unhides the ActivityPub Boost button.

Built on the design of [FediPress](https://github.com/alquimidia/fedipress) by
Lívia Gouvêa — see [Credits](#credits). Every change made against it, and the
measurements behind them, are recorded in **[FORK.md](FORK.md)**.

> **as·ter·ism** *n.* — a prominent pattern of stars that is not one of the 88 official
> constellations: the Plough, the Summer Triangle, the Belt. Shapes named by the people
> who look up, rather than handed down by decree, and recognisable as a shape only from
> where you happen to be standing.
>
> Which is what following people on the open web builds. Not a platform's ranked feed, but
> your own arrangement, meaningful from your vantage point and nobody else's.

## Requirements

| | |
| --- | --- |
| WordPress | 6.5 or later |
| PHP | 7.4 or later |
| **[Friends](https://wordpress.org/plugins/friends/)** | **Required.** Asterism is a theme *for* Friends and does nothing without it |
| [ActivityPub](https://wordpress.org/plugins/activitypub/) | Optional, but needed for Boost and for replying to fediverse posts |

The `Requires Plugins: friends` header means WordPress 6.5+ will refuse to activate
Asterism unless Friends is installed and active, rather than leaving you with a plugin
that silently does nothing.

## Installation

**From a release zip**

1. Download the zip from the [releases page](../../releases)
2. WordPress admin → **Plugins → Add New → Upload Plugin**
3. Upload, install, activate

**From git**

```sh
cd wp-content/plugins
git clone https://github.com/pauljacobson/asterism.git
wp plugin activate asterism
```

The compiled stylesheet is committed, so no build step is needed to *use* it.

**Then select the theme**

Asterism registers itself as a Friends theme; installing it doesn't switch you over.
Go to **Friends → Settings** and choose **Asterism** under the theme setting, or:

```sh
wp option update friends_main_user_id <your-user-id>   # if not already set
wp eval 'update_user_option( <your-user-id>, "friends_frontend_theme", "asterism" );'
```

The theme is a **per-user** preference (`friends_frontend_theme`), not a site option, so
each user on a multi-author site chooses their own.

Its slug is `asterism`, distinct from upstream's `fedipress`, so both can be installed
side by side and you can switch between them in Friends' settings. Rollback is a setting,
not a redeploy.

## Building the stylesheet

Only needed if you change the SCSS. The stylesheet imports
[Spectre.css](https://picturepan2.github.io/spectre/) from `node_modules`.

```sh
cd css
npm install
npm run build      # or: npm run watch
```

`_mobile.scss` is imported last from `style.scss` and must stay last — its overrides rely
on source order to beat upstream's `!important` rules at equal specificity. Don't hand-edit
`style.css`; it is generated.

Two checks live alongside the source:

```sh
node css/check-contrast.mjs   # WCAG ratios for every colour pair; exits non-zero on failure
```

`check-overflow.js` is pasted into DevTools on `/friends/` at a phone width; it lists any
element wider than the viewport.

## Credits

Asterism is based on **[FediPress](https://github.com/alquimidia/fedipress) 1.0.2** by
**Lívia Gouvêa**, whose design this keeps almost entirely. The work here is corrective —
restoring UI that FediPress hid, fixing colour contrast and layout on small screens, and
making controls work that were bound to another theme. The visual identity is hers.

FediPress in turn is a theme for [Friends](https://github.com/akirk/friends) by
**Alex Kirk**, which does all the actual work of following people and caching their posts.

Written using an AI agent based on human input and testing.

## Licence

**GPL-3.0-or-later.** See [`LICENSE`](LICENSE).

A note on why, because upstream is ambiguous. FediPress states `GPL-3` in **both** its
README and its plugin header, but the `LICENSE` file it ships is the GNU **Affero** GPL
v3, so GitHub detects that repository as `AGPL-3.0`.

Two human-authored statements of intent outweigh one file. AGPL-3.0 also sits directly
beside GPL-3.0 in GitHub's "Add a license" picker, which makes a mis-selection the
likeliest explanation for the contradiction.

GPL-3.0-or-later is the safer reading in the direction that matters, too. GPLv3 §7 does
not permit a downstream to add a network-use requirement, so publishing a derivative of
GPL-3.0 work under AGPL-3.0 would impose a condition the original author never granted.
GPLv3 §13 permits *combining* with AGPL-licensed work; it does not permit *converting*
GPL work into it.

This is asked about upstream at
[alquimidia/fedipress](https://github.com/alquimidia/fedipress) and will be revisited if
AGPL-3.0 turns out to have been intended.

WordPress itself is "GPLv2 or later", and the WordPress.org plugin guidelines accept
"any GPL-compatible license", so GPL-3.0-or-later is fine for distribution either way.

---

## What this changes, and why

The full record lives in **[FORK.md](FORK.md)**: every change against FediPress with the
line references behind it, why the Boost button was hidden, what Reblog does that Boost
doesn't, the WCAG measurements, a WordPress standards review, and the content analysis
that falsified the original diagnosis.

Short version — Asterism:

- **restores the feed header** FediPress hid with two `display: none !important` rules —
  post counts, reaction filters, Add Friend and search
- **meets WCAG AA** on contrast, target size and visible focus, verified by
  `css/check-contrast.mjs`
- **makes the collapse controls work.** Friends binds their handler to a script it
  enqueues only for its own default theme, so both the compact chip and the per-post
  button were inert in every third-party theme
- **shows the ActivityPub Boost button**, which FediPress hid unconditionally
- **wraps the post footer actions**, which had no `flex-wrap` and overlapped
- **themes the comment form**, which core renders unstyled
- **drops a filter** that excluded cached friend posts on exactly `/friends/`, showing you
  your own posts instead of your feed
