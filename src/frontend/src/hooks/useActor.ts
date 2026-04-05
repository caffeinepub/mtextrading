import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useEmailAuth } from "./useEmailAuth";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const emailAuth = useEmailAuth();
  const { identity: iiIdentity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Use email identity for normal users; fall back to Internet Identity for super admin
  const emailIdentity = emailAuth.identity;
  const activeIdentity = emailIdentity ?? iiIdentity;
  const identityKey = activeIdentity?.getPrincipal().toString() ?? "anonymous";

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identityKey],
    queryFn: async () => {
      if (!activeIdentity) {
        // Return anonymous actor if not authenticated
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity: activeIdentity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);

      if (emailIdentity) {
        // Normal user: grant #user role via empty secret
        await actor._initializeAccessControlWithSecret("");
      } else {
        // Super admin / Internet Identity path: use caffeineAdminToken if present
        const adminToken = getSecretParameter("caffeineAdminToken") || "";
        await actor._initializeAccessControlWithSecret(adminToken);
      }

      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
