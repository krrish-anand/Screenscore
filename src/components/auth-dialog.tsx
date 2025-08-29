
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";

interface AuthDialogProps {
    children: React.ReactNode;
    onLoginClick: () => void;
}

export function AuthDialog({ children, onLoginClick }: AuthDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to perform this action. Please log in or create an account to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
            <Button onClick={onLoginClick}>Login / Sign Up</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
