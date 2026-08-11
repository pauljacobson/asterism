#!/usr/bin/env node

/**
 * Compare the installed Friends surfaces Asterism depends on with a reviewed
 * upstream baseline.
 *
 * Hash differences are review prompts, not failures: Asterism intentionally
 * diverges from Friends in its retained templates. When a monitored PHP
 * template changes, the hook and CSS-class summaries make the likely source of
 * drift visible without attempting an unsafe automatic merge.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname( fileURLToPath( import.meta.url ) );
const baselinePath = join( scriptDirectory, 'friends-template-baseline.json' );

function usage() {
	console.log( `Usage: node scripts/check-friends-drift.mjs [--friends=/path/to/friends]

The Friends directory can also be supplied through FRIENDS_PLUGIN_DIR. Without
either, the script checks common sibling WordPress plugin and Studio locations.

Template differences exit successfully because they require human review.
Invalid paths and unreadable baselines exit non-zero.` );
}

function parseArguments( argumentsToParse ) {
	let friendsPath = '';

	for ( let index = 0; index < argumentsToParse.length; index += 1 ) {
		const argument = argumentsToParse[ index ];

		if ( '--help' === argument || '-h' === argument ) {
			usage();
			process.exit( 0 );
		}

		if ( argument.startsWith( '--friends=' ) ) {
			friendsPath = argument.slice( '--friends='.length );
			continue;
		}

		if ( '--friends' === argument && argumentsToParse[ index + 1 ] ) {
			friendsPath = argumentsToParse[ index + 1 ];
			index += 1;
			continue;
		}

		throw new Error( `Unknown argument: ${ argument }` );
	}

	return { friendsPath };
}

function isFriendsDirectory( candidate ) {
	return existsSync( join( candidate, 'friends.php' ) );
}

function addCandidate( candidates, candidate ) {
	const absoluteCandidate = resolve( candidate );

	if ( isFriendsDirectory( absoluteCandidate ) ) {
		candidates.add( absoluteCandidate );
	}
}

function addStudioCandidates( candidates, studioRoot ) {
	if ( ! existsSync( studioRoot ) ) {
		return;
	}

	for ( const entry of readdirSync( studioRoot, { withFileTypes: true } ) ) {
		if ( ! entry.isDirectory() ) {
			continue;
		}

		addCandidate(
			candidates,
			join( studioRoot, entry.name, 'wp-content', 'plugins', 'friends' )
		);
	}
}

function locateFriendsDirectory( explicitPath ) {
	if ( explicitPath ) {
		const candidate = resolve( explicitPath );
		if ( ! isFriendsDirectory( candidate ) ) {
			throw new Error( `Friends was not found at ${ candidate }.` );
		}
		return candidate;
	}

	if ( process.env.FRIENDS_PLUGIN_DIR ) {
		const candidate = resolve( process.env.FRIENDS_PLUGIN_DIR );
		if ( ! isFriendsDirectory( candidate ) ) {
			throw new Error( `FRIENDS_PLUGIN_DIR does not contain friends.php: ${ candidate }` );
		}
		return candidate;
	}

	const localCandidates = new Set();
	let currentDirectory = resolve( process.cwd() );

	// This covers running from either a WordPress root or an installed Asterism
	// checkout at wp-content/plugins/asterism.
	while ( dirname( currentDirectory ) !== currentDirectory ) {
		addCandidate( localCandidates, join( currentDirectory, 'wp-content', 'plugins', 'friends' ) );
		addCandidate( localCandidates, join( currentDirectory, '..', 'friends' ) );
		currentDirectory = dirname( currentDirectory );
	}

	if ( 1 === localCandidates.size ) {
		return [ ...localCandidates ][ 0 ];
	}

	if ( localCandidates.size > 1 ) {
		throw new Error( `Multiple nearby Friends installations were found:\n${ [ ...localCandidates ].join( '\n' ) }\nPass --friends to choose one.` );
	}

	const studioCandidates = new Set();
	addStudioCandidates( studioCandidates, join( homedir(), 'Studio' ) );

	if ( 1 === studioCandidates.size ) {
		return [ ...studioCandidates ][ 0 ];
	}

	if ( studioCandidates.size > 1 ) {
		throw new Error( `Multiple Studio Friends installations were found:\n${ [ ...studioCandidates ].join( '\n' ) }\nPass --friends to choose one.` );
	}

	throw new Error( 'No Friends installation was found. Pass --friends=/path/to/friends.' );
}

function sha256( contents ) {
	return createHash( 'sha256' ).update( contents ).digest( 'hex' );
}

function extractSignals( contents ) {
	const hooks = new Set();
	const classes = new Set();
	const hookPattern = /\b(?:do_action|apply_filters)\s*\(\s*['"]([^'"]+)['"]/g;
	const classPattern = /\bclass\s*=\s*['"]([^'"]+)['"]/gi;

	for ( const match of contents.matchAll( hookPattern ) ) {
		hooks.add( match[ 1 ] );
	}

	for ( const match of contents.matchAll( classPattern ) ) {
		for ( const className of match[ 1 ].split( /\s+/ ) ) {
			// Ignore PHP fragments and other dynamic values that are not literal
			// CSS class names.
			if ( /^[A-Za-z][A-Za-z0-9_-]*$/.test( className ) && 'echo' !== className ) {
				classes.add( className );
			}
		}
	}

	return {
		hooks: [ ...hooks ].sort(),
		classes: [ ...classes ].sort(),
	};
}

function difference( left, right ) {
	const rightValues = new Set( right );
	return left.filter( ( value ) => ! rightValues.has( value ) );
}

function readFriendsVersion( friendsDirectory ) {
	const pluginContents = readFileSync( join( friendsDirectory, 'friends.php' ), 'utf8' );
	const headerMatch = pluginContents.match( /^\s*\*\s*Version:\s*(.+)$/mi );

	return headerMatch ? headerMatch[ 1 ].trim() : 'unknown';
}

function reportSignalChanges( expectedSignals, currentSignals ) {
	for ( const signalType of [ 'hooks', 'classes' ] ) {
		const expected = expectedSignals?.[ signalType ] ?? [];
		const current = currentSignals[ signalType ];
		const added = difference( current, expected );
		const removed = difference( expected, current );

		if ( added.length > 0 ) {
			console.log( `  ${ signalType } added: ${ added.join( ', ' ) }` );
		}
		if ( removed.length > 0 ) {
			console.log( `  ${ signalType } removed: ${ removed.join( ', ' ) }` );
		}
	}
}

function main() {
	const { friendsPath } = parseArguments( process.argv.slice( 2 ) );
	const baseline = JSON.parse( readFileSync( baselinePath, 'utf8' ) );
	const friendsDirectory = locateFriendsDirectory( friendsPath );
	const installedVersion = readFriendsVersion( friendsDirectory );
	let changed = 0;
	let unchanged = 0;

	console.log( `Friends ${ installedVersion } at ${ friendsDirectory }` );
	console.log( `Reviewed baseline: Friends ${ baseline.friendsVersion } (${ baseline.upstreamCommit })` );

	if ( installedVersion !== baseline.friendsVersion ) {
		console.log( `VERSION DRIFT: installed ${ installedVersion }, baseline ${ baseline.friendsVersion }` );
	}

	for ( const monitoredFile of baseline.files ) {
		const absolutePath = join( friendsDirectory, monitoredFile.path );

		if ( ! existsSync( absolutePath ) ) {
			changed += 1;
			console.log( `DRIFT  ${ monitoredFile.path } (${ monitoredFile.role })` );
			console.log( '  file is missing from the installed Friends plugin' );
			continue;
		}

		const contents = readFileSync( absolutePath, 'utf8' );
		const currentHash = sha256( contents );

		if ( currentHash === monitoredFile.sha256 ) {
			unchanged += 1;
			console.log( `OK     ${ monitoredFile.path } (${ monitoredFile.role })` );
			continue;
		}

		changed += 1;
		console.log( `DRIFT  ${ monitoredFile.path } (${ monitoredFile.role })` );
		console.log( `  review: ${ monitoredFile.review }` );
		reportSignalChanges( monitoredFile.signals, extractSignals( contents ) );
	}

	console.log( `\nSummary: ${ unchanged } unchanged, ${ changed } review prompt${ 1 === changed ? '' : 's' }.` );

	if ( changed > 0 || installedVersion !== baseline.friendsVersion ) {
		console.log( 'Review upstream changes before updating the baseline; no files were modified.' );
	}
}

try {
	main();
} catch ( error ) {
	console.error( `Friends drift check failed: ${ error.message }` );
	process.exitCode = 1;
}
