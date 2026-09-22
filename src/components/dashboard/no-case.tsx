import Link from "next/link";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NoCaseYet({ context }: { context?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary-subtle">
          <FolderPlus className="size-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-semibold">You have not started a case yet</p>
          <p className="mt-1 max-w-md text-muted-foreground">
            {context ??
              "Tell us what treatment you need and share any reports you have. A case manager will review it and come back with matched hospitals."}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/intake">Start my case</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
