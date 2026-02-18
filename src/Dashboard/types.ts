export interface Domain {
	domain: string;
	count: number;
	type?: 'allowed' | 'blocked';
}

export interface Client {
	name: string | null;
	ip: string;
	count: number;
}

export interface Stats {
	queries: {
		total: number;
		blocked: number;
		percent_blocked: number;
		unique_domains: number;
		forwarded: number;
		cached: number;
		frequency: number;
		types: {
			A: number;
			AAAA: number;
			ANY: number;
			SRV: number;
			SOA: number;
			PTR: number;
			TXT: number;
			NAPTR: number;
			MX: number;
			DS: number;
			RRSIG: number;
			DNSKEY: number;
			NS: number;
			SVCB: number;
			HTTPS: number;
			OTHER: number;
		};
		status: {
			UNKNOWN: number;
			GRAVITY: number;
			FORWARDED: number;
			CACHE: number;
			REGEX: number;
			DENYLIST: number;
			EXTERNAL_BLOCKED_IP: number;
			EXTERNAL_BLOCKED_NULL: number;
			EXTERNAL_BLOCKED_NXRA: number;
			GRAVITY_CNAME: number;
			REGEX_CNAME: number;
			DENYLIST_CNAME: number;
			RETRIED: number;
			RETRIED_DNSSEC: number;
			IN_PROGRESS: number;
			DBBUSY: number;
			SPECIAL_DOMAIN: number;
			CACHE_STALE: number;
			EXTERNAL_BLOCKED_EDE15: number;
		};
		replies: {
			UNKNOWN: number;
			NODATA: number;
			NXDOMAIN: number;
			CNAME: number;
			IP: number;
			DOMAIN: number;
			RRNAME: number;
			SERVFAIL: number;
			REFUSED: number;
			NOTIMP: number;
			OTHER: number;
			DNSSEC: number;
			NONE: number;
			BLOB: number;
		};
	};
	clients: {
		active: number;
		total: number;
	};
	gravity: {
		domains_being_blocked: number;
		last_update: number;
	};
	took: number;
}

export interface Blocking {
	blocking: 'enabled' | 'disabled';
	timer: null | number;
	took: number;
}
