import { classed } from "@tw-classed/react";
import React, { ForwardedRef, forwardRef, useEffect, useState } from "react";

interface InputRangeProps {
  id: string;
  label?: string;
  min?: number;
  max?: number;
  moreMax?: boolean;
  onChange?: (value: number) => void;
  value?: number;
}

const RangeLabel = classed.span(
  "text-sm font-inter leading-none text-white/50"
);

const InputRange = forwardRef<HTMLInputElement, InputRangeProps>(
  (props, ref) => {
    const {
      label,
      id,
      min = 0,
      max = 100,
      moreMax = false,
      onChange,
      value: propValue,
      ...rest
    } = props;

    const defaultValue = (max + min) / 2;
    const [value, setValue] = useState(
      propValue !== undefined ? propValue : defaultValue
    );

    useEffect(() => {
      if (propValue !== undefined && propValue !== value) {
        setValue(propValue);
      }
    }, [propValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      setValue(newValue);
      onChange?.(newValue);
    };

    const percentage = ((value - min) / (max - min)) * 100;
    const showLabel = percentage > 10 && percentage < 90;

    return (
      <>
        {label && (
          <label
            htmlFor={id}
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={id}
            type="range"
            onChange={handleChange}
            value={value}
            className="w-full h-2 bg-gray-200 rounded-lg accent-primary appearance-none cursor-pointer dark:bg-gray-700"
            min={min}
            max={max}
            {...rest}
          />
          <RangeLabel className="absolute top-[28px] left-0">{min}</RangeLabel>
          <RangeLabel className="absolute top-[28px] right-0">
            {max}
            {moreMax && "+"}
          </RangeLabel>
          {showLabel && (
            <RangeLabel
              className="absolute top-[28px] transition-all duration-200"
              style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
            >
              {value}
            </RangeLabel>
          )}
        </div>
      </>
    );
  }
);

InputRange.displayName = "InputRange";
export { InputRange };
