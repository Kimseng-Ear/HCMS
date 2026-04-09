import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, FileText, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'employee' | 'project' | 'task' | 'document';
  url: string;
  description?: string;
  icon?: React.ComponentType<any>;
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search employees, projects, tasks...",
  className = "",
  onSearch
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('recent_searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Mock search results - replace with actual API call
      const mockSuggestions: SearchSuggestion[] = [
        {
          id: '1',
          title: 'Sokha Chan',
          type: 'employee' as const,
          url: '/employees/1',
          description: 'CTO • Engineering',
          icon: Users
        },
        {
          id: '2',
          title: 'Website Redesign',
          type: 'project' as const,
          url: '/projects/1',
          description: 'Revamp corporate website',
          icon: TrendingUp
        },
        {
          id: '3',
          title: 'Fix Login Bug',
          type: 'task' as const,
          url: '/tasks/1',
          description: 'Auth issue on mobile devices',
          icon: FileText
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    if (value.trim()) {
      handleSearch(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    // Add to recent searches
    const newRecentSearches = [suggestion.title, ...recentSearches.filter(s => s !== suggestion.title)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recent_searches', JSON.stringify(newRecentSearches));

    setQuery(suggestion.title);
    setIsOpen(false);
    navigate(suggestion.url);
    onSearch?.(suggestion.title);
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    handleSearch(search);
    onSearch?.(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && query.trim()) {
      handleSearch(query);
      onSearch?.(query);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-modal z-50 overflow-hidden animate-scale-in">
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </div>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Results
                  </div>
                  {suggestions.map((suggestion) => {
                    const Icon = suggestion.icon || FileText;
                    return (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                          <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {suggestion.title}
                          </div>
                          {suggestion.description && (
                            <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              {suggestion.description}
                            </div>
                          )}
                          <div className="text-xs text-slate-400 mt-1">
                            {suggestion.type}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : recentSearches.length > 0 && !query ? (
                <div className="py-2">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Recent
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearch(search)}
                      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {search}
                      </span>
                    </button>
                  ))}
                </div>
              ) : query ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  Start typing to search...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
