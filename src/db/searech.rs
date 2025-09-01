// use crate::db::db_con::DatabasePool;
// use crate::models::product::{ProductQuery, ProductWithCategory};
// use anyhow::Result;
// use rust_decimal::Decimal;
// use sqlx::Row;

// pub struct ProductSearchService;

// impl ProductSearchService {
//     /// Main search function that handles all product filtering and pagination
//     pub async fn search_products(
//         pool: &DatabasePool,
//         query: ProductQuery,
//     ) -> Result<(Vec<ProductWithCategory>, u32)> {
//         let page = query.page.unwrap_or(1);
//         let limit = query.limit.unwrap_or(10).min(100); // Max 100 items per page
//         let offset = (page - 1) * limit;

//         // Build search context
//         let search_context = SearchContext::from_query(&query);
        
//         // Execute appropriate search strategy
//         match search_context.search_type {
//             SearchType::All => Self::search_all_products(pool, limit, offset).await,
//             SearchType::TextOnly => Self::search_by_text(pool, &search_context.search_term.unwrap(), limit, offset).await,
//             SearchType::CategoryOnly => Self::search_by_category(pool, search_context.category_id.unwrap(), limit, offset).await,
//             SearchType::TextAndCategory => {
//                 Self::search_by_text_and_category(
//                     pool, 
//                     &search_context.search_term.unwrap(), 
//                     search_context.category_id.unwrap(), 
//                     limit, 
//                     offset
//                 ).await
//             },
//             SearchType::PriceRange => {
//                 Self::search_by_price_range(
//                     pool, 
//                     search_context.min_price, 
//                     search_context.max_price, 
//                     limit, 
//                     offset
//                 ).await
//             },
//             SearchType::StockStatus => {
//                 Self::search_by_stock_status(
//                     pool, 
//                     search_context.in_stock.unwrap(), 
//                     limit, 
//                     offset
//                 ).await
//             },
//             SearchType::Complex => {
//                 Self::search_complex(pool, &search_context, limit, offset).await
//             }
//         }
//     }

//     /// Search all products without filters
//     async fn search_all_products(
//         pool: &DatabasePool,
//         limit: u32,
//         offset: u32,
//     ) -> Result<(Vec<ProductWithCategory>, u32)> {
//         let base_query = Self::get_base_select_query();
//         let count_query = Self::get_base_count_query();

//         let total_count: i64 = sqlx::query_scalar(count_query)
//             .fetch_one(pool)
//             .await?;

//         let products_query = format!(
//             "{} ORDER BY p.created_at DESC LIMIT $1 OFFSET $2", 
//             base_query
//         );

//         let rows = sqlx::query(&products_query)
//             .bind(limit as i64)
//             .bind(offset as i64)
//             .fetch_all(pool)
//             .await?;

//         let products = Self::map_rows_to_products(rows);
//         Ok((products, total_count as u32))
//     }

//     /// Search products by text (full-text search)
//     async fn search_by_text(
//         pool: &DatabasePool,
//         search_term: &str,
//         limit: u32,
//         offset: u32,
//     ) -> Result<(Vec<ProductWithCategory>, u32)> {
//         let base_query = Self::get_base_select_query();
//         let count_query = Self::get_base_count_query();
//         let search_condition = Self::get_text_search_condition();

//         let count_query_with_where = format!("{} WHERE {}", count_query, search_condition);
//         let products_query = format!(
//             "{} WHERE {} ORDER BY p.created_at DESC LIMIT $2 OFFSET $3",
//             base_query, search_condition
//         );

//         let total_count: i64 = sqlx::query_scalar(&count_query_with_where)
//             .bind(search_term)
//             .fetch_one(pool)
//             .await?;

//         let rows = sqlx::query(&products_query)
//             .bind(search_term)
//             .bind(limit as i64)
//             .bind(offset as i64)
//             .fetch_all(pool)
//             .await?;

//         let products = Self::map_rows_to_products(rows);
//         Ok((products, total_count as u32))
//     }

//     /// Search products by category
//     async fn search_by_category(
//         pool: &DatabasePool,
//         category_id: uuid::Uuid,
//         limit: u32,
//         offset: u32,
//     ) -> Result<(Vec<ProductWithCategory>, u32)> {
//         let base_query = Self::get_base_select_query();
//         let count_query = Self::get_base_count_query();

//         let count_query_with_where = format!("{} WHERE p.category_id = $1", count_query);
//         let products_query = format!(
//             "{} WHERE p.category_id = $1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3",
//             base_query
//         );

