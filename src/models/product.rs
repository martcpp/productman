use time::{OffsetDateTime};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use rust_decimal::Decimal;
use uuid::Uuid;


// Product model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub price: Decimal,
    pub category_id: Uuid,
    pub image_url: Option<String>,
    pub stock: i32,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
}

// Product creation request
#[derive(Debug, Deserialize)]
pub struct CreateProduct {
    pub name: String,
    pub description: Option<String>,
    pub price: String, // We'll parse this to Decimal
    pub category_id: Uuid,
    pub stock: i32,
}

// Product update request
#[derive(Debug, Deserialize)]
pub struct UpdateProduct {
    pub name: Option<String>,
    pub description: Option<String>,
    pub price: Option<String>,
    pub category_id: Option<Uuid>,
    pub stock: Option<i32>,
}

// Product with category name (for API responses)
#[derive(Debug, Serialize)]
pub struct ProductWithCategory {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub price: Decimal,
    pub category_id: Uuid,
    pub category_name: String,
    pub image_url: Option<String>,
    pub stock: i32,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
}


#[derive(Debug, Deserialize)]
pub struct ProductFilter {
    pub search: Option<String>,
    pub category_name: Option<String>,
    pub min_price: Option<f64>,
    pub max_price: Option<f64>,
    pub in_stock: Option<bool>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}