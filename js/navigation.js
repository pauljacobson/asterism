/**
 * Keyboard and ARIA state for Asterism's dropdown and off-canvas navigation.
 *
 * The inherited dropdown CSS exposes menus on focus, but it cannot keep
 * aria-expanded in sync or support Escape. Asterism's stylesheet disables that
 * focus-only rule; this file owns the equivalent interaction for both pointer
 * and keyboard users.
 */
( function () {
	'use strict';

	/**
	 * Return the menu controlled by a dropdown trigger.
	 *
	 * @param {Element} trigger The .friends-dropdown-toggle control.
	 * @return {Element|null} Its adjacent menu, if present.
	 */
	function dropdownMenu( trigger ) {
		var menu = trigger.nextElementSibling;
		return menu && menu.classList.contains( 'menu' ) ? menu : null;
	}

	/**
	 * Close every dropdown except an optional retained trigger.
	 *
	 * @param {Element|null} except Trigger to leave open.
	 */
	function closeDropdowns( except ) {
		Array.prototype.forEach.call( document.querySelectorAll( '.friends-dropdown-toggle' ), function ( trigger ) {
			if ( trigger === except ) {
				return;
			}

			var menu = dropdownMenu( trigger );
			if ( menu ) {
				menu.style.display = 'none';
			}
			trigger.setAttribute( 'aria-expanded', 'false' );
		} );
	}

	/**
	 * Reflect the CSS-driven off-canvas state on its opening control.
	 */
	function updateSidebarState() {
		var sidebar = document.getElementById( 'friends-sidebar' );
		var toggle = document.querySelector( '.off-canvas-toggle[aria-controls="friends-sidebar"]' );
		if ( ! sidebar || ! toggle ) {
			return;
		}

		var desktopVisible = 'relative' === window.getComputedStyle( sidebar ).position;
		var expanded = desktopVisible || '#friends-sidebar' === window.location.hash;
		toggle.setAttribute( 'aria-expanded', expanded ? 'true' : 'false' );
	}

	document.addEventListener( 'click', function ( event ) {
		if ( ! event.target.closest ) {
			return;
		}

		var trigger = event.target.closest( '.friends-dropdown-toggle' );
		if ( trigger ) {
			event.preventDefault();
			var menu = dropdownMenu( trigger );
			if ( ! menu ) {
				return;
			}

			var willOpen = 'true' !== trigger.getAttribute( 'aria-expanded' );
			closeDropdowns( trigger );
			menu.style.display = willOpen ? 'block' : 'none';
			trigger.setAttribute( 'aria-expanded', willOpen ? 'true' : 'false' );
			return;
		}

		if ( ! event.target.closest( '.friends-dropdown' ) ) {
			closeDropdowns( null );
		}
	} );

	document.addEventListener( 'keydown', function ( event ) {
		if ( ! event.target.closest ) {
			return;
		}

		var trigger = event.target.closest( 'a.friends-dropdown-toggle' );
		if ( trigger && ( 'Enter' === event.key || ' ' === event.key || 'Spacebar' === event.key ) ) {
			event.preventDefault();
			trigger.click();
			return;
		}

		if ( 'Escape' === event.key ) {
			var openTrigger = document.querySelector( '.friends-dropdown-toggle[aria-expanded="true"]' );
			if ( openTrigger ) {
				closeDropdowns( null );
				openTrigger.focus();
				event.preventDefault();
			}
		}
	} );

	window.addEventListener( 'hashchange', updateSidebarState );
	window.addEventListener( 'resize', updateSidebarState );

	document.addEventListener( 'DOMContentLoaded', function () {
		Array.prototype.forEach.call( document.querySelectorAll( '.friends-dropdown-toggle' ), function ( trigger ) {
			if ( 'A' === trigger.tagName ) {
				trigger.setAttribute( 'role', 'button' );
			}
			trigger.setAttribute( 'aria-haspopup', 'true' );
			trigger.setAttribute( 'aria-expanded', 'false' );
		} );
		updateSidebarState();
	} );
}() );
