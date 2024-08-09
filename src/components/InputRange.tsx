import React, { ForwardedRef, forwardRef, useState } from "react";

interface InputRangeProps {
  id: string;
  label?: string;
}
const InputRange = forwardRef<any, InputRangeProps>(
  (props: any, ref: ForwardedRef<any>) => {
    const [value, setValue] = useState(0);
    const { label, id } = props;

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
        <input
          ref={ref}
          id={id}
          type="range"
          onChange={(e: any) => setValue(e.target.value)}
          value={value}
          className="w-full h-2 bg-gray-200 rounded-lg accent-primary appearance-none cursor-pointer dark:bg-gray-700"
        />
      </>
    );
  }
);

InputRange.displayName = "InputRange";
export { InputRange };
