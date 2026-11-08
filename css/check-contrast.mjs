/**
 * WCAG contrast check for the Orbit palette and retained feature styles.
 *
 * Run: node check-contrast.mjs
 * Exits non-zero if any pair fails its stated requirement, so this is the
 * one runnable check guarding the accessibility work.
 *
 * Thresholds (WCAG 2.2):
 *   4.5:1  normal text (1.4.3 AA)
 *   3:1    large text, and non-text/UI boundaries (1.4.11 AA)
 */

import { readFileSync } from 'node:fs';

const srgb = ( c ) => {
	const v = c / 255;
	return v <= 0.03928 ? v / 12.92 : Math.pow( ( v + 0.055 ) / 1.055, 2.4 );
};

const luminance = ( hex ) => {
	let h = hex.replace( '#', '' );
	if ( 3 === h.length ) {
		h = Array.from( h, ( c ) => c + c ).join( '' );
	}
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

	// Direct Messages.
	[ 'DM unread count on badge', '#ffffff', '#b42318', 4.5 ],
	[ 'light DM text on own message', '#3b4351', '#dce7ff', 4.5 ],
	[ 'dark DM text on own message', '#ffffff', '#23406b', 4.5 ],
];

// Use the SCSS tokens directly so a palette change also changes what we check.
const orbit = readFileSync( new URL( '_orbit.scss', import.meta.url ), 'utf8' );
const [ lightSource, darkSource ] = orbit.split( '@media (prefers-color-scheme: dark)', 2 );
for ( const [ scheme, source, mention ] of [
	[ 'light', lightSource, '#b42318' ],
	[ 'dark', darkSource, '#ff8a80' ],
] ) {
	const colors = Object.fromEntries(
		Array.from( source.matchAll( /--asterism-([\w-]+):\s*(#[0-9a-f]{3,6});/gi ), ( [ , name, value ] ) => [ name, value ] ),
	);
	const { ink, muted, canvas, panel, rail, raised, accent, control, selected, 'on-accent': onAccent } = colors;
	for ( const [ name, foreground, background, required ] of [
		[ 'page text', ink, canvas, 4.5 ],
		[ 'card and chip text', ink, panel, 4.5 ],
		[ 'sidebar text', ink, rail, 4.5 ],
		[ 'metadata and comments note', muted, panel, 4.5 ],
		[ 'sidebar heading', muted, rail, 4.5 ],
		[ 'input text', ink, raised, 4.5 ],
		[ 'search and reply placeholder', muted, raised, 4.5 ],
		[ 'selected label', accent, selected, 4.5 ],
		[ 'post link and focus ring', accent, panel, 4.5 ],
		[ 'button text', onAccent, accent, 4.5 ],
		[ 'button fill and focus ring on page', accent, canvas, 3 ],
		[ 'sidebar focus ring', accent, rail, 3 ],
		[ 'chip and search boundary on page', control, canvas, 3 ],
		[ 'reply and menu boundary on panel', control, panel, 3 ],
		[ 'input boundary against its fill', control, raised, 3 ],
		[ 'ActivityPub mention on card', mention, panel, 4.5 ],
	] ) {
		PAIRS.push( [ scheme + ' ' + name, foreground, background, required ] );
	}
}

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
