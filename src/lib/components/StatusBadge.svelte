<script lang="ts" module>
	import type { LinkStatus } from '$lib/validate';
</script>

<script lang="ts">
	let { status, custom = false }: { status: LinkStatus; custom?: boolean } = $props();

	const labels: Record<LinkStatus, string> = {
		active: 'active',
		expired: 'expired',
		deactivated: 'deactivated'
	};
</script>

<span class="flex items-center gap-1.5">
	<span
		class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
			{status === 'active'
			? 'bg-ok-500/15 text-ok-500'
			: status === 'expired'
				? 'bg-warn-500/15 text-warn-500'
				: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}"
	>
		{labels[status]}
	</span>
	{#if custom}
		<span
			class="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
			title="Custom alias"
		>
			custom
		</span>
	{/if}
</span>
