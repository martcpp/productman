use crate::db::{authq::*, userq::*};
use crate::models::{auth::*, user::*};
use crate::utils::error::{AppError, AppResult};
use crate::utils::auth::{hash_password, verify_password};
use crate::utils::jwt::{create_access_token, generate_refresh_token, get_access_token_duration, get_refresh_token_duration};
use axum::http::status;
use axum::{extract::State, Json};
use crate::AppState;
use validator::Validate;
//use uuid::Uuid;

// Register new user
pub async fn register(
    State(state): State<AppState>,
    Json(user_data): Json<CreateUser>,
) -> AppResult<Json<AuthResponse>> {
    // Validate input
    let pool = state.db_pool;
    let keys = state.jwt_keys;
    if user_data.username.trim().is_empty() {
        return Err(AppError::Validation("Username cannot be empty".to_string()));
    }
    if user_data.email.trim().is_empty() {
        return Err(AppError::Validation("Email cannot be empty".to_string()));
    }
    if user_data.password.len() < 6 {
        return Err(AppError::Validation("Password must be at least 6 characters".to_string()));
    }
   if let Err(e) = user_data.validate() {
       return Err(AppError::Validation(e.to_string()));
   }
    // Check if email already exists
    if let Ok(Some(user)) = find_by_email(&pool, &user_data.email).await.map_err(AppError::from) {
        if user.username == user_data.username {
            return Err(AppError::username_already_exists());
        }
        return Err(AppError::email_already_exists());
    }

    // Hash password
    let password_hash = hash_password(&user_data.password)?;

    // Create user
    let user = create_user(&pool, user_data, password_hash).await?;

    // Generate tokens
    let access_token = create_access_token(user.id, &user.username, user.role.clone(), &keys)?;
    let refresh_token = generate_refresh_token();

    // Store refresh token in database
    create_refresh_token(&pool, user.id, &refresh_token, get_refresh_token_duration()).await?;

    let response = AuthResponse {
        access_token,
        refresh_token,
        token_type: "Bearer".to_string(),
        expires_in: get_access_token_duration(),
        user: user.into(),
    };

    Ok(Json(response))
}

// Login user
pub async fn login(
    State(state): State<AppState>,
    Json(login_data): Json<LoginRequest>,
) -> AppResult<Json<AuthResponse>> {
    let pool = state.db_pool;
    let keys = state.jwt_keys;

    if let Err(e) = login_data.validate() {
        return Err(AppError::Validation(e.to_string()));
    }
    // Find user by email
    let user = find_by_email(&pool, &login_data.email)
        .await?
        .ok_or_else(|| AppError::invalid_credentials())?;

    // Verify password
    if !verify_password(&login_data.password, &user.password_hash)? {
        return Err(AppError::invalid_credentials());
    }

    // Generate tokens
    let access_token = create_access_token(user.id, &user.username, user.role.clone(), &keys)?;
    let refresh_token = generate_refresh_token();

    // Store refresh token in database (remove old ones first)
    delete_user_refresh_tokens(&pool, user.id).await?;
    create_refresh_token(&pool, user.id, &refresh_token, get_refresh_token_duration()).await?;

    let response = AuthResponse {
        access_token,
        refresh_token,
        token_type: "Bearer".to_string(),
        expires_in: get_access_token_duration(),
        user: user.into(),
    };

    Ok(Json(response))
}

// Refresh access token
pub async fn refresh_token(
    State(state): State<AppState>,
    Json(refresh_data): Json<RefreshTokenRequest>,
) -> AppResult<Json<AuthResponse>> {
    let pool = state.db_pool;
    let keys = state.jwt_keys;

    // Find and validate refresh token
    let refresh_token = find_refresh_token(&pool, &refresh_data.refresh_token)
        .await?
        .ok_or_else(|| AppError::Authentication("Invalid refresh token".to_string()))?;

    // Get user
    let user = find_by_id(&pool, refresh_token.user_id)
        .await?
        .ok_or_else(|| AppError::user_not_found())?;

    // Generate new tokens
    let access_token = create_access_token(user.id, &user.username, user.role.clone(), &keys)?;
    let new_refresh_token = generate_refresh_token();

    // Replace old refresh token with new one
    delete_refresh_token(&pool, &refresh_data.refresh_token).await?;
    create_refresh_token(&pool, user.id, &new_refresh_token, get_refresh_token_duration()).await?;

    let response = AuthResponse {
        access_token,
        refresh_token: new_refresh_token,
        token_type: "Bearer".to_string(),
        expires_in: get_access_token_duration(),
        user: user.into(),
    };

    Ok(Json(response))
}

// Logout user
pub async fn logout(
    State(state): State<AppState>,
    Json(refresh_data): Json<RefreshTokenRequest>,
) -> AppResult<Json<serde_json::Value>> {
    // Delete the refresh token
    let pool = state.db_pool;
    delete_refresh_token(&pool, &refresh_data.refresh_token).await?;
    let body = serde_json::json!({
        "status": status::StatusCode::OK.as_u16(),
        "message": "Logged out successfully"
    });

    Ok(Json(body))
}
