# How to Open the Search Web Element in Your Angular Application

## Overview
This guide shows you how to integrate the `zb-search-autocomplete` web component into your Angular storefront with a **search icon → modal/overlay pattern**.

---

## 📋 **Step-by-Step Integration**

### **Step 1: Copy the Web Component File**

Copy the built web component to your Angular project:

```powershell
# From PowerShell
Copy-Item "e:\Centizen Projects\zenbasket\zenbasket\web-elemenets\zb-search-autocomplete\dist\zb-search-autocomplete.js" -Destination "e:\Centizen Projects\zenbasket\zenbasket\zb-app\apps\zb-storefront\src\assets\web-components\" -Force
```

**Note**: Create the `web-components` folder if it doesn't exist:
```powershell
New-Item -ItemType Directory -Path "e:\Centizen Projects\zenbasket\zenbasket\zb-app\apps\zb-storefront\src\assets\web-components" -Force
```

---

### **Step 2: Include the Script in Angular**

#### **Option A: Add to `angular.json` (Recommended)**

Open `zb-app/apps/zb-storefront/angular.json` and add the script:

```json
{
  "projects": {
    "zb-storefront": {
      "architect": {
        "build": {
          "options": {
            "scripts": [
              "src/assets/web-components/zb-search-autocomplete.js"
            ]
          }
        }
      }
    }
  }
}
```

#### **Option B: Add to `index.html`**

Open `zb-app/apps/zb-storefront/src/index.html` and add before `</body>`:

```html
<script type="module" src="assets/web-components/zb-search-autocomplete.js"></script>
```

---

### **Step 3: Enable Custom Elements Schema**

If using **Standalone Components** (Angular 14+), add to your header component:

```typescript
// header.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Add this line
})
export class HeaderComponent {
  // ... component code
}
```

If using **NgModule**, add to your module:

```typescript
// app.module.ts or header.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  // ... other config
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Add this line
})
export class AppModule { }
```

---

### **Step 4: Create Search Service**

Create a new service to handle search API calls:

**File**: `src/app/services/search.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SearchResults {
  suggestions?: string[];
  products?: Array<{
    name: string;
    image?: string;
    url?: string;
  }>;
  pages?: Array<{
    name: string;
    url?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = '/api/search'; // Update with your API endpoint

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(this.apiUrl, {
      params: { q: query }
    });
  }
}
```

---

### **Step 5: Update Header Component**

#### **Template (header.component.html)**

Add the search icon button and search modal:

```html
<header class="header">
  <div class="header-container">
    <!-- Your existing header content -->
    <div class="logo">
      <a routerLink="/">ZenBasket</a>
    </div>

    <!-- Navigation, etc. -->

    <!-- SEARCH ICON BUTTON -->
    <button 
      class="search-icon-btn" 
      (click)="openSearch()"
      aria-label="Open search"
      type="button"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- Cart, Account, etc. -->
  </div>
</header>

<!-- SEARCH MODAL OVERLAY -->
<div 
  class="search-overlay" 
  [class.active]="searchOpen" 
  (click)="closeSearch()"
  *ngIf="searchOpen"
>
  <div class="search-modal" (click)="$event.stopPropagation()">
    <zb-search-autocomplete
      #searchComponent
      placeholder="Search products, pages..."
      [attr.debounce-delay]="300"
      (search-input)="onSearchInput($event)"
      (search-submit)="onSearchSubmit($event)"
      (suggestion-click)="onSuggestionClick($event)"
      (search-close)="closeSearch()"
    ></zb-search-autocomplete>
  </div>
</div>
```

#### **Component (header.component.ts)**

```typescript
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService, SearchResults } from '../../services/search.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements AfterViewInit {
  @ViewChild('searchComponent') searchComponent!: ElementRef;
  
  searchOpen = false;

  constructor(
    private searchService: SearchService,
    private router: Router
  ) {}

  ngAfterViewInit() {
    // Component is ready
  }

  /**
   * Open the search modal
   */
  openSearch() {
    this.searchOpen = true;
    
    // Focus the search input after modal opens
    setTimeout(() => {
      const input = this.searchComponent?.nativeElement
        ?.shadowRoot
        ?.querySelector('input');
      input?.focus();
    }, 100);
  }

  /**
   * Close the search modal
   */
  closeSearch() {
    this.searchOpen = false;
  }

  /**
   * Handle search input - fetch results from API
   */
  onSearchInput(event: CustomEvent) {
    const query = event.detail.query;
    
    // Minimum query length
    if (query.length < 2) {
      this.setSearchResults({});
      return;
    }
    
    // Fetch search results from your API
    this.searchService.search(query).subscribe({
      next: (results) => {
        this.setSearchResults(results);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.setSearchResults({});
      }
    });
  }

  /**
   * Handle search submit - navigate to search results page
   */
  onSearchSubmit(event: CustomEvent) {
    const query = event.detail.query;
    this.closeSearch();
    
    // Navigate to search results page
    this.router.navigate(['/search'], { 
      queryParams: { q: query } 
    });
  }

  /**
   * Handle suggestion click
   */
  onSuggestionClick(event: CustomEvent) {
    const { suggestion, type } = event.detail;
    
    console.log('Suggestion clicked:', suggestion, 'Type:', type);
    
    // For text suggestions, navigate to search page
    if (type === 'suggestion') {
      this.closeSearch();
      this.router.navigate(['/search'], { 
        queryParams: { q: suggestion } 
      });
    }
    
    // For products and pages, the anchor tag handles navigation
    // Just close the modal
    if (type === 'product' || type === 'page') {
      this.closeSearch();
    }
  }

  /**
   * Set search results to the web component
   */
  private setSearchResults(results: SearchResults) {
    if (this.searchComponent?.nativeElement) {
      this.searchComponent.nativeElement.setResults(results);
    }
  }
}
```