//         let total_count: i64 = sqlx::query_scalar(&count_query_with_where)
//             .bind(category_id)
//             .fetch_one(pool)
//             .await?;

//         let rows = sqlx::query(&products_query)
//             .bind(category_id)
//             .bind(limit as i64)
//             .bind(offset as i64)
//             .fetch_all(pool)
//             .await?;

//         let products = Self::map_rows_to_products(rows);
//         Ok((products, total_count as u32))
//     }

//     /// Search products by text and category
//     async fn search_by_text_and_category(
//         pool: &DatabasePool,
//         search_term: &str,
//         category_id: uuid::Uuid,
//         limit: u32,
//         offset: u32,
//     ) -> Result<(Vec<ProductWithCategory>, u32)> {
//         let base_query = Self::get_base_select_query();
//         let count_query = Self::get_base_count_query();
//         let search_condition = Self::get_text_search_condition();

//         let where_clause = format!("p.category_id = $1 AND {}", search_condition);
//         let count_query_with_where = format!("{} WHERE {}", count_query, where_clause);
//         let products_query = format!(
//             "{} WHERE {} ORDER BY p.created_at DESC LIMIT $3 OFFSET $4",
//             base_query, where_clause
//         );

//         let total_count: i64 = sqlx::query_scalar(&count_query_with_where)
//             .bind(category_id)
//             .bind(search_term)
//             .fetch_one(pool)
//             .await?;

//         let rows = sqlx::query(&products_query)
//             .bind(category_id)
//             .bind(search_term)
//             .bind(limit as i64)
//             .bind(offset as i64)
//             .fetch_all(pool)
//             .await?;

//         let products = Self::map_rows_to_products(rows);
//         Ok((products, total_count as u32))
//     }

//     /// Search products by price range
//     async fn search_by_price_range(
//         pool: &DatabasePool,
//         min_price: Option<Decimal>,
//         max_price: Option<Decimal>,
//         limit: u32,
//         offset: u32,
//     ) -> Result<(Vec<ProductWithCategory>, u32)> {
//         let base_query = Self::get_base_select_query();
//         let count_query = Self::get_base_count_query();

//         let (where_clause, total_count, rows) = match (min_price, max_price) {
//             (Some(min), Some(max)) => {
//                 let where_clause = "p.price >= $1 AND p.price <= $2";
//                 let count_query_with_where = format!("{} WHERE {}", count_query, where_clause);
//                 let products_query = format!(
//                     "{} WHERE {} ORDER BY p.created_at DESC LIMIT $3 OFFSET $4",
//                     base_query, where_clause
//                 );

//                 let total_count: i64 = sqlx::query_scalar(&count_query_with_where)
//                     .bind(min).bind(max)
//                     .fetch_one(pool).await?;

//                 let rows = sqlx::query(&products_query)
//                     .bind(min).bind(max).bind(limit as i64).bind(offset as i64)
//                     .fetch_all(pool).await?;

//                 (where_clause, total_count, rows)
//             },
//             (Some(min), None) => {
//                 let where_clause = "p.price >= $1";
//                 let count_query_with_where = format!("{} WHERE {}", count_query, where_clause);
//                 let products_query = format!(
//                     "{} WHERE {} ORDER BY p.created_at DESC LIMIT $2 OFFSET $3",
//                     base_query, where_clause
//                 );

//                 let total_count: i64 = sqlx::query_scalar(&count_query_with_where)
//                     .bind(min)
//                     .fetch_one(pool).await?;

//                 let rows = sqlx::query(&products_query)
//                     .bind(min).bind(limit as i64).bind(offset as i64)
//                     .fetch_all(pool).await?;

//                 (where_clause, total_count, rows)
//             },
//             (None, Some(max)) => {
//                 let where_clause = "p.price <= $1";
//                 let count_query_with_where = format!("{} WHERE {}", count_query, where_clause);
//                 let products_query = format!(
//                     "{} WHERE {} ORDER BY p.created_at DESC LIMIT $2 OFFSET $3",
//                     base_query, where_clause
//                 );

//                 let total_count: i64 = sqlx::query_scalar(&count_query_with_where)
//                     .bind(max)
//                     .fetch_one(pool).await?;

//                 let rows = sqlx::query(&products_query)
//                     .bind(max).bind(limit as i64).bind(offset as i64)
//                     .fetch_all(pool).await?;

//                 (where_clause, total_count, rows)
//             },
//             (None, None) => {
//                 return Self::search_all_products(pool, limit, offset).await;
//             }
//         };

