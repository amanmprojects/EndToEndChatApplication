import React, { useState, useEffect, useRef } from 'react';
import useChatStore from '../../store/chatStore';
import { User } from '../../types/chat';
import { debounce } from 'lodash';
import Spinner from '../ui/Spinner';

interface UserSearchProps {
  onSelectUser: (user: User) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    searchUsers, 
    searchResults, 
    searchQuery, 
    isLoading, 
    clearSearchResults 
  } = useChatStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      searchUsers(query);
    }, 300)
  ).current;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (query) {
      debouncedSearch(query);
    } else {
      clearSearchResults();
    }
  };

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    setIsOpen(false);
    clearSearchResults();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search users..."
          className="bg-transparent border-none focus:ring-0 text-sm flex-grow ml-2"
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (searchResults.length > 0 || isLoading || searchQuery) && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="py-4 px-2 flex justify-center">
              <Spinner size="sm" />
            </div>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map((user) => (
                <li 
                  key={user._id}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.username} className="w-8 h-8 rounded-full" />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user.username}</p>
                    {user.email && <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : searchQuery ? (
            <div className="py-4 px-2 text-center text-sm text-gray-500 dark:text-gray-400">
              No users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default UserSearch;