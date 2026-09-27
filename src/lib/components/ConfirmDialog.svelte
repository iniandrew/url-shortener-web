<script lang="ts">
	let {
		title,
		message,
		confirmLabel = 'Confirm',
		busy = false,
		onconfirm,
		oncancel
	}: {
		title: string;
		message: string;
		confirmLabel?: string;
		busy?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();

	let dialog = $state<HTMLDivElement | undefined>(undefined);
	let confirmBtn = $state<HTMLButtonElement | undefined>(undefined);

	$effect(() => {
		confirmBtn?.focus();
	});

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') oncancel();
		if (event.key === 'Tab' && dialog) {
			// Two focusable elements; keep Tab cycling between them.
			const focusables = dialog.querySelectorAll<HTMLButtonElement>('button');
			if (focusables.length < 2) return;
			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
	role="presentation"
	onclick={(e) => e.target === e.currentTarget && oncancel()}
>
	<div
		bind:this={dialog}
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-title"
		class="w-full max-w-sm card p-5"
	>
		<h2 id="confirm-title" class="text-lg font-semibold">{title}</h2>
		<p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
		<div class="mt-5 flex justify-end gap-2">
			<button type="button" class="btn-ghost" disabled={busy} onclick={oncancel}>Cancel</button>
			<button
				bind:this={confirmBtn}
				type="button"
				class="btn bg-danger-500 text-white hover:opacity-90"
				disabled={busy}
				onclick={onconfirm}
			>
				{confirmLabel}
			</button>
		</div>
	</div>
</div>
