import { AppHeaderLogo } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import React from "react";

export default function ComponentsPage() {
  return (
    <div className="flex flex-col gap-10 pt-20">
      <AppHeaderLogo />
      <div className="flex flex-col gap-5">
        <div className="flex gap-2 items-center">
          <Button>black</Button>
          <Button size="small">black small</Button>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="secondary">secondary</Button>
          <Button variant="secondary" size="small">
            secondary small
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="gray">gray small</Button>
          <Button variant="gray" size="small">
            gray small
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary">primary</Button>
          <Button variant="primary" size="small">
            primary small
          </Button>
        </div>
      </div>
    </div>
  );
}
