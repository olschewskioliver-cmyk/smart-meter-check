import { initials } from "@/lib/format";

interface TopBarProps {
  name: string;
  role: string;
}

export function TopBar({ name, role }: TopBarProps) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-office bg-office px-5">
      <div className="text-sm font-medium text-office-muted">
        Innendienst-Dashboard
      </div>
      <div className="flex items-center gap-2.5">
        <div className="text-right text-xs">
          <div className="font-semibold text-office-fg">{name}</div>
          <div className="text-office-muted">· {role}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-office-accent text-xs font-bold text-white">
          {initials(name)}
        </div>
      </div>
    </div>
  );
}
