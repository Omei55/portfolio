import React, { useState } from "react";

export default function SearchstoryUI() {
  const [query, setQuery] = useState("");

  // Search Icon SVG
  const SearchIcon = () => (
    <svg className="text-gray-400 w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  return (
    <div className="flex h-[80vh] bg-[#1E1E1E] text-gray-200 rounded-lg shadow-md">
      {/* Sidebar */}
      <aside className="w-64 bg-[#151515] border-r border-gray-700 p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Workspace</h2>
        <nav className="flex-1 space-y-3 text-sm">
          <div>
            <p className="uppercase text-gray-400 text-xs mb-1">Your Teams</p>
            <ul className="space-y-2">
              <li className="hover:text-white cursor-pointer">ABC</li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Search Bar */}
        <div className="flex items-center bg-[#2A2A2A] px-4 py-2 rounded-lg border border-gray-700">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by describing your issue..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent flex-1 outline-none text-gray-200 placeholder-gray-500 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mt-6 text-sm">
          <button className="px-3 py-1 bg-[#333] rounded-md text-white">All</button>
          <button className="px-3 py-1 hover:bg-[#333] rounded-md text-gray-300">Issues</button>
          <button className="px-3 py-1 hover:bg-[#333] rounded-md text-gray-300">Projects</button>
        </div>

        {/* Empty Results */}
        <div className="flex justify-center items-center h-[50vh]">
          <p className="text-gray-500">No results to display</p>
        </div>
      </main>
    </div>
  );
}
