"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
    console.log("Searching for:", searchQuery);
  };
  return (
    <form onSubmit={handleSearch} className="relative flex-1 w-full group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
        className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200/60 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
      />
    </form>
  );
}
