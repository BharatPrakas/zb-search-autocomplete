# Angular Integration Guide for ZB-Search-Autocomplete

This guide provides step-by-step instructions for integrating the `zb-search-autocomplete` web component into your Angular storefront application.

## Overview

The search autocomplete component is built as a **Web Component** (Custom Element) using Lit, which makes it framework-agnostic and easy to integrate into any Angular application.

## Integration Architecture

```
┌─────────────────────────────────────────┐
│   Angular Storefront Application       │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Header Component                 │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │  Search Icon Button         │ │ │
│  │  │  (Click to open search)     │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │  <zb-search-autocomplete>   │ │ │
│  │  │  (Web Component)            │ │ │
│  │  │                             │ │ │
│  │  │  - Listens to user input    │ │ │
│  │  │  - Emits custom events      │ │ │
│  │  │  - Displays results         │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Search Service                   │ │
│  │  - Fetches results from API       │ │
│  │  - Transforms data                │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## Step 1: Build the Web Component

First, build the web component for production:

```bash
cd web-elements/zb-search-autocomplete
npm install
npm run build
```

This will create a `dist` folder with the compiled JavaScript file.

## Step 2: Copy the Built Files to Your Angular Project

Copy the built files to your Angular project's assets folder:

```bash
# From the zb-search-autocomplete directory
cp -r dist/* ../zb-storefront/src/assets/web-components/
```

Or manually copy:
- `dist/zb-search-autocomplete.js` → `src/assets/web-components/zb-search-autocomplete.js`

## Step 3: Include the Script in Your Angular App

### Option A: Add to `angular.json` (Recommended)

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

### Option B: Add to `index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <!-- ... other head content ... -->
  <script type="module" src="assets/web-components/zb-search-autocomplete.js"></script>
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

## Step 4: Enable Custom Elements in Angular

Add `CUSTOM_ELEMENTS_SCHEMA` to your module:

```typescript
// app.module.ts (or your feature module)
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    // ... other components
  ],
  imports: [
    BrowserModule,
    // ... other modules
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Add this line
  bootstrap: [AppComponent]
})
export class AppModule { }
```

For **Standalone Components** (Angular 14+):

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
  // ... component logic
}
```

## Step 5: Create the Search Service

Create a service to handle search API calls:

```typescript
// services/search.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/search`;

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(this.apiUrl, {
      params: { q: query }
    });
  }
}
```

## Step 6: Implement in Header Component

### Template (header.component.html)

```html
<header class="header">
  <div class="header-container">
    <!-- Logo -->
    <div class="logo">
      <a routerLink="/">ZenBasket</a>
    </div>

    <!-- Search Icon Button -->
    <button 
      class="search-icon-btn" 
      (click)="openSearch()"
      aria-label="Open search"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path 
          d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- Other header items (cart, account, etc.) -->
  </div>

  <!-- Search Modal/Overlay -->
  <div class="search-overlay" [class.active]="searchOpen" (click)="closeSearch()">
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
</header>
```

### Component (header.component.ts)

```typescript
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService, SearchResults } from '../../services/search.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements AfterViewInit {
  @ViewChild('searchComponent') searchComponent!: ElementRef;
  
  searchOpen = false;
  private searchSubject = new Subject<string>();

  constructor(
    private searchService: SearchService,
    private router: Router
  ) {
    // Set up search subscription with debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.searchService.search(query))
    ).subscribe({
      next: (results) => this.setSearchResults(results),
      error: (error) => {
        console.error('Search error:', error);
        this.setSearchResults({});
      }
    });
  }

  ngAfterViewInit() {
    // Component is ready
  }

  openSearch() {
    this.searchOpen = true;
    // Focus the search input after a short delay
    setTimeout(() => {
      const input = this.searchComponent?.nativeElement
        ?.shadowRoot
        ?.querySelector('input');
      input?.focus();
    }, 100);
  }

  closeSearch() {
    this.searchOpen = false;
  }

  onSearchInput(event: CustomEvent) {
    const query = event.detail.query;
    
    if (query.length < 2) {
      this.setSearchResults({});
      return;
    }
    
    // Trigger search via subject (will be debounced)
    this.searchSubject.next(query);
  }

  onSearchSubmit(event: CustomEvent) {
    const query = event.detail.query;
    this.closeSearch();
    this.router.navigate(['/search'], { 
      queryParams: { q: query } 
    });
  }

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
    // But we can close the search overlay
    if (type === 'product' || type === 'page') {
      this.closeSearch();
    }
  }

  private setSearchResults(results: SearchResults) {
    if (this.searchComponent?.nativeElement) {
      this.searchComponent.nativeElement.setResults(results);
    }
  }
}
```

### Styles (header.component.css)

```css
.header {
  position: relative;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 0;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo a {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  text-decoration: none;
}

.search-icon-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: color 0.2s ease;
}

.search-icon-btn:hover {
  color: #0066cc;
}

/* Search Overlay */
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: none;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
  animation: fadeIn 0.2s ease;
}

