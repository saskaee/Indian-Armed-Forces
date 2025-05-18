import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Shield, User, BarChart, LogOut, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location]);
  
  // Fetch user avatar
  useEffect(() => {
    const fetchAvatar = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .storage
            .from('avatars')
            .download(`${user.id}.png`);
            
          if (data && !error) {
            const url = URL.createObjectURL(data);
            setAvatarUrl(url);
          }
        } catch (error) {
          console.log('Error downloading avatar:', error);
        }
      }
    };
    
    fetchAvatar();
    
    return () => {
      // Cleanup object URL when component unmounts
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [user]);
  
  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navbarBg = isScrolled ? "bg-army-green shadow-md" : "bg-transparent";
  const textColor = isScrolled ? "text-white" : "text-[#4b5320]";

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Army Categories", path: "/categories" },
    { name: "Learning Resources", path: "/resources" },
    { name: "Mock Test", path: "/mock-test" },
    { name: "Mock Interview", path: "/mock-interview" },
    { name: "Contact Us", path: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBg}`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center space-x-2">
            <Shield className="h-7 w-7 text-[#dbc12d]" />
            <span className="font-display font-bold text-xl sm:text-2xl text-[#dbc12d]">
              INDIAN ARMED FORCES
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${textColor} font-medium hover:text-[#dbc12d] transition-colors ${
                    isActive ? "text-[#dbc12d]" : ""
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {/* Avatar with fallback to initials */}
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profile" 
                      className="h-10 w-10 rounded-full object-cover border-2 border-[#dbc12d]"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#dbc12d] flex items-center justify-center text-army-green font-bold">
                      {user.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                  <ChevronDown className={`h-4 w-4 text-[#dbc12d] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <NavLink
                      to="/dashboard"
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <BarChart className="h-4 w-4 mr-2" />
                      Dashboard
                    </NavLink>
                    <NavLink
                      to="/profile/edit"
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </NavLink>
                    <hr className="my-1" />
                    <button
                      onClick={async () => {
                        await signOut();
                        navigate('/login');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className="bg-[#dbc12d] text-army-green px-4 py-2 rounded-md hover:bg-accent-dark transition-colors"
              >
                Login / Register
              </NavLink>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-4 pb-4"
          >
            <div className="flex flex-col space-y-4 items-start">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `text-white font-medium hover:text-[#dbc12d] transition-colors text-lg ${
                      isActive ? "text-[#dbc12d]" : ""
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              {user ? (
                <div className="flex flex-col space-y-3 items-start pt-4 border-t border-gray-700 w-full">
                  <div className="flex items-center space-x-3 mb-2">
                    {/* Avatar with fallback to initials */}
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        className="h-12 w-12 rounded-full object-cover border-2 border-[#dbc12d]"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[#dbc12d] flex items-center justify-center text-army-green font-bold text-xl">
                        {user.email ? user.email.substring(0, 1).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="text-white">
                      <p className="font-medium">{user.email?.split('@')[0]}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  
                  <NavLink
                    to="/dashboard"
                    className="text-white font-medium hover:text-[#dbc12d] transition-colors text-lg flex items-center w-full"
                  >
                    <BarChart className="h-5 w-5 mr-2" />
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/profile/edit"
                    className="text-white font-medium hover:text-[#dbc12d] transition-colors text-lg flex items-center w-full"
                  >
                    <User className="h-5 w-5 mr-2" />
                    My Profile
                  </NavLink>
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate('/login');
                      setIsMenuOpen(false);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors text-lg flex items-center w-full"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="bg-[#dbc12d] text-army-green px-4 py-2 rounded-md hover:bg-accent-dark transition-colors mt-2"
                >
                  Login / Register
                </NavLink>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
