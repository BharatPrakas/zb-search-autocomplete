# Backend API Implementation Examples

This document provides complete backend API implementation examples for the search autocomplete functionality.

---

## 📋 **API Specification**

### **Endpoint**
```
GET /api/search?q={query}
```

### **Request Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (minimum 2 characters) |
| `limit` | number | No | Maximum results per section (default: 5) |

### **Response Format**
```json
{
  "suggestions": ["string"],
  "products": [
    {
      "name": "string",
      "image": "string (optional)",
      "url": "string"
    }
  ],
  "pages": [
    {
      "name": "string",
      "url": "string"
    }
  ]
}
```

---

## 🟢 **Node.js/Express Implementation**

### **Complete Example with PostgreSQL**

```javascript
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Search API endpoint
 * GET /api/search?q={query}
 */
router.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 5;

    // Validate query
    if (!query || query.length < 2) {
      return res.json({
        suggestions: [],
        products: [],
        pages: []
      });
    }

    // Sanitize query for SQL
    const searchTerm = `%${query.toLowerCase()}%`;

    // Execute all searches in parallel
    const [suggestions, products, pages] = await Promise.all([
      searchSuggestions(searchTerm, limit),
      searchProducts(searchTerm, limit),
      searchPages(searchTerm, limit)
    ]);

    res.json({
      suggestions,
      products,
      pages
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * Search for text suggestions
 */
async function searchSuggestions(searchTerm, limit) {
  const query = `
    SELECT DISTINCT 
      LOWER(name) as suggestion
    FROM (
      -- Product names
      SELECT name FROM products 
      WHERE LOWER(name) LIKE $1 
      AND active = true
      
      UNION
      
      -- Product tags
      SELECT unnest(tags) as name FROM products 
      WHERE EXISTS (
        SELECT 1 FROM unnest(tags) tag 
        WHERE LOWER(tag) LIKE $1
      )
      AND active = true
      
      UNION
      
      -- Category names
      SELECT name FROM categories 
      WHERE LOWER(name) LIKE $1 
      AND active = true
    ) suggestions
    ORDER BY suggestion
    LIMIT $2
  `;

  const result = await pool.query(query, [searchTerm, limit]);
  return result.rows.map(row => row.suggestion);
}

/**
 * Search for products
 */
async function searchProducts(searchTerm, limit) {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.image_url,
      p.price,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE (
      LOWER(p.name) LIKE $1 
      OR LOWER(p.description) LIKE $1
      OR EXISTS (
        SELECT 1 FROM unnest(p.tags) tag 
        WHERE LOWER(tag) LIKE $1
      )
    )
    AND p.active = true
    ORDER BY 
      -- Prioritize exact matches
      CASE 
        WHEN LOWER(p.name) = LOWER(REPLACE($1, '%', '')) THEN 1
        WHEN LOWER(p.name) LIKE LOWER(REPLACE($1, '%', '')) || '%' THEN 2
        ELSE 3
      END,
      p.popularity DESC,
      p.name
    LIMIT $2
  `;

  const result = await pool.query(query, [searchTerm, limit]);
  
  return result.rows.map(row => ({
    name: row.name,
    image: row.image_url,
    url: `/products/${row.slug}`
  }));
}

/**
 * Search for pages/categories
 */
async function searchPages(searchTerm, limit) {
  const query = `
    SELECT 
      name,
      slug,
      type
    FROM (
      -- Categories
      SELECT 
        name,
        slug,
        'category' as type,
        1 as priority
      FROM categories
      WHERE LOWER(name) LIKE $1 
      AND active = true
      
      UNION
      
      -- Static pages
      SELECT 
        title as name,
        slug,
        'page' as type,
        2 as priority
      FROM pages
      WHERE LOWER(title) LIKE $1 
      AND published = true
    ) pages
    ORDER BY priority, name
    LIMIT $2
  `;

  const result = await pool.query(query, [searchTerm, limit]);
  
  return result.rows.map(row => ({
    name: row.name,
    url: row.type === 'category' 
      ? `/category/${row.slug}` 
      : `/pages/${row.slug}`
  }));
}

