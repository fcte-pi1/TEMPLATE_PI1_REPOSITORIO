import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { NavLinkProps } from "react-router-dom";

interface NavBarProps extends NavLinkProps {
  text: string;
  children: ReactNode;
}

export function NavLinkBar({ children, text , ...rest }: NavBarProps) {
  return (
    <NavLink
      {...rest}
      className={({ isActive }) =>
        `w-53.75  h-10.5   pl-2.5 border  rounded-md flex items-center gap-2  ${
          isActive
            ? "bg-[#00B8DB]/10  border border-[#00B8DB]/20 text-[#00B8DB]"
            : "text-[#ffff]/70  hover:text-white transition hover:bg-white/20 border-transparent "
        }`
      }
    >
      {children}
      <span>{text}</span>
    </NavLink>
  );
}