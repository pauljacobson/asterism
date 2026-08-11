/**
 * Collapse/expand behaviour for the Asterism theme.
 *
 * Friends renders both controls in shared templates — the `a.toggle-compact`
 * chip in the feed header, and an `a.collapse-post` button on every post — but
 * their handlers live in friends-default-theme.js, which Friends enqueues only
 * from Frontend::default_theme(). Under any other theme both controls are inert.
 *
 * This is a vanilla-JS port of that behaviour (jQuery is not loaded on this page
 * under this theme), plus one addition: the feed-wide toggle persists its choice
 * to the same per-user option the Friends settings screen writes, so the two
 * stay in sync. Per-post state is deliberately NOT persisted — Friends does not
 * persist it either, and it is a transient reading action.
 *
 * Collapse model, mirroring Friends:
 *   - Feed-wide compact = class `all-collapsed` on `section.posts`.
 *   - While the feed is compact, an individual post is expanded by giving the
 *     article `uncollapsed`.
 *   - While the feed is NOT compact, an individual post is collapsed by giving
 *     the article `collapsed`.
 */
( function () {
	'use strict';

	var config = window.asterism || {};

	function postsSection() {
		return document.querySelector( 'section.posts' );
	}

	/**
	 * Swap a collapse button's icon to match its post's state.
	 *
	 * @param {Element} button    The a.collapse-post element.
	 * @param {boolean} collapsed Whether its post is now collapsed.
	 */
	function updatePostIcon( button, collapsed ) {
		var icon = button.querySelector( 'i.dashicons' );
		if ( icon ) {
			icon.classList.toggle( 'dashicons-fullscreen-alt', collapsed );
			icon.classList.toggle( 'dashicons-fullscreen-exit-alt', ! collapsed );
		}
		button.setAttribute( 'aria-expanded', collapsed ? 'false' : 'true' );
	}

	/**
	 * Reflect feed-wide state in every toggle chip.
	 *
	 * @param {boolean} collapsed Whether the whole feed is compact.
	 */
	function updateChips( collapsed ) {
		var label = collapsed ? config.textExpanded : config.textCompact;

		Array.prototype.forEach.call( document.querySelectorAll( 'a.toggle-compact' ), function ( chip ) {
			if ( label ) {
				chip.textContent = label;
			}
			// An anchor acting as a toggle button; announce that to screen readers.
			chip.setAttribute( 'role', 'button' );
			chip.setAttribute( 'aria-pressed', collapsed ? 'true' : 'false' );
		} );
	}

	/**
	 * Persist the feed-wide choice. Silent on failure: the visual toggle has
	 * already happened and is still useful, so a network error should not
	 * interrupt reading.
	 *
	 * @param {boolean} collapsed Whether the whole feed is compact.
	 */
	function persist( collapsed ) {
		if ( ! config.ajaxUrl || ! config.nonce ) {
			return;
		}

		var body = new URLSearchParams();
		body.set( 'action', 'asterism_set_view' );
		body.set( '_wpnonce', config.nonce );
		body.set( 'collapsed', collapsed ? '1' : '0' );

		window.fetch( config.ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: body,
		} ).catch( function () {} );
	}

	document.addEventListener( 'click', function ( event ) {
		if ( ! event.target.closest ) {
			return;
		}

		// --- Feed-wide toggle -------------------------------------------------
		var chip = event.target.closest( 'a.toggle-compact' );
		if ( chip ) {
			event.preventDefault(); // the chip is `<a href="">`
			var section = postsSection();
			if ( ! section ) {
				return;
			}

			var allCollapsed = section.classList.toggle( 'all-collapsed' );

			// Starting a fresh feed-wide state should clear per-post exceptions,
			// otherwise posts opened earlier stay open and the toggle looks broken.
			Array.prototype.forEach.call( section.querySelectorAll( 'article' ), function ( article ) {
				article.classList.remove( 'uncollapsed', 'collapsed' );
				var button = article.querySelector( 'a.collapse-post' );
				if ( button ) {
					updatePostIcon( button, allCollapsed );
				}
			} );

			updateChips( allCollapsed );
			persist( allCollapsed );
			return;
		}

		// --- Per-post toggle --------------------------------------------------
		var button = event.target.closest( 'a.collapse-post' );
		if ( ! button ) {
			return;
		}

		// Don't hijack clicks on the menu, links, or form controls inside the post.
		if (
			event.target.closest( '.friends-dropdown' ) ||
			event.target.closest( 'a:not(.collapse-post)' ) ||
			event.target.closest( 'form' ) ||
			event.target.closest( 'textarea' ) ||
			event.target.closest( 'input' ) ||
			event.target.closest( 'button' ) ||
			event.target.closest( 'label' )
		) {
			return;
		}

		event.preventDefault();

		var article = button.closest( 'article' );
		if ( ! article ) {
			return;
		}

		var collapsed;
		if ( article.closest( 'section.all-collapsed' ) ) {
			// Feed is compact: this post becomes the exception.
			collapsed = ! article.classList.toggle( 'uncollapsed' );
		} else {
			collapsed = article.classList.toggle( 'collapsed' );
		}

		updatePostIcon( button, collapsed );
	} );

	// Set initial state from what the server rendered.
	document.addEventListener( 'DOMContentLoaded', function () {
		var section = postsSection();
		if ( ! section ) {
			return;
		}

		var allCollapsed = section.classList.contains( 'all-collapsed' );
		updateChips( allCollapsed );

		Array.prototype.forEach.call( section.querySelectorAll( 'a.collapse-post' ), function ( button ) {
			var article = button.closest( 'article' );
			updatePostIcon( button, allCollapsed && ( ! article || ! article.classList.contains( 'uncollapsed' ) ) );
		} );
	} );
}() );
