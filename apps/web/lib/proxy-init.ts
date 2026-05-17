import { setGlobalDispatcher, ProxyAgent } from 'undici';

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
if (proxy) {
  setGlobalDispatcher(new ProxyAgent(proxy));
  // eslint-disable-next-line no-console
  console.log(`[proxy-init] Global dispatcher set to ${proxy}`);
}
