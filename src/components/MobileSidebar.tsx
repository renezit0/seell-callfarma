import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DashboardSidebar } from "./DashboardSidebar";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="lg:hidden btn-modern"
        >
          <i className="fas fa-bars text-base"></i>
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="left" 
        className="p-0 w-64"
      >
        <DashboardSidebar className="w-full h-full static" />
      </SheetContent>
    </Sheet>
  );
}