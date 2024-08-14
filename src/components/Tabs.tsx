import { Tab } from "@headlessui/react";
import { classed } from "@tw-classed/react";
import { AppContent } from "./AppContent";

interface TabProps {
  label: string;
  badge?: boolean;
  children: React.ReactNode;
}

export interface TabsProps {
  defaultIndex?: number;
  items: TabProps[];
}

const TabButton = classed.div(
  "font-medium text-sm font-inter pb-[14px] duration-200",
  {
    variants: {
      selected: {
        true: "text-white",
        false: "text-white/25",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

const TabBadge = classed.div(
  "absolute -top-0.5 -right-2 bg-[#D40018] rounded-full text-white w-[6px] h-[6px] text-[8px]"
);

const Tabs = ({ items, defaultIndex = 0 }: TabsProps) => {
  return (
    <Tab.Group defaultIndex={defaultIndex}>
      <Tab.List className="flex relative">
        <div className="flex gap-8 relative">
          {items.map(({ label, badge }, index) => {
            return (
              <Tab className="outline-none" key={index}>
                {({ selected }) => (
                  <div className="relative">
                    <TabButton selected={selected}>
                      <span className="relative">
                        {label}
                        {badge && <TabBadge />}
                      </span>
                    </TabButton>
                    {selected && (
                      <div className="absolute bg-white bottom-0 h-[1px] w-full z-[1]"></div>
                    )}
                  </div>
                )}
              </Tab>
            );
          })}
        </div>
        <div className="absolute bg-white/50 bottom-0 h-[1px] w-full z-0"></div>
      </Tab.List>
      <Tab.Panels>
        {items.map(({ children }, index) => {
          return <Tab.Panel key={index}>{children}</Tab.Panel>;
        })}
      </Tab.Panels>
    </Tab.Group>
  );
};

Tabs.displayName = "Tabs";

export { Tabs };
