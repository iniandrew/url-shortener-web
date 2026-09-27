<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { auth } from '$lib/auth.svelte';
	import { theme } from '$lib/theme.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="border-b border-hairline bg-paper dark:border-hairline-dark dark:bg-coal">
		<div class="mx-auto flex h-12 w-full max-w-4xl items-center justify-between gap-3 px-4">
			<a
				href="/"
				class="flex items-baseline font-mono text-base font-semibold tracking-tight"
				aria-label="sho.rt home"
			>
				sho.rt<span class="ml-0.5 cursor-block" aria-hidden="true"></span>
			</a>

			<nav
				class="flex items-center gap-0.5 font-mono text-[11px] tracking-micro uppercase"
				aria-label="Main"
			>
				<a
					href="/"
					class="border border-transparent px-2 py-1 text-ink-soft hover:border-hairline hover:text-ink dark:text-ash dark:hover:border-hairline-dark dark:hover:text-paper"
				>
					Shorten
				</a>
				<a
					href="/links"
					class="border border-transparent px-2 py-1 text-ink-soft hover:border-hairline hover:text-ink dark:text-ash dark:hover:border-hairline-dark dark:hover:text-paper"
				>
					Links
				</a>

				<span class="mx-2 h-4 w-px bg-hairline dark:bg-hairline-dark" aria-hidden="true"></span>

				<button
					type="button"
					class="border border-transparent p-1.5 text-ink-soft hover:border-hairline hover:text-ink dark:text-ash dark:hover:border-hairline-dark dark:hover:text-paper"
					onclick={() => theme.toggle()}
					aria-label={theme.dark ? 'Switch to light theme' : 'Switch to dark theme'}
					title={theme.overridden
						? 'Theme (manually set — double-click to follow system)'
						: 'Theme'}
					ondblclick={() => theme.followSystem()}
				>
					{#if theme.dark}
						<svg aria-hidden="true" viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="currentColor">
							<path
								d="M8 1.5A6.5 6.5 0 0 1 11.6 13 5 5 0 0 0 8 3a5 5 0 0 0-3.6 10A6.5 6.5 0 0 1 8 1.5z"
							/>
						</svg>
					{:else}
						<svg aria-hidden="true" viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="currentColor">
							<path
								d="M8 4a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4 4 4 0 0 0-4-4zm0 1.5A2.5 2.5 0 1 1 8 10.5 2.5 2.5 0 0 1 8 5.5zM7.25 1h1.5v1.75h-1.5V1zm0 12.25h1.5V15h-1.5v-1.75zM1 7.25h1.75v1.5H1v-1.5zm12.25 0H15v1.5h-1.75v-1.5zM2.64 3.7l1.06-1.06 1.24 1.24-1.06 1.06L2.64 3.7zm8.42 8.42 1.06-1.06 1.24 1.24-1.06 1.06-1.24-1.24zM11.7 2.64l1.06 1.06-1.24 1.24-1.06-1.06 1.24-1.24zM3.7 11.06l1.06 1.06-1.24 1.24-1.06-1.06 1.24-1.24z"
							/>
						</svg>
					{/if}
				</button>

				<span class="mx-1 h-4 w-px bg-hairline dark:bg-hairline-dark" aria-hidden="true"></span>

				{#if auth.signedIn}
					<span class="tag-signal max-w-40 truncate" title="API key: {auth.keyName}">
						{auth.keyName || 'key'}
					</span>
					<button
						type="button"
						class="border border-transparent px-2 py-1 text-ink-soft hover:border-hairline hover:text-ink dark:text-ash dark:hover:border-hairline-dark dark:hover:text-paper"
						onclick={() => auth.signOut()}
					>
						Sign out
					</button>
				{:else}
					<a href="/signin" class="btn-primary px-2.5! py-1!">Sign in</a>
				{/if}
			</nav>
		</div>
	</header>

	<main class="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
		{@render children()}
	</main>

	<footer
		class="border-t border-hairline py-3 font-mono text-[10px] tracking-micro text-ink-faint uppercase dark:border-hairline-dark dark:text-ash-faint"
	>
		<div class="mx-auto w-full max-w-4xl px-4">sho.rt — static app · same origin as the api</div>
	</footer>
</div>
