import { describe, expect, it } from "vitest";
import {
  broadcastOf,
  formatIPv4,
  maskToPrefix,
  networkOf,
  parseCidr,
  parseIPv4,
  parseMask,
  prefixForHosts,
  prefixToMask,
  usableHosts,
} from "./ipv4";

describe("ipv4", () => {
  it("parse et formate", () => {
    expect(formatIPv4(parseIPv4("192.168.10.42")!)).toBe("192.168.10.42");
    expect(parseIPv4("255.255.255.255")).toBe(0xffffffff);
    for (const bad of ["", "1.2.3", "1.2.3.4.5", "256.1.1.1", "01.2.3.4", "a.b.c.d", "1.2.3.-1"]) {
      expect(parseIPv4(bad)).toBeNull();
    }
  });

  it("masques", () => {
    expect(formatIPv4(prefixToMask(24))).toBe("255.255.255.0");
    expect(formatIPv4(prefixToMask(26))).toBe("255.255.255.192");
    expect(prefixToMask(0)).toBe(0);
    expect(maskToPrefix(parseIPv4("255.255.255.0")!)).toBe(24);
    expect(maskToPrefix(parseIPv4("255.255.0.255")!)).toBeNull();
    expect(parseMask("/24")).toBe(24);
    expect(parseMask("30")).toBe(30);
    expect(parseMask("255.255.255.252")).toBe(30);
    expect(parseMask("33")).toBeNull();
  });

  it("réseau, broadcast, hôtes", () => {
    const ip = parseIPv4("192.168.10.77")!;
    expect(formatIPv4(networkOf(ip, 26))).toBe("192.168.10.64");
    expect(formatIPv4(broadcastOf(ip, 26))).toBe("192.168.10.127");
    expect(usableHosts(24)).toBe(254);
    expect(usableHosts(30)).toBe(2);
    expect(usableHosts(31)).toBe(0);
    expect(prefixForHosts(50)).toBe(26);
    expect(prefixForHosts(62)).toBe(26);
    expect(prefixForHosts(63)).toBe(25);
    expect(prefixForHosts(2)).toBe(30);
    expect(prefixForHosts(0)).toBeNull();
  });

  it("cidr", () => {
    expect(parseCidr("10.0.0.0/8")).toEqual({ ip: parseIPv4("10.0.0.0"), prefix: 8 });
    expect(parseCidr("10.0.0.0")).toBeNull();
    expect(parseCidr("10.0.0.0/40")).toBeNull();
  });
});