.search-overlay.active {
  display: flex;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.search-modal {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideDown 0.3s ease;
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

/* Customize the web component */
zb-search-autocomplete {
  display: block;
  width: 100%;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .search-modal {
    max-width: 90%;
    padding: 16px;
  }
  
  .search-overlay {
    padding-top: 60px;
  }
}
```

## Step 7: Backend API Implementation

Your backend should return search results in this format:

```json
{
  "suggestions": ["search term 1", "search term 2"],
  "products": [
    {
      "name": "Product Name",
      "image": "https://example.com/image.jpg",
      "url": "/products/product-slug"
    }
  ],
  "pages": [
    {
      "name": "Page Name",
      "url": "/pages/page-slug"
    }
  ]
}
```

### Example Node.js/Express Endpoint

```javascript
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query || query.length < 2) {
    return res.json({ suggestions: [], products: [], pages: [] });
  }
  
  try {
    const [suggestions, products, pages] = await Promise.all([
      searchSuggestions(query),
      searchProducts(query),
      searchPages(query)
    ]);
    
    res.json({
      suggestions: suggestions.slice(0, 5),
      products: products.slice(0, 5),
      pages: pages.slice(0, 3)
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});
```

## Step 8: Testing

1. **Run your Angular app**:
   ```bash
   ng serve
   ```

2. **Click the search icon** in the header

3. **Type in the search box** and verify:
   - Dropdown appears
   - Suggestions are displayed
   - Products are shown
   - Pages are listed
   - Events are fired correctly

4. **Test interactions**:
   - Click on a suggestion
   - Click on a product
   - Click on a page
   - Press Enter to submit
   - Click the close button

## Troubleshooting

### Web Component Not Recognized

**Problem**: Angular shows error about unknown element `zb-search-autocomplete`

**Solution**: Make sure you've added `CUSTOM_ELEMENTS_SCHEMA` to your module or component

### Events Not Firing

**Problem**: Custom events from the web component are not being caught

**Solution**: 
- Use `(event-name)` syntax in Angular templates
- Make sure the event names match exactly (kebab-case)
- Check that the web component script is loaded

### Styling Issues

**Problem**: Component doesn't look right

**Solution**:
- The component uses Shadow DOM, so global styles won't affect it
- Use CSS custom properties to customize:
  ```css
  zb-search-autocomplete {
    --primary-color: #your-color;
    --border-color: #your-color;
  }
  ```

### TypeScript Errors

**Problem**: TypeScript complains about `CustomEvent` detail property

**Solution**: Create a type definition file:

```typescript
// typings.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'zb-search-autocomplete': any;
  }
}

interface SearchInputEvent extends CustomEvent {
  detail: {
    query: string;
  };
}

interface SuggestionClickEvent extends CustomEvent {
  detail: {
    suggestion: string;
    type: string;
  };
}
```

## Advanced Configuration

### Custom Styling

```typescript
// In your component
ngAfterViewInit() {
  const searchEl = this.searchComponent.nativeElement;
  searchEl.style.setProperty('--primary-color', '#0066cc');
  searchEl.style.setProperty('--border-color', '#e0e0e0');
}
```

### Programmatic Control

```typescript
// Open dropdown programmatically
this.searchComponent.nativeElement.open = true;

// Set results manually
this.searchComponent.nativeElement.setResults({
  suggestions: ['apple', 'apricot'],
  products: [{ name: 'Apple iPhone', url: '/products/iphone' }]
});
```

## Summary

You now have a fully functional search autocomplete component integrated into your Angular storefront! The component:

✅ Works as a standalone web component  
✅ Integrates seamlessly with Angular  
✅ Provides real-time search suggestions  
✅ Displays products and pages  
✅ Emits custom events for easy handling  
✅ Is fully customizable via CSS properties  
✅ Works on mobile and desktop  

For more details, see the [README.md](./README.md) file.
