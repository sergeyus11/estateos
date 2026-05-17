// Returns an https-proxy-agent for the OpenAI SDK when HTTPS_PROXY is set.
// OpenAI SDK v4 uses node-fetch internally, which honors `httpAgent` but does NOT
// pick up the global undici dispatcher (that one only affects native fetch).
// Required for RU geo-blocked services (OpenAI, OpenRouter) on Russian servers
// where we route through a local xray proxy on host:10809.

import type { Agent } from 'node:http';

let _agent: Agent | undefined;
let _resolved = false;

export function getProxyAgent(): Agent | undefined {
  if (_resolved) return _agent;
  _resolved = true;
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (!proxy) return undefined;
  // Lazy require to avoid pulling https-proxy-agent into bundles where unused.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { HttpsProxyAgent } = require('https-proxy-agent');
  _agent = new HttpsProxyAgent(proxy) as unknown as Agent;
  return _agent;
}
