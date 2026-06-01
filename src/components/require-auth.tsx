import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import collapsedLogoUrl from "@/assets/svg/collpasedlogo.svg";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (hydrated && !user) {
      navigate({
        to: "/login",
        search: { redirect: pathname },
        replace: true,
      });
    }
  }, [hydrated, user, navigate, pathname]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/50">
        <div className="relative flex flex-col items-center">
          {/* Outer elegant spinning gradient ring */}
          <div className="relative flex items-center justify-center w-28 h-28">
            {/* Spinning decorative ring with theme color */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div 
              className="absolute inset-0 rounded-full border-4 border-t-[#dd5437] border-r-transparent border-b-transparent border-l-transparent animate-spin"
              style={{ animationDuration: '0.8s' }}
            ></div>
            
            {/* Inner secondary glowing/pulsing ring */}
            <div className="absolute inset-2 rounded-full border border-[#dd5437]/10 bg-white shadow-xl flex items-center justify-center overflow-hidden">
              {/* Logo with soft pulse animation */}
              <img 
                src={collapsedLogoUrl} 
                alt="HubKonnect Loading..." 
                className="h-12 w-auto object-contain animate-pulse select-none"
              />
            </div>
          </div>
          
          {/* Elegant subtitle to guide the user */}
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <span className="text-sm font-extrabold tracking-wider text-slate-800 uppercase select-none">
              HubKonnect
            </span>
            <span className="text-[11px] font-semibold text-slate-400 select-none flex items-center gap-1.5">
              <span>Loading workspace</span>
              <span className="inline-flex gap-0.5">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
