use crate::db::categoryq::find_category_by_id;
use crate::db::productq::*;
use crate::models::product::*;
use crate::models::other::PaginatedResponse;
use crate::utils::error::{AppError, AppResult};
use crate::AppState;
use axum::{
    extract::{Multipart, Path, Query, State},
    Json,
    http::status,
};
use std::path::Path as StdPath;
use uuid::Uuid;
use crate::utils::extractor::UuidPath;

// List products with search and filtering
pub async fn list_products(
    State(app_state): State<AppState>,
    Query(query): Query<ProductFilter>,
) -> AppResult<Json<PaginatedResponse<Product>>> {
    let pool = app_state.db_pool;
    let products = search_products(&pool, &query).await?;
    
    let current_page = products.current_page;
    let total_items = products.total_items;
    let per_page = products.per_page;
    let total_pages = products.total_pages;
    let item_on_page= products.data.len() as u32;

    let response = PaginatedResponse {
        data: products.data,
        current_page,
        total_items,
        per_page,
        total_pages,
        item_on_page: Some(item_on_page),
    };

    Ok(Json(response))
}

// Get single product by ID
pub async fn get_product(
    State(app_state): State<AppState>,
    UuidPath(id): UuidPath,
) -> AppResult<Json<ProductWithCategory>> {
    let pool = app_state.db_pool;
    let product = find_product_with_category_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::product_not_found())?;

    Ok(Json(product))
}

// Create new product (admin only)
pub async fn create_product(
    State(app_state): State<AppState>,
    Json(product_data): Json<CreateProduct>,
) -> AppResult<Json<ProductWithCategory>> {
    let pool = app_state.db_pool;
    // Validate input
    if product_data.name.trim().is_empty() {
        return Err(AppError::Validation("Product name cannot be empty".to_string()));
    }

    // Validate price
    if let Err(_) = product_data.price.parse::<f64>() {
        return Err(AppError::Validation("Invalid price format".to_string()));
    }

    let price: f64 = product_data.price.parse().unwrap();
    if price < 0.0 {
        return Err(AppError::Validation("Price cannot be negative".to_string()));
    }

    if product_data.stock < 0 {
        return Err(AppError::Validation("Stock cannot be negative".to_string()));
    }

    // Verify category exists
    find_category_by_id(&pool, product_data.category_id)
        .await?
        .ok_or_else(|| AppError::category_not_found())?;

    // Create product
    let product = create_product_db(&pool, product_data).await?;

    // Return product with category name
    let product_with_category = find_product_with_category_by_id(&pool, product.id)
        .await?
        .ok_or_else(|| AppError::product_not_found())?;

    Ok(Json(product_with_category))
}

// Update product request


// Update product (admin only)
pub async fn update_product(
    State(app_state): State<AppState>,
    UuidPath(id): UuidPath,
    Json(update_data): Json<UpdateProduct>,
) -> AppResult<Json<ProductWithCategory>> {
    let pool = app_state.db_pool;
    // Check if product exists
    find_product_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::product_not_found())?;

    // Validate input
    if let Some(ref name) = update_data.name {
        if name.trim().is_empty() {
            return Err(AppError::Validation("Product name cannot be empty".to_string()));
        }
    }

    if let Some(ref price_str) = update_data.price {
        if let Ok(price) = price_str.parse::<f64>() {
            if price < 0.0 {
                return Err(AppError::Validation("Price cannot be negative".to_string()));
            }
        } else {
            return Err(AppError::Validation("Invalid price format".to_string()));
        }
    }

    if let Some(stock) = update_data.stock {
        if stock < 0 {
            return Err(AppError::Validation("Stock cannot be negative".to_string()));
        }
    }

    // Verify category exists if provided
    if let Some(category_id) = update_data.category_id {
        find_category_by_id(&pool, category_id)
            .await?
            .ok_or_else(|| AppError::category_not_found())?;
    }

    // Convert to UpdateProduct
    let updated_product = UpdateProduct {
        name: update_data.name,
        description: update_data.description,
        price: update_data.price,
        category_id: update_data.category_id,
        stock: update_data.stock,
    };

    // Update product
    update_product_db(&pool, id, updated_product).await?;

    // Return updated product with category name
    let product_with_category = find_product_with_category_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::product_not_found())?;

    Ok(Json(product_with_category))
}

// Delete product (admin only)
pub async fn delete_product(
    State(app_state): State<AppState>,
    UuidPath(id): UuidPath,
) -> AppResult<Json<serde_json::Value>> {
    let pool = app_state.db_pool;
    // Check if product exists
    let product = find_product_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::product_not_found())?;

    // Delete image file if exists
    if let Some(image_url) = &product.image_url {
        if let Some(filename) = image_url.strip_prefix("/uploads/") {
            let file_path = format!("uploads/{}", filename);
            if StdPath::new(&file_path).exists() {
                tokio::fs::remove_file(&file_path).await.ok();
            }
        }
    }

    // Delete product from database
    delete_product_db(&pool, id).await?;

    Ok(Json(serde_json::json!({
        "status": status::StatusCode::OK.as_u16(),
        "message": "Product deleted successfully"
    })))
}

// Upload image for product (admin only)
pub async fn upload_image(
    State(app_state): State<AppState>,
    Path(id): Path<Uuid>,
    mut multipart: Multipart,
) -> AppResult<Json<ProductWithCategory>> {
    let pool = app_state.db_pool;
    // Check if product exists
    find_product_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::product_not_found())?;

    // Get the file from multipart
    let mut image_url = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        AppError::FileUpload(format!("Failed to read multipart field: {}", e))
    })? {
        let name = field.name().unwrap_or("").to_string();

        if name == "image" {
            let filename = field
                .file_name()
                .ok_or_else(|| AppError::FileUpload("No filename provided".to_string()))?
                .to_string();

            // Validate file extension
            let extension = StdPath::new(&filename)
                .extension()
                .and_then(|ext| ext.to_str())
                .unwrap_or("")
                .to_lowercase();

            if !["jpg", "jpeg", "png", "webp", "gif"].contains(&extension.as_str()) {
                return Err(AppError::FileUpload(
                    "Invalid file type. Only JPG, PNG, WebP, and GIF are allowed".to_string(),
                ));
            }

            // Get file data
            let data = field.bytes().await.map_err(|e| {
                AppError::FileUpload(format!("Failed to read file data: {}", e))
            })?;

            // Check file size (10MB limit)
            if data.len() > 10 * 1024 * 1024 {
                return Err(AppError::FileUpload("File size too large. Maximum 10MB allowed".to_string()));
            }

            // Generate unique filename
            let unique_filename = format!("{}_{}.{}", id, Uuid::new_v4(), extension);
            let file_path = format!("uploads/{}", unique_filename);

            // Ensure uploads directory exists
            tokio::fs::create_dir_all("uploads").await.map_err(|e| {
                AppError::FileUpload(format!("Failed to create uploads directory: {}", e))
            })?;

            // Write file to disk
            tokio::fs::write(&file_path, &data).await.map_err(|e| {
                AppError::FileUpload(format!("Failed to save file: {}", e))
            })?;

            image_url = Some(format!("/uploads/{}", unique_filename));
            break;
        }
    }

    let image_url = image_url.ok_or_else(|| {
        AppError::FileUpload("No image file found in request".to_string())
    })?;

    // Update product with new image URL
    update_product_image(&pool, id, image_url).await?;

    // Return updated product with category name
    let product_with_category = find_product_with_category_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::product_not_found())?;

    Ok(Json(product_with_category))
}