#### **Styles (header.component.css)**

```css
/* Header styles */
.header {
  position: relative;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

/* Search Icon Button */
.search-icon-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.search-icon-btn:hover {
  color: #0066cc;
  background: #f5f5f5;
}

.search-icon-btn svg {
  width: 24px;
  height: 24px;
}

/* Search Overlay (Modal Background) */
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Search Modal Container */
.search-modal {
  width: 100%;
  max-width: 700px;
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideDown 0.3s ease;
  max-height: 80vh;
  overflow: visible;
}

@keyframes slideDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Web Component Styling */
zb-search-autocomplete {
  display: block;
  width: 100%;
  
  /* Customize colors via CSS custom properties */
  --primary-color: #0066cc;
  --border-color: #e0e0e0;
  --hover-bg: #f5f5f5;
  --text-primary: #333;
  --text-secondary: #666;
  --text-tertiary: #999;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .search-overlay {
    padding-top: 60px;
  }
  
  .search-modal {
    max-width: 90%;
    padding: 16px;
    margin: 0 20px;
  }
}

/* Tablet */
@media (max-width: 1024px) {
  .search-modal {
    max-width: 600px;
  }
}
```

---

### **Step 6: Create Backend API Endpoint**

Your backend should return search results in this format:

**API Endpoint**: `GET /api/search?q={query}`

**Response Format**:
```json
{
  "suggestions": [
    "search term 1",
    "search term 2",
    "search term 3"
  ],
  "products": [
    {
      "name": "Product Name",
      "image": "https://example.com/image.jpg",
      "url": "/products/product-slug"
    }
  ],
  "pages": [
    {
      "name": "Category Name",
      "url": "/category/category-slug"
    }
  ]
}
```

**Example Node.js/Express Implementation**:

```javascript
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query || query.length < 2) {
    return res.json({ suggestions: [], products: [], pages: [] });
  }
  
  try {
    // Search your database
    const [suggestions, products, pages] = await Promise.all([
      searchSuggestions(query),
      searchProducts(query),
      searchPages(query)
    ]);
    
    res.json({
      suggestions: suggestions.slice(0, 5),
      products: products.slice(0, 5).map(p => ({
        name: p.name,
        image: p.imageUrl,
        url: `/products/${p.slug}`
      })),
      pages: pages.slice(0, 3).map(p => ({
        name: p.name,
        url: `/category/${p.slug}`
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});
```

---

### **Step 7: Test the Integration**

1. **Start your Angular app**:
   ```bash
   cd zb-app/apps/zb-storefront
   ng serve
   ```

2. **Open in browser**: http://localhost:4200

3. **Click the search icon** in the header

4. **Verify**:
   - ✅ Modal overlay appears
   - ✅ Search input is focused
   - ✅ Typing shows dropdown
   - ✅ Suggestions appear
   - ✅ Products appear
   - ✅ Pages appear
   - ✅ Clicking suggestions works
   - ✅ Pressing Enter navigates
   - ✅ Close button works
   - ✅ Clicking overlay closes modal

---

## 🎨 **Customization Options**

### **Change Colors**

In `header.component.css`, customize the web component:

```css
zb-search-autocomplete {
  --primary-color: #your-brand-color;
  --border-color: #e0e0e0;
  --hover-bg: #f5f5f5;
}
```

### **Change Modal Position**

```css
.search-overlay {
  padding-top: 150px; /* Adjust vertical position */
}
```

### **Full-Screen on Mobile**

```css
@media (max-width: 768px) {
  .search-overlay {
    padding: 0;
  }
  
  .search-modal {
    max-width: 100%;
    height: 100vh;
    border-radius: 0;
    margin: 0;
  }
}
```

---

## 🐛 **Troubleshooting**

### **Issue: Web component not recognized**
**Solution**: Make sure you added `CUSTOM_ELEMENTS_SCHEMA` to your component/module

### **Issue: Events not firing**
**Solution**: Use `(event-name)` syntax, not `(eventName)`. Events are kebab-case.

### **Issue: Script not loading**
**Solution**: 
- Check the file path in `angular.json`
- Restart `ng serve` after changing `angular.json`
- Check browser console for errors

### **Issue: TypeScript errors**
**Solution**: Add type definitions:

```typescript
// In your component or a global .d.ts file
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'zb-search-autocomplete': any;
    }
  }
}
```

---

## 📝 **Summary**

You now have a complete search modal implementation:

1. ✅ Search icon in header
2. ✅ Click opens modal overlay
3. ✅ Web component handles autocomplete
4. ✅ Events trigger API calls
5. ✅ Results display in dropdown
6. ✅ Navigation on selection
7. ✅ Close on overlay click or close button

The search functionality is fully integrated and ready to use! 🎉
