use crate::db::categoryq::*;
use crate::models::category::*;
use crate::utils::error::{AppError, AppResult};
use axum::{
    extract::State,
    Json,
    http::status::StatusCode,
    response::{IntoResponse,Response}
};
use crate::AppState;
use crate::utils::extractor::UuidPath;
// Get all categories
pub async fn list_categories(State(state): State<AppState>) -> AppResult<Json<Vec<Category>>> {
    let pool = state.db_pool;
    let categories = find_all_categories(&pool).await?;
    // Return empty array instead of error when no categories found
    Ok(Json(categories))
}

// // Get category by ID
pub async fn get_category(
    State(state): State<AppState>,
    UuidPath(id): UuidPath,
) -> AppResult<Json<Category>> {
    let pool = state.db_pool;
    let category = find_category_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::category_not_found())?;

    Ok(Json(category))
}


// Create new category (admin only)
pub async fn create_category(
    State(state): State<AppState>,
    Json(category_data): Json<CreateCategory>,
) -> AppResult<impl IntoResponse> {
    let pool = state.db_pool;
    if category_data.name.trim().is_empty() {
        return Err(AppError::Validation("Category name cannot be empty".to_string()));
    }

    // Check for duplicate category name
    let existing_categories = find_all_categories(&pool).await?;
    if existing_categories.iter().any(|c| c.name.to_lowercase() == category_data.name.to_lowercase()) {
        return Err(AppError::category_name_exists());
    }
    let category = create_category_db(&pool, category_data).await?;
    let response: Response = (StatusCode::CREATED, Json(category)).into_response();
    Ok(response)
}


// Update category (admin only)
pub async fn update_category(
    State(state): State<AppState>,
    UuidPath(id): UuidPath,
    Json(update_data): Json<UpdateCategory>,
) -> AppResult<Json<Category>> {
    let pool = state.db_pool;
    // Check if category exists
    find_category_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::category_not_found())?;

    // Validate input
    if let Some(ref name) = update_data.name {
        if name.trim().is_empty() {
            return Err(AppError::Validation("Category name cannot be empty".to_string()));
        }

        // Check for duplicate name (excluding current category)
        let existing_categories = find_all_categories(&pool).await?;
        if existing_categories.iter().any(|c| c.id != id && c.name.to_lowercase() == name.to_lowercase()) {
            return Err(AppError::category_name_exists());
        }
    }

    let category = update_category_db(&pool, id, update_data).await?;
    Ok(Json(category))
}

// Delete category (admin only)
pub async fn delete_category(
    State(state): State<AppState>,
    UuidPath(id): UuidPath,
) -> AppResult<Json<serde_json::Value>> {
    let pool = state.db_pool;
    // Check if category exists
    find_category_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::category_not_found())?;

    // Check if category has products
    let product_count = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM products WHERE category_id = $1",
        id
    )
    .fetch_one(&pool)
    .await?;

    if product_count.unwrap_or(0) > 0 {
        return Err(AppError::BadRequest(
            "Cannot delete category with existing products".to_string(),
        ));
    }

    delete_category_db(&pool, id).await?;

    Ok(Json(serde_json::json!({
        "status": StatusCode::OK.as_u16(),
        "message": "Category deleted successfully"
    })))
}
