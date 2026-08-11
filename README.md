# Asterism

A mobile-first reader theme for the [Friends](https://wordpress.org/plugins/friends/)
plugin — the self-hosted social reader for WordPress.

Friends turns your site into a feed reader for the people you follow over ActivityPub and
RSS, and renders them at `/friends/`. Asterism makes that page pleasant to read on a
phone: it restores the feed header, meets WCAG AA contrast, makes the collapse controls
work, and unhides the ActivityPub Boost button.

Built on the design of [FediPress](https://github.com/alquimidia/fedipress) by
Lívia Gouvêa — see [Credits](#credits).

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

## Changes against upstream

**1. The feed header is no longer hidden.**

Upstream ended its stylesheet with:

```scss
.friends-page {
	#main-header #page-title { display: none !important; }
	.off-canvas-content header.navbar { display: none !important; }
}
```

That suppressed the entire main feed header — post counts, status counts, hidden-item
count, reaction filters, Add Friend, and the "Search or paste URL" box — in favour of the
sidebar. The markup was always rendered; only CSS hid it.

`css/_mobile.scss` re-enables it and makes it wrap: title and chips on one row group,
search on another, chips flowing onto as many lines as they need. Above Spectre's
`$off-canvas-breakpoint` (960px) the original side-by-side layout is restored.

The Compact/Expand toggle in that header is made to work in 2c below.

**2. Horizontal overflow on post content is contained.**

Upstream sets `max-width: 100% !important` on `img` and `video` in three places, but the
strings `iframe` and `table` do not appear anywhere in its 18KB stylesheet. Federated
posts routinely carry both.

Added: `max-width: 100%` for `iframe`/`embed`/`object`; `width: 100%` plus
`aspect-ratio: 16/9` for iframes so hardcoded width/height attributes stop forcing the
page wide; `display: block; overflow-x: auto` on tables so they scroll in their own
container; `overflow-wrap: anywhere` on content areas for long unbroken URLs.

Status-format posts also had `width: calc(100% - 7em)` with `white-space: nowrap` on the
teaser at all viewport widths; below 960px that now wraps normally.

There is a deliberate `overflow-x: hidden` guard on `.friends-page`, marked with a
`ponytail:` comment. See the Measurement section below: the overflow check came back
clean, so this section is precautionary rather than evidence-based, and is retained by
decision.

**2b. Accessibility fixes for the restored header.**

Un-hiding the header exposed styling upstream never needed. Its dark-mode block is
a list of `!important` overrides on named selectors (`a`, `.btn`, `article`, `.card`,
`.menu`) rather than swapped custom properties, so anything not enumerated keeps its
light-mode colour while inheriting whitened text. Chips are anchors, so they rendered
white on Spectre's `#d5dbdf` pill.

| | Before | After |
| --- | ---: | ---: |
| Chip text, dark mode | **1.40:1** | 12.33:1 |
| Chip boundary vs page (WCAG 1.4.11, 3:1) | ~1.3:1 | 3.26:1 dark / 3.20:1 light |
| Search placeholder | 3.41:1 | 5.98:1 light / 6.68:1 dark |
| Chip tap target (WCAG 2.5.8, 24px) | ~19px | 32px |
| Visible keyboard focus (WCAG 2.4.7) | none | 2px ring, 7.59:1 dark / 5.16:1 light |

Also: chips wrap instead of truncating with an ellipsis; upstream's `flex: 1 0 auto`
removed so chips size to content rather than stretching; the search field is brought
into the dark scheme instead of staying a white panel; and a `prefers-reduced-motion`
block for Spectre's animations.

Every pair is computed by `css/check-contrast.mjs`, which exits non-zero on failure
and keeps the original broken pair as a regression guard.

**Colour scheme support:** system preference only, via upstream's
`@media (prefers-color-scheme: dark)`. There is no manual override, by decision —
adding one would mean rewriting upstream's `!important` block as custom properties.

**2c. Compact mode works from the feed header, and persists.**

Friends renders an `a.toggle-compact` chip in the header, but its click handler lives in
`friends-default-theme.js`, which Friends enqueues only from `Frontend::default_theme()`.
Under any other theme the chip is inert — that is why it did nothing here.

Friends' own handler is also purely visual: it toggles `.all-collapsed` on
`section.posts` and rewrites the link text, but never stores the choice, so it resets on
reload. In every theme, including the default one.

`js/collapse.js` restores the toggle and additionally persists it, writing the same
per-user option the Friends settings screen writes — `friends_frontend_default_view`, set
to `'collapsed'` or deleted (`friends/includes/class-admin.php:548-559`). Front-end chip
and settings screen therefore stay in sync in both directions.

Verified end to end on the local site:

| Action | Result |
| --- | --- |
| `collapsed=1` | option becomes `'collapsed'`; page renders `section.posts.all-collapsed` |
| `collapsed=0` | option deleted, matching how the settings screen clears it |
| invalid nonce | HTTP 403 |
| logged out | HTTP 400 (registered on `wp_ajax_` only, never `wp_ajax_nopriv_`) |

The script is vanilla JS — jQuery is not loaded on this page under this theme — and sets
`role="button"` plus `aria-pressed` on the chip, since it is an anchor acting as a toggle.
A failed save is silent by design: the visual toggle has already happened and is still
useful, so a network error should not interrupt reading.

**2d. The duplicate per-post menu is removed.**

`frontend/parts/header.php` rendered a burger dropdown beside the post meta whose
contents are `frontend/parts/header-menu` — exactly what `frontend/parts/footer.php`
already renders below the post content (Share link, Muffle, Trash). Two identical menus
per post is noise on a phone, so the header one is dropped in our override.

Note `parts/header-status.php` has a similar dropdown that **also** carries a "Reply"
item the footer lacks. That one is deliberately left alone — removing it would lose
Reply. Status-format posts are the only ones that use it.

**2e. The Boost button is shown, and the footer action row wraps.**

Upstream hides the Boost button outright:

```scss
article .card-footer .friends-boost { display: none; }   // style.scss:869
```

Unconditional — not inside a media query. Boost is the native ActivityPub `Announce`
and is a different operation from Reblog (see the reference below), so this fork shows
it again.

Upstream also lays the footer out as `display: flex; justify-content: flex-end` with no
`flex-wrap`, forcing Reblog / Boost / Reaction / Comments / Menu onto one line. The items
shrink below their labels' width, which makes "+ Reaction" and "Comments" visually
overlap and pushes the last items past the content edge. Now: `flex-wrap: wrap`, a row
and column `gap`, and `flex: 0 0 auto` on the children so no action is ever squeezed
narrower than its label. Actions also get the same 2rem minimum target height as the
header chips.

Rendered order in the footer is now Reblog, Boost, + Reaction, Comments, Menu.

**2f. The comment form is themed and stays inside the card.**

The reply form is core WordPress markup that neither Friends nor upstream styles, so it
arrived unthemed. Three problems:

- `<textarea cols="45">` has an intrinsic width from the `cols` attribute and no
  `max-width`, so it overhung the card's right edge. Fixed with `width: 100%` plus
  `box-sizing: border-box`, and `resize: vertical` so dragging can't reintroduce it.
- The submit button carries theme.json's `wp-element-button` / `wp-block-button__link`
  classes, rendering a pale grey button unlike anything else in the theme. Restyled to
  match Spectre's primary button, which is the vocabulary the rest of this theme uses.
  Our selector is `(0,3,0)` against theme.json's `(0,1,0)` and theme.json sets no
  `!important`, so no specificity fight.
- The textarea stayed white in dark mode. Now `#313443` with white text, matching the
  search field and cards.

`font-size: 1rem` on the textarea is deliberate — iOS Safari zooms the viewport when a
focused input's font size is below 16px.

Approaches considered: matching Spectre (chosen — consistent with every other control
here); matching the site's theme.json block styles (would make the reader look like the
public site rather than a reader); or overriding Friends' comment template outright (more
control, but more divergence from upstream for no visual gain).

---

### Reference: Reblog vs Boost

These are different operations and both belong in the post menu.

| | Reblog | Boost |
| --- | --- | --- |
| Renders from | `frontend/parts/reblog-button.php` | `frontend/parts/activitypub/boost-button.php` |
| Rendered by | `Frontend` (`class-frontend.php:986`) | ActivityPub feed parser (`class-feed-parser-activitypub.php:4413`) |
| What it does | Creates a **new local WordPress post** authored by you containing the content, with meta `reblog` (original guid) and `reblog_of` (local post ID) | Sends an ActivityPub **`Announce`** activity to your followers' inboxes |
| Creates local content? | Yes — a real `post` that appears on your blog | No |
| On the wire | Federates as your own `Create` | A native fediverse boost |
| Undo | `unreblog()` trashes the created post | `friends_feed_parser_activitypub_unannounce` |

So Boost is the fediverse boost; Reblog is WordPress-native reposting that happens to
federate as a new post of your own. Both buttons are present in this theme already —
they are handled by `friends.js`, which Friends enqueues for every theme. Only the
collapse behaviour lived in the default-theme-only script.

### Reference: why the Reactions control can disappear

`frontend/parts/reactions.php:21` gates the "+ Reaction" control behind
`Friends::is_main_user() || current_user_can( 'friend' ) || current_user_can( 'acquaintance' )`.

On a site where Friends was activated by WP-CLI, `friends_main_user_id` ends up `'0'`
because WP-CLI has no current user, so the control never renders for anyone. That is a
site-configuration artifact, not a theme problem. Fix with:

```sh
wp option update friends_main_user_id <your-user-id>
```

**3. The feed post-type filter is gone.**

Upstream registered:

```php
add_filter( 'friends_frontend_post_types', function ( array $array ) {
	if ( $_SERVER["REQUEST_URI"] == "/friends/" ) {
		$array = array( 'post_type' => 'post' );
	}
	return $array;
} );
```

Friends treats that filter's return value as a flat list of post types and passes it
directly into the main feed query (`friends/includes/class-frontend.php:2333`). The
associative array above has a single value, `'post'`, so `friend_post_cache` was excluded
and `/friends/` showed the site owner their own posts instead of their feed.

Because the condition is an exact string match on `REQUEST_URI`, it applied only to
`/friends/` — pagination and filtered views were unaffected, which makes the symptom look
like a display quirk rather than wrong content.

Not carried over. See the comment at the foot of `asterism.php`.

**4. Minor:** `wp_enqueue_style( 'dashicons', "wp-includes/css/dashicons.min.css" )` passed
a bare relative path that resolves against the current URL. Replaced with
`wp_enqueue_style( 'dashicons' )`, since core already registers that handle.

**5. Minor:** `css/package.json` trimmed from lerna / wp-scripts / eslint down to the two
packages the build actually uses, `sass` and `spectre.css`.

**6. Minor:** assets are versioned with `filemtime()` rather than `Friends::VERSION`.
Upstream's version never changes when the CSS is recompiled, so a rebuilt stylesheet kept
the same URL and browsers served a stale cached copy — which makes a correct deploy look
broken. The file's mtime changes exactly when the file does.

---

### Build

The stylesheet imports Spectre.css from `node_modules`, so it must be compiled.

```sh
cd css
npm install
npm run build      # or: npm run watch
```

`_mobile.scss` is imported last from `style.scss`. Keep it last — its overrides rely on
source order to beat upstream's `!important` rules at equal specificity.

Do not hand-edit `style.css`; it is generated.

---

### Verifying the overflow fix

`check-overflow.js` lists every element wider than the viewport. Paste it into DevTools on
`/friends/` at a phone width, before and after. An empty array means the containment rules
are doing their job and the `overflow-x: hidden` guard can come out.

---

### WordPress standards review

Reviewed against the `wp-plugin-development` skill's guardrails. Most of its checklist is
not applicable: this plugin stores no options, creates no tables, registers no post types
or rewrite rules, adds no admin UI, runs no cron, and handles no form input. So there is
nothing for activation/deactivation/uninstall hooks or the Settings API to do, and no SQL
to prepare.

Fixed during the review:

- **Added `Requires Plugins: friends`.** The plugin is inert without Friends; declaring the
  dependency lets WordPress 6.5+ enforce it rather than leaving a silently dead plugin.
- **Added `Requires at least`, `Requires PHP`, `License URI`.**
- **Added `Update URI: false`,** so WordPress can never match this fork against a
  wordpress.org plugin of the same slug and overwrite it.
- **Dropped `namespace Friends;`.** Upstream declared its bootstrap inside Friends' own
  namespace to shorten a type hint. Squatting another plugin's namespace risks collisions,
  so the hint is now the fully-qualified `\Friends\Frontend`.
- **Guarded the `define()`** with `defined()`.
- **Escaping in `templates/frontend/header.php`:** `_e( 'Publish' )` emitted an unescaped
  translated string; six calls were written `echo esc_html_e( … )` / `echo esc_attr_e( … )`,
  which echo the functions' void return on top of their own output; and `"Starred"` used
  `esc_attr_e` for visible text where `esc_html_e` belongs.

Passing already, no change needed:

- `defined( 'ABSPATH' ) || exit;` on the bootstrap.
- No side effects at load beyond `define()` and hook registration.
- Assets resolved through `plugins_url()`, never hardcoded.
- The one superglobal read in `header.php` is `$_GET['s']`, correctly `wp_unslash()` +
  `sanitize_text_field()` on input and `esc_attr()` on output.
- Main file name matches the plugin directory.
- `php -l` clean on every PHP file.

Deliberately **not** changed:

- **No `defined( 'ABSPATH' ) || exit;` in the four template files.** Friends' own core
  templates don't carry it either; these partials are only reachable through Friends'
  template loader, and direct access would fatal on undefined functions rather than leak
  anything. Adding it would widen the diff against upstream for negligible gain. Easy to
  reverse if you'd rather have the guard.

Not verified:

- **PHPCS / WordPress Coding Standards has not been run** — `phpcs` is not installed
  locally. The findings above come from reading the code against the skill's references,
  not from a standards sweep.
- The `wp-plugin-development` skill's own `detect_plugins.mjs` reports 0 plugins for this
  directory. Its header regex is `^\s*Plugin Name:`, which does not allow the ` * ` docblock
  prefix that WordPress conventionally uses and that core's `get_file_data()` strips. That
  is a bug in the detector, not in this plugin — it would miss Friends and upstream FediPress
  equally.

### Measurement, 2026-08-11

Tested on a local Studio site (`~/Studio/friends-theme-test`) running Friends 4.2.1 and
ActivityPub 9.2.1 — the same versions as production — with Paul's full 806-subscription
OPML imported and 20 feeds fetched, giving **384 real cached posts**.

Content analysis across those 384 posts:

| Element | Count |
| --- | ---: |
| `iframe`, `table`, `pre`, `video`, `embed` | **0** |
| `img` | 49 |
| `blockquote` | 19 |
| unbroken tokens ≥45 chars | 107 (longest 167) |

A DevTools sweep at a 390px viewport found **one** overflowing element on the entire
page: WordPress's own admin bar (`#wp-admin-bar-my-account .display-name`, 103px
overshoot). Nothing in the feed overflowed.

This falsified the original diagnosis. The `iframe`/`table`/`overflow-x` rules in
section 2 of `_mobile.scss` address problems this feed does not have; they are retained
by decision as insurance, and are labelled as precautionary in the source.

### Status

Installed and rendering on the local Studio site. `/friends/` returns 200 with 20
articles, the theme stylesheet loads, and the header renders with 15 chips. Every PHP
file lints clean and `check-contrast.mjs` passes.

**Not yet installed on the live site**, where `fedipress-main` remains active.

Outstanding: the built-in Friends `mastodon` theme renders well on mobile and is worth
weighing against this fork — Paul notes it lacks "a couple of post-level options", which
is the remaining reason to prefer this one.
