use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};

use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Authentication error: {0}")]
    Authentication(String),

    #[error("Authorization error: {0}")]
    Authorization(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    Internal(#[from] anyhow::Error),

    #[error("File upload error: {0}")]
    FileUpload(String),

    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message, error_code) = match self {
            AppError::Database(ref e) => {
                tracing::error!("Database error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                    "DATABASE_ERROR",
                )
            }
            AppError::Authentication(ref message) => {
                (StatusCode::UNAUTHORIZED, message.clone(), "AUTHENTICATION_ERROR")
            }
            AppError::Authorization(ref message) => {
                (StatusCode::FORBIDDEN, message.clone(), "AUTHORIZATION_ERROR")
            }
            AppError::Validation(ref message) => {
                (StatusCode::BAD_REQUEST, message.clone(), "VALIDATION_ERROR")
            }
            AppError::NotFound(ref message) => {
                (StatusCode::NOT_FOUND, message.clone(), "NOT_FOUND")
            }
            AppError::Conflict(ref message) => {
                (StatusCode::CONFLICT, message.clone(), "CONFLICT")
            }
            AppError::BadRequest(ref message) => {
                (StatusCode::BAD_REQUEST, message.clone(), "BAD_REQUEST")
            }
            AppError::Internal(ref e) => {
                tracing::error!("Internal error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                    "INTERNAL_ERROR",
                )
            }
            AppError::FileUpload(ref message) => {
                (StatusCode::BAD_REQUEST, message.clone(), "FILE_UPLOAD_ERROR")
            }
            AppError::Jwt(ref e) => {
                tracing::error!("JWT error: {:?}", e);
                (
                    StatusCode::UNAUTHORIZED,
                    "Invalid or expired token".to_string(),
                    "JWT_ERROR",
                )
            }
        };

        let body = Json(json!({
            "error": {
                "code": error_code,
                "message": error_message,
            }
        }));

        (status, body).into_response()
    }
}

// Helper type for Result
pub type AppResult<T> = Result<T, AppError>;

// Helper functions for common errors
impl AppError {
    pub fn user_not_found() -> Self {
        AppError::NotFound("User not found".to_string())
    }

    pub fn product_not_found() -> Self {
        AppError::NotFound("Product not found".to_string())
    }

    pub fn category_not_found() -> Self {
        AppError::NotFound("Category not found".to_string())
    }

    pub fn invalid_credentials() -> Self {
        AppError::Authentication("Invalid email or password".to_string())
    }

    pub fn invalid_token() -> Self {
        AppError::Authentication("Invalid or expired token".to_string())
    }

    pub fn insufficient_permissions() -> Self {
        AppError::Authorization("Insufficient permissions".to_string())
    }

    pub fn email_already_exists() -> Self {
        AppError::Conflict("Email already exists".to_string())
    }

    pub fn username_already_exists() -> Self {
        AppError::Conflict("Username already exists".to_string())
    }

    pub fn category_name_exists() -> Self {
        AppError::Conflict("Category name already exists".to_string())
    }
}