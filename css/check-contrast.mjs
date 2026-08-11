/**
 * WCAG contrast check for the colour pairs used in _mobile.scss.
 *
 * Run: node check-contrast.mjs
 * Exits non-zero if any pair fails its stated requirement, so this is the
 * one runnable check guarding the accessibility work.
 *
 * Thresholds (WCAG 2.2):
 *   4.5:1  normal text (1.4.3 AA)
 *   3:1    large text, and non-text/UI boundaries (1.4.11 AA)
 */

const srgb = ( c ) => {
	const v = c / 255;
	return v <= 0.03928 ? v / 12.92 : Math.pow( ( v + 0.055 ) / 1.055, 2.4 );
};

const luminance = ( hex ) => {
	const h = hex.replace( '#', '' );
	const [ r, g, b ] = [ 0, 2, 4 ].map( ( i ) => parseInt( h.slice( i, i + 2 ), 16 ) );
	return 0.2126 * srgb( r ) + 0.7152 * srgb( g ) + 0.0722 * srgb( b );
};

const ratio = ( a, b ) => {
	const [ l1, l2 ] = [ luminance( a ), luminance( b ) ].sort( ( x, y ) => y - x );
	return ( l1 + 0.05 ) / ( l2 + 0.05 );
};

// [label, foreground, background, required]
const PAIRS = [
	// The reported bug: what upstream actually renders in dark mode.
	[ 'BROKEN dark chip text on Spectre chip bg', '#ffffff', '#d5dbdf', 4.5 ],

	// Light scheme (page bg #f7f8f9) — already passing, kept as a regression guard.
	[ 'light chip text on chip bg', '#3b4351', '#eef0f3', 4.5 ],
	[ 'light chip border vs page bg', '#848c96', '#f7f8f9', 3 ],
	[ 'light focus ring vs page bg', '#2e5bec', '#f7f8f9', 3 ],
	[ 'light placeholder on input bg', '#5c6470', '#ffffff', 4.5 ],

	// Dark scheme (page bg #1e2327, surfaces #313443).
	[ 'dark chip text on chip bg', '#ffffff', '#313443', 4.5 ],
	[ 'dark chip border vs page bg', '#6b7183', '#1e2327', 3 ],
	[ 'dark focus ring vs page bg', '#8ab4ff', '#1e2327', 3 ],
	[ 'dark active chip text on active bg', '#ffffff', '#2e5bec', 4.5 ],
	[ 'dark page text on page bg', '#ffffff', '#1e2327', 4.5 ],
	[ 'dark card text on card bg', '#ffffff', '#313443', 4.5 ],
	[ 'dark input text on input bg', '#ffffff', '#313443', 4.5 ],
	[ 'dark placeholder on input bg', '#b9bfcb', '#313443', 4.5 ],
	[ 'dark input border vs page bg', '#6b7183', '#1e2327', 3 ],

	// Comment form.
	[ 'light textarea text on textarea bg', '#3b4351', '#ffffff', 4.5 ],
	[ 'light textarea border vs card bg', '#848c96', '#f7f8f9', 3 ],
	[ 'dark textarea text on textarea bg', '#ffffff', '#313443', 4.5 ],
	[ 'dark textarea placeholder on bg', '#b9bfcb', '#313443', 4.5 ],
	[ 'light submit text on button bg', '#3b4351', '#eef0f3', 4.5 ],
	[ 'light submit border vs card bg', '#848c96', '#f7f8f9', 3 ],
	[ 'dark submit text on button bg', '#ffffff', '#313443', 4.5 ],
	[ 'dark submit border vs page bg', '#6b7183', '#1e2327', 3 ],

	[ 'light comments note on card bg', '#5c6470', '#f7f8f9', 4.5 ],
	[ 'dark comments note on card bg', '#b9bfcb', '#313443', 4.5 ],

	// ActivityPub mention indicator.
	[ 'light mention indicator on card bg', '#b42318', '#f7f8f9', 4.5 ],
	[ 'dark mention indicator on card bg', '#ff8a80', '#313443', 4.5 ],

	// Direct Messages.
	[ 'DM unread count on badge', '#ffffff', '#b42318', 4.5 ],
	[ 'light DM text on own message', '#3b4351', '#dce7ff', 4.5 ],
	[ 'dark DM text on own message', '#ffffff', '#23406b', 4.5 ],
];

let failed = 0;
for ( const [ label, fg, bg, need ] of PAIRS ) {
	const r = ratio( fg, bg );
	const expectFail = label.startsWith( 'BROKEN' );
	const ok = r >= need;
	if ( ! ok && ! expectFail ) {
		failed++;
	}
	const mark = expectFail ? ( ok ? '?? (expected to fail!)' : 'documented failure' ) : ok ? 'PASS' : 'FAIL';
	console.log( `${ r.toFixed( 2 ).padStart( 6 ) }:1  need ${ String( need ).padEnd( 3 ) }  ${ mark.padEnd( 19 ) } ${ label }` );
}

console.log( failed ? `\n${ failed } pair(s) failed.` : '\nAll required pairs pass.' );
process.exit( failed ? 1 : 0 );
