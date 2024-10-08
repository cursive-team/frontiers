"use client";

import { cn } from "@/lib/client/utils";
import { ReactNode, FormEvent } from "react";

type FormStepLayoutProps = {
  title?: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  onSubmit?: (event: FormEvent) => void;
  onChange?: (formValues: any) => void;
  className?: string;
  childrenClassName?: string;
  titleClassName?: string;
  actions?: ReactNode; // actions are the buttons at the bottom of the form
};

const FormStepLayout = ({
  title,
  description,
  children,
  footer,
  header,
  className = "",
  actions,
  onChange,
  subtitle,
  childrenClassName,
  titleClassName,
  ...props
}: FormStepLayoutProps) => {
  return (
    <form
      {...props}
      className={`flex flex-col w-full grow focus ${className}`}
      onChange={onChange}
    >
      <div className="flex flex-col gap-3 xs:gap-8">
        {(title || description) && (
          <div className={`flex flex-col gap-1 xs:mb-4 ${titleClassName}`}>
            <div className="flex flex-col gap-3">
              {description && (
                <span className="font-normal font-inter text-sm leading-5 text-white">
                  {description}
                </span>
              )}
              {title && (
                <>
                  {typeof title === "string" ? (
                    <h3 className="font-semibold text-white text-[21px] leading-6">
                      {title}
                    </h3>
                  ) : (
                    title
                  )}
                </>
              )}
              {subtitle && (
                <span className="font-normal text-sm leading-5 text-white">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        )}
        {header}
      </div>
      {(children || footer) && (
        <div
          className={cn(
            "flex flex-col gap-6 w-full h-full mb-4",
            childrenClassName
          )}
        >
          {children}
          <div className="mt-auto">{footer}</div>
        </div>
      )}
      {actions && (
        <div className="sticky bottom-0 right-0 left-0 mt-4">
          <div className="pb-6 pt-2">{actions}</div>
        </div>
      )}
    </form>
  );
};

FormStepLayout.displayName = "FormStepLayout";

export { FormStepLayout };
