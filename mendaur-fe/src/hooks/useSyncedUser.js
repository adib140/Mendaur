import { useMemo } from "react";
import { getSyncedUserById } from "../utils/getSyncedUserById";

export function useSyncedUser(id_user) {
  return useMemo(() => getSyncedUserById(id_user), [id_user]);
}
