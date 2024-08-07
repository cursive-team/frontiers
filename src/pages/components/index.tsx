import { AppHeaderLogo } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import React from "react";

export default function ComponentsPage() {
  return (
    <div className="flex flex-col gap-10">
      <AppHeaderLogo />
      <div className="flex flex-col gap-2">
        <Button>primary</Button>
        <Button size="small">primary small</Button>
        <Button variant="secondary">primary small</Button>
        <Button variant="secondary" size="small">
          primary small
        </Button>
        <Button variant="gray">primary small</Button>
        <Button variant="gray" size="small">
          primary small
        </Button>
        <Button variant="black">primary small</Button>
        <Button variant="black" size="small">
          primary small
        </Button>
      </div>
    </div>
  );
}
