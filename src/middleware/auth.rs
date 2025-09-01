use crate::models::user::UserRole;
use crate::utils::jwt::{extract_token_from_header, verify_access_token};
use crate::utils::error::{AppError, AppResult};
use crate::AppState;
use axum::{
    extract::{Request, State},
    http::{header::AUTHORIZATION, HeaderMap},
    middleware::Next,
    response::Response,
};


// Authentication state that gets injected into handlers
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: uuid::Uuid,
    pub username: String,
    pub role: UserRole,
}


// Middleware for required authentication (fails if no valid token)
pub async fn auth_required(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> AppResult<Response> {
    let keys = state.jwt_keys;
    let auth_header = headers
        .get(AUTHORIZATION)
        .ok_or_else(|| AppError::Authentication("Missing authorization header".to_string()))?;

    let auth_str = auth_header
        .to_str()
        .map_err(|_| AppError::Authentication("Invalid authorization header".to_string()))?;

    let token = extract_token_from_header(auth_str)
        .ok_or_else(|| AppError::Authentication("Invalid authorization format".to_string()))?;

    let claims = verify_access_token(token, &keys)?;

    let user_id = uuid::Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Authentication("Invalid user ID in token".to_string()))?;

    let auth_user = AuthUser {
        user_id,
        username: claims.username,
        role: claims.role,
    };

    request.extensions_mut().insert(auth_user);
    Ok(next.run(request).await)
}

// Middleware for admin-only access
pub async fn admin_required(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> AppResult<Response> {
    let keys = state.jwt_keys;
    let auth_header = headers
        .get(AUTHORIZATION)
        .ok_or_else(|| AppError::Authentication("Missing authorization header".to_string()))?;

    let auth_str = auth_header
        .to_str()
        .map_err(|_| AppError::Authentication("Invalid authorization header".to_string()))?;

    let token = extract_token_from_header(auth_str)
        .ok_or_else(|| AppError::Authentication("Invalid authorization format".to_string()))?;

    let claims = verify_access_token(token, &keys)?;

    // Check if user is admin
    match claims.role {
        UserRole::Admin => {
            let user_id = uuid::Uuid::parse_str(&claims.sub)
                .map_err(|_| AppError::Authentication("Invalid user ID in token".to_string()))?;

            let auth_user = AuthUser {
                user_id,
                username: claims.username,
                role: claims.role,
            };

            request.extensions_mut().insert(auth_user);
            Ok(next.run(request).await)
        }
        UserRole::User => Err(AppError::insufficient_permissions()),
    }
}

// Extension trait for easy access to authenticated user
pub trait RequestExt {
    fn auth_user(&self) -> Option<&AuthUser>;
    fn require_auth_user(&self) -> AppResult<&AuthUser>;
}

impl RequestExt for Request {
    fn auth_user(&self) -> Option<&AuthUser> {
        self.extensions().get::<AuthUser>()
    }

    fn require_auth_user(&self) -> AppResult<&AuthUser> {
        self.auth_user()
            .ok_or_else(|| AppError::Authentication("Authentication required".to_string()))
    }
}