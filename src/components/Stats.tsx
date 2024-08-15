interface StatsProps {
  title: string;
  items?: { label: string; value?: string }[];
}
export const Stats = ({ title, items = [] }: StatsProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm font-normal text-primary">{title}</div>
      <div className="h-[1px] bg-white/20 w-full"></div>
      {items?.length > 0 && (
        <div className="flex gap-2">
          {items?.map(({ label, value }, index) => {
            return (
              <span
                key={index}
                className="text-sm font-inter font-medium text-white/50 [&>strong]:text-white"
              >
                {`${label}:`} <strong>{value}</strong>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
