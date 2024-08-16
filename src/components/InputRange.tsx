import { classed } from "@tw-classed/react";
import React, { ForwardedRef, forwardRef, useEffect, useState } from "react";

interface InputRangeProps {
  id: string;
  label?: string;
  min?: number;
  max?: number;
  withMiddleValue?: boolean;
  moreMax?: boolean;
  onChange?: (e: any) => void;
  value?: string;
}

const RangeLabel = classed.span(
  "text-sm font-inter leading-none text-white/50"
);

const InputRange = forwardRef<any, InputRangeProps>(
  (props: any, ref: ForwardedRef<any>) => {
    const [value, setValue] = useState(0);
    const {
      label,
      id,
      min,
      max,
      withMiddleValue = true,
      moreMax = false,
      onChange,
    } = props;

    useEffect(() => {
      onChange?.(value);
    }, [value]);

    return (
      <>
        {label && (
          <label
            htmlFor={id}
            className="block mb-2 text-sm font-medium bg-red-50 text-gray-900 dark:text-white"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={id}
            type="range"
            onChange={(e: any) => {
              setValue(e.target.value);
            }}
            value={value}
            className="w-full h-2 bg-gray-200 rounded-lg accent-primary appearance-none cursor-pointer dark:bg-gray-700"
            min={min}
            max={max}
            {...props}
          />
          <RangeLabel className="absolute top-[28px] left-0">{min}</RangeLabel>
          {withMiddleValue && min != undefined && max != undefined && (
            <RangeLabel className="absolute translate-x-1/2 top-[28px] -ml-2 left-0 w-full">
              {(max + min) / 2}
            </RangeLabel>
          )}
          <RangeLabel className="absolute top-[28px] right-0">
            {max}
            {moreMax && "+"}
          </RangeLabel>
        </div>
      </>
    );
  }
);

InputRange.displayName = "InputRange";
export { InputRange };
