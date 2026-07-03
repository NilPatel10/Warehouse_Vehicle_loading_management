'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProductSelect({ products, value, onChange, disabled = false, excludeIds = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === value)
  }, [products, value])

  // Sync display value when selected product changes
  useEffect(() => {
    setSearchVal(selectedProduct ? selectedProduct.display_name : '')
  }, [selectedProduct])

  // Filter products based on search query
  const filtered = useMemo(() => {
    const query = searchVal.toLowerCase().trim()
    const selectedName = selectedProduct ? selectedProduct.display_name.toLowerCase().trim() : ''
    
    // If query is empty OR exactly matches current selection, show all products
    const showAll = !query || query === selectedName
    
    return products.filter((product) => {
      // Exclude products selected in other lines
      if (excludeIds.includes(product.id)) {
        return false
      }
      
      if (showAll) {
        return true
      }
      
      const brand = (product.brand_name || '').toLowerCase()
      const category = (product.bottle_categories?.category_name || '').toLowerCase()
      const displayName = (product.display_name || '').toLowerCase()
      
      return (
        brand.includes(query) ||
        category.includes(query) ||
        displayName.includes(query)
      )
    })
  }, [products, searchVal, selectedProduct, excludeIds])

  // Click outside detection
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchVal(selectedProduct ? selectedProduct.display_name : '')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedProduct])

  // Scroll active item into view when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[focusedIndex]
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedIndex])

  const selectProduct = (product) => {
    onChange(product.id)
    setSearchVal(product.display_name)
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  const handleFocus = (event) => {
    if (disabled) return
    setIsOpen(true)
    event.target.select() // Select all text on focus so user can type immediately
  }

  const handleKeyDown = (event) => {
    if (disabled) return

    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
        setIsOpen(true)
        event.preventDefault()
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        event.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < filtered.length) {
          selectProduct(filtered[focusedIndex])
        }
        break
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setSearchVal(selectedProduct ? selectedProduct.display_name : '')
        break
      case 'Tab':
        setIsOpen(false)
        setSearchVal(selectedProduct ? selectedProduct.display_name : '')
        break
      default:
        break
    }
  }

  const handleChevronClick = (event) => {
    event.preventDefault()
    if (disabled) return
    
    if (isOpen) {
      setIsOpen(false)
      setSearchVal(selectedProduct ? selectedProduct.display_name : '')
    } else {
      setIsOpen(true)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Combobox Input Row */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchVal}
          onChange={(e) => {
            setSearchVal(e.target.value)
            setIsOpen(true)
            setFocusedIndex(0)
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Search and select product..."
          suppressHydrationWarning
          className="h-11 w-full rounded-md border border-input bg-background pl-3 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleChevronClick}
          disabled={disabled}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground disabled:pointer-events-none"
        >
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </div>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name="product_id"
        value={value || ''}
      />

      {/* Dropdown Options List */}
      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md focus:outline-none"
        >
          {filtered.length > 0 ? (
            filtered.map((product, index) => {
              const isSelected = product.id === value
              const isFocused = index === focusedIndex
              
              return (
                <li
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'relative flex min-h-10 w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors',
                    isSelected && 'bg-primary text-primary-foreground font-semibold',
                    isFocused && !isSelected && 'bg-accent text-accent-foreground',
                    !isSelected && !isFocused && 'hover:bg-accent/40 text-foreground'
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {isSelected && <Check className="h-4 w-4" />}
                  </span>
                  {product.display_name}
                </li>
              )
            })
          ) : (
            <li className="py-3 px-4 text-sm text-muted-foreground italic text-center">
              No products found
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
