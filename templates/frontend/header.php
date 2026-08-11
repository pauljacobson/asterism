<?php
/**
 * The /friends/ header
 *
 * @version 1.0
 * @package Friends
 */

$_search = '';
if ( isset( $_GET['s'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$_search = sanitize_text_field( wp_unslash( $_GET['s'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
}

add_filter(
	'document_title_parts',
	function ( $title ) use ( $args ) {
		if ( isset( $args['title'] ) ) {
			$title['title'] = $args['title'];
		}
		return $title;
	}
);

?><!DOCTYPE html>
<html <?php language_attributes(); ?> class="no-js no-svg">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>

<body <?php body_class( 'off-canvas off-canvas-sidebar-show' ); ?>>
	<div id="friends-sidebar" class="off-canvas-sidebar">
		<div class="friends-brand">
			<?php
			/*
			 * Upstream rendered its own logo image and the literal text "Fedipress"
			 * here. This is a renamed fork, so shipping FediPress's mark under a
			 * different name would be both confusing and not ours to do. Text-only
			 * brand for now; drop an <img> back in if Asterism ever gets a mark.
			 */
			?>
			<a class="friends-logo" href="<?php echo esc_url( home_url( '/friends/' ) ); ?>">
				<h2>Asterism</h2>
			</a>
			<a class="friends-sidebar-customize" href="<?php echo esc_url( add_query_arg( 'url', home_url( '/friends/' ), admin_url( 'customize.php?autofocus[section]=sidebar-widgets-friends-sidebar' ) ) ); ?>"><?php esc_html_e( 'customize sidebar', 'friends' ); ?></a>
		</div>
		<div class="friends-nav accordion-container">
			<?php if ( ! dynamic_sidebar( 'friends-sidebar' ) ) : ?>
				<nav class="friends-widget" aria-label="<?php esc_attr_e( 'Friends navigation', 'friends' ); ?>">
					<ul class="menu friends-sidebar-fallback">
						<li class="menu-item"><a href="<?php echo esc_url( home_url( '/friends/' ) ); ?>"><?php esc_html_e( 'Feed', 'friends' ); ?></a></li>
						<li class="menu-item"><a href="<?php echo esc_url( home_url( '/friends/add-friend/' ) ); ?>"><?php esc_html_e( 'Add Friend', 'friends' ); ?></a></li>
						<li class="menu-item"><a href="<?php echo esc_url( home_url( '/friends/following/' ) ); ?>"><?php esc_html_e( 'Following', 'friends' ); ?></a></li>
						<li class="menu-item"><a href="<?php echo esc_url( admin_url() ); ?>"><?php esc_html_e( 'Dashboard', 'friends' ); ?></a></li>
					</ul>
				</nav>
			<?php endif; ?>
		</div>
	</div>

	<a class="off-canvas-overlay" href="#close" aria-label="<?php esc_attr_e( 'Close sidebar', 'friends' ); ?>"></a>

	<div class="off-canvas-content">
		<header class="<?php echo is_single() ? '' : 'navbar'; ?><?php echo ( isset( $args['no-bottom-margin'] ) && $args['no-bottom-margin'] ) ? ' no-bottom-margin' : ''; ?>">
			<section class="navbar-section author">
			<a class="off-canvas-toggle btn btn-primary bt-action" href="#friends-sidebar" aria-label="<?php esc_attr_e( 'Open sidebar', 'friends' ); ?>" aria-controls="friends-sidebar" aria-expanded="false">
				<span class="ab-icon dashicons dashicons-menu-alt2" aria-hidden="true"></span>
			</a>
			<?php
			if ( $args['friend_user'] && $args['friend_user'] instanceof Friends\User && is_singular() ) {
				Friends\Friends::template_loader()->get_template_part(
					'frontend/single-header',
					$args['post_format'],
					$args
				);
			} elseif ( $args['friend_user'] && $args['friend_user'] instanceof Friends\User ) {
				Friends\Friends::template_loader()->get_template_part(
					'frontend/author-header',
					$args['post_format'],
					$args
				);
			} elseif ( isset( $args['title'] ) ) {
				?>
				<div id="main-header" class="mb-2">
					<h2 id="page-title"><a href="<?php echo esc_url( home_url( '/friends/' ) ); ?>">
						<?php echo esc_html( $args['title'] ); ?>
					</a></h2>
				</div>
				<?php
			} else {
				Friends\Friends::template_loader()->get_template_part(
					'frontend/main-feed-header',
					$args['post_format'],
					$args
				);
			}
			?>

			</section>

			<dialog class="search-dialog">
			</dialog>


			<section class="navbar-section search<?php echo esc_attr( is_singular() ? ' d-hide' : '' ); ?>">
				<form class="input-group input-inline form-autocomplete" action="<?php echo esc_url( home_url( '/friends/' ) ); ?>">
					<div class="form-autocomplete-input form-input">
						<div class="has-icon-right">
							<label class="asterism-screen-reader-text" for="master-search"><?php /* phpcs:ignore WordPress.WP.I18n.MissingArgDomain */ esc_html_e( 'Search or paste URL' ); ?></label>
							<input class="form-input" type="text" name="s" placeholder="<?php /* phpcs:ignore WordPress.WP.I18n.MissingArgDomain */ esc_attr_e( 'Search or paste URL' ); ?>" value="<?php echo esc_attr( $_search ); ?>" id="master-search" autocomplete="off" data-nonce="<?php echo esc_attr( wp_create_nonce( 'friends-autocomplete' ) ); ?>" />
							<i class="form-icon" aria-hidden="true"></i>
						</div>
					</div>
					<ul class="menu" style="display: none">
					</ul>
					<button type="submit" class="btn btn-primary input-group-btn"><?php /* phpcs:ignore WordPress.WP.I18n.MissingArgDomain */ esc_html_e( 'Search' ); ?></button>
				</form>
			</section>
		</header>
	<?php
	do_action( 'friends_after_header', $args );