module.exports = router;
```

### **Usage in Express App**

```javascript
// app.js
const express = require('express');
const searchRouter = require('./routes/search');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use(searchRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 🔵 **NestJS Implementation**

### **Search Service**

```typescript
// search.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';

export interface SearchResults {
  suggestions: string[];
  products: Array<{
    name: string;
    image?: string;
    url: string;
  }>;
  pages: Array<{
    name: string;
    url: string;
  }>;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async search(query: string, limit: number = 5): Promise<SearchResults> {
    if (!query || query.length < 2) {
      return { suggestions: [], products: [], pages: [] };
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    const [suggestions, products, pages] = await Promise.all([
      this.searchSuggestions(searchTerm, limit),
      this.searchProducts(searchTerm, limit),
      this.searchPages(searchTerm, limit),
    ]);

    return { suggestions, products, pages };
  }

  private async searchSuggestions(
    searchTerm: string,
    limit: number,
  ): Promise<string[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT LOWER(product.name)', 'suggestion')
      .where('LOWER(product.name) LIKE :searchTerm', { searchTerm })
      .andWhere('product.active = :active', { active: true })
      .orderBy('suggestion')
      .limit(limit)
      .getRawMany();

    return products.map((p) => p.suggestion);
  }

  private async searchProducts(searchTerm: string, limit: number) {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('LOWER(product.name) LIKE :searchTerm', { searchTerm })
      .orWhere('LOWER(product.description) LIKE :searchTerm', { searchTerm })
      .andWhere('product.active = :active', { active: true })
      .orderBy('product.popularity', 'DESC')
      .addOrderBy('product.name')
      .limit(limit)
      .getMany();

    return products.map((product) => ({
      name: product.name,
      image: product.imageUrl,
      url: `/products/${product.slug}`,
    }));
  }

  private async searchPages(searchTerm: string, limit: number) {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .where('LOWER(category.name) LIKE :searchTerm', { searchTerm })
      .andWhere('category.active = :active', { active: true })
      .orderBy('category.name')
      .limit(limit)
      .getMany();

    return categories.map((category) => ({
      name: category.name,
      url: `/category/${category.slug}`,
    }));
  }
}
```

### **Search Controller**

```typescript
// search.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { SearchService, SearchResults } from './search.service';

@Controller('api')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ): Promise<SearchResults> {
    return this.searchService.search(query, limit || 5);
  }
}
```

---

## 🟡 **Python/Flask Implementation**

```python
# search.py
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import or_, func

app = Flask(__name__)
db = SQLAlchemy(app)

# Models
class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200))
    slug = db.Column(db.String(200))
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    active = db.Column(db.Boolean, default=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    slug = db.Column(db.String(100))
    active = db.Column(db.Boolean, default=True)

@app.route('/api/search', methods=['GET'])
def search():
    """Search API endpoint"""
    query = request.args.get('q', '')
    limit = int(request.args.get('limit', 5))
    
    # Validate query
    if not query or len(query) < 2:
        return jsonify({
            'suggestions': [],
            'products': [],
            'pages': []
        })
    
    search_term = f'%{query.lower()}%'
    
    # Search suggestions
    suggestions = db.session.query(
        func.distinct(func.lower(Product.name))
    ).filter(
        func.lower(Product.name).like(search_term),
        Product.active == True
    ).limit(limit).all()
    
    suggestions = [s[0] for s in suggestions]
    
    # Search products
    products = Product.query.filter(
        or_(
            func.lower(Product.name).like(search_term),
            func.lower(Product.description).like(search_term)
        ),
        Product.active == True
    ).limit(limit).all()
    
    products_data = [
        {
            'name': p.name,
            'image': p.image_url,
            'url': f'/products/{p.slug}'
        }
        for p in products
    ]
    
    # Search categories/pages
    categories = Category.query.filter(
        func.lower(Category.name).like(search_term),
        Category.active == True
    ).limit(limit).all()
    
    pages_data = [
        {
            'name': c.name,
            'url': f'/category/{c.slug}'
        }
        for c in categories
    ]
    
    return jsonify({
        'suggestions': suggestions,
        'products': products_data,
        'pages': pages_data
    })

if __name__ == '__main__':
    app.run(debug=True)
```

---

## 🔴 **Ruby on Rails Implementation**

```ruby
# app/controllers/api/search_controller.rb
module Api
  class SearchController < ApplicationController
    def index
      query = params[:q]
      limit = params[:limit]&.to_i || 5

      if query.blank? || query.length < 2
        return render json: {
          suggestions: [],
          products: [],
          pages: []
        }
      end

      search_term = "%#{query.downcase}%"

      render json: {
        suggestions: search_suggestions(search_term, limit),
        products: search_products(search_term, limit),
        pages: search_pages(search_term, limit)
      }
    end

    private

    def search_suggestions(search_term, limit)
      Product
        .where('LOWER(name) LIKE ?', search_term)
        .where(active: true)
        .select('DISTINCT LOWER(name) as suggestion')
        .limit(limit)
        .pluck(:suggestion)
    end

    def search_products(search_term, limit)
      Product
        .where('LOWER(name) LIKE ? OR LOWER(description) LIKE ?', 
               search_term, search_term)
        .where(active: true)
        .limit(limit)
        .map do |product|
          {
            name: product.name,
            image: product.image_url,
            url: "/products/#{product.slug}"
          }
        end
    end

    def search_pages(search_term, limit)
      Category
        .where('LOWER(name) LIKE ?', search_term)
        .where(active: true)
        .limit(limit)
        .map do |category|
          {
            name: category.name,
            url: "/category/#{category.slug}"
          }
        end
    end
  end
end
```

---

## 🧪 **Testing the API**

### **Using cURL**

```bash
# Basic search
curl "http://localhost:3000/api/search?q=ash"

# With limit
curl "http://localhost:3000/api/search?q=ash&limit=10"
```

### **Using Postman**

```
GET http://localhost:3000/api/search?q=ash
```

### **Expected Response**

```json
{
  "suggestions": [
    "ash trays",
    "ashwagandha",
    "ash blonde hair dye"
  ],
  "products": [
    {
      "name": "Ash Trays",
      "image": "https://example.com/ash-trays.jpg",
      "url": "/products/ash-trays"
    },
    {
      "name": "Ashwagandha Capsules",
      "image": "https://example.com/ashwagandha.jpg",
      "url": "/products/ashwagandha-capsules"
    }
  ],
  "pages": [
    {
      "name": "Pharmacy",
      "url": "/category/pharmacy"
    }
  ]
}
```

---

## 🔒 **Security Considerations**

### **1. SQL Injection Prevention**

Always use parameterized queries:

```javascript
// ✅ Good - Parameterized
pool.query('SELECT * FROM products WHERE name LIKE $1', [`%${query}%`]);

// ❌ Bad - String concatenation
pool.query(`SELECT * FROM products WHERE name LIKE '%${query}%'`);
```

### **2. Rate Limiting**

```javascript
const rateLimit = require('express-rate-limit');

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many search requests, please try again later'
});

app.use('/api/search', searchLimiter);
```

### **3. Input Validation**

```javascript
function validateSearchQuery(query) {
  // Maximum length
  if (query.length > 100) {
    throw new Error('Query too long');
  }
  
  // Minimum length
  if (query.length < 2) {
    return false;
  }
  
  // Remove special characters
  return query.replace(/[^\w\s-]/g, '');
}
```

---

## 📊 **Performance Optimization**

### **1. Database Indexing**

```sql
-- Create indexes for faster searches
CREATE INDEX idx_products_name_lower ON products (LOWER(name));
CREATE INDEX idx_products_active ON products (active);
CREATE INDEX idx_categories_name_lower ON categories (LOWER(name));

-- Full-text search index (PostgreSQL)
CREATE INDEX idx_products_search ON products 
USING GIN (to_tsvector('english', name || ' ' || description));
```

### **2. Caching with Redis**

```javascript
const redis = require('redis');
const client = redis.createClient();

async function searchWithCache(query, limit) {
  const cacheKey = `search:${query}:${limit}`;
  
  // Try cache first
  const cached = await client.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Perform search
  const results = await performSearch(query, limit);
  
  // Cache for 5 minutes
  await client.setex(cacheKey, 300, JSON.stringify(results));
  
  return results;
}
```

### **3. Debouncing on Backend**

```javascript
const debounce = require('lodash.debounce');

const debouncedSearch = debounce(async (query, callback) => {
  const results = await performSearch(query);
  callback(results);
}, 300);
```

---

## 📝 **Summary**

Choose the implementation that matches your backend stack:

- **Node.js/Express**: Most common, easy to integrate
- **NestJS**: TypeScript, enterprise-grade
- **Python/Flask**: Simple, Pythonic
- **Ruby on Rails**: Convention over configuration

All implementations follow the same API specification and return data in the format expected by the `zb-search-autocomplete` web component.
