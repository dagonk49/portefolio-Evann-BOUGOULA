/**
 * Utilitaires IPv4 purs (entiers non signés 32 bits).
 * Partagés par la mission du lab et la démonstration NetForge.
 */

export type IPv4 = number;

const OCTET = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

export function parseIPv4(input: string): IPv4 | null {
  const parts = input.trim().split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!OCTET.test(part)) return null;
    value = value * 256 + Number(part);
  }
  return value >>> 0;
}

export function formatIPv4(ip: IPv4): string {
  return [ip >>> 24, (ip >>> 16) & 255, (ip >>> 8) & 255, ip & 255].join(".");
}

export function prefixToMask(prefix: number): IPv4 {
  if (prefix <= 0) return 0;
  if (prefix >= 32) return 0xffffffff;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

export function maskToPrefix(mask: IPv4): number | null {
  // Un masque valide est une suite contiguë de 1 suivie de 0.
  const inverted = ~mask >>> 0;
  if ((inverted & (inverted + 1)) !== 0) return null;
  let prefix = 0;
  for (let bit = 31; bit >= 0; bit--) {
    if ((mask >>> bit) & 1) prefix++;
    else break;
  }
  return prefix;
}

/** Accepte « 24 », « /24 » ou « 255.255.255.0 ». */
export function parseMask(input: string): number | null {
  const value = input.trim();
  const cidr = /^\/?(\d{1,2})$/.exec(value);
  if (cidr) {
    const prefix = Number(cidr[1]);
    return prefix >= 0 && prefix <= 32 ? prefix : null;
  }
  const dotted = parseIPv4(value);
  if (dotted === null) return null;
  return maskToPrefix(dotted);
}

export function networkOf(ip: IPv4, prefix: number): IPv4 {
  return (ip & prefixToMask(prefix)) >>> 0;
}

export function broadcastOf(ip: IPv4, prefix: number): IPv4 {
  return (networkOf(ip, prefix) | (~prefixToMask(prefix) >>> 0)) >>> 0;
}

export function sameSubnet(a: IPv4, b: IPv4, prefix: number): boolean {
  return networkOf(a, prefix) === networkOf(b, prefix);
}

export function blockSize(prefix: number): number {
  return 2 ** (32 - prefix);
}

/** Nombre d'hôtes adressables (hors réseau et broadcast) pour /1 à /30. */
export function usableHosts(prefix: number): number {
  if (prefix >= 31) return 0;
  return blockSize(prefix) - 2;
}

/** Plus grand préfixe (plus petit bloc) capable d'accueillir `hosts` hôtes. */
export function prefixForHosts(hosts: number): number | null {
  if (!Number.isInteger(hosts) || hosts < 1) return null;
  for (let prefix = 30; prefix >= 1; prefix--) {
    if (usableHosts(prefix) >= hosts) return prefix;
  }
  return null;
}

/** Parse « 192.168.10.0/24 ». */
export function parseCidr(input: string): { ip: IPv4; prefix: number } | null {
  const match = /^\s*([\d.]+)\s*\/\s*(\d{1,2})\s*$/.exec(input);
  if (!match) return null;
  const ip = parseIPv4(match[1] ?? "");
  const prefix = Number(match[2]);
  if (ip === null || prefix < 0 || prefix > 32) return null;
  return { ip, prefix };
}

export function isApipa(ip: IPv4): boolean {
  return networkOf(ip, 16) === parseIPv4("169.254.0.0");
}

export function isLoopback(ip: IPv4): boolean {
  return ip >>> 24 === 127;
}

export function isMulticastOrReserved(ip: IPv4): boolean {
  return ip >>> 28 >= 14 || ip >>> 24 === 0;
}