//         let products = Self::map_rows_to_products(rows);
//         Ok((products, total_count as u32))
//     }

//     /// Search products by stock status
//     async fn search_by_stock_status(
//         pool: &DatabasePool,
//         in_stock: bool,
//         limit: u32,
//         offset: u32,
//     ) -> Result<(Vec<ProductWithCategory>, u32)> {
//         let base_query = Self::get_base_select_query();
//         let count_query = Self::get_base_count_query();
//         let stock_condition = if in_stock { "p.stock > 0" } else { "p.stock = 0" };

//         let count_query_with_where = format!("{} WHERE {}", count_query, stock_condition);
//         let products_query = format!(
//             "{} WHERE {} ORDER BY p.created_at DESC LIMIT $1 OFFSET $2",
//             base_query, stock_condition
//         );

//         let total_count: i64 = sqlx::query_scalar(&count_query_with_where)
//             .fetch_one(pool)
//             .await?;

//         let rows = sqlx::query(&products_query)
//             .bind(limit as i64)
//             .bind(offset as i64)
//             .fetch_all(pool)
//             .await?;

//         let products = Self::map_rows_to_products(rows);
//         Ok((products, total_count as u32))
//     }

//     /// Complex search with multiple filters (simplified version)
//     /// In a production system, this would handle all combinations dynamically
//     async fn search_complex(
//         pool: &DatabasePool,
//         context: &SearchContext,
//         limit: u32,
//         offset: u32,
//     ) -> Result<(Vec<ProductWithCategory>, u32)> {
//         // For now, fall back to all products
//         // In production, you'd want to build dynamic queries or use a search engine
//         tracing::warn!("Complex search not fully implemented, falling back to all products");
//         Self::search_all_products(pool, limit, offset).await
//     }

//     // Helper methods
//     fn get_base_select_query() -> &'static str {
//         r#"
//         SELECT p.id, p.name, p.description, p.price, p.category_id, p.image_url, p.stock, p.created_at,
//                c.name as category_name
//         FROM products p 
//         JOIN categories c ON p.category_id = c.id
//         "#
//     }

//     fn get_base_count_query() -> &'static str {
//         r#"
//         SELECT COUNT(*) as total
//         FROM products p 
//         JOIN categories c ON p.category_id = c.id
//         "#
//     }

//     fn get_text_search_condition() -> &'static str {
//         "to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('english', $2)"
//     }

//     fn map_rows_to_products(rows: Vec<sqlx::postgres::PgRow>) -> Vec<ProductWithCategory> {
//         rows.into_iter()
//             .map(|row| ProductWithCategory {
//                 id: row.get("id"),
//                 name: row.get("name"),
//                 description: row.get("description"),
//                 price: row.get("price"),
//                 category_id: row.get("category_id"),
//                 category_name: row.get("category_name"),
//                 image_url: row.get("image_url"),
//                 stock: row.get("stock"),
//                 created_at: row.get("created_at"),
//             })
//             .collect()
//     }
// }

// /// Context object that analyzes the search query and determines the search strategy
// #[derive(Debug)]
// struct SearchContext {
//     search_type: SearchType,
//     search_term: Option<String>,
//     category_id: Option<uuid::Uuid>,
//     min_price: Option<Decimal>,
//     max_price: Option<Decimal>,
//     in_stock: Option<bool>,
// }

// impl SearchContext {
//     fn from_query(query: &ProductQuery) -> Self {
//         let has_search = query.search.as_ref().map_or(false, |s| !s.trim().is_empty());
//         let has_category = query.category_id.is_some();
//         let has_price_filter = query.min_price.is_some() || query.max_price.is_some();
//         let has_stock_filter = query.in_stock.is_some();

//         // Convert price filters to Decimal
//         let min_price = query.min_price.map(Decimal::from_f64_retain).flatten();
//         let max_price = query.max_price.map(Decimal::from_f64_retain).flatten();

//         let search_type = match (has_search, has_category, has_price_filter, has_stock_filter) {
//             (false, false, false, false) => SearchType::All,
//             (true, false, false, false) => SearchType::TextOnly,
//             (false, true, false, false) => SearchType::CategoryOnly,
//             (true, true, false, false) => SearchType::TextAndCategory,
//             (false, false, true, false) => SearchType::PriceRange,
//             (false, false, false, true) => SearchType::StockStatus,
//             _ => SearchType::Complex,
//         };

