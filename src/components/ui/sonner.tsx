import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      duration={3500}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "!bg-[#E8F5E9] !text-[#1B5E20] !border-[#A5D6A7]",
          error:
            "!bg-[#FFEBEE] !text-[#B71C1C] !border-[#EF9A9A]",
          warning:
            "!bg-[#FFF3E0] !text-[#E65100] !border-[#FFCC80]",
          info:
            "!bg-[#E3F2FD] !text-[#0D47A1] !border-[#90CAF9]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
