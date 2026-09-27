import { describe, expect, it } from 'vitest';
import { linkStatus, validateAlias, validateUrl } from '$lib/validate';

describe('validateUrl', () => {
	it('accepts plain http and https URLs', () => {
		expect(validateUrl('https://example.com/a?b=c')).toBe('');
		expect(validateUrl('http://localhost:8080/x')).toBe('');
	});

	it('rejects empty and non-URL input', () => {
		expect(validateUrl('')).not.toBe('');
		expect(validateUrl('not a url')).not.toBe('');
		expect(validateUrl('example.com/missing-scheme')).not.toBe('');
	});

	it('rejects non-http schemes', () => {
		expect(validateUrl('javascript:alert(1)')).not.toBe('');
		expect(validateUrl('data:text/plain,hi')).not.toBe('');
		expect(validateUrl('ftp://example.com/f')).not.toBe('');
	});

	it('rejects hostnames without a dot', () => {
		expect(validateUrl('https://intranet/')).not.toBe('');
	});

	it('rejects over-length URLs', () => {
		expect(validateUrl(`https://example.com/${'a'.repeat(2100)}`)).not.toBe('');
	});

	it('trims before validating', () => {
		expect(validateUrl('  https://example.com  ')).toBe('');
	});
});

describe('validateAlias', () => {
	it('empty alias means "not set" and is valid', () => {
		expect(validateAlias('')).toBe('');
	});

	it('accepts 4-32 chars of [a-zA-Z0-9_-]', () => {
		expect(validateAlias('promo-okt')).toBe('');
		expect(validateAlias('aB3_-zZ')).toBe('');
		expect(validateAlias('a'.repeat(32))).toBe('');
	});

	it('rejects too short, too long, and bad characters', () => {
		expect(validateAlias('abc')).not.toBe('');
		expect(validateAlias('a'.repeat(33))).not.toBe('');
		expect(validateAlias('has space')).not.toBe('');
		expect(validateAlias('has.dot')).not.toBe('');
	});
});

describe('linkStatus', () => {
	it('active when is_active and not expired', () => {
		expect(linkStatus({ is_active: true, expires_at: null })).toBe('active');
		expect(
			linkStatus({ is_active: true, expires_at: new Date(Date.now() + 1000).toISOString() })
		).toBe('active');
	});

	it('expired when the deadline has passed', () => {
		expect(
			linkStatus({ is_active: true, expires_at: new Date(Date.now() - 1000).toISOString() })
		).toBe('expired');
	});

	it('deactivated wins over expiry', () => {
		expect(linkStatus({ is_active: false, expires_at: null })).toBe('deactivated');
		expect(linkStatus({ is_active: false, expires_at: new Date().toISOString() })).toBe(
			'deactivated'
		);
	});
});