//         SearchContext {
//             search_type,
//             search_term: query.search.clone().filter(|s| !s.trim().is_empty()),
//             category_id: query.category_id,
//             min_price,
//             max_price,
//             in_stock: query.in_stock,
//         }
//     }
// }

// /// Search strategy enum
// #[derive(Debug, PartialEq)]
// enum SearchType {
//     All,                // No filters
//     TextOnly,           // Text search only
//     CategoryOnly,       // Category filter only
//     TextAndCategory,    // Text search + category filter
//     PriceRange,         // Price range filter only
//     StockStatus,        // Stock status filter only
//     Complex,            // Multiple filters (requires dynamic query building)
// }

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use crate::models::product::ProductQuery;
//     use uuid::Uuid;

//     #[test]
//     fn test_search_context_all_products() {
//         let query = ProductQuery {
//             search: None,
//             category_id: None,
//             min_price: None,
//             max_price: None,
//             in_stock: None,
//             page: None,
//             limit: None,
//         };

//         let context = SearchContext::from_query(&query);
//         assert_eq!(context.search_type, SearchType::All);
//     }

//     #[test]
//     fn test_search_context_text_only() {
//         let query = ProductQuery {
//             search: Some("laptop".to_string()),
//             category_id: None,
//             min_price: None,
//             max_price: None,
//             in_stock: None,
//             page: None,
//             limit: None,
//         };

//         let context = SearchContext::from_query(&query);
//         assert_eq!(context.search_type, SearchType::TextOnly);
//         assert_eq!(context.search_term, Some("laptop".to_string()));
//     }

//     #[test]
//     fn test_search_context_category_only() {
//         let category_id = Uuid::new_v4();
//         let query = ProductQuery {
//             search: None,
//             category_id: Some(category_id),
//             min_price: None,
//             max_price: None,
//             in_stock: None,
//             page: None,
//             limit: None,
//         };

//         let context = SearchContext::from_query(&query);
//         assert_eq!(context.search_type, SearchType::CategoryOnly);
//         assert_eq!(context.category_id, Some(category_id));
//     }

//     #[test]
//     fn test_search_context_text_and_category() {
//         let category_id = Uuid::new_v4();
//         let query = ProductQuery {
//             search: Some("gaming laptop".to_string()),
//             category_id: Some(category_id),
//             min_price: None,
//             max_price: None,
//             in_stock: None,
//             page: None,
//             limit: None,
//         };

//         let context = SearchContext::from_query(&query);
//         assert_eq!(context.search_type, SearchType::TextAndCategory);
//         assert_eq!(context.search_term, Some("gaming laptop".to_string()));
//         assert_eq!(context.category_id, Some(category_id));
//     }

//     #[test]
//     fn test_search_context_empty_search_string() {
//         let query = ProductQuery {
//             search: Some("   ".to_string()), // Empty/whitespace string
//             category_id: None,
//             min_price: None,
//             max_price: None,
//             in_stock: None,
//             page: None,
//             limit: None,
//         };

//         let context = SearchContext::from_query(&query);
//         assert_eq!(context.search_type, SearchType::All);
//         assert_eq!(context.search_term, None);
//     }
// }



// use sqlx::{PgPool, query_as, QueryBuilder};
// use crate::models::{Product, ProductFilter};
// use anyhow::Result;


// pub async fn search_products(pool: &PgPool, filter: &ProductFilter) -> Result<Vec<Product>> {
//     let mut builder = QueryBuilder::new("SELECT * FROM products WHERE 1=1");

//     // Filters
//     if let Some(search) = &filter.search {
//         builder.push(" AND to_tsvector('english', name || ' ' || description) @@ plainto_tsquery(")
//                .push_bind(search)
//                .push(")");
//     }
//     if let Some(category) = &filter.category {
//         builder.push(" AND category = ").push_bind(category);
//     }
//     if let Some(min_price) = filter.min_price {
//         builder.push(" AND price >= ").push_bind(min_price);
//     }
//     if let Some(max_price) = filter.max_price {
//         builder.push(" AND price <= ").push_bind(max_price);
//     }

//     // Pagination
//     let page = filter.page.unwrap_or(1).max(1);
//     let per_page = filter.per_page.unwrap_or(10).min(100);
//     let offset = (page - 1) * per_page;

//     builder.push(" ORDER BY id ASC");
//     builder.push(" LIMIT ").push_bind(per_page as i64)
//            .push(" OFFSET ").push_bind(offset as i64);

//     let query = builder.build_query_as::<Product>();
//     let products = query.fetch_all(pool).await?;

//     Ok(products)
// }
