import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      gap={8}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            "group toast !font-sans !rounded-xl !border !shadow-md !px-4 !py-3.5 !gap-3 " +
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border",
          error:
            "!bg-red-50 dark:!bg-red-950/25 !border-red-200 dark:!border-red-800/50 " +
            "!border-l-[3px] !border-l-red-500 !text-red-900 dark:!text-red-100 !shadow-red-100/50 dark:!shadow-red-950/30",
          success:
            "!bg-emerald-50 dark:!bg-emerald-950/25 !border-emerald-200 dark:!border-emerald-800/50 " +
            "!border-l-[3px] !border-l-emerald-500 !text-emerald-900 dark:!text-emerald-100",
          warning:
            "!bg-amber-50 dark:!bg-amber-950/25 !border-amber-200 dark:!border-amber-800/50 " +
            "!border-l-[3px] !border-l-amber-500 !text-amber-900 dark:!text-amber-100",
          info:
            "!bg-blue-50 dark:!bg-blue-950/25 !border-blue-200 dark:!border-blue-800/50 " +
            "!border-l-[3px] !border-l-blue-500 !text-blue-900 dark:!text-blue-100",
          title: "!text-sm !font-semibold !leading-snug",
          description: "!text-xs !opacity-80 !leading-relaxed !mt-0.5",
          actionButton: "!text-xs !font-semibold !px-3 !py-1.5 !rounded-lg group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "!text-xs !px-3 !py-1.5 !rounded-lg group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "!opacity-50 hover:!opacity-100 !transition-opacity !rounded-md " +
            "group-[.error]:!text-red-600 group-[.success]:!text-emerald-600",
          icon: "!mt-0.5 !shrink-0",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
