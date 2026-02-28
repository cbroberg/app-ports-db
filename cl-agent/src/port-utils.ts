import { execSync } from "child_process";

/**
 * Returns the set of TCP ports currently in LISTEN state on this machine.
 */
export function getSystemListeningPorts(): Set<number> {
  try {
    const output = execSync("lsof -i TCP -P -n 2>/dev/null", { encoding: "utf-8" });
    const ports = new Set<number>();
    for (const line of output.split("\n")) {
      if (!line.includes("LISTEN")) continue;
      const match = line.match(/:(\d+)\s+\(LISTEN\)/);
      if (match) ports.add(parseInt(match[1], 10));
    }
    return ports;
  } catch {
    return new Set();
  }
}

/**
 * Returns the first TCP port >= startPort not in usedPorts.
 */
export function findVacantPortSync(usedPorts: Set<number>, startPort = 3000): number {
  let p = startPort;
  while (usedPorts.has(p)) p++;
  return p;
}

/**
 * Finds next vacant port combining system listening ports + extra.
 */
export function findVacantPort(extra: Set<number> = new Set(), startPort = 3000): number {
  const system = getSystemListeningPorts();
  const used = new Set([...system, ...extra]);
  return findVacantPortSync(used, startPort);
}

/** Returns PIDs listening on a given port. */
export function getPidsOnPort(port: number): number[] {
  try {
    const out = execSync(`lsof -ti TCP:${port} -s TCP:LISTEN 2>/dev/null`, { encoding: "utf-8" });
    return out.trim().split("\n").filter(Boolean).map(Number).filter(n => !isNaN(n));
  } catch {
    return [];
  }
}

/** Returns the first TCP LISTEN port for a given PID (including direct children). */
export function getListeningPortForPid(pid: number): number | null {
  try {
    let pidList = String(pid);
    try {
      const children = execSync(`pgrep -P ${pid} 2>/dev/null`, { encoding: "utf-8" }).trim();
      if (children) pidList += "," + children.split("\n").filter(Boolean).join(",");
    } catch { /* no children */ }
    const out = execSync(`lsof -p ${pidList} -i TCP -P -n 2>/dev/null`, { encoding: "utf-8" });
    for (const line of out.split("\n")) {
      if (!line.includes("LISTEN")) continue;
      const match = line.match(/:(\d+)\s+\(LISTEN\)/);
      if (match) return parseInt(match[1], 10);
    }
    return null;
  } catch {
    return null;
  }
}
