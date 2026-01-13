# ZenBasket Search Autocomplete Web Component

A reusable, framework-agnostic search autocomplete web component built with Lit. This component can be easily integrated into any web application, including Angular, React, Vue, or vanilla JavaScript.

## Features

- 🔍 **Smart Autocomplete**: Real-time search suggestions as you type
- 📦 **Product Suggestions**: Display product results with images
- 📄 **Page Suggestions**: Show relevant pages/categories
- ⚡ **Debounced Search**: Optimized API calls with configurable debounce delay
- 🎨 **Clean UI**: Modern, minimal design matching your UI mockup
- 🔌 **Framework Agnostic**: Works with any framework or vanilla JS
- 📱 **Responsive**: Mobile-friendly design
- ♿ **Accessible**: Keyboard navigation and ARIA support
- 🎯 **Event-Driven**: Custom events for easy integration

## Installation

### Development

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

This will generate a compiled JavaScript file in the `dist` folder that you can include in your application.

## Usage

### Basic HTML

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="path/to/zb-search-autocomplete.js"></script>
</head>
<body>
  <zb-search-autocomplete 
    placeholder="Search products..."
    api-endpoint="/api/search"
  ></zb-search-autocomplete>
</body>
</html>
```

### Angular Integration

#### 1. Add to Angular Module

First, enable custom elements in your Angular module:

```typescript
// app.module.ts
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';

@NgModule({
  // ... other config
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
```

#### 2. Include the Web Component Script

Add the compiled script to your `angular.json`:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "scripts": [
              "node_modules/zb-search-autocomplete/dist/zb-search-autocomplete.js"
            ]
          }
        }
      }
    }
  }
}
```

Or include it in your `index.html`:

```html
<script type="module" src="assets/zb-search-autocomplete.js"></script>
```

#### 3. Use in Component Template

```html
<!-- header.component.html -->
<zb-search-autocomplete
  #searchComponent
  placeholder="Search products..."
  [attr.debounce-delay]="300"
  (search-input)="onSearchInput($event)"
  (search-submit)="onSearchSubmit($event)"
  (suggestion-click)="onSuggestionClick($event)"
  (search-close)="onSearchClose($event)"
></zb-search-autocomplete>
```

#### 4. Handle Events in Component

```typescript
// header.component.ts
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { SearchService } from './search.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements AfterViewInit {
  @ViewChild('searchComponent') searchComponent!: ElementRef;

  constructor(
    private searchService: SearchService,
    private router: Router
  ) {}

  ngAfterViewInit() {
    // Optional: Set initial state or configure the component
  }

  onSearchInput(event: CustomEvent) {
    const query = event.detail.query;
    
    if (query.length < 2) return; // Minimum query length
    
    // Fetch search results from your API
    this.searchService.search(query).subscribe({
      next: (results) => {
        // Set results to the component
        this.searchComponent.nativeElement.setResults(results);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.searchComponent.nativeElement.setResults({});
      }
    });
  }

  onSearchSubmit(event: CustomEvent) {
    const query = event.detail.query;
    // Navigate to search results page
    this.router.navigate(['/search'], { 
      queryParams: { q: query } 
    });
  }

  onSuggestionClick(event: CustomEvent) {
    const { suggestion, type } = event.detail;
    
    switch(type) {
      case 'suggestion':
        // Handle text suggestion click
        this.router.navigate(['/search'], { 
          queryParams: { q: suggestion } 
        });
        break;
      case 'product':
        // Product click is handled by the anchor tag
        console.log('Product clicked:', suggestion);
        break;
      case 'page':
        // Page click is handled by the anchor tag
        console.log('Page clicked:', suggestion);
        break;
    }
  }

  onSearchClose(event: CustomEvent) {
    // Handle search close (e.g., hide search overlay)
    console.log('Search closed');
  }
}
```

#### 5. Create Search Service

```typescript
// search.service.ts
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
  private apiUrl = '/api/search';

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(this.apiUrl, {
      params: { q: query }
    });
  }
}
```

## API Response Format

The component expects search results in the following format:

```json
{
  "suggestions": [
    "as st",
    "as sorted",
    "as h blonde"
  ],
  "products": [
    {
      "name": "Ash Trays",
      "image": "https://example.com/ash-trays.jpg",
      "url": "/products/ash-trays"
    },
    {
      "name": "TOWEL STAND",
      "url": "/products/towel-stand"
    }
  ],
  "pages": [
    {
      "name": "Pharmacy",
      "url": "/pages/pharmacy"
    },
    {
      "name": "Personal Care Electronics",
      "url": "/pages/personal-care-electronics"
    }
  ]
}
```

All fields are optional. The component will only display sections that have data.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placeholder` | `string` | `"Search"` | Placeholder text for the search input |
| `api-endpoint` | `string` | `""` | API endpoint for fetching search results (optional) |
| `debounce-delay` | `number` | `300` | Debounce delay in milliseconds |
| `open` | `boolean` | `false` | Whether the dropdown is open (can be set externally) |

## Methods

### `setResults(results: SearchResults)`

Manually set search results. Useful when you want to handle the API call yourself.

```javascript
const searchComponent = document.querySelector('zb-search-autocomplete');
searchComponent.setResults({
  suggestions: ['apple', 'apricot'],
  products: [{ name: 'Apple iPhone', url: '/products/iphone' }],
  pages: [{ name: 'Apple Products', url: '/pages/apple' }]
});
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `search-input` | `{ query: string }` | Fired when user types in the search box |
| `search-submit` | `{ query: string }` | Fired when user submits the search (Enter key) |
| `search-clear` | `{}` | Fired when user clears the search |
| `search-close` | `{}` | Fired when user closes the dropdown |
| `suggestion-click` | `{ suggestion: string, type: string }` | Fired when user clicks a suggestion |

## Styling

The component uses Shadow DOM, so styles are encapsulated. You can customize the appearance using CSS custom properties:

```css
zb-search-autocomplete {
  --primary-color: #0066cc;
  --border-color: #e0e0e0;
  --hover-bg: #f5f5f5;
  --text-primary: #333;
  --text-secondary: #666;
  --text-tertiary: #999;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.15);
}
```

## Integration with Storefront

When a user clicks the search icon in your storefront:

1. **Show the search component** (e.g., in a modal or dropdown)
2. **Listen to events** to handle user interactions
3. **Fetch results** from your backend API
4. **Set results** using the `setResults()` method
5. **Navigate** based on user selection

### Example: Modal Integration

```html
<!-- storefront-header.component.html -->
<div class="header">
  <button (click)="openSearch()" class="search-icon-btn">
    <svg><!-- search icon --></svg>
  </button>
</div>

<div class="search-modal" [class.open]="searchOpen">
  <div class="search-modal-content">
    <zb-search-autocomplete
      #searchComponent
      placeholder="Search products, pages..."
      (search-input)="onSearchInput($event)"
      (search-submit)="onSearchSubmit($event)"
      (search-close)="closeSearch()"
    ></zb-search-autocomplete>
  </div>
</div>
```

```typescript
// storefront-header.component.ts
export class StorefrontHeaderComponent {
  searchOpen = false;

  openSearch() {
    this.searchOpen = true;
  }

  closeSearch() {
    this.searchOpen = false;
  }

  // ... other methods
}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
