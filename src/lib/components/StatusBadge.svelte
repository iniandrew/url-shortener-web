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

	const dot = {
		active: 'bg-ok',
		expired: 'bg-warn',
		deactivated: 'bg-ink-faint dark:bg-ash-faint'
	} as const;
</script>

<span class="flex flex-wrap items-center gap-1.5">
	<span class={status === 'active' ? 'tag-ok' : status === 'expired' ? 'tag-warn' : 'tag-muted'}>
		<span class="inline-block h-1.5 w-1.5 {dot[status]}" aria-hidden="true"></span>
		{labels[status]}
	</span>
	{#if custom}
		<span class="tag-signal" title="Custom alias">custom</span>
	{/if}
</span>
