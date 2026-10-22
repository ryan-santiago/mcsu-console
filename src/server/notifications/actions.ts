"use server";

import { z } from "zod";
import { authedAction } from "@/lib/authz/action";

/**
 * Read state is per-user UI state, not a business record, so these actions don't write audit
 * entries. They need no permission (empty list): only the recipient's own rows are touched.
 */

export const markNotificationsRead = authedAction(
  {
    permission: [],
    schema: z.object({ ids: z.array(z.string().min(1)).max(200).optional() }),
    revalidate: () => ["/inbox"],
  },
  async ({ user, input, tx }) => {
    const result = await tx.notification.updateMany({
      where: {
        recipientId: user.id,
        readAt: null,
        ...(input.ids ? { id: { in: input.ids } } : {}),
      },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  },
);
