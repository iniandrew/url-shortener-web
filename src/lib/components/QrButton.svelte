<script lang="ts">
	import QRCode from 'qrcode';
	import { tick } from 'svelte';

	let {
		value,
		caption = '',
		class: klass = ''
	}: { value: string; caption?: string; class?: string } = $props();

	let open = $state(false);
	let canvas = $state<HTMLCanvasElement | undefined>(undefined);

	$effect(() => {
		return () => document.removeEventListener('keydown', onKeydown);
	});

	async function show() {
		open = true;
		await tick();
		if (canvas) {
			await QRCode.toCanvas(canvas, value, {
				width: 220,
				margin: 2,
				color: { dark: '#18181b', light: '#ffffff' }
			});
		}
		document.addEventListener('keydown', onKeydown);
	}

	function hide() {
		open = false;
		document.removeEventListener('keydown', onKeydown);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') hide();
	}
</script>

<button type="button" class={klass || 'btn-ghost px-2! py-1!'} onclick={show}>
	<svg aria-hidden="true" viewBox="0 0 16 16" class="h-4 w-4" fill="currentColor">
		<path
			d="M1 1h4v4H1V1zm1 1v2h2V2H2zm8-1h4v4h-4V1zm1 1v2h2V2h-2zM1 9h4v4H1V9zm1 1v2h2v-2H2zm8-1h1v1h1v-1h1v1h-1v1h1v2h-1v1h-1v-1h-1v1H9v-1h1v-1h1v-1h-1v-1zm4 3h1v1h-1v-1zM9 13h1v1H9v-1zm4-4h1v1h-1V9zM6 1h1v1H6V1zm2 1h1v1H8V2zM6 3h1v1H6V3zm3 0h1v1H9V3zM6 5h1v1H6V5zm2 0h1v1H8V5zM1 6h1v1H1V6zm2 0h1v1H3V6zm1 1h1v1H4V7zM6 7h1v1H6V7zm2 0h1v1H8V7zm2 0h1v1h-1V7zm2 0h1v1h-1V7zm1 1h1v1h-1V8zM1 8h1v1H1V8zm3 2h1v1H4v-1zm1-3h1v1H5V7zm0 4h1v1H5v-1zM6 9h1v1H6V9zm2 0h1v1H8V9zm1 1h1v1H9v-1zM3 1h1v1H3V1zM6 13h1v1H6v-1z"
		/>
	</svg>
	<span class="sr-only">Show QR code for {value}</span>
	QR
</button>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
		role="presentation"
		onclick={(e) => e.target === e.currentTarget && hide()}
	>
		<div role="dialog" aria-modal="true" aria-label="QR code" class="card p-5 text-center">
			<canvas bind:this={canvas} class="rounded-lg"></canvas>
			<p class="mt-3 font-mono text-xs break-all text-zinc-500 dark:text-zinc-400">
				{caption || value}
			</p>
			<button type="button" class="btn-ghost mt-4 w-full" onclick={hide}>Close</button>
		</div>
	</div>
{/if}
