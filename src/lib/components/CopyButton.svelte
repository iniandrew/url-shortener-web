<script lang="ts">
	import { tick } from 'svelte';

	let {
		value,
		label = 'Copy',
		class: klass = ''
	}: { value: string; label?: string; class?: string } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		return () => clearTimeout(timer);
	});

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			// Clipboard API can be unavailable (insecure context); fall back.
			await fallbackCopy(value);
		}
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 1500);
	}

	async function fallbackCopy(text: string) {
		const area = document.createElement('textarea');
		area.value = text;
		area.setAttribute('readonly', '');
		area.style.position = 'fixed';
		area.style.opacity = '0';
		document.body.appendChild(area);
		area.select();
		try {
			document.execCommand('copy');
		} finally {
			area.remove();
		}
		await tick();
	}
</script>

<button
	type="button"
	onclick={copy}
	class={klass}
	aria-label={copied ? 'Copied to clipboard' : `${label} to clipboard`}
>
	{#if copied}
		<svg
			aria-hidden="true"
			viewBox="0 0 16 16"
			class="h-4 w-4"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M3 8.5 6.5 12 13 4.5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
		Copied
	{:else}
		<svg
			aria-hidden="true"
			viewBox="0 0 16 16"
			class="h-4 w-4"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<rect x="5" y="5" width="8" height="8" rx="1.5" />
			<path d="M11 5V4a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 2 4v6A1.5 1.5 0 0 0 3.5 11.5H4" />
		</svg>
		{label}
	{/if}
</button>
