use axum::{
    async_trait,
    extract::{FromRequestParts, Path},
    http::request::Parts,
};
use crate::utils::error::AppError;
use crate::middleware::auth::AuthUser;
use uuid::Uuid;


/// Extractor for UUID path parameters
#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<AuthUser>()
            .cloned()
            .ok_or_else(|| AppError::Authentication("Authentication required".into()))
    }
}

/// Extractor for UUID path parameters
pub struct UuidPath(pub Uuid);

#[async_trait]
impl<S> FromRequestParts<S> for UuidPath
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        
        // Extract the raw path parameter as a string first
        let Path(uuid_str): Path<String> = Path::from_request_parts(parts, state)
            .await
            .map_err(|_| {
                AppError::BadRequest("Invalid path".to_string())
            })?;

        tracing::debug!("Extracted UUID string: '{}'", uuid_str);

        // Try to parse the UUID
        let uuid = Uuid::parse_str(&uuid_str).map_err(|_| {
            AppError::BadRequest("Invalid UUID format".to_string())
        })?;

        tracing::debug!("Successfully parsed UUID: {}", uuid);
        Ok(UuidPath(uuid))
    }
}