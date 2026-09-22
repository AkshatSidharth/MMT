import { Download, FileText } from "lucide-react";
import { deleteOwnDocumentAction } from "@/app/actions/cases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { DOCUMENT_TYPE_LABELS, type CaseDocument } from "@/lib/types";
import { formatBytes } from "@/lib/upload-limits";
import { formatDate } from "@/lib/utils";

/**
 * Renders private documents with freshly minted, short-lived URLs. Callers must
 * have already established that the viewer may see these rows.
 */
export async function DocumentList({
  documents,
  allowDelete = false,
  emptyMessage = "Nothing here yet.",
}: {
  documents: CaseDocument[];
  allowDelete?: boolean;
  emptyMessage?: string;
}) {
  if (documents.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const withUrls = await Promise.all(
    documents.map(async (document) => ({
      document,
      url: await db.getFileUrl(document.file_url),
    })),
  );

  return (
    <ul className="divide-y">
      {withUrls.map(({ document, url }) => (
        <li key={document.id} className="flex flex-wrap items-center gap-3 py-3">
          <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{document.title}</p>
            <p className="text-sm text-muted-foreground">
              {DOCUMENT_TYPE_LABELS[document.type]} · {formatBytes(document.file_size)} ·{" "}
              {document.uploaded_by_role === "admin" ? "Added by your case manager" : "Added by you"}{" "}
              · {formatDate(document.created_at)}
            </p>
          </div>
          {document.uploaded_by_role === "admin" && <Badge variant="secondary">From us</Badge>}
          {url && (
            <Button asChild variant="outline" size="sm">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" />
                Open
              </a>
            </Button>
          )}
          {allowDelete && document.uploaded_by_role === "patient" && (
            <form action={deleteOwnDocumentAction}>
              <input type="hidden" name="document_id" value={document.id} />
              <Button type="submit" variant="ghost" size="sm">
                Remove
              </Button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
