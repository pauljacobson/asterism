/**
 * Lists every element inside the Friends feed that extends past the right edge
 * of the viewport. Paste into DevTools on /friends/ at a phone width.
 *
 * An empty array means nothing overflows.
 */
( () => {
	const limit = document.documentElement.clientWidth;

	const offenders = [ ...document.querySelectorAll( '.friends-page *' ) ]
		.map( ( el ) => ( { el, rect: el.getBoundingClientRect() } ) )
		// 1px of slack absorbs sub-pixel rounding, which otherwise reports
		// dozens of false positives on scaled displays.
		.filter( ( { rect } ) => rect.right > limit + 1 && rect.width > 0 )
		.sort( ( a, b ) => b.rect.right - a.rect.right )
		.slice( 0, 20 )
		.map( ( { el, rect } ) => ( {
			tag: el.tagName.toLowerCase(),
			cls: ( el.className || '' ).toString().trim().slice( 0, 60 ),
			width: Math.round( rect.width ),
			overshoot: Math.round( rect.right - limit ),
		} ) );

	console.table( offenders );
	return { viewport: limit, count: offenders.length, offenders };
} )();
