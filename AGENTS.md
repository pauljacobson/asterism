# Guidance for AI agents

Read this before changing anything in this repository. It is written for coding agents
(Claude Code, Codex, Cursor, Copilot and friends), but the workflow applies to human
contributors too.

Nothing here overrides the maintainer. If an instruction in this file conflicts with what
the person you are working for has asked, say so and let them decide.

## What this repository is

Asterism is a **theme for the [Friends](https://wordpress.org/plugins/friends/) WordPress
plugin**, distributed as a plugin of its own. It is a fork of
[FediPress](https://github.com/alquimidia/fedipress) 1.0.2 by Lívia Gouvêa, and the fork is
deliberately *corrective*: it keeps her design and fixes accessibility, mobile layout and
broken controls. Redesigning it is out of scope unless asked.

It has no build server, no CI and no test framework. The checks below are the only safety
net, so run them yourself.

## Workflow

1. **Never commit directly to `main`.** Branch first, even for a one-line change.
   ```sh
   git switch -c fix/comment-form-overflow
   ```
   Branch names: `fix/`, `feat/`, `docs/`, `chore/` followed by a short hyphenated
   description.
2. **One concern per branch and per PR.** A contrast fix and a footer-wrap fix are two
   branches. Reviewers reject or revert them independently.
3. **Run the checks** (below) before you push. They are fast.
4. **Open a pull request** against `main` rather than pushing the branch and stopping.
   The PR body should say what changed, *why*, and how you verified it — including which
   checks you ran and what you tested by hand. If you could not verify something, write
   that down instead of implying you did.
5. **Do not merge your own PR** unless the maintainer has said to. Do not force-push a
   branch that someone is already reviewing.

Never run `git push --force` on `main`, rewrite published history, or delete branches you
did not create.

## Checks that must pass

```sh
node css/check-contrast.mjs      # exits non-zero if any colour pair fails WCAG
cd css && npm install && npm run build && git diff --stat style.css
```

`check-contrast.mjs` is the one runnable guard on the accessibility work. One entry is
labelled `BROKEN` and is *expected* to fail — it is the upstream bug this fork fixes, kept
as a regression marker. Every other pair must pass.

The build prints Dart Sass deprecation warnings about `@import` (inherited from Spectre.css
and from `style.scss` itself). They are expected. Do not migrate to `@use` as a drive-by
fix: `@use` changes how the cascade is assembled, and the theme depends on `_mobile.scss`
being emitted last.

`check-overflow.js` is not automated. Paste it into DevTools on `/friends/` at a 390px
viewport; it lists any element wider than the viewport. Run it after any layout change.

There is no PHP linter configured here. Follow
[WordPress coding standards](https://developer.wordpress.org/coding-standards/): tabs for
indentation, Yoda conditions, `esc_html_e()` / `esc_attr()` / `esc_url()` on output,
`wp_unslash()` then `sanitize_*()` on input, and a nonce plus a capability check on
anything that writes.

## Things that look like bugs but are not

Agents "fix" these repeatedly. Each is deliberate and documented in place. If you think one
is genuinely wrong, raise it in an issue rather than changing it in a drive-by commit.

| Looks wrong | Why it is correct |
| --- | --- |
| `Text Domain: friends` in `asterism.php` | This plugin ships no strings of its own. The templates render Friends' strings, which belong to that domain. |
| `Update URI: false` | Stops WordPress matching this fork against a wordpress.org plugin of the same slug and overwriting it. |
| No `friends_frontend_post_types` filter | Upstream had one. It excluded `friend_post_cache` on exactly `/friends/`, showing you your own posts instead of your feed. Deliberately not carried over — see the closing comment in `asterism.php`. |
| `css/style.css` is committed | So the plugin works from a git clone with no build step. It is **generated** — never hand-edit it. |
| Section 2 of `css/_mobile.scss` | Precautionary overflow containment, kept by maintainer decision. The content analysis that would have justified it came back negative, so do not cite it as evidence-based — and do not delete it either. |
| `@import "mobile"` is last in `style.scss` | Its overrides beat upstream's `!important` rules by source order at equal specificity. Moving it breaks the theme silently. |

## Licensing and attribution

GPL-3.0-or-later. Contributions are accepted under the same licence.

Do not remove or dilute the FediPress attribution in `README.md`, `asterism.php` or the
template headers. It is a licence obligation, not a courtesy. Do not add code you cannot
licence under GPL-3.0-or-later, and do not paste in code of unknown provenance.

If you add a dependency, check its licence is GPL-compatible first, and expect to justify
why a few lines would not have done instead.

## Documentation

The record of changes against upstream lives in the
[wiki](https://github.com/pauljacobson/asterism/wiki/Asterism:-changes-against-upstream),
not in the repository. Substantive behavioural changes should be reflected there. The
README covers installation and build only — keep it that way.

## Disclosure

This project is openly AI-assisted, and the README says so. If you are an agent, say so in
the PR description. Attribute honestly: `Co-Authored-By:` trailers for agents, and no
commit authored under a human's name for work the human did not review.

## Reporting rather than guessing

If you cannot verify a claim in this environment — no WordPress install, no network, no way
to load `/friends/` — say that plainly instead of asserting the change works. An unverified
change described as tested is worse than an unverified change described as unverified.
