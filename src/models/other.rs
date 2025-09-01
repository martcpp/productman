use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Search and filtering
#[derive(Debug, Deserialize)]
pub struct ProductQuery {
    pub search: Option<String>,
    pub category_id: Option<Uuid>,
    pub min_price: Option<f64>,
    pub max_price: Option<f64>,
    pub in_stock: Option<bool>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

// Pagination response // type of product but can be used for other later
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub current_page: u32,
    pub total_items: u32,
    pub per_page: u32,
    pub total_pages: u32,
    pub item_on_page: Option<u32>,
}