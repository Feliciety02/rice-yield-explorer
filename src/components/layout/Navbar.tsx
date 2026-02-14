 import { Link, useLocation } from "react-router-dom";
 import { Leaf, Menu, X } from "lucide-react";
 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/simulator", label: "Simulator" },
  { href: "/model", label: "Model" },
  { href: "/about", label: "About" },
];
 
 export function Navbar() {
   const location = useLocation();
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 
   return (
     <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
       <div className="container mx-auto px-4">
         <div className="flex items-center justify-between h-16">
           {/* Logo */}
           <Link to="/" className="flex items-center gap-2 text-primary">
             <Leaf className="w-6 h-6" />
             <span className="font-serif font-bold text-lg hidden sm:inline">
               Rice Yield Simulator
             </span>
           </Link>
 
           {/* Desktop Navigation */}
           <div className="hidden md:flex items-center gap-1">
             {navLinks.map((link) => (
               <Link
                 key={link.href}
                 to={link.href}
                 className={cn(
                   "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                   location.pathname === link.href
                     ? "bg-primary text-primary-foreground"
                     : "text-muted-foreground hover:text-foreground hover:bg-muted"
                 )}
               >
                 {link.label}
               </Link>
             ))}
           </div>
 
           {/* Mobile Menu Button */}
           <Button
             variant="ghost"
             size="icon"
             className="md:hidden"
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             aria-label="Toggle menu"
           >
             {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
           </Button>
         </div>
 
         {/* Mobile Navigation */}
         {mobileMenuOpen && (
           <div className="md:hidden py-4 border-t border-border">
             <div className="flex flex-col gap-2">
               {navLinks.map((link) => (
                 <Link
                   key={link.href}
                   to={link.href}
                   onClick={() => setMobileMenuOpen(false)}
                   className={cn(
                     "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                     location.pathname === link.href
                       ? "bg-primary text-primary-foreground"
                       : "text-muted-foreground hover:text-foreground hover:bg-muted"
                   )}
                 >
                   {link.label}
                 </Link>
               ))}
             </div>
           </div>
         )}
       </div>
     </nav>
   );
 }
 
 export default Navbar;
