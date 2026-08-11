<?php
/**
 * Plugin Name: Asterism
 * Description: A mobile-first reader theme for the Friends plugin. Restores the feed header, meets WCAG AA, and makes the collapse controls work.
 * Version: 1.0.0
 * Author: Paul Jacobson
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Requires Plugins: friends
 * License: GPL-3.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain: friends
 * Update URI: false
 *
 * Based on FediPress 1.0.2 by Lívia Gouvêa — https://github.com/alquimidia/fedipress
 * Its design is retained; see README.md for every change made against it.
 *
 * Licensing note: upstream states GPL-3 in both its README and its plugin
 * header, but the LICENSE file it ships is the GNU Affero GPL v3, so GitHub
 * detects that repository as AGPL-3.0. Two human-authored statements of intent
 * outweigh one file — and AGPL-3.0 sits directly beside GPL-3.0 in GitHub's
 * licence picker, which makes a mis-selection the likeliest explanation.
 *
 * GPL-3.0-or-later is also the safer choice in the direction that matters.
 * GPLv3 section 7 does not permit a downstream to add a network-use
 * requirement, so publishing a derivative of GPL-3.0 work under AGPL-3.0 would
 * impose a term the original author never granted. Section 13 permits
 * combining with AGPL work; it does not permit converting GPL work into it.
 *
 * To be revisited if upstream confirms AGPL-3.0 was intended.
 *
 * Notes on two headers that look wrong but are deliberate:
 *
 * - "Text Domain: friends" is correct here. This plugin ships no strings of its
 *   own; the templates it carries over from upstream render Friends' own
 *   translatable strings, which belong to the 'friends' domain.
 * - "Update URI: false" stops WordPress from ever matching this fork against a
 *   wordpress.org plugin of the same slug and overwriting it with an update.
 *
 * @package Asterism
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'ASTERISM_PLUGIN_DIR' ) ) {
	define( 'ASTERISM_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

/**
 * Register the theme with Friends.
 *
 * The slug differs from upstream's 'fedipress' so this fork can be installed
 * alongside the original without the two claiming the same hook names.
 *
 * Every hook below only ever fires from inside Friends, so no explicit
 * "is Friends active?" check is needed — without it, none of this runs.
 */
add_action(
	'friends_load_themes',
	function ( \Friends\Frontend $friends_frontend ) {
		$friends_frontend->register_theme( 'Asterism', 'asterism' );
	}
);

add_action(
	'friends_load_theme_asterism',
	function () {
		$handle = 'asterism';
		$path   = ASTERISM_PLUGIN_DIR . 'css/style.css';

		// Upstream versioned the stylesheet with Friends::VERSION, which does not
		// change when the CSS is recompiled — so a rebuilt stylesheet keeps the
		// same URL and browsers serve a stale cached copy. The file's own mtime
		// changes exactly when the file does, which is what a cache buster wants.
		$version = file_exists( $path ) ? (string) filemtime( $path ) : \Friends\Friends::VERSION;

		wp_enqueue_style(
			$handle,
			plugins_url( 'css/style.css', __FILE__ ),
			array(),
			apply_filters( 'friends_debug_enqueue', $version, $handle, $path )
		);

		// Upstream passed a bare relative path here, which resolves against the
		// current URL rather than wp-includes. 'dashicons' is registered by core,
		// so enqueueing it by handle is both correct and shorter.
		wp_enqueue_style( 'dashicons' );

		// Friends renders both the `a.toggle-compact` chip and the per-post
		// `a.collapse-post` button in shared templates, but their handlers live in
		// friends-default-theme.js, which Friends enqueues only for its own default
		// theme. Without this, neither control does anything.
		$js = ASTERISM_PLUGIN_DIR . 'js/collapse.js';

		wp_enqueue_script(
			'asterism-collapse',
			plugins_url( 'js/collapse.js', __FILE__ ),
			array(),
			file_exists( $js ) ? (string) filemtime( $js ) : \Friends\Friends::VERSION,
			true
		);

		wp_localize_script(
			'asterism-collapse',
			'asterism',
			array(
				'ajaxUrl'      => admin_url( 'admin-ajax.php' ),
				'nonce'        => wp_create_nonce( 'asterism-view' ),
				/*
				 * Deliberately shorter than Friends' own "Compact mode" /
				 * "Expanded mode": the chip sits in a wrapping row on a phone, and
				 * one word reads better there. Plain strings rather than __() —
				 * this plugin ships no translations of its own, and these are not
				 * Friends' strings to look up.
				 */
				'textCompact'  => 'Compact',
				'textExpanded' => 'Expand',
			)
		);
	}
);

/**
 * Wrap the "no comments" status message in an element we can style.
 *
 * Friends returns this message as a bare string and hands it straight to
 * wp_send_json_success() (includes/class-frontend.php:1470), so the JS injects a
 * naked text node immediately before the reply form's <h5>. With no element there
 * is nothing to give a margin to, and the two run together.
 *
 * The message is plugin-generated and may legitimately contain a link, so it is
 * wrapped rather than escaped. Runs late so it wraps whatever text the feed
 * parsers settled on.
 */
add_filter(
	'friends_no_comments_feed_available',
	function ( $text ) {
		if ( ! is_string( $text ) || '' === trim( $text ) ) {
			return $text;
		}

		return '<p class="asterism-comments-note">' . $text . '</p>';
	},
	99
);

/**
 * Persist the compact/expanded choice made from the feed header.
 *
 * Friends' settings screen stores this as the per-user option
 * `friends_frontend_default_view`, set to 'collapsed' or deleted entirely
 * (see friends/includes/class-admin.php). Writing the same option the same way
 * is what keeps the front-end chip and the settings screen in sync.
 *
 * Registered on `wp_ajax_` only — never `wp_ajax_nopriv_` — so it is unreachable
 * to logged-out visitors. The nonce guards against CSRF, and because the option
 * is per-user and purely a display preference, a logged-in user changing their
 * own value needs no further capability check.
 */
add_action(
	'wp_ajax_asterism_set_view',
	function () {
		check_ajax_referer( 'asterism-view' );

		$collapsed = isset( $_POST['collapsed'] )
			&& '1' === sanitize_text_field( wp_unslash( $_POST['collapsed'] ) );

		if ( $collapsed ) {
			update_user_option( get_current_user_id(), 'friends_frontend_default_view', 'collapsed' );
		} else {
			delete_user_option( get_current_user_id(), 'friends_frontend_default_view' );
		}

		wp_send_json_success( array( 'collapsed' => $collapsed ) );
	}
);

add_filter(
	'friends_template_paths_theme_asterism',
	function ( $file_paths ) {
		$file_paths[15] = ASTERISM_PLUGIN_DIR . 'templates';
		return $file_paths;
	}
);

/*
 * Upstream also registered a 'friends_frontend_post_types' filter that replaced
 * the feed's post types with array( 'post_type' => 'post' ) whenever REQUEST_URI
 * was exactly '/friends/'.
 *
 * That filter is deliberately NOT carried over. Friends treats the filtered value
 * as a flat list of post types and feeds it straight into the main query
 * (includes/class-frontend.php:2333), so the upstream version dropped
 * 'friend_post_cache' and showed the site owner their own posts instead of their
 * feed — but only on that one exact URL, leaving pagination and filtered views
 * behaving normally.
 */
