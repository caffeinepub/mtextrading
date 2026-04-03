import type { Identity } from "@dfinity/agent";
import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import { loadConfig } from "../config";
import { idlFactory } from "../declarations/backend.did";
import type { _SERVICE } from "../declarations/backend.did.d";

export async function createRawActor(identity?: Identity): Promise<_SERVICE> {
  const config = await loadConfig();
  const agent = new HttpAgent({
    host: config.backend_host,
    ...(identity ? { identity } : {}),
  });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {});
  }
  return Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: config.backend_canister_id,
  });
}
