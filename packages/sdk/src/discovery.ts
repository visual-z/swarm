import { MDNS_SERVICE_TYPE, DEFAULT_PORT } from '@swarmroom/shared';

/**
 * Discover a SwarmRoom hub via mDNS (_swarmroom._tcp).
 * Requires `@homebridge/ciao` as optional peer dependency — returns null if unavailable.
 */
export async function discoverHub(timeoutMs = 5000): Promise<string | null> {
  let ciao: any;
  try {
    ciao = await import('@homebridge/ciao');
  } catch {
    return null;
  }

  return new Promise<string | null>((resolve) => {
    let resolved = false;

    const done = (result: string | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve(result);
    };

    const responder = ciao.getResponder();

    const timer = setTimeout(() => {
      responder.shutdown();
      done(null);
    }, timeoutMs);

    try {
      const service = responder.createService({
        name: 'swarmroom-browser',
        type: MDNS_SERVICE_TYPE,
        port: DEFAULT_PORT,
      });

      service.on('name-change', () => {
        const port = service.port as number;
        service.destroy();
        responder.shutdown();
        done(`http://localhost:${port}`);
      });

      service.advertise().catch(() => {
        responder.shutdown();
        done(null);
      });
    } catch {
      responder.shutdown();
      done(null);
    }
  });
}
