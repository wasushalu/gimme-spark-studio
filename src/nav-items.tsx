
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

export const navItems = [
  {
    to: "/",
    page: <Index />,
  },
  {
    to: "*",
    page: <NotFound />,
  },
];
