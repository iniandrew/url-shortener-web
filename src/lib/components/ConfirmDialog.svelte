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
	let cancelBtn = $state<HTMLButtonElement | undefined>(undefined);

	$effect(() => {
		cancelBtn?.focus();
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
	class="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 dark:bg-coal/70"
	role="presentation"
	onclick={(e) => e.target === e.currentTarget && oncancel()}
>
	<div
		bind:this={dialog}
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-title"
		class="w-full max-w-sm panel"
	>
		<div class="border-b border-hairline px-4 py-2 dark:border-hairline-dark">
			<h2 id="confirm-title" class="font-mono text-xs tracking-micro uppercase">{title}</h2>
		</div>
		<p class="px-4 py-4 font-mono text-xs leading-relaxed text-ink-soft dark:text-ash">
			{message}
		</p>
		<div
			class="flex justify-end gap-2 border-t border-hairline px-4 py-3 dark:border-hairline-dark"
		>
			<button
				bind:this={cancelBtn}
				type="button"
				class="btn-ghost px-3! py-1.5!"
				disabled={busy}
				onclick={oncancel}
			>
				Cancel
			</button>
			<button type="button" class="btn-danger px-3! py-1.5!" disabled={busy} onclick={onconfirm}>
				{confirmLabel}
			</button>
		</div>
	</div>
</div>
