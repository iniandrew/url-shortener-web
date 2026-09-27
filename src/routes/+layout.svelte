<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { auth } from '$lib/auth.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header
		class="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90"
	>
		<div class="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
			<a href="/" class="font-mono text-lg font-bold tracking-tight" aria-label="sho.rt home">
				sho<span class="text-brand-600 dark:text-brand-400">.</span>rt
			</a>
			<nav class="flex items-center gap-1 text-sm font-medium" aria-label="Main">
				<a
					href="/"
					class="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
				>
					Shorten
				</a>
				<a
					href="/links"
					class="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
				>
					Links
				</a>
				<span class="mx-2 h-5 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden="true"></span>
				{#if auth.signedIn}
					<span
						class="hidden max-w-40 truncate rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-xs text-brand-700 sm:inline-block dark:bg-brand-950 dark:text-brand-300"
						title="API key: {auth.keyName}"
					>
						{auth.keyName || 'key #' + '?'}
					</span>
					<button
						type="button"
						class="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
						onclick={() => auth.signOut()}
					>
						Sign out
					</button>
				{:else}
					<a href="/signin" class="btn-primary px-3! py-1.5!">Sign in</a>
				{/if}
			</nav>
		</div>
	</header>

	<main class="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
		{@render children()}
	</main>

	<footer
		class="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
	>
		sho.rt · static app, same origin as the API
	</footer>
</div>
