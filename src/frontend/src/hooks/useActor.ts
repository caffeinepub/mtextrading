import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { useEmailAuth } from "./useEmailAuth";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity: emailIdentity } = useEmailAuth();
  const queryClient = useQueryClient();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [
      ACTOR_QUERY_KEY,
      emailIdentity?.getPrincipal().toString() ?? "anon",
    ],
    queryFn: async () => {
      // Email identity takes priority — covers all normal user flows.
      // Internet Identity is only used by the Super Admin dashboard (/#/superadmin)
      // which has its own actor setup and does not use this hook.
      if (emailIdentity) {
        const actor = await createActorWithConfig({
          agentOptions: { identity: emailIdentity },
        });
        // Empty string grants the #user role via access control
        await actor._initializeAccessControlWithSecret("");
        return actor;
      }

      // No email identity — return anonymous actor
      return await createActorWithConfig();
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // Invalidate dependent queries when actor changes
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
      queryClient.refetchQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
