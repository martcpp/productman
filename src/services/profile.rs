use crate::middleware::auth::AuthUser;
use crate::db::userq::*;
use crate::models::user::*;
use crate::utils::error::{AppError, AppResult};
use axum::{extract::State, Json};
use crate::AppState;
use validator::Validate;
// Get current user profile
pub async fn get_profile(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> AppResult<Json<User>> {
    let pool = state.db_pool;
    let user = find_by_id(&pool, auth_user.user_id)
        .await?
        .ok_or_else(|| AppError::user_not_found())?;

    Ok(Json(user))
}

// Update user profile


pub async fn update_profile(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(update_data): Json<UpdateUserRequest>,
) -> AppResult<Json<User>> {
    let pool = state.db_pool;

    if let Err(e) = update_data.validate() {
        return Err(AppError::Validation(e.to_string()));
    }
    // Validate input
    if let Some(ref username) = update_data.username {
        if username.trim().is_empty() {
            return Err(AppError::Validation("Username cannot be empty".to_string()));
        }
    }

    if let Some(ref email) = update_data.email {
        if email.trim().is_empty() {
            return Err(AppError::Validation("Email cannot be empty".to_string()));
        }
        
        // Check if email is already taken by another user
        if let Some(existing_user) = find_by_email(&pool, &email).await.map_err(AppError::from)? {
            if existing_user.id != auth_user.user_id {
                return Err(AppError::insufficient_permissions());
            }
            if existing_user.username == *update_data.username.as_ref().unwrap() {
                return Err(AppError::username_already_exists());
            }
            return Err(AppError::email_already_exists());
        }
    }

    let updated_user = update_user(&pool, auth_user.user_id, update_data.username, update_data.email).await?;

    Ok(Json(updated_user))
}