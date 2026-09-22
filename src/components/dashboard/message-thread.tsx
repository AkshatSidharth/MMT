import { cn, initials, relativeTime } from "@/lib/utils";
import type { Message, Role } from "@/lib/types";

/** Shared 1:1 thread view. `viewerRole` decides which side is "mine". */
export function MessageThread({
  messages,
  viewerRole,
  emptyMessage,
}: {
  messages: Message[];
  viewerRole: Role;
  emptyMessage: string;
}) {
  if (messages.length === 0) {
    return <p className="py-10 text-center text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="space-y-4">
      {messages.map((message) => {
        const mine = message.sender_role === viewerRole;
        return (
          <li key={message.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
              )}
            >
              {initials(message.sender_name || "?")}
            </span>
            <div className={cn("max-w-[85%] sm:max-w-[75%]", mine && "text-end")}>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{message.sender_name}</span>
                {message.sender_role === "admin" && " · Case manager"} ·{" "}
                {relativeTime(message.created_at)}
              </p>
              <div
                className={cn(
                  "mt-1 inline-block whitespace-pre-wrap rounded-lg px-4 py-3 text-start text-[0.9375rem] leading-relaxed",
                  mine ? "bg-primary text-primary-foreground" : "bg-secondary",
                )}
              >
                {message.body}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
