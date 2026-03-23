import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground [&>svg]:text-foreground",
        destructive:
          "bg-red-50 dark:bg-red-950/20 " +
          "border-red-200 dark:border-red-800/50 border-l-[3px] border-l-red-500 " +
          "text-red-900 dark:text-red-100 " +
          "[&>svg]:text-red-500 dark:[&>svg]:text-red-400",
        warning:
          "bg-amber-50 dark:bg-amber-950/20 " +
          "border-amber-200 dark:border-amber-800/50 border-l-[3px] border-l-amber-500 " +
          "text-amber-900 dark:text-amber-100 " +
          "[&>svg]:text-amber-500 dark:[&>svg]:text-amber-400",
        success:
          "bg-emerald-50 dark:bg-emerald-950/20 " +
          "border-emerald-200 dark:border-emerald-800/50 border-l-[3px] border-l-emerald-500 " +
          "text-emerald-900 dark:text-emerald-100 " +
          "[&>svg]:text-emerald-500 dark:[&>svg]:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm opacity-85 [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
