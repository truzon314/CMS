import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const WIDTHS = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg" } as const;

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  width?: keyof typeof WIDTHS;
  children: ReactNode;
  footer?: ReactNode;
}

/** REUSABLE_COMPONENTS.md's `Drawer` — slide-over from the right. */
export function AppDrawer({ open, onClose, title, description, width = "md", children, footer }: AppDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className={cn(WIDTHS[width])}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">{children}</div>
        {footer ? <SheetFooter>{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  );
}
